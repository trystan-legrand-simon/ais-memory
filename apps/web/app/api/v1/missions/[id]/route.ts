import { NextRequest, NextResponse } from "next/server";
import {
  countMissionMessages,
  getMission,
  getMissionMessages,
  isMissionBusy,
} from "@/lib/missions";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  _req: NextRequest,
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

  return NextResponse.json({
    ...mission,
    messageCount: countMissionMessages(mission.id),
    busy: isMissionBusy(mission.id),
    messages: getMissionMessages(mission.id),
  });
}
