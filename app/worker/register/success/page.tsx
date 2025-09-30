"use client";

import Link from "next/link";

export default function WorkerSuccess() {
  return (
    <div className="hh-page">
      <main className="hh-main text-center">
        <div className="mx-auto h-16 w-16 rounded-full mb-4" style={{ backgroundColor: "var(--light-blue)" }} />
        <h1 className="hh-title">Application Submitted Successfully!</h1>
        <p className="hh-subtitle">Your application is under review. We'll notify you within 24–48 hours.</p>
        <div className="mt-6 space-x-3">
          <Link href="/worker/login" className="hh-btn hh-btn-primary">Continue to Login</Link>
          <a href="mailto:support@househelprw.com" className="hh-btn hh-btn-secondary">Contact Support</a>
        </div>
      </main>
    </div>
  );
}
