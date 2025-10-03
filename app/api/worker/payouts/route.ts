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
    const worker_id = auth.userId; // Use authenticated user ID
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
    const { amount, method } = body || {};
    if (!amount) return Response.json({ error: 'amount required' }, { status: 400 });

    const row = { worker_id: auth.userId, amount: Number(amount), method: method ?? null, status: 'requested' } as any;
    const res = await fetch(`${url}/rest/v1/payouts`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    if (!res.ok) return Response.json({ error: `create ${res.status}` }, { status: res.status });
    const created = await res.json();
    return Response.json({ ok: true, item: created?.[0] ?? null });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}
