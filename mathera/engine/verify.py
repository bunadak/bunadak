"""Dogrulama: uretilen PDF gercekten taslaga uyuyor mu?

Bu modul "basarisizlik kabul edilemez" kuralinin makine tarafindaki
karsiligidir. Cikti PDF yeniden okunur ve taslak sozlesmesi madde madde
sinanir. Bir madde bile saglanmiyorsa cikti hatali kabul edilir.
"""

from __future__ import annotations

from pathlib import Path

from .layout import ImageAtom, LayoutResult, TextAtom, TrackedAtom
from .spec import Spec

TOL = 0.6  # punto cinsinden olcum toleransi (rasterlestirme/yuvarlama payi)


def _band(spec: Spec, placement) -> tuple[float, float]:
    """Yerlesimin sayfada kapladigi dikey aralik (ust kenardan)."""
    baseline = spec.first_baseline(placement.slot)
    top = baseline - spec.body_size * spec.t["ascender_ratio"]
    bottom = baseline
    for i, line in enumerate(placement.lines):
        if i:
            baseline += line.dy
        top = min(top, baseline - _line_height(spec, line))
        bottom = max(bottom, baseline + line.depth)
    return top, bottom


def _line_height(spec: Spec, line) -> float:
    height = spec.body_size * spec.t["ascender_ratio"]
    for atom in line.atoms:
        if isinstance(atom, ImageAtom):
            height = max(height, atom.height)
        elif isinstance(atom, TextAtom):
            for piece in atom.pieces:
                height = max(height, piece.size * spec.t["ascender_ratio"] + piece.rise)
        elif isinstance(atom, TrackedAtom):
            height = max(height, atom.size * spec.t["ascender_ratio"])
    return height


def check_layout(layout: LayoutResult, spec: Spec) -> list[str]:
    """PDF'e bakmadan, yerlesim planinin taslak kurallarina uygunlugu."""
    problems: list[str] = []
    for page_no, page in enumerate(layout.pages, start=1):
        bands: list[tuple[float, float, str]] = []
        full_page_blocks = [p for p in page.placements if p.block.full_page]
        if full_page_blocks and len(page.placements) > 1:
            problems.append(
                f"Sayfa {page_no}: tam sayfa blok baska icerikle ayni sayfada."
            )
        if len(page.placements) > spec.slots_per_page:
            problems.append(
                f"Sayfa {page_no}: {len(page.placements)} blok var, izgara "
                f"{spec.slots_per_page} slot tanimliyor."
            )
        for placement in page.placements:
            top, bottom = _band(spec, placement)
            limit = (
                spec.content_bottom
                if placement.block.full_page
                else spec.slot_bottom(placement.slot)
            )
            if top < spec.content_top - TOL:
                problems.append(
                    f"Sayfa {page_no}: icerik ust kural cizgisinin uzerine tasti "
                    f"({top:.2f} < {spec.content_top})."
                )
            if bottom > limit + TOL:
                problems.append(
                    f"Sayfa {page_no}: icerik alt sinirdan tasti "
                    f"({bottom:.2f} > {limit:.2f})."
                )
            bands.append((top, bottom, f"slot {placement.slot}"))
        bands.sort()
        for (t1, b1, n1), (t2, b2, n2) in zip(bands, bands[1:]):
            if b1 > t2 + TOL:
                problems.append(f"Sayfa {page_no}: {n1} ile {n2} ust uste biniyor.")
    return problems


def check_pdf(pdf_path: str | Path, layout: LayoutResult, spec: Spec) -> list[str]:
    """Uretilen PDF'i yeniden okuyup cerceve ve guvenli alan kurallarini sinar.

    PyMuPDF kurulu degilse sessizce atlanir (yerlesim kontrolu yine calisir).
    """
    try:
        import fitz  # type: ignore
    except ImportError:
        return ["PyMuPDF kurulu degil: PDF uzerinden dogrulama atlandi."]

    problems: list[str] = []
    doc = fitz.open(str(pdf_path))
    if doc.page_count != len(layout.pages):
        problems.append(
            f"Sayfa sayisi uyusmuyor: PDF {doc.page_count}, plan {len(layout.pages)}."
        )

    safe_left = spec.rail_x - TOL
    safe_right = spec.body_right + TOL
    safe_bottom = spec.content_bottom + TOL

    for page_no, page in enumerate(doc, start=1):
        # --- cerceve ---
        if abs(page.rect.width - spec.page_width) > 0.05 or abs(
            page.rect.height - spec.page_height
        ) > 0.05:
            problems.append(f"Sayfa {page_no}: sayfa olcusu A4 degil.")

        brand_ok = False
        rule_ok = False
        for drawing in page.get_drawings():
            for item in drawing["items"]:
                if item[0] == "l":
                    p1, p2 = item[1], item[2]
                    if (
                        abs(p1.y - spec.rule["y"]) < TOL
                        and abs(p2.y - spec.rule["y"]) < TOL
                        and abs(p1.x - spec.rail_x) < TOL
                        and abs(p2.x - spec.body_right) < TOL
                    ):
                        rule_ok = True
        for block in page.get_text("rawdict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    for ch in span["chars"]:
                        if ch["c"] == "M" and abs(ch["origin"][0] - spec.rail_x) < TOL:
                            if abs(ch["origin"][1] - spec.brand["baseline"]) < TOL:
                                brand_ok = True
                    bbox = span["bbox"]
                    if bbox[0] < safe_left or bbox[2] > safe_right:
                        problems.append(
                            f"Sayfa {page_no}: metin yatay guvenli alanin disinda "
                            f"({bbox[0]:.1f}-{bbox[2]:.1f}): {span['chars'] and ''.join(c['c'] for c in span['chars'])[:40]!r}"
                        )
                    if bbox[3] > safe_bottom:
                        problems.append(
                            f"Sayfa {page_no}: metin alt sinirin altina tasti "
                            f"({bbox[3]:.1f} > {spec.content_bottom:.1f})."
                        )
        if not brand_ok:
            problems.append(f"Sayfa {page_no}: MATHERA marka yazisi beklenen yerde degil.")
        if not rule_ok:
            problems.append(f"Sayfa {page_no}: ust kural cizgisi beklenen yerde degil.")
    doc.close()
    return problems


def verify(pdf_path: str | Path, layout: LayoutResult, spec: Spec) -> list[str]:
    return check_layout(layout, spec) + check_pdf(pdf_path, layout, spec)
