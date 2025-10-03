import { LoadingOverlay } from "@/components/shared/LoadingSpinner";

export default function WorkerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingOverlay message="Loading worker portal..." />
    </div>
  );
}
