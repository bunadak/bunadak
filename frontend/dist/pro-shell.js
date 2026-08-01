/* =============================================================================
 * Notis PRO — Masaüstü Kabuğu Entegrasyonu + Kalem Kalitesi
 *
 * notis.js'ten SONRA yüklenir. Çizim motorunu değiştirmez; yalnızca WebView2
 * ortamında tarayıcı API'lerinin çalışmadığı iki noktayı Wails runtime'ına
 * bağlar (tam ekran, çıkış) ve kalem ayarlarını bir defaya mahsus native
 * (16_2) varsayılanlarına döndürür.
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
   * 3) NATIVE ÇİZİM — çizim motoru artık kullanıcının "doğru çizebildiğim" dediği
   *    sürümün (16_2) birebir motorudur. Bu yüzden önceki sürümlerde bizim
   *    açtığımız kalem "boost"larını (Ultra Netlik / Pro Plus / Living Ink ve
   *    yükseltilmiş yumuşatma) BİR DEFAYA MAHSUS geri alıp motoru kendi native
   *    varsayılanlarına döndürüyoruz. Böylece o sürümün çizim hissi aynen gelir.
   *    Sonrasında kullanıcının Ayarlar'dan yaptığı hiçbir tercihe karışılmaz.
   * ------------------------------------------------------------------------- */
  function setToggle(id, on) {
    var el = document.getElementById(id);
    if (el && !!el.checked !== !!on) {
      el.checked = !!on;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  function setSlider(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function proInkSetup() {
    try {
      if (localStorage.getItem("notis_proink_v1")) return;
      // Yeni "smooth ink" motoru drawStroke içinde tüm serbest kalemlere zaten
      // uygulanıyor. Ultra Netlik + Pro Kalem opsiyonlarını da bu geliştirmeye
      // uyarlayarak varsayılan açıyoruz (ikisi de yumuşatılmış noktalar üzerine
      // çiziyor → en temiz + karakterli sonuç). Kullanıcı Ayarlar › Opsiyonlar'dan
      // kapatabilir; sonrasında tercihe karışılmaz.
      /* ARTIK ZORLA AÇILMIYOR. İkisi de tuvali süper-örnekliyor (applyDPR) —
         2560×1440 ekranda iki tuval ~470 MB VRAM demek. Dahili grafikli
         makinelerde ilk açılışta bile takılma yaratıyordu. Kullanıcı isterse
         Ayarlar › Opsiyonlar'dan açar; ayrıca açılışta gerçek bir kare-süresi
         ölçümü yapılıp yavaş donanımda "Performans modu" önerilir. */
      localStorage.setItem("notis_proink_v1", "1");
    } catch (_) {}
  }
  function whenReady(fn) {
    if (document.readyState !== "loading") setTimeout(fn, 450);
    else document.addEventListener("DOMContentLoaded", function () { setTimeout(fn, 450); });
  }
  whenReady(proInkSetup);
})();
