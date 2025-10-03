"use client";

import useSWR from "swr";
import { authFetcher } from "@/lib/swr-config";

// Generic hook for fetching data with SWR
export function useSWRData<T>(key: string | null, shouldFetch: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    shouldFetch && key ? key : null,
    authFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    isError: !!error,
  };
}

// Worker dashboard summary
export function useWorkerSummary(workerId: string | null) {
  return useSWRData<any>(
    workerId ? `/api/worker/dashboard/summary?worker_id=${workerId}` : null,
    !!workerId
  );
}

// Household dashboard summary
export function useHouseholdSummary(householdId: string | null) {
  return useSWRData<any>(
    householdId ? `/api/household/dashboard/summary?household_id=${householdId}` : null,
    !!householdId
  );
}

// Worker profile
export function useWorkerProfile(workerId: string | null) {
  return useSWRData<any>(
    workerId ? `/api/worker/profile?worker_id=${workerId}` : null,
    !!workerId
  );
}

// Household bookings
export function useHouseholdBookings(householdId: string | null) {
  return useSWRData<{ items: any[] }>(
    householdId ? `/api/household/bookings?household_id=${householdId}` : null,
    !!householdId
  );
}

// Worker notifications
export function useWorkerNotifications(workerId: string | null) {
  return useSWRData<{ notifications: any[] }>(
    workerId ? `/api/worker/notifications?worker_id=${workerId}` : null,
    !!workerId
  );
}

// Household messages
export function useHouseholdMessages(householdId: string | null) {
  return useSWRData<{ messages: any[] }>(
    householdId ? `/api/household/messages?household_id=${householdId}` : null,
    !!householdId
  );
}
