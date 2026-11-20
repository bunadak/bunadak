/* ============================================================================
   PDF İÇE AKTARMA WORKER'I
   ----------------------------------------------------------------------------
   Ana iş parçacığıyla sıkı bir soru-cevap (ping-pong) yürütür: bir sayfa
   gönderir, onay (ack) gelene kadar bekler, sonra sıradakine geçer. Böylece
   bellek şişmez. Ama bu düzenin iki ölümcül kusuru vardı:

     1) KAYIP ONAY = KALICI KİLİT. _wa() beklemeyi, sayfa gönderildikten
        SONRA kuruyordu. Onay o aralıkta gelirse _ar henüz null olduğu için
        onay sessizce atılıyor, worker sonsuza kadar bekliyordu. Artık onay
        bir mandal (_ackBekleyen) ile tutulur: erken gelen onay kaybolmaz.

     2) ZAMAN AŞIMI YALNIZ RENDER'DAYDI. getDocument, getPage, convertToBlob
        ve dataURL okuması sınırsız bekleyebiliyordu. pdf.js standart font ve
        cMap dosyalarını worker içinden ağ üzerinden ister; bu istek yanıt
        vermezse getPage sonsuza kadar askıda kalır ve içe aktarma o sayfada
        donar. Artık her aşamanın kendi üst sınırı var; aşan sayfa atlanır ve
        akış devam eder.

   Ayrıca her sayfaya başlarken yaşam belirtisi (hb) gönderilir: ana taraf
   worker'ın çalıştığını bilir, uzun bir sayfayı donma sanıp kesmez.
   ========================================================================= */
let _ar = null, _ackBekleyen = false, _cancel = false;

/* Onay beklemesi. Onay daha önce geldiyse beklemeden geçilir. */
const _wa = () => {
  if (_ackBekleyen) { _ackBekleyen = false; return Promise.resolve() }
  return new Promise(r => { _ar = r });
};
const _ackGeldi = () => {
  if (_ar) { const r = _ar; _ar = null; r() }
  else _ackBekleyen = true;        // erken onay: mandala alınır, kaybolmaz
};

/* Her aşama için üst sınır: askıda kalan bir iş bütün içe aktarmayı
   öldürmesin. Aşan sayfa 'skip' olarak bildirilir, akış sürer. */
const _to = (p, ms, ad) => Promise.race([
  p, new Promise((_, rj) => setTimeout(() => rj(new Error(ad + ' zaman aşımı (' + ms + ' ms)')), ms)),
]);

onmessage = async e => {
  const d = e.data;
  if (d && d.t === 'ack') { _ackGeldi(); return }
  if (d && d.t === 'cancel') { _cancel = true; _ackGeldi(); return }
  if (!d || !d.buf) return;
  const { buf, targetW, cap, maxN, base, startAt: s0 } = d;
  try {
    importScripts(base + '/pdf.js/3.11.174/pdf.min.js');
    importScripts(base + '/pdf.js/3.11.174/pdf.worker.min.js');
    const pdf = await _to(pdfjsLib.getDocument({
      data: buf,
      standardFontDataUrl: base + '/pdf.js/3.11.174/standard_fonts/',
      cMapUrl: base + '/pdf.js/3.11.174/cmaps/', cMapPacked: true,
      useWorkerFetch: true, disableFontFace: true,
    }).promise, 90000, 'belge açma');
    const N = Math.min(pdf.numPages, maxN);
    let tw = targetW;
    tw = N > 250 ? Math.min(tw, 1400) : N > 120 ? Math.min(tw, 1600) : N > 60 ? Math.min(tw, 2000) : tw;
    const q = N > 120 ? .86 : .93;
    const c = new OffscreenCanvas(4, 4);
    postMessage({ t: 'n', N, tw });
    for (let i = Math.max(1, s0 | 0); i <= N; i++) {
      if (_cancel) { postMessage({ t: 'done', cancelled: true }); return }
      postMessage({ t: 'hb', i });                 // yaşam belirtisi
      try {
        const pg = await _to(pdf.getPage(i), 25000, 'sayfa açma');
        const vp1 = pg.getViewport({ scale: 1 });
        const vp = pg.getViewport({ scale: Math.min(cap, Math.max(1.15, tw / vp1.width)) });
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const tk = pg.render({ canvasContext: c.getContext('2d'), viewport: vp });
        await Promise.race([tk.promise, new Promise((_, rj) => setTimeout(() => {
          try { tk.cancel() } catch (_) { } rj(new Error('render zaman aşımı'));
        }, 45000))]);
        let bl;
        try { bl = await _to(c.convertToBlob({ type: 'image/webp', quality: q }), 20000, 'webp kodlama') }
        catch (_) { bl = await _to(c.convertToBlob({ type: 'image/jpeg', quality: q + .02 }), 20000, 'jpeg kodlama') }
        const u = await _to(new Promise((r, rj) => {
          const fr = new FileReader();
          fr.onload = () => r(fr.result); fr.onerror = () => rj(new Error('dataURL okunamadı'));
          fr.readAsDataURL(bl);
        }), 20000, 'dataURL');
        postMessage({ t: 'p', i, bg: u, pw: Math.round(vp.width), ph: Math.round(vp.height) });
        pg.cleanup && pg.cleanup();
        await _wa();
      } catch (pe) {
        postMessage({ t: 'skip', i, m: String(pe && pe.message || pe) });
        await _wa();
      }
    }
    postMessage({ t: 'done' });
  } catch (err) { postMessage({ t: 'err', m: String(err && err.message || err) }) }
};
