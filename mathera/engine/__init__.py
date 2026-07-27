"""MATHERA taslak yerlestirme motoru.

Akis:  girdi (.docx/.md/.json) -> parser -> model -> layout -> render -> verify
Taslagin tum olculeri ``template_spec.json`` dosyasindadir; motor bu dosyanin
disina cikmaz.
"""

from .layout import paginate
from .parser import parse, parse_docx, parse_json, parse_text
from .render import render
from .spec import load_spec
from .verify import verify

__all__ = [
    "paginate",
    "parse",
    "parse_docx",
    "parse_json",
    "parse_text",
    "render",
    "load_spec",
    "verify",
]
