/* ============================================================================
   KALEM STÜDYOSU v3.3 — HAZIR UÇLAR
   ----------------------------------------------------------------------------
   Referans uygulamalarda "fırça koleksiyonu" küçük resimleri sabit PNG'dir:
   gösterdikleri çizgiyle senin kalemin arasında hiçbir bağ yoktur.
   Burada her küçük resim, O ANKİ kalemle ve o ön ayarın gerçek değerleriyle,
   uygulamanın KENDİ çizim motorundan geçirilerek çizilir. Yani gördüğün şey
   tam olarak elde edeceğin şeydir — temsilî değil, birebir.

   Ön ayarlar kalemi DEĞİŞTİRMEZ, kalemin ucunu değiştirir: seçili kalem
   tükenmezse tükenmez kalır, yalnız kalınlık/basınç/opaklık/akış/stabilizasyon
   /uç yapısı o profile geçer. Böylece beş kalemin her biri için aynı sekiz
   profil anlamlı sonuç verir.
   ========================================================================= */
(function () {
  'use strict';
  const $1 = s => document.querySelector(s);

  /* Fabrika kalınlıkları — DEF kullanıcı tarafından değiştirilebildiği için
     ön ayar çarpanları bu sabit tabana uygulanır. */
  const BASE_SIZE = { smart: 2.2, ball: 2.2, fountain: 2.4, pencil: 2.2, hl: 18 };

  /* k: fabrika kalınlığının çarpanı · diğerleri kalem kartı alanlarıyla birebir */
  const PRESETS = [
    { id: 'ince',   n: 'İnce Çizgi',  sb: 'not, dipnot',   k: .55, press: 40,  op: 1,   flow: 100, stab: 2, nib: 1 },
    { id: 'murek',  n: 'Mürekkep',    sb: 'günlük yazı',   k: 1,   press: 95,  op: 1,   flow: 95,  stab: 2, nib: 0 },
    { id: 'kalig',  n: 'Kaligrafi',   sb: 'keski uç',      k: 1.5, press: 100, op: 1,   flow: 92,  stab: 2, nib: 3 },
    { id: 'eskiz',  n: 'Eskiz',       sb: 'serbest el',    k: .9,  press: 70,  op: .78, flow: 72,  stab: 0, nib: 0 },
    { id: 'roman',  n: 'Çizgi Roman', sb: 'dolgun, net',   k: 2,   press: 25,  op: 1,   flow: 100, stab: 3, nib: 2 },
    { id: 'imza',   n: 'İmza',        sb: 'ince uç, canlı', k: .8, press: 100, op: 1,   flow: 98,  stab: 1, nib: 0 },
    { id: 'marker', n: 'Marker',      sb: 'geniş, yumuşak', k: 3.2, press: 0,  op: .65, flow: 100, stab: 2, nib: 2 },
    { id: 'fab',    n: 'Fabrika',     sb: 'bu kalemin aslı', factory: true },
  ];

  /* --- bu kalemin fabrika değerleri --- */
  function factoryOf(id) {
    const base = (typeof pkBase === 'function') ? pkBase(id) : 'ball';
    const f = (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[id]) ? PK_FACTORY[id]
            : (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[base]) ? PK_FACTORY[base] : null;
    if (!f) return null;
    return { size: BASE_SIZE[base] ?? 2.2, press: f.press, op: f.op, flow: f.flow, stab: f.stab, nib: f.nib };
  }

  /* Ön ayarın seçili kaleme uygulanmış somut değerleri */
  function valuesOf(ps, id) {
    if (ps.factory) return factoryOf(id);
    const base = (typeof pkBase === 'function') ? pkBase(id) : 'ball';
    const sz = Math.round(Math.max(.5, Math.min(40, (BASE_SIZE[base] ?? 2.2) * ps.k)) * 10) / 10;
    return { size: sz, press: ps.press, op: ps.op, flow: ps.flow, stab: ps.stab, nib: ps.nib };
  }

  /* --- küçük resim yolu: dairenin içine oturan akıcı bir kıvrım --- */
  function demoPath(S) {
    const pts = [], N = 72, pad = S * .17;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      pts.push({
        x: pad + t * (S - pad * 2),
        y: S * .5 + Math.sin(t * Math.PI * 1.85 - .5) * S * .235,
        p: .22 + .72 * Math.sin(t * Math.PI),       // basınç kemeri
        t: i * 12,
      });
    }
    return pts;
  }

  /* Küçük resmi GERÇEK motorla çiz: kalem kartını geçici olarak ön ayara
     kurar, uygulamanın kendi pkBuildStroke + drawStroke yolundan geçirir,
     sonra kartı aynen geri verir. Böylece önizleme ile sonuç ayrışamaz. */
  function paint(cv, ps) {
    const id = (typeof selPen !== 'undefined') ? selPen : 'smart';
    const cfg = (typeof pkCfg === 'function') ? pkCfg(id) : null;
    const v = valuesOf(ps, id);
    if (!cv || !cfg || !v || typeof pkBuildStroke !== 'function' || typeof drawStroke !== 'function') return;

    const D = Math.min(2, window.devicePixelRatio || 1) * 2;   // küçük resim de net taranır
    const S = 84;
    if (cv.width !== Math.round(S * D)) { cv.width = Math.round(S * D); cv.height = Math.round(S * D) }
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(D, 0, 0, D, 0, 0);

    // kart durumunu yedekle
    const keep = { press: cfg.press, op: cfg.op, flow: cfg.flow, stab: cfg.stab, nib: cfg.nib };
    const keepSize = (typeof pkSizeOf === 'function') ? pkSizeOf(id) : 2.2;
    const iz = (typeof INK !== 'undefined') ? INK.z : 1, iq = (typeof INK !== 'undefined') ? INK.q : 1;
    try {
      cfg.press = v.press; cfg.op = v.op; cfg.flow = v.flow; cfg.stab = v.stab; cfg.nib = v.nib;
      if (typeof pkSetSize === 'function') pkSetSize(id, v.size);
      if (typeof INK !== 'undefined') { INK.z = 1; INK.q = D }
      const o = pkBuildStroke(demoPath(S));
      drawStroke(g, o);
    } catch (_) { /* tek bir küçük resim çizilemezse panel çalışmaya devam eder */ }
    finally {
      cfg.press = keep.press; cfg.op = keep.op; cfg.flow = keep.flow; cfg.stab = keep.stab; cfg.nib = keep.nib;
      if (typeof pkSetSize === 'function') pkSetSize(id, keepSize);
      if (typeof INK !== 'undefined') { INK.z = iz; INK.q = iq }
    }
  }

  /* Seçili kalem şu an hangi ön ayarda? (tam eşleşme) */
  function activeId() {
    const id = (typeof selPen !== 'undefined') ? selPen : 'smart';
    const cfg = (typeof pkCfg === 'function') ? pkCfg(id) : null; if (!cfg) return null;
    const sz = (typeof pkSizeOf === 'function') ? pkSizeOf(id) : 2.2;
    for (const ps of PRESETS) {
      const v = valuesOf(ps, id); if (!v) continue;
      if (Math.abs(v.size - sz) < .05 && v.press === (cfg.press ?? 80) &&
          Math.abs(v.op - (cfg.op ?? 1)) < .005 && v.flow === (cfg.flow ?? 95) &&
          v.stab === (cfg.stab ?? 2) && v.nib === (cfg.nib ?? 1)) return ps.id;
    }
    return null;
  }

  function apply(ps) {
    const id = (typeof selPen !== 'undefined') ? selPen : 'smart';
    const cfg = (typeof pkCfg === 'function') ? pkCfg(id) : null;
    const v = valuesOf(ps, id); if (!cfg || !v) return;
    cfg.press = v.press; cfg.op = v.op; cfg.flow = v.flow; cfg.stab = v.stab; cfg.nib = v.nib;
    if (typeof pkSetSize === 'function') pkSetSize(id, v.size);
    try { if (typeof savePK === 'function') savePK() } catch (_) { }
    try { if (typeof syncPenUI === 'function') syncPenUI() } catch (_) { }
    try { if (typeof pkLiveSync === 'function') pkLiveSync() } catch (_) { }
    try { if (typeof renderPenCards === 'function') renderPenCards() } catch (_) { }
    try { if (typeof pkRender === 'function') pkRender() } catch (_) { }
    try { if (typeof redraw === 'function') redraw() } catch (_) { }
    render();
    try { if (typeof toast === 'function') toast(ps.n + ' ucu uygulandı — ' + ((typeof pkNameOf === 'function') ? pkNameOf(id) : 'kalem')) } catch (_) { }
  }

  /* --- ızgarayı kur / tazele --- */
  let built = false;
  function build() {
    const host = $1('#pkPresets'); if (!host || built) return;
    host.innerHTML = '';
    for (const ps of PRESETS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pkx-pst'; b.dataset.p = ps.id; b.title = ps.n + ' — ' + ps.sb;
      const cv = document.createElement('canvas');
      b.appendChild(cv);
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = ps.n; b.appendChild(nm);
      const sb = document.createElement('div'); sb.className = 'sb'; sb.textContent = ps.sb; b.appendChild(sb);
      b.addEventListener('click', () => apply(ps));
      host.appendChild(b);
    }
    built = true;
  }

  function render() {
    const host = $1('#pkPresets'); if (!host) return;
    build();
    const act = activeId();
    for (const ps of PRESETS) {
      const b = host.querySelector('.pkx-pst[data-p="' + ps.id + '"]'); if (!b) continue;
      b.classList.toggle('on', ps.id === act);
      paint(b.querySelector('canvas'), ps);
    }
    const sub = $1('#pkPresetSub');
    if (sub && typeof pkNameOf === 'function') {
      try { sub.textContent = pkNameOf(selPen) + ' için — dokun, anında uygulanır' } catch (_) { }
    }
  }

  /* Kalem değişince ya da herhangi bir kaydıraç oynayınca küçük resimler
     yeniden çizilir; kare başına tek kez (rAF ile birleştirilir). */
  let pending = false;
  function schedule() {
    if (pending) return; pending = true;
    requestAnimationFrame(() => { pending = false; try { render() } catch (_) { } });
  }
  function wrap(name) {
    const f = window[name];
    if (typeof f !== 'function' || f.__pku) return;
    const w = function () { const r = f.apply(this, arguments); schedule(); return r };
    w.__pku = true; window[name] = w;
  }

  function init() {
    if (!$1('#pkPresets')) return;
    wrap('syncPenUI'); wrap('pkRender'); wrap('pkApply'); wrap('pkOnTool');
    render();
    /* Ayarlar penceresi açıldığında tazele — tuval boyutları ancak görünürken
       doğru ölçülür, gizliyken çizilen küçük resim boş kalırdı. */
    const dlg = document.getElementById('setDlg');
    if (dlg && !dlg.__pku) {
      dlg.__pku = true;
      new MutationObserver(() => { if (dlg.open) schedule() }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    }
    const tab = document.querySelector('.set-nav [data-p="pens"], #setDlg [data-p="pens"]');
    if (tab) tab.addEventListener('click', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.proPenUI = { render, PRESETS, valuesOf };
})();
