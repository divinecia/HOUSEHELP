/**
 * API Authentication Middleware and Utilities
 * Provides authentication and authorization helpers for API routes
 */

import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import { JWTPayload } from './types';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  userType?: string;
  error?: string;
}

/**
 * Extract and verify JWT token from request headers or cookies
 */
export function authenticateRequest(req: NextRequest): AuthResult {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  let token = extractTokenFromHeader(authHeader);

  // If no Authorization header, try cookie
  if (!token) {
    token = req.cookies.get('hh-token')?.value || null;
  }

  if (!token) {
    return {
      authenticated: false,
      error: 'No authentication token provided',
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
    };
  }

  return {
    authenticated: true,
    userId: payload.userId,
    email: payload.email,
    userType: payload.userType,
  };
}

/**
 * Verify user owns the resource they're trying to access
 */
export function authorizeResourceAccess(
  auth: AuthResult,
  resourceUserId: string | null
): boolean {
  if (!auth.authenticated || !auth.userId) {
    return false;
  }

  // Admin can access any resource
  if (auth.userType === 'admin') {
    return true;
  }

  // User can only access their own resources
  return auth.userId === resourceUserId;
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = 'Access denied') {
  return Response.json(
    { success: false, error: message },
    { status: 403 }
  );
}

/**
 * Create bad request response
 */
export function badRequestResponse(message: string) {
  return Response.json(
    { success: false, error: message },
    { status: 400 }
  );
}

/**
 * Create server error response (without leaking details)
 */
export function serverErrorResponse(error?: unknown) {
  // Log the actual error server-side
  if (error) {
    console.error('Server error:', error);
  }

  // Return generic message to client
  return Response.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return Response.json(
    { success: true, data },
    { status }
  );
}

/**
 * Rate limiting state (in-memory, basic implementation)
 * For production, use Redis or a proper rate limiting service
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter
 * @param identifier - Unique identifier (IP, userId, etc)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    // Create new window
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Create rate limit exceeded response
 */
export function rateLimitResponse() {
  return Response.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}