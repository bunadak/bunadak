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
| **Temalar** | 7 hazır tema | Kızıl Gece · Gece Mavisi · Buz Mavisi · Bordo · Saf Beyaz + Notis/Aydınlık, canlı vurgu renkleri |
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

## Geliştirme (canlı yeniden yükleme)

```bash
wails dev
```

## Arayüzü tek başına önizleme

`frontend/dist/index.html` dosyasını herhangi bir tarayıcıda açmanız yeterli —
çizim, sayfalar, katmanlar, temalar ve dışa aktarma tam çalışır.
