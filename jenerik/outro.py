# -*- coding: utf-8 -*-
"""
MATHERA — kapanış jeneriği (10 sn)

YouTube bitiş ekranı (end screen) öğeleri için hazır yerleşim içerir:
  - solda  : sonraki video kartı        (480 × 270)
  - ortada : abone ol dairesi           (çap 236)
  - sağda  : oynatma listesi kartı      (480 × 270)

Çerçeveler bilerek boş bırakılmıştır; YouTube kendi küçük resimlerini
tam olarak bu alanların üzerine yerleştirir. Ortadaki daireyi saran ince
bakır yay, videonun kalan süresini gösterir.
"""

import math

import cairo

from ortak import (W, H, FPS, HALE, alt_yazi, cikis, cikis_expo, evre,
                   ince_cizgi, izgara, logo_yaz, sembol_alani,
                   sembolleri_ciz, vinyet, zemin)

SURE = 10.0
KARE_SAYISI = int(SURE * FPS)

LOGO_Y = 150.0
LOGO_GENISLIK = 380.0
TESEKKUR = "İZLEDİĞİN İÇİN TEŞEKKÜRLER"

KART_G, KART_Y = 480.0, 270.0
SATIR_Y = 620.0
SOL_X, SAG_X = 420.0, 1500.0
DAIRE_X, DAIRE_R = 960.0, 118.0
ETIKET_Y = 800.0

ALAN = sembol_alani(tohum=23, adet=22)


