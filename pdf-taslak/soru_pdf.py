# -*- coding: utf-8 -*-
"""
MATHERA — Soru PDF Taslağı
Seçilen tasarım: solda logo + tek ince çizgi, altın soru numaraları.
Renkler uzun çalışma seansları için göz yormayacak şekilde ayarlandı:
  - Zemin: hafif krem (ekranda parlamayı azaltır, baskıda beyaza yakındır)
  - Metin: saf siyah yerine yumuşak koyu antrasit (keskin kontrastı azaltır)
  - Vurgular: mat altın + yumuşatılmış lacivert (düşük doygunluk, dinlendirici)

Kullanım:
    python3 soru_pdf.py            -> MATHERA_soru_taslagi.pdf üretir

Soruları aşağıdaki SORULAR listesine ekleyin; sayfalama otomatiktir
(her sayfaya 2 soru, alt alta).
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

# ---------------------------------------------------------------- ayarlar

PAGE_W, PAGE_H = A4
MARGIN = 46

ZEMIN = HexColor("#FBF8F2")     # hafif krem: beyaz parlamasını alır
METIN = HexColor("#2E3742")     # yumuşak antrasit: saf siyahtan dinlendirici
NAVY = HexColor("#26364F")      # yumuşatılmış lacivert (çizgi)
GOLD = HexColor("#5F7A61")      # adaçayı yeşili (logo + numaralar)
SIK = HexColor("#3A4450")       # şık harfleri: koyu ama keskin olmayan

FONT = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"
LOGO_FONT = "JuliusSansOne"     # logodaki font (OFL lisanslı)
pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont(LOGO_FONT, "fonts/JuliusSansOne-Regular.ttf"))

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
    "soru", fontName=FONT, fontSize=10.5, leading=16.5, textColor=METIN)
STYLE_SECENEK = ParagraphStyle(
    "secenek", fontName=FONT, fontSize=10.5, leading=15, textColor=METIN)


def wordmark(c, x, y, size, renk=None):
    """Logo: Julius Sans One + ince kontur (dolgunluk) + harf aralığı."""
    renk = renk if renk is not None else GOLD
    cs = size * 0.22
    c.saveState()
    c.setFont(LOGO_FONT, size)
    c.setFillColor(renk)
    c.setStrokeColor(renk)
    c.setLineWidth(size * 0.022)
    tx = c.beginText(x, y)
    tx.setTextRenderMode(2)
    tx.setCharSpace(cs)
    tx.textOut("MATHERA")
    c.drawText(tx)
    c.restoreState()


def sayfa_iskeleti(c):
    """Krem zemin, solda logo, altında tek ince çizgi."""
    c.setFillColor(ZEMIN)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    logo_y = PAGE_H - 56
    wordmark(c, MARGIN, logo_y, 15)

    c.setStrokeColor(NAVY)
    c.setLineWidth(0.8)
    c.line(MARGIN, logo_y - 12, PAGE_W - MARGIN, logo_y - 12)

    return logo_y - 12, 36  # içerik üst / alt sınırı


def soru_ciz(c, soru, no, ust_y, alt_y):
    """Bir soruyu ust_y ile alt_y arasındaki bölgeye yerleştirir."""
    x = MARGIN
    genislik = PAGE_W - 2 * MARGIN

    # numara: logo fontu + logodaki ince kontur — aynı punto, aynı ağırlık
    c.saveState()
    c.setFillColor(GOLD)
    c.setStrokeColor(GOLD)
    c.setLineWidth(15 * 0.022)
    tx = c.beginText(x, ust_y - 15)
    tx.setFont(LOGO_FONT, 15)
    tx.setTextRenderMode(2)
    tx.textOut(str(no) + ".")
    c.drawText(tx)
    c.restoreState()
    kutu = 24

    metin_x = x + kutu + 12
    metin_w = genislik - kutu - 12
    p = Paragraph(soru["metin"], STYLE_SORU)
    w, h = p.wrap(metin_w, ust_y - alt_y)
    p.drawOn(c, metin_x, ust_y - h)

    # şıklar
    y = ust_y - h - 18
    for i, s in enumerate(soru.get("secenekler", [])):
        c.setFont(FONT_BOLD, 10.5)
        c.setFillColor(SIK)
        c.drawString(metin_x, y, "ABCDE"[i] + ")")
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

        soru_ciz(c, SORULAR[i], i + 1, icerik_ust - 32, orta + 15)
        if i + 1 < len(SORULAR):
            soru_ciz(c, SORULAR[i + 1], i + 2, orta - 30, icerik_alt + 15)

        c.showPage()

    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
