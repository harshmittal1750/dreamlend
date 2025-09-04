# 🚀 Multi-Chain Deployment Guide

This guide covers the complete deployment process for DreamLend on both Somnia and RISE testnets.

## ⚠️ Critical Issues Fixed

### Previous Issues:

1. **RISE token setup problem**: Fake placeholder addresses caused deployment failures
2. **Missing token deployment**: No tokens available for lending on RISE
3. **Oracle setup mismatch**: Oracles set up with invalid token addresses
4. **ETH token handling**: Native ETH (address(0)) handling issues

### Solutions Implemented:

1. **Two-phase RISE deployment**: Deploy tokens first, then main contracts
2. **Automatic address updates**: Scripts update configuration files with real addresses
3. **Proper oracle mapping**: Oracles mapped to actual deployed token addresses
4. **Chain-specific handling**: Different flows for Somnia vs RISE

## 📋 Deployment Overview

### Somnia Testnet (Chain ID: 50312)

- ✅ **Single-step deployment** with mock tokens
- ✅ **DIA Oracle integration** (Chainlink-compatible)
- ✅ **Automatic oracle configuration**

### RISE Testnet (Chain ID: 11155931)

- ✅ **Two-step deployment** (tokens first, then contracts)
- ✅ **Internal Oracle integration** (latest_answer function)
- ✅ **Manual configuration update** between steps

## 🛠️ Prerequisites

```bash
# Required tools
- Foundry (forge, cast)
- jq (for JSON parsing)
- Node.js (for frontend updates)

# Environment variables
PRIVATE_KEY=0x...                    # Deployer private key
ETHERSCAN_API_KEY=...               # For contract verification (optional)
```

## 🔄 Deployment Flows

### Option 1: Deploy to Somnia Testnet

```bash
# Simple one-step deployment
./scripts/deploy-multi-chain.sh somnia
```

**What happens:**

1. Deploys mock tokens (MUSDT, MUSDC, MWBTC, MARB, MSOL)
2. Deploys core contracts (DreamLend, DreamerToken, RewardsDistributor)
3. Sets up oracles with DIA adapters
4. Configures rewards system
5. Updates frontend configuration

### Option 2: Deploy to RISE Testnet

```bash
# Two-step deployment (recommended)
./scripts/deploy-rise-complete.sh rise
```

**What happens:**

1. **Phase 1**: Deploy mock tokens (USDC, USDT, WBTC)
2. **Phase 2**: Update RiseConfig.sol with real addresses
3. **Phase 3**: Deploy core contracts with correct token addresses
4. **Phase 4**: Set up oracles with RISE internal oracles
5. **Phase 5**: Update frontend configuration

### Option 3: Deploy to All Chains

```bash
# Deploy to both chains (use with caution)
./scripts/deploy-multi-chain.sh somnia
./scripts/deploy-rise-complete.sh rise
```

## 📁 File Structure

```
contracts/
├── script/
│   ├── DeployMultiChain.s.sol      # Main deployment script
│   └── DeployRiseTokens.s.sol      # RISE token deployment
├── src/
│   ├── DreamLend.sol               # Main lending contract
│   ├── ChainConfig.sol             # Multi-chain configuration
│   ├── SomniaConfig.sol            # Somnia-specific config
│   ├── RiseConfig.sol              # RISE-specific config
│   └── IRiseOracle.sol             # RISE oracle interface
└── ...

scripts/
├── deploy-multi-chain.sh           # Original deployment script
└── deploy-rise-complete.sh         # Fixed RISE deployment script
```

## 🔧 Configuration Files

### Chain-Specific Configurations

**Somnia Testnet:**

```solidity
// SomniaConfig.sol
DIA_ORACLE_V2 = 0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D
USDT_PRICE_FEED = 0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e
// ... other DIA adapters
```

**RISE Testnet:**

```solidity
// RiseConfig.sol
ETH_ORACLE = 0x7114E2537851e727678DE5a96C8eE5d0Ca14f03D
USDC_ORACLE = 0x50524C5bDa18aE25C600a8b81449B9CeAeB50471
// ... other internal oracles
```

