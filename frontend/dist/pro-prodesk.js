/* ============================================================================
   PRO ARAYÜZ — GERÇEK YETENEKLER
   ----------------------------------------------------------------------------
   "Pro Arayüz" bölümündeki altı anahtarın hepsi gövdeye bir sınıf ekleyip
   kenar, yazı ağırlığı ya da bulanıklık değiştiriyordu. Hepsi çalışıyordu
   ama hiçbiri bir YETENEK değildi: görünüm inceliğiydi. "Pro" başlığı altında
   bir kullanıcının beklediği şey, uygulamanın onsuz yapamadığı bir şeyi
   yapabilmesidir.

   Bu katman üç gerçek yetenek ekler ve kozmetik olanları dürüst bir başlık
   altına ayırır:

     1) ARAYÜZ ÖLÇEĞİ (%85–%130) — araç rayı, üst panel, simgeler ve yazılar
        birlikte ölçeklenir. 4K ekranda arayüz minicik kalıyordu, küçük
        dizüstünde ise tuvali yiyordu. Çalışma alanı ölçekten etkilenmez:
        ızgara değiştiği için motor tuvali yeniden ölçer.

     2) PENCERE HER ZAMAN ÜSTTE — tahta başka bir uygulamanın üstünde durur;
        tarayıcıya, sunuma ya da bir videoya üstünden çizebilirsin. Masaüstü
        yeteneğidir, Go tarafına eklenen SetAlwaysOnTop ile yapılır.

     3) PENCERE ÇERÇEVESİ HATIRLANIR — uygulamayı hangi konum ve boyutta
        kapattıysan bir sonraki açılışta aynı çerçevede açılır.

   2 ve 3 yalnız masaüstü gövdesinde çalışır; tarayıcıda satır görünür ama
   "yalnız uygulamada" olarak işaretlenir — var olmayan bir şeyi varmış gibi
   göstermek bu bölümün asıl sorunuydu.
   ========================================================================= */
