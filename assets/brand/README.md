# MATHERA kelime markası (bronz kabartma)

Madalyon görselindeki altın yazının yerine geçmek üzere üretilmiş, **şeffaf zeminli**
bronz kabartma "MATHERA" yazısı.

| Dosya | Açıklama |
| --- | --- |
| `mathera-medallion.png` | **Tamamlanmış madalyon**: çelik halka + altın çember + bronz yazı. 1244×1244. |
| `mathera-medallion@2x.png` | Aynısı, 2488×2488. |
| `medallion.html` | Madalyonun kaynağı (HTML/CSS). Yazıyı `mathera-wordmark.svg`'den alır. |
| `mathera-wordmark.svg` | Sadece yazı, vektör. Harfler path'e çevrilmiş, font bağımlılığı yok. |
| `mathera-wordmark.png` | Sadece yazı, 2484×480, RGBA (şeffaf). |
| `mathera-wordmark@2x.png` | Sadece yazı, 4968×960, RGBA (şeffaf). |
| `generate_wordmark.py` | Yazı üreticisi. Renk/derinlik/harf aralığı buradan değişir. |

## Madalyonu yeniden render etmek

```bash
cd assets/brand
headless_shell --headless --no-sandbox --allow-file-access-from-files \
  --window-size=1244,1244 --screenshot=mathera-medallion.png medallion.html
```

`medallion.html` içindeki ayar noktaları: `.plaque` (çelik halka, 940 px),
`.face` (krem yüzey, 800 px), `.gold` (altın çember, 772 px / 13 px kalınlık),
`.word` (yazı genişliği, 770 px), script'teki `R` (karakterlerin yerleşim yarıçapı).

## Yazıyı kendi görselinin üzerine yerleştirme

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
