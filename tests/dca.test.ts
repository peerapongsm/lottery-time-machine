import { describe, it, expect } from "vitest";
import { dcaFromSpend } from "../lib/dca";

const series = [
  { ym: "2024-01", close: 100 }, { ym: "2024-02", close: 200 },
];
describe("dcaFromSpend", () => {
  it("accumulates units per event month, values at last close", () => {
    const r = dcaFromSpend([{ date: "2024-01-16", spent: 100 }, { date: "2024-02-01", spent: 100 }], series);
    expect(r.invested).toBe(200);
    expect(r.value).toBe(1 * 200 + 0.5 * 200); // 1 unit @100, 0.5 unit @200
    expect(r.from).toBe("2024-01"); expect(r.to).toBe("2024-02");
  });
  it("excludes spend outside series window", () => {
    const r = dcaFromSpend([{ date: "2020-01-16", spent: 999 }, { date: "2024-01-16", spent: 100 }], series);
    expect(r.invested).toBe(100);
  });
  it("empty overlap -> zeros", () => {
    const r = dcaFromSpend([{ date: "2020-01-16", spent: 999 }], series);
    expect(r.invested).toBe(0); expect(r.value).toBe(0);
  });
});
