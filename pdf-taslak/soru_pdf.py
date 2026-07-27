# -*- coding: utf-8 -*-
"""
MATHERA — Soru PDF Taslağı
Yayınevi tarzında, sade ve logolu soru PDF'i üretir.
Her sayfada 2 soru, alt alta yerleşir.

Kullanım:
    python3 soru_pdf.py            -> MATHERA_soru_taslagi.pdf üretir

Soruları aşağıdaki SORULAR listesine ekleyin; sayfalama otomatiktir.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

# ---------------------------------------------------------------- ayarlar

PAGE_W, PAGE_H = A4
MARGIN = 42

NAVY = HexColor("#0E2038")      # üst bant lacivertisi
MAVI = HexColor("#0078D7")      # windows mavisi: logo + soru numarası
INK = HexColor("#1C2530")       # soru metni rengi
SIYAH = HexColor("#000000")

FONT = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"
pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

CIKTI = "MATHERA_soru_taslagi.pdf"

# Her soru: metin + şıklar. Şıksız (klasik) soru için "secenekler": [] bırakın.
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
    {
        "metin": "Bir manav elindeki elmaların önce %20'sini, sonra kalanın %25'ini satıyor. "
                 "Geriye 240 elma kaldığına göre, manavın başlangıçtaki elma sayısı kaçtır?",
        "secenekler": ["360", "380", "400", "420", "440"],
    },
    {
        "metin": "A = {1, 2, 3, 4, 5} kümesinin alt kümelerinin kaç tanesinde 2 bulunur, "
                 "3 bulunmaz?",
        "secenekler": ["4", "6", "8", "12", "16"],
    },
]

# ---------------------------------------------------------------- çizimler

STYLE_SORU = ParagraphStyle(
    "soru", fontName=FONT, fontSize=10.5, leading=16, textColor=INK)
STYLE_SECENEK = ParagraphStyle(
    "secenek", fontName=FONT, fontSize=10.5, leading=15, textColor=INK)


def wordmark(c, x, y, size, renk=MAVI):
    """MATHERA yazı logosunu harf aralıklı, mavi renkte çizer."""
    c.saveState()
    c.setFont(FONT_BOLD, size)
    c.setFillColor(renk)
    tx = c.beginText(x, y)
    tx.setCharSpace(size * 0.32)
    tx.textOut("MATHERA")
    c.drawText(tx)
    c.restoreState()


def wordmark_genislik(size):
    w = pdfmetrics.stringWidth("MATHERA", FONT_BOLD, size)
    return w + 6 * size * 0.32  # 7 harf arası 6 boşluk


def sayfa_iskeleti(c):
    """Sayfanın sabit öğeleri: üst bant, logo ve logo altı çizgi."""
    # --- üst: lacivert ince bant + logo
    bant_h = 6
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - bant_h, PAGE_W, bant_h, stroke=0, fill=1)

    logo_y = PAGE_H - 52
    wordmark(c, MARGIN, logo_y, 19)

    # logo altı ince siyah çizgi
    c.setStrokeColor(SIYAH)
    c.setLineWidth(1.2)
    c.line(MARGIN, logo_y - 16, PAGE_W - MARGIN, logo_y - 16)

    alt_y = 40
    return logo_y - 16, alt_y  # içerik üst / alt sınırı


def soru_ciz(c, soru, no, ust_y, alt_y):
    """Bir soruyu ust_y ile alt_y arasındaki bölgeye yerleştirir."""
    x = MARGIN
    genislik = PAGE_W - 2 * MARGIN

    # numara rozeti: mavi yuvarlak köşeli kare, beyaz numara
    kutu = 22
    ky = ust_y - kutu
    c.setFillColor(MAVI)
    c.roundRect(x, ky, kutu, kutu, 5, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 12)
    c.drawCentredString(x + kutu / 2, ky + 6, str(no))

    # soru metni (rozetin sağından başlar, altına sarkabilir)
    metin_x = x + kutu + 12
    metin_w = genislik - kutu - 12
    p = Paragraph(soru["metin"], STYLE_SORU)
    w, h = p.wrap(metin_w, ust_y - alt_y)
    p.drawOn(c, metin_x, ust_y - h)

    # şıklar
    y = ust_y - h - 18
    for i, s in enumerate(soru.get("secenekler", [])):
        harf = "ABCDE"[i]
        c.setFont(FONT_BOLD, 10.5)
        c.setFillColor(SIYAH)
        c.drawString(metin_x, y, harf + ")")
        ps = Paragraph(s, STYLE_SECENEK)
        w2, h2 = ps.wrap(metin_w - 22, 40)
        ps.drawOn(c, metin_x + 20, y - (h2 - 12))
        y -= max(h2 + 5, 19)


# ---------------------------------------------------------------- üretim

def uret(dosya=CIKTI):
    c = canvas.Canvas(dosya, pagesize=A4)
    c.setTitle("MATHERA — Soru Taslağı")

    for i in range(0, len(SORULAR), 2):
        icerik_ust, icerik_alt = sayfa_iskeleti(c)
        orta = (icerik_ust + icerik_alt) / 2

        soru_ciz(c, SORULAR[i], i + 1, icerik_ust - 30, orta + 15)
        if i + 1 < len(SORULAR):
            soru_ciz(c, SORULAR[i + 1], i + 2, orta - 30, icerik_alt + 15)

        c.showPage()

    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
