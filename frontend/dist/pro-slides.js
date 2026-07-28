/* =============================================================================
 * Notis PRO — SLAYT SUNUSU
 *
 * Sunu dosyalarını (PPTX · PPT · ODP · PDF) çalışma alanına oturtur:
 *   • Her seferinde TEK slayt, çalışma alanına tam sığar (kenarlarda taşma yok)
 *   • ← → ↑ ↓ · PageUp/PageDown · Space · Home/End ile sayfa geçişi
 *   • Tekerlek slaytları çevirir; Ctrl+Tekerlek yakınlaştırır
 *   • Uygulamanın TÜM araçları çalışır (kalemler, silgi, seçim, cetvel, pergel,
 *     metin, şekiller, çözüm modu) — çizimler PDF'te olduğu gibi sayfa sayfa
 *     kaydedilir ve kütüphaneye yazılır
 *   • Alt çubuk: ilk/önceki/sonraki/son · sayfa sayacı · sığdır · çıkış
 *
 * PPTX/PPT/ODP dosyaları Go tarafında (PowerPoint COM ya da LibreOffice) PDF'e
 * çevrilir ve uygulamanın kanıtlanmış yüksek çözünürlüklü PDF hattına verilir —
 * yani slaytlar birebir, kayıpsız ve yakınlaştırmada net görünür.
 *
 * Kalem motoruna ve mevcut hiçbir davranışa DOKUNMAZ.
 * ========================================================================== */
