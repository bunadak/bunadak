# -*- coding: utf-8 -*-
"""
MATHERA — açılış jeneriği (6.4 sn)

Anlatım:
  1) Boşlukta matematik sembolleri ve ince ızgara belirir
  2) Merkezde geometrik kurulum: nokta, yarıçap, çizilen bakır çember
  3) Fırçalanmış çelik halka yerleşir, üzerine π ve pi basamakları kazınır
  4) MATHERA harfleri madalyonun içinde merkezden dışa doğru açılır
  5) Metal üzerinde speküler ışık süpürmesi
  6) Halkalar açılıp dağılır, yazı banner boyutuna büyür
  7) Sahne yerleşir ve yumuşakça kararır
"""

import math

import cairo

from ortak import (W, H, FPS, HALE, bakir_halka, celik_halka, cikis,
                   cikis_expo, evre, halka_kazima, izgara, logo_yaz,
                   logo_yolu, madalyon_zemin, parlama, sembol_alani,
                   sembolleri_ciz, vinyet, yumusak, zemin)

SURE = 6.4                      # saniye
KARE_SAYISI = int(SURE * FPS)

CX, CY = W * 0.5, 500.0         # madalyon merkezi
R_DIS = 300.0                   # çelik halkanın dış yarıçapı
KALINLIK = 44.0                 # çelik halka kalınlığı
R_BAKIR = R_DIS - KALINLIK - 14  # iç bakır halka
R_KAZIMA = R_DIS - KALINLIK / 2

LOGO_KUCUK = 330.0              # madalyon içindeki yazı genişliği
LOGO_BUYUK = 700.0              # final banner genişliği
LOGO_SON_Y = 540.0

ALAN = sembol_alani(tohum=7, adet=26)


