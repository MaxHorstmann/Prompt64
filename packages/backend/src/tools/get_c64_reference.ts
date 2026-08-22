import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { queryReference } from "../reference/loader.js";
import { runWithResultBroadcast } from "./broadcast-result.js";
import type { ToolContext } from "./types.js";

/** Lets the agent look up VIC-II, SID, memory map, or KERNAL details instead of guessing addresses. */
export function createGetC64ReferenceTool(ctx: ToolContext) {
  return betaZodTool({
    name: "get_c64_reference",
    description: "Look up C64 hardware reference details: VIC-II, SID, the memory map, or KERNAL routines.",
    inputSchema: z.object({
      topic: z.enum(["vic2", "sid", "memory-map", "kernal"]),
      query: z.string().optional().describe("Case-insensitive substring to filter results."),
    }),
    run: async ({ topic, query }, context) =>
      runWithResultBroadcast(ctx.session, "get_c64_reference", context?.toolUse.id, async () => {
        const entries = queryReference(topic, query);
        if (entries.length === 0) {
          return `No ${topic} reference entries matched "${query}".`;
        }
        return JSON.stringify(entries, null, 2);
      }),
  });
}
