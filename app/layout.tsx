import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Sarabun } from "next/font/google";
import Script from "next/script";
import RegisterSW from "./components/RegisterSW";
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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0906",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <RegisterSW />
        <Script
          id="umami-analytics"
          src="https://umami-host-peerapongsms-projects.vercel.app/script.js"
          data-website-id="3f09453d-0b39-443e-8845-5e65611cc58a"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
