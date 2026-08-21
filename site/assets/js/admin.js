/* ===== Oğuzcan Yöresel — Admin Panel ===== */
const TOKEN_KEY = "oym_admin_token";
const DEFAULT_CATS = ["Salçalar", "Soslar", "Baharatlar", "Sirkeler"];

let state = { products: [], cats: [...DEFAULT_CATS] };
let editing = null; // index into state.products, or -1 for new
let dirty = false;

const $ = (id) => document.getElementById(id);
const el = {
  loginView: $("loginView"), loginForm: $("loginForm"), pw: $("pw"), loginErr: $("loginErr"), loginBtn: $("loginBtn"),
  appView: $("appView"), grid: $("grid"), search: $("search"), catFilter: $("catFilter"), count: $("count"),
  newBtn: $("newBtn"), publishBtn: $("publishBtn"), logoutBtn: $("logoutBtn"),
  modal: $("modal"), sheetTitle: $("sheetTitle"), closeBtn: $("closeBtn"), cancelBtn: $("cancelBtn"),
  okBtn: $("okBtn"), deleteBtn: $("deleteBtn"),
  prevImg: $("prevImg"), uploadBtn: $("uploadBtn"), fileInput: $("fileInput"),
  fName: $("fName"), fSize: $("fSize"), fCat: $("fCat"), fPrice: $("fPrice"),
  fStock: $("fStock"), stockLbl: $("stockLbl"), fDesc: $("fDesc"),
  tabProducts: $("tabProducts"), tabOrders: $("tabOrders"), ordersBadge: $("ordersBadge"),
  productsView: $("productsView"), ordersView: $("ordersView"), ordersList: $("ordersList"),
  ordersStats: $("ordersStats"), refreshOrdersBtn: $("refreshOrdersBtn"),
};

/* ---------- helpers ---------- */
const token = () => localStorage.getItem(TOKEN_KEY);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const imgSrc = (img) => (/^https?:\/\//.test(img) ? img : img ? `assets/urunler/${img}` : "");
const priceText = (p) => (p === null || p === "" || p === undefined ? "İletişime geçin" : `${p} TL`);

function toast(msg, isErr = false) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "show" + (isErr ? " err" : "");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = ""), 2600);
}
function setDirty(v) {
  dirty = v;
  document.body.classList.toggle("dirty", v);
}

/* ---------- auth ---------- */
el.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.loginErr.textContent = "";
  el.loginBtn.disabled = true;
  try {
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: el.pw.value }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.token) {
      localStorage.setItem(TOKEN_KEY, d.token);
      enterApp();
    } else {
      el.loginErr.textContent = d.error || "Giriş başarısız.";
    }
  } catch {
    el.loginErr.textContent = "Sunucuya ulaşılamadı. Backend kurulu mu?";
  } finally {
    el.loginBtn.disabled = false;
  }
});

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  el.appView.hidden = true;
  el.loginView.style.display = "";
  el.pw.value = "";
}
el.logoutBtn.addEventListener("click", () => {
  if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de çıkmak istiyor musunuz?")) return;
  logout();
});

async function enterApp() {
  el.loginView.style.display = "none";
  el.appView.hidden = false;
  await load();
  refreshBadge();
}

/* ---------- data ---------- */
async function load() {
  try {
    const r = await fetch("/api/products", { cache: "no-store" });
    const d = await r.json();
    state.products = Array.isArray(d.products) ? d.products : [];
    const cats = (d.cats || []).filter((c) => c !== "Tümü");
    state.cats = cats.length ? cats : [...DEFAULT_CATS];
  } catch {
    state.products = [];
    state.cats = [...DEFAULT_CATS];
  }
  setDirty(false);
  fillCatFilter();
  renderGrid();
}

function fillCatFilter() {
  el.catFilter.innerHTML =
    '<option value="">Tüm kategoriler</option>' +
    state.cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
}

