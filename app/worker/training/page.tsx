"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

export default function WorkerTrainingPage() {
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
      const res = await fetch(`/api/worker/training?worker_id=${encodeURIComponent(workerId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('training ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (workerId) load(); }, [workerId]);

  async function markComplete(assignment_id: string) {
    try {
      setErr(null);
      const res = await fetch('/api/worker/training', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignment_id, status: 'completed' }) });
      if (!res.ok) throw new Error('update ' + res.status);
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <AuthGuard requiredType="worker">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">Training Modules</h1>
          <p className="hh-subtitle">Track your training progress and complete assignments</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="hh-label">Worker ID
              <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
            </label>
            <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
            <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 text-left">Module ID</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Completed</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t)=> (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{t.module_id}</td>
                    <td className="p-3">{t.status}</td>
                    <td className="p-3">{t.due_at ? new Date(t.due_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3">{t.completed_at ? new Date(t.completed_at).toLocaleString() : '—'}</td>
                    <td className="p-3">
                      {t.status !== 'completed' && (
                        <button className="hh-btn hh-btn-secondary" onClick={()=>markComplete(t.id)}>Mark Complete</button>
                      )}
                      {t.status === 'completed' && (
                        <span className="hh-muted">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr><td colSpan={5} className="p-3 hh-muted">No training assignments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
