# -*- coding: utf-8 -*-
"""
MATHERA — Tasarım Kataloğu (önizleme)
Logo: fotoğraftaki gibi lacivert zemin üzerine altın/bakır MATHERA.
Her sayfa farklı bir tasarım, her tasarımda 2 soru alt alta.
Sayfa altındaki küçük etiket yalnızca seçim için.
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

NAVY = HexColor("#0E2038")       # logo zemini
GOLD = HexColor("#C49A6C")       # logo harfleri (bakır/altın)
GOLD_LIGHT = HexColor("#D9B48C")
INK = HexColor("#1C2530")
SIYAH = HexColor("#000000")
GRI = HexColor("#B0B7BF")
CIZGI = HexColor("#D8DDE3")

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


# ---------------------------------------------------------------- logo

def wordmark(c, cx, y, size, renk=GOLD, ortala=True):
    """Fotoğraftaki gibi harf aralıklı MATHERA yazısı. cx: orta nokta (ortala=True) ya da sol kenar."""
    cs = size * 0.32
    w = pdfmetrics.stringWidth("MATHERA", FONT_BOLD, size) + 6 * cs
    x = cx - w / 2 if ortala else cx
    c.saveState()
    c.setFont(FONT_BOLD, size)
    c.setFillColor(renk)
    tx = c.beginText(x, y)
    tx.setCharSpace(cs)
    tx.textOut("MATHERA")
    c.drawText(tx)
    c.restoreState()
    return w


def logo_banner(c, x, y, w, h, size=17, koseler=0):
    """Lacivert kutu içinde ortalanmış altın MATHERA — fotoğraftaki logonun kendisi."""
    c.setFillColor(NAVY)
    if koseler:
        c.roundRect(x, y, w, h, koseler, stroke=0, fill=1)
    else:
        c.rect(x, y, w, h, stroke=0, fill=1)
    wordmark(c, x + w / 2, y + h / 2 - size * 0.36, size)


# ---------------------------------------------------------------- ortak parçalar

def etiket(c, ad):
    c.setFont(FONT, 8)
    c.setFillColor(GRI)
    c.drawCentredString(PAGE_W / 2, 18, ad + "  (etiket yalnızca önizleme için)")


def soru_ciz(c, soru, no, ust_y, alt_y, numara_stili, metin_x_kaydir=0):
    x = MARGIN + metin_x_kaydir
    genislik = PAGE_W - 2 * MARGIN - metin_x_kaydir

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


def iki_soru(c, ust, alt, numara_stili, metin_x_kaydir=0):
    orta = (ust + alt) / 2
    soru_ciz(c, SORULAR[0], 1, ust - 30, orta + 15, numara_stili, metin_x_kaydir)
    soru_ciz(c, SORULAR[1], 2, orta - 30, alt + 15, numara_stili, metin_x_kaydir)


# ---- numara stilleri (kutu genişliğini döndürür)

def num_navy_kare(c, x, ust_y, no):
    k = 22
    c.setFillColor(NAVY)
    c.roundRect(x, ust_y - k, k, k, 5, stroke=0, fill=1)
    c.setFillColor(GOLD_LIGHT)
    c.setFont(FONT_BOLD, 12)
    c.drawCentredString(x + k / 2, ust_y - k + 6, str(no))
    return k


def num_gold_daire(c, x, ust_y, no):
    k = 22
    c.setFillColor(GOLD)
    c.circle(x + k / 2, ust_y - k / 2, k / 2, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 12)
    c.drawCentredString(x + k / 2, ust_y - k + 6, str(no))
    return k


def num_cerceve(c, x, ust_y, no):
    k = 22
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.4)
    c.roundRect(x, ust_y - k, k, k, 5, stroke=1, fill=0)
    c.setFillColor(NAVY)
    c.setFont(FONT_BOLD, 12)
    c.drawCentredString(x + k / 2, ust_y - k + 6, str(no))
    return k


def num_sade(c, x, ust_y, no):
    c.setFillColor(NAVY)
    c.setFont(FONT_BOLD, 14)
    c.drawString(x, ust_y - 16, str(no) + ".")
    return 22


def num_gold_sade(c, x, ust_y, no):
    c.setFillColor(GOLD)
    c.setFont(FONT_BOLD, 14)
    c.drawString(x, ust_y - 16, str(no) + ".")
    return 22


# ---------------------------------------------------------------- tasarımlar

def t1_tam_banner(c):
    """Üstte kenardan kenara lacivert bant, ortada altın logo — fotoğrafın birebir sayfa hali."""
    bh = 64
    logo_banner(c, 0, PAGE_H - bh, PAGE_W, bh, size=18)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.4)
    c.line(0, PAGE_H - bh - 2, PAGE_W, PAGE_H - bh - 2)
    iki_soru(c, PAGE_H - bh - 30, 40, num_navy_kare)
    etiket(c, "Tasarım 1 · Tam genişlik lacivert banner")


def t2_kutu_banner(c):
    """Ortada yuvarlak köşeli lacivert logo kutusu, altında ince altın çizgi."""
    bw, bh = 250, 46
    y = PAGE_H - 34 - bh
    logo_banner(c, (PAGE_W - bw) / 2, y, bw, bh, size=15, koseler=8)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(MARGIN, y - 12, PAGE_W - MARGIN, y - 12)
    iki_soru(c, y - 40, 40, num_gold_daire)
    etiket(c, "Tasarım 2 · Ortalanmış logo kutusu + altın daire numara")


def t3_sol_logo(c):
    """Beyaz zemin, solda küçük lacivert logo kutusu; çok sade."""
    bw, bh = 170, 36
    y = PAGE_H - 34 - bh
    logo_banner(c, MARGIN, y, bw, bh, size=12, koseler=6)
    c.setStrokeColor(SIYAH)
    c.setLineWidth(1)
    c.line(MARGIN, y - 12, PAGE_W - MARGIN, y - 12)
    iki_soru(c, y - 40, 40, num_cerceve)
    etiket(c, "Tasarım 3 · Solda logo kutusu + çerçeveli numara")


def t4_cerceveli_sayfa(c):
    """Sayfanın tamamı ince lacivert çerçeve içinde, logo üst çizginin ortasında."""
    m = 26
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.4)
    c.rect(m, m, PAGE_W - 2 * m, PAGE_H - 2 * m, stroke=1, fill=0)
    bw, bh = 220, 40
    y = PAGE_H - m - bh / 2
    logo_banner(c, (PAGE_W - bw) / 2, y - bh / 2, bw, bh, size=14)
    iki_soru(c, y - bh / 2 - 30, m + 20, num_navy_kare)
    etiket(c, "Tasarım 4 · Çerçeveli sayfa, logo çerçeveye gömülü")


def t5_yan_serit(c):
    """Sol kenarda ince lacivert şerit, üstte dikey şeride bitişik logo; numaralar altın."""
    sw = 14
    c.setFillColor(NAVY)
    c.rect(0, 0, sw, PAGE_H, stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.rect(sw, 0, 2, PAGE_H, stroke=0, fill=1)
    bw, bh = 200, 40
    y = PAGE_H - 30 - bh
    logo_banner(c, sw + 16, y, bw, bh, size=13, koseler=0)
    iki_soru(c, y - 34, 40, num_gold_sade, metin_x_kaydir=sw - 10)
    etiket(c, "Tasarım 5 · Sol kenar şeridi + altın sade numara")


def t6_minimal(c):
    """En sade: beyaz sayfa, ortada altın MATHERA (kutusuz), ince çift çizgi."""
    y = PAGE_H - 52
    wordmark(c, PAGE_W / 2, y, 20)
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.2)
    c.line(MARGIN, y - 14, PAGE_W - MARGIN, y - 14)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.7)
    c.line(MARGIN, y - 18, PAGE_W - MARGIN, y - 18)
    iki_soru(c, y - 44, 40, num_sade)
    etiket(c, "Tasarım 6 · Minimal — kutusuz altın logo, çift çizgi")


TASARIMLAR = [t1_tam_banner, t2_kutu_banner, t3_sol_logo,
              t4_cerceveli_sayfa, t5_yan_serit, t6_minimal]


def uret(dosya="MATHERA_tasarimlar.pdf"):
    c = canvas.Canvas(dosya, pagesize=A4)
    c.setTitle("MATHERA — Tasarım Kataloğu")
    for t in TASARIMLAR:
        t(c)
        c.showPage()
    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