/* ---------- render list ---------- */
function renderGrid() {
  const q = el.search.value.trim().toLocaleLowerCase("tr");
  const cf = el.catFilter.value;
  const items = state.products
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => (!cf || p.cat === cf) && (!q || `${p.name} ${p.size}`.toLocaleLowerCase("tr").includes(q)));

  el.count.textContent = `${items.length} / ${state.products.length} ürün`;

  if (!items.length) {
    el.grid.innerHTML = `<div class="empty">Ürün bulunamadı.</div>`;
    return;
  }
  el.grid.innerHTML = items
    .map(({ p, i }) => {
      const out = p.stock === false;
      return `
      <div class="row">
        <div class="row__thumb"><img src="${imgSrc(p.img)}" alt="" onerror="this.style.display='none'"></div>
        <div class="row__info">
          <div class="row__name">${esc(p.name)}</div>
          <div class="row__meta">
            <span class="tag">${esc(p.cat)}</span>
            <span>${esc(p.size)}</span>
            <span class="price ${p.price == null || p.price === "" ? "ask" : ""}">${esc(priceText(p.price))}</span>
          </div>
        </div>
        <div class="row__actions">
          <label class="switch" title="Stok durumu">
            <input type="checkbox" data-stock="${i}" ${out ? "" : "checked"}>
            <span class="track"></span>
            <span class="${out ? "lbl-out" : ""}">${out ? "Tükendi" : "Var"}</span>
          </label>
          <button class="btn btn--ghost btn--sm" data-edit="${i}">Düzenle</button>
        </div>
      </div>`;
    })
    .join("");
}

el.grid.addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]");
  if (edit) openEditor(Number(edit.dataset.edit));
});
el.grid.addEventListener("change", (e) => {
  const sw = e.target.closest("[data-stock]");
  if (sw) {
    const i = Number(sw.dataset.stock);
    state.products[i].stock = sw.checked;
    setDirty(true);
    renderGrid();
  }
});
el.search.addEventListener("input", renderGrid);
el.catFilter.addEventListener("change", renderGrid);

/* ---------- editor ---------- */
function blank() {
  return { id: "p" + Date.now(), name: "", size: "", cat: state.cats[0] || "Baharatlar", price: null, img: "", desc: "", stock: true };
}

function openEditor(index) {
  editing = index;
  const p = index === -1 ? blank() : state.products[index];
  el.sheetTitle.textContent = index === -1 ? "Yeni Ürün" : "Ürünü Düzenle";
  el.deleteBtn.style.display = index === -1 ? "none" : "";
  el.fCat.innerHTML = state.cats.map((c) => `<option value="${esc(c)}"${c === p.cat ? " selected" : ""}>${esc(c)}</option>`).join("");
  el.fName.value = p.name || "";
  el.fSize.value = p.size || "";
  el.fPrice.value = p.price == null || p.price === "" ? "" : p.price;
  el.fDesc.value = p.desc || "";
  el.fStock.checked = p.stock !== false;
  updateStockLbl();
  el._img = p.img || "";
  el.prevImg.src = imgSrc(el._img);
  el.modal.hidden = false;
}

function closeEditor() {
  el.modal.hidden = true;
  editing = null;
  el.fileInput.value = "";
}

function updateStockLbl() {
  el.stockLbl.textContent = el.fStock.checked ? "Stokta var" : "Tükendi";
  el.stockLbl.classList.toggle("lbl-out", !el.fStock.checked);
}
el.fStock.addEventListener("change", updateStockLbl);

el.newBtn.addEventListener("click", () => openEditor(-1));
el.closeBtn.addEventListener("click", closeEditor);
el.cancelBtn.addEventListener("click", closeEditor);
el.modal.addEventListener("click", (e) => {
  if (e.target === el.modal) closeEditor();
});

el.okBtn.addEventListener("click", () => {
  const name = el.fName.value.trim();
  if (!name) {
    toast("Ürün adı gerekli.", true);
    el.fName.focus();
    return;
  }
  const priceRaw = el.fPrice.value.trim();
  const rec = {
    id: editing === -1 || !state.products[editing]?.id ? "p" + Date.now() : state.products[editing].id,
    name,
    size: el.fSize.value.trim(),
    cat: el.fCat.value,
    price: priceRaw === "" ? null : Number(priceRaw),
    img: el._img || "",
    desc: el.fDesc.value.trim(),
    stock: el.fStock.checked,
  };
  if (editing === -1) state.products.push(rec);
  else state.products[editing] = rec;
  setDirty(true);
  closeEditor();
  fillCatFilter();
  renderGrid();
});

el.deleteBtn.addEventListener("click", () => {
  if (editing === -1 || editing == null) return;
  const p = state.products[editing];
  if (!confirm(`"${p.name}" ürününü silmek istediğinize emin misiniz?`)) return;
  state.products.splice(editing, 1);
  setDirty(true);
  closeEditor();
  renderGrid();
});

