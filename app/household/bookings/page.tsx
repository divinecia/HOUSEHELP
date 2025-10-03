"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

export default function HouseholdBookingsPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  const query = useMemo(() => {
    const q = new URLSearchParams({ household_id: householdId });
    if (status) q.set('status', status);
    return q.toString();
  }, [householdId, status]);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/household/bookings?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('bookings ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (householdId) load(); }, [query]);

  async function cancel(booking_id: string) {
    try {
      setErr(null);
      const res = await fetch('/api/household/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id, status: 'cancelled' }) });
      if (!res.ok) throw new Error('cancel ' + res.status);
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <AuthGuard requiredType="household">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">My Bookings</h1>
          <p className="hh-subtitle">View and manage your bookings</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="hh-label">Household ID
              <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
            </label>
            <label className="hh-label">Status
              <select className="hh-select ml-2" value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
            <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm" role="table" aria-label="Bookings list">
              <caption className="sr-only">List of your service bookings</caption>
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="p-3 text-left">Scheduled</th>
                  <th scope="col" className="p-3 text-left">Service</th>
                  <th scope="col" className="p-3 text-left">Worker</th>
                  <th scope="col" className="p-3 text-left">Status</th>
                  <th scope="col" className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b)=> (
                  <tr key={b.id} className="border-t">
                    <td className="p-3">{new Date(b.scheduled_at).toLocaleString()}</td>
                    <td className="p-3">{b.service}</td>
                    <td className="p-3">{b.worker_id ?? 'TBD'}</td>
                    <td className="p-3">{b.status}</td>
                    <td className="p-3">
                      {(b.status === 'pending' || b.status === 'active') && (
                        <button
                          className="hh-btn hh-btn-secondary"
                          onClick={()=>cancel(b.id)}
                          aria-label={`Cancel booking for ${b.service}`}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr><td colSpan={5} className="p-3 hh-muted">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
