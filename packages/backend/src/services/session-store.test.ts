import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionStore } from "./session-store.js";

test("create() returns a session with default source and idle status", () => {
  const store = new SessionStore();
  const session = store.create();
  assert.equal(session.status, "idle");
  assert.match(session.currentSource, /\*= \$0801/);
  assert.equal(store.get(session.id), session);
});

test("get() returns undefined for an unknown id", () => {
  const store = new SessionStore();
  assert.equal(store.get("does-not-exist"), undefined);
});

test("touch() bumps lastActiveAt", () => {
  const store = new SessionStore();
  const session = store.create();
  const before = session.lastActiveAt.getTime();
  session.lastActiveAt = new Date(before - 1000);
  store.touch(session);
  assert.ok(session.lastActiveAt.getTime() >= before);
});

test("sweepExpired() removes sessions inactive past the TTL and closes their sockets", () => {
  const store = new SessionStore();
  const session = store.create();
  let closed = false;
  session.sockets.add({ close: () => (closed = true) } as unknown as import("ws").WebSocket);
  session.lastActiveAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

  store.sweepExpired();

  assert.equal(store.get(session.id), undefined);
  assert.equal(closed, true);
});

test("sweepExpired() keeps recently active sessions", () => {
  const store = new SessionStore();
  const session = store.create();

  store.sweepExpired();

  assert.equal(store.get(session.id), session);
});
