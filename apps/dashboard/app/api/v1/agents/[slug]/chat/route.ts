import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import {
  ChatAlreadyBusyError,
  getChatHistory,
  resetChat,
  sendChatMessage,
} from "@/lib/chat";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }
  return NextResponse.json({ messages: getChatHistory(slug) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }

  const body = await req.json();
  if (typeof body.message !== "string" || body.message.trim() === "") {
    return NextResponse.json(
      { error: "Champ attendu: message (string non vide)" },
      { status: 400 }
    );
  }

  try {
    const messages = await sendChatMessage(slug, body.message);
    return NextResponse.json({ messages });
  } catch (err) {
    if (err instanceof ChatAlreadyBusyError) {
      return NextResponse.json(
        { error: "Une réponse est déjà en cours pour cet agent" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  resetChat(slug);
  return NextResponse.json({ ok: true });
}
