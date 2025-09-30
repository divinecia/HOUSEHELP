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
    const household_id = searchParams.get('household_id');
    if (!household_id) return Response.json({ error: 'household_id required' }, { status: 400 });
    const res = await fetch(`${url}/rest/v1/worker_ratings_reviews?household_id=eq.${encodeURIComponent(household_id)}&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `reviews ${res.status}` }, { status: res.status });
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
    const { household_id, worker_id, booking_id, rating, comment } = body || {};
    if (!household_id || !worker_id || !rating) return Response.json({ error: 'household_id, worker_id, rating required' }, { status: 400 });
    const row = { household_id, worker_id, booking_id: booking_id ?? null, rating: Number(rating), comment: comment ?? null, created_at: new Date().toISOString() };
    const res = await fetch(`${url}/rest/v1/worker_ratings_reviews`, {
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
