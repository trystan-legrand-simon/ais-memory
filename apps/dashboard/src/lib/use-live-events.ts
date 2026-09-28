"use client";

import { useEffect, useRef } from "react";
import type { RunRecord } from "./runs";
import type { Routine } from "./routines";

export interface ChatMessageEvent {
  slug: string;
  role: "user" | "agent" | "error";
  content: string;
  createdAt: string;
}

export type LiveEvent =
  | { type: "run"; data: RunRecord }
  | { type: "chat_message"; data: ChatMessageEvent }
  | { type: "routine"; data: Routine };

const WS_URL = "ws://localhost:4001";
const RECONNECT_DELAYS_MS = [1000, 2000, 5000];

// Enrichment only, never a hard dependency: if the WS process isn't
// reachable (not started yet, port taken), this fails silently in the
// background and keeps retrying — every page using this hook still works off
// its own initial REST fetch either way. See
// docs/superpowers/specs/2026-09-28-live-updates-websocket-design.md.
export function useLiveEvents(onEvent: (event: LiveEvent) => void) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as LiveEvent;
          onEventRef.current(parsed);
        } catch {
          // Malformed message — ignore, don't crash the page.
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        const delay =
          RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
