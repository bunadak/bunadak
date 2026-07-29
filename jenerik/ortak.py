# -*- coding: utf-8 -*-
"""
MATHERA jenerikleri — ortak çizim kütüphanesi.

Marka dili logodan alınmıştır:
  - Derin lacivert zemin, merkezde yumuşak ışık (banner logosu)
  - Bakır/roze altın metalik yazı (MATHERA)
  - Fırçalanmış çelik dış halka + ince bakır iç halka, üzerinde
    kazınmış π ve pi basamakları (madalyon logosu)

Çizim cairo ile yapılır; kareler ffmpeg'e ham BGR olarak aktarılır.
"""

import math
import random

import cairo
import numpy as np

# ---------------------------------------------------------------- sabitler

W, H = 1920, 1080
FPS = 60

LOGO_FONT = "Mathera Wordmark"    # logodaki geometrik harfler (Exo 2, 600)
UI_FONT = "Montserrat"            # Türkçe alt yazılar (tam karakter desteği)

# Harf aralığı, logo fotoğrafındaki kelime genişliği / büyük harf yüksekliği
# oranı (≈ 6.34) ölçülerek bulundu.
IZ_ORANI = 0.02

# --- renk paleti -------------------------------------------------------
# Kurgu: soğuk ve derin lacivert ↔ sıcak bakır. Birbirinin tamamlayıcısı
# olan bu iki uç, aradaki koyu düşüşle birlikte metale derinlik verir.
# Zeminin kenarları neredeyse siyaha inince bakır kendiliğinden parlar.

BG_MERKEZ = (0.078, 0.184, 0.310)   # #142F4F — derin ama canlı lacivert
BG_KENAR = (0.016, 0.043, 0.078)    # #040B14 — neredeyse siyah düşüş

# bakır / roze altın: logodaki gibi üstte sıcak bakır, ortada parlak
# yatay bant, altta koyu bronz
BAKIR = [
    (0.00, 0.541, 0.341, 0.188),    # #8A5730 üst kenar
    (0.09, 0.753, 0.541, 0.341),    # #C08A57
    (0.30, 0.878, 0.690, 0.522),    # #E0B085
    (0.44, 0.965, 0.890, 0.792),    # #F6E3CA parlak bant
    (0.50, 0.725, 0.471, 0.271),    # #B97845 eğim çizgisi
    (0.62, 0.851, 0.635, 0.447),    # #D9A272
    (0.85, 0.663, 0.416, 0.235),    # #A96A3C
    (1.00, 0.486, 0.271, 0.137),    # #7C4523 alt kenar
]

# çelik: bakırla yarışmaması için mavimsi soğuk ton
CELIK = [
    (0.00, 0.682, 0.745, 0.800),
    (0.22, 0.333, 0.388, 0.435),
    (0.48, 0.824, 0.871, 0.910),
    (0.72, 0.255, 0.302, 0.345),
    (1.00, 0.612, 0.675, 0.729),
]

ORTAM = (0.306, 0.482, 0.659)       # ızgara / süzülen semboller (soğuk mavi)
HALE = (0.98, 0.76, 0.48)           # logonun arkasındaki sıcak amber ışık


# ---------------------------------------------------------------- yardımcılar

def yumusak(t):
    """easeInOutCubic — yumuşak giriş/çıkış."""
    t = max(0.0, min(1.0, t))
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def cikis(t):
    """easeOutCubic — hızlı başlayıp yavaşlayan."""
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def cikis_expo(t):
    """easeOutExpo — çok yumuşak yerleşme."""
    t = max(0.0, min(1.0, t))
    return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)


def evre(t, bas, bit):
    """t zamanını [bas, bit] aralığında 0..1'e çevirir."""
    if bit <= bas:
        return 1.0
    return max(0.0, min(1.0, (t - bas) / (bit - bas)))


def gradyan_dikey(y0, y1, stoplar, alfa=1.0):
    g = cairo.LinearGradient(0, y0, 0, y1)
    for p, r, gg, b in stoplar:
        g.add_color_stop_rgba(p, r, gg, b, alfa)
    return g


def gradyan_egik(x0, y0, x1, y1, stoplar, alfa=1.0):
    g = cairo.LinearGradient(x0, y0, x1, y1)
    for p, r, gg, b in stoplar:
        g.add_color_stop_rgba(p, r, gg, b, alfa)
    return g


