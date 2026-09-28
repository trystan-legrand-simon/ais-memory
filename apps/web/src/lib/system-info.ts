import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AGENTS_DIR, MEMOIRE_DIR, REPO_ROOT } from "./repo-paths";

const execFileAsync = promisify(execFile);

export interface SystemInfo {
  claudeVersion: string | null;
  repoRoot: string;
  agentsDir: string;
  memoireDir: string;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  let claudeVersion: string | null = null;
  try {
    const { stdout } = await execFileAsync("claude", ["--version"]);
    claudeVersion = stdout.trim();
  } catch {
    claudeVersion = null;
  }

  return {
    claudeVersion,
    repoRoot: REPO_ROOT,
    agentsDir: AGENTS_DIR,
    memoireDir: MEMOIRE_DIR,
  };
}
