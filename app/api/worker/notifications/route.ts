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
    const res = await fetch(`${url}/rest/v1/notifications?worker_id=eq.${encodeURIComponent(worker_id)}&order=created_at.desc&limit=50`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `notifications ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}
