import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) return Response.json({ error: "Missing Supabase env" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const fromDays = Number(searchParams.get("fromDays") || "90");
  const fromISO = new Date(Date.now() - fromDays * 24 * 3600 * 1000).toISOString();

  const qs = new URLSearchParams({
    select: "id,rating,created_at",
    order: "created_at.asc",
    "created_at": `gte.${fromISO}`,
  }).toString();

  const res = await fetch(`${url}/rest/v1/worker_ratings_reviews?${qs}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });
  if (!res.ok) return Response.json({ error: `ratings ${res.status}` }, { status: res.status });
  const items = await res.json();
  return Response.json({ ok: true, items, fromDays });
}
