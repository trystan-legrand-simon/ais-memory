import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import {
  AgentAlreadyRunningError,
  isAgentRunning,
  runAgentStreaming,
} from "@/lib/run-agent";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }

  // Checked before opening the stream so an already-running agent gets a
  // plain JSON 409 instead of a ReadableStream response immediately needing
  // teardown — same rationale as the chat route's equivalent guard.
  if (isAgentRunning(slug)) {
    return NextResponse.json(
      { error: "Cet agent est déjà en cours d'exécution" },
      { status: 409 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
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

      runAgentStreaming(slug, (text) => {
        safeEnqueue({ type: "delta", text });
      })
        .then((result) => {
          safeEnqueue({ type: "done", result });
          safeClose();
        })
        .catch((err) => {
          const message =
            err instanceof AgentAlreadyRunningError
              ? "Cet agent est déjà en cours d'exécution"
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
