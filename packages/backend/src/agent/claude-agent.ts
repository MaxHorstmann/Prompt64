import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@prompt64/shared";
import { config } from "../config.js";
import { broadcast } from "../services/ws-broadcaster.js";
import { createTools } from "../tools/index.js";
import type { SessionState } from "../types.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

/**
 * Runs one turn of the agent loop for a user message: streams thinking/tool
 * events over the session's WebSocket connections and appends the final
 * response to session history.
 */
export async function runAgentTurn(session: SessionState, userText: string): Promise<void> {
  session.messages.push({ role: "user", text: userText, timestamp: new Date().toISOString() });
  session.status = "processing";
  broadcast(session, { type: "session_state", status: "processing" });

  try {
    const tools = createTools({ session });

    const runner = client.beta.messages.toolRunner({
      model: config.claudeModel,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      thinking: { type: "adaptive", display: "summarized" },
      output_config: { effort: "high" },
      messages: session.messages.map((m) => ({ role: m.role, content: m.text })),
      tools,
      max_iterations: config.maxAgentIterations,
    });

    const textByIteration: string[] = [];
    for await (const message of runner) {
      const iterationText: string[] = [];
      for (const block of message.content) {
        if (block.type === "text") {
          iterationText.push(block.text);
        } else if (block.type === "thinking") {
          broadcast(session, { type: "agent_thinking", text: block.thinking });
        } else if (block.type === "tool_use") {
          broadcast(session, {
            type: "tool_call",
            toolUseId: block.id,
            toolName: block.name,
            input: block.input,
          });
        }
      }
      if (iterationText.length > 0) {
        textByIteration.push(iterationText.join(""));
      }
    }

    // Each yielded `message` is one API round trip; only the text from the
    // final round (the one with no further tool calls) is the answer shown
    // to the user. Earlier rounds' text, if any, is just running commentary
    // ahead of a tool call and isn't worth a separate chat bubble.
    const finalText = textByIteration.at(-1) ?? "";
    if (finalText) {
      broadcast(session, { type: "agent_response", text: finalText });
    }

    session.messages.push({
      role: "assistant",
      text: finalText,
      timestamp: new Date().toISOString(),
    } satisfies ChatMessage);
  } catch (err) {
    broadcast(session, {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    session.status = "idle";
    broadcast(session, { type: "session_state", status: "idle" });
  }
}
