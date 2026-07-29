# -*- coding: utf-8 -*-
"""
MATHERA — YouTube kanal banner'ı (2560 × 1440)

Logoya hiç dokunulmaz: harf biçimi, harf aralığı, bakır metal işlemesi ve
madalyon figürü jeneriklerdekiyle birebir aynı kaynaktan (jenerik/ortak.py)
gelir. Banner yalnızca logonun etrafına kompozisyon kurar.

YouTube ölçüleri
----------------
  tuval          2560 × 1440   (TV'de tamamı görünür)
  masaüstü       2560 ×  423
  tablet         1855 ×  423
  güvenli alan   1546 ×  423   ← her cihazda görünen, ortalanmış alan

Bütün okunması gereken içerik (logo) güvenli alanın içinde tutulmuştur;
dışarıda kalan bölge yalnızca atmosfer taşır, kırpılması sorun olmaz.

Kullanım:
    python3 banner.py          -> koyu ve açık sürümleri + kılavuzu üretir
"""

import math
import os
import sys

import cairo

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "jenerik"))
import ortak  # noqa: E402  (yol ayarından sonra)

# ---------------------------------------------------------------- ölçüler

W, H = 2560, 1440
GUVENLI_G, GUVENLI_Y = 1546, 423
CX, CY = W / 2, H / 2

LOGO_G = 1040.0           # logo genişliği (güvenli alana rahat sığar)
LOGO_Y = CY - 24          # optik olarak ortadan biraz yukarıda dursun

# jenerikteki yardımcılar modül düzeyindeki W/H'yi okur; banner ölçüsüne alıyoruz
ortak.W, ortak.H = W, H

# ---------------------------------------------------------------- paletler

KOYU = {
    "merkez": (0.086, 0.200, 0.337),
    "kenar": (0.012, 0.031, 0.059),
    "cizgi": (0.85, 0.64, 0.45),
    "halka": (0.80, 0.86, 0.94),
    "ortam": (0.306, 0.482, 0.659),
    "hale": ortak.HALE,
    "vinyet": 0.62,
    "yansima": 0.17,
}

ACIK = {
    "merkez": (0.976, 0.957, 0.925),
    "kenar": (0.878, 0.843, 0.792),
    "cizgi": (0.62, 0.42, 0.26),
    "halka": (0.42, 0.36, 0.30),
    "ortam": (0.58, 0.52, 0.45),
    "hale": (0.85, 0.72, 0.55),
    "vinyet": 0.16,
    "yansima": 0.10,
}

# açık zeminde okunması için bakırın koyulaştırılmış hali
BAKIR_ACIK = [
    (0.00, 0.431, 0.251, 0.129),
    (0.09, 0.643, 0.416, 0.235),
    (0.30, 0.812, 0.596, 0.416),
    (0.44, 0.937, 0.831, 0.714),
    (0.50, 0.612, 0.365, 0.196),
    (0.62, 0.769, 0.541, 0.353),
    (0.85, 0.545, 0.322, 0.161),
    (1.00, 0.376, 0.204, 0.098),
]


# ---------------------------------------------------------------- parçalar

def zemin(ctx, p):
    g = cairo.RadialGradient(CX, CY - 40, 80, CX, CY - 40, W * 0.62)
    g.add_color_stop_rgb(0.0, *p["merkez"])
    m = p["merkez"]
    k = p["kenar"]
    g.add_color_stop_rgb(0.52, *[m[i] * 0.68 + k[i] * 0.32 for i in range(3)])
    g.add_color_stop_rgb(1.0, *k)
    ctx.set_source(g)
    ctx.paint()