(function () {
  'use strict';
  const KS = 'notis_uiscale', KT = 'notis_ontop', KB = 'notis_winbox', KBON = 'notis_winbox_on';
  const $i = (x) => document.getElementById(x);
  const api = () => { try { return window.go && window.go.main && window.go.main.App } catch (_) { return null } };
  const masaustu = () => !!(api() && api().SetAlwaysOnTop);

  /* ------------------------------------------------- 1) ARAYÜZ ÖLÇEĞİ */
  let st = null;
  function oku() { const v = +(localStorage.getItem(KS) || 100); return (v >= 85 && v <= 130) ? v : 100 }
  function olcek(yuzde) {
    const k = Math.max(85, Math.min(130, yuzde | 0)) / 100;
    if (!st) { st = document.createElement('style'); st.id = 'proUiScale'; document.head.appendChild(st) }
    if (k === 1) { st.textContent = ''; }
    else {
      const R = (n) => Math.round(n * k);
      /* Izgara ölçüleri notis.css'teki kabuk bloğuyla aynı tabandan türetilir;
         html öneki, body.compact ile eşit özgüllükte çakışmayı önler. */
      st.textContent =
        'html body{grid-template-columns:' + R(69) + 'px 1fr auto;grid-template-rows:' + R(76) + 'px 1fr;' +
        '--fl-gap:' + R(11) + 'px;--fl-r:' + R(16) + 'px}' +
        'html body.compact{grid-template-columns:' + R(55) + 'px 1fr auto;grid-template-rows:' + R(60) + 'px 1fr;' +
        '--fl-gap:' + R(9) + 'px;--fl-r:' + R(14) + 'px}' +
        /* body.compact .rtool notis.css'te 34/32 veriyor; eşit özgüllükte
           kalmamak için hem genel hem compact biçim ayrı ayrı yazılır. */
        'html body .rtool{width:' + R(42) + 'px;height:' + R(39) + 'px;border-radius:' + R(11) + 'px}' +
        'html body.compact .rtool{width:' + R(34) + 'px;height:' + R(32) + 'px;border-radius:' + R(9) + 'px}' +
        'html body .rtool svg{width:' + R(22) + 'px;height:' + R(22) + 'px}' +
        'html body .tbtn{width:' + R(32) + 'px;height:' + R(31) + 'px;border-radius:' + R(9) + 'px}' +
        'html body .tbtn svg{width:' + R(18) + 'px;height:' + R(18) + 'px}' +
        '#topbar{font-size:' + (13 * k).toFixed(2) + 'px}' +
        '#toolName{font-size:' + (12.5 * k).toFixed(2) + 'px}' +
        '.cta{font-size:' + (12 * k).toFixed(2) + 'px;padding:' + R(7) + 'px ' + R(13) + 'px}';
    }
    /* Izgara değişimi window resize olayı doğurmaz: tuval elle yenilenir. */
    try { resize() } catch (_) { }
    try { if (typeof fitSmart === 'function') fitSmart(); else if (typeof fit === 'function') fit() } catch (_) { }
    const o = $i('oScaleOut'); if (o) o.textContent = '%' + Math.round(k * 100) + (k === 1 ? ' — fabrika ayarı' : '');
  }

  /* --------------------------------------------- 2) HER ZAMAN ÜSTTE */
  function ontop(v) {
    try { localStorage.setItem(KT, v ? '1' : '0') } catch (_) { }
    const A = api(); if (A && A.SetAlwaysOnTop) { try { A.SetAlwaysOnTop(!!v) } catch (_) { } }
  }

  /* ------------------------------------- 3) PENCERE ÇERÇEVESİ HAFIZASI */
  function boxOn() { try { return localStorage.getItem(KBON) === '1' } catch (_) { return false } }
  function boxSave() {
    if (!boxOn()) return;
    const A = api(); if (!A || !A.GetWindowBox) return;
    Promise.resolve(A.GetWindowBox()).then(b => {
      if (!b || !(b.w > 0) || !(b.h > 0)) return;
      try { localStorage.setItem(KB, JSON.stringify(b)) } catch (_) { }
    }).catch(() => { });
  }
  function boxRestore() {
    if (!boxOn()) return;
    const A = api(); if (!A || !A.SetWindowBox) return;
    let b = null; try { b = JSON.parse(localStorage.getItem(KB) || 'null') } catch (_) { }
    if (!b || !(b.w >= 480) || !(b.h >= 360)) return;
    try { A.SetWindowBox(b.x | 0, b.y | 0, b.w | 0, b.h | 0) } catch (_) { }
  }

  /* ------------------------------------------------------------- ARAYÜZ */
  function el(h) { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild }
  const YALNIZ = '<span style="opacity:.7"> · yalnız uygulamada</span>';

  function kur() {
    const ui = $i('sp-ui');
    if (!ui || $i('oScale')) return;

    const sec = el('<div class="pkx-sec">Pro Arayüz<span class="pkx-sub">uygulamanın onsuz yapamadığı şeyler</span></div>');

    const rowScale = el('<div class="set-row"><div><div class="t">🔎 Arayüz Ölçeği</div>' +
      '<div class="d">Araç rayı, üst panel, simgeler ve yazılar birlikte ölçeklenir. 4K ekranda arayüz ' +
      'fazla küçük, küçük dizüstünde fazla iri kalıyordu; burada kendine göre ayarlarsın. ' +
      'Çalışma alanı daralıp genişler ama çizimlerin ölçeği değişmez — tuval yeniden ölçülür.</div>' +
      '<div class="d" id="oScaleOut" style="margin-top:6px;opacity:.85"></div></div>' +
      '<input type="range" id="oScale" min="85" max="130" step="5"></div>');

    const rowTop = el('<div class="set-row"><div><div class="t">📌 Pencere Her Zaman Üstte</div>' +
      '<div class="d">Tahta diğer bütün pencerelerin üstünde durur: tarayıcıya, bir sunuma ya da videoya ' +
      'üstünden çizebilirsin, arkadaki uygulama görünmeye devam eder.' + (masaustu() ? '' : YALNIZ) +
      '</div></div><label class="sw-toggle"><input type="checkbox" id="oOnTop"><i></i></label></div>');

    const rowBox = el('<div class="set-row"><div><div class="t">🪟 Pencere Çerçevesini Hatırla</div>' +
      '<div class="d">Uygulamayı hangi konumda ve boyutta kapattıysan bir sonraki açılışta aynı ' +
      'çerçevede açılır. Çift ekranlı kurulumlarda tahtayı her seferinde yeniden yerleştirmekten kurtarır.' +
      (masaustu() ? '' : YALNIZ) + '</div></div>' +
      '<label class="sw-toggle"><input type="checkbox" id="oWinBox"><i></i></label></div>');

    /* Kozmetik anahtarların başlığı dürüstleşsin: bunlar yetenek değil,
       görünüm inceliğidir. Pro Arayüz bölümü onların ÜSTÜNE girer. */
    const eskiSec = Array.from(ui.querySelectorAll('.pkx-sec, .set-sec-t'))
      .find(x => /^\s*Pro Arayüz/.test(x.textContent));
    if (eskiSec) {
      eskiSec.innerHTML = 'Görünüm İnceliği<span class="pkx-sub">kayıt ve sunum için ince dokunuşlar</span>';
      ui.insertBefore(rowBox, eskiSec); ui.insertBefore(rowTop, eskiSec);
      ui.insertBefore(rowScale, eskiSec); ui.insertBefore(sec, eskiSec);
    } else {
      ui.appendChild(sec); ui.appendChild(rowScale); ui.appendChild(rowTop); ui.appendChild(rowBox);
    }

    const sc = $i('oScale');
    sc.value = oku();
    sc.addEventListener('input', () => olcek(+sc.value));
    sc.addEventListener('change', () => {
      try { localStorage.setItem(KS, String(+sc.value)) } catch (_) { }
      try { if (typeof toast === 'function') toast('Arayüz ölçeği %' + sc.value) } catch (_) { }
    });

    const ot = $i('oOnTop');
    ot.checked = (() => { try { return localStorage.getItem(KT) === '1' } catch (_) { return false } })();
    ot.disabled = !masaustu();
    ot.addEventListener('change', () => {
      ontop(ot.checked);
      try { if (typeof toast === 'function') toast(ot.checked ? 'Pencere her zaman üstte 📌' : 'Pencere normal sıraya döndü') } catch (_) { }
    });

    const wb = $i('oWinBox');
    wb.checked = boxOn();
    wb.disabled = !masaustu();
    wb.addEventListener('change', () => {
      try { localStorage.setItem(KBON, wb.checked ? '1' : '0') } catch (_) { }
      if (wb.checked) boxSave();
      try { if (typeof toast === 'function') toast(wb.checked ? 'Pencere çerçevesi hatırlanacak 🪟' : 'Pencere çerçevesi hatırlanmayacak') } catch (_) { }
    });
  }

  function boot() {
    kur();
    olcek(oku());
    /* Kayıtlı durumlar uygulanır. Çerçeve, pencere ölçülebilir hâle geldikten
       sonra geri verilir; açılış anında ölçüler henüz oturmamış olabilir. */
    try { if (localStorage.getItem(KT) === '1') ontop(true) } catch (_) { }
    setTimeout(boxRestore, 500);
    setInterval(boxSave, 10000);
    window.addEventListener('beforeunload', boxSave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) boxSave() });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 820));
  else setTimeout(boot, 820);

  window.proDesk = { scale: olcek, scaleValue: oku, ontop, boxSave, boxRestore, desktop: masaustu };
})();
