import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Test files that touch src/lib/db.ts all open the same on-disk SQLite
    // file (node:sqlite has no cross-process WAL here) — running test files
    // in parallel workers causes spurious "database is locked" failures.
    fileParallelism: false,
  },
});
