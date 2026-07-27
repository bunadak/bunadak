"""Komut satiri: Word/metin/JSON girdisini taslak PDF'ine dokum.

    python -m mathera.engine.cli girdi.docx -o cikti.pdf
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .layout import paginate
from .parser import parse
from .render import render
from .spec import load_spec
from .verify import verify


def build(
    input_path: str | Path,
    output_path: str | Path,
    spec_path: str | Path | None = None,
    continuous_numbering: bool = False,
) -> dict:
    spec = load_spec(Path(spec_path) if spec_path else None)
    doc = parse(input_path, continuous_numbering=continuous_numbering)
    layout = paginate(doc, spec)
    pdf_path, notes = render(layout, spec, output_path)
    problems = verify(pdf_path, layout, spec)
    return {
        "girdi": str(input_path),
        "cikti": str(pdf_path),
        "sayfa_sayisi": len(layout.pages),
        "blok_sayisi": len(doc.blocks),
        "yerlesim": [
            {
                "sayfa": i + 1,
                "bloklar": [
                    {
                        "tur": p.block.kind,
                        "no": p.block.number,
                        "slot": "tam sayfa" if p.block.full_page else p.slot + 1,
                        "satir": len(p.lines),
                    }
                    for p in page.placements
                ],
            }
            for i, page in enumerate(layout.pages)
        ],
        "uyarilar": layout.warnings + notes,
        "sorunlar": problems,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="mathera",
        description="MATHERA taslagina icerik yerlestirme motoru "
        "(soru/ornek: sayfada 2, konu anlatimi/not: tam sayfa).",
    )
    ap.add_argument("girdi", help="Word (.docx), metin (.md/.txt) veya JSON dosyasi")
    ap.add_argument("-o", "--cikti", default=None, help="Uretilecek PDF yolu")
    ap.add_argument("--spec", default=None, help="Alternatif template_spec.json")
    ap.add_argument("--rapor", default=None, help="JSON rapor dosyasi yolu")
    ap.add_argument(
        "--numara",
        choices=("tur", "birlesik"),
        default="tur",
        help="Numaralandirma: 'tur' (soru ve ornek ayri sayar, varsayilan) "
        "veya 'birlesik' (tek dizi)",
    )
    ap.add_argument(
        "--katı",
        "--strict",
        dest="strict",
        action="store_true",
        help="Uyari veya sorun varsa hata koduyla cik",
    )
    args = ap.parse_args(argv)

    girdi = Path(args.girdi)
    cikti = Path(args.cikti) if args.cikti else girdi.with_suffix(".pdf")
    result = build(girdi, cikti, args.spec, continuous_numbering=args.numara == "birlesik")

    print(f"Girdi     : {result['girdi']}")
    print(f"Cikti     : {result['cikti']}")
    print(f"Blok/Sayfa: {result['blok_sayisi']} blok -> {result['sayfa_sayisi']} sayfa")
    for page in result["yerlesim"]:
        parts = ", ".join(
            f"{b['tur']}{'' if b['no'] is None else ' ' + str(b['no'])} ({b['slot']})"
            for b in page["bloklar"]
        )
        print(f"  sayfa {page['sayfa']}: {parts or '-'}")
    for w in result["uyarilar"]:
        print(f"  UYARI  : {w}")
    for p in result["sorunlar"]:
        print(f"  SORUN  : {p}")
    if not result["sorunlar"]:
        print("Dogrulama : taslak kurallarinin tamami saglandi.")

    if args.rapor:
        Path(args.rapor).write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    if result["sorunlar"]:
        return 2
    if args.strict and result["uyarilar"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
