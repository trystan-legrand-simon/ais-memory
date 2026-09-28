import fs from "node:fs/promises";
import { MCP_FILE } from "./repo-paths";

export class InvalidMcpConfigError extends Error {}

export interface McpServerConfig {
  type?: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

function isValidConfig(value: unknown): value is McpConfig {
  if (typeof value !== "object" || value === null) return false;
  const servers = (value as Record<string, unknown>).mcpServers;
  return typeof servers === "object" && servers !== null && !Array.isArray(servers);
}

export async function readMcpConfig(): Promise<McpConfig> {
  let raw: string;
  try {
    raw = await fs.readFile(MCP_FILE, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { mcpServers: {} };
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidMcpConfigError(
      `${MCP_FILE} contient du JSON invalide — corrigez-le à la main avant de réessayer.`
    );
  }
  if (!isValidConfig(parsed)) {
    throw new InvalidMcpConfigError(
      `${MCP_FILE} doit contenir un objet "mcpServers".`
    );
  }
  return parsed;
}

// Atomic write, same rationale as writeSettings(): a crash mid-write must
// never leave .mcp.json truncated since Claude Code reads it on startup.
export async function writeMcpConfig(config: McpConfig): Promise<void> {
  const tmpFile = `${MCP_FILE}.tmp`;
  const serialized = JSON.stringify(config, null, 2) + "\n";
  await fs.writeFile(tmpFile, serialized, "utf-8");
  await fs.rename(tmpFile, MCP_FILE);
}
