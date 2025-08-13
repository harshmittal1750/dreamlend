"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useP2PLending } from "@/hooks/useP2PLending";
import {
  PlusCircle,
  List,
  User,
  Shield,
  TrendingUp,
  Clock,
  Wallet,
  BarChart3,
} from "lucide-react";

export default function Home() {
  const { isConnected, activeLoanOfferIds, lenderLoans, borrowerLoans } =
    useP2PLending();

  const stats = [
    {
      icon: List,
      label: "Active Offers",
      value: activeLoanOfferIds?.length || 0,
      description: "Available loan offers",
      color: "text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "Your Loans as Lender",
      value: lenderLoans?.length || 0,
      description: "Loans you've created",
      color: "text-green-600",
    },
    {
      icon: Clock,
      label: "Your Loans as Borrower",
      value: borrowerLoans?.length || 0,
      description: "Loans you've accepted",
      color: "text-purple-600",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Collateral-Backed",
      description:
        "All loans are secured with collateral, protecting lenders from default risk.",
    },
    {
      icon: TrendingUp,
      title: "Competitive Rates",
      description:
        "Market-driven interest rates ensure fair pricing for both lenders and borrowers.",
    },
    {
      icon: Clock,
      title: "Flexible Terms",
      description:
        "Choose your own loan duration and terms, from days to months.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="flex justify-center items-center space-x-3 mb-4">
          <Wallet className="h-12 w-12 text-blue-600" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            DreamLend
          </h1>
        </div>

        <Badge variant="outline" className="text-lg px-4 py-2">
          Built on Somnia L1 Testnet
        </Badge>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The future of decentralized lending. Create loan offers, accept
          borrowing opportunities, and earn yield in a trustless, peer-to-peer
          environment.
        </p>

        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-gray-500">Connect your wallet to get started</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="flex items-center space-x-2">
                <PlusCircle className="h-5 w-5" />
                <span>Create Loan Offer</span>
              </Button>
            </Link>
            <Link href="/offers">
              <Button
                size="lg"
                variant="outline"
                className="flex items-center space-x-2"
              >
                <List className="h-5 w-5" />
                <span>Browse Offers</span>
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Stats Section */}
      {isConnected && (
        <section>
          <h2 className="text-2xl font-bold text-center mb-8">
            Platform Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {stat.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stat.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">Why DreamLend?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-green-600" />
                <span>For Lenders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">
                  1
                </Badge>
                <p className="text-sm">
                  Create a loan offer with your desired terms and collateral
                  requirements
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">
                  2
                </Badge>
                <p className="text-sm">
                  Your tokens are escrowed in the smart contract
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">
                  3
                </Badge>
                <p className="text-sm">
                  Earn interest when borrowers repay the loan
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <List className="h-5 w-5 text-blue-600" />
                <span>For Borrowers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">
                  1
                </Badge>
                <p className="text-sm">
                  Browse available loan offers and find terms that work for you
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">
                  2
                </Badge>
                <p className="text-sm">
                  Provide collateral and accept the loan
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">
                  3
                </Badge>
                <p className="text-sm">
                  Repay the loan with interest to get your collateral back
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      {isConnected && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump right into lending or borrowing on DreamLend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/create">
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <PlusCircle className="h-6 w-6" />
                    <span className="font-medium">Create Loan Offer</span>
                    <span className="text-xs text-gray-500">
                      Lend your tokens and earn interest
                    </span>
                  </Button>
                </Link>
                <Link href="/offers">
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <List className="h-6 w-6" />
                    <span className="font-medium">Browse Offers</span>
                    <span className="text-xs text-gray-500">
                      Find loans that match your needs
                    </span>
                  </Button>
                </Link>
                <Link href="/my-loans">
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <User className="h-6 w-6" />
                    <span className="font-medium">My Loans</span>
                    <span className="text-xs text-gray-500">
                      Manage your active loans
                    </span>
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="font-medium">Analytics</span>
                    <span className="text-xs text-gray-500">
                      Platform insights and metrics
                    </span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
