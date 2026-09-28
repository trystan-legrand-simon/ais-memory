import fs from "node:fs/promises";
import { SETTINGS_FILE } from "./repo-paths";

export class InvalidSettingsError extends Error {}

export async function readSettings(): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new InvalidSettingsError(
      `${SETTINGS_FILE} contient du JSON invalide — corrigez-le à la main avant de réessayer.`
    );
  }
}

// Atomic write: a crash or interrupted write must never leave settings.json
// truncated, since it controls Claude Code's real permissions on this repo.
export async function writeSettings(
  next: Record<string, unknown>
): Promise<void> {
  const tmpFile = `${SETTINGS_FILE}.tmp`;
  const serialized = JSON.stringify(next, null, 2) + "\n";
  await fs.writeFile(tmpFile, serialized, "utf-8");
  await fs.rename(tmpFile, SETTINGS_FILE);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