### Frontend Configuration

**Multi-chain contract addresses:**

```typescript
// src/config/contracts.ts
export const CONTRACT_ADDRESSES: Record<ChainId, ChainContracts> = {
  [SOMNIA_TESTNET_CHAIN_ID]: {
    dreamLend: process.env.NEXT_PUBLIC_SOMNIA_DREAMLEND_CONTRACT_ADDRESS,
    // ...
  },
  [RISE_TESTNET_CHAIN_ID]: {
    dreamLend: process.env.NEXT_PUBLIC_RISE_DREAMLEND_CONTRACT_ADDRESS,
    // ...
  },
};
```

## 🧪 Testing Deployment

### Verify Somnia Deployment

```bash
# Check contract on Somnia explorer
https://explorer.testnet.somnia.network/address/YOUR_CONTRACT_ADDRESS

# Test with cast
cast call $DREAMLEND_ADDRESS "getSupportedTokens()" --rpc-url https://dream-rpc.somnia.network
```

### Verify RISE Deployment

```bash
# Check contract on RISE explorer
https://explorer.testnet.riselabs.xyz/address/YOUR_CONTRACT_ADDRESS

# Test with cast
cast call $DREAMLEND_ADDRESS "getSupportedTokens()" --rpc-url https://testnet.riselabs.xyz
```

## 🚨 Troubleshooting

### Common Issues

**1. "Unsupported chain" error**

- Solution: Ensure you're deploying to correct chain ID (50312 for Somnia, 11155931 for RISE)

**2. "Oracle not set for token" error**

- Solution: For RISE, run the complete deployment script that updates token addresses

**3. "Invalid token address" error**

- Solution: Check that RiseConfig.sol has real token addresses, not placeholder addresses

**4. Frontend shows "Unknown Chain"**

- Solution: Update src/config/chains.ts with your deployed contract addresses

### Recovery Steps

**If RISE deployment fails:**

```bash
# Restore backup configuration
cd contracts
cp src/RiseConfig.sol.backup src/RiseConfig.sol

# Start over with token deployment
forge script script/DeployRiseTokens.s.sol:DeployRiseTokens --rpc-url https://testnet.riselabs.xyz --broadcast
```

## 📝 Post-Deployment Checklist

### Somnia Testnet

- [ ] Contracts deployed and verified
- [ ] Mock tokens have correct oracle mappings
- [ ] Rewards system configured
- [ ] Frontend shows correct addresses
- [ ] Test loan creation works

### RISE Testnet

- [ ] Tokens deployed first
- [ ] RiseConfig.sol updated with real addresses
- [ ] Main contracts deployed successfully
- [ ] Oracle mappings configured
- [ ] Frontend updated with all addresses
- [ ] Test loan creation works

### Both Chains

- [ ] Update src/config/tokens-multichain.ts with deployed addresses
- [ ] Test chain switching in frontend
- [ ] Verify cross-chain functionality
- [ ] Document all deployed addresses

## 🔗 Useful Links

**Somnia Testnet:**

- Explorer: https://explorer.testnet.somnia.network
- RPC: https://dream-rpc.somnia.network
- Faucet: https://faucet.somnia.network

**RISE Testnet:**

- Explorer: https://explorer.testnet.riselabs.xyz
- RPC: https://testnet.riselabs.xyz
- Faucet: https://faucet.testnet.riselabs.xyz
- Bridge: https://bridge-ui.testnet.riselabs.xyz

## 💡 Best Practices

1. **Always test on one chain first** before deploying to multiple chains
2. **Keep deployment artifacts** for future reference and upgrades
3. **Use environment variables** for sensitive information
4. **Verify contracts** on block explorers for transparency
5. **Document all addresses** in your .env and configuration files
6. **Test functionality** before announcing deployment

---

For questions or issues, check the deployment logs and contract verification status on the respective block explorers.
