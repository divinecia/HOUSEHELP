"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoutButtonProps {
  userType: 'worker' | 'household' | 'admin';
  className?: string;
}

export default function LogoutButton({ userType, className = '' }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    
    setLoading(true);

    try {
      // Get token
      const token = localStorage.getItem('hh-token');

      if (token) {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      // Clear local storage
      localStorage.removeItem('hh-token');
      localStorage.removeItem('hh-user');
      localStorage.removeItem('hh-worker-id');
      localStorage.removeItem('hh-household-id');

      // Redirect to appropriate login page
      if (userType === 'worker') {
        router.push('/worker/login');
      } else if (userType === 'household') {
        router.push('/household/login');
      } else {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage and redirect
      localStorage.clear();
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className || "hh-btn hh-btn-secondary"}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
