import { NextRequest } from "next/server";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
}

export async function GET(req: NextRequest) {
  try {
    const { url, key } = env();
    const { searchParams } = new URL(req.url);
    const worker_id = searchParams.get('worker_id');
    const status = searchParams.get('status'); // pending|active|completed|cancelled
    if (!worker_id) return Response.json({ error: 'worker_id required' }, { status: 400 });
    const qs = new URLSearchParams({ select: 'id,status,service,household_id,scheduled_at,created_at' });
    qs.set('worker_id', `eq.${worker_id}`);
    if (status) qs.set('status', `eq.${status}`);
    qs.set('order', 'scheduled_at.asc');
    const res = await fetch(`${url}/rest/v1/jobs?${qs.toString()}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' });
    if (!res.ok) return Response.json({ error: `jobs ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { url, key } = env();
    const body = await req.json();
    const { job_id, status } = body || {};
    if (!job_id || !status) return Response.json({ error: 'job_id and status required' }, { status: 400 });
    const res = await fetch(`${url}/rest/v1/jobs?id=eq.${encodeURIComponent(job_id)}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return Response.json({ error: `update ${res.status}` }, { status: res.status });
    const updated = await res.json();
    return Response.json({ ok: true, item: updated?.[0] ?? null });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
