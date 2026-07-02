// Bake monthly investment series from Yahoo Finance (adapted from set-is-dead's
// lib/ingest/yahoo.ts). Output: public/data/series/<id>.json
// Run: npx tsx scripts/ingest-series.ts

import { writeFileSync, mkdirSync } from "node:fs";
import type { SeriesPoint } from "../lib/dca";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

const ASSETS = [
  { id: "gold", label: "ทองคำ (Gold futures)", currency: "USD", ticker: "GC=F", minStart: "2001-01" },
  { id: "set50", label: "SET50 (TDEX)", currency: "THB", ticker: "TDEX.BK", minStart: "2011-01" },
  { id: "sp500", label: "S&P 500", currency: "USD", ticker: "^GSPC", minStart: "1995-01" },
  { id: "btc", label: "Bitcoin", currency: "USD", ticker: "BTC-USD", minStart: "2015-01" },
] as const;

function parseChart(json: unknown): SeriesPoint[] {
  const r = (json as { chart?: { result?: Array<Record<string, unknown>> } })?.chart?.result?.[0] as
    | { timestamp?: number[]; indicators?: { adjclose?: Array<{ adjclose?: (number | null)[] }>; quote?: Array<{ close?: (number | null)[] }> } }
    | undefined;
  if (!r?.timestamp) return [];
  const vals = r.indicators?.adjclose?.[0]?.adjclose ?? r.indicators?.quote?.[0]?.close ?? [];
  const out: SeriesPoint[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < r.timestamp.length; i++) {
    const v = vals[i];
    if (v == null || v <= 0) continue;
    const d = new Date(r.timestamp[i] * 1000);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (seen.has(ym)) { out[out.length - 1] = { ym, close: v }; continue; } // keep last obs per month
    seen.add(ym);
    out.push({ ym, close: v });
  }
  return out;
}

async function fetchSeries(ticker: string): Promise<SeriesPoint[]> {
  // explicit period window: range=max silently degrades to quarterly granularity
  const p1 = Math.floor(Date.UTC(1990, 0, 1) / 1000);
  const p2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${p1}&period2=${p2}&interval=1mo`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Yahoo ${ticker} ${res.status}`);
  return parseChart(await res.json());
}

async function main(): Promise<void> {
  mkdirSync("public/data/series", { recursive: true });
  for (const a of ASSETS) {
    const points = await fetchSeries(a.ticker);
    if (points.length < 100) throw new Error(`${a.id}: only ${points.length} points`);
    if (points[0].ym > a.minStart) throw new Error(`${a.id}: starts ${points[0].ym}, expected <= ${a.minStart}`);
    writeFileSync(`public/data/series/${a.id}.json`,
      JSON.stringify({ label: a.label, currency: a.currency, ticker: a.ticker, points }) + "\n");
    console.log(`${a.id}: ${points.length} points ${points[0].ym} → ${points[points.length - 1].ym}`);
  }
}

main();
