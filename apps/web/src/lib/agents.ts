import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { AGENTS_DIR } from "./repo-paths";

export interface Agent {
  slug: string;
  name: string;
  description: string;
  tools: string[];
  prompt: string;
}

export interface AgentUpdate {
  description: string;
  tools: string[];
  prompt: string;
}

function agentFilePath(slug: string): string {
  return path.join(AGENTS_DIR, `${slug}.md`);
}

async function listAgentSlugs(): Promise<string[]> {
  const entries = await fs.readdir(AGENTS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.slice(0, -3))
    .sort();
}

// A plain `,`-split breaks on entries like `Agent(relecteur-jury,
// verificateur-referentiel)`, which delegate to specific named sub-agents and
// contain commas of their own — split only on commas outside of parentheses.
function splitToolsList(raw: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of raw) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.filter(Boolean);
}

export function parseAgentFile(slug: string, raw: string): Agent {
  const { data, content } = matter(raw);
  const toolsRaw = typeof data.tools === "string" ? data.tools : "";
  return {
    slug,
    name: typeof data.name === "string" ? data.name : slug,
    description: typeof data.description === "string" ? data.description : "",
    tools: splitToolsList(toolsRaw),
    prompt: content.replace(/^\n/, ""),
  };
}

export async function listAgents(): Promise<Agent[]> {
  const slugs = await listAgentSlugs();
  const agents = await Promise.all(
    slugs.map(async (slug) => {
      const raw = await fs.readFile(agentFilePath(slug), "utf-8");
      return parseAgentFile(slug, raw);
    })
  );
  return agents;
}

export async function getAgent(slug: string): Promise<Agent | null> {
  const slugs = await listAgentSlugs();
  if (!slugs.includes(slug)) return null;
  const raw = await fs.readFile(agentFilePath(slug), "utf-8");
  return parseAgentFile(slug, raw);
}

// Hand-rolled instead of matter.stringify(): js-yaml's dump() folds long
// lines and quotes plain-looking strings (e.g. `tools: 'Read, Grep, Glob'`),
// producing large diffs on files that are otherwise hand-written and
// git-tracked. These 3 frontmatter fields are always single-line scalars in
// this repo's agent files, so a minimal plain-scalar serializer keeps the
// existing unquoted, single-line style and only falls back to quoting when
// the value genuinely isn't safe as a plain YAML scalar.
function yamlPlainScalar(value: string): string {
  const needsQuoting =
    value === "" ||
    /^\s|\s$/.test(value) ||
    /[\n\r\t]/.test(value) ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /:(\s|$)/.test(value) ||
    / #/.test(value) ||
    /^(true|false|null|yes|no|on|off)$/i.test(value) ||
    /^[+-]?\d+(\.\d+)?$/.test(value);
  return needsQuoting ? JSON.stringify(value) : value;
}

export function buildAgentFileContent(
  slug: string,
  update: AgentUpdate
): string {
  const frontmatter = [
    "---",
    `name: ${slug}`,
    `description: ${yamlPlainScalar(update.description)}`,
    `tools: ${yamlPlainScalar(update.tools.join(", "))}`,
    "---",
    "",
    "",
  ].join("\n");
  return frontmatter + update.prompt;
}

export async function writeAgent(
  slug: string,
  update: AgentUpdate
): Promise<Agent> {
  const slugs = await listAgentSlugs();
  if (!slugs.includes(slug)) {
    throw new Error(`Unknown agent: ${slug}`);
  }
  const output = buildAgentFileContent(slug, update);
  await fs.writeFile(agentFilePath(slug), output, "utf-8");

  return parseAgentFile(slug, output);
}

export class InvalidSlugError extends Error {}
export class AgentSlugTakenError extends Error {}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function createAgent(
  slug: string,
  update: AgentUpdate
): Promise<Agent> {
  if (!SLUG_RE.test(slug)) {
    throw new InvalidSlugError(
      "Le slug doit être en minuscules, chiffres et tirets uniquement (ex. mon-agent)."
    );
  }
  const slugs = await listAgentSlugs();
  if (slugs.includes(slug)) {
    throw new AgentSlugTakenError(`Un agent "${slug}" existe déjà.`);
  }
  const output = buildAgentFileContent(slug, update);
  await fs.writeFile(agentFilePath(slug), output, "utf-8");
  return parseAgentFile(slug, output);
}

// Wires a new agent into an existing hub's delegation list — appends
// `newSlug` inside the hub's `Agent(...)` tool entry (creating one if the
// hub had none yet, i.e. promoting a plain agent into a hub), without
// touching the rest of its tools or its prompt.
export async function addDelegate(
  hubSlug: string,
  newSlug: string
): Promise<Agent> {
  const hub = await getAgent(hubSlug);
  if (!hub) {
    throw new Error(`Unknown agent: ${hubSlug}`);
  }
  const delegateIdx = hub.tools.findIndex((t) => t.startsWith("Agent("));
  const nextTools = [...hub.tools];
  if (delegateIdx === -1) {
    nextTools.push(`Agent(${newSlug})`);
  } else {
    const inner = hub.tools[delegateIdx].slice("Agent(".length, -1);
    const names = inner
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.includes(newSlug)) names.push(newSlug);
    nextTools[delegateIdx] = `Agent(${names.join(", ")})`;
  }
  return writeAgent(hubSlug, {
    description: hub.description,
    tools: nextTools,
    prompt: hub.prompt,
  });
}
