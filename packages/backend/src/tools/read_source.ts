import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { runWithResultBroadcast } from "./broadcast-result.js";
import type { ToolContext } from "./types.js";

/** Lets the agent read the current assembly source before deciding how to change it. */
export function createReadSourceTool(ctx: ToolContext) {
  return betaZodTool({
    name: "read_source",
    description: "Read the current C64 assembly source for this session.",
    inputSchema: z.object({}),
    run: async (_args, context) =>
      runWithResultBroadcast(ctx.session, "read_source", context?.toolUse.id, async () => ctx.session.currentSource),
  });
}
