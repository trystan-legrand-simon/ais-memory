import { NextRequest, NextResponse } from "next/server";
import {
  AgentSlugTakenError,
  InvalidSlugError,
  addDelegate,
  createAgent,
  listAgents,
} from "@/lib/agents";
import { readGraph, writeGraph } from "@/lib/graph-store";

export async function GET() {
  const agents = await listAgents();
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (
    typeof body.slug !== "string" ||
    typeof body.description !== "string" ||
    typeof body.prompt !== "string" ||
    !Array.isArray(body.tools) ||
    (body.attachTo !== undefined && typeof body.attachTo !== "string")
  ) {
    return NextResponse.json(
      {
        error:
          "Champs attendus: slug (string), description (string), tools (string[]), prompt (string), attachTo (string, optionnel)",
      },
      { status: 400 }
    );
  }

  try {
    const agent = await createAgent(body.slug, {
      description: body.description,
      tools: body.tools,
      prompt: body.prompt,
    });

    if (body.attachTo) {
      await addDelegate(body.attachTo, agent.slug);

      const validSlugs = (await listAgents()).map((a) => a.slug);
      const graph = await readGraph();
      const siblingCount = graph.edges.filter(
        (e) => e.from === body.attachTo
      ).length;
      await writeGraph(
        {
          nodes: graph.nodes,
          edges: [
            ...graph.edges,
            { from: body.attachTo, to: agent.slug, order: siblingCount + 1 },
          ],
        },
        validSlugs
      );
    }

    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    const status =
      err instanceof InvalidSlugError
        ? 400
        : err instanceof AgentSlugTakenError
          ? 409
          : 400;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status }
    );
  }
}
