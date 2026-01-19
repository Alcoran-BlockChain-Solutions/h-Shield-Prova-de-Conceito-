// HarvestShield Oracle - Edge Function v0.14
// Receives sensor data, validates PoW + ECDSA signature, stores in DB, and records hash on Stellar
// RF11: Async mode - Returns 202 immediately, processes Stellar in background

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CONFIGURATION
// ============================================================================

// PoW difficulty: 3 = hash must start with "000" (~4096 attempts avg on IoT)
const POW_DIFFICULTY = 3;
const POW_PREFIX = "0".repeat(POW_DIFFICULTY);

// Anti-replay: enabled by default for security
const ANTI_REPLAY_ENABLED = true;
const ANTI_REPLAY_MAX_AGE_SECONDS = 300; // 5 minutes

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function debug(reqId: string, step: string, message: string, data?: unknown) {
  const prefix = `[${reqId}-${step}]`;
  if (data !== undefined) {
    console.debug(prefix, message, JSON.stringify(data));
  } else {
    console.debug(prefix, message);
  }
}

function error(reqId: string, step: string, message: string, data?: unknown) {
  const prefix = `[${reqId}-${step}]`;
  if (data !== undefined) {
    console.error(prefix, message, JSON.stringify(data));
  } else {
    console.error(prefix, message);
  }
}

function log(step: string, timeMs?: number) {
  const timeStr = timeMs !== undefined ? ` (${timeMs}ms)` : "";
  console.log(`[API] ${step}${timeStr}`);
}

// ============================================================================
// TYPES
// ============================================================================

interface RawReading {
  device_id: string;
  temperature?: number;
  humidity_air?: number;
  humidity_soil?: number;
  luminosity?: number;
  timestamp?: number;
}

interface NormalizedReading {
  device_id: string;
  temperature: number | null;
  humidity_air: number | null;
  humidity_soil: number | null;
  luminosity: number | null;
  timestamp: number;
  hash: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: RawReading;
}

interface AuthHeaders {
  deviceId: string | null;
  signature: string | null;
  timestamp: string | null;
  powData: string | null;
  powNonce: string | null;
  powHash: string | null;
}

// ============================================================================
// PROOF OF WORK VERIFICATION
// ============================================================================

async function verifyProofOfWork(
  reqId: string,
  auth: AuthHeaders
): Promise<{ valid: boolean; hash: string; error?: string }> {
  debug(reqId, "POW", "Starting PoW verification");
  debug(reqId, "POW", "Headers received", {
    powData: auth.powData?.substring(0, 30) + "...",
    powNonce: auth.powNonce,
    powHash: auth.powHash?.substring(0, 16) + "..."
  });

  if (!auth.powData || !auth.powNonce || !auth.powHash) {
    error(reqId, "POW", "Missing PoW headers");
    return { valid: false, hash: "", error: "Missing PoW headers (X-PoW-Data, X-PoW-Nonce, X-PoW-Hash)" };
  }

  const encoder = new TextEncoder();
  const input = auth.powData + auth.powNonce;
  debug(reqId, "POW", `Computing SHA256 of input (${input.length} chars)`);

  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const computedHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  debug(reqId, "POW", `Computed hash: ${computedHash.substring(0, 16)}...`);
  debug(reqId, "POW", `Provided hash: ${auth.powHash.substring(0, 16)}...`);

  if (computedHash !== auth.powHash) {
    error(reqId, "POW", "Hash mismatch!");
    return {
      valid: false,
      hash: computedHash,
      error: `PoW hash mismatch: computed ${computedHash.substring(0, 16)}... != provided ${auth.powHash.substring(0, 16)}...`
    };
  }

  if (!computedHash.startsWith(POW_PREFIX)) {
    debug(reqId, "POW", `Hash does not start with ${POW_PREFIX}`);
    return {
      valid: false,
      hash: computedHash,
      error: `PoW invalid: hash does not start with '${POW_PREFIX}' (difficulty ${POW_DIFFICULTY})`
    };
  }

  debug(reqId, "POW", "PoW verification SUCCESS");
  return { valid: true, hash: computedHash };
}

