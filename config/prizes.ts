import type { Era } from "../lib/era";

// ---------------------------------------------------------------------------
// Era table for สลากกินแบ่งรัฐบาล (Thai Government Lottery) prize/ticket
// history, ascending by `from`.
//
// Research summary (see task-2-report.md for full source list + approx notes):
//   - Current era (2015-08-01 -> today) is the brief's known-correct anchor;
//     values kept verbatim, NOT re-derived from research.
//   - Pre-2015 era: ALL tier amounts are directly sourced from the official
//     GLO prize table reproduced on English Wikipedia ("Thai_lottery"
//     article, table "Official Prizes for Thai Government and Thai Charity
//     Lotteries on 1 August 2014 - 16 July 2015" -- the period immediately
//     before the Aug 2558/2015 restructuring), normalized to the PER-HALF
//     convention: the table lists per-half base amounts and itself states
//     "the published prize amount is doubled" for the pair; the values
//     here are those per-half bases (published pair amounts / 2).
//     Per-half convention: one "ใบ" pre-2015 = ครึ่งฉบับ 40฿; ticket-count
//     scaling makes this economically identical to pairs.
//   - front3 ("เลขหน้า 3 ตัว") did not exist yet -- the older format paid
//     4 separate last-3-digit prizes ("เลขท้าย 3 ตัว 4 รางวัล"), confirmed
//     directly by the actual 16 Jun 2558 draw result showing four
//     last-3-digit numbers. front3 is therefore omitted from this era.
//   - The 40THB per-half ticket face price is documented for GLO tickets
//     from 1987 through the 2017 single-ticket reform.
//   - `approx: true` covers ONLY the span assumption: the sourced table
//     documents 1 Aug 2014 - 16 Jul 2015, and these values are held
//     constant back across the whole 1990-2014 span without per-year
//     verification.
// ---------------------------------------------------------------------------
export const ERAS: Era[] = [
  {
    from: "1990-01-01",
    // per-half convention: one "ใบ" pre-2015 = ครึ่งฉบับ 40฿; ticket-count
    // scaling makes this economically identical to pairs.
    ticketFace: 40,
    amounts: {
      first: 2_000_000,
      near: 50_000,
      second: 100_000,
      third: 40_000,
      fourth: 20_000,
      fifth: 10_000,
      // front3 omitted: not introduced until the 2015 restructuring.
      last3: 2_000,
      last2: 1_000,
    },
    approx: true,
    source:
      "https://en.wikipedia.org/wiki/Thai_lottery (official GLO prize table 'Official Prizes for Thai Government and Thai Charity Lotteries on 1 August 2014 - 16 July 2015', immediately pre-restructuring): ALL tier amounts taken directly from that table, normalized to the per-half convention (per-half = published pair amounts / 2; the table itself states the published prize amount is doubled for pairs). first 2,000,000 (TGL); near/±1 50,000; second 100,000; third 40,000; fourth 20,000; fifth 10,000; last3 2,000 (4 draws); last2 1,000. Corroborating: https://www.thaipbs.or.th/news/content/2063 (2558 restructuring raised first prize, abolished jackpot); https://www.bangkokbiznews.com/lifestyle/890738 (40฿ per-half ticket face, 1987-2017); https://lotto.mthai.com/lottery/2989.html (16 Jun 2558 draw shows old 4x last-3-digit format, no front3). approx: values documented for 1 Aug 2014 - 16 Jul 2015 are held constant across the whole 1990-2014 span without per-year verification",
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
