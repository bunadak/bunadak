/* =============================================================================
 * Notis PRO — İMLEÇ STÜDYOSU (opsiyon)
 *
 * Çizim yaparken fare okunun yerine gerçek bir KALEM FİGÜRÜ gösterir.
 * Tamamen opsiyoneldir: kapalıyken uygulama birebir eski davranışını sürdürür.
 *
 * Özellikler
 *   • 7 figür: Klasik Kalem · Dolma Kalem · Fırça · Kurşun Kalem · Marker ·
 *     İnce Uç (hassas) · Artı (nişangâh)
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
    fig: "off",        // off · pen · fountain · brush · pencil · marker · fine · cross
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

  /* ------------------------------------------------------------- FİGÜRLER */
  /* Tüm figürler 32×32 kutuda çizilir; uç noktası (3,29) — hotspot buradan
     ölçeklenir, böylece mürekkep tam imlecin ucundan çıkar. */
  var TIP = { x: 3, y: 29 };

  function body(fig, ink, edge) {
    var s = 'stroke="' + edge + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
    switch (fig) {
      case "pen":       // klasik tükenmez: gövde + metal uç
        return '<path d="M12 22 L24 10 L28 14 L16 26 Z" fill="#F2C14E" ' + s + '/>' +
               '<path d="M16 26 L12 22 L3 29 Z" fill="' + ink + '" ' + s + '/>' +
               '<path d="M24 10 L28 14 L30 12 A2.8 2.8 0 0 0 26 8 Z" fill="#9AA3B8" ' + s + '/>';
      case "fountain":  // dolma kalem: uzun gövde + yarıklı uç
        return '<path d="M13 21 L25 9 L29 13 L17 25 Z" fill="#2B3A67" ' + s + '/>' +
               '<path d="M17 25 L13 21 L3 29 Z" fill="' + ink + '" ' + s + '/>' +
               '<path d="M8 25 L12 22" stroke="' + edge + '" stroke-width="1.2"/>' +
               '<path d="M25 9 L29 13 L31 11 A2.6 2.6 0 0 0 27 7 Z" fill="#C9A227" ' + s + '/>';
      case "brush":     // fırça: sap + bilezik + kıl demeti
        return '<path d="M16 18 L26 8 L30 12 L20 22 Z" fill="#8B5E3C" ' + s + '/>' +
               '<path d="M14 20 L18 24 L16 26 L12 22 Z" fill="#B9BDC9" ' + s + '/>' +
               '<path d="M16 26 L12 22 C9 25 6 26 3 29 C7 28 12 28 16 26 Z" fill="' + ink + '" ' + s + '/>';
      case "pencil":    // kurşun kalem: gövde + ahşap koni + grafit
        return '<path d="M14 20 L26 8 L30 12 L18 24 Z" fill="#E8B44A" ' + s + '/>' +
               '<path d="M18 24 L14 20 L7 26 L11 30 Z" fill="#F0DCC0" ' + s + '/>' +
               '<path d="M11 30 L7 26 L3 29 Z" fill="' + ink + '" ' + s + '/>';
      case "marker":    // marker: kalın gövde + keski uç
        return '<path d="M14 20 L24 10 L30 16 L20 26 Z" fill="#3D4B63" ' + s + '/>' +
               '<path d="M20 26 L14 20 L3 29 Z" fill="' + ink + '" ' + s + '/>' +
               '<path d="M24 10 L30 16" stroke="' + edge + '" stroke-width="1.2"/>';
      case "fine":      // ince uç: zarif konik kalem
        return '<path d="M15 19 L27 7 L30 10 L18 22 Z" fill="#5A6478" ' + s + '/>' +
               '<path d="M18 22 L15 19 L3 29 Z" fill="' + ink + '" ' + s + '/>';
      case "eraser":    // silgi (araca duyarlı modda otomatik)
        return '<path d="M13 21 L23 11 L29 17 L19 27 Z" fill="#F2A0A0" ' + s + '/>' +
               '<path d="M19 27 L13 21 L8 26 L14 32 Z" fill="#FFFFFF" ' + s + '/>' +
               '<path d="M16 18 L22 24" stroke="' + edge + '" stroke-width="1.2"/>';
      case "cross":     // nişangâh (hassas hizalama)
        return '<path d="M16 4 V13 M16 19 V28 M4 16 H13 M19 16 H28" stroke="' + edge +
               '" stroke-width="2.6" stroke-linecap="round"/>' +
               '<path d="M16 4 V13 M16 19 V28 M4 16 H13 M19 16 H28" stroke="' + ink +
               '" stroke-width="1.2" stroke-linecap="round"/>' +
               '<circle cx="16" cy="16" r="1.6" fill="' + ink + '" stroke="' + edge + '" stroke-width="1"/>';
    }
    return "";
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
    i.addEventListener("change", function () { fn(i.checked); save(); lastKey = ""; sync(); });
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
    ui.appendChild(rowSeg("oCurFig", "🖊️ İmleç Figürü",
      "Çizim yaparken fare okunun yerine gerçek bir kalem görünür; mürekkep tam ucundan çıkar. Kapalıyken uygulama eski imlecini kullanır.",
      [["off", "Kapalı"], ["pen", "Tükenmez"], ["fountain", "Dolma"], ["brush", "Fırça"],
       ["pencil", "Kurşun"], ["marker", "Marker"], ["fine", "İnce Uç"], ["cross", "Artı"]],
      P.fig, function (v) { P.fig = v; }));

    var prev = el('<div class="set-row"><div><div class="t">👁 Önizleme</div><div class="d">Seçtiğin figür gerçek boyutunda</div></div>' +
      '<span id="proCurPrev" style="display:flex;gap:10px;align-items:center"></span></div>');
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
