/* ===== Oğuzcan Yöresel - site data & interactions ===== */
const WHATSAPP = "905305752060";
const INSTAGRAM = "https://www.instagram.com/oguzcanyoreselmarket/";

const CATS = ["Tümü", "Salçalar", "Soslar", "Baharatlar", "Sirkeler"];

const PRODUCTS = [
  // ---------- SALÇALAR ----------
  { name:"Domates Salçası", size:"450 g", price:160, cat:"Salçalar", img:"domates-salcasi-450g.png",
    desc:"Dalından koparılan domatesleri kendi mevsiminde, katkısız olarak işliyoruz. Domatesin gerçek tadını, kokusunu ve rengini sofranıza taşıyan yoğun kıvamlı ev usulü salça." },
  { name:"Domates Salçası", size:"1 Kg", price:330, cat:"Salçalar", img:"domates-salcasi-1kg.png",
    desc:"Kalabalık sofralar ve kışlık hazırlıklar için ideal 1 kg boy. Tamamen doğal, katkısız; çorbadan yemeğe her tarifin lezzetini tamamlar." },
  { name:"Tatlı Biber Salçası", size:"450 g", price:185, cat:"Salçalar", img:"tatli-biber-salcasi-450g.png",
    desc:"Güneşte özenle kurutulan biberlerden, acısız ve yumuşak lezzetiyle. Kahvaltıdan yemeğe kadar sofranıza Gaziantep'in doğal tadını getirir." },
  { name:"Tatlı Biber Salçası", size:"1 Kg", price:385, cat:"Salçalar", img:"tatli-biber-salcasi-1kg.png",
    desc:"Katkısız, güneşte kurutulmuş tatlı biberden hazırlanan yoğun kıvamlı salça. Ailece tüketim için ekonomik 1 kg boy." },
  { name:"Tatlı Biber Salçası", size:"2 Kg", price:700, cat:"Salçalar", img:"tatli-biber-salcasi-2kg.png",
    desc:"Yoğun kullanan mutfaklar ve kışlık için en avantajlı 2 kg boy. Doğal, katkısız ve el emeği tatlı biber salçası." },
  { name:"Acı Biber Salçası", size:"450 g", price:185, cat:"Salçalar", img:"aci-biber-salcasi-450g.png",
    desc:"Güneşte kurutulan acı biberlerden, o meşhur Antep acısıyla. Katkısız üretim; yemeklerinize karakterli ve dengeli bir acılık katar." },
  { name:"Acı Biber Salçası", size:"2 Kg", price:700, cat:"Salçalar", img:"aci-biber-salcasi-2kg.png",
    desc:"Acı sevenler için bol miktarda, ekonomik 2 kg boy. Doğal yöntemlerle, güneşte kurutulmuş biberden hazırlanan gerçek Antep acı salçası." },

  // ---------- SOSLAR ----------
  { name:"Nar Ekşisi", size:"300 g", price:300, cat:"Soslar", img:"nar-eksisi-300g.png",
    desc:"Gerçek nar suyundan, yavaşça kaynatılarak elde edilen yoğun ve dengeli ekşi. Salatalara, mezelere ve et yemeklerine eşsiz bir tat verir." },
  { name:"Nar Ekşisi", size:"575 g", price:450, cat:"Soslar", img:"nar-eksisi-575g.png",
    desc:"Katkısız, koyu kıvamlı nar ekşisinin avantajlı büyük boyu. Sofranızın vazgeçilmez doğal sosu; mevsim salatalarının olmazsa olmazı." },

  // ---------- BAHARATLAR ----------
  { name:"Kimyon", size:"50 g", price:60, cat:"Baharatlar", img:"kimyon.png",
    desc:"Taze öğütülmüş, aroması yerinde kimyon. Köfteden çorbaya, kuru baklagillerden ete tüm yemeklerinize sıcacık bir derinlik katar." },
  { name:"Karabiber", size:"50 g", price:85, cat:"Baharatlar", img:"karabiber.png",
    desc:"Organik tanelerden taze çekilmiş karabiber. Keskin kokusu ve dengeli acısıyla her mutfağın temel baharatı." },
  { name:"Acı Toz Biber", size:"50 g", price:65, cat:"Baharatlar", img:"aci-toz-biber-50g.png",
    desc:"Gurme baharatlar serisinden, ince öğütülmüş acı toz biber. Yemeklerinize canlı bir renk ve dengeli acılık verir." },
  { name:"Acı Toz Biber", size:"100 g", price:null, cat:"Baharatlar", img:"aci-toz-biber-100g.png",
    desc:"Sık kullananlar için 100 g boy. İnce öğütülmüş, katkısız acı toz biber; sofranıza Antep'in canlı kırmızısını taşır." },
  { name:"Toz Biber", size:"50 g", price:65, cat:"Baharatlar", img:"toz-biber-50g.png",
    desc:"Tatlı, ince öğütülmüş kırmızı toz biber. Yemeklere renk ve hafif bir tatlılık katan doğal baharat." },
  { name:"Toz Biber", size:"100 g", price:null, cat:"Baharatlar", img:"toz-biber-100g.png",
    desc:"Kırmızı biberden hazırlanan tatlı toz biberin 100 g avantajlı boyu. Katkısız, doğal renk ve lezzet." },
  { name:"Köfte Baharatı", size:"65 g", price:65, cat:"Baharatlar", img:"kofte-baharati.png",
    desc:"Özel karışım köfte baharatı. Kıymalı yemeklerinize kusursuz bir lezzet dengesi kazandıracak, ölçüsü ayarlanmış harman." },
  { name:"Tavuk Baharatı", size:"65 g", price:65, cat:"Baharatlar", img:"tavuk-baharati.png",
    desc:"Tavuk yemekleri için özenle harmanlanmış baharat karışımı. Fırın, ızgara ve sotelerde iştah açan bir aroma sağlar." },
  { name:"Acı Pul Biber", size:"50 g", price:null, cat:"Baharatlar", img:"aci-pul-biber.png",
    desc:"Güneşte kurutulup pul pul öğütülen acı biber. Çorbadan mezeye her sofraya karakterli bir acılık ve iştah katar." },
  { name:"İpek Pul Biber", size:"100 g", price:85, cat:"Baharatlar", img:"ipek-pul-biber.png",
    desc:"Özel kavrulmuş İslahiye biberinden, yağı alınmadan hazırlanan yumuşak içimli pul biber. İpeksi dokusu ve hafif acısıyla farkını hissettirir." },
  { name:"İsot Biber", size:"100 g", price:75, cat:"Baharatlar", img:"isot-biber.png",
    desc:"Özel kavrulmuş Urfa biberi, tuz ve güneş ışığıyla olgunlaştırılan gerçek isot. Koyu rengi ve tütsülü aromasıyla yöresel sofraların yıldızı." },
  { name:"Kuru Nane", size:"50 g", price:60, cat:"Baharatlar", img:"kuru-nane.png",
    desc:"Gölgede kurutulmuş, aroması korunmuş kuru nane. Çorbalara, ayrana ve yemeklere ferahlatıcı bir koku ve tat verir." },
  { name:"Toz Soğan", size:"50 g", price:60, cat:"Baharatlar", img:"toz-sogan.png",
    desc:"Kurutulup ince öğütülmüş doğal toz soğan. Pratik kullanımı ve yoğun aromasıyla marinasyon ve harçların gizli lezzeti." },
  { name:"Çörek Otu", size:"50 g", price:null, cat:"Baharatlar", img:"corek-otu.png",
    desc:"Doğal, ayıklanmış çörek otu. Ekmek ve poğaçaların üzerine, salatalara ve kahvaltılıklara nefis bir tat ve görüntü katar." },
  { name:"Susam", size:"50 g", price:null, cat:"Baharatlar", img:"susam.png",
    desc:"Doğal susam tohumu. Fırın ürünlerinden tahinli tariflere, sofranıza bereket ve çıtırlık ekleyen doğal lezzet." },
  { name:"Toz Tarçın", size:"50 g", price:null, cat:"Baharatlar", img:"toz-tarcin.png",
    desc:"Taze öğütülmüş toz tarçın. Tatlılardan sıcak içeceklere, sütlaçtan komposto ve hamur işlerine sıcacık bir aroma verir." },
  { name:"Zerdeçal", size:"50 g", price:null, cat:"Baharatlar", img:"zerdecal.png",
    desc:"Doğal, katkısız zerdeçal. Canlı sarı rengi ve toprağımsı aromasıyla yemeklerinize hem renk hem sağlıklı bir dokunuş katar." },
  { name:"Limon Tuzu", size:"50 g", price:null, cat:"Baharatlar", img:"limon-tuzu.png",
    desc:"Doğal limon tuzu. Yemek ve salatalara ferah bir ekşilik verir; kışlık hazırlıklarda da güvenle kullanılır." },
  { name:"Toz Sumak Ekşisi", size:"50 g", price:null, cat:"Baharatlar", img:"toz-sumak.png",
    desc:"Sumak bitkisinden öğütülen doğal ekşi baharat. Salata, soğan ve kebap sofralarının vazgeçilmez, dengeli ekşiliği." },

  // ---------- SİRKELER ----------
  { name:"Enginar Sirkesi", size:"500 ml", price:null, cat:"Sirkeler", img:"enginar-sirkesi.png",
    desc:"Doğal fermantasyonla üretilen enginar sirkesi. Salatalarınıza ve günlük tüketiminize yumuşak, aromatik bir ekşilik katar." },
  { name:"Elma Sirkesi", size:"500 ml", price:null, cat:"Sirkeler", img:"elma-sirkesi.png",
    desc:"Gerçek elmalardan, doğal yöntemle üretilen elma sirkesi. Salatalardan günlük kullanıma, sofranızın doğal ve ferah tamamlayıcısı." },
  { name:"Ananas Sirkesi", size:"500 ml", price:null, cat:"Sirkeler", img:"ananas-sirkesi.png",
    desc:"Ananastan üretilen, tropikal aromalı doğal sirke. Salata ve soslarınıza farklı, hoş bir tat arayanlar için ideal." },
];

