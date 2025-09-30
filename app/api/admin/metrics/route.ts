import { NextRequest } from "next/server";

async function countTable(baseUrl: string, key: string, table: string, query: string = "") {
  const url = `${baseUrl}/rest/v1/${table}?select=id${query ? `&${query}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${table} ${res.status}`);
  const range = res.headers.get("content-range");
  const total = range ? Number(range.split("/").pop()) : null;
  return total ?? null;
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) {
    return Response.json({ error: "Missing Supabase env" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const fromDays = Number(searchParams.get('fromDays') || '7');
  const fromISO = new Date(Date.now() - fromDays*24*3600*1000).toISOString();

  const out: Record<string, number | null> = {};
  const errors: string[] = [];
  async function safe(name: string, table: string, query = "") {
    try {
      out[name] = await countTable(url!, serviceKey!, table, query);
    } catch (e: any) {
      out[name] = null;
      errors.push(`${name}:${e.message}`);
    }
  }

  await Promise.all([
    safe("active_workers", "workers"),
    safe("active_households", "households"),
    safe("open_jobs", "jobs", "status=eq.active"),
    safe("pending_jobs", "jobs", "status=eq.pending"),
    safe("cancelled_jobs", "jobs", "status=eq.cancelled"),
    safe("completed_jobs_window", "jobs", `status=eq.completed&completed_at=gte.${fromISO}`),
    safe("workers_verifying", "worker_verification", "status=eq.pending"),
    safe("households_verifying", "household_verification", "status=eq.pending"),
    safe("suspended_accounts", "workers", "status=eq.suspended"),
    safe("payments_count_window", "payments", `created_at=gte.${fromISO}`),
    safe("training_enrolled", "worker_training_assignments", "status=eq.enrolled"),
    safe("training_due_week", "worker_training_assignments", `due_at=lte.${new Date(Date.now()+7*24*3600*1000).toISOString()}&status=neq.completed`),
    safe("behavior_reports_new", "reports", "type=eq.behavior&status=eq.pending"),
    safe("system_issues_open", "reports", "type=eq.system&status=in.(pending,open)"),
    safe("notifications_critical", "notifications", "severity=eq.critical&ack=eq.false"),
  ]);

  // Try to compute payments sum if amount column exists
  try {
    const sumUrl = `${url}/rest/v1/payments?select=sum(amount)&created_at=gte.${fromISO}`;
    const res = await fetch(sumUrl, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const js = await res.json();
      const row = Array.isArray(js) && js[0] ? js[0] : {};
      const val = row?.sum ?? null;
      if (val !== null && val !== undefined) out["payments_sum_window"] = Number(val);
    }
  } catch {}

  // Try to compute fee/tax/payout sums if columns exist
  try {
    const aggUrl = `${url}/rest/v1/payments?select=sum(platform_fee),sum(tax),sum(payout)&created_at=gte.${fromISO}`;
    const res = await fetch(aggUrl, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
    if (res.ok) {
      const js = await res.json();
      const row = Array.isArray(js) && js[0] ? js[0] : {};
      if (row?.sum) {
        if (row.sum.platform_fee !== undefined) out["fees_sum_window"] = Number(row.sum.platform_fee);
        if (row.sum.tax !== undefined) out["tax_sum_window"] = Number(row.sum.tax);
        if (row.sum.payout !== undefined) out["payout_sum_window"] = Number(row.sum.payout);
      }
    }
  } catch {}

  // Pending payouts count (if status exists)
  try {
    out["pending_payouts_count"] = await countTable(url!, serviceKey!, "payments", `status=eq.pending_payout&created_at=gte.${fromISO}`);
  } catch { out["pending_payouts_count"] = null; }

  return Response.json({ ok: true, metrics: out, errors: errors.length ? errors : undefined });
}
