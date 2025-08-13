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
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

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

  const handleInputChange = (field: keyof LoanOfferFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<LoanOfferFormData> = {};

    // Token address validation
    if (!formData.tokenAddress) {
      errors.tokenAddress = "Token address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.tokenAddress)) {
      errors.tokenAddress = "Invalid Ethereum address";
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

    // Interest rate validation
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
      await createLoanOffer(formData);
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Loan Offer</CardTitle>
            <CardDescription>
              Connect your wallet to create a loan offer on DreamLend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to Somnia L1 testnet to create loan
                offers.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Loan Offer</CardTitle>
          <CardDescription>
            Create a new loan offer on DreamLend. Your tokens will be escrowed
            until the offer is accepted or cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionState.step !== "idle" && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Transaction Progress</h3>
              <div className="space-y-2">
                {renderStepIndicator("approving", "Approve Token Spending")}
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                {renderStepIndicator("creating", "Create Loan Offer")}
              </div>
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loan Token Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Loan Token Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenAddress">Token Address</Label>
                  <Input
                    id="tokenAddress"
                    type="text"
                    placeholder="0x..."
                    value={formData.tokenAddress}
                    onChange={(e) =>
                      handleInputChange("tokenAddress", e.target.value)
                    }
                    className={formErrors.tokenAddress ? "border-red-500" : ""}
                  />
                  {formErrors.tokenAddress && (
                    <p className="text-sm text-red-500">
                      {formErrors.tokenAddress}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.000001"
                    placeholder="1000"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className={formErrors.amount ? "border-red-500" : ""}
                  />
                  {formErrors.amount && (
                    <p className="text-sm text-red-500">{formErrors.amount}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Loan Terms */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Loan Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="5.0"
                    value={formData.interestRate}
                    onChange={(e) =>
                      handleInputChange("interestRate", e.target.value)
                    }
                    className={formErrors.interestRate ? "border-red-500" : ""}
                  />
                  {formErrors.interestRate && (
                    <p className="text-sm text-red-500">
                      {formErrors.interestRate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    className={formErrors.duration ? "border-red-500" : ""}
                  />
                  {formErrors.duration && (
                    <p className="text-sm text-red-500">
                      {formErrors.duration}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Collateral Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Collateral Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collateralAddress">
                    Collateral Token Address
                  </Label>
                  <Input
                    id="collateralAddress"
                    type="text"
                    placeholder="0x..."
                    value={formData.collateralAddress}
                    onChange={(e) =>
                      handleInputChange("collateralAddress", e.target.value)
                    }
                    className={
                      formErrors.collateralAddress ? "border-red-500" : ""
                    }
                  />
                  {formErrors.collateralAddress && (
                    <p className="text-sm text-red-500">
                      {formErrors.collateralAddress}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collateralAmount">Collateral Amount</Label>
                  <Input
                    id="collateralAmount"
                    type="number"
                    step="0.000001"
                    placeholder="1500"
                    value={formData.collateralAmount}
                    onChange={(e) =>
                      handleInputChange("collateralAmount", e.target.value)
                    }
                    className={
                      formErrors.collateralAmount ? "border-red-500" : ""
                    }
                  />
                  {formErrors.collateralAmount && (
                    <p className="text-sm text-red-500">
                      {formErrors.collateralAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            {formData.amount && formData.interestRate && formData.duration && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Loan Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Loan Amount: {formData.amount} tokens</p>
                  <p>Interest Rate: {formData.interestRate}% APR</p>
                  <p>Duration: {formData.duration} days</p>
                  <p>Required Collateral: {formData.collateralAmount} tokens</p>
                  {formData.amount &&
                    formData.interestRate &&
                    formData.duration && (
                      <p className="font-medium">
                        Total Interest (if held to maturity):{" "}
                        {(
                          (parseFloat(formData.amount) *
                            parseFloat(formData.interestRate) *
                            parseFloat(formData.duration)) /
                          (365 * 100)
                        ).toFixed(6)}{" "}
                        tokens
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={transactionState.isLoading}
                className="flex-1"
              >
                {transactionState.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {transactionState.step === "approving" && "Approving Tokens..."}
                {transactionState.step === "creating" &&
                  "Creating Loan Offer..."}
                {transactionState.step === "idle" && "Create Loan Offer"}
                {transactionState.step === "success" && "Create Another Offer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={transactionState.isLoading}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
