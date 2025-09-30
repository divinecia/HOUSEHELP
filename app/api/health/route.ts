import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const sessionToken = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseService: !!process.env.SUPABASE_SERVICE_ROLE,
    githubClient: !!process.env.GITHUB_CLIENT_ID,
    githubSecret: !!process.env.GITHUB_CLIENT_SECRET,
  };
  return Response.json({ ok: true, env, session: { authenticated: !!sessionToken } }, { status: 200 });
}
