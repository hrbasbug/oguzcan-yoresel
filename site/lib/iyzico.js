import Iyzipay from "iyzipay";

// Build an iyzico client from environment variables. Returns null when the
// keys aren't configured yet, so the checkout can fall back gracefully.
// Env vars (set in Vercel → Settings → Environment Variables):
//   IYZICO_API_KEY     — API Anahtarı
//   IYZICO_SECRET_KEY  — Güvenlik Anahtarı
//   IYZICO_BASE_URL    — https://sandbox-api.iyzipay.com (test)
//                        veya https://api.iyzipay.com (canlı/onaylı)
export function iyzicoClient() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
  if (!apiKey || !secretKey) return null;
  return new Iyzipay({ apiKey, secretKey, uri });
}

export { Iyzipay };
