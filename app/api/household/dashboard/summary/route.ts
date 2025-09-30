import { NextRequest } from "next/server";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
}

async function jget(u: string, headers: Record<string, string>) {
  const res = await fetch(u, { headers, cache: "no-store" });
  if (!res.ok) return { ok: false, status: res.status, items: [] };
  const items = await res.json();
  return { ok: true, items };
}

export async function GET(req: NextRequest) {
  try {
    const { url, key } = env();
    const { searchParams } = new URL(req.url);
    const household_id = searchParams.get("household_id");
    const fromDays = Number(searchParams.get("fromDays") || "30");
    if (!household_id) return Response.json({ error: "household_id required" }, { status: 400 });
    const fromISO = new Date(Date.now() - fromDays*24*3600*1000).toISOString();

    const h = { apikey: key, Authorization: `Bearer ${key}` } as Record<string, string>;

    const bookingsQ = new URLSearchParams({
      select: "id,status,service,worker_id,scheduled_at",
      order: "scheduled_at.asc",
      limit: "5",
      household_id: `eq.${household_id}`,
      "scheduled_at": `gte.${new Date().toISOString()}`,
    }).toString();
    const recentBookingsQ = new URLSearchParams({
      select: "id,status,service,worker_id,scheduled_at",
      order: "scheduled_at.desc",
      limit: "5",
      household_id: `eq.${household_id}`,
      "scheduled_at": `gte.${fromISO}`,
    }).toString();

    const subQ = new URLSearchParams({
      select: "id,plan,status,expiry_date,created_at",
      order: "created_at.desc",
      limit: "1",
      household_id: `eq.${household_id}`,
    }).toString();

    const payQ = new URLSearchParams({
      select: "id,amount,created_at,method,status",
      order: "created_at.desc",
      limit: "1",
      household_id: `eq.${household_id}`,
    }).toString();

    const msgsQ = new URLSearchParams({
      select: "id,sender,preview:content,created_at",
      order: "created_at.desc",
      limit: "3",
      household_id: `eq.${household_id}`,
    }).toString();

    const notiQ = new URLSearchParams({
      select: "id,title,created_at",
      order: "created_at.desc",
      limit: "3",
      household_id: `eq.${household_id}`,
    }).toString();

    const reviewsQ = new URLSearchParams({
      select: "id,rating,comment,created_at,worker_id",
      order: "created_at.desc",
      limit: "3",
      household_id: `eq.${household_id}`,
    }).toString();

    const [upcoming, subscription, lastPayment, messages, notifications, reviews, recentBookings] = await Promise.all([
      jget(`${url}/rest/v1/bookings?${bookingsQ}`, h),
      jget(`${url}/rest/v1/household_subscriptions?${subQ}`, h),
      jget(`${url}/rest/v1/payments?${payQ}`, h),
      jget(`${url}/rest/v1/messages?${msgsQ}`, h),
      jget(`${url}/rest/v1/notifications?${notiQ}`, h),
      jget(`${url}/rest/v1/worker_ratings_reviews?${reviewsQ}`, h),
      jget(`${url}/rest/v1/bookings?${recentBookingsQ}`, h),
    ]);

    return Response.json({
      ok: true,
      upcoming: upcoming.items,
      recentBookings: recentBookings.items,
      subscription: subscription.items?.[0] ?? null,
      lastPayment: lastPayment.items?.[0] ?? null,
      messages: messages.items,
      notifications: notifications.items,
      reviews: reviews.items,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
