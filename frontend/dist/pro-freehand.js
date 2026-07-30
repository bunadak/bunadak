/* =============================================================================
 * Notis PRO — GELİŞMİŞ SERBEST ÇİZİM MOTORU  ("perfect freehand" sınıfı)
 *
 * Klasik değişken-kalınlık çizimi, çizginin iki yanına dik ofset atıp aradaki
 * rayları eğriyle birleştirir. Bu yöntem keskin dönüşlerde çöker: dış tarafta
 * çentik açılır, iç tarafta raylar birbirini keser ve harf köşelerinde
 * "damla"/"papyon" izleri oluşur. Uçlar da düz kesilir; çizgi kâğıda konup
 * kalkmış gibi görünmez.
 *
 * Bu motor, açık kaynak dünyasında standart kabul edilen kalem hattını kurar:
 *
 *   1) YOĞUNLAŞTIRMA — merkez hattı, o noktadaki kalem yarıçapına göre yeniden
 *      örneklenir. Kalın kalemde seyrek, ince kalemde sık: ray daima pürüzsüz.
 *   2) DİRSEK YAYI — her köşede dönüş açısı ölçülür. Dönüş sertse DIŞ tarafa
 *      gerçek bir yay (kalem ucunun döndüğü yay) eklenir, İÇ taraf ofseti
 *      komşu segment uzunluğuyla sınırlanır. Çentik de papyon da oluşmaz.
 *   3) UÇ KAPAKLARI — başlangıç ve bitiş, yarıçapı takip eden yarım daire
 *      yaylarla kapatılır; incelen uçta kapak da incelir.
 *   4) TEK POLİGON DOLGUSU — bütün gövde tek bir kapalı yolda doldurulur;
 *      yarı saydam kalemlerde bindirme lekesi olmaz.
 *
 * Ayrıca her kaleme kendi KARAKTER PROFİLİ verilir (incelme genliği, uç
 * koniği, basınç/hız karışımı, ıslaklık). Arayüzdeki 5 kalem ve çarktaki 10
 * kalem ayrı ayrı kalibre edilmiştir — hepsi aynı motoru kullanır, ama hiçbiri
 * diğerine benzemez.
 *
 * Motor kapatılabilir (Ayarlar › Çizim). Kapalıyken uygulamanın özgün
 * fillInkStroke'u geri yüklenir; tek satırı bile çalışmaz.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_fh_opts";
  var DEF = { on: true, quality: "high", taper: true, corners: true };
  var P = load();

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {}; for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  function $id(x) { return document.getElementById(x); }

  /* Kalite: yay çözünürlüğü ve yoğunlaştırma adımı */
  var Q = {
    fast:   { arc: 5,  dens: 1.15, minStep: 1.10 },
    high:   { arc: 9,  dens: 0.80, minStep: 0.70 },
    ultra:  { arc: 14, dens: 0.55, minStep: 0.45 }
  };
  function q() { return Q[P.quality] || Q.high; }

  /* ======================================================== ÇEKİRDEK GEOMETRİ

     TAHSİSAT DİSİPLİNİ — kalabalık bir tahtada 400+ çizgi her karede yeniden
     çizilir. Nokta başına {x,y} nesnesi üretmek çöp toplayıcıyı boğar ve
     kareler düşer. Bu yüzden tüm ara veri, modül düzeyinde bir kez ayrılan ve
     gerektikçe büyüyen TİPLİ TAMPONLARDA tutulur: çizim başına sıfır tahsisat.
     ==================================================================== */

  var BUF = {
    px: new Float64Array(0), py: new Float64Array(0), pr: new Float64Array(0), // yoğunlaştırılmış merkez
    dx: new Float64Array(0), dy: new Float64Array(0),                          // segment yönleri
    sg: new Float64Array(0),                                                   // segment uzunlukları
    lx: new Float64Array(0), ly: new Float64Array(0),                          // sol ray
    rx: new Float64Array(0), ry: new Float64Array(0),                          // sağ ray
    n: 0, ln: 0, rn: 0
  };
  function grow(n) {
    if (BUF.px.length >= n) return;
    var m = 1 << Math.ceil(Math.log(Math.max(64, n)) / Math.LN2);
    BUF.px = new Float64Array(m); BUF.py = new Float64Array(m); BUF.pr = new Float64Array(m);
    BUF.dx = new Float64Array(m); BUF.dy = new Float64Array(m); BUF.sg = new Float64Array(m);
    /* Raylar köşe yaylarıyla büyüyebilir: nokta başına en kötü ARC+2 giriş */
    var r = m * 20;
    BUF.lx = new Float64Array(r); BUF.ly = new Float64Array(r);
    BUF.rx = new Float64Array(r); BUF.ry = new Float64Array(r);
  }

  /* Merkez hattını yerel kalem yarıçapına göre yoğunlaştırır.
     Girdi zaten sıksa (uygulamanın kendi yumuşatması sonrası genelde öyledir)
     tek bir kopya geçişi yapılır — ek nokta üretilmez. */
  function densify(pts, R, L0, step) {
    var n = 0, i, k;
    BUF.px[0] = pts[0].x; BUF.py[0] = pts[0].y; BUF.pr[0] = R[0]; n = 1;
    for (i = 1; i < L0; i++) {
      var ax = pts[i - 1].x, ay = pts[i - 1].y;
      var bx = pts[i].x, by = pts[i].y;
      var ddx = bx - ax, ddy = by - ay;
      var d = Math.sqrt(ddx * ddx + ddy * ddy);
      var ra = R[i - 1], rb = R[i];
      var lim = (ra < rb ? ra : rb) * 0.55;
      if (lim < step) lim = step;
      if (d > lim * 1.6) {
        var seg = Math.ceil(d / lim);
        if (seg > 24) seg = 24;
        for (k = 1; k < seg; k++) {
          var t = k / seg;
          BUF.px[n] = ax + ddx * t; BUF.py[n] = ay + ddy * t;
          BUF.pr[n] = ra + (rb - ra) * t; n++;
        }
      }
      BUF.px[n] = bx; BUF.py[n] = by; BUF.pr[n] = rb; n++;
    }
    BUF.n = n;
    return n;
  }

  /* Dış hattı kurar: sol/sağ raylar tipli tamponlara yazılır */
  function buildOutline(L, cfg) {
    var px = BUF.px, py = BUF.py, pr = BUF.pr;
    var dx = BUF.dx, dy = BUF.dy, sg = BUF.sg;
    var lx = BUF.lx, ly = BUF.ly, rx = BUF.rx, ry = BUF.ry;
    var i, a, b, d;

    for (i = 0; i < L - 1; i++) {
      a = px[i + 1] - px[i]; b = py[i + 1] - py[i];
      d = Math.sqrt(a * a + b * b);
      sg[i] = d;
      if (d < 1e-9) d = 1;
      dx[i] = a / d; dy[i] = b / d;
    }
    if (L > 1) { dx[L - 1] = dx[L - 2]; dy[L - 1] = dy[L - 2]; sg[L - 1] = sg[L - 2]; }
    else { dx[0] = 1; dy[0] = 0; sg[0] = 0; }

    var ln = 0, rn = 0, ARC = cfg.arc, corners = cfg.corners;

    for (i = 0; i < L; i++) {
      var cx = px[i], cy = py[i], r = pr[i];
      var ax = (i > 0 ? dx[i - 1] : dx[0]), ay = (i > 0 ? dy[i - 1] : dy[0]);
      var bx = dx[i], by = dy[i];
      var dot = ax * bx + ay * by;

      if (!corners || dot > 0.5 || i === 0 || i === L - 1) {
        /* Yumuşak bölüm — açıortay normali + miter telafisi.
           Telafi olmadan dar açılarda açıortay kısalır ve çizgi köşede
           incelirdi (kalem "eziliyor" gibi görünüyordu). */
        var mx = ax + bx, my = ay + by;
        var m = Math.sqrt(mx * mx + my * my);
        if (m < 1e-9) { mx = bx; my = by; m = 1; }
        mx /= m; my /= m;
        var kk = 1;
        if (dot > -0.999) {
          var h = Math.sqrt((1 + dot) * 0.5);
          if (h < 0.45) h = 0.45;
          kk = 1 / h; if (kk > 2.2) kk = 2.2;
        }
        var w = r * kk;
        lx[ln] = cx - my * w; ly[ln] = cy + mx * w; ln++;
        rx[rn] = cx + my * w; ry[rn] = cy - mx * w; rn++;
        continue;
      }

      /* KÖŞE — dış tarafa kalem ucunun döndüğü gerçek yay, iç tarafa tek
         açıortay noktası (komşu segmentle sınırlı). cross>0 → dış taraf SAĞ. */
      var cross = ax * by - ay * bx;
      var turn = Math.atan2(cross, dot);
      var s0 = sg[i > 0 ? i - 1 : 0], s1 = sg[i];
      var inLim = (s0 < s1 ? s0 : s1) * 0.5;
      if (inLim > r) inLim = r;
      if (inLim < 0.35) inLim = 0.35;

      var onx, ony, inax, inay, inbx, inby, right = cross > 0;
      if (right) { onx = ay; ony = -ax; inax = -ay; inay = ax; inbx = -by; inby = bx; }
      else       { onx = -ay; ony = ax; inax = ay; inay = -ax; inbx = by; inby = -bx; }

      for (var s = 0; s <= ARC; s++) {
        var t2 = turn * (s / ARC);
        var cs = Math.cos(t2), sn = Math.sin(t2);
        var nx = onx * cs - ony * sn, ny = onx * sn + ony * cs;
        if (right) { rx[rn] = cx + nx * r; ry[rn] = cy + ny * r; rn++; }
        else       { lx[ln] = cx + nx * r; ly[ln] = cy + ny * r; ln++; }
      }
      var ibx = inax + inbx, iby = inay + inby;
      var ib = Math.sqrt(ibx * ibx + iby * iby);
      if (ib < 1e-9) { ibx = inbx; iby = inby; ib = 1; }
      ibx = ibx / ib * inLim; iby = iby / ib * inLim;
      if (right) { lx[ln] = cx + ibx; ly[ln] = cy + iby; ln++; }
      else       { rx[rn] = cx + ibx; ry[rn] = cy + iby; rn++; }
    }
    BUF.ln = ln; BUF.rn = rn;
  }

  /* Uygulamanın fillInkStroke sözleşmesi: (ctx, points, widthAt) → dolgu */
  var RBUF = new Float64Array(0);
  function fillInkStrokeFH(c, rawPts, widthAt) {
    if (!rawPts || !rawPts.length) return;
    var qq = q();
    var ARC = qq.arc, step = qq.minStep, corners = P.corners;

    /* 0) çakışık noktaları ele (yerinde, tek geçiş) */
    var src = rawPts, n0 = src.length, i;
    var idx = FIDX; if (idx.length < n0) idx = FIDX = new Int32Array(1 << Math.ceil(Math.log(Math.max(64, n0)) / Math.LN2));
    var L0 = 0; idx[L0++] = 0;
    for (i = 1; i < n0; i++) {
      var pv = src[idx[L0 - 1]], q2 = src[i];
      if (Math.abs(q2.x - pv.x) > 0.01 || Math.abs(q2.y - pv.y) > 0.01) idx[L0++] = i;
    }

    /* 1) yarıçaplar — widthAt'in indeks anlamı korunur (uç koniği bozulmaz) */
    if (RBUF.length < L0) RBUF = new Float64Array(1 << Math.ceil(Math.log(Math.max(64, L0)) / Math.LN2));
    var PBUF = FPTS; if (PBUF.length < L0) PBUF = FPTS = new Array(L0 * 2);
    for (i = 0; i < L0; i++) {
      var pt = src[idx[i]];
      PBUF[i] = pt;
      var w = widthAt(pt, i, L0);
      RBUF[i] = (w > 0.4 ? w : 0.4) * 0.5;
    }

    if (L0 === 1) {
      c.beginPath(); c.arc(PBUF[0].x, PBUF[0].y, RBUF[0] > 0.3 ? RBUF[0] : 0.3, 0, 7); c.fill(); return;
    }

    /* 2) yoğunlaştır → raylar pürüzsüz, köşe yayları düzgün oturur */
    grow(L0 * 3 + 8);
    var L = densify(PBUF, RBUF, L0, step);

    /* 3) dış hattı kur */
    buildOutline(L, { arc: ARC, corners: corners });
    var ln = BUF.ln, rn = BUF.rn;
    if (!ln || !rn) return;

    /* 4) tek kapalı yol: sol ray → bitiş kapağı → sağ ray (ters) → baş kapağı
       Raylar ÇOKGEN değil EĞRİ olarak çizilir (orta noktalardan geçen kuadratik):
       nokta aralığı belge biriminde sabit olduğundan düz çizgi kullanmak
       8× yakınlaştırmada kenarı basamaklandırırdı. Eğri çözünürlükten
       bağımsızdır. Köşelerde ray noktaları yay sayesinde zaten sık olduğundan
       eğri dirseği yuvarlamaz — keskin köşe keskin kalır. */
    var lx = BUF.lx, ly = BUF.ly, rx = BUF.rx, ry = BUF.ry;
    var px = BUF.px, py = BUF.py, pr = BUF.pr, dxA = BUF.dx, dyA = BUF.dy;

    c.beginPath();
    c.moveTo(lx[0], ly[0]);
    for (i = 1; i < ln - 1; i++)
      c.quadraticCurveTo(lx[i], ly[i], (lx[i] + lx[i + 1]) * 0.5, (ly[i] + ly[i + 1]) * 0.5);
    c.lineTo(lx[ln - 1], ly[ln - 1]);

    var eD = Math.atan2(dyA[L - 1], dxA[L - 1]);
    c.arc(px[L - 1], py[L - 1], pr[L - 1] > 0.2 ? pr[L - 1] : 0.2, eD + Math.PI / 2, eD - Math.PI / 2, true);

    for (i = rn - 1; i > 0; i--)
      c.quadraticCurveTo(rx[i], ry[i], (rx[i] + rx[i - 1]) * 0.5, (ry[i] + ry[i - 1]) * 0.5);
    c.lineTo(rx[0], ry[0]);

    var sD = Math.atan2(dyA[0], dxA[0]);
    c.arc(px[0], py[0], pr[0] > 0.2 ? pr[0] : 0.2, sD - Math.PI / 2, sD + Math.PI / 2, true);

    c.closePath();
    c.fill();
  }
  var FIDX = new Int32Array(0);
  var FPTS = [];

  /* ================================================== KALEM KARAKTER PROFİLLERİ
     Arayüzdeki 5 kalem — her biri ayrı kalibre. Alanlar:
       pr  basınç etkisi · vl  hız etkisi · thin incelme genliği
       tS/tE  uç koniği (piksel) · wet yavaşta mürekkep birikmesi
       base taban kalınlık oranı · flat gerçek basınç yokken hızdan üret
     Çark kalemleri kendi tanımlarını (CPENS) kullanır; bu motor onların
     taper/thinning değerlerini de gerçekten uygular. */
  var TOOLPROF = {
    smart:    { pr: .42, vl: .34, thin: .46, tS: 7,  tE: 11, wet: .06, base: .62, flat: true },
    ball:     { pr: .20, vl: .12, thin: .14, tS: 3,  tE: 4,  wet: 0,   base: .70, flat: true },
    fountain: { pr: .66, vl: .30, thin: .70, tS: 11, tE: 15, wet: .26, base: .58, flat: true },
    pencil:   { pr: .36, vl: .18, thin: .22, tS: 2,  tE: 3,  wet: 0,   base: .66, flat: true },
    hl:       null   // fosforlu: keçe uç — sabit hat doğrusu, şekillendirme yok
  };

  function dist(a, b) { var dx = b.x - a.x, dy = b.y - a.y; return Math.sqrt(dx * dx + dy * dy); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* Serbest kalem noktalarına karakter kazandırır: hız→basınç sentezi,
     basınç eğrisi, ıslaklık ve gerçek yay-uzunluğu tabanlı uç koniği.
     commitStroke'tan çağrılır; nesne verisi (points[].p) şekillenir. */
  function shapeStroke(o) {
    if (!P.on || !o || o.straight) return o;
    var prof = TOOLPROF[o.tool];
    if (!prof) return o;
    var pts = o.points, n = pts && pts.length;
    if (!n || n < 3) return o;

    /* Hız profili (px/ms), iki geçişli EMA ile yumuşatılır */
    var v = new Float64Array(n), i;
    for (i = 1; i < n; i++) {
      var dt = Math.max(1, (pts[i].t == null ? i : pts[i].t) - (pts[i - 1].t == null ? i - 1 : pts[i - 1].t));
      v[i] = dist(pts[i - 1], pts[i]) / dt;
    }
    v[0] = v[1];
    for (var k = 0; k < 2; k++) for (i = 1; i < n; i++) v[i] = v[i - 1] * .4 + v[i] * .6;
    var sorted = Array.prototype.slice.call(v).sort(function (a, b) { return a - b; });
    var vRef = Math.max(sorted[Math.floor(sorted.length * .9)], .02);

    /* Gerçek basınç var mı? (fare/parmak girişinde hepsi 0.5) */
    var flat = true;
    for (i = 0; i < n; i++) if (Math.abs((pts[i].p == null ? .5 : pts[i].p) - .5) > .03) { flat = false; break; }

    var amp = .25 + 1.15 * prof.thin;
    var ema = prof.base;
    for (i = 0; i < n; i++) {
      var vf = Math.pow(clamp(1 - v[i] / vRef, 0, 1), .72);      // yavaş = 1 (kalın)
      var pf = clamp(pts[i].p == null ? .5 : pts[i].p, 0, 1);
      if (flat && prof.flat) pf = vf;                            // basınç yoksa hızdan üret
      var dd = pf - .5;
      pf = .5 + (dd < 0 ? -1 : 1) * Math.pow(Math.abs(dd) * 2, 1.65) / 2;
      var w = prof.base + amp * (prof.vl * (vf - .5) * .9 + prof.pr * (pf - .5) * 1.1);
      if (prof.wet) w += prof.wet * .22 * vf;
      w = clamp(w, .24, 1.45);
      ema = ema * .58 + w * .42;
      pts[i].p = ema;
    }
    if (P.taper) applyTaper(pts, prof.tS, prof.tE);
    return o;
  }

  /* Uç koniği — yay uzunluğu boyunca, indeks değil. Yavaş çizilen kısa
     çizgide de hızlı çizilen uzun çizgide de aynı fiziksel uzunlukta incelir. */
  function applyTaper(pts, tS, tE) {
    var n = pts.length, acc, i;
    if (tS > 0) {
      acc = 0;
      for (i = 0; i < n - 1; i++) {
        pts[i].p *= clamp(acc / tS, .10, 1);
        acc += dist(pts[i], pts[i + 1]);
        if (acc >= tS) break;
      }
    }
    if (tE > 0) {
      acc = 0;
      for (i = n - 1; i > 0; i--) {
        pts[i].p *= clamp(acc / tE, .10, 1);
        acc += dist(pts[i], pts[i - 1]);
        if (acc >= tE) break;
      }
    }
  }

  /* ------------------------------------------------------------- KURULUM */
  var origFill = null;
  function install() {
    if (typeof window.fillInkStroke !== "function") return;
    if (!origFill) origFill = window.fillInkStroke.__fhOrig || window.fillInkStroke;
    if (P.on) {
      if (window.fillInkStroke.__fh) return;
      var w = function (c, pts, widthAt) {
        try { return fillInkStrokeFH(c, pts, widthAt); }
        catch (e) { return origFill(c, pts, widthAt); }   // motor asla çizimi kaybettirmez
      };
      w.__fh = true; w.__fhOrig = origFill;
      window.fillInkStroke = w;
    } else if (window.fillInkStroke.__fh) {
      window.fillInkStroke = origFill;
    }
  }

  /* ------------------------------------------------------------ OPSİYON UI */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function sec(t) { return el('<div class="set-sec-t" style="margin-top:18px">' + t + "</div>"); }
  function rowToggle(id, t, d, on, fn) {
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><label class="sw-toggle"><input type="checkbox" id="' + id + '"><i></i></label></div>');
    var i = r.querySelector("input"); i.checked = !!on;
    i.addEventListener("change", function () { fn(i.checked); save(); });
    return r;
  }
  function rowSeg(id, t, d, opts, cur2, fn) {
    var b = opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '"' + (o[0] === cur2 ? ' class="on"' : "") + ">" + o[1] + "</button>";
    }).join("");
    var r = el('<div class="set-row"><div><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><div class="pk-seg" id="' + id + '" style="flex:0 0 auto">' + b + "</div></div>");
    r.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        r.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        btn.classList.add("on"); fn(btn.dataset.v); save();
      });
    });
    return r;
  }
  function redrawSafe() { try { redraw(); } catch (_) {} }

  function build() {
    var draw = $id("sp-draw");
    if (!draw || draw.dataset.fh) return;
    draw.dataset.fh = "1";

    draw.appendChild(sec("Gelişmiş Serbest Çizim Motoru"));
    draw.appendChild(rowToggle("oFH", "🖋️ Gelişmiş Kalem Hattı",
      "Kalem ucunun gerçek geometrisi hesaplanır: keskin dönüşlerde <b>dış tarafa gerçek dirsek yayı</b> eklenir, " +
      "iç taraf komşu segmentle sınırlanır — harf köşelerindeki çentikler, damlalar ve papyon izleri kaybolur. " +
      "Çizgi tek kapalı poligon olarak doldurulur; yarı saydam kalemlerde bindirme lekesi olmaz. " +
      "<b>Arayüzdeki 5 kalemin ve çarktaki 10 kalemin hepsinde</b> geçerlidir.",
      P.on, function (v) { P.on = v; install(); redrawSafe(); }));

    draw.appendChild(rowSeg("oFHQ", "🎚️ Hat Çözünürlüğü",
      "Dirsek yaylarının ve ray yoğunlaştırmasının sıklığı. <b>Yüksek</b> günlük kullanım için idealdir; " +
      "<b>Ultra</b> büyük yakınlaştırma ve video kaydında cam gibi kenar verir.",
      [["fast", "Hızlı"], ["high", "Yüksek"], ["ultra", "Ultra"]], P.quality,
      function (v) { P.quality = v; redrawSafe(); }));

    draw.appendChild(rowToggle("oFHTaper", "🪶 Uç Koniği",
      "Çizginin başı ve sonu, <b>yay uzunluğu boyunca</b> incelir — kalem kâğıda konup kalkmış gibi görünür. " +
      "Her kalemin kendi koni uzunluğu vardır (dolma kalem uzun, tükenmez kısa, fosforlu hiç).",
      P.taper, function (v) { P.taper = v; }));

    draw.appendChild(rowToggle("oFHCorners", "📐 Dirsek Yayları",
      "Keskin dönüşlerde kalem ucunun döndüğü yay hesaplanır. Kapatırsan motor yalnız açıortay ofseti kullanır " +
      "(daha hızlı, ama sert köşelerde çentik oluşabilir).",
      P.corners, function (v) { P.corners = v; redrawSafe(); }));
  }

  function boot() { build(); install(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 300); });
  } else setTimeout(boot, 300);
  /* Motor, notis.js hazır olur olmaz kurulmalı (ilk çizimden önce) */
  install();

  window.proFreehand = {
    outline: fillInkStrokeFH,
    shape: shapeStroke,
    taper: applyTaper,
    prof: TOOLPROF,
    opts: function () { return P; }
  };
})();
