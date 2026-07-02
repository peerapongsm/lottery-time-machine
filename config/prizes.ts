import type { Era } from "../lib/era";

// ---------------------------------------------------------------------------
// Era table for สลากกินแบ่งรัฐบาล (Thai Government Lottery) prize/ticket
// history, ascending by `from`.
//
// Research summary (see task-2-report.md for full source list + approx notes):
//   - Current era (2015-08-01 -> today) is the brief's known-correct anchor;
//     values kept verbatim, NOT re-derived from research.
//   - Pre-2015 era: confirmed via GLO restructuring coverage that (a) the
//     first prize was 4,000,000 THB immediately before the 2558 (2015)
//     restructuring that raised it to 6,000,000 THB and abolished the
//     jackpot; (b) front3 ("เลขหน้า 3 ตัว") did not exist yet -- the older
//     format paid 4 separate last-3-digit prizes ("เลขท้าย 3 ตัว 4 รางวัล"),
//     confirmed directly by the actual 16 Jun 2558 draw result showing four
//     last-3-digit numbers; (c) the 40THB ticket face price documented for
//     GLO tickets ran from 1987 through the 2017 single-ticket reform.
//   - near/second/third/fourth/fifth/last2/last3 amounts for the pre-2015
//     era could NOT be independently verified with a source in this
//     session, so per the "no fabrication" rule they are copied forward
//     from the nearest documented (current) era and the whole era is
//     flagged `approx: true`.
// ---------------------------------------------------------------------------
export const ERAS: Era[] = [
  {
    from: "1990-01-01",
    ticketFace: 40,
    amounts: {
      first: 4_000_000,
      near: 100_000,
      second: 200_000,
      third: 80_000,
      fourth: 40_000,
      fifth: 20_000,
      // front3 omitted: not introduced until the 2015 restructuring.
      last3: 4_000,
      last2: 1_000,
    },
    approx: true,
    source:
      "https://www.thaipbs.or.th/news/content/2063 (first prize 4,000,000฿ pre-2558-restructuring); https://www.bangkokbiznews.com/lifestyle/890738 (40฿ ticket face, 1987-2017); https://lotto.mthai.com/lottery/2989.html (16 Jun 2558 draw shows old 4x last-3-digit format, no front3) -- near/second/third/fourth/fifth/last3/last2 unverified for this span, copied from nearest documented (current) era, approx",
  },
  {
    from: "2015-08-01",
    ticketFace: 80,
    amounts: {
      first: 6_000_000,
      near: 100_000,
      second: 200_000,
      third: 80_000,
      fourth: 40_000,
      fifth: 20_000,
      front3: 4_000,
      last3: 4_000,
      last2: 2_000,
    },
    source: "https://www.glo.or.th (prize structure current)",
  },
];
