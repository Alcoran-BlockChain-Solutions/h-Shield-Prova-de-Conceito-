// HarvestShield Oracle - Edge Function v0.12
// Receives sensor data, validates ECDSA signature, stores in DB, and records hash on Stellar
// RF11: Async mode - Returns 202 immediately, processes Stellar in background

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

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
  dataHash: string | null;
  timestamp: string | null;
}

// ============================================================================
// DEVICE AUTHENTICATION
// ============================================================================

function extractAuthHeaders(req: Request): AuthHeaders {
  return {
    deviceId: req.headers.get("x-device-id"),
    signature: req.headers.get("x-signature"),
    dataHash: req.headers.get("x-data-hash"),
    timestamp: req.headers.get("x-timestamp"),
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

/**
 * Convert DER-encoded ECDSA signature to IEEE P1363 format (r||s)
 * Web Crypto API expects P1363 format, but mbedTLS/OpenSSL produce DER format
 */
function derToP1363(derSignature: Uint8Array): Uint8Array {
  // DER format: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  // P1363 format: [r (32 bytes)] [s (32 bytes)] for P-256

  let offset = 0;

  // Check SEQUENCE tag (0x30)
  if (derSignature[offset++] !== 0x30) {
    throw new Error("Invalid DER signature: missing SEQUENCE tag");
  }

  // Skip total length (1 or 2 bytes)
  let totalLen = derSignature[offset++];
  if (totalLen & 0x80) {
    offset += (totalLen & 0x7f); // Skip extended length bytes
  }

  // Parse R
  if (derSignature[offset++] !== 0x02) {
    throw new Error("Invalid DER signature: missing INTEGER tag for R");
  }
  let rLen = derSignature[offset++];
  let rStart = offset;
  offset += rLen;

  // Parse S
  if (derSignature[offset++] !== 0x02) {
    throw new Error("Invalid DER signature: missing INTEGER tag for S");
  }
  let sLen = derSignature[offset++];
  let sStart = offset;

  // Extract R and S, padding/trimming to 32 bytes each
  const r = extractInteger(derSignature, rStart, rLen, 32);
  const s = extractInteger(derSignature, sStart, sLen, 32);

  // Concatenate r || s
  const p1363 = new Uint8Array(64);
  p1363.set(r, 0);
  p1363.set(s, 32);

  return p1363;
}

function extractInteger(data: Uint8Array, start: number, len: number, targetLen: number): Uint8Array {
  const result = new Uint8Array(targetLen);

  // Skip leading zeros if integer is longer than target
  let srcOffset = start;
  let srcLen = len;
  while (srcLen > targetLen && data[srcOffset] === 0) {
    srcOffset++;
    srcLen--;
  }

  // Copy to result, right-aligned (pad with zeros on left if needed)
  const destOffset = targetLen - srcLen;
  result.set(data.slice(srcOffset, srcOffset + srcLen), destOffset > 0 ? destOffset : 0);

  return result;
}

async function verifyDeviceSignature(
  supabase: ReturnType<typeof createClient>,
  payload: string,
  auth: AuthHeaders
): Promise<{ valid: boolean; error?: string }> {
  // 1. Check required headers
  if (!auth.deviceId || !auth.signature || !auth.dataHash) {
    return { valid: false, error: "Missing authentication headers (X-Device-ID, X-Signature, X-Data-Hash)" };
  }

  // 2. Anti-replay check (configurable via ENV)
  const enableAntiReplay = Deno.env.get("ENABLE_ANTI_REPLAY") === "true";

  if (enableAntiReplay) {
    if (!auth.timestamp) {
      return { valid: false, error: "X-Timestamp required when anti-replay is enabled" };
    }

    const maxAge = parseInt(Deno.env.get("ANTI_REPLAY_MAX_AGE_SECONDS") || "300");
    const now = Math.floor(Date.now() / 1000);
    const msgTime = parseInt(auth.timestamp);

    if (isNaN(msgTime)) {
      return { valid: false, error: "Invalid timestamp format" };
    }

    const age = Math.abs(now - msgTime);
    if (age > maxAge) {
      return { valid: false, error: `Timestamp expired (age: ${age}s, max: ${maxAge}s)` };
    }
  }

  // 3. Verify hash matches payload
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
  const expectedHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (auth.dataHash !== expectedHash) {
    return { valid: false, error: "Data hash mismatch - payload may have been tampered" };
  }

  // 4. Get device public key from database
  const { data: device, error: dbError } = await supabase
    .from("devices")
    .select("public_key, active, total_readings")
    .eq("device_id", auth.deviceId)
    .single();

  if (dbError || !device) {
    return { valid: false, error: "Unknown device" };
  }

  if (!device.active) {
    return { valid: false, error: "Device deactivated" };
  }

  // 5. Verify ECDSA signature
  try {
    const derSignature = Uint8Array.from(atob(auth.signature), c => c.charCodeAt(0));
    const signatureBytes = derToP1363(derSignature);

    const publicKey = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(device.public_key),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const payloadBytes = encoder.encode(payload);

    const isValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signatureBytes,
      payloadBytes
    );

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    // 6. Update device last_seen and increment readings count
    await supabase
      .from("devices")
      .update({
        last_seen_at: new Date().toISOString(),
        total_readings: (device.total_readings || 0) + 1
      })
      .eq("device_id", auth.deviceId);

    return { valid: true };

  } catch (e) {
    return { valid: false, error: "Signature verification failed: " + (e instanceof Error ? e.message : "unknown error") };
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

function validate(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid payload: expected JSON object"] };
  }

  const reading = data as Record<string, unknown>;

  // device_id is required
  if (!reading.device_id || typeof reading.device_id !== "string") {
    errors.push("device_id is required and must be a string");
  }

  // At least one metric must be present
  const metrics = ["temperature", "humidity_air", "humidity_soil", "luminosity"];
  const hasMetric = metrics.some(
    (m) => reading[m] !== undefined && reading[m] !== null
  );

  if (!hasMetric) {
    errors.push("At least one metric (temperature, humidity_air, humidity_soil, luminosity) is required");
  }

  // Validate ranges
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

async function normalize(raw: RawReading): Promise<NormalizedReading> {
  const timestamp = raw.timestamp || Date.now();

  const normalized = {
    device_id: raw.device_id.trim().toLowerCase(),
    temperature: raw.temperature !== undefined
      ? parseFloat(raw.temperature.toFixed(2))
      : null,
    humidity_air: raw.humidity_air !== undefined
      ? parseFloat(raw.humidity_air.toFixed(2))
      : null,
    humidity_soil: raw.humidity_soil !== undefined
      ? parseFloat(raw.humidity_soil.toFixed(2))
      : null,
    luminosity: raw.luminosity !== undefined
      ? Math.round(raw.luminosity)
      : null,
    timestamp,
  };

  const hash = await generateHash(normalized);

  return { ...normalized, hash };
}

// ============================================================================
// STELLAR INTEGRATION
// ============================================================================

async function recordOnStellar(
  dataHash: string,
  timestamp: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const stellarSecretKey = Deno.env.get("STELLAR_SECRET_KEY");
  const stellarNetwork = Deno.env.get("STELLAR_NETWORK") || "testnet";

  if (!stellarSecretKey) {
    return { success: false, error: "STELLAR_SECRET_KEY not configured" };
  }

  const isMainnet = stellarNetwork.toLowerCase() === "mainnet";
  const horizonUrl = isMainnet
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

  try {
    const StellarModule = await import("https://esm.sh/@stellar/stellar-sdk@11.2.2?bundle&target=browser");
    const Stellar = StellarModule.default || StellarModule;

    const Keypair = Stellar.Keypair || StellarModule.Keypair;
    const TransactionBuilder = Stellar.TransactionBuilder || StellarModule.TransactionBuilder;
    const Operation = Stellar.Operation || StellarModule.Operation;
    const Networks = Stellar.Networks || StellarModule.Networks;
    const HorizonServer = StellarModule.Horizon?.Server || Stellar.Horizon?.Server || Stellar.Server;

    if (!HorizonServer || !Keypair) {
      return { success: false, error: "Stellar classes not found in SDK" };
    }

    const networkPassphrase = isMainnet ? Networks.PUBLIC : Networks.TESTNET;
    const server = new HorizonServer(horizonUrl);
    const sourceKeypair = Keypair.fromSecret(stellarSecretKey);
    const account = await server.loadAccount(sourceKeypair.publicKey());
    const dataKey = `r_${timestamp}`;

    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase,
    })
      .addOperation(
        Operation.manageData({
          name: dataKey,
          value: dataHash,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const result = await server.submitTransaction(transaction);

    return { success: true, txHash: result.hash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Stellar error";
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// DATABASE
// ============================================================================

/**
 * Initial save with pending blockchain status (RF11 async)
 */
async function saveToDatabase(
  supabase: ReturnType<typeof createClient>,
  normalized: NormalizedReading,
  rawData: RawReading,
  iotHash: string
): Promise<string> {
  const { data, error } = await supabase
    .from("readings")
    .insert({
      device_id: normalized.device_id,
      temperature: normalized.temperature,
      humidity_air: normalized.humidity_air,
      humidity_soil: normalized.humidity_soil,
      luminosity: normalized.luminosity,
      raw_data: rawData,
      normalized_hash: iotHash,
      normalized_at: new Date(normalized.timestamp).toISOString(),
      blockchain_tx_hash: null,
      blockchain_status: "pending",
      blockchain_error: null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data.id;
}

/**
 * Update reading with blockchain result (RF11 async background task)
 */
async function updateBlockchainResult(
  supabase: ReturnType<typeof createClient>,
  readingId: string,
  stellarResult: { success: boolean; txHash?: string; error?: string }
): Promise<void> {
  await supabase
    .from("readings")
    .update({
      blockchain_tx_hash: stellarResult.txHash || null,
      blockchain_status: stellarResult.success ? "confirmed" : "failed",
      blockchain_error: stellarResult.error || null,
    })
    .eq("id", readingId);
}

// ============================================================================
// STELLAR BACKGROUND TASK (RF11)
// ============================================================================

/**
 * Process Stellar transaction in background and update DB
 * This runs after the 202 response is sent to the IoT device
 */
async function processStellarInBackground(
  supabaseUrl: string,
  supabaseServiceKey: string,
  readingId: string,
  dataHash: string,
  timestamp: number
): Promise<void> {
  const startTime = Date.now();

  try {
    const stellarResult = await recordOnStellar(dataHash, timestamp);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await updateBlockchainResult(supabase, readingId, stellarResult);

    const time = Date.now() - startTime;
    const status = stellarResult.success ? "OK" : "FAIL";
    log(`5. Stellar ${status}`, time);
  } catch (error) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await updateBlockchainResult(supabase, readingId, {
        success: false,
        error: error instanceof Error ? error.message : "Unknown background error",
      });
    } catch (_) {}
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const requestStart = Date.now();

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-signature, x-data-hash, x-timestamp",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Parse
    let t = Date.now();
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    log("1. Parse", Date.now() - t);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Auth
    t = Date.now();
    const auth = extractAuthHeaders(req);
    const authResult = await verifyDeviceSignature(supabase, bodyText, auth);
    const tAuth = Date.now() - t;
    log(`2. Auth ${authResult.valid ? "OK" : "FAIL"}`, tAuth);

    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validate
    t = Date.now();
    const validation = validate(body);
    log(`3. Validate ${validation.valid ? "OK" : "FAIL"}`, Date.now() - t);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, errors: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Save DB
    t = Date.now();
    const normalized = await normalize(validation.data!);
    const readingId = await saveToDatabase(supabase, normalized, validation.data!, auth.dataHash!);
    const tDatabase = Date.now() - t;
    log("4. Database", tDatabase);

    // 5. Stellar (background)
    const stellarPromise = processStellarInBackground(
      supabaseUrl,
      supabaseServiceKey,
      readingId,
      auth.dataHash!,
      normalized.timestamp
    );

    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(stellarPromise);
    } else {
      await stellarPromise;
    }

    const totalTime = Date.now() - requestStart;
    log(`Total: ${totalTime}ms | Device: ${auth.deviceId}`);

    return new Response(
      JSON.stringify({
        success: true,
        reading_id: readingId,
        data_hash: auth.dataHash,
        blockchain: { status: "pending" },
        timing: { total_ms: totalTime, auth_ms: tAuth, database_ms: tDatabase },
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    log(`Error: ${errorMessage}`);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
