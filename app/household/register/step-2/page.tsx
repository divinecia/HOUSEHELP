"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { z } from "zod";

const familyInfoSchema = z.object({
  numberOfAdults: z.number().min(1, "Number of adults must be at least 1"),
  numberOfChildren: z.number().min(0, "Number of children cannot be negative"),
  childrenAges: z.string().optional(),
  elderlyMembers: z.enum(["Yes", "No"]),
  specialNeedsMembers: z.enum(["Yes", "No"]),
  languagesSpoken: z.string().min(1, "Please specify at least one language"),
  religiousConsiderations: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  petInformation: z.string().optional(),
  smokingPolicy: z.string().optional(),
  primaryServices: z.string().min(1, "Please specify at least one service needed"),
  serviceFrequency: z.enum(["One-time", "Weekly", "Monthly"], {
    errorMap: () => ({ message: "Please select service frequency" })
  }),
  preferredSchedule: z.string().min(1, "Please specify your preferred schedule"),
  budgetRange: z.string().min(1, "Please provide your budget range"),
}).refine((data) => {
  if (data.numberOfChildren > 0 && !data.childrenAges) {
    return false;
  }
  return true;
}, {
  message: "Please provide children's ages if you have children",
  path: ["childrenAges"]
});

type FormData = z.infer<typeof familyInfoSchema>;

export default function HouseholdStep2() {
  const [formData, setFormData] = useState<FormData>({
    numberOfAdults: 1,
    numberOfChildren: 0,
    childrenAges: "",
    elderlyMembers: "No",
    specialNeedsMembers: "No",
    languagesSpoken: "",
    religiousConsiderations: "",
    dietaryRestrictions: "",
    petInformation: "",
    smokingPolicy: "",
    primaryServices: "",
    serviceFrequency: "Weekly",
    preferredSchedule: "",
    budgetRange: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = familyInfoSchema.safeParse(formData);
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
      localStorage.setItem('householdStep2', JSON.stringify(result.data));

      // Navigate to next step
      window.location.href = "/household/register/step-3";
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Tell us about your family</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-66" /></div>
        <p className="hh-muted mt-2">Step 2 of 3: Family Info</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Family Composition */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Family Composition</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="adults">
                  Number of Adults <span className="text-red-500">*</span>
                </label>
                <input
                  id="adults"
                  className="hh-input"
                  type="number"
                  min={0}
                  value={formData.numberOfAdults}
                  onChange={(e) => setFormData({ ...formData, numberOfAdults: parseInt(e.target.value) || 0 })}
                />
                {errors.numberOfAdults && (
                  <p className="text-red-500 text-sm mt-1">{errors.numberOfAdults}</p>
                )}
              </div>
              <div>
                <label className="hh-label" htmlFor="children">
                  Number of Children <span className="text-red-500">*</span>
                </label>
                <input
                  id="children"
                  className="hh-input"
                  type="number"
                  min={0}
                  value={formData.numberOfChildren}
                  onChange={(e) => setFormData({ ...formData, numberOfChildren: parseInt(e.target.value) || 0 })}
                />
                {errors.numberOfChildren && (
                  <p className="text-red-500 text-sm mt-1">{errors.numberOfChildren}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="ages">
                  Children's Ages {formData.numberOfChildren > 0 && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="ages"
                  className="hh-input"
                  placeholder="e.g., 3, 7, 12"
                  value={formData.childrenAges}
                  onChange={(e) => setFormData({ ...formData, childrenAges: e.target.value })}
                />
                {errors.childrenAges && (
                  <p className="text-red-500 text-sm mt-1">{errors.childrenAges}</p>
                )}
              </div>
              <div>
                <label className="hh-label">Elderly Members</label>
                <select
                  className="hh-select"
                  value={formData.elderlyMembers}
                  onChange={(e) => setFormData({ ...formData, elderlyMembers: e.target.value as "Yes" | "No" })}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>
              <div>
                <label className="hh-label">Special Needs Members</label>
                <select
                  className="hh-select"
                  value={formData.specialNeedsMembers}
                  onChange={(e) => setFormData({ ...formData, specialNeedsMembers: e.target.value as "Yes" | "No" })}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Household Preferences</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="langs">
                  Languages Spoken at Home <span className="text-red-500">*</span>
                </label>
                <input
                  id="langs"
                  className="hh-input"
                  placeholder="Kinyarwanda, English"
                  value={formData.languagesSpoken}
                  onChange={(e) => setFormData({ ...formData, languagesSpoken: e.target.value })}
                />
                {errors.languagesSpoken && (
                  <p className="text-red-500 text-sm mt-1">{errors.languagesSpoken}</p>
                )}
              </div>
              <div>
                <label className="hh-label" htmlFor="religion">Religious Considerations</label>
                <input
                  id="religion"
                  className="hh-input"
                  value={formData.religiousConsiderations}
                  onChange={(e) => setFormData({ ...formData, religiousConsiderations: e.target.value })}
                />
              </div>
              <div>
                <label className="hh-label" htmlFor="diet">Dietary Restrictions</label>
                <input
                  id="diet"
                  className="hh-input"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                />
              </div>
              <div>
                <label className="hh-label" htmlFor="pets">Pet Information</label>
                <input
                  id="pets"
                  className="hh-input"
                  value={formData.petInformation}
                  onChange={(e) => setFormData({ ...formData, petInformation: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="smoke">Smoking Policy</label>
                <input
                  id="smoke"
                  className="hh-input"
                  value={formData.smokingPolicy}
                  onChange={(e) => setFormData({ ...formData, smokingPolicy: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Service Requirements */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Service Requirements</h2>
            <div className="hh-form-grid">
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="services">
                  Primary Services Needed (comma-separated) <span className="text-red-500">*</span>
                </label>
                <input
                  id="services"
                  className="hh-input"
                  placeholder="House Cleaning, Childcare"
                  value={formData.primaryServices}
                  onChange={(e) => setFormData({ ...formData, primaryServices: e.target.value })}
                />
                {errors.primaryServices && (
                  <p className="text-red-500 text-sm mt-1">{errors.primaryServices}</p>
                )}
              </div>
              <div>
                <label className="hh-label" htmlFor="freq">
                  Service Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  id="freq"
                  className="hh-select"
                  value={formData.serviceFrequency}
                  onChange={(e) => setFormData({ ...formData, serviceFrequency: e.target.value as "One-time" | "Weekly" | "Monthly" })}
                >
                  <option>One-time</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
                {errors.serviceFrequency && (
                  <p className="text-red-500 text-sm mt-1">{errors.serviceFrequency}</p>
                )}
              </div>
              <div>
                <label className="hh-label" htmlFor="schedule">
                  Preferred Schedule <span className="text-red-500">*</span>
                </label>
                <input
                  id="schedule"
                  className="hh-input"
                  placeholder="Weekdays, mornings"
                  value={formData.preferredSchedule}
                  onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
                />
                {errors.preferredSchedule && (
                  <p className="text-red-500 text-sm mt-1">{errors.preferredSchedule}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="budget">
                  Budget Range <span className="text-red-500">*</span>
                </label>
                <input
                  id="budget"
                  className="hh-input"
                  placeholder="e.g., RWF 50,000 - 150,000 / month"
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                />
                {errors.budgetRange && (
                  <p className="text-red-500 text-sm mt-1">{errors.budgetRange}</p>
                )}
              </div>
            </div>
          </section>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link href="/household/register/step-1" className="hh-btn hh-btn-secondary">Back</Link>
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
