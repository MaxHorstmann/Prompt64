import type { SessionDetail } from "@prompt64/shared";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createSession: (): Promise<SessionDetail> =>
    fetch("/api/sessions", { method: "POST" }).then((res) => json<SessionDetail>(res)),

  getSession: (id: string): Promise<SessionDetail> =>
    fetch(`/api/sessions/${id}`).then((res) => json<SessionDetail>(res)),
};

export function wsUrlForSession(id: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/sessions/${id}/ws`;
}
