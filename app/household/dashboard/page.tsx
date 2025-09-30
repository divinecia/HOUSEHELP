"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{title}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="hh-muted mt-1">{sub}</div>}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

interface HouseholdSummary {
  upcoming?: Array<{
    id: string;
    service: string;
    scheduled_at: string;
    worker_id?: string;
    status: string;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string;
    created_at: string;
    worker_id: string;
  }>;
  messages?: Array<{
    id: string;
    sender: string;
    preview: string;
    created_at: string;
  }>;
  notifications?: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  subscription?: {
    plan: string;
    expiry_date?: string;
    usage?: string;
    benefits?: string;
  };
  lastPayment?: {
    amount: number;
    method: string;
    created_at: string;
  };
}

export default function HouseholdDashboard() {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [householdId, setHouseholdId] = useState<string>("");
  const [summary, setSummary] = useState<HouseholdSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function loadSummary(id: string) {
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/household/dashboard/summary?household_id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('summary ' + res.status);
      const js = await res.json();
      setSummary(js);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'An error occurred'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (householdId) loadSummary(householdId); }, [householdId]);

  async function createBooking() {
    try {
      setErr(null);
      const res = await fetch('/api/household/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ household_id: householdId, service, date, time }) });
      if (!res.ok) throw new Error('create ' + res.status);
      setService(""); setDate(""); setTime("");
      await loadSummary(householdId);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'An error occurred'); }
  }

  return (
    <div className="hh-page">
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="hh-panel-sticky">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-light-blue" />
              <div>
                <div className="font-semibold text-slate-800">Household</div>
                <div className="hh-muted text-xs">HOME</div>
              </div>
            </div>
            <nav className="space-y-2 text-sm">
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs">Bookings</div>
              <Link href="/household/bookings" className="hh-link block">Bookings</Link>
              <Link href="/household/bookings?status=pending" className="hh-link block">Pending</Link>
              <Link href="/household/bookings?status=active" className="hh-link block">Active</Link>
              <Link href="/household/bookings?status=completed" className="hh-link block">Completed</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Services & Subscriptions</div>
              <Link href="/household/services" className="hh-link block">Browse Services</Link>
              <Link href="/household/subscriptions" className="hh-link block">Subscriptions</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Payments</div>
              <Link href="/household/payments" className="hh-link block">Payment Methods</Link>
              <Link href="/household/payments/history" className="hh-link block">History & Invoices</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Messages & Notifications</div>
              <Link href="/household/messages" className="hh-link block">Chat</Link>
              <Link href="/household/notifications" className="hh-link block">Notifications</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Reports</div>
              <Link href="/household/reports/behavior" className="hh-link block">Behavior Reports</Link>
              <Link href="/household/reports/system" className="hh-link block">System Issues</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Profile & Family</div>
              <Link href="/household/profile" className="hh-link block">Profile</Link>
              <Link href="/household/family" className="hh-link block">Family Info</Link>
              <Link href="/household/verification" className="hh-link block">Verification</Link>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-6">
          <header>
            <h1 className="hh-title">Household Dashboard</h1>
            <p className="hh-subtitle">Manage your bookings, subscriptions, and payments</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="hh-label">Household ID
                <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
              </label>
              <button className="hh-btn hh-btn-secondary" onClick={()=>householdId && loadSummary(householdId)} disabled={loading}>Refresh</button>
              {err && <span className="hh-error">{err}</span>}
            </div>
          </header>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Upcoming Bookings" value={loading? '…' : String(summary?.upcoming?.length ?? 0)} />
            <StatCard title="Active Subscription" value={loading? '…' : (summary?.subscription?.plan ?? '—')} sub={summary?.subscription?.expiry_date ? `Renews ${new Date(summary.subscription.expiry_date).toLocaleDateString()}` : undefined} />
            <StatCard title="Outstanding Payments" value={loading? '…' : 'RWF 0'} />
            <StatCard title="Unread Messages" value={loading? '…' : String(summary?.messages?.length ?? 0)} />
          </div>

          {/* Booking quick access */}
          <Panel title="Booking Quick Access" action={<Link href="/household/bookings" className="hh-btn hh-btn-secondary">Open</Link>}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="hh-muted mb-2">Create a new booking</div>
                <div className="hh-form-grid">
                  <div>
                    <label htmlFor="service-select" className="hh-label">Service</label>
                    <select id="service-select" className="hh-select" value={service} onChange={(e)=>setService(e.target.value)}>
                      <option value="">Select service</option>
                      <option>House Cleaning</option>
                      <option>Childcare</option>
                      <option>Cooking</option>
                      <option>Laundry & Ironing</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date-input" className="hh-label">Date</label>
                    <input id="date-input" type="date" className="hh-input" value={date} onChange={(e)=>setDate(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="time-input" className="hh-label">Time</label>
                    <input id="time-input" type="time" className="hh-input" value={time} onChange={(e)=>setTime(e.target.value)} />
                  </div>
                  <div>
                    <button className="hh-btn hh-btn-primary" onClick={createBooking} disabled={!service || !date || !time || !householdId}>Create Booking</button>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="hh-muted mb-2">Recent services</div>
                  <div className="flex flex-wrap gap-2">
                    {['House Cleaning','Childcare','Cooking'].map((s)=> (
                      <button key={s} className="hh-btn hh-btn-secondary" onClick={()=>setService(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="hh-muted mb-2">Upcoming bookings</div>
                <ul className="text-sm text-slate-700 space-y-2">
                  {(summary?.upcoming ?? []).map((b) => (
                    <li key={b.id}>• {new Date(b.scheduled_at).toLocaleString()} — {b.service} (Worker: {b.worker_id ?? 'TBD'})</li>
                  ))}
                  {(!summary?.upcoming || summary.upcoming.length===0) && !loading && (
                    <li className="hh-muted">No upcoming bookings.</li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>

          {/* Subscription status */}
          <Panel title="Subscription Status" action={<Link href="/household/subscriptions" className="hh-btn hh-btn-secondary">Manage</Link>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Current Plan" value={summary?.subscription?.plan ?? '—'} sub={summary?.subscription?.expiry_date ? `Renews ${new Date(summary.subscription.expiry_date).toLocaleDateString()}` : undefined} />
              <StatCard title="Usage" value={summary?.subscription?.usage ?? '—'} />
              <StatCard title="Benefits" value={summary?.subscription?.benefits ?? '—'} />
            </div>
            <div className="mt-4 flex gap-3">
              <button className="hh-btn hh-btn-primary">Renew</button>
              <button className="hh-btn hh-btn-secondary">Upgrade</button>
            </div>
          </Panel>

          {/* Payments */}
          <Panel title="Payment Overview" action={<Link href="/household/payments" className="hh-btn hh-btn-secondary">Open</Link>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Recent Transaction" value={summary?.lastPayment ? `RWF ${Number(summary.lastPayment.amount ?? 0).toLocaleString()}` : '—'} sub={summary?.lastPayment ? new Date(summary.lastPayment.created_at).toLocaleString() : undefined} />
              <StatCard title="Outstanding" value="RWF 0" />
              <StatCard title="Methods" value={summary?.lastPayment?.method ?? '—'} />
            </div>
          </Panel>

          {/* Ratings & Reviews */}
          <Panel title="Ratings & Reviews" action={<Link href="/household/reviews" className="hh-btn hh-btn-secondary">View</Link>}>
            <ul className="text-sm text-slate-700 space-y-2">
              {(summary?.reviews ?? []).map((r) => (
                <li key={r.id}>• {r.comment ?? 'No comment'} — {"★".repeat(Number(r.rating||0))}</li>
              ))}
              {(!summary?.reviews || summary.reviews.length===0) && !loading && (
                <li className="hh-muted">No recent reviews.</li>
              )}
            </ul>
            <div className="mt-3">
              <button className="hh-btn hh-btn-primary">Rate a recent booking</button>
            </div>
          </Panel>

          {/* Messages & Notifications */}
          <Panel title="Messages & Notifications" action={<Link href="/household/messages" className="hh-btn hh-btn-secondary">Open</Link>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="hh-muted mb-2">Recent messages</div>
                <ul className="text-sm text-slate-700 space-y-2">
                  {(summary?.messages ?? []).map((m) => (
                    <li key={m.id}>• {m.sender}: {m.preview}</li>
                  ))}
                  {(!summary?.messages || summary.messages.length===0) && !loading && (
                    <li className="hh-muted">No messages.</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="hh-muted mb-2">Notifications</div>
                <ul className="text-sm text-slate-700 space-y-2">
                  {(summary?.notifications ?? []).map((n) => (
                    <li key={n.id}>• {n.title} — {new Date(n.created_at).toLocaleString()}</li>
                  ))}
                  {(!summary?.notifications || summary.notifications.length===0) && !loading && (
                    <li className="hh-muted">No notifications.</li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>
        </main>
      </div>
    </div>
  );
}
