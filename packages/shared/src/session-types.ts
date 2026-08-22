export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  text: string;
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  status: "idle" | "processing";
}

export interface SessionDetail extends SessionSummary {
  messages: ChatMessage[];
  currentSource: string;
}

export interface CompileRequest {
  source: string;
}

export interface CompileResponse {
  success: boolean;
  errors?: string;
  warnings?: string;
  prgBase64?: string;
}
