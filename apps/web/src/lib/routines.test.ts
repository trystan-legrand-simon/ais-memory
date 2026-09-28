import { describe, expect, it, afterEach } from "vitest";
import {
  createRoutine,
  deleteRoutine,
  disableRoutine,
  getRoutine,
  isValidDayOfWeek,
  isValidTime,
  listEnabledRoutines,
  listRoutines,
  markRoutineFired,
  updateRoutine,
} from "./routines";

const createdIds: number[] = [];

afterEach(() => {
  while (createdIds.length) {
    deleteRoutine(createdIds.pop()!);
  }
});

function create(overrides: Partial<Parameters<typeof createRoutine>[0]> = {}) {
  const routine = createRoutine({
    slug: "relecteur-jury",
    frequency: "daily",
    time: "22:00",
    dayOfWeek: null,
    ...overrides,
  });
  createdIds.push(routine.id);
  return routine;
}

describe("routines CRUD round-trip", () => {
  it("creates a daily routine and reads it back", () => {
    const routine = create();
    const fetched = getRoutine(routine.id);
    expect(fetched).toEqual(routine);
    expect(routine.frequency).toBe("daily");
    expect(routine.time).toBe("22:00");
    expect(routine.dayOfWeek).toBeNull();
    expect(routine.enabled).toBe(true);
    expect(routine.lastFiredAt).toBeNull();
  });

  it("creates a weekly routine with a day of week", () => {
    const routine = create({ frequency: "weekly", time: "09:00", dayOfWeek: 1 });
    expect(routine.frequency).toBe("weekly");
    expect(routine.dayOfWeek).toBe(1);
  });

  it("discards dayOfWeek for daily routines even if provided", () => {
    const routine = create({ frequency: "daily", dayOfWeek: 3 });
    expect(routine.dayOfWeek).toBeNull();
  });

  it("appears in listRoutines and listEnabledRoutines", () => {
    const routine = create();
    expect(listRoutines().map((r) => r.id)).toContain(routine.id);
    expect(listEnabledRoutines().map((r) => r.id)).toContain(routine.id);
  });

  it("updates enabled/time/frequency and persists the change", () => {
    const routine = create();
    const updated = updateRoutine(routine.id, { enabled: false, time: "07:30" });
    expect(updated?.enabled).toBe(false);
    expect(updated?.time).toBe("07:30");
    expect(listEnabledRoutines().map((r) => r.id)).not.toContain(routine.id);
  });

  it("clears dayOfWeek when switching an existing weekly routine back to daily", () => {
    const routine = create({ frequency: "weekly", time: "09:00", dayOfWeek: 2 });
    const updated = updateRoutine(routine.id, { frequency: "daily" });
    expect(updated?.dayOfWeek).toBeNull();
  });

  it("disableRoutine flips enabled without touching other fields", () => {
    const routine = create();
    disableRoutine(routine.id);
    const fetched = getRoutine(routine.id);
    expect(fetched?.enabled).toBe(false);
    expect(fetched?.time).toBe(routine.time);
  });

  it("markRoutineFired stores the timestamp", () => {
    const routine = create();
    const firedAt = new Date().toISOString();
    markRoutineFired(routine.id, firedAt);
    expect(getRoutine(routine.id)?.lastFiredAt).toBe(firedAt);
  });

  it("deleteRoutine removes it and reports success", () => {
    const routine = create();
    createdIds.pop();
    expect(deleteRoutine(routine.id)).toBe(true);
    expect(getRoutine(routine.id)).toBeNull();
    expect(deleteRoutine(routine.id)).toBe(false);
  });
});

describe("isValidTime", () => {
  it("accepts HH:MM within range", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("09:05")).toBe(true);
  });

  it("rejects malformed or out-of-range values", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:05")).toBe(false);
    expect(isValidTime("09:60")).toBe(false);
    expect(isValidTime("")).toBe(false);
    expect(isValidTime(null)).toBe(false);
  });
});

describe("isValidDayOfWeek", () => {
  it("accepts integers 0 through 6", () => {
    expect(isValidDayOfWeek(0)).toBe(true);
    expect(isValidDayOfWeek(6)).toBe(true);
  });

  it("rejects out-of-range or non-integer values", () => {
    expect(isValidDayOfWeek(7)).toBe(false);
    expect(isValidDayOfWeek(-1)).toBe(false);
    expect(isValidDayOfWeek(1.5)).toBe(false);
    expect(isValidDayOfWeek("1")).toBe(false);
    expect(isValidDayOfWeek(null)).toBe(false);
  });
});
