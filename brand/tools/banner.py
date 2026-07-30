#!/usr/bin/env python3
"""
YouTube banner + SVG paketleri üretir.

Kilit (lockup): yazısız madalyon amblem + bakır MATHERA logotype.
Tam logonun içinde zaten "MATHERA" yazdığı için banner'da onu tekrar
etmek yerine boş plaka amblem olarak, wordmark da logotype olarak kullanılır.

YouTube ölçüleri
  Tuval        : 2048 x 1152
  Güvenli alan : 1235 x 338 (ortalanmış) — her cihazda görünen bölge
  Masaüstü     : ~2048 x 423 (ortalanmış)

Çıktılar
  mathera-banner.png / .svg            koyu (önerilen)
  mathera-banner-acik.png / .svg       krem
  mathera-banner-guvenli-alan.png      kılavuzlu kontrol görseli
  mathera-logo.svg                     tam logo, SVG sarmalayıcı
  mathera-madalyon-seffaf.png          şeffaf zeminli amblem
  mathera-wordmark-seffaf.png          şeffaf zeminli logotype
"""

import base64
import io

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import wordmark_swap as W

ROOT = "/home/user/bunadak/brand"

# --- YouTube tuvali -------------------------------------------------------
BW, BH = 2048, 1152
SAFE_W, SAFE_H = 1235, 338
SAFE = ((BW - SAFE_W) // 2, (BH - SAFE_H) // 2,
        (BW + SAFE_W) // 2, (BH + SAFE_H) // 2)

# --- madalyonun ölçülmüş geometrisi --------------------------------------
MED_CX, MED_CY = 633.6, 627.0
MED_R = 500.0          # gümüş halkanın dış kenarı (radyal profilden)

# --- kilit yerleşimi ------------------------------------------------------
EMBLEM_D = 312
GAP = 64
WM_W = 528
CENTERED_D = 330

THEMES = {
    "": {  # koyu
        "bg": [(0.0, "#20364f"), (0.55, "#12233a"), (1.0, "#080f1a")],
        "shadow": (0, 0, 0, 150),
    },
    "-acik": {  # krem
        "bg": [(0.0, "#f6f4ee"), (0.55, "#efece4"), (1.0, "#ddd8cc")],
        "shadow": (74, 68, 54, 90),
    },
}


# ------------------------------------------------------------------ yardımcı
def circular_cutout(path, cx, cy, R, feather=1.5, out_size=None):
    """Madalyonu dairesel, yumuşak kenarlı bir RGBA kesime dönüştür."""
    src = Image.open(path).convert("RGB")
    a = np.asarray(src, dtype=float)
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx - cx, yy - cy)
    alpha = np.clip((R - r) / feather + 0.5, 0.0, 1.0) * 255.0

    rgba = Image.fromarray(
        np.dstack([a, alpha]).astype(np.uint8), "RGBA"
    ).crop((int(cx - R) - 2, int(cy - R) - 2, int(cx + R) + 3, int(cy + R) + 3))
    if out_size:
        rgba = rgba.resize((out_size, out_size), Image.LANCZOS)
    return rgba


def wordmark_rgba(width):
    """Bakır logotype'ı şeffaf zeminde, istenen genişlikte üret."""
    wm = W.key_wordmark(Image.open(W.WORDMARK))
    x0, y0, x1, y1 = W.ink_bbox(wm)
    wm = wm.crop((x0, y0, x1, y1))
    iw, ih = wm.size
    nh = round(ih * width / iw)
    return W.resize_premultiplied(wm, width, nh, blur=1.3, sharpen=(3.0, 60, 0))


def vertical_gradient(size, stops):
    """Dikey eksende radyal hissi veren yumuşak gradyan (merkezden dışa)."""
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    # merkeze normalize uzaklık (eliptik, tuval oranına uyumlu)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    d = np.clip(d / 1.25, 0.0, 1.0)

    pos = np.array([p for p, _ in stops])
    cols = np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for _, c in stops], float)
    out = np.zeros((h, w, 3))
    for ch in range(3):
        out[..., ch] = np.interp(d, pos, cols[:, ch])
    return Image.fromarray(out.astype(np.uint8), "RGB")


def b64_png(img, **kw):
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True, **kw)
    return base64.b64encode(buf.getvalue()).decode("ascii")


# ------------------------------------------------------------------- banner
def layout():
    """Kilidin tuval üstündeki koordinatlarını hesapla."""
    wm = wordmark_rgba(WM_W)
    wm_h = wm.size[1]
    group_w = EMBLEM_D + GAP + WM_W
    gx = (BW - group_w) / 2
    cy = BH / 2
    return {
        "wm": wm,
        "emblem_xy": (round(gx), round(cy - EMBLEM_D / 2)),
        "emblem_c": (gx + EMBLEM_D / 2, cy),
        "wm_xy": (round(gx + EMBLEM_D + GAP), round(cy - wm_h / 2)),
        "wm_h": wm_h,
    }


