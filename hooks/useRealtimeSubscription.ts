"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface RealtimeOptions {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  table: string;
  filter?: string;
}

export interface RealtimeSubscription<T = any> {
  data: T[];
  isConnected: boolean;
  error: Error | null;
  channel: RealtimeChannel | null;
}

/**
 * Hook for subscribing to Supabase Realtime changes
 *
 * @example
 * // Subscribe to new messages
 * const { data: messages, isConnected } = useRealtimeSubscription({
 *   table: 'messages',
 *   event: 'INSERT',
 *   filter: `receiver_id=eq.${userId}`
 * })
 *
 * @example
 * // Subscribe to all changes on a table
 * const { data: bookings } = useRealtimeSubscription({
 *   table: 'bookings',
 *   event: '*'
 * })
 */
export function useRealtimeSubscription<T = any>(
  options: RealtimeOptions,
  enabled: boolean = true
): RealtimeSubscription<T> {
  const [data, setData] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const { event = "*", schema = "public", table, filter } = options;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserClient();
    const channelName = `realtime:${table}:${filter || "all"}`;

    try {
      // Create channel
      const newChannel = supabase.channel(channelName);

      // Subscribe to postgres changes
      newChannel
        .on(
          "postgres_changes" as any,
          {
            event,
            schema,
            table,
            filter,
          },
          (payload: RealtimePostgresChangesPayload<T>) => {
            console.log("Realtime change received:", payload);

            switch (payload.eventType) {
              case "INSERT":
                setData((prev) => [...prev, payload.new as T]);
                break;
              case "UPDATE":
                setData((prev) =>
                  prev.map((item: any) =>
                    item.id === (payload.new as any).id ? (payload.new as T) : item
                  )
                );
                break;
              case "DELETE":
                setData((prev) =>
                  prev.filter((item: any) => item.id !== (payload.old as any).id)
                );
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status: ${status}`);
          setIsConnected(status === "SUBSCRIBED");
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setError(new Error(`Subscription ${status}`));
          }
        });

      setChannel(newChannel);
    } catch (err) {
      console.error("Realtime subscription error:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }

    // Cleanup on unmount
    return () => {
      if (channel) {
        console.log("Unsubscribing from realtime channel");
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, event, schema, table, filter]);

  return { data, isConnected, error, channel };
}

/**
 * Hook for subscribing to presence tracking (who's online)
 *
 * @example
 * const { presences, myPresence, track, untrack } = usePresence('room-123', {
 *   user_id: userId,
 *   online_at: new Date().toISOString()
 * })
 */
export function usePresence<T extends Record<string, any>>(
  channelName: string,
  initialState: T,
  enabled: boolean = true
) {
  const [presences, setPresences] = useState<Record<string, T>>({});
  const [myPresence, setMyPresence] = useState<T | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const track = useCallback(
    async (state: Partial<T>) => {
      if (!channel) return;
      const newState = { ...myPresence, ...state } as T;
      await channel.track(newState);
      setMyPresence(newState);
    },
    [channel, myPresence]
  );

  const untrack = useCallback(async () => {
    if (!channel) return;
    await channel.untrack();
    setMyPresence(null);
  }, [channel]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserClient();
    const newChannel = supabase.channel(`presence:${channelName}`, {
      config: { presence: { key: "" } },
    });

    newChannel
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();
        const presenceMap: Record<string, T> = {};

        Object.entries(state).forEach(([key, value]) => {
          if (value && value[0]) {
            presenceMap[key] = value[0] as T;
          }
        });

        setPresences(presenceMap);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await newChannel.track(initialState);
          setMyPresence(initialState);
        }
      });

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        newChannel.untrack();
        supabase.removeChannel(newChannel);
      }
    };
  }, [enabled, channelName]);

  return { presences, myPresence, track, untrack, isConnected: !!channel };
}

/**
 * Hook for subscribing to broadcast messages
 *
 * @example
 * const { broadcast, messages } = useBroadcast('chat-room', (message) => {
 *   console.log('New message:', message)
 * })
 *
 * // Send a message
 * broadcast({ type: 'message', text: 'Hello!' })
 */
export function useBroadcast<T = any>(
  channelName: string,
  onMessage?: (message: T) => void,
  enabled: boolean = true
) {
  const [messages, setMessages] = useState<T[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const broadcast = useCallback(
    async (message: T) => {
      if (!channel) return;
      await channel.send({
        type: "broadcast",
        event: "message",
        payload: message,
      });
    },
    [channel]
  );

  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserClient();
    const newChannel = supabase.channel(`broadcast:${channelName}`);

    newChannel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as T]);
        if (onMessage) {
          onMessage(payload as T);
        }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [enabled, channelName, onMessage]);

  return { broadcast, messages, isConnected: !!channel };
}
