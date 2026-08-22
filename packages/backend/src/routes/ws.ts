import type { FastifyInstance } from "fastify";
import type { ClientMessage } from "@prompt64/shared";
import { runAgentTurn } from "../agent/claude-agent.js";
import { sessionStore } from "../services/session-store.js";

export async function wsRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/api/sessions/:id/ws", { websocket: true }, (socket, req) => {
    const session = sessionStore.get(req.params.id);
    if (!session) {
      socket.send(JSON.stringify({ type: "error", message: "Session not found" }));
      socket.close();
      return;
    }

    session.sockets.add(socket);
    sessionStore.touch(session);
    socket.send(JSON.stringify({ type: "session_state", status: session.status }));

    socket.on("message", (raw: Buffer) => {
      sessionStore.touch(session);
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      if (message.type === "user_message") {
        void runAgentTurn(session, message.text);
      }
    });

    socket.on("close", () => {
      session.sockets.delete(socket);
    });
  });
}
