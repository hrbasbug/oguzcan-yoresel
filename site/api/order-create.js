import { saveOrder, newOrderId } from "../lib/orders.js";
import { readJson, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// Public endpoint: records a WhatsApp order so it also shows in the panel.
export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const body = await readJson(req);
  const items = Array.isArray(body.items) ? body.items : [];
  const buyer = body.buyer || {};
  if (!items.length || (!buyer.name && !buyer.phone)) {
    return sendJson(res, 400, { error: "Eksik sipariş bilgisi." });
  }
  const SHIP_FREE_MIN = 1500, SHIP_FEE = 180;
  const isBaharat = (i) => String(i.cat || "") === "Baharatlar";
  const subtotal = items.reduce((n, i) => n + Number(i.price) * Number(i.qty), 0);
  const discount = items.reduce((n, i) => isBaharat(i) ? n + Math.floor(Number(i.qty) / 2) * Number(i.price) : n, 0);
  const productsTotal = subtotal - discount;
  const shipping = productsTotal > 0 && productsTotal < SHIP_FREE_MIN ? SHIP_FEE : 0;
  const total = productsTotal + shipping;
  const id = newOrderId();
  try {
    await saveOrder({
      id,
      createdAt: Date.now(),
      status: "whatsapp",
      method: "whatsapp",
      stage: "yeni",
      buyer: {
        name: String(buyer.name || "").slice(0, 120),
        phone: String(buyer.phone || "").slice(0, 40),
        email: String(buyer.email || "").slice(0, 120),
        address: String(buyer.address || "").slice(0, 400),
        city: String(buyer.city || "").slice(0, 80),
      },
      items: items.map((i) => ({ name: i.name, size: i.size, qty: Number(i.qty), price: Number(i.price), cat: i.cat })),
      subtotal,
      discount,
      shipping,
      total,
      currency: "TRY",
    });
    return sendJson(res, 200, { ok: true, id });
  } catch {
    return sendJson(res, 200, { ok: false }); // best-effort; never block the customer
  }
}
