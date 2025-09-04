import {
  SOMNIA_TESTNET_CHAIN_ID,
  RISE_TESTNET_CHAIN_ID,
  type ChainId,
} from "./chains";

// Contract addresses per chain
export interface ChainContracts {
  dreamLend: string;
  dreamerToken: string;
  rewardsDistributor: string;
}

// Default contract addresses - UPDATE THESE AFTER DEPLOYMENT
export const CONTRACT_ADDRESSES: Record<ChainId, ChainContracts> = {
  [SOMNIA_TESTNET_CHAIN_ID]: {
    dreamLend:
      process.env.NEXT_PUBLIC_SOMNIA_DREAMLEND_CONTRACT_ADDRESS ??
      "0x1A5792aa31Ec98589742159067b4F28A2E24DB6c", // Current Somnia address
    dreamerToken:
      process.env.NEXT_PUBLIC_SOMNIA_DREAMER_TOKEN_ADDRESS ??
      "0x0000000000000000000000000000000000000000",
    rewardsDistributor:
      process.env.NEXT_PUBLIC_SOMNIA_REWARDS_DISTRIBUTOR_ADDRESS ??
      "0x0000000000000000000000000000000000000000",
  },
  [RISE_TESTNET_CHAIN_ID]: {
    dreamLend:
      process.env.NEXT_PUBLIC_RISE_DREAMLEND_CONTRACT_ADDRESS ??
      "0x0000000000000000000000000000000000000000", // UPDATE AFTER DEPLOYMENT
    dreamerToken:
      process.env.NEXT_PUBLIC_RISE_DREAMER_TOKEN_ADDRESS ??
      "0x0000000000000000000000000000000000000000",
    rewardsDistributor:
      process.env.NEXT_PUBLIC_RISE_REWARDS_DISTRIBUTOR_ADDRESS ??
      "0x0000000000000000000000000000000000000000",
  },
};

// Get contract addresses for a specific chain
export function getContractAddresses(chainId: ChainId): ChainContracts {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`Contract addresses not configured for chain ${chainId}`);
  }
  return addresses;
}

// Get DreamLend contract address for current chain
export function getDreamLendAddress(chainId: ChainId): string {
  return getContractAddresses(chainId).dreamLend;
}

// Get DreamerToken contract address for current chain
export function getDreamerTokenAddress(chainId: ChainId): string {
  return getContractAddresses(chainId).dreamerToken;
}

// Get RewardsDistributor contract address for current chain
export function getRewardsDistributorAddress(chainId: ChainId): string {
  return getContractAddresses(chainId).rewardsDistributor;
}

// Check if contracts are deployed on a chain
export function areContractsDeployed(chainId: ChainId): boolean {
  const addresses = getContractAddresses(chainId);
  return (
    addresses.dreamLend !== "0x0000000000000000000000000000000000000000" &&
    addresses.dreamerToken !== "0x0000000000000000000000000000000000000000" &&
    addresses.rewardsDistributor !==
      "0x0000000000000000000000000000000000000000"
  );
}

// Contract ABIs (shared across all chains)
export const DREAMLEND_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "acceptLoanOffer",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelLoanOffer",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "calculateCurrentInterest",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateTotalRepayment",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isLoanDefaulted",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "loanExists",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createLoanOffer",
    inputs: [
      { name: "_tokenAddress", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      { name: "_interestRate", type: "uint256", internalType: "uint256" },
      { name: "_duration", type: "uint256", internalType: "uint256" },
      { name: "_collateralAddress", type: "address", internalType: "address" },
      { name: "_collateralAmount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getActiveLoanOffers",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveLoanOffersPaginated",
    inputs: [
      { name: "startIndex", type: "uint256", internalType: "uint256" },
      { name: "count", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLoan",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DreamLend.Loan",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "lender", type: "address", internalType: "address" },
          { name: "borrower", type: "address", internalType: "address" },
          { name: "tokenAddress", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "interestRate", type: "uint256", internalType: "uint256" },
          { name: "duration", type: "uint256", internalType: "uint256" },
          {
            name: "collateralAddress",
            type: "address",
            internalType: "address",
          },
          {
            name: "collateralAmount",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum DreamLend.LoanStatus",
          },
          {
            name: "minCollateralRatioBPS",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "liquidationThresholdBPS",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "maxPriceStaleness",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "repayLoan",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "liquidateLoan",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getSupportedTokens",
    inputs: [],
    outputs: [{ name: "tokens", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isLoanPairSupported",
    inputs: [
      { name: "loanAsset", type: "address", internalType: "address" },
      { name: "collateralAsset", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "supported", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecommendedParameters",
    inputs: [
      { name: "loanAsset", type: "address", internalType: "address" },
      { name: "collateralAsset", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "minRatio", type: "uint256", internalType: "uint256" },
      {
        name: "liquidationThreshold",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "maxStaleness", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLoanHealthFactor",
    inputs: [{ name: "loanId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "currentRatio", type: "uint256", internalType: "uint256" },
      { name: "priceStale", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "LoanCreated",
    inputs: [
      {
        name: "loanId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "lender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "interestRate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "duration",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "collateralAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "minCollateralRatioBPS",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "liquidationThresholdBPS",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "maxPriceStaleness",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LoanAccepted",
    inputs: [
      {
        name: "loanId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "borrower",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "initialCollateralRatio",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LoanRepaid",
    inputs: [
      {
        name: "loanId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "borrower",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "repaymentAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LoanLiquidated",
    inputs: [
      {
        name: "loanId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "liquidator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "collateralClaimedByLender",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "liquidatorReward",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// Standard ERC20 ABI for token approvals
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

// Loan Status Enum
export enum LoanStatus {
  Pending = 0,
  Active = 1,
  Repaid = 2,
  Defaulted = 3,
  Cancelled = 4,
}

// Type definitions
export interface Loan {
  id: bigint;
  lender: string;
  borrower: string;
  tokenAddress: string;
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  collateralAddress: string;
  collateralAmount: bigint;
  startTime: bigint;
  status: LoanStatus;
  minCollateralRatioBPS: bigint;
  liquidationThresholdBPS: bigint;
  maxPriceStaleness: bigint;
}

export interface CreateLoanOfferParams {
  tokenAddress: string;
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  collateralAddress: string;
  collateralAmount: bigint;
}
