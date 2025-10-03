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
    const { searchParams } = new URL(req.url);
    const worker_id = auth.userId; // Use authenticated user ID
    const fromDays = Number(searchParams.get('fromDays') || '30');
    const fromISO = new Date(Date.now() - fromDays*24*3600*1000).toISOString();
    const res = await fetch(`${url}/rest/v1/payments?worker_id=eq.${encodeURIComponent(worker_id)}&created_at=gte.${fromISO}&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: `earnings ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return serverErrorResponse(e);
  }
}
