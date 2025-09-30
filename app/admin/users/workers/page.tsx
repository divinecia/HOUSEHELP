"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function AdminWorkersPage() {
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => new URLSearchParams(status ? { status } : {}).toString(), [status]);

  async function load() {
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/admin/workers${query ? `?${query}` : ""}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('workers ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [query]);

  async function act(worker_id: string, action: "verify"|"suspend"|"unsuspend") {
    try {
      setErr(null);
      const res = await fetch('/api/admin/workers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ worker_id, action }) });
      if (!res.ok) throw new Error('update ' + res.status);
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Workers</h1>
        <p className="hh-subtitle">Manage worker accounts</p>

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
                <th className="p-3 text-left">Rating</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w)=> (
                <tr key={w.id} className="border-t">
                  <td className="p-3">{w.full_name ?? '—'}</td>
                  <td className="p-3">{w.email ?? '—'}</td>
                  <td className="p-3">{w.status ?? '—'}</td>
                  <td className="p-3">{w.verification_status ?? '—'}</td>
                  <td className="p-3">{w.rating ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="hh-btn hh-btn-secondary" onClick={()=>act(w.id, 'verify')}>Verify</button>
                      {w.status !== 'suspended' ? (
                        <button className="hh-btn hh-btn-secondary" onClick={()=>act(w.id, 'suspend')}>Suspend</button>
                      ) : (
                        <button className="hh-btn hh-btn-secondary" onClick={()=>act(w.id, 'unsuspend')}>Unsuspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={6} className="p-3 hh-muted">No workers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
