"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { z } from "zod";

const professionalInfoSchema = z.object({
  yearsExperience: z.number().min(0, "Years of experience is required").max(20),
  previousEmployers: z.string().min(1, "Please provide at least one previous employer"),
  description: z.string().min(10, "Please provide a brief description (at least 10 characters)"),
  serviceCategories: z.string().min(1, "Please select at least one service category"),
  certificationNames: z.string().optional(),
  issuingOrganizations: z.string().optional(),
  languages: z.string().min(1, "Please specify at least one language"),
});

type FormData = z.infer<typeof professionalInfoSchema>;

export default function WorkerStep2() {
  const [formData, setFormData] = useState<FormData>({
    yearsExperience: 0,
    previousEmployers: "",
    description: "",
    serviceCategories: "",
    certificationNames: "",
    issuingOrganizations: "",
    languages: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [certificates, setCertificates] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Validate file types and sizes
      const files = Array.from(e.target.files);
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const invalidFiles = files.filter(file =>
        !validTypes.includes(file.type) || file.size > maxSize
      );

      if (invalidFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          certificates: "Please upload valid image files (JPEG, PNG) or PDF under 5MB each"
        }));
        return;
      }

      setCertificates(e.target.files);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.certificates;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = professionalInfoSchema.safeParse(formData);
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
      // Store data in localStorage for now (or make API call)
      localStorage.setItem('workerStep2', JSON.stringify({
        ...result.data,
        hasCertificates: certificates !== null,
      }));

      // Navigate to next step
      window.location.href = "/worker/register/step-3";
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Tell us about your skills</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-66" /></div>
        <p className="hh-muted mt-2">Step 2 of 4: Professional Info</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Work Experience</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="years">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  id="years"
                  className="hh-input"
                  type="range"
                  min={0}
                  max={20}
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) })}
                />
                <div className="text-sm text-slate-600 mt-1">{formData.yearsExperience} years</div>
                {errors.yearsExperience && (
                  <p className="text-red-500 text-sm mt-1">{errors.yearsExperience}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="employers">
                  Previous Employers <span className="text-red-500">*</span>
                </label>
                <input
                  id="employers"
                  className="hh-input"
                  placeholder="Add multiple later"
                  value={formData.previousEmployers}
                  onChange={(e) => setFormData({ ...formData, previousEmployers: e.target.value })}
                />
                {errors.previousEmployers && (
                  <p className="text-red-500 text-sm mt-1">{errors.previousEmployers}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="desc">
                  Brief Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="desc"
                  className="hh-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Service Categories</h2>
            <input
              className="hh-input"
              placeholder="Select multiple: House Cleaning, Cooking, Childcare, Elderly Care, Gardening, Laundry & Ironing, General Housework"
              value={formData.serviceCategories}
              onChange={(e) => setFormData({ ...formData, serviceCategories: e.target.value })}
            />
            <span className="text-red-500">*</span>
            {errors.serviceCategories && (
              <p className="text-red-500 text-sm mt-1">{errors.serviceCategories}</p>
            )}
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Skills & Certifications</h2>
            <div className="hh-form-grid">
              <div className="sm:col-span-2">
                <label className="hh-label">Upload Certificate Photos</label>
                <input
                  type="file"
                  className="hh-input"
                  multiple
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Upload images (JPEG, PNG) or PDF files. Max 5MB per file.
                </p>
                {errors.certificates && (
                  <p className="text-red-500 text-sm mt-1">{errors.certificates}</p>
                )}
              </div>
              <div>
                <label className="hh-label">Certification Names</label>
                <input
                  className="hh-input"
                  value={formData.certificationNames}
                  onChange={(e) => setFormData({ ...formData, certificationNames: e.target.value })}
                />
              </div>
              <div>
                <label className="hh-label">Issuing Organizations</label>
                <input
                  className="hh-input"
                  value={formData.issuingOrganizations}
                  onChange={(e) => setFormData({ ...formData, issuingOrganizations: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Languages Spoken</h2>
            <input
              className="hh-input"
              placeholder="Kinyarwanda, English, French, Swahili"
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
            />
            <span className="text-red-500">*</span>
            {errors.languages && (
              <p className="text-red-500 text-sm mt-1">{errors.languages}</p>
            )}
          </section>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link href="/worker/register/step-1" className="hh-btn hh-btn-secondary">Back</Link>
            <button
              type="submit"
              className="hh-btn hh-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
