import { spawn } from "node:child_process";
import { REPO_ROOT } from "./repo-paths";

export interface ClaudeInvocationResult {
  status: "success" | "error";
  output: string;
  raw: string;
  sessionId: string | null;
  exitCode: number | null;
}

const INVOCATION_TIMEOUT_MS = 5 * 60 * 1000;

// Shared low-level runner for `claude -p ...` headless invocations, used both
// for one-shot agent runs and for multi-turn chat (via --resume). Permission
// prompts are bypassed to avoid hanging headless; safe here because every
// agent this dashboard drives only declares Read/Grep/Glob in its frontmatter,
// so bypassPermissions doesn't grant any tool the agent doesn't already have.
export function invokeClaude(args: string[]): Promise<ClaudeInvocationResult> {
  return new Promise((resolve) => {
    const child = spawn(
      "claude",
      ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", ...args],
      { cwd: REPO_ROOT }
    );

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, INVOCATION_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      if (exitCode !== 0) {
        resolve({
          status: "error",
          output: stderr || `claude a quitté avec le code ${exitCode}`,
          raw: stdout,
          sessionId: null,
          exitCode,
        });
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve({
          status: parsed.is_error ? "error" : "success",
          output: typeof parsed.result === "string" ? parsed.result : stdout,
          raw: stdout,
          sessionId:
            typeof parsed.session_id === "string" ? parsed.session_id : null,
          exitCode,
        });
      } catch {
        resolve({
          status: "error",
          output: "Sortie JSON illisible depuis le CLI claude.",
          raw: stdout,
          sessionId: null,
          exitCode,
        });
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        status: "error",
        output: `Impossible de lancer le CLI claude : ${err.message}`,
        raw: "",
        sessionId: null,
        exitCode: null,
      });
    });
  });
}
