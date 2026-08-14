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

/* ---------- warn on unload ---------- */
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ---------- boot ---------- */
if (token()) enterApp();
