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
import { SOMNIA_TESTNET_CONFIG } from "@/lib/contracts";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";
import { ethers } from "ethers";

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

interface LoanOfferWithDetails extends Loan {
  formattedAmount: string;
  formattedCollateralAmount: string;
  formattedInterestRate: number;
  formattedDuration: number;
  statusText: string;
  tokenInfo?: TokenInfo;
  collateralInfo?: TokenInfo;
}

// Helper function to convert API response to Loan type
const convertApiResponseToLoan = (loanData: {
  id: string;
  lender: string;
  borrower: string;
  tokenAddress: string;
  amount: string;
  interestRate: string;
  duration: string;
  collateralAddress: string;
  collateralAmount: string;
  startTime: string;
  status: number;
}): Loan => {
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
      SOMNIA_TESTNET_CONFIG.rpcUrls.default.http[0]
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

export default function OffersPage() {
  const {
    activeLoanOfferIds,
    isLoadingOffers,
    acceptLoanOffer,
    cancelLoanOffer,
    transactionState,

    isConnected,
    address,
    refetchOffers,
  } = useP2PLending();

  const [loanOffers, setLoanOffers] = useState<LoanOfferWithDetails[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<bigint | null>(null);

  // Fetch loan details for each active offer
  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!activeLoanOfferIds || activeLoanOfferIds.length === 0) {
        setLoanOffers([]);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const loanPromises = activeLoanOfferIds.map(async (loanId) => {
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

            // Convert string values back to BigInt for proper processing
            const loan = convertApiResponseToLoan(loanData);

            // Fetch token information for both loan token and collateral
            const [tokenInfo, collateralInfo] = await Promise.all([
              fetchTokenInfo(loan.tokenAddress),
              fetchTokenInfo(loan.collateralAddress),
            ]);

            // Format the loan data for display
            const formattedAmount = tokenInfo
              ? ethers.formatUnits(loan.amount, tokenInfo.decimals)
              : ethers.formatEther(loan.amount);

            const formattedCollateralAmount = collateralInfo
              ? ethers.formatUnits(
                  loan.collateralAmount,
                  collateralInfo.decimals
                )
              : ethers.formatEther(loan.collateralAmount);

            const formattedLoan: LoanOfferWithDetails = {
              ...loan,
              formattedAmount,
              formattedCollateralAmount,
              formattedInterestRate: Number(loan.interestRate) / 100, // Convert from basis points
              formattedDuration: Number(loan.duration) / (24 * 60 * 60), // Convert seconds to days
              statusText: [
                "Pending",
                "Active",
                "Repaid",
                "Defaulted",
                "Cancelled",
              ][loan.status],
              tokenInfo: tokenInfo || undefined,
              collateralInfo: collateralInfo || undefined,
            };

            return formattedLoan;
          } catch (error) {
            console.error(`Failed to fetch loan ${loanId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(loanPromises);
        const validLoans = results.filter(
          (loan): loan is LoanOfferWithDetails =>
            loan !== null && loan.status === LoanStatus.Pending
        );

        setLoanOffers(validLoans);
      } catch (error) {
        console.error("Failed to fetch loan details:", error);
        setLoanOffers([]);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchLoanDetails();
  }, [activeLoanOfferIds]);

  const handleAcceptOffer = async (loan: LoanOfferWithDetails) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (loan.lender.toLowerCase() === address.toLowerCase()) {
      alert("You cannot accept your own loan offer");
      return;
    }

    try {
      setSelectedLoanId(loan.id);
      await acceptLoanOffer(loan.id, loan);
      // Refresh the offers after successful acceptance
      await refetchOffers();
    } catch (error) {
      console.error("Failed to accept loan offer:", error);
    } finally {
      setSelectedLoanId(null);
    }
  };

  const handleCancelOffer = async (loan: LoanOfferWithDetails) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (loan.lender.toLowerCase() !== address.toLowerCase()) {
      alert("You can only cancel your own loan offers");
      return;
    }

    try {
      setSelectedLoanId(loan.id);
      await cancelLoanOffer(loan.id);
      // Refresh the offers after successful cancellation
      await refetchOffers();
    } catch (error) {
      console.error("Failed to cancel loan offer:", error);
    } finally {
      setSelectedLoanId(null);
    }
  };

  const getStepStatus = (step: string) => {
    if (transactionState.step === step && transactionState.isLoading) {
      return "loading";
    }
    if (transactionState.step === step && transactionState.isSuccess) {
      return "success";
    }
    if (transactionState.step === step && transactionState.isError) {
      return "error";
    }
    if (
      transactionState.step === "success" &&
      (step === "approving" || step === "accepting")
    ) {
      return "success";
    }
    return "idle";
  };

  const renderStepIndicator = (step: string, label: string) => {
    const status = getStepStatus(step);

    return (
      <div className="flex items-center space-x-2">
        {status === "loading" && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        )}
        {status === "success" && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        {status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
        {status === "idle" && (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        )}
        <span
          className={`text-sm ${
            status === "success"
              ? "text-green-700"
              : status === "error"
              ? "text-red-700"
              : "text-gray-700"
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loan Offers</CardTitle>
            <CardDescription>
              Connect your wallet to view and accept loan offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to Somnia L1 testnet to view loan
                offers.
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
          <h1 className="text-3xl font-bold">Available Loan Offers</h1>
          <p className="text-gray-600 mt-2">
            Browse and accept loan offers from lenders on DreamLend
          </p>
        </div>
        <Button onClick={() => refetchOffers()} variant="outline">
          Refresh Offers
        </Button>
      </div>

      {transactionState.step !== "idle" && selectedLoanId && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Transaction Progress</h3>
            <div className="space-y-2">
              {renderStepIndicator("approving", "Approve Collateral Token")}
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              {renderStepIndicator("accepting", "Accept Loan Offer")}
            </div>
          </CardContent>
        </Card>
      )}

      {transactionState.isError && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{transactionState.error}</AlertDescription>
        </Alert>
      )}

      {transactionState.isSuccess && (
        <Alert className="mb-6" variant="default">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            Loan offer accepted successfully! Transaction hash:{" "}
            {transactionState.hash?.slice(0, 10)}...
          </AlertDescription>
        </Alert>
      )}

      {isLoadingOffers || isLoadingDetails ? (
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      ) : loanOffers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Loan Offers
              </h3>
              <p className="text-gray-600">
                There are currently no active loan offers available. Check back
                later or create your own!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Total Available</span>
                </div>
                <p className="text-2xl font-bold">
                  {loanOffers
                    .reduce(
                      (sum, loan) => sum + parseFloat(loan.formattedAmount),
                      0
                    )
                    .toFixed(2)}{" "}
                  Total Value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Average Duration</span>
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(
                    loanOffers.reduce(
                      (sum, loan) => sum + loan.formattedDuration,
                      0
                    ) / loanOffers.length
                  )}{" "}
                  Days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Active Offers</span>
                </div>
                <p className="text-2xl font-bold">{loanOffers.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Offers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Available Offers</CardTitle>
              <CardDescription>
                Click &quot;Accept&quot; to accept a loan offer. You&apos;ll
                need to approve collateral tokens first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>APR</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Collateral Required</TableHead>
                    <TableHead>Lender</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanOffers.map((loan) => (
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
                            {loan.tokenInfo?.name ||
                              `${loan.tokenAddress.slice(
                                0,
                                6
                              )}...${loan.tokenAddress.slice(-4)}`}
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
                            {parseFloat(loan.formattedCollateralAmount).toFixed(
                              4
                            )}{" "}
                            {loan.collateralInfo?.symbol || "Tokens"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {loan.collateralInfo?.name ||
                              `${loan.collateralAddress.slice(
                                0,
                                6
                              )}...${loan.collateralAddress.slice(-4)}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {loan.lender.slice(0, 6)}...{loan.lender.slice(-4)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            loan.status === LoanStatus.Pending
                              ? "default"
                              : "secondary"
                          }
                        >
                          {loan.statusText}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {loan.lender.toLowerCase() ===
                        address?.toLowerCase() ? (
                          <div className="space-y-2">
                            <Badge variant="outline">Your Offer</Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelOffer(loan)}
                              disabled={
                                transactionState.isLoading ||
                                loan.status !== LoanStatus.Pending ||
                                (selectedLoanId !== null &&
                                  selectedLoanId !== loan.id)
                              }
                              className="w-full"
                            >
                              {transactionState.isLoading &&
                                selectedLoanId === loan.id && (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                )}
                              {transactionState.step === "cancelling" &&
                              selectedLoanId === loan.id
                                ? "Cancelling..."
                                : "Cancel Offer"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptOffer(loan)}
                            disabled={
                              transactionState.isLoading ||
                              loan.status !== LoanStatus.Pending ||
                              (selectedLoanId !== null &&
                                selectedLoanId !== loan.id)
                            }
                          >
                            {transactionState.isLoading &&
                              selectedLoanId === loan.id && (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              )}
                            {transactionState.step === "approving" &&
                            selectedLoanId === loan.id
                              ? "Approving..."
                              : transactionState.step === "accepting" &&
                                selectedLoanId === loan.id
                              ? "Accepting..."
                              : "Accept"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
