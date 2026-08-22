import assert from "node:assert/strict";
import { test } from "node:test";
import type { SessionState } from "../types.js";
import { createTools } from "./index.js";

function fakeSession(): SessionState {
  return {
    id: "test",
    createdAt: new Date(),
    lastActiveAt: new Date(),
    status: "idle",
    messages: [],
    currentSource: "; test\n",
    sockets: new Set(),
  };
}

// betaZodTool converts each tool's zod schema to JSON Schema eagerly (not at
// request time), so this catches a schema regression without needing a live
// API call: every tool's input_schema must be an object schema the Anthropic
// API will accept.
test("every tool exposes a valid object input_schema", () => {
  const tools = createTools({ session: fakeSession() });
  assert.equal(tools.length, 5);

  for (const tool of tools) {
    assert.ok("input_schema" in tool, `${tool.name} should have an input_schema`);
    const schema = (tool as { input_schema: { type: string; properties: Record<string, unknown> } })
      .input_schema;
    assert.equal(schema.type, "object", `${tool.name} input_schema.type`);
    assert.ok(schema.properties, `${tool.name} input_schema.properties`);
  }

  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["compile", "edit_source", "get_c64_reference", "read_source", "write_source"]);
});
