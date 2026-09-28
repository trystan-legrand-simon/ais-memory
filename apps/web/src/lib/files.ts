import fs from "node:fs/promises";
import path from "node:path";
import { MEMOIRE_DIR } from "./repo-paths";

export class InvalidPathError extends Error {}

function resolveSafe(relPath: string): string {
  const resolved = path.resolve(MEMOIRE_DIR, relPath);
  const rootWithSep = MEMOIRE_DIR.endsWith(path.sep)
    ? MEMOIRE_DIR
    : MEMOIRE_DIR + path.sep;
  if (resolved !== MEMOIRE_DIR && !resolved.startsWith(rootWithSep)) {
    throw new InvalidPathError(`Path escapes ais-memory/: ${relPath}`);
  }
  return resolved;
}

async function walk(dir: string, base: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(abs, rel)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(rel);
    }
  }
  return results;
}

export async function listFiles(): Promise<string[]> {
  const files = await walk(MEMOIRE_DIR, "");
  return files.sort();
}

export async function readMemoireFile(relPath: string): Promise<string> {
  const abs = resolveSafe(relPath);
  return fs.readFile(abs, "utf-8");
}

export async function writeMemoireFile(
  relPath: string,
  content: string
): Promise<void> {
  const abs = resolveSafe(relPath);
  await fs.writeFile(abs, content, "utf-8");
}
