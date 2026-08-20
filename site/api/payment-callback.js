import { iyzicoClient, Iyzipay } from "../lib/iyzico.js";
import { readRawBody } from "../lib/util.js";

export const config = { api: { bodyParser: false } };

// iyzico posts the checkout token here after the customer pays. We retrieve
// the result server-side, then redirect the browser to the result page.
export default async function handler(req, res) {
  const redirect = (status) => {
    res.statusCode = 302;
    res.setHeader("Location", "/odeme-sonuc.html?status=" + status);
    res.end();
  };

  const iy = iyzicoClient();
  let token = null;
  try {
    const buf = await readRawBody(req);
    const params = new URLSearchParams(buf.toString("utf8"));
    token = params.get("token");
  } catch {
    /* ignore */
  }

  if (!iy || !token) return redirect("fail");

  return new Promise((resolve) => {
    iy.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, (err, result) => {
      const ok = !err && result && result.status === "success" && result.paymentStatus === "SUCCESS";
      redirect(ok ? "success" : "fail");
      resolve();
    });
  });
}
