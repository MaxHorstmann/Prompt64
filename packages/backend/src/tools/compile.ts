import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { compileSource } from "../services/compiler.js";
import { broadcast } from "../services/ws-broadcaster.js";
import { runWithResultBroadcast } from "./broadcast-result.js";
import type { ToolContext } from "./types.js";

/** Lets the agent compile the current source with 64tass and see the result. */
export function createCompileTool(ctx: ToolContext) {
  return betaZodTool({
    name: "compile",
    description: "Compile the current source with 64tass. Broadcasts the result to the UI.",
    inputSchema: z.object({}),
    run: async (_args, context) =>
      runWithResultBroadcast(ctx.session, "compile", context?.toolUse.id, async () => {
        const result = await compileSource(ctx.session.currentSource);
        ctx.session.lastPrgBase64 = result.prgBase64;
        broadcast(ctx.session, { type: "compilation_result", ...result });

        if (!result.success) {
          return `Compile failed:\n${result.errors ?? "unknown error"}`;
        }
        return `Compile succeeded.${result.warnings ? `\nWarnings:\n${result.warnings}` : ""}`;
      }),
  });
}
