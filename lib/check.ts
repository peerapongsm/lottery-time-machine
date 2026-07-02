import { eraFor, type Tier } from "./era";
export interface Draw { date: string; first: string; near?: string[]; second?: string[]; third?: string[]; fourth?: string[]; fifth?: string[]; front3?: string[]; last3?: string[]; last2?: string; }
export interface Hit { tier: Tier; amount: number; }

export function nearNumbers(first: string): [string, string] {
  const n = parseInt(first, 10);
  const pad = (x: number) => ((x + 1_000_000) % 1_000_000).toString().padStart(6, "0");
  return [pad(n - 1), pad(n + 1)];
}

export function checkTicket(num: string, draw: Draw): Hit[] {
  const era = eraFor(draw.date);
  const hits: Hit[] = [];
  const add = (tier: Tier, cond: boolean) => {
    const amt = era.amounts[tier];
    if (cond && amt !== undefined) hits.push({ tier, amount: amt });
  };
  add("first", draw.first === num);
  add("near", (draw.near ?? []).includes(num));
  add("second", (draw.second ?? []).includes(num));
  add("third", (draw.third ?? []).includes(num));
  add("fourth", (draw.fourth ?? []).includes(num));
  add("fifth", (draw.fifth ?? []).includes(num));
  add("front3", (draw.front3 ?? []).includes(num.slice(0, 3)));
  add("last3", (draw.last3 ?? []).includes(num.slice(3)));
  add("last2", draw.last2 !== undefined && draw.last2 === num.slice(4));
  return hits;
}

export type UgType = "top2" | "bottom2" | "top3" | "tode3";
export interface UndergroundBet { type: UgType; digits: string; stake: number; rate: number; }

const sortDigits = (s: string) => s.split("").sort().join("");

export function checkUnderground(bet: UndergroundBet, draw: Draw): number {
  const top3 = draw.first.slice(3);
  const hit =
    bet.type === "top2" ? draw.first.slice(4) === bet.digits :
    bet.type === "bottom2" ? draw.last2 !== undefined && draw.last2 === bet.digits :
    bet.type === "top3" ? top3 === bet.digits :
    /* tode3 */ sortDigits(top3) === sortDigits(bet.digits) && top3 !== "" ;
  return hit ? bet.stake * bet.rate : 0;
}
