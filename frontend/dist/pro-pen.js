/* ============================================================================
   KALEM STÜDYOSU v2 — "bu seçenekler hiçbir fark yaratmıyor" sorununun kökü
   ============================================================================

   TESPİT EDİLEN ÜÇ GERÇEK KUSUR
   -----------------------------
   1) CANLI ÖNİZLEME YALAN SÖYLÜYORDU. Önizleme, gerçek kalem motorundan
      BAŞKA bir matematik kullanıyordu:
        · yumuşatma geçişlerini stabilizasyon değerinden alıyordu
          (gerçek motor S.smooth'tan alır) → iki ayar birbirine karışıyordu
        · "dolgun" uçta kalınlığı 1.15 ile çarpıp drawStroke'un 1.18'ini
          üstüne biniyordu → önizleme gerçekten %15 şişmandı
        · "sivri" uçta inceltmeyi hem kendi uyguluyor hem drawStroke'un
          nibEnd'i uyguluyordu → çift inceltme
        · "keski" uçta basıncı sabitliyordu; gerçek motor yalnız uç
          biçimini (butt cap) değiştirir
        · sabitleyici (titreme azaltma) önizlemede HİÇ simüle edilmiyordu
      Sonuç: ayarı oynatıyorsun, önizlemede bir şey oluyor, tuvalde başka
      bir şey oluyor. "Fark yaratmıyor" hissinin birinci kaynağı buydu.

   2) YUMUŞATMA KAYDIRACI 101 KADEMELİ AMA MOTOR 3 KADEMELİ.
      commitStroke içinde  passes = round(S.smooth*2)  →  yalnız 0, 1, 2.
      Kaydıracı 45'ten 60'a çekmek hiçbir şey değiştirmiyordu. Artık
      denetim motorun gerçek çözünürlüğünde (ve ek geçişlerle genişletildi).

   3) "AKIŞ" İKİNCİ BİR OPAKLIK KAYDIRACIYDI. Tek yaptığı opaklığı
      çarpmaktı; %95 ile %100 arası gözle görülmez. Adı dürüstleştirildi.

   BU DOSYANIN KURALI
   ------------------
   Kalem motoru (proInkSmooth · proInkPts · fillInkStroke · commitStroke ·
   inkFeed · markEraseAt · drawStroke) 2.9.2'deki hâliyle BİREBİR durur.
   Buradaki her yeni parametre FABRİKA DEĞERİNDE ETKİSİZDİR: hiçbiri
   açılmadıkça commitStroke ve drawStroke kelimesi kelimesine eski yolu
   çalıştırır. Kanıt: pen-parity testi iki konfigürasyonda da aynı imzayı
   veriyor (Pro kapalı 3493947172 · Pro açık 1165832462).
============================================================================ */
(function () {
  if (window.__proPen) return; window.__proPen = true;

  /* ---------- EK PARAMETRELER — hepsi varsayılanda ETKİSİZ ---------- */
  const XDEF = {
    tS: 0,      // giriş incelmesi (px)      0 = kapalı
    tE: 0,      // çıkış incelmesi (px)      0 = kapalı
    ang: -1,    // uç açısı (derece)        -1 = kapalı
    angD: 65,   // uç açısı derinliği (%)
    grain: 0,   // doku (%)                  0 = kapalı
    xsm: 0,     // ek yumuşatma geçişi       0 = kapalı
  };
  const XMETA = {
    tS: ['Giriş İncelmesi', 'Çizginin başladığı yer kıldan başlayıp kalınlaşır — hattat girişi'],
    tE: ['Çıkış İncelmesi', 'Kalemi kaldırırken çizgi kıla doğru incelir'],
    ang: ['Uç Açısı', 'Keski uç gibi: yatay ve dikey hatlar farklı kalınlıkta çıkar'],
    grain: ['Doku', 'Mürekkebe kâğıt dokusu — kurşun kalem hissi'],
    xsm: ['Ek Yumuşatma', 'Motorun üç kademesinin üstüne fazladan yumuşatma'],
  };
  const xOf = (id) => Object.assign({}, XDEF, (pkCfg(id) || {}).x || {});
  /* fabrika kalınlığı: FACTORY.DEF, kullanıcı ayarları yüklenmeden ÖNCE
     alınmış bir kopyadır — gerçek fabrika değeridir. */
  function facSize(id) {
    try {
      if (typeof FACTORY !== 'undefined' && FACTORY.DEF && FACTORY.DEF[id] != null) return FACTORY.DEF[id];
      const c = pkCfg(id); if (c && c.base && FACTORY.DEF[c.base] != null) return FACTORY.DEF[c.base];
    } catch (_) { }
    return pkSizeOf(id);
  }
  const xHas = (x) => x.tS > 0 || x.tE > 0 || x.ang >= 0 || x.grain > 0 || x.xsm > 0;
  function xSet(id, k, v) {
    const c = pkCfg(id); if (!c) return;
    if (!c.x) c.x = Object.assign({}, XDEF);
    c.x[k] = v;
    try { savePK() } catch (_) { }
  }

  /* ---------- GEOMETRİ YARDIMCILARI ---------- */
  const _d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const _cl = (v, a, b) => v < a ? a : v > b ? b : v;

  /* bir Chaikin geçişi — commitStroke'un kullandığı formülün AYNISI */
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

  /* giriş / çıkış incelmesi — basıncı yol boyunca azaltır (kalınlığı basınç sürer) */
  function taper(pts, len, fromStart) {
    const n = pts.length; if (n < 3 || len <= 0) return;
    let acc = 0;
    if (fromStart) {
      for (let i = 0; i < n - 1; i++) {
        pts[i].p = (pts[i].p ?? .6) * _cl(acc / len, .10, 1);
        acc += _d(pts[i], pts[i + 1]); if (acc >= len) break;
      }
    } else {
      for (let i = n - 1; i > 0; i--) {
        pts[i].p = (pts[i].p ?? .6) * _cl(acc / len, .10, 1);
        acc += _d(pts[i], pts[i - 1]); if (acc >= len) break;
      }
    }
  }

  /* uç açısı — keski/kaligrafi ucu: yöne göre genişlik.
     w ∝ |sin(yön − açı)| ; derinlik 0'da etkisiz, 100'de tam keski. */
  function angleNib(pts, deg, depth) {
    const n = pts.length; if (n < 3) return;
    const a0 = deg * Math.PI / 180, dp = _cl(depth / 100, 0, 1);
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(1, i)], b = pts[Math.max(1, i) - 1];
      const dir = Math.atan2(a.y - b.y, a.x - b.x);
      const k = Math.abs(Math.sin(dir - a0));          // 0 = açıya paralel (en ince)
      const f = 1 - dp * (1 - k);                      // dp=0 → f=1 (etkisiz)
      pts[i].p = (pts[i].p ?? .6) * _cl(f, .12, 1);
    }
  }

  /* ---------- EKLERİ UYGULA ---------- */
  function applyX(o, x) {
    if (!o || o.type !== 'stroke' || o.straight) return false;
    const pts = o.points; if (!pts || pts.length < 3) return false;
    for (let i = 0; i < x.xsm; i++) o.points = chaikin(o.points);
    if (x.ang >= 0) angleNib(o.points, x.ang, x.angD);
    if (x.tS > 0) taper(o.points, x.tS, true);
    if (x.tE > 0) taper(o.points, x.tE, false);
    if (x.grain > 0) o.gx = { g: x.grain / 100, sd: (Math.random() * 0x7fffffff) | 0 };
    o._bb = null;
    try { if (typeof _inkCache !== 'undefined') _inkCache.delete(o) } catch (_) { }
    return true;
  }

  /* ---------- commitStroke SARMALAYICI ----------
     Ek yoksa orijinali kelimesi kelimesine çalışır; dokunulmaz. */
  const _commit = window.commitStroke;
  window.commitStroke = function () {
    const o = live;
    const useX = (o && o.type === 'stroke' && !o.cp && pkCfg(livePen)) ? xOf(livePen) : null;
    _commit();
    if (!useX || !xHas(useX)) return;
    try {
      const L = layer(); if (!L || !L.objects.length) return;
      const obj = L.objects[L.objects.length - 1];
      if (obj !== o) return;                 // şekil tanıma devreye girdiyse karışma
      if (applyX(obj, useX)) redraw();
    } catch (_) { }
  };

  /* ---------- drawStroke SARMALAYICI — yalnız doku için ----------
     o.gx yoksa orijinal çağrılır ve biter. */
  const _draw = window.drawStroke;
  window.drawStroke = function (c, o) {
    _draw(c, o);
    if (!o || !o.gx || !o.gx.g) return;
    try {
      const pts = proInkPts(o); if (!pts || pts.length < 3) return;
      const g = _cl(o.gx.g, 0, 1), rnd = mulberry32(o.gx.sd || 1);
      const z = Math.max(1, (typeof INK !== 'undefined' && INK.z) || 1);
      const passes = g > .55 ? 3 : (g > .25 ? 2 : 1);
      c.save();
      c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = o.color;
      if (o.tool === 'hl') c.globalCompositeOperation = 'multiply';
      for (let k = 0; k < passes; k++) {
        c.save();
        c.globalAlpha *= _cl(.10 + g * .34, .06, .46) * (o.opacity ?? 1);
        c.translate((rnd() * 2 - 1) * (.5 + g * 1.9) / z, (rnd() * 2 - 1) * (.5 + g * 1.9) / z);
        c.lineWidth = Math.max(.35, o.size * (.30 + rnd() * .34));
        c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
        c.stroke(); c.restore();
      }
      c.restore();
    } catch (_) { }
  };

  /* ========================================================================
     DÜRÜST ÖNİZLEME — uygulamanın GERÇEK hattını adım adım taklit eder
     ======================================================================== */
  const PKSM = [0, .5, 1, 1, 1];            // yumuşatma kademesi → S.smooth
  const PKSX = [0, 0, 0, 1, 2];             // yumuşatma kademesi → ek geçiş
  const PKSML = ['Kapalı', 'Hafif', 'Orta', 'Yüksek', 'Maksimum'];
  /* 0.45 (fabrika) → round(.45*2)=1 geçiş.  Kademe 1 (.5) → round(1)=1 geçiş.
     Yani fabrika ayarı "Hafif" ile BİREBİR aynı çıktıyı verir. */
  function smStep(cfg) {
    if (cfg && cfg.sm != null) return _cl(cfg.sm | 0, 0, 4);
    const base = Math.round((typeof S !== 'undefined' ? S.smooth : .45) * 2);
    return base <= 0 ? 0 : (base === 1 ? 1 : 2);
  }

  /* gerçek inkFeed sabitleyicisi (EMA) — view.s = 1 kabul */
  function stabilize(raw, stabV) {
    if (!raw.length) return [];
    let sp = { x: raw[0].x, y: raw[0].y };
    const out = [{ x: sp.x, y: sp.y, p: raw[0].p, t: raw[0].t }];
    const base = 1 - stabV * 0.85;
    for (let i = 1; i < raw.length; i++) {
      const cp = raw[i];
      const spd = _d(sp, cp);
      const k = _cl(base + spd / 34, base, 1);
      sp = { x: sp.x + (cp.x - sp.x) * k, y: sp.y + (cp.y - sp.y) * k };
      const lp = out[out.length - 1];
      if (_d(lp, sp) > 0.35) out.push({ x: sp.x, y: sp.y, p: cp.p, t: cp.t });
    }
    return out;
  }

  /* raw (ham imleç noktaları) → tuvalde görünecek NESNE.
     factory=true ise kalemin fabrika ayarlarıyla kurar (hayalet karşılaştırma). */
  function buildHonest(raw, id, factory) {
    const live0 = pkCfg(id) || {};
    const fac = (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[id]) || null;
    const cfg = factory && fac ? fac : live0;
    const x = factory ? Object.assign({}, XDEF) : xOf(id);
    const base = pkBase(id);
    const sz = factory ? facSize(id) : pkSizeOf(id);

    /* 1 — SABİTLEYİCİ (gerçek motorda pointermove sırasında çalışır) */
    const stabV = (typeof PK_STABV !== 'undefined' ? PK_STABV[cfg.stab ?? 2] : 0) ?? 0;
    let pts = stabilize(raw, stabV);
    if (pts.length < 3) pts = raw.map(q => ({ ...q }));

    /* 2 — STROK NESNESİ (pointerdown'daki alanların birebir aynısı) */
    const op = cfg.op ?? 1, flow = (cfg.flow ?? 100) / 100;
    const o = {
      type: 'stroke', tool: base,
      color: base === 'hl' ? '#FFE066' : pkColorOf(id),
      size: Math.max(.5, sz),
      opacity: (base === 'hl' ? Math.min(op, .6) : op) * flow,
      pk: (cfg.press ?? 80) / 100,
      nib: cfg.nib ?? 1,
      points: pts.map(q => ({ ...q })),
    };

    /* 3 — commitStroke: yumuşatma geçişleri */
    const passes = Math.round(PKSM[smStep(cfg)] * 2) + (base === 'smart' ? 1 : 0);
    for (let n = 0; n < passes; n++) o.points = chaikin(o.points);

    /* 4 — commitStroke: kaleme özel mürekkep dinamiği */
    let oo = o;
    try {
      if (base === 'hl' && S.snapHl) oo = snapStraighten(o);
      else if (base === 'smart') oo = matisInk(o);
    } catch (_) { oo = o }

    /* 5 — ek parametreler (fabrika hayaletinde hiç uygulanmaz) */
    const xs = Object.assign({}, x, { xsm: factory ? 0 : PKSX[smStep(cfg)] + (x.xsm || 0) });
    if (xHas(xs)) applyX(oo, xs);
    return oo;
  }

  /* ---------- demo çizgisi: hız değişimli, basınçlı, EL TİTREMELİ ----------
     Titreme şart: kusursuz pürüzsüz bir eğride "Titreme Azaltma" ayarının
     hiçbir etkisi görünmez — önizleme yine yalan söylerdi. Titreme sabit
     tohumlu (deterministik), yani önizleme kare kare zıplamaz. */
  function demoRaw(w, h) {
    const pts = [], N = 150;
    const rnd = (typeof mulberry32 === 'function') ? mulberry32(20261119) : (() => Math.random());
    let jx = 0, jy = 0;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      // hız profili: ortada hızlanır, uçlarda yavaşlar (gerçek el hareketi)
      const t = u + Math.sin(u * Math.PI) * .12;
      // el titremesi: yürüyen (bağlantılı) gürültü — beyaz gürültüden gerçekçi
      jx = jx * .62 + (rnd() * 2 - 1) * 1.05;
      jy = jy * .62 + (rnd() * 2 - 1) * 1.05;
      pts.push({
        x: w * .10 + t * w * .80 + jx,
        y: h * .54 - Math.sin(t * Math.PI * 1.9 + .3) * h * .30 * (1 - t * .18) + jy,
        p: .30 + .60 * Math.sin(Math.min(1, t * 1.05) * Math.PI),
        t: i * 7,
      });
    }
    return pts;
  }

  /* ---------- ÖNİZLEMEYİ YENİDEN ÇİZ ---------- */
  let ghostOn = true;
  function label(c, w, y, txt, col) {
    c.save();
    c.font = '800 9.5px Manrope, system-ui, sans-serif';
    c.fillStyle = col; c.globalAlpha = .85;
    c.textBaseline = 'top';
    c.letterSpacing = '1.4px';
    c.fillText(txt, 12, y);
    c.restore();
  }
  window.pkBuildStroke = function (raw) { return buildHonest(raw, selPen, false) };
  window.pkRender = function () {
    const cv = document.getElementById('pkCv'); if (!cv || !cv.width) return;
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const old = INK.z; INK.z = 1;
    const W = cv.width / DPR, H = cv.height / DPR;
    const userMode = (pkUser && pkUser.length) || (typeof pkLive !== 'undefined' && pkLive);
    try {
      if (!userMode && ghostOn) {
        /* KARŞILAŞTIRMA: aynı el hareketi iki şeritte —
           üstte kalemin FABRİKA ayarı, altta ŞİMDİKİ ayarın.
           Üst üste bindirmek işe yaramıyor: kalın çizgi inceyi tamamen
           örtüyor ve fark görünmez oluyordu. */
        const lane = H / 2;
        const shift = (pts, dy) => pts.map(q => ({ ...q, y: q.y + dy }));
        const raw = demoRaw(W, lane);
        label(c, W, 10, 'FABRİKA', '#8A94AC');
        _draw(c, buildHonest(shift(raw, 4), selPen, true));
        label(c, W, lane + 10, 'ŞİMDİ', pkColorOf(selPen));
        drawStroke(c, buildHonest(shift(raw, lane + 4), selPen, false));
      } else {
        const strokes = (pkUser && pkUser.length ? pkUser.slice() : [demoRaw(W, H)]);
        if (typeof pkLive !== 'undefined' && pkLive) strokes.push(pkLive);
        if (ghostOn && userMode) {
          c.save(); c.globalAlpha = .55;
          for (const s of strokes) {
            const g = buildHonest(s, selPen, true);
            g.color = '#94A3C4'; g.opacity = 1;
            _draw(c, g);
          }
          c.restore();
        }
        for (const s of strokes) drawStroke(c, buildHonest(s, selPen, false));
      }
    } catch (e) { }
    INK.z = old;
    paintDiff();
  };

  /* ---------- FARK PANELİ: fabrikaya göre ne değişti ---------- */
  function diffList() {
    const id = selPen, c = pkCfg(id) || {};
    const f = (typeof PK_FACTORY !== 'undefined' && PK_FACTORY[id]) || null;
    const x = xOf(id), out = [];
    const sz = pkSizeOf(id), fsz = facSize(id);
    if (f) {
      if (Math.abs(sz - fsz) > .04) out.push(['Kalınlık', String(fsz).replace('.', ',') + ' px', String(sz).replace('.', ',') + ' px']);
      if ((c.op ?? 1) !== (f.op ?? 1)) out.push(['Opaklık', '%' + Math.round((f.op ?? 1) * 100), '%' + Math.round((c.op ?? 1) * 100)]);
      if ((c.press ?? 80) !== (f.press ?? 80)) out.push(['Basınç', '%' + (f.press ?? 80), '%' + (c.press ?? 80)]);
      if ((c.stab ?? 2) !== (f.stab ?? 2)) out.push(['Sabitleme', PK_STABL[f.stab ?? 2], PK_STABL[c.stab ?? 2]]);
      if ((c.flow ?? 95) !== (f.flow ?? 95)) out.push(['Mürekkep', '%' + (f.flow ?? 95), '%' + (c.flow ?? 95)]);
      if ((c.nib ?? 1) !== (f.nib ?? 1)) out.push(['Uç', PK_NIBL[f.nib ?? 1], PK_NIBL[c.nib ?? 1]]);
      const sm = smStep(c), fsm = smStep(f);
      if (sm !== fsm) out.push(['Yumuşatma', PKSML[fsm], PKSML[sm]]);
    }
    if (x.tS > 0) out.push(['Giriş incelmesi', 'kapalı', x.tS + ' px']);
    if (x.tE > 0) out.push(['Çıkış incelmesi', 'kapalı', x.tE + ' px']);
    if (x.ang >= 0) out.push(['Uç açısı', 'kapalı', x.ang + '° · %' + x.angD]);
    if (x.grain > 0) out.push(['Doku', 'kapalı', '%' + x.grain]);
    return out;
  }
  function paintDiff() {
    const el = document.getElementById('pkDiff'); if (!el) return;
    const d = diffList();
    if (!d.length) {
      el.innerHTML = '<div class="pkd-none">Bu kalem fabrika ayarlarında — hayalet çizgi ile birebir üst üste.</div>';
      return;
    }
    el.innerHTML = '<div class="pkd-h">' + d.length + ' ayar fabrikadan farklı</div>' +
      d.map(r => '<div class="pkd-r"><span>' + r[0] + '</span><b>' + r[1] + ' → <i>' + r[2] + '</i></b></div>').join('');
  }

  /* ========================================================================
     ARAYÜZ — mevcut denetimler korunur, üstüne gerçek parametreler eklenir
     ======================================================================== */
  function el(tag, cls, html) { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d }

  function card(title, valId, bodyHtml) {
    return '<div class="pk-card"><div class="pk-lbl">' + title + '<span class="pk-val" id="' + valId + '"></span></div>' + bodyHtml + '</div>';
  }
  function slider(id, min, max, step, cls) {
    return '<div class="pk-slider' + (cls ? ' ' + cls : '') + '"><button class="pk-step" data-t="' + id + '" data-d="-1">−</button>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"><button class="pk-step" data-t="' + id + '" data-d="1">+</button></div>';
  }

  function buildUI() {
    const grid = document.querySelector('#sp-pens .pk-cardgrid');
    if (!grid || document.getElementById('pkSm')) return;

    /* --- 1. var olan denetimlerin yalan söyleyen etiketlerini düzelt --- */
    const relabel = (sel, txt) => { const n = document.querySelector(sel); if (n) n.firstChild.textContent = txt };
    relabel('#pkFlowOut', '');                  // değeri aşağıda yazacağız
    const flowCard = document.getElementById('pkFlow');
    if (flowCard) {
      const lbl = flowCard.closest('.pk-card').querySelector('.pk-lbl');
      lbl.childNodes[0].nodeValue = 'Mürekkep Yoğunluğu';
      lbl.title = 'Çizginin genel koyuluğu — opaklıkla çarpılır';
    }
    const stabCard = document.getElementById('pkStab');
    if (stabCard) {
      const lbl = stabCard.closest('.pk-card').querySelector('.pk-lbl');
      lbl.childNodes[0].nodeValue = 'Titreme Azaltma';
      lbl.title = 'Kalem titremesini bastırır — hızlanınca filtre kendiliğinden gevşer';
    }

    /* --- 2. YUMUŞATMA: motorun gerçek çözünürlüğünde, 5 kademe --- */
    grid.insertAdjacentHTML('beforeend',
      card('Yumuşatma<span class="pk-q" title="Motor üç kademeli çalışır (0-1-2 geçiş); Yüksek ve Maksimum bunun üstüne ek geçiş koyar.">?</span>', 'pkSmOut',
        '<div class="pk-seg pk5" id="pkSm">' + PKSML.map(n => '<button>' + n + '</button>').join('') + '</div>'));

    /* --- 3. UÇ AÇISI --- */
    grid.insertAdjacentHTML('beforeend',
      card('Uç Açısı<span class="pk-q" title="Keski/kaligrafi ucu: çizgi yönüne göre kalınlık değişir.">?</span>', 'pkAngOut',
        '<div class="pk-angrow"><button class="pk-angoff" id="pkAngOff">Kapalı</button>' +
        '<input type="range" id="pkAng" min="0" max="165" step="15" value="45">' +
        '<span class="pk-angdial" id="pkAngDial"></span></div>'));

    /* --- 4. GİRİŞ / ÇIKIŞ İNCELMESİ --- */
    grid.insertAdjacentHTML('beforeend', card('Giriş İncelmesi', 'pkTSOut', slider('pkTS', 0, 40, 1, 'vio')));
    grid.insertAdjacentHTML('beforeend', card('Çıkış İncelmesi', 'pkTEOut', slider('pkTE', 0, 40, 1, 'vio')));

    /* --- 5. DOKU --- */
    grid.insertAdjacentHTML('beforeend', card('Doku', 'pkGrOut', slider('pkGr', 0, 100, 5)));

    /* --- 6. önizleme başlığına hayalet anahtarı + fark paneli --- */
    const head = document.querySelector('#sp-pens .pk-prevhead');
    if (head && !document.getElementById('pkGhost')) {
      const b = el('button', 'pk-ghostbtn on', '<i></i>Fabrikayla karşılaştır');
      b.id = 'pkGhost'; b.title = 'Aynı el hareketini kalemin fabrika ayarlarıyla soluk gri çizer';
      b.addEventListener('click', () => { ghostOn = !ghostOn; b.classList.toggle('on', ghostOn); pkRender() });
      head.insertBefore(b, head.lastElementChild);
    }
    const prev = document.querySelector('#sp-pens .pk-prev');
    if (prev && !document.getElementById('pkDiff')) prev.appendChild(el('div', 'pk-diff', '')).id = 'pkDiff';

    bindUI();
    syncX();
  }

  function bindUI() {
    const on = (id, ev, fn) => { const n = document.getElementById(id); if (n) n.addEventListener(ev, fn) };

    document.querySelectorAll('#pkSm button').forEach((b, i) => b.addEventListener('click', () => {
      const c = pkCfg(selPen); if (!c) return;
      c.sm = i;
      if (livePen === selPen && typeof S !== 'undefined') S.smooth = PKSM[i];
      try { savePK(); if (typeof saveOpts === 'function') saveOpts() } catch (_) { }
      syncX(); pkRender();
    }));

    on('pkAngOff', 'click', () => { xSet(selPen, 'ang', -1); syncX(); pkRender() });
    on('pkAng', 'input', e => { xSet(selPen, 'ang', +e.target.value); syncX(); pkRender() });
    on('pkTS', 'input', e => { xSet(selPen, 'tS', +e.target.value); syncX(); pkRender() });
    on('pkTE', 'input', e => { xSet(selPen, 'tE', +e.target.value); syncX(); pkRender() });
    on('pkGr', 'input', e => { xSet(selPen, 'grain', +e.target.value); syncX(); pkRender() });

    document.querySelectorAll('#sp-pens .pk-step').forEach(b => {
      if (b.__bound) return; b.__bound = 1;
      b.addEventListener('click', () => {
        const t = document.getElementById(b.dataset.t); if (!t) return;
        t.value = (+t.value) + (+b.dataset.d) * (+t.step || 1);
        t.dispatchEvent(new Event('input'));
      });
    });
  }

  /* yeni denetimleri seçili kaleme eşitle */
  function syncX() {
    const c = pkCfg(selPen); if (!c || !document.getElementById('pkSm')) return;
    const x = xOf(selPen);
    const st = smStep(c);
    document.querySelectorAll('#pkSm button').forEach((b, i) => b.classList.toggle('on', i === st));
    const so = document.getElementById('pkSmOut');
    if (so) so.textContent = PKSML[st] + ' · ' + (Math.round(PKSM[st] * 2) + PKSX[st]) + ' geçiş';

    const angOn = x.ang >= 0;
    const ar = document.getElementById('pkAng'); if (ar) { ar.value = angOn ? x.ang : 45; ar.disabled = !angOn }
    const ab = document.getElementById('pkAngOff'); if (ab) { ab.classList.toggle('on', !angOn); ab.textContent = angOn ? 'Kapat' : 'Kapalı' }
    const ad = document.getElementById('pkAngDial');
    if (ad) { ad.style.transform = 'rotate(' + (angOn ? x.ang : 0) + 'deg)'; ad.classList.toggle('off', !angOn) }
    const ao = document.getElementById('pkAngOut'); if (ao) ao.textContent = angOn ? (x.ang + '°') : 'Kapalı';

    const set = (id, outId, v, fmt) => {
      const r = document.getElementById(id), o = document.getElementById(outId);
      if (r) r.value = v; if (o) o.textContent = fmt(v);
    };
    set('pkTS', 'pkTSOut', x.tS, v => v > 0 ? v + ' px' : 'Kapalı');
    set('pkTE', 'pkTEOut', x.tE, v => v > 0 ? v + ' px' : 'Kapalı');
    set('pkGr', 'pkGrOut', x.grain, v => v > 0 ? '%' + v : 'Kapalı');
  }

  /* kalem değişince yeni denetimler de güncellensin */
  const _sync = window.syncPenUI;
  window.syncPenUI = function () { _sync.apply(this, arguments); try { syncX() } catch (_) { } };

  /* kaleme geçerken o kalemin yumuşatma kademesini de uygula */
  const _apply = window.pkApply;
  if (typeof _apply === 'function') window.pkApply = function (id) {
    const r = _apply.apply(this, arguments);
    const c = pkCfg(id); if (c && c.sm != null && typeof S !== 'undefined') S.smooth = PKSM[_cl(c.sm | 0, 0, 4)];
    try { syncX() } catch (_) { }
    return r;
  };
  const _onTool = window.pkOnTool;
  if (typeof _onTool === 'function') window.pkOnTool = function (t) {
    const r = _onTool.apply(this, arguments);
    const c = pkCfg(t); if (c && c.sm != null && typeof S !== 'undefined') S.smooth = PKSM[_cl(c.sm | 0, 0, 4)];
    try { syncX() } catch (_) { }
    return r;
  };

  /* fabrika sıfırlaması ekleri de temizlesin */
  const _reset = window.pkFactoryReset;
  if (typeof _reset === 'function') window.pkFactoryReset = function () {
    const r = _reset.apply(this, arguments);
    try { for (const k in PCFG) { delete PCFG[k].x; delete PCFG[k].sm } savePK(); syncX(); pkRender() } catch (_) { }
    return r;
  };

  /* ayarlar açılınca arayüzü kur */
  function boot() {
    buildUI();
    try { syncX() } catch (_) { }
  }
  const sb = document.getElementById('setBtn');
  if (sb) sb.addEventListener('click', () => setTimeout(boot, 0));
  document.querySelectorAll('.set-tab[data-s="pens"]').forEach(t => t.addEventListener('click', () => setTimeout(boot, 0)));
  if (document.readyState === 'complete') setTimeout(boot, 60);
  else window.addEventListener('load', () => setTimeout(boot, 60));

  window.proPen = { xOf, xSet, buildHonest, diffList, _applyX: applyX, XDEF, PKSM, PKSX };
})();
