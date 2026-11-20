/* ============================================================================
   KUSURSUZ ÇİZGİ — tüm kalemler için tek anahtar
   ----------------------------------------------------------------------------
   Tırtık ve titreme tek bir sebepten gelmiyor; üç ayrı yerden geliyor ve
   üçünü birden kapatmadan "hiçbir şekilde tırtıklanmasın" olmuyor:

     1) EĞRİLİK GÜRÜLTÜSÜ — elin doğal titremesi çizginin YÖN açısında
        yüksek frekanslı salınım bırakır. Konum alanında yumuşatma bunu tam
        silmez (ve çizgiyi kısaltır). Motor bu anahtar açıkken açı alanında
        düzleme (inkFair) uygular: kiriş uzunlukları ve iki uç nokta aynen
        korunur, yalnız eğrilik gürültüsü gider.

     2) ÇOKGEN KABALIĞI — çizgi ekrana çokgen olarak taranır. Yakınlaştıkça
        bir kirişin kapladığı piksel sayısı artar, yani aynı çizgi büyüdükçe
        köşeli görünmeye başlar. Motor kiriş hedefini yakınlaştırmaya göre
        hesaplıyor ama uzun çizgilerde nokta bütçesi (9000) ve geçiş üst
        sınırı (7) devreye girip inceltmeyi kesiyordu. Bu anahtar bütçeyi
        40000'e, üst sınırı 9'a çıkarır: yakınlaştırmada da kiriş hedefi
        tutulur.

     3) TARAMA ÇÖZÜNÜRLÜĞÜ — kenar yumuşatma piksel ızgarasına bağlıdır.
        Anahtar, mürekkep kalitesini Ultra'ya alır.

   Bunlara ek olarak titreme giderme (SILK) en yüksek seviyeye (ultra)
   çekilir. Anahtar kapatıldığında her ayar, açılmadan önceki hâline aynen
   geri döner — hiçbir seçim kalıcı olarak değiştirilmez.

   Maliyeti dürüstçe: daha fazla nokta ve daha yüksek tarama çözünürlüğü
   demek. Çok uzun çizgilerin yeniden çizimi bir miktar ağırlaşır; bu yüzden
   fabrika ayarı KAPALI ve seçim kullanıcıya bırakılmıştır.
   ========================================================================= */
(function () {
  'use strict';
  const KEY = 'notis_perfect';
  const $id = (x) => document.getElementById(x);

  /* Anahtar açılmadan önceki durum — kapatınca birebir geri verilir */
  let onceki = null;

  function on() { try { return localStorage.getItem(KEY) === '1' } catch (_) { return false } }
  function setStored(v) { try { localStorage.setItem(KEY, v ? '1' : '0') } catch (_) { } }

  function uygula(acik, ilk) {
    if (acik) {
      if (!onceki) {
        onceki = {
          budget: (typeof INK_BUDGET !== 'undefined') ? INK_BUDGET : 9000,
          kmax: (typeof INK_KMAX !== 'undefined') ? INK_KMAX : 7,
          inkQ: (typeof S !== 'undefined' && S) ? S.inkQ : 1,
          silkOn: true, silkLv: 'balanced',
        };
        try { const o = window.proSilk && window.proSilk.opts(); if (o) { onceki.silkOn = !!o.on; onceki.silkLv = o.level } } catch (_) { }
      }
      try { INK_BUDGET = 40000; INK_KMAX = 9; INK_PERFECT = true } catch (_) { }
      try { if (window.proSilk) { window.proSilk.setOn(true); window.proSilk.setLevel('ultra') } } catch (_) { }
      try {
        if (typeof S !== 'undefined' && S && S.inkQ !== 2) {
          S.inkQ = 2; S.ultraInk = true;
          if (typeof saveOpts === 'function') saveOpts();
          if (typeof syncInkQ === 'function') syncInkQ();
          if (typeof applyDPR === 'function') applyDPR();
        }
      } catch (_) { }
    } else {
      try { INK_PERFECT = false } catch (_) { }
      if (onceki) {
        try { INK_BUDGET = onceki.budget; INK_KMAX = onceki.kmax } catch (_) { }
        try { if (window.proSilk) { window.proSilk.setOn(onceki.silkOn); window.proSilk.setLevel(onceki.silkLv) } } catch (_) { }
        try {
          if (typeof S !== 'undefined' && S && S.inkQ !== onceki.inkQ) {
            S.inkQ = onceki.inkQ; S.ultraInk = (onceki.inkQ === 2);
            if (typeof saveOpts === 'function') saveOpts();
            if (typeof syncInkQ === 'function') syncInkQ();
            if (typeof applyDPR === 'function') applyDPR();
          }
        } catch (_) { }
        onceki = null;
      }
    }
    /* Mevcut çizimler de yeni ayarla yeniden taranır — fark hemen görünür */
    if (!ilk) { try { redraw() } catch (_) { } }
    const s = $id('oPerfectSt');
    if (s) s.textContent = acik
      ? 'Açık — açı düzleme, 40000 nokta bütçesi, 9 geçiş, Ultra tarama, SILK ultra'
      : 'Kapalı — motor kendi ayarlarınla çalışır';
  }

  function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild }

  function kur() {
    const host = $id('sp-draw');
    if (!host || $id('oPerfect')) return;
    const sec = el('<div class="pkx-sec">Kusursuz Çizgi<span class="pkx-sub">tüm kalemlerde geçerli</span></div>');
    const row = el('<div class="set-row"><div><div class="t">💎 Kusursuz Çizgi</div>' +
      '<div class="d">Açınca çizimler hiçbir yakınlaştırma düzeyinde titremez ve tırtıklanmaz: ' +
      'eğrilik gürültüsü açı alanında düzlenir, kiriş hedefi yakınlaştırmada da tutulur ' +
      '(nokta bütçesi 40000, geçiş sınırı 9), tarama Ultra kaliteye ve titreme giderme ' +
      'en yüksek seviyeye çıkar. Tüm kalemler için geçerlidir ve kalemlerin karakterini ' +
      'değiştirmez. Kapatınca bütün ayarlar açmadan önceki hâline döner. ' +
      'Karşılığında çok uzun çizgilerin yeniden çizimi bir miktar ağırlaşır.</div>' +
      '<div class="d" id="oPerfectSt" style="margin-top:6px;opacity:.8"></div></div>' +
      '<label class="sw-toggle"><input type="checkbox" id="oPerfect"><i></i></label>');
    /* SILK bölümünün hemen üstüne: ikisi aynı konuya ait */
    const silk = $id('oSilk');
    const anchor = silk ? silk.closest('.set-row') : null;
    const sref = anchor ? (anchor.previousElementSibling && anchor.previousElementSibling.classList.contains('pkx-sec')
      ? anchor.previousElementSibling : anchor) : null;
    if (sref && sref.parentNode) { sref.parentNode.insertBefore(sec, sref); sref.parentNode.insertBefore(row, sref) }
    else { host.appendChild(sec); host.appendChild(row) }

    const i = $id('oPerfect');
    i.checked = on();
    i.addEventListener('change', () => {
      setStored(i.checked);
      uygula(i.checked, false);
      try { if (typeof toast === 'function') toast(i.checked ? 'Kusursuz Çizgi açık 💎' : 'Kusursuz Çizgi kapalı') } catch (_) { }
    });
    uygula(on(), true);
  }

  function boot() { kur(); uygula(on(), true) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 760));
  else setTimeout(boot, 760);

  window.proPerfect = { on: on, set: (v) => { setStored(v); const i = $id('oPerfect'); if (i) i.checked = !!v; uygula(!!v, false) } };
})();
