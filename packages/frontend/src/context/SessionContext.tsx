import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";
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

  useEffect(() => {
    let cancelled = false;

    api
      .createSession()
      .then((detail) => {
        if (cancelled) return;
        dispatch({
          type: "SESSION_LOADED",
          sessionId: detail.id,
          source: detail.currentSource,
          messages: detail.messages,
        });
        setWsUrl(wsUrlForSession(detail.id));
      })
      .catch((err) => {
        console.error("Failed to create session", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { send } = useWebSocket(
    wsUrl,
    (message) => dispatch({ type: "SERVER_MESSAGE", message }),
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
