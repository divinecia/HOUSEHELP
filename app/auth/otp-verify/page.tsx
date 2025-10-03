"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OtpVerifyPage() {
  const router = useRouter();
  const [values, setValues] = useState<string[]>(["", "", "", "", "", ""]);
  
  // Fix React Hook violation by declaring refs properly
  const input0 = useRef<HTMLInputElement>(null);
  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);
  const input4 = useRef<HTMLInputElement>(null);
  const input5 = useRef<HTMLInputElement>(null);
  const inputs = useMemo(() => [input0, input1, input2, input3, input4, input5], []);
  
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputs[0].current?.focus();
  }, [inputs]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[idx] = val;
    setValues(next);
    if (val && idx < inputs.length - 1) inputs[idx + 1].current?.focus();
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) inputs[idx - 1].current?.focus();
  };

  // Auto-paste from SMS (full code)
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (txt.length === 6) {
      setValues(txt.split(""));
      inputs[5].current?.focus();
      e.preventDefault();
    }
  };

  const verify = async () => {
    setError(null);
    if (values.some((v) => v === "")) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });
      if (!res.ok) {
        setError("Invalid OTP. Please try again.");
        return;
      }
      router.push("/auth/otp-success");
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Enter Verification Code</h1>
        <p className="hh-subtitle">Code sent to +250 XXX XXX XXX</p>

        <div className="hh-form-panel">
          <div className="flex gap-2">
            {values.map((v, i) => (
              <input
                key={i}
                ref={inputs[i]}
                value={v}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                inputMode="numeric"
                className="hh-input w-12 text-center"
                maxLength={1}
                aria-label={`Digit ${i + 1} of verification code`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="hh-btn hh-btn-primary" onClick={verify} disabled={loading}>{loading?"Verifying...":"Verify"}</button>
            <button className="hh-btn hh-btn-secondary" onClick={()=>setCooldown(60)} disabled={cooldown>0}>
              {cooldown>0?`Resend in ${cooldown}s`:"Resend Code"}
            </button>
            <Link href="/auth/otp-request" className="hh-link">Change Phone Number</Link>
          </div>
          {error && <div className="hh-error">{error}</div>}
        </div>
      </main>
    </div>
  );
}
