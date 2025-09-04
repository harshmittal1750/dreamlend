#!/usr/bin/env node

/**
 * Update RiseConfig.sol with deployed token addresses
 * Usage: node update-rise-config.js <usdc-address> <usdt-address> <wbtc-address>
 */

const fs = require("fs");
const path = require("path");

// Check arguments
if (process.argv.length !== 5) {
  console.error(
    "Usage: node update-rise-config.js <usdc-address> <usdt-address> <wbtc-address>"
  );
  process.exit(1);
}

const [, , usdcAddress, usdtAddress, wbtcAddress] = process.argv;

// Validate addresses
const addressRegex = /^0x[a-fA-F0-9]{40}$/i; // Case insensitive
if (
  !addressRegex.test(usdcAddress) ||
  !addressRegex.test(usdtAddress) ||
  !addressRegex.test(wbtcAddress)
) {
  console.error(
    "Error: All addresses must be valid Ethereum addresses (0x followed by 40 hex characters)"
  );
  process.exit(1);
}

// Addresses should already be checksummed by cast in the shell script
const checksummedUSDC = usdcAddress;
const checksummedUSDT = usdtAddress;
const checksummedWBTC = wbtcAddress;

const configPath = path.join(__dirname, "../contracts/src/RiseConfig.sol");

try {
  // Read the current config file
  let content = fs.readFileSync(configPath, "utf8");

  // Create backup
  fs.writeFileSync(configPath + ".backup", content);

  // Update token addresses with checksummed addresses
  content = content.replace(
    /address public constant USDC_TOKEN = address\(0\);.*$/m,
    `address public constant USDC_TOKEN = ${checksummedUSDC};`
  );

  content = content.replace(
    /address public constant USDT_TOKEN = address\(0\);.*$/m,
    `address public constant USDT_TOKEN = ${checksummedUSDT};`
  );

  content = content.replace(
    /address public constant BTC_TOKEN = address\(0\);.*$/m,
    `address public constant BTC_TOKEN = ${checksummedWBTC};`
  );

  // Write the updated content
  fs.writeFileSync(configPath, content);

  console.log("✅ RiseConfig.sol updated successfully!");
  console.log("📍 Token addresses (checksummed):");
  console.log(`   USDC: ${checksummedUSDC}`);
  console.log(`   USDT: ${checksummedUSDT}`);
  console.log(`   WBTC: ${checksummedWBTC}`);
  console.log("💾 Backup created at:", configPath + ".backup");
} catch (error) {
  console.error("❌ Error updating RiseConfig.sol:", error.message);
  process.exit(1);
}
