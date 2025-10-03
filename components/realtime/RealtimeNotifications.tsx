"use client";

import { useEffect, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { FiBell } from "react-icons/fi";

interface Notification {
  id: string;
  user_id: string;
  type: "booking" | "payment" | "message" | "system";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

interface RealtimeNotificationsProps {
  userId: string;
}

/**
 * Real-time notification badge that shows unread count
 *
 * @example
 * <RealtimeNotifications userId="user-123" />
 */
export default function RealtimeNotifications({
  userId,
}: RealtimeNotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  // Subscribe to new notifications
  const { data: newNotifications, isConnected } = useRealtimeSubscription<Notification>({
    table: "notifications",
    event: "INSERT",
    filter: `user_id=eq.${userId}`,
  });

  // Subscribe to notification updates (mark as read)
  const { data: updatedNotifications } = useRealtimeSubscription<Notification>({
    table: "notifications",
    event: "UPDATE",
    filter: `user_id=eq.${userId}`,
  });

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/notifications/unread?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnreadCount();
  }, [userId]);

  // Handle new notifications
  useEffect(() => {
    if (newNotifications.length > 0) {
      const latest = newNotifications[newNotifications.length - 1];
      setLatestNotification(latest);
      setUnreadCount((prev) => prev + newNotifications.length);
      setShowPopup(true);

      // Auto-hide popup after 5 seconds
      setTimeout(() => setShowPopup(false), 5000);

      // Show browser notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(latest.title, {
          body: latest.message,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
        });
      }
    }
  }, [newNotifications]);

  // Handle notification updates (read status)
  useEffect(() => {
    if (updatedNotifications.length > 0) {
      const readCount = updatedNotifications.filter((n) => n.is_read).length;
      if (readCount > 0) {
        setUnreadCount((prev) => Math.max(0, prev - readCount));
      }
    }
  }, [updatedNotifications]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <button
        className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        onClick={() => (window.location.href = "/notifications")}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <FiBell className="text-neutral-700 text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
        )}
      </button>

      {/* Notification Popup */}
      {showPopup && latestNotification && (
        <div
          className="fixed top-20 right-4 bg-white border border-neutral-200 rounded-lg shadow-xl p-4 max-w-sm z-50 animate-slide-in"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
              <FiBell className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-800 mb-1">
                {latestNotification.title}
              </h4>
              <p className="text-sm text-neutral-600 mb-2">
                {latestNotification.message}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Dismiss
                </button>
                {latestNotification.link && (
                  <a
                    href={latestNotification.link}
                    className="text-xs text-primary-blue hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Request notification permission button (only shown if not granted) */}
      {"Notification" in window && Notification.permission === "default" && (
        <button
          onClick={requestNotificationPermission}
          className="text-xs text-primary-blue hover:underline"
          aria-label="Enable browser notifications"
        >
          Enable notifications
        </button>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
