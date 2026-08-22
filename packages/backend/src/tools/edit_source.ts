import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { broadcast } from "../services/ws-broadcaster.js";
import { runWithResultBroadcast } from "./broadcast-result.js";
import { applyEdit } from "./edit-source-logic.js";
import type { ToolContext } from "./types.js";

/** Lets the agent make a targeted edit; requires the search text to match exactly once. */
export function createEditSourceTool(ctx: ToolContext) {
  return betaZodTool({
    name: "edit_source",
    description:
      "Replace one exact occurrence of `search` with `replace` in the current source. Fails if `search` matches zero or more than one time.",
    inputSchema: z.object({
      search: z.string().describe("Exact text to find. Must occur exactly once in the source."),
      replace: z.string().describe("Text to replace it with."),
    }),
    run: async ({ search, replace }, context) =>
      runWithResultBroadcast(ctx.session, "edit_source", context?.toolUse.id, async () => {
        const updated = applyEdit(ctx.session.currentSource, search, replace);
        ctx.session.currentSource = updated;
        broadcast(ctx.session, { type: "source_update", source: updated });
        return "Source updated.";
      }),
  });
}
