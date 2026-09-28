import { NextRequest, NextResponse } from "next/server";
import {
  MissionAlreadyBusyError,
  getMission,
  sendMissionMessage,
} from "@/lib/missions";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const mission = getMission(id);
  if (!mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string" || body.message.trim() === "") {
    return NextResponse.json(
      { error: "Champ attendu: message (string non vide)" },
      { status: 400 }
    );
  }

  try {
    const reply = await sendMissionMessage(id, body.message);
    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof MissionAlreadyBusyError) {
      return NextResponse.json(
        { error: "Une réponse est déjà en cours pour cette mission" },
        { status: 409 }
      );
    }
    throw err;
  }
}
