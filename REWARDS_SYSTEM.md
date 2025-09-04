# DreamLend Liquidity Mining Rewards System

This document provides a comprehensive overview of the DreamLend liquidity mining rewards system, including smart contracts, deployment, and usage instructions.

## Overview

The DreamLend rewards system incentivizes both lenders and borrowers to participate in the protocol by distributing **$DREAM** tokens as rewards. Users earn rewards proportionally to their active loan principal amounts while their loans are in the `Active` status.

## Architecture

### Smart Contracts

#### 1. DreamerToken.sol

- **Purpose**: The native governance/reward token for the DreamLend protocol
- **Standard**: ERC20
- **Name**: Dreamer Token
- **Symbol**: $DREAM
- **Decimals**: 18
- **Total Supply**: 100,000,000 tokens (fixed supply)
- **Key Features**:
  - Mints entire supply to deployer on creation
  - Owner functions for managing token distribution
  - Emergency recovery functions

#### 2. RewardsDistributor.sol

- **Purpose**: Manages the distribution of $DREAM tokens as liquidity mining rewards
- **Key Features**:
  - Real-time rewards calculation
  - Proportional distribution based on active principal
  - Emergency pause functionality
  - Owner controls for emission rate adjustment
- **Emission Rate**: Configurable (default: 1 DREAM per second)

#### 3. Modified DreamLend.sol

- **Integration Points**:
  - `acceptLoanOffer()`: Starts rewards for both lender and borrower
  - `repayLoan()`: Stops rewards before status change
  - `liquidateLoan()`: Stops rewards before status change
  - `setRewardsDistributor()`: Owner function to connect rewards system

### Reward Mechanics

1. **Eligibility**: Both lenders and borrowers earn rewards while loans are `Active`
2. **Distribution**: Rewards are distributed proportionally based on active principal amounts
3. **Accrual**: Rewards accrue in real-time (per second)
4. **Claiming**: Users can claim their accrued rewards at any time
5. **Formula**: `user_rewards = (time_elapsed * emission_rate * user_principal) / total_principal`

## Deployment Guide

### Prerequisites

- Foundry installed
- Access to Somnia L1 testnet
- Private key with sufficient SOM tokens for deployment

### Step 1: Deploy Contracts

```bash
# Navigate to contracts directory
cd contracts

# Deploy the complete rewards system
forge script script/DeployRewardsSystem.s.sol \
  --rpc-url https://dream-rpc.somnia.network \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Step 2: Update Frontend Configuration

```bash
# Run the contract address updater script
node scripts/update-contract-addresses.js
```

Enter the deployed contract addresses when prompted:

- DreamerToken address
- RewardsDistributor address
- DreamLend address (if newly deployed)

### Step 3: Verify Deployment

```bash
# Run the test suite to verify functionality
cd contracts
forge test --match-contract RewardsSystemTest -vvv
```

## Frontend Integration

### New Components

#### RewardsDisplay.tsx

- Shows user's pending rewards
- Displays DREAM token balance
- Shows current rewards APR
- Provides claim rewards functionality
- Shows user's participation statistics

#### LoanOfferCard.tsx

- Enhanced loan cards showing:
  - Base interest APR
  - Rewards APR
  - Total APR (interest + rewards)
  - Liquidity mining information

#### useRewards.ts Hook

- Manages rewards-related state and functions
- Handles reward claiming transactions
- Provides formatted reward data
- Calculates estimated daily rewards

### Updated Pages

#### Dashboard (/dashboard)

- Prominently displays the RewardsDisplay component
- Shows comprehensive rewards information

#### Navigation

- Small rewards indicator in header
- Shows pending rewards amount
- Visual indicator for claimable rewards

## Usage Instructions

### For Users

#### Earning Rewards

1. **As a Lender**:

   - Create loan offers through the "Create" page
   - Earn rewards when borrowers accept your offers
   - Rewards accrue while loans are active

2. **As a Borrower**:
   - Browse and accept loan offers on the "Offers" page
   - Earn rewards while your borrowed loans are active
   - Continue earning until loan repayment or liquidation

#### Claiming Rewards

1. Navigate to the Dashboard
2. View your pending rewards in the Rewards Display section
3. Click "Claim Rewards" when you have pending rewards
4. Confirm the transaction in your wallet
5. DREAM tokens will be transferred to your wallet

#### Monitoring Rewards

- **Dashboard**: Comprehensive rewards overview
- **Navigation**: Quick view of pending rewards
- **Loan Cards**: See total APR including rewards

### For Developers

#### Key Configuration Variables

```typescript
// Contract addresses (update after deployment)
export const DREAMER_TOKEN_ADDRESS = "0x...";
export const REWARDS_DISTRIBUTOR_ADDRESS = "0x...";

