import { ghGetFile, ghPutFile, ghDeleteFile, ghListDir, DATA_REPO } from "./github.js";
import crypto from "node:crypto";

// Orders live in the private data repo under orders/<id>.json.
const DIR = "orders";

export function newOrderId() {
  return "oym-" + Date.now() + "-" + crypto.randomBytes(5).toString("hex");
}

export async function saveOrder(order) {
  await ghPutFile(DATA_REPO, `${DIR}/${order.id}.json`, JSON.stringify(order, null, 2), "sipariş: " + order.id);
  return order;
}

export async function getOrder(id) {
  try {
    const f = await ghGetFile(DATA_REPO, `${DIR}/${id}.json`);
    return f ? JSON.parse(f.text) : null;
  } catch {
    return null;
  }
}

export async function listOrders() {
  try {
    const files = (await ghListDir(DATA_REPO, DIR)).filter((f) => f.name.endsWith(".json"));
    const arr = await Promise.all(
      files.map(async (f) => {
        try {
          const g = await ghGetFile(DATA_REPO, `${DIR}/${f.name}`);
          return g ? JSON.parse(g.text) : null;
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
  await ghDeleteFile(DATA_REPO, `${DIR}/${id}.json`, "sipariş silindi: " + id);
}
