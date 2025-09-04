import { defineChain } from "viem";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Chain configurations
export const SOMNIA_TESTNET_CHAIN_ID = 50312;
export const RISE_TESTNET_CHAIN_ID = 11155931;

// Somnia L1 Testnet Configuration
export const somniaTestnet = defineChain({
  id: SOMNIA_TESTNET_CHAIN_ID,
  name: "Somnia Testnet",
  network: "somnia-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Somnia",
    symbol: "STT",
  },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network"],
    },
    public: {
      http: ["https://dream-rpc.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://explorer.testnet.somnia.network",
    },
  },
  testnet: true,
});

// RISE Testnet Configuration
export const riseTestnet = defineChain({
  id: RISE_TESTNET_CHAIN_ID,
  name: "RISE Testnet",
  network: "rise-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.riselabs.xyz"],
    },
    public: {
      http: ["https://testnet.riselabs.xyz"],
      webSocket: ["wss://testnet.riselabs.xyz/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "RISE Explorer",
      url: "https://explorer.testnet.riselabs.xyz",
    },
  },
  testnet: true,
});

// AppKit Network configurations
export const somniaAppKitNetwork: AppKitNetwork = {
  id: somniaTestnet.id,
  name: somniaTestnet.name,
  nativeCurrency: somniaTestnet.nativeCurrency,
  rpcUrls: somniaTestnet.rpcUrls,
  blockExplorers: somniaTestnet.blockExplorers,
  testnet: somniaTestnet.testnet,
};

export const riseAppKitNetwork: AppKitNetwork = {
  id: riseTestnet.id,
  name: riseTestnet.name,
  nativeCurrency: riseTestnet.nativeCurrency,
  rpcUrls: riseTestnet.rpcUrls,
  blockExplorers: riseTestnet.blockExplorers,
  testnet: riseTestnet.testnet,
};

// Supported networks array
export const supportedNetworks = [somniaAppKitNetwork, riseAppKitNetwork] as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

// Chain utilities
export function getChainById(chainId: number) {
  switch (chainId) {
    case SOMNIA_TESTNET_CHAIN_ID:
      return somniaTestnet;
    case RISE_TESTNET_CHAIN_ID:
      return riseTestnet;
    default:
      return null;
  }
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case SOMNIA_TESTNET_CHAIN_ID:
      return "Somnia Testnet";
    case RISE_TESTNET_CHAIN_ID:
      return "RISE Testnet";
    default:
      return "Unknown Chain";
  }
}

export function isChainSupported(chainId: number): boolean {
  return (
    chainId === SOMNIA_TESTNET_CHAIN_ID || chainId === RISE_TESTNET_CHAIN_ID
  );
}

// Chain-specific URLs
export const CHAIN_URLS = {
  [SOMNIA_TESTNET_CHAIN_ID]: {
    rpc: "https://dream-rpc.somnia.network",
    explorer: "https://explorer.testnet.somnia.network",
    faucet: "https://faucet.somnia.network", // Update with actual faucet URL
  },
  [RISE_TESTNET_CHAIN_ID]: {
    rpc: "https://testnet.riselabs.xyz",
    explorer: "https://explorer.testnet.riselabs.xyz",
    faucet: "https://faucet.testnet.riselabs.xyz",
    bridge: "https://bridge-ui.testnet.riselabs.xyz",
    portal: "https://portal.testnet.riselabs.xyz",
    status: "https://status.testnet.risechain.com",
  },
} as const;

export type ChainId =
  | typeof SOMNIA_TESTNET_CHAIN_ID
  | typeof RISE_TESTNET_CHAIN_ID;
