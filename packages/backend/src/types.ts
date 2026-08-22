import type { ChatMessage } from "@prompt64/shared";
import type { WebSocket } from "ws";

export interface SessionState {
  id: string;
  createdAt: Date;
  lastActiveAt: Date;
  status: "idle" | "processing";
  messages: ChatMessage[];
  currentSource: string;
  lastPrgBase64?: string;
  sockets: Set<WebSocket>;
}
