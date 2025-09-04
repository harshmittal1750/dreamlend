#!/bin/bash

# Multi-chain deployment script for DreamLend
# Supports deployment to Somnia and RISE testnets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v forge &> /dev/null; then
        print_error "Foundry (forge) is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Function to load environment variables
load_env() {
    if [ -f .env ]; then
        print_status "Loading environment variables from .env file..."
        set -a
        source .env
        set +a
    fi
}

# Function to deploy to a specific chain
deploy_to_chain() {
    local chain_name=$1
    local chain_id=$2
    local rpc_url=$3
    local account_name=$4
    local sender_address=$5
    
    print_status "Deploying to $chain_name (Chain ID: $chain_id)..."
    print_status "Using account: $account_name, sender: $sender_address"
    
    # Change to contracts directory
    cd contracts
    
    # Deploy contracts
    print_status "Running deployment script..."
    forge script script/DeployMultiChain.s.sol:DeployMultiChain \
        --rpc-url "$rpc_url" \
        --broadcast \
        --account "$account_name" \

    
    if [ $? -eq 0 ]; then
        print_success "Deployment to $chain_name completed successfully!"
    else
        print_error "Deployment to $chain_name failed!"
        return 1
    fi
    
    # Go back to root directory
    cd ..
}

# Function to update frontend configuration
update_frontend_config() {
    local chain_name=$1
    local chain_id=$2
    local broadcast_dir="contracts/broadcast/DeployMultiChain.s.sol/$chain_id"
    
    if [ ! -d "$broadcast_dir" ]; then
        print_warning "Broadcast directory not found for $chain_name. Skipping frontend config update."
        return
    fi
    
    print_status "Updating frontend configuration for $chain_name..."
    
    # Find the latest run file
    local latest_run=$(ls -t "$broadcast_dir"/run-*.json | head -1)
    
    if [ ! -f "$latest_run" ]; then
        print_warning "No deployment artifacts found for $chain_name"
        return
    fi
    
    # Extract contract addresses using jq
    local dreamlend_address=$(jq -r '.transactions[] | select(.contractName == "DreamLend") | .contractAddress' "$latest_run")
    local dreamer_token_address=$(jq -r '.transactions[] | select(.contractName == "DreamerToken") | .contractAddress' "$latest_run")
    local rewards_distributor_address=$(jq -r '.transactions[] | select(.contractName == "RewardsDistributor") | .contractAddress' "$latest_run")
    
    # Update .env file with new addresses
    local chain_prefix
    if [ "$chain_id" = "50312" ]; then
        chain_prefix="SOMNIA"
    elif [ "$chain_id" = "11155931" ]; then
        chain_prefix="RISE"
    else
        print_warning "Unknown chain ID: $chain_id"
        return
    fi
    
    print_status "Updating .env file with $chain_name addresses..."
    
    # Remove existing entries for this chain
    if [ -f .env ]; then
        grep -v "NEXT_PUBLIC_${chain_prefix}_" .env > .env.tmp && mv .env.tmp .env
    fi
    
    # Add new entries
    echo "# $chain_name Contract Addresses" >> .env
    echo "NEXT_PUBLIC_${chain_prefix}_DREAMLEND_CONTRACT_ADDRESS=$dreamlend_address" >> .env
    echo "NEXT_PUBLIC_${chain_prefix}_DREAMER_TOKEN_ADDRESS=$dreamer_token_address" >> .env
    echo "NEXT_PUBLIC_${chain_prefix}_REWARDS_DISTRIBUTOR_ADDRESS=$rewards_distributor_address" >> .env
    echo "" >> .env
    
    print_success "Frontend configuration updated for $chain_name"
    print_status "DreamLend: $dreamlend_address"
    print_status "DreamerToken: $dreamer_token_address"
    print_status "RewardsDistributor: $rewards_distributor_address"
}

# Function to display usage
usage() {
    echo "Usage: $0 [CHAIN] [ACCOUNT_NAME] [SENDER_ADDRESS]"
    echo ""
    echo "Deploy DreamLend contracts to supported testnets using Foundry accounts"
    echo ""
    echo "Arguments:"
    echo "  CHAIN            Target chain (somnia|rise|all)"
    echo "  ACCOUNT_NAME     Foundry account name (e.g., 'develop')"
    echo "  SENDER_ADDRESS   Sender address (e.g., '0xf6eE7B6F0170BE39A344f21241d5AD8b89960407')"
    echo ""
    echo "Chains:"
    echo "  somnia    Deploy to Somnia testnet (Chain ID: 50312)"
    echo "  rise      Deploy to RISE testnet (Chain ID: 11155931)"
    echo "  all       Deploy to all supported chains"
    echo ""
    echo "Examples:"
    echo "  $0 somnia develop 0xf6eE7B6F0170BE39A344f21241d5AD8b89960407"
    echo "  $0 rise develop 0xf6eE7B6F0170BE39A344f21241d5AD8b89960407"
    echo ""
    echo "Environment variables (optional):"
    echo "  ETHERSCAN_API_KEY        API key for contract verification"
    echo ""
    echo "Prerequisites:"
    echo "  1. Set up Foundry account: forge account import <account_name> --private-key <private_key>"
    echo "  2. List accounts: forge account list"
}

# Main deployment function
main() {
    local target_chain="$1"
    local account_name="$2"
    local sender_address="$3"
    
    if [ "$target_chain" = "-h" ] || [ "$target_chain" = "--help" ] || [ -z "$target_chain" ]; then
        usage
        exit 0
    fi
    
    if [ -z "$account_name" ] || [ -z "$sender_address" ]; then
        print_error "Missing required arguments!"
        usage
        exit 1
    fi
    
    print_status "Starting DreamLend multi-chain deployment..."
    print_status "Account: $account_name, Sender: $sender_address"
    
    check_dependencies
    load_env
    
    case $target_chain in
        "somnia")
            deploy_to_chain "Somnia Testnet" "50312" "https://dream-rpc.somnia.network" "$account_name" "$sender_address"
            update_frontend_config "Somnia Testnet" "50312"
            ;;
        "rise")
            deploy_to_chain "RISE Testnet" "11155931" "https://testnet.riselabs.xyz" "$account_name" "$sender_address"
            update_frontend_config "RISE Testnet" "11155931"
            ;;
        "all")
            print_status "Deploying to all supported chains..."
            
            deploy_to_chain "Somnia Testnet" "50312" "https://dream-rpc.somnia.network" "$account_name" "$sender_address"
            update_frontend_config "Somnia Testnet" "50312"
            
            deploy_to_chain "RISE Testnet" "11155931" "https://testnet.riselabs.xyz" "$account_name" "$sender_address"
            update_frontend_config "RISE Testnet" "11155931"
            ;;
        *)
            print_error "Unknown chain: $target_chain"
            usage
            exit 1
            ;;
    esac
    
    print_success "Multi-chain deployment completed!"
    print_status "Don't forget to update your token addresses in the chain-specific configurations"
    print_status "Check the generated .env entries and verify they're correct"
}

# Run main function with all arguments
main "$@"
