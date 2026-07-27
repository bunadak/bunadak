# -*- coding: utf-8 -*-
"""
MATHERA — Vurgu Rengi Alternatifleri (önizleme)
Seçilen tasarımda altın yerine kullanılabilecek, krem zemin ve
lacivertle uyumlu, göz yormayan mat renkler.
Her sayfa bir renk; alttaki etiket yalnızca seçim için.
"""

import soru_pdf as s
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

RENKLER = [
    ("1 · Mat altın (mevcut)",   "#B98F63"),
    ("2 · Çelik mavisi",         "#3E5C76"),
    ("3 · Mat bordo",            "#8E4A49"),
    ("4 · Adaçayı yeşili",       "#5F7A61"),
    ("5 · Petrol",               "#3D6B6E"),
    ("6 · Mürdüm",               "#6B4E71"),
]


def uret(dosya="MATHERA_renk_alternatifleri.pdf"):
    c = canvas.Canvas(dosya, pagesize=(s.PAGE_W, s.PAGE_H))
    c.setTitle("MATHERA — Vurgu Rengi Alternatifleri")

    for ad, hexrenk in RENKLER:
        s.GOLD = HexColor(hexrenk)   # logo + numaralar bu renkten okunur

        icerik_ust, icerik_alt = s.sayfa_iskeleti(c)
        orta = (icerik_ust + icerik_alt) / 2
        s.soru_ciz(c, s.SORULAR[0], 1, icerik_ust - 32, orta + 15)
        s.soru_ciz(c, s.SORULAR[1], 2, orta - 30, icerik_alt + 15)

        c.setFont(s.FONT, 8)
        c.setFillColor(HexColor("#B0B7BF"))
        c.drawCentredString(s.PAGE_W / 2, 16, ad + "  (etiket yalnızca önizleme için)")
        c.showPage()

    c.save()
    print("Üretildi:", dosya)


if __name__ == "__main__":
    uret()
