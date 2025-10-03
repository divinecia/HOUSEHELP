// JWT Authentication with bcrypt
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthUser } from './types';

// Use Web Crypto API for Edge Runtime compatibility
const getCrypto = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto;
  }
  // Fallback for Node.js environment
  const { webcrypto } = require('crypto');
  return webcrypto;
};

const webCrypto = getCrypto();

// Validate JWT_SECRET exists - no fallback for security
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set. Generate one with: openssl rand -hex 32');
}
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    userType: user.user_type,
  };

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Type guard to ensure decoded is an object
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      return null;
    }

    // Validate required fields
    if ('userId' in decoded && 'email' in decoded && 'userType' in decoded) {
      return decoded as JWTPayload;
    }

    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Generate a cryptographically secure random OTP code
 */
export function generateOTP(length: number = 6): string {
  const array = new Uint8Array(length);
  webCrypto.getRandomValues(array);
  return Array.from(array, byte => (byte % 10).toString()).join('');
}

/**
 * Generate a cryptographically secure verification token
 */
export function generateVerificationToken(): string {
  const array = new Uint8Array(32);
  webCrypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Rwanda phone number format
 */
export function isValidRwandaPhone(phone: string): boolean {
  // Rwanda phone numbers: +250 followed by 9 digits
  // Formats: +250XXXXXXXXX, 250XXXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+250') && cleaned.length === 13) return true;
  if (cleaned.startsWith('250') && cleaned.length === 12) return true;
  if (cleaned.startsWith('07') && cleaned.length === 10) return true;
  if (cleaned.startsWith('7') && cleaned.length === 9) return true;
  
  return false;
}

/**
 * Format Rwanda phone number to standard format (+250XXXXXXXXX)
 */
export function formatRwandaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+250')) return cleaned;
  if (cleaned.startsWith('250')) return '+' + cleaned;
  if (cleaned.startsWith('07')) return '+250' + cleaned.substring(1);
  if (cleaned.startsWith('7')) return '+250' + cleaned;
  
  return phone; // Return original if format not recognized
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Determine strength
  if (errors.length === 0) {
    strength = 'strong';
  } else if (errors.length <= 2) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  webCrypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '').substring(0, length);
}

/**
 * Update user password (for password reset functionality)
 * This returns the hashed password for the API route to use with Supabase
 */
export async function updatePassword(
  userId: string,
  userType: 'worker' | 'household' | 'admin',
  newPassword: string
): Promise<{ success: boolean; error?: string; hashedPassword?: string }> {
  try {
    const hashedPassword = await hashPassword(newPassword);

    return {
      success: true,
      hashedPassword,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hash password',
    };
  }
}
