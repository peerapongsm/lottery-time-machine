import type { Tier } from "../../lib/era";

// Thai display names for prize tiers + which ones are "big" enough to pause
// the TimeMachine animation for a celebration overlay. UI-layer only.

export const TIER_LABEL: Record<Tier, string> = {
  first: "รางวัลที่ 1",
  near: "รางวัลข้างเคียงรางวัลที่ 1",
  second: "รางวัลที่ 2",
  third: "รางวัลที่ 3",
  fourth: "รางวัลที่ 4",
  fifth: "รางวัลที่ 5",
  front3: "เลขหน้า 3 ตัว",
  last3: "เลขท้าย 3 ตัว",
  last2: "เลขท้าย 2 ตัว",
};

// fifth and above (fifth/fourth/third/second/first/near) pause the timeline
// for a celebration overlay; front3/last3/last2 are floating
// pop notifications that don't interrupt playback.
export const BIG_TIERS = new Set<Tier>(["fifth", "fourth", "third", "second", "first", "near"]);

export function labelForTier(tier: string): string {
  return TIER_LABEL[tier as Tier] ?? tier;
}
