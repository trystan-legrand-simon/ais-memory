import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import {
  ChatAlreadyBusyError,
  getChatHistory,
  isChatBusy,
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

  // Checked before opening the stream so a busy agent gets a plain JSON 409
  // instead of a ReadableStream response that would immediately need
  // tearing down. sendChatMessage() re-checks this same guard right before
  // insert, closing the race between this check and the stream start.
  if (isChatBusy(slug)) {
    return NextResponse.json(
      { error: "Une réponse est déjà en cours pour cet agent" },
      { status: 409 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Never lets a broken pipe (client gone) stop the underlying CLI
      // invocation — see docs/superpowers/specs/2026-09-28-chat-streaming-design.md.
      function safeEnqueue(frame: object) {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
        } catch {
          // Stream already closed client-side — ignore, keep running.
        }
      }
      function safeClose() {
        try {
          controller.close();
        } catch {
          // Already closed — ignore.
        }
      }

      sendChatMessage(slug, body.message, (text) => {
        safeEnqueue({ type: "delta", text });
      })
        .then(() => {
          safeEnqueue({ type: "done" });
          safeClose();
        })
        .catch((err) => {
          const message =
            err instanceof ChatAlreadyBusyError
              ? "Une réponse est déjà en cours pour cet agent"
              : err instanceof Error
                ? err.message
                : "Erreur inconnue";
          safeEnqueue({ type: "error", message });
          safeClose();
        });
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  resetChat(slug);
  return NextResponse.json({ ok: true });
}
