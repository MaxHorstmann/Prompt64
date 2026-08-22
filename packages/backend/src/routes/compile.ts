import type { FastifyInstance } from "fastify";
import type { CompileRequest } from "@prompt64/shared";
import { compileSource } from "../services/compiler.js";

/**
 * Standalone compile endpoint that bypasses Claude entirely — useful for
 * verifying the 64tass toolchain works before wiring up the agent.
 */
export async function compileRoutes(app: FastifyInstance) {
  app.post<{ Body: CompileRequest }>("/api/compile", async (req, reply) => {
    const { source } = req.body;
    if (typeof source !== "string" || source.length === 0) {
      return reply.code(400).send({ message: "`source` must be a non-empty string" });
    }
    const result = await compileSource(source);
    return reply.send(result);
  });
}
