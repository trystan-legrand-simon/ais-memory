import { describe, expect, it } from "vitest";
import { parseStreamJsonLine } from "./claude-cli";

describe("parseStreamJsonLine — text deltas", () => {
  it("extracts a text_delta from a content_block_delta stream_event", () => {
    const line = JSON.stringify({
      type: "stream_event",
      event: {
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: "Bonjour" },
      },
      session_id: "abc",
    });
    expect(parseStreamJsonLine(line)).toEqual({ type: "delta", text: "Bonjour" });
  });

  it("ignores other stream_event subtypes (message_start, content_block_start, etc.)", () => {
    const line = JSON.stringify({
      type: "stream_event",
      event: { type: "message_start", message: {} },
    });
    expect(parseStreamJsonLine(line)).toBeNull();
  });

  it("ignores a content_block_delta whose delta isn't a text_delta", () => {
    const line = JSON.stringify({
      type: "stream_event",
      event: {
        type: "content_block_delta",
        delta: { type: "input_json_delta", partial_json: "{}" },
      },
    });
    expect(parseStreamJsonLine(line)).toBeNull();
  });
});

describe("parseStreamJsonLine — result line", () => {
  it("builds a success result", () => {
    const line = JSON.stringify({
      type: "result",
      is_error: false,
      result: "OK",
      session_id: "sess-1",
    });
    expect(parseStreamJsonLine(line)).toEqual({
      type: "result",
      result: { status: "success", output: "OK", raw: line, sessionId: "sess-1" },
    });
  });

  it("builds an error result", () => {
    const line = JSON.stringify({
      type: "result",
      is_error: true,
      result: "something went wrong",
      session_id: "sess-2",
    });
    expect(parseStreamJsonLine(line)).toEqual({
      type: "result",
      result: {
        status: "error",
        output: "something went wrong",
        raw: line,
        sessionId: "sess-2",
      },
    });
  });

  it("defaults sessionId to null and output to empty string when missing", () => {
    const line = JSON.stringify({ type: "result", is_error: false });
    const parsed = parseStreamJsonLine(line);
    expect(parsed).toEqual({
      type: "result",
      result: { status: "success", output: "", raw: line, sessionId: null },
    });
  });
});

describe("parseStreamJsonLine — noise and malformed input", () => {
  it("ignores system/hook lines", () => {
    const line = JSON.stringify({ type: "system", subtype: "hook_started" });
    expect(parseStreamJsonLine(line)).toBeNull();
  });

  it("ignores the assistant full-message line (redundant with deltas)", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Bonjour" }] },
    });
    expect(parseStreamJsonLine(line)).toBeNull();
  });

  it("returns null for invalid JSON instead of throwing", () => {
    expect(parseStreamJsonLine("not json")).toBeNull();
    expect(parseStreamJsonLine("{broken")).toBeNull();
  });

  it("returns null for valid JSON that isn't an object", () => {
    expect(parseStreamJsonLine("42")).toBeNull();
    expect(parseStreamJsonLine('"a string"')).toBeNull();
    expect(parseStreamJsonLine("null")).toBeNull();
  });
});
