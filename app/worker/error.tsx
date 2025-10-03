"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function WorkerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Worker portal error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Worker Portal Error
        </h1>
        <p className="text-gray-600 mb-6">
          An error occurred in the worker portal. Please try again or return to your dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-left bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="font-mono text-xs text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="hh-btn hh-btn-primary">
            Try Again
          </button>
          <Link href="/worker/dashboard" className="hh-btn hh-btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
