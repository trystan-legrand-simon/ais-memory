import { NextRequest, NextResponse } from "next/server";
import {
  deleteRoutine,
  getRoutine,
  isValidDayOfWeek,
  isValidTime,
  updateRoutine,
  type RoutineFrequency,
} from "@/lib/routines";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const existing = getRoutine(id);
  if (!existing) {
    return NextResponse.json({ error: "Routine introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const patch: Partial<{
    enabled: boolean;
    time: string;
    dayOfWeek: number | null;
    frequency: RoutineFrequency;
  }> = {};

  if ("enabled" in body) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled doit être un booléen" }, { status: 400 });
    }
    patch.enabled = body.enabled;
  }

  if ("frequency" in body) {
    if (body.frequency !== "daily" && body.frequency !== "weekly") {
      return NextResponse.json(
        { error: "Fréquence invalide (daily ou weekly attendu)" },
        { status: 400 }
      );
    }
    patch.frequency = body.frequency;
  }

  if ("time" in body) {
    if (!isValidTime(body.time)) {
      return NextResponse.json(
        { error: "Heure invalide (format HH:MM attendu)" },
        { status: 400 }
      );
    }
    patch.time = body.time;
  }

  const effectiveFrequency = patch.frequency ?? existing.frequency;
  if ("dayOfWeek" in body) {
    if (effectiveFrequency === "weekly" && !isValidDayOfWeek(body.dayOfWeek)) {
      return NextResponse.json(
        { error: "Jour de la semaine invalide (0 à 6 attendu) pour une routine hebdomadaire" },
        { status: 400 }
      );
    }
    patch.dayOfWeek = effectiveFrequency === "weekly" ? (body.dayOfWeek as number) : null;
  }

  const updated = updateRoutine(id, patch);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const deleted = deleteRoutine(id);
  if (!deleted) {
    return NextResponse.json({ error: "Routine introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
