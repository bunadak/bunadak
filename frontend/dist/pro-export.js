/* ============================================================================
   ÇİZİMLİ PDF DIŞA AKTARMA + SAYFA ARALIĞI
   ============================================================================
   Eksik olan neydi: PDF dışa aktarma HER ZAMAN tüm sayfaları basıyordu.
   24 sayfalık bir belgenin yalnız 3 sayfasını vermek mümkün değildi, ve
   bu seçenek yalnız üst çubuktaki Dışa Aktar penceresinde vardı — "PDF ve
   Kayıt" panelinde hiç görünmüyordu.

   Eklenenler:
     · Sayfa aralığı: "7" · "1-10" · "1-3, 7, 12-15" · boş = tümü
     · Hazır seçimler: Tümü · Geçerli sayfa · Yer imleri
     · Canlı sayaç: "24 sayfadan 5 tanesi seçildi"
     · Aynı denetim hem Dışa Aktar penceresinde hem PDF ve Kayıt panelinde
     · BOŞ TAHTA: sabit sayfa dikdörtgeni yerine İÇERİĞİN TAMAMI basılır —
       çizim nereye taşarsa taşsın kırpılmaz
     · ÇÖZÜM ALANI: soru + çözüm tek PDF sayfasında

   Çalışma HİÇBİR koşulda silinmez ya da değiştirilmez: dışa aktarma yalnız
   okur, sayfa nesnelerine tek bir yazma yapmaz.
============================================================================ */
(function () {
  if (window.__proExport) return; window.__proExport = true;

  /* ------------------------------------------------- ARALIK AYRIŞTIRICI */
  /* "1-3, 7, 12-15" → [0,1,2,6,11,12,13,14] (0 tabanlı, sıralı, tekrarsız) */
  function parseRange(str, max) {
    const all = Array.from({ length: max }, (_, i) => i);
    if (!str || !String(str).trim()) return all;
    const set = new Set();
    for (let part of String(str).split(/[,;]/)) {
      part = part.trim().replace(/\s+/g, '');
      if (!part) continue;
      let m = /^(\d+)-(\d+)$/.exec(part);
      if (m) {
        let a = +m[1], b = +m[2];
        if (a > b) { const t = a; a = b; b = t }
        for (let i = a; i <= b; i++) if (i >= 1 && i <= max) set.add(i - 1);
        continue;
      }
      m = /^(\d+)-$/.exec(part);                    // "5-" → 5'ten sona
      if (m) { for (let i = +m[1]; i <= max; i++) if (i >= 1) set.add(i - 1); continue }
      m = /^-(\d+)$/.exec(part);                    // "-5" → baştan 5'e
      if (m) { for (let i = 1; i <= Math.min(max, +m[1]); i++) set.add(i - 1); continue }
      m = /^(\d+)$/.exec(part);
      if (m && +m[1] >= 1 && +m[1] <= max) set.add(+m[1] - 1);
    }
    return Array.from(set).sort((a, b) => a - b);
  }
  /* indis listesi → okunur metin: [0,1,2,6] → "1-3, 7" */
  function fmtRange(idx) {
    if (!idx.length) return '';
    const out = []; let a = idx[0], prev = idx[0];
    for (let i = 1; i <= idx.length; i++) {
      const v = idx[i];
      if (v !== prev + 1) { out.push(a === prev ? String(a + 1) : (a + 1) + '-' + (prev + 1)); a = v }
      prev = v;
    }
    return out.join(', ');
  }
  let RANGE = '';                                   // boş = tümü

  function pagesForExport() {
    const n = doc.pages.length;
    const idx = parseRange(RANGE, n);
    return idx.map(i => doc.pages[i]);
  }

  /* --------------------------------------------------- İÇERİK SINIRLARI */
  function contentBox(p, pad) {
    let b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }, any = false;
    for (const l of p.layers) {
      if (!l.visible) continue;
      for (const o of l.objects) {
        const ob = bboxOf(o); any = true;
        b.x0 = Math.min(b.x0, ob.x0); b.y0 = Math.min(b.y0, ob.y0);
        b.x1 = Math.max(b.x1, ob.x1); b.y1 = Math.max(b.y1, ob.y1);
      }
    }
    if (!any) return null;
    const P = pad == null ? 48 : pad;
    return { x0: b.x0 - P, y0: b.y0 - P, x1: b.x1 + P, y1: b.y1 + P };
  }
  /* sınırsız bir alanı tuvale bas (tahta / çözüm) */
  function renderBoxTo(c, p, box, k, boardStyle) {
    const W = box.x1 - box.x0, H = box.y1 - box.y0;
    c.width = Math.round(W * k); c.height = Math.round(H * k);
    const g = c.getContext('2d');
    const oz = INK.z; INK.z = 1;
    g.scale(k, k); g.translate(-box.x0, -box.y0);
    if (boardStyle) {
      g.fillStyle = boardBg(); g.fillRect(box.x0, box.y0, W, H);
      try { paperPattern(g, p.paper, box.x0, box.y0, box.x1, box.y1) } catch (_) { }
      try { drawBoardStyle(g, box.x0, box.y0, box.x1, box.y1) } catch (_) { }
    } else { g.fillStyle = '#FBF8F0'; g.fillRect(box.x0, box.y0, W, H) }
    for (const l of p.layers) {
      if (!l.visible) continue;
      g.save(); g.globalAlpha = l.opacity;
      for (const o of l.objects) drawObj(g, o);
      g.restore();
    }
    INK.z = oz;
    return { W, H };
  }

  /* ------------------------------------------------------------ buildPDF
     Orijinali tüm sayfaları basıyordu ve parametre almıyordu. Bu sürüm
     seçili aralığı basar; tahta ve çözüm alanını da doğru ele alır. */
  window.buildPDF = async function (list) {
    const { jsPDF } = window.jspdf;
    let pdf = null;
    const add = (c, wMm, hMm) => {
      const or = wMm > hMm ? 'l' : 'p';
      if (!pdf) pdf = new jsPDF({ orientation: or, unit: 'mm', format: [wMm, hMm] });
      else pdf.addPage([wMm, hMm], or);
      pdf.addImage(c.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, wMm, hMm);
    };

    /* ÇÖZÜM ALANI: soru + çözüm tek sayfada */
    if (typeof scratch !== 'undefined' && scratch) {
      const sp = scratch.page, box = contentBox(sp, 48);
      if (!box) throw new Error('Çözüm alanında dışa aktarılacak içerik yok');
      const c = document.createElement('canvas');
      const k = Math.min(3, Math.max(1, 2400 / (box.x1 - box.x0)));
      const { W, H } = renderBoxTo(c, sp, box, k, false);
      const cm = W / (typeof pxPerCm === 'function' ? pxPerCm(sp) : 37.8);
      add(c, +(cm * 10).toFixed(2), +(cm * 10 * H / W).toFixed(2));
      return pdf.output('datauristring');
    }

    const pages = list && list.length ? list : pagesForExport();
    if (!pages.length) throw new Error('Seçili aralıkta sayfa yok');

    for (const p of pages) {
      /* SONSUZ TAHTA: sabit dikdörtgen değil, içeriğin tamamı */
      if (p.infinite) {
        const box = contentBox(p, 60);
        if (!box) continue;                        // boş tahta → atla
        const c = document.createElement('canvas');
        const k = Math.min(3, Math.max(1, 2600 / Math.max(box.x1 - box.x0, box.y1 - box.y0)));
        const { W, H } = renderBoxTo(c, p, box, k, true);
        const cm = W / (typeof pxPerCm === 'function' ? pxPerCm(p) : 37.8);
        add(c, +(cm * 10).toFixed(2), +(cm * 10 * H / W).toFixed(2));
      } else {
        const k = 1.5, c = document.createElement('canvas');
        c.width = p.w * k; c.height = p.h * k;
        renderPageTo(c, p, k);
        const wCm = pageWidthCm(p), hCm = wCm * p.h / p.w;
        add(c, +(wCm * 10).toFixed(2), +(hCm * 10).toFixed(2));
      }
      await new Promise(r => requestAnimationFrame(r));   // arayüz akıcı kalsın
    }
    if (!pdf) throw new Error('Dışa aktarılacak içerik yok');
    return pdf.output('datauristring');
  };

  /* =================================================== ARALIK DENETİMİ UI */
  function mkRangeUI(idPrefix, compact) {
    const n = doc.pages.length;
    return '<div class="rng-wrap" id="' + idPrefix + 'Wrap">' +
      '<div class="rng-chips">' +
        '<button type="button" class="rng-chip on" data-r="">Tümü</button>' +
        '<button type="button" class="rng-chip" data-r="cur">Geçerli sayfa</button>' +
        '<button type="button" class="rng-chip" data-r="bm">Yer imleri</button>' +
      '</div>' +
      '<input class="rng-inp" id="' + idPrefix + 'Inp" placeholder="örn. 1-3, 7, 12-15 — boş bırakırsan tümü" spellcheck="false">' +
      '<div class="rng-out" id="' + idPrefix + 'Out"></div>' +
    '</div>';
  }
  function bindRangeUI(idPrefix, onChange) {
    const wrap = document.getElementById(idPrefix + 'Wrap'); if (!wrap || wrap.dataset.b) return;
    wrap.dataset.b = '1';
    const inp = document.getElementById(idPrefix + 'Inp');
    const out = document.getElementById(idPrefix + 'Out');
    const upd = () => {
      const n = doc.pages.length;
      const idx = parseRange(RANGE, n);
      if (out) {
        out.textContent = (typeof scratch !== 'undefined' && scratch)
          ? 'Çözüm alanı — soru ve çözüm tek sayfada'
          : (idx.length === n
              ? n + ' sayfanın tamamı'
              : idx.length + ' / ' + n + ' sayfa  ·  ' + (fmtRange(idx) || 'seçim yok'));
        out.classList.toggle('empty', idx.length === 0);
      }
      wrap.querySelectorAll('.rng-chip').forEach(b => b.classList.toggle('on',
        (b.dataset.r === '' && !RANGE) ||
        (b.dataset.r === 'cur' && RANGE === String(cur + 1)) ||
        (b.dataset.r === 'bm' && !!bmRange() && RANGE === bmRange())));
      if (onChange) onChange(idx);
    };
    const bmRange = () => fmtRange(doc.pages.map((p, i) => p.bookmark ? i : -1).filter(i => i >= 0));
    wrap.querySelectorAll('.rng-chip').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.r === 'cur') RANGE = String(cur + 1);
      else if (b.dataset.r === 'bm') { const r = bmRange(); if (!r) { toast('Bu belgede yer imi yok — Ctrl+B ile ekle'); return } RANGE = r }
      else RANGE = '';
      if (inp) inp.value = RANGE;
      upd();
    }));
    if (inp) inp.addEventListener('input', () => { RANGE = inp.value; upd() });
    wrap.__upd = upd;
    upd();
  }
  function refreshRangeUI() {
    ['expRng', 'stRng'].forEach(k => { const w = document.getElementById(k + 'Wrap'); if (w && w.__upd) w.__upd() });
  }

  /* --------------------------------- 1) Dışa Aktar penceresine aralık ekle */
  function injectExportDlg() {
    const body = document.querySelector('#expDlg .dlg-body');
    if (!body || document.getElementById('expRngWrap')) return;
    const f = document.createElement('div');
    f.className = 'fld'; f.id = 'expRngFld';
    f.innerHTML = '<label>SAYFA ARALIĞI</label>' + mkRangeUI('expRng');
    body.appendChild(f);
    bindRangeUI('expRng');
    const sel = document.getElementById('expFmt');
    const vis = () => { f.style.display = (sel.value === 'pdf' || sel.value === 'print') ? '' : 'none' };
    sel.addEventListener('change', vis); vis();
  }
  const _eb = document.getElementById('exportBtn');
  if (_eb) _eb.addEventListener('click', () => setTimeout(() => { injectExportDlg(); refreshRangeUI() }, 0));

  /* ------------------------- 2) "PDF ve Kayıt" paneline indirme kartı ekle */
  function injectStoragePane() {
    const sp = document.getElementById('sp-storage');
    if (!sp || document.getElementById('stRngWrap')) return;
    const box = document.createElement('div');
    box.className = 'exp-card';
    box.innerHTML =
      '<div class="set-sec-t" style="margin-top:0">Çalışmayı PDF Olarak İndir</div>' +
      '<div class="d" style="margin:0 0 10px">Üzerine çizdiğin PDF\'i <b>çizimlerinle birlikte</b> tek dosya olarak indirir. ' +
      'Kütüphanedeki çalışman <b>silinmez, değişmez</b> — bu işlem yalnızca okur. ' +
      'Boş tahtada içeriğin tamamı, çözüm alanında soru ve çözüm tek sayfada basılır.</div>' +
      mkRangeUI('stRng') +
      '<div class="exp-actions"><button class="cta" id="stExpPdf">PDF indir</button>' +
      '<button class="ghost" id="stExpPng">Geçerli sayfayı PNG indir</button></div>';
    /* "Alan Kullanımı" başlığından önce */
    const anchor = Array.from(sp.querySelectorAll('.set-sec-t')).find(x => /Alan Kullanımı/i.test(x.textContent));
    if (anchor) sp.insertBefore(box, anchor); else sp.appendChild(box);
    bindRangeUI('stRng');
    document.getElementById('stExpPdf').addEventListener('click', doExportPdf);
    document.getElementById('stExpPng').addEventListener('click', () => {
      try {
        const p = (typeof scratch !== 'undefined' && scratch) ? scratch.page : doc.pages[cur];
        const title = (doc.title || 'notis').replace(/[^\wğüşöçıİĞÜŞÖÇ -]/g, '');
        if (p.infinite || (typeof scratch !== 'undefined' && scratch)) {
          const box2 = contentBox(p, 48);
          if (!box2) return toast('Dışa aktarılacak içerik yok');
          const c = document.createElement('canvas');
          renderBoxTo(c, p, box2, Math.min(3, Math.max(1, 2600 / Math.max(box2.x1 - box2.x0, box2.y1 - box2.y0))), !scratch);
          dl(c.toDataURL('image/png'), title + '.png');
        } else {
          const k = 2, c = document.createElement('canvas');
          c.width = p.w * k; c.height = p.h * k; renderPageTo(c, p, k);
          dl(c.toDataURL('image/png'), title + '.png');
        }
      } catch (e) { toast.error('PNG oluşturulamadı: ' + (e && e.message || e)) }
    });
  }
  async function doExportPdf() {
    const btn = document.getElementById('stExpPdf');
    const old = btn ? btn.textContent : '';
    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Hazırlanıyor…' }
      const title = (doc.title || 'notis').replace(/[^\wğüşöçıİĞÜŞÖÇ -]/g, '');
      const idx = parseRange(RANGE, doc.pages.length);
      const suffix = (!RANGE || idx.length === doc.pages.length) ? '' : '-s' + fmtRange(idx).replace(/[,\s]+/g, '_');
      const url = await buildPDFDataURL();
      await dl(url, title + suffix + '.pdf');
      toast('PDF indirildi ✓  ' + (suffix ? idx.length + ' sayfa' : 'tüm sayfalar'));
    } catch (e) {
      toast.error('PDF oluşturulamadı: ' + (e && e.message || e));
    } finally { if (btn) { btn.disabled = false; btn.textContent = old } }
  }
  const _sb = document.getElementById('setBtn');
  if (_sb) _sb.addEventListener('click', () => setTimeout(() => { injectStoragePane(); refreshRangeUI() }, 0));
  document.querySelectorAll('.set-tab[data-s="storage"]').forEach(t =>
    t.addEventListener('click', () => setTimeout(() => { injectStoragePane(); refreshRangeUI() }, 0)));

  if (document.readyState === 'complete') setTimeout(injectStoragePane, 120);
  else window.addEventListener('load', () => setTimeout(injectStoragePane, 120));

  window.proExport = { parseRange, fmtRange, setRange: (r) => { RANGE = r; refreshRangeUI() }, getRange: () => RANGE, pagesForExport };
})();
