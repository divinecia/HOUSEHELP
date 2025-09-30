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
    const user_id = searchParams.get('user_id');
    if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });
    const res = await fetch(`${url}/rest/v1/messages?or=(sender_id.eq.${encodeURIComponent(user_id)},recipient_id.eq.${encodeURIComponent(user_id)})&order=created_at.desc&limit=50`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `messages ${res.status}` }, { status: res.status });
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
    const { user_id, recipient_id, content } = body || {};
    if (!user_id || !recipient_id || !content) return Response.json({ error: 'user_id, recipient_id, content required' }, { status: 400 });
    const row = { sender_id: user_id, recipient_id, content, created_at: new Date().toISOString() };
    const res = await fetch(`${url}/rest/v1/messages`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    if (!res.ok) return Response.json({ error: `send ${res.status}` }, { status: res.status });
    const created = await res.json();
    return Response.json({ ok: true, item: created?.[0] ?? null });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
