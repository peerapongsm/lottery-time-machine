export type Tier =
  | "first"
  | "near"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "front3"
  | "last3"
  | "last2";

export interface Era {
  from: string;
  ticketFace: number;
  amounts: Partial<Record<Tier, number>>;
  approx?: boolean;
  source: string;
}

import { ERAS } from "../config/prizes";

export function eraFor(date: string): Era {
  let hit: Era | undefined;
  for (const e of ERAS) if (e.from <= date) hit = e;
  if (!hit) throw new Error(`no era covers ${date}`);
  return hit;
}

export function scaledTicketPrice(userPriceNow: number, date: string): number {
  const now = ERAS[ERAS.length - 1];
  return userPriceNow * (eraFor(date).ticketFace / now.ticketFace);
}
