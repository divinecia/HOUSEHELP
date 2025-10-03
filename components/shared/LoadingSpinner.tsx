export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-slate-200 border-t-blue-600 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <LoadingSpinner size="lg" />
      <p className="text-slate-600">{message}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
    </div>
  );
}