"""Taslak sozlesmesinin testleri.

En kritik test ``test_referans_taslak_piksel_esitligi``: motorun ciktisi,
kullanicidan gelen referans taslak PDF'i ile piksel piksel ayni olmalidir.
Bu test gecerse "taslak degismedi" iddiasi olculebilir bir gercektir.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT.parent))

from mathera.engine.cli import build  # noqa: E402
from mathera.engine.layout import paginate  # noqa: E402
from mathera.engine.parser import parse_text  # noqa: E402
from mathera.engine.render import render  # noqa: E402
from mathera.engine.spec import load_spec  # noqa: E402
from mathera.engine.verify import verify  # noqa: E402

FIXTURES = ROOT / "tests" / "fixtures"
REFERENCE_PDF = FIXTURES / "referans_taslak.pdf"
REFERENCE_MD = FIXTURES / "referans_icerik.md"

fitz = pytest.importorskip("fitz", reason="Dogrulama icin PyMuPDF gerekiyor")
np = pytest.importorskip("numpy")


def _pixels(pdf_path: Path, page_no: int, dpi: int):
    doc = fitz.open(str(pdf_path))
    pix = doc[page_no].get_pixmap(dpi=dpi)
    arr = np.frombuffer(pix.samples, dtype=np.uint8).astype(int)
    arr = arr.reshape(pix.height, pix.width, pix.n)
    doc.close()
    return arr


def _build(tmp_path: Path, text: str, name: str = "cikti.pdf") -> dict:
    src = tmp_path / "girdi.md"
    src.write_text(text, encoding="utf-8")
    return build(src, tmp_path / name)


# --------------------------------------------------------------------------
# 1) Taslaga birebir uygunluk
# --------------------------------------------------------------------------
@pytest.mark.parametrize("dpi", [150, 300])
def test_referans_taslak_piksel_esitligi(tmp_path, dpi):
    """Referans icerik referans taslakla piksel piksel ayni uretilmeli."""
    result = build(REFERENCE_MD, tmp_path / "referans.pdf")
    assert result["sorunlar"] == []
    assert result["sayfa_sayisi"] == 2

    for page_no in range(2):
        a = _pixels(REFERENCE_PDF, page_no, dpi)
        b = _pixels(tmp_path / "referans.pdf", page_no, dpi)
        assert a.shape == b.shape
        diff = np.abs(a - b)
        assert diff.max() == 0, (
            f"sayfa {page_no + 1} ({dpi} dpi): {int((diff.max(axis=2) > 0).sum())} "
            "piksel referanstan farkli"
        )


def test_sayfa_cercevesi_her_sayfada_ayni(tmp_path):
    """Marka, kural cizgisi, zemin ve sayfa olcusu her sayfada sabit."""
    metin = "\n".join(f"{i}. Deneme sorusu {i} metni.\nA) 1\nB) 2\nC) 3\nD) 4\nE) 5" for i in range(1, 8))
    result = _build(tmp_path, metin)
    assert result["sorunlar"] == []
    doc = fitz.open(str(tmp_path / "cikti.pdf"))
    spec = load_spec()
    for page in doc:
        assert abs(page.rect.width - spec.page_width) < 0.05
        assert abs(page.rect.height - spec.page_height) < 0.05
        text = page.get_text()
        assert "MATHERA" in text.replace(" ", "")
    doc.close()


# --------------------------------------------------------------------------
# 2) Yerlesim kurallari
# --------------------------------------------------------------------------
def test_soru_sayfada_iki_adet(tmp_path):
    metin = "\n".join(
        f"{i}. Kisa soru {i}.\nA) 1\nB) 2\nC) 3\nD) 4\nE) 5" for i in range(1, 6)
    )
    result = _build(tmp_path, metin)
    assert [len(p["bloklar"]) for p in result["yerlesim"]] == [2, 2, 1]
    assert result["sorunlar"] == []


def test_ornek_de_sayfada_iki_adet(tmp_path):
    metin = "\n".join(f"Örnek {i}: Kisa ornek {i} metni." for i in range(1, 5))
    result = _build(tmp_path, metin)
    assert [len(p["bloklar"]) for p in result["yerlesim"]] == [2, 2]
    assert all(b["tur"] == "ornek" for p in result["yerlesim"] for b in p["bloklar"])


def test_konu_ve_not_tam_sayfa(tmp_path):
    metin = (
        "[KONU]\nKonu basligi paragrafi.\n"
        "[NOT]\nKisa bir not.\n"
        "1. Kisa soru.\nA) 1\nB) 2\nC) 3\nD) 4\nE) 5\n"
    )
    result = _build(tmp_path, metin)
    yer = result["yerlesim"]
    assert [b["tur"] for p in yer for b in p["bloklar"]] == ["konu", "not", "soru"]
    assert len(yer) == 3
    assert all(len(p["bloklar"]) == 1 for p in yer[:2])
    assert yer[0]["bloklar"][0]["slot"] == "tam sayfa"


def test_konu_kendi_sayfasini_bosaltmaz_ama_paylasmaz(tmp_path):
    """Soru -> konu -> soru sirasinda konu tek basina bir sayfada olmali."""
    soru = "1. Kisa soru.\nA) 1\nB) 2\nC) 3\nD) 4\nE) 5\n"
    result = _build(tmp_path, soru + "[KONU]\nAnlatim metni.\n" + soru)
    turler = [[b["tur"] for b in p["bloklar"]] for p in result["yerlesim"]]
    assert turler == [["soru"], ["konu"], ["soru"]]


# --------------------------------------------------------------------------
# 3) Tasma politikasi
# --------------------------------------------------------------------------
def test_uzun_ornek_tam_sayfaya_yukseltilir(tmp_path):
    uzun = " ".join(["Bu cumle yerlesimi zorlamak icin tekrar ediyor."] * 60)
    result = _build(tmp_path, f"Örnek 1: {uzun}")
    assert result["yerlesim"][0]["bloklar"][0]["slot"] == "tam sayfa"
    assert any("tam sayfaya yukseltildi" in w for w in result["uyarilar"])
    assert result["sorunlar"] == []


def test_cok_uzun_konu_devam_sayfasina_akar(tmp_path):
    uzun = "\n".join(
        f"Paragraf {i}: " + " ".join(["konu anlatimi metni"] * 30) for i in range(1, 12)
    )
    result = _build(tmp_path, "[KONU]\n" + uzun)
    assert result["sayfa_sayisi"] >= 2
    assert result["sorunlar"] == []
    assert any("devam sayfasina" in w for w in result["uyarilar"])


def test_hicbir_icerik_guvenli_alanin_disina_tasmaz(tmp_path):
    spec = load_spec()
    parcalar = [
        "[KONU]\nCok uzun " + " ".join(["kelime"] * 400),
        "Örnek 1: " + " ".join(["uzun ornek metni"] * 40),
        "1. " + " ".join(["uzun soru metni"] * 30),
        "A) " + " ".join(["uzun secenek"] * 12),
        "B) 2",
        "C) 3",
        "D) 4",
        "E) 5",
    ]
    result = _build(tmp_path, "\n".join(parcalar))
    assert result["sorunlar"] == []

    doc = fitz.open(str(tmp_path / "cikti.pdf"))
    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    x0, y0, x1, y1 = span["bbox"]
                    assert x0 >= spec.rail_x - 0.6
                    assert x1 <= spec.body_right + 0.6
                    assert y1 <= spec.content_bottom + 0.6
    doc.close()


# --------------------------------------------------------------------------
# 4) Tipografi ayrintilari
# --------------------------------------------------------------------------
def test_secenek_ve_ray_koordinatlari(tmp_path):
    spec = load_spec()
    _build(tmp_path, "1. Tek satirlik soru.\nA) 3\nB) 4\nC) 5\nD) 6\nE) 7")
    doc = fitz.open(str(tmp_path / "cikti.pdf"))
    spans = [
        (round(s["bbox"][0], 2), round(s["origin"][1], 4), "".join(c["c"] for c in s["chars"]))
        for b in doc[0].get_text("rawdict")["blocks"]
        if b["type"] == 0
        for l in b["lines"]
        for s in l["spans"]
    ]
    doc.close()
    etiket = next(s for s in spans if s[2] == "A)")
    deger = next(s for s in spans if s[2] == "3")
    assert etiket[0] == spec.body_x
    assert deger[0] == spec.option_value_x
    # taslakta secenek metni etiketten 1.5 punto yukarida
    assert round(etiket[1] - deger[1], 2) == spec.t["options"]["value_rise"]
    # ilk secenek, soru metninden 24 punto asagida
    soru = next(s for s in spans if s[2].startswith("Tek satirlik"))
    assert round(etiket[1] - soru[1], 2) == spec.t["options"]["gap_before"]


def test_ustsimge_referans_olculeriyle_ayni(tmp_path):
    spec = load_spec()
    _build(tmp_path, "1. x^2 degeri nedir?\nA) 1\nB) 2\nC) 3\nD) 4\nE) 5")
    doc = fitz.open(str(tmp_path / "cikti.pdf"))
    sizes = {
        round(s["size"], 2)
        for b in doc[0].get_text("dict")["blocks"]
        if b["type"] == 0
        for l in b["lines"]
        for s in l["spans"]
    }
    doc.close()
    beklenen = round(spec.body_size * spec.t["superscript"]["size_ratio"], 2)
    assert beklenen == 8.5
    assert beklenen in sizes


# --------------------------------------------------------------------------
# 5) Girdi cozumleme
# --------------------------------------------------------------------------
def test_word_girdisi_ayni_sonucu_verir(tmp_path):
    docx = pytest.importorskip("docx")
    document = docx.Document()
    document.add_paragraph("1. Tek satirlik soru.")
    for letter, value in zip("ABCDE", "34567"):
        document.add_paragraph(f"{letter}) {value}")
    yol = tmp_path / "girdi.docx"
    document.save(str(yol))

    sonuc_docx = build(yol, tmp_path / "docx.pdf")
    sonuc_md = _build(tmp_path, "1. Tek satirlik soru.\nA) 3\nB) 4\nC) 5\nD) 6\nE) 7", "md.pdf")
    assert sonuc_docx["yerlesim"] == sonuc_md["yerlesim"]
    a = _pixels(tmp_path / "docx.pdf", 0, 150)
    b = _pixels(tmp_path / "md.pdf", 0, 150)
    assert np.abs(a - b).max() == 0


def test_bos_girdi_bos_sayfa_uretmez(tmp_path):
    result = _build(tmp_path, "\n\n\n")
    assert result["blok_sayisi"] == 0
    assert result["sayfa_sayisi"] == 1


def test_dogrulama_yerlesimle_tutarli(tmp_path):
    spec = load_spec()
    doc = parse_text(REFERENCE_MD.read_text(encoding="utf-8"))
    layout = paginate(doc, spec)
    pdf, _ = render(layout, spec, tmp_path / "v.pdf")
    assert verify(pdf, layout, spec) == []
