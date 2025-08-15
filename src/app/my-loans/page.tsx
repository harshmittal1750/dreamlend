"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useP2PLending } from "@/hooks/useP2PLending";
import { Loan, LoanStatus } from "@/lib/contracts";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  DollarSign,
  Calendar,
  Shield,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { ethers } from "ethers";

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

interface LoanWithDetails extends Loan {
  formattedAmount: string;
  formattedCollateralAmount: string;
  formattedInterestRate: number;
  formattedDuration: number;
  formattedTotalRepayment: string;
  formattedInterest: string;
  statusText: string;
  isOverdue: boolean;
  timeRemaining: string;
  progressPercent: number;
  tokenInfo?: TokenInfo;
  collateralInfo?: TokenInfo;
}

// Helper function to convert API response to Loan type
const convertApiResponseToLoan = (loanData: any): Loan => {
  return {
    id: BigInt(loanData.id),
    lender: loanData.lender,
    borrower: loanData.borrower,
    tokenAddress: loanData.tokenAddress,
    amount: BigInt(loanData.amount),
    interestRate: BigInt(loanData.interestRate),
    duration: BigInt(loanData.duration),
    collateralAddress: loanData.collateralAddress,
    collateralAmount: BigInt(loanData.collateralAmount),
    startTime: BigInt(loanData.startTime),
    status: loanData.status,
  };
};

// Function to fetch token information
const fetchTokenInfo = async (
  tokenAddress: string
): Promise<TokenInfo | null> => {
  try {
    const provider = new ethers.JsonRpcProvider(
      "https://dream-rpc.somnia.network"
    );
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
      ],
      provider
    );

    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);

    return { name, symbol, decimals: Number(decimals) };
  } catch (error) {
    console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
    return null;
  }
};

