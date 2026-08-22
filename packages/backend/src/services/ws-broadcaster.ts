import type { ServerMessage } from "@prompt64/shared";
import type { SessionState } from "../types.js";

/** Sends a server message to every socket currently open for a session. */
export function broadcast(session: SessionState, message: ServerMessage): void {
  const payload = JSON.stringify(message);
  for (const socket of session.sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(payload);
    }
  }
}
