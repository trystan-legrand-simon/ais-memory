import { describe, expect, it } from "vitest";
import { diffById, diffRoutines, type RoutineRow } from "./live-diff";

describe("diffById", () => {
  it("returns all rows as new when the cursor is 0", () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { newRows, nextCursor } = diffById(rows, 0);
    expect(newRows).toEqual(rows);
    expect(nextCursor).toBe(3);
  });

  it("returns only rows past the cursor", () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const { newRows, nextCursor } = diffById(rows, 2);
    expect(newRows).toEqual([{ id: 3 }, { id: 4 }]);
    expect(nextCursor).toBe(4);
  });

  it("returns nothing new and keeps the cursor when no rows are past it", () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const { newRows, nextCursor } = diffById(rows, 2);
    expect(newRows).toEqual([]);
    expect(nextCursor).toBe(2);
  });

  it("keeps the previous cursor when the row set is empty", () => {
    const { newRows, nextCursor } = diffById([], 5);
    expect(newRows).toEqual([]);
    expect(nextCursor).toBe(5);
  });
});

describe("diffRoutines", () => {
  function routine(overrides: Partial<RoutineRow> = {}): RoutineRow {
    return { id: 1, enabled: true, lastFiredAt: null, ...overrides };
  }

  it("treats a routine with no prior snapshot as changed", () => {
    const { changedRows, nextSnapshots } = diffRoutines(
      [routine({ id: 1 })],
      new Map()
    );
    expect(changedRows).toHaveLength(1);
    expect(nextSnapshots.get(1)).toEqual({ enabled: true, lastFiredAt: null });
  });

  it("detects an enabled flag change", () => {
    const previous = new Map([[1, { enabled: true, lastFiredAt: null }]]);
    const { changedRows } = diffRoutines(
      [routine({ id: 1, enabled: false })],
      previous
    );
    expect(changedRows).toEqual([routine({ id: 1, enabled: false })]);
  });

  it("detects a lastFiredAt change", () => {
    const previous = new Map([[1, { enabled: true, lastFiredAt: null }]]);
    const { changedRows } = diffRoutines(
      [routine({ id: 1, lastFiredAt: "2026-09-28T22:00:00.000Z" })],
      previous
    );
    expect(changedRows).toHaveLength(1);
  });

  it("reports nothing changed when the snapshot is identical", () => {
    const previous = new Map([[1, { enabled: true, lastFiredAt: null }]]);
    const { changedRows } = diffRoutines([routine({ id: 1 })], previous);
    expect(changedRows).toEqual([]);
  });

  it("builds snapshots for all rows regardless of change", () => {
    const previous = new Map([[1, { enabled: true, lastFiredAt: null }]]);
    const { nextSnapshots } = diffRoutines(
      [routine({ id: 1 }), routine({ id: 2, enabled: false })],
      previous
    );
    expect(nextSnapshots.size).toBe(2);
    expect(nextSnapshots.get(2)).toEqual({ enabled: false, lastFiredAt: null });
  });
});
