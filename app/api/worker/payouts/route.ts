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
    if (!worker_id) return Response.json({ error: 'worker_id required' }, { status: 400 });
    const qs = new URLSearchParams({
      select: 'id,amount,status,created_at,processed_at,method',
      order: 'created_at.desc',
      worker_id: `eq.${worker_id}`,
    }).toString();
    const res = await fetch(`${url}/rest/v1/payouts?${qs}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' });
    if (!res.ok) return Response.json({ error: `payouts ${res.status}` }, { status: res.status });
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
    const { worker_id, amount, method } = body || {};
    if (!worker_id || !amount) return Response.json({ error: 'worker_id and amount required' }, { status: 400 });
    const row = { worker_id, amount: Number(amount), method: method ?? null, status: 'requested' } as any;
    const res = await fetch(`${url}/rest/v1/payouts`, {
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
