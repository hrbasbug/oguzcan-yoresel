import { Jimp } from "jimp";
import { readdirSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "site", "assets", "urunler");

// Translucent glass bottles are handled by whiten-bottles.mjs — skip them here.
const SKIP = new Set(["elma-sirkesi", "enginar-sirkesi", "ananas-sirkesi"]);

// A pixel counts as "background candidate" if it's light + low-saturation.
// Studio backgrounds here carry a subtle cool (bluish) tint, so we allow a
// generous saturation window; real product colours (reds/oranges/kraft) are
// far more saturated and stay safe.
function isBg(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= 224 && (max - min) <= 34;
}
// Looser test used only for edge feathering.
function whiteness(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  if (max - min > 40) return 0;
  return Math.max(0, Math.min(1, (min - 206) / (246 - 206)));
}

async function processOne(file) {
  const img = await Jimp.read(join(SRC, file));
  const { width: w, height: h, data } = img.bitmap;
  const removed = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;

  const push = (x, y) => {
    const p = y * w + x;
    if (removed[p]) return;
    const i = p * 4;
    if (!isBg(data[i], data[i + 1], data[i + 2])) return;
    removed[p] = 1;
    stack[sp++] = p;
  };

  // Seed flood-fill from every border pixel.
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

  // Drop small disconnected islands (stray label-text fragments floating in
  // the removed background). Keep only the largest connected blob of retained
  // pixels — the actual product — and mark everything else as removed.
  {
    const label = new Int32Array(w * h).fill(-1);
    const comp = stack; // reuse scratch buffer
    let best = -1, bestSize = 0;
    let cur = 0;
    for (let s = 0; s < w * h; s++) {
      if (removed[s] || label[s] !== -1) continue;
      let head = 0, tail = 0;
      comp[tail++] = s;
      label[s] = cur;
      while (head < tail) {
        const p = comp[head++];
        const x = p % w, y = (p / w) | 0;
        const nb = [
          x > 0 ? p - 1 : -1,
          x < w - 1 ? p + 1 : -1,
          y > 0 ? p - w : -1,
          y < h - 1 ? p + w : -1,
        ];
        for (const q of nb) {
          if (q >= 0 && !removed[q] && label[q] === -1) { label[q] = cur; comp[tail++] = q; }
        }
      }
      if (tail > bestSize) { bestSize = tail; best = cur; }
      cur++;
    }
    for (let p = 0; p < w * h; p++) {
      if (!removed[p] && label[p] !== best) removed[p] = 1;
    }
  }

  // Kill the soft contact shadow / mirror-reflection blob beneath the product.
  // It's light-gray (too dark for isBg, so it survives) and glued to the jar
  // base. Grow the removed region into low-saturation light-gray pixels — but
  // ONLY in the lower part of the frame, so the (also-gray) lid up top is safe.
  // Growth stops dead at the saturated/dark product body.
  {
    const yLimit = Math.round(h * 0.52);
    const isShadow = (r, g, b) => {
      const min = Math.min(r, g, b), max = Math.max(r, g, b);
      return min >= 168 && (max - min) <= 44;
    };
    const q = stack; // reuse scratch buffer
    let sp2 = 0;
    // Seed: every removed pixel sitting in the lower band.
    for (let y = yLimit; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (removed[p]) q[sp2++] = p;
      }
    }
    while (sp2 > 0) {
      const p = q[--sp2];
      const x = p % w, y = (p / w) | 0;
      const tryGrow = (nx, ny) => {
        if (ny < yLimit || ny >= h || nx < 0 || nx >= w) return;
        const np = ny * w + nx;
        if (removed[np]) return;
        const i = np * 4;
        if (!isShadow(data[i], data[i + 1], data[i + 2])) return;
        removed[np] = 1;
        q[sp2++] = np;
      };
      tryGrow(x - 1, y); tryGrow(x + 1, y);
      tryGrow(x, y - 1); tryGrow(x, y + 1);
    }
  }

  // Apply transparency + soft feather on the 1px halo bordering the product.
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (removed[p]) { data[i + 3] = 0; continue; }
    // Is this retained pixel adjacent to a removed one? If so and it's light,
    // ramp its alpha down to kill the JPEG white fringe.
    const x = p % w, y = (p / w) | 0;
    let edge = false;
    if (x > 0 && removed[p - 1]) edge = true;
    else if (x < w - 1 && removed[p + 1]) edge = true;
    else if (y > 0 && removed[p - w]) edge = true;
    else if (y < h - 1 && removed[p + w]) edge = true;
    if (edge) {
      const wn = whiteness(data[i], data[i + 1], data[i + 2]);
      if (wn > 0) data[i + 3] = Math.round(255 * (1 - wn));
    }
  }

  // Bounding box of visible content.
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 12) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) { console.log("!! empty:", file); return; }

  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const cropped = img.clone().crop({ x: minX, y: minY, w: bw, h: bh });

  // Center on a uniform square canvas with consistent margin.
  const side = Math.round(Math.max(bw, bh) * 1.16);
  const canvas = new Jimp({ width: side, height: side, color: 0x00000000 });
  canvas.composite(cropped, Math.round((side - bw) / 2), Math.round((side - bh) / 2));

  const out = join(SRC, basename(file, extname(file)) + ".png");
  await canvas.write(out);
  console.log("ok:", basename(out), `${side}x${side}`);
}

const files = readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f) && !SKIP.has(basename(f, extname(f))));
console.log("processing", files.length, "images...");
for (const f of files) await processOne(f);
console.log("done.");
