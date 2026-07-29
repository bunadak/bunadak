# MATHERA — Kapak Motoru

YouTube video kapakları (thumbnail) ve kanal banner'ı üreten şablon motoru.
Tasarım sabit kalır, **sen sadece metni değiştirirsin**.

Renkler kanalın mevcut kimliğinden türetildi: logo iç dairesinin laciverti,
dış halkanın platini, banner yazısının dövme bakırı ve kum bej zemini.

---

## Kullanım

```bash
cd kapak-motoru
npm run kapak                 # kapaklar.js'teki her şeyi üretir
npm run kapak -- limit turev  # sadece adı eşleşenleri üretir
```

Çıktılar `out/` klasörüne düşer:

| Dosya | Boyut | Ne için |
|---|---|---|
| `<ad>.jpg` | 1280×720 | YouTube'a yükleyeceğin dosya (~100 KB, sınır 2 MB) |
| `<ad>@2x.png` | 2560×1440 | Arşiv / tanıtım / baskı |

Banner (`tasarim: 'banner'`) 2560×1440 üretir; metinler YouTube'un her ekranda
gösterdiği **1546×423 güvenli alanı** içinde kalır.

### Kurulum

Playwright gerekiyor (Chromium ile birlikte):

```bash
npm install playwright && npx playwright install chromium
```

Fontlar `fonts/` içinde yerel olarak duruyor — internet gerekmez, çıktı her
makinede birebir aynı.

---

## Metin nasıl değiştirilir

Tek düzenlediğin dosya: **`kapaklar.js`**

```js
{
  dosya: '08-parabol',
  tasarim: 'imza',
  tema: 'bakir',
  ustBaslik: 'AYT MATEMATİK',
  baslik: 'PARABOL|GRAFİĞİ',
  vurgu: 'üç noktada biter',
  altBaslik: 'Tepe noktasını *ezberlemeden* bul.',
  formul: 'y = a(x − r)^2 + k',
  rozet: 'BÖLÜM 08',
}
```

Kaydet, `npm run kapak` çalıştır. Punto, satır aralığı ve hizalama otomatik
ayarlanır — uzun konu adı yazsan da taşmaz.

### Alanlar

| Alan | Açıklama |
|---|---|
| `dosya` | Çıktı dosyasının adı (Türkçe karakter kullanma) |
| `tasarim` | `imza` · `formul` · `soru` · `ikilem` · `adim` · `ders` · `banner` |
| `tema` | `bakir` (lacivert+bakır) · `gece` (siyah+bakır) · `krem` (banner rengi) |
| `ustBaslik` | Üstteki küçük etiket rozeti |
| `baslik` | Ana konu. `\|` ile satır kırarsın: `'TÜREV\|UYGULAMALARI'` |
| `vurgu` | İkinci satır, italik serif — grotesk başlıkla kontrast yaratır |
| `altBaslik` | Açıklama. `*yıldız arası*` bakır renkte vurgulanır |
| `formul` | Formül (dizgi sözdizimi aşağıda) |
| `rozet` | Sağ üst köşe: `BÖLÜM 04`, `2025 MÜFREDAT` |

Düzene özel alanlar: `dugme` (soru) · `sol`/`sag`/`solRol`/`sagRol`/`karsi`
(ikilem) · `rakam`/`maddeler` (adim) · `levhaEtiketi` (imza).

---

## Formül yazımı

`formul` alanı LaTeX kurmadan matematiksel dizgi yapar:

| Yazarsan | Çıkar |
|---|---|
| `[sin x]/[x]` | dikey kesir, çizgili |
| `lim_{x→0}` | `lim`, altında `x→0` |
| `∫_{a}^{b}` | integral, alt ve üst sınırlı |
| `x^2` · `x^{n+1}` | üst simge |
| `a_1` · `a_{n}` | alt simge |
| `~` | ince boşluk |

Örnekler:

```js
formul: 'lim_{x→0} [sin x]/[x] = 1'
formul: '∫_{a}^{b} f(x)~dx = F(b) − F(a)'
formul: 'x = [−b ± √(b^2 − 4ac)]/[2a]'
```

---

## Düzenler

| `tasarim` | Ne zaman kullan |
|---|---|
| `imza` | Bayrak gemisi. Konu solda dev, formül sağda cam levhada. Standart video. |
| `formul` | Formül kahraman: bağıntı ortada dev. Tek bir bağıntıyı anlatan video. |
| `soru` | Dev soru işareti + merak boşluğu. "Neden / nasıl" videoları. |
| `ikilem` | İki kavram karşı karşıya. Karıştırılan konular. |
| `adim` | Dev rakam + madde listesi. "3 adımda", "5 soru tipi". |
| `ders` | Sakin editoryal düzen. Ders serisi, playlist kapakları. |
| `banner` | Kanal başlığı, 2560×1440. |

---

## Logo

`assets/` klasörüne `logo.png` (veya `.jpg` / `.webp` / `.svg`) koyarsan motor
otomatik onu kullanır. Dosya yoksa amblemin vektörel yeniden çizimi kullanılır
(`src/logo.js`) — kare ve şeffaf zeminli bir PNG en iyi sonucu verir.

---

## Tasarımı değiştirmek

| Dosya | İçerik |
|---|---|
| `kapaklar.js` | **Metinler.** Normalde sadece burayı açarsın. |
| `src/marka.js` | Renk paleti ve temalar |
| `src/stil.css` | Tasarım sistemi ve düzen kuralları |
| `src/kalip.js` | Düzenlerin HTML yapısı + otomatik sığdırma |
| `src/formul.js` | Matematik dizgi motoru |
| `src/logo.js` | Amblem çizimi |
| `src/render.mjs` | Üretici |
| `src/olc.mjs` | Teşhis: `node src/olc.mjs 04` bir kapağın kutu ölçülerini döker |

Yeni düzen eklemek: `src/kalip.js` içindeki `DUZENLER`'e bir fonksiyon ekle,
`src/stil.css`'e `.d-<ad>` bloğunu yaz. Başka yeri değiştirmen gerekmez.

---

## Tasarım kararları

Küçük boyutta (feed'de kapak ~210 px genişlikte görünür) ayakta kalması için:

- **Tek dominant blok.** Her kapakta gözün gideceği tek bir yer var.
- **Bakır ↔ kemik dönüşümü.** Aynı satırda iki metal yok; kontrast tipografi
  ritmi kurar.
- **Grotesk + serif italik.** Archivo Black'in ağırlığı Playfair italiğin
  zarafetiyle dengelenir — piyasadaki tek fontlu kapaklardan ayıran şey bu.
- **Atmosfer katmanları.** Mühendislik ızgarası, hayalet semboller, ışık
  huzmesi, vinyet ve film greni; hepsi %10'un altında opaklıkta — hissedilir
  ama okunmayı engellemez.
- **Alt bakır şerit.** Her kapakta tekrar eden kimlik çizgisi; kanal
  sayfasında ızgara halinde bakıldığında seri hissi verir.
