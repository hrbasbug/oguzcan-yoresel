import { ghGetFile, ghPutFile, DATA_REPO, hasGithub } from "./github.js";

// Product catalogue lives in the private data repo as products.json.
const DATA_PATH = "products.json";

export async function readProducts(origin) {
  try {
    if (hasGithub()) {
      const f = await ghGetFile(DATA_REPO, DATA_PATH);
      if (f) {
        const j = JSON.parse(f.text);
        if (j && Array.isArray(j.products)) return j;
      }
    }
  } catch {
    /* fall through to bundled default */
  }
  const r = await fetch(`${origin}/assets/data/products.default.json`, { cache: "no-store" });
  return await r.json();
}

export async function writeProducts(data) {
  await ghPutFile(DATA_REPO, DATA_PATH, JSON.stringify(data, null, 2), "ürünler güncellendi");
}
