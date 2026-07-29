# MATHERA — YouTube Jenerikleri

Kanal logosundan (lacivert zemin + bakır MATHERA yazısı ve madalyon)
türetilmiş açılış ve kapanış jenerikleri.

## Çıktılar

| Dosya | Süre | Açıklama |
|---|---|---|
| `MATHERA_intro.mp4` | 6.4 sn | Açılış jeneriği, sesli |
| `MATHERA_intro_sessiz.mp4` | 6.4 sn | Kendi müziğini eklemek istersen |
| `MATHERA_outro.mp4` | 10 sn | Kapanış jeneriği, sesli |
| `MATHERA_outro_sessiz.mp4` | 10 sn | Sessiz sürüm |

Hepsi **1920×1080, 60 fps, H.264 + AAC** — YouTube'un önerdiği formatta.

## Açılış jeneriğinde ne oluyor

1. Boşlukta ince ızgara ve süzülen matematik sembolleri belirir
2. Merkezde geometrik kurulum: nokta → yarıçap → çizilerek tamamlanan bakır çember
3. Fırçalanmış çelik halka yerleşir; üzerine π ve pi'nin basamakları (3 1 4 1 5 9) kazınır
4. MATHERA harfleri madalyonun içinde merkezden dışa doğru açılır
5. Metalin üzerinden speküler ışık geçer
6. Halkalar açılıp dağılırken yazı banner boyutuna büyür
7. Sahne yerleşir ve yumuşakça kararır

## Kapanış jeneriği ve YouTube bitiş ekranı

Kapanışta üç boş çerçeve vardır; bunlar YouTube'un **bitiş ekranı (end screen)**
öğeleri için hazırlanmış yuvalardır:

- **sol** — sonraki video kartı (480 × 270)
- **orta** — abone ol dairesi (çap 236)
- **sağ** — oynatma listesi kartı (480 × 270)

Çerçeveler bilerek boş bırakılmıştır; YouTube Studio'da bitiş ekranı öğelerini
sürükleyip tam bu alanların üzerine bıraktığında çerçeveler kendi küçük
resimlerinle dolar. Ortadaki daireyi saran ince bakır yay videonun kalan
süresini gösterir.

Bitiş ekranı en az 5, en fazla 20 saniye olabilir; 10 saniyelik bu jenerik
tam ortada, güvenli aralıkta kalır.

## Ses

Tüm sesler `ses.py` içinde sentezle üretilir; hazır müzik veya örnek
kullanılmaz, dolayısıyla **telif açısından tamamen serbesttir**.

- Açılış: yükselen hava ve alt bas → logo anında tok vuruş ve Re majör çan
  akoru → büyüme anında ikinci kabarma → uzayan kuyruk (tepe ≈ −2.6 dB)
- Kapanış: yumuşak sıcak pad akoru + hafif çan arpeji, sonda kısılır
  (tepe ≈ −7.4 dB; üzerine konuşma bindirmen için bilerek kısık)

## Yeniden üretme

```bash
cd jenerik
python3 yap.py           # ikisini de üretir
python3 yap.py intro     # yalnızca açılış
python3 yap.py outro     # yalnızca kapanış
```

Logo yazısı `fonts/MatheraWordmark.ttf` ile çizilir — logodaki kalın
geometrik harflerin karşılığı olan Exo 2 (600), fontconfig karışıklığı
olmasın diye kendi aile adıyla kaydedilmiştir.

Gerekenler: `python3`, `ffmpeg`, `pycairo`, `numpy` ve `fonts/` klasöründeki
fontlar (sistemde kurulu olmalı — `fonts/*.ttf` dosyalarını
`/usr/share/fonts/truetype/mathera/` içine kopyalayıp `fc-cache -f` çalıştır).

## Değiştirmek isteyebileceğin yerler

| Ne | Nerede |
|---|---|
| Teşekkür metni | `outro.py` → `TESEKKUR` |
| Kart/daire etiketleri | `outro.py` → `kare_ciz` içindeki `alt_yazi` çağrıları |
| Süreler | `intro.py` / `outro.py` → `SURE` ve evre zamanları |
| Renkler (bakır, çelik, lacivert) | `ortak.py` → `BAKIR`, `CELIK`, `BG_*` |
| Bitiş ekranı yuvalarının yeri | `outro.py` → `SOL_X`, `SAG_X`, `SATIR_Y`, `DAIRE_R` |
