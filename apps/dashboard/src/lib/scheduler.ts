import { getAgent } from "./agents";
import { AgentAlreadyRunningError, runAgent } from "./run-agent";
import {
  disableRoutine,
  listEnabledRoutines,
  markRoutineFired,
  type Routine,
} from "./routines";

const CHECK_INTERVAL_MS = 60 * 1000;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

// Exported so scheduler.test.ts can check "is this routine due" without
// waiting on a real 60s interval.
export function isRoutineDue(routine: Routine, now: Date): boolean {
  const currentTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (routine.time !== currentTime) return false;
  if (routine.frequency === "weekly" && routine.dayOfWeek !== now.getDay()) {
    return false;
  }
  // Guard against firing twice inside the same minute if the interval check
  // happens to run more than once before the minute rolls over.
  if (routine.lastFiredAt) {
    const last = new Date(routine.lastFiredAt);
    if (
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate() &&
      last.getHours() === now.getHours() &&
      last.getMinutes() === now.getMinutes()
    ) {
      return false;
    }
  }
  return true;
}

async function checkRoutines(now = new Date()): Promise<void> {
  const routines = listEnabledRoutines();
  for (const routine of routines) {
    if (!isRoutineDue(routine, now)) continue;

    const agent = await getAgent(routine.slug);
    if (!agent) {
      disableRoutine(routine.id);
      continue;
    }

    markRoutineFired(routine.id, now.toISOString());
    // Fire-and-forget: don't block the scheduler loop on the agent run.
    // AgentAlreadyRunningError just means this tick is skipped — the routine
    // stays enabled and will be picked up again at its next due time.
    runAgent(routine.slug).catch((err) => {
      if (!(err instanceof AgentAlreadyRunningError)) {
        console.error(`[scheduler] routine ${routine.id} (${routine.slug}) failed:`, err);
      }
    });
  }
}

const globalForScheduler = globalThis as unknown as {
  __dashboardSchedulerTimer?: ReturnType<typeof setInterval>;
};

// Started once at server boot; stashed on globalThis for the same reason as
// the db connection in db.ts, so Next.js dev hot-reload doesn't stack up
// duplicate intervals.
export function startScheduler(): void {
  if (globalForScheduler.__dashboardSchedulerTimer) return;
  globalForScheduler.__dashboardSchedulerTimer = setInterval(() => {
    checkRoutines().catch((err) => {
      console.error("[scheduler] check failed:", err);
    });
  }, CHECK_INTERVAL_MS);
}
