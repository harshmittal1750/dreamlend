#!/bin/bash

# Setup script for DreamLend environment variables

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

print_status "🚀 DreamLend Environment Setup"
echo "=================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    print_warning ".env file already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled. Your existing .env file is unchanged."
        exit 0
    fi
    echo ""
fi

# Get private key
print_status "Please enter your wallet private key for deployment:"
print_warning "⚠️  This will be stored locally in .env file (which is git-ignored for security)"
echo ""
read -p "Private Key (without 0x prefix): " -s PRIVATE_KEY
echo ""

# Validate private key format (basic check)
if [ ${#PRIVATE_KEY} -ne 64 ]; then
    print_error "Invalid private key length. Should be 64 characters (32 bytes hex)."
    exit 1
fi

# Get Etherscan API key (optional)
echo ""
print_status "Etherscan API key for contract verification (optional - press Enter to skip):"
read -p "Etherscan API Key: " ETHERSCAN_API_KEY

# Create .env file
print_status "Creating .env file..."

cat > .env << EOF
# Environment Variables for DreamLend Multi-Chain Deployment
# Generated on $(date)

# ============ DEPLOYMENT CONFIGURATION ============
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=$PRIVATE_KEY

# Etherscan API key for contract verification (optional but recommended)
ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY

# ============ SOMNIA TESTNET CONTRACTS ============
# These will be auto-populated after deployment
NEXT_PUBLIC_SOMNIA_DREAMLEND_CONTRACT_ADDRESS=
NEXT_PUBLIC_SOMNIA_DREAMER_TOKEN_ADDRESS=
NEXT_PUBLIC_SOMNIA_REWARDS_DISTRIBUTOR_ADDRESS=

# Somnia Mock Token Addresses (auto-populated)
NEXT_PUBLIC_SOMNIA_MOCK_USDT_ADDRESS=
NEXT_PUBLIC_SOMNIA_MOCK_USDC_ADDRESS=
NEXT_PUBLIC_SOMNIA_MOCK_WBTC_ADDRESS=
NEXT_PUBLIC_SOMNIA_MOCK_ARB_ADDRESS=
NEXT_PUBLIC_SOMNIA_MOCK_SOL_ADDRESS=

# ============ RISE TESTNET CONTRACTS ============
# These will be auto-populated after deployment
NEXT_PUBLIC_RISE_DREAMLEND_CONTRACT_ADDRESS=
NEXT_PUBLIC_RISE_DREAMER_TOKEN_ADDRESS=
NEXT_PUBLIC_RISE_REWARDS_DISTRIBUTOR_ADDRESS=

# RISE Mock Token Addresses (auto-populated)
NEXT_PUBLIC_RISE_MOCK_USDC_ADDRESS=
NEXT_PUBLIC_RISE_MOCK_USDT_ADDRESS=
NEXT_PUBLIC_RISE_MOCK_WBTC_ADDRESS=

# ============ FRONTEND CONFIGURATION ============
# Reown/WalletConnect Project ID (for wallet connections)
NEXT_PUBLIC_PROJECT_ID=b56e18d47c72ab683b10814fe9495694

# ============ DEVELOPMENT ============
# Next.js environment
NODE_ENV=development
EOF

print_success "✅ .env file created successfully!"
echo ""
print_status "Next steps:"
echo "1. Run: ./scripts/deploy-multi-chain.sh somnia    # Deploy to Somnia testnet"
echo "2. Run: ./scripts/deploy-rise-complete.sh rise    # Deploy to RISE testnet"
echo ""
print_warning "⚠️  Security reminder:"
echo "- Your .env file contains sensitive information"
echo "- It's automatically git-ignored for security"
echo "- Never share your private key with anyone"
echo "- Use a separate wallet for testnet deployments"
echo ""
print_success "🎉 Setup complete! You can now deploy to both testnets."
