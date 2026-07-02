# -*- coding: utf-8 -*-
"""One-time bake of the EARLY draw era (2533-2548 BE / 1990-2005 CE) from
myhora.com year archives (https://myhora.com/lottery/result-<BE>.aspx).

History: the first source attempted (TrueID monthly stat pages) FAILED the
verification gate — 17/458 overlap mismatches vs the vicha-w archive
(digit transpositions, front3/last3 column swaps) — and was discarded.
myhora is a dedicated lottery archive with per-draw markup.

Domain fact surfaced by this data: draws through 2537 BE (1994) used
7-DIGIT first-prize numbers; 6-digit era starts 2538 BE (1995-01-16).
Early draws carry only: first, last3 (4 numbers in the old structure),
last2. No front3/near/second..fifth -> partial-tier checking by data.

HARD VERIFICATION GATE (spec §2.1): every myhora draw in the overlap
window (2549+ BE) must match public/data/draws-full.json (vicha-w,
GLO-spot-checked) on first/last3/last2 (+front3 when both carry it).
ANY mismatch -> abort without writing draws-early.json.

Run: PYTHONUTF8=1 python scripts/ingest-early.py
  MYHORA_DIR=<dir with <BE>.html>  use pre-downloaded pages (else fetch live)
"""
import json
import os
import re
import subprocess
import sys

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
YEARS = range(2533, 2570)  # BE; gate uses 2549+, bake uses 2533-2548
MONTHS = {"มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5,
          "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10,
          "พฤศจิกายน": 11, "ธันวาคม": 12}

# one block per draw: งวด D month BE ... first | front3 (hidden pre-2558, visible after) | last3 | last2
BLOCK = re.compile(
    r"งวด (\d{1,2}) (\S+) (\d{4})</font></a><div class='lot-id'.*?"
    r"lotto-fxl[^>]*>(\d+)</div>"
    r"<div class='lot-dc lotto-fxl'[^>]*>([^<]*)</div>"
    r"<div class='lot-dc lotto-fxl'[^>]*>([^<]*)</div>"
    r"<div class='lot-dc lotto-fxl'[^>]*>(\d{2})</div>", re.S)

def year_html(be: int) -> str:
    d = os.environ.get("MYHORA_DIR")
    if d and os.path.exists(f"{d}/{be}.html"):
        return open(f"{d}/{be}.html", encoding="utf-8", errors="replace").read()
    out = subprocess.run(
        ["curl", "-sL", f"https://myhora.com/lottery/result-{be}.aspx",
         "-H", f"User-Agent: {UA}"],
        capture_output=True, text=True, encoding="utf-8", check=True)
    if len(out.stdout) < 100_000:
        raise RuntimeError(f"suspiciously small page for {be}")
    return out.stdout

def parse_year(be: int):
    rows = []
    for day, mo, yr, first, front3s, last3s, last2 in BLOCK.findall(year_html(be)):
        if int(yr) != be or mo not in MONTHS:
            raise RuntimeError(f"{be}: unexpected draw header {day} {mo} {yr}")
        date = f"{be - 543:04d}-{MONTHS[mo]:02d}-{int(day):02d}"
        row = {"date": date, "first": first, "last2": last2,
               "last3": re.findall(r"\d{3}", last3s)}
        front3 = re.findall(r"\d{3}", front3s)
        if front3:
            row["front3"] = front3
        if len(first) not in (6, 7) or not row["last3"]:
            raise RuntimeError(f"{be}: malformed draw {row}")
        rows.append(row)
    if len(rows) < (20 if be < max(YEARS) else 5):  # current year is partial
        raise RuntimeError(f"{be}: only {len(rows)} draws parsed")
    return rows

def main() -> None:
    full = {d["date"]: d for d in json.load(open("public/data/draws-full.json", encoding="utf-8"))}
    early, mismatches, overlap_n = [], [], 0

    for be in YEARS:
        for r in parse_year(be):
            if r["date"] in full:
                overlap_n += 1
                f = full[r["date"]]
                if r["first"] != f["first"]:
                    mismatches.append((r["date"], "first", r["first"], f["first"]))
                if r["last2"] != f["last2"]:
                    mismatches.append((r["date"], "last2", r["last2"], f["last2"]))
                if sorted(r["last3"]) != sorted(f.get("last3", [])):
                    mismatches.append((r["date"], "last3", r["last3"], f.get("last3")))
                if "front3" in r and "front3" in f and sorted(r["front3"]) != sorted(f["front3"]):
                    mismatches.append((r["date"], "front3", r["front3"], f["front3"]))
            elif r["date"] < "2006-12-30":
                r.pop("front3", None)  # tier didn't exist; era table has no price pre-2015 anyway
                early.append(r)

    print(f"gate: {overlap_n} overlap draws, {len(mismatches)} mismatches")
    for m in mismatches[:20]:
        print("  MISMATCH", m)
    if mismatches:
        print("GATE FAILED — draws-early.json NOT written (floor stays 2549)")
        sys.exit(1)

    early.sort(key=lambda r: r["date"])
    # 16 years x 24 draws + the 2549-BE draws before 2006-12-30 that vicha-w lacks
    if not (350 <= len(early) <= 415):
        raise RuntimeError(f"{len(early)} early draws — expected ~406")

    with open("public/data/draws-early.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(early, f, ensure_ascii=False)
        f.write("\n")
    meta = json.load(open("public/data/meta.json", encoding="utf-8"))
    meta["earlyEraIncluded"] = True
    meta["earlyDraws"] = len(early)
    meta["earlyRange"] = [early[0]["date"], early[-1]["date"]]
    meta["earlySource"] = "myhora.com year archives (TrueID rejected by gate: 17/458 mismatches)"
    meta["gate"] = {"overlapDraws": overlap_n, "mismatches": 0}
    with open("public/data/meta.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
        f.write("\n")
    seven = sum(1 for r in early if len(r["first"]) == 7)
    print(f"baked {len(early)} early draws ({early[0]['date']} → {early[-1]['date']}), 7-digit first: {seven}")

if __name__ == "__main__":
    main()
