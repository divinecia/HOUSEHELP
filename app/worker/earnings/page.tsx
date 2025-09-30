"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function WorkerEarningsPage() {
  const [workerId, setWorkerId] = useState<string>("");
  const [fromDays, setFromDays] = useState(30);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hh-worker-id') || '';
    setWorkerId(saved);
  }, []);

  const query = useMemo(() => new URLSearchParams({ worker_id: workerId, fromDays: String(fromDays) }).toString(), [workerId, fromDays]);

  async function load() {
    if (!workerId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/worker/earnings?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('earnings ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (workerId) load(); }, [query]);

  const total = items.reduce((sum, p) => sum + Number(p.payout ?? 0), 0);

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Earnings</h1>
        <p className="hh-subtitle">Detailed earnings breakdown</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="hh-label">Worker ID
            <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
          </label>
          <label className="hh-label">Period
            <select className="hh-select ml-2" value={fromDays} onChange={(e)=>setFromDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="hh-content-section">
          <h2 className="font-semibold text-slate-800 mb-4">Earnings Breakdown</h2>

          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Fee</th>
                <th className="p-3 text-right">Tax</th>
                <th className="p-3 text-right">Payout</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p)=> (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">RWF {Number(p.amount ?? 0).toLocaleString()}</td>
                  <td className="p-3 text-right">RWF {Number(p.platform_fee ?? 0).toLocaleString()}</td>
                  <td className="p-3 text-right">RWF {Number(p.tax ?? 0).toLocaleString()}</td>
                  <td className="p-3 text-right">RWF {Number(p.payout ?? 0).toLocaleString()}</td>
                  <td className="p-3">{p.status ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={6} className="p-3 hh-muted">No earnings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </main>
    </div>
  );
}
