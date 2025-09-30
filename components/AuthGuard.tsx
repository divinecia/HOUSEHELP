"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredType?: 'worker' | 'household' | 'admin';
}

export default function AuthGuard({ children, requiredType }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('hh-token');
        const userStr = localStorage.getItem('hh-user');

        if (!token || !userStr) {
          // No token, redirect to login
          redirectToLogin();
          return;
        }

        // Parse user data
        const user = JSON.parse(userStr);

        // Check if user type matches required type
        if (requiredType && user.user_type !== requiredType) {
          // Wrong user type, redirect to appropriate login
          redirectToLogin();
          return;
        }

        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token invalid or expired
          localStorage.removeItem('hh-token');
          localStorage.removeItem('hh-user');
          localStorage.removeItem('hh-worker-id');
          localStorage.removeItem('hh-household-id');
          redirectToLogin();
          return;
        }

        // All good, user is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        redirectToLogin();
      } finally {
        setIsLoading(false);
      }
    }

    function redirectToLogin() {
      setIsLoading(false);
      
      // Determine which login page to redirect to
      if (pathname.startsWith('/worker')) {
        router.push(`/worker/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (pathname.startsWith('/household')) {
        router.push(`/household/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (pathname.startsWith('/admin')) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }

    checkAuth();
  }, [pathname, requiredType, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(76,102,164)]"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  // Show protected content
  return <>{children}</>;
}
