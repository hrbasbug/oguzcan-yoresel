/* ===== Oğuzcan Yöresel - site data & interactions ===== */
const WHATSAPP = "905305752060";
const INSTAGRAM = "https://www.instagram.com/oguzcanyoreselmarket/";

let CATS = ["Tümü", "Salçalar", "Soslar", "Baharatlar", "Sirkeler"];
let PRODUCTS = [];

/* ---------- data loading ---------- */
// Live catalogue comes from the serverless API (backed by Vercel Blob). If the
// backend isn't reachable (e.g. not configured yet, or offline preview), fall
// back to the bundled default JSON so the storefront always renders.
async function loadData(){
  const sources = ["/api/products", "assets/data/products.default.json"];
  for(const url of sources){
    try{
      const r = await fetch(url, { cache:"no-store" });
      if(!r.ok) continue;
      const data = await r.json();
      if(data && Array.isArray(data.products)){
        PRODUCTS = data.products;
        PRODUCTS.forEach((p,i)=>{ if(!p.id) p.id = "p"+(i+1); });
        if(Array.isArray(data.cats) && data.cats.length) CATS = data.cats;
        return;
      }
    }catch(_){ /* try next source */ }
  }
}

/* ---------- helpers ---------- */
function waLink(msg){ return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`; }
function imgSrc(img){ return /^https?:\/\//.test(img) ? img : `assets/urunler/${img}`; }
function inStock(p){ return p.stock !== false; }
function priceHTML(p){
  if(p.price === null || p.price === undefined || p.price === "") return `<span class="card__price ask">Fiyat için iletişime geçin</span>`;
  return `<span class="card__price">${p.price} <small>TL</small></span>`;
}
function orderMsg(p){
  const s = p.price!==null ? ` (${p.price} TL)` : "";
  return `Merhaba, ${p.name} ${p.size}${s} ürünü hakkında bilgi almak istiyorum.`;
}
const esc = (s)=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const hasPrice = (p)=> p.price!==null && p.price!==undefined && p.price!=="";

/* ---------- cart ---------- */
const CART_KEY = "oym_cart";
const SHIP_FREE_MIN = 1500;   // bu tutar ve üzeri: ücretsiz kargo
const SHIP_FEE = 180;         // altında: sabit kargo ücreti
function cartGet(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||[]; }catch(_){ return []; } }
function cartSave(items){ try{ localStorage.setItem(CART_KEY, JSON.stringify(items)); }catch(_){} updateCartUI(); }
function cartCount(){ return cartGet().reduce((n,i)=>n+i.qty,0); }
function cartTotal(){ return cartGet().reduce((n,i)=>n+i.price*i.qty,0); }
function shippingFor(subtotal){ return subtotal>0 && subtotal<SHIP_FREE_MIN ? SHIP_FEE : 0; }
function cartShipping(){ return shippingFor(cartTotal()); }
function cartGrand(){ return cartTotal() + cartShipping(); }
function cartAdd(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p || !hasPrice(p) || p.stock===false) return;
  const items = cartGet();
  const ex = items.find(i=>i.id===id);
  if(ex) ex.qty += 1;
  else items.push({ id:p.id, name:p.name, size:p.size, price:Number(p.price), img:p.img, qty:1 });
  cartSave(items);
  toast("Sepete eklendi ✓");
  openCart();
}
function cartSetQty(id, qty){
  let items = cartGet();
  const it = items.find(i=>i.id===id); if(!it) return;
  it.qty = Math.max(0, qty);
  if(it.qty===0) items = items.filter(i=>i.id!==id);
  cartSave(items);
}
function cartRemove(id){ cartSave(cartGet().filter(i=>i.id!==id)); }
function cartClear(){ cartSave([]); }

function toast(msg){
  let t = document.getElementById("oymToast");
  if(!t){ t=document.createElement("div"); t.id="oymToast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2200);
}

function cartInject(){
  const cta = document.querySelector(".nav__cta");
  if(cta && !document.getElementById("navCart")){
    const btn = document.createElement("button");
    btn.id="navCart"; btn.className="nav__cart"; btn.type="button"; btn.setAttribute("aria-label","Sepetim");
    btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h15l-1.3 10.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 7z"/><path d="M8.5 7a3.5 3.5 0 0 1 7 0"/></svg><span class="nav__cart-badge" id="cartBadge">0</span>`;
    cta.appendChild(btn);
    btn.addEventListener("click", openCart);
  }
  if(!document.getElementById("cartPanel")){
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="cart-overlay" id="cartOverlay"></div>
      <aside class="cart" id="cartPanel" aria-label="Sepetim">
        <header class="cart__head"><h3>Sepetim</h3><button class="cart__close" id="cartClose" type="button" aria-label="Kapat">✕</button></header>
        <div class="cart__body" id="cartItems"></div>
        <footer class="cart__foot" id="cartFoot"></footer>
      </aside>`;
    document.body.appendChild(wrap);
    document.getElementById("cartOverlay").addEventListener("click", closeCart);
    document.getElementById("cartClose").addEventListener("click", closeCart);
    document.getElementById("cartItems").addEventListener("click", onCartClick);
  }
  updateCartUI();
}
function openCart(){ renderCart(); document.getElementById("cartPanel")?.classList.add("open"); document.getElementById("cartOverlay")?.classList.add("show"); document.body.style.overflow="hidden"; }
function closeCart(){ document.getElementById("cartPanel")?.classList.remove("open"); document.getElementById("cartOverlay")?.classList.remove("show"); document.body.style.overflow=""; }
function onCartClick(e){
  const b = e.target.closest("[data-act]"); if(!b) return;
  const id = b.dataset.id;
  const it = cartGet().find(i=>i.id===id);
  if(b.dataset.act==="inc") cartSetQty(id,(it?.qty||0)+1);
  else if(b.dataset.act==="dec") cartSetQty(id,(it?.qty||0)-1);
  else if(b.dataset.act==="rm") cartRemove(id);
  renderCart();
}
function updateCartUI(){
  const badge = document.getElementById("cartBadge");
  const c = cartCount();
  if(badge){ badge.textContent = c; badge.classList.toggle("has", c>0); }
  if(document.getElementById("checkoutRoot")) renderCheckout();
}
function renderCart(){
  const body = document.getElementById("cartItems");
  const foot = document.getElementById("cartFoot");
  if(!body) return;
  const items = cartGet();
  if(!items.length){
    body.innerHTML = `<div class="cart__empty"><p>Sepetiniz henüz boş.</p><a class="btn btn--primary" href="urunler.html">Ürünlere Göz At</a></div>`;
    foot.innerHTML=""; return;
  }
  body.innerHTML = items.map(i=>`
    <div class="cart-item">
      <div class="cart-item__img"><img src="${imgSrc(i.img)}" alt="${esc(i.name)}"></div>
      <div class="cart-item__info">
        <div class="cart-item__name">${esc(i.name)}</div>
        <div class="cart-item__size">${esc(i.size)}</div>
        <div class="cart-item__price">${i.price} TL</div>
      </div>
      <div class="cart-item__qty">
        <button type="button" data-act="dec" data-id="${i.id}" aria-label="Azalt">−</button>
        <span>${i.qty}</span>
        <button type="button" data-act="inc" data-id="${i.id}" aria-label="Artır">+</button>
      </div>
      <button class="cart-item__rm" type="button" data-act="rm" data-id="${i.id}" aria-label="Kaldır">✕</button>
    </div>`).join("");
  const sub = cartTotal(), ship = cartShipping(), remain = SHIP_FREE_MIN - sub;
  const hint = ship>0
    ? `<div class="cart__ship-hint">🚚 <b>${remain} TL</b> daha ekleyin, <b>kargo bedava!</b></div>`
    : `<div class="cart__ship-hint ok">🎉 Kargo <b>bedava!</b></div>`;
  foot.innerHTML = `
    ${hint}
    <div class="cart__line"><span>Ara toplam</span><span>${sub} TL</span></div>
    <div class="cart__line"><span>Kargo</span><span>${ship===0 ? "Ücretsiz" : ship+" TL"}</span></div>
    <div class="cart__total"><span>Toplam</span><b>${cartGrand()} TL</b></div>
    <a class="btn btn--primary cart__checkout" href="odeme.html">Ödemeye Geç</a>
    <p class="cart__note">Fiyatlara KDV dahildir. Ödemeler iyzico ile güvenle alınır.</p>`;
}

/* ---------- checkout (odeme.html) ---------- */
function renderCheckout(){
  const sum = document.getElementById("coSummary");
  if(!sum) return;
  const items = cartGet();
  const empty = document.getElementById("coEmpty");
  const main = document.getElementById("coMain");
  if(!items.length){
    if(empty) empty.style.display="";
    if(main) main.style.display="none";
    return;
  }
  if(empty) empty.style.display="none";
  if(main) main.style.display="";
  sum.innerHTML = items.map(i=>`
    <div class="co-line">
      <img src="${imgSrc(i.img)}" alt="${esc(i.name)}">
      <div class="co-line__info"><span class="co-line__name">${esc(i.name)}</span><span class="co-line__meta">${esc(i.size)} × ${i.qty}</span></div>
      <span class="co-line__price">${i.price*i.qty} TL</span>
    </div>`).join("");
  const sub = cartTotal(), ship = cartShipping();
  const totals = document.getElementById("coTotals");
  if(totals){
    totals.innerHTML = `
      <div class="co-line2"><span>Ara toplam</span><span>${sub} TL</span></div>
      <div class="co-line2"><span>Kargo</span><span>${ship===0 ? "Ücretsiz" : ship+" TL"}</span></div>
      <div class="co-total"><span>Toplam</span><b>${sub+ship} TL</b></div>
      ${ship>0
        ? `<p class="co-shiphint">🚚 ${SHIP_FREE_MIN-sub} TL daha ekleyin, kargo <b>bedava</b>.</p>`
        : `<p class="co-shiphint ok">🎉 Kargonuz <b>ücretsiz</b>.</p>`}`;
  }
  const t = document.getElementById("coTotal");
  if(t) t.textContent = (sub+ship)+" TL";
}
function initCheckout(){
  const root = document.getElementById("checkoutRoot");
  if(!root) return;
  renderCheckout();
  const form = document.getElementById("coForm");
  if(!form) return;

  function completeViaWhatsApp(items, d, note){
    const lines = items.map(i=>`• ${i.name} ${i.size} x${i.qty} = ${i.price*i.qty} TL`).join("\n");
    const sub = cartTotal(), ship = cartShipping();
    const shipTxt = ship===0 ? "Ücretsiz" : ship+" TL";
    const txt = `Merhaba, sipariş vermek istiyorum.\n\n${lines}\n\nAra toplam: ${sub} TL\nKargo: ${shipTxt}\nTOPLAM: ${sub+ship} TL\n\nAd Soyad: ${d.name}\nTelefon: ${d.phone}\nE-posta: ${d.email||"-"}\nAdres: ${d.address||""} ${d.city||""}`;
    const url = waLink(txt);
    // Record the WhatsApp order so it also appears in the admin panel (best-effort).
    try{
      fetch("/api/order-create", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ items, buyer:{ name:d.name, phone:d.phone, email:d.email, address:d.address, city:d.city } })
      }).catch(()=>{});
    }catch(_){}
    const success = document.getElementById("coSuccess");
    const main = document.getElementById("coMain");
    if(success && main){
      main.style.display="none";
      success.style.display="";
      success.innerHTML = `
        <div class="co-success__box">
          <div class="co-success__ico">✓</div>
          <h2>Siparişiniz alındı</h2>
          <p>${note || "Siparişinizi onaylamak için WhatsApp'a yönlendiriliyorsunuz."}</p>
          <a class="btn btn--wa" href="${url}" target="_blank" rel="noopener">WhatsApp'ta Onayla</a>
          <a class="btn btn--ghost" href="urunler.html">Alışverişe Devam Et</a>
        </div>`;
    }
    window.open(url, "_blank");
    cartClear();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const items = cartGet();
    if(!items.length){ toast("Sepetiniz boş."); return; }
    const d = Object.fromEntries(new FormData(form).entries());
    const method = d.payment || "iyzico";
    const submitBtn = form.querySelector('[type="submit"]');

    if(method === "iyzico"){
      const orig = submitBtn ? submitBtn.innerHTML : "";
      if(submitBtn){ submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spin"></span> Güvenli ödemeye yönlendiriliyor…'; }
      try{
        const r = await fetch("/api/checkout", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ items, buyer:{ name:d.name, phone:d.phone, email:d.email, address:d.address, city:d.city } })
        });
        const res = await r.json().catch(()=>({}));
        if(res && res.ok && res.paymentPageUrl){ window.location.href = res.paymentPageUrl; return; }
        if(res && res.configured === false){
          completeViaWhatsApp(items, d, "Online kart ödemesi henüz aktifleştiriliyor. Siparişinizi onaylamak için WhatsApp'a yönlendiriliyorsunuz.");
          return;
        }
        toast((res && res.error) || "Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        if(submitBtn){ submitBtn.disabled=false; submitBtn.innerHTML=orig; }
      }catch(_){
        completeViaWhatsApp(items, d, "Ödeme sunucusuna ulaşılamadı. Siparişinizi WhatsApp'tan tamamlayabilirsiniz.");
      }
      return;
    }

    completeViaWhatsApp(items, d);
  });
}

/* ---------- payment result (odeme-sonuc.html) ---------- */
function initPaymentResult(){
  const root = document.getElementById("paymentResult");
  if(!root) return;
  const ok = new URLSearchParams(location.search).get("status") === "success";
  if(ok) cartClear();
  root.innerHTML = ok
    ? `<div class="co-success__box">
         <div class="co-success__ico">✓</div>
         <h2>Ödemeniz alındı</h2>
         <p>Siparişiniz için teşekkür ederiz! Ödemeniz başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.</p>
         <a class="btn btn--primary" href="urunler.html">Alışverişe Devam Et</a>
       </div>`
    : `<div class="co-success__box">
         <div class="co-success__ico" style="background:var(--brand)">✕</div>
         <h2>Ödeme tamamlanamadı</h2>
         <p>Ödeme sırasında bir sorun oluştu veya işlem iptal edildi. Sepetiniz korunuyor; tekrar deneyebilir ya da WhatsApp üzerinden sipariş verebilirsiniz.</p>
         <a class="btn btn--primary" href="odeme.html">Tekrar Dene</a>
         <a class="btn btn--wa" href="${waLink("Merhaba, sipariş vermek istiyorum.")}" target="_blank" rel="noopener">WhatsApp'tan Sipariş</a>
       </div>`;
}

/* ---------- render products ---------- */
function renderProducts(cat="Tümü", limit=null){
  const wrap = document.getElementById("productGrid");
  if(!wrap) return;
  let list = cat==="Tümü" ? PRODUCTS : PRODUCTS.filter(p=>p.cat===cat);
  if(limit) list = list.slice(0, limit);
  if(!list.length){ wrap.innerHTML = `<p class="empty">Bu kategoride ürün bulunamadı.</p>`; return; }
  wrap.innerHTML = list.map(p=>{
    const out = !inStock(p);
    let buy;
    if(out){
      buy = `<span class="card__buy card__buy--out" aria-disabled="true">Tükendi</span>`;
    } else if(!hasPrice(p)){
      buy = `<a class="card__buy card__buy--ask" href="${waLink(orderMsg(p))}" target="_blank" rel="noopener" aria-label="${esc(p.name)} fiyat sor">Fiyat Sor</a>`;
    } else {
      buy = `<button class="card__buy" type="button" data-add="${p.id}" aria-label="${esc(p.name)} sepete ekle">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h15l-1.3 10.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 7z"/><path d="M8.5 7a3.5 3.5 0 0 1 7 0"/></svg>
            Sepete Ekle
          </button>`;
    }
    return `
    <article class="card reveal${out ? " card--out" : ""}">
      <div class="card__media">
        <span class="card__cat">${p.cat}</span>
        ${out ? `<span class="card__badge">Tükendi</span>` : ""}
        <img src="${imgSrc(p.img)}" alt="${p.name} ${p.size}" loading="lazy">
      </div>
      <div class="card__body">
        <h3 class="card__title">${p.name}</h3>
        <div class="card__size">${p.size}</div>
        <p class="card__desc">${p.desc}</p>
        <div class="card__foot">
          ${priceHTML(p)}
          ${buy}
        </div>
      </div>
    </article>`;
  }).join("");
  observeReveal();
}

/* ---------- category chips ---------- */
function initFilters(){
  const bar = document.getElementById("filterBar");
  if(!bar) return;
  bar.innerHTML = CATS.map((c,i)=>`<button class="chip${i===0?' active':''}" data-cat="${c}">${c}</button>`).join("");
  bar.addEventListener("click", e=>{
    const btn = e.target.closest(".chip"); if(!btn) return;
    bar.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.cat);
  });
}

/* ---------- mobile nav ---------- */
function initNav(){
  const toggle = document.querySelector(".nav__toggle");
  const nav = document.querySelector(".nav");
  if(!toggle) return;
  toggle.addEventListener("click", ()=>{
    nav.classList.toggle("open");
    toggle.classList.toggle("open");
  });
  nav.querySelectorAll(".nav__links a").forEach(a=>a.addEventListener("click",()=>{
    nav.classList.remove("open"); toggle.classList.remove("open");
  }));
}

/* ---------- cookie consent ---------- */
function initCookie(){
  try{ if(localStorage.getItem("oym_cookie_consent")) return; }catch(_){ return; }
  const bar = document.createElement("div");
  bar.className = "cookie";
  bar.setAttribute("role","dialog");
  bar.setAttribute("aria-label","Çerez bildirimi");
  bar.innerHTML = `
    <p>Size daha iyi bir deneyim sunmak için çerezler kullanıyoruz. Detaylar için
      <a href="cerez-politikasi.html">Çerez Politikası</a> sayfamızı inceleyebilirsiniz.</p>
    <div class="cookie__row">
      <button class="btn btn--ghost" data-cookie="red">Yalnızca gerekli</button>
      <button class="btn btn--wa" data-cookie="acc">Kabul Et</button>
    </div>`;
  document.body.appendChild(bar);
  requestAnimationFrame(()=>bar.classList.add("show"));
  bar.addEventListener("click", e=>{
    const b = e.target.closest("[data-cookie]"); if(!b) return;
    try{ localStorage.setItem("oym_cookie_consent", b.dataset.cookie); }catch(_){}
    bar.classList.remove("show");
    setTimeout(()=>bar.remove(), 500);
  });
}

/* ---------- SEO: client-injected structured data ---------- */
function absUrl(u){ return /^https?:\/\//.test(u) ? u : (location.origin + "/" + String(u).replace(/^\//,"")); }
function injectJsonLd(obj){
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(obj);
  document.head.appendChild(s);
}
function injectBreadcrumb(){
  const crumbs = document.querySelector(".crumbs");
  if(!crumbs) return;
  const items = [];
  crumbs.querySelectorAll("a").forEach(a=>items.push({ name:a.textContent.trim(), url:absUrl(a.getAttribute("href")) }));
  const current = document.querySelector(".page-hero__inner h1")?.textContent.trim();
  if(current) items.push({ name:current, url:location.href.split(/[?#]/)[0] });
  if(items.length < 2) return;
  injectJsonLd({
    "@context":"https://schema.org", "@type":"BreadcrumbList",
    itemListElement: items.map((it,i)=>({ "@type":"ListItem", position:i+1, name:it.name, item:it.url }))
  });
}
function injectProductList(){
  if(document.body.dataset.homeLimit) return;         // only the full product page
  if(!document.getElementById("productGrid") || !PRODUCTS.length) return;
  const items = PRODUCTS.map((p,i)=>{
    const prod = {
      "@type":"Product",
      name: `${p.name} ${p.size}`.trim(),
      image: absUrl(imgSrc(p.img)),
      description: p.desc,
      category: p.cat,
      brand: { "@type":"Brand", name:"Oğuzcan Yöresel" }
    };
    if(hasPrice(p)){
      prod.offers = {
        "@type":"Offer",
        price: String(p.price),
        priceCurrency:"TRY",
        availability: inStock(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: location.origin + "/urunler.html",
        seller: { "@id":"https://oguzcanyoreselmarket.com/#store" }
      };
    }
    return { "@type":"ListItem", position:i+1, item:prod };
  });
  injectJsonLd({ "@context":"https://schema.org", "@type":"ItemList", name:"Oğuzcan Yöresel Ürünleri", itemListElement:items });
}

/* ---------- scroll reveal ---------- */
let _io;
function observeReveal(){
  if(!("IntersectionObserver" in window)){
    document.querySelectorAll(".reveal").forEach(el=>el.classList.add("in")); return;
  }
  _io = _io || new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); _io.unobserve(en.target); } });
  },{threshold:.12});
  document.querySelectorAll(".reveal:not(.in)").forEach(el=>_io.observe(el));
}

document.addEventListener("DOMContentLoaded", async ()=>{
  initNav();
  initCookie();
  cartInject();
  const y = document.getElementById("year"); if(y) y.textContent = new Date().getFullYear();
  // add-to-cart delegation (works wherever product cards render)
  document.addEventListener("click", (e)=>{
    const add = e.target.closest("[data-add]");
    if(add){ e.preventDefault(); cartAdd(add.dataset.add); }
  });
  injectBreadcrumb();
  await loadData();
  initFilters();
  const limit = document.body.dataset.homeLimit ? Number(document.body.dataset.homeLimit) : null;
  renderProducts("Tümü", limit);
  injectProductList();
  initCheckout();
  initPaymentResult();
  observeReveal();
});
