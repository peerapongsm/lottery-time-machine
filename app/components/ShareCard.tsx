"use client";

import { useEffect, useRef, useState } from "react";
import type { Ledger } from "../../lib/simulate";
import { fmtBaht } from "../../lib/fmt";
import type { DcaCard } from "./types";
import styles from "./ShareCard.module.css";

interface Props {
  ledger: Ledger;
  number: string;
  dcaCards: DcaCard[];
}

const CARD_URL = "peerapongsm.github.io/lottery-time-machine";
const W = 1200;
const H = 630;

function beYear(iso: string): number {
  return Number(iso.slice(0, 4)) + 543;
}

function bestDca(cards: DcaCard[]): DcaCard | null {
  let best: DcaCard | null = null;
  let bestRatio = -Infinity;
  for (const c of cards) {
    if (c.invested <= 0) continue;
    const ratio = c.value / c.invested;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = c;
    }
  }
  return best;
}

export default function ShareCard({ ledger, number, dcaCards }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showNumber, setShowNumber] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    setCanShareFiles(
      typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function",
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (typeof document !== "undefined" && "fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          // best-effort — draw with whatever is loaded
        }
      }
      if (cancelled) return;

      const root = getComputedStyle(document.documentElement);
      const fontDisplay = root.getPropertyValue("--font-display").trim() || "sans-serif";
      const fontBody = root.getPropertyValue("--font-body").trim() || "sans-serif";
      const brassBright = root.getPropertyValue("--brass-bright").trim() || "#f2cc72";
      const brass = root.getPropertyValue("--brass").trim() || "#d4a94a";
      const ink = root.getPropertyValue("--ink").trim() || "#f3ead9";
      const inkDim = root.getPropertyValue("--ink-dim").trim() || "#a99a7c";
      const danger = root.getPropertyValue("--danger").trim() || "#d1594a";

      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#1e1710");
      bg.addColorStop(1, "#0b0906");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W / 2, -60, 40, W / 2, -60, 700);
      glow.addColorStop(0, "rgba(212, 169, 74, 0.22)");
      glow.addColorStop(1, "rgba(212, 169, 74, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(212, 169, 74, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, W - 32, H - 32);

      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = brass;
      ctx.font = `600 22px ${fontDisplay}`;
      ctx.fillText("ห้องเครื่องย้อนเวลา — หวยจำลอง", 64, 84);

      const events = ledger.events;
      if (events.length > 0) {
        const fromBe = beYear(events[0].date);
        const toBe = beYear(events[events.length - 1].date);
        ctx.fillStyle = inkDim;
        ctx.font = `400 22px ${fontBody}`;
        ctx.fillText(`พ.ศ. ${fromBe}–${toBe} • ถูก ${ledger.hitCount} ครั้ง`, 64, 122);
      }

      ctx.fillStyle = inkDim;
      ctx.font = `400 20px ${fontBody}`;
      ctx.fillText("สุทธิ", 64, 210);

      const net = ledger.net;
      ctx.fillStyle = net < 0 ? danger : brassBright;
      ctx.font = `700 96px ${fontDisplay}`;
      ctx.fillText(fmtBaht(net), 62, 300);

      ctx.fillStyle = ink;
      ctx.font = `400 24px ${fontBody}`;
      ctx.fillText(`จ่ายไป ${fmtBaht(ledger.totalSpent)} → ได้คืน ${fmtBaht(ledger.totalWon)}`, 64, 344);

      const best = bestDca(dcaCards);
      if (best) {
        const fromBe = beYear(best.from);
        const toBe = beYear(best.to);
        ctx.fillStyle = brass;
        ctx.font = `600 22px ${fontBody}`;
        ctx.fillText(
          `ถ้าเอาเงินนี้ไป DCA ${best.label} ช่วง พ.ศ. ${fromBe}–${toBe}: มูลค่าวันนี้ ${fmtBaht(best.value)}`,
          64,
          400,
        );
      }

      if (showNumber) {
        ctx.fillStyle = inkDim;
        ctx.font = `400 18px ${fontBody}`;
        ctx.fillText("เลขเด็ด", 64, 460);
        ctx.fillStyle = brassBright;
        ctx.font = `700 40px ${fontDisplay}`;
        ctx.fillText(number.split("").join(" "), 64, 504);
      }

      ctx.fillStyle = inkDim;
      ctx.font = `400 20px ${fontBody}`;
      ctx.textAlign = "right";
      ctx.fillText(CARD_URL, W - 64, H - 56);
      ctx.textAlign = "left";
    }
    draw();
    return () => {
      cancelled = true;
    };
  }, [ledger, dcaCards, showNumber, number]);

  function canvasToBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(null);
        return;
      }
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function downloadPng(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lottery-time-machine.png";
    document.body.appendChild(a); // must be in the DOM before click — in-app WebViews swallow detached-node clicks
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const blob = await canvasToBlob();
    if (!blob) return;

    if (canShareFiles) {
      const file = new File([blob], "lottery-time-machine.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "หวยจำลอง",
            text: "ผลย้อนเวลาซื้อหวยของฉัน",
          });
          return;
        } catch {
          // user cancelled or share failed — fall through to download
        }
      }
    }
    downloadPng(blob);
  }

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />
      <div className={styles.controls}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showNumber} onChange={(e) => setShowNumber(e.target.checked)} />
          โชว์เลขบนการ์ด
        </label>
        <button type="button" className={styles.shareButton} onClick={handleShare}>
          {canShareFiles ? "แชร์การ์ด" : "ดาวน์โหลดการ์ด"}
        </button>
      </div>
    </div>
  );
}
