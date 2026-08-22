import type { FastifyInstance } from "fastify";
import type { SessionDetail, SessionSummary } from "@prompt64/shared";
import { sessionStore } from "../services/session-store.js";

export async function sessionsRoutes(app: FastifyInstance) {
  app.post("/api/sessions", async (_req, reply) => {
    const session = sessionStore.create();
    const summary: SessionSummary = {
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      status: session.status,
    };
    return reply.code(201).send(summary);
  });

  app.get<{ Params: { id: string } }>("/api/sessions/:id", async (req, reply) => {
    const session = sessionStore.get(req.params.id);
    if (!session) return reply.code(404).send({ message: "Session not found" });

    const detail: SessionDetail = {
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      status: session.status,
      messages: session.messages,
      currentSource: session.currentSource,
    };
    return reply.send(detail);
  });

  app.get<{ Params: { id: string } }>("/api/sessions/:id/source", async (req, reply) => {
    const session = sessionStore.get(req.params.id);
    if (!session) return reply.code(404).send({ message: "Session not found" });
    return reply.send({ source: session.currentSource });
  });
}
