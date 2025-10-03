import { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  loadingTimeout: 3000,
  onError: (error, key) => {
    console.error(`SWR Error for ${key}:`, error);
    // TODO: Send to error monitoring service
  },
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Never retry on 404
    if (error.status === 404) return;

    // Never retry on unauthorized
    if (error.status === 401 || error.status === 403) return;

    // Only retry up to 3 times
    if (retryCount >= 3) return;

    // Retry after 5 seconds with exponential backoff
    setTimeout(() => revalidate({ retryCount }), 5000 * Math.pow(2, retryCount));
  },
};

// Default fetcher with error handling
export const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  return res.json();
};

// Fetcher with authentication
export const authFetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hh-token') : null;

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    cache: 'no-store'
  });

  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  return res.json();
};