def yuvarlak_dikdortgen(ctx, x, y, g, y_, r):
    ctx.new_sub_path()
    ctx.arc(x + g - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + g - r, y + y_ - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + y_ - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()


def kose_ayraci(ctx, x, y, g, y_, uzunluk, alfa):
    """Kartın dört köşesindeki bakır ayraçlar."""
    if alfa <= 0.004:
        return
    ctx.set_line_width(2.2)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_source_rgba(0.80, 0.60, 0.42, alfa)
    for kx, ky, dx, dy in ((x, y, 1, 1), (x + g, y, -1, 1),
                           (x, y + y_, 1, -1), (x + g, y + y_, -1, -1)):
        ctx.move_to(kx + dx * uzunluk, ky)
        ctx.line_to(kx, ky)
        ctx.line_to(kx, ky + dy * uzunluk)
        ctx.stroke()


def video_karti(ctx, cx, cy, acilma, nabiz):
    """Bitiş ekranı video kartı yuvası."""
    if acilma <= 0.004:
        return
    a = cikis(acilma)
    olcek = 0.94 + 0.06 * cikis_expo(acilma)
    g, y_ = KART_G * olcek, KART_Y * olcek
    x, y = cx - g / 2, cy - y_ / 2

    ctx.save()
    yuvarlak_dikdortgen(ctx, x, y, g, y_, 10)
    ctx.set_source_rgba(0.055, 0.129, 0.227, 0.55 * a)
    ctx.fill_preserve()
    ctx.set_line_width(1.2)
    ctx.set_source_rgba(0.62, 0.72, 0.85, 0.28 * a)
    ctx.stroke()
    ctx.restore()

    kose_ayraci(ctx, x, y, g, y_, 26 * olcek, 0.75 * a)

    # ortadaki oynat simgesi — hafifçe nefes alır
    r = 30 * olcek * (1.0 + 0.03 * nabiz)
    ctx.save()
    ctx.set_line_width(1.6)
    ctx.set_source_rgba(0.80, 0.60, 0.42, 0.45 * a)
    ctx.arc(cx, cy, r, 0, math.tau)
    ctx.stroke()
    ctx.set_source_rgba(0.85, 0.66, 0.48, 0.55 * a)
    ctx.move_to(cx - r * 0.26, cy - r * 0.36)
    ctx.line_to(cx + r * 0.42, cy)
    ctx.line_to(cx - r * 0.26, cy + r * 0.36)
    ctx.close_path()
    ctx.fill()
    ctx.restore()


def abone_dairesi(ctx, cx, cy, acilma, nabiz, ilerleme):
    """Abone ol yuvası + kalan süreyi gösteren bakır yay."""
    if acilma <= 0.004:
        return
    a = cikis(acilma)
    r = DAIRE_R * (0.94 + 0.06 * cikis_expo(acilma))

    ctx.save()
    ctx.arc(cx, cy, r, 0, math.tau)
    ctx.set_source_rgba(0.055, 0.129, 0.227, 0.60 * a)
    ctx.fill_preserve()
    ctx.set_line_width(1.2)
    ctx.set_source_rgba(0.62, 0.72, 0.85, 0.28 * a)
    ctx.stroke()

    # nefes alan iç halka
    ctx.set_line_width(1.6)
    ctx.set_source_rgba(0.80, 0.60, 0.42, (0.30 + 0.16 * nabiz) * a)
    ctx.arc(cx, cy, r * (0.80 + 0.02 * nabiz), 0, math.tau)
    ctx.stroke()

    # süre yayı
    if ilerleme > 0.001:
        ctx.set_line_width(3.0)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_source_rgba(0.86, 0.67, 0.48, 0.85 * a)
        bas = -math.pi / 2
        ctx.arc(cx, cy, r + 14, bas, bas + math.tau * min(1.0, ilerleme))
        ctx.stroke()

    # zil simgesi
    ctx.set_line_width(2.4)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_source_rgba(0.88, 0.70, 0.52, 0.75 * a)
    s = r * 0.30
    ctx.move_to(cx - s, cy + s * 0.62)
    ctx.line_to(cx - s * 0.80, cy + s * 0.62)
    ctx.curve_to(cx - s * 0.80, cy - s * 0.30, cx - s * 0.55, cy - s * 0.85,
                 cx, cy - s * 0.85)
    ctx.curve_to(cx + s * 0.55, cy - s * 0.85, cx + s * 0.80, cy - s * 0.30,
                 cx + s * 0.80, cy + s * 0.62)
    ctx.line_to(cx + s, cy + s * 0.62)
    ctx.stroke()
    ctx.arc(cx, cy + s * 1.02, s * 0.20, 0, math.tau)
    ctx.fill()
    ctx.restore()


def kare_ciz(ctx, t):
    a_giris = evre(t, 0.00, 0.90)
    b_logo = evre(t, 0.30, 1.30)
    c_tesekkur = evre(t, 0.85, 1.75)
    d_sol = evre(t, 1.25, 2.15)
    d_orta = evre(t, 1.45, 2.35)
    d_sag = evre(t, 1.65, 2.55)
    e_etiket = evre(t, 2.10, 2.90)

    nabiz = math.sin(t * 1.9)

    # ---- zemin
    zemin(ctx, 0.82 + 0.03 * math.sin(t * 0.5))
    ortam = cikis(a_giris)
    izgara(ctx, 0.22 * ortam, kayma=t * 6)
    sembolleri_ciz(ctx, ALAN, t, 0.85 * ortam)

    # logo arkası yumuşak ışık
    g = cairo.RadialGradient(W / 2, LOGO_Y, 20, W / 2, LOGO_Y, 460)
    g.add_color_stop_rgba(0.0, *HALE, 0.13 * ortam)
    g.add_color_stop_rgba(1.0, 0.20, 0.26, 0.38, 0.0)
    ctx.set_operator(cairo.OPERATOR_ADD)
    ctx.set_source(g)
    ctx.paint()
    ctx.set_operator(cairo.OPERATOR_OVER)

    # ---- başlık bloğu
    if b_logo > 0.004:
        kayma = (1.0 - cikis_expo(b_logo)) * 18
        logo_yaz(ctx, W / 2, LOGO_Y + kayma, LOGO_GENISLIK, cikis(b_logo))

    if c_tesekkur > 0.004:
        a = cikis(c_tesekkur)
        ince_cizgi(ctx, W / 2, LOGO_Y + 62, 260 * a, 0.55 * a)
        alt_yazi(ctx, TESEKKUR, W / 2, LOGO_Y + 112, 24, 0.90 * a, iz=5.5)

    # ---- bitiş ekranı yuvaları
    video_karti(ctx, SOL_X, SATIR_Y, d_sol, nabiz)
    abone_dairesi(ctx, DAIRE_X, SATIR_Y, d_orta, nabiz, evre(t, 1.6, SURE))
    video_karti(ctx, SAG_X, SATIR_Y, d_sag, nabiz)

    # ---- etiketler
    if e_etiket > 0.004:
        a = cikis(e_etiket) * 0.80
        alt_yazi(ctx, "SONRAKİ VİDEO", SOL_X, ETIKET_Y, 19, a, iz=4.0)
        alt_yazi(ctx, "ABONE OL", DAIRE_X, ETIKET_Y, 19, a, iz=4.0,
                 renk=(0.86, 0.70, 0.53))
        alt_yazi(ctx, "OYNATMA LİSTESİ", SAG_X, ETIKET_Y, 19, a, iz=4.0)

    vinyet(ctx, 0.50)
