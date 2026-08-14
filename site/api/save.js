import { isAuthed } from "../lib/auth.js";
import { writeProducts } from "../lib/store.js";
import { readJson, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// Persist the whole catalogue. Protected.
export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  if (!isAuthed(req)) return sendJson(res, 401, { error: "Yetkisiz. Tekrar giriş yapın." });

  const body = await readJson(req);
  if (!body || !Array.isArray(body.products)) {
    return sendJson(res, 400, { error: "Geçersiz veri: products dizisi bekleniyor." });
  }

  // Normalise/whitelist fields so nothing unexpected gets stored.
  const clean = {
    cats: Array.isArray(body.cats) && body.cats.length
      ? body.cats
      : ["Tümü", "Salçalar", "Soslar", "Baharatlar", "Sirkeler"],
    products: body.products.map((p, i) => ({
      id: p.id || "p" + (i + 1),
      name: String(p.name || "").trim(),
      size: String(p.size || "").trim(),
      cat: String(p.cat || "Baharatlar"),
      price: p.price === null || p.price === "" || p.price === undefined
        ? null
        : Number(p.price),
      img: String(p.img || "").trim(),
      desc: String(p.desc || "").trim(),
      stock: p.stock !== false,
    })),
  };

  try {
    await writeProducts(clean);
    return sendJson(res, 200, { ok: true, count: clean.products.length });
  } catch (e) {
    return sendJson(res, 500, { error: "Kaydedilemedi", detail: String(e) });
  }
}