export default function MyLoansPage() {
  const {
    lenderLoans,
    borrowerLoans,
    isLoadingLenderLoans,
    isLoadingBorrowerLoans,
    repayLoan,
    liquidateLoan,
    cancelLoanOffer,
    transactionState,
    resetTransactionState,
    isConnected,
    address,
    refetchLenderLoans,
    refetchBorrowerLoans,
    calculateTotalRepayment,
    calculateInterest,
    isLoanDefaulted,
  } = useP2PLending();

  const [lenderLoanDetails, setLenderLoanDetails] = useState<LoanWithDetails[]>(
    []
  );
  const [borrowerLoanDetails, setBorrowerLoanDetails] = useState<
    LoanWithDetails[]
  >([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<bigint | null>(null);
  const [actionType, setActionType] = useState<
    "repay" | "liquidate" | "cancel" | null
  >(null);

  // Fetch detailed loan information
  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (
        (!lenderLoans || lenderLoans.length === 0) &&
        (!borrowerLoans || borrowerLoans.length === 0)
      ) {
        setLenderLoanDetails([]);
        setBorrowerLoanDetails([]);
        return;
      }

      setIsLoadingDetails(true);
      try {
        // Fetch lender loan details
        const lenderPromises = (lenderLoans || []).map(async (loanId) => {
          try {
            const response = await fetch("/api/loan-details", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ loanId: loanId.toString() }),
            });

            if (!response.ok) {
              throw new Error("Failed to fetch loan details");
            }

            const loanData = await response.json();
            const loan = convertApiResponseToLoan(loanData);

            // Fetch token information
            const [tokenInfo, collateralInfo] = await Promise.all([
              fetchTokenInfo(loan.tokenAddress),
              fetchTokenInfo(loan.collateralAddress),
            ]);

            return formatLoanDetails(loan, tokenInfo, collateralInfo);
          } catch (error) {
            console.error(`Failed to fetch lender loan ${loanId}:`, error);
            return null;
          }
        });

        // Fetch borrower loan details
        const borrowerPromises = (borrowerLoans || []).map(async (loanId) => {
          try {
            const response = await fetch("/api/loan-details", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ loanId: loanId.toString() }),
            });

            if (!response.ok) {
              throw new Error("Failed to fetch loan details");
            }

            const loanData = await response.json();
            const loan = convertApiResponseToLoan(loanData);

            // Fetch token information
            const [tokenInfo, collateralInfo] = await Promise.all([
              fetchTokenInfo(loan.tokenAddress),
              fetchTokenInfo(loan.collateralAddress),
            ]);

            return formatLoanDetails(loan, tokenInfo, collateralInfo);
          } catch (error) {
            console.error(`Failed to fetch borrower loan ${loanId}:`, error);
            return null;
          }
        });

        const [lenderResults, borrowerResults] = await Promise.all([
          Promise.all(lenderPromises),
          Promise.all(borrowerPromises),
        ]);

        const validLenderLoans = lenderResults.filter(
          (loan): loan is LoanWithDetails => loan !== null
        );
        const validBorrowerLoans = borrowerResults.filter(
          (loan): loan is LoanWithDetails => loan !== null
        );

        setLenderLoanDetails(validLenderLoans);
        setBorrowerLoanDetails(validBorrowerLoans);
      } catch (error) {
        console.error("Failed to fetch loan details:", error);
        setLenderLoanDetails([]);
        setBorrowerLoanDetails([]);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchLoanDetails();
  }, [lenderLoans, borrowerLoans]);

  // Format loan details for display
  const formatLoanDetails = (
    loan: Loan,
    tokenInfo?: TokenInfo | null,
    collateralInfo?: TokenInfo | null
  ): LoanWithDetails => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const interest = calculateInterest(loan, currentTime);
    const totalRepayment = calculateTotalRepayment(loan, currentTime);
    const isOverdue = isLoanDefaulted(loan, currentTime);

    // Calculate time remaining
    let timeRemaining = "N/A";
    let progressPercent = 0;

    if (loan.status === LoanStatus.Active) {
      const endTime = loan.startTime + loan.duration;
      const timeLeft = endTime - currentTime;

      if (timeLeft > 0) {
        const days = Number(timeLeft) / (24 * 60 * 60);
        timeRemaining = `${Math.ceil(days)} days`;
        progressPercent = Math.min(
          100,
          (Number(currentTime - loan.startTime) / Number(loan.duration)) * 100
        );
      } else {
        timeRemaining = "Overdue";
        progressPercent = 100;
      }
    }

    // Format amounts using correct decimals
    const formattedAmount = tokenInfo
      ? ethers.formatUnits(loan.amount, tokenInfo.decimals)
      : ethers.formatEther(loan.amount);

    const formattedCollateralAmount = collateralInfo
      ? ethers.formatUnits(loan.collateralAmount, collateralInfo.decimals)
      : ethers.formatEther(loan.collateralAmount);

    const formattedTotalRepayment = tokenInfo
      ? ethers.formatUnits(totalRepayment, tokenInfo.decimals)
      : ethers.formatEther(totalRepayment);

    const formattedInterest = tokenInfo
      ? ethers.formatUnits(interest, tokenInfo.decimals)
      : ethers.formatEther(interest);

    return {
      ...loan,
      formattedAmount,
      formattedCollateralAmount,
      formattedInterestRate: Number(loan.interestRate) / 100, // Convert from basis points
      formattedDuration: Number(loan.duration) / (24 * 60 * 60), // Convert seconds to days
      formattedTotalRepayment,
      formattedInterest,
      statusText: ["Pending", "Active", "Repaid", "Defaulted", "Cancelled"][
        loan.status
      ],
      isOverdue,
      timeRemaining,
      progressPercent,
      tokenInfo: tokenInfo || undefined,
      collateralInfo: collateralInfo || undefined,
    };
  };

  const handleRepayLoan = async (loan: LoanWithDetails) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setSelectedLoanId(loan.id);
      setActionType("repay");
      await repayLoan(loan.id, loan);
      // Refresh the loan data after successful repayment
      await refetchBorrowerLoans();
      await refetchLenderLoans();
    } catch (error) {
      console.error("Failed to repay loan:", error);
    } finally {
      setSelectedLoanId(null);
      setActionType(null);
    }
  };

  const handleLiquidateLoan = async (loan: LoanWithDetails) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setSelectedLoanId(loan.id);
      setActionType("liquidate");
      await liquidateLoan(loan.id);
      // Refresh the loan data after successful liquidation
      await refetchLenderLoans();
      await refetchBorrowerLoans();
    } catch (error) {
      console.error("Failed to liquidate loan:", error);
    } finally {
      setSelectedLoanId(null);
      setActionType(null);
    }
  };

  const handleCancelLoan = async (loan: LoanWithDetails) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (loan.status !== LoanStatus.Pending) {
      alert("Only pending loan offers can be cancelled");
      return;
    }

    try {
      setSelectedLoanId(loan.id);
      setActionType("cancel");
      await cancelLoanOffer(loan.id);
      // Refresh the loan data after successful cancellation
      await refetchLenderLoans();
    } catch (error) {
      console.error("Failed to cancel loan offer:", error);
    } finally {
      setSelectedLoanId(null);
      setActionType(null);
    }
  };

  const getActionButton = (
    loan: LoanWithDetails,
    userRole: "lender" | "borrower"
  ) => {
    const isCurrentLoan = selectedLoanId === loan.id;
    const isLoading = transactionState.isLoading && isCurrentLoan;

    // Borrower can repay active loans
    if (userRole === "borrower" && loan.status === LoanStatus.Active) {
      return (
        <Button
          size="sm"
          onClick={() => handleRepayLoan(loan)}
          disabled={isLoading || (selectedLoanId !== null && !isCurrentLoan)}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading && actionType === "repay" && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          {isLoading && actionType === "repay" && isCurrentLoan
            ? transactionState.step === "approving"
              ? "Approving..."
              : "Repaying..."
            : "Repay Loan"}
        </Button>
      );
    }

    // Lender can cancel pending offers
    if (userRole === "lender" && loan.status === LoanStatus.Pending) {
      return (
        <Button
          size="sm"
          onClick={() => handleCancelLoan(loan)}
          disabled={isLoading || (selectedLoanId !== null && !isCurrentLoan)}
          variant="destructive"
        >
          {isLoading && actionType === "cancel" && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          {isLoading && actionType === "cancel" && isCurrentLoan
            ? "Cancelling..."
            : "Cancel Offer"}
        </Button>
      );
    }

    // Lender can liquidate overdue active loans
    if (
      userRole === "lender" &&
      loan.status === LoanStatus.Active &&
      loan.isOverdue
    ) {
      return (
        <Button
          size="sm"
          onClick={() => handleLiquidateLoan(loan)}
          disabled={isLoading || (selectedLoanId !== null && !isCurrentLoan)}
          variant="destructive"
        >
          {isLoading && actionType === "liquidate" && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          {isLoading && actionType === "liquidate" && isCurrentLoan
            ? "Liquidating..."
            : "Liquidate"}
        </Button>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        {loan.statusText}
      </Badge>
    );
  };

  const renderLoanTable = (
    loans: LoanWithDetails[],
    userRole: "lender" | "borrower"
  ) => {
    if (loans.length === 0) {
      const emptyMessage =
        userRole === "lender"
          ? "You haven't created any loan offers yet."
          : "You haven't accepted any loan offers yet.";
      const actionLink = userRole === "lender" ? "/create" : "/offers";
      const actionText =
        userRole === "lender"
          ? "Create your first loan offer"
          : "Browse available offers";

      return (
        <div className="text-center py-8">
          {userRole === "lender" ? (
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          ) : (
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userRole === "lender" ? "No Loan Offers" : "No Borrowed Loans"}
          </h3>
          <p className="text-gray-600 mb-4">{emptyMessage}</p>
          <a href={actionLink} className="text-blue-600 hover:text-blue-800">
            {actionText} →
          </a>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loan ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>APR</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Collateral</TableHead>
            {userRole === "borrower" && <TableHead>Total Repayment</TableHead>}
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id.toString()}>
              <TableCell className="font-medium">
                #{loan.id.toString()}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {parseFloat(loan.formattedAmount).toFixed(4)}{" "}
                    {loan.tokenInfo?.symbol || "Tokens"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loan.tokenAddress.slice(0, 6)}...
                    {loan.tokenAddress.slice(-4)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {loan.formattedInterestRate.toFixed(2)}%
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <span>{Math.round(loan.formattedDuration)} days</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {parseFloat(loan.formattedCollateralAmount).toFixed(4)}{" "}
                    {loan.collateralInfo?.symbol || "Tokens"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loan.collateralAddress.slice(0, 6)}...
                    {loan.collateralAddress.slice(-4)}
                  </p>
                </div>
              </TableCell>
              {userRole === "borrower" && (
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {parseFloat(loan.formattedTotalRepayment).toFixed(4)}{" "}
                      {loan.tokenInfo?.symbol || "Tokens"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Interest: {parseFloat(loan.formattedInterest).toFixed(4)}{" "}
                      {loan.tokenInfo?.symbol || "Tokens"}
                    </p>
                  </div>
                </TableCell>
              )}
              <TableCell>
                {loan.status === LoanStatus.Active ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            loan.isOverdue ? "bg-red-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(100, loan.progressPercent)}%`,
                          }}
                        />
                      </div>
                      {loan.isOverdue && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        loan.isOverdue ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {loan.timeRemaining}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    loan.status === LoanStatus.Pending
                      ? "default"
                      : loan.status === LoanStatus.Active
                      ? "secondary"
                      : loan.status === LoanStatus.Repaid
                      ? "outline"
                      : "destructive"
                  }
                >
                  {loan.statusText}
                </Badge>
              </TableCell>
              <TableCell>{getActionButton(loan, userRole)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>My Loans</CardTitle>
            <CardDescription>
              Connect your wallet to view your loan activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to Somnia L1 testnet to view your
                loans.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Loans</h1>
          <p className="text-gray-600 mt-2">
            Manage your lending and borrowing activity on DreamLend
          </p>
          <p className="text-sm text-gray-500 font-mono mt-1">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <Button
          onClick={() => {
            refetchLenderLoans();
            refetchBorrowerLoans();
          }}
          variant="outline"
        >
          Refresh Loans
        </Button>
      </div>

      {/* Transaction Progress */}
      {transactionState.step !== "idle" && selectedLoanId && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Transaction Progress</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {transactionState.step === "approving" &&
                transactionState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : transactionState.step === "approving" &&
                  transactionState.isSuccess ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm">
                  {actionType === "repay"
                    ? "Approve Repayment Tokens"
                    : "Approve Transaction"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {(transactionState.step === "repaying" ||
                  transactionState.step === "liquidating") &&
                transactionState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : transactionState.step === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm">
                  {actionType === "repay"
                    ? "Complete Loan Repayment"
                    : "Complete Liquidation"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {transactionState.isError && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{transactionState.error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {transactionState.isSuccess && (
        <Alert className="mb-6" variant="default">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            Transaction completed successfully! Hash:{" "}
            {transactionState.hash?.slice(0, 10)}...
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoadingLenderLoans ? "..." : lenderLoans?.length || 0}
                </p>
                <p className="text-sm font-medium text-gray-900">As Lender</p>
                <p className="text-xs text-gray-500">Loans you've offered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoadingBorrowerLoans ? "..." : borrowerLoans?.length || 0}
                </p>
                <p className="text-sm font-medium text-gray-900">As Borrower</p>
                <p className="text-xs text-gray-500">Loans you've taken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {lenderLoanDetails.filter(
                    (l) => l.status === LoanStatus.Active
                  ).length +
                    borrowerLoanDetails.filter(
                      (l) => l.status === LoanStatus.Active
                    ).length}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Active Loans
                </p>
                <p className="text-xs text-gray-500">Currently running</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {lenderLoanDetails.filter((l) => l.isOverdue).length +
                    borrowerLoanDetails.filter((l) => l.isOverdue).length}
                </p>
                <p className="text-sm font-medium text-gray-900">Overdue</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans I'm Offering */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Loans I'm Offering</span>
          </CardTitle>
          <CardDescription>
            Loans where you are the lender - monitor repayments and liquidate
            overdue loans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLenderLoans || isLoadingDetails ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderLoanTable(lenderLoanDetails, "lender")
          )}
        </CardContent>
      </Card>

      {/* Loans I've Borrowed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Loans I've Borrowed</span>
          </CardTitle>
          <CardDescription>
            Loans where you are the borrower - track repayment deadlines and
            make payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBorrowerLoans || isLoadingDetails ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderLoanTable(borrowerLoanDetails, "borrower")
          )}
        </CardContent>
      </Card>
    </div>
  );
}
