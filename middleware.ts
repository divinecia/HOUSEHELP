import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname } = url;

  // --- Admin Route Protection ---
  if (pathname.startsWith("/admin")) {
    const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!nextAuthToken) {
      // Allow access to the login page /admin, but protect all sub-paths
      if (pathname !== '/admin') {
        return NextResponse.redirect(new URL("/admin", url));
      }
      return NextResponse.next();
    }

    const email = nextAuthToken.email as string | undefined;
    const adminEmail = process.env.ADMIN_EMAIL;
    const allowed = !!email && (email === adminEmail || email.endsWith("@househelp.rw"));

    if (!allowed) {
      // If not allowed, redirect to login page
      return NextResponse.redirect(new URL("/admin", url));
    }

    // If user is authenticated and tries to access /admin, redirect them to dashboard
    if (pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', url));
    }

    return NextResponse.next();
  }

  // --- Worker and Household Route Protection ---
  const isWorkerRoute = pathname.startsWith('/worker');
  const isHouseholdRoute = pathname.startsWith('/household');
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/register');

  if ((isWorkerRoute || isHouseholdRoute) && !isAuthRoute) {
    const token = req.cookies.get('hh-token')?.value;
    const userType = isWorkerRoute ? 'worker' : 'household';
    const loginUrl = `/${userType}/login`;

    if (!token) {
      return NextResponse.redirect(new URL(loginUrl, url));
    }

    try {
      const decoded = await verifyToken(token);
      if (!decoded || decoded.userType !== userType) {
        // Invalid token or wrong user type
        return NextResponse.redirect(new URL(loginUrl, url));
      }

      // Token is valid, proceed
      return NextResponse.next();

    } catch (error) {
      // Token verification failed
      console.error("Middleware token verification error:", error);
      return NextResponse.redirect(new URL(loginUrl, url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
