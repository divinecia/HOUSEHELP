"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HouseholdSubscriptionsPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/household/subscriptions?household_id=${encodeURIComponent(householdId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('subscriptions ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (householdId) load(); }, [householdId]);

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Subscriptions</h1>
        <p className="hh-subtitle">Manage your subscription plans</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Household ID
            <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s)=> (
            <div key={s.id} className="hh-panel p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{s.plan ?? 'Subscription'}</h3>
                <span className={`px-2 py-1 rounded text-xs ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div><span className="hh-muted">Expiry:</span> {s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : '—'}</div>
                <div><span className="hh-muted">Created:</span> {new Date(s.created_at).toLocaleDateString()}</div>
              </div>
              <button className="hh-btn hh-btn-primary w-full mt-3">Renew</button>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="col-span-full p-4 hh-muted">No subscriptions found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