// Rewards emission rate (in RewardsDistributor constructor)
const INITIAL_REWARDS_PER_SECOND = 1e18; // 1 DREAM per second
```

#### Environment Variables

```bash
# Add to .env.local
NEXT_PUBLIC_DREAMER_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS=0x...
NEXT_PUBLIC_DREAMLEND_CONTRACT_ADDRESS=0x...
```

## Testing

### Smart Contract Tests

```bash
cd contracts

# Run all rewards system tests
forge test --match-contract RewardsSystemTest

# Run specific test
forge test --match-test testRewardsAccrual -vvv

# Generate coverage report
forge coverage --match-contract RewardsSystemTest
```

### Test Scenarios Covered

1. **Basic Functionality**:

   - Contract deployment and initialization
   - Rewards accrual for lenders and borrowers
   - Rewards claiming mechanism
   - Rewards stop on loan completion/liquidation

2. **Edge Cases**:

   - Multiple loans with different amounts
   - Rewards distribution with varying participation
   - Paused rewards system
   - Insufficient DREAM tokens in distributor

3. **Owner Functions**:
   - Emission rate adjustments
   - Emergency pause/unpause
   - Contract address updates

### Frontend Testing

```bash
# Run frontend tests
npm test

# Run specific rewards tests
npm test -- --testNamePattern="rewards"
```

## Security Considerations

### Smart Contract Security

1. **Access Control**:

   - Only DreamLend contract can start/stop rewards
   - Owner-only functions for critical operations
   - Emergency pause functionality

2. **Reentrancy Protection**:

   - ReentrancyGuard on claim functions
   - State updates before external calls

3. **Precision Handling**:

   - 18-decimal precision for reward calculations
   - Safe math operations throughout

4. **Emergency Functions**:
   - Owner can pause rewards distribution
   - Emergency token recovery functions

### Frontend Security

1. **Input Validation**:

   - Address format validation
   - Amount bounds checking
   - Transaction confirmation

2. **Error Handling**:
   - Graceful handling of contract errors
   - User-friendly error messages
   - Retry mechanisms for failed transactions

## Monitoring and Analytics

### Key Metrics to Track

1. **Protocol Metrics**:

   - Total active principal
   - Current rewards APR
   - Total rewards distributed
   - Number of active reward earners

2. **User Metrics**:

   - Individual user rewards earned
   - Claim frequency and amounts
   - Participation rates

3. **Token Metrics**:
   - DREAM token distribution
   - Token holder count
   - Circulating supply

### Monitoring Tools

```bash
# Check global reward stats
cast call $REWARDS_DISTRIBUTOR_ADDRESS "getGlobalRewardStats()" --rpc-url https://dream-rpc.somnia.network

# Check user rewards
cast call $REWARDS_DISTRIBUTOR_ADDRESS "getPendingRewards(address)" $USER_ADDRESS --rpc-url https://dream-rpc.somnia.network
```

## Troubleshooting

### Common Issues

1. **Rewards Not Accruing**:

   - Check if rewards system is paused
   - Verify loan is in Active status
   - Confirm RewardsDistributor has sufficient DREAM tokens

2. **Cannot Claim Rewards**:

   - Ensure user has pending rewards > 0
   - Check if rewards system is paused
   - Verify RewardsDistributor has sufficient DREAM balance

3. **Incorrect APR Display**:
   - Verify contract addresses are correct
   - Check if rewards system is properly connected to DreamLend
   - Ensure frontend is using latest contract ABIs

### Debug Commands

```bash
# Check contract connections
cast call $DREAMLEND_ADDRESS "rewardsDistributor()" --rpc-url https://dream-rpc.somnia.network

# Check rewards system status
cast call $REWARDS_DISTRIBUTOR_ADDRESS "rewardsPaused()" --rpc-url https://dream-rpc.somnia.network

# Check emission rate
cast call $REWARDS_DISTRIBUTOR_ADDRESS "rewardsPerSecond()" --rpc-url https://dream-rpc.somnia.network
```

## Future Enhancements

### Planned Features

1. **Advanced Reward Mechanics**:

   - Time-based multipliers
   - Loyalty bonuses for long-term participants
   - Penalty reductions for early repayment

2. **Governance Integration**:

   - DREAM token voting rights
   - Community-driven emission rate adjustments
   - Protocol upgrade proposals

3. **Analytics Dashboard**:

   - Detailed reward analytics
   - Historical reward data
   - Yield farming strategies

4. **Cross-Chain Support**:
   - Multi-chain reward distribution
   - Cross-chain DREAM token bridge
   - Unified rewards across networks

## Support

For technical support or questions about the rewards system:

1. Check the troubleshooting section above
2. Review the smart contract tests for usage examples
3. Join the DreamLend Discord community
4. Submit issues on the GitHub repository

---

**Note**: This rewards system is designed for the Somnia L1 testnet. Always thoroughly test before deploying to mainnet environments.
