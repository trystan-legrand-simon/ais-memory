import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import {
  countMissionMessages,
  createMission,
  getMissionByChannelId,
  isMissionBusy,
} from "@/lib/missions";

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json(
      { error: "Paramètre manquant: channelId" },
      { status: 400 }
    );
  }

  const mission = getMissionByChannelId(channelId);
  if (!mission) {
    return NextResponse.json(
      { error: "Aucune mission liée à ce canal" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...mission,
    messageCount: countMissionMessages(mission.id),
    busy: isMissionBusy(mission.id),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const { agentSlug, discordChannelId, title } = body as Record<
    string,
    unknown
  >;

  if (typeof agentSlug !== "string" || !agentSlug) {
    return NextResponse.json({ error: "Agent manquant" }, { status: 400 });
  }
  const agent = await getAgent(agentSlug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
  }

  if (typeof discordChannelId !== "string" || !discordChannelId) {
    return NextResponse.json(
      { error: "discordChannelId manquant" },
      { status: 400 }
    );
  }

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Titre manquant" }, { status: 400 });
  }

  const existing = getMissionByChannelId(discordChannelId);
  if (existing) {
    return NextResponse.json(
      { error: "Ce canal a déjà une mission", mission: existing },
      { status: 409 }
    );
  }

  const mission = createMission({ agentSlug, discordChannelId, title });
  return NextResponse.json(mission, { status: 201 });
}
