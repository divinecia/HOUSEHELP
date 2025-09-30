import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Check for JWT token in localStorage (client-side) or cookies
  const token = req.cookies.get('hh-token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  // Admin routes - use NextAuth
  if (pathname.startsWith('/admin')) {
    const nextAuthToken = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!nextAuthToken) {
      return NextResponse.redirect(new URL("/admin", url));
    }

    const email = (nextAuthToken as any)?.email as string | undefined;
    const adminEmail = process.env.ADMIN_EMAIL;
    const allowed = !!email && (email === adminEmail || email.endsWith("@househelp.rw"));

    if (!allowed) {
      return NextResponse.redirect(new URL("/admin", url));
    }

    return NextResponse.next();
  }

  // Worker protected routes
  if (pathname.startsWith('/worker') && 
      !pathname.startsWith('/worker/login') && 
      !pathname.startsWith('/worker/register')) {
    
    // Check if user has token (will be verified on client side)
    // For server-side, we'll add a header check
    const response = NextResponse.next();
    
    // Add a header to indicate this is a protected route
    response.headers.set('x-protected-route', 'worker');
    
    return response;
  }

  // Household protected routes
  if (pathname.startsWith('/household') && 
      !pathname.startsWith('/household/login') && 
      !pathname.startsWith('/household/register')) {
    
    const response = NextResponse.next();
    response.headers.set('x-protected-route', 'household');
    
    return response;
  }

  return NextResponse.next();
}

export const config = { 
  matcher: [
    '/admin/:path*',
    '/worker/:path*',
    '/household/:path*'
  ] 
};
