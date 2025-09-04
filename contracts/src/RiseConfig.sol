// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title RiseConfig
 * @dev Configuration contract for RISE Testnet internal oracle integration
 * @notice Contains all supported token addresses and their internal oracle addresses
 */
library RiseConfig {
    // ============ RISE Testnet Configuration ============

    // Internal Oracle Addresses (using latest_answer function)
    address public constant ETH_ORACLE =
        0x7114E2537851e727678DE5a96C8eE5d0Ca14f03D;
    address public constant USDC_ORACLE =
        0x50524C5bDa18aE25C600a8b81449B9CeAeB50471;
    address public constant USDT_ORACLE =
        0x9190159b1bb78482Dca6EBaDf03ab744de0c0197;
    address public constant BTC_ORACLE =
        0xadDAEd879D549E5DBfaf3e35470C20D8C50fDed0;

    // Token addresses - UPDATE WITH ACTUAL DEPLOYED TOKEN ADDRESSES AFTER DEPLOYMENT
    address public constant ETH_TOKEN = address(0); // Native ETH
    address public constant USDC_TOKEN = 0xBD9ef863d9dc65F14F1ECbe1863e7EB24E1cbEaA;
    address public constant USDT_TOKEN = 0x66620dB10C16b3dcde34f51901E9104b0DDC1b28;
    address public constant BTC_TOKEN = 0x5F0a9D31D7e48c914c9FaD63Da2CfF01c149D751;

    // Default oracle parameters for RISE testnet
    uint256 public constant DEFAULT_MIN_COLLATERAL_RATIO = 15000; // 150%
    uint256 public constant DEFAULT_LIQUIDATION_THRESHOLD = 12000; // 120%
    uint256 public constant DEFAULT_MAX_PRICE_STALENESS = 86400; // 1 day TESTNET ONLY
    uint256 public constant AGGRESSIVE_MAX_PRICE_STALENESS = 86400; // 1 day for volatile assets TESTNET ONLY

    // Asset volatility tiers for different staleness requirements
    enum VolatilityTier {
        STABLE, // USDT, USDC
        MODERATE, // ETH (considered moderate in this context)
        HIGH // BTC
    }

    /**
     * @notice Get recommended collateral ratio for asset pair
     * @param loanAsset The asset being borrowed
     * @param collateralAsset The asset being used as collateral
     * @return minRatio Minimum collateral ratio in basis points
     * @return liquidationThreshold Liquidation threshold in basis points
     */
    function getRecommendedRatios(
        address loanAsset,
        address collateralAsset
    ) internal pure returns (uint256 minRatio, uint256 liquidationThreshold) {
        VolatilityTier loanTier = getAssetVolatilityTier(loanAsset);
        VolatilityTier collateralTier = getAssetVolatilityTier(collateralAsset);

        // Base ratios
        minRatio = DEFAULT_MIN_COLLATERAL_RATIO;
        liquidationThreshold = DEFAULT_LIQUIDATION_THRESHOLD;

        // Adjust for volatility - higher volatility = higher ratios
        if (collateralTier == VolatilityTier.HIGH) {
            minRatio += 3000; // +30%
            liquidationThreshold += 2000; // +20%
        } else if (collateralTier == VolatilityTier.MODERATE) {
            minRatio += 1500; // +15%
            liquidationThreshold += 1000; // +10%
        }

        if (loanTier == VolatilityTier.HIGH) {
            minRatio += 1500; // +15%
            liquidationThreshold += 1000; // +10%
        }
    }

    /**
     * @notice Get asset volatility tier
     */
    function getAssetVolatilityTier(
        address asset
    ) internal pure returns (VolatilityTier) {
        if (asset == USDT_TOKEN || asset == USDC_TOKEN) {
            return VolatilityTier.STABLE;
        } else if (asset == ETH_TOKEN || asset == address(0)) {
            return VolatilityTier.MODERATE;
        } else if (asset == BTC_TOKEN) {
            return VolatilityTier.HIGH;
        }

        // Default to high volatility for unknown assets
        return VolatilityTier.HIGH;
    }

    /**
     * @notice Get recommended staleness threshold for asset
     */
    function getRecommendedStaleness(
        address asset
    ) internal pure returns (uint256) {
        VolatilityTier tier = getAssetVolatilityTier(asset);

        if (tier == VolatilityTier.HIGH) {
            return AGGRESSIVE_MAX_PRICE_STALENESS;
        }

        return DEFAULT_MAX_PRICE_STALENESS;
    }

    /**
     * @notice Get oracle address for a token
     */
    function getOracleAddress(address token) internal pure returns (address) {
        if (token == ETH_TOKEN || token == address(0)) return ETH_ORACLE;
        if (token == USDC_TOKEN) return USDC_ORACLE;
        if (token == USDT_TOKEN) return USDT_ORACLE;
        if (token == BTC_TOKEN) return BTC_ORACLE;

        return address(0); // Unsupported token
    }

    /**
     * @notice Check if token is supported
     */
    function isTokenSupported(address token) internal pure returns (bool) {
        return getOracleAddress(token) != address(0);
    }

    /**
     * @notice Get all supported tokens
     */
    function getSupportedTokens()
        internal
        pure
        returns (address[] memory tokens, address[] memory oracles)
    {
        tokens = new address[](4);
        oracles = new address[](4);

        tokens[0] = ETH_TOKEN;
        tokens[1] = USDC_TOKEN;
        tokens[2] = USDT_TOKEN;
        tokens[3] = BTC_TOKEN;

        oracles[0] = ETH_ORACLE;
        oracles[1] = USDC_ORACLE;
        oracles[2] = USDT_ORACLE;
        oracles[3] = BTC_ORACLE;
    }
}
