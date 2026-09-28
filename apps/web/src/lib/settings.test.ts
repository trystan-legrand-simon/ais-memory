import { describe, expect, it, beforeAll, afterEach } from "vitest";
import fs from "node:fs/promises";
import { readSettings, writeSettings, isStringArray } from "./settings";
import { SETTINGS_FILE } from "./repo-paths";

describe("settings round-trip", () => {
  it("reads the real .claude/settings.json as an object", async () => {
    const settings = await readSettings();
    expect(typeof settings).toBe("object");
    expect(settings).not.toBeNull();
  });

  describe("write then read back", () => {
    let original: string;

    beforeAll(async () => {
      original = await fs.readFile(SETTINGS_FILE, "utf-8");
    });

    afterEach(async () => {
      await fs.writeFile(SETTINGS_FILE, original, "utf-8");
    });

    it("preserves untouched fields when only one scalar changes", async () => {
      const before = await readSettings();
      const updated = { ...before, language: "french" };

      await writeSettings(updated);
      const after = await readSettings();

      expect(after).toEqual(updated);
      expect(after.permissions).toEqual(before.permissions);
      expect(after.hooks).toEqual(before.hooks);
    });

    it("preserves untouched fields when only one permission rule is added", async () => {
      const before = await readSettings();
      const permissions = before.permissions as {
        allow: string[];
        deny: string[];
      };
      const updated = {
        ...before,
        permissions: {
          ...permissions,
          allow: [...permissions.allow, "Bash(pnpm test)"],
        },
      };

      await writeSettings(updated);
      const after = await readSettings();

      expect(after).toEqual(updated);
      expect(
        (after.permissions as { deny: string[] }).deny
      ).toEqual(permissions.deny);
    });
  });
});

describe("isStringArray", () => {
  it("accepts arrays of strings only", () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(["a", "b"])).toBe(true);
    expect(isStringArray(["a", 1])).toBe(false);
    expect(isStringArray("a")).toBe(false);
    expect(isStringArray(null)).toBe(false);
  });
});
