// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DreamLend.sol";
import "../src/DreamerToken.sol";
import "../src/RewardsDistributor.sol";
import "../src/MockTokens.sol";
import "../src/ChainConfig.sol";

/**
 * @title DeployMultiChain
 * @dev Deployment script that works across multiple chains (Somnia and RISE testnets)
 * @notice Automatically detects chain and deploys appropriate contracts with chain-specific configurations
 */
contract DeployMultiChain is Script {
    // Deployment addresses will be logged
    DreamLend public dreamLend;
    DreamerToken public dreamerToken;
    RewardsDistributor public rewardsDistributor;

    // Mock tokens (for testing)
    MockUSDT public mockUSDT;
    MockUSDC public mockUSDC;
    MockWBTC public mockWBTC;
    MockARB public mockARB;
    MockSOL public mockSOL;

    function run() external {
        console.log("=== DreamLend Multi-Chain Deployment ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("Deployer balance:", msg.sender.balance);

        // Validate chain support
        require(
            block.chainid == 50312 || block.chainid == 11155931,
            "Unsupported chain. Only Somnia (50312) and RISE (11155931) testnets are supported"
        );

        string memory chainName = block.chainid == 50312
            ? "Somnia Testnet"
            : "RISE Testnet";
        console.log("Deploying to:", chainName);

        vm.startBroadcast();

        // Step 1: Deploy mock tokens for testing (if needed)
        if (shouldDeployMockTokens()) {
            console.log("\n=== Deploying Mock Tokens ===");
            deployMockTokens();
        }

        // Step 2: Deploy DreamerToken (rewards token)
        console.log("\n=== Deploying DreamerToken ===");
        dreamerToken = new DreamerToken();
        console.log("DreamerToken deployed at:", address(dreamerToken));

        // Step 3: Deploy DreamLend main contract
        console.log("\n=== Deploying DreamLend ===");
        dreamLend = new DreamLend();
        console.log("DreamLend deployed at:", address(dreamLend));

        // Step 4: Deploy RewardsDistributor
        console.log("\n=== Deploying RewardsDistributor ===");
        uint256 rewardsPerSecond = 1e15; // 0.001 DREAM tokens per second
        rewardsDistributor = new RewardsDistributor(
            address(dreamerToken),
            address(dreamLend),
            rewardsPerSecond
        );
        console.log(
            "RewardsDistributor deployed at:",
            address(rewardsDistributor)
        );

        // Step 5: Setup rewards system
        console.log("\n=== Setting up Rewards System ===");
        dreamLend.setRewardsDistributor(address(rewardsDistributor));
        console.log("RewardsDistributor set in DreamLend");

        // Step 6: Update token oracles if mock tokens were deployed
        if (shouldDeployMockTokens() && address(mockUSDT) != address(0)) {
            console.log(
                "\n=== Updating Token Oracles with Mock Token Addresses ==="
            );
            updateTokenOracles();
        }

        // Step 7: Transfer DREAM tokens to rewards distributor for distribution
        uint256 rewardsSupply = 1000000 * 1e18; // 1M DREAM tokens for rewards
        dreamerToken.transfer(address(rewardsDistributor), rewardsSupply);
        console.log(
            "Transferred",
            rewardsSupply / 1e18,
            "DREAM tokens to RewardsDistributor"
        );

        vm.stopBroadcast();

        // Step 7: Verify supported tokens are configured correctly
        console.log("\n=== Verifying Chain Configuration ===");
        verifySupportedTokens();

        // Step 8: Log deployment summary
        console.log("\n=== Deployment Summary ===");
        logDeploymentSummary();

        // Step 9: Generate environment variables
        console.log("\n=== Environment Variables ===");
        generateEnvVars();
    }

    function shouldDeployMockTokens() internal view returns (bool) {
        // Deploy mock tokens on Somnia testnet for testing
        // On RISE testnet, assume real tokens exist or will be deployed separately
        return block.chainid == 50312; // Somnia testnet
    }

    function deployMockTokens() internal {
        console.log("Deploying mock tokens...");

        // Deploy individual mock tokens
        mockUSDT = new MockUSDT();
        mockUSDC = new MockUSDC();
        mockWBTC = new MockWBTC();
        mockARB = new MockARB();
        mockSOL = new MockSOL();

        console.log("Mock USDT deployed at:", address(mockUSDT));
        console.log("Mock USDC deployed at:", address(mockUSDC));
        console.log("Mock WBTC deployed at:", address(mockWBTC));
        console.log("Mock ARB deployed at:", address(mockARB));
        console.log("Mock SOL deployed at:", address(mockSOL));

        // Update token oracles in DreamLend contract (after DreamLend is deployed)
        // This will be done in a separate step after DreamLend deployment
    }

    function updateTokenOracles() internal {
        // Only update on Somnia testnet where we have mock tokens
        if (block.chainid == 50312) {
            console.log("Updating token oracles with mock token addresses...");

            // Get oracle addresses from SomniaConfig
            address usdtOracle = 0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e;
            address usdcOracle = 0x235266D5ca6f19F134421C49834C108b32C2124e;
            address btcOracle = 0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21;
            address arbOracle = 0x74952812B6a9e4f826b2969C6D189c4425CBc19B;
            address solOracle = 0xD5Ea6C434582F827303423dA21729bEa4F87D519;

            // Set token oracles for mock tokens
            dreamLend.setTokenOracle(address(mockUSDT), usdtOracle);
            dreamLend.setTokenOracle(address(mockUSDC), usdcOracle);
            dreamLend.setTokenOracle(address(mockWBTC), btcOracle);
            dreamLend.setTokenOracle(address(mockARB), arbOracle);
            dreamLend.setTokenOracle(address(mockSOL), solOracle);

            console.log("Token oracles updated successfully");
        }
    }

    function verifySupportedTokens() internal view {
        try dreamLend.getSupportedTokens() returns (address[] memory tokens) {
            console.log("Supported tokens count:", tokens.length);
            for (uint256 i = 0; i < tokens.length; i++) {
                console.log("Token", i, ":", tokens[i]);

                // Verify each token has oracle support
                bool isSupported = dreamLend.isLoanPairSupported(
                    tokens[i],
                    tokens[i]
                );
                console.log("Token", i, "oracle configured:", isSupported);
            }
        } catch {
            console.log(
                "WARNING: Could not verify supported tokens - check chain configuration"
            );
        }
    }

    function logDeploymentSummary() internal view {
        console.log("Chain ID:", block.chainid);
        console.log("DreamLend:", address(dreamLend));
        console.log("DreamerToken:", address(dreamerToken));
        console.log("RewardsDistributor:", address(rewardsDistributor));

        if (shouldDeployMockTokens() && address(mockUSDT) != address(0)) {
            console.log("Mock USDT:", address(mockUSDT));
            console.log("Mock USDC:", address(mockUSDC));
            console.log("Mock WBTC:", address(mockWBTC));
            console.log("Mock ARB:", address(mockARB));
            console.log("Mock SOL:", address(mockSOL));
        }

        console.log("Gas used for deployment: Check transaction receipts");
    }

    function generateEnvVars() internal view {
        string memory chainPrefix = block.chainid == 50312 ? "SOMNIA" : "RISE";

        console.log("# Add these to your .env file:");
        console.log(
            string.concat(
                "NEXT_PUBLIC_",
                chainPrefix,
                "_DREAMLEND_CONTRACT_ADDRESS=",
                vm.toString(address(dreamLend))
            )
        );
        console.log(
            string.concat(
                "NEXT_PUBLIC_",
                chainPrefix,
                "_DREAMER_TOKEN_ADDRESS=",
                vm.toString(address(dreamerToken))
            )
        );
        console.log(
            string.concat(
                "NEXT_PUBLIC_",
                chainPrefix,
                "_REWARDS_DISTRIBUTOR_ADDRESS=",
                vm.toString(address(rewardsDistributor))
            )
        );

        if (shouldDeployMockTokens() && address(mockUSDT) != address(0)) {
            console.log("# Mock token addresses (for testing):");
            console.log(
                string.concat(
                    "NEXT_PUBLIC_",
                    chainPrefix,
                    "_MOCK_USDT_ADDRESS=",
                    vm.toString(address(mockUSDT))
                )
            );
            console.log(
                string.concat(
                    "NEXT_PUBLIC_",
                    chainPrefix,
                    "_MOCK_USDC_ADDRESS=",
                    vm.toString(address(mockUSDC))
                )
            );
            console.log(
                string.concat(
                    "NEXT_PUBLIC_",
                    chainPrefix,
                    "_MOCK_WBTC_ADDRESS=",
                    vm.toString(address(mockWBTC))
                )
            );
            console.log(
                string.concat(
                    "NEXT_PUBLIC_",
                    chainPrefix,
                    "_MOCK_ARB_ADDRESS=",
                    vm.toString(address(mockARB))
                )
            );
            console.log(
                string.concat(
                    "NEXT_PUBLIC_",
                    chainPrefix,
                    "_MOCK_SOL_ADDRESS=",
                    vm.toString(address(mockSOL))
                )
            );
        } else {
            console.log(
                "# Deploy mock tokens separately if needed for testing"
            );
        }
    }
}
