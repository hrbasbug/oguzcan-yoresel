import crypto from "node:crypto";

const SALT = "oym.admin.v1";

// Derive an opaque session token from the admin password. The raw password is
// never stored client-side — the panel keeps only this token.
export function tokenFor(pw) {
  return crypto.createHash("sha256").update(pw + SALT).digest("hex");
}

export function expectedToken() {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? tokenFor(pw) : null;
}

// Constant-time check of the Bearer token on a protected request.
export function isAuthed(req) {
  const expected = expectedToken();
  if (!expected) return false;
  const header = req.headers.authorization || "";
  const got = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
