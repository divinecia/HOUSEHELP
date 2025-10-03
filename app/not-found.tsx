import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="hh-btn hh-btn-primary">
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="hh-btn hh-btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
