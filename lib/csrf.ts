/**
 * CSRF Protection Utility
 * Simple CSRF token generation and validation
 */

import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';

// In-memory token storage (for development)
// In production, use Redis or database
const tokenStore = new Map<string, { token: string; createdAt: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, value] of tokenStore.entries()) {
    if (now - value.createdAt > maxAge) {
      tokenStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

/**
 * Generate a CSRF token for a session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex');

  tokenStore.set(sessionId, {
    token,
    createdAt: Date.now(),
  });

  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = tokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check if token has expired (24 hours)
  const maxAge = 24 * 60 * 60 * 1000;
  if (Date.now() - stored.createdAt > maxAge) {
    tokenStore.delete(sessionId);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(stored.token, token);
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(req: NextRequest): string | null {
  // Check header first
  const headerToken = req.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }

  // Check cookie as fallback
  const cookieToken = req.cookies.get('csrf-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Validate CSRF for a request
 */
export function validateCSRFRequest(req: NextRequest, sessionId: string): boolean {
  // Skip CSRF check for safe methods
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const token = extractCSRFToken(req);
  if (!token) {
    return false;
  }

  return validateCSRFToken(sessionId, token);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create CSRF error response
 */
export function csrfErrorResponse() {
  return Response.json(
    { success: false, error: 'Invalid or missing CSRF token' },
    { status: 403 }
  );
}

/**
 * Example usage in API route:
 *
 * import { validateCSRFRequest, csrfErrorResponse } from '@/lib/csrf';
 *
 * export async function POST(req: NextRequest) {
 *   const sessionId = req.cookies.get('hh-session-id')?.value;
 *
 *   if (!sessionId || !validateCSRFRequest(req, sessionId)) {
 *     return csrfErrorResponse();
 *   }
 *
 *   // Process request...
 * }
 */