"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HouseholdBehaviorReportsPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [workerId, setWorkerId] = useState("");
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
        body: JSON.stringify({ household_id: householdId, type: 'behavior', subject, description, worker_id: workerId || null })
      });
      if (!res.ok) throw new Error('submit ' + res.status);
      setSuccess(true);
      setSubject(""); setDescription(""); setWorkerId("");
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Behavior Report (Isange)</h1>
        <p className="hh-subtitle">Report worker behavior concerns</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Household ID
            <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
          </label>
          <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}
        {success && <div className="mt-3 p-3 bg-green-100 text-green-800 rounded">Report submitted successfully.</div>}

        <div className="mt-4 rounded-lg border border-slate-200 p-4 bg-white">
          <div className="hh-form-grid">
            <div>
              <label className="hh-label">Worker ID (optional)</label>
              <input className="hh-input" placeholder="W-..." value={workerId} onChange={(e)=>setWorkerId(e.target.value)} />
            </div>
            <div>
              <label className="hh-label">Subject</label>
              <input className="hh-input" placeholder="Brief summary" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="hh-label">Description *</label>
              <textarea className="hh-input" rows={5} placeholder="Detailed description of the behavior concern..." value={description} onChange={(e)=>setDescription(e.target.value)} />
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
