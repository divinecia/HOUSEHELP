"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { z } from "zod";

const verificationSchema = z.object({
  phoneOtp: z.string().regex(/^\d{6}$/, "Phone OTP must be exactly 6 digits"),
  emailVerification: z.string().optional(),
  backgroundCheckConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to background check to proceed"
  }),
});

export default function WorkerStep4() {
  const [formData, setFormData] = useState({
    phoneOtp: "",
    emailVerification: "",
    backgroundCheckConsent: false,
  });
  const [files, setFiles] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfieWithId: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (field: 'idFront' | 'idBack' | 'selfieWithId') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [field]: "Please upload a valid image file (JPEG or PNG)"
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
    if (!files.idFront) fileErrors.idFront = "Front of National ID is required";
    if (!files.idBack) fileErrors.idBack = "Back of National ID is required";
    if (!files.selfieWithId) fileErrors.selfieWithId = "Selfie with ID is required";

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
      // In a real application, you would upload files and submit all registration data
      const registrationData = {
        step2: JSON.parse(localStorage.getItem('workerStep2') || '{}'),
        step3: JSON.parse(localStorage.getItem('workerStep3') || '{}'),
        step4: {
          ...result.data,
          hasIdFront: true,
          hasIdBack: true,
          hasSelfieWithId: true,
        }
      };

      // TODO: Submit registrationData to API endpoint
      // await fetch('/api/worker/register', { method: 'POST', body: JSON.stringify(registrationData) });

      // Clear localStorage
      localStorage.removeItem('workerStep2');
      localStorage.removeItem('workerStep3');

      // Navigate to success page
      window.location.href = "/worker/register/success";
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Verify your identity</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-100" /></div>
        <p className="hh-muted mt-2">Step 4 of 4: Verification</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">ID Document Upload</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">
                  Front of National ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  className="hh-input"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange('idFront')}
                />
                {errors.idFront && (
                  <p className="text-red-500 text-sm mt-1">{errors.idFront}</p>
                )}
              </div>
              <div>
                <label className="hh-label">
                  Back of National ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  className="hh-input"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange('idBack')}
                />
                {errors.idBack && (
                  <p className="text-red-500 text-sm mt-1">{errors.idBack}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label">
                  Selfie with ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  className="hh-input"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange('selfieWithId')}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Upload a clear photo of yourself holding your ID
                </p>
                {errors.selfieWithId && (
                  <p className="text-red-500 text-sm mt-1">{errors.selfieWithId}</p>
                )}
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Background Check Consent</h2>
            <label className="hh-label flex items-start gap-2">
              <input
                type="checkbox"
                className="hh-checkbox mt-1"
                checked={formData.backgroundCheckConsent}
                onChange={(e) => setFormData({ ...formData, backgroundCheckConsent: e.target.checked })}
              />
              <span>
                I consent to a background check <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.backgroundCheckConsent && (
              <p className="text-red-500 text-sm mt-1">{errors.backgroundCheckConsent}</p>
            )}
            <p className="hh-help mt-2">
              By continuing you agree to our{" "}
              <Link href="/" className="hh-link">Terms</Link> and{" "}
              <Link href="/" className="hh-link">Privacy Policy</Link>.
            </p>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Contact Verification</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">
                  Phone OTP <span className="text-red-500">*</span>
                </label>
                <input
                  className="hh-input"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={formData.phoneOtp}
                  onChange={(e) => setFormData({ ...formData, phoneOtp: e.target.value.replace(/\D/g, '') })}
                />
                {errors.phoneOtp && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneOtp}</p>
                )}
              </div>
              <div>
                <label className="hh-label">Email Verification</label>
                <input
                  className="hh-input"
                  placeholder="Enter token if provided"
                  value={formData.emailVerification}
                  onChange={(e) => setFormData({ ...formData, emailVerification: e.target.value })}
                />
              </div>
            </div>
          </section>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link href="/worker/register/step-3" className="hh-btn hh-btn-secondary">Back</Link>
            <button
              type="submit"
              className="hh-btn hh-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
