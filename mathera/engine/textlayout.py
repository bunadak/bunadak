"""Satir ici metin olcumu ve satir sarmalama.

reportlab'in Paragraph'i yerine kendi shaper'imizi kullaniyoruz: taslaktaki
taban cizgisi konumlarini pikseline kadar tekrar uretebilmek icin metnin
nereye, hangi puntoyla, hangi yukseltmeyle (rise) konuldugunu tam kontrol
etmemiz gerekiyor.
"""

from __future__ import annotations

from dataclasses import dataclass

from reportlab.pdfbase import pdfmetrics

from .model import Run


@dataclass
class Piece:
    """Bir satirda ard arda cizilecek tek bicimli metin parcasi."""

    text: str
    font: str
    size: float
    rise: float
    width: float


@dataclass
class Style:
    """Bir metin akisinin taban bicimi."""

    font: str
    bold_font: str
    size: float
    sup_size_ratio: float
    sup_rise_ratio: float
    sub_size_ratio: float
    sub_rise_ratio: float

    def resolve(self, run: Run) -> tuple[str, float, float]:
        font = self.bold_font if run.bold else self.font
        if run.script == "sup":
            return font, self.size * self.sup_size_ratio, self.size * self.sup_rise_ratio
        if run.script == "sub":
            return font, self.size * self.sub_size_ratio, self.size * self.sub_rise_ratio
        return font, self.size, 0.0


def _fragments(runs: list[Run], style: Style) -> list[tuple[str, str, float, float]]:
    out = []
    for run in runs:
        if not run.text:
            continue
        font, size, rise = style.resolve(run)
        out.append((run.text, font, size, rise))
    return out


def _words(runs: list[Run], style: Style) -> list[list[tuple[str, str, float, float]]]:
    """Metni bosluklardan kelimelere ayirir; bir kelime birden fazla bicim
    parcasi icerebilir (ornegin x, ustsimge 2, ' - 6x')."""
    words: list[list[tuple[str, str, float, float]]] = []
    current: list[tuple[str, str, float, float]] = []
    for text, font, size, rise in _fragments(runs, style):
        parts = text.split(" ")
        for i, part in enumerate(parts):
            if i > 0:
                if current:
                    words.append(current)
                    current = []
                elif words:
                    # ard arda gelen bosluklar: yeni kelime baslatma
                    pass
            if part:
                current.append((part, font, size, rise))
    if current:
        words.append(current)
    return words


def piece_width(text: str, font: str, size: float) -> float:
    return pdfmetrics.stringWidth(text, font, size)


def _word_width(word: list[tuple[str, str, float, float]]) -> float:
    return sum(piece_width(t, f, s) for t, f, s, _ in word)


def _to_pieces(word: list[tuple[str, str, float, float]]) -> list[Piece]:
    return merge(Piece(t, f, s, r, piece_width(t, f, s)) for t, f, s, r in word)


def merge(pieces) -> list[Piece]:
    """Ayni bicimdeki komsu parcalari tek parcaya birlestirir.

    Onemli: birlesik parca PDF'e tek bir metin islemi olarak yazilir; ilerlemeyi
    fontun kendisi hesaplar. Kelime kelime yazmakla arada 0.1 puntoya varan
    yuvarlama farki olusur ve referans taslakla piksel esitligi bozulur.
    """
    out: list[Piece] = []
    for piece in pieces:
        if out and (out[-1].font, out[-1].size, out[-1].rise) == (
            piece.font,
            piece.size,
            piece.rise,
        ):
            last = out[-1]
            out[-1] = Piece(
                last.text + piece.text,
                last.font,
                last.size,
                last.rise,
                piece_width(last.text + piece.text, last.font, last.size),
            )
        else:
            out.append(piece)
    return out


def _break_long_word(
    word: list[tuple[str, str, float, float]], max_width: float
) -> list[list[tuple[str, str, float, float]]]:
    """Satira sigmayan tek kelimeyi karakter bazinda boler (URL, uzun ifade)."""
    chunks: list[list[tuple[str, str, float, float]]] = []
    current: list[tuple[str, str, float, float]] = []
    width = 0.0
    for text, font, size, rise in word:
        for ch in text:
            w = piece_width(ch, font, size)
            if width + w > max_width and current:
                chunks.append(current)
                current, width = [], 0.0
            if current and current[-1][1] == font and current[-1][2] == size:
                last = current[-1]
                current[-1] = (last[0] + ch, font, size, rise)
            else:
                current.append((ch, font, size, rise))
            width += w
    if current:
        chunks.append(current)
    return chunks


def wrap(runs: list[Run], style: Style, max_width: float) -> list[list[Piece]]:
    """Bicimli metni verilen genislige gore satirlara boler."""
    space_w = piece_width(" ", style.font, style.size)
    lines: list[list[Piece]] = []
    line: list[tuple[str, str, float, float]] = []
    width = 0.0

    def flush():
        nonlocal line, width
        if line:
            lines.append(_to_pieces(line))
        line, width = [], 0.0

    for word in _words(runs, style):
        w = _word_width(word)
        if w > max_width:
            flush()
            for chunk in _break_long_word(word, max_width):
                lines.append(_to_pieces(chunk))
            continue
        extra = space_w if line else 0.0
        if width + extra + w > max_width and line:
            flush()
            extra = 0.0
        if extra:
            line.append((" ", style.font, style.size, 0.0))
        line.extend(word)
        width += extra + w
    flush()
    return lines or [[]]


def line_width(pieces: list[Piece]) -> float:
    return sum(p.width for p in pieces)
