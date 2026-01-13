#!/bin/bash

# HarvestShield - Stellar Testnet Account Setup
# Creates a new Stellar testnet account and funds it via Friendbot

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Stellar Testnet Account Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if stellar-cli or node is available for key generation
# We'll use a simple approach with curl to Stellar Laboratory API

echo -e "${YELLOW}Generating new Stellar keypair...${NC}"
echo ""

# Generate keypair using Stellar Laboratory's generate endpoint
# Alternative: Use stellar-cli if installed
KEYPAIR=$(curl -s "https://laboratory.stellar.org/api/v1/keypair")

if [ -z "$KEYPAIR" ]; then
    echo -e "${RED}Failed to generate keypair via Stellar Laboratory${NC}"
    echo ""
    echo "Alternative: Generate manually at:"
    echo "  https://laboratory.stellar.org/#account-creator?network=test"
    exit 1
fi

PUBLIC_KEY=$(echo "$KEYPAIR" | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4)
SECRET_KEY=$(echo "$KEYPAIR" | grep -o '"secretKey":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PUBLIC_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}Failed to parse keypair${NC}"
    echo "Raw response: $KEYPAIR"
    echo ""
    echo "Alternative: Generate manually at:"
    echo "  https://laboratory.stellar.org/#account-creator?network=test"
    exit 1
fi

echo -e "${GREEN}Keypair generated successfully!${NC}"
echo ""
echo -e "Public Key:  ${BLUE}$PUBLIC_KEY${NC}"
echo -e "Secret Key:  ${YELLOW}$SECRET_KEY${NC}"
echo ""

# Fund account via Friendbot
echo -e "${YELLOW}Funding account via Friendbot...${NC}"

FUND_RESPONSE=$(curl -s "https://friendbot.stellar.org?addr=$PUBLIC_KEY")

if echo "$FUND_RESPONSE" | grep -q '"hash"'; then
    TX_HASH=$(echo "$FUND_RESPONSE" | grep -o '"hash":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ Account funded successfully!${NC}"
    echo ""
    echo "Funding TX: $TX_HASH"
    echo ""
else
    echo -e "${RED}Failed to fund account${NC}"
    echo "Response: $FUND_RESPONSE"
    echo ""
    echo "Try manually at: https://friendbot.stellar.org?addr=$PUBLIC_KEY"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Configuration for Supabase${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Add these to Supabase Edge Function secrets:"
echo "(Dashboard > Settings > Edge Functions > Secrets)"
echo ""
echo -e "  STELLAR_SECRET_KEY=${YELLOW}$SECRET_KEY${NC}"
echo -e "  STELLAR_PUBLIC_KEY=${BLUE}$PUBLIC_KEY${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Verify Account${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "View account on Stellar Expert:"
echo "  https://stellar.expert/explorer/testnet/account/$PUBLIC_KEY"
echo ""

# Save to .env.local for reference
ENV_FILE="/Users/olivmath/Documents/dev/harvestshield/.env.stellar"
echo "# Stellar Testnet Credentials" > "$ENV_FILE"
echo "# Generated: $(date)" >> "$ENV_FILE"
echo "STELLAR_PUBLIC_KEY=$PUBLIC_KEY" >> "$ENV_FILE"
echo "STELLAR_SECRET_KEY=$SECRET_KEY" >> "$ENV_FILE"

echo -e "${GREEN}Credentials saved to .env.stellar${NC}"
echo -e "${RED}⚠️  Keep this file secure and don't commit to git!${NC}"
