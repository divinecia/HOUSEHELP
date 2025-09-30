"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RatingStars from "@/components/shared/RatingStars";

export default function HouseholdReviewsPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/household/reviews?household_id=${encodeURIComponent(householdId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('reviews ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (householdId) load(); }, [householdId]);

  async function submit() {
    if (!householdId || !workerId || !rating) return;
    try {
      setErr(null);
      const res = await fetch('/api/household/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, worker_id: workerId, rating, comment })
      });
      if (!res.ok) throw new Error('submit ' + res.status);
      setShowForm(false);
      setWorkerId(""); setRating(5); setComment("");
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Ratings & Reviews</h1>
        <p className="hh-subtitle">View and submit worker reviews</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Household ID
            <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <button className="hh-btn hh-btn-primary" onClick={()=>setShowForm(!showForm)}>Add Review</button>
          <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        {showForm && (
          <div className="hh-content-section">
            <h3 className="font-semibold text-slate-800 mb-3">Submit Review</h3>
            <div className="hh-form-grid">
              <div>
                <label className="hh-label">Worker ID</label>
                <input className="hh-input" placeholder="W-..." value={workerId} onChange={(e)=>setWorkerId(e.target.value)} />
              </div>
              <div>
                <label className="hh-label">Rating</label>
                <RatingStars rating={rating} onChange={setRating} />
              </div>
              <div className="sm:col-span-2">
                <label className="hh-label">Comment</label>
                <textarea className="hh-input" rows={3} placeholder="Share your experience..." value={comment} onChange={(e)=>setComment(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button className="hh-btn hh-btn-primary" onClick={submit} disabled={!householdId || !workerId}>Submit</button>
                <button className="hh-btn hh-btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
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
                    <span className="hh-muted text-sm">Worker: {r.worker_id}</span>
                  </div>
                  <p className="mt-2 text-slate-700">{r.comment ?? 'No comment'}</p>
                  <div className="text-xs hh-muted mt-2">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-4 hh-muted">No reviews found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
