import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import { AgentAlreadyRunningError, runAgent } from "@/lib/run-agent";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }

  try {
    const result = await runAgent(slug);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AgentAlreadyRunningError) {
      return NextResponse.json(
        { error: "Cet agent est déjà en cours d'exécution" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
