import { useState, useEffect } from "react";
import React from "react";

// =================================================================
// 1. Type Definitions for Subgraph Entities
// =================================================================
// These types should match the schema of your subgraph entities.

export interface LoanCreatedEvent {
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  collateralAddress: string;
  collateralAmount: string;
  duration: string;
  id: string;
  interestRate: string;
  lender: string;
  liquidationThresholdBPS: string;
  loanId: string;
  maxPriceStaleness: string;
  minCollateralRatioBPS: string;
  tokenAddress: string;
  transactionHash: string;
  // Historical price data from when loan was created
  priceUSD: string; // Price of loan token at creation time
  amountUSD: string; // USD value of loan amount at creation time
}

export interface LoanAcceptedEvent {
  id: string;
  loanId: string;
  borrower: string;
  timestamp: string;
  initialCollateralRatio: string;
}

export interface LoanRepaidEvent {
  id: string;
  loanId: string;
  borrower: string;
  repaymentAmount: string;
  timestamp: string;
}

export interface LoanLiquidatedEvent {
  id: string;
  loanId: string;
  liquidator: string;
  collateralClaimedByLender: string;
  liquidatorReward: string;
  timestamp: string;
}

export interface LoanOfferCancelledEvent {
  id: string;
  loanId: string;
  lender: string;
  timestamp: string;
}

export interface LoanOfferRemovedEvent {
  id: string;
  loanId: string;
  reason: string;
}

export interface OwnershipTransferredEvent {
  id: string;
  previousOwner: string;
  newOwner: string;
}

export interface PriceFeedSetEvent {
  id: string;
  tokenAddress: string;
  feedAddress: string;
}

// =================================================================
// 2. Generic Fetch Hook (The Engine)
// =================================================================
// This generic hook handles the actual fetching logic for any query.

interface UseSubgraphQueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useSubgraphQuery<T>(query: string): UseSubgraphQueryState<T> {
  const [state, setState] = useState<UseSubgraphQueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!query) return;

    const fetchData = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const apiUrl = `${window.location.origin}/api/subgraph`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Network response was not ok");
        }

        const result = await response.json();
        if (result.errors) {
          throw new Error(
            result.errors.map((e: Error) => e.message).join("\n")
          );
        }

        // The actual data is nested inside the 'data' property of the response
        setState({ data: result.data, loading: false, error: null });
      } catch (err: unknown) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        });
        console.error("Failed to fetch from subgraph proxy:", err);
      }
    };

    fetchData();
  }, [query]);

  return state;
}

// =================================================================
// 3. Specific Hooks for Each Event (The API for your components)
// =================================================================
// These hooks are what your components will actually use. They provide
// the correct query and type to the generic hook.

const defaultQueryOptions = `(first: 100, orderBy: blockTimestamp, orderDirection: desc)`;

// Hook to get LoanCreated events
export const useLoanCreatedEvents = () => {
  const query = `query GetLoanCreateds {
    loanCreateds${defaultQueryOptions} {
      amount
      blockNumber
      blockTimestamp
      collateralAddress
      collateralAmount
      duration
      id
      interestRate
      lender
      liquidationThresholdBPS
      loanId
      maxPriceStaleness
      minCollateralRatioBPS
      tokenAddress
      transactionHash
      priceUSD
      amountUSD
    }
  }`;
  return useSubgraphQuery<{ loanCreateds: LoanCreatedEvent[] }>(query);
};

export interface ProtocolStatsCollection {
  totalLoansCreated: string;
  totalLoanVolumeUSD: string;
  totalLoanVolume: string;
  id: string;
}

export const useProtocolStatsCollection = () => {
  const query = `query protocolStatsCollection{
  protocolStats_collection {
    totalLoansCreated
    totalLoanVolumeUSD
    totalLoanVolume
    id
  }
  
}`;
  return useSubgraphQuery<{
    protocolStats_collection: ProtocolStatsCollection[];
  }>(query);
};
// Hook to get LoanAccepted events
export const useLoanAcceptedEvents = () => {
  const query = `{
    loanAccepteds${defaultQueryOptions} { id loanId borrower timestamp initialCollateralRatio }
  }`;
  return useSubgraphQuery<{ loanAccepteds: LoanAcceptedEvent[] }>(query);
};

// Hook to get LoanRepaid events
export const useLoanRepaidEvents = () => {
  const query = `{
      loanRepaids${defaultQueryOptions} { id loanId borrower repaymentAmount timestamp }
    }`;
  return useSubgraphQuery<{ loanRepaids: LoanRepaidEvent[] }>(query);
};

// Hook to get LoanLiquidated events
export const useLoanLiquidatedEvents = () => {
  const query = `{
      loanLiquidateds${defaultQueryOptions} { id loanId liquidator collateralClaimedByLender liquidatorReward timestamp }
    }`;
  return useSubgraphQuery<{ loanLiquidateds: LoanLiquidatedEvent[] }>(query);
};

// Hook to get LoanOfferCancelled events
export const useLoanOfferCancelledEvents = () => {
  const query = `{
    loanOfferCancelleds${defaultQueryOptions} { id loanId lender timestamp }
  }`;
  return useSubgraphQuery<{ loanOfferCancelleds: LoanOfferCancelledEvent[] }>(
    query
  );
};

// Hook to get LoanOfferRemoved events
export const useLoanOfferRemovedEvents = () => {
  const query = `{
    loanOfferRemoveds${defaultQueryOptions} { id loanId reason }
  }`;
  return useSubgraphQuery<{ loanOfferRemoveds: LoanOfferRemovedEvent[] }>(
    query
  );
};

