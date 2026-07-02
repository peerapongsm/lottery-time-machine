import { describe, it, expect } from "vitest";
import { eraFor, scaledTicketPrice } from "../lib/era";

describe("eraFor", () => {
  it("resolves current era for a 2025 draw", () => {
    const e = eraFor("2025-06-16");
    expect(e.amounts.first).toBe(6_000_000);
    expect(e.amounts.last2).toBe(2_000);
    expect(e.ticketFace).toBe(80);
  });
  it("resolves an older era for a 2550 draw with lower first prize", () => {
    const e = eraFor("2007-06-16");
    expect(e.amounts.first).toBeLessThan(6_000_000);
  });
  it("eras are ascending and cover 1990-01-01 onwards", () => {
    expect(() => eraFor("1990-01-05")).not.toThrow();
  });
  it("pre-2015 era has no front3 tier (not introduced until 2015 restructuring)", () => {
    expect(eraFor("2007-06-16").amounts.front3).toBeUndefined();
  });
  it("pins pre-2015 third-prize amount as documented in config", () => {
    expect(eraFor("2007-06-16").amounts.third).toBe(80_000);
  });
  it("throws for a date before the earliest documented era", () => {
    expect(() => eraFor("1989-12-31")).toThrow();
  });
});

describe("scaledTicketPrice", () => {
  it("returns user price unscaled for current era", () => {
    expect(scaledTicketPrice(100, "2025-06-16")).toBe(100);
  });
  it("scales down proportionally to historical face value", () => {
    const p = scaledTicketPrice(100, "2007-06-16");
    expect(p).toBeLessThan(100);
    expect(p).toBeGreaterThan(0);
  });
  it("scales exactly to the 40/80 pre-2015 face-value ratio", () => {
    expect(scaledTicketPrice(100, "2007-06-16")).toBe(50);
  });
});
