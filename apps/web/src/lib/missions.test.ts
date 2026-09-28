import { describe, expect, it, afterEach } from "vitest";
import { db } from "./db";
import {
  countMissionMessages,
  createMission,
  getMission,
  getMissionByChannelId,
  getMissionMessages,
  isMissionBusy,
} from "./missions";

const createdIds: number[] = [];

afterEach(() => {
  while (createdIds.length) {
    const id = createdIds.pop()!;
    db.prepare("DELETE FROM mission_messages WHERE mission_id = ?").run(id);
    db.prepare("DELETE FROM mission_sessions WHERE mission_id = ?").run(id);
    db.prepare("DELETE FROM missions WHERE id = ?").run(id);
  }
});

function create(overrides: Partial<Parameters<typeof createMission>[0]> = {}) {
  const mission = createMission({
    agentSlug: "relecteur-jury",
    discordChannelId: `chan-${Math.random().toString(36).slice(2)}`,
    title: "BC01",
    ...overrides,
  });
  createdIds.push(mission.id);
  return mission;
}

describe("missions CRUD round-trip", () => {
  it("creates a mission and reads it back by id", () => {
    const mission = create();
    const fetched = getMission(mission.id);
    expect(fetched).toEqual(mission);
    expect(mission.agentSlug).toBe("relecteur-jury");
    expect(mission.title).toBe("BC01");
  });

  it("reads a mission back by its discord channel id", () => {
    const mission = create({ discordChannelId: "chan-unique-1" });
    expect(getMissionByChannelId("chan-unique-1")).toEqual(mission);
  });

  it("returns null for an unknown mission or channel", () => {
    expect(getMission(999999)).toBeNull();
    expect(getMissionByChannelId("chan-does-not-exist")).toBeNull();
  });

  it("enforces one mission per discord channel", () => {
    create({ discordChannelId: "chan-unique-2" });
    expect(() => create({ discordChannelId: "chan-unique-2" })).toThrow();
  });

  it("starts with no messages and not busy", () => {
    const mission = create();
    expect(countMissionMessages(mission.id)).toBe(0);
    expect(getMissionMessages(mission.id)).toEqual([]);
    expect(isMissionBusy(mission.id)).toBe(false);
  });
});
