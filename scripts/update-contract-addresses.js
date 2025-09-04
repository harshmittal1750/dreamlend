#!/usr/bin/env node

/**
 * Script to update contract addresses in environment files and frontend config
 * Usage: node scripts/update-contract-addresses.js
 *
 * This script should be run after deploying the rewards system contracts
 * to update the frontend with the correct contract addresses.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// File paths
const ENV_LOCAL_PATH = path.join(__dirname, "..", ".env.local");
const CONTRACTS_TS_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "contracts.ts"
);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to validate Ethereum address
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to update or create .env.local file
function updateEnvFile(addresses) {
  let envContent = "";

  // Read existing .env.local if it exists
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    envContent = fs.readFileSync(ENV_LOCAL_PATH, "utf8");
  }

  // Update or add contract addresses
  const addressEntries = [
    {
      key: "NEXT_PUBLIC_DREAMLEND_CONTRACT_ADDRESS",
      value: addresses.dreamLend,
    },
    { key: "NEXT_PUBLIC_DREAMER_TOKEN_ADDRESS", value: addresses.dreamerToken },
    {
      key: "NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS",
      value: addresses.rewardsDistributor,
    },
  ];

  addressEntries.forEach(({ key, value }) => {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        // Update existing entry
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new entry
        envContent += `\n${key}=${value}`;
      }
    }
  });

  // Write updated content
  fs.writeFileSync(ENV_LOCAL_PATH, envContent.trim() + "\n");
  console.log(`✅ Updated ${ENV_LOCAL_PATH}`);
}

// Helper function to update contracts.ts file
function updateContractsTs(addresses) {
  let content = fs.readFileSync(CONTRACTS_TS_PATH, "utf8");

  // Update contract addresses
  if (addresses.dreamLend) {
    content = content.replace(
      /export const DREAMLEND_CONTRACT_ADDRESS: string =[\s\S]*?"0x[a-fA-F0-9]{40}";/,
      `export const DREAMLEND_CONTRACT_ADDRESS: string =
  process.env.NEXT_PUBLIC_DREAMLEND_CONTRACT_ADDRESS ??
  "${addresses.dreamLend}";`
    );
  }

  if (addresses.dreamerToken) {
    content = content.replace(
      /export const DREAMER_TOKEN_ADDRESS: string =[\s\S]*?"0x[a-fA-F0-9]{40}";/,
      `export const DREAMER_TOKEN_ADDRESS: string =
  process.env.NEXT_PUBLIC_DREAMER_TOKEN_ADDRESS ??
  "${addresses.dreamerToken}";`
    );
  }

  if (addresses.rewardsDistributor) {
    content = content.replace(
      /export const REWARDS_DISTRIBUTOR_ADDRESS: string =[\s\S]*?"0x[a-fA-F0-9]{40}";/,
      `export const REWARDS_DISTRIBUTOR_ADDRESS: string =
  process.env.NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS ??
  "${addresses.rewardsDistributor}";`
    );
  }

  fs.writeFileSync(CONTRACTS_TS_PATH, content);
  console.log(`✅ Updated ${CONTRACTS_TS_PATH}`);
}

// Main function
async function main() {
  console.log("🚀 DreamLend Contract Address Updater");
  console.log("=====================================\n");

  console.log("This script will update your contract addresses in:");
  console.log(`- ${ENV_LOCAL_PATH}`);
  console.log(`- ${CONTRACTS_TS_PATH}\n`);

  const addresses = {};

  // Get DreamLend contract address
  const dreamLendAddress = await askQuestion(
    "Enter DreamLend contract address (or press Enter to skip): "
  );
  if (dreamLendAddress && isValidEthereumAddress(dreamLendAddress)) {
    addresses.dreamLend = dreamLendAddress;
  } else if (dreamLendAddress) {
    console.log("❌ Invalid Ethereum address for DreamLend contract");
  }

  // Get DreamerToken contract address
  const dreamerTokenAddress = await askQuestion(
    "Enter DreamerToken contract address: "
  );
  if (isValidEthereumAddress(dreamerTokenAddress)) {
    addresses.dreamerToken = dreamerTokenAddress;
  } else {
    console.log("❌ Invalid Ethereum address for DreamerToken contract");
    rl.close();
    return;
  }

  // Get RewardsDistributor contract address
  const rewardsDistributorAddress = await askQuestion(
    "Enter RewardsDistributor contract address: "
  );
  if (isValidEthereumAddress(rewardsDistributorAddress)) {
    addresses.rewardsDistributor = rewardsDistributorAddress;
  } else {
    console.log("❌ Invalid Ethereum address for RewardsDistributor contract");
    rl.close();
    return;
  }

  // Confirm addresses
  console.log("\n📝 Contract Addresses to Update:");
  if (addresses.dreamLend) {
    console.log(`DreamLend:         ${addresses.dreamLend}`);
  }
  console.log(`DreamerToken:      ${addresses.dreamerToken}`);
  console.log(`RewardsDistributor: ${addresses.rewardsDistributor}`);

  const confirm = await askQuestion(
    "\nProceed with updating these addresses? (y/N): "
  );

  if (confirm.toLowerCase() === "y" || confirm.toLowerCase() === "yes") {
    try {
      // Update files
      updateEnvFile(addresses);
      updateContractsTs(addresses);

      console.log("\n🎉 Successfully updated contract addresses!");
      console.log("\nNext steps:");
      console.log("1. Restart your development server");
      console.log("2. Test the rewards functionality");
      console.log("3. Deploy to production with the updated addresses");
    } catch (error) {
      console.error("\n❌ Error updating files:", error.message);
    }
  } else {
    console.log("\n❌ Update cancelled");
  }

  rl.close();
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
}

module.exports = { updateEnvFile, updateContractsTs };
