import assert from "node:assert/strict";
import { test } from "node:test";
import { queryReference } from "./loader.js";

test("returns all entries for a topic when no query is given", () => {
  const entries = queryReference("vic2");
  assert.ok(entries.length > 0);
});

test("filters case-insensitively by name/description/address/category", () => {
  const entries = queryReference("vic2", "border");
  assert.ok(entries.length > 0);
  assert.ok(entries.every((e) => JSON.stringify(e).toLowerCase().includes("border")));
});

test("returns an empty array when nothing matches", () => {
  assert.deepEqual(queryReference("kernal", "no-such-thing-xyz"), []);
});

test("caps results at 20", () => {
  assert.ok(queryReference("vic2").length <= 20);
});
