import { useState, useEffect, useCallback } from "react";

// Base API URL
const BASE_API_URL = "https://api.neurolend.sumitdhiman.in";

// Types matching the actual REST API responses
export interface RestLoan {
  loan_id: string;
  lender: string | null;
  borrower: string;
  amount: string;
  status: string; // "Active", "Pending", "Repaid", etc.
  created_at: number;
  events_count: number;
  // Additional fields that might be present
  tokenAddress?: string;
  interestRate?: string;
  duration?: string;
  collateralAddress?: string;
  collateralAmount?: string;
  startTime?: string;
  minCollateralRatioBPS?: string;
  liquidationThresholdBPS?: string;
  maxPriceStaleness?: string;
  repaidAmount?: string;
  historicalPriceUSD?: string;
  historicalAmountUSD?: string;
}

export interface RestStats {
  totalLoansCreated: number;
  totalLoanVolumeUSD: string;
  totalActiveLoans: number;
  totalRepaidLoans: number;
  totalDefaultedLoans: number;
  averageInterestRate: string;
  averageDuration: string;
}

export interface RestEvent {
  id: string;
  eventType: string;
  transactionHash: string;
  blockNumber: string;
  timestamp: string;
  loanId?: string;
  data: any;
}

// Hook to fetch all loans
export function useRestLoans() {
  const [loans, setLoans] = useState<RestLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_API_URL}/loans`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      const loansArray = Array.isArray(data) ? data : data.loans || [];

      setLoans(loansArray);
    } catch (err) {
      console.error("Failed to fetch loans:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return {
    loans,
    loading,
    error,
    refetch: fetchLoans,
  };
}

// Hook to fetch protocol stats
export function useRestStats() {
  const [stats, setStats] = useState<RestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_API_URL}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Hook to fetch events (all or by type)
export function useRestEvents(eventType?: string) {
  const [events, setEvents] = useState<RestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = eventType ? `/events/${eventType}` : "/events";
      const response = await fetch(`${BASE_API_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      const eventsArray = Array.isArray(data) ? data : data.events || [];

      setEvents(eventsArray);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [eventType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}

// Combined hook for offers page (loans + stats)
export function useRestOffersData() {
  const {
    loans,
    loading: loansLoading,
    error: loansError,
    refetch: refetchLoans,
  } = useRestLoans();
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useRestStats();

  // Filter for pending loans only (status "Pending")
  const pendingLoans = loans.filter((loan) => loan.status === "Pending");

  const refresh = useCallback(() => {
    refetchLoans();
    refetchStats();
  }, [refetchLoans, refetchStats]);

  return {
    loans: pendingLoans,
    stats,
    loading: loansLoading || statsLoading,
    error: loansError || statsError,
    refresh,
    // Additional computed data
    totalLoans: loans.length,
    pendingLoansCount: pendingLoans.length,
    lastUpdated: Date.now(), // Simple timestamp for now
  };
}

// Utility function to convert RestLoan to ProcessedLoan format (for compatibility)
export function convertRestLoanToProcessedLoan(restLoan: RestLoan) {
  // Convert string status to numeric status for compatibility
  const getNumericStatus = (status: string): number => {
    switch (status?.toLowerCase()) {
      case "pending":
        return 0;
      case "active":
        return 1;
      case "repaid":
        return 2;
      case "defaulted":
        return 3;
      case "cancelled":
        return 4;
      default:
        return 0; // Default to pending
    }
  };

  return {
    id: BigInt(restLoan.loan_id),
    lender: restLoan.lender || "0x0000000000000000000000000000000000000000",
    borrower: restLoan.borrower,
    tokenAddress:
      restLoan.tokenAddress || "0x0000000000000000000000000000000000000000",
    amount: BigInt(restLoan.amount || "0"),
    interestRate: BigInt(restLoan.interestRate || "0"),
    duration: BigInt(restLoan.duration || "0"),
    collateralAddress:
      restLoan.collateralAddress ||
      "0x0000000000000000000000000000000000000000",
    collateralAmount: BigInt(restLoan.collateralAmount || "0"),
    startTime: BigInt(restLoan.startTime || "0"),
    createdAt: BigInt(restLoan.created_at || 0),
    status: getNumericStatus(restLoan.status),
    minCollateralRatioBPS: BigInt(restLoan.minCollateralRatioBPS || "15000"),
    liquidationThresholdBPS: BigInt(
      restLoan.liquidationThresholdBPS || "12000"
    ),
    maxPriceStaleness: BigInt(restLoan.maxPriceStaleness || "3600"),
    repaidAmount: BigInt(restLoan.repaidAmount || "0"),
    historicalPriceUSD: restLoan.historicalPriceUSD || "0",
    historicalAmountUSD: restLoan.historicalAmountUSD || "0",
  };
}
