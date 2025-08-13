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
    MockERC20 public loanToken;
    MockERC20 public collateralToken;
    
    address public lender = address(0x1);
    address public borrower = address(0x2);
    address public liquidator = address(0x3);

    function setUp() public {
        dreamLend = new DreamLend();
        
        // Deploy mock ERC20 tokens
        loanToken = new MockERC20("Loan Token", "LOAN", 18);
        collateralToken = new MockERC20("Collateral Token", "COLL", 18);
        
        // Mint tokens to test addresses
        loanToken.mint(lender, 10000 ether);
        loanToken.mint(borrower, 5000 ether); // Borrower needs tokens for repayment
        collateralToken.mint(borrower, 10000 ether);
        
        // Give some tokens to liquidator for testing
        loanToken.mint(liquidator, 1000 ether);
        collateralToken.mint(liquidator, 1000 ether);
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

    function test_CreateLoanOffer() public {
        // Setup: lender approves tokens
        vm.startPrank(lender);
        loanToken.approve(address(dreamLend), 1000 ether);
        
        // Create loan offer
        dreamLend.createLoanOffer(
            address(loanToken),
            1000 ether,
            1500, // 15% APR
            30 days,
            address(collateralToken),
            1200 ether
        );
        vm.stopPrank();
        
        // Verify loan was created
        DreamLend.Loan memory loan = dreamLend.getLoan(1);
        assertEq(loan.id, 1);
        assertEq(loan.lender, lender);
        assertEq(loan.amount, 1000 ether);
        assertEq(loan.interestRate, 1500);
        assertEq(uint256(loan.status), uint256(DreamLend.LoanStatus.Pending));
        
        // Verify it's in active offers
        uint256[] memory activeOffers = dreamLend.getActiveLoanOffers();
        assertEq(activeOffers.length, 1);
        assertEq(activeOffers[0], 1);
    }

    function test_CancelLoanOffer() public {
        // First create a loan offer
        vm.startPrank(lender);
        loanToken.approve(address(dreamLend), 1000 ether);
        dreamLend.createLoanOffer(
            address(loanToken),
            1000 ether,
            1500,
            30 days,
            address(collateralToken),
            1200 ether
        );
        
        uint256 balanceBefore = loanToken.balanceOf(lender);
        
        // Cancel the loan offer
        dreamLend.cancelLoanOffer(1);
        vm.stopPrank();
        
        // Verify tokens were returned
        uint256 balanceAfter = loanToken.balanceOf(lender);
        assertEq(balanceAfter, balanceBefore + 1000 ether);
        
        // Verify loan status updated
        DreamLend.Loan memory loan = dreamLend.getLoan(1);
        assertEq(uint256(loan.status), uint256(DreamLend.LoanStatus.Defaulted));
        
        // Verify removed from active offers
        uint256[] memory activeOffers = dreamLend.getActiveLoanOffers();
        assertEq(activeOffers.length, 0);
    }

    function test_AcceptLoanOffer() public {
        // Create loan offer
        vm.startPrank(lender);
        loanToken.approve(address(dreamLend), 1000 ether);
        dreamLend.createLoanOffer(
            address(loanToken),
            1000 ether,
            1500,
            30 days,
            address(collateralToken),
            1200 ether
        );
        vm.stopPrank();
        
        // Accept loan offer
        vm.startPrank(borrower);
        collateralToken.approve(address(dreamLend), 1200 ether);
        dreamLend.acceptLoanOffer(1);
        vm.stopPrank();
        
        // Verify loan updated
        DreamLend.Loan memory loan = dreamLend.getLoan(1);
        assertEq(loan.borrower, borrower);
        assertEq(uint256(loan.status), uint256(DreamLend.LoanStatus.Active));
        assertTrue(loan.startTime > 0);
        
        // Verify tokens transferred
        assertEq(loanToken.balanceOf(borrower), 1000 ether);
        assertEq(collateralToken.balanceOf(address(dreamLend)), 1200 ether);
    }

    function test_RepayLoan() public {
        // Create and accept loan
        vm.startPrank(lender);
        loanToken.approve(address(dreamLend), 1000 ether);
        dreamLend.createLoanOffer(
            address(loanToken),
            1000 ether,
            1500,
            30 days,
            address(collateralToken),
            1200 ether
        );
        vm.stopPrank();
        
        vm.startPrank(borrower);
        collateralToken.approve(address(dreamLend), 1200 ether);
        dreamLend.acceptLoanOffer(1);
        
        // Fast forward 15 days
        vm.warp(block.timestamp + 15 days);
        
        // Calculate expected repayment
        uint256 expectedInterest = dreamLend.calculateCurrentInterest(1);
        uint256 expectedTotal = dreamLend.calculateTotalRepayment(1);
        
        // Approve and repay
        loanToken.approve(address(dreamLend), expectedTotal);
        dreamLend.repayLoan(1);
        vm.stopPrank();
        
        // Verify loan status
        DreamLend.Loan memory loan = dreamLend.getLoan(1);
        assertEq(uint256(loan.status), uint256(DreamLend.LoanStatus.Repaid));
        
        // Verify collateral returned
        assertEq(collateralToken.balanceOf(borrower), 10000 ether);
    }

    function test_LiquidateLoan() public {
        // Create and accept loan
        vm.startPrank(lender);
        loanToken.approve(address(dreamLend), 1000 ether);
        dreamLend.createLoanOffer(
            address(loanToken),
            1000 ether,
            1500,
            30 days,
            address(collateralToken),
            1200 ether
        );
        vm.stopPrank();
        
        vm.startPrank(borrower);
        collateralToken.approve(address(dreamLend), 1200 ether);
        dreamLend.acceptLoanOffer(1);
        vm.stopPrank();
        
        // Fast forward past due date
        vm.warp(block.timestamp + 31 days);
        
        // Verify loan is defaulted
        assertTrue(dreamLend.isLoanDefaulted(1));
        
        // Anyone can liquidate
        vm.prank(liquidator);
        dreamLend.liquidateLoan(1);
        
        // Verify loan status
        DreamLend.Loan memory loan = dreamLend.getLoan(1);
        assertEq(uint256(loan.status), uint256(DreamLend.LoanStatus.Defaulted));
        
        // Verify collateral went to lender
        assertEq(collateralToken.balanceOf(lender), 1200 ether);
    }

    function test_HelperFunctions() public {
        // Test loanExists
        assertFalse(dreamLend.loanExists(1));
        
        // Create loan
        vm.startPrank(lender);
        loanToken.approve(address(dreamLend), 1000 ether);
        dreamLend.createLoanOffer(
            address(loanToken),
            1000 ether,
            1500,
            30 days,
            address(collateralToken),
            1200 ether
        );
        vm.stopPrank();
        
        // Test loanExists
        assertTrue(dreamLend.loanExists(1));
        
        // Accept loan to test calculation functions
        vm.startPrank(borrower);
        collateralToken.approve(address(dreamLend), 1200 ether);
        dreamLend.acceptLoanOffer(1);
        vm.stopPrank();
        
        // Test calculation functions
        uint256 interest = dreamLend.calculateCurrentInterest(1);
        assertEq(interest, 0); // No time elapsed yet
        
        uint256 totalRepayment = dreamLend.calculateTotalRepayment(1);
        assertEq(totalRepayment, 1000 ether); // Principal + 0 interest
        
        assertFalse(dreamLend.isLoanDefaulted(1));
    }
}

/**
 * @title Mock ERC20 Token
 * @dev Simple ERC20 implementation for testing
 */
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}
