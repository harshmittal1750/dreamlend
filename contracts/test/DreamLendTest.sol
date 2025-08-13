// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {DreamLend} from "../src/DreamLend.sol";

/**
 * @title DreamLend Test Suite
 * @dev Basic test suite for DreamLend contract functionality
 */
contract DreamLendTest is Test {
    DreamLend public dreamLend;
    
    address public lender = address(0x1);
    address public borrower = address(0x2);
    address public tokenAddress = address(0x3);
    address public collateralAddress = address(0x4);

    function setUp() public {
        dreamLend = new DreamLend();
    }

    function test_Deployment() public {
        // Test that the contract deploys successfully
        assertTrue(address(dreamLend) != address(0));
        assertEq(dreamLend.nextLoanId(), 1);
    }

    function test_GetActiveLoanOffers() public {
        // Test that initially there are no active loan offers
        uint256[] memory activeOffers = dreamLend.getActiveLoanOffers();
        assertEq(activeOffers.length, 0);
    }

    function test_GetEmptyLenderLoans() public {
        // Test that a new address has no loans
        uint256[] memory lenderLoans = dreamLend.getLenderLoans(lender);
        assertEq(lenderLoans.length, 0);
    }

    function test_GetEmptyBorrowerLoans() public {
        // Test that a new address has no loans
        uint256[] memory borrowerLoans = dreamLend.getBorrowerLoans(borrower);
        assertEq(borrowerLoans.length, 0);
    }

    function test_GetNonexistentLoan() public {
        // Test getting a loan that doesn't exist returns empty struct
        DreamLend.Loan memory loan = dreamLend.getLoan(999);
        assertEq(loan.id, 0);
        assertEq(loan.lender, address(0));
        assertEq(loan.borrower, address(0));
    }
}
