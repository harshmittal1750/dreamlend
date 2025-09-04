#!/bin/bash

# Complete RISE testnet deployment script
# This script handles the proper deployment flow for RISE testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're deploying to RISE testnet
if [ -z "$1" ] || [ "$1" != "rise" ]; then
    print_error "This script is specifically for RISE testnet deployment"
    echo "Usage: $0 rise"
    exit 1
fi

print_status "Starting complete RISE testnet deployment..."

# Load environment variables (for Etherscan verification)
if [ -f .env ]; then
    print_status "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
fi

# Check for required parameters
if [ -z "$2" ]; then
    print_error "Missing required parameters!"
    echo "Usage: $0 rise <account_name> <sender_address>"
    echo "Example: $0 rise develop 0xf6eE7B6F0170BE39A344f21241d5AD8b89960407"
    exit 1
fi

ACCOUNT_NAME="$2"
SENDER_ADDRESS="$3"

if [ -z "$SENDER_ADDRESS" ]; then
    print_error "Sender address is required!"
    echo "Usage: $0 rise <account_name> <sender_address>"
    exit 1
fi

print_status "Using account: $ACCOUNT_NAME"
print_status "Sender address: $SENDER_ADDRESS"

cd contracts

# Step 1: Deploy tokens first
print_status "Step 1: Deploying mock tokens for RISE testnet..."
forge script script/DeployRiseTokens.s.sol:DeployRiseTokens \
    --rpc-url "https://testnet.riselabs.xyz" \
    --broadcast \
    --account "$ACCOUNT_NAME" \
    --sender "$SENDER_ADDRESS" 

if [ $? -ne 0 ]; then
    print_error "Token deployment failed!"
    exit 1
fi

print_success "Tokens deployed successfully!"

# Step 2: Extract token addresses and update RiseConfig.sol
print_status "Step 2: Extracting token addresses..."
BROADCAST_DIR="broadcast/DeployRiseTokens.s.sol/11155931"
LATEST_RUN=$(ls -t "$BROADCAST_DIR"/run-*.json | head -1)

if [ ! -f "$LATEST_RUN" ]; then
    print_error "Could not find deployment artifacts"
    exit 1
fi

# Extract addresses (get checksummed versions from the deployment logs)
USDC_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MockUSDC") | .contractAddress' "$LATEST_RUN")
USDT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MockUSDT") | .contractAddress' "$LATEST_RUN")
WBTC_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MockWBTC") | .contractAddress' "$LATEST_RUN")

# Convert to checksummed format using cast
print_status "Converting addresses to checksummed format..."
USDC_ADDRESS=$(cast to-checksum-address "$USDC_ADDRESS")
USDT_ADDRESS=$(cast to-checksum-address "$USDT_ADDRESS")
WBTC_ADDRESS=$(cast to-checksum-address "$WBTC_ADDRESS")

print_status "Token addresses extracted:"
print_status "USDC: $USDC_ADDRESS"
print_status "USDT: $USDT_ADDRESS"
print_status "WBTC: $WBTC_ADDRESS"

# Step 3: Update RiseConfig.sol with actual addresses
print_status "Step 3: Updating RiseConfig.sol with deployed token addresses..."

# Go back to root directory to run the update script
cd ..

# Use Node.js script for reliable address updating
node scripts/update-rise-config.js "$USDC_ADDRESS" "$USDT_ADDRESS" "$WBTC_ADDRESS"

if [ $? -ne 0 ]; then
    print_error "Failed to update RiseConfig.sol with token addresses"
    exit 1
fi

# Go back to contracts directory
cd contracts

print_success "RiseConfig.sol updated with deployed token addresses"

# Step 4: Deploy main contracts
print_status "Step 4: Deploying DreamLend and other main contracts..."
forge script script/DeployMultiChain.s.sol:DeployMultiChain \
    --rpc-url "https://testnet.riselabs.xyz" \
    --broadcast \
    --account "$ACCOUNT_NAME" \
    --sender "$SENDER_ADDRESS" 


if [ $? -ne 0 ]; then
    print_error "Main contract deployment failed!"
    # Restore backup
    if [ -f src/RiseConfig.sol.backup ]; then
        mv src/RiseConfig.sol.backup src/RiseConfig.sol
        print_status "RiseConfig.sol restored from backup"
    fi
    exit 1
fi

print_success "Main contracts deployed successfully!"

# Step 5: Update frontend configuration
print_status "Step 5: Updating frontend configuration..."
cd ..

MAIN_BROADCAST_DIR="contracts/broadcast/DeployMultiChain.s.sol/11155931"
MAIN_LATEST_RUN=$(ls -t "$MAIN_BROADCAST_DIR"/run-*.json | head -1)

if [ -f "$MAIN_LATEST_RUN" ]; then
    # Extract contract addresses
    DREAMLEND_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "DreamLend") | .contractAddress' "$MAIN_LATEST_RUN")
    DREAMER_TOKEN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "DreamerToken") | .contractAddress' "$MAIN_LATEST_RUN")
    REWARDS_DISTRIBUTOR_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "RewardsDistributor") | .contractAddress' "$MAIN_LATEST_RUN")

    # Update .env file
    if [ -f .env ]; then
        grep -v "NEXT_PUBLIC_RISE_" .env > .env.tmp && mv .env.tmp .env
    fi

    echo "# RISE Testnet Contract Addresses" >> .env
    echo "NEXT_PUBLIC_RISE_DREAMLEND_CONTRACT_ADDRESS=$DREAMLEND_ADDRESS" >> .env
    echo "NEXT_PUBLIC_RISE_DREAMER_TOKEN_ADDRESS=$DREAMER_TOKEN_ADDRESS" >> .env
    echo "NEXT_PUBLIC_RISE_REWARDS_DISTRIBUTOR_ADDRESS=$REWARDS_DISTRIBUTOR_ADDRESS" >> .env
    echo "NEXT_PUBLIC_RISE_MOCK_USDC_ADDRESS=$USDC_ADDRESS" >> .env
    echo "NEXT_PUBLIC_RISE_MOCK_USDT_ADDRESS=$USDT_ADDRESS" >> .env
    echo "NEXT_PUBLIC_RISE_MOCK_WBTC_ADDRESS=$WBTC_ADDRESS" >> .env
    echo "" >> .env

    print_success "Frontend configuration updated!"
    print_status "Contract addresses:"
    print_status "DreamLend: $DREAMLEND_ADDRESS"
    print_status "DreamerToken: $DREAMER_TOKEN_ADDRESS"
    print_status "RewardsDistributor: $REWARDS_DISTRIBUTOR_ADDRESS"
else
    print_warning "Could not find main deployment artifacts for frontend update"
fi

print_success "🎉 RISE testnet deployment completed successfully!"
print_status "Next steps:"
print_status "1. Update your frontend token configuration with the new addresses"
print_status "2. Test the lending functionality"
print_status "3. Update src/config/tokens-multichain.ts with the deployed token addresses"

# Clean up backup
rm -f contracts/src/RiseConfig.sol.backup
