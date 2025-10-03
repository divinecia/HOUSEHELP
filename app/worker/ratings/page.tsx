"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RatingStars from "@/components/shared/RatingStars";
import AuthGuard from "@/components/AuthGuard";

export default function WorkerRatingsPage() {
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
      const res = await fetch(`/api/admin/ratings?worker_id=${encodeURIComponent(workerId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('ratings ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (workerId) load(); }, [workerId]);

  const avgRating = items.length > 0 ? items.reduce((sum, r) => sum + Number(r.rating || 0), 0) / items.length : 0;

  return (
    <AuthGuard requiredType="worker">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">My Ratings & Reviews</h1>
          <p className="hh-subtitle">View feedback from households</p>

          <div className="mt-4 flex items-center gap-3">
            <label className="hh-label">Worker ID
              <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
            </label>
            <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
            <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          {items.length > 0 && (
            <div className="hh-content-section">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-semibold text-slate-800">{avgRating.toFixed(1)}</div>
                <div>
                  <RatingStars rating={Math.round(avgRating)} readonly />
                  <div className="hh-muted text-sm">{items.length} reviews</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {items.map((r)=> (
              <div key={r.id} className="hh-panel p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={r.rating} readonly />
                      <span className="hh-muted text-sm">Household: {r.household_id}</span>
                    </div>
                    <p className="mt-2 text-slate-700">{r.comment ?? 'No comment'}</p>
                    <div className="text-xs hh-muted mt-2">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <div className="p-4 hh-muted">No ratings found.</div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
