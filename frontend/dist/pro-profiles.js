/* ============================================================================
   KALEM PROFİLLERİM
   ----------------------------------------------------------------------------
   Hazır uçlar uygulamanın verdiği profillerdir; burası ise KULLANICININ kendi
   kurduğu kalemleri saklar. Bir kalemi tam istediğin gibi ayarlayıp "Profil
   olarak kaydet" dediğinde o anki bütün kurulum (hangi motor, kalınlık, basınç,
   opaklık, akış, sabitleme, uç yapısı, doku, uç inceltme ve mürekkep rengi)
   adıyla birlikte saklanır. Dilediğin an tek dokunuşla o kuruluma dönersin.
   Profiller kalıcıdır; yeniden adlandırılabilir ve silinebilir.

   Küçük resimler burada da gerçektir: profilin kendi değerleriyle, uygulamanın
   kendi çizim motorundan geçirilerek çizilir.
   ========================================================================= */
(function () {
  'use strict';
  const $1 = s => document.querySelector(s);
  const LSK = 'notis_penprof1';

  let LIST = [];
  try { const r = localStorage.getItem(LSK); if (r) LIST = JSON.parse(r) || [] } catch (_) { LIST = [] }
  const save = () => { try { localStorage.setItem(LSK, JSON.stringify(LIST)) } catch (_) { } };
  const uid = () => 'pp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---- o anki kalemin tam kurulumu ---- */
  function snapshot() {
    const id = (typeof selPen !== 'undefined') ? selPen : 'smart';
    const c = (typeof pkCfg === 'function') ? pkCfg(id) : null; if (!c) return null;
    const base = (typeof pkBase === 'function') ? pkBase(id) : 'ball';
    return {
      id: uid(),
      name: '',
      tool: base,
      size: (typeof pkSizeOf === 'function') ? pkSizeOf(id) : 2.2,
      press: c.press ?? 80, op: c.op ?? 1, flow: c.flow ?? 95,
      stab: c.stab ?? 2, nib: c.nib ?? 1, tx: c.tx ?? 0, tp: c.tp ?? 6,
      col: (typeof penColor !== 'undefined' && penColor) ? penColor : '#111827',
    };
  }

  /* ---- kalem kartını geçici olarak profile kurup motoru çalıştır ---- */
  function withProfile(pr, fn) {
    const id = pr.tool;
    const c = (typeof PCFG !== 'undefined') ? PCFG[id] : null;
    if (!c || typeof DEF === 'undefined') return null;
    const keep = { press: c.press, op: c.op, flow: c.flow, stab: c.stab, nib: c.nib, tx: c.tx, tp: c.tp };
    const keepSize = DEF[id], keepSel = selPen;
    try {
      c.press = pr.press; c.op = pr.op; c.flow = pr.flow; c.stab = pr.stab;
      c.nib = pr.nib; c.tx = pr.tx; c.tp = pr.tp;
      DEF[id] = pr.size; selPen = id;
      return fn();
    } catch (_) { return null }
    finally {
      for (const k in keep) c[k] = keep[k];
      DEF[id] = keepSize; selPen = keepSel;
    }
  }

  function paint(cv, pr) {
    if (!cv || typeof pkBuildStroke !== 'function' || typeof drawStroke !== 'function') return;
    const W = 124, H = 62, D = Math.min(2, window.devicePixelRatio || 1) * 2;
    if (cv.width !== Math.round(W * D)) { cv.width = Math.round(W * D); cv.height = Math.round(H * D) }
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(D, 0, 0, D, 0, 0);
    const pts = [], N = 54;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      pts.push({ x: 11 + t * (W - 22), y: H * .52 + Math.sin(t * Math.PI * 1.8 - .4) * H * .27, p: .22 + .72 * Math.sin(t * Math.PI), t: i * 12 });
    }
    const iz = INK.z, iq = INK.q;
    withProfile(pr, () => {
      try { INK.z = 1; INK.q = D; const o = pkBuildStroke(pts); o.color = pr.col; drawStroke(g, o) }
      catch (_) { } finally { INK.z = iz; INK.q = iq }
    });
  }

  /* ---- profili uygula ---- */
  function apply(pr) {
    const id = pr.tool, c = (typeof PCFG !== 'undefined') ? PCFG[id] : null;
    if (c) {
      c.press = pr.press; c.op = pr.op; c.flow = pr.flow; c.stab = pr.stab;
      c.nib = pr.nib; c.tx = pr.tx ?? 0; c.tp = pr.tp ?? 6;
      try { if (typeof pkSetSize === 'function') pkSetSize(id, pr.size) } catch (_) { }
    }
    try { if (typeof pkApply === 'function') pkApply(id) } catch (_) { }
    try { if (pr.col) penColor = pr.col } catch (_) { }
    for (const f of ['buildSwatches', 'savePK', 'syncPenUI', 'pkLiveSync', 'renderPenCards', 'pkRender', 'redraw'])
      { try { if (typeof window[f] === 'function') window[f]() } catch (_) { } }
    render();
    try { if (typeof toast === 'function') toast('“' + pr.name + '” profiline dönüldü') } catch (_) { }
  }

  /* ---- o anki kalem bu profille birebir mi? ---- */
  function isActive(pr) {
    const now = snapshot(); if (!now) return false;
    return now.tool === pr.tool && Math.abs(now.size - pr.size) < .05 && now.press === pr.press &&
      Math.abs(now.op - pr.op) < .005 && now.flow === pr.flow && now.stab === pr.stab &&
      now.nib === pr.nib && (now.tx ?? 0) === (pr.tx ?? 0) && (now.tp ?? 6) === (pr.tp ?? 6) &&
      String(now.col).toLowerCase() === String(pr.col).toLowerCase();
  }

  const BASEN = { smart: 'Akıllı', ball: 'Tükenmez', fountain: 'Dolma', pencil: 'Kurşun', hl: 'Fosforlu' };

  /* ---- kaydetme kutusu (prompt() kullanmıyoruz: WebView2'de engellenebilir) ---- */
  function openSaver() {
    const bar = $1('#ppSaver'); if (!bar) return;
    bar.classList.add('open');
    const inp = $1('#ppName');
    const base = (typeof pkNameOf === 'function' && typeof selPen !== 'undefined') ? pkNameOf(selPen) : 'Kalem';
    inp.value = base + ' ' + (LIST.length + 1);
    inp.focus(); inp.select();
  }
  function closeSaver() { const b = $1('#ppSaver'); if (b) b.classList.remove('open') }
  function commitSave() {
    const inp = $1('#ppName'); if (!inp) return;
    const nm = (inp.value || '').trim().slice(0, 40);
    if (!nm) { inp.focus(); return }
    const pr = snapshot(); if (!pr) return;
    pr.name = nm;
    LIST.push(pr); save(); closeSaver(); render();
    try { if (typeof toast === 'function') toast('“' + nm + '” profili kaydedildi') } catch (_) { }
  }

  function rename(pr) {
    const card = $1('.pp-card[data-i="' + pr.id + '"]'); if (!card) return;
    const t = card.querySelector('.pp-t'); if (!t || card.classList.contains('edit')) return;
    card.classList.add('edit');
    const inp = document.createElement('input');
    inp.className = 'pp-rename'; inp.value = pr.name; inp.maxLength = 40;
    t.replaceWith(inp); inp.focus(); inp.select();
    const done = (ok) => {
      if (ok) { const v = (inp.value || '').trim(); if (v) { pr.name = v; save() } }
      card.classList.remove('edit'); render();
    };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false) });
    inp.addEventListener('blur', () => done(true));
  }

  function del(pr) {
    LIST = LIST.filter(x => x.id !== pr.id); save(); render();
    try { if (typeof toast === 'function') toast('“' + pr.name + '” profili silindi') } catch (_) { }
  }

  /* ---- arayüz ---- */
  function build() {
    const host = $1('#pkPresets'); if (!host || document.getElementById('ppGrid')) return;
    const frag = document.createDocumentFragment();
    const mk = h => { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild };
    frag.appendChild(mk('<div class="pkx-sec">Kalem Profillerim<span class="pkx-sub" id="ppSub">kendi kurduğun kalemler — tek dokunuşla geri dön</span></div>'));
    frag.appendChild(mk(
      '<div class="pp-bar">' +
      '<button type="button" class="pp-add" id="ppAdd">＋ Şu anki kalemi profil olarak kaydet</button>' +
      '<div class="pp-saver" id="ppSaver"><input id="ppName" type="text" maxlength="40" placeholder="Profil adı" spellcheck="false">' +
      '<button type="button" class="pp-ok" id="ppOk">Kaydet</button><button type="button" class="pp-no" id="ppCancel">Vazgeç</button></div></div>'));
    frag.appendChild(mk('<div class="pp-grid" id="ppGrid"></div>'));
    host.parentNode.insertBefore(frag, host.nextSibling);

    $1('#ppAdd').addEventListener('click', openSaver);
    $1('#ppOk').addEventListener('click', commitSave);
    $1('#ppCancel').addEventListener('click', closeSaver);
    $1('#ppName').addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter') commitSave(); else if (e.key === 'Escape') closeSaver();
    });
  }

  function render() {
    build();
    const host = $1('#ppGrid'); if (!host) return;
    host.innerHTML = '';
    if (!LIST.length) {
      const e = document.createElement('div'); e.className = 'pp-empty';
      e.textContent = 'Henüz profil yok. Bir kalemi istediğin gibi ayarla, sonra yukarıdaki düğmeyle adıyla kaydet.';
      host.appendChild(e);
    }
    for (const pr of LIST) {
      const card = document.createElement('div');
      card.className = 'pp-card' + (isActive(pr) ? ' on' : '');
      card.dataset.i = pr.id;
      const cv = document.createElement('canvas'); card.appendChild(cv);
      const t = document.createElement('div'); t.className = 'pp-t'; t.textContent = pr.name; card.appendChild(t);
      const d = document.createElement('div'); d.className = 'pp-d';
      d.textContent = (BASEN[pr.tool] || pr.tool) + ' · ' + String(pr.size).replace('.', ',') + ' px · %' + Math.round(pr.op * 100);
      card.appendChild(d);
      const sw = document.createElement('i'); sw.className = 'pp-col'; sw.style.background = pr.col; card.appendChild(sw);
      const act = document.createElement('div'); act.className = 'pp-act';
      const rb = document.createElement('button'); rb.type = 'button'; rb.title = 'Yeniden adlandır'; rb.textContent = '✎';
      const db = document.createElement('button'); db.type = 'button'; db.title = 'Profili sil'; db.className = 'x'; db.textContent = '✕';
      act.appendChild(rb); act.appendChild(db); card.appendChild(act);
      rb.addEventListener('click', e => { e.stopPropagation(); rename(pr) });
      db.addEventListener('click', e => { e.stopPropagation(); del(pr) });
      card.addEventListener('click', () => { if (!card.classList.contains('edit')) apply(pr) });
      host.appendChild(card);
      paint(cv, pr);
    }
    const sub = $1('#ppSub');
    if (sub) sub.textContent = LIST.length ? (LIST.length + ' profil — tek dokunuşla geri dön') : 'kendi kurduğun kalemler — tek dokunuşla geri dön';
  }

  let pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; try { render() } catch (_) { } }) }
  function wrap(name) {
    const f = window[name]; if (typeof f !== 'function' || f.__pp) return;
    const w = function () { const r = f.apply(this, arguments); schedule(); return r };
    w.__pp = true; window[name] = w;
  }

  function init() {
    if (!$1('#pkPresets')) return;
    render(); wrap('syncPenUI'); wrap('pkApply');
    const dlg = document.getElementById('setDlg');
    if (dlg && !dlg.__pp) {
      dlg.__pp = true;
      new MutationObserver(() => { if (dlg.open) schedule() }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.proProfiles = { list: () => LIST, apply, render, snapshot };
})();
