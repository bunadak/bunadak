/**
 * Kalıp üreteci — kapaklar.js'teki her kaydı HTML'e çevirir.
 * Yeni bir düzen eklemek istersen: DUZENLER'e bir fonksiyon ekle,
 * stil.css'e `.d-<ad>` bloğunu yaz. Başka hiçbir yeri değiştirmen gerekmez.
 */
import { RENK, TEMA, BOYUT } from './marka.js';
import { imzaBlogu, madalyonBlogu } from './logo.js';
import { dizgi } from './formul.js';
import { cizimSVG } from './cizim.js';

/* ---------- yardımcılar ---------- */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

/** Metni satırlara böler; "|" ile elle satır kırabilirsin. */
const satirla = (s = '') =>
  esc(s)
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean);

/** Bakır metal başlık bloğu (satır satır). */
const metalBaslik = (metin, cls = '') =>
  satirla(metin)
    .map((s) => `<div class="metal">${s}</div>`)
    .join('');

const kemikBaslik = (metin) =>
  satirla(metin)
    .map((s) => `<div class="kemik">${s}</div>`)
    .join('');

/** Deterministik "rastgelelik" — aynı başlık her zaman aynı kompozisyonu verir. */
function tohum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); return ((h >>> 0) % 10000) / 10000; };
}

const SEMBOLLER = ['∫', 'π', '∑', '√', 'Δ', 'θ', '∞', 'λ', '≠', '∂', 'φ', '±', 'Ω', '≈'];

/** Kenarlarda dolaşan soluk semboller — merkezdeki metni asla boğmaz. */
function hayaletler(anahtar, adet = 8) {
  const r = tohum(anahtar);
  const yerler = [
    [3, 9], [88, 5], [8, 72], [76, 80], [45, 2], [93, 40],
    [1, 42], [62, 88], [28, 90], [82, 20],
  ];
  return `<div class="hayaletler">${yerler
    .slice(0, adet)
    .map(([x, y]) => {
      const s = 62 + Math.round(r() * 78);
      const d = Math.round((r() - 0.5) * 30);
      const g = SEMBOLLER[Math.floor(r() * SEMBOLLER.length)];
      return `<span class="hayalet" style="left:${x}%;top:${y}%;font-size:${s}px;transform:rotate(${d}deg)">${g}</span>`;
    })
    .join('')}</div>`;
}

const atmosfer = (anahtar, adet) => `
  ${hayaletler(anahtar, adet)}
  <div class="izgara"></div>
  <div class="huzme"></div>
  <div class="vinyet"></div>
  <div class="gren"></div>
  <div class="taban-serit"></div>`;

const kickerHTML = (k) => (k ? `<div class="kicker">${esc(k)}</div>` : '');
const bolumHTML = (b) => (b ? `<div class="bolum">${esc(b)}</div>` : '');
const altHTML = (a) =>
  a ? `<div class="alt">${esc(a).replace(/\*(.+?)\*/g, '<b>$1</b>')}</div>` : '';

/** Formülü matematiksel olarak dizer (kesir, limit, üs/alt indis). */
const matHTML = (f) => `<span class="mat">${dizgi(f)}</span>`;

/* =============================================================
   DÜZENLER
   ============================================================= */