def madalyon_yankisi(ctx, p, cx, cy, r):
    """Madalyon figürünün soluk yankısı — markayı taşır, dikkat çekmez."""
    ctx.save()
    g = cairo.RadialGradient(cx, cy, r * 0.2, cx, cy, r)
    g.add_color_stop_rgba(0.0, *p["halka"], 0.045)
    g.add_color_stop_rgba(1.0, *p["halka"], 0.0)
    ctx.set_source(g)
    ctx.arc(cx, cy, r * 0.88, 0, math.tau)
    ctx.fill()

    ctx.set_line_width(2.0)
    ctx.set_source_rgba(*p["cizgi"], 0.16)
    ctx.arc(cx, cy, r, 0, math.tau)
    ctx.stroke()

    ctx.set_line_width(1.4)
    ctx.set_source_rgba(*p["halka"], 0.13)
    ctx.arc(cx, cy, r * 0.86, 0, math.tau)
    ctx.stroke()
    ctx.set_source_rgba(*p["halka"], 0.08)
    ctx.arc(cx, cy, r * 0.82, 0, math.tau)
    ctx.stroke()

    # halka üzerine kazınmış π basamakları
    ctx.select_font_face(ortak.UI_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(r * 0.075)
    for derece, im in ortak.PI_BASAMAK:
        a = math.radians(derece)
        x, y = cx + r * 0.935 * math.cos(a), cy + r * 0.935 * math.sin(a)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(a + math.pi / 2)
        e = ctx.text_extents(im)
        ctx.move_to(-e.width / 2 - e.x_bearing, e.height / 2)
        ctx.set_source_rgba(*p["halka"], 0.20)
        ctx.show_text(im)
        ctx.restore()
    ctx.restore()


def hat(ctx, p, y, genislik, alfa, bosluk=0.0):
    """Ortası boşluklu, uçları sönen ince yatay bakır hat."""
    g = cairo.LinearGradient(CX - genislik / 2, 0, CX + genislik / 2, 0)
    r, gg, b = p["cizgi"]
    for konum, a in ((0.0, 0.0), (0.22, alfa), (0.5, alfa), (0.78, alfa),
                     (1.0, 0.0)):
        g.add_color_stop_rgba(konum, r, gg, b, a)
    ctx.set_source(g)
    ctx.set_line_width(1.6)
    if bosluk > 0:
        ctx.move_to(CX - genislik / 2, y)
        ctx.line_to(CX - bosluk / 2, y)
        ctx.move_to(CX + bosluk / 2, y)
        ctx.line_to(CX + genislik / 2, y)
    else:
        ctx.move_to(CX - genislik / 2, y)
        ctx.line_to(CX + genislik / 2, y)
    ctx.stroke()


def elmas(ctx, p, x, y, boy, alfa):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(math.pi / 4)
    ctx.set_source_rgba(*p["cizgi"], alfa)
    ctx.rectangle(-boy / 2, -boy / 2, boy, boy)
    ctx.fill()
    ctx.restore()


def logo_ve_yansima(ctx, p):
    olcu = ortak.logo_yaz(ctx, CX, LOGO_Y, LOGO_G)

    # zeminde yumuşak yansıma — metale ağırlık ve derinlik katar
    if p["yansima"] <= 0.01:
        return olcu
    taban = olcu["taban"]
    ctx.push_group()
    ctx.save()
    ctx.translate(0, 2 * taban + 10)
    ctx.scale(1, -1)
    ortak.logo_yaz(ctx, CX, LOGO_Y, LOGO_G, golge=False)
    ctx.restore()
    desen = ctx.pop_group()

    maske = cairo.LinearGradient(0, taban + 8, 0, taban + 100)
    maske.add_color_stop_rgba(0.0, 0, 0, 0, p["yansima"])
    maske.add_color_stop_rgba(1.0, 0, 0, 0, 0.0)
    ctx.set_source(desen)
    ctx.mask(maske)
    return olcu


def vinyet(ctx, guc):
    g = cairo.RadialGradient(CX, CY, H * 0.34, CX, CY, W * 0.66)
    g.add_color_stop_rgba(0.0, 0, 0, 0, 0.0)
    g.add_color_stop_rgba(1.0, 0, 0, 0, guc)
    ctx.set_source(g)
    ctx.paint()


# ---------------------------------------------------------------- kompozisyon

def ciz(ctx, p, acik=False):
    if acik:                       # açık zeminde bakırı koyulaştır
        ortak.BAKIR, yedek = BAKIR_ACIK, ortak.BAKIR

    zemin(ctx, p)

    # kenarlarda yarısı kadraj dışında kalan madalyon yankıları
    madalyon_yankisi(ctx, p, 205, CY, 520)
    madalyon_yankisi(ctx, p, W - 205, CY, 520)

    ortak.izgara(ctx, 0.16 if not acik else 0.10, aralik=128)
    ortak.sembolleri_ciz(ctx, ALAN, 0.0, 0.75 if not acik else 0.45)

    # logonun arkasındaki sıcak ışık
    g = cairo.RadialGradient(CX, LOGO_Y, 40, CX, LOGO_Y, 760)
    g.add_color_stop_rgba(0.0, *p["hale"], 0.16 if not acik else 0.10)
    g.add_color_stop_rgba(1.0, *p["hale"], 0.0)
    ctx.set_operator(cairo.OPERATOR_ADD if not acik else cairo.OPERATOR_OVER)
    ctx.set_source(g)
    ctx.paint()
    ctx.set_operator(cairo.OPERATOR_OVER)

    olcu = logo_ve_yansima(ctx, p)

    # Logoyu çerçeveleyen ince hatlar. İkisi de güvenli alanın içinde durur ki
    # kompozisyon telefonda da masaüstünde de aynı şekilde okunsun.
    hat(ctx, p, olcu["ust"] - 78, 1420, 0.34)
    hat(ctx, p, olcu["taban"] + 120, 1420, 0.26, bosluk=120)
    elmas(ctx, p, CX, olcu["taban"] + 120, 9, 0.55)

    vinyet(ctx, p["vinyet"])
    if acik:
        ortak.BAKIR = yedek


ALAN = ortak.sembol_alani(tohum=31, adet=30)


def kilavuz(ctx):
    """Güvenli alanları gösteren kontrol katmanı."""
    for g_, y_, renk, ad in (
            (GUVENLI_G, GUVENLI_Y, (0.35, 0.95, 0.55), "GÜVENLİ ALAN  1546 × 423"),
            (1855, GUVENLI_Y, (0.98, 0.80, 0.30), "TABLET  1855 × 423"),
            (W, GUVENLI_Y, (0.98, 0.45, 0.40), "MASAÜSTÜ  2560 × 423")):
        ctx.set_source_rgba(*renk, 0.9)
        ctx.set_line_width(3)
        ctx.set_dash([14, 10])
        ctx.rectangle(CX - g_ / 2, CY - y_ / 2, g_, y_)
        ctx.stroke()
        ctx.set_dash([])
        ctx.select_font_face(ortak.UI_FONT, cairo.FONT_SLANT_NORMAL,
                             cairo.FONT_WEIGHT_NORMAL)
        ctx.set_font_size(22)
        ctx.move_to(CX - g_ / 2 + 10, CY - y_ / 2 - 12)
        ctx.show_text(ad)


def uret():
    for ad, palet, acik in (("MATHERA_banner", KOYU, False),
                            ("MATHERA_banner_acik", ACIK, True)):
        yuzey = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
        ctx = cairo.Context(yuzey)
        ciz(ctx, palet, acik)
        yuzey.write_to_png(ad + ".png")
        print("üretildi:", ad + ".png")

        if not acik:                      # kılavuzlu kontrol sürümü
            kilavuz(ctx)
            yuzey.write_to_png(ad + "_kilavuz.png")
            print("üretildi:", ad + "_kilavuz.png")


if __name__ == "__main__":
    uret()
