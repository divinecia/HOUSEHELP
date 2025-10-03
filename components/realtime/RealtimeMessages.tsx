"use client";

import { useEffect, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { FiCheck, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface RealtimeMessagesProps {
  userId: string;
  conversationId?: string;
}

/**
 * Real-time messaging component that displays messages and updates in real-time
 *
 * @example
 * <RealtimeMessages userId="user-123" conversationId="conv-456" />
 */
export default function RealtimeMessages({
  userId,
  conversationId,
}: RealtimeMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to new messages for this user
  const { data: newMessages, isConnected, error } = useRealtimeSubscription<Message>({
    table: "messages",
    event: "INSERT",
    filter: `receiver_id=eq.${userId}`,
  });

  // Subscribe to message updates (read status, etc.)
  const { data: updatedMessages } = useRealtimeSubscription<Message>({
    table: "messages",
    event: "UPDATE",
    filter: `receiver_id=eq.${userId}`,
  });

  // Initial fetch of messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId]);

  // Update messages when new ones arrive via Realtime
  useEffect(() => {
    if (newMessages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...uniqueNew];
      });
    }
  }, [newMessages]);

  // Update messages when they change via Realtime
  useEffect(() => {
    if (updatedMessages.length > 0) {
      setMessages((prev) =>
        prev.map((msg) => {
          const updated = updatedMessages.find((u) => u.id === msg.id);
          return updated || msg;
        })
      );
    }
  }, [updatedMessages]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, { method: "PUT" });
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="hh-spinner"></div>
        <span className="ml-3 text-neutral-600">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <>
            <FiCheckCircle className="text-green-600" />
            <span className="text-green-600">Real-time connected</span>
          </>
        ) : error ? (
          <>
            <FiAlertCircle className="text-red-600" />
            <span className="text-red-600">Connection error</span>
          </>
        ) : (
          <>
            <div className="hh-spinner-sm"></div>
            <span className="text-neutral-500">Connecting...</span>
          </>
        )}
      </div>

      {/* Messages list */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No messages yet
          </div>
        ) : (
          messages
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  message.is_read
                    ? "bg-white border-neutral-200"
                    : "bg-blue-50 border-primary-blue"
                }`}
                onClick={() => !message.is_read && markAsRead(message.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-neutral-800 mb-2">{message.content}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                  {message.is_read && (
                    <FiCheck className="text-primary-blue ml-2" />
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* New message indicator */}
      {newMessages.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-primary-blue text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
          {newMessages.length} new message{newMessages.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
