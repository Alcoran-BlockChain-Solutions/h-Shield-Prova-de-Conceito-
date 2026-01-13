#!/bin/bash

# HarvestShield - ESP32 Simulator
# Simulates ESP32 sending data every X seconds
# Usage: ./scripts/simulate-esp32.sh [interval_seconds]

set -e

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://YOUR_PROJECT.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"
DEVICE_ID="${DEVICE_ID:-esp32-simulator-001}"
INTERVAL="${1:-60}"  # Default: 60 seconds

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check configuration
if [[ "$SUPABASE_URL" == *"YOUR_PROJECT"* ]]; then
    echo -e "${RED}ERROR: Configure SUPABASE_URL and SUPABASE_ANON_KEY${NC}"
    echo "  export SUPABASE_URL=https://xxx.supabase.co"
    echo "  export SUPABASE_ANON_KEY=eyJ..."
    exit 1
fi

ORACLE_URL="${SUPABASE_URL}/functions/v1/oracle"

# State variables for realistic simulation
TEMP=25.0
HUM_AIR=60.0
HUM_SOIL=50.0
LUX=30000

# Function to generate random float variation
random_variation() {
    local range=$1
    echo "scale=2; ($RANDOM % ($range * 2 + 1) - $range) / 10" | bc
}

# Function to constrain value
constrain() {
    local value=$1
    local min=$2
    local max=$3
    echo "scale=2; if ($value < $min) $min else if ($value > $max) $max else $value" | bc
}

# Function to get simulated luminosity based on hour
get_luminosity() {
    local hour=$(date +%H | sed 's/^0//')

    if [ "$hour" -ge 6 ] && [ "$hour" -le 18 ]; then
        if [ "$hour" -le 12 ]; then
            local progress=$((hour - 6))
        else
            local progress=$((18 - hour))
        fi
        local base=$((1000 + progress * 10000))
        local variation=$((RANDOM % 2000 - 1000))
        echo $((base + variation))
    else
        echo $((RANDOM % 100))
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   HarvestShield - ESP32 Simulator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Device ID: ${GREEN}$DEVICE_ID${NC}"
echo -e "Interval:  ${GREEN}${INTERVAL}s${NC}"
echo -e "Endpoint:  ${GREEN}$ORACLE_URL${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

COUNT=0

while true; do
    COUNT=$((COUNT + 1))

    # Simulate realistic variations
    TEMP_VAR=$(random_variation 20)
    TEMP=$(constrain "$(echo "$TEMP + $TEMP_VAR" | bc)" 15 35)

    HUM_AIR_VAR=$(random_variation 50)
    HUM_AIR=$(constrain "$(echo "$HUM_AIR + $HUM_AIR_VAR" | bc)" 40 90)

    HUM_SOIL_VAR=$(random_variation 30)
    HUM_SOIL=$(constrain "$(echo "$HUM_SOIL + $HUM_SOIL_VAR" | bc)" 20 80)

    LUX=$(get_luminosity)

    TIMESTAMP=$(date +%s%3N)

    echo -e "${YELLOW}[#$COUNT] Sending reading at $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo "  Temperature: ${TEMP}°C"
    echo "  Humidity Air: ${HUM_AIR}%"
    echo "  Humidity Soil: ${HUM_SOIL}%"
    echo "  Luminosity: ${LUX} lux"

    RESPONSE=$(curl -s -X POST "$ORACLE_URL" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"device_id\": \"$DEVICE_ID\",
            \"temperature\": $TEMP,
            \"humidity_air\": $HUM_AIR,
            \"humidity_soil\": $HUM_SOIL,
            \"luminosity\": $LUX,
            \"timestamp\": $TIMESTAMP
        }")

    if echo "$RESPONSE" | grep -q '"success":true'; then
        TX_HASH=$(echo "$RESPONSE" | grep -o '"tx_hash":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$TX_HASH" ] && [ "$TX_HASH" != "null" ]; then
            echo -e "  ${GREEN}✓ Saved & recorded on Stellar${NC}"
            echo "  TX: ${TX_HASH:0:20}..."
        else
            echo -e "  ${GREEN}✓ Saved (Stellar pending/failed)${NC}"
        fi
    else
        echo -e "  ${RED}✗ Failed: $RESPONSE${NC}"
    fi

    echo ""
    echo -e "  Next reading in ${INTERVAL}s..."
    echo ""

    sleep "$INTERVAL"
done
