/* =============================================================================
 * Notis PRO — GECE MODU (tüm uygulama: çalışma tahtası · PDF · belge · slayt)
 *
 * TASARIM İLKESİ — "her karede kendini onarır":
 * Gece modu bir zamanlayıcıya ya da olay dinleyicilerine güvenmez. Durum, her
 * çizim karesinin başında (redraw'ın önünde) yeniden hesaplanır ve uygulanır.
 * Bu yüzden hangi sırayla ne yaparsan yap — PDF aç, tahtaya geç, sayfa değiştir,
 * kalem/renk değiştir, kütüphaneden başka bir belge aç, içe aktar, geri al —
 * ekranda gördüğün şey daima doğru durumdur. "Basıyorum çalışmıyor" mümkün
 * değildir: düğme yalnızca bir bayrak çevirir, uygulamayı kare yapar.
 *
 * KAPSAM
 *   • Çalışma tahtası (boş tahta, kâğıt desenleri, tahta stilleri)
 *   • PDF / belge / slayt sayfaları (gerçek piksel dönüşümü)
 *   • Uygulama arayüzü (tema) ve sahne zemini
 *   • Mürekkep: koyu zeminde kaybolan çizimler ekranda AÇILIR — asla
 *     koyulaştırılmaz (tebeşir beyazı kalemler olduğu gibi kalır)
 *
 * DÖNÜŞÜM — basit "negatife çevirme" DEĞİLDİR:
 *   • Gri bölgeler (kâğıt, siyah metin, çizgiler) parlaklık eğrisiyle yer
 *     değiştirir; ince gri tonlar korunur, uçlar kırpılmaz.
 *   • Renkli bölgeler (fotoğraf, grafik, renkli tablo) TON ve DOYGUNLUĞUNU
 *     korur; yalnız parlaklığı dengelenir → hiçbir görsel negatife dönmez.
 *
 * PERFORMANS — donma yok:
 *   Sayfa dönüşümü ana iş parçacığını kilitlemez. Önce düşük çözünürlüklü bir
 *   önizleme (tek karede) basılır — sayfa ANINDA kararır — ardından tam
 *   çözünürlüklü sürüm kare kare, zaman dilimlenerek hesaplanıp yerine geçer.
 *   Bellek sınırlıdır: yalnız görünür sayfa ve komşuları saklanır.
 *
 * Dışa aktarma ve küçük resimler DAİMA orijinal (gündüz) görseli kullanır.
 * Kapatıldığında her şey birebir eski hâline döner.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_night_opts";
  var DEF = {
    on: false,          // ana anahtar
    level: "standard",  // karanlık şiddeti
    tone: "neutral",    // kâğıt tonu
    color: true,        // renkli görselleri koru
    ink: true,          // mürekkebi uyarla
    dimUI: true,        // arayüzü de koyulaştır
    board: true         // boş çalışma tahtasını da kapsa
  };
  var P = load();

  var ACTIVE = false;        // gece modu şu an ekrana uygulanıyor mu
  var prevTheme = null;      // dimUI öncesi tema (geri dönüş için)
  var IN_EXPORT = false;     // dışa aktarma/küçük resim sırasında dönüşüm kapalı

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {}; for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  function $id(x) { return document.getElementById(x); }
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* ------------------------------------------------------------- PROFİLLER */
  /* lo = kâğıdın yeni tonu, hi = metnin yeni tonu (0–255) */
  var LV = {
    soft:     { lo: 34, hi: 214, gamma: 1.00 },
    standard: { lo: 22, hi: 228, gamma: 1.06 },
    deep:     { lo: 12, hi: 240, gamma: 1.12 }
  };
  var TONE = {  // kâğıt tonu — R/G/B çarpanları
    neutral: [1.00, 1.00, 1.00],
    warm:    [1.06, 0.99, 0.90],
    cool:    [0.94, 0.98, 1.07]
  };
  function prof() { return LV[P.level] || LV.standard; }
  function tone() { return TONE[P.tone] || TONE.neutral; }
  function styleKey() { return P.level + "|" + P.tone + "|" + (P.color ? "c" : "-"); }

  /* Parlaklık eğrisi — stil başına bir kez kurulur */
  var LUT = null, LUTKEY = "";
  function lut() {
    var k = P.level + "|" + P.tone;
    if (LUT && LUTKEY === k) return LUT;
    var c = prof(), t = new Uint8Array(256);
    for (var i = 0; i < 256; i++) {
      var x = Math.pow(1 - i / 255, c.gamma);
      t[i] = Math.max(0, Math.min(255, Math.round(c.lo + (c.hi - c.lo) * x)));
    }
    LUT = t; LUTKEY = k; return t;
  }
  /* Gece kâğıdının düz rengi — sahne zemini ve kenar bandı bununla dolar */
  function paperRGB() {
    var c = prof(), t = tone();
    return [Math.round(c.lo * t[0]), Math.round(c.lo * t[1]), Math.round(c.lo * t[2])];
  }

  /* --------------------------------------------------------- BAĞLAM SORULARI
     Uygulamanın kendi global'leri (doc/cur/scratch) blok kapsamlı olduğundan
     her erişim try ile korunur; motor yeniden yüklenirken çağrılsak bile
     gece modu asla hata fırlatmaz. */
  function docRef() { try { return doc; } catch (_) { return null; } }
  function curIdx() { try { return cur | 0; } catch (_) { return 0; } }
  function isBoard() { try { return !!boardMode(); } catch (_) { return false; } }
  function pagesOf() { var d = docRef(); return (d && d.pages) ? d.pages : null; }
  /* Belge (PDF/slayt) görünümünde miyiz? */
  function onDoc() {
    if (isBoard()) return false;
    var pgs = pagesOf();
    if (!pgs || !pgs.length) return false;
    var p = pgs[Math.max(0, Math.min(pgs.length - 1, curIdx()))];
    return !!(p && p.bg);
  }
  /* Gece modu bu an ekranda geçerli mi? */
  function wanted() {
    if (!P.on || IN_EXPORT) return false;
    if (onDoc()) return true;      // belge her hâlükârda kapsanır
    return !!P.board;              // tahta ve zeminsiz sayfalar opsiyona bağlı
  }
  /* Ekrana çizim yaparken gece dönüşümü uygulanmalı mı?
     Dışa aktarma sırasında DAİMA hayır — kâğıda/PDF'e giden çıktı orijinaldir. */
  function fx() { return ACTIVE && !IN_EXPORT; }

  function lumaOf(css) {
    var r, g, b, m;
    if (typeof css !== "string") return 1;
    if (css.charAt(0) === "#") {
      var h = css.slice(1);
      if (h.length === 3) { r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16); }
      else if (h.length >= 6) { r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); }
      else return 1;
    } else if ((m = /^rgba?\(([^)]+)\)$/i.exec(css))) {
      var q = m[1].split(","); r = parseFloat(q[0]); g = parseFloat(q[1]); b = parseFloat(q[2]);
    } else return 1;
    if (!(r >= 0) || !(g >= 0) || !(b >= 0)) return 1;
    return (r * 299 + g * 587 + b * 114) / 255000;
  }
  /* Seçili tahta zaten koyu mu? (Kara Tahta / Matematik Tahtası) Koyu tahtalara
     gece dönüşümü UYGULANMAZ — yoksa açılıp aydınlanırlardı. */
  function boardIsLight() {
    try {
      var f = window.boardBg;
      var base = (f && f.__nightOrig) ? f.__nightOrig() : (f ? f() : "#FBF8F0");
      return lumaOf(base) > 0.5;
    } catch (_) { return true; }
  }

  /* ------------------------------------------------------- RENK DÖNÜŞTÜRÜCÜ */
  /* Tek pikselin gece karşılığı. Piksel döngüsü ve CSS renkleri aynı kuralı
     kullanır — kâğıt deseni ile kâğıdın kendisi asla birbirinden ayrışmaz. */
  function mapRGB(r, g, b, T, tn, keep, out) {
    var mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
    var mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
    if (mx - mn < 26) {                       // GRİ: kâğıt / metin / çizgi
      var v = T[(r * 299 + g * 587 + b * 114) / 1000 | 0];
      out[0] = v * tn[0]; out[1] = v * tn[1]; out[2] = v * tn[2];
    } else if (keep) {                        // RENKLİ: ton ve doygunluk korunur
      var Y = (r * 299 + g * 587 + b * 114) / 1000;
      var target = Y > 170 ? Y * 0.62 : (Y < 70 ? Y * 1.28 + 26 : Y * 0.9 + 8);
      var sc = target / (Y < 1 ? 1 : Y);
      out[0] = r * sc; out[1] = g * sc; out[2] = b * sc;
    } else {                                  // tek tip gri-ters
      var v2 = T[(r * 299 + g * 587 + b * 114) / 1000 | 0], s2 = v2 / (mx < 1 ? 1 : mx);
      out[0] = r * s2; out[1] = g * s2; out[2] = b * s2;
    }
    if (out[0] > 255) out[0] = 255; if (out[1] > 255) out[1] = 255; if (out[2] > 255) out[2] = 255;
    return out;
  }

  /* CSS rengini gece karşılığına çevirir (alfa korunur). Kâğıt desenleri,
     tahta ızgaraları ve kenar çizgileri bu yoldan geçer. */
  var _cssCache = Object.create(null), _cssCacheKey = "";
  var _tmp = [0, 0, 0];
  function nightCSS(css) {
    if (typeof css !== "string" || !css) return css;
    var k = styleKey();
    if (_cssCacheKey !== k) { _cssCache = Object.create(null); _cssCacheKey = k; }
    var hit = _cssCache[css];
    if (hit !== undefined) return hit;
    var r, g, b, a = 1, m;
    if (css.charAt(0) === "#") {
      var h = css.slice(1);
      if (h.length === 3) { r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16); }
      else if (h.length === 6 || h.length === 8) {
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
        if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
      } else { _cssCache[css] = css; return css; }
    } else if ((m = /^rgba?\(([^)]+)\)$/i.exec(css))) {
      var q = m[1].split(",");
      r = parseFloat(q[0]); g = parseFloat(q[1]); b = parseFloat(q[2]);
      if (q.length > 3) a = parseFloat(q[3]);
    } else { _cssCache[css] = css; return css; }
    if (!(r >= 0) || !(g >= 0) || !(b >= 0)) { _cssCache[css] = css; return css; }
    mapRGB(r, g, b, lut(), tone(), !!P.color, _tmp);
    var res = "rgba(" + (_tmp[0] | 0) + "," + (_tmp[1] | 0) + "," + (_tmp[2] | 0) + "," +
      (isFinite(a) ? a : 1) + ")";
    _cssCache[css] = res;
    return res;
  }

  /* MÜREKKEP — TEK YÖNLÜ: koyu mürekkep açılır, açık mürekkep ASLA
     koyulaştırılmaz. Böylece kara tahtadaki tebeşir beyazı kalem, fosforlu
     sarı ya da zaten açık renkli çizimler olduğu gibi kalır; yalnızca koyu
     zeminde kaybolacak olanlar okunur hâle gelir. İşlem idempotenttir:
     iki kez uygulansa da sonuç değişmez. */
  var _inkCacheCol = Object.create(null), _inkCacheKey = "";
  function inkColor(css) {
    if (typeof css !== "string" || !css) return css;
    var k = styleKey();
    if (_inkCacheKey !== k) { _inkCacheCol = Object.create(null); _inkCacheKey = k; }
    var hit = _inkCacheCol[css];
    if (hit !== undefined) return hit;
    var r, g, b, a = 1, m, out = css;
    if (css.charAt(0) === "#") {
      var h = css.slice(1);
      if (h.length === 3) { r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16); }
      else if (h.length >= 6) {
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
        if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
      } else { _inkCacheCol[css] = css; return css; }
    } else if ((m = /^rgba?\(([^)]+)\)$/i.exec(css))) {
      var q = m[1].split(",");
      r = parseFloat(q[0]); g = parseFloat(q[1]); b = parseFloat(q[2]);
      if (q.length > 3) a = parseFloat(q[3]);
    } else { _inkCacheCol[css] = css; return css; }
    if (!(r >= 0) || !(g >= 0) || !(b >= 0)) { _inkCacheCol[css] = css; return css; }

    var Y = (r * 299 + g * 587 + b * 114) / 1000;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 26) {
      /* Gri/siyah mürekkep — yalnız koyu olanı aç */
      if (Y >= 132) { _inkCacheCol[css] = css; return css; }
      var v = lut()[Y | 0];
      if (v <= Y) { _inkCacheCol[css] = css; return css; }
      out = "rgba(" + (v | 0) + "," + (v | 0) + "," + (v | 0) + "," + a + ")";
    } else {
      /* Renkli mürekkep — tonu koru, yalnız okunmayacak kadar koyuysa parlat */
      if (Y >= 150) { _inkCacheCol[css] = css; return css; }
      var sc = 150 / (Y < 1 ? 1 : Y);
      out = "rgba(" + Math.min(255, r * sc | 0) + "," + Math.min(255, g * sc | 0) + "," +
        Math.min(255, b * sc | 0) + "," + a + ")";
    }
    _inkCacheCol[css] = out;
    return out;
  }

  /* ================================================================= SAYFALAR
     Her sayfa için iki gece sürümü tutulur:
       _nightPrev — düşük çözünürlüklü önizleme (tek karede hazırlanır)
       _nightFull — tam çözünürlük (kare kare, zaman dilimlenerek)
     _lightImg  — orijinal (gündüz) görsel; dışa aktarma bunu kullanır.
     ============================================================== */
  var PREV_MAX = 720;              // önizleme uzun kenarı (px)
  var SLICE_MS = 5.5;              // kare başına ayrılan bütçe (ms)
  var KEEP_RADIUS = 2;             // cur ± bu kadar sayfanın gece sürümü saklanır
  var job = null;                  // {pg,key,w,h,cv,g,y,rows,bmp,light}
  var pumping = false;
  /* Teşhis sayaçları — proNight.stats() ile okunur. Kare bütçesini aşan bir
     aşama olursa hangisi olduğu ölçülerek görülür, tahmin edilmez. */
  var STATS = { prevN: 0, prevMs: 0, prevMax: 0, sliceN: 0, sliceMs: 0, sliceMax: 0, startN: 0, startMs: 0, startMax: 0 };
  function tick(k, t0) {
    var d = nowMs() - t0;
    STATS[k + "N"]++; STATS[k + "Ms"] += d;
    if (d > STATS[k + "Max"]) STATS[k + "Max"] = d;
  }

  /* Gece görselleri kalıcı bir etiketle işaretlenir. Referans karşılaştırması
     yetmez: tam çözünürlük hazır olup önizleme referansı bırakıldığı anda,
     tuvalde duran önizleme "yeni gündüz görseli" sanılır ve modül kendi
     ürettiğini geri dönüştürmeye çalışırdı (sonsuz yeniden üretim). */
  function isNight(pg, im) { return !!(im && im.__nightImg); }

  /* Sayfanın gündüz görselini güncel tut. Uygulamanın tembel yükleyicisi
     (pumpBG) yeni bir Image atadığında burada yakalanır. */
  function trackLight(pg) {
    var b = pg.bgImg;
    if (b && !isNight(pg, b)) {
      if (pg._lightImg !== b) {          // yeni/değişmiş gündüz görseli
        pg._lightImg = b;
        pg._nightFull = null; pg._nightPrev = null; pg._nightKey = "";
        dropBitmap(pg); pg._nbmpFail = 0;
      }
    }
    return pg._lightImg || null;
  }
  function usable(im) {
    return !!(im && (im.complete === undefined || im.complete) &&
      (im.naturalWidth || im.width));
  }

  /* Gece sürümlerini bırak, gündüz görselini geri koy */
  function releasePage(pg) {
    if (!pg) return;
    var had = !!(pg._nightFull || pg._nightPrev);
    if (pg._lightImg && isNight(pg, pg.bgImg)) pg.bgImg = pg._lightImg;
    pg._nightFull = null; pg._nightPrev = null; pg._nightKey = "";
    pg._lightImg = null;
    dropBitmap(pg);
    if (had) pg._edge = null;
    if (job && job.pg === pg) job = null;
  }

  /* KAYNAK ÇÖZÜMÜ — ana iş parçacığını bloklamadan.
     Sayfa görselleri JPEG/PNG'dir ve tarayıcı çözümü tembel yapar. İlk kez
     bir "willReadFrequently" (yazılım) tuvaline drawImage edildiğinde çözüm
     SENKRON tetiklenir: 8.7 megapiksellik bir A4 taramasında bu tek başına
     ~320 ms'lik bir kare donması demek — ölçtük. createImageBitmap çözümü
     ana iş parçacığının dışına taşır; hazır olunca bir kare istenir. */
  function bitmapFor(pg, src) {
    if (pg._nbmp && pg._nbmpFor === src) return pg._nbmp;
    if (pg._nbmpFail) return src;                      // desteklenmiyor → doğrudan
    if (pg._nbmpBusy) return null;                     // yolda
    if (interacting()) return null;                    // el kalemde: çözümü erteleme
    if (typeof createImageBitmap !== "function") { pg._nbmpFail = 1; return src; }
    pg._nbmpBusy = 1;
    try {
      createImageBitmap(src).then(function (bm) {
        pg._nbmpBusy = 0;
        if (pg._lightImg !== src) { try { bm.close(); } catch (_) {} return; }
        pg._nbmp = bm; pg._nbmpFor = src;
        try { requestRedraw(); } catch (_) {}
      }, function () {
        pg._nbmpBusy = 0; pg._nbmpFail = 1;
        try { requestRedraw(); } catch (_) {}
      });
    } catch (_) { pg._nbmpBusy = 0; pg._nbmpFail = 1; return src; }
    return null;
  }
  /* Önizleme için KÜÇÜLTÜLMÜŞ bitmap — ölçekleme de ana iş parçacığının
     dışında yapılır. 8.7 megapikseli tuval üzerinde 720 px'e indirmek yazılım
     yolunda tek başına ~240 ms sürüyordu; createImageBitmap'in resize
     seçenekleri bunu iş parçacığından çıkarır. */
  function smallBitmapFor(pg, src, w, h) {
    if (pg._nsbm && pg._nsbmFor === src) return pg._nsbm;
    if (pg._nsbmFail) return null;
    if (pg._nsbmBusy) return null;
    if (typeof createImageBitmap !== "function") { pg._nsbmFail = 1; return null; }
    var sc = Math.min(1, PREV_MAX / Math.max(w, h));
    var pw = Math.max(1, Math.round(w * sc)), ph = Math.max(1, Math.round(h * sc));
    pg._nsbmBusy = 1; pg._nsbmW = pw; pg._nsbmH = ph;
    try {
      createImageBitmap(src, { resizeWidth: pw, resizeHeight: ph, resizeQuality: "medium" })
        .then(function (bm) {
          pg._nsbmBusy = 0;
          if (pg._lightImg !== src) { try { bm.close(); } catch (_) {} return; }
          pg._nsbm = bm; pg._nsbmFor = src;
          try { requestRedraw(); } catch (_) {}
        }, function () {
          pg._nsbmBusy = 0; pg._nsbmFail = 1;
          try { requestRedraw(); } catch (_) {}
        });
    } catch (_) { pg._nsbmBusy = 0; pg._nsbmFail = 1; return null; }
    return null;
  }
  function dropBitmap(pg) {
    if (pg._nbmp) { try { pg._nbmp.close(); } catch (_) {} }
    if (pg._nsbm) { try { pg._nsbm.close(); } catch (_) {} }
    pg._nbmp = null; pg._nbmpFor = null;
    pg._nsbm = null; pg._nsbmFor = null;
  }

  /* Düşük çözünürlüklü önizleme — sayfa ANINDA kararsın diye tek karede.
     Yalnız GEÇERLİ sayfa için üretilir: komşular için de üretmek, her biri
     kendi çözüm maliyetini getirdiğinden arka arkaya donmalara yol açıyordu. */
  function makePreview(pg, small, w, h) {
    if (!w || !h || !small) return null;
    var pw = pg._nsbmW || small.width, ph = pg._nsbmH || small.height;
    var cv, g, im, d;
    try {
      cv = document.createElement("canvas"); cv.width = pw; cv.height = ph;
      g = cv.getContext("2d", { willReadFrequently: true });
      g.drawImage(small, 0, 0, pw, ph);
      im = g.getImageData(0, 0, pw, ph); d = im.data;
    } catch (_) { return null; }
    var T = lut(), tn = tone(), keep = !!P.color, o = [0, 0, 0];
    for (var i = 0; i < d.length; i += 4) {
      mapRGB(d[i], d[i + 1], d[i + 2], T, tn, keep, o);
      d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
    }
    g.putImageData(im, 0, 0);
    /* Uygulamanın çizim kodu Image arayüzü bekler */
    cv.complete = true; cv.naturalWidth = w; cv.naturalHeight = h; cv.__nightImg = 1;
    return cv;
  }

  /* Tam çözünürlük — zaman dilimlenmiş VE BANT BANT.
     Tek seferde getImageData/putImageData yapmak 8.7 megapikselde 35 MB'ı iki
     kez taşır. Artık her dilim yalnız kendi bandını kopyalar, işler ve geri
     yazar: hem kare bütçesi korunur hem de tepe bellek ~1 MB olur. */
  function startFull(pg, bmp, light, w, h) {
    if (!w || !h) return false;
    var cv, g;
    try {
      cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      g = cv.getContext("2d", { willReadFrequently: true });
      /* Kopya TEK seferde yapılır. Bant bant drawImage denendi ve ölçüldü:
         yazılım tuvali her çağrıda kaynağı yeniden rasterize ettiğinden bant
         başına ~20 ms'ye, tek bir bantta 300 ms'ye kadar çıkıyordu. Kaynak
         zaten çözülmüş bir ImageBitmap olduğu için tek blit ~20 ms sürer;
         asıl bölünmesi gereken piksel işidir. */
      g.drawImage(bmp, 0, 0, w, h);
    } catch (_) { return false; }
    var rows = Math.max(1, Math.min(h, Math.ceil(120000 / Math.max(1, w))));
    job = { pg: pg, key: styleKey(), w: w, h: h, cv: cv, g: g, y: 0, rows: rows, bmp: bmp, light: light };
    return true;
  }
  function stepFull() {
    if (!job) return false;
    var pg = job.pg;
    /* İş sırasında koşullar değiştiyse (stil, sayfa, kapanma) işi bırak */
    if (!P.on || job.key !== styleKey() || pg._lightImg !== job.light) { job = null; return false; }
    var T = lut(), tn = tone(), keep = !!P.color, o = [0, 0, 0];
    var t0 = nowMs();
    STATS.sliceN++;
    while (job.y < job.h) {
      var rows = Math.min(job.rows, job.h - job.y);
      var im, d, i, n;
      try { im = job.g.getImageData(0, job.y, job.w, rows); }
      catch (_) { job = null; return false; }
      d = im.data; n = d.length;
      for (i = 0; i < n; i += 4) {
        mapRGB(d[i], d[i + 1], d[i + 2], T, tn, keep, o);
        d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
      }
      try { job.g.putImageData(im, 0, job.y); } catch (_) { job = null; return false; }
      job.y += rows;
      if (nowMs() - t0 >= SLICE_MS) break;
    }
    var _sd = nowMs() - t0;
    STATS.sliceMs += _sd; if (_sd > STATS.sliceMax) STATS.sliceMax = _sd;
    if (job.y < job.h) return true;                 // devam edecek
    job.cv.complete = true; job.cv.naturalWidth = job.w; job.cv.naturalHeight = job.h;
    job.cv.__nightImg = 1;
    pg._nightFull = job.cv;
    pg._nightKey = job.key;
    /* NOT: bitmiş tuvali createImageBitmap ile "sürücü dostu" bir bitmap'e
       çevirmek denendi ve ÖLÇÜLDÜ: çizim maliyetini düşürmüyor (46.0 ms'e
       karşı 47.4 ms — özgün görselle aynı), buna karşılık 8.7 megapiksellik
       anlık görüntüyü kopyalarken kareleri bloke ediyordu. Tuval olduğu gibi
       bırakılır. */
    /* Önce tuvali yeni görsele geçir, SONRA önizlemeyi bırak */
    if (pg.bgImg === pg._nightPrev || isNight(pg, pg.bgImg)) pg.bgImg = job.cv;
    pg._nightPrev = null;
    pg._edge = null;
    dropBitmap(pg);                                 // 35 MB'lık ara kopya hemen bırakılır
    job = null;
    try { requestRedraw(); } catch (_) {}
    return false;
  }
  /* İşleyici — kare hattında çalışır ama ELE ASLA DEĞMEZ.
     Sayfa zaten önizleme sayesinde anında karanlık görünüyor; tam çözünürlük
     bir konfor iyileştirmesidir. Kullanıcı çizerken, kaydırırken, iki parmakla
     yakınlaştırırken veya nesne sürüklerken tek bir dilim bile çalışmaz —
     kalem ucunda hiçbir koşulda takılma hissedilmez. El kalkar kalkmaz iş
     kaldığı yerden sürer ve sayfa ~1 saniyede netleşir.
     (requestIdleCallback denendi ve ölçüldü: sürekli etkileşim altında tam
     çözünürlük hiç tamamlanmıyordu — 5 saniyede bile. Etkileşim kapısı hem
     akıcılığı hem de tamamlanmayı garanti eder.) */
  function interacting() {
    try { if (typeof live !== "undefined" && live) return true; } catch (_) {}
    try { if (typeof panning !== "undefined" && panning) return true; } catch (_) {}
    try { if (typeof pinch !== "undefined" && pinch) return true; } catch (_) {}
    try { if (typeof drag !== "undefined" && drag) return true; } catch (_) {}
    return false;
  }
  function pump() {
    if (pumping) return;
    pumping = true;
    var tick = function () {
      var more = false;
      if (interacting()) more = true;                 // el kalemde: dokunma
      else { try { more = stepFull(); } catch (_) { job = null; } }
      if (more || job) requestAnimationFrame(tick);
      else pumping = false;
    };
    requestAnimationFrame(tick);
  }

  /* Bir sayfayı gece durumuna getir.
       priority=true  → geçerli sayfa: önizleme + tam çözünürlük
       priority=false → komşu sayfa: yalnız hazır olanı bağla; ağır iş
                        geçerli sayfa bittikten sonra sıraya girer */
  function servePage(pg, priority) {
    var src = trackLight(pg);
    if (!usable(src)) return;
    var k = styleKey();
    if (pg._nightKey !== k) {                       // stil değişti → yeniden üret
      pg._nightFull = null; pg._nightPrev = null;
      if (job && job.pg === pg) job = null;
    }
    if (!pg._nightFull && priority) {
      var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
      var madePrev = false;
      if (!pg._nightPrev) {                           // ANINDA kararma: küçük sürüm
        var sm = smallBitmapFor(pg, src, w, h);
        if (sm) {
          var _t = nowMs();
          var pv = makePreview(pg, sm, w, h);
          tick("prev", _t);
          if (pv) { pg._nightPrev = pv; pg._nightKey = k; pg._edge = null; madePrev = true; }
        }
      }
      var bmp = bitmapFor(pg, src);                   // null → çözüm yolda, bekle
      if (bmp) {
        /* Önizlemenin üretildiği KAREDE tam çözünürlüğe başlama — ikisi aynı
           kareye yığılırsa tek seferlik bir takılma oluşur. */
        if (!madePrev && !job) { var _t2 = nowMs(); var okj = startFull(pg, bmp, src, w, h); tick("start", _t2); if (okj) pump(); }
        if (madePrev) { try { requestRedraw(); } catch (_) {} }
      }
    }
    var want = pg._nightFull || pg._nightPrev;
    if (want && pg.bgImg !== want) { pg.bgImg = want; pg._edge = null; }
  }

  /* Geçerli sayfa bittiğinde en yakın komşuyu arka planda hazırla — kullanıcı
     sayfa çevirdiğinde beklemesin. Aynı anda tek iş çalışır. */
  function serveNeighbor(pgs, c, lo, hi) {
    if (job) return;
    for (var d = 1; d <= KEEP_RADIUS; d++) {
      var cand = [c + d, c - d], j;
      for (j = 0; j < 2; j++) {
        var i = cand[j];
        if (i < lo || i > hi || !pgs[i]) continue;
        var pg = pgs[i];
        if (pg._nightFull && pg._nightKey === styleKey()) continue;
        var src = trackLight(pg);
        if (!usable(src)) continue;
        var bmp = bitmapFor(pg, src);
        if (!bmp) return;                            // çözüm yolda: bir sonraki kare
        var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
        if (startFull(pg, bmp, src, w, h)) pump();
        return;
      }
    }
  }

  /* ============================================== HER KAREDE DURUM ONARIMI */
  function preFrame() {
    var want = wanted();

    /* 1) Arayüz katmanı */
    if (want !== ACTIVE) {
      ACTIVE = want;
      document.body.classList.toggle("pro-night", want);
      applyThemeSide();
      applyStageVars();
    }

    /* 2) Sayfa görselleri — belge görünümündeyken */
    var pgs = pagesOf();
    if (!pgs || !pgs.length) return;
    var c = Math.max(0, Math.min(pgs.length - 1, curIdx()));
    var docNight = want && !isBoard() && onDoc();

    if (!docNight) {                                 // tahta/kapalı: her şeyi bırak
      for (var i = 0; i < pgs.length; i++) if (pgs[i]._lightImg || pgs[i]._nightFull || pgs[i]._nightPrev) releasePage(pgs[i]);
      return;
    }
    var lo = Math.max(0, c - KEEP_RADIUS), hi = Math.min(pgs.length - 1, c + KEEP_RADIUS);
    /* Geçerli sayfa: önizleme + tam çözünürlük. Komşular: hazır olanı bağla. */
    servePage(pgs[c], true);
    for (var j = lo; j <= hi; j++) if (j !== c) servePage(pgs[j], false);
    /* Geçerli sayfa tamamlandıysa komşuları arka planda hazırla */
    if (!job && pgs[c]._nightFull) serveNeighbor(pgs, c, lo, hi);
    /* Uzak sayfaları bırak — bellek sabit kalır (200 sayfalık PDF'te de) */
    for (var q = 0; q < pgs.length; q++) {
      if (q >= lo && q <= hi) continue;
      var pg = pgs[q];
      if (pg._lightImg || pg._nightFull || pg._nightPrev) releasePage(pg);
    }
  }

  function applyThemeSide() {
    var htm = document.documentElement;
    if (ACTIVE && P.dimUI) {
      if (prevTheme === null) prevTheme = htm.dataset.theme || "";
      if (htm.dataset.theme !== "ink") {
        htm.dataset.theme = "ink";
        try { if (typeof renderThemes === "function") renderThemes(); } catch (_) {}
      }
    } else if (prevTheme !== null) {
      htm.dataset.theme = prevTheme;
      prevTheme = null;
      try { if (typeof renderThemes === "function") renderThemes(); } catch (_) {}
    }
  }
  /* Sahne zemini ve kenar bandı kâğıtla aynı tonu paylaşsın */
  function applyStageVars() {
    var p = paperRGB();
    var css = "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
    document.documentElement.style.setProperty("--night-paper", css);
    document.documentElement.style.setProperty("--night-stage",
      "rgb(" + Math.max(0, p[0] - 8) + "," + Math.max(0, p[1] - 8) + "," + Math.max(0, p[2] - 6) + ")");
  }

  /* ==================================================================== HOOKS
     Hepsi tek seferlik ve geri dönüşü olan sarmalayıcılar. Sarmalanan işlev
     yoksa sessizce atlanır — modül hiçbir koşulda uygulamayı kırmaz. */
  function wrap(name, make) {
    var orig = window[name];
    if (typeof orig !== "function" || orig.__night) return false;
    var w = make(orig);
    w.__night = true; w.__nightOrig = orig;
    window[name] = w;
    return true;
  }

  /* redraw — durumun her karede onarıldığı yer */
  function hookRedraw() {
    wrap("redraw", function (orig) {
      return function () {
        try { preFrame(); } catch (_) {}
        return orig.apply(this, arguments);
      };
    });
  }

  /* Tahta zemini + kâğıt desenleri + tahta stilleri → gece paletine çevrilir.
     Desen işlevleri renkleri gövdelerinde sabit yazdığından, ctx'e yazılan her
     fillStyle/strokeStyle bir vekil (Proxy) üzerinden gece karşılığına çevrilir.
     Vekil yalnız gece modunda ve kare başına birkaç kez kurulur. */
  var _proxies = (typeof WeakMap === "function") ? new WeakMap() : null;
  function nightCtx(c) {
    if (!c || typeof Proxy !== "function") return c;
    if (_proxies) { var h = _proxies.get(c); if (h) return h; }
    var px = new Proxy(c, {
      get: function (t, k) {
        var v = t[k];
        return (typeof v === "function") ? v.bind(t) : v;
      },
      set: function (t, k, v) {
        if ((k === "fillStyle" || k === "strokeStyle" || k === "shadowColor") && typeof v === "string") v = nightCSS(v);
        t[k] = v; return true;
      }
    });
    if (_proxies) _proxies.set(c, px);
    return px;
  }
  /* Tahta katmanı gece dönüşümü alacak mı? Koyu tahtalar (Kara Tahta,
     Matematik Tahtası) zaten gece — onlara dokunulmaz. */
  function boardNight() { return fx() && P.board && boardIsLight(); }

  function hookBoard() {
    wrap("boardBg", function (orig) {
      return function () {
        var v = orig.apply(this, arguments);
        return (fx() && P.board && lumaOf(v) > 0.5) ? nightCSS(v) : v;
      };
    });
    /* Kâğıt desenleri: belge sayfasında daima (kâğıt karardı), tahtada yalnız
       tahta açık renkliyse. */
    wrap("paperPattern", function (orig) {
      return function (c) {
        var on = fx() && (isBoard() ? (P.board && boardIsLight()) : true);
        if (!on) return orig.apply(this, arguments);
        var a = Array.prototype.slice.call(arguments);
        a[0] = nightCtx(c);
        return orig.apply(this, a);
      };
    });
    wrap("drawBoardStyle", function (orig) {
      return function (c) {
        if (!boardNight()) return orig.apply(this, arguments);
        var a = Array.prototype.slice.call(arguments);
        a[0] = nightCtx(c);
        return orig.apply(this, a);
      };
    });
    /* Zeminsiz (düz beyaz) sayfaların kâğıdı — PDF olmayan çok sayfalı
       defterler de gece tonuna iner. */
    wrap("paperFill", function (orig) {
      return function () {
        var v = orig.apply(this, arguments);
        return fx() ? nightCSS(v) : v;
      };
    });
  }

  /* Kesintisiz zemin rengi — görsel henüz yüklenmemişken de gece tonu */
  function hookEdge() {
    wrap("pageEdgeColor", function (orig) {
      return function (pg) {
        var v = orig.apply(this, arguments);
        if (fx() && (!v || v === "#FBF8F0")) {
          var p = paperRGB();
          return "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
        }
        return v;
      };
    });
  }

  /* MÜREKKEP — hem kaydedilmiş nesneler hem de ÇİZİM ANINDAKİ canlı çizgi
     aynı yoldan geçer, böylece kalemi kaldırınca renk zıplaması olmaz. */
  function hookInk() {
    wrap("drawStroke", function (orig) {
      return function (c, o) {
        if (!fx() || !P.ink || !o) return orig.apply(this, arguments);
        var oc = o.color, ofx = o.fx;
        try {
          if (typeof oc === "string") o.color = inkColor(oc);
          /* Fosforlu 'multiply' koyu zeminde kaybolur → ekranda 'screen' ile parlar */
          if (o.tool === "hl") {
            var nf = {}; for (var k in (ofx || {})) nf[k] = ofx[k];
            nf.b = "screen"; o.fx = nf;
          }
          return orig.call(this, c, o);
        } finally { o.color = oc; o.fx = ofx; }
      };
    });
    wrap("drawText", function (orig) {
      return function (c, o) {
        if (!fx() || !P.ink || !o) return orig.apply(this, arguments);
        var oc = o.color;
        try {
          if (typeof oc === "string") o.color = inkColor(oc);
          return orig.call(this, c, o);
        } finally { o.color = oc; }
      };
    });
  }

  /* DIŞA AKTARMA / KÜÇÜK RESİM — daima orijinal (gündüz) görsel ve renkler */
  function hookExport() {
    wrap("renderPageTo", function (orig) {
      return function () {
        if (!ACTIVE) return orig.apply(this, arguments);
        var swapped = [], pgs = pagesOf(), i, pg;
        var wasExport = IN_EXPORT;
        IN_EXPORT = true;
        try {
          if (pgs) for (i = 0; i < pgs.length; i++) {
            pg = pgs[i];
            if (pg._lightImg && isNight(pg, pg.bgImg)) { swapped.push([pg, pg.bgImg]); pg.bgImg = pg._lightImg; }
          }
          return orig.apply(this, arguments);
        } finally {
          for (i = 0; i < swapped.length; i++) swapped[i][0].bgImg = swapped[i][1];
          IN_EXPORT = wasExport;
        }
      };
    });
  }

  /* Belge/sayfa değişimlerinde bir kare içinde toparlan (redraw zaten onarır;
     bunlar yalnızca ilk kareyi hızlandırır) */
  function hookNav() {
    ["gotoPage", "switchPage", "applyBoard", "exitScratch"].forEach(function (n) {
      wrap(n, function (orig) {
        return function () {
          var r = orig.apply(this, arguments);
          try { requestRedraw(); } catch (_) {}
          return r;
        };
      });
    });
    try {
      if (window.LIB && typeof LIB.openWork === "function" && !LIB.openWork.__night) {
        var ow = LIB.openWork;
        var w = function () {
          var r = ow.apply(this, arguments);
          try {
            Promise.resolve(r).then(function () {
              try { requestRedraw(); } catch (_) {}
            }, function () {});
          } catch (_) {}
          return r;
        };
        w.__night = true; LIB.openWork = w;
      }
    } catch (_) {}
  }

  /* Kullanıcı temayı elle değiştirirse ona karışma: dimUI geri dönüşü iptal */
  function watchTheme() {
    try {
      var grid = $id("themeGrid");
      if (!grid || grid.dataset.night) return;
      grid.dataset.night = "1";
      grid.addEventListener("click", function () { prevTheme = null; }, true);
    } catch (_) {}
  }

  /* --------------------------------------------------------------- ANAHTAR */
  function setOn(v) {
    P.on = !!v; save();
    /* Kapanışta gece sürümlerini derhal bırak — bellek hemen boşalır */
    if (!P.on) {
      var pgs = pagesOf();
      if (pgs) for (var i = 0; i < pgs.length; i++) releasePage(pgs[i]);
      job = null;
    }
    try { requestRedraw(); } catch (_) {}
    try { if (typeof toast === "function") toast(P.on ? "Gece modu açık 🌙" : "Gece modu kapalı ☀️"); } catch (_) {}
  }
  /* Stil değişti: üretilmiş gece sürümleri geçersiz — anahtar değiştiği için
     servePage bunları kendiliğinden yeniler; yalnız bir kare tetiklemek yeter */
  function restyle() {
    save(); job = null;
    _cssCache = Object.create(null); _cssCacheKey = "";
    _inkCacheCol = Object.create(null); _inkCacheKey = "";
    applyStageVars();
    try { requestRedraw(); } catch (_) {}
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

  function build() {
    var ui = $id("sp-ui");
    if (!ui || ui.dataset.night) return;
    ui.dataset.night = "1";

    ui.appendChild(sec("Gece Modu — Tüm Uygulama"));
    ui.appendChild(rowToggle("oNight", "🌙 Gece Modu",
      "Tek anahtar, <b>her yer</b>: çalışma tahtası, PDF/belge/slayt sayfaları, kâğıt desenleri, sahne zemini ve arayüz " +
      "birlikte gece görünümüne geçer. Kâğıt derin gece tonuna iner, metin okunur açık tona çıkar. " +
      "Klasik ters çevirme değildir — <b>fotoğraflar ve renkli grafikler negatife dönmez</b>, tonlarını korur. " +
      "PDF ile tahta arasında gidip gelirken durum kendiliğinden korunur; kapatınca her şey birebir eski hâline döner.",
      P.on, function (v) { setOn(v); }));

    ui.appendChild(rowSeg("oNightLv", "🎚️ Karanlık Şiddeti",
      "<b>Yumuşak</b>: gözü zorlamayan gri · <b>Standart</b>: dengeli (önerilen) · <b>Derin</b>: gece okuması için en koyu.",
      [["soft", "Yumuşak"], ["standard", "Standart"], ["deep", "Derin"]], P.level,
      function (v) { P.level = v; restyle(); }));

    ui.appendChild(rowSeg("oNightTone", "🌡️ Kâğıt Tonu",
      "Gece kâğıdının rengi. <b>Sıcak</b> mavi ışığı azaltır (uzun okuma), <b>Serin</b> daha kontrastlı görünür.",
      [["neutral", "Nötr"], ["warm", "Sıcak"], ["cool", "Serin"]], P.tone,
      function (v) { P.tone = v; restyle(); }));

    ui.appendChild(rowToggle("oNightBoard", "🖼️ Çalışma Tahtasını da Kapsa",
      "Boş tahta, kâğıt desenleri (çizgili/kareli/noktalı/izometrik) ve tahta stilleri de gece paletine geçer. " +
      "Kapatırsan gece modu yalnız açık belgelerde çalışır.",
      P.board, function (v) { P.board = v; restyle(); }));

    ui.appendChild(rowToggle("oNightColor", "🎨 Renkli Görselleri Koru",
      "Fotoğraf, grafik ve renkli tabloların <b>tonu ve doygunluğu korunur</b>; yalnız parlaklıkları dengelenir. " +
      "Kapatırsan her şey tek tip gri-ters çevrilir (bazı teknik çizimlerde tercih edilebilir).",
      P.color, function (v) { P.color = v; restyle(); }));

    ui.appendChild(rowToggle("oNightInk", "✒️ Mürekkebi Uyarla",
      "Koyu zeminde <b>kaybolacak koyu çizimler ekranda açılır</b>; zaten açık renkli kalemler (tebeşir beyazı, fosforlu) " +
      "olduğu gibi kalır. Kaydedilen veri değişmez, dışa aktarımda renkler orijinaldir.",
      P.ink, function (v) { P.ink = v; restyle(); }));

    ui.appendChild(rowToggle("oNightUI", "🖤 Arayüzü de Koyulaştır",
      "Gece modundayken uygulama teması da koyuya (Notis) geçer, kapatınca eski temana döner. " +
      "Temayı elle değiştirirsen tercihine karışılmaz.",
      P.dimUI, function (v) { P.dimUI = v; applyThemeSide(); restyle(); }));
  }

  function boot() {
    build();
    hookRedraw(); hookBoard(); hookEdge(); hookInk(); hookExport(); hookNav();
    watchTheme();
    applyStageVars();
    try { requestRedraw(); } catch (_) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 700); });
  } else setTimeout(boot, 700);

  window.proNight = {
    on: function (v) { setOn(v === undefined ? !P.on : v); },
    active: function () { return ACTIVE; },
    opts: function () { return P; },
    ink: inkColor,
    css: nightCSS,
    stats: function () { var o = {}; for (var k in STATS) o[k] = Math.round(STATS[k] * 10) / 10; return o; },
    resetStats: function () { for (var k in STATS) STATS[k] = 0; },
    sync: function () { try { preFrame(); } catch (_) {} }
  };
})();
