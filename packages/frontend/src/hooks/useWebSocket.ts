import { useEffect, useRef } from "react";
import type { ClientMessage, ServerMessage } from "@prompt64/shared";

const MIN_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 10_000;
const PING_INTERVAL_MS = 15_000;
// A dev proxy (or a NAT/load balancer in production) can silently drop the
// upstream connection without ever sending the browser a close frame, so a
// WebSocket can sit open-but-dead indefinitely with no "close" event to
// trigger reconnection. This bounds how long that can go undetected: any
// inbound frame (including our own ping's pong) resets the clock, and if
// nothing arrives for this long the socket is forced closed to trigger the
// normal reconnect path below.
const STALE_AFTER_MS = 3 * PING_INTERVAL_MS;

/**
 * Manages the session WebSocket connection: connects, reconnects on
 * unintentional close with jittered exponential backoff, sends a periodic
 * ping to detect a connection the browser doesn't know has died, and hands
 * off every parsed server message to `onMessage`.
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
    let pingInterval: ReturnType<typeof setInterval> | undefined;
    let watchdogInterval: ReturnType<typeof setInterval> | undefined;
    let lastActivityAt = Date.now();

    function connect() {
      onStatusChangeRef.current("connecting");
      const socket = new WebSocket(url!);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        backoff = MIN_BACKOFF_MS;
        lastActivityAt = Date.now();
        onStatusChangeRef.current("connected");

        pingInterval = setInterval(() => {
          if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
        }, PING_INTERVAL_MS);

        watchdogInterval = setInterval(() => {
          if (Date.now() - lastActivityAt > STALE_AFTER_MS) socket.close();
        }, PING_INTERVAL_MS);
      });

      socket.addEventListener("message", (event) => {
        lastActivityAt = Date.now();
        try {
          onMessageRef.current(JSON.parse(event.data) as ServerMessage);
        } catch {
          // Ignore malformed frames.
        }
      });

      socket.addEventListener("close", () => {
        clearInterval(pingInterval);
        clearInterval(watchdogInterval);
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
      clearInterval(pingInterval);
      clearInterval(watchdogInterval);
      socketRef.current?.close();
    };
  }, [url]);

  function send(message: ClientMessage) {
    socketRef.current?.send(JSON.stringify(message));
  }

  return { send };
}
