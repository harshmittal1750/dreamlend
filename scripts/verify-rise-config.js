#!/usr/bin/env node

/**
 * Verify that RiseConfig.sol has been properly updated with token addresses
 */

const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../contracts/src/RiseConfig.sol");

try {
  const content = fs.readFileSync(configPath, "utf8");

  // Check for address(0) placeholders
  const usdcMatch = content.match(
    /address public constant USDC_TOKEN = (.*?);/
  );
  const usdtMatch = content.match(
    /address public constant USDT_TOKEN = (.*?);/
  );
  const btcMatch = content.match(/address public constant BTC_TOKEN = (.*?);/);

  console.log("🔍 RiseConfig.sol Token Address Status:");
  console.log("=====================================");

  let hasPlaceholders = false;

  if (usdcMatch) {
    const isPlaceholder = usdcMatch[1].includes("address(0)");
    console.log(
      `USDC_TOKEN: ${usdcMatch[1]} ${isPlaceholder ? "❌ (placeholder)" : "✅ (set)"}`
    );
    if (isPlaceholder) hasPlaceholders = true;
  }

  if (usdtMatch) {
    const isPlaceholder = usdtMatch[1].includes("address(0)");
    console.log(
      `USDT_TOKEN: ${usdtMatch[1]} ${isPlaceholder ? "❌ (placeholder)" : "✅ (set)"}`
    );
    if (isPlaceholder) hasPlaceholders = true;
  }

  if (btcMatch) {
    const isPlaceholder = btcMatch[1].includes("address(0)");
    console.log(
      `BTC_TOKEN:  ${btcMatch[1]} ${isPlaceholder ? "❌ (placeholder)" : "✅ (set)"}`
    );
    if (isPlaceholder) hasPlaceholders = true;
  }

  console.log("=====================================");

  if (hasPlaceholders) {
    console.log("⚠️  WARNING: Some tokens still have placeholder addresses!");
    console.log(
      "   Deploy mock tokens first, then update RiseConfig.sol before deploying DreamLend."
    );
    process.exit(1);
  } else {
    console.log("✅ All token addresses are properly set!");
    console.log("   Ready to deploy DreamLend contracts.");
    process.exit(0);
  }
} catch (error) {
  console.error("❌ Error reading RiseConfig.sol:", error.message);
  process.exit(1);
}
