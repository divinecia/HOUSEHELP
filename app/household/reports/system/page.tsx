"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HouseholdSystemReportsPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function submit() {
    if (!householdId || !description) return;
    try {
      setErr(null); setSuccess(false); setLoading(true);
      const res = await fetch('/api/household/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, type: 'system', subject, description })
      });
      if (!res.ok) throw new Error('submit ' + res.status);
      setSuccess(true);
      setSubject(""); setDescription("");
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">System Issue Report</h1>
        <p className="hh-subtitle">Report technical problems or bugs</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Household ID
            <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
          </label>
          <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}
        {success && <div className="mt-3 p-3 bg-green-100 text-green-800 rounded">Report submitted successfully.</div>}

        <div className="hh-content-section">
          <div className="hh-form-grid">
            <div className="sm:col-span-2">
              <label className="hh-label">Subject</label>
              <input className="hh-input" placeholder="Brief summary of the issue" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="hh-label">Description *</label>
              <textarea className="hh-input" rows={5} placeholder="Detailed description of the system issue..." value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <button className="hh-btn hh-btn-primary" onClick={submit} disabled={loading || !householdId || !description}>Submit Report</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
