import { describe, it, expect } from "vitest";
import { simulate } from "../lib/simulate";
import type { Draw } from "../lib/check";

const draws: Draw[] = [
  { date: "2024-01-16", first: "111111", last2: "11", last3: ["111"], front3: ["111"] },
  { date: "2024-02-01", first: "222222", last2: "34", last3: ["222"], front3: ["222"] },
];
const base = { number: "999934", ticketsPerDraw: 2, pricePerTicket: 100, startYear: 2000, underground: [] };

describe("simulate", () => {
  it("spends price*tickets per draw and wins last2 * tickets", () => {
    const led = simulate(base, draws);
    expect(led.totalSpent).toBe(2 * 2 * 100);
    expect(led.lottery.won).toBe(2_000 * 2); // hits draw 2 last2 "34", 2 tickets
    expect(led.net).toBe(led.totalWon - led.totalSpent);
    expect(led.hitCount).toBe(1);
    expect(led.biggestHit?.amount).toBe(2_000);
  });
  it("startYear filters draws and flags capped start", () => {
    const led = simulate({ ...base, startYear: 2024 }, draws);
    expect(led.cappedStart).toBe(false);
    const led2 = simulate({ ...base, startYear: 1980 }, draws);
    expect(led2.cappedStart).toBe(true); // asked earlier than data
    expect(led2.events.length).toBe(2);
  });
  it("underground stake spent every draw, payout on hit", () => {
    const led = simulate({ ...base, ticketsPerDraw: 0, underground: [{ type: "top2", digits: "22", stake: 50, rate: 70 }] }, draws);
    expect(led.underground.spent).toBe(100);       // 50 x 2 draws
    expect(led.underground.won).toBe(3500);        // draw2 first 222222 -> top2 "22"
    expect(led.totalSpent).toBe(100);
  });
});
