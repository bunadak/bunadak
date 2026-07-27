"""Taslak spesifikasyonu: template_spec.json'u okur, font kaydini yapar.

Bu modul taslagin geometrisine erisimin TEK yoludur. Yerlestirme ve cizim
kodunda hicbir sabit sayi bulunmaz; hepsi buradan gelir. Boylece "taslak
degismesin, sadece icerik degissin" kurali yapisal olarak garanti altina alinir.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent.parent
SPEC_PATH = ROOT / "template_spec.json"
FONT_DIR = ROOT / "assets" / "fonts"

# reportlab'e kaydedilen isimler
F_BRAND = "MATHERA-Brand"
F_BODY = "MATHERA-Body"
F_BODY_BOLD = "MATHERA-Body-Bold"

_FONT_KEYS = {"brand": F_BRAND, "body": F_BODY, "body_bold": F_BODY_BOLD}

_registered = False


@dataclass(frozen=True)
class Spec:
    raw: dict

    # --- sayfa ---
    @property
    def page_width(self) -> float:
        return self.raw["page"]["width"]

    @property
    def page_height(self) -> float:
        return self.raw["page"]["height"]

    # --- renkler ---
    def color(self, key: str):
        return HexColor(self.raw["colors"][key])

    # --- sutunlar / kenarlar ---
    @property
    def rail_x(self) -> float:
        return self.raw["columns"]["rail_x"]

    @property
    def body_x(self) -> float:
        return self.raw["columns"]["body_x"]

    @property
    def option_value_x(self) -> float:
        return self.raw["columns"]["option_value_x"]

    @property
    def body_right(self) -> float:
        return self.page_width - self.raw["margins"]["right"]

    @property
    def body_width(self) -> float:
        return self.body_right - self.body_x

    @property
    def content_top(self) -> float:
        """Ust kural cizgisinin y'si (ust kenardan olculur)."""
        return self.raw["margins"]["content_top"]

    @property
    def content_bottom(self) -> float:
        """Icerigin inebilecegi en alt sinir (ust kenardan olculur)."""
        return self.raw["margins"]["content_bottom"]

    # --- izgara ---
    @property
    def slots_per_page(self) -> int:
        return self.raw["grid"]["slots_per_page"]

    @property
    def slot_pitch(self) -> float:
        return self.raw["grid"]["slot_pitch"]

    def slot_top(self, index: int) -> float:
        return self.content_top + index * self.slot_pitch

    def slot_bottom(self, index: int) -> float:
        return min(self.slot_top(index) + self.slot_pitch, self.content_bottom)

    def first_baseline(self, index: int) -> float:
        """Slotun ilk metin satirinin taban cizgisi (ust kenardan)."""
        return self.slot_top(index) + self.raw["grid"]["first_baseline_offset"]

    def rail_baseline(self, index: int) -> float:
        return self.slot_top(index) + self.raw["grid"]["rail_baseline_offset"]

    # --- tipografi ---
    @property
    def t(self) -> dict:
        return self.raw["typography"]

    @property
    def body_size(self) -> float:
        return self.t["body"]["size"]

    @property
    def leading(self) -> float:
        return self.t["body"]["leading"]

    @property
    def descender(self) -> float:
        return self.body_size * self.t["descender_ratio"]

    def font(self, key: str) -> str:
        return _FONT_KEYS[key]

    # --- marka ---
    @property
    def brand(self) -> dict:
        return self.raw["brand"]

    @property
    def rule(self) -> dict:
        return self.raw["rule"]


def register_fonts(spec: Spec) -> None:
    """Taslak fontlarini reportlab'e kaydeder (yalnizca bir kez)."""
    global _registered
    if _registered:
        return
    for key, filename in spec.raw["fonts"].items():
        path = FONT_DIR / filename
        if not path.exists():
            raise FileNotFoundError(
                f"Taslak fontu bulunamadi: {path}. assets/fonts icerigi eksik."
            )
        pdfmetrics.registerFont(TTFont(_FONT_KEYS[key], str(path)))
    _registered = True


def load_spec(path: Path | None = None) -> Spec:
    with open(path or SPEC_PATH, encoding="utf-8") as fh:
        spec = Spec(json.load(fh))
    register_fonts(spec)
    return spec
