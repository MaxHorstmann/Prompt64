import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3001),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  claudeModel: process.env.CLAUDE_MODEL ?? "claude-sonnet-5",
  sessionTtlMs: 60 * 60 * 1000,
  maxAgentIterations: 10,
  compileTimeoutMs: 10_000,
};
