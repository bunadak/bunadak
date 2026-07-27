"""Yerlesim: icerik bloklarini taslagin izgarasina oturtur.

Kurallar (kullanicinin tanimladigi taslak sozlesmesi):
  * soru / ornek  -> sayfada 2 adet (izgaranin ust ve alt slotu)
  * konu / not    -> tam sayfa (iki slotun tamami tek blok icin)
Hicbir icerik taslagin guvenli alanindan (ust kural cizgisi ile alt sinir
arasi) tasmaz; tasma riski olan blok once tam sayfaya yukseltilir, oraya da
sigmiyorsa satir siniri korunarak devam sayfasina aktarilir.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .model import SOLUTION_TAG, Block, Document, Image, Option, Run
from .spec import Spec
from .textlayout import Piece, Style, wrap


# --------------------------------------------------------------------------
# Cizim birimleri
# --------------------------------------------------------------------------
@dataclass
class TextAtom:
    x: float
    pieces: list[Piece]
    color: str


@dataclass
class TrackedAtom:
    x: float
    text: str
    font: str
    size: float
    tracking: float
    color: str
    render_mode: int = 0
    stroke_width: float = 0.0


@dataclass
class ImageAtom:
    x: float
    width: float
    height: float
    path: str


@dataclass
class Line:
    """Akistaki tek bir yerlesim birimi (bir metin satiri veya bir gorsel)."""

    dy: float  # bir onceki satirin taban cizgisinden mutlak mesafe
    depth: float  # taban cizgisinin altinda kalan mürekkep yuksekligi
    atoms: list = field(default_factory=list)
    breakable: bool = False  # bu satirdan once sayfa bolunebilir mi


@dataclass
class Placement:
    """Bir bloktan bir sayfaya yerlesen parca."""

    block: Block
    slot: int
    lines: list[Line]
    show_rail: bool


@dataclass
class Page:
    placements: list[Placement] = field(default_factory=list)


@dataclass
class LayoutResult:
    pages: list[Page]
    warnings: list[str]


# --------------------------------------------------------------------------
# Blok -> satir akisi
# --------------------------------------------------------------------------
class Composer:
    def __init__(self, spec: Spec):
        self.s = spec
        t = spec.t
        self.leading = spec.leading
        self.body_style = Style(
            font=spec.font("body"),
            bold_font=spec.font("body_bold"),
            size=spec.body_size,
            sup_size_ratio=t["superscript"]["size_ratio"],
            sup_rise_ratio=t["superscript"]["rise_ratio"],
            sub_size_ratio=t["subscript"]["size_ratio"],
            sub_rise_ratio=t["subscript"]["rise_ratio"],
        )
        self.formula_style = Style(
            font=spec.font("body"),
            bold_font=spec.font("body_bold"),
            size=t["formula"]["size"],
            sup_size_ratio=t["superscript"]["size_ratio"],
            sup_rise_ratio=t["superscript"]["rise_ratio"],
            sub_size_ratio=t["subscript"]["size_ratio"],
            sub_rise_ratio=t["subscript"]["rise_ratio"],
        )
        self.subheading_style = Style(
            font=spec.font("body_bold"),
            bold_font=spec.font("body_bold"),
            size=t["subheading"]["size"],
            sup_size_ratio=t["superscript"]["size_ratio"],
            sup_rise_ratio=t["superscript"]["rise_ratio"],
            sub_size_ratio=t["subscript"]["size_ratio"],
            sub_rise_ratio=t["subscript"]["rise_ratio"],
        )

    # -- yardimcilar -------------------------------------------------------
    def _depth(self, size: float) -> float:
        return size * self.s.t["descender_ratio"]

    def _ascent(self, size: float) -> float:
        return size * self.s.t.get("ascender_ratio", 0.76)

    def _text_lines(
        self,
        runs: list[Run],
        style: Style,
        x: float,
        width: float,
        color: str,
        first_dy: float,
        align: str = "left",
    ) -> list[Line]:
        lines: list[Line] = []
        for i, pieces in enumerate(wrap(runs, style, width)):
            px = x
            if align == "center":
                px = x + (width - sum(p.width for p in pieces)) / 2.0
            lines.append(
                Line(
                    dy=first_dy if i == 0 else self.leading,
                    depth=self._depth(style.size),
                    atoms=[TextAtom(px, pieces, color)],
                    breakable=i > 0,
                )
            )
        return lines

    def _tag_line(self, text: str, first_dy: float) -> Line:
        """Tur etiketi (ÖRNEK / KONU ANLATIMI / NOT / ÇÖZÜM).

        Marka yazisiyla ayni tipografik dil: marka fontu, ayni yesil, ayni
        0.22em harf araligi ve ayni dolgu+kontur kalinlastirmasi.
        """
        t = self.s.t["tag"]
        return Line(
            dy=first_dy,
            depth=self._depth(t["size"]),
            atoms=[
                TrackedAtom(
                    x=self.s.body_x,
                    text=text,
                    font=self.s.font(t["font"]),
                    size=t["size"],
                    tracking=t["tracking_em"] * t["size"],
                    color=t["color"],
                    render_mode=t.get("render_mode", 0),
                    stroke_width=t.get("stroke_width", 0.0),
                )
            ],
            breakable=False,
        )

    # -- akis --------------------------------------------------------------
    def flowables(self, items: list, first_dy: float) -> list[Line]:
        """Paragraf / madde / formul / ara baslik / gorsel akisini satirlara cevirir."""
        t = self.s.t
        lines: list[Line] = []
        prev_after = 0.0
        first = True

        for item in items:
            if isinstance(item, Image):
                w, h = self._image_size(item)
                ascent = self._ascent(self.s.body_size)
                # Gorselin "taban cizgisi" alt kenaridir.
                if first:
                    dy = first_dy + h - ascent
                else:
                    dy = max(prev_after, t["image"]["space_before"]) + h
                lines.append(
                    Line(
                        dy=dy,
                        depth=0.0,
                        atoms=[ImageAtom(self.s.body_x, w, h, item.path)],
                        breakable=not first,
                    )
                )
                prev_after = t["image"]["space_after"] + ascent - self.leading
                first = False
                continue

            kind = item.kind
            if kind == "formula":
                style, cfg = self.formula_style, t["formula"]
                x, width, align, color = self.s.body_x, self.s.body_width, "center", "body"
            elif kind == "subheading":
                style, cfg = self.subheading_style, t["subheading"]
                x, width, align, color = self.s.body_x, self.s.body_width, "left", "label"
            elif kind == "bullet":
                style, cfg = self.body_style, {"space_before": 0.0, "space_after": t["bullet"]["space_after"]}
                x = self.s.body_x + t["bullet"]["indent"]
                width, align, color = self.s.body_width - t["bullet"]["indent"], "left", "body"
            else:
                style = self.body_style
                cfg = {"space_before": 0.0, "space_after": t["paragraph_space"]}
                x, width, align, color = self.s.body_x, self.s.body_width, "left", "body"

            gap = 0.0 if first else max(prev_after, cfg.get("space_before", 0.0))
            dy = first_dy if first else self.leading + gap
            new = self._text_lines(item.runs, style, x, width, color, dy, align)
            if kind == "bullet" and new:
                marker = t["bullet"]["marker"]
                new[0].atoms.append(
                    TextAtom(
                        self.s.body_x,
                        [
                            Piece(
                                marker,
                                self.body_style.font,
                                self.body_style.size,
                                0.0,
                                0.0,
                            )
                        ],
                        "body",
                    )
                )
            lines.extend(new)
            prev_after = cfg.get("space_after", 0.0)
            first = False
        return lines

    def _image_size(self, image: Image) -> tuple[float, float]:
        from reportlab.lib.utils import ImageReader

        reader = ImageReader(image.path)
        iw, ih = reader.getSize()
        if image.width and image.height:
            return image.width, image.height
        if image.width:
            return image.width, image.width * ih / iw
        if image.height:
            return image.height * iw / ih, image.height
        w = min(float(iw), self.s.body_width)
        return w, w * ih / iw

    def options(self, options: list[Option]) -> list[Line]:
        t = self.s.t["options"]
        lines: list[Line] = []
        label_font = self.s.font(t["label_font"])
        value_x = self.s.option_value_x
        width = self.s.body_right - value_x
        rise = t.get("value_rise", 0.0)
        for i, opt in enumerate(options):
            wrapped = wrap(opt.runs, self.body_style, width)
            for j, pieces in enumerate(wrapped):
                # Taslakta secenek metni, harf etiketinin taban cizgisinden
                # 1.5 punto yukarida oturur.
                pieces = [
                    Piece(p.text, p.font, p.size, p.rise + rise, p.width) for p in pieces
                ]
                atoms: list = [TextAtom(value_x, pieces, "body")]
                if j == 0:
                    label = f"{opt.letter})"
                    atoms.append(
                        TextAtom(
                            self.s.body_x,
                            [
                                Piece(
                                    label,
                                    label_font,
                                    self.s.body_size,
                                    0.0,
                                    0.0,
                                )
                            ],
                            t["label_color"],
                        )
                    )
                if j > 0:
                    dy = t["wrap_leading"]
                elif i == 0:
                    dy = t["gap_before"]
                else:
                    dy = t["step"]
                lines.append(
                    Line(
                        dy=dy,
                        depth=self._depth(self.s.body_size),
                        atoms=atoms,
                        breakable=(i == 0 and j == 0),
                    )
                )
        return lines

    def compose(self, block: Block) -> list[Line]:
        t = self.s.t
        lines: list[Line] = []
        tag = block.tag
        if tag:
            lines.append(self._tag_line(tag, 0.0))
        if block.title:
            lines.extend(
                self._text_lines(
                    block.title,
                    self.subheading_style,
                    self.s.body_x,
                    self.s.body_width,
                    "label",
                    t["tag"]["space_after"] if tag else 0.0,
                )
            )
            body_first_dy = self.leading + t["subheading"]["space_after"]
        else:
            body_first_dy = t["tag"]["space_after"] if tag else 0.0

        lines.extend(self.flowables(block.body, body_first_dy))
        if block.options:
            lines.extend(self.options(block.options))
        if block.solution:
            lines.append(
                self._tag_line(
                    SOLUTION_TAG, self.leading + t["subheading"]["space_before"]
                )
            )
            lines.extend(self.flowables(block.solution, t["tag"]["space_after"]))
        if lines:
            lines[0].dy = 0.0
        return lines


# --------------------------------------------------------------------------
# Sayfalama
# --------------------------------------------------------------------------
def _fit(lines: list[Line], anchor: float, bottom: float) -> int:
    """anchor taban cizgisinden baslayarak bottom sinirina kadar kac satir
    sigar? Doner: sigan satir sayisi."""
    y = anchor
    count = 0
    for i, line in enumerate(lines):
        y = y + line.dy if i else anchor
        if y + line.depth > bottom:
            return count
        count = i + 1
    return count


def _split_index(lines: list[Line], fitted: int) -> int:
    """Sigan satir sayisindan geriye dogru en yakin bolunebilir siniri bulur."""
    for i in range(fitted, 0, -1):
        if i < len(lines) and lines[i].breakable:
            return i
    return 0


def paginate(doc: Document, spec: Spec) -> LayoutResult:
    composer = Composer(spec)
    warnings = list(doc.warnings)
    pages: list[Page] = [Page()]
    slot = 0

    def new_page():
        nonlocal slot
        pages.append(Page())
        slot = 0

    def page_is_empty() -> bool:
        return not pages[-1].placements

    for block in doc.blocks:
        if block.page_break_before and not page_is_empty():
            new_page()

        lines = composer.compose(block)
        full_page = block.full_page
        first_part = True

        while lines:
            if full_page:
                if not page_is_empty():
                    new_page()
                anchor = spec.first_baseline(0)
                bottom = spec.content_bottom
                target_slot = 0
            else:
                if slot >= spec.slots_per_page:
                    new_page()
                anchor = spec.first_baseline(slot)
                bottom = spec.slot_bottom(slot)
                target_slot = slot

            fitted = _fit(lines, anchor, bottom)

            if fitted == len(lines):
                pages[-1].placements.append(
                    Placement(block, target_slot, lines, show_rail=first_part)
                )
                slot = spec.slots_per_page if full_page else slot + 1
                lines = []
                break

            if not full_page:
                # yarim slota sigmadi -> tam sayfaya yukselt
                label = _block_label(block)
                warnings.append(
                    f"{label}: yarim sayfaya sigmadi, tam sayfaya yukseltildi."
                )
                full_page = True
                block.force_full_page = True
                continue

            # tam sayfaya da sigmiyor -> bolunebilir sinirdan devam sayfasina aktar
            cut = _split_index(lines, fitted)
            if cut == 0:
                cut = max(fitted, 1)
                warnings.append(
                    f"{_block_label(block)}: guvenli bolunme noktasi bulunamadi, "
                    "satir sinirindan bolundu."
                )
            else:
                warnings.append(
                    f"{_block_label(block)}: tek sayfaya sigmadi, devam sayfasina aktarildi."
                )
            head, lines = lines[:cut], lines[cut:]
            lines[0].dy = 0.0
            pages[-1].placements.append(
                Placement(block, target_slot, head, show_rail=first_part)
            )
            first_part = False
            new_page()

    if not pages[-1].placements and len(pages) > 1:
        pages.pop()
    return LayoutResult(pages=pages, warnings=warnings)


def _block_label(block: Block) -> str:
    names = {"soru": "Soru", "ornek": "Ornek", "konu": "Konu anlatimi", "not": "Not"}
    name = names.get(block.kind, block.kind)
    return f"{name} {block.number}" if block.number else name
