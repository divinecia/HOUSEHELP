"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [fromDays, setFromDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => new URLSearchParams({ fromDays: String(fromDays), limit: String(limit), offset: String(offset) }).toString(), [fromDays, limit, offset]);

  async function load() {
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/admin/payments?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('payments ' + res.status);
      const js = await res.json();
      setItems(js.items || []); setTotal(js.total ?? null);
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [query]);

  const pages = total !== null ? Math.ceil(total / limit) : 0;
  const page = Math.floor(offset / limit) + 1;

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Payments</h1>
        <p className="hh-subtitle">Recent transactions</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="hh-label">Range
            <select className="hh-select ml-2" value={fromDays} onChange={(e)=>setFromDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <label className="hh-label">Page size
            <select className="hh-select ml-2" value={limit} onChange={(e)=>{setOffset(0); setLimit(Number(e.target.value));}}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/admin/dashboard" className="hh-link ml-auto">← Back to Dashboard</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Created</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Fee</th>
                <th className="text-right p-3">Tax</th>
                <th className="text-right p-3">Payout</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Refs</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">{p.amount ? `RWF ${Number(p.amount).toLocaleString()}` : "—"}</td>
                  <td className="p-3 text-right">{p.platform_fee ? `RWF ${Number(p.platform_fee).toLocaleString()}` : "—"}</td>
                  <td className="p-3 text-right">{p.tax ? `RWF ${Number(p.tax).toLocaleString()}` : "—"}</td>
                  <td className="p-3 text-right">{p.payout ? `RWF ${Number(p.payout).toLocaleString()}` : "—"}</td>
                  <td className="p-3">{p.status ?? "—"}</td>
                  <td className="p-3">H:{p.household_id ?? "—"} W:{p.worker_id ?? "—"} B:{p.booking_id ?? "—"}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td className="p-3 hh-muted" colSpan={7}>No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="mt-4 flex items-center gap-3">
            <button className="hh-btn hh-btn-secondary" disabled={offset===0} onClick={()=>setOffset(Math.max(0, offset - limit))}>Prev</button>
            <span className="hh-muted">Page {page} of {pages}</span>
            <button className="hh-btn hh-btn-secondary" disabled={(offset+limit)>= (total ?? 0)} onClick={()=>setOffset(offset + limit)}>Next</button>
          </div>
        )}
      </main>
    </div>
  );
}
