# -*- coding: utf-8 -*-
"""
MATHERA — Taslak Alternatifleri (önizleme)
Her sayfada aynı düzenin farklı bir renk/stil varyasyonu gösterilir.
Sağ üstteki küçük etiket yalnızca seçim için; seçilen varyant
soru_pdf.py içine aktarılır.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

PAGE_W, PAGE_H = A4
MARGIN = 42

NAVY = HexColor("#0E2038")
INK = HexColor("#1C2530")
SIYAH = HexColor("#000000")

FONT = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"
pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

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

# ------------------------------------------------------------- varyantlar
# rozet: "dolu"  -> renkli kare, beyaz numara
#        "cerceve" -> beyaz kare, renkli çerçeve + renkli numara
#        "duz"   -> kutu yok, sadece renkli kalın numara "1."
VARYANTLAR = [
    {"ad": "1 · Mevcut lila",        "renk": "#B57EDC", "bant": "#0E2038", "rozet": "dolu"},
    {"ad": "2 · Pastel lila",        "renk": "#C9A6EC", "bant": "#C9A6EC", "rozet": "dolu"},
    {"ad": "3 · Koyu lila / mor",    "renk": "#8E44AD", "bant": "#8E44AD", "rozet": "dolu"},
    {"ad": "4 · Lavanta",            "renk": "#9B8CDE", "bant": "#0E2038", "rozet": "dolu"},
    {"ad": "5 · Lila + çerçeve rozet", "renk": "#B57EDC", "bant": "#0E2038", "rozet": "cerceve"},
    {"ad": "6 · Lila + sade numara", "renk": "#B57EDC", "bant": "#0E2038", "rozet": "duz"},
]


def wordmark(c, x, y, size, renk):
    c.saveState()
    c.setFont(FONT_BOLD, size)
    c.setFillColor(renk)
    tx = c.beginText(x, y)
    tx.setCharSpace(size * 0.32)
    tx.textOut("MATHERA")
    c.drawText(tx)
    c.restoreState()


def sayfa_iskeleti(c, v):
    c.setFillColor(HexColor(v["bant"]))
    c.rect(0, PAGE_H - 6, PAGE_W, 6, stroke=0, fill=1)

    logo_y = PAGE_H - 52
    wordmark(c, MARGIN, logo_y, 19, HexColor(v["renk"]))

    # önizleme etiketi (seçim için, gerçek taslakta olmayacak)
    c.setFont(FONT, 8)
    c.setFillColor(HexColor("#B0B7BF"))
    c.drawRightString(PAGE_W - MARGIN, logo_y + 2, v["ad"])

    c.setStrokeColor(SIYAH)
    c.setLineWidth(1.2)
    c.line(MARGIN, logo_y - 16, PAGE_W - MARGIN, logo_y - 16)

    return logo_y - 16, 40


def rozet(c, v, x, ust_y, no):
    renk = HexColor(v["renk"])
    kutu = 22
    ky = ust_y - kutu
    if v["rozet"] == "dolu":
        c.setFillColor(renk)
        c.roundRect(x, ky, kutu, kutu, 5, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 12)
        c.drawCentredString(x + kutu / 2, ky + 6, str(no))
    elif v["rozet"] == "cerceve":
        c.setStrokeColor(renk)
        c.setLineWidth(1.5)
        c.roundRect(x, ky, kutu, kutu, 5, stroke=1, fill=0)
        c.setFillColor(renk)
        c.setFont(FONT_BOLD, 12)
        c.drawCentredString(x + kutu / 2, ky + 6, str(no))
    else:  # duz
        c.setFillColor(renk)
        c.setFont(FONT_BOLD, 14)
        c.drawString(x, ky + 6, str(no) + ".")
    return kutu


def soru_ciz(c, v, soru, no, ust_y, alt_y):
    x = MARGIN
    genislik = PAGE_W - 2 * MARGIN
    kutu = rozet(c, v, x, ust_y, no)

    metin_x = x + kutu + 12
    metin_w = genislik - kutu - 12
    p = Paragraph(soru["metin"], STYLE_SORU)
    w, h = p.wrap(metin_w, ust_y - alt_y)
    p.drawOn(c, metin_x, ust_y - h)

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


def uret(dosya="MATHERA_alternatifler.pdf"):
    c = canvas.Canvas(dosya, pagesize=A4)
    c.setTitle("MATHERA — Taslak Alternatifleri")

    for v in VARYANTLAR:
        icerik_ust, icerik_alt = sayfa_iskeleti(c, v)
        orta = (icerik_ust + icerik_alt) / 2
        soru_ciz(c, v, SORULAR[0], 1, icerik_ust - 30, orta + 15)
        soru_ciz(c, v, SORULAR[1], 2, orta - 30, icerik_alt + 15)
        c.showPage()

    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
