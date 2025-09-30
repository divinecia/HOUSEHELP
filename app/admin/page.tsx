"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";

const schema = z.object({
  empId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(1, "Password is required"),
  code: z.string().optional().refine((v) => !v || /^\d{6}$/.test(v), {
    message: "2FA code must be 6 digits",
  }),
});

export default function AdminPage() {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});
    const parsed = schema.safeParse({ empId, password, code });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setError("Invalid credentials. Please try again or contact IT support.");
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Admin Portal Access</h1>
        <p className="hh-subtitle">Secure area for authorized personnel.</p>

        {/* Company Logo */}
        <div className="mt-4 mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full company-logo" />
          <span className="font-semibold text-slate-800">HOUSEHELP</span>
        </div>

        <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 p-6 bg-white">
          <div className="hh-form-section">
            <label className="hh-label" htmlFor="empId">Employee ID</label>
            <input id="empId" className="hh-input" value={empId} onChange={(e)=>setEmpId(e.target.value)} placeholder="e.g., HH-00123" />
            {formErrors.empId && <div className="hh-error">{formErrors.empId}</div>}
          </div>
          <div className="hh-form-section">
            <label className="hh-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="hh-input" value={password} onChange={(e)=>setPassword(e.target.value)} />
            {formErrors.password && <div className="hh-error">{formErrors.password}</div>}
          </div>
          <div className="hh-form-section">
            <label className="hh-label" htmlFor="code">Two-Factor Code (optional)</label>
            <input id="code" inputMode="numeric" className="hh-input" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="6-digit code" />
            <p className="hh-help">Enter the code from your authenticator app if prompted.</p>
            {formErrors.code && <div className="hh-error">{formErrors.code}</div>}
          </div>

          {error && <div className="hh-error">{error}</div>}

          <div className="mt-6 flex items-center gap-3">
            <button type="submit" className="hh-btn hh-btn-primary" disabled={loading}>
              {loading ? "Securing..." : "Secure Login"}
            </button>
            {loading && (
              <span className="hh-muted">Authenticating…</span>
            )}
          </div>
        </form>

        <div className="mt-4">
          <a href="mailto:it@househelprw.com" className="hh-link">Contact IT Support</a>
        </div>

        <div className="mt-6">
          <Link href="/" className="hh-link">← Back to Welcome</Link>
        </div>
      </main>
    </div>
  );
}
