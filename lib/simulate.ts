import { checkTicket, type Draw, type Hit } from "./check";
import { scaledTicketPrice } from "./era";

export interface SimInput { number: string; ticketsPerDraw: number; pricePerTicket: number; startYear: number; /* CE */ }
export interface DrawEvent { date: string; spent: number; won: number; hits: Hit[]; }
export interface Ledger {
  events: DrawEvent[]; totalSpent: number; totalWon: number; net: number;
  hitCount: number; biggestHit: { date: string; tier: string; amount: number } | null;
  cappedStart: boolean; firstDrawDate: string | null;
}

export function simulate(input: SimInput, draws: Draw[]): Ledger {
  const startDate = `${input.startYear}-01-01`;
  const inWindow = draws.filter(d => d.date >= startDate);
  const cappedStart = draws.length > 0 && input.startYear < parseInt(draws[0].date);
  const events: DrawEvent[] = [];
  let totalSpent = 0, totalWon = 0, hitCount = 0;
  let biggest: Ledger["biggestHit"] = null;

  for (const d of inWindow) {
    const price = scaledTicketPrice(input.pricePerTicket, d.date);
    const spent = price * input.ticketsPerDraw;
    const hits = input.ticketsPerDraw > 0 ? checkTicket(input.number, d) : [];
    const won = hits.reduce((s, h) => s + h.amount, 0) * input.ticketsPerDraw;
    totalSpent += spent; totalWon += won;
    if (hits.length > 0) hitCount++;
    for (const h of hits) if (!biggest || h.amount > biggest.amount) biggest = { date: d.date, tier: h.tier, amount: h.amount };
    events.push({ date: d.date, spent, won, hits });
  }
  return { events, totalSpent, totalWon, net: totalWon - totalSpent, hitCount, biggestHit: biggest,
    cappedStart, firstDrawDate: inWindow[0]?.date ?? null };
}
