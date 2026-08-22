import { createContext, useCallback, useContext, useEffect, useRef, useReducer, useState, type ReactNode } from "react";
import { api, wsUrlForSession } from "../lib/api.js";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { initialSessionState, sessionReducer, type SessionState } from "./sessionReducer.js";

interface SessionContextValue {
  state: SessionState;
  sendMessage: (text: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const startingSession = useRef(false);

  const startNewSession = useCallback(async () => {
    if (startingSession.current) return;
    startingSession.current = true;
    try {
      const detail = await api.createSession();
      dispatch({
        type: "SESSION_LOADED",
        sessionId: detail.id,
        source: detail.currentSource,
        messages: detail.messages,
      });
      setWsUrl(wsUrlForSession(detail.id));
    } catch (err) {
      console.error("Failed to create session", err);
    } finally {
      startingSession.current = false;
    }
  }, []);

  useEffect(() => {
    void startNewSession();
  }, [startNewSession]);

  const { send } = useWebSocket(
    wsUrl,
    (message) => {
      if (message.type === "session_not_found") {
        // The backend restarted (or otherwise lost this in-memory session);
        // reconnecting to the same session id would just fail forever, so
        // start a fresh one instead.
        void startNewSession();
        return;
      }
      dispatch({ type: "SERVER_MESSAGE", message });
    },
    (status) => dispatch({ type: "WS_STATUS", status }),
  );

  function sendMessage(text: string) {
    if (!text.trim()) return;
    dispatch({ type: "USER_MESSAGE_SENT", text });
    send({ type: "user_message", text });
  }

  return <SessionContext.Provider value={{ state, sendMessage }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
