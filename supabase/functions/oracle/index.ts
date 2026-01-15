// HarvestShield Oracle - Edge Function v0.1
// Receives sensor data, normalizes, stores in DB, and records hash on Stellar

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as StellarSdk from "https://esm.sh/@stellar/stellar-sdk@11.2.2";

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
// NORMALIZATION
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

  if (!stellarSecretKey) {
    return { success: false, error: "STELLAR_SECRET_KEY not configured" };
  }

  try {
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const sourceKeypair = StellarSdk.Keypair.fromSecret(stellarSecretKey);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    // ManageData key limited to 64 bytes, value to 64 bytes
    const dataKey = `r_${timestamp}`;

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
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

async function saveToDatabase(
  supabase: ReturnType<typeof createClient>,
  normalized: NormalizedReading,
  rawData: RawReading,
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
      normalized_hash: normalized.hash,
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Parse request body
    const body = await req.json();

    // Step 1: Validate
    const validation = validate(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, errors: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Normalize
    const normalized = await normalize(validation.data!);

    // Step 3: Record on Stellar
    const stellarResult = await recordOnStellar(normalized.hash, normalized.timestamp);

    // Step 4: Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const readingId = await saveToDatabase(supabase, normalized, validation.data!, stellarResult);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        reading_id: readingId,
        normalized_hash: normalized.hash,
        blockchain: {
          success: stellarResult.success,
          tx_hash: stellarResult.txHash || null,
          error: stellarResult.error || null,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
