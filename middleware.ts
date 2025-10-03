import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

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

    // Check for JWT token
    const token = req.cookies.get('hh-token')?.value ||
                  req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/worker/login', url));
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload || payload.userType !== 'worker') {
      // Invalid or expired token
      const response = NextResponse.redirect(new URL('/worker/login', url));
      response.cookies.delete('hh-token');
      return response;
    }

    // Token is valid, proceed
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-type', payload.userType);
    return response;
  }

  // Household protected routes
  if (pathname.startsWith('/household') &&
      !pathname.startsWith('/household/login') &&
      !pathname.startsWith('/household/register')) {

    // Check for JWT token
    const token = req.cookies.get('hh-token')?.value ||
                  req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/household/login', url));
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload || payload.userType !== 'household') {
      // Invalid or expired token
      const response = NextResponse.redirect(new URL('/household/login', url));
      response.cookies.delete('hh-token');
      return response;
    }

    // Token is valid, proceed
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-type', payload.userType);
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
