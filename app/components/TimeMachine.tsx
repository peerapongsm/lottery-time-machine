"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ledger } from "../../lib/simulate";
import { fmtBaht, toBE } from "../../lib/fmt";
import { indexAtElapsed } from "../../lib/timeline";
import { BIG_TIERS, TIER_LABEL, UNDERGROUND_LABEL } from "./tierLabels";
import styles from "./TimeMachine.module.css";

interface Props {
  ledger: Ledger;
  onDone: () => void;
}

interface Celebration {
  date: string;
  label: string;
  amount: number;
}

interface Pop {
  id: number;
  text: string;
}

export default function TimeMachine({ ledger, onDone }: Props) {
  const events = ledger.events;

  const prefixSpent = useMemo(() => {
    const arr = new Array(events.length + 1).fill(0);
    for (let i = 0; i < events.length; i++) arr[i + 1] = arr[i] + events[i].spent;
    return arr;
  }, [events]);

  const [revealed, setRevealed] = useState(0);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [skipped, setSkipped] = useState(false);

  const revealedRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const popIdRef = useRef(0);
  const finishedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    onDoneRef.current();
  }, []);

  const frame = useCallback(
    (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current - pausedAccumRef.current;
      const target = indexAtElapsed(elapsed, events.length);

      let count = revealedRef.current;
      let bigHit: Celebration | null = null;
      const newPops: Pop[] = [];

      while (count <= target && count < events.length) {
        const ev = events[count];
        const big = ev.hits.find((h) => BIG_TIERS.has(h.tier));
        count++;
        if (big) {
          bigHit = { date: ev.date, label: TIER_LABEL[big.tier], amount: big.amount };
          break;
        }
        for (const h of ev.hits) {
          newPops.push({ id: popIdRef.current++, text: `${TIER_LABEL[h.tier]} +${fmtBaht(h.amount)}` });
        }
        if (ev.ugWon > 0) {
          newPops.push({ id: popIdRef.current++, text: `${UNDERGROUND_LABEL} +${fmtBaht(ev.ugWon)}` });
        }
      }

      revealedRef.current = count;
      setRevealed(count);

      if (newPops.length > 0) {
        setPops((prev) => [...prev, ...newPops].slice(-4));
        for (const p of newPops) {
          setTimeout(() => setPops((prev) => prev.filter((x) => x.id !== p.id)), 1400);
        }
      }

      if (bigHit) {
        pauseStartRef.current = now;
        setCelebration(bigHit);
        return;
      }

      if (count >= events.length) {
        setTimeout(finish, 700);
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    },
    [events, finish],
  );

  useEffect(() => {
    if (events.length === 0) {
      finish();
      return;
    }
    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      finish();
      return;
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // frame/finish are stable via useCallback deps on events; intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resume() {
    if (pauseStartRef.current !== null) {
      pausedAccumRef.current += performance.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setCelebration(null);
    rafRef.current = requestAnimationFrame(frame);
  }

  function skipToVerdict() {
    if (skipped) return;
    setSkipped(true);
    finish();
  }

  const spentSoFar = prefixSpent[revealed] ?? ledger.totalSpent;
  const currentDate = events[Math.max(0, revealed - 1)]?.date ?? events[0]?.date ?? null;
  const currentYearBe = currentDate ? Number(currentDate.slice(0, 4)) + 543 : null;

  return (
    <div className={styles.stage} onClick={skipToVerdict} role="presentation">
      <div className={styles.dial}>
        <p className={styles.dialLabel}>ปี พ.ศ.</p>
        <p className={styles.dialYear}>{currentYearBe ?? "—"}</p>
      </div>

      <div className={styles.spentTrack}>
        <p className={styles.spentLabel}>จ่ายสะสม</p>
        <p className={styles.spentAmount}>{fmtBaht(spentSoFar)}</p>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${events.length ? (revealed / events.length) * 100 : 0}%` }}
        />
      </div>

      <button type="button" className={styles.skipButton} onClick={skipToVerdict}>
        ข้ามไปดูผลลัพธ์ →
      </button>

      <div className={styles.pops} aria-live="polite">
        {pops.map((p) => (
          <span key={p.id} className={styles.pop}>
            {p.text}
          </span>
        ))}
      </div>

      {celebration && (
        <div className={styles.overlay}>
          <div className={styles.celebrationCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.celebrationEyebrow}>ถูกรางวัล!</p>
            <p className={styles.celebrationTier}>{celebration.label}</p>
            <p className={styles.celebrationAmount}>{fmtBaht(celebration.amount)}</p>
            <p className={styles.celebrationDate}>งวด {toBE(celebration.date)}</p>
            <button type="button" className={styles.continueButton} onClick={resume}>
              ย้อนเวลาต่อ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
