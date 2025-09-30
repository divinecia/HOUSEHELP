"use client";

import Link from "next/link";

export default function HouseholdStep3() {
  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Verify your account</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-100" /></div>
        <p className="hh-muted mt-2">Step 3 of 3: Verification</p>

        <form className="mt-6 space-y-6">
          {/* Identity Verification */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Identity Verification</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="nid">National ID/Passport Upload</label>
                <input id="nid" type="file" className="hh-input" />
              </div>
              <div>
                <label className="hh-label" htmlFor="res">Proof of Residence</label>
                <input id="res" type="file" className="hh-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="selfie">Selfie Photo</label>
                <input id="selfie" type="file" className="hh-input" />
              </div>
            </div>
          </section>

          {/* Payment Setup */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Payment Method Setup</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">Payment Method</label>
                <select className="hh-select">
                  <option>Credit/Debit Card</option>
                  <option>Mobile Money</option>
                  <option>Bank Account</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="verify">Payment Method Verification</label>
                <input id="verify" className="hh-input" placeholder="Enter verification details" />
              </div>
            </div>
          </section>

          {/* Agreements */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Agreement and Consent</h2>
            <div>
              <label className="hh-label"><input type="checkbox" className="hh-checkbox" />Agree to Terms of Service</label>
              <label className="hh-label"><input type="checkbox" className="hh-checkbox" />Agree to Privacy Policy</label>
              <label className="hh-label"><input type="checkbox" className="hh-checkbox" />Background Check Consent</label>
              <label className="hh-label"><input type="checkbox" className="hh-checkbox" />Communication Preferences</label>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Link href="/household/register/step-2" className="hh-btn hh-btn-secondary">Back</Link>
            <Link href="/household/register/success" className="hh-btn hh-btn-primary">Create Account</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
