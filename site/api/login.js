import { tokenFor } from "../lib/auth.js";
import { readJson, sendJson } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return sendJson(res, 500, { error: "Sunucuda ADMIN_PASSWORD tanımlı değil." });
  const body = await readJson(req);
  if (body.password && body.password === pw) {
    return sendJson(res, 200, { token: tokenFor(pw) });
  }
  return sendJson(res, 401, { error: "Şifre hatalı." });
}
