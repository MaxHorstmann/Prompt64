import { broadcast } from "../services/ws-broadcaster.js";
import type { SessionState } from "../types.js";

/**
 * Runs a tool body and broadcasts its outcome as a `tool_result` WS event,
 * keyed by the tool_use id the runner passes in via context. The Tool Runner
 * only yields assistant messages from its async iterator, not the tool
 * results it feeds back internally, so tools report their own results here
 * for the activity feed.
 */
export async function runWithResultBroadcast(
  session: SessionState,
  toolName: string,
  toolUseId: string | undefined,
  fn: () => Promise<string>,
): Promise<string> {
  try {
    const output = await fn();
    if (toolUseId) {
      broadcast(session, { type: "tool_result", toolUseId, toolName, output, isError: false });
    }
    return output;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (toolUseId) {
      broadcast(session, { type: "tool_result", toolUseId, toolName, output: message, isError: true });
    }
    throw err;
  }
}
