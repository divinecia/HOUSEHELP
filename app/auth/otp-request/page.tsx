"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OtpRequestPage() {
  const [phone, setPhone] = useState("+250 7");
  const [country, setCountry] = useState("RW");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendOtp = async () => {
    setError(null);
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: countryCode + phone }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      setCooldown(60);
    } catch (error) {
      // Error handling - could show toast/alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Verify Your Phone Number</h1>
        <p className="hh-subtitle">We will send a 6-digit code to your phone.</p>

        <div className="hh-form-panel">
          <div className="hh-form-grid">
            <div>
              <label htmlFor="country-select" className="hh-label">Country</label>
              <select id="country-select" className="hh-select" value={country} onChange={(e)=>setCountry(e.target.value)}>
                <option value="RW">Rwanda (+250)</option>
                <option value="UG">Uganda (+256)</option>
                <option value="KE">Kenya (+254)</option>
                <option value="TZ">Tanzania (+255)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="phone-input" className="hh-label">Phone Number</label>
              <input id="phone-input" className="hh-input" inputMode="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Enter your phone number" />
              <div className="mt-2 flex items-center gap-3">
                <button className="hh-btn hh-btn-primary" onClick={sendOtp} disabled={loading}>
                  {loading ? "Sending..." : "Send OTP"}
                </button>
                <button className="hh-btn hh-btn-secondary" onClick={()=>setCooldown(60)} disabled={cooldown>0}>
                  {cooldown>0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
                <Link href="/auth/otp-verify" className="hh-link">Continue to Verify →</Link>
              </div>
              {error && <div className="hh-error">{error}</div>}
            </div>
          </div>
          <div>
            <Link href="/auth/otp-request" className="hh-link">Change Number</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