const DUZENLER = {
  /**
   * SABİT KALIP — kanalın standart kapağı.
   * Intro videosunun devamı: sıva duvar, bakır teknik çizim, çelik madalyon.
   * Videodan videoya değişen tek şey `konu`.
   */
  mathera: (k, imza, logoURI) => `
    ${cizimSVG()}
    <div class="sahne d-mathera">
      <div class="sol">
        ${kickerHTML(k.ustBaslik)}
        <div class="konu oyma fit" data-max="128">${satirla(k.konu || k.baslik)
          .map((s) => `<div>${s}</div>`).join('')}</div>
        <div class="folyo"></div>
        ${altHTML(k.altBaslik)}
      </div>
      <div class="sag">${madalyonBlogu({ logoURI, boyut: 360 })}</div>
    </div>
    ${bolumHTML(k.rozet)}
    ${imza}`,

  /** Bayrak gemisi: sol blok başlık, sağda formül levhası. */
  imza: (k, imza) => `
    <div class="sahne d-imza">
      <div class="sol">
        ${kickerHTML(k.ustBaslik)}
        <div class="baslik fit" data-max="112">${metalBaslik(k.baslik)}</div>
        ${k.vurgu ? `<div class="vurgu kemik fit" data-max="70">${esc(k.vurgu)}</div>` : ''}
        <div class="folyo"></div>
        ${altHTML(k.altBaslik)}
      </div>
      <div class="sag">
        ${k.formul
          ? `<div class="levha">
               <div class="levha-etiket">${esc(k.levhaEtiketi || 'ANAHTAR BAĞINTI')}</div>
               <div class="formul metal fit" data-max="52">${matHTML(k.formul)}</div>
             </div>`
          : ''}
      </div>
    </div>
    ${bolumHTML(k.rozet)}
    ${imza}`,

  /** Formül kahraman: bağıntı ortada dev, konu altında. */
  formul: (k, imza) => `
    <div class="sahne d-formul">
      ${kickerHTML(k.ustBaslik)}
      <div class="dev-formul metal fit" data-max="104">${matHTML(k.formul || k.baslik)}</div>
      <div class="folyo"></div>
      <div class="baslik fit" data-max="56">${kemikBaslik(k.baslik)}</div>
      ${altHTML(k.altBaslik)}
    </div>
    ${bolumHTML(k.rozet)}
    ${imza}`,

  /** Merak boşluğu: dev soru işareti + cevap vaadi. */
  soru: (k, imza) => `
    <div class="dev-isaret">?</div>
    <div class="sahne d-soru">
      <div class="sol">
        ${kickerHTML(k.ustBaslik)}
        <div class="baslik fit" data-max="96">${metalBaslik(k.baslik)}</div>
        ${k.vurgu ? `<div class="vurgu kemik fit" data-max="78">${esc(k.vurgu)}</div>` : ''}
        ${altHTML(k.altBaslik)}
        ${k.dugme ? `<div class="cevap-kutu">${esc(k.dugme)}</div>` : ''}
      </div>
    </div>
    ${bolumHTML(k.rozet)}
    ${imza}`,

  /** Karşılaştırma: iki kavram karşı karşıya. */
  ikilem: (k, imza) => `
    <div class="sahne d-ikilem">
      ${kickerHTML(k.ustBaslik)}
      <div class="cift">
        <div class="taraf">
          <div class="baslik fit" data-max="76">${metalBaslik(k.sol || k.baslik)}</div>
          ${k.solRol ? `<div class="rol">${esc(k.solRol)}</div>` : ''}
        </div>
        <div class="karsi"><span class="metal">${esc(k.karsi || 'vs')}</span></div>
        <div class="taraf">
          <div class="baslik fit" data-max="76">${kemikBaslik(k.sag || k.vurgu)}</div>
          ${k.sagRol ? `<div class="rol">${esc(k.sagRol)}</div>` : ''}
        </div>
      </div>
      ${altHTML(k.altBaslik)}
    </div>
    ${bolumHTML(k.rozet)}
    ${imza}`,

  /** Dev rakam + madde listesi. */
  adim: (k, imza) => `
    <div class="sahne d-adim">
      <div class="rakam metal">${esc(k.rakam || '3')}</div>
      <div class="sag">
        ${kickerHTML(k.ustBaslik)}
        <div class="baslik fit" data-max="82">${kemikBaslik(k.baslik)}</div>
        ${k.vurgu ? `<div class="vurgu metal fit" data-max="56">${esc(k.vurgu)}</div>` : ''}
        ${Array.isArray(k.maddeler) && k.maddeler.length
          ? `<div class="liste">${k.maddeler.map((m) => `<div>${esc(m)}</div>`).join('')}</div>`
          : altHTML(k.altBaslik)}
      </div>
    </div>
    ${bolumHTML(k.rozet)}
    ${imza}`,

  /** Sakin editoryal düzen — ders serisi, playlist kapakları. */
  ders: (k, imza) => `
    <div class="sahne d-ders">
      <div class="ust">
        ${kickerHTML(k.ustBaslik)}
        ${k.rozet ? `<div style="font-family:Sora;font-weight:800;font-size:16px;letter-spacing:.26em;color:var(--ikincil)">${esc(k.rozet)}</div>` : ''}
      </div>
      <div class="orta">
        <div class="baslik fit" data-max="92">${metalBaslik(k.baslik)}</div>
        ${k.vurgu ? `<div class="vurgu kemik fit" data-max="62">${esc(k.vurgu)}</div>` : ''}
        <div class="cizgi-ince"></div>
        ${altHTML(k.altBaslik)}
      </div>
      <div class="taban">
        ${imza}
        ${k.formul ? `<div class="formul-satir">${matHTML(k.formul)}</div>` : ''}
      </div>
    </div>`,

  /** Kanal başlığı (banner) — güvenli alan içine yerleşir. */
  banner: (k, imza) => `
    <div class="sahne d-banner">
      <div class="guvenli">
        ${k.ustBaslik ? `<div class="slogan">${esc(k.ustBaslik)}</div>` : ''}
        <div class="marka-yazi oyma fit" data-max="232">${esc(k.baslik)}</div>
        ${k.altBaslik ? `<div class="banner-alt">${esc(k.altBaslik)}</div>` : ''}
      </div>
    </div>`,
};

