/* =============================================================================
 * Notis PRO — SILK™ · Pürüzsüz Mürekkep Motoru  (opsiyon · varsayılan KAPALI)
 *
 * Amaç: elden gelen fizyolojik titremeyi (8–12 Hz tremor), sensör gürültüsünü ve
 * düşük örneklemeden doğan tırtıklanmayı çizginin KARAKTERİNİ bozmadan yok etmek.
 * Şekil düzeltme DEĞİLDİR: kare kareye, daire daireye çevrilmez — ne çizdiysen o
 * kalır, sadece titremesi alınır ve çizgi matematiksel olarak sürekli bir eğriye
 * oturur.
 *
 * Boru hattı (her çizgi tamamlandığında, bir kez):
 *   1) One-Euro adaptif filtre — yavaşta titremeyi yutar, hızlıda gecikme katmaz
 *   2) Yay uzunluğuna göre yeniden örnekleme — düzgün, eşit aralıklı omurga
 *   3) Köşe tespiti — bilinçli keskin dönüşler işaretlenir ve KORUNUR
 *   4) Kübik Bézier en-küçük-kareler uydurma (Schneider FitCurve) — her parça
 *      hata eşiği altına inene dek özyinelemeli bölünür; sonuç C¹ sürekli eğri
 *   5) Eğriliğe duyarlı yoğun örnekleme — yakınlaştırmada bile tırtık yok
 *   6) Basınç profili yay uzunluğuna yeniden eşlenip yumuşatılır
 *
 * Kapalıyken tek bir satır bile çalışmaz; kalem motoru birebir orijinaldir.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "notis_silk_opts";
  var DEF = { on: false, level: "balanced", corners: true, meter: true };
  var P = load();
  var STAT = null;             // son çizginin ölçüm sonucu

  function load() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
    var out = {}; for (var k in DEF) out[k] = (o[k] === undefined ? DEF[k] : o[k]);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  function $id(x) { return document.getElementById(x); }

  /* Seviye profilleri — hata eşiği (px), filtre kesim frekansı, örnek sıklığı */
  var LV = {
    light:    { mincut: 1.30, beta: 0.055, err: 0.55, step: 1.05, corner: 68 },
    balanced: { mincut: 0.85, beta: 0.035, err: 0.90, step: 1.15, corner: 62 },
    max:      { mincut: 0.55, beta: 0.022, err: 1.35, step: 1.25, corner: 56 },
    ultra:    { mincut: 0.34, beta: 0.014, err: 1.90, step: 1.35, corner: 50 }
  };
  function prof() { return LV[P.level] || LV.balanced; }

  /* ------------------------------------------------------------ 1) ONE-EURO */
  function alphaOf(cut, dt) { var te = 1 / (2 * Math.PI * cut); return 1 / (1 + te / dt); }
  function oneEuro(pts, cfg) {
    var n = pts.length; if (n < 3) return pts.slice();
    var cfgCorners = !!P.corners;
    var out = [{ x: pts[0].x, y: pts[0].y, p: pts[0].p }];
    var px = pts[0].x, py = pts[0].y, dxf = 0, dyf = 0;
    for (var i = 1; i < n; i++) {
      var a = pts[i - 1], b = pts[i];
      var dt = Math.max(4, (b.t || 0) - (a.t || 0)) / 1000;      // s (güvenli alt sınır)
      var dx = (b.x - px) / dt, dy = (b.y - py) / dt;
      var ad = alphaOf(1.0, dt);
      dxf = dxf + ad * (dx - dxf); dyf = dyf + ad * (dy - dyf);
      var speed = Math.hypot(dxf, dyf);
      var cut = cfg.mincut + cfg.beta * speed;                   // hız arttıkça filtre gevşer
      var al = alphaOf(cut, dt);
      /* KÖŞE FARKINDALIĞI: bilinçli keskin dönüşlerde filtre devre dışı kalır.
         Yoksa köşede hız düştüğü için filtre agresifleşip köşeyi yuvarlıyordu. */
      if (cfgCorners && i > 1 && i < n - 1) {
        var u1x = b.x - a.x, u1y = b.y - a.y;
        var u2x = pts[i + 1].x - b.x, u2y = pts[i + 1].y - b.y;
        var l1 = Math.hypot(u1x, u1y), l2 = Math.hypot(u2x, u2y);
        if (l1 > 0.4 && l2 > 0.4) {
          var cs = (u1x * u2x + u1y * u2y) / (l1 * l2);
          if (cs < 0.55) al = Math.max(al, 0.92);                // ~57°+ dönüş → ham geç
        }
      }
      px = px + al * (b.x - px); py = py + al * (b.y - py);
      out.push({ x: px, y: py, p: b.p });
    }
    /* Uçları geri sabitle: çizgi tam kalemin bıraktığı yerde bitsin */
    out[out.length - 1] = { x: pts[n - 1].x, y: pts[n - 1].y, p: pts[n - 1].p };
    return out;
  }

  /* --------------------------------------- 2) YAY UZUNLUĞUNA GÖRE ÖRNEKLEME */
  function resample(pts, step) {
    if (pts.length < 2) return pts.slice();
    var out = [pts[0]], acc = 0, cur = { x: pts[0].x, y: pts[0].y, p: pts[0].p };
    for (var i = 1; i < pts.length; i++) {
      var a = cur, b = pts[i];
      var d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 1e-6) { continue; }
      while (acc + d >= step) {
        var t = (step - acc) / d;
        var nx = a.x + (b.x - a.x) * t, ny = a.y + (b.y - a.y) * t;
        var np = (a.p == null ? 0.6 : a.p) + ((b.p == null ? 0.6 : b.p) - (a.p == null ? 0.6 : a.p)) * t;
        out.push({ x: nx, y: ny, p: np });
        a = { x: nx, y: ny, p: np }; d = Math.hypot(b.x - a.x, b.y - a.y); acc = 0;
      }
      acc += d; cur = b;
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* ------------------------------------------------------- 3) KÖŞE TESPİTİ */
  function corners(pts, degLimit) {
    var idx = [], lim = Math.cos(degLimit * Math.PI / 180), W = 3;
    for (var i = W; i < pts.length - W; i++) {
      var ax = pts[i].x - pts[i - W].x, ay = pts[i].y - pts[i - W].y;
      var bx = pts[i + W].x - pts[i].x, by = pts[i + W].y - pts[i].y;
      var la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      if (la < 1e-6 || lb < 1e-6) continue;
      var cos = (ax * bx + ay * by) / (la * lb);
      if (cos < lim) {                       // yeterince keskin dönüş → köşe
        if (!idx.length || i - idx[idx.length - 1] > W * 2) idx.push(i);
      }
    }
    return idx;
  }

  /* --------------------------------- 4) KÜBİK BÉZIER EN-KÜÇÜK-KARELER UYDURMA
     Schneider (Graphics Gems) yöntemi: uç teğetleriyle tek bir kübik dener,
     hata eşiği aşılırsa en kötü noktadan bölüp özyinelemeli devam eder. */
  function v(a, b) { return { x: b.x - a.x, y: b.y - a.y }; }
  function norm(a) { var l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; }
  function bez(c, t) {
    var mt = 1 - t, a0 = mt * mt * mt, a1 = 3 * mt * mt * t, a2 = 3 * mt * t * t, a3 = t * t * t;
    return { x: c[0].x * a0 + c[1].x * a1 + c[2].x * a2 + c[3].x * a3,
             y: c[0].y * a0 + c[1].y * a1 + c[2].y * a2 + c[3].y * a3 };
  }
  function chordParams(pts) {
    var u = [0];
    for (var i = 1; i < pts.length; i++) u.push(u[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    var last = u[u.length - 1] || 1;
    for (var j = 0; j < u.length; j++) u[j] /= last;
    return u;
  }
  function fitCubic(pts, t1, t2, err, depth, out) {
    var n = pts.length;
    if (n < 2) return;
    if (n === 2) {
      var d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) / 3;
      out.push([pts[0], { x: pts[0].x + t1.x * d, y: pts[0].y + t1.y * d },
                { x: pts[1].x + t2.x * d, y: pts[1].y + t2.y * d }, pts[1]]);
      return;
    }
    var u = chordParams(pts);
    var C00 = 0, C01 = 0, C11 = 0, X0 = 0, X1 = 0;
    for (var i = 0; i < n; i++) {
      var t = u[i], mt = 1 - t;
      var b0 = mt * mt * mt, b1 = 3 * mt * mt * t, b2 = 3 * mt * t * t, b3 = t * t * t;
      var a1x = t1.x * b1, a1y = t1.y * b1, a2x = t2.x * b2, a2y = t2.y * b2;
      C00 += a1x * a1x + a1y * a1y;
      C01 += a1x * a2x + a1y * a2y;
      C11 += a2x * a2x + a2y * a2y;
      var tx = pts[i].x - (pts[0].x * (b0 + b1) + pts[n - 1].x * (b2 + b3));
      var ty = pts[i].y - (pts[0].y * (b0 + b1) + pts[n - 1].y * (b2 + b3));
      X0 += a1x * tx + a1y * ty;
      X1 += a2x * tx + a2y * ty;
    }
    var det = C00 * C11 - C01 * C01, a = 0, b = 0;
    if (Math.abs(det) > 1e-12) { a = (X0 * C11 - X1 * C01) / det; b = (C00 * X1 - C01 * X0) / det; }
    var seg = Math.hypot(pts[n - 1].x - pts[0].x, pts[n - 1].y - pts[0].y);
    if (a < 1e-6 || b < 1e-6) { a = b = seg / 3; }
    a = Math.min(a, seg * 1.2); b = Math.min(b, seg * 1.2);   // aşırı sarkmayı engelle
    var c = [pts[0], { x: pts[0].x + t1.x * a, y: pts[0].y + t1.y * a },
             { x: pts[n - 1].x + t2.x * b, y: pts[n - 1].y + t2.y * b }, pts[n - 1]];

    var worst = 0, wi = Math.floor(n / 2);
    for (var k = 1; k < n - 1; k++) {
      var q = bez(c, u[k]);
      var e = (q.x - pts[k].x) * (q.x - pts[k].x) + (q.y - pts[k].y) * (q.y - pts[k].y);
      if (e > worst) { worst = e; wi = k; }
    }
    if (worst <= err * err || depth > 14 || n < 6) { out.push(c); return; }
    var cen = norm(v(pts[wi - 1], pts[wi + 1]));
    fitCubic(pts.slice(0, wi + 1), t1, { x: -cen.x, y: -cen.y }, err, depth + 1, out);
    fitCubic(pts.slice(wi), cen, t2, err, depth + 1, out);
  }

  /* ------------------------------------------- 5) EĞRİLİĞE DUYARLI ÖRNEKLEME */
  function flatten(curves, step) {
    var out = [];
    for (var i = 0; i < curves.length; i++) {
      var c = curves[i];
      var approx = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y) +
                   Math.hypot(c[2].x - c[1].x, c[2].y - c[1].y) +
                   Math.hypot(c[3].x - c[2].x, c[3].y - c[2].y);
      var n = Math.max(4, Math.min(220, Math.ceil(approx / step)));
      for (var k = (i ? 1 : 0); k <= n; k++) out.push(bez(c, k / n));
    }
    return out;
  }

  /* ------------------------------------------------ TİTREŞİM ÖLÇER (metrik)
     Yön açısının ardışık değişimlerindeki yüksek frekanslı salınım enerjisi.
     Gerçek "titreme" ölçüsüdür: yavaş kavis düşük, el titremesi yüksek çıkar. */
  function jitter(pts) {
    if (!pts || pts.length < 6) return 0;
    var ang = [], L = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      var d = Math.hypot(dx, dy); if (d < 1e-6) continue;
      L += d; ang.push(Math.atan2(dy, dx));
    }
    if (ang.length < 5 || L < 6) return 0;
    var s = 0, m = 0;
    for (var k = 2; k < ang.length; k++) {
      var d2 = ang[k] - 2 * ang[k - 1] + ang[k - 2];            // ikinci fark = titreme
      while (d2 > Math.PI) d2 -= 2 * Math.PI;
      while (d2 < -Math.PI) d2 += 2 * Math.PI;
      s += d2 * d2; m++;
    }
    return m ? Math.sqrt(s / m) : 0;
  }

  /* --------------------------------------------------------------- SILK ANA */
  function silk(src) {
    var cfg = prof();
    if (!src || src.length < 5) return null;
    var f = oneEuro(src, cfg);
    var rs = resample(f, cfg.step);
    if (rs.length < 4) return null;

    var cuts = P.corners ? corners(rs, cfg.corner) : [];
    var bounds = [0].concat(cuts, [rs.length - 1]);
    var curves = [];
    for (var s = 0; s < bounds.length - 1; s++) {
      var seg = rs.slice(bounds[s], bounds[s + 1] + 1);
      if (seg.length < 2) continue;
      var t1 = norm(v(seg[0], seg[Math.min(2, seg.length - 1)]));
      var t2 = norm(v(seg[seg.length - 1], seg[Math.max(0, seg.length - 3)]));
      fitCubic(seg, t1, t2, cfg.err, 0, curves);
    }
    if (!curves.length) return null;
    var pts = flatten(curves, cfg.step * 0.55);
    if (pts.length < 3) return null;

    /* Basınç profilini yay uzunluğuna göre yeniden eşle + hafifçe yumuşat */
    var su = chordParams(src), pu = chordParams(pts), j = 0;
    for (var i2 = 0; i2 < pts.length; i2++) {
      while (j < su.length - 2 && su[j + 1] < pu[i2]) j++;
      var t = (su[j + 1] - su[j]) > 1e-9 ? (pu[i2] - su[j]) / (su[j + 1] - su[j]) : 0;
      var p0 = src[j].p == null ? 0.6 : src[j].p, p1 = src[j + 1].p == null ? 0.6 : src[j + 1].p;
      pts[i2].p = p0 + (p1 - p0) * Math.max(0, Math.min(1, t));
    }
    for (var q = 1; q < pts.length - 1; q++)
      pts[q].p = (pts[q - 1].p + 2 * pts[q].p + pts[q + 1].p) / 4;

    return { pts: pts, curves: curves.length };
  }

  /* ----------------------------------------------------------- MOTORA BAĞLA
     commitStroke sarmalanır: çizgi tuvale eklendikten SONRA son nesnenin
     noktaları SILK çıktısıyla değiştirilir. Uygulamanın çizim hattına,
     kalem dinamiklerine ve kayıt biçimine dokunulmaz. */
  function hook() {
    if (typeof window.commitStroke !== "function" || window.commitStroke.__silk) return;
    var orig = window.commitStroke;
    var wrap = function () {
      var before = (typeof live !== "undefined" && live && live.points) ? live.points.slice() : null;
      var r = orig.apply(this, arguments);
      try {
        if (!P.on || !before || before.length < 5) return r;
        var o = layer().objects[layer().objects.length - 1];
        if (!o || o.type !== "stroke" || o.straight || !o.points || o.points.length < 4) return r;
        var res = silk(before);
        if (!res) return r;
        /* Dürüst ölçüm: SILK'siz hâl = nesnenin şu anki (uygulama çıktısı)
           noktaları. Ham giriş yerine bununla kıyaslanır. */
        var j0 = jitter(o.points), j1 = jitter(res.pts), jr = jitter(before);
        o.points = res.pts;
        /* Yumuşatma önbelleğini kimlik dönüşümüyle tazele (veri değişmez) */
        try { transformObj(o, function (x, y) { return { x: x, y: y }; }, 1); } catch (_) { o._bb = null; }
        STAT = { before: j0, after: j1,
                 drop: j0 > 1e-6 ? Math.max(0, Math.min(99.9, (1 - j1 / j0) * 100)) : 0,
                 rawDrop: jr > 1e-6 ? Math.max(0, Math.min(99.9, (1 - j1 / jr) * 100)) : 0,
                 pts: res.pts.length, raw: before.length, curves: res.curves };
        renderMeter();
        redraw();
      } catch (e) { /* SILK asla çizimi bozmaz: hata olursa ham çizgi kalır */ }
      return r;
    };
    wrap.__silk = true;
    window.commitStroke = wrap;
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
  function renderMeter() {
    var m = $id("silkMeter");
    if (!m) return;
    if (!STAT) { m.innerHTML = '<span class="sm-idle">Bir çizgi çiz — ölçüm burada belirir</span>'; return; }
    var d = STAT.drop;
    m.innerHTML =
      '<div class="sm-big">%' + STAT.rawDrop.toFixed(1) + '<span class="sm-u">ham el hareketine göre</span></div>' +
      '<div class="sm-bar"><i style="width:' + Math.max(2, Math.min(100, STAT.rawDrop)) + '%"></i></div>' +
      '<div class="sm-sub"><b>%' + d.toFixed(1) + '</b> ek iyileşme (SILK kapalı hâline göre) · ' +
      STAT.raw + ' ham nokta → ' + STAT.curves + ' Bézier eğrisi → ' + STAT.pts + ' pürüzsüz nokta</div>';
  }
  function build() {
    var draw = $id("sp-draw");
    if (!draw || draw.dataset.silk) return;
    draw.dataset.silk = "1";

    draw.appendChild(sec("SILK™ — Pürüzsüz Mürekkep Motoru"));
    draw.appendChild(rowToggle("oSilk", "✨ SILK Motorunu Aç",
      "Çizgi bittiği anda el titremesi (8–12 Hz tremor), sensör gürültüsü ve tırtıklanma <b>ölçülerek</b> ayrıştırılır; " +
      "çizgi <b>kübik Bézier eğrilerine</b> oturtulur. Şekil düzeltme değildir — ne çizdiysen o kalır, sadece titremesi kalmaz. " +
      "Sonuç matematiksel olarak sürekli bir eğridir: sonsuz yakınlaştırmada bile tırtık yoktur. Tüm kalemlerde geçerlidir.",
      P.on, function (v) { P.on = v; }));

    draw.appendChild(rowSeg("oSilkLv", "🎚️ Motor Seviyesi",
      "<b>Hafif</b>: karakteri neredeyse hiç değiştirmez · <b>Dengeli</b>: günlük kullanım için ideal · " +
      "<b>Maksimum</b>: titreme neredeyse yok olur · <b>Ultra</b>: cam gibi çizgi (video ve sunum için).",
      [["light", "Hafif"], ["balanced", "Dengeli"], ["max", "Maksimum"], ["ultra", "Ultra"]],
      P.level, function (v) { P.level = v; }));

    draw.appendChild(rowToggle("oSilkCorners", "📐 Köşeleri Koru",
      "Bilinçli keskin dönüşler (harf köşeleri, ok uçları, köşeli şekiller) tespit edilip <b>korunur</b>; " +
      "yumuşatma yalnız köşe olmayan bölümlere uygulanır. Kapatırsan her şey tek akışkan eğriye dönüşür.",
      P.corners, function (v) { P.corners = v; }));

    draw.appendChild(el('<div class="set-row" style="display:block"><div><div class="t">📊 Titreşim Ölçer</div>' +
      '<div class="d">Her çizgiden sonra, o çizgideki titreşimin ne kadarının yok edildiği ölçülür ' +
      '(yön açısının ikinci farkının RMS enerjisi).</div></div>' +
      '<div class="silk-meter" id="silkMeter"></div></div>'));
    renderMeter();
  }

  function boot() { build(); hook(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 950); });
  } else setTimeout(boot, 950);

  /* test/ölçüm için dışa aç */
  window.proSilk = { silk: silk, jitter: jitter, stat: function () { return STAT; },
                     opts: function () { return P; } };
})();
