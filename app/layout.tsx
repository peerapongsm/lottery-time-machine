import type { Metadata } from "next";
import { Chakra_Petch, Sarabun } from "next/font/google";
import "./globals.css";

const display = Chakra_Petch({
  variable: "--font-display",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

const body = Sarabun({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "หวยจำลอง — เครื่องย้อนเวลาซื้อหวย",
  description:
    "ย้อนเวลาไปซื้อหวยเลขเดิมทุกงวดตั้งแต่อดีตจนถึงวันนี้ แล้วดูว่าจะได้หรือเสียเท่าไร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
