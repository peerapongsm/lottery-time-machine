import { describe, expect, test } from "vitest";
import { indexAtElapsed, DEFAULT_TIMELINE } from "../lib/timeline";

describe("indexAtElapsed", () => {
  test("empty timeline has no index", () => {
    expect(indexAtElapsed(0, 0)).toBe(-1);
  });

  test("starts at the first event", () => {
    expect(indexAtElapsed(0, 100)).toBe(0);
  });

  test("reaches the last event by totalMs", () => {
    expect(indexAtElapsed(DEFAULT_TIMELINE.totalMs, 100)).toBe(99);
  });

  test("clamps beyond totalMs", () => {
    expect(indexAtElapsed(DEFAULT_TIMELINE.totalMs * 2, 100)).toBe(99);
  });

  test("clamps before zero", () => {
    expect(indexAtElapsed(-500, 100)).toBe(0);
  });

  test("is monotonically non-decreasing", () => {
    let prev = -1;
    for (let ms = 0; ms <= DEFAULT_TIMELINE.totalMs; ms += 137) {
      const idx = indexAtElapsed(ms, 872);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });

  test("accelerates: early half of the time reveals well under half the events", () => {
    const half = indexAtElapsed(DEFAULT_TIMELINE.totalMs / 2, 1000);
    expect(half).toBeLessThan(300);
  });

  test("accelerates: last tenth of time reveals a large share of events", () => {
    const at90 = indexAtElapsed(DEFAULT_TIMELINE.totalMs * 0.9, 1000);
    const at100 = indexAtElapsed(DEFAULT_TIMELINE.totalMs, 1000);
    expect(at100 - at90).toBeGreaterThan(150);
  });
});
