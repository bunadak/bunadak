# MATHERA — marka varlıkları

Madalyondaki mevcut altın `MATHERA` yazısı kaldırılıp yerine referans ekran
alıntısındaki bakır wordmark yerleştirildi. Harfler yeniden çizilmedi —
kaynak görselin **gerçek pikselleri** kullanıldı, dolayısıyla harf formları
(E'nin kısa ayrık orta kolu, A'ların üçgen çentiği, bevel kabartması)
birebir korundu.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `mathera-logo.png` | Nihai logo, 1254×1254 |
| `mathera-logo-800.png` | 800×800 (YouTube minimum avatar boyutu) |
| `mathera-madalyon-bos.png` | Yazısız temiz plaka — başka bir yazı denemek için |
| `kaynak/madalyon-orijinal.webp` | Girdi: orijinal madalyon |
| `kaynak/wordmark-orijinal.png` | Girdi: referans wordmark (379×71) |
| `tools/wordmark_swap.py` | Tüm işi yapan betik |

Yeniden üretmek için: `python3 brand/tools/wordmark_swap.py`
(gereksinimler: `pillow`, `numpy`, `scipy`)

## Ölçülen geometri

Betik bunları varsaymaz, altın halkaya çember uydurarak ölçer:

- Madalyon merkezi: `(633.6, 627.0)`
- Altın halka yarıçapı: `396.1 px`
- Eski yazının kutusu: `712×116 px`, merkez `(635.5, 628.5)`

Yeni wordmark eski yazının **genişliğine** oturtuldu (712 px). Yüksekliğe
oturtmak 806 px genişlik gerektiriyordu; bu da altın halkayı keserdi.

## Yöntem

1. **Geometri** — altın halka piksellerine Kasa cebirsel çember uydurma,
   6 iterasyon.
2. **Yazıyı kaldırma** — krem yüzey 3. derece 2B polinomla modellenir,
   maskelenen bölge modelden doldurulur. Ölçülen artık standart sapma kadar
   gauss gürültüsü geri eklenir, yoksa yama "bulanık leke" gibi durur.
   Gölge araması yalnızca yazının 45 px çevresinde yapılır; yüzeyin geri
   kalanı orijinal pikselleriyle kalır.
3. **Wordmark anahtarlama** — lacivert zemin `R−B` kanalıyla ayrılır.
   Parlaklık eşiğinden çok daha temiz: bakır harflerin koyu bevel kenarları
   bile `R−B`'de güçlü pozitif, zemin güçlü negatiftir. Ardından
   `F = (P − (1−a)·BG) / a` ile zemin rengi geri çarpımdan arındırılır,
   böylece mavi saçak kalmaz.
4. **Ölçekleme** — ön-çarpımlı (premultiplied) LANCZOS. Alfa'dan bağımsız
   ölçeklenen RGB, saydam bölgelerin anlamsız renklerini kenara taşır.

## Bilinen sınır: çözünürlük

Kaynak wordmark yalnızca **375×55 px** mürekkep alanına sahip, hedef ise
712 px genişlik — yani **1.9x büyütme** gerekiyor. Kaynaktaki 1 px'lik bevel
parlaklığı çapraz kenarlarda merdiven yapıyor ve büyütmede diş diş
görünüyordu. Çözüm: `blur=1.3` ardından `UnsharpMask(radius=3, percent=60)`
— dişler siliniyor, bevel tanımı korunuyor. Medyan filtre ve farklı
enterpolasyonlar denendi, işe yaramadı; sorun kaynaktaki merdivenin
kendisiydi.

Wordmark'ın **yüksek çözünürlüklü hali** bulunursa `kaynak/` içine koyup
betiği yeniden çalıştırmak yeterli — sonuç belirgin şekilde netleşir.

## Not: YouTube avatarı

Bu logo **banner, video introsu, watermark ve sosyal medya** için uygundur.
YouTube profil fotoğrafı olarak 7 harfli wordmark 24–36 px'te okunmaz;
avatar için ayrı, basitleştirilmiş bir işaret gerekir.
