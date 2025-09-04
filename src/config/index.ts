import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { supportedNetworks } from "./chains";

// Get projectId from https://cloud.reown.com
export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694"; // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Export all supported networks (Somnia and RISE testnets)
export const networks = supportedNetworks;

export const ethersAdapter = new EthersAdapter();
