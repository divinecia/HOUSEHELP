"use client";

import { useEffect, useState } from "react";        <div className="hh-content-section">
          <h2 className="font-semibold text-slate-800 mb-4">Request Withdrawal</h2>mport Link from "next/link";

export default function WorkerPayoutsPage() {
  const [workerId, setWorkerId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('hh-worker-id') || '';
    setWorkerId(saved);
  }, []);

  async function load() {
    if (!workerId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/worker/payouts?worker_id=${encodeURIComponent(workerId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('payouts ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (workerId) load(); }, [workerId]);

  async function requestWithdrawal() {
    if (!workerId || !amount) return;
    try {
      setErr(null);
      const res = await fetch('/api/worker/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ worker_id: workerId, amount: Number(amount), method }) });
      if (!res.ok) throw new Error('request ' + res.status);
      setAmount(""); setMethod("");
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Payouts & Withdrawals</h1>
        <p className="hh-subtitle">Request withdrawals and view history</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="hh-label">Worker ID
            <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="hh-content-section">
          <h2 className="font-semibold text-slate-800 mb-3">Request Withdrawal</h2>
          <div className="hh-form-grid">
            <div>
              <label className="hh-label">Amount (RWF)</label>
              <input type="number" className="hh-input" value={amount} onChange={(e)=>setAmount(e.target.value)} />
            </div>
            <div>
              <label className="hh-label">Method</label>
              <select className="hh-select" value={method} onChange={(e)=>setMethod(e.target.value)}>
                <option value="">Select method</option>
                <option>Mobile Money</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div>
              <button className="hh-btn hh-btn-primary" onClick={requestWithdrawal} disabled={!workerId || !amount}>Request</button>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Requested</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Processed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p)=> (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">RWF {Number(p.amount ?? 0).toLocaleString()}</td>
                  <td className="p-3">{p.method ?? '—'}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3">{p.processed_at ? new Date(p.processed_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-3 hh-muted">No payouts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
