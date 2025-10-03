"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { z } from "zod";

const availabilitySchema = z.object({
  availableDays: z.string().min(1, "Please specify available days"),
  preferredHours: z.string().min(1, "Please specify preferred working hours"),
  flexibility: z.enum(["Full-time", "Part-time"], {
    errorMap: () => ({ message: "Please select your flexibility" })
  }),
  oneTimeJobs: z.enum(["Yes", "No"]),
  recurringJobs: z.enum(["Yes", "No"]),
  emergencyServices: z.enum(["Yes", "No"]),
  maxTravelDistance: z.number().min(0).max(50),
  transportationMethod: z.enum(["Walking", "Public Transport", "Motorbike"], {
    errorMap: () => ({ message: "Please select transportation method" })
  }),
  preferredAreas: z.string().min(1, "Please specify at least one preferred area"),
  hourlyRate: z.string().min(1, "Please specify your hourly rate range"),
  dailyRate: z.string().min(1, "Please specify your daily rate range"),
  specialServiceRates: z.string().optional(),
});

type FormData = z.infer<typeof availabilitySchema>;

export default function WorkerStep3() {
  const [formData, setFormData] = useState<FormData>({
    availableDays: "",
    preferredHours: "",
    flexibility: "Full-time",
    oneTimeJobs: "No",
    recurringJobs: "Yes",
    emergencyServices: "No",
    maxTravelDistance: 10,
    transportationMethod: "Walking",
    preferredAreas: "",
    hourlyRate: "",
    dailyRate: "",
    specialServiceRates: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = availabilitySchema.safeParse(formData);
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
      localStorage.setItem('workerStep3', JSON.stringify(result.data));

      // Navigate to next step
      window.location.href = "/worker/register/step-4";
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">When can you work?</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-66" /></div>
        <p className="hh-muted mt-2">Step 3 of 4: Availability</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Working Schedule</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">
                  Available Days <span className="text-red-500">*</span>
                </label>
                <input
                  className="hh-input"
                  placeholder="Mon, Tue, Wed..."
                  value={formData.availableDays}
                  onChange={(e) => setFormData({ ...formData, availableDays: e.target.value })}
                />
                {errors.availableDays && (
                  <p className="text-red-500 text-sm mt-1">{errors.availableDays}</p>
                )}
              </div>
              <div>
                <label className="hh-label">
                  Preferred Hours <span className="text-red-500">*</span>
                </label>
                <input
                  className="hh-input"
                  placeholder="08:00-17:00"
                  value={formData.preferredHours}
                  onChange={(e) => setFormData({ ...formData, preferredHours: e.target.value })}
                />
                {errors.preferredHours && (
                  <p className="text-red-500 text-sm mt-1">{errors.preferredHours}</p>
                )}
              </div>
              <div>
                <label className="hh-label">
                  Flexibility <span className="text-red-500">*</span>
                </label>
                <select
                  className="hh-select"
                  value={formData.flexibility}
                  onChange={(e) => setFormData({ ...formData, flexibility: e.target.value as "Full-time" | "Part-time" })}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                </select>
                {errors.flexibility && (
                  <p className="text-red-500 text-sm mt-1">{errors.flexibility}</p>
                )}
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Service Preferences</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">One-time Jobs</label>
                <select
                  className="hh-select"
                  value={formData.oneTimeJobs}
                  onChange={(e) => setFormData({ ...formData, oneTimeJobs: e.target.value as "Yes" | "No" })}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>
              <div>
                <label className="hh-label">Recurring Jobs</label>
                <select
                  className="hh-select"
                  value={formData.recurringJobs}
                  onChange={(e) => setFormData({ ...formData, recurringJobs: e.target.value as "Yes" | "No" })}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div>
                <label className="hh-label">Emergency Services</label>
                <select
                  className="hh-select"
                  value={formData.emergencyServices}
                  onChange={(e) => setFormData({ ...formData, emergencyServices: e.target.value as "Yes" | "No" })}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Travel Preferences</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">Maximum Travel Distance (km)</label>
                <input
                  className="hh-input"
                  type="range"
                  min={0}
                  max={50}
                  value={formData.maxTravelDistance}
                  onChange={(e) => setFormData({ ...formData, maxTravelDistance: parseInt(e.target.value) })}
                />
                <div className="text-sm text-slate-600 mt-1">{formData.maxTravelDistance} km</div>
              </div>
              <div>
                <label className="hh-label">
                  Transportation Method <span className="text-red-500">*</span>
                </label>
                <select
                  className="hh-select"
                  value={formData.transportationMethod}
                  onChange={(e) => setFormData({ ...formData, transportationMethod: e.target.value as "Walking" | "Public Transport" | "Motorbike" })}
                >
                  <option>Walking</option>
                  <option>Public Transport</option>
                  <option>Motorbike</option>
                </select>
                {errors.transportationMethod && (
                  <p className="text-red-500 text-sm mt-1">{errors.transportationMethod}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label">
                  Preferred Areas <span className="text-red-500">*</span>
                </label>
                <input
                  className="hh-input"
                  placeholder="Districts"
                  value={formData.preferredAreas}
                  onChange={(e) => setFormData({ ...formData, preferredAreas: e.target.value })}
                />
                {errors.preferredAreas && (
                  <p className="text-red-500 text-sm mt-1">{errors.preferredAreas}</p>
                )}
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Rate Expectations</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">
                  Hourly Rate Range <span className="text-red-500">*</span>
                </label>
                <input
                  className="hh-input"
                  placeholder="e.g., 1,000 - 2,000 RWF"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                />
                {errors.hourlyRate && (
                  <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>
                )}
              </div>
              <div>
                <label className="hh-label">
                  Daily Rate Range <span className="text-red-500">*</span>
                </label>
                <input
                  className="hh-input"
                  placeholder="e.g., 8,000 - 15,000 RWF"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                />
                {errors.dailyRate && (
                  <p className="text-red-500 text-sm mt-1">{errors.dailyRate}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label">Special Service Rates</label>
                <input
                  className="hh-input"
                  value={formData.specialServiceRates}
                  onChange={(e) => setFormData({ ...formData, specialServiceRates: e.target.value })}
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
            <Link href="/worker/register/step-2" className="hh-btn hh-btn-secondary">Back</Link>
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
