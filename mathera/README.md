# MATHERA Taslak Yerleşim Motoru

Word dosyasındaki içeriği **MATHERA soru taslağına** — taslağın yapısını,
ölçülerini ve görünümünü hiç değiştirmeden — yerleştiren motor.

* **Soru / Örnek** → bir PDF sayfasına **2 adet** (üst slot + alt slot)
* **Konu anlatımı / Not** → **tam sayfa**, sayfayı kimseyle paylaşmaz
* Taslak sabittir; sadece içerik değişir.

Motorun taslağa sadakati tahmine değil ölçüme dayanır: referans taslak PDF'i
motorla yeniden üretildiğinde çıktı **piksel piksel aynıdır** (bkz.
`tests/test_taslak.py::test_referans_taslak_piksel_esitligi`).

---

## Kurulum

```bash
pip install reportlab python-docx pymupdf   # pymupdf yalnızca doğrulama/test için
```

Fontlar depoda gömülüdür (`assets/fonts`), ayrıca kurulum gerekmez:
Julius Sans One (OFL) ve DejaVu Sans (Bitstream Vera).

## Kullanım

```bash
# Depo kökünden:
python3 -m mathera.engine.cli icerik.docx -o icerik.pdf
python3 -m mathera.engine.cli icerik.docx -o icerik.pdf --rapor rapor.json
python3 -m mathera.engine.cli icerik.docx -o icerik.pdf --numara birlesik
```

Örnek çıktı:

```
Girdi     : icerik.docx
Cikti     : icerik.pdf
Blok/Sayfa: 7 blok -> 5 sayfa
  sayfa 1: konu (tam sayfa)
  sayfa 2: not (tam sayfa)
  sayfa 3: ornek 1 (1), ornek 2 (2)
  sayfa 4: soru 1 (1), soru 2 (2)
  sayfa 5: soru 3 (1)
Dogrulama : taslak kurallarinin tamami saglandi.
```

Çıkış kodu: `0` temiz, `1` (`--katı` ile) uyarı var, `2` taslak ihlali —
bu durumda çıktı teslim edilmez.

Girdi olarak `.docx`, `.md`/`.txt` ve kanonik `.json` kabul edilir.

## Word dosyası nasıl yazılır?

Motor, Word dosyasındaki **sırayı** ve **yapıyı** aynen korur; hiçbir şey
eklemez, çıkarmaz, düzeltmez. Blok türlerini şu işaretlerden tanır:

| Yazdığınız | Sonuç |
| --- | --- |
| `[SORU]` / `Soru 5:` / `1. …`, `2) …` | Yeni soru bloğu (yarım sayfa) |
| `[ÖRNEK]` / `Örnek 3:` | Yeni örnek bloğu (yarım sayfa) |
| `[KONU]` / `Konu Anlatımı: …` / Word **Başlık 1** | Konu anlatımı (tam sayfa) |
| `[NOT]` / `Not: …` | Not (tam sayfa) |
| `A) …` … `E) …` | Şıklar |
| `Çözüm:` | Örneğin çözüm bölümü |
| Word **Başlık 2** veya `[BAŞLIK] …` | Blok içi ara başlık |
| Madde işaretli paragraf veya `- …` | Madde |
| `$$ … $$` veya `[FORMÜL] …` | Ortalanmış formül satırı |
| `[TAM SAYFA]` | Sonraki bloğu tek başına tam sayfaya al |
| `[SAYFA]` | Sonraki bloğu yeni sayfadan başlat |

Satır içi biçim:

* **Kalın**: Word'ün kalın biçimi ya da `**kalın**`
* Üst simge: Word'ün üst simgesi ya da `x^2`, `^{n+1}`
* Alt simge: Word'ün alt simgesi ya da `a_1`, `_{min}`
* Formülde hizalama için art arda boşluk kullanabilirsiniz (korunur).
* Görseller Word'deki yerlerinde, gövde sütunu genişliğini aşmayacak
  biçimde yerleşir.

Bir örnek girdi hazırdır: `samples/ornek_girdi.docx`
(`python3 samples/ornek_girdi_olustur.py` ile yeniden üretilebilir).

> Dikkat: `1.` / `2)` ile başlayan paragraf **her zaman yeni soru** açar.
> Konu anlatımı içinde numaralı sıralama gerekiyorsa Word'ün otomatik
> numaralı listesini kullanın; o madde olarak akar.

## Taşma olursa ne olur?

Punto küçültmek, satır aralığını daraltmak, kenar boşluğunu kısmak **yasaktır**.
Motor sırasıyla şunu yapar ve her adımı rapora yazar:

1. Yarım slota sığmayan soru/örnek → tam sayfaya yükseltilir.
2. Tam sayfaya da sığmıyorsa → satır sınırından devam sayfasına akıtılır.

## Taslak sözleşmesi (özet)

| Öğe | Değer |
| --- | --- |
| Sayfa | A4, 595.2756 × 841.8898 pt, zemin `#FBF8F2` |
| Marka | "MATHERA", Julius Sans One 15 pt, `#5F7A61`, 3.3 pt harf aralığı, taban çizgisi y=56 |
| Kural çizgisi | y=68, x 46 → 549.2756, 0.8 pt, `#26364F` |
| Sütunlar | ray x=46, gövde x=82 → 549.2756, şık metni x=102 |
| Gövde | DejaVu Sans 10.5 pt / 16.5 pt satır aralığı, `#2E3742` |
| Şık | etiket DejaVu Sans Bold 10.5 pt `#3A4450`; metin 1.5 pt yukarıda; ilk şık 24 pt, adım 20 pt |
| İzgara | sayfada 2 slot, slot yüksekliği 366.9449 pt; ilk taban çizgileri 110.5 ve 477.4449 |
| Güvenli alan | y 68 → 801.8898 |

Tam liste: [`template_spec.json`](template_spec.json). Motor kodunda gömülü
sabit yoktur; tüm ölçüler bu dosyadan okunur.

## Yapı

```
mathera/
├── PROMPT.md              # hazır prompt (kopyala–yapıştır)
├── template_spec.json     # taslağın tek doğruluk kaynağı (ölçülmüş değerler)
├── engine/
│   ├── spec.py            # spec yükleme + font kaydı
│   ├── parser.py          # .docx / .md / .json -> içerik modeli
│   ├── model.py           # blok, paragraf, şık, görsel
│   ├── textlayout.py      # satır sarma ve ölçüm
│   ├── layout.py          # izgaraya oturtma, sayfalama, taşma politikası
│   ├── render.py          # PDF çizimi (referansla aynı PDF operatörleri)
│   ├── verify.py          # çıktının taslağa uygunluk denetimi
│   └── cli.py             # komut satırı
├── assets/fonts/          # Julius Sans One (OFL), DejaVu Sans (Bitstream Vera)
├── samples/               # örnek Word girdisi ve üreteci
└── tests/                 # piksel eşitliği ve yerleşim kuralları testleri
```

## Testler

```bash
python3 -m pytest mathera/tests -q
```

Testler; referansla piksel eşitliğini, sayfa başına 2 soru/örnek kuralını,
konu-not tam sayfa kuralını, taşma politikasını, güvenli alan sınırlarını,
şık/ray koordinatlarını ve Word ile Markdown girdilerinin aynı çıktıyı
verdiğini doğrular.