// ============================================================================
// DEVICE AUTHENTICATION
// ============================================================================

function extractAuthHeaders(req: Request): AuthHeaders {
  return {
    deviceId: req.headers.get("x-device-id"),
    signature: req.headers.get("x-signature"),
    timestamp: req.headers.get("x-timestamp"),
    powData: req.headers.get("x-pow-data"),
    powNonce: req.headers.get("x-pow-nonce"),
    powHash: req.headers.get("x-pow-hash"),
  };
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function derToP1363(derSignature: Uint8Array): Uint8Array {
  let offset = 0;

  if (derSignature[offset++] !== 0x30) {
    throw new Error("Invalid DER signature: missing SEQUENCE tag");
  }

  let totalLen = derSignature[offset++];
  if (totalLen & 0x80) {
    offset += (totalLen & 0x7f);
  }

  if (derSignature[offset++] !== 0x02) {
    throw new Error("Invalid DER signature: missing INTEGER tag for R");
  }
  let rLen = derSignature[offset++];
  let rStart = offset;
  offset += rLen;

  if (derSignature[offset++] !== 0x02) {
    throw new Error("Invalid DER signature: missing INTEGER tag for S");
  }
  let sLen = derSignature[offset++];
  let sStart = offset;

  const r = extractInteger(derSignature, rStart, rLen, 32);
  const s = extractInteger(derSignature, sStart, sLen, 32);

  const p1363 = new Uint8Array(64);
  p1363.set(r, 0);
  p1363.set(s, 32);

  return p1363;
}

function extractInteger(data: Uint8Array, start: number, len: number, targetLen: number): Uint8Array {
  const result = new Uint8Array(targetLen);

  let srcOffset = start;
  let srcLen = len;
  while (srcLen > targetLen && data[srcOffset] === 0) {
    srcOffset++;
    srcLen--;
  }

  const destOffset = targetLen - srcLen;
  result.set(data.slice(srcOffset, srcOffset + srcLen), destOffset > 0 ? destOffset : 0);

  return result;
}

async function verifyDeviceSignature(
  reqId: string,
  supabase: ReturnType<typeof createClient>,
  auth: AuthHeaders
): Promise<{ valid: boolean; error?: string }> {
  debug(reqId, "AUTH", "Starting device authentication");
  debug(reqId, "AUTH", `Device ID: ${auth.deviceId}`);

  if (!auth.deviceId || !auth.signature || !auth.powHash) {
    error(reqId, "AUTH", "Missing required headers");
    return { valid: false, error: "Missing authentication headers (X-Device-ID, X-Signature, X-PoW-Hash)" };
  }

  // Anti-replay check
  if (ANTI_REPLAY_ENABLED) {
    debug(reqId, "AUTH", "Checking anti-replay");
    if (!auth.timestamp) {
      error(reqId, "AUTH", "Missing timestamp");
      return { valid: false, error: "X-Timestamp required for anti-replay protection" };
    }

    const maxAge = parseInt(Deno.env.get("ANTI_REPLAY_MAX_AGE_SECONDS") || String(ANTI_REPLAY_MAX_AGE_SECONDS));
    const now = Math.floor(Date.now() / 1000);
    const msgTime = parseInt(auth.timestamp);

    if (isNaN(msgTime)) {
      error(reqId, "AUTH", "Invalid timestamp format");
      return { valid: false, error: "Invalid timestamp format" };
    }

    const age = Math.abs(now - msgTime);
    debug(reqId, "AUTH", `Timestamp age: ${age}s (max: ${maxAge}s)`);

    if (age > maxAge) {
      error(reqId, "AUTH", "Timestamp expired");
      return { valid: false, error: `Timestamp expired (age: ${age}s, max: ${maxAge}s)` };
    }
  }

  // Get device from database
  debug(reqId, "AUTH", "Fetching device from database");
  const { data: device, error: dbError } = await supabase
    .from("devices")
    .select("public_key, active, total_readings")
    .eq("device_id", auth.deviceId)
    .single();

  if (dbError || !device) {
    error(reqId, "AUTH", "Device not found", { error: dbError?.message });
    return { valid: false, error: "Unknown device" };
  }

  debug(reqId, "AUTH", `Device found, active: ${device.active}, readings: ${device.total_readings}`);

  if (!device.active) {
    error(reqId, "AUTH", "Device is deactivated");
    return { valid: false, error: "Device deactivated" };
  }

  // Verify ECDSA signature
  try {
    debug(reqId, "AUTH", "Decoding signature from base64");
    const derSignature = Uint8Array.from(atob(auth.signature), c => c.charCodeAt(0));
    debug(reqId, "AUTH", `DER signature length: ${derSignature.length} bytes`);

    debug(reqId, "AUTH", "Converting DER to P1363 format");
    const signatureBytes = derToP1363(derSignature);
    debug(reqId, "AUTH", `P1363 signature length: ${signatureBytes.length} bytes`);

    debug(reqId, "AUTH", "Importing public key");
    const publicKey = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(device.public_key),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    debug(reqId, "AUTH", "Public key imported successfully");

    // Verify signature
    const encoder = new TextEncoder();
    const powHashBytes = encoder.encode(auth.powHash);
    debug(reqId, "AUTH", `Verifying signature over ${powHashBytes.length} bytes (hex string)`);

    const isValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signatureBytes,
      powHashBytes
    );

    debug(reqId, "AUTH", `Signature valid: ${isValid}`);

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    // Update device stats
    debug(reqId, "AUTH", "Updating device last_seen");
    await supabase
      .from("devices")
      .update({
        last_seen_at: new Date().toISOString(),
        total_readings: (device.total_readings || 0) + 1
      })
      .eq("device_id", auth.deviceId);

    debug(reqId, "AUTH", "Authentication SUCCESS");
    return { valid: true };

  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "unknown error";
    error(reqId, "AUTH", `Signature verification failed: ${errMsg}`);
    return { valid: false, error: "Signature verification failed: " + errMsg };
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

const VALIDATION_RULES = {
  temperature: { min: -40, max: 60 },
  humidity_air: { min: 0, max: 100 },
  humidity_soil: { min: 0, max: 100 },
  luminosity: { min: 0, max: 120000 },
};

function validate(reqId: string, data: unknown): ValidationResult {
  debug(reqId, "VALIDATE", "Starting validation");
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    error(reqId, "VALIDATE", "Invalid payload type");
    return { valid: false, errors: ["Invalid payload: expected JSON object"] };
  }

  const reading = data as Record<string, unknown>;
  debug(reqId, "VALIDATE", "Payload received", reading);

  if (!reading.device_id || typeof reading.device_id !== "string") {
    errors.push("device_id is required and must be a string");
  }

  const metrics = ["temperature", "humidity_air", "humidity_soil", "luminosity"];
  const hasMetric = metrics.some((m) => reading[m] !== undefined && reading[m] !== null);

  if (!hasMetric) {
    errors.push("At least one metric (temperature, humidity_air, humidity_soil, luminosity) is required");
  }

  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    const value = reading[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== "number") {
        errors.push(`${field} must be a number`);
      } else if (value < rules.min || value > rules.max) {
        errors.push(`${field} must be between ${rules.min} and ${rules.max}`);
      }
    }
  }

  debug(reqId, "VALIDATE", `Validation complete, errors: ${errors.length}`, errors);

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (reading as unknown as RawReading) : undefined,
  };
}

