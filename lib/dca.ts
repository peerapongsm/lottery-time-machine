export interface SeriesPoint { ym: string; close: number; }

export interface DcaResult { invested: number; value: number; from: string; to: string; monthsCovered: number; }

export function dcaFromSpend(events: { date: string; spent: number }[], series: SeriesPoint[]): DcaResult {
  const byYm = new Map(series.map(p => [p.ym, p.close]));
  const last = series[series.length - 1];
  let invested = 0, units = 0; let from = "", to = "";
  const months = new Set<string>();
  for (const e of events) {
    const ym = e.date.slice(0, 7);
    const close = byYm.get(ym);
    if (close === undefined || e.spent <= 0) continue;
    invested += e.spent; units += e.spent / close;
    if (!from) from = ym; to = ym; months.add(ym);
  }
  return { invested, value: last ? units * last.close : 0, from, to, monthsCovered: months.size };
}
