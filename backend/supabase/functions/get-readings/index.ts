// HarvestShield Get Readings - Edge Function v0.4
// Retrieves readings from database with optional filters

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

interface QueryParams {
  device_id?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
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

  // Accept GET or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse query params
    let params: QueryParams = {};

    if (req.method === "GET") {
      const url = new URL(req.url);
      params = {
        device_id: url.searchParams.get("device_id") || undefined,
        limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 100,
        offset: url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : 0,
        start_date: url.searchParams.get("start_date") || undefined,
        end_date: url.searchParams.get("end_date") || undefined,
      };
    } else {
      const body = await req.json();
      params = {
        device_id: body.device_id,
        limit: body.limit || 100,
        offset: body.offset || 0,
        start_date: body.start_date,
        end_date: body.end_date,
      };
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Build query
    let query = supabase
      .from("readings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 100) - 1);

    // Apply filters
    if (params.device_id) {
      query = query.eq("device_id", params.device_id.toLowerCase());
    }

    if (params.start_date) {
      query = query.gte("created_at", params.start_date);
    }

    if (params.end_date) {
      query = query.lte("created_at", params.end_date);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        count: data?.length || 0,
        readings: data || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
