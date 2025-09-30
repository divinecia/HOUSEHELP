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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const qs = new URLSearchParams({ select: 'id,type,subject,description,status,created_at,household_id,worker_id' });
    if (type) qs.set('type', `eq.${type}`);
    if (status) qs.set('status', `eq.${status}`);
    qs.set('order', 'created_at.desc');
    const res = await fetch(`${url}/rest/v1/reports?${qs.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `reports ${res.status}` }, { status: res.status });
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
    const { report_id, status, resolution } = body || {};
    if (!report_id || !status) return Response.json({ error: 'report_id and status required' }, { status: 400 });
    const patch: any = { status };
    if (resolution) patch.resolution = resolution;
    if (status === 'resolved') patch.resolved_at = new Date().toISOString();
    const res = await fetch(`${url}/rest/v1/reports?id=eq.${encodeURIComponent(report_id)}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return Response.json({ error: `update ${res.status}` }, { status: res.status });
    const updated = await res.json();
    return Response.json({ ok: true, item: updated?.[0] ?? null });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
