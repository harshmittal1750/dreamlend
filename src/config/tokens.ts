// Somnia L1 Testnet - Supported Tokens Configuration
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  description: string;
  category: "stablecoin" | "crypto" | "defi";
  volatilityTier: "stable" | "moderate" | "high";
  priceFeedAddress: string;
}

// DIA Oracle Addresses on Somnia Testnet
export const SOMNIA_TESTNET_CONFIG = {
  diaOracleV2: "0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D",
  chainId: 50312,
  rpcUrl: "https://dream-rpc.somnia.network",
} as const;

// ⚠️  IMPORTANT: TOKEN ADDRESSES BELOW ARE PLACEHOLDERS ⚠️
// These addresses MUST be replaced with actual Somnia testnet token addresses before production use.
// The addresses below match the SomniaConfig.sol placeholders for consistency.

// Supported Tokens on Somnia Testnet
export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  USDT: {
    address: "0x0ED782B8079529f7385c3eDA9fAf1EaA0DbC6a17", // PLACEHOLDER - Replace with actual USDT address
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6, // USDT typically has 6 decimals
    description: "Stablecoin pegged to USD",
    category: "stablecoin",
    volatilityTier: "stable",
    priceFeedAddress: "0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e",
  },
  USDC: {
    address: "0x0ED782B8079529f7385c3eDA9fAf1EaA0DbC6a17", // PLACEHOLDER - Replace with actual USDC address
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6, // USDC typically has 6 decimals
    description: "Stablecoin backed by USD reserves",
    category: "stablecoin",
    volatilityTier: "stable",
    priceFeedAddress: "0x235266D5ca6f19F134421C49834C108b32C2124e",
  },
  BTC: {
    address: "0xE3233Ee6E373Be04277a435facc262E7A9c46151", // PLACEHOLDER - Replace with actual WBTC address
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8, // WBTC typically has 8 decimals
    description: "Tokenized Bitcoin on Ethereum",
    category: "crypto",
    volatilityTier: "high",
    priceFeedAddress: "0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21",
  },
  ARB: {
    address: "0x0000000000000000000000000000000000000000", // UNASSIGNED PLACEHOLDER
    name: "Arbitrum",
    symbol: "ARB",
    decimals: 18, // ARB has 18 decimals
    description: "Arbitrum ecosystem token",
    category: "defi",
    volatilityTier: "moderate",
    priceFeedAddress: "0x74952812B6a9e4f826b2969C6D189c4425CBc19B",
  },
  SOL: {
    address: "0xb35a7935F8fbc52fB525F16Af09329b3794E8C42", // PLACEHOLDER - Replace with actual SOL address
    name: "Solana",
    symbol: "SOL",
    decimals: 18, // For EVM compatibility, using 18 decimals (native SOL uses 9, but wrapped versions often use 18)
    description: "Solana blockchain native token",
    category: "crypto",
    volatilityTier: "high",
    priceFeedAddress: "0xD5Ea6C434582F827303423dA21729bEa4F87D519",
  },
} as const;

// Get token by address
export function getTokenByAddress(address: string): TokenInfo | undefined {
  return Object.values(SUPPORTED_TOKENS).find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
}

// Get token by symbol
export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return SUPPORTED_TOKENS[symbol.toUpperCase()];
}

// Get all supported tokens as array
export function getAllSupportedTokens(): TokenInfo[] {
  return Object.values(SUPPORTED_TOKENS);
}

// Default collateralization parameters based on asset volatility
export const DEFAULT_PARAMETERS = {
  stable: {
    minCollateralRatio: 15000, // 150%
    liquidationThreshold: 12000, // 120%
    maxPriceStaleness: 3600, // 1 hour
  },
  moderate: {
    minCollateralRatio: 16500, // 165%
    liquidationThreshold: 13000, // 130%
    maxPriceStaleness: 3600, // 1 hour
  },
  high: {
    minCollateralRatio: 18000, // 180%
    liquidationThreshold: 14000, // 140%
    maxPriceStaleness: 1800, // 30 minutes
  },
} as const;

// Get recommended parameters for asset pair
export function getRecommendedParameters(
  loanAsset: TokenInfo,
  collateralAsset: TokenInfo
) {
  const loanParams = DEFAULT_PARAMETERS[loanAsset.volatilityTier];
  const collateralParams = DEFAULT_PARAMETERS[collateralAsset.volatilityTier];

  // Use more conservative parameters
  return {
    minCollateralRatio: Math.max(
      loanParams.minCollateralRatio,
      collateralParams.minCollateralRatio
    ),
    liquidationThreshold: Math.max(
      loanParams.liquidationThreshold,
      collateralParams.liquidationThreshold
    ),
    maxPriceStaleness: Math.min(
      loanParams.maxPriceStaleness,
      collateralParams.maxPriceStaleness
    ),
  };
}

// Token selection categories for UI
export const TOKEN_CATEGORIES = {
  stablecoin: {
    name: "Stablecoins",
    description: "Low volatility, USD-pegged assets",
    tokens: Object.values(SUPPORTED_TOKENS).filter(
      (t) => t.category === "stablecoin"
    ),
  },
  crypto: {
    name: "Cryptocurrencies",
    description: "Major blockchain native tokens",
    tokens: Object.values(SUPPORTED_TOKENS).filter(
      (t) => t.category === "crypto"
    ),
  },
  defi: {
    name: "DeFi Tokens",
    description: "Decentralized finance protocol tokens",
    tokens: Object.values(SUPPORTED_TOKENS).filter(
      (t) => t.category === "defi"
    ),
  },
} as const;

// Risk level colors for UI
export const RISK_COLORS = {
  stable: "text-green-600 bg-green-50 border-green-200",
  moderate: "text-yellow-600 bg-yellow-50 border-yellow-200",
  high: "text-red-600 bg-red-50 border-red-200",
} as const;

// Format basis points to percentage
export function formatBasisPoints(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

// Convert percentage to basis points (for contract calls)
export function percentageToBasisPoints(percentage: number): number {
  return Math.round(percentage * 100);
}

// Convert basis points to percentage (for display)
export function basisPointsToPercentage(bps: number): number {
  return bps / 100;
}

// Format duration in seconds to human readable
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}
