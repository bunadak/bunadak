/* ============================================================================
   KALEM PANELİ — v3.2
   ============================================================================
   Bu katman üç şey yapar; üçü de mevcut denetimleri BOZMADAN eklenir.

   1) RENK. Kullanıcının istediği dört temel ayardan biri (kalınlık, RENK,
      opaklık, basınç) panelde hiç yoktu. Artık her kalemin kendi rengi
      olabiliyor: kaleme geçince o renk seçiliyor. Varsayılanı "kapalı" —
      kapalıyken bugünkü davranış birebir korunur (üst çubuktaki renk geçerli).

   2) DÜRÜST ÖNİZLEME. Önizleme, gerçek kalem motorundan BAŞKA bir matematik
      kullanıyordu ve bu yüzden yalan söylüyordu:
        · yumuşatma geçişlerini stabilizasyon değerinden alıyordu
          (motor S.smooth'tan alır) → iki ayar birbirine karışıyordu
        · "dolgun" uçta kalınlığı 1.15 ile çarpıp drawStroke'un 1.18'inin
          üstüne biniyordu → önizleme gerçekten %15 şişmandı
        · "sivri" uçta inceltmeyi hem kendi hem drawStroke uyguluyordu
        · "keski" uçta basıncı sabitliyordu; motor yalnız uç biçimini değiştirir
        · sabitleyici (titreme azaltma) önizlemede HİÇ simüle edilmiyordu
      Artık önizleme gerçek hattı adım adım taklit ediyor:
        sabitleyici (EMA) → yumuşatma geçişleri → matisInk/snapStraighten
        → drawStroke
      Demo çizgisine gerçek el titremesi eklendi; titremesiz bir eğride
      "titreme azaltma" ayarının etkisi zaten görünmezdi.

   3) FABRİKA KARŞILAŞTIRMASI. Aynı el hareketi üstte fabrika ayarıyla,
      altta senin ayarınla çiziliyor; altında hangi ayarın ne kadar
      değiştiği yazıyor. Üst üste bindirmek işe yaramıyor — kalın çizgi
      inceyi tamamen örtüyor ve fark görünmez oluyordu.

   KURAL: kalem motoruna (proInkSmooth · proInkPts · fillInkStroke ·
   commitStroke · inkFeed · drawStroke) tek satır dokunulmaz. Buradaki
   hiçbir ekleme fabrika ayarında çıktıyı değiştirmez.
============================================================================ */
(function () {
  if (window.__proPen) return; window.__proPen = true;
  const $1 = (s) => document.querySelector(s);
  const $$1 = (s) => Array.prototype.slice.call(document.querySelectorAll(s));
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  /* ---------------------------------------------------------------- RENK */
  function penColOf(id) { const c = pkCfg(id); return c && c.col ? c.col : null; }
  function setPenCol(id, v) {
    const c = pkCfg(id); if (!c) return;
    if (v) c.col = v; else delete c.col;
    try { savePK() } catch (_) { }
    if (livePen === id && v) { penColor = v; try { buildSwatches() } catch (_) { } }
    syncCol(); pkRender();
  }
  /* kaleme geçerken o kalemin rengi varsa uygula */
  function applyPenColor(id) {
    const v = penColOf(id);
    if (!v) return;
    penColor = v;
    try { buildSwatches() } catch (_) { }
  }
  const _apply = window.pkApply;
  if (typeof _apply === 'function') window.pkApply = function (id) {
    const r = _apply.apply(this, arguments); applyPenColor(id); try { syncCol() } catch (_) { } return r;
  };
  const _onTool = window.pkOnTool;
  if (typeof _onTool === 'function') window.pkOnTool = function (t) {
    const r = _onTool.apply(this, arguments); applyPenColor(t);
    try { syncCol(); if (typeof syncDrawSegs === 'function') syncDrawSegs() } catch (_) { } return r;
  };

  /* ====================================================================
     DÜRÜST ÖNİZLEME — uygulamanın GERÇEK hattını adım adım taklit eder
     ==================================================================== */
  function chaikin(pts) {
    if (pts.length < 2) return pts;
    const np = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      np.push({ x: a.x * .75 + b.x * .25, y: a.y * .75 + b.y * .25, p: a.p, t: a.t },
              { x: a.x * .25 + b.x * .75, y: a.y * .25 + b.y * .75, p: b.p, t: b.t });
    }
    np.push(pts[pts.length - 1]);
    return np;
  }
  /* gerçek inkFeed sabitleyicisi (EMA), view.s = 1 kabul */
  function stabilize(raw, stabV) {
    if (!raw.length) return [];
    let sp = { x: raw[0].x, y: raw[0].y };
    const out = [{ x: sp.x, y: sp.y, p: raw[0].p, t: raw[0].t }];
    const base = 1 - stabV * 0.85;
    for (let i = 1; i < raw.length; i++) {
      const cp = raw[i], spd = dst(sp, cp), k = cl(base + spd / 34, base, 1);
      sp = { x: sp.x + (cp.x - sp.x) * k, y: sp.y + (cp.y - sp.y) * k };
      if (dst(out[out.length - 1], sp) > 0.35) out.push({ x: sp.x, y: sp.y, p: cp.p, t: cp.t });
    }
    return out;
  }
  function facSize(id) {
    try {
      if (typeof FACTORY !== 'undefined' && FACTORY.DEF && FACTORY.DEF[id] != null) return FACTORY.DEF[id];
      const c = pkCfg(id); if (c && c.base && FACTORY.DEF[c.base] != null) return FACTORY.DEF[c.base];
    } catch (_) { }
    return pkSizeOf(id);
  }
  /* ham el hareketi → tuvalde görünecek NESNE (factory=true ise fabrika ayarıyla) */
  function buildHonest(raw, id, factory) {
    const live0 = pkCfg(id) || {};
    const fac = (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[id]) || null;
    const cfg = factory && fac ? fac : live0;
    const base = pkBase(id);
    const sz = factory ? facSize(id) : pkSizeOf(id);

    /* 1 — SABİTLEYİCİ (gerçek motorda pointermove sırasında çalışır) */
    const stabV = (typeof PK_STABV !== 'undefined' ? PK_STABV[cfg.stab ?? 2] : 0) ?? 0;
    let pts = stabilize(raw, stabV);
    if (pts.length < 3) pts = raw.map(q => ({ ...q }));

    /* 2 — STROK NESNESİ: pointerdown'daki alanların birebir aynısı */
    const op = cfg.op ?? 1, flow = (cfg.flow ?? 100) / 100;
    const col = factory ? pkColorOf(id) : (penColOf(id) || pkColorOf(id));
    const o = {
      type: 'stroke', tool: base,
      color: base === 'hl' ? '#FFE066' : col,
      size: Math.max(.5, sz),
      opacity: (base === 'hl' ? Math.min(op, .6) : op) * flow,
      pk: (cfg.press ?? 80) / 100,
      nib: cfg.nib ?? 1,
      points: pts.map(q => ({ ...q })),
    };
    /* 3 — commitStroke: yumuşatma geçişleri (GLOBAL S.smooth'tan, motorla aynı) */
    const passes = Math.round((typeof S !== 'undefined' ? S.smooth : .45) * 2) + (base === 'smart' ? 1 : 0);
    for (let n = 0; n < passes; n++) o.points = chaikin(o.points);
    /* 4 — kaleme özel mürekkep dinamiği */
    let oo = o;
    try {
      if (base === 'hl' && S.snapHl) oo = snapStraighten(o);
      else if (base === 'smart') oo = matisInk(o);
    } catch (_) { oo = o }
    return oo;
  }
  /* demo çizgisi: hız değişimli, basınçlı, EL TİTREMELİ (sabit tohumlu) */
  function demoRaw(w, h) {
    const pts = [], N = 150;
    const rnd = (typeof mulberry32 === 'function') ? mulberry32(20261120) : (() => Math.random());
    let jx = 0, jy = 0;
    for (let i = 0; i <= N; i++) {
      const u = i / N, t = u + Math.sin(u * Math.PI) * .12;
      /* El salınımı: YAVAŞ ve geniş olmalı, gürültülü değil. Eskiden korelasyon
         düşük (.62) ve genlik yüksekti (±1.05); bu, nokta aralığı mertebesinde
         yüksek frekanslı bir titreme üretip önizlemeyi tırtıklı gösteriyordu —
         oysa gerçek elde titreme yavaştır ve sabitleyicinin bastırdığı da
         tam olarak yüksek frekanstır. Uzun korelasyon + düşük genlik, gerçek
         el yazısına çok daha yakın ve önizleme artık dürüst biçimde temiz. */
      jx = jx * .88 + (rnd() * 2 - 1) * .38;
      jy = jy * .88 + (rnd() * 2 - 1) * .38;
      pts.push({
        x: w * .10 + t * w * .80 + jx,
        y: h * .54 - Math.sin(t * Math.PI * 1.9 + .3) * h * .30 * (1 - t * .18) + jy,
        p: .30 + .60 * Math.sin(Math.min(1, t * 1.05) * Math.PI),
        t: i * 7,
      });
    }
    return pts;
  }
  let cmpOn = true;
  function label(c, y, txt, col) {
    c.save(); c.font = '800 9.5px Manrope, system-ui, sans-serif';
    c.fillStyle = col; c.globalAlpha = .85; c.textBaseline = 'top';
    try { c.letterSpacing = '1.4px' } catch (_) { }
    c.fillText(txt, 12, y); c.restore();
  }
  const _draw = window.drawStroke;
  window.pkBuildStroke = function (raw) { return buildHonest(raw, selPen, false) };
  window.pkRender = function () {
    const cv = document.getElementById('pkCv'); if (!cv || !cv.width) return;
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const old = INK.z; INK.z = 1;
    const W = cv.width / DPR, H = cv.height / DPR;
    const userMode = (typeof pkUser !== 'undefined' && pkUser.length) || (typeof pkLive !== 'undefined' && pkLive);
    try {
      if (!userMode && cmpOn) {
        /* İKİ ŞERİT: üstte fabrika, altta şimdi. Üst üste bindirmek
           işe yaramıyor — kalın çizgi inceyi tamamen örtüyordu. */
        const lane = H / 2;
        const shift = (p, dy) => p.map(q => ({ ...q, y: q.y + dy }));
        const raw = demoRaw(W, lane);
        label(c, 10, 'FABRİKA', '#8A94AC');
        _draw(c, buildHonest(shift(raw, 4), selPen, true));
        label(c, lane + 10, 'ŞİMDİ', penColOf(selPen) || pkColorOf(selPen));
        _draw(c, buildHonest(shift(raw, lane + 4), selPen, false));
      } else {
        const strokes = (typeof pkUser !== 'undefined' && pkUser.length) ? pkUser.slice() : [demoRaw(W, H)];
        if (typeof pkLive !== 'undefined' && pkLive) strokes.push(pkLive);
        for (const s of strokes) _draw(c, buildHonest(s, selPen, false));
      }
    } catch (e) { }
    INK.z = old;
    paintDiff();
  };

  /* ------------------------------------------------- FARK LİSTESİ */
  const STABL = (typeof PK_STABL !== 'undefined') ? PK_STABL : ['Kapalı', 'Düşük', 'Orta', 'Yüksek'];
  const NIBL = (typeof PK_NIBL !== 'undefined') ? PK_NIBL : ['Sivri', 'İnce', 'Dolgun', 'Keski'];
  function diffList() {
    const id = selPen, c = pkCfg(id) || {};
    const f = (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[id]) || null;
    const out = [], sz = pkSizeOf(id), fsz = facSize(id);
    if (f) {
      if (Math.abs(sz - fsz) > .04) out.push(['Kalınlık', String(fsz).replace('.', ',') + ' px', String(sz).replace('.', ',') + ' px']);
      if ((c.op ?? 1) !== (f.op ?? 1)) out.push(['Opaklık', '%' + Math.round((f.op ?? 1) * 100), '%' + Math.round((c.op ?? 1) * 100)]);
      if ((c.press ?? 80) !== (f.press ?? 80)) out.push(['Basınç', '%' + (f.press ?? 80), '%' + (c.press ?? 80)]);
      if ((c.stab ?? 2) !== (f.stab ?? 2)) out.push(['Titreme azaltma', STABL[f.stab ?? 2], STABL[c.stab ?? 2]]);
      if ((c.flow ?? 95) !== (f.flow ?? 95)) out.push(['Mürekkep', '%' + (f.flow ?? 95), '%' + (c.flow ?? 95)]);
      if ((c.nib ?? 1) !== (f.nib ?? 1)) out.push(['Uç', NIBL[f.nib ?? 1], NIBL[c.nib ?? 1]]);
    }
    if (c.col) out.push(['Renk', 'üst çubuktaki', c.col]);
    return out;
  }
  function paintDiff() {
    const el = document.getElementById('pkDiff'); if (!el) return;
    const d = diffList();
    el.innerHTML = !d.length
      ? '<div class="pkd-none">Bu kalem fabrika ayarlarında — iki şerit birebir aynı.</div>'
      : '<div class="pkd-h">' + d.length + ' ayar fabrikadan farklı</div>' +
        d.map(r => '<div class="pkd-r"><span>' + r[0] + '</span><b>' + r[1] + ' → <i>' + r[2] + '</i></b></div>').join('');
  }

  /* ============================================================ ARAYÜZ */
  function el(tag, cls, html) { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d }

  function buildUI() {
    const grid = $1('#sp-pens .pk-cardgrid');
    if (!grid || document.getElementById('pkColRow')) return;

    /* --- etiketleri dürüstleştir --- */
    const relabel = (id, txt, tip) => {
      const n = document.getElementById(id); if (!n) return;
      const lbl = n.closest('.pk-card') && n.closest('.pk-card').querySelector('.pk-lbl');
      if (lbl) { lbl.childNodes[0].nodeValue = txt; if (tip) lbl.title = tip }
    };
    relabel('pkFlow', 'Mürekkep Yoğunluğu', 'Çizginin genel koyuluğu — opaklıkla çarpılır');
    relabel('pkStab', 'Titreme Azaltma', 'Kalem titremesini bastırır; hızlanınca filtre kendiliğinden gevşer');

    /* --- RENK kartı (kullanıcının istediği dört temel ayardan biri) --- */
    const sw = (typeof SWATCH !== 'undefined' ? SWATCH : []).map(c =>
      '<button class="pkc" data-c="' + c + '" style="background:' + c + '" title="' + c + '"></button>').join('');
    const row = el('div', 'pk-card pk-colcard');
    row.id = 'pkColRow';
    row.innerHTML =
      '<div class="pk-lbl">Renk<span class="pk-val" id="pkColOut">Üst çubuktaki</span></div>' +
      '<div class="pk-colrow"><button class="pkc off on" data-c="" title="Kaleme özel renk yok — üst çubuktaki renk geçerli">⃠</button>' +
      sw + '<label class="pkc cust" title="Özel renk"><input type="color" id="pkColCust" value="#243B6B"></label></div>';
    /* Kalınlık kartından hemen sonra */
    const szCard = document.getElementById('pkSize') && document.getElementById('pkSize').closest('.pk-card');
    if (szCard && szCard.nextSibling) grid.insertBefore(row, szCard.nextSibling); else grid.appendChild(row);

    /* --- önizleme başlığına karşılaştırma anahtarı + fark paneli --- */
    const head = $1('#sp-pens .pk-prevhead');
    if (head && !document.getElementById('pkCmp')) {
      const b = el('button', 'pk-ghostbtn on', '<i></i>Fabrikayla karşılaştır');
      b.id = 'pkCmp'; b.title = 'Aynı el hareketini üstte fabrika ayarıyla, altta senin ayarınla çizer';
      b.addEventListener('click', () => { cmpOn = !cmpOn; b.classList.toggle('on', cmpOn); pkRender() });
      head.insertBefore(b, head.lastElementChild);
    }
    const prev = $1('#sp-pens .pk-prev');
    if (prev && !document.getElementById('pkDiff')) {
      const d = el('div', 'pk-diff'); d.id = 'pkDiff'; prev.appendChild(d);
    }
    /* --- bu kalemi fabrikaya döndür --- */
    const sec = $1('#sp-pens .pk-sec');
    if (sec && !document.getElementById('pkOneReset')) {
      const b = el('button', 'pk-onereset', '↺ Bu kalemi sıfırla');
      b.id = 'pkOneReset';
      b.addEventListener('click', () => {
        const c = pkCfg(selPen), f = (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[selPen]) || null;
        if (!c) return;
        if (f) Object.assign(c, JSON.parse(JSON.stringify(f)));
        delete c.col;
        try { pkSetSize(selPen, facSize(selPen)) } catch (_) { }
        try { savePK() } catch (_) { }
        syncPenUI(); syncCol(); renderPenCards(); pkRender();
        if (typeof pkLiveSync === 'function') pkLiveSync();
      });
      sec.appendChild(b);
    }

    bindCol();
    syncCol();
  }
  function bindCol() {
    $$1('#pkColRow .pkc[data-c]').forEach(b => b.addEventListener('click', () => setPenCol(selPen, b.dataset.c)));
    const cu = document.getElementById('pkColCust');
    if (cu) cu.addEventListener('input', e => setPenCol(selPen, e.target.value));
  }
  function syncCol() {
    const row = document.getElementById('pkColRow'); if (!row) return;
    const v = penColOf(selPen);
    $$1('#pkColRow .pkc[data-c]').forEach(b => b.classList.toggle('on', (b.dataset.c || '') === (v || '')));
    const o = document.getElementById('pkColOut');
    if (o) o.textContent = v ? v.toUpperCase() : 'Üst çubuktaki';
    const cu = document.getElementById('pkColCust'); if (cu && v) cu.value = v;
  }
  const _sync = window.syncPenUI;
  window.syncPenUI = function () { _sync.apply(this, arguments); try { syncCol() } catch (_) { } };
  const _reset = window.pkFactoryReset;
  if (typeof _reset === 'function') window.pkFactoryReset = function () {
    const r = _reset.apply(this, arguments);
    try { for (const k in PCFG) delete PCFG[k].col; savePK(); syncCol(); pkRender() } catch (_) { }
    return r;
  };

  function boot() { try { buildUI() } catch (_) { } }
  const sb = document.getElementById('setBtn');
  if (sb) sb.addEventListener('click', () => setTimeout(boot, 0));
  $$1('.set-tab[data-s="pens"]').forEach(t => t.addEventListener('click', () => setTimeout(boot, 0)));
  if (document.readyState === 'complete') setTimeout(boot, 60);
  else window.addEventListener('load', () => setTimeout(boot, 60));

  window.proPen = { buildHonest, diffList, penColOf, setPenCol };
})();
