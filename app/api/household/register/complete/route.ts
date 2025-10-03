import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for complete household registration
const completeHouseholdRegistrationSchema = z.object({
  household_id: z.string().uuid(),
  step2: z.object({
    numberOfAdults: z.number().min(1),
    numberOfChildren: z.number().min(0),
    childrenAges: z.string().optional(),
    elderlyMembers: z.enum(["Yes", "No"]),
    specialNeedsMembers: z.enum(["Yes", "No"]),
    languagesSpoken: z.string().min(1),
    religiousConsiderations: z.string().optional(),
    dietaryRestrictions: z.string().optional(),
    petInformation: z.string().optional(),
    smokingPolicy: z.string().optional(),
    primaryServices: z.string().min(1),
    serviceFrequency: z.enum(["One-time", "Weekly", "Monthly"]),
    preferredSchedule: z.string().min(1),
    budgetRange: z.string().min(1),
  }),
  step3: z.object({
    agreeToTerms: z.boolean(),
    agreeToPrivacy: z.boolean(),
    backgroundCheckConsent: z.boolean(),
    communicationPreferences: z.boolean(),
    paymentMethod: z.enum(["Credit/Debit Card", "Mobile Money", "Bank Account"]),
    paymentVerification: z.string().min(1),
    hasNationalId: z.boolean(),
    hasProofOfResidence: z.boolean(),
    hasSelfie: z.boolean(),
  }),
});

/**
 * POST /api/household/register/complete
 * Complete household registration with additional data from steps 2 and 3
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body
    const validatedData = completeHouseholdRegistrationSchema.parse(body);

    const supabase = createServerClient();

    // Update the household record with the additional information
    const { data: household, error: updateError } = await supabase
      .from('households')
      .update({
        // Family information
        family_size: validatedData.step2.numberOfAdults + validatedData.step2.numberOfChildren,
        number_of_adults: validatedData.step2.numberOfAdults,
        number_of_children: validatedData.step2.numberOfChildren,
        children_ages: validatedData.step2.childrenAges,
        has_elderly: validatedData.step2.elderlyMembers === 'Yes',
        has_special_needs: validatedData.step2.specialNeedsMembers === 'Yes',
        languages_spoken: validatedData.step2.languagesSpoken,
        religious_considerations: validatedData.step2.religiousConsiderations,
        dietary_restrictions: validatedData.step2.dietaryRestrictions,
        pet_information: validatedData.step2.petInformation,
        smoking_policy: validatedData.step2.smokingPolicy,

        // Service preferences
        primary_services: validatedData.step2.primaryServices,
        service_frequency: validatedData.step2.serviceFrequency,
        preferred_schedule: validatedData.step2.preferredSchedule,
        budget_range: validatedData.step2.budgetRange,

        // Verification and agreements
        agree_to_terms: validatedData.step3.agreeToTerms,
        agree_to_privacy: validatedData.step3.agreeToPrivacy,
        background_check_consent: validatedData.step3.backgroundCheckConsent,
        communication_preferences: validatedData.step3.communicationPreferences,
        payment_method: validatedData.step3.paymentMethod,
        payment_verification: validatedData.step3.paymentVerification,
        has_national_id: validatedData.step3.hasNationalId,
        has_proof_of_residence: validatedData.step3.hasProofOfResidence,
        has_selfie: validatedData.step3.hasSelfie,

        // Update verification status
        verification_status: 'pending_documents',
        registration_completed_at: new Date().toISOString(),
      })
      .eq('id', validatedData.household_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating household:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete registration' },
        { status: 500 }
      );
    }

    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      household: {
        id: household.id,
        name: household.name,
        email: household.email,
        verification_status: household.verification_status,
      },
    });

  } catch (error: unknown) {
    console.error('Complete registration error:', error);

    if (error instanceof Error && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}