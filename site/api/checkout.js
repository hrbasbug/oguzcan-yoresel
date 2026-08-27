import { iyzicoClient, Iyzipay } from "../lib/iyzico.js";
import { readJson, sendJson, originOf } from "../lib/util.js";
import { saveOrder, newOrderId } from "../lib/orders.js";

export const config = { api: { bodyParser: false } };

// Initialise an iyzico Checkout Form (hosted payment page). The customer
// enters card details on iyzico's own secure page — we never see card data.
export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const iy = iyzicoClient();
  if (!iy) return sendJson(res, 200, { configured: false });

  const body = await readJson(req);
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return sendJson(res, 400, { error: "Sepet boş." });

  const buyer = body.buyer || {};
  const origin = originOf(req);
  const now = Date.now();
  const convId = newOrderId();

  const SHIP_FREE_MIN = 1500, SHIP_FEE = 180;
  const isBaharat = (i) => String(i.cat || "") === "Baharatlar";
  const paidQty = (i) => isBaharat(i) ? Number(i.qty) - Math.floor(Number(i.qty) / 2) : Number(i.qty);
  const subtotal = items.reduce((n, i) => n + Number(i.price) * Number(i.qty), 0);
  const discount = items.reduce((n, i) => isBaharat(i) ? n + Math.floor(Number(i.qty) / 2) * Number(i.price) : n, 0);
  const productsTotal = subtotal - discount;
  const shipping = productsTotal > 0 && productsTotal < SHIP_FREE_MIN ? SHIP_FEE : 0;
  const total = productsTotal + shipping;
  const priceStr = total.toFixed(2);

  const fullName = String(buyer.name || "Musteri").trim();
  const firstName = fullName.split(" ")[0] || "Musteri";
  const lastName = fullName.split(" ").slice(1).join(" ") || firstName;
  const address = String(buyer.address || "Belirtilmedi").slice(0, 250);
  const city = String(buyer.city || "Turkiye").slice(0, 60);
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "85.34.78.112";

  const addr = {
    contactName: fullName || "Musteri",
    city: city,
    country: "Turkey",
    address: address,
  };

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: convId,
    price: priceStr,
    paidPrice: priceStr,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: convId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: origin + "/api/payment-callback",
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: "BY" + now,
      name: firstName,
      surname: lastName,
      gsmNumber: normalizePhone(buyer.phone),
      email: buyer.email || "musteri@oguzcanyoreselmarket.com",
      identityNumber: "11111111111",
      registrationAddress: address,
      city: city,
      country: "Turkey",
      ip: ip,
    },
    shippingAddress: addr,
    billingAddress: addr,
    basketItems: [
      ...items.map((i, idx) => ({
        id: String(i.id || "P" + idx),
        name: `${i.name || "Ürün"} ${i.size || ""}`.trim().slice(0, 100),
        category1: String(i.cat || "Gıda"),
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (paidQty(i) * Number(i.price)).toFixed(2),
      })),
      ...(shipping > 0 ? [{
        id: "KARGO",
        name: "Kargo Ücreti",
        category1: "Kargo",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: shipping.toFixed(2),
      }] : []),
    ],
  };

  return new Promise((resolve) => {
    iy.checkoutFormInitialize.create(request, async (err, result) => {
      if (err) {
        sendJson(res, 502, { error: "Ödeme başlatılamadı.", detail: String(err) });
        return resolve();
      }
      if (!result || result.status !== "success") {
        sendJson(res, 502, {
          error: (result && result.errorMessage) || "Ödeme başlatılamadı.",
          code: result && result.errorCode,
        });
        return resolve();
      }
      // Record the order as pending; payment-callback flips it to paid/failed.
      try {
        await saveOrder({
          id: convId,
          createdAt: now,
          status: "pending",
          method: "iyzico",
          stage: "yeni",
          buyer: { name: fullName, phone: buyer.phone || "", email: buyer.email || "", address: address, city: city },
          items: items.map((i) => ({ name: i.name, size: i.size, qty: Number(i.qty), price: Number(i.price), cat: i.cat })),
          subtotal: subtotal,
          discount: discount,
          shipping: shipping,
          total: total,
          currency: "TRY",
        });
      } catch { /* order logging is best-effort */ }
      sendJson(res, 200, { ok: true, paymentPageUrl: result.paymentPageUrl, token: result.token });
      resolve();
    });
  });
}

function normalizePhone(p) {
  const digits = String(p || "").replace(/\D/g, "");
  if (!digits) return "+905000000000";
  if (digits.startsWith("90")) return "+" + digits;
  if (digits.startsWith("0")) return "+9" + digits;
  if (digits.length === 10) return "+90" + digits;
  return "+" + digits;
}
