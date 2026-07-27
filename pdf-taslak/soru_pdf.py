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

NAVY = HexColor("#0E2038")      # logo zemin lacivertisi
COPPER = HexColor("#C0906A")    # logo harf bakırı
COPPER_LIGHT = HexColor("#D9B08C")
INK = HexColor("#1C2530")       # soru metni rengi
GREY = HexColor("#8A94A0")

FONT = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"
pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

DERS = "MATEMATİK"
TEST_ADI = "TEST 01"
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


def wordmark(c, x, y, size, renk=COPPER):
    """MATHERA yazı logosunu harf aralıklı, bakır renkte çizer."""
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


def sayfa_iskeleti(c, sayfa_no):
    """Üst bant, alt bant ve orta ayırıcı olmadan sayfanın sabit öğeleri."""
    # --- üst: lacivert ince bant + logo
    bant_h = 6
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - bant_h, PAGE_W, bant_h, stroke=0, fill=1)

    logo_y = PAGE_H - 52
    wordmark(c, MARGIN, logo_y, 19)

    # sağda ders / test bilgisi
    c.setFont(FONT_BOLD, 11)
    c.setFillColor(NAVY)
    c.drawRightString(PAGE_W - MARGIN, logo_y + 7, DERS)
    c.setFont(FONT, 9)
    c.setFillColor(GREY)
    c.drawRightString(PAGE_W - MARGIN, logo_y - 6, TEST_ADI)

    # logo altı ince bakır çizgi
    c.setStrokeColor(COPPER)
    c.setLineWidth(1.2)
    c.line(MARGIN, logo_y - 16, PAGE_W - MARGIN, logo_y - 16)

    # --- alt: ince çizgi + sayfa numarası rozeti + küçük logo
    alt_y = 40
    c.setStrokeColor(HexColor("#D8DDE3"))
    c.setLineWidth(0.8)
    c.line(MARGIN, alt_y + 14, PAGE_W - MARGIN, alt_y + 14)

    r = 11
    c.setFillColor(NAVY)
    c.circle(PAGE_W / 2, alt_y, r, stroke=0, fill=1)
    c.setFillColor(COPPER_LIGHT)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(PAGE_W / 2, alt_y - 3.5, str(sayfa_no))

    c.setFillColor(GREY)
    c.setFont(FONT, 7.5)
    c.drawString(MARGIN, alt_y - 3, "mathera")
    c.drawRightString(PAGE_W - MARGIN, alt_y - 3, TEST_ADI)

    return logo_y - 16, alt_y + 14  # içerik üst / alt sınırı


def orta_ayirici(c, y):
    """İki soru arasına ince çizgi + bakır elmas işareti."""
    c.setStrokeColor(HexColor("#D8DDE3"))
    c.setLineWidth(0.8)
    c.line(MARGIN, y, PAGE_W / 2 - 12, y)
    c.line(PAGE_W / 2 + 12, y, PAGE_W - MARGIN, y)
    c.saveState()
    c.translate(PAGE_W / 2, y)
    c.rotate(45)
    c.setFillColor(COPPER)
    c.rect(-3.2, -3.2, 6.4, 6.4, stroke=0, fill=1)
    c.restoreState()


def soru_ciz(c, soru, no, ust_y, alt_y):
    """Bir soruyu ust_y ile alt_y arasındaki bölgeye yerleştirir."""
    x = MARGIN
    genislik = PAGE_W - 2 * MARGIN

    # numara rozeti: lacivert yuvarlak köşeli kare, bakır numara
    kutu = 22
    ky = ust_y - kutu
    c.setFillColor(NAVY)
    c.roundRect(x, ky, kutu, kutu, 5, stroke=0, fill=1)
    c.setFillColor(COPPER_LIGHT)
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
        c.setFillColor(COPPER)
        c.drawString(metin_x, y, harf + ")")
        ps = Paragraph(s, STYLE_SECENEK)
        w2, h2 = ps.wrap(metin_w - 22, 40)
        ps.drawOn(c, metin_x + 20, y - (h2 - 12))
        y -= max(h2 + 5, 19)


# ---------------------------------------------------------------- üretim

def uret(dosya=CIKTI):
    c = canvas.Canvas(dosya, pagesize=A4)
    c.setTitle("MATHERA — " + DERS + " " + TEST_ADI)

    sayfa_no = 1
    for i in range(0, len(SORULAR), 2):
        icerik_ust, icerik_alt = sayfa_iskeleti(c, sayfa_no)
        orta = (icerik_ust + icerik_alt) / 2
        orta_ayirici(c, orta)

        soru_ciz(c, SORULAR[i], i + 1, icerik_ust - 30, orta + 15)
        if i + 1 < len(SORULAR):
            soru_ciz(c, SORULAR[i + 1], i + 2, orta - 30, icerik_alt + 15)

        c.showPage()
        sayfa_no += 1

    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
