"use client";

import { useMemo } from "react";
import type { Ledger, SimInput } from "../../lib/simulate";
import { dcaFromSpend } from "../../lib/dca";
import { fmtBaht, toBE } from "../../lib/fmt";
import { labelForTier } from "./tierLabels";
import { ASSET_KEYS, type AssetKey, type DcaCard, type SeriesData } from "./types";
import ShareCard from "./ShareCard";
import Referral from "./Referral";
import styles from "./Verdict.module.css";

interface Props {
  ledger: Ledger;
  input: SimInput;
  series: Record<AssetKey, SeriesData>;
  onReset: () => void;
}

// draws-full.json coverage starts here; draws before this only carry
// first/last3/last2 fields (see draws-early.json).
const FULL_DATA_START = "2006-12-30";

function beYear(iso: string): number {
  return Number(iso.slice(0, 4)) + 543;
}

export default function Verdict({ ledger, input, series, onReset }: Props) {
  const dcaCards: DcaCard[] = useMemo(() => {
    const out: DcaCard[] = [];
    for (const key of ASSET_KEYS) {
      const s = series[key];
      if (!s) continue;
      const result = dcaFromSpend(ledger.events, s.points);
      if (result.invested <= 0) continue;
      out.push({ key, label: s.label, currency: s.currency, ...result });
    }
    return out;
  }, [ledger.events, series]);

  const hasUnderground = ledger.underground.spent > 0;
  const showEarlyEraNote = ledger.firstDrawDate !== null && ledger.firstDrawDate < FULL_DATA_START;
  const netNegative = ledger.net < 0;

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <p className={styles.heroLabel}>สุทธิ</p>
        <p className={netNegative ? styles.heroAmountNegative : styles.heroAmountPositive}>
          {fmtBaht(ledger.net)}
        </p>
        <div className={styles.heroRow}>
          <div>
            <p className={styles.statLabel}>จ่ายทั้งหมด</p>
            <p className={styles.statValue}>{fmtBaht(ledger.totalSpent)}</p>
          </div>
          <div>
            <p className={styles.statLabel}>ถูกรางวัลคืน</p>
            <p className={styles.statValue}>{fmtBaht(ledger.totalWon)}</p>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <p className={styles.line}>
          ถูก <strong>{ledger.hitCount}</strong> ครั้ง
        </p>
        {ledger.biggestHit && (
          <p className={styles.line}>
            ครั้งใหญ่สุด: {labelForTier(ledger.biggestHit.tier)} {fmtBaht(ledger.biggestHit.amount)} (งวด{" "}
            {toBE(ledger.biggestHit.date)})
          </p>
        )}
        {hasUnderground && (
          <div className={styles.breakdown}>
            <p className={styles.breakdownTitle}>สลาก vs ใต้ดิน</p>
            <p className={styles.line}>
              สลาก: จ่าย {fmtBaht(ledger.lottery.spent)} → ได้ {fmtBaht(ledger.lottery.won)}
            </p>
            <p className={styles.line}>
              ใต้ดิน: จ่าย {fmtBaht(ledger.underground.spent)} → ได้ {fmtBaht(ledger.underground.won)}
            </p>
          </div>
        )}
      </section>

      {ledger.cappedStart && (
        <p className={styles.banner}>นับจากงวดจริงได้ตั้งแต่ 2533 — ของจริงคุณเสียมากกว่านี้อีก</p>
      )}
      {showEarlyEraNote && (
        <p className={styles.note}>
          งวดก่อน 30 ธ.ค. 2549 เช็คได้เฉพาะรางวัลหลัก (ท้าย 2-3 ตัว) และงวดก่อน 2538 รางวัลที่ 1 เป็นเลข 7 หลัก
        </p>
      )}

      {dcaCards.length > 0 && (
        <section className={styles.panel}>
          <p className={styles.legend}>ถ้าเอาเงินหวยไป DCA แทน</p>
          <div className={styles.dcaGrid}>
            {dcaCards.map((c) => (
              <div key={c.key} className={styles.dcaCard}>
                <p className={styles.dcaLabel}>{c.label}</p>
                <p className={styles.dcaWindow}>
                  ช่วง พ.ศ. {beYear(c.from)}–{beYear(c.to)} ({c.monthsCovered} เดือน)
                </p>
                <p className={styles.dcaLine}>
                  ลงไป {fmtBaht(c.invested)} → มูลค่าวันนี้ {fmtBaht(c.value)}
                </p>
                {c.currency === "USD" && <p className={styles.dcaFx}>คิดตามราคา USD ไม่รวมอัตราแลกเปลี่ยน</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <p className={styles.legend}>แชร์ผลลัพธ์</p>
        <ShareCard ledger={ledger} number={input.number} dcaCards={dcaCards} />
      </section>

      <Referral />

      <p className={styles.honesty}>ผลย้อนหลังทำนายอนาคตไม่ได้ — ทุกงวดสุ่มอิสระ</p>

      <button type="button" className={styles.resetButton} onClick={onReset}>
        ย้อนเวลาใหม่อีกครั้ง
      </button>
    </div>
  );
}
