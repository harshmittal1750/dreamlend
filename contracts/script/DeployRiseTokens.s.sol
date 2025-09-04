// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MockTokens.sol";

/**
 * @title DeployRiseTokens
 * @dev Deploy mock tokens for RISE testnet before deploying DreamLend
 * @notice This should be run BEFORE the main deployment on RISE testnet
 */
contract DeployRiseTokens is Script {
    // Mock tokens for RISE testnet
    MockUSDC public mockUSDC;
    MockUSDT public mockUSDT;
    MockWBTC public mockWBTC;

    function run() external {
        console.log("=== RISE Testnet Token Deployment ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);

        require(
            block.chainid == 11155931,
            "This script is only for RISE testnet (Chain ID: 11155931)"
        );

        vm.startBroadcast();

        // Deploy mock tokens
        console.log("\n=== Deploying Mock Tokens for RISE ===");

        mockUSDC = new MockUSDC();
        mockUSDT = new MockUSDT();
        mockWBTC = new MockWBTC();

        console.log("Mock USDC deployed at:", address(mockUSDC));
        console.log("Mock USDT deployed at:", address(mockUSDT));
        console.log("Mock WBTC deployed at:", address(mockWBTC));

        vm.stopBroadcast();

        // Generate environment variables
        console.log("\n=== Update RiseConfig.sol with these addresses ===");
        console.log("USDC_TOKEN =", vm.toString(address(mockUSDC)));
        console.log("USDT_TOKEN =", vm.toString(address(mockUSDT)));
        console.log("BTC_TOKEN =", vm.toString(address(mockWBTC)));

        console.log("\n=== Environment Variables ===");
        console.log(
            "NEXT_PUBLIC_RISE_MOCK_USDC_ADDRESS=",
            vm.toString(address(mockUSDC))
        );
        console.log(
            "NEXT_PUBLIC_RISE_MOCK_USDT_ADDRESS=",
            vm.toString(address(mockUSDT))
        );
        console.log(
            "NEXT_PUBLIC_RISE_MOCK_WBTC_ADDRESS=",
            vm.toString(address(mockWBTC))
        );
    }
}
