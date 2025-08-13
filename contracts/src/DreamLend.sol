// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DreamLend
 * @dev A decentralized lending protocol for Somnia L1 testnet
 * @notice This contract enables peer-to-peer lending with collateral backing
 */
contract DreamLend is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted
    }

    // ============ Structs ============

    struct Loan {
        uint256 id;
        address lender;
        address borrower;
        address tokenAddress;
        uint256 amount;
        uint256 interestRate; // Basis points (e.g., 500 = 5%)
        uint256 duration; // Duration in seconds
        address collateralAddress;
        uint256 collateralAmount;
        uint256 startTime;
        LoanStatus status;
    }

    // ============ State Variables ============

    uint256 public nextLoanId = 1;

    // Mappings for efficient loan management
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public lenderLoans;
    mapping(address => uint256[]) public borrowerLoans;

    // Array to efficiently query open loan offers
    uint256[] public activeLoanOfferIds;

    // ============ Events ============

    event LoanCreated(
        uint256 indexed loanId,
        address indexed lender,
        address indexed tokenAddress,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        address collateralAddress,
        uint256 collateralAmount
    );

    event LoanAccepted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 timestamp
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 repaymentAmount,
        uint256 timestamp
    );

    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed liquidator,
        uint256 collateralClaimed,
        uint256 timestamp
    );

    // ============ Constructor ============

    constructor() {}

    // ============ External Functions ============

    /**
     * @notice Creates a new loan offer
     * @param _tokenAddress Address of the ERC20 token to lend
     * @param _amount Amount of tokens to lend
     * @param _interestRate Interest rate in basis points (e.g., 500 = 5%)
     * @param _duration Loan duration in seconds
     * @param _collateralAddress Address of the collateral token
     * @param _collateralAmount Amount of collateral required
     */
    function createLoanOffer(
        address _tokenAddress,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _duration,
        address _collateralAddress,
        uint256 _collateralAmount
    ) external nonReentrant {
        // Input validation
        require(_tokenAddress != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_interestRate > 0, "Interest rate must be greater than 0");
        require(_interestRate <= 10000, "Interest rate cannot exceed 100%"); // Max 100% APR
        require(_duration > 0, "Duration must be greater than 0");
        require(_duration <= 365 days, "Duration cannot exceed 1 year");
        require(_collateralAddress != address(0), "Invalid collateral address");
        require(
            _collateralAmount > 0,
            "Collateral amount must be greater than 0"
        );

        // Get the current loan ID and increment for next use
        uint256 currentLoanId = nextLoanId;
        nextLoanId++;

        // Transfer loan amount from lender to contract (escrow)
        IERC20(_tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // Create new loan struct
        Loan memory newLoan = Loan({
            id: currentLoanId,
            lender: msg.sender,
            borrower: address(0), // No borrower yet
            tokenAddress: _tokenAddress,
            amount: _amount,
            interestRate: _interestRate,
            duration: _duration,
            collateralAddress: _collateralAddress,
            collateralAmount: _collateralAmount,
            startTime: 0, // Will be set when loan is accepted
            status: LoanStatus.Pending
        });

        // Store the loan
        loans[currentLoanId] = newLoan;

        // Add to active loan offers
        activeLoanOfferIds.push(currentLoanId);

        // Update lender's loan mapping
        lenderLoans[msg.sender].push(currentLoanId);

        // Emit event
        emit LoanCreated(
            currentLoanId,
            msg.sender,
            _tokenAddress,
            _amount,
            _interestRate,
            _duration,
            _collateralAddress,
            _collateralAmount
        );
    }

    /**
     * @notice Accepts an existing loan offer
     * @param loanId The ID of the loan offer to accept
     */
    function acceptLoanOffer(uint256 loanId) external nonReentrant {
        // Verify loan exists and is in pending status
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(msg.sender != loan.lender, "Lender cannot accept own loan");

        // Transfer collateral from borrower to contract
        IERC20(loan.collateralAddress).safeTransferFrom(
            msg.sender,
            address(this),
            loan.collateralAmount
        );

        // Transfer loan amount from contract to borrower
        IERC20(loan.tokenAddress).safeTransfer(msg.sender, loan.amount);

        // Update loan details
        loan.borrower = msg.sender;
        loan.startTime = block.timestamp;
        loan.status = LoanStatus.Active;

        // Remove from active loan offers array (gas efficient swap and pop)
        _removeLoanFromActiveOffers(loanId);

        // Add to borrower's loan mapping
        borrowerLoans[msg.sender].push(loanId);

        // Emit event
        emit LoanAccepted(loanId, msg.sender, block.timestamp);
    }

    /**
     * @notice Repays an active loan
     * @param loanId The ID of the loan to repay
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        // Verify loan exists and is active
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan is not active");
        require(msg.sender == loan.borrower, "Only borrower can repay");

        // Calculate interest based on time elapsed
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 interest = (loan.amount * loan.interestRate * timeElapsed) /
            (10000 * 365 days);
        uint256 totalRepayment = loan.amount + interest;

        // Transfer repayment from borrower to lender
        IERC20(loan.tokenAddress).safeTransferFrom(
            msg.sender,
            loan.lender,
            totalRepayment
        );

        // Return collateral to borrower
        IERC20(loan.collateralAddress).safeTransfer(
            msg.sender,
            loan.collateralAmount
        );

        // Update loan status
        loan.status = LoanStatus.Repaid;

        // Emit event
        emit LoanRepaid(loanId, msg.sender, totalRepayment, block.timestamp);
    }

    /**
     * @notice Liquidates a defaulted loan
     * @param loanId The ID of the loan to liquidate
     */
    function liquidateLoan(uint256 loanId) external nonReentrant {
        // Verify loan exists and is active
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan is not active");
        require(msg.sender == loan.lender, "Only lender can liquidate");

        // Check if loan has defaulted (past due date)
        require(
            block.timestamp > loan.startTime + loan.duration,
            "Loan has not defaulted yet"
        );

        // Transfer collateral to lender
        IERC20(loan.collateralAddress).safeTransfer(
            loan.lender,
            loan.collateralAmount
        );

        // Update loan status
        loan.status = LoanStatus.Defaulted;

        // Emit event
        emit LoanLiquidated(
            loanId,
            msg.sender,
            loan.collateralAmount,
            block.timestamp
        );
    }

    /**
     * @notice Returns all active loan offer IDs
     * @return Array of active loan offer IDs
     */
    function getActiveLoanOffers() external view returns (uint256[] memory) {
        return activeLoanOfferIds;
    }

    // ============ View Functions ============

    /**
     * @notice Gets loan details by ID
     * @param loanId The loan ID to query
     * @return Loan struct containing all loan details
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @notice Gets all loan IDs for a lender
     * @param lender The lender's address
     * @return Array of loan IDs where the address is the lender
     */
    function getLenderLoans(
        address lender
    ) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }

    /**
     * @notice Gets all loan IDs for a borrower
     * @param borrower The borrower's address
     * @return Array of loan IDs where the address is the borrower
     */
    function getBorrowerLoans(
        address borrower
    ) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    // ============ Internal Functions ============

    /**
     * @notice Removes a loan ID from the activeLoanOfferIds array using swap and pop for gas efficiency
     * @param loanId The loan ID to remove
     */
    function _removeLoanFromActiveOffers(uint256 loanId) internal {
        uint256 length = activeLoanOfferIds.length;

        // Find the index of the loan ID
        for (uint256 i = 0; i < length; i++) {
            if (activeLoanOfferIds[i] == loanId) {
                // Swap with last element and pop
                activeLoanOfferIds[i] = activeLoanOfferIds[length - 1];
                activeLoanOfferIds.pop();
                break;
            }
        }
    }
}