def build_png(theme_key, L, emblem, mode="lockup"):
    th = THEMES[theme_key]
    bg = vertical_gradient((BW, BH), th["bg"]).convert("RGBA")

    d = EMBLEM_D if mode == "lockup" else CENTERED_D
    em = emblem.resize((d, d), Image.LANCZOS)
    ex, ey = L["emblem_xy"] if mode == "lockup" else (
        round(BW / 2 - d / 2), round(BH / 2 - d / 2))

    # amblemin yumuşak gölgesi
    sh = Image.new("RGBA", (BW, BH), (0, 0, 0, 0))
    sh.paste(th["shadow"], (ex + 4, ey + 12), em.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    bg.alpha_composite(sh)
    bg.alpha_composite(em, (ex, ey))
    if mode == "lockup":
        bg.alpha_composite(L["wm"], L["wm_xy"])
    return bg.convert("RGB")


def build_svg(theme_key, L, emblem, mode="lockup"):
    """Vektör zemin + gömülü raster. Madalyon fotogerçekçi bir 3B render
    olduğu için vektöre çevrilemez; SVG ölçeklenebilir bir kap olarak çalışır."""
    th = THEMES[theme_key]
    d = EMBLEM_D if mode == "lockup" else CENTERED_D
    ex, ey = L["emblem_xy"] if mode == "lockup" else (
        round(BW / 2 - d / 2), round(BH / 2 - d / 2))
    wx, wy = L["wm_xy"]
    sr, sg, sb, sa = th["shadow"]

    em_b64 = b64_png(emblem.resize((900, 900), Image.LANCZOS))
    wm_b64 = b64_png(wordmark_rgba(WM_W * 2))
    wm_el = (f'<image x="{wx}" y="{wy}" width="{WM_W}" height="{L["wm_h"]}"\n'
             f'         image-rendering="optimizeQuality"\n'
             f'         xlink:href="data:image/png;base64,{wm_b64}"/>'
             ) if mode == "lockup" else ""

    stops = "\n".join(
        f'      <stop offset="{p}" stop-color="{c}"/>' for p, c in th["bg"]
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {BW} {BH}" width="{BW}" height="{BH}">
  <title>MATHERA — YouTube banner</title>
  <defs>
    <radialGradient id="bg" gradientUnits="userSpaceOnUse"
                    cx="{BW/2}" cy="{BH/2}" r="{BW*0.62:.0f}"
                    gradientTransform="translate({BW/2} {BH/2}) scale(1 {BH/BW:.4f}) translate({-BW/2} {-BH/2})">
{stops}
    </radialGradient>
    <filter id="emShadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow dx="4" dy="12" stdDeviation="18"
                    flood-color="rgb({sr},{sg},{sb})" flood-opacity="{sa/255:.2f}"/>
    </filter>
  </defs>

  <rect width="{BW}" height="{BH}" fill="url(#bg)"/>

  <!-- amblem: madalyon logosu -->
  <image x="{ex}" y="{ey}" width="{d}" height="{d}"
         filter="url(#emShadow)" image-rendering="optimizeQuality"
         xlink:href="data:image/png;base64,{em_b64}"/>

  <!-- logotype: bakır MATHERA -->
  {wm_el}
</svg>
"""


def build_guides(png):
    """Güvenli alan kılavuzlu kontrol görseli."""
    g = png.copy().convert("RGBA")
    ov = Image.new("RGBA", g.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rectangle([0, (BH - 423) // 2, BW, (BH + 423) // 2],
                outline=(80, 190, 255, 190), width=3)
    d.rectangle(list(SAFE), outline=(255, 90, 90, 220), width=4)
    d.text((SAFE[0] + 12, SAFE[1] + 10), "GUVENLI ALAN 1235x338 (mobil)",
           fill=(255, 90, 90, 255))
    d.text((14, (BH - 423) // 2 + 10), "masaustu ~2048x423",
           fill=(80, 190, 255, 255))
    g.alpha_composite(ov)
    return g.convert("RGB")


def main():
    L = layout()
    emblem = circular_cutout(f"{ROOT}/mathera-logo.png",
                             MED_CX, MED_CY, MED_R)
    blank = circular_cutout(f"{ROOT}/mathera-madalyon-bos.png",
                            MED_CX, MED_CY, MED_R)
    print(f"amblem kesim: {emblem.size}   logotype: {L['wm'].size}")
    print(f"kilit: amblem @{L['emblem_xy']}  wordmark @{L['wm_xy']}")

    # şeffaf zeminli tek tek varlıklar
    blank.resize((1000, 1000), Image.LANCZOS).save(
        f"{ROOT}/mathera-madalyon-seffaf.png")
    wordmark_rgba(1400).save(f"{ROOT}/mathera-wordmark-seffaf.png")
    emblem.resize((1000, 1000), Image.LANCZOS).save(
        f"{ROOT}/mathera-logo-seffaf.png")

    jobs = [("", "lockup"), ("-acik", "lockup"), ("-ortali", "centered")]
    for key, mode in jobs:
        theme = "" if key == "-ortali" else key
        png = build_png(theme, L, emblem, mode)
        png.save(f"{ROOT}/mathera-banner{key}.png")
        with open(f"{ROOT}/mathera-banner{key}.svg", "w") as f:
            f.write(build_svg(theme, L, emblem, mode))
        print(f"yazildi: mathera-banner{key}.png / .svg  [{mode}]")

    build_guides(build_png("", L, emblem)).save(
        f"{ROOT}/mathera-banner-guvenli-alan.png")

    # tam logonun SVG sarmalayıcısı
    logo = Image.open(f"{ROOT}/mathera-logo.png").resize((1100, 1100), Image.LANCZOS)
    with open(f"{ROOT}/mathera-logo.svg", "w") as f:
        f.write(
            '<svg xmlns="http://www.w3.org/2000/svg" '
            'xmlns:xlink="http://www.w3.org/1999/xlink"\n'
            '     viewBox="0 0 1254 1254" width="1254" height="1254">\n'
            "  <title>MATHERA — logo</title>\n"
            '  <image width="1254" height="1254" image-rendering="optimizeQuality"\n'
            f'         xlink:href="data:image/png;base64,{b64_png(logo)}"/>\n'
            "</svg>\n"
        )
    print("yazildi: mathera-logo.svg + seffaf PNG'ler")


if __name__ == "__main__":
    main()
