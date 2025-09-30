import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-utils';
import { isValidEmail } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  user_type: z.enum(['worker', 'household', 'admin'], {
    errorMap: () => ({ message: 'Invalid user type' }),
  }),
  remember_me: z.boolean().optional(),
});

/**
 * POST /api/auth/login
 * Login a user (worker, household, or admin)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = loginSchema.parse(body);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { email, password, user_type, remember_me } = validatedData;

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Attempt login
    const result = await loginUser({
      email,
      password,
      user_type,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 401 }
      );
    }

    // Create session in database
    try {
      const supabase = createServerClient();
      const expiresAt = remember_me
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await supabase.from('sessions').insert({
        user_id: result.user?.id,
        user_type,
        token: result.token,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        expires_at: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      // Don't fail login if session creation fails
    }

    // Log successful login
    try {
      const supabase = createServerClient();
      await supabase.from('audit_logs').insert({
        user_id: result.user?.id,
        user_type,
        action: 'login',
        entity_type: 'auth',
        details: { email, remember_me },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        phone: result.user?.phone,
        name: result.user?.name,
        user_type: result.user?.user_type,
      },
      token: result.token,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
