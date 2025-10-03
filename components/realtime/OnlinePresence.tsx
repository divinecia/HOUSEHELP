"use client";

import { usePresence } from "@/hooks/useRealtimeSubscription";
import { FiCircle } from "react-icons/fi";

interface OnlinePresenceProps {
  channelName: string;
  userId: string;
  userName: string;
  showList?: boolean;
}

interface PresenceState {
  user_id: string;
  user_name: string;
  online_at: string;
}

/**
 * Component that tracks and displays online users using Supabase Presence
 *
 * @example
 * <OnlinePresence
 *   channelName="chat-room-123"
 *   userId="user-456"
 *   userName="John Doe"
 *   showList={true}
 * />
 */
export default function OnlinePresence({
  channelName,
  userId,
  userName,
  showList = false,
}: OnlinePresenceProps) {
  const { presences, myPresence, isConnected } = usePresence<PresenceState>(
    channelName,
    {
      user_id: userId,
      user_name: userName,
      online_at: new Date().toISOString(),
    }
  );

  const onlineUsers = Object.values(presences);
  const otherUsers = onlineUsers.filter((p) => p.user_id !== userId);

  if (!showList) {
    // Simple count display
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <FiCircle
          className={`text-xs ${
            isConnected ? "text-green-500 fill-current" : "text-gray-400"
          }`}
        />
        <span>
          {onlineUsers.length} user{onlineUsers.length !== 1 ? "s" : ""} online
        </span>
      </div>
    );
  }

  // Full list display
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-800">
          Online Users ({onlineUsers.length})
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-xs text-neutral-500">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Current user */}
        {myPresence && (
          <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
            <div className="relative">
              <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white font-semibold">
                {myPresence.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-800">
                {myPresence.user_name} (You)
              </p>
              <p className="text-xs text-neutral-500">Online now</p>
            </div>
          </div>
        )}

        {/* Other users */}
        {otherUsers.length > 0 ? (
          otherUsers.map((presence, index) => (
            <div
              key={`${presence.user_id}-${index}`}
              className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center text-neutral-700 font-semibold">
                  {presence.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-800">{presence.user_name}</p>
                <p className="text-xs text-neutral-500">
                  Online since {new Date(presence.online_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-500 text-center py-4">
            No other users online
          </p>
        )}
      </div>
    </div>
  );
}
