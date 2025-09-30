import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) return Response.json({ error: "Missing Supabase env" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const fromDays = Number(searchParams.get("fromDays") || "30");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);
  const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);
  const fromISO = new Date(Date.now() - fromDays * 24 * 3600 * 1000).toISOString();

  const query = new URLSearchParams({
    select: "id,created_at,amount,platform_fee,tax,payout,status,household_id,worker_id,booking_id",
    order: "created_at.desc",
    "created_at": `gte.${fromISO}`,
  }).toString();

  const res = await fetch(`${url}/rest/v1/payments?${query}&limit=${limit}&offset=${offset}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!res.ok) return Response.json({ error: `payments ${res.status}` }, { status: res.status });
  const items = await res.json();
  const range = res.headers.get("content-range");
  const total = range ? Number(range.split("/").pop()) : null;

  return Response.json({ ok: true, items, total, limit, offset, fromDays });
}
