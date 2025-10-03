"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

export default function WorkerSchedulePage() {
  const [workerId, setWorkerId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hh-worker-id') || '';
    setWorkerId(saved);
  }, []);

  const query = useMemo(() => {
    const q = new URLSearchParams({ worker_id: workerId });
    if (status) q.set('status', status);
    return q.toString();
  }, [workerId, status]);

  async function load() {
    if (!workerId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/worker/jobs?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('jobs ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (workerId) load(); }, [query]);

  async function updateStatus(job_id: string, newStatus: string) {
    try {
      setErr(null);
      const res = await fetch('/api/worker/jobs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id, status: newStatus }) });
      if (!res.ok) throw new Error('update ' + res.status);
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <AuthGuard requiredType="worker">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">My Schedule</h1>
          <p className="hh-subtitle">View and manage your assigned jobs</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="hh-label">Worker ID
              <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
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
            <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 text-left">Scheduled</th>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Household</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((j)=> (
                  <tr key={j.id} className="border-t">
                    <td className="p-3">{new Date(j.scheduled_at).toLocaleString()}</td>
                    <td className="p-3">{j.service}</td>
                    <td className="p-3">{j.household_id}</td>
                    <td className="p-3">{j.status}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {j.status === 'pending' && (
                          <button className="hh-btn hh-btn-secondary" onClick={()=>updateStatus(j.id, 'active')}>Accept</button>
                        )}
                        {j.status === 'active' && (
                          <button className="hh-btn hh-btn-secondary" onClick={()=>updateStatus(j.id, 'completed')}>Complete</button>
                        )}
                        {(j.status === 'pending' || j.status === 'active') && (
                          <button className="hh-btn hh-btn-secondary" onClick={()=>updateStatus(j.id, 'cancelled')}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr><td colSpan={5} className="p-3 hh-muted">No jobs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
