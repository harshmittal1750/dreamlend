// DreamLend Multi-Chain Contract Configuration
// This file maintains backwards compatibility while supporting multiple chains

import { SOMNIA_TESTNET_CHAIN_ID } from "@/config/chains";
import {
  getDreamLendAddress,
  getDreamerTokenAddress,
  getRewardsDistributorAddress,
} from "@/config/contracts";

// Backwards compatibility: Default to Somnia testnet addresses
export const DREAMLEND_CONTRACT_ADDRESS: string = getDreamLendAddress(
  SOMNIA_TESTNET_CHAIN_ID
);
export const DREAMER_TOKEN_ADDRESS: string = getDreamerTokenAddress(
  SOMNIA_TESTNET_CHAIN_ID
);
export const REWARDS_DISTRIBUTOR_ADDRESS: string = getRewardsDistributorAddress(
  SOMNIA_TESTNET_CHAIN_ID
);

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
    name: "activeLoanOfferIds",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "borrowerLoans",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
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
    name: "getActiveLoanOffersCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLenderLoansPaginated",
    inputs: [
      { name: "lender", type: "address", internalType: "address" },
      { name: "startIndex", type: "uint256", internalType: "uint256" },
      { name: "count", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBorrowerLoansPaginated",
    inputs: [
      { name: "borrower", type: "address", internalType: "address" },
      { name: "startIndex", type: "uint256", internalType: "uint256" },
      { name: "count", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLenderLoansCount",
    inputs: [{ name: "lender", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBorrowerLoansCount",
    inputs: [{ name: "borrower", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "LIQUIDATION_FEE_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBorrowerLoans",
    inputs: [{ name: "borrower", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLenderLoans",
    inputs: [{ name: "lender", type: "address", internalType: "address" }],
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
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lenderLoans",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
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
    name: "loans",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "lender", type: "address", internalType: "address" },
      { name: "borrower", type: "address", internalType: "address" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "interestRate", type: "uint256", internalType: "uint256" },
      { name: "duration", type: "uint256", internalType: "uint256" },
      { name: "collateralAddress", type: "address", internalType: "address" },
      { name: "collateralAmount", type: "uint256", internalType: "uint256" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      {
        name: "status",
        type: "uint8",
        internalType: "enum DreamLend.LoanStatus",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextLoanId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
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
    ],
    anonymous: false,
  },
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
        name: "collateralClaimed",
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
    name: "LoanOfferCancelled",
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
    name: "LoanOfferRemoved",
    inputs: [
      {
        name: "loanId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string",
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
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
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
] as const;

// DreamerToken ABI
export const DREAMER_TOKEN_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// RewardsDistributor ABI
export const REWARDS_DISTRIBUTOR_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_dreamToken", type: "address", internalType: "address" },
      { name: "_dreamLendContract", type: "address", internalType: "address" },
      { name: "_rewardsPerSecond", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRewards",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPendingRewards",
    inputs: [{ name: "_user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentRewardsAPR",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserRewardInfo",
    inputs: [{ name: "_user", type: "address", internalType: "address" }],
    outputs: [
      { name: "activePrincipal", type: "uint256", internalType: "uint256" },
      { name: "pendingRewards", type: "uint256", internalType: "uint256" },
      { name: "lastUpdate", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGlobalRewardStats",
    inputs: [],
    outputs: [
      { name: "totalPrincipal", type: "uint256", internalType: "uint256" },
      { name: "currentAPR", type: "uint256", internalType: "uint256" },
      { name: "totalDistributed", type: "uint256", internalType: "uint256" },
      { name: "contractBalance", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userActivePrincipal",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalActivePrincipal",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardsPerSecond",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardsPaused",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "RewardsClaimed",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
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
    name: "RewardsUpdated",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "rewards",
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

// Import chain configurations from the new multi-chain system
export {
  somniaTestnet as SOMNIA_TESTNET_CONFIG,
  riseTestnet as RISE_TESTNET_CONFIG,
} from "@/config/chains";

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
}

export interface CreateLoanOfferParams {
  tokenAddress: string;
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  collateralAddress: string;
  collateralAmount: bigint;
}
