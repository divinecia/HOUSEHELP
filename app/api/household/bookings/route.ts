import { NextRequest } from "next/server";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { household_id, service, date, time } = body || {};
    if (!household_id || !service || !date || !time) {
      return Response.json({ error: "household_id, service, date, time required" }, { status: 400 });
    }
    const scheduled_at = new Date(`${date}T${time}:00.000Z`).toISOString();
    const { url, key } = env();
    const row = { household_id, service, scheduled_at, status: "pending" };
    const res = await fetch(`${url}/rest/v1/bookings`, {
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
