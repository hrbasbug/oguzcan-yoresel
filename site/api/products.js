import { readProducts } from "../lib/store.js";
import { originOf, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// Public read endpoint used by both the storefront and the admin panel.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  try {
    const data = await readProducts(originOf(req));
    res.setHeader("Cache-Control", "public, s-maxage=20, stale-while-revalidate=120");
    return sendJson(res, 200, data);
  } catch (e) {
    return sendJson(res, 500, { error: "Ürünler okunamadı", detail: String(e) });
  }
}
