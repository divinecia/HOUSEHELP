"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Please confirm your password"),
  national_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  address: z.string().optional(),
  gps_location: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function WorkerStep1() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    national_id: "",
    date_of_birth: "",
    gender: "",
    district: "",
    sector: "",
    address: "",
    gps_location: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // Validate form
    const res = schema.safeParse(form);
    if (!res.success) {
      const err: Record<string, string> = {};
      res.error.issues.forEach((i) => {
        err[i.path[0] as string] = i.message;
      });
      setErrors(err);
      return;
    }

    setLoading(true);

    try {
      // Call registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: 'worker',
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and user info
      if (data.token) {
        localStorage.setItem('hh-token', data.token);
        localStorage.setItem('hh-user', JSON.stringify(data.user));
        localStorage.setItem('hh-worker-id', data.user.id);
      }

      // Redirect based on verification requirement
      if (data.otp_sent && data.requires_verification) {
        router.push(`/auth/otp-verify?email=${encodeURIComponent(form.email)}&type=worker`);
      } else {
        router.push('/worker/register/step-2');
      }
    } catch (error: any) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Join as a Professional Worker</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-33" /></div>
        <p className="hh-muted mt-2">Step 1 of 4: Basic Info & Account</p>

        {apiError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {apiError}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Profile Photo</h2>
            <input type="file" className="hh-input" />
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Personal Information</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="full_name">Full Name *</label>
                <input id="full_name" className="hh-input" value={form.full_name} onChange={(e)=>setForm({...form, full_name: e.target.value})} required />
                {errors.full_name && <div className="hh-error">{errors.full_name}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="phone">Phone Number *</label>
                <input id="phone" className="hh-input" inputMode="tel" placeholder="+250788123456" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} required />
                {errors.phone && <div className="hh-error">{errors.phone}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="email">Email Address</label>
                <input id="email" className="hh-input" type="email" placeholder="Optional" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
                {errors.email && <div className="hh-error">{errors.email}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="date_of_birth">Date of Birth</label>
                <input id="date_of_birth" className="hh-input" type="date" value={form.date_of_birth} onChange={(e)=>setForm({...form, date_of_birth: e.target.value})} />
              </div>
              <div>
                <label className="hh-label" htmlFor="gender">Gender</label>
                <select id="gender" className="hh-select" value={form.gender} onChange={(e)=>setForm({...form, gender: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="hh-label" htmlFor="national_id">National ID Number</label>
                <input id="national_id" className="hh-input" value={form.national_id} onChange={(e)=>setForm({...form, national_id: e.target.value})} />
                {errors.national_id && <div className="hh-error">{errors.national_id}</div>}
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Account Security</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="password">Password *</label>
                <input id="password" className="hh-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
                {errors.password && <div className="hh-error">{errors.password}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="confirm_password">Confirm Password *</label>
                <input id="confirm_password" className="hh-input" type="password" value={form.confirm_password} onChange={(e)=>setForm({...form, confirm_password: e.target.value})} required />
                {errors.confirm_password && <div className="hh-error">{errors.confirm_password}</div>}
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Address Information</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="district">District</label>
                <select id="district" className="hh-select" value={form.district} onChange={(e)=>setForm({...form, district: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Gasabo">Gasabo</option>
                  <option value="Kicukiro">Kicukiro</option>
                  <option value="Nyarugenge">Nyarugenge</option>
                </select>
              </div>
              <div>
                <label className="hh-label" htmlFor="sector">Sector</label>
                <input id="sector" className="hh-input" value={form.sector} onChange={(e)=>setForm({...form, sector: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="address">Current Address</label>
                <textarea id="address" className="hh-textarea" value={form.address} onChange={(e)=>setForm({...form, address: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="gps_location">GPS Location</label>
                <input id="gps_location" className="hh-input" placeholder="Optional" value={form.gps_location} onChange={(e)=>setForm({...form, gps_location: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Emergency Contact</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="emergency_contact_name">Contact Name</label>
                <input id="emergency_contact_name" className="hh-input" value={form.emergency_contact_name} onChange={(e)=>setForm({...form, emergency_contact_name: e.target.value})} />
              </div>
              <div>
                <label className="hh-label" htmlFor="emergency_contact_phone">Phone Number</label>
                <input id="emergency_contact_phone" className="hh-input" value={form.emergency_contact_phone} onChange={(e)=>setForm({...form, emergency_contact_phone: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="emergency_contact_relationship">Relationship</label>
                <input id="emergency_contact_relationship" className="hh-input" value={form.emergency_contact_relationship} onChange={(e)=>setForm({...form, emergency_contact_relationship: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Social Registration</h2>
            <div className="flex gap-3">
              <button type="button" className="hh-btn hh-btn-secondary" onClick={() => signIn('github')}>Continue with GitHub</button>
            </div>
          </section>

          <div className="flex flex-col gap-3">
            <button type="submit" className="hh-btn hh-btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account & Continue'}
            </button>
            <span className="hh-muted text-center">Already have an account? <Link href="/worker/login" className="hh-link">Login</Link></span>
          </div>
        </form>
      </main>
    </div>
  );
}
