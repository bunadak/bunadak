"""Cizim: yerlesim sonucunu taslaga birebir uyan bir PDF'e dokur.

Sayfa cercevesi (zemin, marka, kural cizgisi) her sayfada ayni sabitlerle
cizilir; icerik yalnizca guvenli alanin icine yerlesir.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

from .layout import ImageAtom, LayoutResult, Placement, TextAtom, TrackedAtom
from .spec import Spec


def _font_supports(font_name: str, text: str) -> bool:
    try:
        face = pdfmetrics.getFont(font_name).face
        table = getattr(face, "charToGlyph", None)
        if not table:
            return True
        return all(ord(ch) in table for ch in text if ch != " ")
    except Exception:  # pragma: no cover - font tablosu okunamazsa engelleme
        return True


class Renderer:
    def __init__(self, spec: Spec, title: str = "MATHERA — Soru Taslağı"):
        self.s = spec
        self.title = title
        self.notes: list[str] = []

    # ust kenardan olculen y -> reportlab (alt kenardan) y
    def _y(self, top_y: float) -> float:
        return self.s.page_height - top_y

    def render(self, layout: LayoutResult, out_path: str | Path) -> Path:
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        c = canvas.Canvas(
            str(out_path), pagesize=(self.s.page_width, self.s.page_height)
        )
        c.setTitle(self.title)
        for page in layout.pages:
            self._frame(c)
            for placement in page.placements:
                self._placement(c, placement)
            c.showPage()
        c.save()
        return out_path

    # ------------------------------------------------------------------
    def _frame(self, c: canvas.Canvas) -> None:
        s = self.s
        c.setFillColor(s.color("background"))
        c.rect(0, 0, s.page_width, s.page_height, stroke=0, fill=1)

        brand = s.brand
        self._draw_tracked(
            c,
            x=s.rail_x,
            top_y=brand["baseline"],
            text=brand["text"],
            font=s.font(brand["font"]),
            size=brand["size"],
            tracking=brand["char_space_em"] * brand["size"],
            color=s.color("brand"),
            render_mode=brand.get("render_mode", 0),
            stroke_width=brand.get("stroke_width", 0.0),
        )

        c.setStrokeColor(s.color("rule"))
        c.setLineWidth(s.rule["width"])
        c.line(s.rail_x, self._y(s.rule["y"]), s.body_right, self._y(s.rule["y"]))

    def _draw_tracked(
        self,
        c: canvas.Canvas,
        x: float,
        top_y: float,
        text: str,
        font: str,
        size: float,
        tracking: float,
        color,
        render_mode: int = 0,
        stroke_width: float = 0.0,
    ) -> None:
        """Harf araligi (Tc) ve dolgu+kontur (Tr 2) ile metin.

        Referans taslaktaki marka ve numara yazilari tam olarak boyle
        cizilmistir: ``2 Tr`` + ``0.33 w`` ile hafif kalinlastirma, marka
        yazisinda ``3.3 Tc`` harf araligi. Ayni operatorleri kullaniyoruz ki
        cikti referansla piksel piksel ortussun.
        """
        if not _font_supports(font, text):
            font = self.s.font("body_bold")
            tracking = 0.0
            render_mode, stroke_width = 0, 0.0
            self.notes.append(
                f"'{text}' etiketi marka fontunda bulunmayan harf iceriyor; "
                "govde fontuna dusuldu."
            )
        # Tc (harf araligi) ve Tr (cizim modu) metin durumunun parcasidir ve
        # ET sonrasi da gecerli kalir; referans taslakta oldugu gibi q/Q icine
        # aliyoruz ki govde metnine sizmasin.
        c.saveState()
        c.setFillColor(color)
        if render_mode:
            c.setStrokeColor(color)
            c.setLineWidth(stroke_width)
        text_obj = c.beginText(x, self._y(top_y))
        text_obj.setFont(font, size)
        if render_mode:
            text_obj.setTextRenderMode(render_mode)
        if tracking:
            text_obj.setCharSpace(tracking)
        text_obj.textOut(text)
        c.drawText(text_obj)
        c.restoreState()

    def _placement(self, c: canvas.Canvas, placement: Placement) -> None:
        s = self.s
        block = placement.block
        # Numara rayi soru ve orneklerde her zaman gorunur (tam sayfaya
        # yukseltilmis olsalar bile); konu/not bloklarinin numarasi yoktur.
        if placement.show_rail and block.number is not None:
            rail = s.t["rail"]
            self._draw_tracked(
                c,
                x=s.rail_x,
                top_y=s.rail_baseline(placement.slot),
                text=f"{block.number}.",
                font=s.font(rail["font"]),
                size=rail["size"],
                tracking=0.0,
                color=s.color(rail["color"]),
                render_mode=rail.get("render_mode", 0),
                stroke_width=rail.get("stroke_width", 0.0),
            )

        baseline = s.first_baseline(placement.slot)
        for i, line in enumerate(placement.lines):
            if i:
                baseline += line.dy
            for atom in line.atoms:
                self._atom(c, atom, baseline)

    def _atom(self, c: canvas.Canvas, atom, baseline: float) -> None:
        if isinstance(atom, TextAtom):
            x = atom.x
            c.setFillColor(self.s.color(atom.color))
            for piece in atom.pieces:
                c.setFont(piece.font, piece.size)
                c.drawString(x, self._y(baseline) + piece.rise, piece.text)
                x += piece.width
        elif isinstance(atom, TrackedAtom):
            self._draw_tracked(
                c,
                x=atom.x,
                top_y=baseline,
                text=atom.text,
                font=atom.font,
                size=atom.size,
                tracking=atom.tracking,
                color=self.s.color(atom.color),
                render_mode=atom.render_mode,
                stroke_width=atom.stroke_width,
            )
        elif isinstance(atom, ImageAtom):
            c.drawImage(
                atom.path,
                atom.x,
                self._y(baseline),
                width=atom.width,
                height=atom.height,
                mask="auto",
            )


def render(layout: LayoutResult, spec: Spec, out_path: str | Path) -> tuple[Path, list[str]]:
    renderer = Renderer(spec)
    path = renderer.render(layout, out_path)
    return path, renderer.notes
