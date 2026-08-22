import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");

export type ReferenceTopic = "vic2" | "sid" | "memory-map" | "kernal";

export interface ReferenceEntry {
  address?: string;
  name: string;
  description: string;
  category?: string;
}

const TOPIC_FILES: Record<ReferenceTopic, string> = {
  vic2: "vic-ii.json",
  sid: "sid.json",
  "memory-map": "memory-map.json",
  kernal: "kernal.json",
};

const cache = new Map<ReferenceTopic, ReferenceEntry[]>();

function loadTopic(topic: ReferenceTopic): ReferenceEntry[] {
  const cached = cache.get(topic);
  if (cached) return cached;

  const raw = readFileSync(join(dataDir, TOPIC_FILES[topic]), "utf8");
  const entries = JSON.parse(raw) as ReferenceEntry[];
  cache.set(topic, entries);
  return entries;
}

const MAX_RESULTS = 20;

/** Looks up C64 hardware reference entries, optionally filtered by a case-insensitive substring. */
export function queryReference(topic: ReferenceTopic, query?: string): ReferenceEntry[] {
  const entries = loadTopic(topic);
  if (!query) return entries.slice(0, MAX_RESULTS);

  const needle = query.toLowerCase();
  return entries
    .filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.description.toLowerCase().includes(needle) ||
        entry.address?.toLowerCase().includes(needle) ||
        entry.category?.toLowerCase().includes(needle),
    )
    .slice(0, MAX_RESULTS);
}
