/* =============================================================================
 * Notis Pro — Application
 * Wires together the ink engine, tools, pages, layers, color, storage and UI.
 * Runs standalone in a browser and, when packaged, talks to the Go/Wails
 * backend through window.go.main.App.* (with a graceful localStorage fallback).
 * ========================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PAGE_W = 1240, PAGE_H = 1754;           // A4 portrait @ ~150dpi
  const DPR = Math.min(window.devicePixelRatio || 1, 2.5);

  /* ------------------------------------------------------------------ state */
  const defaults = {
    tool: "pen", pen: "fountain", color: "#1a2230", size: 6, opacity: 1,
    theme: "dark", shape: "line",
  };
  const settings = loadSettings();
  const S = {
    tool: "pen", pen: "fountain", color: "#1a2230", size: 6, opacity: 1,
    shape: "line", zoom: 1, panX: 0, panY: 0,
    drawing: false, present: false, ptool: "pen",
    hsv: { h: 220, s: 0.3, v: 0.19 },
  };

  let doc = null;          // current notebook
  let curPage = 0;
  let history = [];        // { pageId, layerId, stroke } committed actions
  let redoStack = [];

  /* --------------------------------------------------------------- DOM refs */
  const gridCv = $("#gridCv"), inkCv = $("#inkCv"), liveCv = $("#liveCv");
  const paper = $("#paper"), stage = $("#stage"), scroll = $("#scroll");
  const gx = gridCv.getContext("2d"), ix = inkCv.getContext("2d"), lx = liveCv.getContext("2d");

  /* ------------------------------------------------------------- data model */
  function newLayer(name) {
    return { id: uid(), name: name || "Katman", visible: true, opacity: 1, strokes: [], _cv: null };
  }
  function newPage(paper) {
    return { id: uid(), name: "Sayfa", paper: paper || "grid", bg: "#fbfbfa",
      rot: 0, layers: [newLayer("Katman 1")], active: 0 };
  }
  function newDoc(title) {
    return { id: uid(), title: title || "İsimsiz Defter", created: Date.now(),
      updated: Date.now(), pages: [newPage("grid")] };
  }
  const page = () => doc.pages[curPage];
  const layer = () => page().layers[page().active];
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

  /* ------------------------------------------------------------ layer cache */
  function layerCanvas(ly) {
    if (!ly._cv) {
      const c = document.createElement("canvas");
      c.width = PAGE_W * DPR; c.height = PAGE_H * DPR;
      ly._cv = c; ly._dirty = true;
    }
    if (ly._dirty) repaintLayer(ly);
    return ly._cv;
  }
  function repaintLayer(ly) {
    const c = ly._cv, cx = c.getContext("2d");
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.clearRect(0, 0, PAGE_W, PAGE_H);
    for (const st of ly.strokes) paintStroke(cx, st);
    ly._dirty = false;
  }
  function paintStroke(cx, st) {
    if (st.kind === "img") { paintImage(cx, st); return; }
    if (st.kind === "shape") { paintShape(cx, st); return; }
    if (st.kind === "text") { paintText(cx, st); return; }
    const built = Ink.build(st.points, st);
    Ink.paint(cx, built, st);
  }

  /* --------------------------------------------------------------- compose */
  function compose() {
    ix.setTransform(1, 0, 0, 1, 0, 0);
    ix.clearRect(0, 0, inkCv.width, inkCv.height);
    for (const ly of page().layers) {
      if (!ly.visible) continue;
      ix.globalAlpha = ly.opacity;
      ix.drawImage(layerCanvas(ly), 0, 0);
    }
    ix.globalAlpha = 1;
    scheduleThumb();
  }

  /* ------------------------------------------------------------ grid paper */
  function drawGrid() {
    const p = page();
    gx.setTransform(DPR, 0, 0, DPR, 0, 0);
    gx.clearRect(0, 0, PAGE_W, PAGE_H);
    gx.fillStyle = p.bg || "#fbfbfa";
    gx.fillRect(0, 0, PAGE_W, PAGE_H);
    const line = "rgba(60,90,140,0.14)", dot = "rgba(60,90,140,0.30)";
    gx.strokeStyle = line; gx.fillStyle = dot; gx.lineWidth = 1;
    const g = 40;
    if (p.paper === "lined") {
      gx.beginPath();
      for (let y = g * 2; y < PAGE_H; y += g) { gx.moveTo(48, y); gx.lineTo(PAGE_W - 48, y); }
      gx.stroke();
      gx.strokeStyle = "rgba(220,80,80,0.25)"; gx.beginPath();
      gx.moveTo(90, 0); gx.lineTo(90, PAGE_H); gx.stroke();
    } else if (p.paper === "grid") {
      gx.beginPath();
      for (let x = 0; x < PAGE_W; x += g) { gx.moveTo(x, 0); gx.lineTo(x, PAGE_H); }
      for (let y = 0; y < PAGE_H; y += g) { gx.moveTo(0, y); gx.lineTo(PAGE_W, y); }
      gx.stroke();
    } else if (p.paper === "dots") {
      for (let x = g; x < PAGE_W; x += g)
        for (let y = g; y < PAGE_H; y += g) { gx.beginPath(); gx.arc(x, y, 1.7, 0, 7); gx.fill(); }
    } else if (p.paper === "iso") {
      gx.beginPath();
      const s = g, h = s * Math.tan(Math.PI / 6);
      for (let x = -PAGE_H; x < PAGE_W; x += s) { gx.moveTo(x, 0); gx.lineTo(x + PAGE_H / Math.tan(Math.PI / 3), PAGE_H); }
      for (let x = 0; x < PAGE_W + PAGE_H; x += s) { gx.moveTo(x, 0); gx.lineTo(x - PAGE_H / Math.tan(Math.PI / 3), PAGE_H); }
      gx.stroke();
    }
  }

  /* -------------------------------------------------------------- geometry */
  function setupCanvases() {
    for (const c of [gridCv, inkCv, liveCv]) {
      c.width = PAGE_W * DPR; c.height = PAGE_H * DPR;
      c.style.width = PAGE_W + "px"; c.style.height = PAGE_H + "px";
    }
    paper.style.width = PAGE_W + "px"; paper.style.height = PAGE_H + "px";
    lx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function applyTransform() {
    paper.style.transform = `translate(-50%,0) translate(${S.panX}px,${S.panY}px) scale(${S.zoom})`;
    $("#zoomLbl").textContent = Math.round(S.zoom * 100) + "%";
  }
  function fitZoom() {
    const availH = stage.clientHeight - 90;
    S.zoom = Math.max(0.25, Math.min(1, availH / PAGE_H));
    S.panX = 0; S.panY = 0; applyTransform();
  }
  function toPage(e) {
    const r = paper.getBoundingClientRect();
    return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom };
  }

  /* --------------------------------------------------------- pointer input */
  let cur = null, shapeStart = null;
  function pointerDown(e) {
    if (S.present) return presentDown(e);
    if (e.button === 1 || S.tool === "pan" || (e.button === 0 && S.space)) return panStart(e);
    if (e.button !== 0 && e.pointerType === "mouse") return;
    liveCv.setPointerCapture(e.pointerId);
    const p = toPage(e);
    const pr = e.pressure && e.pressure > 0 && e.pointerType !== "mouse" ? e.pressure : 0.5;

    if (S.tool === "text") return placeText(p);
    if (S.tool === "select") return selectStart(p, e);

    S.drawing = true;
    if (S.tool === "shape") {
      shapeStart = p;
      cur = { kind: "shape", shape: S.shape, color: S.color, size: S.size,
        opacity: S.opacity, a: p, b: p };
      return;
    }
    const isErase = S.tool === "eraser";
    cur = {
      kind: "ink", tool: S.tool, pen: isErase ? "ballpoint" : (S.tool === "highlighter" ? "marker" : S.pen),
      color: S.color, size: S.tool === "eraser" ? S.size * 2.2 : S.size,
      opacity: S.tool === "highlighter" ? Math.min(S.opacity, 0.4) : S.opacity,
      erase: isErase, stabilize: settings.stabilize ? 4 : 1,
      pressure: settings.pressure !== false,
      points: [{ x: p.x, y: p.y, pressure: pr }],
    };
    drawLive();
  }
  function pointerMove(e) {
    if (S.present && S.drawing) return presentMove(e);
    if (S.panning) return panMove(e);
    if (!S.drawing || !cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) {
      const p = toPage(ev);
      const pr = ev.pressure && ev.pressure > 0 && ev.pointerType !== "mouse" ? ev.pressure : 0.5;
      if (cur.kind === "shape") cur.b = p;
      else cur.points.push({ x: p.x, y: p.y, pressure: pr });
    }
    drawLive();
  }
  function pointerUp(e) {
    if (S.panning) return panEnd();
    if (!S.drawing || !cur) return;
    S.drawing = false;
    lx.clearRect(0, 0, PAGE_W, PAGE_H);
    if (cur.kind === "ink" && cur.points.length < 1) { cur = null; return; }
    commit(cur); cur = null;
  }
  function drawLive() {
    lx.clearRect(0, 0, PAGE_W, PAGE_H);
    if (!cur) return;
    if (cur.kind === "shape") paintShape(lx, cur);
    else Ink.paint(lx, Ink.build(cur.points, cur), cur);
  }

  /* ----------------------------------------------------------- commit/undo */
  function commit(stroke) {
    const ly = layer();
    ly.strokes.push(stroke);
    // incremental paint into layer cache instead of full repaint
    const lc = layerCanvas(ly).getContext("2d");
    lc.setTransform(DPR, 0, 0, DPR, 0, 0);
    paintStroke(lc, stroke);
    history.push({ pageId: page().id, layerId: ly.id, stroke });
    redoStack.length = 0;
    compose();
    touch();
  }
  function undo() {
    const a = history.pop();
    if (!a) return;
    const pg = doc.pages.find(p => p.id === a.pageId);
    const ly = pg && pg.layers.find(l => l.id === a.layerId);
    if (ly) {
      const i = ly.strokes.lastIndexOf(a.stroke);
      if (i >= 0) ly.strokes.splice(i, 1);
      ly._dirty = true;
    }
    redoStack.push(a);
    if (pg !== page()) { curPage = doc.pages.indexOf(pg); renderPage(); } else compose();
    touch();
  }
  function redo() {
    const a = redoStack.pop();
    if (!a) return;
    const pg = doc.pages.find(p => p.id === a.pageId);
    const ly = pg && pg.layers.find(l => l.id === a.layerId);
    if (ly) { ly.strokes.push(a.stroke); ly._dirty = true; }
    history.push(a);
    if (pg !== page()) { curPage = doc.pages.indexOf(pg); renderPage(); } else compose();
    touch();
  }

  /* ------------------------------------------------------------ shape/text */
  function paintShape(cx, st) {
    cx.save();
    cx.strokeStyle = st.color; cx.fillStyle = st.color;
    cx.globalAlpha = st.opacity; cx.lineWidth = st.size;
    cx.lineJoin = "round"; cx.lineCap = "round";
    const a = st.a, b = st.b; cx.beginPath();
    const sh = st.shape;
    if (sh === "line") { cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); }
    else if (sh === "rect") { cx.rect(a.x, a.y, b.x - a.x, b.y - a.y); }
    else if (sh === "ellipse") { cx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, 7); }
    else if (sh === "arrow") {
      cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x), h = st.size * 3.2 + 8;
      cx.moveTo(b.x, b.y); cx.lineTo(b.x - h * Math.cos(ang - 0.4), b.y - h * Math.sin(ang - 0.4));
      cx.moveTo(b.x, b.y); cx.lineTo(b.x - h * Math.cos(ang + 0.4), b.y - h * Math.sin(ang + 0.4));
    } else if (sh === "triangle") {
      cx.moveTo((a.x + b.x) / 2, a.y); cx.lineTo(a.x, b.y); cx.lineTo(b.x, b.y); cx.closePath();
    } else if (sh === "diamond") {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      cx.moveTo(mx, a.y); cx.lineTo(b.x, my); cx.lineTo(mx, b.y); cx.lineTo(a.x, my); cx.closePath();
    }
    cx.stroke(); cx.restore();
  }
  function paintText(cx, st) {
    cx.save();
    cx.fillStyle = st.color; cx.globalAlpha = st.opacity;
    cx.font = `${st.fontSize}px Inter, "Segoe UI", sans-serif`;
    cx.textBaseline = "top";
    st.text.split("\n").forEach((ln, i) => cx.fillText(ln, st.x, st.y + i * st.fontSize * 1.3));
    cx.restore();
  }
  function paintImage(cx, st) {
    if (!st._img) return;
    cx.save(); cx.globalAlpha = st.opacity || 1;
    cx.drawImage(st._img, st.x, st.y, st.w, st.h); cx.restore();
  }
  function placeText(p) {
    const t = prompt("Metin girin:");
    if (!t) return;
    commit({ kind: "text", text: t, x: p.x, y: p.y, color: S.color,
      opacity: S.opacity, fontSize: Math.max(18, S.size * 3.5) });
  }

  /* ------------------------------------------------------------ select/pan */
  function selectStart() {}
  function panStart(e) { S.panning = true; S._px = e.clientX; S._py = e.clientY; scroll.style.cursor = "grabbing"; }
  function panMove(e) { S.panX += e.clientX - S._px; S.panY += e.clientY - S._py; S._px = e.clientX; S._py = e.clientY; applyTransform(); }
  function panEnd() { S.panning = false; scroll.style.cursor = ""; }

  /* --------------------------------------------------------------- present */
  function presentDown(e) { S.drawing = true; presentMove(e); }
  function presentMove(e) {
    const dot = $("#laserDot");
    if (S.ptool === "laser" || S.ptool === "spot") {
      dot.style.display = S.ptool === "laser" ? "block" : "none";
      dot.style.left = e.clientX + "px"; dot.style.top = e.clientY + "px";
      if (S.ptool === "spot") drawSpot(e.clientX, e.clientY);
    } else if (S.ptool === "pen" && S.drawing) { pointerMoveInk(e); }
  }
  function pointerMoveInk() {}
  function drawSpot(x, y) {
    const m = $("#spotMask"), c = m.getContext("2d");
    m.style.display = "block"; m.width = innerWidth; m.height = innerHeight;
    c.fillStyle = "rgba(0,0,0,.72)"; c.fillRect(0, 0, m.width, m.height);
    c.globalCompositeOperation = "destination-out";
    const g = c.createRadialGradient(x, y, 0, x, y, 150);
    g.addColorStop(0, "#000"); g.addColorStop(.7, "#000"); g.addColorStop(1, "transparent");
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 150, 0, 7); c.fill();
    c.globalCompositeOperation = "source-over";
  }

  /* ------------------------------------------------------------- rendering */
  function renderPage() {
    const p = page();
    paper.style.background = p.bg;
    for (const ly of p.layers) ly._dirty = true;
    drawGrid(); compose();
    $("#pageTag").textContent = `Sayfa ${curPage + 1} / ${doc.pages.length}`;
    renderPagesPanel(); renderLayers();
  }

  /* ============================ UI: TOOL RAIL ============================ */
  const TOOLS = [
    ["pen", "Kalem", '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>'],
    ["highlighter", "Fosforlu", '<path d="M9 11l-6 6v3h3l6-6"/><path d="M22 4l-2-2-8 8 2 2 8-8z"/>'],
    ["eraser", "Silgi", '<path d="M20 20H7L3 16a2 2 0 0 1 0-3L13 3a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-9 9"/>'],
    ["shape", "Şekil", '<rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="7" r="4"/><path d="M7 21l4-7H3z"/>'],
    ["text", "Metin", '<path d="M4 7V5h16v2M9 5v14M7 19h4"/>'],
    ["select", "Seç", '<path d="M3 3l7 17 2-7 7-2z"/>'],
    ["pan", "Kaydır", '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-7-4l-3-4"/>'],
  ];
  function buildRail() {
    const r = $("#rail");
    TOOLS.forEach(([id, tip, svg], i) => {
      const b = document.createElement("button");
      b.className = "tool" + (id === S.tool ? " on" : "");
      b.dataset.tool = id; b.dataset.tip = tip;
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
      b.onclick = () => setTool(id);
      r.appendChild(b);
      if (i === 2 || i === 4) { const s = document.createElement("div"); s.className = "rail-sep"; r.appendChild(s); }
    });
    // pages/layers toggles at bottom
    const sp = document.createElement("div"); sp.className = "rail-sep"; r.appendChild(sp);
    const pg = document.createElement("button");
    pg.className = "tool"; pg.dataset.tip = "Sayfalar & Katmanlar";
    pg.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg>';
    pg.onclick = () => toggleSide("pages");
    r.appendChild(pg);
  }
  const TOOL_NAMES = { pen: "Kalem", highlighter: "Fosforlu", eraser: "Silgi", shape: "Şekil", text: "Metin", select: "Seç", pan: "Kaydır" };
  function setTool(id) {
    S.tool = id;
    $$("#rail .tool").forEach(b => b.classList.toggle("on", b.dataset.tool === id));
    $("#toolName").textContent = TOOL_NAMES[id] || id;
    const isDraw = ["pen", "highlighter", "eraser", "shape"].includes(id);
    $("#toolOpts").classList.toggle("hidden", !isDraw && id !== "text");
    $("#penExtraSep").style.display = id === "pen" ? "" : "none";
    $("#penPicker").style.display = id === "pen" ? "" : "none";
    if (id === "shape") openShapePop(); else $("#shapePop").classList.remove("open");
  }

  /* ============================ UI: PEN PICKER ========================== */
  function buildPenPicker() {
    const wrap = $("#penPicker"); wrap.innerHTML = "";
    Object.entries(Ink.PENS).forEach(([k, p]) => {
      if (k === "marker") return; // marker == highlighter tool
      const b = document.createElement("button");
      b.className = "chip" + (k === S.pen ? " on" : "");
      b.textContent = p.label; b.dataset.pen = k;
      b.onclick = () => { S.pen = k; $$("#penPicker .chip").forEach(x => x.classList.toggle("on", x.dataset.pen === k)); };
      wrap.appendChild(b);
    });
  }

  /* ============================ UI: SHAPES ============================== */
  const SHAPES = [
    ["line", '<path d="M4 20L20 4"/>'], ["rect", '<rect x="4" y="6" width="16" height="12" rx="1"/>'],
    ["ellipse", '<ellipse cx="12" cy="12" rx="9" ry="6"/>'], ["arrow", '<path d="M4 12h14M13 6l6 6-6 6"/>'],
    ["triangle", '<path d="M12 4L20 20H4z"/>'], ["diamond", '<path d="M12 3l8 9-8 9-8-9z"/>'],
  ];
  function openShapePop() {
    const pop = $("#shapePop"), grid = $("#shapeGrid"); grid.innerHTML = "";
    SHAPES.forEach(([k, svg]) => {
      const b = document.createElement("button");
      b.className = "shape-opt" + (k === S.shape ? " on" : "");
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
      b.onclick = () => { S.shape = k; $$("#shapeGrid .shape-opt").forEach(x => x.classList.remove("on")); b.classList.add("on"); };
      grid.appendChild(b);
    });
    const r = $$("#rail .tool").find(t => t.dataset.tool === "shape").getBoundingClientRect();
    pop.style.left = "72px"; pop.style.top = r.top + "px";
    pop.classList.add("open");
  }

  /* ============================ UI: COLOR ============================== */
  const SWATCHES = ["#1a2230", "#e11d48", "#ea580c", "#f59e0b", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#ffffff"];
  function buildSwatches() {
    const w = $("#quickSwatches"); w.innerHTML = "";
    SWATCHES.forEach(c => {
      const b = document.createElement("button");
      b.className = "sw" + (c === S.color ? " on" : ""); b.style.background = c;
      b.onclick = () => setColor(c);
      w.appendChild(b);
    });
  }
  function setColor(c) {
    S.color = c;
    $("#colorBtn").style.background = c;
    $$("#quickSwatches .sw").forEach(b => b.classList.toggle("on", b.style.background === hex2rgb(c)));
    S.hsv = rgb2hsv(c);
  }
  function drawWheel() {
    const c = $("#wheelCv"), cx = c.getContext("2d"), R = c.width / 2, r0 = R - 8;
    cx.clearRect(0, 0, c.width, c.height);
    const img = cx.createImageData(c.width, c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const dx = x - R, dy = y - R, d = Math.hypot(dx, dy);
      const i = (y * c.width + x) * 4;
      if (d > r0) { img.data[i + 3] = 0; continue; }
      const h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const s = d / r0;
      const [rr, gg, bb] = hsv2rgbArr(h, s, S.hsv.v);
      img.data[i] = rr; img.data[i + 1] = gg; img.data[i + 2] = bb; img.data[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    // marker
    const ang = S.hsv.h * Math.PI / 180, rad = S.hsv.s * r0;
    cx.beginPath(); cx.arc(R + Math.cos(ang) * rad, R + Math.sin(ang) * rad, 7, 0, 7);
    cx.strokeStyle = "#fff"; cx.lineWidth = 2.5; cx.stroke();
    cx.strokeStyle = "#000"; cx.lineWidth = 1; cx.stroke();
  }
  function wheelPick(e) {
    const c = $("#wheelCv"), rect = c.getBoundingClientRect(), R = c.width / 2, r0 = R - 8;
    const x = (e.clientX - rect.left) * (c.width / rect.width) - R;
    const y = (e.clientY - rect.top) * (c.height / rect.height) - R;
    const d = Math.min(Math.hypot(x, y), r0);
    S.hsv.h = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    S.hsv.s = d / r0;
    updateFromHSV(); drawWheel();
  }
  function updateFromHSV() {
    const [r, g, b] = hsv2rgbArr(S.hsv.h, S.hsv.s, S.hsv.v);
    const hex = rgb2hex(r, g, b);
    $("#pkPrev").style.background = hex; $("#hexIn").value = hex;
    $("#valOut").textContent = Math.round(S.hsv.v * 100);
    setColor(hex);
  }

  /* ============================ PAGES PANEL ============================ */
  const PAPERS = [["blank", "Boş"], ["lined", "Çizgili"], ["grid", "Kareli"], ["dots", "Noktalı"], ["iso", "İzometrik"]];
  function buildPaperGrid() {
    const g = $("#paperGrid"); g.innerHTML = "";
    PAPERS.forEach(([k, name]) => {
      const b = document.createElement("button");
      b.className = "paper-opt" + (page() && page().paper === k ? " on" : "");
      b.dataset.paper = k;
      b.style.backgroundImage = paperPreview(k);
      b.innerHTML = `<span class="lbl">${name}</span>`;
      b.onclick = () => { page().paper = k; drawGrid(); touch(); $$("#paperGrid .paper-opt").forEach(x => x.classList.toggle("on", x.dataset.paper === k)); };
      g.appendChild(b);
    });
  }
  function paperPreview(k) {
    if (k === "grid") return "repeating-linear-gradient(#fff,#fff 8px,#cdd 9px),repeating-linear-gradient(90deg,#fff,#fff 8px,#cdd 9px)";
    if (k === "lined") return "repeating-linear-gradient(#fff,#fff 10px,#cdd 11px)";
    if (k === "dots") return "radial-gradient(#bcc 1px,transparent 1.5px)";
    if (k === "iso") return "repeating-linear-gradient(60deg,#fff,#fff 8px,#dde 9px),repeating-linear-gradient(-60deg,#fff,#fff 8px,#dde 9px)";
    return "#fff";
  }
  function renderPagesPanel() {
    const l = $("#pgList"); l.innerHTML = "";
    doc.pages.forEach((pg, i) => {
      const el = document.createElement("div");
      el.className = "pg-item" + (i === curPage ? " on" : "");
      el.innerHTML = `<div class="pg-thumb"><canvas width="52" height="68"></canvas></div>
        <div class="pg-meta"><div class="n">Sayfa ${i + 1}</div><div class="s">${paperName(pg.paper)}</div></div>
        <div class="pg-actions">
          <button class="tbtn icon" title="Çoğalt" data-a="dup"><svg viewBox="0 0 24 24" width="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg></button>
          <button class="tbtn icon" title="Sil" data-a="del"><svg viewBox="0 0 24 24" width="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
        </div>`;
      el.querySelector(".pg-thumb").onclick = () => { curPage = i; renderPage(); };
      el.querySelector(".pg-meta").onclick = () => { curPage = i; renderPage(); };
      el.querySelector('[data-a="dup"]').onclick = (ev) => { ev.stopPropagation(); dupPage(i); };
      el.querySelector('[data-a="del"]').onclick = (ev) => { ev.stopPropagation(); delPage(i); };
      l.appendChild(el);
      drawThumb(el.querySelector("canvas"), pg);
    });
    if (page()) buildPaperGrid();
  }
  function paperName(k) { return (PAPERS.find(p => p[0] === k) || [, "Boş"])[1]; }
  function addPage() { doc.pages.splice(curPage + 1, 0, newPage(page().paper)); curPage++; renderPage(); touch(); toast("Sayfa eklendi"); }
  function dupPage(i) {
    const src = doc.pages[i];
    const copy = JSON.parse(JSON.stringify({ ...src, _cv: undefined }));
    copy.id = uid(); copy.layers.forEach(l => { l.id = uid(); l._cv = null; l._dirty = true; });
    doc.pages.splice(i + 1, 0, copy); curPage = i + 1; renderPage(); touch();
  }
  function delPage(i) {
    if (doc.pages.length === 1) return toast("Son sayfa silinemez");
    doc.pages.splice(i, 1); curPage = Math.max(0, curPage - (i <= curPage ? 1 : 0)); renderPage(); touch();
  }

  /* ============================ LAYERS PANEL ========================== */
  function renderLayers() {
    const l = $("#layList"); l.innerHTML = "";
    const p = page();
    [...p.layers].reverse().forEach((ly) => {
      const idx = p.layers.indexOf(ly);
      const el = document.createElement("div");
      el.className = "ly-item" + (idx === p.active ? " on" : "");
      el.innerHTML = `<button class="ly-eye">${ly.visible ? eye() : eyeOff()}</button>
        <span class="n">${ly.name}</span>
        <button class="tbtn icon" data-a="del" title="Sil"><svg viewBox="0 0 24 24" width="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>`;
      el.querySelector(".n").onclick = () => { p.active = idx; renderLayers(); };
      el.querySelector(".ly-eye").onclick = () => { ly.visible = !ly.visible; compose(); renderLayers(); touch(); };
      el.querySelector('[data-a="del"]').onclick = () => { if (p.layers.length > 1) { p.layers.splice(idx, 1); p.active = Math.max(0, p.active - 1); renderLayers(); compose(); touch(); } };
      l.appendChild(el);
    });
  }
  function addLayer() { const p = page(); p.layers.push(newLayer("Katman " + (p.layers.length + 1))); p.active = p.layers.length - 1; renderLayers(); touch(); }
  const eye = () => '<svg viewBox="0 0 24 24" width="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOff = () => '<svg viewBox="0 0 24 24" width="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22"/></svg>';

  /* ============================ LIBRARY =============================== */
  function renderLibrary() {
    const g = $("#libGrid"); g.innerHTML = "";
    const list = store.list();
    if (!list.length) { g.innerHTML = '<div style="grid-column:1/-1;color:var(--text-mute);font-size:13px;text-align:center;padding:20px">Henüz kayıtlı defter yok.</div>'; return; }
    list.sort((a, b) => b.updated - a.updated).forEach(meta => {
      const c = document.createElement("div"); c.className = "lib-card";
      c.innerHTML = `<div class="thumb">${meta.thumb ? `<img src="${meta.thumb}" style="width:100%;height:100%;object-fit:cover">` : ""}</div>
        <div class="cap">${esc(meta.title)}<div class="d">${new Date(meta.updated).toLocaleDateString("tr-TR")} · ${meta.pages} sayfa</div></div>`;
      c.onclick = () => openDoc(meta.id);
      g.appendChild(c);
    });
  }

  /* ============================ SETTINGS ============================== */
  const THEMES = [["dark", "Karanlık", "#5b8cff"], ["light", "Aydınlık", "#5b8cff"], ["ink", "Mürekkep", "#37d0c4"],
    ["netflix", "Netflix", "#e50914"], ["disney", "Disney", "#4a7bff"], ["prime", "Prime", "#1fb6ff"],
    ["rakuten", "Rakuten", "#e60000"], ["youtube", "YouTube", "#ff0033"]];
  function buildSettings() {
    // Draw
    $("#pane-draw").innerHTML = "";
    toggleRow("pane-draw", "pressure", "Basınç Hassasiyeti", "Kalem basıncına göre kalınlık", settings.pressure !== false);
    toggleRow("pane-draw", "stabilize", "Çizgi Stabilizasyonu", "Titremeyi azalt, çizgileri pürüzsüzleştir", !!settings.stabilize);
    toggleRow("pane-draw", "predict", "Anlık Öngörü", "Gecikmeyi azaltmak için hareket tahmini", settings.predict !== false);
    toggleRow("pane-draw", "snap", "Şekil Yakalama", "Serbest çizimleri düzgün şekle çevir", !!settings.snap);
    // UI + themes
    $("#pane-ui").innerHTML = '<div class="sec-title" style="margin-top:0">Tema</div><div class="theme-grid" id="themeGrid"></div>';
    const tg = $("#themeGrid");
    THEMES.forEach(([k, name, col]) => {
      const b = document.createElement("button");
      b.className = "theme-opt" + (settings.theme === k ? " on" : "");
      b.innerHTML = `<div class="sw-bar" style="background:linear-gradient(135deg,${col},${col}99)"></div><div class="nm">${name}</div>`;
      b.onclick = () => { setTheme(k); $$("#themeGrid .theme-opt").forEach(x => x.classList.remove("on")); b.classList.add("on"); };
      tg.appendChild(b);
    });
    toggleRow("pane-ui", "autosave", "Otomatik Kayıt", "Değişiklikleri anında kaydet", settings.autosave !== false);
    // Keys
    const keys = [["Kalem", "P"], ["Fosforlu", "H"], ["Silgi", "E"], ["Şekil", "S"], ["Metin", "T"], ["Seç", "V"],
      ["Geri Al", "Ctrl+Z"], ["İleri Al", "Ctrl+Y"], ["Yakınlaş", "Ctrl++"], ["Uzaklaş", "Ctrl+−"],
      ["Sığdır", "Ctrl+0"], ["Yeni Sayfa", "Ctrl+N"], ["Kaydet", "Ctrl+S"], ["Sunum", "F5"]];
    $("#pane-keys").innerHTML = keys.map(([k, v]) => `<div class="key-row"><span class="k">${k}</span><kbd>${v}</kbd></div>`).join("");
    // Storage
    renderStoragePane();
    // About
    $("#pane-about").innerHTML = `
      <div style="text-align:center;padding:16px">
        <div style="width:72px;height:72px;border-radius:20px;margin:0 auto 14px;display:grid;place-items:center;font-size:40px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 12px 40px var(--accent-glow)">N</div>
        <h2 style="font-size:22px">Notis <span style="color:var(--accent)">Pro</span></h2>
        <div style="color:var(--text-dim);margin-top:6px;font-size:13px">Profesyonel dijital defter & çizim stüdyosu</div>
        <div style="color:var(--text-mute);margin-top:16px;font-size:12px;line-height:1.7">
          Basınca duyarlı vektörel mürekkep motoru · Sınırsız katman & sayfa<br>
          5 kağıt şablonu · 8 tema · Sunum modu · PDF/PNG dışa aktarma<br>
          Otomatik kayıt · Tam klavye kısayolları
        </div>
      </div>`;
  }
  function renderStoragePane() {
    const list = store.list();
    const bytes = store.usage();
    const pct = Math.min(100, bytes / (5 * 1024 * 1024) * 100);
    $("#pane-storage").innerHTML = `
      <div class="sec-title" style="margin-top:0">Yerel Depolama</div>
      <div style="font-size:13px;color:var(--text-dim)">${list.length} defter · ${(bytes / 1024).toFixed(0)} KB kullanımda</div>
      <div class="usage"><div class="fill" style="width:${pct}%"></div></div>
      <div class="prow" style="margin-top:16px"><button class="pbtn ghost" id="exportJson">Yedeği İndir (.notis)</button></div>
      <div class="prow"><button class="pbtn danger" id="wipeAll">Tüm Verileri Sil</button></div>`;
    $("#exportJson").onclick = downloadBackup;
    $("#wipeAll").onclick = () => { if (confirm("Tüm defterler silinecek. Emin misiniz?")) { store.wipeAll(); location.reload(); } };
  }
  function toggleRow(pane, key, title, desc, on) {
    const row = document.createElement("div"); row.className = "set-row";
    row.innerHTML = `<div class="info"><div class="t">${title}</div><div class="d">${desc}</div></div>`;
    const sw = document.createElement("button");
    sw.className = "sw-toggle" + (on ? " on" : "");
    sw.onclick = () => { settings[key] = !settings[key]; sw.classList.toggle("on"); saveSettings(); if (key === "autosave") {} };
    row.appendChild(sw); $("#" + pane).appendChild(row);
  }

  /* ============================ EXPORT =============================== */
  let expFmt = "pdf", expScope = "all", expDpi = 2;
  async function doExport() {
    const pages = expScope === "all" ? doc.pages : [page()];
    const savedPage = curPage;
    if (expFmt === "png") {
      for (let i = 0; i < pages.length; i++) {
        const canvas = await renderPageToCanvas(pages[i], expDpi);
        downloadDataURL(canvas.toDataURL("image/png"), `${doc.title}${pages.length > 1 ? "-" + (i + 1) : ""}.png`);
      }
    } else {
      const imgs = [];
      for (const pg of pages) {
        const canvas = await renderPageToCanvas(pg, expDpi);
        imgs.push({ data: canvas.toDataURL("image/jpeg", 0.92), w: canvas.width, h: canvas.height });
      }
      const blob = buildPDF(imgs);
      downloadBlob(blob, `${doc.title}.pdf`);
    }
    curPage = savedPage;
    closeAll(); toast("Dışa aktarıldı ✓");
  }
  async function renderPageToCanvas(pg, dpi) {
    const c = document.createElement("canvas");
    c.width = PAGE_W * dpi; c.height = PAGE_H * dpi;
    const cx = c.getContext("2d"); cx.scale(dpi, dpi);
    // background + grid
    const gsave = curPage; const realGrid = gridCv;
    cx.fillStyle = pg.bg || "#fff"; cx.fillRect(0, 0, PAGE_W, PAGE_H);
    // reuse drawGrid by temporarily pointing to an offscreen — simpler: draw grid inline
    drawGridInto(cx, pg);
    for (const ly of pg.layers) {
      if (!ly.visible) continue;
      cx.globalAlpha = ly.opacity;
      for (const st of ly.strokes) paintStroke(cx, st);
    }
    cx.globalAlpha = 1;
    return c;
  }
  function drawGridInto(cx, p) {
    const g = 40; cx.save();
    cx.strokeStyle = "rgba(60,90,140,0.14)"; cx.fillStyle = "rgba(60,90,140,0.30)"; cx.lineWidth = 1;
    if (p.paper === "grid") { cx.beginPath(); for (let x = 0; x < PAGE_W; x += g) { cx.moveTo(x, 0); cx.lineTo(x, PAGE_H); } for (let y = 0; y < PAGE_H; y += g) { cx.moveTo(0, y); cx.lineTo(PAGE_W, y); } cx.stroke(); }
    else if (p.paper === "lined") { cx.beginPath(); for (let y = g * 2; y < PAGE_H; y += g) { cx.moveTo(48, y); cx.lineTo(PAGE_W - 48, y); } cx.stroke(); }
    else if (p.paper === "dots") { for (let x = g; x < PAGE_W; x += g) for (let y = g; y < PAGE_H; y += g) { cx.beginPath(); cx.arc(x, y, 1.7, 0, 7); cx.fill(); } }
    cx.restore();
  }

  /* Minimal, dependency-free PDF writer: one full-page JPEG per page. */
  function buildPDF(images) {
    const enc = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
    const parts = []; let offset = 0; const xref = [];
    const push = (s) => { parts.push(typeof s === "string" ? enc(s) : s); offset += (typeof s === "string" ? s.length : s.length); };
    const obj = () => { xref.push(offset); };
    const PW = 595, PH = 842; // A4 pt
    push("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
    const nObj = 2 + images.length * 3;
    // 1 catalog, 2 pages
    obj(); push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
    const kids = images.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
    obj(); push(`2 0 obj\n<< /Type /Pages /Count ${images.length} /Kids [${kids}] >>\nendobj\n`);
    images.forEach((im, i) => {
      const pageN = 3 + i * 3, contN = pageN + 1, imgN = pageN + 2;
      obj(); push(`${pageN} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${imgN} 0 R >> >> /Contents ${contN} 0 R >>\nendobj\n`);
      const content = `q\n${PW} 0 0 ${PH} 0 0 cm\n/Im0 Do\nQ\n`;
      obj(); push(`${contN} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
      const raw = atob(im.data.split(",")[1]);
      obj(); push(`${imgN} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${raw.length} >>\nstream\n`);
      push(enc(raw)); push("\nendstream\nendobj\n");
    });
    const xrefStart = offset;
    let xr = `xref\n0 ${nObj + 1}\n0000000000 65535 f \n`;
    for (const o of xref) xr += String(o).padStart(10, "0") + " 00000 n \n";
    push(xr);
    push(`trailer\n<< /Size ${nObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
  }

  /* ============================ STORAGE =============================== */
  const HAS_GO = !!(window.go && window.go.main && window.go.main.App);
  const store = {
    list() { try { return JSON.parse(localStorage.getItem("notis.index") || "[]"); } catch { return []; } },
    setIndex(x) { localStorage.setItem("notis.index", JSON.stringify(x)); },
    save(d, thumb) {
      const data = serialize(d);
      localStorage.setItem("notis.doc." + d.id, JSON.stringify(data));
      const idx = this.list().filter(m => m.id !== d.id);
      idx.push({ id: d.id, title: d.title, updated: d.updated, pages: d.pages.length, thumb });
      this.setIndex(idx);
      if (HAS_GO) window.go.main.App.SaveNotebook(d.id, JSON.stringify(data)).catch(() => {});
    },
    load(id) { try { return JSON.parse(localStorage.getItem("notis.doc." + id)); } catch { return null; } },
    remove(id) { localStorage.removeItem("notis.doc." + id); this.setIndex(this.list().filter(m => m.id !== id)); },
    wipeAll() { this.list().forEach(m => localStorage.removeItem("notis.doc." + m.id)); localStorage.removeItem("notis.index"); },
    usage() { let n = 0; for (const k in localStorage) if (k.startsWith("notis.")) n += (localStorage[k] || "").length; return n; },
  };
  function serialize(d) {
    return { id: d.id, title: d.title, created: d.created, updated: d.updated,
      pages: d.pages.map(p => ({ id: p.id, name: p.name, paper: p.paper, bg: p.bg, rot: p.rot, active: p.active,
        layers: p.layers.map(l => ({ id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, strokes: l.strokes.map(cleanStroke) })) })) };
  }
  function cleanStroke(s) { const c = { ...s }; delete c._img; return c; }
  function hydrate(data) {
    const d = { ...data };
    d.pages = data.pages.map(p => ({ ...p, layers: p.layers.map(l => ({ ...l, _cv: null, _dirty: true, strokes: l.strokes.map(hydrateStroke) })) }));
    return d;
  }
  function hydrateStroke(s) { if (s.kind === "img" && s.src) { const img = new Image(); img.src = s.src; s._img = img; } return s; }

  let saveTimer = null;
  function touch() {
    doc.updated = Date.now();
    if (settings.autosave === false) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 700);
  }
  async function saveNow() {
    const thumb = await makeThumb();
    store.save(doc, thumb);
  }
  async function makeThumb() {
    try { const c = await renderPageToCanvas(doc.pages[0], 0.3); return c.toDataURL("image/jpeg", 0.6); } catch { return ""; }
  }
  function openDoc(id) {
    const data = store.load(id); if (!data) return;
    doc = hydrate(data); curPage = 0; history = []; redoStack = [];
    $("#docTitle").textContent = doc.title;
    renderPage(); toggleSide(null); toast("Defter açıldı");
  }
  function downloadBackup() {
    const blob = new Blob([JSON.stringify(serialize(doc))], { type: "application/json" });
    downloadBlob(blob, doc.title + ".notis");
  }

  /* ============================ THUMBS =============================== */
  let thumbTimer = null;
  function scheduleThumb() { clearTimeout(thumbTimer); thumbTimer = setTimeout(() => { const el = $$("#pgList .pg-item")[curPage]; if (el) drawThumb(el.querySelector("canvas"), page()); }, 400); }
  function drawThumb(canvas, pg) {
    if (!canvas) return;
    const cx = canvas.getContext("2d"), sc = canvas.width / PAGE_W;
    cx.clearRect(0, 0, canvas.width, canvas.height);
    cx.fillStyle = pg.bg || "#fff"; cx.fillRect(0, 0, canvas.width, canvas.height);
    cx.save(); cx.scale(sc, sc);
    for (const ly of pg.layers) { if (!ly.visible) continue; try { cx.drawImage(layerCanvas(ly), 0, 0, PAGE_W, PAGE_H); } catch {} }
    cx.restore();
  }

  /* ============================ THEME / TITLE ========================= */
  function setTheme(k) { settings.theme = k; document.documentElement.dataset.theme = k; saveSettings(); }

  /* ============================ SIDE / DIALOGS ======================== */
  function toggleSide(panel) {
    const side = $("#side");
    if (panel === null) { side.classList.remove("open"); return; }
    const open = side.classList.contains("open") && $(".stab.on").dataset.panel === panel;
    if (open) { side.classList.remove("open"); return; }
    side.classList.add("open"); switchPanel(panel);
  }
  function switchPanel(panel) {
    $$(".stab").forEach(b => b.classList.toggle("on", b.dataset.panel === panel));
    $$(".spanel").forEach(p => p.classList.toggle("on", p.id === "panel-" + panel));
    $("#sideTitle").textContent = { pages: "Sayfalar", layers: "Katmanlar", library: "Kütüphane" }[panel];
    if (panel === "layers") renderLayers();
    if (panel === "library") renderLibrary();
    if (panel === "pages") renderPagesPanel();
  }
  function openOverlay(id) { $("#" + id).classList.add("open"); }
  function closeAll() { $$(".overlay").forEach(o => o.classList.remove("open")); $$(".pop").forEach(p => p.classList.remove("open")); }

  /* ============================ PRESENT MODE ========================= */
  function enterPresent() {
    S.present = true; S.ptool = "laser";
    $("#present-bar").classList.add("on");
    document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    $$("#present-bar .tool").forEach(b => b.classList.toggle("on", b.dataset.ptool === "laser"));
  }
  function exitPresent() {
    S.present = false; $("#present-bar").classList.remove("on");
    $("#laserDot").style.display = "none"; $("#spotMask").style.display = "none";
    document.fullscreenElement && document.exitFullscreen().catch(() => {});
  }

  /* ============================ HELPERS ============================== */
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1800); }
  function esc(s) { return (s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
  function downloadBlob(blob, name) { const u = URL.createObjectURL(blob); downloadDataURL(u, name); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  function downloadDataURL(url, name) { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function loadSettings() { try { return JSON.parse(localStorage.getItem("notis.settings")) || {}; } catch { return {}; } }
  function saveSettings() { localStorage.setItem("notis.settings", JSON.stringify(settings)); }
  // color math
  function hex2rgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h, 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`; }
  function rgb2hex(r, g, b) { return "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, "0")).join(""); }
  function hsv2rgbArr(h, s, v) { h /= 360; let r, g, b; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s); switch (i % 6) { case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; default: r = v; g = p; b = q; } return [r * 255, g * 255, b * 255]; }
  function rgb2hsv(hex) { hex = hex.replace("#", ""); if (hex.length === 3) hex = hex.split("").map(c => c + c).join(""); const n = parseInt(hex, 16); const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return { h, s: mx ? d / mx : 0, v: mx }; }

  /* ============================ EVENTS ============================== */
  function wire() {
    // pointer
    liveCv.addEventListener("pointerdown", pointerDown);
    liveCv.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    liveCv.style.pointerEvents = "auto";
    // present overlay pointer
    stage.addEventListener("pointermove", e => { if (S.present) presentMove(e); });
    stage.addEventListener("pointerdown", e => { if (S.present) S.drawing = true; });
    window.addEventListener("pointerup", () => { if (S.present) S.drawing = false; });

    // zoom
    $("#zoomIn").onclick = () => { S.zoom = Math.min(4, S.zoom * 1.15); applyTransform(); };
    $("#zoomOut").onclick = () => { S.zoom = Math.max(0.2, S.zoom / 1.15); applyTransform(); };
    scroll.addEventListener("wheel", e => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); const f = e.deltaY < 0 ? 1.08 : 1 / 1.08; S.zoom = Math.max(0.2, Math.min(4, S.zoom * f)); applyTransform(); }
      else { S.panY -= e.deltaY; S.panX -= e.deltaX; applyTransform(); }
    }, { passive: false });

    // top bar
    $("#undoBtn").onclick = undo; $("#redoBtn").onclick = redo;
    $("#presentBtn").onclick = enterPresent;
    $("#exportBtn").onclick = () => openOverlay("exportDlg");
    $("#setBtn").onclick = () => { buildSettings(); openOverlay("setDlg"); };
    $("#libBtn").onclick = () => toggleSide("library");
    $("#docTitle").onclick = () => { const t = prompt("Defter adı:", doc.title); if (t) { doc.title = t; $("#docTitle").textContent = t; touch(); } };

    // options
    $("#sizeRng").oninput = e => { S.size = +e.target.value; $("#sizeVal").textContent = e.target.value; };
    $("#opRng").oninput = e => { S.opacity = +e.target.value / 100; $("#opVal").textContent = e.target.value + "%"; };
    $("#colorBtn").onclick = e => { const r = e.target.getBoundingClientRect(); const pop = $("#colorPop"); pop.style.left = Math.min(r.left, innerWidth - 260) + "px"; pop.style.top = (r.bottom + 8) + "px"; drawWheel(); buildPalSwatches(); pop.classList.toggle("open"); };

    // color pop
    let wheelDrag = false;
    $("#wheelCv").addEventListener("pointerdown", e => { wheelDrag = true; wheelPick(e); });
    window.addEventListener("pointermove", e => { if (wheelDrag) wheelPick(e); });
    window.addEventListener("pointerup", () => wheelDrag = false);
    $("#valRng").oninput = e => { S.hsv.v = +e.target.value / 100; drawWheel(); updateFromHSV(); };
    $("#hexIn").onchange = e => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) { setColor(v[0] === "#" ? v : "#" + v); S.hsv = rgb2hsv(S.color); drawWheel(); } };
    $("#pkFav").onclick = () => { const favs = JSON.parse(localStorage.getItem("notis.favs") || "[]"); if (!favs.includes(S.color)) { favs.unshift(S.color); localStorage.setItem("notis.favs", JSON.stringify(favs.slice(0, 16))); buildPalSwatches(); toast("Renk favorilere eklendi"); } };

    // side
    $("#sideClose").onclick = () => toggleSide(null);
    $$(".stab").forEach(b => b.onclick = () => switchPanel(b.dataset.panel));
    $("#pgAdd").onclick = addPage;
    $("#layAdd").onclick = addLayer;
    $("#libNew").onclick = () => { startNewDoc(); toggleSide(null); };
    $("#libRefresh").onclick = renderLibrary;

    // export dialog
    $$("#expFmt button").forEach(b => b.onclick = () => { expFmt = b.dataset.fmt; seg("#expFmt", b); });
    $$("#expScope button").forEach(b => b.onclick = () => { expScope = b.dataset.scope; seg("#expScope", b); });
    $$("#expDpi button").forEach(b => b.onclick = () => { expDpi = +b.dataset.dpi; seg("#expDpi", b); });
    $("#expGo").onclick = doExport;

    // settings tabs
    $$("#setTabs .set-tab").forEach(b => b.onclick = () => { $$("#setTabs .set-tab").forEach(x => x.classList.remove("on")); b.classList.add("on"); $$(".set-pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + b.dataset.pane)); });
    $("#setReset").onclick = () => { if (confirm("Ayarlar sıfırlansın mı?")) { localStorage.removeItem("notis.settings"); location.reload(); } };

    // present bar
    $$("#present-bar .tool").forEach(b => b.onclick = () => {
      const t = b.dataset.ptool;
      if (t === "exit") return exitPresent();
      if (t === "prev") { if (curPage > 0) { curPage--; renderPage(); } return; }
      if (t === "next") { if (curPage < doc.pages.length - 1) { curPage++; renderPage(); } return; }
      S.ptool = t; $("#spotMask").style.display = "none"; $("#laserDot").style.display = "none";
      $$("#present-bar .tool").forEach(x => x.classList.toggle("on", x.dataset.ptool === t));
    });

    // overlays close
    $$("[data-close]").forEach(b => b.onclick = closeAll);
    $$(".overlay").forEach(o => o.addEventListener("pointerdown", e => { if (e.target === o) closeAll(); }));

    // keyboard
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", e => { if (e.code === "Space") S.space = false; });
    window.addEventListener("resize", () => applyTransform());
  }
  function seg(sel, b) { $$(sel + " button").forEach(x => x.classList.remove("on")); b.classList.add("on"); }
  function buildPalSwatches() {
    const w = $("#palSwatches"); w.innerHTML = "";
    const favs = JSON.parse(localStorage.getItem("notis.favs") || "[]");
    const all = [...new Set([...favs, ...SWATCHES, "#000000", "#64748b", "#94a3b8"])].slice(0, 24);
    all.forEach(c => { const b = document.createElement("button"); b.className = "sw"; b.style.background = c; b.onclick = () => { setColor(c); S.hsv = rgb2hsv(c); drawWheel(); }; w.appendChild(b); });
  }
  function onKey(e) {
    if (e.target.matches("input, textarea")) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); saveNow(); toast("Kaydedildi ✓"); return; }
    if (mod && e.key.toLowerCase() === "n") { e.preventDefault(); addPage(); return; }
    if (mod && (e.key === "0")) { e.preventDefault(); fitZoom(); return; }
    if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); S.zoom = Math.min(4, S.zoom * 1.15); applyTransform(); return; }
    if (mod && e.key === "-") { e.preventDefault(); S.zoom = Math.max(0.2, S.zoom / 1.15); applyTransform(); return; }
    if (e.code === "Space") { S.space = true; return; }
    if (e.key === "F5") { e.preventDefault(); S.present ? exitPresent() : enterPresent(); return; }
    if (e.key === "Escape") { if (S.present) exitPresent(); else closeAll(); return; }
    const map = { p: "pen", h: "highlighter", e: "eraser", s: "shape", t: "text", v: "select", b: "pan" };
    if (map[e.key.toLowerCase()]) setTool(map[e.key.toLowerCase()]);
  }

  /* ============================ BOOT ================================ */
  function startNewDoc() {
    doc = newDoc(); curPage = 0; history = []; redoStack = [];
    $("#docTitle").textContent = doc.title;
    renderPage();
  }
  function boot() {
    setupCanvases();
    buildRail(); buildPenPicker(); buildSwatches();
    setColor(S.color); setTheme(settings.theme || "dark");
    // resume most recent doc or start fresh
    const list = store.list();
    if (list.length) { const recent = list.sort((a, b) => b.updated - a.updated)[0]; const data = store.load(recent.id); doc = data ? hydrate(data) : newDoc(); }
    else doc = newDoc();
    $("#docTitle").textContent = doc.title;
    setTool("pen");
    renderPage(); fitZoom();
    wire();
    setTimeout(() => $("#splash").classList.add("hide"), 900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
