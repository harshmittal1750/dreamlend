// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ChainConfig.sol";
import "./RewardsDistributor.sol";

/**
 * @title DreamLend
 * @dev A multi-chain decentralized lending protocol supporting Somnia and RISE testnets
 * @notice This contract enables peer-to-peer lending with collateral backing across multiple chains
 */
contract DreamLend is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Cancelled
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
        uint256 minCollateralRatioBPS; // Minimum required collateralization ratio at loan acceptance (e.g., 15000 for 150%)
        uint256 liquidationThresholdBPS; // Collateralization ratio below which loan can be liquidated (e.g., 12000 for 120%)
        uint256 maxPriceStaleness; // Maximum age of oracle price data (in seconds)
    }

    // ============ Constants ============

    uint256 public constant LIQUIDATION_FEE_BPS = 100;

    // ============ State Variables ============

    uint256 public nextLoanId = 1;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public lenderLoans;
    mapping(address => uint256[]) public borrowerLoans;
    uint256[] public activeLoanOfferIds;
    mapping(uint256 => uint256) private activeLoanOfferIndex;
    mapping(address => address) public tokenOracles;
    RewardsDistributor public rewardsDistributor;

    // ============ Events ============

    event LoanCreated(
        uint256 indexed loanId,
        address indexed lender,
        address indexed tokenAddress,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        address collateralAddress,
        uint256 collateralAmount,
        uint256 minCollateralRatioBPS,
        uint256 liquidationThresholdBPS,
        uint256 maxPriceStaleness
    );
    event LoanAccepted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 timestamp,
        uint256 initialCollateralRatio
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
        uint256 collateralClaimedByLender,
        uint256 liquidatorReward,
        uint256 timestamp
    );
    event LoanOfferCancelled(
        uint256 indexed loanId,
        address indexed lender,
        uint256 timestamp
    );
    event LoanOfferRemoved(uint256 indexed loanId, string reason);
    event OracleSet(
        address indexed tokenAddress,
        address indexed oracleAddress
    );
    event RewardsDistributorSet(
        address indexed oldDistributor,
        address indexed newDistributor
    );

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        _setupSupportedTokens();
    }

    function _setupSupportedTokens() internal {
        (address[] memory tokens, address[] memory oracles) = ChainConfig
            .getSupportedTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != address(0) && oracles[i] != address(0)) {
                tokenOracles[tokens[i]] = oracles[i];
                emit OracleSet(tokens[i], oracles[i]);
            }
        }
    }

    // ============ Administration Functions ============

    function setTokenOracle(
        address _tokenAddress,
        address _oracleAddress
    ) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_oracleAddress != address(0), "Invalid oracle address");
        tokenOracles[_tokenAddress] = _oracleAddress;
        emit OracleSet(_tokenAddress, _oracleAddress);
    }

    function setRewardsDistributor(
        address _distributorAddress
    ) external onlyOwner {
        require(
            _distributorAddress != address(0),
            "Invalid distributor address"
        );
        address oldDistributor = address(rewardsDistributor);
        rewardsDistributor = RewardsDistributor(payable(_distributorAddress));
        emit RewardsDistributorSet(oldDistributor, _distributorAddress);
    }

    function getRecommendedParameters(
        address loanAsset,
        address collateralAsset
    )
        external
        view
        returns (
            uint256 minRatio,
            uint256 liquidationThreshold,
            uint256 maxStaleness
        )
    {
        (minRatio, liquidationThreshold) = ChainConfig.getRecommendedRatios(
            loanAsset,
            collateralAsset
        );
        uint256 loanStaleness = ChainConfig.getRecommendedStaleness(loanAsset);
        uint256 collateralStaleness = ChainConfig.getRecommendedStaleness(
            collateralAsset
        );
        maxStaleness = loanStaleness < collateralStaleness
            ? loanStaleness
            : collateralStaleness;
    }

    function isLoanPairSupported(
        address loanAsset,
        address collateralAsset
    ) external view returns (bool supported) {
        return
            tokenOracles[loanAsset] != address(0) &&
            tokenOracles[collateralAsset] != address(0);
    }

    function getSupportedTokens()
        external
        view
        returns (address[] memory tokens)
    {
        (tokens, ) = ChainConfig.getSupportedTokens();
    }

    // ============ External Functions ============

    function createLoanOffer(
        address _tokenAddress,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _duration,
        address _collateralAddress,
        uint256 _collateralAmount
    ) external nonReentrant {
        (
            uint256 minRatio,
            uint256 liquidationThreshold,
            uint256 maxStaleness
        ) = this.getRecommendedParameters(_tokenAddress, _collateralAddress);
        _createLoanOfferInternal(
            _tokenAddress,
            _amount,
            _interestRate,
            _duration,
            _collateralAddress,
            _collateralAmount,
            minRatio,
            liquidationThreshold,
            maxStaleness
        );
    }

    function createLoanOffer(
        address _tokenAddress,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _duration,
        address _collateralAddress,
        uint256 _collateralAmount,
        uint256 _minCollateralRatioBPS,
        uint256 _liquidationThresholdBPS,
        uint256 _maxPriceStaleness
    ) external nonReentrant {
        _createLoanOfferInternal(
            _tokenAddress,
            _amount,
            _interestRate,
            _duration,
            _collateralAddress,
            _collateralAmount,
            _minCollateralRatioBPS,
            _liquidationThresholdBPS,
            _maxPriceStaleness
        );
    }

    function _createLoanOfferInternal(
        address _tokenAddress,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _duration,
        address _collateralAddress,
        uint256 _collateralAmount,
        uint256 _minCollateralRatioBPS,
        uint256 _liquidationThresholdBPS,
        uint256 _maxPriceStaleness
    ) internal {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_interestRate > 0, "Interest rate must be greater than 0");
        require(_interestRate <= 10000, "Interest rate cannot exceed 100%");
        require(_duration > 0, "Duration must be greater than 0");
        require(_duration <= 365 days, "Duration cannot exceed 1 year");
        require(_collateralAddress != address(0), "Invalid collateral address");
        require(
            _collateralAmount > 0,
            "Collateral amount must be greater than 0"
        );
        require(
            _minCollateralRatioBPS >= _liquidationThresholdBPS,
            "Min ratio must be >= liquidation threshold"
        );
        require(
            _liquidationThresholdBPS > 10000,
            "Liquidation threshold must be > 100%"
        );
        require(_maxPriceStaleness > 0, "Max price staleness must be set");

        bool hasLoanOracle = tokenOracles[_tokenAddress] != address(0);
        bool hasCollateralOracle = tokenOracles[_collateralAddress] !=
            address(0);

        if (hasLoanOracle || hasCollateralOracle) {
            require(hasLoanOracle, "Oracle not set for loan token");
            require(hasCollateralOracle, "Oracle not set for collateral token");
        }

        uint256 currentLoanId = nextLoanId;
        nextLoanId++;

        IERC20(_tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        Loan memory newLoan = Loan({
            id: currentLoanId,
            lender: msg.sender,
            borrower: address(0),
            tokenAddress: _tokenAddress,
            amount: _amount,
            interestRate: _interestRate,
            duration: _duration,
            collateralAddress: _collateralAddress,
            collateralAmount: _collateralAmount,
            startTime: 0,
            status: LoanStatus.Pending,
            minCollateralRatioBPS: _minCollateralRatioBPS,
            liquidationThresholdBPS: _liquidationThresholdBPS,
            maxPriceStaleness: _maxPriceStaleness
        });

        loans[currentLoanId] = newLoan;
        activeLoanOfferIds.push(currentLoanId);
        activeLoanOfferIndex[currentLoanId] = activeLoanOfferIds.length - 1;
        lenderLoans[msg.sender].push(currentLoanId);

        emit LoanCreated(
            currentLoanId,
            msg.sender,
            _tokenAddress,
            _amount,
            _interestRate,
            _duration,
            _collateralAddress,
            _collateralAmount,
            _minCollateralRatioBPS,
            _liquidationThresholdBPS,
            _maxPriceStaleness
        );
    }

    function cancelLoanOffer(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(msg.sender == loan.lender, "Only lender can cancel");
        IERC20(loan.tokenAddress).safeTransfer(loan.lender, loan.amount);
        loan.status = LoanStatus.Cancelled;
        _removeLoanFromActiveOffers(loanId);
        emit LoanOfferCancelled(loanId, msg.sender, block.timestamp);
    }

    // ============ Oracle Helper Functions ============

    function _getLatestPrice(
        address _oracleAddress,
        uint256 _maxStaleness
    ) internal view returns (uint256 price, bool isStale) {
        (price, isStale) = ChainConfig.getLatestPrice(
            _oracleAddress,
            _maxStaleness
        );
    }

    /**
     * @notice Calculates the current collateralization ratio for a given loan.
     * @param loanId The ID of the loan.
     * @return currentCollateralRatio The ratio in basis points (e.g., 15000 for 150%).
     * @return priceStale True if any required oracle price is stale.
     */
    function _getCollateralizationRatio(
        uint256 loanId
    ) internal view returns (uint256 currentCollateralRatio, bool priceStale) {
        Loan storage loan = loans[loanId];

        address collateralOracle = tokenOracles[loan.collateralAddress];
        address loanTokenOracle = tokenOracles[loan.tokenAddress];

        (uint256 collateralPrice, bool collateralStale) = _getLatestPrice(
            collateralOracle,
            loan.maxPriceStaleness
        );
        (uint256 loanTokenPrice, bool tokenStale) = _getLatestPrice(
            loanTokenOracle,
            loan.maxPriceStaleness
        );

        priceStale = collateralStale || tokenStale;

        uint8 collateralDecimals = IERC20Metadata(loan.collateralAddress)
            .decimals();
        uint8 loanTokenDecimals = IERC20Metadata(loan.tokenAddress).decimals();
        uint256 collateralOracleDecimals = ChainConfig.getOracleDecimals(
            collateralOracle
        );
        uint256 loanTokenOracleDecimals = ChainConfig.getOracleDecimals(
            loanTokenOracle
        );

        // Calculate collateral value in USD, adjusted for all decimals
        // Formula: (amount * price) / 10^token_decimals
        uint256 collateralValue = (loan.collateralAmount * collateralPrice) /
            (10 ** collateralDecimals);

        // Calculate loan value in USD, adjusted for all decimals
        // Formula: (amount * price) / 10^token_decimals
        uint256 loanValue = (loan.amount * loanTokenPrice) /
            (10 ** loanTokenDecimals);

        // To maintain precision for the ratio calculation, we normalize both values
        // to a common number of decimals (e.g., 18) before dividing.
        // We adjust based on the oracle's decimals.
        uint256 normalizedCollateralValue = collateralValue *
            (10 ** (18 - collateralOracleDecimals));
        uint256 normalizedLoanValue = loanValue *
            (10 ** (18 - loanTokenOracleDecimals));

        if (normalizedLoanValue == 0) {
            return (type(uint256).max, priceStale); // Effectively infinite ratio
        }

        // Calculate ratio: (Collateral Value / Loan Value) * 10000 (for basis points)
        currentCollateralRatio =
            (normalizedCollateralValue * 10000) /
            normalizedLoanValue;
    }

    // ============ Core Loan Functions ============

    function acceptLoanOffer(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(msg.sender != loan.lender, "Lender cannot accept own loan");

        bool hasLoanOracle = tokenOracles[loan.tokenAddress] != address(0);
        bool hasCollateralOracle = tokenOracles[loan.collateralAddress] !=
            address(0);

        if (hasLoanOracle && hasCollateralOracle) {
            (
                uint256 currentRatio,
                bool priceStale
            ) = _getCollateralizationRatio(loanId);
            require(!priceStale, "Oracle prices are too stale to accept loan");
            require(
                currentRatio >= loan.minCollateralRatioBPS,
                "Insufficient collateral based on current prices"
            );
        }

        IERC20(loan.collateralAddress).safeTransferFrom(
            msg.sender,
            address(this),
            loan.collateralAmount
        );
        IERC20(loan.tokenAddress).safeTransfer(msg.sender, loan.amount);

        loan.borrower = msg.sender;
        loan.startTime = block.timestamp;
        loan.status = LoanStatus.Active;

        if (address(rewardsDistributor) != address(0)) {
            rewardsDistributor.startAccruingRewards(loan.lender, loan.amount);
            rewardsDistributor.startAccruingRewards(msg.sender, loan.amount);
        }

        _removeLoanFromActiveOffers(loanId);
        borrowerLoans[msg.sender].push(loanId);

        uint256 eventCollateralRatio = 0;
        if (hasLoanOracle && hasCollateralOracle) {
            (eventCollateralRatio, ) = _getCollateralizationRatio(loanId);
        }
        emit LoanAccepted(
            loanId,
            msg.sender,
            block.timestamp,
            eventCollateralRatio
        );
    }

    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan is not active");
        require(msg.sender == loan.borrower, "Only borrower can repay");

        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 annualizedAmount = (loan.amount * loan.interestRate) / 10000;
        uint256 interest = (annualizedAmount * timeElapsed) / 31557600;
        uint256 totalRepayment = loan.amount + interest;

        if (address(rewardsDistributor) != address(0)) {
            rewardsDistributor.stopAccruingRewards(loan.lender, loan.amount);
            rewardsDistributor.stopAccruingRewards(loan.borrower, loan.amount);
        }

        IERC20(loan.tokenAddress).safeTransferFrom(
            msg.sender,
            loan.lender,
            totalRepayment
        );
        IERC20(loan.collateralAddress).safeTransfer(
            msg.sender,
            loan.collateralAmount
        );

        loan.status = LoanStatus.Repaid;
        emit LoanRepaid(loanId, msg.sender, totalRepayment, block.timestamp);
    }

    function liquidateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan is not active");

        bool timeDefaulted = block.timestamp > loan.startTime + loan.duration;
        bool priceDefaulted = false;

        bool hasLoanOracle = tokenOracles[loan.tokenAddress] != address(0);
        bool hasCollateralOracle = tokenOracles[loan.collateralAddress] !=
            address(0);

        if (hasLoanOracle && hasCollateralOracle) {
            (
                uint256 currentRatio,
                bool priceStale
            ) = _getCollateralizationRatio(loanId);
            require(!priceStale, "Oracle prices are too stale to liquidate");
            priceDefaulted = currentRatio < loan.liquidationThresholdBPS;
        }

        require(
            timeDefaulted || priceDefaulted,
            "Loan has not defaulted yet (time or price)"
        );

        if (address(rewardsDistributor) != address(0)) {
            rewardsDistributor.stopAccruingRewards(loan.lender, loan.amount);
            rewardsDistributor.stopAccruingRewards(loan.borrower, loan.amount);
        }

        uint256 liquidatorFee = (loan.collateralAmount * LIQUIDATION_FEE_BPS) /
            10000;
        uint256 collateralToLender = loan.collateralAmount - liquidatorFee;

        if (liquidatorFee > 0) {
            IERC20(loan.collateralAddress).safeTransfer(
                msg.sender,
                liquidatorFee
            );
        }
        IERC20(loan.collateralAddress).safeTransfer(
            loan.lender,
            collateralToLender
        );

        loan.status = LoanStatus.Defaulted;
        emit LoanLiquidated(
            loanId,
            msg.sender,
            collateralToLender,
            liquidatorFee,
            block.timestamp
        );
    }

    function getActiveLoanOffers() external view returns (uint256[] memory) {
        return activeLoanOfferIds;
    }

    function getActiveLoanOffersPaginated(
        uint256 startIndex,
        uint256 count
    ) external view returns (uint256[] memory) {
        uint256 totalOffers = activeLoanOfferIds.length;
        if (startIndex >= totalOffers) {
            return new uint256[](0);
        }
        uint256 endIndex = startIndex + count;
        if (endIndex > totalOffers) {
            endIndex = totalOffers;
        }
        uint256 resultLength = endIndex - startIndex;
        uint256[] memory result = new uint256[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = activeLoanOfferIds[startIndex + i];
        }
        return result;
    }

    function getActiveLoanOffersCount() external view returns (uint256) {
        return activeLoanOfferIds.length;
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getLenderLoans(
        address lender
    ) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }

    function getLenderLoansPaginated(
        address lender,
        uint256 startIndex,
        uint256 count
    ) external view returns (uint256[] memory) {
        uint256[] storage allLoans = lenderLoans[lender];
        uint256 totalLoans = allLoans.length;
        if (startIndex >= totalLoans) {
            return new uint256[](0);
        }
        uint256 endIndex = startIndex + count;
        if (endIndex > totalLoans) {
            endIndex = totalLoans;
        }
        uint256 resultLength = endIndex - startIndex;
        uint256[] memory result = new uint256[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allLoans[startIndex + i];
        }
        return result;
    }

    function getBorrowerLoans(
        address borrower
    ) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    function getBorrowerLoansPaginated(
        address borrower,
        uint256 startIndex,
        uint256 count
    ) external view returns (uint256[] memory) {
        uint256[] storage allLoans = borrowerLoans[borrower];
        uint256 totalLoans = allLoans.length;
        if (startIndex >= totalLoans) {
            return new uint256[](0);
        }
        uint256 endIndex = startIndex + count;
        if (endIndex > totalLoans) {
            endIndex = totalLoans;
        }
        uint256 resultLength = endIndex - startIndex;
        uint256[] memory result = new uint256[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allLoans[startIndex + i];
        }
        return result;
    }

    function getLenderLoansCount(
        address lender
    ) external view returns (uint256) {
        return lenderLoans[lender].length;
    }

    function getBorrowerLoansCount(
        address borrower
    ) external view returns (uint256) {
        return borrowerLoans[borrower].length;
    }

    function loanExists(uint256 loanId) external view returns (bool) {
        return loans[loanId].id != 0;
    }

    function calculateCurrentInterest(
        uint256 loanId
    ) external view returns (uint256) {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan is not active");
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 annualizedAmount = (loan.amount * loan.interestRate) / 10000;
        return (annualizedAmount * timeElapsed) / 31557600;
    }

    function calculateTotalRepayment(
        uint256 loanId
    ) external view returns (uint256) {
        uint256 interest = this.calculateCurrentInterest(loanId);
        return loans[loanId].amount + interest;
    }

    function isLoanDefaulted(uint256 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        if (loan.status != LoanStatus.Active) {
            return false;
        }
        bool timeDefaulted = block.timestamp > loan.startTime + loan.duration;
        bool priceDefaulted = false;
        bool hasLoanOracle = tokenOracles[loan.tokenAddress] != address(0);
        bool hasCollateralOracle = tokenOracles[loan.collateralAddress] !=
            address(0);
        if (hasLoanOracle && hasCollateralOracle) {
            (
                uint256 currentRatio,
                bool priceStale
            ) = _getCollateralizationRatio(loanId);
            if (!priceStale) {
                priceDefaulted = currentRatio < loan.liquidationThresholdBPS;
            }
        }
        return timeDefaulted || priceDefaulted;
    }

    function getLoanHealthFactor(
        uint256 loanId
    ) external view returns (uint256 currentRatio, bool priceStale) {
        Loan storage loan = loans[loanId];
        require(loan.id != 0, "Loan does not exist");
        require(loan.status == LoanStatus.Active, "Loan is not active");
        return _getCollateralizationRatio(loanId);
    }

    // ============ Internal Functions ============

    function _removeLoanFromActiveOffers(uint256 loanId) internal {
        uint256 length = activeLoanOfferIds.length;
        if (length == 0) return;
        uint256 indexToRemove = activeLoanOfferIndex[loanId];
        if (
            indexToRemove < length &&
            activeLoanOfferIds[indexToRemove] == loanId
        ) {
            if (indexToRemove != length - 1) {
                uint256 lastLoanId = activeLoanOfferIds[length - 1];
                activeLoanOfferIds[indexToRemove] = lastLoanId;
                activeLoanOfferIndex[lastLoanId] = indexToRemove;
            }
            activeLoanOfferIds.pop();
            delete activeLoanOfferIndex[loanId];
            emit LoanOfferRemoved(loanId, "Loan accepted or cancelled");
        }
    }
}
