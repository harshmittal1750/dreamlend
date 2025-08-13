"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useP2PLending } from "@/hooks/useP2PLending";
import { AlertCircle, TrendingUp, Clock, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const {
    isConnected,
    address,
    lenderLoans,
    borrowerLoans,
    isLoadingLenderLoans,
    isLoadingBorrowerLoans,
  } = useP2PLending();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>My Dashboard</CardTitle>
            <CardDescription>
              Connect your wallet to view your loan activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to Somnia L1 testnet to view your
                dashboard.
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
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your lending and borrowing activity on DreamLend
          </p>
          <p className="text-sm text-gray-500 font-mono mt-1">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <p className="text-sm font-medium text-gray-900">
                  Loans as Lender
                </p>
                <p className="text-xs text-gray-500">Loans you've created</p>
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
                <p className="text-sm font-medium text-gray-900">
                  Loans as Borrower
                </p>
                <p className="text-xs text-gray-500">Loans you've accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(lenderLoans?.length || 0) + (borrowerLoans?.length || 0)}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Total Activity
                </p>
                <p className="text-xs text-gray-500">All loan interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lender Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Your Loan Offers</span>
            </CardTitle>
            <CardDescription>Loans where you are the lender</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLenderLoans ? (
              <p className="text-gray-500">Loading your loan offers...</p>
            ) : !lenderLoans || lenderLoans.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Loan Offers
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't created any loan offers yet.
                </p>
                <a href="/create" className="text-blue-600 hover:text-blue-800">
                  Create your first loan offer →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {lenderLoans.map((loanId, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Loan #{loanId.toString()}</p>
                        <p className="text-sm text-gray-500">
                          Click to view details
                        </p>
                      </div>
                      <Badge variant="outline">View Details</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Borrower Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Your Borrowed Loans</span>
            </CardTitle>
            <CardDescription>Loans where you are the borrower</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBorrowerLoans ? (
              <p className="text-gray-500">Loading your borrowed loans...</p>
            ) : !borrowerLoans || borrowerLoans.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Borrowed Loans
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't accepted any loan offers yet.
                </p>
                <a href="/offers" className="text-blue-600 hover:text-blue-800">
                  Browse available offers →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {borrowerLoans.map((loanId, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Loan #{loanId.toString()}</p>
                        <p className="text-sm text-gray-500">
                          Click to view details
                        </p>
                      </div>
                      <Badge variant="outline">View Details</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions you can take on DreamLend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/create" className="block">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <h3 className="font-medium mb-2">Create New Loan Offer</h3>
                <p className="text-sm text-gray-600">
                  Lend your tokens and earn interest from borrowers.
                </p>
              </div>
            </a>
            <a href="/offers" className="block">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <h3 className="font-medium mb-2">Browse Loan Offers</h3>
                <p className="text-sm text-gray-600">
                  Find borrowing opportunities that match your needs.
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
