#!/bin/bash

# HarvestShield v0.1 - Test Script
# Usage: ./scripts/test-v0.1.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - EDIT THESE VALUES
SUPABASE_URL="${SUPABASE_URL:-https://YOUR_PROJECT.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"

# Check if configured
if [[ "$SUPABASE_URL" == *"YOUR_PROJECT"* ]]; then
    echo -e "${RED}ERROR: Configure SUPABASE_URL and SUPABASE_ANON_KEY${NC}"
    echo ""
    echo "Option 1 - Export environment variables:"
    echo "  export SUPABASE_URL=https://xxx.supabase.co"
    echo "  export SUPABASE_ANON_KEY=eyJ..."
    echo ""
    echo "Option 2 - Edit this script directly"
    exit 1
fi

ORACLE_URL="${SUPABASE_URL}/functions/v1/oracle"
READINGS_URL="${SUPABASE_URL}/functions/v1/get-readings"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   HarvestShield v0.1 - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Send valid reading
echo -e "${YELLOW}[TEST 1] Sending valid reading...${NC}"

RESPONSE=$(curl -s -X POST "$ORACLE_URL" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "device_id": "test-device-001",
        "temperature": 25.5,
        "humidity_air": 65.2,
        "humidity_soil": 45.0,
        "luminosity": 32000
    }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Test 1 PASSED - Reading saved successfully${NC}"

    # Extract values for display
    READING_ID=$(echo "$RESPONSE" | grep -o '"reading_id":"[^"]*"' | cut -d'"' -f4)
    HASH=$(echo "$RESPONSE" | grep -o '"normalized_hash":"[^"]*"' | cut -d'"' -f4)
    TX_HASH=$(echo "$RESPONSE" | grep -o '"tx_hash":"[^"]*"' | cut -d'"' -f4)

    echo "  - Reading ID: $READING_ID"
    echo "  - Hash: ${HASH:0:16}..."
    if [ -n "$TX_HASH" ] && [ "$TX_HASH" != "null" ]; then
        echo "  - Stellar TX: ${TX_HASH:0:16}..."
        echo -e "  - ${GREEN}Verify: https://stellar.expert/explorer/testnet/tx/$TX_HASH${NC}"
    fi
else
    echo -e "${RED}✗ Test 1 FAILED${NC}"
fi

echo ""

# Test 2: Send reading with only temperature
echo -e "${YELLOW}[TEST 2] Sending reading with only temperature...${NC}"

RESPONSE=$(curl -s -X POST "$ORACLE_URL" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "device_id": "test-device-002",
        "temperature": 30.0
    }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Test 2 PASSED - Partial reading accepted${NC}"
else
    echo -e "${RED}✗ Test 2 FAILED${NC}"
fi

echo ""

# Test 3: Send invalid reading (no metrics)
echo -e "${YELLOW}[TEST 3] Sending invalid reading (no metrics)...${NC}"

RESPONSE=$(curl -s -X POST "$ORACLE_URL" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "device_id": "test-device-003"
    }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Test 3 PASSED - Invalid reading rejected${NC}"
else
    echo -e "${RED}✗ Test 3 FAILED - Should have been rejected${NC}"
fi

echo ""

# Test 4: Send invalid reading (out of range)
echo -e "${YELLOW}[TEST 4] Sending invalid reading (temperature out of range)...${NC}"

RESPONSE=$(curl -s -X POST "$ORACLE_URL" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "device_id": "test-device-004",
        "temperature": 100.0
    }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Test 4 PASSED - Out of range rejected${NC}"
else
    echo -e "${RED}✗ Test 4 FAILED - Should have been rejected${NC}"
fi

echo ""

# Test 5: Get all readings
echo -e "${YELLOW}[TEST 5] Getting all readings...${NC}"

RESPONSE=$(curl -s "$READINGS_URL?limit=5" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ Test 5 PASSED - Retrieved $COUNT readings${NC}"
else
    echo -e "${RED}✗ Test 5 FAILED${NC}"
fi

echo ""

# Test 6: Get readings by device
echo -e "${YELLOW}[TEST 6] Getting readings by device_id...${NC}"

RESPONSE=$(curl -s "$READINGS_URL?device_id=test-device-001&limit=5" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Test 6 PASSED - Filtered by device${NC}"
else
    echo -e "${RED}✗ Test 6 FAILED${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Test Suite Complete${NC}"
echo -e "${BLUE}========================================${NC}"
