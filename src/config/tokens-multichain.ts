import {
  SOMNIA_TESTNET_CHAIN_ID,
  RISE_TESTNET_CHAIN_ID,
  type ChainId,
} from "./chains";

// Token information interface
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  description: string;
  category: "stablecoin" | "crypto" | "defi";
  volatilityTier: "stable" | "moderate" | "high";
  oracleAddress: string;
}

// Chain-specific token configurations
export const CHAIN_TOKENS: Record<ChainId, Record<string, TokenInfo>> = {
  [SOMNIA_TESTNET_CHAIN_ID]: {
    MUSDT: {
      address: "0x5C99fEb638C1959144696a77CC900c58A4B4EB6F", // UPDATE WITH DEPLOYED MockUSDT ADDRESS
      name: "Mock Tether USD",
      symbol: "MUSDT",
      decimals: 6,
      description: "Mock stablecoin for testing (pegged to USD)",
      category: "stablecoin",
      volatilityTier: "stable",
      oracleAddress: "0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e", // DIA USDT oracle adapter
    },
    MUSDC: {
      address: "0x571D9915eA4D187b7f0b1460fd0432D7Cce74c47", // UPDATE WITH DEPLOYED MockUSDC ADDRESS
      name: "Mock USD Coin",
      symbol: "MUSDC",
      decimals: 6,
      description: "Mock stablecoin for testing (backed by USD reserves)",
      category: "stablecoin",
      volatilityTier: "stable",
      oracleAddress: "0x235266D5ca6f19F134421C49834C108b32C2124e", // DIA USDC oracle adapter
    },
    MWBTC: {
      address: "0xE218717fE38D582B8C00a8D6363f5BC7BF32a8B6", // UPDATE WITH DEPLOYED MockWBTC ADDRESS
      name: "Mock Wrapped Bitcoin",
      symbol: "MWBTC",
      decimals: 8,
      description: "Mock tokenized Bitcoin for testing",
      category: "crypto",
      volatilityTier: "high",
      oracleAddress: "0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21", // DIA BTC oracle adapter
    },
    MARB: {
      address: "0x9c15F281BFC66D2FA26686aE2E297eD5d7f61ee1", // UPDATE WITH DEPLOYED MockARB ADDRESS
      name: "Mock Arbitrum",
      symbol: "MARB",
      decimals: 18,
      description: "Mock Arbitrum ecosystem token for testing",
      category: "defi",
      volatilityTier: "moderate",
      oracleAddress: "0x74952812B6a9e4f826b2969C6D189c4425CBc19B", // DIA ARB oracle adapter
    },
    MSOL: {
      address: "0x71264e1321E1980b32002EAF6b24759DfBA5E281", // UPDATE WITH DEPLOYED MockSOL ADDRESS
      name: "Mock Solana",
      symbol: "MSOL",
      decimals: 18,
      description: "Mock Solana blockchain native token for testing",
      category: "crypto",
      volatilityTier: "high",
      oracleAddress: "0xD5Ea6C434582F827303423dA21729bEa4F87D519", // DIA SOL oracle adapter
    },
  },
  [RISE_TESTNET_CHAIN_ID]: {
    ETH: {
      address: "0x0000000000000000000000000000000000000000", // Native ETH
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      description: "Native Ethereum on RISE testnet",
      category: "crypto",
      volatilityTier: "moderate",
      oracleAddress: "0x7114E2537851e727678DE5a96C8eE5d0Ca14f03D", // RISE ETH oracle
    },
    USDC: {
      address: "0x1000000000000000000000000000000000000001", // UPDATE WITH DEPLOYED USDC ADDRESS
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      description: "USD Coin stablecoin on RISE testnet",
      category: "stablecoin",
      volatilityTier: "stable",
      oracleAddress: "0x50524C5bDa18aE25C600a8b81449B9CeAeB50471", // RISE USDC oracle
    },
    USDT: {
      address: "0x1000000000000000000000000000000000000002", // UPDATE WITH DEPLOYED USDT ADDRESS
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      description: "Tether USD stablecoin on RISE testnet",
      category: "stablecoin",
      volatilityTier: "stable",
      oracleAddress: "0x9190159b1bb78482Dca6EBaDf03ab744de0c0197", // RISE USDT oracle
    },
    WBTC: {
      address: "0x1000000000000000000000000000000000000003", // UPDATE WITH DEPLOYED WBTC ADDRESS
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      description: "Wrapped Bitcoin on RISE testnet",
      category: "crypto",
      volatilityTier: "high",
      oracleAddress: "0xadDAEd879D549E5DBfaf3e35470C20D8C50fDed0", // RISE BTC oracle
    },
  },
};

// Get tokens for a specific chain
export function getChainTokens(chainId: ChainId): Record<string, TokenInfo> {
  const tokens = CHAIN_TOKENS[chainId];
  if (!tokens) {
    throw new Error(`Tokens not configured for chain ${chainId}`);
  }
  return tokens;
}

// Get token by address for a specific chain
export function getTokenByAddress(
  chainId: ChainId,
  address: string
): TokenInfo | undefined {
  const tokens = getChainTokens(chainId);
  return Object.values(tokens).find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
}

// Get token by symbol for a specific chain
export function getTokenBySymbol(
  chainId: ChainId,
  symbol: string
): TokenInfo | undefined {
  const tokens = getChainTokens(chainId);
  return tokens[symbol.toUpperCase()];
}

// Get all supported tokens as array for a specific chain
export function getAllSupportedTokens(chainId: ChainId): TokenInfo[] {
  const tokens = getChainTokens(chainId);
  return Object.values(tokens);
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
export function getTokenCategories(chainId: ChainId) {
  const tokens = getAllSupportedTokens(chainId);

  return {
    stablecoin: {
      name: "Stablecoins",
      description: "Low volatility, USD-pegged assets",
      tokens: tokens.filter((t) => t.category === "stablecoin"),
    },
    crypto: {
      name: "Cryptocurrencies",
      description: "Major blockchain native tokens",
      tokens: tokens.filter((t) => t.category === "crypto"),
    },
    defi: {
      name: "DeFi Tokens",
      description: "Decentralized finance protocol tokens",
      tokens: tokens.filter((t) => t.category === "defi"),
    },
  };
}

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

// Get oracle address for a token on a specific chain
export function getOracleAddress(
  chainId: ChainId,
  tokenAddress: string
): string | undefined {
  const token = getTokenByAddress(chainId, tokenAddress);
  return token?.oracleAddress;
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

// Check if a token pair is supported on a chain
export function isTokenPairSupported(
  chainId: ChainId,
  loanTokenAddress: string,
  collateralTokenAddress: string
): boolean {
  const loanToken = getTokenByAddress(chainId, loanTokenAddress);
  const collateralToken = getTokenByAddress(chainId, collateralTokenAddress);
  return !!(loanToken && collateralToken);
}

// Get chain-specific oracle configuration
export function getChainOracleConfig(chainId: ChainId) {
  if (chainId === SOMNIA_TESTNET_CHAIN_ID) {
    return {
      type: "chainlink", // Uses Chainlink-compatible DIA adapters
      diaOracleV2: "0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D",
      rpcUrl: "https://dream-rpc.somnia.network",
    };
  } else if (chainId === RISE_TESTNET_CHAIN_ID) {
    return {
      type: "rise", // Uses RISE internal oracles with latest_answer function
      rpcUrl: "https://testnet.riselabs.xyz",
    };
  }

  throw new Error(`Oracle configuration not available for chain ${chainId}`);
}
