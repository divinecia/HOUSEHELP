"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface WorkerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  status?: string;
  rating?: number;
}

export default function WorkerProfilePage() {
  const [workerId, setWorkerId] = useState<string>("");
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<WorkerProfile>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hh-worker-id') || '';
    setWorkerId(saved);
  }, []);

  async function load() {
    if (!workerId) return;
    try {
      setErr(null); 
      setLoading(true);
      const res = await fetch(`/api/worker/profile?worker_id=${encodeURIComponent(workerId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('profile ' + res.status);
      const js = await res.json();
      setProfile(js);
      setDraft(js);
    } catch (e: unknown) { 
      setErr(e instanceof Error ? e.message : 'An error occurred'); 
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { 
    if (workerId) load(); 
  }, [workerId]);

  async function save() {
    try {
      setErr(null);
      const res = await fetch('/api/worker/profile', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ worker_id: workerId, ...draft }) 
      });
      if (!res.ok) throw new Error('update ' + res.status);
      setEditing(false);
      await load();
    } catch (e: any) { 
      setErr(e.message); 
    }
  }

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Profile</h1>
        <p className="hh-subtitle">Manage your worker profile</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Worker ID
            <input 
              className="hh-input ml-2" 
              placeholder="W-..." 
              value={workerId} 
              onChange={(e)=>{ 
                setWorkerId(e.target.value); 
                localStorage.setItem('hh-worker-id', e.target.value); 
              }} 
            />
          </label>
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
          <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        {loading && <div className="hh-muted mt-4">Loading...</div>}

        {!loading && profile && (
          <div className="hh-content-section">
            {!editing ? (
              <div className="space-y-3">
                <div><span className="hh-label">Full Name:</span> {profile.full_name ?? '—'}</div>
                <div><span className="hh-label">Email:</span> {profile.email ?? '—'}</div>
                <div><span className="hh-label">Phone:</span> {profile.phone ?? '—'}</div>
                <div><span className="hh-label">Address:</span> {profile.address ?? '—'}</div>
                <div><span className="hh-label">Status:</span> {profile.status ?? '—'}</div>
                <div><span className="hh-label">Rating:</span> {profile.rating ?? '—'}</div>
                <button className="hh-btn hh-btn-primary" onClick={()=>setEditing(true)}>
                  Edit
                </button>
              </div>
            ) : (
              <div className="hh-form-grid">
                <div>
                  <label htmlFor="worker-name" className="hh-label">Full Name</label>
                  <input 
                    id="worker-name" 
                    className="hh-input" 
                    value={draft.full_name ?? ''} 
                    onChange={(e)=>setDraft({...draft, full_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label htmlFor="worker-email" className="hh-label">Email</label>
                  <input 
                    id="worker-email" 
                    className="hh-input" 
                    value={draft.email ?? ''} 
                    onChange={(e)=>setDraft({...draft, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label htmlFor="worker-phone" className="hh-label">Phone</label>
                  <input 
                    id="worker-phone" 
                    className="hh-input" 
                    value={draft.phone ?? ''} 
                    onChange={(e)=>setDraft({...draft, phone: e.target.value})} 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="worker-address" className="hh-label">Address</label>
                  <input 
                    id="worker-address" 
                    className="hh-input" 
                    value={draft.address ?? ''} 
                    onChange={(e)=>setDraft({...draft, address: e.target.value})} 
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <button className="hh-btn hh-btn-primary" onClick={save}>Save</button>
                  <button 
                    className="hh-btn hh-btn-secondary" 
                    onClick={()=>{ setEditing(false); setDraft(profile); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !profile && workerId && (
          <div className="hh-muted mt-4">No profile found for this worker ID.</div>
        )}
      </main>
    </div>
  );
}
