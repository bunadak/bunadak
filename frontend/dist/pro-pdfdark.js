/* =============================================================================
 * Notis PRO — GECE OKUMA MODU (PDF · Belge · Slayt)  · opsiyon, varsayılan KAPALI
 *
 * Basit bir "negatife çevirme" DEĞİLDİR. Klasik ters çevirme fotoğrafları ve
 * renkli şemaları tanınmaz hâle getirir; burada her piksel içeriğine göre
 * ayrı işlenir:
 *
 *   • Gri bölgeler (kâğıt zemini, siyah metin, çizgiler) → parlaklık eğrisiyle
 *     yer değiştirir: beyaz kâğıt derin gece tonuna, siyah metin okunur açık
 *     tona iner. Eğri uçları kırpmaz; ince gri tonlar korunur.
 *   • Renkli bölgeler (fotoğraf, grafik, vurgulu tablo) → TON ve DOYGUNLUK
 *     korunur, yalnız parlaklık dengelenir. Böylece hiçbir görsel kaybolmaz,
 *     negatif görünmez.
 *   • Mürekkep uyumu: koyu zeminde görünmez kalmasın diye ÇİZİMLERİN rengi de
 *     ekranda aynı eğriyle dengelenir (kayıtlı veri değişmez), fosforlu kalem
 *     koyu zeminde 'screen' karışımıyla parlar.
 *   • Dışa aktarma ve küçük resimler ORİJİNAL sayfa görselini kullanır.
 *
 * Yalnız belge (PDF/slayt) açıkken devreye girer; boş tahtada hiçbir etkisi
 * yoktur. Kapatıldığında her şey birebir eski hâline döner.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_night_opts";
  var DEF = { on: false, level: "standard", color: true, ink: true, dimUI: false, tone: "neutral" };
  var P = load();
  var ACTIVE = false;          // şu an gece modu uygulanıyor mu
  var prevTheme = null;
  var BUSY = false;

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {}; for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  function $id(x) { return document.getElementById(x); }

  /* Şiddet profilleri: lo = kâğıdın yeni tonu, hi = metnin yeni tonu (0–255) */
  var LV = {
    soft:     { lo: 34, hi: 214, gamma: 1.00 },
    standard: { lo: 22, hi: 228, gamma: 1.06 },
    deep:     { lo: 12, hi: 240, gamma: 1.12 }
  };
  var TONE = {  // kâğıt tonu — R/G/B çarpanları (göz yorgunluğu tercihine göre)
    neutral: [1.00, 1.00, 1.00],
    warm:    [1.06, 0.99, 0.90],
    cool:    [0.94, 0.98, 1.07]
  };
  function prof() { return LV[P.level] || LV.standard; }
  function tone() { return TONE[P.tone] || TONE.neutral; }

  /* Belge (PDF/slayt) görünümünde miyiz? Boş tahtada gece modu çalışmaz. */
  function onDoc() {
    try {
      return !boardMode() && doc.pages.length > 0 && !!(doc.pages[cur] && doc.pages[cur].bg);
    } catch (_) { return false; }
  }

  /* ----------------------------------------------------- PARLAKLIK EĞRİSİ */
  var LUT = null, LUTKEY = "";
  function lut() {
    var c = prof(), k = P.level + "|" + P.tone;
    if (LUT && LUTKEY === k) return LUT;
    var t = new Uint8Array(256);
    for (var i = 0; i < 256; i++) {
      var x = 1 - i / 255;                                  // ters çevir
      x = Math.pow(x, c.gamma);                             // yumuşak eğri
      t[i] = Math.max(0, Math.min(255, Math.round(c.lo + (c.hi - c.lo) * x)));
    }
    LUT = t; LUTKEY = k; return t;
  }

  /* Sayfa görselini gece sürümüne çevirir (canvas döner; drawImage kabul eder) */
  function darken(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    var im, d;
    try { im = g.getImageData(0, 0, w, h); d = im.data; } catch (_) { return null; }
    var T = lut(), tn = tone(), keep = !!P.color;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], gg = d[i + 1], b = d[i + 2];
      var mx = r > gg ? (r > b ? r : b) : (gg > b ? gg : b);
      var mn = r < gg ? (r < b ? r : b) : (gg < b ? gg : b);
      var chroma = mx - mn;
      if (chroma < 26) {
        /* GRİ: kâğıt / metin / çizgi → eğriyle yer değiştir (+ kâğıt tonu) */
        var v = T[(r * 299 + gg * 587 + b * 114) / 1000 | 0];
        d[i] = v * tn[0] > 255 ? 255 : v * tn[0];
        d[i + 1] = v * tn[1] > 255 ? 255 : v * tn[1];
        d[i + 2] = v * tn[2] > 255 ? 255 : v * tn[2];
      } else if (keep) {
        /* RENKLİ: ton ve doygunluk korunur; yalnız parlaklık dengelenir.
           Açık renkler koyulur, koyu renkler bir tık açılır → hiçbir görsel
           kaybolmaz, negatif etkisi oluşmaz. */
        var Y = (r * 299 + gg * 587 + b * 114) / 1000;
        var target = Y > 170 ? Y * 0.62 : (Y < 70 ? Y * 1.28 + 26 : Y * 0.9 + 8);
        var sc = target / (Y < 1 ? 1 : Y);
        var nr = r * sc, ng = gg * sc, nb = b * sc;
        d[i] = nr > 255 ? 255 : nr;
        d[i + 1] = ng > 255 ? 255 : ng;
        d[i + 2] = nb > 255 ? 255 : nb;
      } else {
        var v2 = T[(r * 299 + gg * 587 + b * 114) / 1000 | 0], s2 = v2 / (mx < 1 ? 1 : mx);
        var xr = r * s2, xg = gg * s2, xb = b * s2;
        d[i] = xr > 255 ? 255 : xr; d[i + 1] = xg > 255 ? 255 : xg; d[i + 2] = xb > 255 ? 255 : xb;
      }
    }
    g.putImageData(im, 0, 0);
    c.complete = true;              // uygulamanın çizim kodu bunu bekler
    c.naturalWidth = w; c.naturalHeight = h;
    return c;
  }

  /* Görünür sayfa ve komşuları gece sürümüne çevir; uzakları serbest bırak */
  function apply(force) {
    if (BUSY) return;
    var want = P.on && onDoc();
    if (!want) { revert(); return; }
    BUSY = true;
    try {
      ACTIVE = true;
      document.body.classList.add("pro-night");
      if (P.dimUI) {
        var htm = document.documentElement;
        if (prevTheme === null) prevTheme = htm.dataset.theme || "";
        if (htm.dataset.theme !== "ink") { htm.dataset.theme = "ink"; try { renderThemes(); } catch (_) {} }
      }
      var near = {}, i;
      for (i = Math.max(0, cur - 2); i <= Math.min(doc.pages.length - 1, cur + 2); i++) near[i] = 1;
      for (i = 0; i < doc.pages.length; i++) {
        var pg = doc.pages[i];
        if (!near[i]) {                                   // uzak sayfa: belleği boşalt
          if (pg._nightImg) { pg._nightImg = null; if (pg._lightImg) { pg.bgImg = pg._lightImg; } }
          continue;
        }
        try { if (typeof ensureBg === "function") ensureBg(pg); } catch (_) {}
        var src = pg._lightImg || pg.bgImg;
        if (!src || !src.complete) continue;
        if (force || !pg._nightImg || pg._nightKey !== LUTKEY + (P.color ? "c" : "-")) {
          var dk = darken(src);
          if (!dk) continue;
          pg._lightImg = src;
          pg._nightImg = dk;
          pg._nightKey = LUTKEY + (P.color ? "c" : "-");
          pg._edge = null;                                 // kesintisiz zemin rengi tazelensin
        }
        pg.bgImg = pg._nightImg;
      }
    } catch (_) {} finally { BUSY = false; }
    try { redraw(); } catch (_) {}
  }

  function revert() {
    if (!ACTIVE) return;
    ACTIVE = false;
    document.body.classList.remove("pro-night");
    try {
      for (var i = 0; i < doc.pages.length; i++) {
        var pg = doc.pages[i];
        if (pg._lightImg) { pg.bgImg = pg._lightImg; pg._edge = null; }
        pg._nightImg = null; pg._nightKey = "";
      }
    } catch (_) {}
    if (prevTheme !== null) {
      try { document.documentElement.dataset.theme = prevTheme; renderThemes(); } catch (_) {}
      prevTheme = null;
    }
    try { redraw(); } catch (_) {}
  }

  /* -------------------------------------------------- MÜREKKEP UYUMU (ekran)
     Koyu zeminde siyah çizim görünmez. Nesnenin rengi ekrana çizilirken aynı
     eğriyle dengelenir; kayıtlı veriye DOKUNULMAZ (çizim sonrası geri konur). */
  function inkColor(hex) {
    try {
      if (!hex || hex[0] !== "#") return hex;
      var n = parseInt(hex.slice(1), 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      var T = lut();
      if (mx - mn < 26) {                              // gri/siyah mürekkep → aç
        var v = T[(r * 299 + g * 587 + b * 114) / 1000 | 0];
        return "rgb(" + (v | 0) + "," + (v | 0) + "," + (v | 0) + ")";
      }
      /* Renkli mürekkep: tonu koru, koyu zeminde okunacak kadar parlat */
      var Y = (r * 299 + g * 587 + b * 114) / 1000;
      var sc = Y < 150 ? (150 / (Y < 1 ? 1 : Y)) : 1;
      return "rgb(" + Math.min(255, r * sc | 0) + "," + Math.min(255, g * sc | 0) + "," +
        Math.min(255, b * sc | 0) + ")";
    } catch (_) { return hex; }
  }
  function hookDraw() {
    if (typeof window.drawObj !== "function" || window.drawObj.__night) return;
    var orig = window.drawObj;
    var wrap = function (c, o) {
      if (!ACTIVE || !P.ink || !o) return orig(c, o);
      var oc = o.color, ofx = o.fx, changed = false;
      try {
        if (o.color) { o.color = inkColor(o.color); changed = true; }
        /* Fosforlu 'multiply' koyu zeminde kaybolur → ekranda 'screen' ile parlar */
        if (o.tool === "hl") { o.fx = Object.assign({}, ofx || {}, { b: "screen" }); changed = true; }
        return orig(c, o);
      } finally {
        if (changed) { o.color = oc; o.fx = ofx; }
      }
    };
    wrap.__night = true;
    window.drawObj = wrap;
  }
  /* Dışa aktarma / küçük resim: ORİJİNAL sayfa görselleriyle çalışsın */
  function hookExport() {
    if (typeof window.renderPageTo !== "function" || window.renderPageTo.__night) return;
    var orig = window.renderPageTo;
    var wrap = function () {
      if (!ACTIVE) return orig.apply(this, arguments);
      var swapped = [];
      try {
        for (var i = 0; i < doc.pages.length; i++) {
          var pg = doc.pages[i];
          if (pg._lightImg && pg.bgImg === pg._nightImg) { pg.bgImg = pg._lightImg; swapped.push(pg); }
        }
        return orig.apply(this, arguments);
      } finally {
        for (var k = 0; k < swapped.length; k++) swapped[k].bgImg = swapped[k]._nightImg;
      }
    };
    wrap.__night = true;
    window.renderPageTo = wrap;
  }
  /* Kesintisiz zemin rengi de gece tonundan örneklensin (koyu bant olmasın) */
  function hookEdge() {
    if (typeof window.pageEdgeColor !== "function" || window.pageEdgeColor.__night) return;
    var orig = window.pageEdgeColor;
    var wrap = function (pg) {
      var v = orig(pg);
      if (ACTIVE && (!v || v === "#FBF8F0")) {
        var c = prof(), t = tone();
        return "rgb(" + Math.round(c.lo * t[0]) + "," + Math.round(c.lo * t[1]) + "," +
          Math.round(c.lo * t[2]) + ")";
      }
      return v;
    };
    wrap.__night = true;
    window.pageEdgeColor = wrap;
  }

  /* Sayfa/belge değişimlerini izle: yeni sayfa görünür olunca gece sürümü hazırla */
  function watch() {
    var _gp = window.gotoPage;
    if (typeof _gp === "function" && !_gp.__night) {
      var w1 = function () { var r = _gp.apply(this, arguments); if (P.on) setTimeout(apply, 30); return r; };
      w1.__night = true; window.gotoPage = w1;
    }
    if (window.LIB && LIB.openWork && !LIB.openWork.__night) {
      var _ow = LIB.openWork;
      var w2 = function () {
        var r = _ow.apply(this, arguments);
        Promise.resolve(r).then(function () { if (P.on) setTimeout(function () { apply(true); }, 260); }).catch(function () {});
        return r;
      };
      w2.__night = true; LIB.openWork = w2;
    }
    /* Tembel yüklenen sayfa görselleri hazırlandıkça yakala (hafif nabız) */
    setInterval(function () { if (P.on && onDoc() && !BUSY) apply(false); }, 1400);
  }

  /* ------------------------------------------------------------ OPSİYON UI */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function sec(t) { return el('<div class="set-sec-t" style="margin-top:18px">' + t + "</div>"); }
  function rowToggle(id, t, d, on, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><label class="sw-toggle"><input type="checkbox" id="' + id + '"><i></i></label></div>');
    var i = r.querySelector("input"); i.checked = !!on;
    i.addEventListener("change", function () { fn(i.checked); save(); });
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
        btn.classList.add("on"); fn(btn.dataset.v); save();
      });
    });
    return r;
  }

  function build() {
    var ui = $id("sp-ui");
    if (!ui || ui.dataset.night) return;
    ui.dataset.night = "1";

    ui.appendChild(sec("Gece Okuma Modu — PDF & Belgeler"));
    ui.appendChild(rowToggle("oNight", "🌙 PDF Gece Modu",
      "Bir PDF/belge/slayt açtığında sayfa <b>kendiliğinden</b> gece görünümüne geçer: kâğıt derin gece tonuna iner, " +
      "metin okunur açık tona çıkar. Klasik ters çevirme değildir — <b>fotoğraflar ve renkli grafikler negatife dönmez</b>, " +
      "tonlarını korur, hiçbir görsel kaybolmaz. Boş tahtada etkisi yoktur; kapatınca her şey birebir eski hâline döner.",
      P.on, function (v) { P.on = v; if (v) apply(true); else revert(); }));

    ui.appendChild(rowSeg("oNightLv", "🎚️ Karanlık Şiddeti",
      "<b>Yumuşak</b>: gözü zorlamayan gri · <b>Standart</b>: dengeli (önerilen) · <b>Derin</b>: gece okuması için en koyu.",
      [["soft", "Yumuşak"], ["standard", "Standart"], ["deep", "Derin"]], P.level,
      function (v) { P.level = v; if (P.on) apply(true); }));

    ui.appendChild(rowSeg("oNightTone", "🌡️ Kâğıt Tonu",
      "Gece kâğıdının rengi. <b>Sıcak</b> mavi ışığı azaltır (uzun okuma), <b>Serin</b> daha kontrastlı görünür.",
      [["neutral", "Nötr"], ["warm", "Sıcak"], ["cool", "Serin"]], P.tone,
      function (v) { P.tone = v; if (P.on) apply(true); }));

    ui.appendChild(rowToggle("oNightColor", "🎨 Renkli Görselleri Koru",
      "Fotoğraf, grafik ve renkli tabloların <b>tonu ve doygunluğu korunur</b>; yalnız parlaklıkları dengelenir. " +
      "Kapatırsan her şey tek tip gri-ters çevrilir (bazı teknik çizimlerde tercih edilebilir).",
      P.color, function (v) { P.color = v; if (P.on) apply(true); }));

    ui.appendChild(rowToggle("oNightInk", "✒️ Mürekkebi Uyarla",
      "Koyu zeminde <b>siyah çizimler kaybolmasın</b> diye kendi çizimlerinin rengi ekranda dengelenir " +
      "(kaydedilen veri değişmez, dışa aktarımda renkler orijinaldir). Fosforlu kalem koyu zeminde parlar.",
      P.ink, function (v) { P.ink = v; try { redraw(); } catch (_) {} }));

    ui.appendChild(rowToggle("oNightUI", "🖤 Arayüzü de Koyulaştır",
      "Belge açıkken uygulama teması da koyuya (Notis) geçer, belgeyi kapatınca eski temana döner.",
      P.dimUI, function (v) { P.dimUI = v; if (P.on) apply(false); else revert(); }));
  }

  function boot() {
    build(); hookDraw(); hookExport(); hookEdge(); watch();
    if (P.on) setTimeout(function () { apply(true); }, 300);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 1000); });
  } else setTimeout(boot, 1000);

  window.proNight = { apply: apply, revert: revert, active: function () { return ACTIVE; },
                      opts: function () { return P; } };
})();
