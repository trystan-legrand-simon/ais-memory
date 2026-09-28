import { invokeClaudeStreaming } from "./claude-cli";
import { db } from "./db";

export interface ChatMessage {
  role: "user" | "agent" | "error";
  content: string;
}

// Concurrency lock only — inherently per-process, not something to persist:
// if the server restarts, nothing is "in flight" anymore either way.
const busyAgents = new Set<string>();

export function isChatBusy(slug: string): boolean {
  return busyAgents.has(slug);
}

export class ChatAlreadyBusyError extends Error {}

function getSessionId(slug: string): string | null {
  const row = db
    .prepare("SELECT claude_session_id FROM chat_sessions WHERE slug = ?")
    .get(slug) as { claude_session_id: string | null } | undefined;
  return row?.claude_session_id ?? null;
}

function setSessionId(slug: string, sessionId: string): void {
  db.prepare(
    `INSERT INTO chat_sessions (slug, claude_session_id, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       claude_session_id = excluded.claude_session_id,
       updated_at = excluded.updated_at`
  ).run(slug, sessionId, new Date().toISOString());
}

function insertMessage(
  slug: string,
  role: ChatMessage["role"],
  content: string
): void {
  db.prepare(
    "INSERT INTO chat_messages (slug, role, content, created_at) VALUES (?, ?, ?, ?)"
  ).run(slug, role, content, new Date().toISOString());
}

export function getChatHistory(slug: string): ChatMessage[] {
  return db
    .prepare(
      "SELECT role, content FROM chat_messages WHERE slug = ? ORDER BY id ASC"
    )
    .all(slug) as unknown as ChatMessage[];
}

export async function sendChatMessage(
  slug: string,
  message: string,
  onDelta: (text: string) => void
): Promise<ChatMessage[]> {
  if (busyAgents.has(slug)) {
    throw new ChatAlreadyBusyError(`Chat already in progress for: ${slug}`);
  }
  busyAgents.add(slug);
  insertMessage(slug, "user", message);

  try {
    const sessionId = getSessionId(slug);
    const args = sessionId
      ? ["--resume", sessionId, message]
      : ["--agent", slug, message];
    const result = await invokeClaudeStreaming(args, onDelta);

    if (result.sessionId) {
      setSessionId(slug, result.sessionId);
    }
    insertMessage(
      slug,
      result.status === "error" ? "error" : "agent",
      result.output
    );
    return getChatHistory(slug);
  } finally {
    busyAgents.delete(slug);
  }
}

export function resetChat(slug: string): void {
  db.prepare("DELETE FROM chat_messages WHERE slug = ?").run(slug);
  db.prepare("DELETE FROM chat_sessions WHERE slug = ?").run(slug);
}
