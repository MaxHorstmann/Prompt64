import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "../config.js";
import type { CompileResponse } from "@prompt64/shared";

/** Compiles 6502 assembly source with 64tass and returns the result. */
export async function compileSource(source: string): Promise<CompileResponse> {
  const dir = await mkdtemp(join(tmpdir(), "prompt64-"));
  const asmPath = join(dir, "game.asm");
  const prgPath = join(dir, "game.prg");

  try {
    await writeFile(asmPath, source, "utf8");

    const { stdout, stderr, exitCode } = await runTass(asmPath, prgPath);

    if (exitCode !== 0) {
      return { success: false, errors: stderr || stdout || "64tass exited with a non-zero status" };
    }

    const prg = await readFile(prgPath);
    return {
      success: true,
      warnings: stderr || undefined,
      prgBase64: prg.toString("base64"),
    };
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: false, errors: "64tass is not installed. See .devcontainer/devcontainer.json." };
    }
    return { success: false, errors: err instanceof Error ? err.message : String(err) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runTass(
  asmPath: string,
  prgPath: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("64tass", ["-a", "--cbm-prg", "-o", prgPath, asmPath]);

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`64tass timed out after ${config.compileTimeoutMs}ms`));
    }, config.compileTimeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
  });
}
