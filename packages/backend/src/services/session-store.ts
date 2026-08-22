import { nanoid } from "nanoid";
import { config } from "../config.js";
import type { SessionState } from "../types.js";

const DEFAULT_SOURCE = `; Prompt64 — new session
; Ask Claude to describe a game and it will write assembly here.
                *= $0801
                .word (+), 2026
                .null $9e, format("%d", start)
+               .word 0
start
                rts
`;

export class SessionStore {
  private sessions = new Map<string, SessionState>();

  create(): SessionState {
    const now = new Date();
    const session: SessionState = {
      id: nanoid(12),
      createdAt: now,
      lastActiveAt: now,
      status: "idle",
      messages: [],
      currentSource: DEFAULT_SOURCE,
      sockets: new Set(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): SessionState | undefined {
    return this.sessions.get(id);
  }

  touch(session: SessionState): void {
    session.lastActiveAt = new Date();
  }

  /** Removes sessions that have had no activity for longer than the configured TTL. */
  sweepExpired(): void {
    const cutoff = Date.now() - config.sessionTtlMs;
    for (const [id, session] of this.sessions) {
      if (session.lastActiveAt.getTime() < cutoff) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionStore = new SessionStore();

setInterval(() => sessionStore.sweepExpired(), 5 * 60 * 1000).unref();