/* =============================================================
   OTOMATİK METİN SIĞDIRMA
   Uzun konu adlarında bile taşma olmaz: punto kademeli düşer.
   ============================================================= */
const SIGDIR = `
<script>
// Fontlar yüklenmeden ölçüm yapılırsa yedek font üzerinden hesaplanır ve
// başlıklar sessizce taşar — bu yüzden fonts.ready bekleniyor.
document.fonts.ready.then(function () {
  var ogeler = [].slice.call(document.querySelectorAll('.fit'));
  var sahne  = document.querySelector('.sahne');

  // Kapsayıcının gerçek iç genişliği (padding hariç)
  function icGenislik(kap) {
    var s = getComputedStyle(kap);
    return kap.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  }
  // Bir kutunun içindeki en geniş satırın gerçek genişliği.
  function birimGenislik(kutu) {
    var aralik = document.createRange();
    aralik.selectNodeContents(kutu);
    var rects = aralik.getClientRects(), en = 0;
    for (var i = 0; i < rects.length; i++) en = Math.max(en, rects[i].width);
    return en;
  }
  // scrollWidth güvenilmez (text-align:center'da taşma yansımaz) ve blok
  // çocukların rect'i her zaman kapsayıcı kadar geniştir — bu yüzden hem
  // elemanın kendisini hem de her çocuğunun içeriğini ayrı ayrı ölçüyoruz.
  function metinGenisligi(el) {
    var en = Math.max(birimGenislik(el), el.scrollWidth);
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      // inline-flex (formül dizgisi) Range ile parça parça ölçülür; onda
      // doğru olan kutunun kendi genişliğidir.
      en = getComputedStyle(c).display.indexOf('inline') === 0
        ? Math.max(en, c.getBoundingClientRect().width)
        : Math.max(en, birimGenislik(c));
    }
    return en;
  }
  function genislikTasiyor(el) {
    return metinGenisligi(el) > icGenislik(el.parentElement) + 0.5;
  }
  // Sahnenin gerçek içerik sınırları. scrollHeight yetmez: justify-content:center
  // ile yukarı taşan içerik scrollHeight'a yansımaz.
  function sahneTasiyor() {
    var r = sahne.getBoundingClientRect();
    var s = getComputedStyle(sahne);
    var ust = r.top + parseFloat(s.paddingTop) - 12;
    var alt = r.bottom - parseFloat(s.paddingBottom) + 12;
    var sol = r.left + parseFloat(s.paddingLeft) - 12;
    var sag = r.right - parseFloat(s.paddingRight) + 12;
    var cocuklar = [].slice.call(sahne.children);
    for (var i = 0; i < cocuklar.length; i++) {
      var q = cocuklar[i].getBoundingClientRect();
      if (q.width === 0 || q.height === 0) continue;
      if (q.top < ust || q.bottom > alt || q.left < sol || q.right > sag) return true;
    }
    return false;
  }

  // 1. geçiş — her başlığı kendi sütununun genişliğine sığdır
  ogeler.forEach(function (el) {
    var max = parseFloat(el.dataset.max || getComputedStyle(el).fontSize);
    var min = max * 0.40;
    var p = max;
    el.style.fontSize = p + 'px';
    while (p > min && genislikTasiyor(el)) { p -= 1; el.style.fontSize = p + 'px'; }
    el.dataset.punto = p;
  });

  // 2. geçiş — dikeyde hâlâ taşma varsa hepsini oransal küçült (hiyerarşi bozulmaz)
  var k = 1;
  while (k > 0.55 && sahneTasiyor()) {
    k -= 0.02;
    ogeler.forEach(function (el) { el.style.fontSize = (el.dataset.punto * k) + 'px'; });
  }

  document.documentElement.dataset.hazir = '1';
});
</script>`;

