import { NextRequest, NextResponse } from "next/server";
import {
  InvalidMcpConfigError,
  readMcpConfig,
  writeMcpConfig,
  type McpServerConfig,
} from "@/lib/mcp-config";

export async function GET() {
  try {
    const config = await readMcpConfig();
    return NextResponse.json(config);
  } catch (err) {
    const message =
      err instanceof InvalidMcpConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isValidServerConfig(value: unknown): value is McpServerConfig {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type !== undefined && typeof v.type !== "string") return false;
  if (v.command !== undefined && typeof v.command !== "string") return false;
  if (v.url !== undefined && typeof v.url !== "string") return false;
  if (
    v.args !== undefined &&
    !(Array.isArray(v.args) && v.args.every((a) => typeof a === "string"))
  )
    return false;
  return true;
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (
    typeof body !== "object" ||
    body === null ||
    typeof body.mcpServers !== "object" ||
    body.mcpServers === null ||
    Array.isArray(body.mcpServers)
  ) {
    return NextResponse.json(
      { error: "Le corps doit contenir un objet mcpServers" },
      { status: 400 }
    );
  }

  for (const [name, server] of Object.entries(
    body.mcpServers as Record<string, unknown>
  )) {
    if (!isValidServerConfig(server)) {
      return NextResponse.json(
        { error: `Configuration invalide pour le serveur "${name}"` },
        { status: 400 }
      );
    }
  }

  await writeMcpConfig(body as { mcpServers: Record<string, McpServerConfig> });
  return NextResponse.json(body);
}
