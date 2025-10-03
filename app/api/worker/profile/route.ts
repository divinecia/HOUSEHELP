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
    const worker_id = auth.userId; // Use authenticated user ID
    if (!worker_id) return Response.json({ error: 'Invalid user session' }, { status: 400 });

    const res = await fetch(`${url}/rest/v1/workers?id=eq.${encodeURIComponent(worker_id)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `profile ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, item: items?.[0] ?? null });
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
    const { worker_id, ...fields } = body || {};
    const targetWorkerId = worker_id || auth.userId; // Allow updating own profile

    if (!targetWorkerId) return Response.json({ error: 'worker_id required' }, { status: 400 });

    // Authorize: workers can only update their own profile
    if (!authorizeResourceAccess(auth, targetWorkerId)) {
      return forbiddenResponse("You can only update your own profile");
    }

    const res = await fetch(`${url}/rest/v1/workers?id=eq.${encodeURIComponent(targetWorkerId)}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return Response.json({ error: `update ${res.status}` }, { status: res.status });
    const updated = await res.json();
    return Response.json({ ok: true, item: updated?.[0] ?? null });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}
