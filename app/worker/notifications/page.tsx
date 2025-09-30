"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WorkerNotificationsPage() {
  const [workerId, setWorkerId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hh-worker-id') || '';
    setWorkerId(saved);
  }, []);

  async function load() {
    if (!workerId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/worker/notifications?worker_id=${encodeURIComponent(workerId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('notifications ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (workerId) load(); }, [workerId]);

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Notifications</h1>
        <p className="hh-subtitle">View all notifications and alerts</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Worker ID
            <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="mt-4 space-y-3">
          {items.map((n)=> (
            <div key={n.id} className="rounded-lg border border-slate-200 p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{n.title}</h3>
                  <p className="hh-muted mt-1">{n.message ?? 'No message'}</p>
                  <div className="text-xs hh-muted mt-2">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {n.severity && (
                  <span className={`px-2 py-1 rounded text-xs ${n.severity === 'critical' ? 'bg-red-100 text-red-800' : n.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {n.severity}
                  </span>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-4 hh-muted">No notifications found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
