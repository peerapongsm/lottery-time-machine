import type { Metadata } from "next";
import Link from "next/link";
import { ERAS } from "../../config/prizes";
import { scaledTicketPrice, type Tier } from "../../lib/era";
import { toBE, fmtBaht } from "../../lib/fmt";
import { TIER_LABEL } from "../components/tierLabels";
import Referral from "../components/Referral";
import meta from "../../public/data/meta.json";
import gold from "../../public/data/series/gold.json";
import set50 from "../../public/data/series/set50.json";
import sp500 from "../../public/data/series/sp500.json";
import btc from "../../public/data/series/btc.json";
import styles from "./method.module.css";

export const metadata: Metadata = {
  title: "หลักการคำนวณ — หวยจำลอง",
  description: "แหล่งข้อมูล วิธีเช็ครางวัล และวิธีคำนวณที่หวยจำลองใช้ — ทั้งหมดตรวจสอบย้อนได้",
};

const TIERS: Tier[] = ["first", "near", "second", "third", "fourth", "fifth", "front3", "last3", "last2"];

// ISO "YYYY-MM" -> พ.ศ. year, for the DCA per-asset window (month precision
// isn't needed here, just "since roughly when").
function beYearFromYm(ym: string): number {
  return Number(ym.slice(0, 4)) + 543;
}

const SERIES = [gold, set50, sp500, btc];
const currentEra = ERAS[ERAS.length - 1];
const oldEra = ERAS[0];
const exampleScaled = scaledTicketPrice(100, oldEra.from);