(function () {
  "use strict";

  var SL = { on: false, lastId: null, busy: false };
  var PAD = 0;                        // slayt çalışma alanını sonuna kadar doldurur
  function $id(x) { return document.getElementById(x); }
  function api() { return (window.go && window.go.main && window.go.main.App) || null; }

  /* ------------------------------------------------------------- GÖRÜNÜM */
  /* Geçerli slaydı çalışma alanına TAM sığdır (tek slayt, ortalanmış). */
  function fitSlide() {
    if (!SL.on) return;
    try {
      var p = doc.pages[cur]; if (!p) return;
      var r = stage.getBoundingClientRect();
      var s = Math.min((r.width - PAD * 2) / p.w, (r.height - PAD * 2) / p.h);
      s = Math.max(0.05, Math.min(s, 8));
      var off = layout()[cur] || { x: 0, y: 0 };
      view.s = s;
      view.x = (r.width - p.w * s) / 2 - off.x * s;
      view.y = (r.height - p.h * s) / 2 - off.y * s;
      var zl = $id("zoomLbl"); if (zl) zl.textContent = Math.round(s * 100) + "%";
      redraw(); drawOverlay();
    } catch (_) {}
  }

  function go(i) {
    if (!SL.on) return;
    var n = doc.pages.length;
    i = Math.max(0, Math.min(n - 1, i));
    if (i === cur) { fitSlide(); return; }
    /* Kaydırmayla sayfa algılamayı kilitle: geçiş yalnız bizim kontrolümüzde */
    scrollDetectLock = true;
    try { if (typeof commitText === "function") commitText(); } catch (_) {}
    gotoPage(i);
    fitSlide();
    scrollDetectLock = false;
  }

  /* -------------------------------------------------------- AÇ / KAPAT */
  function enter() {
    if (SL.on) return;
    SL.on = true;
    document.body.classList.add("slide-mode");
    var sb = $id("slideBtn"); if (sb) sb.classList.add("on2");
    requestAnimationFrame(fitSlide);
  }
  function exit() {
    if (!SL.on) return;
    SL.on = false;
    document.body.classList.remove("slide-mode");
    var sb = $id("slideBtn"); if (sb) sb.classList.remove("on2");
    try { fit(); } catch (_) {}
  }
  window.proSlideExit = exit;
  window.proSlideActive = function () { return SL.on; };

  /* --------------------------------------------------------- YÜKLEME */
  function dataUrlToFile(url, name) {
    var i = url.indexOf(","), bin = atob(url.slice(i + 1));
    var arr = new Uint8Array(bin.length);
    for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
    return new File([arr], name, { type: "application/pdf" });
  }

  /* PDF hattı kütüphaneye yazarken kullandığı kimliği yakala — içe aktarma
     bitince sunuyu doğrudan açabilmek için (kullanıcı kütüphaneyi aramasın). */
  (function hookSave() {
    if (!window.LIB || !LIB.saveExternal || LIB.__slHooked) return;
    LIB.__slHooked = true;
    var orig = LIB.saveExternal;
    LIB.saveExternal = function (title, pages, knd, fixedId) {
      if (fixedId) SL.lastId = fixedId;
      return orig.apply(this, arguments);
    };
  })();

  async function loadPdfFile(file) {
    SL.lastId = null;
    await importPDF(file);                       // kanıtlanmış yüksek çözünürlüklü hat
    if (SL.lastId && window.LIB && LIB.openWork) {
      await LIB.openWork(SL.lastId);             // sunuyu aç (çizimler PDF gibi kaydedilir)
    }
    enter();
  }

  async function pick() {
    if (SL.busy) return;
    var A = api();
    try {
      SL.busy = true;
      if (A && A.PickSlideFile && A.SlidesToPDF) {
        var path = await A.PickSlideFile();
        if (!path) return;
        var url = await A.SlidesToPDF(path);     // PPTX/PPT/ODP → PDF · PDF ise doğrudan
        if (!url) return;
        var nm = String(path).split(/[\\/]/).pop().replace(/\.[^.]+$/, "");
        await loadPdfFile(dataUrlToFile(url, nm + ".pdf"));
      } else {
        /* Tarayıcı/geliştirme ortamı: dönüştürücü yalnız masaüstünde çalışır,
           burada PDF açılabilir (diğer türler için net uyarı verilir). */
        var inp = $id("slideInp");
        if (!inp) {
          inp = document.createElement("input");
          inp.type = "file"; inp.id = "slideInp"; inp.hidden = true;
          inp.accept = ".pdf,.pptx,.ppt,.odp,.docx,.doc,.xlsx,.xls";
          document.body.appendChild(inp);
          inp.addEventListener("change", async function (e) {
            var f = e.target.files[0]; e.target.value = "";
            if (!f) return;
            if (!/\.pdf$/i.test(f.name)) {
              try { alert("Bu dosya türü yalnız masaüstü uygulamasında açılabilir.\nTarayıcıda PDF yükleyebilirsin."); } catch (_) {}
              return;
            }
            SL.busy = true; try { await loadPdfFile(f); } finally { SL.busy = false; }
          });
        }
        inp.click();
      }
    } catch (err) {
      try { alert("Slayt açılamadı:\n\n" + (err && err.message ? err.message : err)); } catch (_) {}
    } finally { SL.busy = false; }
  }
  window.proSlideOpen = pick;

  /* =======================================================================
   * GENEL İÇE AKTARMA — uygulama artık PDF ile sınırlı değil
   * Üst paneldeki "içe aktar" düğmesi masaüstünde yerel dosya penceresini
   * açar: PowerPoint · Word · Excel · OpenDocument · RTF/TXT/CSV · PDF ve
   * görseller. Belgeler Go tarafında PDF'e çevrilip mevcut yüksek çözünürlüklü
   * PDF hattına verilir (kütüphane kaydı, çizim, sayfa akışı birebir aynı).
   * Görseller doğrudan sayfaya yerleştirilir. Yerel API yoksa (tarayıcı)
   * uygulamanın orijinal dosya-seçme akışı aynen çalışır.
   * ==================================================================== */
  var IMG_RE = /\.(png|jpe?g|webp|gif|bmp)$/i;
  async function importAny() {
    var A = api();
    if (!A || !A.PickDocFile || !A.SlidesToPDF) return false;   // tarayıcı: eski akış
    if (SL.busy) return true;
    try {
      SL.busy = true;
      var path = await A.PickDocFile();
      if (!path) return true;
      var nm = String(path).split(/[\\/]/).pop();
      if (IMG_RE.test(nm)) {                                    // görsel → sayfaya yerleştir
        var durl = await A.ReadFileAsDataURL(path);
        if (durl) placeImage(durl);
        return true;
      }
      var url = await A.SlidesToPDF(path);                      // belge → PDF
      if (!url) return true;
      SL.lastId = null;
      await importPDF(dataUrlToFile(url, nm.replace(/\.[^.]+$/, "") + ".pdf"));
      if (SL.lastId && window.LIB && LIB.openWork) await LIB.openWork(SL.lastId);
    } catch (err) {
      try { alert("Dosya açılamadı:\n\n" + (err && err.message ? err.message : err)); } catch (_) {}
    } finally { SL.busy = false; }
    return true;
  }
  /* Görseli, uygulamanın kendi görsel yerleştirme davranışıyla aynı şekilde ekler */
  function placeImage(durl) {
    var im = new Image();
    im.onload = function () {
      try {
        snapshot();
        var c = toDocCenterLocal();
        var w = Math.min(420, im.width), h = w * im.height / im.width;
        layer().objects.push({ type: "image", x: c.x - w / 2, y: c.y - h / 2, w: w, h: h,
          rot: 0, src: durl, _img: im, opacity: 1 });
        redraw(); if (window.LIB) LIB.dirty();
      } catch (_) {}
    };
    im.src = durl;
  }

  /* ------------------------------------------------------------ OLAYLAR */
  var NAV_PREV = { ArrowLeft: 1, ArrowUp: 1, PageUp: 1 };
  var NAV_NEXT = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1, Spacebar: 1 };
  function typing(t) {
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" ||
      t.tagName === "SELECT" || t.isContentEditable);
  }
  window.addEventListener("keydown", function (e) {
    if (!SL.on || e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e.target)) return;
    if (typeof live !== "undefined" && live) return;      // kalem kâğıtta: karışma
    if (typeof scratch !== "undefined" && scratch) return; // çözüm modu kendi akışında
    var k = e.key;
    if (NAV_PREV[k]) { e.preventDefault(); e.stopPropagation(); go(cur - 1); return; }
    if (NAV_NEXT[k]) { e.preventDefault(); e.stopPropagation(); go(cur + 1); return; }
    if (k === "Home") { e.preventDefault(); e.stopPropagation(); go(0); return; }
    if (k === "End") { e.preventDefault(); e.stopPropagation(); go(doc.pages.length - 1); return; }
    if (k === "Escape") {
      var pal = $id("palWrap");
      if (pal && pal.classList.contains("on")) return;    // önce komut paleti kapansın
      if (document.querySelector("dialog[open]")) return; // önce açık pencere
      e.preventDefault(); e.stopPropagation(); exit();
    }
  }, true);

  /* Tekerlek: slaytları çevirir (Ctrl+Tekerlek yakınlaştırmaya dokunmaz) */
  var wLock = 0, wAcc = 0;
  stageWheel();
  function stageWheel() {
    var st = document.getElementById("stage");
    if (!st) { setTimeout(stageWheel, 300); return; }
    st.addEventListener("wheel", function (e) {
      if (!SL.on || e.ctrlKey || e.shiftKey) return;
      if (typeof spotOn !== "undefined" && spotOn) return;
      e.preventDefault(); e.stopPropagation();
      var now = performance.now();
      if (now < wLock) return;
      wAcc += e.deltaY;
      if (Math.abs(wAcc) > 70) { go(cur + (wAcc > 0 ? 1 : -1)); wAcc = 0; wLock = now + 320; }
    }, { capture: true, passive: false });
  }

  /* Pencere/panel boyutu değişince slayt yeniden sığar */
  window.addEventListener("resize", function () { if (SL.on) setTimeout(fitSlide, 60); });
  try { new ResizeObserver(function () { if (SL.on) fitSlide(); }).observe(stage); } catch (_) {}

  /* Sayfa yan panelden ya da kısayolla değişirse de slayt sığdırmayı koru */
  var _gp = window.gotoPage;
  if (typeof _gp === "function") window.gotoPage = function () {
    var r = _gp.apply(this, arguments);
    if (SL.on) fitSlide();
    return r;
  };

  function boot() {
    var b = $id("slideBtn");
    if (b && !b.dataset.sl) { b.dataset.sl = "1"; b.addEventListener("click", pick); }
    /* İçe aktarma düğmesi: masaüstünde geniş dosya desteği devralır,
       tarayıcıda uygulamanın orijinal akışı çalışmaya devam eder. */
    var imp = $id("importBtn");
    if (imp && !imp.dataset.sl) {
      imp.dataset.sl = "1";
      imp.addEventListener("click", function (e) {
        if (!(api() && api().PickDocFile)) return;   // yerel API yok → eski akış
        e.preventDefault(); e.stopImmediatePropagation();
        importAny();
      }, true);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 700); });
  } else setTimeout(boot, 700);
})();
