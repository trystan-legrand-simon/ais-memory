import path from "node:path";

// apps/web is two levels below the repo root.
export const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
export const AGENTS_DIR = path.join(REPO_ROOT, ".claude", "agents");
export const GRAPH_FILE = path.join(AGENTS_DIR, "graph.json");
export const MEMOIRE_DIR = path.join(REPO_ROOT, "ais-memory");
export const SETTINGS_FILE = path.join(REPO_ROOT, ".claude", "settings.json");
