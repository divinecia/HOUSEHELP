import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth-utils';
import { extractUserFromHeaders } from '@/lib/auth-utils';

/**
 * GET /api/auth/verify
 * Verify JWT token and return user info
 */
export async function GET(req: NextRequest) {
  try {
    const { token } = extractUserFromHeaders(req.headers);

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided', authenticated: false },
        { status: 401 }
      );
    }

    // Verify token
    const result = await verifyUser(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid token', authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: result.user,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
}
