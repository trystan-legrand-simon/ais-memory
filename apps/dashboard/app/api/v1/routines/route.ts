import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import {
  createRoutine,
  isValidDayOfWeek,
  isValidTime,
  listRoutines,
  type RoutineFrequency,
} from "@/lib/routines";

export async function GET() {
  return NextResponse.json(listRoutines());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { slug, frequency, time, dayOfWeek } = body as Record<string, unknown>;

  if (typeof slug !== "string" || !slug) {
    return NextResponse.json({ error: "Agent manquant" }, { status: 400 });
  }
  const agent = await getAgent(slug);
  if (!agent) {
    return NextResponse.json({ error: "Agent introuvable" }, { status: 400 });
  }

  if (frequency !== "daily" && frequency !== "weekly") {
    return NextResponse.json(
      { error: "Fréquence invalide (daily ou weekly attendu)" },
      { status: 400 }
    );
  }

  if (!isValidTime(time)) {
    return NextResponse.json(
      { error: "Heure invalide (format HH:MM attendu)" },
      { status: 400 }
    );
  }

  if (frequency === "weekly" && !isValidDayOfWeek(dayOfWeek)) {
    return NextResponse.json(
      { error: "Jour de la semaine invalide (0 à 6 attendu) pour une routine hebdomadaire" },
      { status: 400 }
    );
  }

  const routine = createRoutine({
    slug,
    frequency: frequency as RoutineFrequency,
    time,
    dayOfWeek: frequency === "weekly" ? (dayOfWeek as number) : null,
  });
  return NextResponse.json(routine, { status: 201 });
}
