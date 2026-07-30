# Notis Pro

**Profesyonel dijital defter & çizim stüdyosu** — orijinal Notis uygulamasının
tüm özelliklerini koruyan, arayüzden çizim motoruna kadar baştan sona yükseltilmiş
"pro" sürümü.

Orijinal Notis gibi bu da bir **Go + Wails** masaüstü uygulamasıdır: Go arka
plan koddan, WebView2 içinde çalışan ve doğrudan ikili dosyaya gömülü,
bağımlılıksız (framework/CDN yok) bir HTML/CSS/JS arayüzden oluşur. Windows için
tek bir `Notis.exe` üretir.

---

## Neler yeni (Pro)

| Alan | Orijinal | Pro |
| --- | --- | --- |
| **Çizim motoru** | Sabit/temel kalem | Basınca duyarlı, **değişken kalınlıklı vektörel mürekkep** (`ink.js`): akış, hız, uç koniği, stabilizasyon |
| **Kalem türleri** | — | Dolma kalem, tükenmez, jel, kurşun kalem (grenli), fırça, fosforlu |
| **Arayüz** | Standart | Cam efektli (blur) araç çubukları, bağlamsal araç seçenekleri, animasyonlu paneller |
| **Renk** | Basit seçici | HSV **renk tekerleği**, hex girişi, hızlı swatch'ler, favoriler & paletler |
| **Sayfalar** | Çoklu sayfa | 5 kağıt şablonu (boş/çizgili/kareli/noktalı/izometrik), çoğalt/sil, canlı küçük resimler |
| **Katmanlar** | — | Sınırsız katman, görünürlük, sıralama |
| **Temalar** | Netflix/Disney/… | Aynı temalar + Karanlık/Aydınlık/Mürekkep, canlı vurgu renkleri |
| **Sunum** | Lazer/spot | Sunum çubuğu, lazer işaretçi, spot ışık, sayfa gezinme |
| **Dışa aktarma** | PDF | Çok sayfalı **PDF** + **PNG**, 1×/2×/3× çözünürlük |
| **Kayıt** | — | Otomatik yerel kayıt, kütüphane, `.notis` yedeği |
| **Kısayollar** | — | Tam klavye kısayolları |

## Proje yapısı

```
.
├── main.go               # Wails uygulaması, frontend/dist gömülür
├── app.go                # Go arka plan: kaydet/yükle/listele/dışa aktar
├── go.mod
├── wails.json            # Wails yapı yapılandırması
├── build/
│   ├── appicon.png       # Uygulama ikonu (orijinal marka korundu)
│   └── windows/icon.ico
└── frontend/dist/        # Gömülü arayüz (Node/derleme gerektirmez)
    ├── index.html
    ├── app.css           # Premium arayüz + 8 tema
    ├── ink.js            # Pro mürekkep motoru
    └── app.js            # Uygulama mantığı (araçlar, sayfalar, katman, renk, kayıt, dışa aktarma)
```

## Windows `.exe` derleme

Gereksinimler: **Go 1.23+**, **Wails v2**, ve Windows üzerinde **WebView2 Runtime**
(Windows 11'de hazır gelir).

```bash
# 1) Wails CLI'yi kur
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 2) Bağımlılıkları çöz
go mod tidy

# 3) Windows'ta derle -> build/bin/Notis.exe
wails build

# NSIS kurulum paketi de üretmek için:
wails build -nsis
```

> Not: Bu depo bağımlılıksız statik bir arayüz kullandığından `frontend:build`
> boştur — `npm install` gerekmez. Arayüzü doğrudan tarayıcıda da açabilirsiniz
> (`frontend/dist/index.html`); Go arka plan yoksa kayıt otomatik olarak
> tarayıcı `localStorage`'ına düşer.

### Linux/macOS üzerinden çapraz derleme (Wails CLI olmadan)

Windows arka ucu saf Go olduğundan (CGO yok) `.exe` doğrudan çapraz
derlenebilir. İkon, sürüm bilgisi ve DPI manifesti `winres.json`'dan gömülür:

```bash
go install github.com/tc-hib/go-winres@v0.3.3
go-winres make --in winres.json --arch amd64 --out rsrc   # rsrc_windows_amd64.syso

GOOS=windows GOARCH=amd64 CGO_ENABLED=0 \
  go build -tags desktop,production -ldflags "-w -s -H windowsgui" \
  -o Notis.exe .
```

Sonuç `wails build` çıktısıyla aynıdır: tek dosya, 9 bölümlü PE32+, arayüz
gömülü. Çalıştırmak için Windows'ta **WebView2 Runtime** gerekir (Windows 11'de
hazır gelir).

## Geliştirme (canlı yeniden yükleme)

```bash
wails dev
```

## Arayüzü tek başına önizleme

`frontend/dist/index.html` dosyasını herhangi bir tarayıcıda açmanız yeterli —
çizim, sayfalar, katmanlar, temalar ve dışa aktarma tam çalışır.