// =================================================================
// 4. Utility Functions for Processing Loan Data
// =================================================================

// Convert subgraph loan data to our Loan interface
export interface ProcessedLoan {
  id: bigint;
  lender: string;
  borrower: string;
  tokenAddress: string;
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  collateralAddress: string;
  collateralAmount: bigint;
  startTime: bigint;
  status: number; // 0=Pending, 1=Active, 2=Repaid, 3=Defaulted, 4=Cancelled
  // Historical price data from loan creation
  historicalPriceUSD?: string; // Price of loan token when created
  historicalAmountUSD?: string; // USD value of loan amount when created
}

// Determine loan status based on events
export const determineLoanStatus = (
  loanId: string,
  acceptedEvents: LoanAcceptedEvent[],
  repaidEvents: LoanRepaidEvent[],
  liquidatedEvents: LoanLiquidatedEvent[],
  cancelledEvents: LoanOfferCancelledEvent[],
  removedEvents: LoanOfferRemovedEvent[]
): number => {
  // Check if repaid first (final state)
  if (repaidEvents.some((e) => e.loanId === loanId)) return 2; // Repaid

  // Check if liquidated (final state)
  if (liquidatedEvents.some((e) => e.loanId === loanId)) return 3; // Defaulted

  // Check if accepted (active state)
  if (acceptedEvents.some((e) => e.loanId === loanId)) return 1; // Active

  // Check if explicitly cancelled by lender
  if (cancelledEvents.some((e) => e.loanId === loanId)) return 4; // Cancelled

  // LoanOfferRemoved can happen for both accepted and cancelled loans
  // Only treat as cancelled if there's no accepted event
  if (removedEvents.some((e) => e.loanId === loanId)) {
    // If there was no accepted event, it was likely cancelled
    return 4; // Cancelled
  }

  // Otherwise it's pending
  return 0; // Pending
};

// Process loan created events into our loan format
export const processLoansFromSubgraph = (
  loanCreatedEvents: LoanCreatedEvent[],
  acceptedEvents: LoanAcceptedEvent[],
  repaidEvents: LoanRepaidEvent[],
  liquidatedEvents: LoanLiquidatedEvent[],
  cancelledEvents: LoanOfferCancelledEvent[],
  removedEvents: LoanOfferRemovedEvent[]
): ProcessedLoan[] => {
  return loanCreatedEvents.map((loan) => {
    const status = determineLoanStatus(
      loan.loanId,
      acceptedEvents,
      repaidEvents,
      liquidatedEvents,
      cancelledEvents,
      removedEvents
    );

    // Find borrower from accepted events
    const acceptedEvent = acceptedEvents.find((e) => e.loanId === loan.loanId);
    const borrower =
      acceptedEvent?.borrower || "0x0000000000000000000000000000000000000000";

    // Find start time from accepted events
    const startTime = acceptedEvent?.timestamp || "0";

    return {
      id: BigInt(loan.loanId),
      lender: loan.lender,
      borrower,
      tokenAddress: loan.tokenAddress,
      amount: BigInt(loan.amount),
      interestRate: BigInt(loan.interestRate),
      duration: BigInt(loan.duration),
      collateralAddress: loan.collateralAddress,
      collateralAmount: BigInt(loan.collateralAmount),
      startTime: BigInt(startTime),
      status,
      // Include historical price data
      historicalPriceUSD: loan.priceUSD,
      historicalAmountUSD: loan.amountUSD,
    };
  });
};

// Hook to get all loan data with computed status
export const useAllLoansWithStatus = () => {
  const {
    data: loanCreatedData,
    loading: loadingCreated,
    error: errorCreated,
  } = useLoanCreatedEvents();
  const {
    data: loanAcceptedData,
    loading: loadingAccepted,
    error: errorAccepted,
  } = useLoanAcceptedEvents();
  const {
    data: loanRepaidData,
    loading: loadingRepaid,
    error: errorRepaid,
  } = useLoanRepaidEvents();
  const {
    data: loanLiquidatedData,
    loading: loadingLiquidated,
    error: errorLiquidated,
  } = useLoanLiquidatedEvents();
  const {
    data: loanCancelledData,
    loading: loadingCancelled,
    error: errorCancelled,
  } = useLoanOfferCancelledEvents();
  const {
    data: loanRemovedData,
    loading: loadingRemoved,
    error: errorRemoved,
  } = useLoanOfferRemovedEvents();

  const loading =
    loadingCreated ||
    loadingAccepted ||
    loadingRepaid ||
    loadingLiquidated ||
    loadingCancelled ||
    loadingRemoved;
  const error =
    errorCreated ||
    errorAccepted ||
    errorRepaid ||
    errorLiquidated ||
    errorCancelled ||
    errorRemoved;

  const processedLoans = React.useMemo(() => {
    if (!loanCreatedData?.loanCreateds) return [];

    return processLoansFromSubgraph(
      loanCreatedData.loanCreateds,
      loanAcceptedData?.loanAccepteds || [],
      loanRepaidData?.loanRepaids || [],
      loanLiquidatedData?.loanLiquidateds || [],
      loanCancelledData?.loanOfferCancelleds || [],
      loanRemovedData?.loanOfferRemoveds || []
    );
  }, [
    loanCreatedData,
    loanAcceptedData,
    loanRepaidData,
    loanLiquidatedData,
    loanCancelledData,
    loanRemovedData,
  ]);

  return {
    loans: processedLoans,
    loading,
    error,
  };
};
