# MATHERA — Kapak Motoru

Kanalın **sabit kapak kalıbı**. Tasarım hiç değişmez; sen sadece konu adını
yazarsın, motor kapağı üretir.

Görsel dil doğrudan intro videosundan alındı: sıcak sıva duvar, sağ üstten
gelen tek yumuşak ışık, ince bakır teknik çizim ve çelik halkalı lacivert
madalyon. Kapaklar introdan çıkıp devam ediyormuş gibi durur.

---

## Kullanım

```bash
cd kapak-motoru
npm run kapak                  # kapaklar.js'teki her şeyi üretir
npm run kapak -- sayilar       # sadece adı eşleşenleri üretir
```

| Çıktı | Boyut | Ne için |
|---|---|---|
| `out/<ad>.jpg` | 1280×720 | YouTube'a yükleyeceğin dosya (~120 KB) |
| `out/<ad>@2x.png` | 2560×1440 | Arşiv / tanıtım |

### Kurulum

```bash
npm install playwright && npx playwright install chromium
```

Fontlar `fonts/` içinde yerel — internet gerekmez, çıktı her makinede aynı.

---

## Konu eklemek

Tek düzenlediğin dosya: **`kapaklar.js`**

```js
{
  dosya: '07-koklu-sayilar',
  konu: 'KÖKLÜ SAYILAR',
  ustBaslik: 'TYT MATEMATİK',
  altBaslik: 'Kök dışına çıkarmanın *tek kuralı*.',
  rozet: 'BÖLÜM 07',
}
```

Kaydet, `npm run kapak`. Hepsi bu.

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `dosya` | ✓ | Çıktı dosyasının adı (Türkçe karakter kullanma) |
| `konu` | ✓ | Konu adı. Uzunsa `\|` ile satır kır: `'ÜSLÜ\|SAYILAR'` |
| `ustBaslik` | – | Lacivert etiket |
| `altBaslik` | – | Tek satır vaat. `*yıldız arası*` bakır renkte vurgulanır |
| `rozet` | – | Sağ üst köşe |

Punto otomatik ayarlanır: kısa konu büyük, uzun konu küçük gelir; hiçbir
durumda taşmaz. `BÖLME VE BÖLÜNEBİLME` ile `SAYILAR` aynı çerçevede dengeli
durur.

---

## Logo

`assets/logo.png` koyarsan motor otomatik onu kullanır (kare, şeffaf zeminli
PNG en iyisi). Dosya yoksa `src/logo.js` içindeki madalyon çizilir — intro
amblemin vektörel karşılığı: fırçalanmış çelik halka, kazınmış π/2/3/0/5
işaretleri, lacivert cam disk, ince bakır halka, 3B bakır yazı.

---

## Dosya düzeni

| Dosya | İçerik |
|---|---|
| `kapaklar.js` | **Konu listesi.** Normalde sadece burayı açarsın. |
| `src/marka.js` | Renk paleti ve temalar |
| `src/cizim.js` | Teknik çizim (blueprint) katmanı |
| `src/logo.js` | Madalyon |
| `src/stil.css` | Tasarım sistemi |
| `src/kalip.js` | Kalıbın HTML yapısı + otomatik punto sığdırma |
| `src/formul.js` | Matematik dizgisi (kesir, limit, integral sınırları) |
| `src/render.mjs` | Üretici |
| `src/olc.mjs` | Teşhis: `node src/olc.mjs 01` kutu ölçülerini döker |

---

## Renkler (intro videosundan örneklendi)

| Rol | HEX |
|---|---|
| Sıva — ışıklı | `#D9D1C6` |
| Sıva — gölgeli | `#9E958B` |
| Lacivert disk | `#2B4869` → `#0D1E33` |
| Çelik halka | `#F2F2F1` / `#8B8885` / `#78756F` |
| Bakır — parlak | `#FFEEDD` |
| Bakır — gövde | `#C08453` |
| Bakır — gölge | `#96602F` |

---

## Yedek düzenler

Motorda sabit kalıbın yanında altı düzen daha duruyor (`imza`, `formul`,
`soru`, `ikilem`, `adim`, `ders`) ve koyu temalar (`bakir`, `gece`, `krem`).
Standart akışta bunlara dokunmuyorsun — özel bir video için istersen kayda
`tasarim: 'soru'` eklemen yeterli.

Kanal başlığı için: `tasarim: 'banner'` → 2560×1440, metinler YouTube'un
1546×423 güvenli alanı içinde kalır.
