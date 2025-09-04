// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IRiseOracle
 * @dev Interface for RISE testnet internal oracles
 * @notice RISE oracles use latest_answer function and return decimals
 */
interface IRiseOracle {
    /**
     * @notice Get the latest price answer from the oracle
     * @return The latest price
     */
    function latest_answer() external view returns (int256);

    /**
     * @notice Get the number of decimals for the price
     * @return The number of decimals
     */
    function decimals() external view returns (uint8);
}
