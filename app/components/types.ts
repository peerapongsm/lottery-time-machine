// UI-layer types for the result flow (fetched series data + derived DCA
// cards). Kept out of lib/ since these describe fetch/display shapes, not
// simulation domain logic.

export interface SeriesPoint {
  ym: string;
  close: number;
}

export interface SeriesData {
  label: string;
  currency: string;
  ticker: string;
  points: SeriesPoint[];
}

export type AssetKey = "gold" | "set50" | "sp500" | "btc";

export const ASSET_KEYS: AssetKey[] = ["gold", "set50", "sp500", "btc"];

export interface DcaCard {
  key: AssetKey;
  label: string;
  currency: string;
  invested: number;
  value: number;
  from: string;
  to: string;
  monthsCovered: number;
}
