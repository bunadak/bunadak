"""Icerik modeli.

Word / JSON / Markdown gibi tum girdi bicimleri once bu modele cevrilir;
yerlesim ve cizim yalnizca bu modeli tanir.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

BlockKind = Literal["soru", "ornek", "konu", "not"]
ParaKind = Literal["paragraph", "bullet", "formula", "subheading"]

#: Tam sayfa isteyen blok turleri (kullanicinin kurali: konu anlatimi ve not
#: tam sayfa; soru ve ornek sayfada iki tane).
FULL_PAGE_KINDS = ("konu", "not")

#: Blok turunun govde sutununda gosterilen etiketi. Julius Sans One'da
#: bulunmayan harfler (Ğ, İ, Ş) bilerek kullanilmaz.
KIND_TAGS = {
    "ornek": "ÖRNEK",
    "konu": "KONU ANLATIMI",
    "not": "NOT",
    "soru": None,  # soruda etiket yok; taslakta da yok
}

SOLUTION_TAG = "ÇÖZÜM"
CONTINUATION_SUFFIX = "DEVAM"


@dataclass
class Run:
    """Satir ici bicimlendirilmis metin parcasi."""

    text: str
    bold: bool = False
    script: Literal["", "sup", "sub"] = ""


@dataclass
class Para:
    runs: list[Run]
    kind: ParaKind = "paragraph"


@dataclass
class Image:
    path: str
    width: float | None = None  # punto; None ise dogal boyut kullanilir
    height: float | None = None


@dataclass
class Option:
    letter: str
    runs: list[Run]


Flowable = Para | Image


@dataclass
class Block:
    kind: BlockKind
    body: list[Flowable] = field(default_factory=list)
    options: list[Option] = field(default_factory=list)
    solution: list[Flowable] = field(default_factory=list)
    title: list[Run] = field(default_factory=list)
    number: int | None = None
    force_full_page: bool = False
    page_break_before: bool = False
    #: Bolunmus bloklarin devam parcasi mi
    continuation: bool = False

    @property
    def full_page(self) -> bool:
        return self.force_full_page or self.kind in FULL_PAGE_KINDS

    @property
    def tag(self) -> str | None:
        return KIND_TAGS.get(self.kind)


@dataclass
class Document:
    blocks: list[Block] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