/* =============================================================
   SAYFA
   ============================================================= */

/** İmzanın hangi köşede duracağı (düzenin görsel ağırlığına göre). */
const IMZA_SAG = new Set(['adim']);
/** Kendi grafik odağı olan düzenlerde hayalet sembol sayısı azaltılır. */
const HAYALET_ADET = { soru: 3, formul: 6, banner: 10 };

/** Düzenin doğal teması — kapaklar.js'te `tema` verilmezse bu kullanılır. */
const VARSAYILAN_TEMA = { mathera: 'siva', banner: 'siva', ders: 'krem' };

export function kapakHTML(kayit, marka, logoURI) {
  const duzenAdi = DUZENLER[kayit.tasarim] ? kayit.tasarim : 'mathera';
  const temaAdi = kayit.tema || VARSAYILAN_TEMA[duzenAdi] || 'bakir';
  const t = TEMA[temaAdi] || TEMA.siva;
  const olcu = duzenAdi === 'banner' ? BOYUT.banner : BOYUT.kapak;

  const imza = imzaBlogu({
    kanal: marka.kanal,
    etiket: marka.etiket,
    logoURI,
    boyut: 54,
    sag: IMZA_SAG.has(duzenAdi),
  });

  const govde = DUZENLER[duzenAdi](kayit, duzenAdi === 'banner' ? '' : imza, logoURI);

  return `<!doctype html>
<html data-tema="${esc(temaAdi)}">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="stil.css">
<style>
  :root {
    --w:${olcu.w}px; --h:${olcu.h}px;
    --zemin1:${t.zemin1}; --zemin2:${t.zemin2};
    --isik:${t.isikHuzmesi}; --izgara:${t.izgara}; --hayalet:${t.hayaletSembol};
    --metin:${t.metin}; --ikincil:${t.ikincilMetin};
    --cizgi:${t.cizgi}; --panel-zemin:${t.panelZemin}; --panel-cizgi:${t.panelCizgi};
    --bakir-parlak:${RENK.bakirParlak}; --bakir-isik:${RENK.bakirIsik};
    --bakir-orta:${RENK.bakirOrta};    --bakir-govde:${RENK.bakirGovde};
    --bakir-golge:${RENK.bakirGolge};  --bakir-dip:${RENK.bakirDip};
  }
</style>
</head>
<body>
  <div class="tuval tema-${esc(temaAdi)}">
    ${atmosfer((kayit.konu || kayit.baslik || '') + duzenAdi, HAYALET_ADET[duzenAdi])}
    ${govde}
  </div>
  ${SIGDIR}
</body>
</html>`;
}

export const duzenListesi = () => Object.keys(DUZENLER);