// ============================================================================
// NORMALIZATION & HASHING
// ============================================================================

async function generateHash(data: object): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(dataString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function normalize(reqId: string, raw: RawReading): Promise<NormalizedReading> {
  debug(reqId, "NORMALIZE", "Normalizing reading data");

  const timestamp = raw.timestamp || Date.now();

  const normalized = {
    device_id: raw.device_id.trim().toLowerCase(),
    temperature: raw.temperature !== undefined ? parseFloat(raw.temperature.toFixed(2)) : null,
    humidity_air: raw.humidity_air !== undefined ? parseFloat(raw.humidity_air.toFixed(2)) : null,
    humidity_soil: raw.humidity_soil !== undefined ? parseFloat(raw.humidity_soil.toFixed(2)) : null,
    luminosity: raw.luminosity !== undefined ? Math.round(raw.luminosity) : null,
    timestamp,
  };

  const hash = await generateHash(normalized);
  debug(reqId, "NORMALIZE", `Normalized hash: ${hash.substring(0, 16)}...`);

  return { ...normalized, hash };
}

// ============================================================================
// STELLAR INTEGRATION
// ============================================================================

async function recordOnStellar(
  reqId: string,
  powHash: string,
  timestamp: number,
  powNonce: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  debug(reqId, "STELLAR", "Starting blockchain recording");
  debug(reqId, "STELLAR", `PoW Hash: ${powHash.substring(0, 16)}...`);
  debug(reqId, "STELLAR", `Timestamp: ${timestamp}, Nonce: ${powNonce}`);

  const stellarSecretKey = Deno.env.get("STELLAR_SECRET_KEY");
  const stellarNetwork = Deno.env.get("STELLAR_NETWORK") || "testnet";

  debug(reqId, "STELLAR", `Network: ${stellarNetwork}`);
  debug(reqId, "STELLAR", `Secret Key configured: ${stellarSecretKey ? "YES" : "NO"}`);

  if (!stellarSecretKey) {
    error(reqId, "STELLAR", "STELLAR_SECRET_KEY not configured");
    return { success: false, error: "STELLAR_SECRET_KEY not configured" };
  }

  const isMainnet = stellarNetwork.toLowerCase() === "mainnet";
  const horizonUrl = isMainnet
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

  debug(reqId, "STELLAR", `Horizon URL: ${horizonUrl}`);

  try {
    debug(reqId, "STELLAR", "Loading Stellar SDK...");
    const StellarModule = await import("https://esm.sh/@stellar/stellar-sdk@11.2.2?bundle&target=browser");
    const Stellar = StellarModule.default || StellarModule;

    const Keypair = Stellar.Keypair || StellarModule.Keypair;
    const TransactionBuilder = Stellar.TransactionBuilder || StellarModule.TransactionBuilder;
    const Operation = Stellar.Operation || StellarModule.Operation;
    const Networks = Stellar.Networks || StellarModule.Networks;
    const HorizonServer = StellarModule.Horizon?.Server || Stellar.Horizon?.Server || Stellar.Server;

    if (!HorizonServer || !Keypair) {
      error(reqId, "STELLAR", "Stellar classes not found in SDK");
      return { success: false, error: "Stellar classes not found in SDK" };
    }

    debug(reqId, "STELLAR", "SDK loaded successfully");

    const networkPassphrase = isMainnet ? Networks.PUBLIC : Networks.TESTNET;
    const server = new HorizonServer(horizonUrl);

    debug(reqId, "STELLAR", "Creating keypair from secret...");
    const sourceKeypair = Keypair.fromSecret(stellarSecretKey);
    debug(reqId, "STELLAR", `Public key: ${sourceKeypair.publicKey()}`);

    debug(reqId, "STELLAR", "Loading account...");
    const account = await server.loadAccount(sourceKeypair.publicKey());
    debug(reqId, "STELLAR", `Account loaded, sequence: ${account.sequence}`);

    const dataKey = `r_${timestamp}`;
    debug(reqId, "STELLAR", `Data key: ${dataKey}`);
    debug(reqId, "STELLAR", `Data value: ${powHash}`);

    debug(reqId, "STELLAR", "Building transaction...");
    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase,
      memo: `PoW Nonce: ${powNonce}`,
    })
      .addOperation(
        Operation.manageData({
          name: dataKey,
          value: powHash,
        })
      )
      .setTimeout(30)
      .build();

    debug(reqId, "STELLAR", "Signing transaction...");
    transaction.sign(sourceKeypair);

    debug(reqId, "STELLAR", "Submitting transaction...");
    const result = await server.submitTransaction(transaction);

    debug(reqId, "STELLAR", `SUCCESS! TX Hash: ${result.hash}`);
    return { success: true, txHash: result.hash };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Stellar error";
    error(reqId, "STELLAR", errorMessage);

    if (error && typeof error === 'object') {
      const stellarError = error as { response?: { data?: { extras?: { result_codes?: unknown } } } };
      if (stellarError.response?.data?.extras?.result_codes) {
        error(reqId, "STELLAR", "Result codes", stellarError.response.data.extras.result_codes);
      }
    }

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// DATABASE
// ============================================================================

async function saveToDatabase(
  reqId: string,
  supabase: ReturnType<typeof createClient>,
  normalized: NormalizedReading,
  rawData: RawReading,
  powHash: string
): Promise<string> {
  debug(reqId, "DB", "Saving reading to database");
  debug(reqId, "DB", `Device: ${normalized.device_id}`);

  const { data, error } = await supabase
    .from("readings")
    .insert({
      device_id: normalized.device_id,
      temperature: normalized.temperature,
      humidity_air: normalized.humidity_air,
      humidity_soil: normalized.humidity_soil,
      luminosity: normalized.luminosity,
      raw_data: rawData,
      normalized_hash: powHash,
      normalized_at: new Date(normalized.timestamp).toISOString(),
      blockchain_tx_hash: null,
      blockchain_status: "pending",
      blockchain_error: null,
    })
    .select("id")
    .single();

  if (error) {
    error(reqId, "DB", error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  debug(reqId, "DB", `Reading saved with ID: ${data.id}`);
  return data.id;
}

async function updateBlockchainResult(
  reqId: string,
  supabase: ReturnType<typeof createClient>,
  readingId: string,
  stellarResult: { success: boolean; txHash?: string; error?: string }
): Promise<void> {
  debug(reqId, "DB", `Updating blockchain result for reading: ${readingId}`);
  debug(reqId, "DB", `Status: ${stellarResult.success ? "confirmed" : "failed"}`);

  await supabase
    .from("readings")
    .update({
      blockchain_tx_hash: stellarResult.txHash || null,
      blockchain_status: stellarResult.success ? "confirmed" : "failed",
      blockchain_error: stellarResult.error || null,
    })
    .eq("id", readingId);

  debug(reqId, "DB", "Blockchain result updated");
}

// ============================================================================
// STELLAR BACKGROUND TASK (RF11)
// ============================================================================

async function processStellarInBackground(
  reqId: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  readingId: string,
  powHash: string,
  timestamp: number,
  powNonce: string
): Promise<void> {
  debug(reqId, "BACKGROUND", "Starting background Stellar processing");
  const startTime = Date.now();

  try {
    const stellarResult = await recordOnStellar(reqId, powHash, timestamp, powNonce);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await updateBlockchainResult(reqId, supabase, readingId, stellarResult);

    const time = Date.now() - startTime;
    const status = stellarResult.success ? "OK" : "FAIL";
    debug(reqId, "BACKGROUND", `Stellar ${status} in ${time}ms`);

    if (stellarResult.success) {
      debug(reqId, "BACKGROUND", `TX: ${stellarResult.txHash}`);
    } else {
      debug(reqId, "BACKGROUND", `Error: ${stellarResult.error}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown background error";
    error(reqId, "BACKGROUND", errorMessage);

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await updateBlockchainResult(reqId, supabase, readingId, {
        success: false,
        error: errorMessage,
      });
    } catch (dbError) {
      const dbErrorMsg = dbError instanceof Error ? dbError.message : "Unknown DB error";
      error(reqId, "BACKGROUND", `DB update failed: ${dbErrorMsg}`);
    }
  }

  debug(reqId, "BACKGROUND", "Background processing complete");
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const reqId = generateRequestId();
  const requestStart = Date.now();

  debug(reqId, "START", "New request received");
  debug(reqId, "START", `Method: ${req.method}, URL: ${req.url}`);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-signature, x-timestamp, x-pow-data, x-pow-nonce, x-pow-hash",
  };

  if (req.method === "OPTIONS") {
    debug(reqId, "CORS", "Preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    error(reqId, "ERROR", `Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Parse
    debug(reqId, "PARSE", "Parsing request body");
    let t = Date.now();
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const tParse = Date.now() - t;
    debug(reqId, "PARSE", `Parsed in ${tParse}ms`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Verify Proof of Work
    t = Date.now();
    const auth = extractAuthHeaders(req);
    debug(reqId, "HEADERS", "Auth headers extracted", {
      deviceId: auth.deviceId,
      hasSignature: !!auth.signature,
      hasTimestamp: !!auth.timestamp
    });

    const powResult = await verifyProofOfWork(reqId, auth);
    const tPoW = Date.now() - t;
    log(`[${reqId}] 2. PoW ${powResult.valid ? "OK" : "FAIL"}`, tPoW);

    if (!powResult.valid) {
      debug(reqId, "RESPONSE", `Returning 400: ${powResult.error}`);
      return new Response(
        JSON.stringify({ success: false, error: powResult.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verify Device Signature
    t = Date.now();
    const authResult = await verifyDeviceSignature(reqId, supabase, auth);
    const tAuth = Date.now() - t;
    log(`[${reqId}] 3. Auth ${authResult.valid ? "OK" : "FAIL"}`, tAuth);

    if (!authResult.valid) {
      debug(reqId, "RESPONSE", `Returning 401: ${authResult.error}`);
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validate
    t = Date.now();
    const validation = validate(reqId, body);
    const tValidate = Date.now() - t;
    log(`[${reqId}] 4. Validate ${validation.valid ? "OK" : "FAIL"}`, tValidate);

    if (!validation.valid) {
      debug(reqId, "RESPONSE", `Returning 400: ${validation.errors.join(", ")}`);
      return new Response(
        JSON.stringify({ success: false, errors: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Save DB
    t = Date.now();
    const normalized = await normalize(reqId, validation.data!);
    const readingId = await saveToDatabase(reqId, supabase, normalized, validation.data!, auth.powHash!);
    const tDatabase = Date.now() - t;
    log(`[${reqId}] 5. Database`, tDatabase);

    // 6. Stellar (background)
    debug(reqId, "STELLAR", "Scheduling background Stellar processing");
    const stellarPromise = processStellarInBackground(
      reqId,
      supabaseUrl,
      supabaseServiceKey,
      readingId,
      auth.powHash!,
      normalized.timestamp,
      auth.powNonce!
    );

    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      debug(reqId, "STELLAR", "Using EdgeRuntime.waitUntil for background task");
      // @ts-ignore
      EdgeRuntime.waitUntil(stellarPromise);
    } else {
      debug(reqId, "STELLAR", "No EdgeRuntime, awaiting Stellar synchronously");
      await stellarPromise;
    }

    const totalTime = Date.now() - requestStart;
    log(`[${reqId}] Total: ${totalTime}ms | Device: ${auth.deviceId}`);

    debug(reqId, "RESPONSE", "Returning 202 Accepted");
    return new Response(null, { status: 202, headers: corsHeaders });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    error(reqId, "ERROR", `Unhandled error: ${errorMessage}`);
    log(`[${reqId}] Error: ${errorMessage}`);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
