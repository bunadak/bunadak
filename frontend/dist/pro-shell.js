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
   * 0) HATA AĞI — beklenmedik bir hata olursa uygulamayı kilitlemek yerine
   *    kaydını tut. (Sessizce yutmaz; yalnızca konsola yazar ki teşhis
   *    edilebilsin.) Kritik olmayan runtime hatalarında arayüz ayakta kalır.
   * ------------------------------------------------------------------------- */
  window.addEventListener("error", function (e) {
    try { console.warn("[Notis Pro] hata:", e && e.message, e && e.filename, e && e.lineno); } catch (_) {}
  });
  window.addEventListener("unhandledrejection", function (e) {
    try { console.warn("[Notis Pro] işlenmemiş promise:", e && e.reason); } catch (_) {}
  });

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
   * 3) KALEM KALİTESİ — uygulamanın kendi premium mürekkep modlarını varsayılan
   *    açar. Yalnızca hafif ve güvenli iki mod: "Ultra Netlik" (süper-örnekleme)
   *    ve "Pro Plus Kalem Karakteri". "Pro Kalem Modu" (proPens) KAPALI kalır —
   *    her çizgide ışık/gölge/gradyan üreten en ağır mod olduğundan zayıf
   *    donanımda kare düşürüp çizim/silme kaçırmalarına yol açabiliyor.
   *    Uygulamanın kendi 'change' işleyicileri üzerinden etkinleştirilir.
   * ------------------------------------------------------------------------- */
  function setToggle(id, on) {
    var el = document.getElementById(id);
    if (el && !!el.checked !== !!on) {
      el.checked = !!on;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  function boostPens() {
    try {
      // İlk kurulum: yalnızca güvenli iki modu aç.
      if (!localStorage.getItem("notis_pro_penboost")) {
        setToggle("oUltraInk", true);
        setToggle("oPlus", true);
        localStorage.setItem("notis_pro_penboost", "1");
      }
      // v2 geçişi: önceki sürümde açılmış olabilecek Pro Kalem Modu'nu bir defaya
      // mahsus kapat (kullanıcı isteği). Sonrasında kullanıcının tercihine karışmaz.
      if (!localStorage.getItem("notis_pro_penboost_v2")) {
        setToggle("oProPens", false);
        localStorage.setItem("notis_pro_penboost_v2", "1");
      }
    } catch (_) {}
  }
  function whenReady(fn) {
    if (document.readyState !== "loading") setTimeout(fn, 450);
    else document.addEventListener("DOMContentLoaded", function () { setTimeout(fn, 450); });
  }
  whenReady(boostPens);
})();
