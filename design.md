# Prompt64 — Design Plan

## Context

Prompt64 is a continuous AI-assisted C64 game-development tool: the user chats with Claude to iteratively describe and refine a C64 game, Claude writes and fixes 6502 assembly, the backend compiles it with 64tass, and a successful build is pushed live into an in-browser C64 emulator the user can play.

This design is adapted from a sibling project's plan, [Claude2C64 (DESIGN-V2.md)](https://github.com/MaxHorstmann/Claude2C64/blob/main/DESIGN-V2.md) — same architecture, rebranded, with two deliberate changes:

1. **Local dev only.** No Kubernetes, Docker, docker-compose, or KIND — the original doc's containerize/K8s and AKS/production phases are out of scope for now. The goal is a working loop runnable directly in the existing devcontainer via `npm run dev`.
2. **Model: `claude-sonnet-5`**, not the original doc's `claude-sonnet-4-6` (superseded) — chosen over `claude-opus-5` for cost/speed.

## Architecture

```
Chat Pane (React)  <-- WebSocket -->  Fastify backend  <-- postMessage -->  vc64web emulator (iframe)
                                        |
                                        +-- Claude API (tool use, claude-sonnet-5)
                                        +-- 64tass compiler (spawned subprocess)
                                        +-- in-memory session state
```

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | npm workspaces: `packages/backend`, `packages/frontend`, `packages/shared` | `shared` holds WebSocket protocol types imported by both sides, so client/server can't drift apart |
| Assembler | 64tass, via apt | Real Ubuntu `universe` package since 22.04 "jammy" (verified: 1.56.2625-1 on jammy, 1.59.3120-1 on noble). No source build needed |
| Agent loop | Anthropic TypeScript SDK beta Tool Runner (`client.beta.messages.toolRunner` + `betaZodTool`) | Iterating `for await (const message of runner)` gives one hook per turn, mapping directly onto what needs to stream over the WebSocket |
| Model | `claude-sonnet-5`, `thinking: {type: "adaptive", display: "summarized"}`, `output_config: {effort: "high"}` | User's explicit choice over Opus 5, for cost/speed |
| Frontend | React + TypeScript (Vite), `react-resizable-panels` for the split pane | Matches original design doc |
| Emulator | vc64web via iframe, hosted (`https://vc64web.github.io/#<config>`) | Cycle-accurate WASM emulator; no self-hosting needed for local dev |
| Deployment | None (local dev only) | Explicitly out of scope for this build |

## Project Structure

```
Prompt64/
  package.json                 # npm workspaces root; `dev` runs backend+frontend concurrently
  tsconfig.base.json           # shared strict compiler options
  packages/
    shared/                    # @prompt64/shared — WS protocol + session types, no runtime deps
      src/ws-protocol.ts
      src/session-types.ts
      src/index.ts
    backend/                   # @prompt64/backend — Fastify + agent + compiler
      src/
        index.ts
        config.ts
        types.ts
        routes/                # sessions, compile, ws
        services/              # session-store, compiler, ws-broadcaster
        agent/                 # claude-agent, system-prompt
        tools/                 # read_source, write_source, edit_source, compile, get_c64_reference
        reference/             # loader.ts + data/{vic-ii,sid,memory-map,kernal}.json
      .env.example
    frontend/                  # @prompt64/frontend — Vite + React app
      src/
        main.tsx
        App.tsx
        lib/api.ts
        hooks/useWebSocket.ts
        context/               # SessionContext, sessionReducer
        components/
          Layout/SplitLayout.tsx
          ChatPane/             # ChatPane, MessageList, ChatInput, AgentActivityFeed
          EmulatorPane/         # EmulatorPane, EmulatorControls
          SourceViewer/SourceViewer.tsx
      vite.config.ts
```

## Key Components

### 1. 64tass in the devcontainer

`.devcontainer/devcontainer.json`'s `postCreateCommand` gains an apt install step before the existing Claude Code CLI install:

```bash
sudo apt-get update && sudo apt-get install -y 64tass && npm install -g @anthropic-ai/claude-code && 64tass --version
```

Invocation: `64tass -a --cbm-prg -o game.prg game.asm`. Non-zero exit signals failure; capture stdout+stderr.

### 2. Agent System — Claude with Tool Use

Single Claude conversation per session, using the beta Tool Runner. Tools are built per-connection via `createTools({ sessionState, broadcast })` since each tool's `run()` needs to emit WS events directly (`tool_call`/`tool_result`/`compilation_result`/`source_update`):

