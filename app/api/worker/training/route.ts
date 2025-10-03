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
      select: 'id,module_id,status,due_at,completed_at',
      order: 'due_at.asc',
      worker_id: `eq.${worker_id}`,
    }).toString();
    const res = await fetch(`${url}/rest/v1/worker_training_assignments?${qs}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' });
    if (!res.ok) return Response.json({ error: `training ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) { return serverErrorResponse(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const { url, key } = env();
    const body = await req.json();
    const { assignment_id, status } = body || {};
    if (!assignment_id || !status) return Response.json({ error: 'assignment_id and status required' }, { status: 400 });
    const patch: any = { status };
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    const res = await fetch(`${url}/rest/v1/worker_training_assignments?id=eq.${encodeURIComponent(assignment_id)}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return Response.json({ error: `update ${res.status}` }, { status: res.status });
    const updated = await res.json();
    return Response.json({ ok: true, item: updated?.[0] ?? null });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
