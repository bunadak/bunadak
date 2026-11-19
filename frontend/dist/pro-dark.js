/* =============================================================================
 * Notis PRO — KARANLIK MOD (TÜM UYGULAMA)  · opsiyon, varsayılan KAPALI
 *
 * Tek anahtar; kapsamı uygulamanın TAMAMI:
 *   • Arayüz  — üst panel, sol ray, yan panel, pencereler koyu temaya geçer.
 *   • Tahta   — boş çalışma tahtasının zemini ve ızgarası gece tonuna iner.
 *   • Belge   — PDF / slayt / görsel sayfaları uyarlanabilir eğriyle koyulaşır.
 *   • Mürekkep— koyu zeminde kaybolmasın diye çizim renkleri EKRANDA dengelenir.
 *
 * TASARIM KURALI — "hiçbir kalıcı veriye dokunma":
 * Sayfa nesnesine gece görseli YAZILMAZ. Gece sürümleri kaynak görsele bağlı
 * bir önbellekte durur ve YALNIZCA redraw() çağrısının içinde, o kare boyunca
 * takılır; kare biter bitmez orijinal geri konur (finally). Bu yüzden:
 *   – kayıt / dışa aktarma / küçük resim DAİMA orijinal görselle çalışır,
 *   – tembel yükleyici, bellek tahliyesi ve kütüphane kaydı hiç etkilenmez,
 *   – mod kapatıldığında geriye temizlenecek hiçbir durum kalmaz.
 * Kalem motoruna (drawStroke / mürekkep matematiği) TEK BİR SATIR dokunmaz.
 *
 * DONMA YOK: gece görseli üretimi tek blokta değil, zaman bütçeli dilimler
 * hâlinde yapılır ve kalem kâğıttayken kendiliğinden geri çekilir.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_dark_opts";
  var DEF = { on: false, level: "standard", tone: "neutral", color: true, ink: true, ui: true, board: true,
            engine: "sharp", warm: 0 };
  var P = load();
  var ACTIVE = false;
  var prevTheme = null;

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {}; for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { (window.notisLsSet || function (k, v) { localStorage.setItem(k, v); })(KEY, JSON.stringify(P)); } catch (_) {} }
  function $id(x) { return document.getElementById(x); }

  /* Şiddet profilleri: lo = kâğıdın yeni tonu, hi = metnin yeni tonu (0–255) */
  var LV = {
    soft:     { lo: 34, hi: 214, gamma: 1.00, board: 30 },
    standard: { lo: 22, hi: 228, gamma: 1.06, board: 19 },
    deep:     { lo: 12, hi: 240, gamma: 1.12, board: 10 }
  };
  var TONE = { neutral: [1.00, 1.00, 1.00], warm: [1.06, 0.99, 0.90], cool: [0.94, 0.98, 1.07] };
  function prof() { return LV[P.level] || LV.standard; }
  function tone() { return TONE[P.tone] || TONE.neutral; }
  function keyOf() { return P.level + "|" + P.tone + "|" + (P.color ? "c" : "-") + "|" + P.engine; }

  function rgb(v, k) { var t = tone();
    return "rgb(" + Math.round(Math.min(255, v * t[0] * (k || 1))) + "," +
                    Math.round(Math.min(255, v * t[1] * (k || 1))) + "," +
                    Math.round(Math.min(255, v * t[2] * (k || 1))) + ")"; }

  var WEBON = false;              // kare başına bir kez tazelenir — sıcak döngüde DOM okuması yok
  function readWeb() { try { WEBON = document.body.classList.contains("pro-web"); } catch (_) { WEBON = false; } return WEBON; }
  function webOn() { return WEBON; }
  /* Tahtayı biz mi koyultuyoruz? (Zaten koyu olan tahta stilleri olduğu gibi kalır.) */
  function lightBoard() {
    try { var b = (typeof S !== "undefined" && S.board) || "classic";
      return b === "classic" || b === "dotnote" || b === "linednote"; } catch (_) { return true; }
  }

  /* ----------------------------------------------------- PARLAKLIK EĞRİSİ */
  var LUT = null, LUTK = "";
  function lut() {
    var c = prof(), k = P.level;
    if (LUT && LUTK === k) return LUT;
    var t = new Uint8Array(256);
    for (var i = 0; i < 256; i++) {
      var x = Math.pow(1 - i / 255, c.gamma);
      t[i] = Math.max(0, Math.min(255, Math.round(c.lo + (c.hi - c.lo) * x)));
    }
    LUT = t; LUTK = k; return t;
  }

  /* ===========================================================================
   * KESKİN MOTOR (GPU SÜZGECİ) — v3.1'in asıl değişikliği
   * ---------------------------------------------------------------------------
   * Eski yol her sayfa görselini JavaScript'te piksel piksel bir eğriden
   * geçirip önbelleğe alıyordu. Üç gerçek sorun doğuruyordu:
   *   1) Sayfa önce GÜNDÜZ renkleriyle görünüyor, bir süre sonra koyuluyordu.
   *   2) Bellek koruması için görsel 2400 px'e indiriliyordu — yüksek
   *      çözünürlüklü ekranda PDF metni GÖRÜNÜR BİÇİMDE BULANIKLAŞIYORDU.
   *   3) Üretim dilimleri kare süresini yiyordu; sayfa çevirirken takılma.
   *
   * Yeni yol: dönüşüm tuvalin kendi süzgeciyle, çizim anında, GPU'da yapılır.
   *   · anında — ara durum yok, sayfa daima doğru renkte açılır
   *   · tam çözünürlük — hiçbir ölçek düşürme yok, metin kılı kılına keskin
   *   · sıfır bellek — önbellek, kuyruk, dilimleme, çöp toplama yok
   *
   * Süzgeç zinciri:  invert(1) hue-rotate(180deg)  →  parlaklığı ters çevirir
   * ama RENK TONUNU korur (kırmızı kırmızı kalır, maviye dönmez).
   * Ardından contrast/brightness ile aralık sıkıştırılır: kâğıt saf siyaha,
   * metin saf beyaza gitmez — uzun okumada göz yormayan bir bant kalır.
   *
   * Matematik: invert sonrası x∈[0,1]; istediğimiz çıkış lo + (hi−lo)·x.
   *   contrast(k) → (x−0.5)k+0.5 ,  brightness(b) → ·b
   *   k·b = hi−lo   ve   b·0.5·(1−k) = lo   denklemlerinden k ve b çözülür.
   * ========================================================================= */
  var FLV = {
    soft:     { lo: 0.135, hi: 0.840 },
    standard: { lo: 0.085, hi: 0.890 },
    deep:     { lo: 0.045, hi: 0.940 }
  };
  var FTONE = { neutral: "", warm: " sepia(.16)", cool: " hue-rotate(-8deg) saturate(1.08)" };
  var FCACHE = "", FCACHEK = "";
  function filterChain() {
    var k = keyOf();
    if (FCACHE && FCACHEK === k) return FCACHE;
    var c = FLV[P.level] || FLV.standard;
    var span = c.hi - c.lo;
    var kk = (0.5 * span) / (c.lo + 0.5 * span);     // contrast
    var bb = span / kk;                               // brightness
    FCACHE = "invert(1) hue-rotate(180deg) contrast(" + (kk * 100).toFixed(1) + "%) brightness(" +
             (bb * 100).toFixed(1) + "%)" + (FTONE[P.tone] || "");
    FCACHEK = k;
    return FCACHE;
  }
  function sharpOn() { return ACTIVE && P.engine !== "photo"; }
  /* Sayfa görseli çizimini süzgeçle sar. YALNIZ ana tuvale (ctx) uygulanır:
     küçük resim, dışa aktarma ve yazdırma kendi tuvallerine çizer, oraya
     daima ORİJİNAL görsel gider. */
  function hookPageBg() {
    var orig = window.drawPageBg;
    if (typeof orig !== "function" || orig.__dark) return;
    var wrap = function (c, pg, w, h) {
      if (!sharpOn() || !INFRAME || !onScreen(c)) return orig.apply(this, arguments);
      var f = c.filter;
      try { c.filter = filterChain(); return orig.apply(this, arguments); }
      finally { try { c.filter = f || "none"; } catch (_) {} }
    };
    wrap.__dark = true;
    window.drawPageBg = wrap;
  }

  /* ===========================================================================
   * FOTOĞRAF MOTORU (piksel) — isteğe bağlı ikinci motor
   * Keskin motorda fotoğraflar da ters döner (bilinen ödünleşme). Fotoğraf
   * ağırlıklı belgelerde bu motor renkli bölgelerin tonunu ve doygunluğunu
   * korur; karşılığında daha yavaştır ve bellek kullanır.
   * ========================================================================= */
  /* ===========================================================================
   * GECE GÖRSELİ ÖNBELLEĞİ  —  kaynak görsele bağlı, LRU sınırlı, dilimli üretim
   * ========================================================================= */
  var CACHE = new Map();          // img -> {cv,key,done}
  var MAXN = 4;                   // en çok 4 gece sayfası bellekte tutulur
  var MAXPX = 4096;               // gece görselinin en uzun kenar tavanı (2400 metni bulanıklaştırıyordu)
  var JOB = null, QUEUE = [], PUMPED = false;
  var STAT = { max: 0, n: 0 };     // en uzun üretim dilimi (ms) — kararlılık ölçümü

  function touch(img, e) { CACHE.delete(img); CACHE.set(img, e); }
  function trim() {
    while (CACHE.size > MAXN) {
      var it = CACHE.keys().next();
      if (it.done) break;
      var k = it.value, e = CACHE.get(k);
      CACHE.delete(k);
      if (e) free(e.cv);
    }
  }
  function dropAll() {
    CACHE.forEach(function (e) { free(e.cv); });
    CACHE.clear(); QUEUE.length = 0; JOB = null;
  }

  /* Hazırsa gece sürümünü döndürür; değilse üretimi kuyruğa alır ve null döner
     (o kare orijinal görselle çizilir — hiçbir zaman boş sayfa görünmez). */
  /* hazırsa gece sürümünü verir. build=false ise (ekranda olmayan sayfa) yeni
     üretim BAŞLATILMAZ — bellek ve çöp toplayıcı baskısı görünen sayfalarla
     sınırlı kalır, arka planda boşuna iş yapılmaz. */
  function nightFor(img, build) {
    if (!img) return null;
    var k = keyOf(), e = CACHE.get(img);
    if (e && e.key === k) { if (e.done) { touch(img, e); return e.cv; } return null; }
    if (!build) return null;
    if (e) { CACHE.delete(img); free(e.cv); }
    for (var i = 0; i < QUEUE.length; i++) if (QUEUE[i].img === img) { QUEUE[i].key = k; return null; }
    if (JOB && JOB.img === img && JOB.key === k) return null;
    QUEUE.push({ img: img, key: k });
    pump();
    return null;
  }

  /* TEK paylaşılan çalışma tuvali: sayfa başına yeni tuval açılmaz. Bir sayfa
     bittiğinde sonucu ImageBitmap'e alınır (derleyiciye/GPU'ya dost, kapatarak
     kesin serbest bırakılır) ve tuval bir sonraki sayfa için yeniden kullanılır.
     Böylece bellek ayırma/çöp toplama kaynaklı duraklamalar oluşmaz. */
  var SCRATCH = null, SCTX = null;
  function scratch2(w, h) {
    if (!SCRATCH) { SCRATCH = document.createElement("canvas"); }
    if (SCRATCH.width < w || SCRATCH.height < h || !SCTX) {
      SCRATCH.width = Math.max(SCRATCH.width, w);
      SCRATCH.height = Math.max(SCRATCH.height, h);
      SCTX = SCRATCH.getContext("2d", { willReadFrequently: true });
    }
    return SCTX;
  }

  function startJob(req) {
    var img = req.img;
    var sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
    if (!sw || !sh) return null;
    /* Çözünürlük tavanı: ekranda görünenden fazlası bellekte tutulmaz. Sayfa
       zaten ölçeklenerek çizildiği için gözle görülür bir kayıp yoktur, buna
       karşılık çöp toplayıcı duraklamaları (kasma) tamamen ortadan kalkar. */
    var k = Math.min(1, MAXPX / Math.max(sw, sh));
    var w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    var g = scratch2(w, h);
    g.imageSmoothingQuality = "high";
    try { g.clearRect(0, 0, w, h); g.drawImage(img, 0, 0, sw, sh, 0, 0, w, h); } catch (_) { return null; }
    /* "Beklemede" işareti: sonuç asenkron geldiği için aynı sayfa ikinci kez
       kuyruğa alınmaz — çift üretim ve gereksiz bellek yükü oluşmaz. */
    CACHE.set(img, { cv: null, key: req.key, done: false });
    /* Bant yüksekliği: her dilim ~300k piksel → tek dilim birkaç ms sürer */
    var bh = Math.max(1, Math.min(h, Math.round(300000 / w) || 64));
    return { img: img, key: req.key, g: g, w: w, h: h, y: 0, bh: bh, T: lut(), tn: tone(), keep: !!P.color };
  }

  /* Tek bant dönüşümü — gri bölgeler eğriyle yer değiştirir, renkli bölgelerin
     tonu ve doygunluğu korunur (negatife dönmez, hiçbir görsel kaybolmaz). */
  function stepJob(j) {
    var bh = Math.min(j.bh, j.h - j.y);
    if (bh <= 0) return true;
    var im, d;
    try { im = j.g.getImageData(0, j.y, j.w, bh); d = im.data; } catch (_) { return true; }
    var T = j.T, t0 = j.tn[0], t1 = j.tn[1], t2 = j.tn[2], keep = j.keep;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], gg = d[i + 1], b = d[i + 2];
      var mx = r > gg ? (r > b ? r : b) : (gg > b ? gg : b);
      var mn = r < gg ? (r < b ? r : b) : (gg < b ? gg : b);
      if (mx - mn < 26) {                       /* GRİ: kâğıt · metin · çizgi */
        var v = T[(r * 299 + gg * 587 + b * 114) / 1000 | 0];
        var a0 = v * t0, a1 = v * t1, a2 = v * t2;
        d[i] = a0 > 255 ? 255 : a0; d[i + 1] = a1 > 255 ? 255 : a1; d[i + 2] = a2 > 255 ? 255 : a2;
      } else if (keep) {                        /* RENKLİ: ton/doygunluk korunur */
        var Y = (r * 299 + gg * 587 + b * 114) / 1000;
        var tg = Y > 170 ? Y * 0.62 : (Y < 70 ? Y * 1.28 + 26 : Y * 0.9 + 8);
        var sc = tg / (Y < 1 ? 1 : Y);
        var nr = r * sc, ng = gg * sc, nb = b * sc;
        d[i] = nr > 255 ? 255 : nr; d[i + 1] = ng > 255 ? 255 : ng; d[i + 2] = nb > 255 ? 255 : nb;
      } else {                                  /* tek tip gri-ters (opsiyon kapalı) */
        var v2 = T[(r * 299 + gg * 587 + b * 114) / 1000 | 0], s2 = v2 / (mx < 1 ? 1 : mx);
        var xr = r * s2, xg = gg * s2, xb = b * s2;
        d[i] = xr > 255 ? 255 : xr; d[i + 1] = xg > 255 ? 255 : xg; d[i + 2] = xb > 255 ? 255 : xb;
      }
    }
    j.g.putImageData(im, 0, j.y);
    j.y += bh;
    return j.y >= j.h;
  }

  /* Biten sayfayı çalışma tuvalinden alıp önbelleğe koyar. ImageBitmap varsa
     onu kullanır (asenkron, ana iş parçacığını bloklamaz); yoksa tuval kopyası. */
  function finishJob(j) {
    var w = j.w, h = j.h, img = j.img, key = j.key;
    var place = function (obj) {
      /* Sonuç gecikmiş ve bu arada mod/profil değişmişse çöpe atılır */
      if (!ACTIVE || key !== keyOf()) { free(obj); CACHE.delete(img); return; }
      obj.complete = true; obj.naturalWidth = w; obj.naturalHeight = h;
      var old = CACHE.get(img);
      if (old && old.cv && old.cv !== obj) free(old.cv);
      CACHE.set(img, { cv: obj, key: key, done: true });
      trim();
      try { if (typeof requestRedraw === "function") requestRedraw(); else redraw(); } catch (_) {}
    };
    if (typeof createImageBitmap === "function") {
      try {
        createImageBitmap(SCRATCH, 0, 0, w, h).then(place).catch(function () { place(copyOut(j)); });
        return;
      } catch (_) {}
    }
    place(copyOut(j));
  }
  function copyOut(j) {
    var c = document.createElement("canvas"); c.width = j.w; c.height = j.h;
    try { c.getContext("2d").drawImage(SCRATCH, 0, 0, j.w, j.h, 0, 0, j.w, j.h); } catch (_) {}
    return c;
  }
  function free(o) {
    try { if (o && typeof o.close === "function") o.close(); else if (o) { o.width = 0; o.height = 0; } } catch (_) {}
  }

  /* Kalem kâğıttayken / nesne sürüklenirken üretim kendiliğinden geri çekilir:
     çizim akışı hiçbir koşulda bölünmez. */
  function penBusy() {
    try {
      return !!((typeof live !== "undefined" && live) || (typeof drag !== "undefined" && drag) ||
                (typeof pinch !== "undefined" && pinch) || (typeof panning !== "undefined" && panning));
    } catch (_) { return false; }
  }
  function pump() { if (PUMPED) return; PUMPED = true; setTimeout(tick, 0); }
  function tick() {
    PUMPED = false;
    if (!ACTIVE) { QUEUE.length = 0; JOB = null; return; }
    var busy = penBusy();
    var budget = busy ? 1.5 : 5;
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
    var finished = false;
    while (now() - t0 < budget) {
      if (!JOB) {
        var req = QUEUE.shift();
        if (!req) break;
        if (CACHE.has(req.img) && CACHE.get(req.img).key === req.key) continue;
        JOB = startJob(req);
        if (!JOB) continue;
      }
      var done = false;
      try { done = stepJob(JOB); } catch (_) { done = true; }
      if (done) { finishJob(JOB); JOB = null; finished = true; }
      if (busy) break;                       // kalem kâğıttayken tek dilim yeter
    }
    var el = now() - t0; if (el > STAT.max) STAT.max = +el.toFixed(1); STAT.n++;
    if (JOB || QUEUE.length) { PUMPED = true; setTimeout(tick, busy ? 90 : 6); }
  }

  /* Boş (görselsiz) sayfalar için gece kâğıdı: tek renk küçük tuval, sayfaya
     esnetilerek çizilir — beyaz kâğıt koyu kâğıda döner. */
  var PAPER = null, PAPERK = "";
  function paperTile() {
    var k = keyOf();
    if (PAPER && PAPERK === k) return PAPER;
    var c = document.createElement("canvas"); c.width = c.height = 8;
    var g = c.getContext("2d");
    g.fillStyle = rgb(prof().lo + 9); g.fillRect(0, 0, 8, 8);
    c.complete = true; c.naturalWidth = 8; c.naturalHeight = 8;
    PAPER = c; PAPERK = k; return c;
  }

  /* ===========================================================================
   * ÇİZİM KANCASI — yalnız redraw() karesi boyunca takas, sonra birebir geri al
   * ========================================================================= */
  var INFRAME = false;          // şu an ana tuvale ait redraw() karesinin içinde miyiz
  function hookRedraw() {
    var orig = window.redraw;
    if (typeof orig !== "function" || orig.__dark) return;
    var wrap = function () {
      if (!ACTIVE) return orig.apply(this, arguments);
      var sw = [], i, pg, im, nb;
      INFRAME = true; readWeb();
      try {
        var c0 = (typeof cur === "number" ? cur : 0), lo = c0 - 1, hi = c0 + 1;
        for (i = 0; i < doc.pages.length; i++) {
          pg = doc.pages[i];
          im = pg.bgImg;
          if (im && im.complete && (im.naturalWidth || im.width)) {
            /* Keskin motorda takas YOK: dönüşüm drawPageBg'de süzgeçle yapılır. */
            if (P.engine === "photo") {
              nb = nightFor(im, i >= lo && i <= hi);
              if (nb) { sw.push([pg, im]); pg.bgImg = nb; }
            }
          } else if (!im && !pg.bg && !pg._bgLoad) {
            sw.push([pg, im === undefined ? undefined : null]);
            pg.bgImg = paperTile();            // boş sayfa → gece kâğıdı
          }
        }
        return orig.apply(this, arguments);
      } finally {
        INFRAME = false;
        for (i = 0; i < sw.length; i++) sw[i][0].bgImg = sw[i][1];
      }
    };
    wrap.__dark = true;
    window.redraw = wrap;
  }

  /* KESİNTİSİZ ZEMİN RENGİ (sayfanın dışındaki alan)
     Keskin motorda sayfa görseli takas edilmediği için kenar rengi orijinal
     (beyaz) görselden hesaplanıyordu: belge koyuyken etrafı bembeyaz
     kalıyordu. Artık renk aynı dönüşümden analitik olarak geçiriliyor —
     tonu korunur, açıklığı tersine çevrilip aralığa sıkıştırılır. */
  function hslInvert(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, sa = 0;
    if (mx !== mn) {
      var d2 = mx - mn;
      sa = l > 0.5 ? d2 / (2 - mx - mn) : d2 / (mx + mn);
      if (mx === r) h = (g - b) / d2 + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d2 + 2;
      else h = (r - g) / d2 + 4;
      h /= 6;
    }
    var c = FLV[P.level] || FLV.standard;
    var nl = c.lo + (c.hi - c.lo) * (1 - l);
    if (P.tone === "warm") { h = h * 0.88 + 0.09 * 0.12; sa = Math.min(1, sa + 0.05); }
    else if (P.tone === "cool") { sa = Math.min(1, sa + 0.04); }
    var q = nl < 0.5 ? nl * (1 + sa) : nl + sa - nl * sa, pq = 2 * nl - q;
    var hk = function (t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return pq + (q - pq) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return pq + (q - pq) * (2 / 3 - t) * 6;
      return pq;
    };
    return "rgb(" + Math.round(hk(h + 1 / 3) * 255) + "," + Math.round(hk(h) * 255) + "," +
           Math.round(hk(h - 1 / 3) * 255) + ")";
  }
  function darkenCss(col) {
    try {
      if (!col) return col;
      var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(col.trim());
      var r, g, b;
      if (m) {
        var x = m[1];
        if (x.length === 3) x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2];
        var n = parseInt(x, 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
      } else {
        var k = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(col);
        if (!k) return col;
        r = +k[1]; g = +k[2]; b = +k[3];
      }
      return hslInvert(r, g, b);
    } catch (_) { return col; }
  }
  var EDGEC = {}, EDGEK = "";
  function hookEdge() {
    var orig = window.pageEdgeColor;
    if (typeof orig !== "function" || orig.__dark) return;
    var wrap = function (pg) {
      if (!ACTIVE || !pg) return orig(pg);
      if (sharpOn()) {
        /* Keskin motor: orijinal kenar rengini al, analitik olarak çevir. */
        var v0 = orig(pg);
        if (EDGEK !== keyOf()) { EDGEC = {}; EDGEK = keyOf(); }
        if (EDGEC[v0] === undefined) EDGEC[v0] = darkenCss(v0);
        return EDGEC[v0];
      }
      var keep = pg._edge;
      pg._edge = (pg._edgeK === keyOf()) ? pg._edgeN : null;
      try {
        var v = orig(pg);
        pg._edgeN = pg._edge; pg._edgeK = keyOf();
        return v;
      } finally { pg._edge = keep; }
    };
    wrap.__dark = true;
    window.pageEdgeColor = wrap;
  }

  /* Tahta zemini — açık tahta stilleri gece tonuna iner, koyu stiller (kara
     tahta / matematik tahtası) zaten koyu olduğu için olduğu gibi bırakılır.
     Web katmanı açıkken zemin saydam kalır (site görünür). */
  function hookBoard() {
    var ob = window.boardBg;
    if (typeof ob === "function" && !ob.__dark) {
      var w1 = function () {
        var v = ob.apply(this, arguments);
        if (!INFRAME || !ACTIVE || !P.board || webOn() || !lightBoard()) return v;
        if (typeof v === "string" && v.indexOf("rgba(0") === 0) return v;   // web katmanı: saydam
        return rgb(prof().board);
      };
      w1.__dark = true; window.boardBg = w1;
    }
    /* Kâğıt deseni ve tahta ızgarası koyu zeminde görünsün: aynı çizim, ters
       renk kanalı. Alfa korunur — desen yumuşaklığı birebir aynı kalır. */
    var op = window.paperPattern;
    if (typeof op === "function" && !op.__dark) {
      var w2 = function (c, pp) {
        /* Süzgeç kurmak tuvalde pahalı bir yola geçer; desen zaten çizilmiyorsa
           (düz kâğıt) hiç dokunmayız — PDF/slayt karesi tam hızda kalır. */
        if (!INFRAME || !ACTIVE || webOn() || !c || !pp || pp === "plain") return op.apply(this, arguments);
        var f = c.filter;
        try { c.filter = "invert(1)"; return op.apply(this, arguments); }
        finally { try { c.filter = f || "none"; } catch (_) {} }
      };
      w2.__dark = true; window.paperPattern = w2;
    }
    var os = window.drawBoardStyle;
    if (typeof os === "function" && !os.__dark) {
      var w3 = function (c) {
        var st = "classic"; try { st = (typeof S !== "undefined" && S.board) || "classic"; } catch (_) {}
        if (!INFRAME || !ACTIVE || webOn() || !c || !lightBoard() || st === "classic") return os.apply(this, arguments);
        var f = c.filter;
        try { c.filter = "invert(1)"; return os.apply(this, arguments); }
        finally { try { c.filter = f || "none"; } catch (_) {} }
      };
      w3.__dark = true; window.drawBoardStyle = w3;
    }
  }

  /* ------------------------------------------------- MÜREKKEP UYUMU (EKRAN)
     Koyu zeminde siyah çizim görünmez. Nesnenin rengi EKRANA çizilirken aynı
     eğriyle dengelenir; kayıtlı veriye dokunulmaz, dışa aktarım orijinaldir.
     Kalem motorunun kendisi (drawStroke) hiç sarmalanmaz. */
  var INKC = {}, INKK = "";
  function inkColor(hex) {
    if (INKK !== keyOf()) { INKC = {}; INKK = keyOf(); }
    var m = INKC[hex]; if (m !== undefined) return m;
    return (INKC[hex] = inkColorCalc(hex));
  }
  function inkColorCalc(hex) {
    try {
      if (!hex || hex.charAt(0) !== "#" || (hex.length !== 7 && hex.length !== 4)) return hex;
      if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      var n = parseInt(hex.slice(1), 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 26) {
        var v = lut()[(r * 299 + g * 587 + b * 114) / 1000 | 0];
        return "rgb(" + (v | 0) + "," + (v | 0) + "," + (v | 0) + ")";
      }
      var Y = (r * 299 + g * 587 + b * 114) / 1000;
      var sc = Y < 150 ? (150 / (Y < 1 ? 1 : Y)) : 1;
      return "rgb(" + Math.min(255, r * sc | 0) + "," + Math.min(255, g * sc | 0) + "," +
             Math.min(255, b * sc | 0) + ")";
    } catch (_) { return hex; }
  }
  function inkOn() { return ACTIVE && P.ink && !webOn(); }
  /* Mürekkep uyumu YALNIZ ekrana çizerken geçerlidir. Dışa aktarma, küçük resim
     ve sayfa önizlemeleri kendi tuvallerine çizer; oraya orijinal renk gider —
     kaydedilen ve paylaşılan çıktı hiçbir koşulda değişmez. */
  function onScreen(c) {
    try { return c === ctx || c === octx; } catch (_) { return false; }
  }

  function hookInk() {
    var od = window.drawObj;
    if (typeof od === "function" && !od.__dark) {
      var w1 = function (c, o) {
        if (!inkOn() || !o || !onScreen(c)) return od(c, o);
        var oc = o.color, ofx = o.fx, ch = false;
        try {
          if (oc) { o.color = inkColor(oc); ch = true; }
          if (o.tool === "hl") { o.fx = Object.assign({}, ofx || {}, { b: "screen" }); ch = true; }
          return od(c, o);
        } finally { if (ch) { o.color = oc; o.fx = ofx; } }
      };
      w1.__dark = true; window.drawObj = w1;
    }
    /* Canlı çizgi de aynı renkte görünsün — kalem kalkınca renk ZIPLAMASIN.
       drawStroke'a dokunmadan, yalnız geçici 'live' nesnesinin rengi ödünç alınır. */
    var ol = window.drawLive;
    if (typeof ol === "function" && !ol.__dark) {
      var w2 = function () {
        if (!inkOn()) return ol.apply(this, arguments);
        var lv = null;
        try { lv = (typeof live !== "undefined") ? live : null; } catch (_) {}
        if (!lv || !lv.color) return ol.apply(this, arguments);
        var oc = lv.color;
        lv.color = inkColor(oc);
        try { return ol.apply(this, arguments); } finally { lv.color = oc; }
      };
      w2.__dark = true; window.drawLive = w2;
    }
  }

  /* ===================================================================== UI
   * ESKİ DAVRANIŞ: yalnız "light" ve "youtube" temaları "ink"e çevriliyordu.
   * Zaten koyu bir tema kullanıyorsan KARANLIK MOD ARAYÜZDE HİÇBİR ŞEY
   * YAPMIYORDU — "dark mod hiç iyi değildi" şikâyetinin büyük kısmı buydu.
   *
   * YENİ: tema DEĞİŞTİRİLMEZ. Bunun yerine body üzerinde gece paleti
   * tanımlanır; her tema kendi vurgu rengini korur, yüzeyler gerçekten
   * geceye iner ve kontrast uzun okuma için yumuşatılır. Kapatınca tek bir
   * sınıf kalkar, hiçbir durum geride kalmaz.
   * =========================================================================*/
  function applyUI() {
    var b = document.body, htm = document.documentElement;
    /* Geriye dönük: önceki sürüm temayı değiştirmişse geri koy */
    if (prevTheme !== null) { htm.dataset.theme = prevTheme; prevTheme = null;
      try { renderThemes(); } catch (_) {} }
    b.classList.toggle("pro-dark", ACTIVE);
    b.classList.toggle("pro-dark-ui", ACTIVE && !!P.ui);
    b.classList.remove("dk-soft", "dk-standard", "dk-deep");
    if (ACTIVE) b.classList.add("dk-" + (P.level || "standard"));
    htm.style.setProperty("--pro-dark-bg", rgb(prof().board));
    htm.style.setProperty("--pro-dark-paper", rgb(prof().lo + 9));
    amber();
  }

  /* SICAK GECE (mavi ışık azaltma) — tüm pencerenin üstünde çarpan modunda
     ince bir kehribar katman. Tuvali yeniden çizmez, kare süresine dokunmaz,
     hiçbir veriyi değiştirmez; yalnız ekranda görünür. */
  var AMB = null;
  function amber() {
    var v = ACTIVE ? Math.max(0, Math.min(100, +P.warm || 0)) : 0;
    if (!v) { if (AMB) { AMB.remove(); AMB = null; } return; }
    if (!AMB) {
      AMB = document.createElement("div");
      AMB.id = "proDarkAmber";
      AMB.setAttribute("aria-hidden", "true");
      document.body.appendChild(AMB);
    }
    AMB.style.opacity = (v / 100 * 0.46).toFixed(3);
  }

  /* Tek giriş noktası: durumu kur ve bir kare iste. Kilit/nabız/zamanlayıcı yok —
     bu yüzden "basıyorum çalışmıyor" durumu oluşamaz. */
  function set(on, opts) {
    P.on = !!on;
    ACTIVE = !!on;
    if (opts) for (var k in opts) P[k] = opts[k];
    if (!ACTIVE) dropAll(); else { LUT = null; LUTK = ""; }
    FCACHE = ""; FCACHEK = ""; EDGEC = {}; EDGEK = "";
    applyUI();
    try {
      for (var i = 0; i < doc.pages.length; i++) { doc.pages[i]._edge = null; doc.pages[i]._edgeN = null; }
    } catch (_) {}
    save();
    try { redraw(); } catch (_) {}
    try { drawOverlay(); } catch (_) {}
    if (window.proCursorSync) try { window.proCursorSync(); } catch (_) {}
  }
  /* Profil değişti (şiddet/ton/renk): önbelleği tazele, aynı kare içinde uygula */
  function refresh() {
    dropAll(); LUT = null; LUTK = ""; PAPER = null; FCACHE = ""; FCACHEK = "";
    applyUI();
    try { for (var i = 0; i < doc.pages.length; i++) { doc.pages[i]._edge = null; doc.pages[i]._edgeN = null; } } catch (_) {}
    save();
    try { redraw(); } catch (_) {}
  }

  /* ------------------------------------------------------------ OPSİYON UI */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function sec(t) { return el('<div class="set-sec-t" style="margin-top:18px">' + t + "</div>"); }
  function rowToggle(id, t, d, on, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><label class="sw-toggle"><input type="checkbox" id="' + id + '"><i></i></label></div>');
    var i = r.querySelector("input"); i.checked = !!on;
    i.addEventListener("change", function () { fn(i.checked); });
    return r;
  }
  function rowSeg(id, t, d, opts, cur2, fn) {
    var b = opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '"' + (o[0] === cur2 ? ' class="on"' : "") + ">" + o[1] + "</button>";
    }).join("");
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><div class="pk-seg" id="' + id + '" style="flex:0 0 auto">' + b + "</div></div>");
    r.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        r.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        btn.classList.add("on"); fn(btn.dataset.v);
      });
    });
    return r;
  }

  function rowRange(id, t, d, min, max, step, cur2, fmt, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d"><span class="rv" id="' +
      id + 'Out"></span> ' + d + '</div></div><input type="range" id="' + id + '" min="' + min +
      '" max="' + max + '" step="' + step + '"></div>');
    var i = r.querySelector("input"), o = r.querySelector(".rv");
    i.value = cur2; o.textContent = fmt(cur2);
    i.addEventListener("input", function () { o.textContent = fmt(+i.value); fn(+i.value); });
    return r;
  }

  function build() {
    var ui = $id("sp-ui");
    if (!ui) return false;
    if (ui.dataset.dark) return true;
    ui.dataset.dark = "1";

    ui.appendChild(sec("Karanlık Mod — tüm uygulama"));
    ui.appendChild(rowToggle("oDark", "🌑 Karanlık Mod",
      "Tek anahtar, kapsamı uygulamanın <b>tamamı</b>: arayüz, çalışma tahtası ve açtığın " +
      "PDF / slayt / belge sayfaları birlikte gece görünümüne geçer. Klasik ters çevirme değildir — " +
      "<b>fotoğraflar ve renkli grafikler negatife dönmez</b>, tonlarını korur. Kaydedilen veri ve dışa " +
      "aktarılan dosyalar <b>daima orijinaldir</b>; kapattığın anda her şey birebir eski hâline döner.",
      P.on, function (v) { set(v); }));

    ui.appendChild(rowSeg("oDarkEng", "⚡ Belge Motoru",
      "<b>Keskin</b> (önerilen): dönüşüm ekran kartında, çizim anında yapılır — sayfa <b>anında</b> doğru " +
      "renkte açılır, <b>tam çözünürlük</b> korunur (metin kılı kılına keskin kalır), bellek kullanmaz. " +
      "Metin ve şema ağırlıklı belgeler için en iyisi; fotoğraflar negatife döner. " +
      "<b>Fotoğraf dostu</b>: piksel analiziyle fotoğraf ve renkli grafiklerin tonu korunur — karşılığında " +
      "daha yavaştır ve bellek kullanır.",
      [["sharp", "Keskin"], ["photo", "Fotoğraf dostu"]], P.engine,
      function (v) { P.engine = v; if (P.on) refresh(); else save(); }));

    ui.appendChild(rowSeg("oDarkLv", "🎚️ Karanlık Şiddeti",
      "<b>Yumuşak</b>: gözü zorlamayan gri · <b>Standart</b>: dengeli (önerilen) · <b>Derin</b>: en koyu.",
      [["soft", "Yumuşak"], ["standard", "Standart"], ["deep", "Derin"]], P.level,
      function (v) { P.level = v; if (P.on) refresh(); else save(); }));

    ui.appendChild(rowSeg("oDarkTone", "🌡️ Kâğıt Tonu",
      "Gece kâğıdının rengi. <b>Sıcak</b> mavi ışığı azaltır (uzun okuma), <b>Serin</b> daha kontrastlı görünür.",
      [["neutral", "Nötr"], ["warm", "Sıcak"], ["cool", "Serin"]], P.tone,
      function (v) { P.tone = v; if (P.on) refresh(); else save(); }));

    ui.appendChild(rowToggle("oDarkColor", "🎨 Renkli Görselleri Koru",
      "Fotoğraf, grafik ve renkli tabloların <b>tonu ve doygunluğu korunur</b>; yalnız parlaklıkları dengelenir. " +
      "Kapatırsan her şey tek tip gri-ters çevrilir (bazı teknik çizimlerde tercih edilebilir).",
      P.color, function (v) { P.color = v; if (P.on) refresh(); else save(); }));

    ui.appendChild(rowToggle("oDarkInk", "✒️ Mürekkebi Uyarla",
      "Koyu zeminde <b>siyah çizimler kaybolmasın</b> diye çizimlerinin rengi ekranda dengelenir. " +
      "Kaydedilen veri ve dışa aktarım <b>orijinal renklerdedir</b>. Fosforlu kalem koyu zeminde parlar.",
      P.ink, function (v) { P.ink = v; save(); try { redraw(); drawOverlay(); } catch (_) {} }));

    ui.appendChild(rowToggle("oDarkBoard", "🟦 Boş Tahtayı da Koyult",
      "Boş çalışma tahtasının zemini ve ızgarası da gece tonuna iner. Kapatırsan karanlık mod yalnız " +
      "arayüz ve belgeler için çalışır. (Kara Tahta / Matematik Tahtası stilleri zaten koyudur, değişmez.)",
      P.board, function (v) { P.board = v; save(); try { redraw(); } catch (_) {} }));

    ui.appendChild(rowToggle("oDarkUI", "🖤 Arayüzü de Koyult",
      "Üst çubuk, araç rayı, paneller ve pencereler gece paletine iner. <b>Temanı değiştirmez</b> — " +
      "seçtiğin vurgu rengi aynı kalır, yalnız yüzeyler koyulaşır ve kontrast uzun okuma için yumuşar. " +
      "Zaten koyu bir tema kullanıyorsan bir tık daha derine iner.",
      P.ui, function (v) { P.ui = v; save(); applyUI(); }));

    ui.appendChild(rowRange("oDarkWarm", "🕯️ Sıcak Gece (mavi ışık azaltma)",
      "Gece çalışırken ekranın mavi ışığını kısar. Yalnız ekrandaki görüntüyü etkiler; " +
      "kaydedilen ve dışa aktarılan hiçbir şey değişmez.",
      0, 100, 5, P.warm || 0, function (v) { return v ? "%" + v : "Kapalı"; },
      function (v) { P.warm = v; save(); amber(); }));
    return true;
  }

  /* Ayarlar paneli geç kurulursa UI'yi kaçırmayalım — birkaç kez dene */
  function buildSoon(n) {
    if (build() || n <= 0) return;
    setTimeout(function () { buildSoon(n - 1); }, 400);
  }

  function boot() {
    hookRedraw(); hookPageBg(); hookEdge(); hookBoard(); hookInk();
    buildSoon(12);
    if (P.on) set(true);
    /* Belge/çalışma değişimlerinde kenar rengi önbelleği tazelensin */
    var ow = (window.LIB && LIB.openWork);
    if (typeof ow === "function" && !ow.__dark) {
      var w = function () {
        var r = ow.apply(this, arguments);
        Promise.resolve(r).then(function () { if (ACTIVE) { try { redraw(); } catch (_) {} } })
          .catch(function () {});
        return r;
      };
      w.__dark = true; LIB.openWork = w;
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 700); });
  } else setTimeout(boot, 700);

  window.proDark = {
    active: function () { return ACTIVE; },
    opts: function () { return P; },
    set: set, refresh: refresh,
    toggle: function () { set(!ACTIVE); },
    _cache: function () { return CACHE; },
    _stat: function () { return STAT; },
    _reset: function () { STAT.max = 0; STAT.n = 0; }
  };
  /* Eski (2.9.0) bozuk gece modu anahtarını sessizce temizle */
  try { localStorage.removeItem("notis_night_opts"); } catch (_) {}
})();
