import type { ChatMessage, ServerMessage } from "@prompt64/shared";

export type WsStatus = "connecting" | "connected" | "disconnected";

export type ActivityItem =
  | { id: string; kind: "tool_call"; toolName: string; input: unknown }
  | { id: string; kind: "tool_result"; toolName: string; output: string; isError: boolean }
  | { id: string; kind: "compilation_result"; success: boolean; errors?: string; warnings?: string }
  | { id: string; kind: "agent_thinking"; text: string };

export interface SessionState {
  sessionId: string | null;
  status: "idle" | "processing";
  wsStatus: WsStatus;
  messages: ChatMessage[];
  activity: ActivityItem[];
  currentSource: string;
  lastPrgBase64?: string;
  error: string | null;
}

export const initialSessionState: SessionState = {
  sessionId: null,
  status: "idle",
  wsStatus: "connecting",
  messages: [],
  activity: [],
  currentSource: "",
  error: null,
};

export type SessionAction =
  | { type: "SESSION_LOADED"; sessionId: string; source: string; messages: ChatMessage[] }
  | { type: "WS_STATUS"; status: WsStatus }
  | { type: "USER_MESSAGE_SENT"; text: string }
  | { type: "SERVER_MESSAGE"; message: ServerMessage };

let nextActivityId = 0;

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "SESSION_LOADED":
      return {
        ...state,
        sessionId: action.sessionId,
        currentSource: action.source,
        messages: action.messages,
      };

    case "WS_STATUS":
      return { ...state, wsStatus: action.status };

    case "USER_MESSAGE_SENT":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "user", text: action.text, timestamp: new Date().toISOString() },
        ],
      };

    case "SERVER_MESSAGE":
      return applyServerMessage(state, action.message);

    default:
      return state;
  }
}

function applyServerMessage(state: SessionState, message: ServerMessage): SessionState {
  switch (message.type) {
    case "session_state":
      return { ...state, status: message.status };

    case "agent_thinking":
      return {
        ...state,
        activity: [
          ...state.activity,
          { id: String(nextActivityId++), kind: "agent_thinking", text: message.text },
        ],
      };

    case "tool_call":
      return {
        ...state,
        activity: [
          ...state.activity,
          {
            id: message.toolUseId,
            kind: "tool_call",
            toolName: message.toolName,
            input: message.input,
          },
        ],
      };

    case "tool_result":
      return {
        ...state,
        activity: [
          ...state.activity,
          {
            id: `${message.toolUseId}-result`,
            kind: "tool_result",
            toolName: message.toolName,
            output: message.output,
            isError: message.isError,
          },
        ],
      };

    case "compilation_result":
      return {
        ...state,
        lastPrgBase64: message.prgBase64 ?? state.lastPrgBase64,
        activity: [
          ...state.activity,
          {
            id: String(nextActivityId++),
            kind: "compilation_result",
            success: message.success,
            errors: message.errors,
            warnings: message.warnings,
          },
        ],
      };

    case "source_update":
      return { ...state, currentSource: message.source };

    case "agent_response":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "assistant", text: message.text, timestamp: new Date().toISOString() },
        ],
      };

    case "error":
      return { ...state, error: message.message };

    default:
      return state;
  }
}