---

## v3.0.0 — Gece Modu (tüm uygulama) + Gelişmiş Serbest Çizim Motoru

### 🌙 Gece Modu — tek anahtar, her yer

Önceki sürümdeki "PDF Gece Modu" yalnız belge görünümünde çalışıyor, açılıp
kapanması zamanlayıcılara bağlı olduğu için PDF ↔ tahta geçişlerinde takılıyordu.
Yeniden yazıldı ve kapsamı tüm uygulamaya genişletildi.

**Tasarım ilkesi — "her karede kendini onarır":** durum artık bir zamanlayıcıya
ya da olay dinleyicisine değil, doğrudan çizim hattına bağlı. Her karenin
başında hedef durum yeniden hesaplanıp uygulanıyor. Bu yüzden hangi sırayla ne
yapılırsa yapılsın — PDF aç, tahtaya geç, sayfa çevir, kalem/renk değiştir,
kütüphaneden başka belge aç, geri al — ekrandaki görüntü daima doğru durumdur.

| Kapsam | Davranış |
| --- | --- |
| Çalışma tahtası | Tahta zemini, kâğıt desenleri ve tahta stilleri gece paletine geçer. Zaten koyu olan tahtalara (Kara Tahta, Matematik Tahtası) dokunulmaz. |
| PDF / belge / slayt | Sayfa görseli piksel piksel dönüştürülür. Gri bölgeler (kâğıt, metin, çizgi) parlaklık eğrisiyle yer değiştirir; **renkli bölgeler ton ve doygunluğunu korur** — fotoğraflar ve grafikler negatife dönmez. |
| Zeminsiz sayfalar | Düz beyaz kâğıt da gece tonuna iner (yalnız PDF değil). |
| Arayüz | Tema ve sahne zemini kâğıtla aynı tonu paylaşır. Temayı elle değiştirirsen tercihe karışılmaz. |
| Mürekkep | **Tek yönlü:** koyu çizimler ekranda açılır, açık renkli kalemler (tebeşir beyazı, fosforlu sarı) olduğu gibi kalır. Kaydedilen veri değişmez. |
| Dışa aktarma | PDF/PNG çıktısı ve küçük resimler **daima orijinal** görseli ve renkleri kullanır. |

**Donma yok — ölçülerek çözüldü.** A4 300 dpi (8.7 megapiksel) bir taramada:

1. Sayfa **anında** kararır: küçültülmüş önizleme ana iş parçacığının dışında
   hazırlanır (`createImageBitmap` resize).
2. Tam çözünürlük kare kare, bant bant işlenir — dilim başına ≤ 10 ms.
3. **Kalem ekrandayken tek bir dilim bile çalışmaz.** Çizim, kaydırma,
   yakınlaştırma ve sürükleme sırasında ağır iş tamamen durur; el kalkınca
   kaldığı yerden sürer.
4. Bellek sabittir: yalnız görünür sayfa ve ±2 komşusu saklanır (200 sayfalık
   PDF'te de).

Ölçüm (yazılım oluşturucu, GPU'suz): 6 gerçek kalem darbesi boyunca 100 ms'yi
aşan **tek bir kare yok**; sayfa ~1.6 s'de tam çözünürlüğe oturuyor.

### 🖋️ Gelişmiş Serbest Çizim Motoru

Değişken kalınlıklı çizgi üretimi baştan yazıldı ve **arayüzdeki 5 kalemin,
çarktaki 10 kalemin tamamına** uygulandı.

* **Dirsek yayı** — keskin dönüşlerde kalem ucunun döndüğü gerçek yay hesaplanır;
  iç taraf komşu segmentle sınırlanır. Firkete dönüşlerdeki çentikler ve papyon
  izleri kayboldu.
* **Miter telafisi** — dar açılarda açıortay kısaldığı için çizgi köşede
  inceliyordu; artık kalınlık korunuyor.
* **Uç koniği** — çizginin başı ve sonu **yay uzunluğu boyunca** incelir. Her
  kalemin kendi koni uzunluğu var (dolma uzun, tükenmez kısa, fosforlu yok).
* **Kalem karakter profilleri** — Dolma, Tükenmez ve Kurşun'a kendi
  basınç/hız/incelme karışımları verildi. Dolma kalem artık segment segment
  değil tek dolgu poligonu olarak çiziliyor (basamaklanma bitti); Kurşun'un
  grafit gövdesi basınca tepki veriyor.
* **Çözünürlükten bağımsız** — raylar kuadratik eğriyle kapatılır; 8× ve
  üstü yakınlaştırmada çokgenleşme yok.
* **Sıfır ek maliyet** — tüm ara veri yeniden kullanılan tipli tamponlarda
  tutulur. 400 çizgilik yoğun bir tahtada ölçülen kare süresi: motor kapalı
  498 ms, açık 494 ms.

Ayarlar › Çizim altında kapatılabilir; kapalıyken uygulamanın özgün çizim yolu
birebir geri gelir.
