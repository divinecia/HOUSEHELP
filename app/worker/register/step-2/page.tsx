"use client";

import Link from "next/link";

export default function WorkerStep2() {
  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Tell us about your skills</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-66" /></div>
        <p className="hh-muted mt-2">Step 2 of 4: Professional Info</p>

        <form className="mt-6 space-y-6">
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Work Experience</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="years">Years of Experience</label>
                <input id="years" className="hh-input" type="range" min={0} max={20} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="employers">Previous Employers</label>
                <input id="employers" className="hh-input" placeholder="Add multiple later" />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="desc">Brief Description</label>
                <textarea id="desc" className="hh-textarea" />
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Service Categories</h2>
            <input className="hh-input" placeholder="Select multiple: House Cleaning, Cooking, Childcare, Elderly Care, Gardening, Laundry & Ironing, General Housework" />
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Skills & Certifications</h2>
            <div className="hh-form-grid">
              <div className="sm:col-span-2">
                <label className="hh-label">Upload Certificate Photos</label>
                <input type="file" className="hh-input" multiple />
              </div>
              <div>
                <label className="hh-label">Certification Names</label>
                <input className="hh-input" />
              </div>
              <div>
                <label className="hh-label">Issuing Organizations</label>
                <input className="hh-input" />
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Languages Spoken</h2>
            <input className="hh-input" placeholder="Kinyarwanda, English, French, Swahili" />
          </section>

          <div className="flex items-center gap-3">
            <Link href="/worker/register/step-1" className="hh-btn hh-btn-secondary">Back</Link>
            <Link href="/worker/register/step-3" className="hh-btn hh-btn-primary">Next</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
