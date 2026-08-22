import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { broadcast } from "../services/ws-broadcaster.js";
import { runWithResultBroadcast } from "./broadcast-result.js";
import type { ToolContext } from "./types.js";

/** Lets the agent replace the whole source file — used for the initial version or large rewrites. */
export function createWriteSourceTool(ctx: ToolContext) {
  return betaZodTool({
    name: "write_source",
    description:
      "Overwrite the entire C64 assembly source for this session. Use for the initial version of a program or a large rewrite.",
    inputSchema: z.object({
      source: z.string().describe("The full assembly source to write."),
    }),
    run: async ({ source }, context) =>
      runWithResultBroadcast(ctx.session, "write_source", context?.toolUse.id, async () => {
        ctx.session.currentSource = source;
        broadcast(ctx.session, { type: "source_update", source });
        return "Source written.";
      }),
  });
}
