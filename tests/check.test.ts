import { describe, it, expect } from "vitest";
import { checkTicket, nearNumbers, type Draw } from "../lib/check";

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
    // ticket avoids "999" prefix (front3's second number) so only last2 hits
    const hits = checkTicket("000056", full);
    expect(hits.map(h => h.tier)).toEqual(["last2"]);
    expect(hits[0].amount).toBe(2_000);
  });
  it("front3 matches FIRST 3 digits only", () => {
    // NOTE: front3/last3 are each drawn as TWO independent winning numbers;
    // a ticket matching either one pays. The plan's original expectation of
    // [] here was wrong — controller-approved correction to domain semantics.
    const hits999000 = checkTicket("999000", full);
    expect(hits999000.map(h => h.tier)).toContain("front3"); // "999" is front3's second number
    expect(hits999000.map(h => h.tier)).not.toContain("last3"); // "000" not in ["456","888"]
    expect(hits999000.map(h => h.tier)).not.toContain("last2"); // "00" !== "56"

    expect(checkTicket("999111", { ...full, front3: ["999"] }).map(h => h.tier)).toContain("front3");

    // position sensitivity: a ticket whose LAST 3 digits equal a front3
    // number must not accidentally hit front3 (front3 only checks the
    // FIRST 3 digits).
    expect(
      checkTicket("111999", { ...full, front3: ["999"], last3: ["777", "888"], last2: "12" }).map(h => h.tier)
    ).toEqual([]);
  });
  it("last3 second element also pays", () => {
    expect(checkTicket("000888", full).map(h => h.tier)).toEqual(["last3"]);
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

describe("7-digit era draws", () => {
  const sevenDigit: Draw = { date: "1992-06-16", first: "4826531", last3: ["531", "888", "111", "222"], last2: "31" };

  it("6-digit ticket never wins first on a 7-digit draw", () => {
    expect(checkTicket("482653", sevenDigit).map(h => h.tier)).not.toContain("first");
  });
  it("tail tiers still pay on 7-digit draws", () => {
    // "999531".slice(3) = "531" -> last3 hit; "999531".slice(4) = "31" -> also equals last2 "31"
    const tiers = checkTicket("999531", sevenDigit).map(h => h.tier).sort();
    expect(tiers).toEqual(["last2", "last3"]);
  });
});