/* ---------- image upload ---------- */
el.uploadBtn.addEventListener("click", () => el.fileInput.click());
el.fileInput.addEventListener("change", async () => {
  const file = el.fileInput.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) {
    toast("Görsel 4 MB'tan büyük olamaz.", true);
    return;
  }
  const original = el.uploadBtn.innerHTML;
  el.uploadBtn.disabled = true;
  el.uploadBtn.innerHTML = '<span class="spin"></span> Yükleniyor…';
  try {
    const r = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "Content-Type": file.type, Authorization: "Bearer " + token() },
      body: file,
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) {
      toast("Oturum süresi doldu. Tekrar giriş yapın.", true);
      logout();
      return;
    }
    if (r.ok && d.url) {
      el._img = d.url;
      el.prevImg.src = d.url;
      toast("Görsel yüklendi ✓");
    } else {
      toast(d.error || "Görsel yüklenemedi.", true);
    }
  } catch {
    toast("Yükleme sırasında hata oluştu.", true);
  } finally {
    el.uploadBtn.disabled = false;
    el.uploadBtn.innerHTML = original;
  }
});

/* ---------- publish ---------- */
el.publishBtn.addEventListener("click", async () => {
  el.publishBtn.disabled = true;
  const original = el.publishBtn.innerHTML;
  el.publishBtn.innerHTML = '<span class="spin"></span> Yayınlanıyor…';
  try {
    const r = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
      body: JSON.stringify({ cats: ["Tümü", ...state.cats], products: state.products }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) {
      toast("Oturum süresi doldu. Tekrar giriş yapın.", true);
      logout();
      return;
    }
    if (r.ok) {
      setDirty(false);
      toast(`Yayınlandı ✓ (${d.count} ürün)`);
    } else {
      toast(d.error || "Kaydedilemedi.", true);
    }
  } catch {
    toast("Sunucuya ulaşılamadı.", true);
  } finally {
    el.publishBtn.disabled = false;
    el.publishBtn.innerHTML = original;
  }
});

/* ---------- orders ---------- */
let ordersCache = [];
const PAY_BADGE = {
  paid: ["Ödendi ✓", "obadge--paid"],
  pending: ["Ödeme bekliyor", "obadge--pending"],
  failed: ["Başarısız", "obadge--failed"],
  whatsapp: ["WhatsApp", "obadge--whatsapp"],
};
const STAGE_LABEL = { yeni: "Yeni", kargolandi: "Kargolandı", tamamlandi: "Tamamlandı" };

