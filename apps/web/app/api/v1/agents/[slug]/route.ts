import { NextRequest, NextResponse } from "next/server";
import { getAgent, writeAgent } from "@/lib/agents";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }
  return NextResponse.json(agent);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();

  if (
    typeof body.description !== "string" ||
    typeof body.prompt !== "string" ||
    !Array.isArray(body.tools)
  ) {
    return NextResponse.json(
      { error: "Champs attendus: description (string), tools (string[]), prompt (string)" },
      { status: 400 }
    );
  }

  try {
    const agent = await writeAgent(slug, {
      description: body.description,
      tools: body.tools,
      prompt: body.prompt,
    });
    return NextResponse.json(agent);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 404 }
    );
  }
}
