"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function AdminHouseholdsPage() {
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => new URLSearchParams(status ? { status } : {}).toString(), [status]);

  async function load() {
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/admin/households${query ? `?${query}` : ""}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('households ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [query]);

  async function act(household_id: string, action: "verify"|"suspend"|"unsuspend") {
    try {
      setErr(null);
      const res = await fetch('/api/admin/households', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ household_id, action }) });
      if (!res.ok) throw new Error('update ' + res.status);
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Households</h1>
        <p className="hh-subtitle">Manage household accounts</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="hh-label">Status
            <select className="hh-select ml-2" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="verifying">Verifying</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/admin/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Verification</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h)=> (
                <tr key={h.id} className="border-t">
                  <td className="p-3">{h.name ?? '—'}</td>
                  <td className="p-3">{h.email ?? '—'}</td>
                  <td className="p-3">{h.status ?? '—'}</td>
                  <td className="p-3">{h.verification_status ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="hh-btn hh-btn-secondary" onClick={()=>act(h.id, 'verify')}>Verify</button>
                      {h.status !== 'suspended' ? (
                        <button className="hh-btn hh-btn-secondary" onClick={()=>act(h.id, 'suspend')}>Suspend</button>
                      ) : (
                        <button className="hh-btn hh-btn-secondary" onClick={()=>act(h.id, 'unsuspend')}>Unsuspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-3 hh-muted">No households found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
