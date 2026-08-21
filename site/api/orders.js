import { isAuthed } from "../lib/auth.js";
import { listOrders, getOrder, saveOrder, deleteOrder } from "../lib/orders.js";
import { readJson, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// Admin-only: list orders (GET) and update stage / delete (POST).
export default async function handler(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: "Yetkisiz. Tekrar giriş yapın." });

  if (req.method === "GET") {
    const orders = await listOrders();
    return sendJson(res, 200, { orders });
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    if (body.action === "delete" && body.id) {
      await deleteOrder(body.id);
      return sendJson(res, 200, { ok: true });
    }
    if (body.action === "update" && body.id) {
      const o = await getOrder(body.id);
      if (!o) return sendJson(res, 404, { error: "Sipariş bulunamadı." });
      if (body.stage) o.stage = body.stage;
      await saveOrder(o);
      return sendJson(res, 200, { ok: true });
    }
    return sendJson(res, 400, { error: "Geçersiz işlem." });
  }

  return sendJson(res, 405, { error: "Method not allowed" });
}
