import { Jimp } from "jimp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "site", "assets", "urunler");
const BOTTLES = ["elma-sirkesi", "enginar-sirkesi", "ananas-sirkesi"];

// Background candidate: light + low-saturation (matches studio white-gray).
function isBg(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= 213 && (max - min) <= 26;
}

for (const name of BOTTLES) {
  const img = await Jimp.read(join(SRC, name + ".jpeg"));
  const { width: w, height: h, data } = img.bitmap;
  const done = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const push = (x, y) => {
    const p = y * w + x;
    if (done[p]) return;
    const i = p * 4;
    if (!isBg(data[i], data[i + 1], data[i + 2])) return;
    done[p] = 1;
    stack[sp++] = p;
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (sp > 0) {
    const p = stack[--sp];
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  // Recolor background (and connected near-white glass) to pure white.
  for (let p = 0; p < w * h; p++) {
    if (done[p]) { const i = p * 4; data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255; }
  }
  // Square-pad on white so framing matches the other (square) product cutouts.
  const side = Math.round(Math.max(w, h) * 1.04);
  const canvas = new Jimp({ width: side, height: side, color: 0xffffffff });
  canvas.composite(img, Math.round((side - w) / 2), Math.round((side - h) / 2));
  await canvas.write(join(SRC, name + ".png"));
  console.log("whitened:", name + ".png", `${side}x${side}`);
}
console.log("done.");
