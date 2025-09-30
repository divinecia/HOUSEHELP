import { NextRequest } from "next/server";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
}

async function jget(u: string, headers: Record<string, string>) {
  const res = await fetch(u, { headers, cache: "no-store" });
  if (!res.ok) return { ok: false, status: res.status, items: [] } as any;
  const items = await res.json();
  return { ok: true, items };
}

export async function GET(req: NextRequest) {
  try {
    const { url, key } = env();
    const { searchParams } = new URL(req.url);
    const worker_id = searchParams.get("worker_id");
    if (!worker_id) return Response.json({ error: "worker_id required" }, { status: 400 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const h = { apikey: key, Authorization: `Bearer ${key}` } as Record<string, string>;

    // Jobs
    const upcomingQ = new URLSearchParams({
      select: "id,status,service,household_id,scheduled_at",
      order: "scheduled_at.asc",
      limit: "5",
      worker_id: `eq.${worker_id}`,
      "scheduled_at": `gte.${now.toISOString()}`,
    }).toString();
    const todayQ = new URLSearchParams({
      select: "id,status,service,household_id,scheduled_at",
      order: "scheduled_at.asc",
      worker_id: `eq.${worker_id}`,
      "scheduled_at": `gte.${todayStart}`,
      // PostgREST range upper bound unsupported in QS directly; fetch and filter client-side is fine for small limit
    }).toString();

    // Earnings via payments (sum payout)
    const sum = async (fromISO: string) => {
      try {
        const res = await fetch(`${url}/rest/v1/payments?select=sum(payout)&worker_id=eq.${encodeURIComponent(worker_id)}&created_at=gte.${fromISO}`,
          { headers: h, cache: 'no-store' });
        if (!res.ok) return 0;
        const js = await res.json();
        const row = Array.isArray(js) && js[0] ? js[0] : {};
        const val = row?.sum ?? 0;
        return Number(val) || 0;
      } catch { return 0; }
    };

    // Training assignments
    const trainingQ = new URLSearchParams({
      select: "id,module_id,status,due_at,completed_at",
      order: "due_at.asc",
      limit: "5",
      worker_id: `eq.${worker_id}`,
    }).toString();

    // Ratings
    const ratingsQ = new URLSearchParams({
      select: "id,rating,comment,created_at,household_id",
      order: "created_at.desc",
      limit: "3",
      worker_id: `eq.${worker_id}`,
    }).toString();

    // Messages/Notifications
    const msgsQ = new URLSearchParams({
      select: "id,sender,preview:content,created_at",
      order: "created_at.desc",
      limit: "3",
      worker_id: `eq.${worker_id}`,
    }).toString();
    const notiQ = new URLSearchParams({
      select: "id,title,created_at",
      order: "created_at.desc",
      limit: "3",
      worker_id: `eq.${worker_id}`,
    }).toString();

    const [upcoming, todayJobs, earningsDay, earningsWeek, earningsMonth, training, ratings, messages, notifications] = await Promise.all([
      jget(`${url}/rest/v1/jobs?${upcomingQ}`, h),
      jget(`${url}/rest/v1/jobs?${todayQ}`, h),
      sum(todayStart),
      sum(weekStart),
      sum(monthStart),
      jget(`${url}/rest/v1/worker_training_assignments?${trainingQ}`, h),
      jget(`${url}/rest/v1/worker_ratings_reviews?${ratingsQ}`, h),
      jget(`${url}/rest/v1/messages?${msgsQ}`, h),
      jget(`${url}/rest/v1/notifications?${notiQ}`, h),
    ]);

    return Response.json({
      ok: true,
      upcoming: upcoming.items,
      today: (todayJobs.items as any[]).filter(j => new Date(j.scheduled_at).toISOString() < tomorrowStart),
      earnings: { day: earningsDay, week: earningsWeek, month: earningsMonth },
      training: training.items,
      ratings: ratings.items,
      messages: messages.items,
      notifications: notifications.items,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
