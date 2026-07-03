"use client";

import { useEffect, useRef, useState } from "react";
import type { SimInput } from "../../lib/simulate";
import { fmtBaht } from "../../lib/fmt";
import styles from "./Form.module.css";

const STORAGE_KEY = "ltm:input:v1";
const OLDEST_CE_YEAR = 1990; // พ.ศ. 2533
const BASE_MAX_CE_YEAR = 2026; // SSR-safe default; bumped client-side if the real year is later

function onlyDigits(s: string): string {
  return s.replace(/[^0-9]/g, "");
}

interface StoredState {
  digits: string[];
  ticketsPerDraw: number;
  pricePerTicket: number;
  startYear: number;
}

function isStoredState(v: unknown): v is StoredState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  if (!Array.isArray(s.digits) || s.digits.length !== 6) return false;
  if (typeof s.ticketsPerDraw !== "number") return false;
  if (typeof s.pricePerTicket !== "number") return false;
  if (typeof s.startYear !== "number") return false;
  return true;
}

export default function Form({ onStart }: { onStart: (input: SimInput) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [ticketsPerDraw, setTicketsPerDraw] = useState(1);
  const [pricePerTicket, setPricePerTicket] = useState(100);
  const [startYear, setStartYear] = useState(OLDEST_CE_YEAR);
  const [maxCeYear, setMaxCeYear] = useState(BASE_MAX_CE_YEAR);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [birthday, setBirthday] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const restored = useRef(false);

  // Restore last input (client-only, post-mount — never during SSR render).
  useEffect(() => {
    const realYear = new Date().getFullYear();
    if (realYear > BASE_MAX_CE_YEAR) setMaxCeYear(realYear);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredState(parsed)) return;
      setDigits(parsed.digits.map((d) => onlyDigits(String(d)).slice(0, 1)));
      setTicketsPerDraw(parsed.ticketsPerDraw);
      setPricePerTicket(parsed.pricePerTicket);
      setStartYear(parsed.startYear);
    } catch {
      // corrupt JSON — ignore, keep defaults
    } finally {
      restored.current = true;
    }
  }, []);

  // Persist draft after restore, so we don't clobber storage with defaults on first paint.
  useEffect(() => {
    if (!restored.current) return;
    const state: StoredState = { digits, ticketsPerDraw, pricePerTicket, startYear };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [digits, ticketsPerDraw, pricePerTicket, startYear]);

  function setDigitAt(i: number, raw: string) {
    const clean = onlyDigits(raw);
    if (clean.length <= 1) {
      setDigits((prev) => {
        const next = [...prev];
        next[i] = clean;
        return next;
      });
      if (clean && i < 5) digitRefs.current[i + 1]?.focus();
      return;
    }
    // pasted multiple digits — spread across boxes from here
    setDigits((prev) => {
      const next = [...prev];
      for (let k = 0; k < clean.length && i + k < 6; k++) next[i + k] = clean[k];
      return next;
    });
    const landing = Math.min(i + clean.length, 5);
    digitRefs.current[landing]?.focus();
  }

  function onDigitKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      digitRefs.current[i - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[i - 1] = "";
        return next;
      });
    }
    if (e.key === "ArrowLeft" && i > 0) digitRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) digitRefs.current[i + 1]?.focus();
  }

  function applyBirthday() {
    if (!birthday) return;
    const [y, m, d] = birthday.split("-");
    const str = `${d}${m}${y.slice(-2)}`;
    setDigits(str.split("").slice(0, 6));
    setBirthdayOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numberStr = digits.join("");
    const nextErrors: Record<string, string> = {};

    if (!/^\d{6}$/.test(numberStr)) nextErrors.number = "กรอกเลขให้ครบ 6 หลัก";
    if (!(ticketsPerDraw >= 1 && ticketsPerDraw <= 20)) nextErrors.tickets = "ใบต่องวด 1-20 ใบ";
    if (!(pricePerTicket >= 40 && pricePerTicket <= 500)) nextErrors.price = "บาทต่อใบ 40-500 บาท";

    if (!(Number.isFinite(startYear) && startYear >= OLDEST_CE_YEAR && startYear <= maxCeYear)) {
      nextErrors.startYear = "เลือกปีที่เริ่มซื้อที่ถูกต้อง";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onStart({ number: numberStr, ticketsPerDraw, pricePerTicket, startYear });
  }

  const beYears: number[] = [];
  for (let y = maxCeYear; y >= OLDEST_CE_YEAR; y--) beYears.push(y);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset className={styles.panel}>
        <legend className={styles.legend}>เลขเด็ด</legend>
        <div className={styles.digitRow}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                digitRefs.current[i] = el;
              }}
              className={styles.digitBox}
              type="text"
              inputMode="numeric"
              maxLength={6}
              name={`digit-${i}`}
              value={d}
              aria-label={`หลักที่ ${i + 1}`}
              onChange={(e) => setDigitAt(i, e.target.value)}
              onKeyDown={(e) => onDigitKeyDown(i, e)}
            />
          ))}
        </div>
        {errors.number && <p className={styles.error}>{errors.number}</p>}

        <div className={styles.birthdayRow}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setBirthdayOpen((v) => !v)}
          >
            จากวันเกิด
          </button>
          {birthdayOpen && (
            <div className={styles.birthdayPicker}>
              <input
                type="date"
                className={styles.dateInput}
                name="birthday"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                aria-label="เลือกวันเกิด"
              />
              <button type="button" className={styles.smallButton} onClick={applyBirthday}>
                ใช้เลขนี้
              </button>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className={styles.panel}>
        <legend className={styles.legend}>รูปแบบการซื้อ</legend>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tickets">ใบต่องวด</label>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => setTicketsPerDraw((v) => Math.max(1, v - 1))}
              >
                −
              </button>
              <input
                id="tickets"
                name="tickets"
                className={styles.numberInput}
                type="number"
                min={1}
                max={20}
                value={ticketsPerDraw}
                onChange={(e) => setTicketsPerDraw(Number(e.target.value) || 1)}
              />
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => setTicketsPerDraw((v) => Math.min(20, v + 1))}
              >
                +
              </button>
            </div>
            {errors.tickets && <p className={styles.error}>{errors.tickets}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="price">บาทต่อใบ</label>
            <input
              id="price"
              name="price"
              className={styles.range}
              type="range"
              min={40}
              max={500}
              step={10}
              value={pricePerTicket}
              onChange={(e) => setPricePerTicket(Number(e.target.value))}
            />
            <p className={styles.rangeReadout}>{fmtBaht(pricePerTicket)}</p>
            {errors.price && <p className={styles.error}>{errors.price}</p>}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="startYear">ปีที่เริ่มซื้อ</label>
          <select
            id="startYear"
            name="startYear"
            className={styles.select}
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          >
            {beYears.map((ce) => (
              <option key={ce} value={ce}>
                พ.ศ. {ce + 543}
              </option>
            ))}
          </select>
          {errors.startYear && <p className={styles.error}>{errors.startYear}</p>}
        </div>

        <p className={styles.summary}>
          งวดละ {fmtBaht(pricePerTicket)} × {ticketsPerDraw} ใบ = {fmtBaht(pricePerTicket * ticketsPerDraw)}
        </p>
      </fieldset>

      <button type="submit" className={styles.startButton}>
        เริ่มย้อนเวลา
      </button>
    </form>
  );
}
