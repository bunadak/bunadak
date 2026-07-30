# MATHERA — marka varlıkları

Madalyon logo, vektör (SVG) olarak sıfırdan çizildi. Hiçbir harf dış fontla
bağlı değil — tüm harfler ve gravür glifler (`π 2 3 0 5`) path olarak
tanımlıdır, dolayısıyla her sistemde birebir aynı görünür.

## Dosyalar

| Dosya | Kullanım |
|---|---|
| `mathera-medallion.svg` | Krem yüzeyli versiyon (orijinal renk şeması) |
| `mathera-medallion-dark.svg` | Lacivert yüzeyli versiyon — daha yüksek kontrast |
| `mathera-medallion.png` | 1000×1000 render |
| `mathera-medallion-dark.png` | 1000×1000 render |

## Yapı

SVG 1000×1000 viewBox kullanır, madalyon merkezi `(500,500)`, dış yarıçap `380`.

- Gümüş halka: `r 294 → 380`
- Gravür glifler: `r 342`, 45° aralıkla 8 pozisyon
- Altın iç halka: `r 281`
- Wordmark: yerel `782×100` koordinat sisteminde, `0.665` ölçekle yerleştirilir

## Renk / yazı değiştirme

Wordmark rengi tek yerde tanımlı — `<linearGradient id="copper">` stop'ları.
Yüzey rengi `<radialGradient id="face">`, gümüş halka `id="silver"`,
altın halka `id="gold"`.

Harf kabartması `<filter id="bevel">` içindeki `surfaceScale` ve
`specularConstant` ile ayarlanır.

## PNG üretme

```bash
export NODE_PATH=/opt/node22/lib/node_modules
node -e '
const { chromium } = require("playwright"); const fs = require("fs");
(async () => {
  const b = await chromium.launch();
  const size = 800;                     // istenen çıktı boyutu
  const name = "mathera-medallion-dark"; // istenen varyant
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<body style="margin:0">${
    fs.readFileSync(`brand/${name}.svg`, "utf8")
      .replace(/width="1000" height="1000"/, `width="${size}" height="${size}"`)
  }</body>`);
  await p.screenshot({ path: `brand/${name}-${size}.png` });
  await b.close();
})();'
```

## Not: YouTube avatarı

Bu madalyon **banner, video introsu, watermark ve sosyal medya** için
tasarlandı. YouTube profil fotoğrafı olarak 7 harfli wordmark 24–36 px'te
okunmaz; avatar için ayrı, basitleştirilmiş bir işaret (tek `M` + `π`)
gerekir.
