#!/usr/bin/env python3
"""MATHERA wordmark uretici: Sora 700 glyph konturlarini cikarip
kabartma bronz (3D pahli) SVG olarak birlestirir. Zemin seffaf.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

FONT = "/home/user/bunadak/frontend/dist/libs/fonts/files/sora-latin-700-normal.woff2"
WORD = "MATHERA"
CAP_PX = 300.0          # buyuk harf yuksekligi (px)
TRACKING_EM = 0.055     # harf araligi
PAD = 90.0              # kenar boslugu

font = TTFont(FONT)
upm = font["head"].unitsPerEm
glyf = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
cap = font["OS/2"].sCapHeight if font["OS/2"].version >= 2 else 700

scale = CAP_PX / cap
track = TRACKING_EM * upm

# --- glyph konturlarini tek bir path'e topla -------------------------------
subpaths, x = [], 0.0
for ch in WORD:
    gname = cmap[ord(ch)]
    pen = SVGPathPen(glyf, ntos=lambda v: f"{v:.2f}")
    glyf[gname].draw(pen)
    d = pen.getCommands()
    if d:
        subpaths.append((d, x))
    x += hmtx[gname][0] + track
x -= track  # son harften sonra tracking yok

text_w = x * scale
W = text_w + 2 * PAD
H = CAP_PX + 2 * PAD

# y ekseni: font yukari pozitif -> SVG'de ters cevir
groups = "\n".join(
    # kaydirma, grubun kendi (olceklenmis) koordinat sisteminde: font birimi
    f'      <path transform="translate({ox:.2f} 0)" d="{d}"/>'
    for d, ox in subpaths
)
outline = (
    f'    <g transform="translate({PAD:.2f} {PAD + CAP_PX:.2f}) '
    f'scale({scale:.6f} {-scale:.6f})">\n{groups}\n    </g>'
)

# --- 3D govde (extrusion) katmanlari --------------------------------------
DEPTH_STEPS = 14
DX, DY = 0.055, 0.16  # adim basina px kaydirma (asagi-saga dogru derinlik)
extrude = "\n".join(
    f'    <use href="#glyphs" x="{DX*i:.3f}" y="{DY*i:.3f}" fill="url(#gEdge)"/>'
    for i in range(DEPTH_STEPS, 0, -1)
)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {W:.2f} {H:.2f}" width="{W:.0f}" height="{H:.0f}"
     role="img" aria-label="MATHERA">
  <title>MATHERA</title>
  <defs>
    <!-- harf konturlari (Sora 700, path'e cevrilmis; font bagimliligi yok) -->
    <g id="glyphs">
{outline}
    </g>

    <!-- govde / yan yuz: en koyu bronz -->
    <linearGradient id="gEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#6d4526"/>
      <stop offset="0.55" stop-color="#57351c"/>
      <stop offset="1"    stop-color="#3d2413"/>
    </linearGradient>

    <!-- on yuz: bakir-bronz metal -->
    <linearGradient id="gFace" x1="0.06" y1="0" x2="0.30" y2="1">
      <stop offset="0"    stop-color="#e3b47c"/>
      <stop offset="0.16" stop-color="#cf9860"/>
      <stop offset="0.40" stop-color="#b47c46"/>
      <stop offset="0.60" stop-color="#9d6737"/>
      <stop offset="0.82" stop-color="#84512b"/>
      <stop offset="1"    stop-color="#9a6234"/>
    </linearGradient>

    <!-- ust kenar isik cizgisi -->
    <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#ffe6c2" stop-opacity="0.95"/>
      <stop offset="0.30" stop-color="#ffd9a8" stop-opacity="0.35"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- pah / bevel: alfa kanalini yuzey haritasi olarak kullanan spekuler isik -->
    <filter id="fBevel" x="-12%" y="-12%" width="124%" height="124%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="bump"/>
      <feSpecularLighting in="bump" surfaceScale="6" specularConstant="1"
                          specularExponent="26" lighting-color="#fff0d2" result="spec">
        <feDistantLight azimuth="230" elevation="48"/>
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClip"/>
      <!-- diffuseConstant ~ 1/sin(elevation): duz yuzey nötr kalir,
           sadece pah yuzeyleri aydinlanir/koyulasir -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="bump2"/>
      <feDiffuseLighting in="bump2" surfaceScale="5" diffuseConstant="1.55"
                         lighting-color="#ffffff" result="diff">
        <feDistantLight azimuth="230" elevation="40"/>
      </feDiffuseLighting>
      <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffClip"/>
      <feBlend in="SourceGraphic" in2="diffClip" mode="multiply" result="shaded"/>
      <feComposite in="specClip" in2="shaded" operator="arithmetic"
                   k1="0" k2="1" k3="1" k4="0"/>
    </filter>

    <!-- zemine dusen yumusak golge -->
    <filter id="fShadow" x="-15%" y="-15%" width="130%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="7"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.55"/>
      </feComponentTransfer>
    </filter>
  </defs>

  <!-- 1) golge -->
  <g filter="url(#fShadow)" opacity="0.5">
    <use xlink:href="#glyphs" x="3" y="9" fill="#1c1108"/>
  </g>

  <!-- 2) 3D govde -->
  <g>
{extrude}
  </g>

  <!-- 3) on yuz + pah -->
  <g filter="url(#fBevel)">
    <use xlink:href="#glyphs" fill="url(#gFace)"/>
  </g>

  <!-- 4) ust kenar isigi -->
  <g opacity="0.55" style="mix-blend-mode:screen">
    <use xlink:href="#glyphs" fill="url(#gTop)"/>
  </g>
</svg>
'''

out = sys.argv[1] if len(sys.argv) > 1 else "mathera-wordmark.svg"
with open(out, "w", encoding="utf-8") as f:
    f.write(svg)
print(f"yazildi: {out}  ({W:.0f}x{H:.0f}px, upm={upm}, cap={cap})")
