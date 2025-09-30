import { NextRequest, NextResponse } from 'next/server';
import { registerUser, emailExists, phoneExists } from '@/lib/auth-utils';
import { generateOTP, isValidEmail, isValidRwandaPhone, formatRwandaPhone } from '@/lib/auth';
import { sendOTPEmail, sendWelcomeEmail } from '@/lib/resend';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas
const workerRegistrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(9, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  national_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  address: z.string().optional(),
  gps_location: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
});

const householdRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  alternative_contact: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  address: z.string().optional(),
  landmark: z.string().optional(),
  gps_location: z.string().optional(),
  property_type: z.enum(['House', 'Apartment', 'Villa', 'Other']).optional(),
  number_of_rooms: z.number().optional(),
  has_garden: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  special_features: z.string().optional(),
  family_size: z.number().optional(),
  has_children: z.boolean().optional(),
  has_pets: z.boolean().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user (worker or household)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_type, send_otp = true, ...userData } = body;

    // Validate user type
    if (!user_type || !['worker', 'household'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be "worker" or "household"' },
        { status: 400 }
      );
    }

    // Validate based on user type
    let validatedData;
    try {
      if (user_type === 'worker') {
        validatedData = workerRegistrationSchema.parse(userData);
      } else {
        validatedData = householdRegistrationSchema.parse(userData);
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (validatedData.email && !isValidEmail(validatedData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate and format phone number
    if (!isValidRwandaPhone(validatedData.phone)) {
      return NextResponse.json(
        { error: 'Invalid Rwanda phone number format. Use: +250XXXXXXXXX or 07XXXXXXXX' },
        { status: 400 }
      );
    }
    const formattedPhone = formatRwandaPhone(validatedData.phone);

    // Check if email already exists
    if (validatedData.email) {
      const emailAlreadyExists = await emailExists(validatedData.email, user_type);
      if (emailAlreadyExists) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Check if phone already exists
    const phoneAlreadyExists = await phoneExists(formattedPhone, user_type);
    if (phoneAlreadyExists) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists' },
        { status: 409 }
      );
    }

    // Register the user
    const registrationData = {
      ...validatedData,
      phone: formattedPhone,
      user_type,
      full_name: user_type === 'worker' ? validatedData.full_name : validatedData.name,
      name: user_type === 'household' ? validatedData.name : validatedData.full_name,
    };

    const result = await registerUser(registrationData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Registration failed' },
        { status: 500 }
      );
    }

    // Generate and store OTP if email is provided and send_otp is true
    let otpSent = false;
    if (send_otp && validatedData.email) {
      try {
        const otp = generateOTP(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database
        const supabase = createServerClient();
        await supabase.from('otp_codes').insert({
          user_type,
          identifier: validatedData.email,
          code: otp,
          purpose: 'registration',
          expires_at: expiresAt.toISOString(),
        });

        // Send OTP email
        const emailResult = await sendOTPEmail(
          validatedData.email,
          otp,
          user_type === 'worker' ? validatedData.full_name : validatedData.name
        );

        otpSent = emailResult.success;
      } catch (error) {
        console.error('Failed to send OTP:', error);
        // Don't fail registration if OTP sending fails
      }
    }

    // Send welcome email (optional, don't block on failure)
    if (validatedData.email) {
      try {
        await sendWelcomeEmail(
          validatedData.email,
          user_type === 'worker' ? validatedData.full_name : validatedData.name,
          user_type
        );
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        phone: result.user?.phone,
        name: result.user?.name,
        user_type: result.user?.user_type,
      },
      token: result.token,
      otp_sent: otpSent,
      requires_verification: validatedData.email ? true : false,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
