"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (status) q.set('status', status);
    return q.toString();
  }, [type, status]);

  async function load() {
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/admin/reports${query ? `?${query}` : ""}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('reports ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [query]);

  async function resolve(report_id: string) {
    try {
      setErr(null);
      const res = await fetch('/api/admin/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report_id, status: 'resolved' }) });
      if (!res.ok) throw new Error('update ' + res.status);
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Reports</h1>
        <p className="hh-subtitle">View and manage reports</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="hh-label">Type
            <select className="hh-select ml-2" value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="">All</option>
              <option value="behavior">Behavior</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="hh-label">Status
            <select className="hh-select ml-2" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
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
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r)=> (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.type}</td>
                  <td className="p-3">{r.subject ?? '—'}</td>
                  <td className="p-3 max-w-xs truncate">{r.description}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    {r.status !== 'resolved' && (
                      <button className="hh-btn hh-btn-secondary" onClick={()=>resolve(r.id)}>Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={6} className="p-3 hh-muted">No reports found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
