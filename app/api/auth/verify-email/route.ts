import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * POST /api/auth/verify-email
 * Verify email using a verification token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = verifyEmailSchema.parse(body);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const { token } = validatedData;
    const supabase = createServerClient();

    // Find the verification token
    const { data: tokenRecord, error: fetchError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('purpose', 'email_verification')
      .eq('used', false)
      .single();

    if (fetchError || !tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('id', tokenRecord.id);

    if (updateTokenError) {
      console.error('Failed to mark token as used:', updateTokenError);
    }

    // Update user verification status
    const table = tokenRecord.user_type === 'worker' ? 'workers' : 
                  tokenRecord.user_type === 'household' ? 'households' : 'admins';
    
    const { error: updateUserError } = await supabase
      .from(table)
      .update({ 
        verification_status: 'verified',
        status: 'active' 
      })
      .eq('id', tokenRecord.user_id);

    if (updateUserError) {
      console.error('Failed to update user verification status:', updateUserError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    // Log successful verification
    try {
      await supabase.from('audit_logs').insert({
        user_id: tokenRecord.user_id,
        user_type: tokenRecord.user_type,
        action: 'email_verified',
        entity_type: 'auth',
        details: { token_id: tokenRecord.id },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify-email/send
 * Send email verification link
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, user_id, user_type } = body;

    if (!email || !user_id || !user_type) {
      return NextResponse.json(
        { error: 'email, user_id, and user_type are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate verification token
    const { generateVerificationToken } = await import('@/lib/auth');
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Invalidate old tokens
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('user_id', user_id)
      .eq('purpose', 'email_verification')
      .eq('used', false);

    // Store new token
    const { error: insertError } = await supabase.from('verification_tokens').insert({
      user_id,
      user_type,
      token,
      purpose: 'email_verification',
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      throw new Error('Failed to store verification token');
    }

    // Send verification email
    const { sendEmail } = await import('@/lib/resend');
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify Your Email - HouseHelp',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4c66a4 0%, #6B9BD1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4c66a4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Thank you for registering with HouseHelp!</p>
              <p>Please click the button below to verify your email address:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4c66a4;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HouseHelp. Professional household services platform.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Verify your email by clicking this link: ${verificationUrl}`,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
