import { NextRequest } from "next/server";
import {
  authenticateRequest,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
}

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    // Verify user is a worker
    if (auth.userType !== 'worker') {
      return forbiddenResponse("Access restricted to workers");
    }

    const { url, key } = env();
    const user_id = auth.userId; // Use authenticated user ID
    const res = await fetch(`${url}/rest/v1/messages?or=(sender_id.eq.${encodeURIComponent(user_id)},recipient_id.eq.${encodeURIComponent(user_id)})&order=created_at.desc&limit=50`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `messages ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    // Verify user is a worker
    if (auth.userType !== 'worker') {
      return forbiddenResponse("Access restricted to workers");
    }

    const { url, key } = env();
    const body = await req.json();
    const { recipient_id, content } = body || {};
    if (!recipient_id || !content) return Response.json({ error: 'recipient_id, content required' }, { status: 400 });

    const row = { sender_id: auth.userId, recipient_id, content, created_at: new Date().toISOString() };
    const res = await fetch(`${url}/rest/v1/messages`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    if (!res.ok) return Response.json({ error: `send ${res.status}` }, { status: res.status });
    const created = await res.json();
    return Response.json({ ok: true, item: created?.[0] ?? null });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}
