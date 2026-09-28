import { invokeClaude, type ClaudeInvocationResult } from "./claude-cli";
import { recordRun } from "./runs";

export type RunResult = ClaudeInvocationResult;

const DEFAULT_PROMPT =
  "Effectue ta mission sur le dossier de ce dépôt telle que décrite dans tes instructions.";

const runningAgents = new Set<string>();

export class AgentAlreadyRunningError extends Error {}

export function isAgentRunning(slug: string): boolean {
  return runningAgents.has(slug);
}

export async function runAgent(slug: string): Promise<RunResult> {
  if (runningAgents.has(slug)) {
    throw new AgentAlreadyRunningError(`Agent already running: ${slug}`);
  }
  runningAgents.add(slug);
  const startedAt = new Date().toISOString();
  try {
    const result = await invokeClaude(["--agent", slug, DEFAULT_PROMPT]);
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
