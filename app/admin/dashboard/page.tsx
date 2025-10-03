"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);
import Link from "next/link";

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

function JobsChart({ fromDays }: { fromDays: number }) {
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/jobs?fromDays=${fromDays}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('jobs ' + res.status);
        const { items } = await res.json();
        const buckets: Record<string, number> = {};
        for (const it of items || []) {
          if (!it.completed_at) continue;
          const d = new Date(it.completed_at);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          buckets[key] = (buckets[key] || 0) + 1;
        }
        const keys = Object.keys(buckets).sort();
        const vals = keys.map(k => buckets[k]);
        if (!aborted) { setLabels(keys); setData(vals); }
      } catch {
        if (!aborted) { setLabels([]); setData([]); }
      }
    })();
    return () => { aborted = true; };
  }, [fromDays]);

  if (labels.length === 0) return <div className="h-32 bg-slate-100 rounded" />;
  return (
    <Line
      data={{ labels, datasets: [{ label: `Completed jobs (${fromDays}d)`, data, borderColor: "rgba(95,108,126,1)", backgroundColor: "rgba(95,108,126,0.2)", tension: 0.25 }] }}
      options={{ responsive: true, plugins: { legend: { display: true } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "#eef2f7" } } } }}
    />
  );
}

function RatingsChart({ fromDays }: { fromDays: number }) {
  const [counts, setCounts] = useState<number[]>([0,0,0,0,0]);
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/ratings?fromDays=${fromDays}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('ratings ' + res.status);
        const { items } = await res.json();
        const buckets = [0,0,0,0,0];
        for (const it of items || []) {
          const r = Number(it.rating);
          if (Number.isFinite(r) && r >= 1 && r <= 5) buckets[r-1] += 1;
        }
        if (!aborted) setCounts(buckets);
      } catch {
        if (!aborted) setCounts([0,0,0,0,0]);
      }
    })();
    return () => { aborted = true; };
  }, [fromDays]);

  const labels = ["1★","2★","3★","4★","5★"];
  if (counts.every(c => c === 0)) return <div className="h-32 bg-slate-100 rounded" />;
  return (
    <Bar
      data={{ labels, datasets: [{ label: `Ratings (${fromDays}d)`, data: counts, backgroundColor: "rgba(138,165,208,0.6)", borderColor: "rgba(138,165,208,1)" }] }}
      options={{ responsive: true, plugins: { legend: { display: true } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "#eef2f7" } } } }}
    />
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fromDays, setFromDays] = useState<number>(7);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [revLabels, setRevLabels] = useState<string[]>([]);
  const [revData, setRevData] = useState<number[]>([]);

  const query = useMemo(() => new URLSearchParams({ fromDays: String(fromDays) }).toString(), [fromDays]);

  const loadMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      setErr(null);
      if (!metrics || Object.keys(metrics).length === 0) setLoading(true);
      const res = await fetch(`/api/admin/metrics?${query}`, { cache: 'no-store', signal });
      if (!res.ok) throw new Error('metrics ' + res.status);
      const json = await res.json();
      setMetrics(json.metrics || {});
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setErr(e.message);
      else if (typeof e === 'object' && e && 'name' in e && e.name !== 'AbortError') setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, [query, metrics]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadMetrics(ctrl.signal);
    return () => ctrl.abort();
  }, [query, loadMetrics]);

  // Build revenue trend from payments API grouped by day
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/payments?fromDays=${fromDays}&limit=1000&offset=0`, { cache: 'no-store' });
        if (!res.ok) throw new Error('payments ' + res.status);
        const { items } = await res.json();
        const buckets: Record<string, number> = {};
        for (const it of items || []) {
          const d = new Date(it.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const amt = Number(it.amount || 0);
          buckets[key] = (buckets[key] || 0) + (isFinite(amt) ? amt : 0);
        }
        const keys = Object.keys(buckets).sort();
        const vals = keys.map(k => buckets[k]);
        if (!aborted) { setRevLabels(keys); setRevData(vals); }
      } catch {
        if (!aborted) { setRevLabels([]); setRevData([]); }
      }
    })();
    return () => { aborted = true; };
  }, [fromDays]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => loadMetrics(), 30000);
    return () => clearInterval(id);
  }, [autoRefresh, query, loadMetrics]);

  return (
    <div className="hh-page">
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 sticky top-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full hh-admin-avatar" />
              <div>
                <div className="font-semibold text-slate-800">Admin</div>
                <div className="hh-muted text-xs">HOUSEHELP</div>
              </div>
            </div>
            <nav className="space-y-2 text-sm">
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs">User Management</div>
              <Link href="#users" className="hh-link block">Workers</Link>
              <Link href="#users" className="hh-link block">Households</Link>
              <Link href="#users" className="hh-link block">Admins</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Services</div>
              <Link href="#services" className="hh-link block">Service Categories</Link>
              <Link href="#services" className="hh-link block">Services</Link>
              <Link href="#subscriptions" className="hh-link block">Subscriptions</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Jobs & Bookings</div>
              <Link href="#jobs" className="hh-link block">Assign Jobs</Link>
              <Link href="#jobs" className="hh-link block">Track Jobs</Link>
              <Link href="#bookings" className="hh-link block">Bookings</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Payments</div>
              <Link href="#payments" className="hh-link block">Transactions</Link>
              <Link href="#payments" className="hh-link block">Payouts</Link>
              <Link href="#analytics" className="hh-link block">Financial Reports</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Training</div>
              <Link href="#training" className="hh-link block">Modules</Link>
              <Link href="#training" className="hh-link block">Assignments</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Reports</div>
              <Link href="#reports" className="hh-link block">Behavior Reports</Link>
              <Link href="#reports" className="hh-link block">System Issues</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Insights</div>
              <Link href="#analytics" className="hh-link block">Analytics</Link>
              <div className="font-semibold text-slate-500 uppercase tracking-wide text-xs mt-4">Notifications</div>
              <Link href="#notifications" className="hh-link block">Platform Alerts</Link>
              <Link href="#notifications" className="hh-link block">Messages</Link>
              <div className="mt-6 flex gap-2">
                <button className="hh-btn hh-btn-secondary" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
                <Link href="/" className="hh-btn hh-btn-ghost">Home</Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="hh-title">Admin Dashboard</h1>
              <p className="hh-subtitle">Overview and controls</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="hh-label">Range
                <select className="hh-select ml-2" value={fromDays} onChange={(e)=>setFromDays(Number(e.target.value))}>
                  <option value={1}>Last 24h</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </label>
              <label className="hh-label">Auto-refresh
                <input className="hh-checkbox ml-2" type="checkbox" checked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} />
              </label>
              <button className="hh-btn hh-btn-secondary" onClick={()=>loadMetrics()} disabled={loading}>Refresh</button>
              {lastRefreshed && <span className="hh-muted text-xs">Last updated {lastRefreshed}</span>}
            </div>
          </header>

          {/* Top KPIs */}
          {err && <div className="hh-error">{err}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Workers" value={(loading? '…' : String(metrics.active_workers ?? 0))} sub={loading? undefined : undefined} />
            <StatCard title="Active Households" value={(loading? '…' : String(metrics.active_households ?? 0))} />
            <StatCard title="Pending Verifications" value={(loading? '…' : String(((metrics.workers_verifying ?? 0) + (metrics.households_verifying ?? 0))))} sub="Action required" />
            <StatCard title="Open Jobs" value={(loading? '…' : String(metrics.open_jobs ?? 0))} sub="ETA avg 22m" />
          </div>

          {/* Users snapshot */}
          <Panel title="User Management Summary" action={<Link href="#users" className="hh-btn hh-btn-secondary">Manage</Link>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Workers Verifying" value={loading? '…' : String(metrics.workers_verifying ?? 0)} />
              <StatCard title="Households Verifying" value={loading? '…' : String(metrics.households_verifying ?? 0)} />
              <StatCard title="Suspended Accounts" value={loading? '…' : String(metrics.suspended_accounts ?? 0)} />
            </div>
          </Panel>

          {/* Jobs & Bookings */}
          <Panel title="Jobs & Bookings Overview" action={<Link href="#jobs" className="hh-btn hh-btn-secondary">Open</Link>}>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard title="Active" value={loading? '…' : String(metrics.open_jobs ?? 0)} />
              <StatCard title="Pending" value={loading? '…' : String(metrics.pending_jobs ?? 0)} />
              <StatCard title="Cancelled" value={loading? '…' : String(metrics.cancelled_jobs ?? 0)} />
              <StatCard title="Completed (7d)" value={loading? '…' : String(metrics.completed_jobs_7d ?? 0)} />
            </div>
            <div className="mt-4">
              <div className="hh-muted mb-2">Completion rate over time</div>
              <div className="h-24 bg-slate-100 rounded" />
            </div>
          </Panel>

          {/* Financials */}
          <Panel title="Financial Summary" action={<Link href="/admin/payments" className="hh-btn hh-btn-secondary">View</Link>}>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard title={`Revenue (last ${fromDays}d)`} value={loading? '…' : `RWF ${Number(metrics.payments_sum_window ?? 0).toLocaleString()}`} />
              <StatCard title={`Payments Count (${fromDays}d)`} value={loading? '…' : String(metrics.payments_count_window ?? 0)} />
              <StatCard title={`Platform Fees (${fromDays}d)`} value={loading? '…' : `RWF ${Number(metrics.fees_sum_window ?? 0).toLocaleString()}`} />
              <StatCard title={`Payouts (${fromDays}d)`} value={loading? '…' : `RWF ${Number(metrics.payout_sum_window ?? 0).toLocaleString()}`} sub={loading? undefined : `Pending: ${Number(metrics.pending_payouts_count ?? 0)}`} />
            </div>
            <div className="mt-4">
              <div className="hh-muted mb-2">Revenue trend</div>
              {revLabels.length > 0 ? (
                <Line
                  data={{
                    labels: revLabels,
                    datasets: [
                      {
                        label: `Revenue (RWF) last ${fromDays}d`,
                        data: revData,
                        borderColor: "rgba(76, 102, 164, 1)",
                        backgroundColor: "rgba(76, 102, 164, 0.2)",
                        tension: 0.25,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: true }, tooltip: { enabled: true } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { ticks: { callback: (v) => String(v) }, grid: { color: "#eef2f7" } },
                    },
                  }}
                />
              ) : (
                <div className="h-24 bg-slate-100 rounded" />
              )}
            </div>
          </Panel>

          {/* Training */}
          <Panel title="Training Progress" action={<Link href="#training" className="hh-btn hh-btn-secondary">Manage</Link>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Enrolled Workers" value="64" />
              <StatCard title="Avg Completion" value="72%" />
              <StatCard title="Due This Week" value="9" />
            </div>
          </Panel>

          {/* Reports */}
          <Panel title="Reports Summary" action={<Link href="#reports" className="hh-btn hh-btn-secondary">Review</Link>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard title="New Behavior Reports" value="3" sub="Isange pending" />
              <StatCard title="System Issues" value="4" sub="IT attention" />
            </div>
          </Panel>

          {/* Notifications */}
          <Panel title="Notifications & Alerts" action={<Link href="#notifications" className="hh-btn hh-btn-secondary">Open</Link>}>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>• Payment failure: Booking #9831 (retry pending)</li>
              <li>• User flag: Worker #W-102 requires review</li>
              <li>• Urgent report: Behavior report escalated</li>
            </ul>
          </Panel>

          {/* Analytics */}
          <Panel title="Key Metrics & Visualizations" action={<Link href="#analytics" className="hh-btn hh-btn-secondary">Explore</Link>}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <div className="hh-muted mb-2">Job Completion Over Time</div>
                <JobsChart fromDays={fromDays} />
              </div>
              <div>
                <div className="hh-muted mb-2">Worker Ratings Distribution</div>
                <RatingsChart fromDays={fromDays} />
              </div>
              <div>
                <div className="hh-muted mb-2">Revenue Trend</div>
                {revLabels.length > 0 ? (
                  <Line
                    data={{ labels: revLabels, datasets: [{ label: `Revenue (RWF)`, data: revData, borderColor: "rgba(76, 102, 164, 1)", backgroundColor: "rgba(76, 102, 164, 0.2)", tension: 0.25 }] }}
                    options={{ responsive: true, plugins: { legend: { display: true } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "#eef2f7" } } } }}
                  />
                ) : (
                  <div className="h-32 bg-slate-100 rounded" />
                )}
              </div>
            </div>
          </Panel>

          {/* Session debug (collapsed area) */}
          <details className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer hh-muted">Session (debug)</summary>
            <pre className="mt-3 whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">{JSON.stringify(session, null, 2)}</pre>
          </details>
        </main>
      </div>
    </div>
  );
}

