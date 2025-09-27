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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  DollarSign,
  Clock,
} from "lucide-react";
import { useP2PLending } from "@/hooks/useP2PLending";
import { ethers } from "ethers";
import { getTokenByAddress } from "@/config/tokens";

interface OrderBookProps {
  selectedToken?: string;
  onOrderSelect?: (order: any, type: "offer" | "request") => void;
}

interface LoanOffer {
  id: string;
  lender: string;
  tokenAddress: string;
  amount: string;
  interestRate: number;
  duration: number;
  collateralAddress: string;
  collateralAmount: string;
  liquidityUSD: string;
  tokenInfo?: any;
  collateralInfo?: any;
}

interface LoanRequest {
  id: string;
  borrower: string;
  tokenAddress: string;
  amount: string;
  maxInterestRate: number;
  duration: number;
  collateralAddress: string;
  collateralAmount: string;
  liquidityUSD: string;
  tokenInfo?: any;
  collateralInfo?: any;
}

export function OrderBook({ selectedToken, onOrderSelect }: OrderBookProps) {
  const { address } = useP2PLending();
  const [isLoading, setIsLoading] = useState(true);
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mock data for now - replace with real contract calls
  useEffect(() => {
    const fetchOrderBookData = async () => {
      setIsLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock loan offers (asks)
      const mockOffers: LoanOffer[] = [
        {
          id: "1",
          lender: "0x1234...5678",
          tokenAddress: "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E",
          amount: "1000",
          interestRate: 800, // 8.00% in basis points
          duration: 30,
          collateralAddress: "0x9CC1d782E6dfe5936204c3295cb430e641DcF300",
          collateralAmount: "0.5",
          liquidityUSD: "$1,000.00",
          tokenInfo: getTokenByAddress(
            "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E"
          ),
          collateralInfo: getTokenByAddress(
            "0x9CC1d782E6dfe5936204c3295cb430e641DcF300"
          ),
        },
        {
          id: "2",
          lender: "0x2345...6789",
          tokenAddress: "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E",
          amount: "2000",
          interestRate: 775, // 7.75%
          duration: 30,
          collateralAddress: "0x9CC1d782E6dfe5936204c3295cb430e641DcF300",
          collateralAmount: "1.0",
          liquidityUSD: "$2,000.00",
          tokenInfo: getTokenByAddress(
            "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E"
          ),
          collateralInfo: getTokenByAddress(
            "0x9CC1d782E6dfe5936204c3295cb430e641DcF300"
          ),
        },
      ];

      // Mock loan requests (bids)
      const mockRequests: LoanRequest[] = [
        {
          id: "1",
          borrower: "0x3456...7890",
          tokenAddress: "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E",
          amount: "1500",
          maxInterestRate: 600, // 6.00%
          duration: 30,
          collateralAddress: "0x9CC1d782E6dfe5936204c3295cb430e641DcF300",
          collateralAmount: "0.8",
          liquidityUSD: "$1,500.00",
          tokenInfo: getTokenByAddress(
            "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E"
          ),
          collateralInfo: getTokenByAddress(
            "0x9CC1d782E6dfe5936204c3295cb430e641DcF300"
          ),
        },
      ];

      setLoanOffers(mockOffers);
      setLoanRequests(mockRequests);
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    fetchOrderBookData();
  }, [selectedToken]);

  const handleRefresh = () => {
    // Refresh order book data
    setLastUpdated(new Date());
  };

  const formatRate = (basisPoints: number) => {
    return (basisPoints / 100).toFixed(2);
  };

  const formatDuration = (days: number) => {
    return `${days}d`;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 text-primary mr-2" />
              Order Book
            </CardTitle>
            <CardDescription>
              {selectedToken
                ? `${selectedToken} lending market`
                : "Live lending market"}
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <div className="text-xs text-muted-foreground flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Lend Offers (Asks) - Left Side */}
          <div className="border-r border-border/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-600 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Lend Offers
                </h3>
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {loanOffers.length} offers
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground px-2 py-1">
                  <span>APR</span>
                  <span className="text-center">Amount</span>
                  <span className="text-right">Liquidity</span>
                </div>

                {loanOffers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No lend offers available</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {loanOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="grid grid-cols-3 gap-2 p-2 rounded-lg hover:bg-green-50/50 cursor-pointer transition-colors border border-transparent hover:border-green-200"
                        onClick={() => onOrderSelect?.(offer, "offer")}
                      >
                        <div className="text-sm font-medium text-green-600">
                          {formatRate(offer.interestRate)}%
                        </div>
                        <div className="text-sm text-center">
                          {parseFloat(offer.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-right text-muted-foreground">
                          {offer.liquidityUSD}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Borrow Requests (Bids) - Right Side */}
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-red-600 flex items-center text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Borrow Requests
                </h3>
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200"
                >
                  {loanRequests.length} requests
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground px-2 py-1">
                  <span>Max APR</span>
                  <span className="text-center">Amount</span>
                  <span className="text-right">Collateral</span>
                </div>

                {loanRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No borrow requests available</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {loanRequests.map((request) => (
                      <div
                        key={request.id}
                        className="grid grid-cols-3 gap-2 p-2 rounded-lg hover:bg-red-50/50 cursor-pointer transition-colors border border-transparent hover:border-red-200"
                        onClick={() => onOrderSelect?.(request, "request")}
                      >
                        <div className="text-sm font-medium text-red-600">
                          {formatRate(request.maxInterestRate)}%
                        </div>
                        <div className="text-sm text-center">
                          {parseFloat(request.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-right text-muted-foreground">
                          {parseFloat(request.collateralAmount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Market Stats Footer */}
        <div className="border-t border-border/50 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Mid Rate</div>
              <div className="text-sm font-bold">
                {loanOffers.length > 0 && loanRequests.length > 0
                  ? `${
                      ((formatRate(
                        loanOffers[loanOffers.length - 1]?.interestRate || 0
                      ) as any) +
                        (formatRate(
                          loanRequests[0]?.maxInterestRate || 0
                        ) as any)) /
                      2
                    }%`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Spread</div>
              <div className="text-sm font-bold">
                {loanOffers.length > 0 && loanRequests.length > 0
                  ? `${
                      (formatRate(
                        loanOffers[loanOffers.length - 1]?.interestRate || 0
                      ) as any) -
                      (formatRate(loanRequests[0]?.maxInterestRate || 0) as any)
                    }%`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Offers</div>
              <div className="text-sm font-bold text-green-600">
                {loanOffers.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Total Requests
              </div>
              <div className="text-sm font-bold text-red-600">
                {loanRequests.length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderBook;
