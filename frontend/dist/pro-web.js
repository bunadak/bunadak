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
    var rb = document.getElementById("webBtn");
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
    /* YouTube: video tam ekrana yayılmaz — tahtanın sol üstünde gerçek bir
       oynatıcı kutusuna (16:9) oturur; sağı ve altı not alanı olarak kalır. */
    WEB.yt = /youtube-nocookie\.com\/embed/.test(url);
    document.body.classList.toggle("pro-web-yt", WEB.yt);
    /* Sahne zemini tahtanın kendi renginde kalsın (siyah boşluk hissi olmasın) */
    try { stage.style.background = (typeof _bg === "function") ? _bg() : ""; } catch (_) {}
    try { localStorage.setItem("notis_web_url", raw); } catch (_) {}
    setLive(false);
    try { redraw(); } catch (_) {}
  }
  function closeWeb() {
    WEB.on = false; WEB.live = false; WEB.yt = false;
    document.body.classList.remove("pro-web", "pro-web-live", "pro-web-yt");
    var f = $id("proWebFrame"); if (f) { f.src = "about:blank"; f.remove(); }
    var b = $id("proWebBar"); if (b) b.remove();
    try { stage.style.background = ""; } catch (_) {}
    syncUI();
    try { redraw(); } catch (_) {}
  }

  /* ------------------------------------------- ÇÖZÜM MODU × WEB KATMANI ----
     Çözüm çerçevesine alınan bölgenin GÖRÜNTÜSÜ (video karesi dahil) Go
     tarafındaki ekran yakalamayla alınır ve çerçeve içine görüntü nesnesi
     olarak eklenir — sonra normal çözüm akışı onu da tahtaya taşır.
     Yakalama yoksa (tarayıcı/dev) akış birebir eskisi gibi devam eder. */
  window.addEventListener("pointerdown", function (e) {
    WEB.offX = e.screenX - e.clientX; WEB.offY = e.screenY - e.clientY;
  }, true);
  var _fs = window.finishSolve;
  if (typeof _fs === "function") window.finishSolve = function () {
    try {
      var cap = window.go && window.go.main && window.go.main.App && window.go.main.App.CaptureRegion;
      var d = solveDraft;
      if (!WEB.on || !cap || !d) return _fs();
      var x0 = Math.min(d.a.x, d.b.x), y0 = Math.min(d.a.y, d.b.y),
          x1 = Math.max(d.a.x, d.b.x), y1 = Math.max(d.a.y, d.b.y);
      if (x1 - x0 < 24 || y1 - y0 < 24) return _fs();
      var off = curOff(), r = stage.getBoundingClientRect();
      var cx0 = r.left + (x0 + off.x) * view.s + view.x;
      var cy0 = r.top + (y0 + off.y) * view.s + view.y;
      var dpr = window.devicePixelRatio || 1;
      var sx = Math.round((cx0 + (WEB.offX || 0)) * dpr);
      var sy = Math.round((cy0 + (WEB.offY || 0)) * dpr);
      var sw = Math.round((x1 - x0) * view.s * dpr);
      var sh = Math.round((y1 - y0) * view.s * dpr);
      /* Mürekkep tuvallerini bir karelik gizle — yakalanan görüntü yalnız
         sayfayı/videoyu içersin; çizimler zaten nesne olarak taşınıyor. */
      cv.style.visibility = "hidden"; ovl.style.visibility = "hidden";
      var restore = function () { cv.style.visibility = ""; ovl.style.visibility = ""; };
      setTimeout(function () {
        cap(sx, sy, sw, sh).then(function (url) {
          restore();
          if (!url) return _fs();
          var im = new Image();
          im.onload = function () {
            try {
              layer().objects.push({ type: "image", x: x0, y: y0, w: x1 - x0, h: y1 - y0,
                rot: 0, src: url, _img: im, opacity: 1 });
            } catch (_) {}
            _fs();
          };
          im.onerror = function () { _fs(); };
          im.src = url;
        }).catch(function () { restore(); _fs(); });
      }, 60);
    } catch (_) { try { cv.style.visibility = ""; ovl.style.visibility = ""; } catch (__) {} _fs(); }
  };

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
      '<div class="pw-hint">YouTube bağlantıları sol üstte <b>16:9 oynatıcı kutusunda</b>, diğer siteler <b>ekranın sol yarısında</b> açılır — sağ taraf çalışma alanın olarak kalır. Tüm kalemler, silgi, seçim ve <b>çözüm modu</b> sayfanın üzerinde aynen çalışır. Sağ üstteki kapsülden <b>🖱️ Sayfayı Kullan</b> / <b>✏️ Çizime Dön</b> arasında geçiş yapılır. Not: bazı siteler gömülmeye izin vermez — YouTube her zaman çalışır.</div>' +
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

  /* Üst paneldeki 🌐 düğmesi (index.html #webBtn) bu diyaloğu açar */
  window.proWebAsk = ask;
})();
