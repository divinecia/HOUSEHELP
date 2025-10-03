"use client";

import { useEffect, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { FiCalendar, FiUser, FiClock, FiMapPin } from "react-icons/fi";

interface Booking {
  id: string;
  household_id: string;
  worker_id: string;
  service_type: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  created_at: string;
  updated_at: string;
}

interface RealtimeBookingsProps {
  userId: string;
  userRole: "worker" | "household";
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

/**
 * Real-time bookings component that displays and updates bookings in real-time
 *
 * @example
 * <RealtimeBookings userId="worker-123" userRole="worker" />
 */
export default function RealtimeBookings({
  userId,
  userRole,
}: RealtimeBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const filterField = userRole === "worker" ? "worker_id" : "household_id";

  // Subscribe to new bookings
  const { data: newBookings, isConnected } = useRealtimeSubscription<Booking>({
    table: "bookings",
    event: "INSERT",
    filter: `${filterField}=eq.${userId}`,
  });

  // Subscribe to booking updates
  const { data: updatedBookings } = useRealtimeSubscription<Booking>({
    table: "bookings",
    event: "UPDATE",
    filter: `${filterField}=eq.${userId}`,
  });

  // Subscribe to booking deletions
  const { data: deletedBookings } = useRealtimeSubscription<Booking>({
    table: "bookings",
    event: "DELETE",
    filter: `${filterField}=eq.${userId}`,
  });

  // Fetch initial bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `/api/${userRole}/bookings?${filterField}=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setBookings(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId, userRole, filterField]);

  // Handle new bookings
  useEffect(() => {
    if (newBookings.length > 0) {
      setBookings((prev) => {
        const existingIds = new Set(prev.map((b) => b.id));
        const uniqueNew = newBookings.filter((b) => !existingIds.has(b.id));
        return [...uniqueNew, ...prev];
      });

      // Show notification for new booking
      if (newBookings.length === 1) {
        const booking = newBookings[0];
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Booking", {
            body: `New ${booking.service_type} booking for ${booking.scheduled_date}`,
            icon: "/icons/icon-192x192.png",
          });
        }
      }
    }
  }, [newBookings]);

  // Handle booking updates
  useEffect(() => {
    if (updatedBookings.length > 0) {
      setBookings((prev) =>
        prev.map((booking) => {
          const updated = updatedBookings.find((u) => u.id === booking.id);
          return updated || booking;
        })
      );
    }
  }, [updatedBookings]);

  // Handle booking deletions
  useEffect(() => {
    if (deletedBookings.length > 0) {
      const deletedIds = new Set(deletedBookings.map((b) => b.id));
      setBookings((prev) => prev.filter((b) => !deletedIds.has(b.id)));
    }
  }, [deletedBookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="hh-spinner"></div>
        <span className="ml-3 text-neutral-600">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-800">
          Your Bookings ({bookings.length})
        </h2>
        <div
          className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
            isConnected
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
          {isConnected ? "Live updates" : "Disconnected"}
        </div>
      </div>

      {/* Bookings list */}
      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <FiCalendar className="text-4xl text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600">No bookings yet</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">
                    {booking.service_type}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                      statusColors[booking.status]
                    }`}
                  >
                    {booking.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() =>
                    (window.location.href = `/${userRole}/bookings/${booking.id}`)
                  }
                  className="text-primary-blue hover:underline text-sm"
                >
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <FiCalendar className="flex-shrink-0" />
                  <span>{booking.scheduled_date}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <FiClock className="flex-shrink-0" />
                  <span>{booking.scheduled_time}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600 col-span-2">
                  <FiMapPin className="flex-shrink-0" />
                  <span className="truncate">{booking.location}</span>
                </div>
              </div>

              {/* New badge for recently added bookings */}
              {newBookings.some((nb) => nb.id === booking.id) && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <span className="inline-block bg-primary-blue text-white text-xs px-2 py-1 rounded animate-pulse">
                    NEW
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
