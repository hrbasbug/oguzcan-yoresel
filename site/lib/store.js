import { put, list, del } from "@vercel/blob";

// The whole product catalogue lives in a single JSON blob. Images live under
// urunler/ in the same Blob store. One store = one thing to set up.
const DATA_PATH = "data/products.json";

// Read the catalogue. Falls back to the bundled default seed (served as a
// static file) when nothing has been saved yet, so the site works out of the box.
export async function readProducts(origin) {
  try {
    const { blobs } = await list({ prefix: DATA_PATH, limit: 1 });
    if (blobs.length) {
      const r = await fetch(blobs[0].url, { cache: "no-store" });
      if (r.ok) return await r.json();
    }
  } catch {
    /* blob not configured / not found — fall through to seed */
  }
  const r = await fetch(`${origin}/assets/data/products.default.json`, { cache: "no-store" });
  return await r.json();
}

// Overwrite the catalogue. Deletes the previous blob first so we get a stable
// pathname regardless of the SDK version's overwrite semantics.
export async function writeProducts(data) {
  try {
    const { blobs } = await list({ prefix: DATA_PATH, limit: 1 });
    if (blobs.length) await del(blobs[0].url);
  } catch {
    /* ignore */
  }
  const { url } = await put(DATA_PATH, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return url;
}

// Upload a product image, return its public URL.
export async function uploadImage(name, buffer, contentType) {
  const safe = String(name || "gorsel")
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-60);
  const { url } = await put(`urunler/${safe}`, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: contentType || "application/octet-stream",
  });
  return url;
}
