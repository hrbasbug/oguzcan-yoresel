// Small helpers shared by the serverless functions.

// Read the raw request body as a Buffer. Handles both cases: the Vercel Node
// runtime may have already buffered the body (req.body as Buffer/string), or
// the stream may still be readable (binary content-types aren't auto-parsed).
export function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === "string") return Promise.resolve(Buffer.from(req.body));
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Read + JSON.parse the request body. Prefers an already-parsed body (the Node
// runtime parses application/json automatically) and falls back to the stream.
export async function readJson(req) {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  if (typeof b === "string") {
    try { return JSON.parse(b); } catch { return {}; }
  }
  if (Buffer.isBuffer(b)) {
    try { return JSON.parse(b.toString("utf8")); } catch { return {}; }
  }
  const buf = await readRawBody(req);
  if (!buf.length) return {};
  try { return JSON.parse(buf.toString("utf8")); } catch { return {}; }
}

// Best-effort origin (https://host) for same-deployment fetches.
export function originOf(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

export function sendJson(res, status, obj) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}
