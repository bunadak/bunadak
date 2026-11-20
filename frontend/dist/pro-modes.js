/* ============================================================================
   ÇİZİM MODLARI ve ÇİZİM TÜRLERİ
   ----------------------------------------------------------------------------
   Bir "mod" tek bir kalem ön ayarı değildir; o işe oturan BÜTÜN bir kurulumdur:
     · kalem (hangi motor, kalınlık, basınç, opaklık, akış, sabitleme, uç)
     · mürekkep rengi ve o işe uygun renk paleti
     · zemin (tahta) ve kâğıt deseni
     · motor davranışı (yumuşatma, şekil düzeltme, açı/ızgara yapışması)
   Moda dokunduğun anda hepsi birden kurulur; başka hiçbir yere gitmen gerekmez.

   Küçük resimler temsilî değildir: her biri o modun GERÇEK zemini üzerine,
   o modun GERÇEK kalemiyle, uygulamanın kendi çizim motorundan geçirilerek
   çizilir. Kartta gördüğün çizgi, seçtiğinde elde edeceğin çizgidir.
   ========================================================================= */
(function () {
  'use strict';
  const $1 = s => document.querySelector(s);
  const LSK = 'notis_mode1';

  /* pen: {tool,size,press,op,flow,stab,nib}  —  kalem kartı alanlarıyla birebir
     stab: 0 Kapalı · 1 Düşük · 2 Orta · 3 Yüksek
     nib : 0 Sivri  · 1 İnce  · 2 Dolgun · 3 Keski                            */

  const MODES = [
    { id: 'manga', n: 'Manga', d: 'Keskin, temiz kontur',
      pen: { tool: 'ball', size: 1.8, press: 20, op: 1, flow: 100, stab: 3, nib: 1 },
      col: '#101217', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#101217', 'Mürekkep'], ['#3C4049', 'Gri gölge'], ['#767C88', 'Açık gri'], ['#B9BFC9', 'Tram'],
            ['#C0392B', 'Vurgu kırmızı'], ['#1F6FB2', 'Vurgu mavi'], ['#E8C07D', 'Ten'], ['#FFFFFF', 'Beyaz']] },

    { id: 'karakalem', n: 'Karakalem', d: 'Grafit doku, tonlama',
      pen: { tool: 'pencil', size: 2.6, press: 85, op: .88, flow: 78, stab: 1, nib: 0 },
      col: '#2A2A2E', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#2A2A2E', '9B grafit'], ['#45454C', '6B'], ['#5E5E68', '4B'], ['#7A7A86', '2B'],
            ['#9A9AA6', 'HB'], ['#B8B8C2', '2H'], ['#8C5A43', 'Sangin'], ['#F3F1EA', 'Işık']] },

    { id: 'portre', n: 'Portre', d: 'Yumuşak geçiş, ölçülü',
      pen: { tool: 'pencil', size: 2, press: 90, op: .8, flow: 72, stab: 2, nib: 0 },
      col: '#3A3230', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#3A3230', 'Koyu kontur'], ['#5A4A44', 'Gölge'], ['#8A6A5C', 'Ara ton'], ['#B98B72', 'Ten gölge'],
            ['#E0B294', 'Ten'], ['#F2D9C4', 'Işık teni'], ['#6E3B3B', 'Dudak'], ['#2A2024', 'Saç']] },

    { id: 'figur', n: 'Figür', d: 'Kendinden emin hat',
      pen: { tool: 'pencil', size: 3, press: 80, op: .85, flow: 80, stab: 1, nib: 0 },
      col: '#2E2A28', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#2E2A28', 'Kontur'], ['#4C443F', 'Kas gölge'], ['#6E635C', 'Ara ton'], ['#948880', 'Hacim'],
            ['#B9ADA3', 'Işık'], ['#8C5A43', 'Sangin'], ['#3D5A80', 'Ölçü çizgisi'], ['#F3F1EA', 'Vurgu']] },

    { id: 'naturmort', n: 'Natürmort', d: 'İnce denetim, hacim',
      pen: { tool: 'pencil', size: 2.2, press: 88, op: .82, flow: 76, stab: 2, nib: 2 },
      col: '#332E2A', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#332E2A', 'Kontur'], ['#59504A', 'Gölge'], ['#7D7169', 'Ara ton'], ['#A89C92', 'Yarı ışık'],
            ['#8A6B2E', 'Bakır'], ['#5B6E4A', 'Yaprak'], ['#8C3A33', 'Meyve'], ['#EFEAE0', 'Işık']] },

    { id: 'manzara', n: 'Manzara', d: 'Geniş hat, atmosfer',
      pen: { tool: 'pencil', size: 3.6, press: 70, op: .72, flow: 68, stab: 1, nib: 2 },
      col: '#3A4038', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#3A4038', 'Ön plan'], ['#5A6A52', 'Orta plan'], ['#7E8F76', 'Uzak yeşil'], ['#9FB4C2', 'Uzak mavi'],
            ['#C7D4DC', 'Ufuk'], ['#8A6A45', 'Toprak'], ['#4A6B86', 'Su'], ['#F0EDE3', 'Gökyüzü']] },

    { id: 'jest', n: 'Jest', d: 'Hızlı, serbest, sabitlemesiz',
      pen: { tool: 'smart', size: 4.5, press: 100, op: .9, flow: 95, stab: 0, nib: 0 },
      col: '#3B3B46', board: 'classic', paper: 'plain',
      S: { smooth: 0, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#3B3B46', 'Hareket'], ['#5E5E6C', 'İkincil'], ['#8A8A99', 'Tali'], ['#C0392B', 'Eksen'],
            ['#1F6FB2', 'Denge'], ['#2B8A3E', 'Ağırlık'], ['#B9BFC9', 'Taslak'], ['#F3F1EA', 'Işık']] },

    { id: 'kontur', n: 'Kontur', d: 'Tek sürekli, eşit kalınlık',
      pen: { tool: 'ball', size: 2.2, press: 0, op: 1, flow: 100, stab: 2, nib: 1 },
      col: '#111827', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#111827', 'Siyah'], ['#243B6B', 'Lacivert'], ['#0B7285', 'Petrol'], ['#C0392B', 'Kırmızı'],
            ['#2B8A3E', 'Yeşil'], ['#845EF7', 'Mor'], ['#E8590C', 'Turuncu'], ['#6B7280', 'Gri']] },

    { id: 'siluet', n: 'Silüet', d: 'Dolu kütle, ağır hat',
      pen: { tool: 'ball', size: 14, press: 0, op: 1, flow: 100, stab: 2, nib: 2 },
      col: '#0B0B0F', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#0B0B0F', 'Siyah kütle'], ['#2A2A33', 'Koyu'], ['#4A4A57', 'Orta'], ['#7A7A88', 'Açık'],
            ['#C0392B', 'Negatif'], ['#1F6FB2', 'Zemin'], ['#D9D4C6', 'Boşluk'], ['#FFFFFF', 'Beyaz']] },

    { id: 'karikatur', n: 'Karikatür', d: 'Canlı, değişken kalınlık',
      pen: { tool: 'fountain', size: 2.6, press: 100, op: 1, flow: 95, stab: 1, nib: 0 },
      col: '#16181F', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#16181F', 'Mürekkep'], ['#E63946', 'Kırmızı'], ['#F77F00', 'Turuncu'], ['#FCBF49', 'Sarı'],
            ['#2A9D8F', 'Turkuaz'], ['#277DA1', 'Mavi'], ['#9D4EDD', 'Mor'], ['#F6E4D7', 'Ten']] },

    { id: 'cizgiroman', n: 'Çizgi Roman', d: 'Kalın mürekkep, net kütle',
      pen: { tool: 'ball', size: 3.4, press: 35, op: 1, flow: 100, stab: 3, nib: 2 },
      col: '#0F1115', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#0F1115', 'Mürekkep'], ['#D62828', 'Kahraman kırmızı'], ['#003049', 'Gece mavisi'],
            ['#F77F00', 'Patlama'], ['#FCBF49', 'Sarı'], ['#2A9D8F', 'Yeşil'], ['#8D99AE', 'Tram gri'], ['#EAE2B7', 'Kâğıt']] },

    { id: 'dijital', n: 'Dijital Çizim', d: 'Basınca zengin, pürüzsüz',
      pen: { tool: 'smart', size: 3, press: 95, op: 1, flow: 95, stab: 2, nib: 1 },
      col: '#1A1B23', board: 'classic', paper: 'plain', pro: true,
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#1A1B23', 'Koyu'], ['#5B54D9', 'İndigo'], ['#2B7FC0', 'Mavi'], ['#2E9E6B', 'Yeşil'],
            ['#E0A33E', 'Amber'], ['#D1495B', 'Mercan'], ['#9D4EDD', 'Mor'], ['#F2F2F7', 'Beyaz']] },
  ];

  const TYPES = [
    { id: 'teknik', n: 'Teknik Resim', d: 'Eşit hat, ızgara ve açı kilidi',
      pen: { tool: 'ball', size: 1.2, press: 0, op: 1, flow: 100, stab: 3, nib: 1 },
      col: '#10243F', board: 'classic', paper: 'graph',
      S: { smooth: 0, shapeFix: true, angleSnap: true, snapGrid: true, grid: 20, guides: true },
      pal: [['#10243F', 'Ana hat'], ['#2B6CB0', 'Ölçü'], ['#C0392B', 'Kesit'], ['#2B8A3E', 'Eksen'],
            ['#6B7280', 'Yardımcı'], ['#8A6A45', 'Not'], ['#111827', 'Siyah'], ['#9AA3B2', 'İnce']] },

    { id: 'mimari', n: 'Mimari Resim', d: 'İzometrik zemin, ince kalem',
      pen: { tool: 'ball', size: 1.5, press: 15, op: 1, flow: 100, stab: 3, nib: 1 },
      col: '#243B6B', board: 'classic', paper: 'iso',
      S: { smooth: 0, shapeFix: true, angleSnap: true, snapGrid: false, guides: true },
      pal: [['#243B6B', 'Ana hat'], ['#3D6AA8', 'İkincil'], ['#7D8CA8', 'Gölge'], ['#B07D4A', 'Ahşap'],
            ['#6E7D6A', 'Peyzaj'], ['#C0392B', 'Vurgu'], ['#4A5568', 'Zemin'], ['#D7DCE6', 'Cam']] },

    { id: 'cizgisel', n: 'Çizgisel Çizim', d: 'Saf hat, doku yok',
      pen: { tool: 'ball', size: 2, press: 0, op: 1, flow: 100, stab: 3, nib: 1 },
      col: '#111827', board: 'classic', paper: 'plain',
      S: { smooth: .5, shapeFix: false, angleSnap: false, snapGrid: false },
      pal: [['#111827', 'Siyah'], ['#243B6B', 'Lacivert'], ['#0B7285', 'Petrol'], ['#C0392B', 'Kırmızı'],
            ['#2B8A3E', 'Yeşil'], ['#845EF7', 'Mor'], ['#E8590C', 'Turuncu'], ['#6B7280', 'Gri']] },
  ];

  const ALL = () => MODES.concat(TYPES);
  let CUR = null;
  try { CUR = localStorage.getItem(LSK) || null } catch (_) { }

  /* ---- kalem kartını geçici olarak moda kurup motoru çalıştır ---- */
  function withPen(m, fn) {
    const id = m.pen.tool;
    const c = (typeof PCFG !== 'undefined') ? PCFG[id] : null;
    if (!c || typeof DEF === 'undefined') return null;
    const keep = { press: c.press, op: c.op, flow: c.flow, stab: c.stab, nib: c.nib };
    const keepSize = DEF[id], keepSel = selPen;
    try {
      c.press = m.pen.press; c.op = m.pen.op; c.flow = m.pen.flow; c.stab = m.pen.stab; c.nib = m.pen.nib;
      DEF[id] = m.pen.size; selPen = id;
      return fn();
    } catch (_) { return null }
    finally {
      c.press = keep.press; c.op = keep.op; c.flow = keep.flow; c.stab = keep.stab; c.nib = keep.nib;
      DEF[id] = keepSize; selPen = keepSel;
    }
  }

  function boardColor(id) {
    try { const b = BOARDS.find(x => x[0] === id); return b ? b[3] : '#FBF8F0' } catch (_) { return '#FBF8F0' }
  }

  /* ---- küçük resim: modun GERÇEK zemini + GERÇEK kalemi ---- */
  function paint(cv, m) {
    if (!cv || typeof drawStroke !== 'function' || typeof pkBuildStroke !== 'function') return;
    const W = 150, H = 86, D = Math.min(2, window.devicePixelRatio || 1) * 2;
    if (cv.width !== Math.round(W * D)) { cv.width = Math.round(W * D); cv.height = Math.round(H * D) }
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(D, 0, 0, D, 0, 0);
    g.fillStyle = boardColor(m.board); g.fillRect(0, 0, W, H);
    try { if (typeof paperPattern === 'function') paperPattern(g, m.paper || 'plain', 0, 0, W, H) } catch (_) { }
    try { if (typeof drawBoardStyle === 'function' && m.board !== 'classic') { const kb = S.board; S.board = m.board; drawBoardStyle(g, 0, 0, W, H); S.board = kb } } catch (_) { }

    const pts = [], N = 60;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      pts.push({ x: 15 + t * (W - 30), y: H * .52 + Math.sin(t * Math.PI * 1.9 - .45) * H * .26, p: .22 + .72 * Math.sin(t * Math.PI), t: i * 12 });
    }
    const iz = INK.z, iq = INK.q;
    withPen(m, () => {
      try {
        INK.z = 1; INK.q = D;
        const o = pkBuildStroke(pts);
        o.color = m.col;
        drawStroke(g, o);
      } catch (_) { } finally { INK.z = iz; INK.q = iq }
    });
  }

  /* ---- modu uygula: kalem + zemin + kâğıt + palet + motor ---- */
  function apply(m) {
    const id = m.pen.tool, c = (typeof PCFG !== 'undefined') ? PCFG[id] : null;
    if (c) {
      c.press = m.pen.press; c.op = m.pen.op; c.flow = m.pen.flow; c.stab = m.pen.stab; c.nib = m.pen.nib;
      try { DEF[id] = m.pen.size } catch (_) { }
    }
    /* Zemin önce kurulur: applyBoard koyu↔açık geçişinde mürekkep rengini
       kendiliğinden çevirir, modun rengini ondan SONRA yazmalıyız. */
    try { if (m.board && typeof applyBoard === 'function') applyBoard(m.board) } catch (_) { }
    try { const p = page(); if (p && m.paper) p.paper = m.paper } catch (_) { }
    try { if (m.S) Object.assign(S, m.S) } catch (_) { }
    try { if (m.pro != null) S.proPens = !!m.pro } catch (_) { }
    try {
      if (m.pal && typeof SWATCH !== 'undefined') {
        SWATCH.length = 0; SWNAME.length = 0;
        for (const [col, nm] of m.pal) { SWATCH.push(col); SWNAME.push(nm) }
      }
    } catch (_) { }
    try { if (typeof pkApply === 'function') pkApply(id) } catch (_) { }
    try { if (m.col) penColor = m.col } catch (_) { }
    for (const f of ['buildSwatches', 'savePK', 'saveOpts', 'syncDrawSegs', 'renderBoards', 'syncPenUI', 'pkRender', 'redraw'])
      { try { if (typeof window[f] === 'function') window[f]() } catch (_) { } }
    CUR = m.id; try { localStorage.setItem(LSK, CUR) } catch (_) { }
    render();
    try { if (typeof toast === 'function') toast(m.n + ' kuruldu — kalem, zemin, palet ve ayarlar hazır') } catch (_) { }
  }

  /* ---- arayüz ---- */
  function grid(host, list) {
    host.innerHTML = '';
    for (const m of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dm-card' + (CUR === m.id ? ' on' : '');
      b.dataset.m = m.id; b.title = m.n + ' — ' + m.d;
      const cv = document.createElement('canvas'); b.appendChild(cv);
      const t = document.createElement('div'); t.className = 'dm-t'; t.textContent = m.n; b.appendChild(t);
      const d = document.createElement('div'); d.className = 'dm-d'; d.textContent = m.d; b.appendChild(d);
      b.addEventListener('click', () => apply(m));
      host.appendChild(b);
      paint(cv, m);
    }
  }

  function buildSafe() {
    const pane = $1('#sp-draw'); if (!pane || document.getElementById('dmGrid')) return;
    const frag = document.createDocumentFragment();
    const mk = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild };
    frag.appendChild(mk('<div class="pkx-sec">Çizim Modları<span class="pkx-sub">dokun — kalem, zemin, palet ve ayarlar birlikte kurulur</span></div>'));
    frag.appendChild(mk('<div class="dm-grid" id="dmGrid"></div>'));
    frag.appendChild(mk('<div class="pkx-sec">Çizim Türleri<span class="pkx-sub">teknik kurulumlar — zemin, ızgara ve hat kilidi dahil</span></div>'));
    frag.appendChild(mk('<div class="dm-grid" id="dtGrid"></div>'));
    pane.insertBefore(frag, pane.firstChild);
  }

  function render() {
    buildSafe();
    const a = $1('#dmGrid'), b = $1('#dtGrid');
    if (a) grid(a, MODES);
    if (b) grid(b, TYPES);
  }

  let pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; try { render() } catch (_) { } }) }

  function init() {
    if (!$1('#sp-draw')) return;
    render();
    const dlg = document.getElementById('setDlg');
    if (dlg && !dlg.__dm) {
      dlg.__dm = true;
      new MutationObserver(() => { if (dlg.open) schedule() }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.proModes = { MODES, TYPES, apply, render, current: () => CUR };
})();
