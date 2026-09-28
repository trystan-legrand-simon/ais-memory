import { API_BASE } from "./config";

export interface Mission {
  id: number;
  agentSlug: string;
  discordChannelId: string;
  title: string;
  createdAt: string;
  messageCount: number;
  busy: boolean;
}

export interface MissionMessage {
  role: "user" | "agent" | "error";
  content: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function getMissionByChannel(
  channelId: string
): Promise<ApiResult<Mission>> {
  const res = await fetch(
    `${API_BASE}/missions?channelId=${encodeURIComponent(channelId)}`
  );
  const body = (await parseJson(res)) as Record<string, unknown> | null;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: (body?.error as string) ?? `Erreur ${res.status}`,
    };
  }
  return { ok: true, data: body as unknown as Mission };
}

export async function createMission(input: {
  agentSlug: string;
  discordChannelId: string;
  title: string;
}): Promise<ApiResult<Mission>> {
  const res = await fetch(`${API_BASE}/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await parseJson(res)) as Record<string, unknown> | null;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: (body?.error as string) ?? `Erreur ${res.status}`,
    };
  }
  return { ok: true, data: body as unknown as Mission };
}

export async function sendMissionMessage(
  missionId: number,
  message: string
): Promise<ApiResult<MissionMessage>> {
  const res = await fetch(`${API_BASE}/missions/${missionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const body = (await parseJson(res)) as Record<string, unknown> | null;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: (body?.error as string) ?? `Erreur ${res.status}`,
    };
  }
  return { ok: true, data: body?.reply as MissionMessage };
}
