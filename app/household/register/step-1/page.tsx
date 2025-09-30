"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import ServiceCategoriesPreview from "@/components/ServiceCategoriesPreview";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Please confirm your password"),
  alternative_contact: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  address: z.string().optional(),
  landmark: z.string().optional(),
  gps_location: z.string().optional(),
  property_type: z.string().optional(),
  number_of_rooms: z.number().optional(),
  has_garden: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  special_features: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function HouseholdStep1() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    alternative_contact: "",
    district: "",
    sector: "",
    address: "",
    landmark: "",
    gps_location: "",
    property_type: "",
    number_of_rooms: 0,
    has_garden: false,
    has_parking: false,
    special_features: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  useEffect(() => {
    const u = session?.user;
    if (!u) return;
    setForm((f) => ({
      ...f,
      name: f.name || (u.name ?? ""),
      email: f.email || (u.email ?? ""),
    }));
  }, [session]);
  const detectGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setForm({...form, gps_location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`});
    });
  };

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
          user_type: 'household',
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
        localStorage.setItem('hh-household-id', data.user.id);
      }

      // Redirect based on verification requirement
      if (data.otp_sent && data.requires_verification) {
        router.push(`/auth/otp-verify?email=${encodeURIComponent(form.email)}&type=household`);
      } else {
        router.push('/household/register/step-2');
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
        <h1 className="hh-title">Find Trusted Help for Your Home</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-33" /></div>
        <p className="hh-muted mt-2">Step 1 of 3: Basic Info & Account</p>

        {apiError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {apiError}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Household Head Information */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Household Head Information</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="name">Full Name *</label>
                <input id="name" className="hh-input" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
                {errors.name && <div className="hh-error">{errors.name}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="phone">Phone Number *</label>
                <input id="phone" className="hh-input" inputMode="tel" placeholder="+250788123456" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} required />
                {errors.phone && <div className="hh-error">{errors.phone}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="email">Email Address *</label>
                <input id="email" className="hh-input" type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
                {errors.email && <div className="hh-error">{errors.email}</div>}
              </div>
              <div>
                <label className="hh-label" htmlFor="alternative_contact">Alternative Contact</label>
                <input id="alternative_contact" className="hh-input" value={form.alternative_contact} onChange={(e)=>setForm({...form, alternative_contact: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="photo">Profile Photo</label>
                <input id="photo" type="file" className="hh-input" />
              </div>
            </div>
          </section>

          {/* Account Security */}
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

          {/* Address Information */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Address Information</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="district">District</label>
                <select id="district" className="hh-select" value={form.district} onChange={(e)=>setForm({...form, district: e.target.value})}>
                  <option value="">Select district</option>
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
                <label className="hh-label" htmlFor="address">Detailed Address</label>
                <textarea id="address" className="hh-textarea" value={form.address} onChange={(e)=>setForm({...form, address: e.target.value})} />
              </div>
              <div>
                <label className="hh-label" htmlFor="gps_location">GPS Location</label>
                <input id="gps_location" className="hh-input" value={form.gps_location} readOnly placeholder="lat, lng" />
                <button type="button" className="hh-btn hh-btn-secondary mt-2" onClick={detectGPS}>Auto-detect</button>
              </div>
              <div>
                <label className="hh-label" htmlFor="landmark">Landmark Description</label>
                <input id="landmark" className="hh-input" value={form.landmark} onChange={(e)=>setForm({...form, landmark: e.target.value})} />
              </div>
            </div>
          </section>

          {/* Property Details */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Property Details</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="property_type">Property Type</label>
                <select id="property_type" className="hh-select" value={form.property_type} onChange={(e)=>setForm({...form, property_type: e.target.value})}>
                  <option value="">Select</option>
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              <div>
                <label className="hh-label" htmlFor="number_of_rooms">Number of Rooms</label>
                <input id="number_of_rooms" className="hh-input" type="number" min={0} value={form.number_of_rooms} onChange={(e)=>setForm({...form, number_of_rooms: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="hh-label" htmlFor="has_garden">Has Garden</label>
                <select id="has_garden" className="hh-select" value={form.has_garden ? "true" : "false"} onChange={(e)=>setForm({...form, has_garden: e.target.value === "true"})}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div>
                <label className="hh-label" htmlFor="has_parking">Has Parking</label>
                <select id="has_parking" className="hh-select" value={form.has_parking ? "true" : "false"} onChange={(e)=>setForm({...form, has_parking: e.target.value === "true"})}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="special_features">Special Features</label>
                <input id="special_features" className="hh-input" value={form.special_features} onChange={(e)=>setForm({...form, special_features: e.target.value})} />
              </div>
            </div>
          </section>

          {/* Social Registration - GitHub only */}
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
            <span className="hh-muted text-center">Already have an account? <Link href="/household/login" className="hh-link">Login</Link></span>
          </div>
        </form>

        {/* Demo: direct Supabase anon read */}
        <ServiceCategoriesPreview />
      </main>
    </div>
  );
}