# ---------------------------------------------------------------- zemin

def zemin(ctx, parlaklik=1.0):
    """Lacivert radyal zemin — banner logosundaki ışık dağılımı."""
    g = cairo.RadialGradient(W * 0.5, H * 0.46, 60,
                             W * 0.5, H * 0.46, W * 0.78)
    cr, cg, cb = BG_MERKEZ
    g.add_color_stop_rgb(0.0, cr * parlaklik, cg * parlaklik, cb * parlaklik)
    g.add_color_stop_rgb(0.55, cr * 0.72 * parlaklik, cg * 0.72 * parlaklik,
                         cb * 0.72 * parlaklik)
    g.add_color_stop_rgb(1.0, *BG_KENAR)
    ctx.set_source(g)
    ctx.paint()


def izgara(ctx, alfa, kayma=0.0, aralik=96):
    """Merkeze doğru belirginleşen ince koordinat ızgarası."""
    if alfa <= 0.002:
        return
    ctx.push_group()
    ctx.set_line_width(1.0)
    ctx.set_source_rgba(*ORTAM, 1.0)
    x = -aralik + (kayma % aralik)
    while x < W + aralik:
        ctx.move_to(x, 0)
        ctx.line_to(x, H)
        x += aralik
    y = -aralik + (kayma * 0.5 % aralik)
    while y < H + aralik:
        ctx.move_to(0, y)
        ctx.line_to(W, y)
        y += aralik
    ctx.stroke()
    desen = ctx.pop_group()

    maske = cairo.RadialGradient(W * 0.5, H * 0.46, 40,
                                 W * 0.5, H * 0.46, W * 0.55)
    maske.add_color_stop_rgba(0.0, 0, 0, 0, alfa)
    maske.add_color_stop_rgba(1.0, 0, 0, 0, 0.0)
    ctx.set_source(desen)
    ctx.mask(maske)


def vinyet(ctx, guc=0.55):
    g = cairo.RadialGradient(W * 0.5, H * 0.5, H * 0.30,
                             W * 0.5, H * 0.5, W * 0.72)
    g.add_color_stop_rgba(0.0, 0, 0, 0, 0.0)
    g.add_color_stop_rgba(1.0, 0, 0, 0, guc)
    ctx.set_source(g)
    ctx.paint()


# ---- süzülen matematik sembolleri -------------------------------------

SEMBOLLER = ["π", "∑", "√", "∫", "Δ", "θ", "∞", "≠", "≈", "f(x)", "x²",
             "3", "1", "4", "1", "5", "9", "2", "6", "+", "−", "×"]


def sembol_alani(tohum=7, adet=26):
    """Arka planda yavaşça süzülecek sembollerin sabit dağılımı."""
    rnd = random.Random(tohum)
    alan = []
    for _ in range(adet):
        alan.append({
            "s": rnd.choice(SEMBOLLER),
            "x": rnd.uniform(-0.05, 1.05) * W,
            "y": rnd.uniform(-0.05, 1.05) * H,
            "boy": rnd.uniform(22, 54),
            "hiz": rnd.uniform(4, 14),
            "faz": rnd.uniform(0, math.tau),
            "a": rnd.uniform(0.05, 0.16),
        })
    return alan


