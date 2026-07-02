import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArchiveFile } from "../scripts/ingest-draws";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", name), "utf8");

describe("parseArchiveFile", () => {
  it("parses an old-era file (THREE = 4 last3 numbers, no front3)", () => {
    const d = parseArchiveFile("2006-12-30.txt", fixture("2006-12-30.txt"));
    expect(d.date).toBe("2006-12-30");
    expect(d.first).toBe("778584");
    expect(d.front3).toBeUndefined();
    expect(d.last3).toEqual(["164", "403", "811", "971"]);
    expect(d.last2).toBe("07");
    expect(d.near).toEqual(["778583", "778585"]);
    expect(d.second).toHaveLength(5);
    expect(d.third).toHaveLength(10);
    expect(d.fourth).toHaveLength(50);
    expect(d.fifth).toHaveLength(100);
  });

  it("parses a current-era file (THREE_FIRST/THREE_LAST split)", () => {
    const d = parseArchiveFile("2026-07-01.txt", fixture("2026-07-01.txt"));
    expect(d.first).toBe("751495");
    expect(d.front3).toEqual(["001", "980"]);
    expect(d.last3).toEqual(["304", "531"]);
    expect(d.last2).toBe("62");
  });

  it("rejects malformed content", () => {
    expect(() => parseArchiveFile("2020-01-01.txt", "url\nFIRST abc123\nTWO 12\nTHREE 111")).toThrow();
    expect(() => parseArchiveFile("2020-01-01.txt", "url\nBOGUS 123456")).toThrow();
  });
});
