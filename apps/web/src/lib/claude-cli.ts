import { spawn } from "node:child_process";
import { REPO_ROOT } from "./repo-paths";

export interface ClaudeInvocationResult {
  status: "success" | "error";
  output: string;
  raw: string;
  sessionId: string | null;
  exitCode: number | null;
}

// A single leaf agent (Read/Grep/Glob/etc., no further delegation) fits
// comfortably in 5 minutes. A hub agent (declares `Agent(...)` in its own
// tools, i.e. delegates to others) chains several such invocations
// sequentially by design — see orchestrateur.md's "ne parallélise jamais" —
// so it needs a much larger budget. Callers pick which applies via
// `timeoutMs`; this is just the leaf default.
export const DEFAULT_INVOCATION_TIMEOUT_MS = 5 * 60 * 1000;
export const HUB_INVOCATION_TIMEOUT_MS = 20 * 60 * 1000;

// Shared low-level runner for `claude -p ...` headless invocations, used both
// for one-shot agent runs and for multi-turn chat (via --resume). Permission
// prompts are bypassed to avoid hanging headless; safe here because every
// agent this dashboard drives only declares Read/Grep/Glob in its frontmatter,
// so bypassPermissions doesn't grant any tool the agent doesn't already have.
export function invokeClaude(
  args: string[],
  timeoutMs: number = DEFAULT_INVOCATION_TIMEOUT_MS
): Promise<ClaudeInvocationResult> {
  return new Promise((resolve) => {
    const child = spawn(
      "claude",
      ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", ...args],
      // stdin explicitly closed (not just unfed): left as the default open
      // pipe, the CLI waits ~3s for piped input that will never come,
      // prints a "no stdin data received" warning, then proceeds anyway —
      // harmless but noisy in every run's recorded output for no reason.
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({
          status: "error",
          output: `Le CLI claude n'a pas terminé dans le délai imparti (${Math.round(timeoutMs / 1000)}s) — processus interrompu.`,
          raw: stdout,
          sessionId: null,
          exitCode,
        });
        return;
      }
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

// One line of `claude -p --output-format stream-json --include-partial-messages
// --verbose` stdout, already JSON.parse'd. Two kinds matter here: a text
// fragment as it's generated, and the final summary line (same fields as the
// single JSON blob --output-format=json returns). Everything else (system/
// hook/other stream_event subtypes) is irrelevant to chat streaming.
export type StreamLineEvent =
  | { type: "delta"; text: string }
  | { type: "result"; result: Omit<ClaudeInvocationResult, "exitCode"> };

// Pure and exported so it's testable without spawning a real process.
export function parseStreamJsonLine(raw: string): StreamLineEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  if (obj.type === "stream_event" && obj.event && typeof obj.event === "object") {
    const event = obj.event as Record<string, unknown>;
    if (event.type !== "content_block_delta") return null;
    const delta = event.delta;
    if (!delta || typeof delta !== "object") return null;
    const d = delta as Record<string, unknown>;
    if (d.type === "text_delta" && typeof d.text === "string") {
      return { type: "delta", text: d.text };
    }
    return null;
  }

  if (obj.type === "result") {
    return {
      type: "result",
      result: {
        status: obj.is_error === true ? "error" : "success",
        output: typeof obj.result === "string" ? obj.result : "",
        raw,
        sessionId: typeof obj.session_id === "string" ? obj.session_id : null,
      },
    };
  }

  return null;
}

// Streaming counterpart to invokeClaude, used only by the chat route (agent
// runs via run-agent.ts stay on the plain JSON mode — no need for
// token-level output there). Requires --verbose (the CLI itself enforces
// this alongside stream-json). See
// docs/superpowers/specs/2026-09-28-chat-streaming-design.md.
export function invokeClaudeStreaming(
  args: string[],
  onDelta: (text: string) => void,
  timeoutMs: number = DEFAULT_INVOCATION_TIMEOUT_MS
): Promise<ClaudeInvocationResult> {
  return new Promise((resolve) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--output-format",
        "stream-json",
        "--include-partial-messages",
        "--verbose",
        "--permission-mode",
        "bypassPermissions",
        ...args,
      ],
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    let lineBuffer = "";
    let timedOut = false;
    let finalResult: Omit<ClaudeInvocationResult, "exitCode"> | null = null;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      lineBuffer += text;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = parseStreamJsonLine(line);
        if (!event) continue;
        if (event.type === "delta") {
          onDelta(event.text);
        } else {
          finalResult = event.result;
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({
          status: "error",
          output: `Le CLI claude n'a pas terminé dans le délai imparti (${Math.round(timeoutMs / 1000)}s) — processus interrompu.`,
          raw: stdout,
          sessionId: finalResult?.sessionId ?? null,
          exitCode,
        });
        return;
      }
      if (exitCode !== 0) {
        resolve({
          status: "error",
          output: stderr || `claude a quitté avec le code ${exitCode}`,
          raw: stdout,
          sessionId: finalResult?.sessionId ?? null,
          exitCode,
        });
        return;
      }
      if (!finalResult) {
        resolve({
          status: "error",
          output: "Sortie stream-json illisible depuis le CLI claude.",
          raw: stdout,
          sessionId: null,
          exitCode,
        });
        return;
      }
      resolve({ ...finalResult, exitCode });
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
