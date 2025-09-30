"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OtpSuccessPage() {
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(() => router.push("/"), 2000);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="hh-page">
      <main className="hh-main text-center">
        <div className="mx-auto h-16 w-16 rounded-full mb-4" style={{ backgroundColor: "var(--light-blue)" }} />
        <h1 className="hh-title">Phone Number Verified!</h1>
        <p className="hh-subtitle">You will be redirected shortly.</p>
        <div className="mt-6 space-x-3">
          <Link href="/" className="hh-btn hh-btn-primary">Continue</Link>
        </div>
      </main>
    </div>
  );
}
