import { createCompileTool } from "./compile.js";
import { createEditSourceTool } from "./edit_source.js";
import { createGetC64ReferenceTool } from "./get_c64_reference.js";
import { createReadSourceTool } from "./read_source.js";
import type { ToolContext } from "./types.js";
import { createWriteSourceTool } from "./write_source.js";

/** Builds the per-session tool set the agent uses to inspect and modify the game. */
export function createTools(ctx: ToolContext) {
  return [
    createReadSourceTool(ctx),
    createWriteSourceTool(ctx),
    createEditSourceTool(ctx),
    createCompileTool(ctx),
    createGetC64ReferenceTool(),
  ];
}
