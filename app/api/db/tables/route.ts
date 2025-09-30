import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceKey) {
    return Response.json(
      { error: "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE)." },
      { status: 500 }
    );
  }

  try {
    // Query information_schema to get all tables
    const query = `
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const res = await fetch(`${url}/rest/v1/rpc/list_tables`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (!res.ok) {
      // Fallback: try to get some basic table info from existing tables
      const fallbackTables = [
        'households', 'workers', 'admins', 'service_categories', 'services',
        'bookings', 'jobs', 'payments', 'payouts', 'household_subscriptions',
        'training_modules', 'worker_training_assignments', 'worker_ratings_reviews',
        'messages', 'notifications', 'reports', 'otp_codes', 'verification_tokens',
        'sessions', 'audit_logs', 'worker_availability', 'worker_services', 'favorites'
      ];

      // Try to check if each table exists by querying it
      const tableChecks = await Promise.allSettled(
        fallbackTables.map(async (tableName) => {
          try {
            const checkRes = await fetch(`${url}/rest/v1/${tableName}?limit=0`, {
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
              cache: "no-store",
            });
            return {
              table_name: tableName,
              exists: checkRes.ok,
              status: checkRes.status
            };
          } catch {
            return {
              table_name: tableName,
              exists: false,
              status: 'error'
            };
          }
        })
      );

      const tableStatus = tableChecks.map(result => 
        result.status === 'fulfilled' ? result.value : { table_name: 'unknown', exists: false, status: 'error' }
      );

      return Response.json({ 
        tables: tableStatus,
        note: "Using fallback table detection method",
        rpc_error: res.status
      });
    }

    const data = await res.json();
    return Response.json({ tables: data });
  } catch (err: any) {
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
