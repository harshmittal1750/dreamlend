// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./SomniaConfig.sol";
import "./RiseConfig.sol";
import "./IRiseOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title ChainConfig
 * @dev Multi-chain configuration library that supports both Somnia and RISE testnets
 * @notice Automatically detects chain and provides appropriate oracle and token configurations
 */
library ChainConfig {
    // Chain IDs
    uint256 public constant SOMNIA_TESTNET_CHAIN_ID = 50312;
    uint256 public constant RISE_TESTNET_CHAIN_ID = 11155931;

    enum SupportedChain {
        SOMNIA_TESTNET,
        RISE_TESTNET
    }

    /**
     * @notice Get current chain type based on chain ID
     */
    function getCurrentChain() internal view returns (SupportedChain) {
        if (block.chainid == SOMNIA_TESTNET_CHAIN_ID) {
            return SupportedChain.SOMNIA_TESTNET;
        } else if (block.chainid == RISE_TESTNET_CHAIN_ID) {
            return SupportedChain.RISE_TESTNET;
        } else {
            revert("Unsupported chain");
        }
    }

    /**
     * @notice Get recommended parameters for asset pair on current chain
     */
    function getRecommendedRatios(
        address loanAsset,
        address collateralAsset
    ) internal view returns (uint256 minRatio, uint256 liquidationThreshold) {
        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            return
                SomniaConfig.getRecommendedRatios(loanAsset, collateralAsset);
        } else if (chain == SupportedChain.RISE_TESTNET) {
            return RiseConfig.getRecommendedRatios(loanAsset, collateralAsset);
        }

        revert("Unsupported chain for ratio calculation");
    }

    /**
     * @notice Get recommended staleness threshold for asset on current chain
     */
    function getRecommendedStaleness(
        address asset
    ) internal view returns (uint256) {
        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            return SomniaConfig.getRecommendedStaleness(asset);
        } else if (chain == SupportedChain.RISE_TESTNET) {
            return RiseConfig.getRecommendedStaleness(asset);
        }

        revert("Unsupported chain for staleness calculation");
    }

    /**
     * @notice Check if token is supported on current chain
     */
    function isTokenSupported(address token) internal view returns (bool) {
        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            return SomniaConfig.isTokenSupported(token);
        } else if (chain == SupportedChain.RISE_TESTNET) {
            return RiseConfig.isTokenSupported(token);
        }

        return false;
    }

    /**
     * @notice Get oracle/price feed address for token on current chain
     */
    function getOracleAddress(address token) internal view returns (address) {
        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            return SomniaConfig.getPriceFeed(token);
        } else if (chain == SupportedChain.RISE_TESTNET) {
            return RiseConfig.getOracleAddress(token);
        }

        return address(0);
    }

    /**
     * @notice Get latest price from oracle (handles both Chainlink and RISE oracle formats)
     * @param oracleAddress The oracle contract address
     * @param maxStaleness Maximum allowed staleness in seconds
     * @return price The latest price
     * @return isStale Whether the price is stale
     */
    function getLatestPrice(
        address oracleAddress,
        uint256 maxStaleness
    ) internal view returns (uint256 price, bool isStale) {
        require(oracleAddress != address(0), "Invalid oracle address");

        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            // Use Chainlink AggregatorV3Interface
            AggregatorV3Interface feed = AggregatorV3Interface(oracleAddress);
            (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();

            require(answer > 0, "Invalid price from Chainlink oracle");
            require(updatedAt > 0, "Invalid timestamp from Chainlink oracle");

            if (block.timestamp - updatedAt > maxStaleness) {
                isStale = true;
            }

            price = uint256(answer);
        } else if (chain == SupportedChain.RISE_TESTNET) {
            // Use RISE internal oracle interface
            IRiseOracle oracle = IRiseOracle(oracleAddress);
            int256 answer = oracle.latest_answer();

            require(answer > 0, "Invalid price from RISE oracle");

            // Note: RISE oracles don't provide timestamp, so we assume they're always fresh
            // In production, you might want to implement additional staleness checks
            isStale = false;
            price = uint256(answer);
        } else {
            revert("Unsupported chain for price fetching");
        }
    }

    /**
     * @notice Get oracle decimals (handles both Chainlink and RISE oracle formats)
     * @param oracleAddress The oracle contract address
     * @return decimals Number of decimals for the price
     */
    function getOracleDecimals(
        address oracleAddress
    ) internal view returns (uint8) {
        require(oracleAddress != address(0), "Invalid oracle address");

        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            AggregatorV3Interface feed = AggregatorV3Interface(oracleAddress);
            return feed.decimals();
        } else if (chain == SupportedChain.RISE_TESTNET) {
            IRiseOracle oracle = IRiseOracle(oracleAddress);
            return oracle.decimals();
        } else {
            revert("Unsupported chain for decimals fetching");
        }
    }

    /**
     * @notice Get all supported tokens for current chain
     */
    function getSupportedTokens()
        internal
        view
        returns (address[] memory tokens, address[] memory oracles)
    {
        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            return SomniaConfig.getSupportedTokens();
        } else if (chain == SupportedChain.RISE_TESTNET) {
            return RiseConfig.getSupportedTokens();
        }

        // Return empty arrays for unsupported chains
        tokens = new address[](0);
        oracles = new address[](0);
    }

    /**
     * @notice Get chain-specific default parameters
     */
    function getDefaultParameters()
        internal
        view
        returns (
            uint256 minCollateralRatio,
            uint256 liquidationThreshold,
            uint256 maxPriceStaleness
        )
    {
        SupportedChain chain = getCurrentChain();

        if (chain == SupportedChain.SOMNIA_TESTNET) {
            return (
                SomniaConfig.DEFAULT_MIN_COLLATERAL_RATIO,
                SomniaConfig.DEFAULT_LIQUIDATION_THRESHOLD,
                SomniaConfig.DEFAULT_MAX_PRICE_STALENESS
            );
        } else if (chain == SupportedChain.RISE_TESTNET) {
            return (
                RiseConfig.DEFAULT_MIN_COLLATERAL_RATIO,
                RiseConfig.DEFAULT_LIQUIDATION_THRESHOLD,
                RiseConfig.DEFAULT_MAX_PRICE_STALENESS
            );
        }

        revert("Unsupported chain for default parameters");
    }
}
