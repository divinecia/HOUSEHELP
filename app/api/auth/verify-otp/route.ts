import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema
const verifyOTPSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['registration', 'password_reset', 'phone_verification', 'email_verification']),
});

/**
 * POST /api/auth/verify-otp
 * Verify an OTP code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = verifyOTPSchema.parse(body);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { identifier, code, purpose } = validatedData;
    const supabase = createServerClient();

    // Find the OTP code
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('identifier', identifier)
      .eq('code', code)
      .eq('purpose', purpose)
      .eq('used', false)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'OTP code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Failed to mark OTP as used:', updateError);
    }

    // If this is for registration or email verification, update user verification status
    if (purpose === 'registration' || purpose === 'email_verification') {
      try {
        const table = otpRecord.user_type === 'worker' ? 'workers' : 'households';
        
        await supabase
          .from(table)
          .update({ 
            verification_status: 'verified',
            status: 'active' 
          })
          .eq('email', identifier);
      } catch (error) {
        console.error('Failed to update verification status:', error);
      }
    }

    // Log successful verification
    try {
      await supabase.from('audit_logs').insert({
        user_type: otpRecord.user_type,
        action: 'otp_verified',
        entity_type: 'auth',
        details: { identifier, purpose },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify-otp/resend
 * Resend OTP code
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, purpose, user_type } = body;

    if (!identifier || !purpose || !user_type) {
      return NextResponse.json(
        { error: 'identifier, purpose, and user_type are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate new OTP
    const { generateOTP } = await import('@/lib/auth');
    const { sendOTPEmail } = await import('@/lib/resend');
    
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('identifier', identifier)
      .eq('purpose', purpose)
      .eq('used', false);

    // Store new OTP
    const { error: insertError } = await supabase.from('otp_codes').insert({
      user_type,
      identifier,
      code: otp,
      purpose,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      throw new Error('Failed to store OTP');
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(identifier, otp);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
      expires_in: 600, // seconds
    }, { status: 200 });

  } catch (error: any) {
    console.error('OTP resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