def kare_ciz(ctx, t):
    # ---- evreler
    a_uzay = evre(t, 0.00, 0.90)
    b_cember = evre(t, 0.70, 1.90)
    c_celik = evre(t, 1.60, 2.60)
    c_kazima = evre(t, 2.00, 2.85)
    d_yazi = evre(t, 2.40, 3.40)
    e_parla = evre(t, 3.30, 4.25)
    f_acil = evre(t, 4.10, 5.25)
    kararma = evre(t, 6.00, 6.40)

    # ---- zemin
    parlaklik = 0.78 + 0.17 * yumusak(evre(t, 2.30, 3.20)) \
                     + 0.05 * yumusak(f_acil)
    zemin(ctx, parlaklik)

    ortam = 0.55 + 0.45 * cikis(a_uzay)
    sonda = 1.0 - 0.45 * yumusak(d_yazi) - 0.35 * yumusak(f_acil)
    izgara(ctx, 0.30 * ortam * max(0.0, sonda), kayma=t * 9)
    sembolleri_ciz(ctx, ALAN, t, ortam * max(0.0, sonda + 0.12))

    # ---- madalyonun arkasındaki ışık
    hale = 0.10 + 0.34 * yumusak(evre(t, 2.30, 3.10)) + 0.10 * yumusak(f_acil)
    if hale > 0.01:
        hy = CY + (LOGO_SON_Y - CY) * yumusak(f_acil)
        g = cairo.RadialGradient(CX, hy, 20, CX, hy, 540)
        g.add_color_stop_rgba(0.0, *HALE, 0.20 * hale)
        g.add_color_stop_rgba(0.40, 0.62, 0.48, 0.36, 0.09 * hale)
        g.add_color_stop_rgba(1.0, 0.20, 0.26, 0.38, 0.0)
        ctx.set_operator(cairo.OPERATOR_ADD)
        ctx.set_source(g)
        ctx.paint()
        ctx.set_operator(cairo.OPERATOR_OVER)

    # ---- madalyon (f evresinde büyüyerek dağılır)
    dagil = cikis_expo(f_acil)
    m_olcek = 1.0 + 0.85 * dagil
    m_alfa = (1.0 - dagil) ** 1.4

    if m_alfa > 0.004:
        ctx.save()
        ctx.translate(CX, CY)
        ctx.scale(m_olcek, m_olcek)
        ctx.translate(-CX, -CY)

        # iç disk — çelik halkayla birlikte gelir
        madalyon_zemin(ctx, CX, CY, R_BAKIR + 8, m_alfa * cikis(c_celik) * 0.92)

        # geometrik kurulum: merkez noktası ve yarıçap süpürmesi
        kurulum = (1.0 - yumusak(evre(t, 1.55, 2.05))) * m_alfa
        if kurulum > 0.004:
            ctx.set_source_rgba(0.85, 0.66, 0.47, 0.85 * kurulum)
            ctx.arc(CX, CY, 3.4, 0, math.tau)
            ctx.fill()
            aci = -math.pi / 2 + math.tau * cikis(b_cember)
            ctx.set_line_width(1.2)
            ctx.set_source_rgba(0.85, 0.66, 0.47, 0.35 * kurulum)
            ctx.move_to(CX, CY)
            ctx.line_to(CX + R_BAKIR * math.cos(aci), CY + R_BAKIR * math.sin(aci))
            ctx.stroke()

        # bakır iç çember (çizilerek ilerler)
        bakir_halka(ctx, CX, CY, R_BAKIR, 3.0, m_alfa, cikis(b_cember))
        if 0.02 < b_cember < 0.995:      # çemberi çizen uç ışığı
            aci = -math.pi / 2 + math.tau * cikis(b_cember)
            ux, uy = CX + R_BAKIR * math.cos(aci), CY + R_BAKIR * math.sin(aci)
            g = cairo.RadialGradient(ux, uy, 0, ux, uy, 26)
            g.add_color_stop_rgba(0.0, 1.0, 0.86, 0.70, 0.85 * m_alfa)
            g.add_color_stop_rgba(1.0, 1.0, 0.80, 0.60, 0.0)
            ctx.set_operator(cairo.OPERATOR_ADD)
            ctx.set_source(g)
            ctx.paint()
            ctx.set_operator(cairo.OPERATOR_OVER)

        # çelik dış halka
        if c_celik > 0.004:
            c_olcek = 1.0 + 0.09 * (1.0 - cikis_expo(c_celik))
            ctx.save()
            ctx.translate(CX, CY)
            ctx.scale(c_olcek, c_olcek)
            ctx.translate(-CX, -CY)
            celik_halka(ctx, CX, CY, R_DIS, KALINLIK, m_alfa * cikis(c_celik))
            halka_kazima(ctx, CX, CY, R_KAZIMA, 27,
                         m_alfa * cikis(c_celik), cikis(c_kazima))
            ctx.restore()
        ctx.restore()

    # ---- logo yazısı: harfler merkezden dışa açılır
    harf_oran = []
    for i in range(7):
        gecikme = abs(i - 3) * 0.075
        harf_oran.append(cikis(evre(t, 2.40 + gecikme, 2.95 + gecikme)))

    buyu = cikis_expo(f_acil)
    l_genislik = LOGO_KUCUK + (LOGO_BUYUK - LOGO_KUCUK) * buyu
    l_y = CY + (LOGO_SON_Y - CY) * buyu
    l_alfa = min(1.0, d_yazi * 3.0)

    if l_alfa > 0.004:
        logo_yaz(ctx, CX, l_y, l_genislik, l_alfa, harf_ilerleme=harf_oran)

    # ---- speküler ışık süpürmesi (yazı + çelik halka üzerinde)
    if 0.0 < e_parla < 1.0:
        konum = -420 + (W + 840) * yumusak(e_parla)
        guc = math.sin(math.pi * e_parla) * 0.55

        ctx.save()                                  # yazı
        logo_yolu(ctx, CX, l_y, l_genislik)
        ctx.clip()
        parlama(ctx, konum, 300, guc)
        ctx.restore()

        if m_alfa > 0.01:                           # çelik halka
            ctx.save()
            ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
            ctx.arc(CX, CY, R_DIS * m_olcek, 0, math.tau)
            ctx.arc(CX, CY, (R_DIS - KALINLIK) * m_olcek, 0, math.tau)
            ctx.clip()
            parlama(ctx, konum, 340, guc * 0.85 * m_alfa)
            ctx.restore()

    # ---- kapanış
    vinyet(ctx, 0.52)
    if kararma > 0.0:
        ctx.set_source_rgba(0, 0, 0, yumusak(kararma))
        ctx.paint()
