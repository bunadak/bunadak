/* ============================================================================
   KALDIĞIN YERDEN DEVAM
   ----------------------------------------------------------------------------
   Uygulama zaten çalışmayı arka planda kütüphaneye kaydediyordu; ama her
   açılışta yeni bir oturum kimliği üretip boş tahtayla başlıyordu. Yani
   çizdiklerin duruyordu, sen onları elle bulmak zorundaydın.

   Bu katman, kapanış anındaki durumu (hangi çalışma, hangi sayfa, hangi
   yakınlaştırma ve kaydırma, hangi kalem ve renk, yan panel açık mıydı ve
   hangi sekmedeydi) saklar ve bir sonraki açılışta aynen geri kurar.

   Güvenlik ağı: geri yükleme tamamen korumalıdır. Kayıt bozuksa, kütüphane
   yanıt vermezse ya da bu sırada bir hata olursa uygulama boş tahtayla
   normal şekilde açılmaya devam eder — açılış hiçbir koşulda kilitlenmez.
   ========================================================================= */
(function () {
  'use strict';
  const LSK = 'notis_sess1', OPT = 'notis_resume';
  const on = () => { try { return localStorage.getItem(OPT) !== '0' } catch (_) { return true } };
  const setOn = v => { try { localStorage.setItem(OPT, v ? '1' : '0') } catch (_) { } };

  let ready = false;          // geri yükleme bitmeden anlık görüntü alınmaz

  function snap() {
    if (!ready || !on()) return;
    try {
      const st = {
        id: (window.LIB && LIB.currentId) ? LIB.currentId() : null,
        page: (typeof cur !== 'undefined') ? cur : 0,
        view: (typeof view !== 'undefined' && view) ? { x: view.x, y: view.y, s: view.s } : null,
        tool: (typeof tool !== 'undefined') ? tool : null,
        pen: (typeof selPen !== 'undefined') ? selPen : null,
        color: (typeof penColor !== 'undefined') ? penColor : null,
        side: document.body.classList.contains('side-open'),
        tab: (document.querySelector('#sideTabs .stab.on') || {}).dataset
          ? document.querySelector('#sideTabs .stab.on').dataset.p : null,
        at: Date.now(),
      };
      localStorage.setItem(LSK, JSON.stringify(st));
    } catch (_) { }
  }

  function read() { try { return JSON.parse(localStorage.getItem(LSK) || 'null') } catch (_) { return null } }

  async function restore() {
    if (!on()) return;
    const st = read(); if (!st) return;
    /* 1) Çalışmayı aç — yalnız kütüphanede gerçekten duruyorsa. */
    if (st.id && window.LIB && LIB.all && LIB.openWork) {
      try {
        const metas = await Promise.race([
          Promise.resolve(LIB.all()),
          new Promise(r => setTimeout(() => r(null), 4000)),
        ]);
        if (metas && metas.some && metas.some(m => m && m.id === st.id)) {
          await Promise.race([
            Promise.resolve(LIB.openWork(st.id)),
            new Promise(r => setTimeout(r, 8000)),
          ]);
        }
      } catch (_) { }
    }
    /* 2) Görünümü ve araçları geri kur — her adım ayrı korumalı, biri
          tutmazsa diğerleri yine de uygulanır. */
    try { if (st.pen && typeof pkApply === 'function') pkApply(st.pen); } catch (_) { }
    try { if (st.tool && typeof setTool === 'function' && (!st.pen || st.tool !== 'smart')) setTool(st.tool); } catch (_) { }
    try { if (st.color && typeof penColor !== 'undefined') { penColor = st.color; if (typeof buildSwatches === 'function') buildSwatches() } } catch (_) { }
    try {
      if (st.page != null && typeof doc !== 'undefined' && doc && doc.pages &&
          st.page >= 0 && st.page < doc.pages.length && typeof gotoPage === 'function') gotoPage(st.page);
    } catch (_) { }
    /* Görünüm BİRKAÇ KEZ pekiştirilir: kayıt açıldıktan ve sayfa
       değiştirildikten sonra motor kendiliğinden bir "sığdır" çalıştırıp
       yakınlaştırmayı eziyordu. Tek seferlik atama bu yüzden tutmuyordu. */
    const putView = () => {
      try {
        if (!st.view || typeof view === 'undefined' || !view) return;
        if (!isFinite(st.view.s) || st.view.s <= 0) return;
        view.x = st.view.x; view.y = st.view.y; view.s = st.view.s;
        if (typeof viewFitted !== 'undefined') viewFitted = false;
        const z = document.getElementById('zoomLbl'); if (z) z.textContent = Math.round(view.s * 100) + '%';
        if (typeof redraw === 'function') redraw();
      } catch (_) { }
    };
    putView();
    for (const ms of [120, 350, 800]) setTimeout(putView, ms);
    await new Promise(r => setTimeout(r, 900));
    try {
      if (st.side && !document.body.classList.contains('side-open')) {
        const b = document.getElementById('sideBtn'); if (b) b.click();
      }
      if (st.tab) { const t = document.querySelector('#sideTabs .stab[data-p="' + st.tab + '"]'); if (t) t.click() }
    } catch (_) { }
  }

  /* --- ayar satırı: Uygulama Ayarları altında --- */
  function buildOpt() {
    const host = document.getElementById('sp-app');
    if (!host || document.getElementById('oResume')) return;
    const sec = document.createElement('div');
    sec.className = 'pkx-sec';
    sec.innerHTML = 'Oturum<span class="pkx-sub">uygulama kapandığı gibi açılsın</span>';
    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = '<div><div class="t">↩️ Kaldığın yerden devam et</div>' +
      '<div class="d">Uygulamayı kapattığın andaki çalışman, sayfan, yakınlaştırman, kalemin ve rengin ' +
      'bir sonraki açılışta aynen geri gelir. Kapatırsan uygulama her zaman boş tahtayla başlar.</div></div>' +
      '<label class="sw-toggle"><input type="checkbox" id="oResume"><i></i></label>';
    const notif = document.getElementById('appNotify');
    if (notif && notif.parentNode) { notif.parentNode.insertBefore(sec, notif); notif.parentNode.insertBefore(row, notif) }
    else { host.appendChild(sec); host.appendChild(row) }
    const i = document.getElementById('oResume');
    i.checked = on();
    i.addEventListener('change', () => {
      setOn(i.checked);
      if (!i.checked) { try { localStorage.removeItem(LSK) } catch (_) { } }
      else snap();
      try { if (typeof toast === 'function') toast(i.checked ? 'Kaldığın yerden devam açık ↩️' : 'Her açılışta boş tahta') } catch (_) { }
    });
  }

  function init() {
    buildOpt();
    /* Açılış hazır olduktan SONRA geri yükle: tuval ölçülmüş, kütüphane
       bağlanmış ve açılış efekti bitmiş olmalı. */
    setTimeout(() => {
      restore().catch(() => { }).then(() => {
        ready = true; snap();
      });
    }, 1200);
    // durumu düzenli ve kapanışta sakla
    setInterval(snap, 8000);
    window.addEventListener('beforeunload', snap);
    document.addEventListener('visibilitychange', () => { if (document.hidden) snap() });
    for (const ev of ['pointerup', 'keyup']) window.addEventListener(ev, () => {
      clearTimeout(init.__t); init.__t = setTimeout(snap, 1500);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.proSession = { snap, restore, read, enabled: on };
})();
