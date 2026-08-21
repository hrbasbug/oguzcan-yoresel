import { put, list, del } from "@vercel/blob";
import crypto from "node:crypto";

// Orders are stored as individual JSON blobs under orders/. The id carries a
// random component so the (public) blob URL is unguessable; enumeration only
// happens through the auth-protected /api/orders endpoint.
const PREFIX = "orders/";

export function newOrderId() {
  return "oym-" + Date.now() + "-" + crypto.randomBytes(5).toString("hex");
}

export async function saveOrder(order) {
  const path = `${PREFIX}${order.id}.json`;
  try {
    const { blobs } = await list({ prefix: path, limit: 1 });
    if (blobs.length) await del(blobs[0].url);
  } catch { /* ignore */ }
  await put(path, JSON.stringify(order), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return order;
}

export async function getOrder(id) {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}${id}.json`, limit: 1 });
    if (blobs.length) {
      const r = await fetch(blobs[0].url, { cache: "no-store" });
      if (r.ok) return await r.json();
    }
  } catch { /* ignore */ }
  return null;
}

export async function listOrders() {
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    const arr = await Promise.all(
      blobs.map(async (b) => {
        try {
          const r = await fetch(b.url, { cache: "no-store" });
          return r.ok ? await r.json() : null;
        } catch {
          return null;
        }
      })
    );
    return arr.filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export async function deleteOrder(id) {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}${id}.json`, limit: 1 });
    if (blobs.length) await del(blobs[0].url);
  } catch { /* ignore */ }
}
