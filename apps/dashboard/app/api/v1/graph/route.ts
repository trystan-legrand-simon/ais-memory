import { NextRequest, NextResponse } from "next/server";
import { listAgents } from "@/lib/agents";
import { readGraph, writeGraph } from "@/lib/graph-store";

export async function GET() {
  const graph = await readGraph();
  return NextResponse.json(graph);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return NextResponse.json(
      { error: "Champs attendus: nodes (array), edges (array)" },
      { status: 400 }
    );
  }

  const agents = await listAgents();
  const validSlugs = agents.map((a) => a.slug);

  try {
    const graph = await writeGraph(
      { nodes: body.nodes, edges: body.edges },
      validSlugs
    );
    return NextResponse.json(graph);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 400 }
    );
  }
}