/* ---------- helpers ---------- */
function waLink(msg){ return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`; }
function priceHTML(p){
  if(p.price === null) return `<span class="card__price ask">Fiyat için iletişime geçin</span>`;
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
  wrap.innerHTML = list.map(p=>`
    <article class="card reveal">
      <div class="card__media">
        <span class="card__cat">${p.cat}</span>
        <img src="assets/urunler/${p.img}" alt="${p.name} ${p.size}" loading="lazy">
      </div>
      <div class="card__body">
        <h3 class="card__title">${p.name}</h3>
        <div class="card__size">${p.size}</div>
        <p class="card__desc">${p.desc}</p>
        <div class="card__foot">
          ${priceHTML(p)}
          <a class="card__buy" href="${waLink(orderMsg(p))}" target="_blank" rel="noopener" aria-label="${p.name} sipariş">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.599 5.334l-.999 3.648 3.9-.881zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            Sipariş
          </a>
        </div>
      </div>
    </article>`).join("");
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

document.addEventListener("DOMContentLoaded", ()=>{
  initNav();
  initFilters();
  renderProducts(document.body.dataset.homeLimit ? "Tümü" : "Tümü", document.body.dataset.homeLimit ? Number(document.body.dataset.homeLimit) : null);
  observeReveal();
  const y = document.getElementById("year"); if(y) y.textContent = new Date().getFullYear();
});
