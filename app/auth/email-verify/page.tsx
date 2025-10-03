"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function EmailVerifyPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendEmail = async () => {
    setMessage(null);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMessage("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      setMessage("Check your email for verification link.");
    } catch (error) {
      setMessage("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
    setCooldown(60);
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Verify Your Email</h1>
        <p className="hh-subtitle">We&apos;ll send a secure link to your inbox.</p>

        <div className="hh-form-panel">
          <div>
            <label htmlFor="email-input" className="hh-label">Email Address</label>
            <input id="email-input" className="hh-input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter your email address" />
          </div>
          {message && <div className={message.includes('Check') ? 'text-green-600' : 'hh-error'}>{message}</div>}
          <div className="flex items-center gap-3">
            <button className="hh-btn hh-btn-primary" onClick={sendEmail} disabled={loading}>{loading?"Sending...":"Send Verification Email"}</button>
            <button className="hh-btn hh-btn-secondary" onClick={()=>setCooldown(60)} disabled={cooldown>0}>
              {cooldown>0?`Resend in ${cooldown}s`:"Resend Email"}
            </button>
            <Link href="/" className="hh-link">Skip for Now</Link>
          </div>
          <div>
            <Link href="/auth/email-verify" className="hh-link">Change Email</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
