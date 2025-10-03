"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";

interface WorkerSummary {
  today?: Array<{ id: string; service_name: string; scheduled_at: string; household_id: string; status: string }>;
  upcoming?: Array<{ id: string; service_name: string; service: string; scheduled_at: string; household_id: string; status: string }>;
  earnings?: {
    day: number;
    week: number;
    month: number;
  };
  training?: Array<{ id: string; module_id: string; status: string; due_at?: string }>;
  ratings?: Array<{ id: string; rating: number; comment?: string }>;
  messages?: Array<{ id: string; sender: string; preview: string }>;
  notifications?: Array<{ id: string; title: string; created_at: string }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: string;
}

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

function WorkerDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [workerId, setWorkerId] = useState<string>("");
  const [summary, setSummary] = useState<WorkerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<'day'|'week'|'month'>('day');

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('hh-user');
    const savedId = localStorage.getItem('hh-worker-id') || '';
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setWorkerId(savedId || userData.id);
    } else {
      setWorkerId(savedId);
    }
  }, []);

  const loadSummary = useCallback(async (id: string, signal?: AbortSignal) => {
    try {
      setErr(null); setLoading(true);
      const token = localStorage.getItem('hh-token');
      const res = await fetch(`/api/worker/dashboard/summary?worker_id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        signal
      });
      if (!res.ok) throw new Error('summary ' + res.status);
      const js = await res.json();
      setSummary(js);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setErr(e instanceof Error ? e.message : 'An error occurred');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!workerId) return;

    const controller = new AbortController();
    loadSummary(workerId, controller.signal);

    return () => controller.abort();
  }, [workerId, loadSummary]);

  return (
    <div className="hh-page">
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="hh-panel-sticky">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[rgb(76,102,164)] to-[rgb(138,165,208)] flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'W'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 truncate">{user?.name || 'Worker'}</div>
                <div className="hh-muted text-xs">DASHBOARD</div>
              </div>
            </div>
            <LogoutButton userType="worker" className="w-full mb-4 hh-btn hh-btn-secondary text-sm" />
            <nav className="space-y-2 text-sm">
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs">Schedule</div>
              <Link href="/worker/schedule" className="hh-link block">My Schedule</Link>
              <Link href="/worker/jobs?status=active" className="hh-link block">Active Jobs</Link>
              <Link href="/worker/jobs?status=completed" className="hh-link block">Completed Jobs</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Messages & Notifications</div>
              <Link href="/worker/messages" className="hh-link block">Messages</Link>
              <Link href="/worker/notifications" className="hh-link block">Notifications</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Earnings</div>
              <Link href="/worker/earnings" className="hh-link block">Earnings</Link>
              <Link href="/worker/payouts" className="hh-link block">Withdrawals</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Training</div>
              <Link href="/worker/training" className="hh-link block">Training Modules</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Profile & Verification</div>
              <Link href="/worker/profile" className="hh-link block">Profile</Link>
              <Link href="/worker/verification" className="hh-link block">Verification</Link>

              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Reports</div>
              <Link href="/worker/reports/system" className="hh-link block">System Issues</Link>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-6">
          <header>
            <h1 className="hh-title">Worker Dashboard</h1>
            <p className="hh-subtitle">Your schedule, earnings, and training</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="hh-label">Worker ID
                <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
              </label>
              <button className="hh-btn hh-btn-secondary" onClick={()=>workerId && loadSummary(workerId)} disabled={loading}>Refresh</button>
              {err && <span className="hh-error">{err}</span>}
            </div>
          </header>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Today's Jobs" value={loading? '…' : String(summary?.today?.length ?? 0)} />
            <StatCard title="This Week" value={loading? '…' : String(summary?.upcoming?.length ?? 0)} />
            <StatCard title="Unread Messages" value={loading? '…' : String(summary?.messages?.length ?? 0)} />
            <StatCard title="Notifications" value={loading? '…' : String(summary?.notifications?.length ?? 0)} />
          </div>

          {/* Assigned Jobs Schedule */}
          <Panel title="Assigned Jobs Schedule" action={<Link href="/worker/schedule" className="hh-btn hh-btn-secondary">Open</Link>}>
            <div className="flex items-center gap-3 mb-3">
              <label className="hh-label">View
                <select className="hh-select ml-2" value={view} onChange={(e)=>setView(e.target.value as 'day'|'week'|'month')}>
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </label>
            </div>
            <ul className="text-sm text-slate-700 space-y-2">
              {(summary?.upcoming ?? []).map((j) => (
                <li key={j.id}>• {new Date(j.scheduled_at).toLocaleString()} — {j.service} (Household: {j.household_id}) [{j.status}]</li>
              ))}
              {(!summary?.upcoming || summary.upcoming.length===0) && !loading && (
                <li className="hh-muted">No upcoming jobs.</li>
              )}
            </ul>
          </Panel>

          {/* Earnings Summary */}
          <Panel title="Earnings Summary" action={<Link href="/worker/earnings" className="hh-btn hh-btn-secondary">Details</Link>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Today" value={summary ? `RWF ${Number(summary?.earnings?.day ?? 0).toLocaleString()}` : '…'} />
              <StatCard title="This Week" value={summary ? `RWF ${Number(summary?.earnings?.week ?? 0).toLocaleString()}` : '…'} />
              <StatCard title="This Month" value={summary ? `RWF ${Number(summary?.earnings?.month ?? 0).toLocaleString()}` : '…'} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <StatCard title="Deductions" value="RWF —" sub="Tax, welfare, platform fees" />
              <StatCard title="Available for Withdrawal" value="RWF —" />
              <StatCard title="Last Withdrawal" value="RWF —" />
            </div>
          </Panel>

          {/* Training Progress */}
          <Panel title="Training Progress" action={<Link href="/worker/training" className="hh-btn hh-btn-secondary">Manage</Link>}>
            <ul className="text-sm text-slate-700 space-y-2">
              {(summary?.training ?? []).map((t) => (
                <li key={t.id}>• Module {t.module_id} — {t.status} {t.due_at ? `(Due ${new Date(t.due_at).toLocaleDateString()})` : ''}</li>
              ))}
              {(!summary?.training || summary.training.length===0) && !loading && (
                <li className="hh-muted">No training assignments.</li>
              )}
            </ul>
          </Panel>

          {/* Ratings & Reviews */}
          <Panel title="Ratings & Reviews" action={<Link href="/worker/ratings" className="hh-btn hh-btn-secondary">View</Link>}>
            <ul className="text-sm text-slate-700 space-y-2">
              {(summary?.ratings ?? []).map((r) => (
                <li key={r.id}>• {r.comment ?? 'No comment'} — {'★'.repeat(Number(r.rating||0))}</li>
              ))}
              {(!summary?.ratings || summary.ratings.length===0) && !loading && (
                <li className="hh-muted">No recent reviews.</li>
              )}
            </ul>
          </Panel>

          {/* Notifications */}
          <Panel title="Notifications" action={<Link href="/worker/notifications" className="hh-btn hh-btn-secondary">Open</Link>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="hh-muted mb-2">Messages</div>
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
                <div className="hh-muted mb-2">Alerts</div>
                <ul className="text-sm text-slate-700 space-y-2">
                  {(summary?.notifications ?? []).map((n) => (
                    <li key={n.id}>• {n.title} — {new Date(n.created_at).toLocaleString()}</li>
                  ))}
                  {(!summary?.notifications || summary.notifications.length===0) && !loading && (
                    <li className="hh-muted">No alerts.</li>
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

export default function WorkerDashboard() {
  return (
    <AuthGuard requiredType="worker">
      <WorkerDashboardContent />
    </AuthGuard>
  );
}