| Tool | Input | Purpose |
|---|---|---|
| `read_source` | none | Read the current assembly source |
| `write_source` | `{ source: string }` | Full overwrite (initial version / large rewrites) |
| `edit_source` | `{ search: string, replace: string }` | Targeted edit; errors unless `search` matches exactly once |
| `compile` | none | Run 64tass; broadcasts `compilation_result`; on success the `.prg` is sent to the emulator |
| `get_c64_reference` | `{ topic: "vic2"\|"sid"\|"memory-map"\|"kernal", query?: string }` | Look up C64 hardware details |

The system prompt instructs Claude to compile after every change and retry on failure up to 3 times (prompt-level, not code-enforced). A hard 10-iteration cap on the tool-runner loop is the only code-level circuit breaker.

### 3. WebSocket Protocol (`packages/shared/src/ws-protocol.ts`)

```typescript
export type ClientMessage = { type: "user_message"; text: string };

export type ServerMessage =
  | { type: "session_state"; status: "idle" | "processing" }
  | { type: "agent_thinking"; text: string }
  | { type: "tool_call"; toolUseId: string; toolName: string; input: unknown }
  | { type: "tool_result"; toolUseId: string; toolName: string; output: string; isError: boolean }
  | { type: "compilation_result"; success: boolean; errors?: string; warnings?: string; prgBase64?: string }
  | { type: "source_update"; source: string }
  | { type: "agent_response"; text: string }
  | { type: "error"; message: string };
```

### 4. Backend

- **Fastify** with `@fastify/websocket`.
- **Endpoints**: `POST /api/sessions`, `GET /api/sessions/:id`, `GET /api/sessions/:id/source`, `POST /api/compile` (standalone, bypasses Claude — useful for verifying the compiler works before wiring up the agent), `WS /api/sessions/:id/ws`.
- **Compiler service**: writes `.asm` to a temp file, spawns 64tass, captures stdout/stderr, enforces a timeout.
- **Session state**: in-memory `Map<sessionId, { conversationHistory, currentSource, lastPrg }>`, swept after 1h inactivity.
- **C64 reference data**: four small JSON files (`vic-ii`, `sid`, `memory-map`, `kernal`), each an array of `{ address?, name, description, category? }`, loaded once and queried by case-insensitive substring match, capped to ~20 results.

### 5. vc64web Emulator Integration

```typescript
iframe.contentWindow.postMessage({ cmd: 'load', file_name: 'game.prg', file: prgUint8Array }, '*');
iframe.contentWindow.postMessage({ cmd: 'script', script: 'wasm_reset(); reset_keyboard();' }, '*');
```

Iframe URL: `https://vc64web.github.io/#${encodeURIComponent(JSON.stringify({ openROMS: true }))}` — `openROMS` auto-fetches free MEGA65 ROMs, no ROM distribution needed.

### 6. Frontend

- **Split pane**: `react-resizable-panels` — ChatPane ↔ EmulatorPane, with an optional third panel for the source viewer.
- **Chat pane**: message list + collapsible agent activity feed (tool calls, compile results) + text input (disabled while processing).
- **Emulator pane**: vc64web iframe + reset/audio control bar; an effect watches `compilation_result` events and loads+resets on success.
- **Source viewer**: read-only view of the current `.asm`, updated on `source_update`.
- **`useWebSocket` hook**: connects via the Vite dev proxy (`/api`, `ws: true`); reconnects on unintentional close with exponential backoff (500ms → 10s cap, jittered, reset on success); re-syncs session + source state after reconnect (events missed while disconnected are simply lost — acceptable for local single-tab dev).

## Verification

1. Rebuild the devcontainer; confirm `64tass --version` succeeds.
2. `npm install` at repo root; copy `packages/backend/.env.example` → `.env`; set `ANTHROPIC_API_KEY` (or rely on an `ant auth login` profile).
3. **Compiler smoke test first** (no LLM cost): `POST /api/compile` with known-good trivial assembly → `success:true` + prg bytes; repeat with broken syntax → `success:false` + populated `errors`.
4. `npm run dev` at root; open the frontend, confirm the split pane renders, the vc64web iframe loads to a blue BASIC-ready screen, and the WS status shows connected.
5. Type "make a bouncing ball that bounces around the screen"; watch the activity feed for `read_source` → `write_source` → `compile` → `compilation_result`, then confirm the emulator actually starts running the generated program (visible motion on screen).
6. Confirm the source viewer (if expanded) matches what was compiled.
7. Try a prompt likely to trip a compile error; confirm the agent retries and eventually stops (success, or a final explanation after ≤3 attempts / ≤10 iterations).
8. Kill the backend mid-session with the frontend tab open; confirm a disconnected/reconnecting indicator appears; restart the backend; confirm the WS reconnects automatically.
9. `GET /api/sessions/:id/source` directly and confirm it matches the UI.
