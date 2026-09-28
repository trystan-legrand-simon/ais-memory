import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import { buildAgentFileContent, parseAgentFile } from "./agents";
import { AGENTS_DIR } from "./repo-paths";

const REAL_AGENT_SLUGS = [
  "relecteur-jury",
  "verificateur-referentiel",
  "preparateur-questions-jury",
  "redacteur-ais",
  "orchestrateur",
];

describe("agents round-trip (read-only, does not touch disk)", () => {
  for (const slug of REAL_AGENT_SLUGS) {
    it(`preserves name/description/tools/prompt for ${slug}`, async () => {
      const raw = await fs.readFile(`${AGENTS_DIR}/${slug}.md`, "utf-8");
      const original = parseAgentFile(slug, raw);

      // Round-trip through a no-op update (same values) and re-parse.
      const rewritten = buildAgentFileContent(slug, {
        description: original.description,
        tools: original.tools,
        prompt: original.prompt,
      });
      const reparsed = parseAgentFile(slug, rewritten);

      expect(reparsed.name).toBe(slug);
      expect(reparsed.description).toBe(original.description);
      expect(reparsed.tools).toEqual(original.tools);
      expect(reparsed.prompt).toBe(original.prompt);

      // A no-op edit should also be byte-identical to the original file,
      // not just semantically equivalent — these files are git-tracked and
      // hand-written, a reformat on every save would be unwanted noise.
      expect(rewritten).toBe(raw);
    });
  }

  it("keeps an Agent(...) delegation entry intact instead of splitting on its internal commas", async () => {
    const raw = await fs.readFile(`${AGENTS_DIR}/orchestrateur.md`, "utf-8");
    const parsed = parseAgentFile("orchestrateur", raw);

    expect(parsed.tools).toEqual([
      "Agent(relecteur-jury, verificateur-referentiel, preparateur-questions-jury, redacteur-ais)",
      "Read",
      "Grep",
      "Glob",
    ]);
  });
});
