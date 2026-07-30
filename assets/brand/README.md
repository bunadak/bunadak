# MATHERA kelime markası (bronz kabartma)

Madalyon görselindeki altın yazının yerine geçmek üzere üretilmiş, **şeffaf zeminli**
bronz kabartma "MATHERA" yazısı.

| Dosya | Açıklama |
| --- | --- |
| `mathera-wordmark.svg` | Vektör. Harfler path'e çevrilmiş, font bağımlılığı yok. |
| `mathera-wordmark.png` | 2484×480, RGBA (şeffaf). |
| `mathera-wordmark@2x.png` | 4968×960, RGBA (şeffaf). |
| `generate_wordmark.py` | Üretici script. Renk/derinlik/aralık ayarları buradan değişir. |

## Yerleştirme

PNG'yi madalyonun krem iç alanına ortalayarak koy; yazı genişliği iç altın çemberin
yaklaşık %72'si olduğunda orijinal düzenle örtüşür. SVG'de dolgu alanı (padding)
90 px'dir, yani harflerin kendisi görselin kenarlarına yapışmaz — ortalarken
görselin tamamını referans alabilirsin.

Işık yönü sol üstten (azimuth 230°). Madalyon fotoğrafının ışığı farklı yönden
geliyorsa `generate_wordmark.py` içindeki `feDistantLight azimuth` değerlerini ve
`gFace` gradyan açısını buna göre çevir.

## Yeniden üretme

```bash
pip install fonttools brotli
python3 assets/brand/generate_wordmark.py assets/brand/mathera-wordmark.svg
```

PNG çıktısı (Chromium ile, şeffaf zemin):

```bash
headless_shell --headless --no-sandbox --default-background-color=00000000 \
  --window-size=2484,480 --screenshot=mathera-wordmark.png mathera-wordmark.svg
```

## Notlar

- Harf formları repodaki **Sora 700** (`frontend/dist/libs/fonts/files/sora-latin-700-normal.woff2`)
  fontundan alınmıştır; referans görseldeki geometrik sans'a en yakın olan bu.
- Kabartma efekti SVG filtreleriyle (`feSpecularLighting` + `feDiffuseLighting`,
  yüzey haritası olarak alfa kanalı) yapılıyor. Tarayıcılarda ve modern
  görüntüleyicilerde doğru render edilir; bazı basit SVG editörleri filtreleri
  yok sayıp yalnızca düz gradyanlı harfleri gösterebilir — bu durumda PNG'yi kullan.
