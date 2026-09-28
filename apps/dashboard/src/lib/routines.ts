import { db } from "./db";

export type RoutineFrequency = "daily" | "weekly";

export interface Routine {
  id: number;
  slug: string;
  frequency: RoutineFrequency;
  time: string; // "HH:MM", heure locale 24h
  dayOfWeek: number | null; // 0 (dimanche) à 6 (samedi), null si daily
  enabled: boolean;
  lastFiredAt: string | null;
  createdAt: string;
}

export interface RoutineInput {
  slug: string;
  frequency: RoutineFrequency;
  time: string;
  dayOfWeek: number | null;
}

export interface RoutineRow {
  id: number;
  slug: string;
  frequency: string;
  time: string;
  day_of_week: number | null;
  enabled: number;
  last_fired_at: string | null;
  created_at: string;
}

export function toRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    slug: row.slug,
    frequency: row.frequency as RoutineFrequency,
    time: row.time,
    dayOfWeek: row.day_of_week,
    enabled: row.enabled === 1,
    lastFiredAt: row.last_fired_at,
    createdAt: row.created_at,
  };
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

export function isValidDayOfWeek(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6;
}

export function listRoutines(): Routine[] {
  const rows = db
    .prepare("SELECT * FROM routines ORDER BY id DESC")
    .all() as unknown as RoutineRow[];
  return rows.map(toRoutine);
}

export function listEnabledRoutines(): Routine[] {
  const rows = db
    .prepare("SELECT * FROM routines WHERE enabled = 1")
    .all() as unknown as RoutineRow[];
  return rows.map(toRoutine);
}

export function getRoutine(id: number): Routine | null {
  const row = db
    .prepare("SELECT * FROM routines WHERE id = ?")
    .get(id) as unknown as RoutineRow | undefined;
  return row ? toRoutine(row) : null;
}

export function createRoutine(input: RoutineInput): Routine {
  const result = db
    .prepare(
      `INSERT INTO routines (slug, frequency, time, day_of_week, enabled, last_fired_at, created_at)
       VALUES (?, ?, ?, ?, 1, NULL, ?)`
    )
    .run(
      input.slug,
      input.frequency,
      input.time,
      input.frequency === "weekly" ? input.dayOfWeek : null,
      new Date().toISOString()
    );
  const created = getRoutine(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error("Échec de la création de la routine");
  }
  return created;
}

export function updateRoutine(
  id: number,
  patch: Partial<Pick<Routine, "enabled" | "time" | "dayOfWeek" | "frequency">>
): Routine | null {
  const existing = getRoutine(id);
  if (!existing) return null;

  const next = { ...existing, ...patch };
  db.prepare(
    `UPDATE routines SET frequency = ?, time = ?, day_of_week = ?, enabled = ? WHERE id = ?`
  ).run(
    next.frequency,
    next.time,
    next.frequency === "weekly" ? next.dayOfWeek : null,
    next.enabled ? 1 : 0,
    id
  );
  return getRoutine(id);
}

export function deleteRoutine(id: number): boolean {
  const result = db.prepare("DELETE FROM routines WHERE id = ?").run(id);
  return result.changes > 0;
}

export function markRoutineFired(id: number, firedAt: string): void {
  db.prepare("UPDATE routines SET last_fired_at = ? WHERE id = ?").run(
    firedAt,
    id
  );
}

export function disableRoutine(id: number): void {
  db.prepare("UPDATE routines SET enabled = 0 WHERE id = ?").run(id);
}
