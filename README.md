# Prompt64

Chat with Claude to build a Commodore 64 game: describe what you want, Claude writes and
compiles 6502 assembly, and a successful build runs live in an in-browser C64 emulator.

See [`design.md`](./design.md) for the full architecture and design rationale.

## Prerequisites

- Node.js ≥ 20
- [`64tass`](https://tass64.sourceforge.net/) on your `PATH` (`sudo apt-get install 64tass` on
  Debian/Ubuntu — already set up if you're using the devcontainer)
- An Anthropic API key, to actually drive the chat agent (optional — the compile pipeline works
  without one)

## Quickstart

```bash
npm install
cp packages/backend/.env.example packages/backend/.env
# edit packages/backend/.env and set ANTHROPIC_API_KEY

npm run dev
```

This runs the backend (Fastify, port 3001) and frontend (Vite, port 6464) together. Open
the printed Vite URL — it proxies `/api` (REST and WebSocket) to the backend, so no separate CORS
setup is needed.

Type a request like "make a bouncing ball that bounces around the screen" in the chat pane and
watch the activity feed: `read_source` → `write_source` → `compile` → the emulator pane loads and
runs the result.

## Project structure

```
packages/
  shared/    # WebSocket protocol + session types shared by both sides
  backend/   # Fastify server: session/compile REST routes, session WebSocket,
             # the 64tass compiler service, and the Claude agent + tools
  frontend/  # Vite + React app: chat pane, emulator pane, source viewer
```

## Scripts

Run from the repo root (applies to all workspaces):

| Script | What it does |
|---|---|
| `npm run dev` | Runs backend + frontend together, with hot reload |
| `npm run build` | Builds `shared`, then `backend`, then `frontend` |
| `npm run typecheck` | Type-checks all three workspaces |
| `npm run test` | Runs the backend's test suite (`node:test`, via `tsx`) |

## Verifying the toolchain without an API key

The compile pipeline works standalone, so you can sanity-check `64tass` and the backend without
spending any API calls:

```bash
curl -X POST localhost:3001/api/compile \
  -H "Content-Type: application/json" \
  -d '{"source":"*= $0801\nrts\n"}'
```

A working setup returns `{"success":true,"prgBase64":"..."}`.
