"use client";

import Link from "next/link";

export default function WorkerStep4() {
  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Verify your identity</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-100" /></div>
        <p className="hh-muted mt-2">Step 4 of 4: Verification</p>

        <form className="mt-6 space-y-6">
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">ID Document Upload</h2>
            <div className="hh-form-grid">
              <div><label className="hh-label">Front of National ID</label><input type="file" className="hh-input" /></div>
              <div><label className="hh-label">Back of National ID</label><input type="file" className="hh-input" /></div>
              <div className="sm:col-span-2"><label className="hh-label">Selfie with ID</label><input type="file" className="hh-input" /></div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Background Check Consent</h2>
            <label className="hh-label"><input type="checkbox" className="hh-checkbox" /> I consent to a background check</label>
            <p className="hh-help">By continuing you agree to our <Link href="/" className="hh-link">Terms</Link> and <Link href="/" className="hh-link">Privacy Policy</Link>.</p>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Contact Verification</h2>
            <div className="hh-form-grid">
              <div><label className="hh-label">Phone OTP</label><input className="hh-input" placeholder="Enter 6-digit code" /></div>
              <div><label className="hh-label">Email Verification</label><input className="hh-input" placeholder="Enter token if provided" /></div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Link href="/worker/register/step-3" className="hh-btn hh-btn-secondary">Back</Link>
            <Link href="/worker/register/success" className="hh-btn hh-btn-primary">Submit Application</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
