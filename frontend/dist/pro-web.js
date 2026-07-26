/* =============================================================================
 * Notis PRO — Web Katmanı (Canlı Sayfa Üzerine Çizim)
 *
 * notis.js'ten SONRA yüklenir. Bir web sayfasını (YouTube dahil) çalışma
 * tahtasının ARKASINA yansıtır; uygulamanın TÜM araçları — kalemler, silgi,
 * seçim, cetvel, pergel, çözüm modu — sayfanın üzerinde aynen çalışır.
 *
 * Mimarî: iframe, #stage içinde tuvallerin ALTINA yerleşir. Web katmanı
 * açıkken tahta zemini şeffaf çizilir (boardBg/paperPattern sarmalanır),
 * mürekkep tuvalde sayfanın üstünde kalır. Üstteki kapsülden "Sayfayı Kullan"
 * moduna geçilince tuvaller tıklamayı sayfaya bırakır (video oynat/durdur),
 * "Çizime Dön" ile kalem geri gelir. Katman belgeye SERİLEŞTİRİLMEZ — kayıt,
 * dışa aktarma ve kütüphane davranışları değişmez.
 * ========================================================================== */
(function () {
  "use strict";

  var WEB = { on: false, live: false };
  function $id(x) { return document.getElementById(x); }

  /* ------------------------------------------------------ URL NORMALLEŞTİRME */
  function normUrl(u) {
    u = (u || "").trim();
    if (!u) return "";
    if (!/^[a-z]+:\/\//i.test(u)) u = "https://" + u;
    try {
      var x = new URL(u);
      var h = x.hostname.replace(/^www\.|^m\./, "");
      if (h === "youtube.com" || h === "youtube-nocookie.com") {
        var v = x.searchParams.get("v");
        if (!v) { var m = x.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{5,})/); if (m) v = m[1]; }
        var list = x.searchParams.get("list");
        if (v) return "https://www.youtube-nocookie.com/embed/" + v + "?autoplay=1&rel=0" +
          (list ? "&list=" + encodeURIComponent(list) : "");
        if (list) return "https://www.youtube-nocookie.com/embed/videoseries?list=" +
          encodeURIComponent(list) + "&autoplay=1";
      }
      if (h === "youtu.be") {
        var id = x.pathname.slice(1).split("/")[0];
        if (id) return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      }
    } catch (_) {}
    return u;
  }

  /* ------------------------------------------------------------ KATMAN DOM'U */
  function frame() {
    var f = $id("proWebFrame");
    if (!f) {
      f = document.createElement("iframe");
      f.id = "proWebFrame";
      f.setAttribute("allow", "autoplay; fullscreen; encrypted-media; picture-in-picture");
      f.setAttribute("allowfullscreen", "");
      stage.insertBefore(f, stage.firstChild); // tuvallerin ALTINDA kalır
    }
    return f;
  }
  function bar() {
    var b = $id("proWebBar");
    if (b) return b;
    b = document.createElement("div");
    b.id = "proWebBar";
    b.innerHTML =
      '<button type="button" id="pwMode"></button>' +
      '<button type="button" id="pwLink" title="Bağlantıyı değiştir">🔗</button>' +
      '<button type="button" id="pwClose" title="Web katmanını kapat">✖</button>';
    stage.appendChild(b);
    b.querySelector("#pwMode").addEventListener("click", function () { setLive(!WEB.live); });
    b.querySelector("#pwLink").addEventListener("click", ask);
    b.querySelector("#pwClose").addEventListener("click", closeWeb);
    return b;
  }
  function syncUI() {
    var m = $id("pwMode");
    if (m) {
      m.textContent = WEB.live ? "✏️ Çizime Dön" : "🖱️ Sayfayı Kullan";
      m.title = WEB.live ? "Kalem sende: sayfa kilitlenir, çizim açılır"
        : "Sayfayla etkileşim: video oynat/durdur, sayfayı kaydır";
    }
    var rb = document.querySelector('#rail [data-t="weblayer"]');
    if (rb) rb.classList.toggle("on2", WEB.on);
  }
  function setLive(v) {
    WEB.live = !!v;
    document.body.classList.toggle("pro-web-live", WEB.live);
    syncUI();
  }

  /* ------------------------------------------------------------- AÇ / KAPAT */
  function openWeb(raw) {
    var url = normUrl(raw);
    if (!url) return;
    frame().src = url;
    bar();
    WEB.on = true;
    document.body.classList.add("pro-web");
    try { localStorage.setItem("notis_web_url", raw); } catch (_) {}
    setLive(false);
    try { redraw(); } catch (_) {}
  }
  function closeWeb() {
    WEB.on = false; WEB.live = false;
    document.body.classList.remove("pro-web", "pro-web-live");
    var f = $id("proWebFrame"); if (f) { f.src = "about:blank"; f.remove(); }
    var b = $id("proWebBar"); if (b) b.remove();
    syncUI();
    try { redraw(); } catch (_) {}
  }

  /* Zemin şeffaflığı: web katmanı açıkken tahta zemini ve kâğıt deseni çizilmez —
     sayfa, mürekkebin altından aynen görünür. Katman kapanınca birebir eski hâl. */
  var _bg = window.boardBg, _pp = window.paperPattern;
  if (typeof _bg === "function") window.boardBg = function () { return WEB.on ? "rgba(0,0,0,0)" : _bg(); };
  if (typeof _pp === "function") window.paperPattern = function () { if (WEB.on) return; return _pp.apply(this, arguments); };

  /* --------------------------------------------------------------- DİYALOG */
  function dlg() {
    var d = $id("proWebDlg");
    if (d) return d;
    d = document.createElement("dialog");
    d.id = "proWebDlg";
    d.innerHTML =
      '<div class="pw-h">🌐 Web Sayfasını Tahtaya Yansıt</div>' +
      '<div class="pw-body">' +
      '<input id="pwUrl" type="text" placeholder="https://www.youtube.com/watch?v=…  veya  site adresi" spellcheck="false" autocomplete="off">' +
      '<div class="pw-hint">Sayfa tahtanın arkasında açılır; tüm kalemler, silgi, seçim ve <b>çözüm modu</b> üzerinde aynen çalışır. YouTube bağlantıları otomatik oynatıcıya çevrilir. Üstteki kapsülden <b>🖱️ Sayfayı Kullan</b> / <b>✏️ Çizime Dön</b> arasında geçiş yapılır. Not: bazı siteler gömülmeye izin vermez — YouTube her zaman çalışır.</div>' +
      '</div>' +
      '<div class="pw-f"><button type="button" class="ghost" id="pwCancel">Vazgeç</button>' +
      '<button type="button" id="pwGo">Tahtaya Yansıt</button></div>';
    document.body.appendChild(d);
    function go() { var u = d.querySelector("#pwUrl").value; d.close(); if (u.trim()) openWeb(u); }
    d.querySelector("#pwCancel").addEventListener("click", function () { d.close(); });
    d.querySelector("#pwGo").addEventListener("click", go);
    d.querySelector("#pwUrl").addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); go(); }
    });
    return d;
  }
  function ask() {
    var d = dlg(), i = d.querySelector("#pwUrl");
    try { i.value = localStorage.getItem("notis_web_url") || ""; } catch (_) {}
    if (!d.open) d.showModal();
    setTimeout(function () { i.focus(); i.select(); }, 60);
  }

  /* ------------------------------------------- SOL RAY DÜĞMESİ (sondan 2.) */
  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15.3 15.3 0 0 1 0 18M12 3a15.3 15.3 0 0 0 0 18"/></svg>';
  function inject() {
    var rail = $id("rail");
    if (!rail || rail.querySelector('[data-t="weblayer"]')) return;
    var solve = rail.querySelector('[data-t="solve"]');
    var b = document.createElement("button");
    b.className = "rtool";
    b.dataset.t = "weblayer";
    b.innerHTML = ICON + '<span class="tip">Web Sayfası — tahtaya yansıt & üzerine çiz</span>';
    b.addEventListener("click", ask);
    if (solve) rail.insertBefore(b, solve); else rail.appendChild(b);
    syncUI();
  }
  var _br = window.buildRail; // kısayol düzenlenince ray yeniden kurulur — düğme her seferinde geri gelir
  if (typeof _br === "function") window.buildRail = function () { _br.apply(this, arguments); inject(); };

  function boot() { inject(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 700); });
  } else setTimeout(boot, 700);
})();
