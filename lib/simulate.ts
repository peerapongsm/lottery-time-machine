import { checkTicket, checkUnderground, type Draw, type Hit, type UndergroundBet } from "./check";
import { scaledTicketPrice } from "./era";

export interface SimInput { number: string; ticketsPerDraw: number; pricePerTicket: number; startYear: number; /* CE */ underground: UndergroundBet[]; }
export interface DrawEvent { date: string; spent: number; won: number; hits: Hit[]; ugWon: number; }
export interface Ledger {
  events: DrawEvent[]; totalSpent: number; totalWon: number; net: number;
  hitCount: number; biggestHit: { date: string; tier: string; amount: number } | null;
  lottery: { spent: number; won: number }; underground: { spent: number; won: number };
  cappedStart: boolean; firstDrawDate: string | null;
}

export function simulate(input: SimInput, draws: Draw[]): Ledger {
  const startDate = `${input.startYear}-01-01`;
  const inWindow = draws.filter(d => d.date >= startDate);
  const cappedStart = draws.length > 0 && input.startYear < parseInt(draws[0].date);
  const events: DrawEvent[] = [];
  let lotSpent = 0, lotWon = 0, ugSpent = 0, ugWon = 0, hitCount = 0;
  let biggest: Ledger["biggestHit"] = null;

  for (const d of inWindow) {
    const price = scaledTicketPrice(input.pricePerTicket, d.date);
    const spentLot = price * input.ticketsPerDraw;
    const hits = input.ticketsPerDraw > 0 ? checkTicket(input.number, d) : [];
    const wonLot = hits.reduce((s, h) => s + h.amount, 0) * input.ticketsPerDraw;
    let wonUg = 0, spentUg = 0;
    for (const bet of input.underground) { spentUg += bet.stake; wonUg += checkUnderground(bet, d); }
    lotSpent += spentLot; lotWon += wonLot; ugSpent += spentUg; ugWon += wonUg;
    if (hits.length > 0 || wonUg > 0) hitCount++;
    for (const h of hits) if (!biggest || h.amount > biggest.amount) biggest = { date: d.date, tier: h.tier, amount: h.amount };
    if (wonUg > 0 && (!biggest || wonUg > biggest.amount)) biggest = { date: d.date, tier: "underground", amount: wonUg };
    events.push({ date: d.date, spent: spentLot + spentUg, won: wonLot + wonUg, hits, ugWon: wonUg });
  }
  const totalSpent = lotSpent + ugSpent, totalWon = lotWon + ugWon;
  return { events, totalSpent, totalWon, net: totalWon - totalSpent, hitCount, biggestHit: biggest,
    lottery: { spent: lotSpent, won: lotWon }, underground: { spent: ugSpent, won: ugWon },
    cappedStart, firstDrawDate: inWindow[0]?.date ?? null };
}
