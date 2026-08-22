import assert from "node:assert/strict";
import { test } from "node:test";
import { applyEdit } from "./edit-source-logic.js";

test("replaces the single occurrence of search with replace", () => {
  const result = applyEdit("start\n  rts\nend", "rts", "jmp start");
  assert.equal(result, "start\n  jmp start\nend");
});

test("throws when search does not occur", () => {
  assert.throws(() => applyEdit("abc", "xyz", "123"), /not found/);
});

test("throws when search occurs more than once", () => {
  assert.throws(() => applyEdit("abc abc", "abc", "def"), /more than once/);
});
