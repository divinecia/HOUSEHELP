// Paypack API for Rwanda Payment Processing
// Documentation: https://developer.paypack.rw

const PAYPACK_APP_ID = process.env.PAYPACK_APP_ID;
const PAYPACK_APP_SECRET = process.env.PAYPACK_APP_SECRET;
const PAYPACK_API_URL = 'https://payments.paypack.rw/api';

export interface PaypackPaymentRequest {
  amount: number;
  number: string; // Phone number for mobile money
  environment?: 'production' | 'development';
}

export interface PaypackPaymentResponse {
  success: boolean;
  ref?: string;
  tx?: string;
  message?: string;
  error?: string;
}

export interface PaypackTransactionStatus {
  ref: string;
  status: 'pending' | 'successful' | 'failed';
  amount?: number;
  fee?: number;
  timestamp?: string;
}

/**
 * Initialize a payment with Paypack
 */
export async function initiatePayment(
  request: PaypackPaymentRequest
): Promise<PaypackPaymentResponse> {
  try {
    if (!PAYPACK_APP_ID || !PAYPACK_APP_SECRET) {
      throw new Error('Paypack credentials not configured');
    }

    const response = await fetch(`${PAYPACK_API_URL}/transactions/cashin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Mode': request.environment || 'production',
      },
      body: JSON.stringify({
        amount: request.amount,
        number: request.number,
        app_id: PAYPACK_APP_ID,
        app_secret: PAYPACK_APP_SECRET,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Payment failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      ref: data.ref,
      tx: data.tx,
      message: data.message || 'Payment initiated successfully',
    };
  } catch (error: any) {
    console.error('Paypack payment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payment',
    };
  }
}

/**
 * Check the status of a transaction
 */
export async function checkTransactionStatus(
  ref: string
): Promise<PaypackTransactionStatus> {
  try {
    if (!PAYPACK_APP_ID || !PAYPACK_APP_SECRET) {
      throw new Error('Paypack credentials not configured');
    }

    const response = await fetch(
      `${PAYPACK_API_URL}/transactions/find/${ref}?app_id=${PAYPACK_APP_ID}&app_secret=${PAYPACK_APP_SECRET}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check transaction status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      ref: data.ref,
      status: data.status,
      amount: data.amount,
      fee: data.fee,
      timestamp: data.timestamp,
    };
  } catch (error: any) {
    console.error('Paypack status check error:', error);
    throw error;
  }
}

/**
 * Process a payout to a worker
 */
export async function processPayout(
  amount: number,
  phoneNumber: string
): Promise<PaypackPaymentResponse> {
  try {
    if (!PAYPACK_APP_ID || !PAYPACK_APP_SECRET) {
      throw new Error('Paypack credentials not configured');
    }

    const response = await fetch(`${PAYPACK_API_URL}/transactions/cashout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        number: phoneNumber,
        app_id: PAYPACK_APP_ID,
        app_secret: PAYPACK_APP_SECRET,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Payout failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      ref: data.ref,
      tx: data.tx,
      message: data.message || 'Payout processed successfully',
    };
  } catch (error: any) {
    console.error('Paypack payout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payout',
    };
  }
}

/**
 * Validate a Rwanda phone number for Paypack
 */
export function validatePaypackPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Rwanda mobile numbers: 07XXXXXXXX or 25007XXXXXXXX
  if (cleaned.startsWith('25007') && cleaned.length === 12) return true;
  if (cleaned.startsWith('07') && cleaned.length === 10) return true;
  
  return false;
}

/**
 * Format phone number for Paypack (07XXXXXXXX format)
 */
export function formatPaypackPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('25007')) {
    return '0' + cleaned.substring(3);
  }
  if (cleaned.startsWith('07')) {
    return cleaned;
  }
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '0' + cleaned;
  }
  
  return phone;
}

/**
 * Calculate platform fee (10% of transaction amount)
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.10);
}

/**
 * Calculate tax (18% VAT on platform fee)
 */
export function calculateTax(platformFee: number): number {
  return Math.round(platformFee * 0.18);
}

/**
 * Calculate worker payout (amount - platform fee - tax)
 */
export function calculateWorkerPayout(amount: number): {
  amount: number;
  platformFee: number;
  tax: number;
  payout: number;
} {
  const platformFee = calculatePlatformFee(amount);
  const tax = calculateTax(platformFee);
  const payout = amount - platformFee - tax;
  
  return {
    amount,
    platformFee,
    tax,
    payout,
  };
}

/**
 * Mock payment for development/testing
 */
export async function mockPayment(
  amount: number,
  phoneNumber: string
): Promise<PaypackPaymentResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate 90% success rate
  const success = Math.random() > 0.1;
  
  if (success) {
    return {
      success: true,
      ref: `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tx: `TX-${Date.now()}`,
      message: 'Mock payment successful',
    };
  } else {
    return {
      success: false,
      error: 'Mock payment failed - insufficient funds',
    };
  }
}
