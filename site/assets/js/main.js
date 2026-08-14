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

/* ---------- render products ---------- */
function renderProducts(cat="Tümü", limit=null){
  const wrap = document.getElementById("productGrid");
  if(!wrap) return;
  let list = cat==="Tümü" ? PRODUCTS : PRODUCTS.filter(p=>p.cat===cat);
  if(limit) list = list.slice(0, limit);
  if(!list.length){ wrap.innerHTML = `<p class="empty">Bu kategoride ürün bulunamadı.</p>`; return; }
  wrap.innerHTML = list.map(p=>{
    const out = !inStock(p);
    const buy = out
      ? `<span class="card__buy card__buy--out" aria-disabled="true">Tükendi</span>`
      : `<a class="card__buy" href="${waLink(orderMsg(p))}" target="_blank" rel="noopener" aria-label="${p.name} sipariş">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.599 5.334l-.999 3.648 3.9-.881zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            Sipariş
          </a>`;
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
  const y = document.getElementById("year"); if(y) y.textContent = new Date().getFullYear();
  await loadData();
  initFilters();
  const limit = document.body.dataset.homeLimit ? Number(document.body.dataset.homeLimit) : null;
  renderProducts("Tümü", limit);
  observeReveal();
});
