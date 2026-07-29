/* =============================================================================
 * Notis PRO — İMLEÇ STÜDYOSU (opsiyon)
 *
 * Çizim yaparken fare okunun yerine gerçek bir KALEM FİGÜRÜ gösterir.
 * Tamamen opsiyoneldir: kapalıyken uygulama birebir eski davranışını sürdürür.
 *
 * Özellikler
 *   • 9 figür: Tükenmez · Dolma Kalem · Fırça · Kurşun Kalem · Marker ·
 *     İnce Uç · Tebeşir · Stylus · Nişangâh — her biri kart olarak önizlenir
 *   • Boyut kaydırıcısı (18–64 px)
 *   • Kalem rengini izleme: imlecin mürekkebi seçili renge boyanır
 *   • Koyu zemin kontürü: her arka planda net görünür
 *   • Uç halkası: kalemin gerçek kalınlığını ve tam temas noktasını gösterir
 *   • Araca duyarlı: silgi/metin/seçim/cetvel araçlarında kendi imleci
 *
 * Uygulamanın imleç yönetimine karışmaz: kaydırma (Space / El aracı) sırasında
 * kendini devre dışı bırakır, uygulama ne ayarladıysa o görünür.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_cursor_opts";
  var DEF = {
    fig: "off",        // off·pen·fountain·brush·pencil·marker·fine·chalk·stylus·cross
    size: 32,          // 18–64 px
    follow: true,      // kalem rengini izle
    outline: true,     // koyu zeminde görünürlük kontürü
    ring: true,        // uç halkası (gerçek kalınlık)
    smart: true        // araca duyarlı (silgi/metin/seçim kendi imleci)
  };
  var P = load();
  var lastKey = "";

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {};
    for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  function $id(x) { return document.getElementById(x); }

  /* ------------------------------------------------------------- FİGÜRLER
   * Her figür DİK çizilir (uç orijinde, gövde yukarı) ve tek bir döndürme ile
   * 45°'ye oturtulur. Böylece simetri matematiksel olarak garanti altındadır —
   * elle çizilmiş eğrilik/yamukluk olamaz. Uç, hotspot ile birebir çakışır.
   * ------------------------------------------------------------------------ */
  var TIP = { x: 3.5, y: 28.5 };
  function G(inner) { return '<g transform="translate(3.5 28.5) rotate(45)">' + inner + "</g>"; }

  /* premium yüzeyler: metal, ahşap ve gövde parlaması */
  function defs(ink) {
    return "<defs>" +
      '<linearGradient id="mt" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#7C8496"/><stop offset=".45" stop-color="#E8ECF5"/>' +
        '<stop offset="1" stop-color="#8B93A5"/></linearGradient>' +
      '<linearGradient id="gd" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#A97C1B"/><stop offset=".45" stop-color="#F7DC8A"/>' +
        '<stop offset="1" stop-color="#B8890F"/></linearGradient>' +
      '<linearGradient id="wd" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#8A5A32"/><stop offset=".45" stop-color="#C89060"/>' +
        '<stop offset="1" stop-color="#8A5A32"/></linearGradient>' +
      '<linearGradient id="bd" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="' + ink + '" stop-opacity=".72"/>' +
        '<stop offset=".42" stop-color="' + ink + '"/>' +
        '<stop offset="1" stop-color="' + ink + '" stop-opacity=".62"/></linearGradient>' +
      "</defs>";
  }

  function body(fig, ink, edge) {
    /* paint-order="stroke": kontur DOLGUNUN ALTINA çizilir — hale yalnız dışarıda
       kalır, iç sınırlara beyaz taşmaz. Figür temiz ve keskin görünür. */
    var O = 'stroke="' + edge + '" stroke-width="1.8" stroke-linejoin="round" ' +
      'stroke-linecap="round" paint-order="stroke"';
    var d = defs(ink), g;
    switch (fig) {
      case "pen":        // TÜKENMEZ — konik metal uç, kavrama bandı, ince gövde
        g = '<path d="M-2.6 -8 H2.6 V-27 a2.6 2.6 0 0 0 -5.2 0 Z" fill="url(#bd)" ' + O + '/>' +
            '<path d="M-2.6 -8 H2.6 V-11.5 H-2.6 Z" fill="#39415A" ' + O + '/>' +
            '<path d="M-2.2 -8 L2.2 -8 L0.9 -1.6 L-0.9 -1.6 Z" fill="url(#mt)" ' + O + '/>' +
            '<path d="M-0.9 -1.6 L0.9 -1.6 L0 0 Z" fill="' + ink + '" ' + O + '/>' +
            '<circle cx="0" cy="-0.5" r="0.85" fill="' + ink + '" stroke="' + edge + '" stroke-width=".8"/>';
        break;
      case "fountain":   // DOLMA — yarıklı altın uç, nefes deliği, bilezik
        g = '<path d="M-2.8 -10 H2.8 V-28 a2.8 2.8 0 0 0 -5.6 0 Z" fill="url(#bd)" ' + O + '/>' +
            '<path d="M-2.9 -10 H2.9 V-13 H-2.9 Z" fill="url(#gd)" ' + O + '/>' +
            '<path d="M-2.4 -10 Q-2.4 -4 0 0 Q2.4 -4 2.4 -10 Z" fill="url(#gd)" ' + O + '/>' +
            '<path d="M0 -8.6 V-1.4" stroke="' + edge + '" stroke-width="1"/>' +
            '<circle cx="0" cy="-8.4" r="1.05" fill="' + edge + '" opacity=".9"/>';
        break;
      case "brush":      // FIRÇA — ahşap sap, bilezikli halka, yumuşak kıl demeti
        g = '<path d="M-2.9 -13 H2.9 V-29 a2.9 2.9 0 0 0 -5.8 0 Z" fill="url(#wd)" ' + O + '/>' +
            '<path d="M-3.1 -13 H3.1 V-18 H-3.1 Z" fill="url(#mt)" ' + O + '/>' +
            '<path d="M-3.1 -15.6 H3.1" stroke="' + edge + '" stroke-width=".8" opacity=".85"/>' +
            '<path d="M-2.9 -13 Q-3.4 -6 0 0 Q3.4 -6 2.9 -13 Z" fill="url(#bd)" ' + O + '/>' +
            '<path d="M-1.3 -11.4 Q-1.6 -5 0 -1.2 M1.3 -11.4 Q1.6 -5 0 -1.2" stroke="' + edge +
            '" stroke-width=".7" fill="none" opacity=".55"/>';
        break;
      case "pencil":     // KURŞUN — altıgen gövde, ahşap koni, grafit uç, silgili başlık
        g = '<path d="M-3 -9 H3 V-25 H-3 Z" fill="#EFB33C" ' + O + '/>' +
            '<path d="M-1 -9 V-25 M1 -9 V-25" stroke="' + edge + '" stroke-width=".7" opacity=".5"/>' +
            '<path d="M-3 -25 H3 V-27.5 H-3 Z" fill="url(#mt)" ' + O + '/>' +
            '<path d="M-2.8 -27.5 H2.8 a2.8 2.8 0 0 0 -5.6 0 Z" fill="#F19AA0" ' + O + '/>' +
            '<path d="M-3 -9 L3 -9 L1.15 -2.6 L-1.15 -2.6 Z" fill="#F3E2C4" ' + O + '/>' +
            '<path d="M-1.15 -2.6 L1.15 -2.6 L0 0 Z" fill="' + ink + '" ' + O + '/>';
        break;
      case "marker":     // MARKER — dolgun gövde, kapak halkası, keski uç
        g = '<path d="M-4 -9 H4 V-27 a4 4 0 0 0 -8 0 Z" fill="url(#bd)" ' + O + '/>' +
            '<path d="M-4.2 -9 H4.2 V-12.5 H-4.2 Z" fill="#2E3549" ' + O + '/>' +
            '<path d="M-3.2 -9 H3.2 L2.2 -1.2 L-1.1 0 Z" fill="' + ink + '" ' + O + '/>' +
            '<path d="M-1.1 0 L2.2 -1.2" stroke="' + edge + '" stroke-width=".9"/>';
        break;
      case "fine":       // İNCE UÇ — teknik kalem, iğne uç, tırtıklı kavrama
        g = '<path d="M-2.2 -12 H2.2 V-28 a2.2 2.2 0 0 0 -4.4 0 Z" fill="url(#bd)" ' + O + '/>' +
            '<path d="M-2.4 -12 H2.4 V-17 H-2.4 Z" fill="#39415A" ' + O + '/>' +
            '<path d="M-2.4 -15.6 H2.4 M-2.4 -14 H2.4" stroke="' + edge + '" stroke-width=".6" opacity=".7"/>' +
            '<path d="M-2 -12 L2 -12 L0.55 -3.4 L-0.55 -3.4 Z" fill="url(#mt)" ' + O + '/>' +
            '<path d="M-0.55 -3.4 H0.55 V0 H-0.55 Z" fill="' + ink + '" ' + O + '/>';
        break;
      case "chalk":      // TEBEŞİR — kısa, mat, köşeleri aşınmış çubuk
        g = '<path d="M-3.4 -3 H3.4 V-19 a3.4 3.4 0 0 0 -6.8 0 Z" fill="#F6F3EC" ' + O + '/>' +
            '<path d="M-3.4 -3 Q0 -1.4 3.4 -3 Q3 0.4 0 0.4 Q-3 0.4 -3.4 -3 Z" fill="' + ink + '" ' + O + '/>' +
            '<path d="M-1.6 -17 V-6 M1.6 -16 V-7" stroke="' + edge + '" stroke-width=".8" opacity=".45"/>';
        break;
      case "stylus":     // STYLUS — dijital kalem: mat gövde, yumuşak uç
        g = '<path d="M-2.4 -7 H2.4 V-29 a2.4 2.4 0 0 0 -4.8 0 Z" fill="#F2F4FA" ' + O + '/>' +
            '<path d="M-2.4 -20 H2.4 V-22 H-2.4 Z" fill="#C6CCDA" ' + O + '/>' +
            '<path d="M-2.4 -7 L2.4 -7 L0.75 -1.4 L-0.75 -1.4 Z" fill="#5A6478" ' + O + '/>' +
            '<path d="M-0.75 -1.4 L0.75 -1.4 L0 0 Z" fill="' + ink + '" ' + O + '/>';
        break;
      case "eraser":     // SİLGİ — araca duyarlı modda otomatik
        g = '<path d="M-3.6 -8 H3.6 V-24 a3.6 3.6 0 0 0 -7.2 0 Z" fill="#DDE3F0" ' + O + '/>' +
            '<path d="M-3.6 -8 H3.6 V0 a1.6 1.6 0 0 1 -1.6 1.6 H-2 A1.6 1.6 0 0 1 -3.6 0 Z" fill="#F2A0A0" ' + O + '/>' +
            '<path d="M-3.6 -8 H3.6" stroke="' + edge + '" stroke-width=".9"/>';
        break;
      case "cross":      // NİŞANGÂH — hassas hizalama (dönmez, merkezde)
        return d +
          '<path d="M16 3.5 V12 M16 20 V28.5 M3.5 16 H12 M20 16 H28.5" stroke="' + edge +
          '" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M16 3.5 V12 M16 20 V28.5 M3.5 16 H12 M20 16 H28.5" stroke="' + ink +
          '" stroke-width="1.3" stroke-linecap="round"/>' +
          '<circle cx="16" cy="16" r="4.6" fill="none" stroke="' + edge + '" stroke-width="2.4" opacity=".75"/>' +
          '<circle cx="16" cy="16" r="4.6" fill="none" stroke="' + ink + '" stroke-width="1" opacity=".9"/>' +
          '<circle cx="16" cy="16" r="1.5" fill="' + ink + '" stroke="' + edge + '" stroke-width=".9"/>';
      default:
        return "";
    }
    return d + G(g);
  }

  /* Uç halkası: kalemin gerçek kalınlığı — temas noktası şüpheye yer bırakmaz */
  function ringSVG(fig, edge, ink) {
    if (!P.ring) return "";
    var t = (fig === "cross") ? { x: 16, y: 16 } : TIP;
    var r = 2.6;
    try {
      var px = (typeof penSize !== "undefined" ? penSize : 3) *
               (typeof view !== "undefined" && view ? view.s : 1);
      r = Math.max(2, Math.min(11, px / 2 + 1.6));      // 32'lik kutuda uç yarıçapı
    } catch (_) {}
    return '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + r.toFixed(1) + '" fill="none" stroke="' +
      edge + '" stroke-width="2.2" opacity=".9"/>' +
      '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + r.toFixed(1) + '" fill="none" stroke="' +
      ink + '" stroke-width="1.1" opacity=".95"/>';
  }

  function inkColor() {
    if (!P.follow) return "#111827";
    try {
      if (typeof tool !== "undefined" && tool === "hl") return "#FFE066";
      return (typeof penColor !== "undefined" && penColor) ? penColor : "#111827";
    } catch (_) { return "#111827"; }
  }

  function cursorCSS(fig) {
    var size = Math.max(18, Math.min(64, P.size | 0));
    var ink = inkColor();
    var edge = P.outline ? "#FFFFFF" : "rgba(0,0,0,.55)";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 32 32">' + body(fig, ink, edge) + ringSVG(fig, edge, ink) + "</svg>";
    var t = (fig === "cross") ? { x: 16, y: 16 } : TIP;
    var hx = Math.round(t.x / 32 * size), hy = Math.round(t.y / 32 * size);
    var url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    return 'url("' + url + '") ' + hx + " " + hy + ", crosshair";
  }

  /* --------------------------------------------------------------- UYGULA */
  var PENS = { smart: 1, ball: 1, fountain: 1, pencil: 1, hl: 1, sticker: 1 };
  var PRECISE = { line: 1, compass: 1, solve: 1, shapes: 1 };

  function figureForTool() {
    if (P.fig === "off") return null;
    var t = "";
    try { t = (typeof tool !== "undefined") ? tool : ""; } catch (_) {}
    if (!P.smart) return PENS[t] || PRECISE[t] || t === "eraser" ? P.fig : null;
    if (PENS[t]) return P.fig;
    if (t === "eraser") return "eraser";
    if (PRECISE[t]) return "cross";
    return null;                       // seçim · metin · lazer · spot · el: uygulama bilir
  }

  function sync() {
    try {
      /* Kaydırma sırasında karışma: uygulamanın kendi imleci (grab) görünsün */
      var panning = false;
      try { panning = (typeof spaceHeld !== "undefined" && spaceHeld) ||
                      (typeof tool !== "undefined" && tool === "pan"); } catch (_) {}
      var fig = panning ? null : figureForTool();
      if (!fig) {
        /* Kapalı / kapsam dışı araç: uygulamanın kendi imleci geri döner.
           Koşulsuz temizlenir — "Kapalı" seçimi anında etkili olsun. */
        lastKey = "";
        document.body.classList.remove("pro-cur");
        document.documentElement.style.removeProperty("--pro-cur");
        return;
      }
      var k = [fig, P.size, P.follow ? inkColor() : "", P.outline, P.ring,
        (P.ring && typeof penSize !== "undefined") ? penSize : 0,
        (P.ring && typeof view !== "undefined" && view) ? Math.round(view.s * 20) : 0].join("|");
      if (k === lastKey) return;
      lastKey = k;
      document.documentElement.style.setProperty("--pro-cur", cursorCSS(fig));
      document.body.classList.add("pro-cur");
    } catch (_) {}
  }
  window.proCursorSync = sync;

  /* Uygulama imleci her değiştirdiğinde (setTool, Space, yeni tahta) yeniden
     değerlendir — inline stil değişimini izlemek en güvenli kanca. */
  function watch() {
    var st = $id("stage");
    if (!st) { setTimeout(watch, 300); return; }
    try {
      new MutationObserver(function () { sync(); })
        .observe(st, { attributes: true, attributeFilter: ["style"] });
    } catch (_) {}
    /* renk / kalınlık / zoom değişimleri de imleci tazeler (uç halkası) */
    st.addEventListener("pointerdown", sync, true);
    st.addEventListener("wheel", function () { setTimeout(sync, 60); }, { passive: true });
    document.addEventListener("click", function () { setTimeout(sync, 40); }, true);
    document.addEventListener("keyup", function () { setTimeout(sync, 40); }, true);
    setInterval(sync, 900);            // güvenlik ağı: kaçan hiçbir değişiklik kalmasın
  }

  /* ------------------------------------------------------------ OPSİYONLAR */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function sec(t) { return el('<div class="set-sec-t" style="margin-top:18px">' + t + "</div>"); }
  function rowToggle(id, t, d, on, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><label class="sw-toggle"><input type="checkbox" id="' + id + '"><i></i></label></div>');
    var i = r.querySelector("input"); i.checked = !!on;
    i.addEventListener("change", function () { fn(i.checked); save(); lastKey = ""; sync(); renderFigGrid(); });
    return r;
  }
  function rowRange(id, t, d, val, min, max, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d" id="' + id +
      'Out">' + d + '</div></div><input type="range" id="' + id + '" min="' + min + '" max="' + max +
      '" value="' + val + '"></div>');
    var i = r.querySelector("input");
    i.addEventListener("input", function () { fn(+i.value, r.querySelector("#" + id + "Out")); });
    return r;
  }
  function rowSeg(id, t, d, opts, cur2, fn) {
    var b = opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '"' + (o[0] === cur2 ? ' class="on"' : "") + ">" + o[1] + "</button>";
    }).join("");
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><div class="pk-seg" id="' + id + '" style="flex:0 0 auto;flex-wrap:wrap;justify-content:flex-end;max-width:58%">' + b + "</div></div>");
    r.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        r.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        btn.classList.add("on"); fn(btn.dataset.v); save(); lastKey = ""; sync(); preview();
      });
    });
    return r;
  }
  /* Figür kartları: her seçenek kendi çizimiyle görünür — hepsi göz önünde */
  var FIGS = [
    ["off", "Kapalı"], ["pen", "Tükenmez"], ["fountain", "Dolma Kalem"], ["brush", "Fırça"],
    ["pencil", "Kurşun Kalem"], ["marker", "Marker"], ["fine", "İnce Uç"],
    ["chalk", "Tebeşir"], ["stylus", "Stylus"], ["cross", "Nişangâh"]
  ];
  function figThumb(f) {
    if (f === "off") return '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round"><path d="M5 3v13l3.5-3H16z" opacity=".85"/><path d="M4 4l16 16" opacity=".55"/></svg>';
    var ink = inkColor(), edge = P.outline ? "#FFFFFF" : "rgba(0,0,0,.55)";
    return '<svg width="34" height="34" viewBox="0 0 32 32">' + body(f, ink, edge) + "</svg>";
  }
  function renderFigGrid() {
    var wrap = $id("oCurFig");
    if (!wrap) return;
    wrap.innerHTML = FIGS.map(function (o) {
      return '<button type="button" class="pcur-card' + (o[0] === P.fig ? " on" : "") + '" data-v="' + o[0] + '">' +
        '<span class="pc-ico">' + figThumb(o[0]) + "</span><span class=\"pc-n\">" + o[1] + "</span></button>";
    }).join("");
    wrap.querySelectorAll(".pcur-card").forEach(function (b) {
      b.addEventListener("click", function () {
        P.fig = b.dataset.v; save(); lastKey = "";
        wrap.querySelectorAll(".pcur-card").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        sync(); preview();
      });
    });
  }
  /* Canlı önizleme: seçilen figür ayar panelinde gerçek boyutuyla görünür */
  function preview() {
    var box = $id("proCurPrev");
    if (!box) return;
    if (P.fig === "off") { box.innerHTML = '<span style="color:var(--mut);font-size:12px">İmleç figürü kapalı — sistem imleci kullanılır</span>'; return; }
    var size = Math.max(18, Math.min(64, P.size | 0));
    var ink = inkColor(), edge = P.outline ? "#FFFFFF" : "rgba(0,0,0,.55)";
    var mk = function (f) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 32 32" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))">' +
        body(f, ink, edge) + ringSVG(f, edge, ink) + "</svg>";
    };
    box.innerHTML = mk(P.fig) + (P.smart ? mk("eraser") + mk("cross") : "");
  }

  function build() {
    var ui = $id("sp-ui");
    if (!ui || ui.dataset.proCursor) return;
    ui.dataset.proCursor = "1";

    ui.appendChild(sec("Pro İmleç — Kalem Figürü"));
    ui.appendChild(el('<div class="set-row" style="display:block"><div><div class="t">🖊️ İmleç Figürü</div>' +
      '<div class="d">Çizim yaparken fare okunun yerine gerçek bir kalem görünür; mürekkep tam ucundan çıkar. ' +
      'Aşağıdan seç — her figür kendi boyutunda önizlenir. Kapalıyken uygulama eski imlecini kullanır.</div></div>' +
      '<div class="pcur-grid" id="oCurFig"></div></div>'));
    renderFigGrid();

    var prev = el('<div class="set-row"><div><div class="t">👁 Canlı Önizleme</div><div class="d">Seçtiğin figür + araca duyarlı imleçler, gerçek boyutta</div></div>' +
      '<span id="proCurPrev" style="display:flex;gap:12px;align-items:center"></span></div>');
    ui.appendChild(prev);

    ui.appendChild(rowRange("oCurSize", "📏 İmleç Boyutu", sizeLabel(P.size), P.size, 18, 64,
      function (v, out) { P.size = v; if (out) out.textContent = sizeLabel(v); save(); lastKey = ""; sync(); preview(); }));

    ui.appendChild(rowToggle("oCurFollow", "🎨 Kalem Rengini İzle",
      "İmlecin mürekkebi seçili kalem rengine boyanır — hangi renkle çizdiğini imlece bakarak görürsün (fosforluda sarı).",
      P.follow, function (v) { P.follow = v; preview(); }));

    ui.appendChild(rowToggle("oCurRing", "🎯 Uç Halkası",
      "Kalemin ucunda, <b>gerçek çizgi kalınlığı</b> kadar bir halka gösterilir; yakınlaştırdıkça büyür. Temas noktası milimetrik belli olur.",
      P.ring, function (v) { P.ring = v; preview(); }));

    ui.appendChild(rowToggle("oCurOutline", "🌓 Koyu Zemin Kontürü",
      "Figürün etrafına ince beyaz kontur eklenir — koyu tahtada, PDF'te ve videoda imleç her zaman net görünür.",
      P.outline, function (v) { P.outline = v; preview(); }));

    ui.appendChild(rowToggle("oCurSmart", "🧠 Araca Duyarlı İmleç",
      "Silgide silgi figürü, cetvel/pergel/çözüm modunda hassas nişangâh belirir; seçim ve metin araçlarında uygulamanın kendi imleci korunur.",
      P.smart, function (v) { P.smart = v; preview(); }));

    preview();
  }
  function sizeLabel(v) {
    return v <= 22 ? v + " px — küçük ve zarif"
      : v <= 34 ? v + " px — normal (önerilen)"
      : v <= 48 ? v + " px — büyük"
      : v + " px — devasa (video/sunum için)";
  }

  /* Araç değişimini doğrudan yakala — imleç aynı karede güncellensin */
  function hookTool() {
    if (typeof window.setTool !== "function" || window.setTool.__proCur) return;
    var orig = window.setTool;
    var wrap = function () { var r = orig.apply(this, arguments); sync(); return r; };
    wrap.__proCur = true;
    window.setTool = wrap;
  }

  function boot() { build(); watch(); hookTool(); sync(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 900); });
  } else setTimeout(boot, 900);
})();
