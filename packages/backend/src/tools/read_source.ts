import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { ToolContext } from "./types.js";

/** Lets the agent read the current assembly source before deciding how to change it. */
export function createReadSourceTool(ctx: ToolContext) {
  return betaZodTool({
    name: "read_source",
    description: "Read the current C64 assembly source for this session.",
    inputSchema: z.object({}),
    run: async () => {
      return ctx.session.currentSource;
    },
  });
}