function fmtDate(ts) {
  try { return new Date(ts).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}
function updateOrdersBadge() {
  const n = ordersCache.filter((o) => (o.status === "paid" || o.status === "whatsapp") && (o.stage || "yeni") === "yeni").length;
  if (n > 0) { el.ordersBadge.textContent = n; el.ordersBadge.hidden = false; }
  else el.ordersBadge.hidden = true;
}

function showView(view) {
  const isOrders = view === "orders";
  el.productsView.hidden = isOrders;
  el.ordersView.hidden = !isOrders;
  el.tabProducts.classList.toggle("active", !isOrders);
  el.tabOrders.classList.toggle("active", isOrders);
  el.newBtn.style.display = isOrders ? "none" : "";
  el.publishBtn.style.display = isOrders ? "none" : "";
  el.refreshOrdersBtn.hidden = !isOrders;
  const dot = document.querySelector(".dirty-dot"); if (dot) dot.style.display = isOrders ? "none" : "";
  if (isOrders) loadOrders();
}
el.tabProducts.addEventListener("click", () => showView("products"));
el.tabOrders.addEventListener("click", () => showView("orders"));
el.refreshOrdersBtn.addEventListener("click", () => loadOrders());

async function fetchOrders() {
  const r = await fetch("/api/orders", { headers: { Authorization: "Bearer " + token() }, cache: "no-store" });
  if (r.status === 401) { toast("Oturum süresi doldu.", true); logout(); return null; }
  const d = await r.json().catch(() => ({}));
  return Array.isArray(d.orders) ? d.orders : [];
}
async function refreshBadge() {
  try { const o = await fetchOrders(); if (o) { ordersCache = o; updateOrdersBadge(); } } catch { /* ignore */ }
}
async function loadOrders() {
  el.ordersList.innerHTML = `<div class="empty">Yükleniyor…</div>`;
  try {
    const o = await fetchOrders();
    if (!o) return;
    ordersCache = o;
    updateOrdersBadge();
    renderOrders();
  } catch {
    el.ordersList.innerHTML = `<div class="empty">Siparişler yüklenemedi.</div>`;
  }
}
function renderOrders() {
  const list = ordersCache;
  const paid = list.filter((o) => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
  el.ordersStats.innerHTML = `
    <div class="ostat"><b>${list.length}</b><span>Toplam sipariş</span></div>
    <div class="ostat"><b>${paid.length}</b><span>Ödenen (kart)</span></div>
    <div class="ostat"><b>${revenue} TL</b><span>Kart cirosu</span></div>`;
  if (!list.length) { el.ordersList.innerHTML = `<div class="empty">Henüz sipariş yok.</div>`; return; }
  el.ordersList.innerHTML = list.map((o) => {
    const [pl, pc] = PAY_BADGE[o.status] || ["—", "obadge--pending"];
    const stage = o.stage || "yeni";
    const b = o.buyer || {};
    const waPhone = (b.phone || "").replace(/\D/g, "").replace(/^0/, "90");
    const items = (o.items || []).map((i) => `<tr><td>${esc(i.name)} ${esc(i.size || "")} × ${i.qty}</td><td>${i.price * i.qty} TL</td></tr>`).join("");
    const pay = o.payment && o.payment.lastFour
      ? `<p class="lbl">Kart</p><p>${esc(o.payment.cardAssociation || "")} •••• ${esc(o.payment.lastFour)}${o.payment.installment > 1 ? ` (${o.payment.installment} taksit)` : ""}</p>` : "";
    return `
    <div class="order">
      <div class="order__top">
        <span class="order__date">${fmtDate(o.createdAt)}</span>
        <div class="order__badges">
          <span class="obadge ${pc}">${pl}</span>
          <span class="obadge obadge--stage">${STAGE_LABEL[stage] || stage}</span>
        </div>
      </div>
      <div class="order__grid">
        <div class="order__buyer">
          <p class="lbl">Müşteri</p>
          <p><b>${esc(b.name || "-")}</b></p>
          <p>${b.phone ? `<a href="https://wa.me/${waPhone}" target="_blank" rel="noopener">${esc(b.phone)}</a> · <a href="tel:${esc(b.phone)}">Ara</a>` : "-"}</p>
          ${b.email ? `<p><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></p>` : ""}
          <p class="lbl">Adres</p>
          <p>${esc(b.address || "-")}${b.city ? ", " + esc(b.city) : ""}</p>
          ${pay}
        </div>
        <div class="order__items">
          <p class="lbl" style="color:var(--ink-mute);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Ürünler</p>
          <table>${items}</table>
          <div class="order__total"><span>Toplam</span><b>${o.total} TL</b></div>
        </div>
      </div>
      <div class="order__actions">
        ${stage !== "kargolandi" ? `<button class="btn btn--ghost btn--sm" data-ord-stage="kargolandi" data-id="${o.id}">Kargolandı</button>` : ""}
        ${stage !== "tamamlandi" ? `<button class="btn btn--gold btn--sm" data-ord-stage="tamamlandi" data-id="${o.id}">Tamamlandı</button>` : ""}
        ${stage !== "yeni" ? `<button class="btn btn--ghost btn--sm" data-ord-stage="yeni" data-id="${o.id}">Yeni'ye al</button>` : ""}
        <span class="spacer"></span>
        <button class="btn btn--ghost btn--sm" data-ord-del="${o.id}">Sil</button>
      </div>
    </div>`;
  }).join("");
}
el.ordersList.addEventListener("click", async (e) => {
  const st = e.target.closest("[data-ord-stage]");
  const del = e.target.closest("[data-ord-del]");
  if (st) {
    await orderAction({ action: "update", id: st.dataset.id, stage: st.dataset.ordStage });
  } else if (del) {
    if (!confirm("Bu siparişi silmek istediğinize emin misiniz?")) return;
    await orderAction({ action: "delete", id: del.dataset.ordDel });
  }
});
async function orderAction(payload) {
  try {
    const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() }, body: JSON.stringify(payload) });
    if (r.status === 401) { toast("Oturum süresi doldu.", true); logout(); return; }
    const d = await r.json().catch(() => ({}));
    if (d.ok) { toast("Güncellendi ✓"); loadOrders(); }
    else toast(d.error || "İşlem başarısız.", true);
  } catch { toast("Sunucuya ulaşılamadı.", true); }
}

/* ---------- warn on unload ---------- */
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ---------- boot ---------- */
if (token()) enterApp();
