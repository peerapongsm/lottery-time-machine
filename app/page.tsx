"use client";

import { useState } from "react";
import Form from "./components/Form";
import TimeMachine from "./components/TimeMachine";
import Verdict from "./components/Verdict";
import { simulate, type Ledger, type SimInput } from "../lib/simulate";
import type { Draw } from "../lib/check";
import { ASSET_KEYS, type AssetKey, type SeriesData } from "./components/types";
import styles from "./page.module.css";

// Static export + basePath: fetches must be rooted at the configured
// basePath (see next.config.ts) since there's no server to rewrite paths.
const BASE_PATH = "/lottery-time-machine";

type Phase = "form" | "loading" | "error" | "animating" | "verdict";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_PATH}${path}`);
  if (!res.ok) throw new Error(`failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("form");
  const [input, setInput] = useState<SimInput | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [series, setSeries] = useState<Record<AssetKey, SeriesData> | null>(null);

  async function handleStart(nextInput: SimInput) {
    setInput(nextInput);
    setPhase("loading");
    try {
      const [early, full, ...seriesList] = await Promise.all([
        fetchJson<Draw[]>("/data/draws-early.json"),
        fetchJson<Draw[]>("/data/draws-full.json"),
        ...ASSET_KEYS.map((key) => fetchJson<SeriesData>(`/data/series/${key}.json`)),
      ]);
      const draws = [...early, ...full].sort((a, b) => a.date.localeCompare(b.date));
      const nextLedger = simulate(nextInput, draws);
      const seriesMap = Object.fromEntries(
        ASSET_KEYS.map((key, i) => [key, seriesList[i]]),
      ) as Record<AssetKey, SeriesData>;

      setLedger(nextLedger);
      setSeries(seriesMap);
      setPhase("animating");
    } catch {
      setPhase("error");
    }
  }

  function handleAnimationDone() {
    setPhase("verdict");
  }

  function handleReset() {
    setPhase("form");
    setInput(null);
    setLedger(null);
    setSeries(null);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>ห้องเครื่องย้อนเวลา</p>
        <h1 className={styles.title}>หวยจำลอง</h1>
        <p className={styles.subtitle}>
          ตั้งเลขเด็ด ย้อนเข็มนาฬิกากลับไปงวดแรก แล้วดูว่าถ้าคุณซื้อเลขเดิมทุกงวดจนถึงวันนี้
          จะเจ๊งหรือรวย
        </p>
        <p className={styles.honestyNote}>ผลย้อนหลังทำนายอนาคตไม่ได้ — ทุกงวดสุ่มอิสระ</p>
      </header>

      {phase === "form" && <Form onStart={handleStart} />}

      {phase === "loading" && (
        <section className={styles.result}>กำลังย้อนเวลา… โหลดข้อมูลงวดหวยและราคาสินทรัพย์</section>
      )}

      {phase === "error" && (
        <section className={styles.result}>
          โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง
          <br />
          <button type="button" className={styles.retryButton} onClick={handleReset}>
            กลับไปกรอกใหม่
          </button>
        </section>
      )}

      {phase === "animating" && ledger && <TimeMachine ledger={ledger} onDone={handleAnimationDone} />}

      {phase === "verdict" && ledger && series && input && (
        <Verdict ledger={ledger} input={input} series={series} onReset={handleReset} />
      )}
    </div>
  );
}
