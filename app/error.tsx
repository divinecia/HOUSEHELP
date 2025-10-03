"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service (e.g., Sentry)
      console.error('Error caught by error.tsx:', error);
    } else {
      console.error('Error caught by error.tsx:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-left bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="font-mono text-xs text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="hh-btn hh-btn-primary"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="hh-btn hh-btn-secondary"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
