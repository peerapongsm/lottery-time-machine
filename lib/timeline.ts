// Pure timeline math for the TimeMachine replay animation. No DOM, no state —
// maps "how much wall-clock time has elapsed" to "how many events should be
// revealed by now", using a convex power curve so early events are spaced
// far apart (slow) and later events bunch up (fast).

export interface TimelineConfig {
  totalMs: number;
  power: number;
}

export const DEFAULT_TIMELINE: TimelineConfig = { totalMs: 25_000, power: 2.4 };

/** How many events (0-based index of the last one) should be revealed at `elapsedMs`. */
export function indexAtElapsed(
  elapsedMs: number,
  eventCount: number,
  config: TimelineConfig = DEFAULT_TIMELINE,
): number {
  if (eventCount <= 0) return -1;
  const t = Math.min(1, Math.max(0, elapsedMs / config.totalMs));
  const progress = Math.pow(t, config.power);
  return Math.min(eventCount - 1, Math.floor(progress * eventCount));
}
