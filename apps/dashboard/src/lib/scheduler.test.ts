import { describe, expect, it } from "vitest";
import { isRoutineDue } from "./scheduler";
import type { Routine } from "./routines";

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 1,
    slug: "relecteur-jury",
    frequency: "daily",
    time: "22:00",
    dayOfWeek: null,
    enabled: true,
    lastFiredAt: null,
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

// Local time constructor — isRoutineDue reads getHours()/getMinutes()/getDay().
function at(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return new Date(year, month, day, hours, minutes, 0, 0);
}

describe("isRoutineDue — daily", () => {
  it("is due when the current time matches exactly", () => {
    const r = routine({ time: "22:00" });
    expect(isRoutineDue(r, at(2026, 8, 28, 22, 0))).toBe(true);
  });

  it("is not due outside the scheduled minute", () => {
    const r = routine({ time: "22:00" });
    expect(isRoutineDue(r, at(2026, 8, 28, 22, 1))).toBe(false);
    expect(isRoutineDue(r, at(2026, 8, 28, 21, 59))).toBe(false);
  });
});

describe("isRoutineDue — weekly", () => {
  it("is due only on the matching day of week", () => {
    // 2026-09-28 is a Monday (day 1).
    const r = routine({ frequency: "weekly", time: "09:00", dayOfWeek: 1 });
    expect(isRoutineDue(r, at(2026, 8, 28, 9, 0))).toBe(true);
    expect(isRoutineDue(r, at(2026, 8, 29, 9, 0))).toBe(false);
  });
});

describe("isRoutineDue — already fired this minute", () => {
  it("is not due again if lastFiredAt is within the same minute", () => {
    const now = at(2026, 8, 28, 22, 0);
    const r = routine({ time: "22:00", lastFiredAt: now.toISOString() });
    expect(isRoutineDue(r, now)).toBe(false);
  });

  it("is due again once the minute has rolled over on the next matching day", () => {
    const r = routine({
      time: "22:00",
      lastFiredAt: at(2026, 8, 27, 22, 0).toISOString(),
    });
    expect(isRoutineDue(r, at(2026, 8, 28, 22, 0))).toBe(true);
  });
});
