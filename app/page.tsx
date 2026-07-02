"use client";

import { useState } from "react";
import Form from "./components/Form";
import type { SimInput } from "../lib/simulate";
import styles from "./page.module.css";

export default function Home() {
  const [input, setInput] = useState<SimInput | null>(null);

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>ห้องเครื่องย้อนเวลา</p>
        <h1 className={styles.title}>หวยจำลอง</h1>
        <p className={styles.subtitle}>
          ตั้งเลขเด็ด ย้อนเข็มนาฬิกากลับไปงวดแรก แล้วดูว่าถ้าคุณซื้อเลขเดิมทุกงวดจนถึงวันนี้
          จะเจ๊งหรือรวย
        </p>
      </header>

      <Form onStart={setInput} />

      {input && (
        <section className={styles.result} data-slot="result">
          กำลังปั่นเข็มนาฬิกา… (ผลลัพธ์จะมาในภารกิจถัดไป)
        </section>
      )}
    </div>
  );
}
