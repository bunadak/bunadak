/* =============================================================================
 * Notis PRO — Masaüstü Kabuğu Entegrasyonu + Kalem Kalitesi
 *
 * notis.js'ten SONRA yüklenir. Orijinal mantığı değiştirmez; yalnızca WebView2
 * ortamında tarayıcı API'lerinin çalışmadığı iki noktayı Wails runtime'ına
 * bağlar (tam ekran, çıkış) ve uygulamanın KENDİ üst düzey kalem modlarını
 * varsayılan açık hale getirir.
 * ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
   * 1) TAM EKRAN — WebView2, document.requestFullscreen()'i yok sayar.
   *    Uygulamanın var olan tam ekran çağrılarını Wails penceresine yönlendir.
   * ------------------------------------------------------------------------- */
  function setupFullscreen() {
    var rt = window.runtime;
    if (!rt || !rt.WindowFullscreen) return false; // tarayıcı/dev: dokunma
    var _fs = false;

    // Uygulama tam ekran durumunu document.fullscreenElement ile kontrol ediyor;
    // Wails durumunu bu getter üzerinden yansıt.
    try {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        get: function () { return _fs ? document.documentElement : null; },
      });
    } catch (_) {}

    function enter() { try { rt.WindowFullscreen(); } catch (_) {} _fs = true; return Promise.resolve(); }
    function leave() { try { rt.WindowUnFullscreen(); } catch (_) {} _fs = false; return Promise.resolve(); }

    document.documentElement.requestFullscreen = enter;
    try { Element.prototype.requestFullscreen = enter; } catch (_) {}
    document.exitFullscreen = leave;

    // Gerçek pencere durumuyla eşitle
    if (rt.WindowIsFullscreen) {
      try { rt.WindowIsFullscreen().then(function (v) { _fs = !!v; }); } catch (_) {}
    }
    return true;
  }

  /* ---------------------------------------------------------------------------
   * 2) ÇIKIŞ — geliştiricinin bıraktığı window.notisExit kancasını Wails Quit'e
   *    bağla. (Ayarlar › Çıkış Yap ve kapatma akışı bunu çağırır.)
   * ------------------------------------------------------------------------- */
  window.notisExit = function () {
    var rt = window.runtime;
    if (rt && rt.Quit) { try { rt.Quit(); return; } catch (_) {} }
    if (window.go && window.go.main && window.go.main.App && window.go.main.App.Quit) {
      try { window.go.main.App.Quit(); return; } catch (_) {}
    }
    try { window.close(); } catch (_) {}
  };

  /* runtime hazır olana kadar tam ekranı kur (Wails runtime'ı erken enjekte
   * eder; yine de güvenli tarafta kalmak için kısa bir yoklama yapıyoruz). */
  (function pollRuntime(n) {
    if (setupFullscreen()) return;
    if (n <= 0) return;
    setTimeout(function () { pollRuntime(n - 1); }, 120);
  })(20);

  /* ---------------------------------------------------------------------------
   * 3) KALEM KALİTESİ — uygulamanın kendi premium mürekkep modlarını (Ultra
   *    Netlik: süper-örnekleme · Pro Kalem Modu · Pro Plus Kalem Karakteri)
   *    ilk açılışta varsayılan AÇIK yap. Kullanıcı sonradan kapatırsa saygı
   *    gösterilir (tek seferlik bayrak). Uygulamanın kendi 'change' işleyicileri
   *    üzerinden etkinleştirildiği için mantık birebir korunur.
   * ------------------------------------------------------------------------- */
  function boostPens() {
    try {
      if (localStorage.getItem("notis_pro_penboost")) return;
      ["oUltraInk", "oProPens", "oPlus"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !el.checked) {
          el.checked = true;
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      localStorage.setItem("notis_pro_penboost", "1");
    } catch (_) {}
  }
  function whenReady(fn) {
    if (document.readyState !== "loading") setTimeout(fn, 450);
    else document.addEventListener("DOMContentLoaded", function () { setTimeout(fn, 450); });
  }
  whenReady(boostPens);
})();
