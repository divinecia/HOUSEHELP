"use client";

import Link from "next/link";

export default function WorkerStep3() {
  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">When can you work?</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-66" /></div>
        <p className="hh-muted mt-2">Step 3 of 4: Availability</p>

        <form className="mt-6 space-y-6">
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Working Schedule</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">Available Days</label>
                <input className="hh-input" placeholder="Mon, Tue, Wed..." />
              </div>
              <div>
                <label className="hh-label">Preferred Hours</label>
                <input className="hh-input" placeholder="08:00-17:00" />
              </div>
              <div>
                <label className="hh-label">Flexibility</label>
                <select className="hh-select"><option>Full-time</option><option>Part-time</option></select>
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Service Preferences</h2>
            <div className="hh-form-grid">
              <div><label className="hh-label">One-time Jobs</label><select className="hh-select"><option>No</option><option>Yes</option></select></div>
              <div><label className="hh-label">Recurring Jobs</label><select className="hh-select"><option>Yes</option><option>No</option></select></div>
              <div><label className="hh-label">Emergency Services</label><select className="hh-select"><option>No</option><option>Yes</option></select></div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Travel Preferences</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">Maximum Travel Distance (km)</label>
                <input className="hh-input" type="range" min={0} max={50} />
              </div>
              <div>
                <label className="hh-label">Transportation Method</label>
                <select className="hh-select"><option>Walking</option><option>Public Transport</option><option>Motorbike</option></select>
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label">Preferred Areas</label>
                <input className="hh-input" placeholder="Districts" />
              </div>
            </div>
          </section>

          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Rate Expectations</h2>
            <div className="hh-form-grid">
              <div><label className="hh-label">Hourly Rate Range</label><input className="hh-input" placeholder="e.g., 1,000 - 2,000 RWF" /></div>
              <div><label className="hh-label">Daily Rate Range</label><input className="hh-input" placeholder="e.g., 8,000 - 15,000 RWF" /></div>
              <div className="sm:col-span-2"><label className="hh-label">Special Service Rates</label><input className="hh-input" /></div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Link href="/worker/register/step-2" className="hh-btn hh-btn-secondary">Back</Link>
            <Link href="/worker/register/step-4" className="hh-btn hh-btn-primary">Next</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
