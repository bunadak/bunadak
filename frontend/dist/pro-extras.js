/* =============================================================================
 * Notis PRO — Ek Opsiyonlar (Arayüz · Renk & Şema · Kalem)
 *
 * notis.js'ten SONRA yüklenir. Çizim motorunu değiştirmez; var olan ayar
 * panellerine yeni seçenekler ekler ve bunları motorun kendi bayrakları
 * (S.oledUltra) ile CSS değişkenleri üzerinden
 * uygular. Tüm tercihler localStorage'da 'notis_pro_opts' altında saklanır.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_pro_opts";
  var DEF = {
    autoNight: false,      // 🌗 saate göre tema
    glass: 18,             // 🫧 cam efekti yoğunluğu (px)
    stream: false,         // 📺 yayın modu
    accent: "",            // 🎨 vurgu rengi (boş = temanın kendi rengi)
    palette: "klasik",     // 🌈 kalem paleti şeması
    warm: 0,               // 🌡️ gece ışığı (0–100)
    oled: false,           // 🖥️ OLED Ultra Görüntü (uygulama geneli 4K his)
    cine: "0",             // ✨ sinematik geçişler: 0=kapalı, 1=zarif, 2=belirgin
    vignette: false        // 🎬 sinema vinyeti (kayıt görünümü)
  };
  var PS = load();

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {};
    for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(PS)); } catch (_) {} }
  function root() { return document.documentElement; }
  function has(fn) { return typeof window[fn] === "function"; }
  function redrawSafe() { try { if (typeof redraw === "function") redraw(); } catch (_) {} }
  function note(m) { try { if (typeof toast === "function") toast(m); } catch (_) {} }

  /* ------------------------------------------------------------------ PALET */
  var PALETTES = {
    klasik: ["#243B6B", "#111827", "#C0392B", "#E8590C", "#0B7285", "#2B8A3E", "#845EF7", "#FFE066"],
    canli:  ["#2563EB", "#111827", "#EF4444", "#F97316", "#06B6D4", "#22C55E", "#A855F7", "#FACC15"],
    pastel: ["#7C9CE0", "#4B5563", "#F08A8A", "#F3B07A", "#7FC8D8", "#8FD9A8", "#C4A7E7", "#EFD98A"],
    kontrast:["#0000FF", "#000000", "#E10600", "#FF6A00", "#007C86", "#008A20", "#7A00FF", "#FFC800"]
  };

  /* ------------------------------------------------------------- UYGULAYICI */
  function applyAll() {
    applyGlass(); applyStream(); applyAccent(); applyWarm(); applyPalette();
    applyOled(); applyCine(); applyVignette();
    applyEngine(); applyAutoNight();
  }
  /* 🖥️ OLED Ultra Görüntü — uygulama geneli premium netlik:
     motor tarafında S.oledUltra tuvali kalıcı süper-örneklemeye alır (applyDPR)
     ve PDF içe aktarımını 4K dokuya yükseltir; CSS tarafında pro-theme.css'teki
     .pro-oled sınıfı gerçek siyah zemin, keskin metin ve zengin kontrast verir. */
  function applyOled() {
    document.body.classList.toggle("pro-oled", !!PS.oled);
  }
  /* ✨ Sinematik Geçişler — panel/diyalog/araç animasyonlarının karakteri */
  function applyCine() {
    document.body.classList.toggle("pro-cine1", PS.cine === "1");
    document.body.classList.toggle("pro-cine2", PS.cine === "2");
  }
  /* 🎬 Sinema Vinyeti — kayıtlara derinlik katan kenar karartması (tuvale çizilmez) */
  function applyVignette() {
    document.body.classList.toggle("pro-vignette", !!PS.vignette);
  }
  function applyGlass() { root().style.setProperty("--glass", (PS.glass | 0) + "px"); }
  function applyStream() { document.body.classList.toggle("pro-stream", !!PS.stream); }
  function applyWarm() {
    var v = PS.warm | 0;
    root().style.setProperty("--pro-warm",
      v <= 0 ? "none" : "sepia(" + (v / 160).toFixed(3) + ") brightness(" + (1 - v / 700).toFixed(3) + ")");
  }
  function applyAccent() {
    if (!PS.accent) { root().style.removeProperty("--acc"); root().style.removeProperty("--acc-ink"); return; }
    root().style.setProperty("--acc", PS.accent);
    root().style.setProperty("--acc-ink", luma(PS.accent) > 0.6 ? "#20160A" : "#FFFFFF");
  }
  function luma(hex) {
    try {
      var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch (_) { return 0.5; }
  }
  function applyPalette() {
    var pal = PALETTES[PS.palette] || PALETTES.klasik;
    try {
      if (typeof SWATCH !== "undefined" && Array.isArray(SWATCH)) {
        SWATCH.length = 0; pal.forEach(function (c) { SWATCH.push(c); });
        if (typeof buildSwatches === "function") buildSwatches();
      }
    } catch (_) {}
  }
  function applyEngine() {
    try {
      if (typeof S === "undefined") return;
      S.oledUltra = !!PS.oled;
      /* ORİJİNAL KALEM TEKNOLOJİSİ: pro kalem deney bayrakları kalıcı kapalı —
         eski bir kayıtta açık kalmış olsalar bile motor orijinal davranır. */
      S.hz144 = false; S.beautify = false; S.handFont = false; S.inkK = 50;
      if (typeof applyDPR === "function") applyDPR();  // OLED → tuvali yeniden ölçekler
      redrawSafe();
    } catch (_) {}
  }
  var nightTimer = null;
  function applyAutoNight() {
    clearInterval(nightTimer); nightTimer = null;
    if (!PS.autoNight) return;
    var tick = function () {
      var h = new Date().getHours();
      var want = (h >= 19 || h < 7) ? "ink" : "light";
      if (root().dataset.theme !== want) {
        root().dataset.theme = want;
        try { if (typeof renderThemes === "function") renderThemes(); } catch (_) {}
      }
    };
    tick(); nightTimer = setInterval(tick, 60000);
  }

  /* --------------------------------------------------------------- UI KURMA */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function sec(title) { return el('<div class="set-sec-t" style="margin-top:18px">' + title + "</div>"); }
  function rowToggle(id, t, d, on, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><label class="sw-toggle"><input type="checkbox" id="' + id + '"><i></i></label></div>');
    var i = r.querySelector("input"); i.checked = !!on;
    i.addEventListener("change", function () { fn(i.checked); save(); });
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
  function rowSeg(id, t, d, opts, cur, fn) {
    var b = opts.map(function (o) {
      return '<button data-v="' + o[0] + '"' + (o[0] === cur ? ' class="on"' : "") + ">" + o[1] + "</button>";
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
  function rowColor(id, t, d, val, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><span style="display:flex;gap:8px;align-items:center">' +
      '<input type="color" id="' + id + '" value="' + (val || "#FFB454") +
      '" style="width:44px;height:30px;border:none;background:none;cursor:pointer">' +
      '<button class="ghost" id="' + id + 'Rst" style="white-space:nowrap">Sıfırla</button></span></div>');
    var i = r.querySelector("input");
    i.addEventListener("input", function () { fn(i.value); save(); });
    r.querySelector("#" + id + "Rst").addEventListener("click", function () { fn(""); save(); });
    return r;
  }

  function build() {
    var ui = document.getElementById("sp-ui");
    var draw = document.getElementById("sp-draw");
    if (!ui || !draw || ui.dataset.proExtras) return;
    ui.dataset.proExtras = "1";

    /* ---------------- ARAYÜZ ---------------- */
    ui.appendChild(sec("Pro Arayüz"));
    ui.appendChild(rowToggle("oAutoNight", "🌗 Otomatik Gece Modu",
      "Akşam 19:00–07:00 arası koyu temaya, gündüz aydınlığa kendiliğinden geçer.",
      PS.autoNight, function (v) { PS.autoNight = v; applyAutoNight(); note(v ? "Otomatik gece modu açık 🌗" : "Otomatik gece modu kapalı"); }));
    ui.appendChild(rowSeg("oGlass", "🫧 Cam Efekti Yoğunluğu",
      "Panellerin arkasındaki buzlu cam bulanıklığı.",
      [["0", "Kapalı"], ["8", "Hafif"], ["18", "Normal"], ["30", "Yoğun"]], String(PS.glass),
      function (v) { PS.glass = +v; applyGlass(); }));
    ui.appendChild(rowToggle("oStream", "📺 Yayın Modu",
      "Video kaydı için: kenarlar belirginleşir, yazılar netleşir, arayüz ekranda daha okunur olur.",
      PS.stream, function (v) { PS.stream = v; applyStream(); note(v ? "Yayın modu açık 📺" : "Yayın modu kapalı"); }));
    ui.appendChild(rowToggle("oOled", "🖥️ OLED Ultra Görüntü",
      "Uygulamanın TAMAMI premium ekran hissine geçer: tuval kalıcı olarak en az 2× süper-örneklenir (4K his — çizimler, tahta ve arayüz yakınlaştırmada asla piksellenmez), koyu temalarda zemin gerçek OLED siyahına iner, metinler keskinleşir, renkler derinleşir. Bu opsiyon AÇIKKEN içe aktarılan PDF'ler 4K dokuya kadar yüksek çözünürlükte işlenir. YouTube kayıtları için birebir.",
      PS.oled, function (v) {
        PS.oled = v; applyOled(); applyEngine();
        note(v ? "OLED Ultra Görüntü açık 🖥️ — 4K his aktif" : "OLED Ultra Görüntü kapalı");
      }));
    ui.appendChild(rowSeg("oCine", "✨ Sinematik Geçişler",
      "Panel, diyalog ve araçların açılış-kapanışına yumuşak, yaylı premium animasyonlar katar. 'Zarif' incecik hissettirir; 'Belirgin' video anlatımlarında göze görünür şıklık verir.",
      [["0", "Kapalı"], ["1", "Zarif"], ["2", "Belirgin"]], PS.cine,
      function (v) { PS.cine = v; applyCine(); }));
    ui.appendChild(rowToggle("oVignette", "🎬 Sinema Vinyeti",
      "Ekranın kenarlarına çok hafif bir karartma ekler — göz merkeze odaklanır, kayıtlar sinema karesi gibi derinlik kazanır. Tuvale çizilmez, dışa aktarımları etkilemez.",
      PS.vignette, function (v) { PS.vignette = v; applyVignette(); note(v ? "Sinema vinyeti açık 🎬" : "Sinema vinyeti kapalı"); }));

    /* ---------------- RENK & ŞEMA ---------------- */
    ui.appendChild(sec("Pro Renk & Şema"));
    ui.appendChild(rowColor("oAccent", "🎨 Vurgu Rengi",
      "Arayüzün ana vurgu rengini kendin seç — tüm butonlar ve göstergeler uyum sağlar.",
      PS.accent || "#FFB454", function (v) { PS.accent = v; applyAccent(); }));
    ui.appendChild(rowSeg("oPalette", "🌈 Kalem Paleti Şeması",
      "Üst çubuktaki hızlı renklerin karakteri.",
      [["klasik", "Klasik"], ["canli", "Canlı"], ["pastel", "Pastel"], ["kontrast", "Kontrast"]], PS.palette,
      function (v) { PS.palette = v; applyPalette(); }));
    ui.appendChild(rowRange("oWarm", "🌡️ Gece Işığı",
      warmLabel(PS.warm), PS.warm, 0, 100, function (v, out) {
        PS.warm = v; applyWarm(); if (out) out.textContent = warmLabel(v); save();
      }));

    /* ---------------- DEPOLAMA: çözüm kaydı ---------------- */
    var st = document.getElementById("sp-storage");
    if (st && !st.dataset.proExtras) {
      st.dataset.proExtras = "1";
      var on = localStorage.getItem("notis_solve_save") !== "0";
      st.appendChild(sec("Çözüm Modu"));
      st.appendChild(rowToggle("oSolveSave", "🧮 Çözümleri kütüphaneye kaydet",
        "Çözüm modundan çıkarken soru ve çözümün kütüphaneye otomatik kaydedilir.",
        on, function (v) { try { localStorage.setItem("notis_solve_save", v ? "1" : "0"); } catch (_) {} }));
    }
  }
  function warmLabel(v) { return v <= 0 ? "Kapalı — doğal renkler" : "%" + v + " sıcaklık · gece için göz dostu"; }

  /* ------------------------------------------------------------------- BOOT */
  function boot() {
    build();
    applyAll();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 600); });
  } else setTimeout(boot, 600);
})();
