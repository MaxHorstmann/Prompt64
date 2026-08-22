import { useEffect, useRef } from "react";
import type { ClientMessage, ServerMessage } from "@prompt64/shared";

const MIN_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 10_000;

/**
 * Manages the session WebSocket connection: connects, reconnects on
 * unintentional close with jittered exponential backoff, and hands off
 * every parsed server message to `onMessage`.
 */
export function useWebSocket(
  url: string | null,
  onMessage: (message: ServerMessage) => void,
  onStatusChange: (status: "connecting" | "connected" | "disconnected") => void,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);
  onMessageRef.current = onMessage;
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    if (!url) return;

    let closedByEffect = false;
    let backoff = MIN_BACKOFF_MS;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      onStatusChangeRef.current("connecting");
      const socket = new WebSocket(url!);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        backoff = MIN_BACKOFF_MS;
        onStatusChangeRef.current("connected");
      });

      socket.addEventListener("message", (event) => {
        try {
          onMessageRef.current(JSON.parse(event.data) as ServerMessage);
        } catch {
          // Ignore malformed frames.
        }
      });

      socket.addEventListener("close", () => {
        onStatusChangeRef.current("disconnected");
        if (closedByEffect) return;
        const jitter = Math.random() * 0.4 + 0.8;
        retryTimeout = setTimeout(connect, Math.min(backoff * jitter, MAX_BACKOFF_MS));
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      });
    }

    connect();

    return () => {
      closedByEffect = true;
      clearTimeout(retryTimeout);
      socketRef.current?.close();
    };
  }, [url]);

  function send(message: ClientMessage) {
    socketRef.current?.send(JSON.stringify(message));
  }

  return { send };
}
