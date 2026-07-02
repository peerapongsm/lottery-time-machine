// One-time bake of PWA icons (public/icons/icon-192.png, icon-512.png).
// Hand-rolled PNG encoder (zlib deflate + manual CRC32) so no image/canvas
// dependency is needed. Icon is a simple brass coin/clock mark matching the
// design system colors in app/globals.css (--bg, --brass, --bg-panel, --ink).
//
// Usage: npx tsx scripts/gen-icons.ts

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

type RGB = [number, number, number];
const BG: RGB = [0x0b, 0x09, 0x06]; // --bg
const BRASS: RGB = [0xd4, 0xa9, 0x4a]; // --brass
const PANEL: RGB = [0x17, 0x12, 0x09]; // --bg-panel
const INK: RGB = [0xf3, 0xea, 0xd9]; // --ink
const BRASS_BRIGHT: RGB = [0xf2, 0xcc, 0x72]; // --brass-bright

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

function encodePng(width: number, height: number, rgba: Buffer): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk("IHDR", ihdrData);

  // Each scanline prefixed with filter byte 0 (none).
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = chunk("IDAT", deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function drawIcon(size: number): Buffer {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.3;
  const dotR = size * 0.025;
  const handThickness = Math.max(1, size * 0.035);

  // Hour hand: straight up. Minute hand: pointing toward ~4 o'clock.
  const hourEnd = { x: cx, y: cy - innerR * 0.6 };
  const minuteAngle = (30 * Math.PI) / 180;
  const minuteEnd = { x: cx + innerR * 0.85 * Math.cos(minuteAngle), y: cy + innerR * 0.85 * Math.sin(minuteAngle) };

  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.hypot(dx, dy);

      let color: RGB = BG;
      if (dist <= outerR) color = BRASS;
      if (dist <= innerR) color = PANEL;
      if (
        distToSegment(x + 0.5, y + 0.5, cx, cy, hourEnd.x, hourEnd.y) <= handThickness / 2 ||
        distToSegment(x + 0.5, y + 0.5, cx, cy, minuteEnd.x, minuteEnd.y) <= handThickness / 2
      ) {
        color = INK;
      }
      if (dist <= dotR) color = BRASS_BRIGHT;

      const i = (y * size + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function main(): void {
  mkdirSync("public/icons", { recursive: true });
  for (const size of [192, 512]) {
    const png = encodePng(size, size, drawIcon(size));
    writeFileSync(`public/icons/icon-${size}.png`, png);
    console.log(`wrote public/icons/icon-${size}.png (${png.length} bytes)`);
  }
}

main();
