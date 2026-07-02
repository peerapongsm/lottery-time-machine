import styles from "./Referral.module.css";

export default function Referral() {
  return (
    <section className={styles.panel} aria-labelledby="referral-heading">
      <p id="referral-heading" className={styles.heading}>
        หากการพนันเริ่มเป็นปัญหา
      </p>
      <p className={styles.body}>
        ไม่ว่าผลลัพธ์ข้างบนจะเป็นยังไง การพนันยังมีความเสี่ยง ถ้ารู้สึกว่าเริ่มคุมไม่ได้ ลองคุยกับคนที่ช่วยได้
      </p>
      <div className={styles.links}>
        <a className={styles.linkButton} href="tel:1323">
          สายด่วนสุขภาพจิต 1323
        </a>
        <a
          className={styles.linkButton}
          href="https://www.gamblingstudy-th.org"
          target="_blank"
          rel="noreferrer"
        >
          ศูนย์ศึกษาปัญหาการพนัน
        </a>
      </div>
    </section>
  );
}
