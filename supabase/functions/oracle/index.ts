// HarvestShield Oracle - Edge Function v0.10
// Receives sensor data, validates ECDSA signature, stores in DB, and records hash on Stellar

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // 3. Verify hash matches payload
  const payloadObj = JSON.parse(payload);
  const expectedHash = await generateHash(payloadObj);
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

    // Decode base64 signature
    const signatureBytes = Uint8Array.from(atob(auth.signature), c => c.charCodeAt(0));

    // Convert hex hash to bytes
    const hashBytes = new Uint8Array(
      auth.dataHash.match(/.{2}/g)!.map(b => parseInt(b, 16))
    );

    // Import public key
    const publicKey = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(device.public_key),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    // Verify signature
    const isValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signatureBytes,
      hashBytes
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

async function saveToDatabase(
  supabase: ReturnType<typeof createClient>,
  normalized: NormalizedReading,
  rawData: RawReading,
  iotHash: string,
  stellarResult: { success: boolean; txHash?: string; error?: string }
) {
  const { data, error } = await supabase
    .from("readings")
    .insert({
      device_id: normalized.device_id,
      temperature: normalized.temperature,
      humidity_air: normalized.humidity_air,
      humidity_soil: normalized.humidity_soil,
      luminosity: normalized.luminosity,
      raw_data: rawData,
      normalized_hash: iotHash, // Usar o hash do IoT, nao o recalculado
      normalized_at: new Date(normalized.timestamp).toISOString(),
      blockchain_tx_hash: stellarResult.txHash || null,
      blockchain_status: stellarResult.success ? "confirmed" : "failed",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data.id;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
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

  try {
    // Read body as text (needed for signature verification)
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 0: Authenticate device (ECDSA signature verification)
    const auth = extractAuthHeaders(req);
    const authResult = await verifyDeviceSignature(supabase, bodyText, auth);

    if (!authResult.valid) {
      console.log("[Oracle] Authentication failed:", authResult.error);
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Oracle] Device authenticated successfully");

    // Step 1: Validate payload
    const validation = validate(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, errors: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Normalize
    const normalized = await normalize(validation.data!);

    // Step 3: Record on Stellar using IoT's hash
    const stellarResult = await recordOnStellar(auth.dataHash!, normalized.timestamp);

    // Step 4: Save to database
    const readingId = await saveToDatabase(
      supabase,
      normalized,
      validation.data!,
      auth.dataHash!, // Use IoT's hash
      stellarResult
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        reading_id: readingId,
        data_hash: auth.dataHash,
        blockchain: {
          success: stellarResult.success,
          tx_hash: stellarResult.txHash || null,
          error: stellarResult.error || null,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Oracle] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
