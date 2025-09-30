import { NextRequest } from "next/server";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
}

export async function GET() {
  try {
    const { url, key } = env();
    const res = await fetch(`${url}/rest/v1/notifications?select=id,title,message,severity,created_at,household_id,worker_id&order=created_at.desc&limit=100`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `notifications ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, key } = env();
    const body = await req.json();
    const { title, message, severity, household_id, worker_id } = body || {};
    if (!title || !message) return Response.json({ error: 'title and message required' }, { status: 400 });
    const row = { title, message, severity: severity ?? 'info', household_id: household_id ?? null, worker_id: worker_id ?? null, created_at: new Date().toISOString() };
    const res = await fetch(`${url}/rest/v1/notifications`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    if (!res.ok) return Response.json({ error: `create ${res.status}` }, { status: res.status });
    const created = await res.json();
    return Response.json({ ok: true, item: created?.[0] ?? null });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
