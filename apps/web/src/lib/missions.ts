import { invokeClaude } from "./claude-cli";
import { db } from "./db";

export interface Mission {
  id: number;
  agentSlug: string;
  discordChannelId: string;
  title: string;
  createdAt: string;
}

export interface MissionRow {
  id: number;
  agent_slug: string;
  discord_channel_id: string;
  title: string;
  created_at: string;
}

export interface MissionMessage {
  role: "user" | "agent" | "error";
  content: string;
}

function toMission(row: MissionRow): Mission {
  return {
    id: row.id,
    agentSlug: row.agent_slug,
    discordChannelId: row.discord_channel_id,
    title: row.title,
    createdAt: row.created_at,
  };
}

// Concurrency lock only — inherently per-process, not something to persist,
// same pattern as busyAgents in chat.ts but keyed by mission_id.
const busyMissions = new Set<number>();

export function isMissionBusy(missionId: number): boolean {
  return busyMissions.has(missionId);
}

export class MissionAlreadyBusyError extends Error {}

export function getMissionByChannelId(channelId: string): Mission | null {
  const row = db
    .prepare("SELECT * FROM missions WHERE discord_channel_id = ?")
    .get(channelId) as unknown as MissionRow | undefined;
  return row ? toMission(row) : null;
}

export function getMission(id: number): Mission | null {
  const row = db
    .prepare("SELECT * FROM missions WHERE id = ?")
    .get(id) as unknown as MissionRow | undefined;
  return row ? toMission(row) : null;
}

export function listMissions(): Mission[] {
  const rows = db
    .prepare("SELECT * FROM missions ORDER BY created_at DESC")
    .all() as unknown as MissionRow[];
  return rows.map(toMission);
}

export function createMission(input: {
  agentSlug: string;
  discordChannelId: string;
  title: string;
}): Mission {
  const result = db
    .prepare(
      `INSERT INTO missions (agent_slug, discord_channel_id, title, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      input.agentSlug,
      input.discordChannelId,
      input.title,
      new Date().toISOString()
    );
  const created = getMission(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error("Échec de la création de la mission");
  }
  return created;
}

export function countMissionMessages(missionId: number): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM mission_messages WHERE mission_id = ?"
    )
    .get(missionId) as unknown as { count: number };
  return row.count;
}

function getMissionSessionId(missionId: number): string | null {
  const row = db
    .prepare(
      "SELECT claude_session_id FROM mission_sessions WHERE mission_id = ?"
    )
    .get(missionId) as { claude_session_id: string | null } | undefined;
  return row?.claude_session_id ?? null;
}

function setMissionSessionId(missionId: number, sessionId: string): void {
  db.prepare(
    `INSERT INTO mission_sessions (mission_id, claude_session_id, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(mission_id) DO UPDATE SET
       claude_session_id = excluded.claude_session_id,
       updated_at = excluded.updated_at`
  ).run(missionId, sessionId, new Date().toISOString());
}

function insertMissionMessage(
  missionId: number,
  role: MissionMessage["role"],
  content: string
): void {
  db.prepare(
    "INSERT INTO mission_messages (mission_id, role, content, created_at) VALUES (?, ?, ?, ?)"
  ).run(missionId, role, content, new Date().toISOString());
}

export function getMissionMessages(missionId: number): MissionMessage[] {
  return db
    .prepare(
      "SELECT role, content FROM mission_messages WHERE mission_id = ? ORDER BY id ASC"
    )
    .all(missionId) as unknown as MissionMessage[];
}

// Non-streaming on purpose: Discord doesn't consume the token-by-token
// stream, it posts a single message once the full reply is ready — see
// docs/superpowers/specs/2026-09-28-discord-integration-design.md.
export async function sendMissionMessage(
  missionId: number,
  message: string
): Promise<MissionMessage> {
  if (busyMissions.has(missionId)) {
    throw new MissionAlreadyBusyError(`Mission already busy: ${missionId}`);
  }
  const mission = getMission(missionId);
  if (!mission) {
    throw new Error(`Unknown mission: ${missionId}`);
  }

  busyMissions.add(missionId);
  insertMissionMessage(missionId, "user", message);

  try {
    const sessionId = getMissionSessionId(missionId);
    const args = sessionId
      ? ["--resume", sessionId, message]
      : ["--agent", mission.agentSlug, message];
    const result = await invokeClaude(args);

    if (result.sessionId) {
      setMissionSessionId(missionId, result.sessionId);
    }
    const role: MissionMessage["role"] =
      result.status === "error" ? "error" : "agent";
    insertMissionMessage(missionId, role, result.output);
    return { role, content: result.output };
  } finally {
    busyMissions.delete(missionId);
  }
}
