# -*- coding: utf-8 -*-
"""
MATHERA — Sade Tasarım Kataloğu v2
Logo, fotoğraftaki fontla (Julius Sans One — OFL lisanslı) yazılır;
logodaki dolgunluğu yakalamak için harflere ince kontur eklenir.
Her sayfa farklı bir sade tasarım, her tasarımda 2 soru alt alta.
Sayfa altındaki küçük etiket yalnızca seçim için.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

PAGE_W, PAGE_H = A4
MARGIN = 46

NAVY = HexColor("#0E2038")
GOLD = HexColor("#C49A6C")
INK = HexColor("#1C2530")
SIYAH = HexColor("#000000")
GRI = HexColor("#B0B7BF")

FONT = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"
LOGO_FONT = "JuliusSansOne"
pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont(LOGO_FONT, "fonts/JuliusSansOne-Regular.ttf"))

STYLE_SORU = ParagraphStyle(
    "soru", fontName=FONT, fontSize=10.5, leading=16, textColor=INK)
STYLE_SECENEK = ParagraphStyle(
    "secenek", fontName=FONT, fontSize=10.5, leading=15, textColor=INK)

SORULAR = [
    {
        "metin": "Bir sayının 3 katının 5 fazlası, aynı sayının 5 katının 7 eksiğine eşittir. "
                 "Buna göre bu sayı kaçtır?",
        "secenekler": ["3", "4", "5", "6", "7"],
    },
    {
        "metin": "x<super>2</super> − 6x + m − 2 = 0 denkleminin eşit iki gerçek kökü olduğuna göre, "
                 "m kaçtır?",
        "secenekler": ["7", "9", "11", "13", "15"],
    },
]


# ---------------------------------------------------------------- logo

def wordmark(c, cx, y, size, renk=GOLD, ortala=True):
    """Fotoğraftaki logo: Julius Sans One + ince kontur (dolgunluk için) + harf aralığı."""
    cs = size * 0.22
    w = pdfmetrics.stringWidth("MATHERA", LOGO_FONT, size) + 6 * cs
    x = cx - w / 2 if ortala else cx
    c.saveState()
    c.setFont(LOGO_FONT, size)
    c.setFillColor(renk)
    c.setStrokeColor(renk)
    c.setLineWidth(size * 0.022)
    tx = c.beginText(x, y)
    tx.setTextRenderMode(2)   # dolgu + kontur: logodaki harf kalınlığı
    tx.setCharSpace(cs)
    tx.textOut("MATHERA")
    c.drawText(tx)
    c.restoreState()
    return w


def logo_banner(c, x, y, w, h, size, koseler=0):
    c.setFillColor(NAVY)
    if koseler:
        c.roundRect(x, y, w, h, koseler, stroke=0, fill=1)
    else:
        c.rect(x, y, w, h, stroke=0, fill=1)
    wordmark(c, x + w / 2, y + (h - size * 0.72) / 2, size)


# ---------------------------------------------------------------- ortak

def etiket(c, ad):
    c.setFont(FONT, 8)
    c.setFillColor(GRI)
    c.drawCentredString(PAGE_W / 2, 16, ad + "  (etiket yalnızca önizleme için)")


def soru_ciz(c, soru, no, ust_y, alt_y, numara_stili):
    x = MARGIN
    genislik = PAGE_W - 2 * MARGIN

    kutu = numara_stili(c, x, ust_y, no)

    metin_x = x + kutu + 12
    metin_w = genislik - kutu - 12
    p = Paragraph(soru["metin"], STYLE_SORU)
    w, h = p.wrap(metin_w, ust_y - alt_y)
    p.drawOn(c, metin_x, ust_y - h)

    y = ust_y - h - 18
    for i, s in enumerate(soru.get("secenekler", [])):
        c.setFont(FONT_BOLD, 10.5)
        c.setFillColor(SIYAH)
        c.drawString(metin_x, y, "ABCDE"[i] + ")")
        ps = Paragraph(s, STYLE_SECENEK)
        w2, h2 = ps.wrap(metin_w - 22, 40)
        ps.drawOn(c, metin_x + 20, y - (h2 - 12))
        y -= max(h2 + 5, 19)


def iki_soru(c, ust, alt, numara_stili):
    orta = (ust + alt) / 2
    soru_ciz(c, SORULAR[0], 1, ust - 30, orta + 15, numara_stili)
    soru_ciz(c, SORULAR[1], 2, orta - 30, alt + 15, numara_stili)


# ---- numara stilleri

def num_navy(c, x, ust_y, no):
    c.setFillColor(NAVY)
    c.setFont(FONT_BOLD, 13)
    c.drawString(x, ust_y - 15, str(no) + ".")
    return 20


def num_gold(c, x, ust_y, no):
    c.setFillColor(GOLD)
    c.setFont(FONT_BOLD, 13)
    c.drawString(x, ust_y - 15, str(no) + ".")
    return 20


def num_navy_kare(c, x, ust_y, no):
    from reportlab.lib.colors import white
    k = 21
    c.setFillColor(NAVY)
    c.roundRect(x, ust_y - k, k, k, 4, stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.setFont(FONT_BOLD, 11.5)
    c.drawCentredString(x + k / 2, ust_y - k + 6, str(no))
    return k


# ---------------------------------------------------------------- tasarımlar

def t1_banner(c):
    """Fotoğrafın sayfa hali: kenardan kenara lacivert bant, ortada logo. Başka hiçbir öğe yok."""
    bh = 62
    logo_banner(c, 0, PAGE_H - bh, PAGE_W, bh, size=19)
    iki_soru(c, PAGE_H - bh - 34, 36, num_navy)
    etiket(c, "Tasarım 1 · Lacivert banner — çizgisiz, en yalın")


def t2_beyaz_merkez(c):
    """Beyaz zemin, ortada altın logo, altında tek ince altın çizgi."""
    y = PAGE_H - 58
    wordmark(c, PAGE_W / 2, y, 20)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(MARGIN + 60, y - 13, PAGE_W - MARGIN - 60, y - 13)
    iki_soru(c, y - 46, 36, num_navy)
    etiket(c, "Tasarım 2 · Beyaz zemin, ortalanmış logo + kısa altın çizgi")


def t3_lacivert_logo(c):
    """Beyaz zemin, ortada lacivert logo (altın yok), hiç çizgi yok. En sakin görünüm."""
    y = PAGE_H - 58
    wordmark(c, PAGE_W / 2, y, 20, renk=NAVY)
    iki_soru(c, y - 46, 36, num_navy)
    etiket(c, "Tasarım 3 · Lacivert logo, tamamen çizgisiz")


def t4_kutu(c):
    """Ortada yuvarlak köşeli küçük lacivert logo plakası. Çizgi yok."""
    bw, bh = 236, 44
    y = PAGE_H - 36 - bh
    logo_banner(c, (PAGE_W - bw) / 2, y, bw, bh, size=15, koseler=9)
    iki_soru(c, y - 36, 36, num_navy_kare)
    etiket(c, "Tasarım 4 · Logo plakası + lacivert numara kutusu")


def t5_sol_sade(c):
    """Logo solda küçük ve altın, sayfa nefes alıyor; numaralar altın."""
    y = PAGE_H - 56
    wordmark(c, MARGIN, y, 15, ortala=False)
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.8)
    c.line(MARGIN, y - 12, PAGE_W - MARGIN, y - 12)
    iki_soru(c, y - 44, 36, num_gold)
    etiket(c, "Tasarım 5 · Solda küçük logo + tek ince çizgi, altın numara")


TASARIMLAR = [t1_banner, t2_beyaz_merkez, t3_lacivert_logo, t4_kutu, t5_sol_sade]


def uret(dosya="MATHERA_tasarimlar2.pdf"):
    c = canvas.Canvas(dosya, pagesize=A4)
    c.setTitle("MATHERA — Sade Tasarım Kataloğu")
    for t in TASARIMLAR:
        t(c)
        c.showPage()
    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
