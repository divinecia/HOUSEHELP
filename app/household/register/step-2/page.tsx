"use client";

import Link from "next/link";

export default function HouseholdStep2() {
  return (
    <div className="hh-page">
      <main className="hh-form">
        <h1 className="hh-title">Tell us about your family</h1>
        <div className="mt-3 hh-progress"><div className="hh-progress-bar w-66" /></div>
        <p className="hh-muted mt-2">Step 2 of 3: Family Info</p>

        <form className="mt-6 space-y-6">
          {/* Family Composition */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Family Composition</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="adults">Number of Adults</label>
                <input id="adults" className="hh-input" type="number" min={0} />
              </div>
              <div>
                <label className="hh-label" htmlFor="children">Number of Children</label>
                <input id="children" className="hh-input" type="number" min={0} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="ages">Children's Ages</label>
                <input id="ages" className="hh-input" placeholder="e.g., 3, 7, 12" />
              </div>
              <div>
                <label className="hh-label">Elderly Members</label>
                <select className="hh-select"><option>No</option><option>Yes</option></select>
              </div>
              <div>
                <label className="hh-label">Special Needs Members</label>
                <select className="hh-select"><option>No</option><option>Yes</option></select>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Household Preferences</h2>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label" htmlFor="langs">Languages Spoken at Home</label>
                <input id="langs" className="hh-input" placeholder="Kinyarwanda, English" />
              </div>
              <div>
                <label className="hh-label" htmlFor="religion">Religious Considerations</label>
                <input id="religion" className="hh-input" />
              </div>
              <div>
                <label className="hh-label" htmlFor="diet">Dietary Restrictions</label>
                <input id="diet" className="hh-input" />
              </div>
              <div>
                <label className="hh-label" htmlFor="pets">Pet Information</label>
                <input id="pets" className="hh-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="smoke">Smoking Policy</label>
                <input id="smoke" className="hh-input" />
              </div>
            </div>
          </section>

          {/* Service Requirements */}
          <section className="hh-form-section">
            <h2 className="font-semibold text-slate-800 mb-3">Service Requirements</h2>
            <div className="hh-form-grid">
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="services">Primary Services Needed (comma-separated)</label>
                <input id="services" className="hh-input" placeholder="House Cleaning, Childcare" />
              </div>
              <div>
                <label className="hh-label" htmlFor="freq">Service Frequency</label>
                <select id="freq" className="hh-select"><option>One-time</option><option>Weekly</option><option>Monthly</option></select>
              </div>
              <div>
                <label className="hh-label" htmlFor="schedule">Preferred Schedule</label>
                <input id="schedule" className="hh-input" placeholder="Weekdays, mornings" />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label" htmlFor="budget">Budget Range</label>
                <input id="budget" className="hh-input" placeholder="e.g., RWF 50,000 - 150,000 / month" />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Link href="/household/register/step-1" className="hh-btn hh-btn-secondary">Back</Link>
            <Link href="/household/register/step-3" className="hh-btn hh-btn-primary">Next</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
