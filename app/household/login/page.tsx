"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signIn } from "next-auth/react";

const schema = z.object({
  identifier: z.string().min(3, "Enter phone or email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export default function HouseholdLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "", remember: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState("en");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    
    // Validate form
    const res = schema.safeParse(form);
    if (!res.success) {
      const err: Record<string, string> = {};
      res.error.issues.forEach(i => err[i.path[0] as string] = i.message);
      setErrors(err);
      return;
    }
    
    setLoading(true);

    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.identifier,
          password: form.password,
          user_type: 'household',
          remember_me: form.remember,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user info
      if (data.token) {
        localStorage.setItem('hh-token', data.token);
        localStorage.setItem('hh-user', JSON.stringify(data.user));
        localStorage.setItem('hh-household-id', data.user.id);
      }

      // Redirect to dashboard
      router.push('/household/dashboard');
    } catch (error: any) {
      setError(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Welcome Back</h1>
        <p className="hh-subtitle">Household</p>

        <form onSubmit={onSubmit} className="hh-form-panel">
          <div>
            <label htmlFor="household-identifier" className="hh-label">Phone Number or Email</label>
            <input id="household-identifier" className="hh-input" value={form.identifier} onChange={(e)=>setForm({...form, identifier: e.target.value})} placeholder="Enter your phone number or email" />
            {errors.identifier && <div className="hh-error">{errors.identifier}</div>}
          </div>
          <div>
            <label htmlFor="household-password" className="hh-label">Password</label>
            <div className="flex gap-2">
              <input id="household-password" className="hh-input flex-1" type={show?"text":"password"} value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} placeholder="Enter your password" />
              <button type="button" className="hh-btn hh-btn-secondary" onClick={()=>setShow(s=>!s)}>{show?"Hide":"Show"}</button>
            </div>
            {errors.password && <div className="hh-error">{errors.password}</div>}
          </div>
          <div className="flex items-center justify-between">
            <label className="hh-label"><input type="checkbox" className="hh-checkbox" checked={form.remember} onChange={(e)=>setForm({...form, remember: e.target.checked})} /> Remember Me</label>
            <Link href="/auth/forgot-password" className="hh-link">Forgot Password?</Link>
          </div>
          {error && <div className="hh-error">{error}</div>}
          <button type="submit" className="hh-btn hh-btn-primary" disabled={loading}>{loading?"Logging in...":"Login"}</button>

          <div className="mt-4">
            <div className="hh-muted mb-2">Or continue with</div>
            <div className="flex gap-3">
              <button type="button" className="hh-btn hh-btn-secondary" onClick={()=>signIn('google')}>Continue with Google</button>
              <button type="button" className="hh-btn hh-btn-secondary" onClick={()=>signIn('github')}>Continue with GitHub</button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="hh-muted">Don&apos;t have an account? <Link href="/household/register/step-1" className="hh-link">Sign Up</Link></span>
            <select className="hh-select" value={lang} onChange={(e)=>setLang(e.target.value)} aria-label="Select language">
              <option value="en">English</option>
              <option value="rw">Kinyarwanda</option>
              <option value="fr">French</option>
            </select>
          </div>
        </form>

        <div className="mt-6">
          <Link href="/" className="hh-link">← Back to Welcome</Link>
        </div>
      </main>
    </div>
  );
}
