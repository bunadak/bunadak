/* =============================================================================
 * Notis Pro — Ink Engine
 * A pressure-aware, variable-width, smoothed vector ink stroker.
 *
 * The engine turns a stream of raw pointer samples ({x, y, pressure, t}) into a
 * filled outline polygon whose width varies with pressure and speed, tapered at
 * the ends. This is what gives strokes a natural, calligraphic feel instead of
 * the flat fixed-width lines of a plain canvas lineTo().
 *
 * Exposed as the global `Ink`.
 * ========================================================================== */
(function (global) {
  "use strict";

  /* ---- tiny 2d vector helpers (arrays [x,y] for speed) ------------------ */
  const len = (a) => Math.hypot(a[0], a[1]);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, s) => [a[0] * s, a[1] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const per = (a) => [a[1], -a[0]]; // clockwise perpendicular
  const uni = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* Pen presets — each shapes how pressure/speed map to width and how the
   * stroke is painted. These are the "Pro Pens". */
  const PENS = {
    fountain: {
      label: "Dolma Kalem", thinning: 0.72, smoothing: 0.55, streamline: 0.42,
      speedToWidth: 0.55, taperStart: 0.0, taperEnd: 0.85, easing: (t) => t * t,
      composite: "source-over", grain: 0, capRound: true, minRatio: 0.06,
    },
    ballpoint: {
      label: "Tükenmez", thinning: 0.28, smoothing: 0.5, streamline: 0.5,
      speedToWidth: 0.2, taperStart: 0.0, taperEnd: 0.0, easing: (t) => t,
      composite: "source-over", grain: 0, capRound: true, minRatio: 0.55,
    },
    gel: {
      label: "Jel Kalem", thinning: 0.4, smoothing: 0.5, streamline: 0.5,
      speedToWidth: 0.3, taperStart: 0.0, taperEnd: 0.2, easing: (t) => t,
      composite: "source-over", grain: 0, capRound: true, minRatio: 0.4,
    },
    pencil: {
      label: "Kurşun Kalem", thinning: 0.5, smoothing: 0.42, streamline: 0.35,
      speedToWidth: 0.35, taperStart: 0.02, taperEnd: 0.1, easing: (t) => Math.sqrt(t),
      composite: "source-over", grain: 0.9, capRound: true, minRatio: 0.35,
    },
    marker: {
      label: "Fosforlu", thinning: 0.08, smoothing: 0.6, streamline: 0.55,
      speedToWidth: 0.0, taperStart: 0.0, taperEnd: 0.0, easing: (t) => t,
      composite: "multiply", grain: 0, capRound: false, minRatio: 0.9, defaultAlpha: 0.38,
    },
    brush: {
      label: "Fırça", thinning: 0.85, smoothing: 0.6, streamline: 0.5,
      speedToWidth: 0.7, taperStart: 0.15, taperEnd: 0.9, easing: (t) => t * t * t,
      composite: "source-over", grain: 0.15, capRound: true, minRatio: 0.03,
    },
  };

  /* --- 1. Smooth + resample the raw input into evenly-ish spaced points --- */
  function smoothInput(raw, streamline) {
    if (raw.length === 0) return [];
    // Exponential smoothing (a.k.a. the "stabilizer"): pull each new point
    // toward the previous smoothed point. Higher streamline == steadier lines.
    const t = 0.15 + (1 - clamp(streamline, 0, 0.99)) * 0.85;
    const out = [{ pt: [raw[0].x, raw[0].y], pressure: raw[0].pressure }];
    let prev = out[0];
    for (let i = 1; i < raw.length; i++) {
      const p = [raw[i].x, raw[i].y];
      const sm = [lerp(prev.pt[0], p[0], t), lerp(prev.pt[1], p[1], t)];
      const pr = lerp(prev.pressure, raw[i].pressure, 0.5);
      const cur = { pt: sm, pressure: pr };
      // drop points that barely moved to keep geometry stable
      if (len(sub(sm, prev.pt)) > 0.35 || i === raw.length - 1) {
        out.push(cur);
        prev = cur;
      }
    }
    return out;
  }

  /* --- 2. Build the variable-width outline polygon ----------------------- */
  function outline(points, size, pen, opts) {
    if (points.length === 0) return [];
    const half = size / 2;
    const minR = half * pen.minRatio;
    const thinning = opts.thinning != null ? opts.thinning : pen.thinning;
    const usePressure = opts.pressure !== false;

    // total length for taper computation
    let total = 0;
    const seg = [0];
    for (let i = 1; i < points.length; i++) {
      total += len(sub(points[i].pt, points[i - 1].pt));
      seg.push(total);
    }
    total = total || 1;

    // per-point radius from pressure + speed + taper
    const radii = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)];
      const cur = points[i];
      const d = len(sub(cur.pt, prev.pt));
      // speed (fast strokes get thinner) — d is roughly px/sample
      const speed = clamp(d / (size * 0.9), 0, 1);
      let pr = usePressure ? cur.pressure : 0.5;
      pr = pen.easing(clamp(pr, 0, 1));
      // combine pressure and inverse-speed
      let f = pr * (1 - pen.speedToWidth) + (1 - speed) * pen.speedToWidth;
      let r = lerp(half, half * (1 - thinning) + minR, 1 - f);
      r = Math.max(r, minR);
      // taper the ends
      const dStart = seg[i];
      const dEnd = total - seg[i];
      const tsLen = pen.taperStart * Math.min(total, size * 6);
      const teLen = pen.taperEnd * Math.min(total, size * 6);
      if (tsLen > 0 && dStart < tsLen) r *= clamp(dStart / tsLen, 0, 1) ** 0.5;
      if (teLen > 0 && dEnd < teLen) r *= clamp(dEnd / teLen, 0, 1) ** 0.5;
      radii.push(Math.max(r, 0.25));
    }

    // single-point dot
    if (points.length === 1) {
      const c = points[0].pt, r = Math.max(radii[0], half * 0.5);
      const poly = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8)
        poly.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
      return poly;
    }

    const left = [], right = [];
    for (let i = 0; i < points.length; i++) {
      const cur = points[i].pt;
      const prev = points[Math.max(0, i - 1)].pt;
      const next = points[Math.min(points.length - 1, i + 1)].pt;
      // averaged normal of incoming and outgoing segments
      let n1 = uni(per(sub(cur, prev)));
      let n2 = uni(per(sub(next, cur)));
      let n = uni(add(n1, n2));
      if (len(n) < 0.0001) n = n2;
      // miter-ish scale, clamped so sharp corners don't blow up
      const cos = clamp(dot(n, n2), 0.35, 1);
      const r = radii[i] / cos;
      left.push(add(cur, mul(n, r)));
      right.push(sub(cur, mul(n, r)));
    }

    // round caps at both ends
    const startCap = cap(points[0].pt, right[0], left[0], radii[0]);
    const endCap = cap(points[points.length - 1].pt,
      left[left.length - 1], right[right.length - 1], radii[radii.length - 1]);

    return left.concat(endCap, right.reverse(), startCap);
  }

  function cap(center, from, to, r) {
    const a0 = Math.atan2(from[1] - center[1], from[0] - center[0]);
    let a1 = Math.atan2(to[1] - center[1], to[0] - center[0]);
    if (a1 < a0) a1 += Math.PI * 2;
    const out = [];
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const a = a0 + (a1 - a0) * (i / steps);
      out.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r]);
    }
    return out;
  }

  /* Build a Path2D from the outline (smooth with quadratic midpoints). */
  function toPath(poly) {
    const p = new Path2D();
    if (poly.length < 2) return p;
    p.moveTo((poly[0][0] + poly[poly.length - 1][0]) / 2,
             (poly[0][1] + poly[poly.length - 1][1]) / 2);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    p.closePath();
    return p;
  }

  /* Public: build stroke geometry from raw samples + a stroke spec. */
  function build(raw, spec) {
    const pen = PENS[spec.pen] || PENS.fountain;
    const streamline = spec.streamline != null ? spec.streamline : pen.streamline;
    const stab = clamp((spec.stabilize || 0) * 0.09 + streamline, 0, 0.97);
    const pts = smoothInput(raw, stab);
    const poly = outline(pts, spec.size, pen, spec);
    return { poly, pen, path: toPath(poly) };
  }

  /* Paint a built stroke onto a 2d context. */
  function paint(ctx, built, spec) {
    const pen = built.pen;
    ctx.save();
    ctx.globalCompositeOperation = spec.erase ? "destination-out"
      : (pen.composite || "source-over");
    let alpha = spec.opacity != null ? spec.opacity : (pen.defaultAlpha || 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spec.color || "#111";
    ctx.fill(built.path);
    if (pen.grain > 0 && !spec.erase) paintGrain(ctx, built, spec, pen);
    ctx.restore();
  }

  /* Pencil / brush grain: scatter faint darker dabs inside the outline. */
  function paintGrain(ctx, built, spec, pen) {
    const poly = built.poly;
    if (poly.length < 3) return;
    ctx.save();
    ctx.clip(built.path);
    ctx.globalAlpha = 0.10 * pen.grain;
    ctx.fillStyle = spec.color || "#111";
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (const p of poly) {
      if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
      if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
    }
    const area = (maxx - minx) * (maxy - miny);
    const n = Math.min(1400, Math.max(20, area * 0.03 * pen.grain));
    for (let i = 0; i < n; i++) {
      const x = minx + Math.random() * (maxx - minx);
      const y = miny + Math.random() * (maxy - miny);
      ctx.fillRect(x, y, 0.8, 0.8);
    }
    ctx.restore();
  }

  global.Ink = { PENS, build, paint, toPath, smoothInput };
})(typeof window !== "undefined" ? window : this);
