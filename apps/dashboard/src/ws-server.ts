// Standalone process (run via `tsx src/ws-server.ts`, alongside `next dev`/
// `next start` — see package.json), separate from the Next.js process
// because App Router route handlers can't hold a persistent WebSocket
// connection. It shares no state with the Next.js process other than the
// SQLite file: it polls `.data/dashboard.sqlite` read-only and broadcasts
// new/changed rows to every connected client, in the same camelCase shape
// the REST API already returns (RunRecord/Routine) so client code can reuse
// the same types either way. See
// docs/superpowers/specs/2026-09-28-live-updates-websocket-design.md.
import { WebSocketServer } from "ws";
import { db } from "./lib/db";
import { diffById, diffRoutines, type RoutineSnapshot } from "./lib/live-diff";
import { toRunRecord, type RunRow } from "./lib/runs";
import { toRoutine, type RoutineRow } from "./lib/routines";

const PORT = 4001;
const POLL_INTERVAL_MS = 1500;

interface ChatMessageRow {
  id: number;
  slug: string;
  role: "user" | "agent" | "error";
  content: string;
  created_at: string;
}

type LiveEvent =
  | { type: "run"; data: ReturnType<typeof toRunRecord> }
  | {
      type: "chat_message";
      data: { slug: string; role: ChatMessageRow["role"]; content: string; createdAt: string };
    }
  | { type: "routine"; data: ReturnType<typeof toRoutine> };

function latestId(table: "runs" | "chat_messages"): number {
  const row = db
    .prepare(`SELECT MAX(id) as maxId FROM ${table}`)
    .get() as { maxId: number | null };
  return row.maxId ?? 0;
}

function initialRoutineSnapshots(): Map<number, RoutineSnapshot> {
  const rows = db
    .prepare("SELECT id, enabled, last_fired_at FROM routines")
    .all() as { id: number; enabled: number; last_fired_at: string | null }[];
  return new Map(
    rows.map((r) => [r.id, { enabled: r.enabled === 1, lastFiredAt: r.last_fired_at }])
  );
}

export function startWsServer(): WebSocketServer {
  const wss = new WebSocketServer({ port: PORT });

  function broadcast(event: LiveEvent) {
    const payload = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }

  let lastRunId = latestId("runs");
  let lastChatMessageId = latestId("chat_messages");
  let routineSnapshots = initialRoutineSnapshots();

  const timer = setInterval(() => {
    try {
      const runRows = db
        .prepare("SELECT * FROM runs WHERE id > ? ORDER BY id ASC")
        .all(lastRunId) as unknown as RunRow[];
      const runDiff = diffById(runRows, lastRunId);
      lastRunId = runDiff.nextCursor;
      for (const row of runDiff.newRows) {
        broadcast({ type: "run", data: toRunRecord(row) });
      }

      const chatRows = db
        .prepare("SELECT * FROM chat_messages WHERE id > ? ORDER BY id ASC")
        .all(lastChatMessageId) as unknown as ChatMessageRow[];
      const chatDiff = diffById(chatRows, lastChatMessageId);
      lastChatMessageId = chatDiff.nextCursor;
      for (const row of chatDiff.newRows) {
        broadcast({
          type: "chat_message",
          data: {
            slug: row.slug,
            role: row.role,
            content: row.content,
            createdAt: row.created_at,
          },
        });
      }

      const routineRows = db.prepare("SELECT * FROM routines").all() as unknown as RoutineRow[];
      const normalized = routineRows.map((r) => ({
        id: r.id,
        enabled: r.enabled === 1,
        lastFiredAt: r.last_fired_at,
      }));
      const routineDiff = diffRoutines(normalized, routineSnapshots);
      routineSnapshots = routineDiff.nextSnapshots;
      for (const changed of routineDiff.changedRows) {
        const full = routineRows.find((r) => r.id === changed.id);
        if (full) broadcast({ type: "routine", data: toRoutine(full) });
      }
    } catch (err) {
      // A tick failing (e.g. DB file briefly locked by a concurrent write)
      // just gets retried at the next poll — never crash the process.
      console.error("[ws-server] poll tick failed:", err);
    }
  }, POLL_INTERVAL_MS);

  wss.on("close", () => clearInterval(timer));

  console.log(`[ws-server] listening on ws://localhost:${PORT}`);
  return wss;
}

if (require.main === module) {
  startWsServer();
}
