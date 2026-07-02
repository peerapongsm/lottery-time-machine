import { describe, it, expect } from "vitest";
import { checkTicket, checkUnderground, nearNumbers, type Draw } from "../lib/check";

const full: Draw = {
  date: "2025-06-16", first: "123456", near: ["123455", "123457"],
  second: ["222222"], third: ["333333"], fourth: ["444444"], fifth: ["555555"],
  front3: ["123", "999"], last3: ["456", "888"], last2: "56",
};
const early: Draw = { date: "1995-06-16", first: "123456", last3: ["456", "888"] };

describe("nearNumbers", () => {
  it("plain ±1", () => expect(nearNumbers("123456")).toEqual(["123455", "123457"]));
  it("wraps at 000000", () => expect(nearNumbers("000000")).toEqual(["999999", "000001"]));
  it("wraps at 999999", () => expect(nearNumbers("999999")).toEqual(["999998", "000000"]));
});

describe("checkTicket (full era)", () => {
  it("first prize also collects front3/last3/last2 of same number", () => {
    const tiers = checkTicket("123456", full).map(h => h.tier).sort();
    expect(tiers).toEqual(["first", "front3", "last2", "last3"].sort());
  });
  it("near win", () => expect(checkTicket("123455", full).map(h => h.tier)).toContain("near"));
  it("last2 only", () => {
    const hits = checkTicket("999956", full);
    expect(hits.map(h => h.tier)).toEqual(["last2"]);
    expect(hits[0].amount).toBe(2_000);
  });
  it("front3 matches FIRST 3 digits only", () => {
    expect(checkTicket("999000", full).map(h => h.tier)).toEqual([]);
    expect(checkTicket("999111", { ...full, front3: ["999"] }).map(h => h.tier)).toContain("front3");
  });
  it("total miss", () => expect(checkTicket("777770", full)).toEqual([]));
});

describe("checkTicket (early era, partial tiers)", () => {
  it("checks only present tiers — no near/second even for adjacent number", () => {
    expect(checkTicket("123455", early)).toEqual([]);
  });
  it("last3 hit works", () => {
    expect(checkTicket("999456", early).map(h => h.tier)).toEqual(["last3"]);
  });
});

describe("checkUnderground", () => {
  const bet = (type: any, digits: string) => ({ type, digits, stake: 100, rate: type.startsWith("top3") ? 450 : 70 });
  it("top2 = last 2 of FIRST prize", () => expect(checkUnderground(bet("top2", "56"), full)).toBe(7000));
  it("bottom2 = the last2 tier number", () => expect(checkUnderground(bet("bottom2", "56"), full)).toBe(7000));
  it("top3 exact = last 3 of first prize", () => expect(checkUnderground(bet("top3", "456"), full)).toBe(45000));
  it("tode3 = any permutation of last 3 of first prize", () => {
    expect(checkUnderground({ type: "tode3", digits: "645", stake: 100, rate: 100 }, full)).toBe(10000);
    expect(checkUnderground({ type: "tode3", digits: "999", stake: 100, rate: 100 }, full)).toBe(0);
  });
  it("miss pays 0", () => expect(checkUnderground(bet("top2", "99"), full)).toBe(0));
  it("bottom2 absent tier (hypothetical) pays 0", () => {
    expect(checkUnderground(bet("bottom2", "56"), { date: "1995-01-16", first: "123456" } as Draw)).toBe(0);
  });
});
