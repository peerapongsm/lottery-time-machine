import { expect, test } from "vitest";
import { fmtBaht, toBE } from "../lib/fmt";

test("fmtBaht groups thousands with baht sign, no decimals", () => {
  expect(fmtBaht(0)).toBe("฿0");
  expect(fmtBaht(100)).toBe("฿100");
  expect(fmtBaht(1234567)).toBe("฿1,234,567");
});

test("fmtBaht rounds fractional input", () => {
  expect(fmtBaht(99.6)).toBe("฿100");
  expect(fmtBaht(99.4)).toBe("฿99");
});

test("fmtBaht renders negative amounts with leading minus before the sign", () => {
  expect(fmtBaht(-500)).toBe("-฿500");
  expect(fmtBaht(-1234567)).toBe("-฿1,234,567");
});

test("toBE converts an ISO date to Thai Buddhist-era display", () => {
  expect(toBE("1990-01-16")).toBe("16 มกราคม 2533");
  expect(toBE("2026-07-01")).toBe("1 กรกฎาคม 2569");
});

test("toBE handles December correctly", () => {
  expect(toBE("2006-12-16")).toBe("16 ธันวาคม 2549");
});
