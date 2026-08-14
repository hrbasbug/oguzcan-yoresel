import { isAuthed } from "../lib/auth.js";
import { uploadImage } from "../lib/store.js";
import { readRawBody, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// Upload one product image. The client PUTs the raw file bytes with the
// filename in the query string: POST /api/upload?name=foo.png
export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  if (!isAuthed(req)) return sendJson(res, 401, { error: "Yetkisiz. Tekrar giriş yapın." });

  const url = new URL(req.url, "https://x");
  const name = url.searchParams.get("name") || "gorsel.png";
  const contentType = req.headers["content-type"] || "application/octet-stream";

  try {
    const buf = await readRawBody(req);
    if (!buf.length) return sendJson(res, 400, { error: "Boş dosya." });
    if (buf.length > 4 * 1024 * 1024) return sendJson(res, 413, { error: "Görsel 4 MB'tan büyük olamaz." });
    const publicUrl = await uploadImage(name, buf, contentType);
    return sendJson(res, 200, { url: publicUrl });
  } catch (e) {
    return sendJson(res, 500, { error: "Yüklenemedi", detail: String(e) });
  }
}
