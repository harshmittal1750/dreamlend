"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useP2PLending, LoanOfferFormData } from "@/hooks/useP2PLending";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  AlertTriangle,
} from "lucide-react";

import { TokenSelector } from "@/components/TokenSelector";
import {
  TokenInfo,
  getRecommendedParameters,
  formatBasisPoints,
  formatDuration,
  percentageToBasisPoints,
  // basisPointsToPercentage,
} from "@/config/tokens";

export default function CreateLoanOfferPage() {
  const {
    createLoanOffer,
    transactionState,
    resetTransactionState,
    isConnected,
    address,
  } = useP2PLending();

  const [formData, setFormData] = useState<LoanOfferFormData>({
    tokenAddress: "",
    amount: "",
    interestRate: "",
    duration: "",
    collateralAddress: "",
    collateralAmount: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<LoanOfferFormData>>({});
  const [selectedLoanToken, setSelectedLoanToken] = useState<
    TokenInfo | undefined
  >();
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<
    TokenInfo | undefined
  >();
  const [recommendedParams, setRecommendedParams] = useState<{
    minCollateralRatio: number;
    liquidationThreshold: number;
    maxPriceStaleness: number;
  } | null>(null);

  const handleInputChange = (field: keyof LoanOfferFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLoanTokenSelect = (token: TokenInfo) => {
    setSelectedLoanToken(token);
    setFormData((prev) => ({ ...prev, tokenAddress: token.address }));
    updateRecommendedParams(token, selectedCollateralToken);
  };

  const handleCollateralTokenSelect = (token: TokenInfo) => {
    setSelectedCollateralToken(token);
    setFormData((prev) => ({ ...prev, collateralAddress: token.address }));
    updateRecommendedParams(selectedLoanToken, token);
  };

  const updateRecommendedParams = (
    loanToken?: TokenInfo,
    collateralToken?: TokenInfo
  ) => {
    if (loanToken && collateralToken) {
      const params = getRecommendedParameters(loanToken, collateralToken);
      setRecommendedParams(params);

      // Auto-fill recommended parameters if fields are empty
      if (!formData.interestRate) {
        setFormData((prev) => ({ ...prev, interestRate: "15" })); // 15% default (displayed as percentage)
      }
    } else {
      setRecommendedParams(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<LoanOfferFormData> = {};

    // Token address validation
    if (!formData.tokenAddress) {
      errors.tokenAddress = "Token address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.tokenAddress)) {
      errors.tokenAddress = "Invalid Ethereum address";
    } else if (
      formData.tokenAddress === "0x0000000000000000000000000000000000000000"
    ) {
      errors.tokenAddress = "Please select a valid token (not a placeholder)";
    }

    // Amount validation
    if (!formData.amount) {
      errors.amount = "Amount is required";
    } else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      errors.amount = "Amount must be a positive number";
    }

    // Interest rate validation (input is in percentage, will be converted to basis points)
    if (!formData.interestRate) {
      errors.interestRate = "Interest rate is required";
    } else if (
      isNaN(parseFloat(formData.interestRate)) ||
      parseFloat(formData.interestRate) <= 0
    ) {
      errors.interestRate = "Interest rate must be a positive number";
    } else if (parseFloat(formData.interestRate) > 100) {
      errors.interestRate = "Interest rate cannot exceed 100%";
    }

    // Duration validation
    if (!formData.duration) {
      errors.duration = "Duration is required";
    } else if (
      isNaN(parseFloat(formData.duration)) ||
      parseFloat(formData.duration) <= 0
    ) {
      errors.duration = "Duration must be a positive number";
    } else if (parseFloat(formData.duration) > 365) {
      errors.duration = "Duration cannot exceed 365 days";
    }

    // Collateral address validation
    if (!formData.collateralAddress) {
      errors.collateralAddress = "Collateral address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.collateralAddress)) {
      errors.collateralAddress = "Invalid Ethereum address";
    } else if (
      formData.collateralAddress ===
      "0x0000000000000000000000000000000000000000"
    ) {
      errors.collateralAddress =
        "Please select a valid collateral token (not a placeholder)";
    }

    // Collateral amount validation
    if (!formData.collateralAmount) {
      errors.collateralAmount = "Collateral amount is required";
    } else if (
      isNaN(parseFloat(formData.collateralAmount)) ||
      parseFloat(formData.collateralAmount) <= 0
    ) {
      errors.collateralAmount = "Collateral amount must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      // Convert percentage to basis points for the contract
      const contractFormData = {
        ...formData,
        interestRate: percentageToBasisPoints(
          parseFloat(formData.interestRate)
        ).toString(),
      };
      await createLoanOffer(contractFormData);
    } catch (error) {
      console.error("Failed to create loan offer:", error);
    }
  };

  const handleReset = () => {
    setFormData({
      tokenAddress: "",
      amount: "",
      interestRate: "",
      duration: "",
      collateralAddress: "",
      collateralAmount: "",
    });
    setFormErrors({});
    resetTransactionState();
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
      (step === "approving" || step === "creating")
    ) {
      return "success";
    }
    return "idle";
  };

  const renderStepIndicator = (step: string, label: string) => {
    const status = getStepStatus(step);

    return (
      <div className="flex items-center space-x-3">
        {status === "loading" && (
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
        {status === "success" && (
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        )}
        {status === "error" && (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
        )}
        {status === "idle" && (
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
        )}
        <span
          className={`font-medium ${
            status === "success"
              ? "text-green-600"
              : status === "error"
              ? "text-red-600"
              : status === "loading"
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create Loan Offer
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect your wallet to start lending on DreamLend
          </p>
        </div>

        <Card className="luxury-shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Wallet Connection Required
            </CardTitle>
            <CardDescription className="text-lg">
              Connect your wallet to Somnia L1 testnet to create premium loan
              offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-primary/20 bg-primary/5">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Please connect your wallet to Somnia L1 testnet to access the
                loan creation interface. Your wallet will be used to sign
                transactions and manage your loan offers.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Create Loan Offer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create a loan offer on DreamLend. Your tokens will be securely
          escrowed until the offer is accepted or cancelled.
        </p>
      </div>

      <Card className="luxury-shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Loan Offer Configuration
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Configure your loan terms and collateral requirements
              </CardDescription>
            </div>
            {address && (
              <div className="glass px-3 py-2 rounded-xl">
                <span className="text-xs font-mono text-muted-foreground">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {transactionState.step !== "idle" && (
            <Card className="mb-6 bg-accent/30 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-lg flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                  Transaction Progress
                </h3>
                <div className="space-y-3">
                  {renderStepIndicator("approving", "Approve Token Spending")}
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {renderStepIndicator("creating", "Create Loan Offer")}
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
                Loan offer created successfully! Transaction hash:{" "}
                {transactionState.hash?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Loan Token Details */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  Loan Token Details
                </CardTitle>
                <CardDescription>
                  Choose the token you want to lend and specify the amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <TokenSelector
                      selectedToken={selectedLoanToken}
                      onTokenSelect={handleLoanTokenSelect}
                      label="Loan Token"
                      placeholder="Select token to lend"
                      excludeToken={selectedCollateralToken}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-base font-medium">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.000001"
                      placeholder="1000"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      className={`h-12 text-base ${
                        formErrors.amount
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    {formErrors.amount && (
                      <p className="text-sm text-destructive flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.amount}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Terms */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  Loan Terms
                </CardTitle>
                <CardDescription>
                  Set your interest rate and loan duration preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="interestRate"
                      className="text-base font-medium"
                    >
                      Annual Interest Rate (%)
                    </Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      placeholder="5.0"
                      value={formData.interestRate}
                      onChange={(e) =>
                        handleInputChange("interestRate", e.target.value)
                      }
                      className={`h-12 text-base ${
                        formErrors.interestRate
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    {formErrors.interestRate && (
                      <p className="text-sm text-destructive flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.interestRate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base font-medium">
                      Duration (Days)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={(e) =>
                        handleInputChange("duration", e.target.value)
                      }
                      className={`h-12 text-base ${
                        formErrors.duration
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    {formErrors.duration && (
                      <p className="text-sm text-destructive flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.duration}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collateral Details */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  Collateral Requirements
                </CardTitle>
                <CardDescription>
                  Define what collateral borrowers must provide to secure the
                  loan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <TokenSelector
                      selectedToken={selectedCollateralToken}
                      onTokenSelect={handleCollateralTokenSelect}
                      label="Collateral Token"
                      placeholder="Select collateral token"
                      excludeToken={selectedLoanToken}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="collateralAmount"
                      className="text-base font-medium"
                    >
                      Collateral Amount
                    </Label>
                    <Input
                      id="collateralAmount"
                      type="number"
                      step="0.000001"
                      placeholder="1500"
                      value={formData.collateralAmount}
                      onChange={(e) =>
                        handleInputChange("collateralAmount", e.target.value)
                      }
                      className={`h-12 text-base ${
                        formErrors.collateralAmount
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    {formErrors.collateralAmount && (
                      <p className="text-sm text-destructive flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.collateralAmount}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Management Parameters */}
            {recommendedParams &&
              selectedLoanToken &&
              selectedCollateralToken && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Risk Management Parameters
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                      <Info className="h-4 w-4" />
                      Recommended settings for {selectedLoanToken.symbol} →{" "}
                      {selectedCollateralToken.symbol}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded p-3 border border-blue-200">
                        <div className="font-medium text-gray-700">
                          Min Collateral Ratio
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatBasisPoints(
                            recommendedParams.minCollateralRatio
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Required at loan acceptance
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 border border-blue-200">
                        <div className="font-medium text-gray-700">
                          Liquidation Threshold
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                          {formatBasisPoints(
                            recommendedParams.liquidationThreshold
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Liquidation trigger point
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 border border-blue-200">
                        <div className="font-medium text-gray-700">
                          Price Staleness
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          {formatDuration(recommendedParams.maxPriceStaleness)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Max oracle age allowed
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-yellow-800">
                          Risk Assessment
                        </div>
                        <div className="text-yellow-700">
                          Based on volatility: {selectedLoanToken.symbol} (
                          {selectedLoanToken.volatilityTier}) lending{" "}
                          {selectedCollateralToken.symbol} (
                          {selectedCollateralToken.volatilityTier}) collateral.
                          Higher volatility assets require higher collateral
                          ratios for safety.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <Separator />

            {/* Summary */}
            {formData.amount && formData.interestRate && formData.duration && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    Loan Summary
                  </CardTitle>
                  <CardDescription>
                    Review your loan offer details before creating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Loan Amount:
                        </span>
                        <span className="font-semibold">
                          {formData.amount}{" "}
                          {selectedLoanToken?.symbol || "tokens"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Interest Rate:
                        </span>
                        <span className="font-semibold">
                          {formData.interestRate}% APR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-semibold">
                          {formData.duration} days
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Required Collateral:
                        </span>
                        <span className="font-semibold">
                          {formData.collateralAmount}{" "}
                          {selectedCollateralToken?.symbol || "tokens"}
                        </span>
                      </div>
                      {formData.amount &&
                        formData.interestRate &&
                        formData.duration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total Interest:
                            </span>
                            <span className="font-semibold text-green-600">
                              {(
                                (parseFloat(formData.amount) *
                                  parseFloat(formData.interestRate) * // percentage rate
                                  parseFloat(formData.duration)) /
                                (365 * 100)
                              ) // convert percentage to decimal and annualize
                                .toFixed(6)}{" "}
                              {selectedLoanToken?.symbol || "tokens"}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                disabled={transactionState.isLoading}
                className="flex-1 h-12 text-base font-semibold btn-premium"
                size="lg"
              >
                {transactionState.isLoading && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                {transactionState.step === "approving" && "Approving Tokens..."}
                {transactionState.step === "creating" &&
                  "Creating Loan Offer..."}
                {transactionState.step === "idle" && "Create Loan Offer"}
                {transactionState.step === "success" && "Create Another Offer"}
                {!transactionState.isLoading && (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={transactionState.isLoading}
                className="h-12 text-base font-medium px-8"
                size="lg"
              >
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
