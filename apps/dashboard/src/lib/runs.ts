import { db } from "./db";

export interface RunRecord {
  id: number;
  slug: string;
  status: "success" | "error";
  output: string;
  exitCode: number | null;
  startedAt: string;
  finishedAt: string;
}

export function recordRun(run: {
  slug: string;
  status: "success" | "error";
  output: string;
  exitCode: number | null;
  startedAt: string;
  finishedAt: string;
}): void {
  db.prepare(
    `INSERT INTO runs (slug, status, output, exit_code, started_at, finished_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    run.slug,
    run.status,
    run.output,
    run.exitCode,
    run.startedAt,
    run.finishedAt
  );
}

export interface RunRow {
  id: number;
  slug: string;
  status: "success" | "error";
  output: string;
  exit_code: number | null;
  started_at: string;
  finished_at: string;
}

export function toRunRecord(row: RunRow): RunRecord {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    output: row.output,
    exitCode: row.exit_code,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export function listRuns(limit = 50): RunRecord[] {
  const rows = db
    .prepare("SELECT * FROM runs ORDER BY id DESC LIMIT ?")
    .all(limit) as unknown as RunRow[];
  return rows.map(toRunRecord);
}

export function listRunsForAgent(slug: string, limit = 20): RunRecord[] {
  const rows = db
    .prepare("SELECT * FROM runs WHERE slug = ? ORDER BY id DESC LIMIT ?")
    .all(slug, limit) as unknown as RunRow[];
  return rows.map(toRunRecord);
}