export default function MethodPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← กลับหน้าแรก
        </Link>
        <p className={styles.eyebrow}>เอกสารประกอบ</p>
        <h1 className={styles.title}>หลักการคำนวณ</h1>
        <p className={styles.subtitle}>ที่มาข้อมูล วิธีเช็ครางวัล และสูตรที่หวยจำลองใช้ — ตรวจสอบย้อนได้ทั้งหมด</p>
      </header>

      {/* 1. แหล่งข้อมูล */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. แหล่งข้อมูล</h2>
        <ul className={styles.list}>
          <li>
            <strong>vicha-w/thai-lotto-archive</strong> — งวด {toBE("2006-12-30")} ถึงงวดล่าสุด {toBE(meta.lastDraw)}{" "}
            ({meta.fullDraws.toLocaleString("th-TH")} งวด) ทุกรางวัล — สอบทานกับ GLO API เป็นจุดๆ (spot-check)
          </li>
          <li>
            <strong>myhora.com</strong> archive รายปี — งวด {toBE(meta.earlyRange[0])} ถึง {toBE(meta.earlyRange[1])}{" "}
            ({meta.earlyDraws.toLocaleString("th-TH")} งวด) เฉพาะรางวัลหลัก (รางวัลที่ 1 / เลขท้าย 2-3 ตัว)
          </li>
          <li>
            <strong>GLO API</strong> (glo.or.th) — ใช้สอบทานเป็นจุดๆ และเป็นแหล่งซ่อมงวดที่ข้อมูลต้นทางเสีย
          </li>
          <li>
            <strong>Yahoo Finance</strong> ราคาปิดรายเดือน — สำหรับเปรียบเทียบ DCA (ทองคำ, SET50, S&P 500, Bitcoin)
          </li>
        </ul>

        <div className={styles.honestyBox}>
          <p className={styles.honestyTitle}>เรื่องที่ต้องพูดตรงๆ</p>
          <p className={styles.honestyLine}>
            <strong>แหล่งที่ถูกปฏิเสธ:</strong> ลองใช้ข้อมูลจาก TrueID ก่อน แต่ไม่ผ่านการตรวจสอบ (gate) —{" "}
            {meta.earlySource} จึงเปลี่ยนไปใช้ myhora.com แทน ซึ่งตรงกับข้อมูล vicha-w ทั้งหมดในช่วงที่ทับซ้อนกัน (
            {meta.gate.overlapDraws.toLocaleString("th-TH")} งวด, mismatch {meta.gate.mismatches} งวด)
          </p>
          <p className={styles.honestyLine}>
            <strong>งวดที่ซ่อม (2 งวด):</strong> {toBE("2026-01-16")} — ข้อมูลต้นทางเสีย สร้างใหม่จาก GLO API โดยตรง
            (glo.or.th) และ {toBE("2007-01-16")} — เลขท้าย 2 ตัวต้นทางผิด (54 ควรเป็น 55) แก้ตามข่าว mgronline.com
            ร่วมสมัยกับงวดนั้น และยืนยันซ้ำกับอีก 2 แหล่งอิสระ
          </p>
          <p className={styles.honestyLine}>
            <strong>รางวัลข้างเคียงรางวัลที่ 1:</strong> คำนวณจากกฎ GLO (รางวัลที่ 1 ± 1) เสมอ ไม่ใช้ค่าที่ archive
            ให้มาตรงๆ เพราะพบว่า archive ต้นทางมีข้อมูลผิดอยู่ {meta.nearMismatches} งวด (แถวปี 2550)
          </p>
        </div>
      </section>

      {/* 2. ตารางเงินรางวัลตามยุค */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. เงินรางวัลตามยุค</h2>
        <p className={styles.bodyText}>
          ราคาฉบับหวยเปลี่ยนจาก {fmtBaht(oldEra.ticketFace)} เป็น {fmtBaht(currentEra.ticketFace)} ตั้งแต่ยุค{" "}
          {toBE(currentEra.from)} เป็นต้นไป — ยุคก่อนหน้านั้นคิดตามธรรมเนียม <strong>"ครึ่งฉบับ"</strong> (ราคา/เงินรางวัลในตารางคือค่าต่อครึ่งฉบับ
          ซึ่งเท่ากับซื้อเป็นคู่ในทางเศรษฐศาสตร์)
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ยุค (ตั้งแต่)</th>
                <th>ราคาฉบับ</th>
                {TIERS.map((t) => (
                  <th key={t}>{TIER_LABEL[t]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ERAS.map((era) => (
                <tr key={era.from}>
                  <td>
                    {toBE(era.from)}
                    {era.approx && <span className={styles.approxBadge}>≈ ประมาณจากยุคใกล้เคียง</span>}
                  </td>
                  <td>{fmtBaht(era.ticketFace)}</td>
                  {TIERS.map((t) => (
                    <td key={t}>{era.amounts[t] !== undefined ? fmtBaht(era.amounts[t]!) : "–"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ERAS.map((era) => (
          <p key={era.from} className={styles.citation}>
            แหล่งอ้างอิงยุค {toBE(era.from)}: {era.source}
          </p>
        ))}
      </section>

      {/* 3. กติกาการเช็ค */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. กติกาการเช็ครางวัล</h2>
        <ul className={styles.list}>
          <li>
            งวด {toBE("2006-12-30")} เป็นต้นไป — เช็คครบทุกรางวัล ({TIERS.map((t) => TIER_LABEL[t]).join(", ")})
          </li>
          <li>
            งวด {toBE(meta.earlyRange[0])} – {toBE(meta.earlyRange[1])} — เช็คเฉพาะเลขท้าย 2 ตัว / เลขท้าย 3 ตัว
            (+ รางวัลที่ 1 เมื่อรางวัลที่ 1 เป็นเลข 6 หลัก คือตั้งแต่ พ.ศ. 2538 เป็นต้นไป)
          </li>
          <li>
            งวดก่อน พ.ศ. 2538 (≤ พ.ศ. 2537) — รางวัลที่ 1 เป็นเลข <strong>7 หลัก</strong> พูดตรงๆ ว่าเลขเด็ด 6 หลัก
            ที่กรอกในหวยจำลอง <strong>ไม่มีทางถูกรางวัลใหญ่ในงวดเหล่านี้ได้เลย</strong> ถูกได้แค่เลขท้าย
          </li>
        </ul>

        <p className={styles.bodyText}>
          ราคาบาทต่อฉบับที่กรอกในฟอร์มคือราคา <strong>ปัจจุบัน</strong> เมื่อจำลองย้อนไปยุคที่ราคาฉบับต่างกัน จะสเกลตาม
          สูตร:
        </p>
        <p className={styles.formula}>ราคายุคเก่า = ราคาที่กรอก × (ราคาฉบับยุคนั้น ÷ ราคาฉบับยุคปัจจุบัน)</p>
        <p className={styles.bodyText}>
          ตัวอย่าง: กรอก {fmtBaht(100)} ต่อฉบับวันนี้ ย้อนไปยุค {toBE(oldEra.from)} (ราคาฉบับ {fmtBaht(oldEra.ticketFace)}{" "}
          เทียบราคาฉบับปัจจุบัน {fmtBaht(currentEra.ticketFace)}) จะคิดเป็น {fmtBaht(exampleScaled)} ต่อฉบับในยุคนั้น
        </p>
      </section>

      {/* 4. DCA methodology */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. วิธีคำนวณ DCA (ถ้าเอาเงินหวยไปลงทุนแทน)</h2>
        <ul className={styles.list}>
          <li>ซื้อทุกงวดที่ตรงกับเดือนที่สินทรัพย์นั้นมีข้อมูลราคา (แต่ละสินทรัพย์มีช่วงข้อมูลของตัวเอง)</li>
          <li>มูลค่าวันนี้ = จำนวนหน่วยที่สะสมได้ × ราคาปิดของเดือนล่าสุดที่มีข้อมูล</li>
          <li>สินทรัพย์ที่ราคาเป็น USD ไม่ได้แปลงอัตราแลกเปลี่ยนเป็นบาท — เทียบราคาดอลลาร์ตรงๆ</li>
          <li>ผลย้อนหลังทำนายอนาคตไม่ได้ (past ≠ future)</li>
        </ul>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>สินทรัพย์</th>
                <th>สกุลเงิน</th>
                <th>ช่วงข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              {SERIES.map((s) => (
                <tr key={s.ticker}>
                  <td>{s.label}</td>
                  <td>{s.currency}</td>
                  <td>
                    พ.ศ. {beYearFromYm(s.points[0].ym)} – {beYearFromYm(s.points[s.points.length - 1].ym)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Disclaimers */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. ข้อจำกัดความรับผิดชอบ</h2>
        <ul className={styles.list}>
          <li>หวยจำลอง<strong>ไม่ใช่เครื่องมือแนะนำเลข</strong> ไม่มีฟีเจอร์ "เลขฮอต" หรือเลขที่ออกบ่อย</li>
          <li>ผลลัพธ์ที่เห็นคือการจำลองจาก<strong>เลขที่คุณกรอกเอง</strong> เทียบกับผลรางวัลจริงในอดีต — ไม่ใช่สถิติว่าเลขไหนเคยถูกจริง</li>
          <li>ผลย้อนหลังทำนายอนาคตไม่ได้ — ทุกงวดสุ่มอิสระจากกัน</li>
        </ul>
      </section>

      <Referral />

      <Link href="/" className={styles.backButton}>
        ← กลับไปย้อนเวลา
      </Link>
    </div>
  );
}
