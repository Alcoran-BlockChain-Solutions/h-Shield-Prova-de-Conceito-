-- Migration: Fix RLS performance issues on devices table
-- Version: 0.12.1
-- Date: 2026-01-18
-- Fixes:
--   1. Auth RLS Initialization Plan (wrap auth.role() in SELECT)
--   2. Multiple Permissive Policies (consolidate overlapping policies)

-- ============================================================================
-- TABLE: devices
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role full access" ON devices;
DROP POLICY IF EXISTS "Public read for verification" ON devices;

-- Policy 1: Public read (anyone can SELECT for signature verification)
-- This is the only SELECT policy needed - no auth check required
CREATE POLICY "devices_select_public" ON devices
    FOR SELECT
    USING (true);

-- Policy 2: Service role can INSERT (register new devices)
-- Uses (SELECT auth.role()) to evaluate once per statement, not per row
CREATE POLICY "devices_insert_service_role" ON devices
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Policy 3: Service role can UPDATE (update device info, last_seen, etc)
CREATE POLICY "devices_update_service_role" ON devices
    FOR UPDATE
    USING ((SELECT auth.role()) = 'service_role');

-- Policy 4: Service role can DELETE (remove devices)
CREATE POLICY "devices_delete_service_role" ON devices
    FOR DELETE
    USING ((SELECT auth.role()) = 'service_role');

-- ============================================================================
-- TABLE: readings (apply same fix if needed)
-- ============================================================================

-- Check and fix readings table policies
DROP POLICY IF EXISTS "Public read access" ON readings;
DROP POLICY IF EXISTS "Allow insert" ON readings;
DROP POLICY IF EXISTS "Allow update" ON readings;

-- Policy 1: Public read (anyone can SELECT readings)
CREATE POLICY "readings_select_public" ON readings
    FOR SELECT
    USING (true);

-- Policy 2: Service role can INSERT (oracle inserts readings)
CREATE POLICY "readings_insert_service_role" ON readings
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Policy 3: Service role can UPDATE (oracle updates blockchain status)
CREATE POLICY "readings_update_service_role" ON readings
    FOR UPDATE
    USING ((SELECT auth.role()) = 'service_role');
