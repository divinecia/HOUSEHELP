import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { extractUserFromHeaders } from '@/lib/auth-utils';

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, userType, token } = extractUserFromHeaders(req.headers);

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Invalidate session
    try {
      await supabase
        .from('sessions')
        .delete()
        .eq('token', token);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }

    // Log logout
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        user_type: userType,
        action: 'logout',
        entity_type: 'auth',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
