-- Migration: Fix RLS policy for readings table INSERT
-- Issue: "Allow insert" policy had WITH CHECK (true) - allows unrestricted access
-- Fix: Restrict INSERT to service_role only (forces data through Edge Function /oracle)

-- Remove the overly-permissive policy
DROP POLICY IF EXISTS "Allow insert" ON public.readings;

-- New policy: only service_role can insert directly
-- This ensures all data goes through the Edge Function which:
--   1. Validates data ranges
--   2. Normalizes data
--   3. Generates SHA256 hash
--   4. Records to Stellar blockchain
CREATE POLICY "insert_only_via_service_role"
  ON public.readings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also fix the UPDATE policy (same issue)
DROP POLICY IF EXISTS "Allow update" ON public.readings;

CREATE POLICY "update_only_via_service_role"
  ON public.readings
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
