import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateOTP, isValidEmail, updatePassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/resend';
import { z } from 'zod';

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
  user_type: z.enum(['worker', 'household', 'admin']),
  method: z.enum(['email', 'sms']).optional(),
});

const verifyResetCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Reset code must be 6 digits'),
  user_type: z.enum(['worker', 'household', 'admin']),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Reset code must be 6 digits'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  user_type: z.enum(['worker', 'household', 'admin']),
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = requestResetSchema.parse(body);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { email, user_type, method = 'email' } = validatedData;

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists
    const table = user_type === 'worker' ? 'workers' : 
                  user_type === 'household' ? 'households' : 'admins';
    
    const { data: user, error: userError } = await supabase
      .from(table)
      .select('id, email, phone')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.',
      }, { status: 200 });
    }

    // Generate reset code
    const resetCode = generateOTP(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code
    const { error: insertError } = await supabase.from('otp_codes').insert({
      user_type,
      identifier: email,
      code: resetCode,
      purpose: 'password_reset',
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      throw new Error('Failed to store reset code');
    }

    // Send reset email
    if (method === 'email') {
      const emailResult = await sendPasswordResetEmail(email, resetCode);

      if (!emailResult.success) {
        console.error('Failed to send password reset email');
      }
    }

    // Log password reset request
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_type,
        action: 'password_reset_requested',
        entity_type: 'auth',
        details: { email, method },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent successfully',
      expires_in: 900, // seconds
    }, { status: 200 });

  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/forgot-password
 * Verify reset code
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = verifyResetCodeSchema.parse(body);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { email, code, user_type } = validatedData;
    const supabase = createServerClient();

    // Find the reset code
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('identifier', email)
      .eq('code', code)
      .eq('purpose', 'password_reset')
      .eq('used', false)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reset code verified successfully',
      verified: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Reset code verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/forgot-password
 * Reset password with verified code
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = resetPasswordSchema.parse(body);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { email, code, new_password, user_type } = validatedData;
    const supabase = createServerClient();

    // Find and verify the reset code
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('identifier', email)
      .eq('code', code)
      .eq('purpose', 'password_reset')
      .eq('used', false)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Get user ID
    const table = user_type === 'worker' ? 'workers' : 
                  user_type === 'household' ? 'households' : 'admins';
    
    const { data: user, error: userError } = await supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password
    const result = await updatePassword(user.id, user_type, new_password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update password' },
        { status: 500 }
      );
    }

    // Mark reset code as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Log password reset
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_type,
        action: 'password_reset_completed',
        entity_type: 'auth',
        details: { email },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
