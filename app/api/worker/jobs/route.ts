import { NextRequest } from "next/server";
import {
  authenticateRequest,
  authorizeResourceAccess,
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
    const { searchParams } = new URL(req.url);
    const worker_id = auth.userId; // Use authenticated user ID
    const status = searchParams.get('status'); // pending|active|completed|cancelled

    const qs = new URLSearchParams({ select: 'id,status,service,household_id,scheduled_at,created_at' });
    qs.set('worker_id', `eq.${worker_id}`);
    if (status) qs.set('status', `eq.${status}`);
    qs.set('order', 'scheduled_at.asc');
    const res = await fetch(`${url}/rest/v1/jobs?${qs.toString()}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' });
    if (!res.ok) return Response.json({ error: `jobs ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
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
    const { job_id, status } = body || {};
    if (!job_id || !status) return Response.json({ error: 'job_id and status required' }, { status: 400 });

    // First verify the job belongs to this worker
    const checkRes = await fetch(`${url}/rest/v1/jobs?id=eq.${encodeURIComponent(job_id)}&worker_id=eq.${auth.userId}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store'
    });
    if (!checkRes.ok || (await checkRes.json()).length === 0) {
      return forbiddenResponse("You can only update your own jobs");
    }

    const res = await fetch(`${url}/rest/v1/jobs?id=eq.${encodeURIComponent(job_id)}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return Response.json({ error: `update ${res.status}` }, { status: res.status });
    const updated = await res.json();
    return Response.json({ ok: true, item: updated?.[0] ?? null });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}
