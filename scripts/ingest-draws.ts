// Ingest the vicha-w/thai-lotto-archive draw files into public/data/draws-full.json.
// Runs locally and in the monthly refresh workflow. The early era (2533-2548,
// TrueID source) is static and baked once by scripts/ingest-early.ts — not here.
//
// Usage: npx tsx scripts/ingest-draws.ts
//   ARCHIVE_DIR=<path>  use an existing clone instead of cloning fresh

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nearNumbers, type Draw } from "../lib/check";

const REPO = "https://github.com/vicha-w/thai-lotto-archive";

export function parseArchiveFile(name: string, content: string): Draw {
  const date = name.replace(/\.txt$/, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`bad filename ${name}`);
  const draw: Draw = { date, first: "" };
  for (const line of content.split(/\r?\n/).slice(1)) {
    const [label, ...nums] = line.trim().split(/\s+/);
    if (!label || nums.length === 0) continue;
    switch (label) {
      case "FIRST": draw.first = nums[0]; break;
      case "NEAR_FIRST": draw.near = nums; break;
      case "SECOND": draw.second = nums; break;
      case "THIRD": draw.third = nums; break;
      case "FOURTH": draw.fourth = nums; break;
      case "FIFTH": draw.fifth = nums; break;
      case "THREE": draw.last3 = nums; break;        // old era: ท้าย 3 ตัว, 4 numbers
      case "THREE_FIRST": draw.front3 = nums; break; // since 2015-09-01
      case "THREE_LAST": draw.last3 = nums; break;
      case "TWO": draw.last2 = nums[0]; break;
      default: throw new Error(`${name}: unknown label ${label}`);
    }
  }
  validateDraw(draw, name);
  return draw;
}

function validateDraw(d: Draw, name: string): void {
  const six = (s: string) => /^\d{6}$/.test(s);
  if (!six(d.first)) throw new Error(`${name}: bad first ${d.first}`);
  // near is NOT validated here: the archive's NEAR_FIRST values are corrupt for
  // some 2007 draws (source scrape bug). main() replaces near with the derived
  // first±1 values, which is the GLO rule anyway.
  for (const arr of [d.second, d.third, d.fourth, d.fifth])
    for (const n of arr ?? []) if (!six(n)) throw new Error(`${name}: bad 6-digit ${n}`);
  for (const n of [...(d.front3 ?? []), ...(d.last3 ?? [])])
    if (!/^\d{3}$/.test(n)) throw new Error(`${name}: bad 3-digit ${n}`);
  if (d.last2 === undefined || !/^\d{2}$/.test(d.last2)) throw new Error(`${name}: bad last2`);
  if (!d.last3?.length) throw new Error(`${name}: missing last3`);
}

function main(): void {
  let dir = process.env.ARCHIVE_DIR;
  if (!dir || !existsSync(dir)) {
    const tmp = mkdtempSync(join(tmpdir(), "lotto-archive-"));
    execFileSync("git", ["clone", "--depth", "1", REPO, join(tmp, "repo")], { stdio: "inherit" });
    dir = join(tmp, "repo");
  }
  const numbersDir = join(dir, "lottonumbers");
  const files = readdirSync(numbersDir).filter(f => f.endsWith(".txt")).sort();
  if (files.length < 400) throw new Error(`only ${files.length} draw files — floor is 400`);

  // scripts/repairs/<date>.txt overrides a corrupt upstream file (same format,
  // line 1 cites the repair source). Survives cron re-runs.
  const repairsDir = join(__dirname, "repairs");
  const repairs = new Set(existsSync(repairsDir) ? readdirSync(repairsDir) : []);

  let nearMismatch = 0;
  const draws: Draw[] = files.map(f => {
    const src = repairs.has(f) ? join(repairsDir, f) : join(numbersDir, f);
    const d = parseArchiveFile(f, readFileSync(src, "utf8"));
    const derived = nearNumbers(d.first);
    const near = d.near ?? [];
    if (!(near.includes(derived[0]) && near.includes(derived[1]))) {
      nearMismatch++;
      console.warn(`near mismatch ${d.date}: archive ${near.join(",")} vs derived ${derived.join(",")}`);
    }
    d.near = derived; // GLO rule: ข้างเคียงรางวัลที่ 1 = first ±1 — archive values corrupt for some 2007 draws
    return d;
  });

  writeFileSync("public/data/draws-full.json", JSON.stringify(draws) + "\n");
  const meta = existsSync("public/data/meta.json")
    ? JSON.parse(readFileSync("public/data/meta.json", "utf8"))
    : {};
  meta.lastDraw = draws[draws.length - 1].date;
  meta.fullDraws = draws.length;
  meta.nearMismatches = nearMismatch;
  meta.ingestedAt = new Date().toISOString().slice(0, 10);
  writeFileSync("public/data/meta.json", JSON.stringify(meta, null, 2) + "\n");
  console.log(`baked ${draws.length} draws (${draws[0].date} → ${meta.lastDraw}), near mismatches: ${nearMismatch}`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ingest-draws.ts")) main();
