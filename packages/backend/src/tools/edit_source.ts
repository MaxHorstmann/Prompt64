import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { broadcast } from "../services/ws-broadcaster.js";
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
    run: async ({ search, replace }) => {
      const source = ctx.session.currentSource;
      const firstIndex = source.indexOf(search);
      if (firstIndex === -1) {
        throw new Error("`search` was not found in the current source.");
      }
      const lastIndex = source.lastIndexOf(search);
      if (firstIndex !== lastIndex) {
        throw new Error("`search` matches more than once; make it more specific.");
      }

      const updated = source.slice(0, firstIndex) + replace + source.slice(firstIndex + search.length);
      ctx.session.currentSource = updated;
      broadcast(ctx.session, { type: "source_update", source: updated });
      return "Source updated.";
    },
  });
}
