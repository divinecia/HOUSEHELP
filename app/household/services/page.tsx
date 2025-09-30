"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HouseholdServicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null); setLoading(true);
      const res = await fetch('/api/household/services', { cache: 'no-store' });
      if (!res.ok) throw new Error('services ' + res.status);
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Browse Services</h1>
        <p className="hh-subtitle">Explore available services</p>

        <div className="mt-4 flex items-center gap-3">
          <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
          <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        {err && <div className="hh-error mt-3">{err}</div>}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s)=> (
            <div key={s.id} className="hh-panel p-4">
              <h3 className="font-semibold text-slate-800">{s.name}</h3>
              <p className="hh-muted mt-2">{s.description ?? 'No description'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-800">RWF {Number(s.price ?? 0).toLocaleString()}</span>
                <span className="hh-muted text-sm">{s.duration ?? '—'}</span>
              </div>
              <button className="hh-btn hh-btn-primary w-full mt-3">Book Now</button>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="col-span-full p-4 hh-muted">No services found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