def sembolleri_ciz(ctx, alan, t, alfa=1.0):
    if alfa <= 0.003:
        return
    ctx.select_font_face(UI_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    for p in alan:
        y = p["y"] - p["hiz"] * t
        y = (y % (H + 160)) - 80
        salinim = math.sin(t * 0.6 + p["faz"]) * 12
        ctx.set_font_size(p["boy"])
        ctx.set_source_rgba(*ORTAM, p["a"] * alfa)
        e = ctx.text_extents(p["s"])
        ctx.move_to(p["x"] + salinim - e.width / 2, y)
        ctx.show_text(p["s"])


# ---------------------------------------------------------------- logo yazısı

def _harf_ilerlemeleri(ctx, boy, iz_orani):
    """Verilen punto için harf genişlikleri ve toplam genişlik."""
    ctx.select_font_face(LOGO_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(boy)
    harfler = "MATHERA"
    ilerle = [ctx.text_extents(h).x_advance for h in harfler]
    iz = boy * iz_orani
    toplam = sum(ilerle) + iz * (len(harfler) - 1)
    return harfler, ilerle, iz, toplam


def logo_punto(ctx, hedef_genislik, iz_orani=IZ_ORANI):
    """Yazının istenen genişliğe oturması için gereken punto."""
    _, _, _, toplam = _harf_ilerlemeleri(ctx, 100.0, iz_orani)
    return 100.0 * hedef_genislik / toplam


def _kabartma(ctx, ust, taban, alfa):
    """
    Kalın harflerde 3B his veren kabartma: üstte parlayan kenar,
    altta koyu gölge. Çağıran, harfin yoluna kırpmış olmalıdır.
    """
    kap = taban - ust
    g = cairo.LinearGradient(0, ust, 0, ust + kap * 0.20)
    g.add_color_stop_rgba(0.0, 1.0, 0.96, 0.90, 0.16 * alfa)
    g.add_color_stop_rgba(1.0, 1.0, 0.96, 0.90, 0.0)
    ctx.set_operator(cairo.OPERATOR_ADD)
    ctx.set_source(g)
    ctx.paint()
    ctx.set_operator(cairo.OPERATOR_OVER)

    g = cairo.LinearGradient(0, taban - kap * 0.22, 0, taban)
    g.add_color_stop_rgba(0.0, 0.16, 0.07, 0.02, 0.0)
    g.add_color_stop_rgba(1.0, 0.16, 0.07, 0.02, 0.34 * alfa)
    ctx.set_source(g)
    ctx.paint()


def logo_yaz(ctx, cx, cy, hedef_genislik, alfa=1.0, iz_orani=IZ_ORANI,
             harf_ilerleme=None, golge=True, renk=None):
    """
    MATHERA yazısını metalik bakır dolguyla çizer.

    cx, cy            : yazının merkez noktası (dikey olarak da ortalanır)
    hedef_genislik    : yazının toplam genişliği (px)
    harf_ilerleme     : 0..1 arası liste; her harfin ayrı açılma oranı
                        (None ise hepsi tam görünür)
    """
    if alfa <= 0.003:
        return
    boy = logo_punto(ctx, hedef_genislik, iz_orani)
    harfler, ilerle, iz, toplam = _harf_ilerlemeleri(ctx, boy, iz_orani)

    ctx.select_font_face(LOGO_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(boy)
    olcu = ctx.text_extents("MATHERA")
    kap = -olcu.y_bearing               # büyük harf yüksekliği
    taban = cy + kap / 2                # dikey ortalama
    ust = taban - kap

    dolgu = renk if renk else gradyan_dikey(ust, taban, BAKIR, alfa)
    kenar = gradyan_dikey(ust, taban, BAKIR, alfa * 0.55)

    x = cx - toplam / 2
    for i, h in enumerate(harfler):
        oran = 1.0 if harf_ilerleme is None else harf_ilerleme[i]
        if oran <= 0.003:
            x += ilerle[i] + iz
            continue
        ha = alfa * min(1.0, oran)
        kayma = (1.0 - cikis(oran)) * boy * 0.16   # aşağıdan yükselerek gelir

        ctx.save()
        ctx.translate(0, kayma)

        if golge:
            ctx.move_to(x, taban + boy * 0.028)
            ctx.text_path(h)
            ctx.set_source_rgba(0.0, 0.0, 0.0, 0.42 * ha)
            ctx.fill()

        ctx.move_to(x, taban)
        ctx.text_path(h)
        if ha < 1.0 and renk is None:
            ctx.set_source(gradyan_dikey(ust, taban, BAKIR, ha))
        else:
            ctx.set_source(dolgu)
        ctx.fill_preserve()
        ctx.set_line_width(max(0.6, boy * 0.006))   # zeminden ayıran ince kenar
        if renk is None:
            ctx.set_source_rgba(0.24, 0.12, 0.05, 0.40 * ha)
        else:
            ctx.set_source(kenar)
        ctx.stroke_preserve()

        if renk is None:                            # kabartma
            ctx.save()
            ctx.clip()
            _kabartma(ctx, ust, taban, ha)
            ctx.restore()
        else:
            ctx.new_path()
        ctx.restore()

        x += ilerle[i] + iz

    return {"ust": ust, "taban": taban, "genislik": toplam, "boy": boy}


def logo_yolu(ctx, cx, cy, hedef_genislik, iz_orani=IZ_ORANI):
    """Parlama süpürmesini kırpmak için yazının yolunu oluşturur."""
    boy = logo_punto(ctx, hedef_genislik, iz_orani)
    harfler, ilerle, iz, toplam = _harf_ilerlemeleri(ctx, boy, iz_orani)
    ctx.select_font_face(LOGO_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(boy)
    olcu = ctx.text_extents("MATHERA")
    taban = cy - olcu.y_bearing / 2
    x = cx - toplam / 2
    ctx.new_path()
    for i, h in enumerate(harfler):
        ctx.move_to(x, taban)
        ctx.text_path(h)
        x += ilerle[i] + iz


def parlama(ctx, konum, genislik=260, guc=0.5, egim=0.35):
    """
    Metal üzerinde gezen speküler ışık. Çağırmadan önce ctx.clip() ile
    hedef şekle kırpılmalıdır.
    """
    if guc <= 0.004:
        return
    x = konum
    g = cairo.LinearGradient(x - genislik, 0, x + genislik, H * egim)
    g.add_color_stop_rgba(0.00, 1, 1, 1, 0.0)
    g.add_color_stop_rgba(0.42, 1, 0.97, 0.92, guc * 0.55)
    g.add_color_stop_rgba(0.50, 1, 1, 1, guc)
    g.add_color_stop_rgba(0.58, 1, 0.97, 0.92, guc * 0.55)
    g.add_color_stop_rgba(1.00, 1, 1, 1, 0.0)
    ctx.set_operator(cairo.OPERATOR_ADD)
    ctx.set_source(g)
    ctx.paint()
    ctx.set_operator(cairo.OPERATOR_OVER)


# ---------------------------------------------------------------- madalyon

PI_BASAMAK = [(-90, "π"), (90, "π"),
              (-140, "3"), (-40, "1"), (0, "4"), (40, "1"),
              (140, "5"), (180, "9")]


def celik_halka(ctx, cx, cy, r_dis, kalinlik, alfa=1.0, firca=True):
    """Fırçalanmış çelik dış halka."""
    if alfa <= 0.003:
        return
    r_orta = r_dis - kalinlik / 2
    ctx.save()
    ctx.set_line_width(kalinlik)
    ctx.set_source(gradyan_egik(cx - r_dis, cy - r_dis, cx + r_dis, cy + r_dis,
                                CELIK, alfa))
    ctx.arc(cx, cy, r_orta, 0, math.tau)
    ctx.stroke()

    if firca:  # fırça izleri
        ctx.set_line_width(1.0)
        rnd = random.Random(11)
        for _ in range(26):
            rr = r_orta + rnd.uniform(-kalinlik / 2 + 1, kalinlik / 2 - 1)
            a0 = rnd.uniform(0, math.tau)
            a1 = a0 + rnd.uniform(0.25, 1.4)
            ton = rnd.choice([(1, 1, 1, 0.05), (0, 0, 0, 0.06)])
            ctx.set_source_rgba(ton[0], ton[1], ton[2], ton[3] * alfa)
            ctx.arc(cx, cy, rr, a0, a1)
            ctx.stroke()

    # kenar vurguları
    ctx.set_line_width(1.6)
    ctx.set_source_rgba(0.88, 0.90, 0.92, 0.55 * alfa)
    ctx.arc(cx, cy, r_dis - 0.8, 0, math.tau)
    ctx.stroke()
    ctx.set_source_rgba(0.16, 0.18, 0.20, 0.60 * alfa)
    ctx.arc(cx, cy, r_dis - kalinlik + 0.8, 0, math.tau)
    ctx.stroke()
    ctx.restore()


def halka_kazima(ctx, cx, cy, r, boy, alfa=1.0, acilma=1.0):
    """Çelik halka üzerine kazınmış π ve pi basamakları."""
    if alfa <= 0.003:
        return
    ctx.select_font_face(UI_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(boy)
    n = len(PI_BASAMAK)
    for i, (derece, im) in enumerate(PI_BASAMAK):
        # basamaklar sırayla belirir
        yerel = max(0.0, min(1.0, acilma * n - i))
        if yerel <= 0.003:
            continue
        a = math.radians(derece)
        x = cx + r * math.cos(a)
        y = cy + r * math.sin(a)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(a + math.pi / 2)
        e = ctx.text_extents(im)
        ox = -e.width / 2 - e.x_bearing
        oy = e.height / 2
        ctx.move_to(ox, oy + 1.2)          # alt kenar ışığı (kabartma)
        ctx.set_source_rgba(0.85, 0.87, 0.89, 0.45 * alfa * yerel)
        ctx.show_text(im)
        ctx.move_to(ox, oy)                # kazınmış koyu gövde
        ctx.set_source_rgba(0.22, 0.25, 0.28, 0.85 * alfa * yerel)
        ctx.show_text(im)
        ctx.restore()


def bakir_halka(ctx, cx, cy, r, kalinlik=3.0, alfa=1.0, oran=1.0):
    """İnce bakır iç halka; oran<1 ise çizilerek ilerler."""
    if alfa <= 0.003 or oran <= 0.001:
        return
    ctx.save()
    ctx.set_line_width(kalinlik)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_source(gradyan_egik(cx - r, cy - r, cx + r, cy + r, BAKIR, alfa))
    bas = -math.pi / 2
    ctx.arc(cx, cy, r, bas, bas + math.tau * min(1.0, oran))
    ctx.stroke()
    ctx.restore()


def madalyon_zemin(ctx, cx, cy, r, alfa=1.0):
    """Madalyonun lacivert iç diski."""
    if alfa <= 0.003:
        return
    g = cairo.RadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r)
    g.add_color_stop_rgba(0.0, 0.106, 0.239, 0.396, alfa)
    g.add_color_stop_rgba(1.0, 0.043, 0.114, 0.208, alfa)
    ctx.set_source(g)
    ctx.arc(cx, cy, r, 0, math.tau)
    ctx.fill()


# ---------------------------------------------------------------- alt yazı

def alt_yazi(ctx, metin, cx, cy, boy, alfa, iz=6.0, renk=(0.80, 0.86, 0.93)):
    """Harf aralıklı, ortalanmış alt başlık."""
    if alfa <= 0.003:
        return
    ctx.select_font_face(UI_FONT, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(boy)
    ilerle = [ctx.text_extents(k).x_advance for k in metin]
    toplam = sum(ilerle) + iz * (len(metin) - 1)
    x = cx - toplam / 2
    ctx.set_source_rgba(renk[0], renk[1], renk[2], alfa)
    for i, k in enumerate(metin):
        ctx.move_to(x, cy)
        ctx.show_text(k)
        x += ilerle[i] + iz
    return toplam


def ince_cizgi(ctx, cx, cy, genislik, alfa, renk=None):
    """Bakır ince ayırıcı çizgi (ortadan açılır)."""
    if alfa <= 0.003 or genislik <= 1:
        return
    g = cairo.LinearGradient(cx - genislik / 2, 0, cx + genislik / 2, 0)
    r, gg, b = renk if renk else (0.78, 0.56, 0.39)
    g.add_color_stop_rgba(0.0, r, gg, b, 0.0)
    g.add_color_stop_rgba(0.5, r, gg, b, alfa)
    g.add_color_stop_rgba(1.0, r, gg, b, 0.0)
    ctx.set_source(g)
    ctx.set_line_width(1.4)
    ctx.move_to(cx - genislik / 2, cy)
    ctx.line_to(cx + genislik / 2, cy)
    ctx.stroke()


# ---------------------------------------------------------------- kare çıkışı

def yeni_kare():
    yuzey = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    return yuzey, cairo.Context(yuzey)


def kare_baytlari(yuzey, grenlilik=1.6, tohum=0):
    """
    Yüzeyi ham BGRX baytlarına çevirir ve bantlanmayı önlemek için
    çok hafif gren ekler (koyu lacivert gradyanlarda şart).
    """
    yuzey.flush()
    buf = np.ndarray(shape=(H, yuzey.get_stride() // 4, 4),
                     dtype=np.uint8, buffer=yuzey.get_data())
    buf = buf[:, :W, :]
    if grenlilik > 0:
        rnd = np.random.default_rng(tohum)
        gren = rnd.normal(0.0, grenlilik, size=(H, W, 1))
        kare = buf[:, :, :3].astype(np.int16) + gren.astype(np.int16)
        np.clip(kare, 0, 255, out=kare)
        cikti = np.empty((H, W, 4), dtype=np.uint8)
        cikti[:, :, :3] = kare.astype(np.uint8)
        cikti[:, :, 3] = 255
        return cikti.tobytes()
    return buf.tobytes()
