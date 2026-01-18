// HarvestShield Oracle - Edge Function v0.12
// Receives sensor data, validates ECDSA signature, stores in DB, and records hash on Stellar
// RF11: Async mode - Returns 202 immediately, processes Stellar in background

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

function formatMs(ms: number): string {
  return ms.toFixed(2);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function logStep(step: number, name: string, timeMs: number, details?: Record<string, unknown>) {
  const detailsStr = details
    ? " | " + Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(" | ")
    : "";
  console.log(`[Step ${step}] ${name} (${formatMs(timeMs)} ms)${detailsStr}`);
}

function logSummary(requestId: string, steps: { name: string; time: number }[], totalTime: number) {
  console.log(`[Summary] Request ${requestId} - Total: ${formatMs(totalTime)} ms`);
  for (const step of steps) {
    const pct = ((step.time / totalTime) * 100).toFixed(1);
    console.log(`  ${step.name}: ${formatMs(step.time)} ms (${pct}%)`);
  }
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
  console.log("[Auth] Starting device verification...");
  console.log("[Auth] Device ID:", auth.deviceId);
  console.log("[Auth] Has signature:", !!auth.signature);
  console.log("[Auth] Has data hash:", !!auth.dataHash);

  // 1. Check required headers
  if (!auth.deviceId || !auth.signature || !auth.dataHash) {
    return { valid: false, error: "Missing authentication headers (X-Device-ID, X-Signature, X-Data-Hash)" };
  }

  // 2. Anti-replay check (configurable via ENV)
  const enableAntiReplay = Deno.env.get("ENABLE_ANTI_REPLAY") === "true";
  console.log("[Auth] Anti-replay enabled:", enableAntiReplay);

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
    console.log("[Auth] Timestamp age:", age, "seconds, max:", maxAge);

    if (age > maxAge) {
      return { valid: false, error: `Timestamp expired (age: ${age}s, max: ${maxAge}s)` };
    }
  }

  // 3. Verify hash matches payload (use raw string, not re-serialized JSON)
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
  const expectedHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  console.log("[Auth] Expected hash:", expectedHash.substring(0, 16) + "...");
  console.log("[Auth] Received hash:", auth.dataHash.substring(0, 16) + "...");

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
    console.log("[Auth] Device not found:", auth.deviceId);
    return { valid: false, error: "Unknown device" };
  }

  if (!device.active) {
    console.log("[Auth] Device deactivated:", auth.deviceId);
    return { valid: false, error: "Device deactivated" };
  }

  // 5. Verify ECDSA signature
  try {
    console.log("[Auth] Verifying ECDSA signature...");

    // Decode base64 signature (DER format from mbedTLS/OpenSSL)
    const derSignature = Uint8Array.from(atob(auth.signature), c => c.charCodeAt(0));
    console.log("[Auth] DER signature length:", derSignature.length, "bytes");

    // Convert DER to P1363 format (required by Web Crypto API)
    const signatureBytes = derToP1363(derSignature);
    console.log("[Auth] P1363 signature length:", signatureBytes.length, "bytes");

    // Import public key
    const publicKey = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(device.public_key),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    // Web Crypto verify() hashes the data internally with SHA-256
    // So we pass the original payload, not the pre-computed hash
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);

    // Verify signature (P1363 format, data will be hashed internally)
    const isValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signatureBytes,
      payloadBytes
    );

    if (!isValid) {
      console.log("[Auth] Signature verification failed");
      return { valid: false, error: "Invalid signature" };
    }

    console.log("[Auth] Signature verified successfully!");

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
    console.error("[Auth] Verification error:", e);
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

  console.log("[Stellar] Starting recordOnStellar");
  console.log("[Stellar] Secret key configured:", !!stellarSecretKey);
  console.log("[Stellar] Data hash to record:", dataHash.substring(0, 16) + "...");

  if (!stellarSecretKey) {
    return { success: false, error: "STELLAR_SECRET_KEY not configured" };
  }

  try {
    // Dynamic import - use browser bundle (pure JS, no native addons)
    const StellarModule = await import("https://esm.sh/@stellar/stellar-sdk@11.2.2?bundle&target=browser");
    // Get the default export which contains all the main classes
    const Stellar = StellarModule.default || StellarModule;
    console.log("[Stellar] SDK loaded, keys:", Object.keys(Stellar));

    // Get classes - they may be on Stellar directly or nested
    const Keypair = Stellar.Keypair || StellarModule.Keypair;
    const TransactionBuilder = Stellar.TransactionBuilder || StellarModule.TransactionBuilder;
    const Operation = Stellar.Operation || StellarModule.Operation;
    const Networks = Stellar.Networks || StellarModule.Networks;
    const HorizonServer = StellarModule.Horizon?.Server || Stellar.Horizon?.Server || Stellar.Server;

    console.log("[Stellar] Classes found - Keypair:", !!Keypair, "TransactionBuilder:", !!TransactionBuilder);
    console.log("[Stellar] HorizonServer found:", !!HorizonServer);

    if (!HorizonServer || !Keypair) {
      return { success: false, error: "Stellar classes not found in SDK" };
    }

    const server = new HorizonServer("https://horizon-testnet.stellar.org");
    const sourceKeypair = Keypair.fromSecret(stellarSecretKey);
    console.log("[Stellar] Public key:", sourceKeypair.publicKey());

    const account = await server.loadAccount(sourceKeypair.publicKey());
    console.log("[Stellar] Account loaded, sequence:", account.sequence);

    // ManageData key limited to 64 bytes, value to 64 bytes
    const dataKey = `r_${timestamp}`;

    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
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
    console.log("[Stellar] Transaction built and signed");

    const result = await server.submitTransaction(transaction);
    console.log("[Stellar] Transaction submitted, hash:", result.hash);

    return { success: true, txHash: result.hash };
  } catch (error) {
    console.error("[Stellar] Error:", error);
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
  const { error } = await supabase
    .from("readings")
    .update({
      blockchain_tx_hash: stellarResult.txHash || null,
      blockchain_status: stellarResult.success ? "confirmed" : "failed",
      blockchain_error: stellarResult.error || null,
    })
    .eq("id", readingId);

  if (error) {
    console.error(`[Stellar Background] Failed to update reading ${readingId}:`, error.message);
  } else {
    console.log(`[Stellar Background] Reading ${readingId} updated: ${stellarResult.success ? "confirmed" : "failed"}`);
  }
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
  timestamp: number,
  requestId: string
): Promise<void> {
  console.log(`[Stellar Background] Starting for reading ${readingId} (request #${requestId})`);
  const startTime = Date.now();

  try {
    // Process Stellar transaction
    const stellarResult = await recordOnStellar(dataHash, timestamp);
    const stellarTime = Date.now() - startTime;

    console.log(`[Stellar Background] TX completed in ${formatMs(stellarTime)}ms - Success: ${stellarResult.success}`);
    if (stellarResult.txHash) {
      console.log(`[Stellar Background] TX Hash: ${stellarResult.txHash}`);
    }
    if (stellarResult.error) {
      console.log(`[Stellar Background] Error: ${stellarResult.error}`);
    }

    // Update database with result
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await updateBlockchainResult(supabase, readingId, stellarResult);

    const totalTime = Date.now() - startTime;
    console.log(`[Stellar Background] Completed for reading ${readingId} in ${formatMs(totalTime)}ms`);
  } catch (error) {
    console.error(`[Stellar Background] Unexpected error for reading ${readingId}:`, error);

    // Try to update DB with error status
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await updateBlockchainResult(supabase, readingId, {
        success: false,
        error: error instanceof Error ? error.message : "Unknown background error",
      });
    } catch (dbError) {
      console.error(`[Stellar Background] Failed to update error status:`, dbError);
    }
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const requestStart = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);
  const timings: { name: string; time: number }[] = [];

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-signature, x-data-hash, x-timestamp",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[Oracle] Request #${requestId} - ${new Date().toISOString()}`);

  try {
    const t0 = Date.now();
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const tParse = Date.now() - t0;
    timings.push({ name: "Parse body", time: tParse });

    logStep(0, "Parse Body", tParse, {
      "Body size": formatBytes(bodyText.length),
      "Device ID": body.device_id || "N/A",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Authenticate device (ECDSA signature verification)
    const t1 = Date.now();
    const auth = extractAuthHeaders(req);
    const authResult = await verifyDeviceSignature(supabase, bodyText, auth);
    const tAuth = Date.now() - t1;
    timings.push({ name: "ECDSA Auth", time: tAuth });

    logStep(1, "ECDSA Authentication", tAuth, {
      "Device ID": auth.deviceId || "N/A",
      "Has signature": !!auth.signature,
      "Has hash": !!auth.dataHash,
      "Result": authResult.valid ? "VALID" : `FAILED: ${authResult.error}`,
    });

    if (!authResult.valid) {
      console.log(`[Oracle] Authentication failed: ${authResult.error}`);
      logSummary(requestId, timings, Date.now() - requestStart);
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 2: Validate payload
    const t2 = Date.now();
    const validation = validate(body);
    const tValidate = Date.now() - t2;
    timings.push({ name: "Validation", time: tValidate });

    logStep(2, "Validate Payload", tValidate, {
      "Valid": validation.valid,
      "Errors": validation.errors.length > 0 ? validation.errors.join(", ") : "None",
    });

    if (!validation.valid) {
      logSummary(requestId, timings, Date.now() - requestStart);
      return new Response(
        JSON.stringify({ success: false, errors: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 3: Normalize
    const t3 = Date.now();
    const normalized = await normalize(validation.data!);
    const tNormalize = Date.now() - t3;
    timings.push({ name: "Normalization", time: tNormalize });

    logStep(3, "Normalize Data", tNormalize, {
      "Temp": normalized.temperature !== null ? `${normalized.temperature}°C` : "N/A",
      "Humidity Air": normalized.humidity_air !== null ? `${normalized.humidity_air}%` : "N/A",
      "Humidity Soil": normalized.humidity_soil !== null ? `${normalized.humidity_soil}%` : "N/A",
      "Luminosity": normalized.luminosity !== null ? `${normalized.luminosity} lux` : "N/A",
    });

    // STEP 4: Save to database with PENDING status (RF11 - async first)
    const t4 = Date.now();
    const readingId = await saveToDatabase(
      supabase,
      normalized,
      validation.data!,
      auth.dataHash!
    );
    const tDatabase = Date.now() - t4;
    timings.push({ name: "Database Insert", time: tDatabase });

    logStep(4, "Database Insert (pending)", tDatabase, {
      "Reading ID": readingId,
      "Blockchain Status": "pending",
    });

    // STEP 5: Schedule Stellar TX in background using EdgeRuntime.waitUntil (RF11)
    // This allows the response to be sent immediately while Stellar processes in background
    const stellarPromise = processStellarInBackground(
      supabaseUrl,
      supabaseServiceKey,
      readingId,
      auth.dataHash!,
      normalized.timestamp,
      requestId
    );

    // Use EdgeRuntime.waitUntil to keep the function alive for background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(stellarPromise);
      console.log(`[Oracle] Stellar TX scheduled in background via EdgeRuntime.waitUntil`);
    } else {
      // Fallback: wait for Stellar (sync mode) if EdgeRuntime not available
      console.log(`[Oracle] EdgeRuntime.waitUntil not available, falling back to sync mode`);
      await stellarPromise;
    }

    // SUMMARY (response time, not including background Stellar TX)
    const totalTime = Date.now() - requestStart;
    logSummary(requestId, timings, totalTime);

    console.log(`[Oracle] Response time: ${formatMs(totalTime)}ms (Stellar processing in background)`);

    // Build response - RF11: Return 202 Accepted immediately
    // IoT device does NOT wait for Stellar TX
    const responseBody = JSON.stringify({
      success: true,
      reading_id: readingId,
      data_hash: auth.dataHash,
      blockchain: {
        status: "pending",
        message: "Transaction queued for background processing",
      },
      timing: {
        total_ms: totalTime,
        auth_ms: tAuth,
        database_ms: tDatabase,
      },
    });

    console.log(`[Oracle] Response size: ${formatBytes(responseBody.length)}`);

    // 202 Accepted = Request accepted, processing continues in background
    return new Response(
      responseBody,
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Oracle] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    logSummary(requestId, timings, Date.now() - requestStart);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
