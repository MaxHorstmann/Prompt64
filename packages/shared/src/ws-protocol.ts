/** Messages sent from the frontend to the backend over the session WebSocket. */
export type ClientMessage = { type: "user_message"; text: string };

/** Messages sent from the backend to the frontend over the session WebSocket. */
export type ServerMessage =
  | { type: "session_state"; status: "idle" | "processing" }
  | { type: "agent_thinking"; text: string }
  | { type: "tool_call"; toolUseId: string; toolName: string; input: unknown }
  | {
      type: "tool_result";
      toolUseId: string;
      toolName: string;
      output: string;
      isError: boolean;
    }
  | {
      type: "compilation_result";
      success: boolean;
      errors?: string;
      warnings?: string;
      prgBase64?: string;
    }
  | { type: "source_update"; source: string }
  | { type: "agent_response"; text: string }
  | { type: "error"; message: string };
