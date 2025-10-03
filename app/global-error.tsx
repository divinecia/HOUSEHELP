"use client";

import { useEffect } from "react";

export default function GlobalError({
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
      console.error('Global error caught:', error);
    } else {
      console.error('Global error caught:', error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Critical Error
            </h1>
            <p className="text-gray-600 mb-6">
              We&apos;re sorry, but a critical error occurred. Please refresh the page or contact support if the problem persists.
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
