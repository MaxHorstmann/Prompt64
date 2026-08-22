import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { promisify } from "node:util";
import { compileSource } from "./compiler.js";

const execFileAsync = promisify(execFile);

async function has64tass(): Promise<boolean> {
  try {
    await execFileAsync("64tass", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

const VALID_SOURCE = `                *= $0801
                .word (+), 2026
                .null $9e, format("%d", start)
+               .word 0
start
                rts
`;

test("compiles a valid program to a base64 .prg", { skip: !(await has64tass()) }, async () => {
  const result = await compileSource(VALID_SOURCE);
  assert.equal(result.success, true);
  assert.ok(result.prgBase64 && result.prgBase64.length > 0);
});

test("reports errors for an invalid program", { skip: !(await has64tass()) }, async () => {
  const result = await compileSource("this is not 6502 assembly {{{");
  assert.equal(result.success, false);
  assert.ok(result.errors);
});
