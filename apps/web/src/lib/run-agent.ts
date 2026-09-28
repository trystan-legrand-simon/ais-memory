import {
  invokeClaude,
  invokeClaudeStreaming,
  DEFAULT_INVOCATION_TIMEOUT_MS,
  HUB_INVOCATION_TIMEOUT_MS,
  type ClaudeInvocationResult,
} from "./claude-cli";
import { getAgent } from "./agents";
import { recordRun } from "./runs";

export type RunResult = ClaudeInvocationResult;

const DEFAULT_PROMPT =
  "Effectue ta mission sur le dossier de ce dépôt telle que décrite dans tes instructions.";

const runningAgents = new Set<string>();

export class AgentAlreadyRunningError extends Error {}

export function isAgentRunning(slug: string): boolean {
  return runningAgents.has(slug);
}

// A hub agent (delegates to others via `Agent(...)`) chains several
// sequential sub-invocations by design, so it needs far more time than a
// single leaf agent — see claude-cli.ts's DEFAULT/HUB constants.
async function resolveTimeout(slug: string): Promise<number> {
  const agent = await getAgent(slug);
  const isHub = agent?.tools.some((t) => t.startsWith("Agent(")) ?? false;
  return isHub ? HUB_INVOCATION_TIMEOUT_MS : DEFAULT_INVOCATION_TIMEOUT_MS;
}

export async function runAgent(slug: string): Promise<RunResult> {
  if (runningAgents.has(slug)) {
    throw new AgentAlreadyRunningError(`Agent already running: ${slug}`);
  }
  runningAgents.add(slug);
  const startedAt = new Date().toISOString();
  try {
    const timeoutMs = await resolveTimeout(slug);
    const result = await invokeClaude(
      ["--agent", slug, DEFAULT_PROMPT],
      timeoutMs
    );
    recordRun({
      slug,
      status: result.status,
      output: result.output,
      exitCode: result.exitCode,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
  } finally {
    runningAgents.delete(slug);
  }
}

// Streaming counterpart used by the interactive "Lancer" button (Nodes page)
// so the RunOutputPanel can show text as it's generated instead of a static
// "running" badge for up to HUB_INVOCATION_TIMEOUT_MS — see run-agent's
// non-streaming twin above, used by the routine scheduler where nothing is
// listening for incremental output anyway.
export async function runAgentStreaming(
  slug: string,
  onDelta: (text: string) => void
): Promise<RunResult> {
  if (runningAgents.has(slug)) {
    throw new AgentAlreadyRunningError(`Agent already running: ${slug}`);
  }
  runningAgents.add(slug);
  const startedAt = new Date().toISOString();
  try {
    const timeoutMs = await resolveTimeout(slug);
    const result = await invokeClaudeStreaming(
      ["--agent", slug, DEFAULT_PROMPT],
      onDelta,
      timeoutMs
    );
    recordRun({
      slug,
      status: result.status,
      output: result.output,
      exitCode: result.exitCode,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
  } finally {
    runningAgents.delete(slug);
  }
}
