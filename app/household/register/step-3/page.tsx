"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { z } from "zod";

const verificationSchema = z.object({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to Terms of Service"
  }),
  agreeToPrivacy: z.boolean().refine(val => val === true, {
    message: "You must agree to Privacy Policy"
  }),
  backgroundCheckConsent: z.boolean().refine(val => val === true, {
    message: "Background check consent is required"
  }),
  communicationPreferences: z.boolean(),
  paymentMethod: z.enum(["Credit/Debit Card", "Mobile Money", "Bank Account"]),
  paymentVerification: z.string().min(1, "Payment verification is required"),
});

export default function HouseholdStep3() {
  const [formData, setFormData] = useState({
    agreeToTerms: false,
    agreeToPrivacy: false,
    backgroundCheckConsent: false,
    communicationPreferences: false,
    paymentMethod: "Credit/Debit Card" as "Credit/Debit Card" | "Mobile Money" | "Bank Account",
    paymentVerification: "",
  });
  const [files, setFiles] = useState({
    nationalId: null as File | null,
    proofOfResidence: null as File | null,
    selfie: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (field: 'nationalId' | 'proofOfResidence' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [field]: "Please upload a valid image (JPEG, PNG) or PDF file"
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          [field]: "File size must be less than 5MB"
        }));
        return;
      }

      setFiles(prev => ({ ...prev, [field]: file }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate files
    const fileErrors: Record<string, string> = {};
    if (!files.nationalId) fileErrors.nationalId = "National ID/Passport is required";
    if (!files.proofOfResidence) fileErrors.proofOfResidence = "Proof of residence is required";
    if (!files.selfie) fileErrors.selfie = "Selfie photo is required";

    if (Object.keys(fileErrors).length > 0) {
      setErrors(fileErrors);
      return;
    }

    // Validate form data
    const result = verificationSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      // Get household ID from localStorage (stored in step 1)
      const householdId = localStorage.getItem('hh-household-id');
      if (!householdId) {
        throw new Error('Household ID not found. Please restart registration.');
      }

      // Prepare complete registration data
      const registrationData = {
        household_id: householdId,
        step2: JSON.parse(localStorage.getItem('householdStep2') || '{}'),
        step3: {
          ...result.data,
          hasNationalId: !!files.nationalId,
          hasProofOfResidence: !!files.proofOfResidence,
          hasSelfie: !!files.selfie,
        }
      };

      // Submit complete registration data to API
      const response = await fetch('/api/household/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      // Clear localStorage
      localStorage.removeItem('householdStep2');
      localStorage.removeItem('hh-household-id');

      // Navigate to success page
      window.location.href = "/household/register/success";
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Verify your account</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-100" /></div>
        <p className="hh-muted mt-2">Step 3 of 3: Verification</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Identity Verification */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Identity Verification</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="nid">
                  National ID/Passport Upload <span className="text-red-500">*</span>
                </label>
                <input
                  id="nid"
                  type="file"
                  className="hh-input"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange('nationalId')}
                />
                {errors.nationalId && (
                  <p className="text-red-500 text-sm mt-1">{errors.nationalId}</p>
                )}
              </div>
              <div>
                <label className="hh-label" htmlFor="res">
                  Proof of Residence <span className="text-red-500">*</span>
                </label>
                <input
                  id="res"
                  type="file"
                  className="hh-input"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange('proofOfResidence')}
                />
                {errors.proofOfResidence && (
                  <p className="text-red-500 text-sm mt-1">{errors.proofOfResidence}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="selfie">
                  Selfie Photo <span className="text-red-500">*</span>
                </label>
                <input
                  id="selfie"
                  type="file"
                  className="hh-input"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange('selfie')}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Upload a clear photo of yourself. Max 5MB.
                </p>
                {errors.selfie && (
                  <p className="text-red-500 text-sm mt-1">{errors.selfie}</p>
                )}
              </div>
            </div>
          </section>

          {/* Payment Setup */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Payment Method Setup</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  className="hh-select"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                >
                  <option>Credit/Debit Card</option>
                  <option>Mobile Money</option>
                  <option>Bank Account</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="verify">
                  Payment Method Verification <span className="text-red-500">*</span>
                </label>
                <input
                  id="verify"
                  className="hh-input"
                  placeholder="Enter verification details"
                  value={formData.paymentVerification}
                  onChange={(e) => setFormData({ ...formData, paymentVerification: e.target.value })}
                />
                {errors.paymentVerification && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentVerification}</p>
                )}
              </div>
            </div>
          </section>

          {/* Agreements */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Agreement and Consent</h2>
            <div className="space-y-2">
              <label className="hh-label flex items-start gap-2">
                <input
                  type="checkbox"
                  className="hh-checkbox mt-1"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                />
                <span>
                  Agree to Terms of Service <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
              )}

              <label className="hh-label flex items-start gap-2">
                <input
                  type="checkbox"
                  className="hh-checkbox mt-1"
                  checked={formData.agreeToPrivacy}
                  onChange={(e) => setFormData({ ...formData, agreeToPrivacy: e.target.checked })}
                />
                <span>
                  Agree to Privacy Policy <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.agreeToPrivacy && (
                <p className="text-red-500 text-sm">{errors.agreeToPrivacy}</p>
              )}

              <label className="hh-label flex items-start gap-2">
                <input
                  type="checkbox"
                  className="hh-checkbox mt-1"
                  checked={formData.backgroundCheckConsent}
                  onChange={(e) => setFormData({ ...formData, backgroundCheckConsent: e.target.checked })}
                />
                <span>
                  Background Check Consent <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.backgroundCheckConsent && (
                <p className="text-red-500 text-sm">{errors.backgroundCheckConsent}</p>
              )}

              <label className="hh-label flex items-start gap-2">
                <input
                  type="checkbox"
                  className="hh-checkbox mt-1"
                  checked={formData.communicationPreferences}
                  onChange={(e) => setFormData({ ...formData, communicationPreferences: e.target.checked })}
                />
                <span>Communication Preferences</span>
              </label>
            </div>
          </section>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link href="/household/register/step-2" className="hh-btn hh-btn-secondary">Back</Link>
            <button
              type="submit"
              className="hh-btn hh-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
