import { isAuthed } from "../lib/auth.js";
import { ghPutFile, OWNER, SITE_REPO, BRANCH } from "../lib/github.js";
import { readRawBody, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// Upload a product image: commit it to the public site repo and return its
// GitHub raw CDN URL (immediately available, free, unlimited).
export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  if (!isAuthed(req)) return sendJson(res, 401, { error: "Yetkisiz. Tekrar giriş yapın." });

  const url = new URL(req.url, "https://x");
  const name = url.searchParams.get("name") || "gorsel.png";
  const safe = String(name).toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/-+/g, "-").slice(-50);
  const fname = Date.now() + "-" + safe;

  try {
    const buf = await readRawBody(req);
    if (!buf.length) return sendJson(res, 400, { error: "Boş dosya." });
    if (buf.length > 4 * 1024 * 1024) return sendJson(res, 413, { error: "Görsel 4 MB'tan büyük olamaz." });
    await ghPutFile(SITE_REPO, `site/assets/urunler/${fname}`, buf, "görsel yüklendi: " + fname);
    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${SITE_REPO}/${BRANCH}/site/assets/urunler/${fname}`;
    return sendJson(res, 200, { url: rawUrl });
  } catch (e) {
    return sendJson(res, 500, { error: "Yüklenemedi", detail: String(e) });
  }
}
