export async function register() {
  // The scheduler uses node:sqlite (via routines.ts/db.ts) and spawns the
  // claude CLI — both node-only, so skip registration under the edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/scheduler");
    startScheduler();
  }
}
