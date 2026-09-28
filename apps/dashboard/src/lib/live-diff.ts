// Pure diff/cursor logic for the WS poller (src/ws-server.ts), kept separate
// from the actual DB access and networking so it's testable without a real
// SQLite connection or a live poll loop.

export interface IdRow {
  id: number;
}

export interface RoutineSnapshot {
  enabled: boolean;
  lastFiredAt: string | null;
}

export interface RoutineRow extends IdRow, RoutineSnapshot {}

// Runs/chat messages only ever get inserted, never updated — everything with
// id > cursor is new. Rows must be passed sorted by id ascending.
export function diffById<T extends IdRow>(
  rows: T[],
  lastSeenId: number
): { newRows: T[]; nextCursor: number } {
  const newRows = rows.filter((row) => row.id > lastSeenId);
  const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : lastSeenId;
  return { newRows, nextCursor };
}

// Routines get updated in place (enabled/lastFiredAt change on an existing
// row) rather than inserted, so they need a snapshot comparison instead of an
// id cursor. Rows without a prior snapshot (new routines) count as changed.
export function diffRoutines(
  rows: RoutineRow[],
  previousSnapshots: Map<number, RoutineSnapshot>
): { changedRows: RoutineRow[]; nextSnapshots: Map<number, RoutineSnapshot> } {
  const changedRows: RoutineRow[] = [];
  const nextSnapshots = new Map<number, RoutineSnapshot>();

  for (const row of rows) {
    const previous = previousSnapshots.get(row.id);
    const changed =
      !previous ||
      previous.enabled !== row.enabled ||
      previous.lastFiredAt !== row.lastFiredAt;
    if (changed) changedRows.push(row);
    nextSnapshots.set(row.id, { enabled: row.enabled, lastFiredAt: row.lastFiredAt });
  }

  return { changedRows, nextSnapshots };
}
