import { NextRequest } from "next/server";

const mustEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
};

export async function GET(req: NextRequest) {
  try {
    const { url, key } = mustEnv();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // e.g., verifying, active, suspended
    const q = new URLSearchParams({ select: "id,full_name,email,status,created_at,verification_status,rating" });
    if (status) q.set("status", `eq.${status}`);
    const res = await fetch(`${url}/rest/v1/workers?${q.toString()}&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
    });
    if (!res.ok) return Response.json({ error: `workers ${res.status}` }, { status: res.status });
    const items = await res.json();
    return Response.json({ ok: true, items });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { worker_id, action } = body as { worker_id: string; action: "verify" | "suspend" | "unsuspend" };
    if (!worker_id || !action) return Response.json({ error: "worker_id and action required" }, { status: 400 });
    const { url, key } = mustEnv();

    // Map actions to fields
    let patch: Record<string, any> = {};
    if (action === "verify") patch = { verification_status: "verified", status: "active" };
    if (action === "suspend") patch = { status: "suspended" };
    if (action === "unsuspend") patch = { status: "active" };

    const res = await fetch(`${url}/rest/v1/workers?id=eq.${encodeURIComponent(worker_id)}`, {
      method: "PATCH",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return Response.json({ error: `update ${res.status}` }, { status: res.status });
    const updated = await res.json();
    return Response.json({ ok: true, item: updated?.[0] ?? null });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
