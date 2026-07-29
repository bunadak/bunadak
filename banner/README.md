# MATHERA — YouTube Kanal Banner'ı

Logoya hiç dokunulmadı: harf biçimi, harf aralığı, bakır metal işlemesi ve
madalyon figürü jeneriklerle birebir aynı kaynaktan (`jenerik/ortak.py`)
geliyor. Banner yalnızca logonun etrafına kompozisyon kuruyor.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `MATHERA_banner.png` | **Ana sürüm** — lacivert, jenerik ve madalyonla aynı dil |
| `MATHERA_banner_acik.png` | Açık/krem sürüm — logonun duvardaki hâline yakın |
| `MATHERA_banner_kilavuz.png` | Güvenli alanların işaretli olduğu kontrol görseli (yüklenmez) |

Hepsi 2560 × 1440 PNG, ~600 KB — YouTube'un 6 MB sınırının çok altında.

## Neden 2560 × 1440

YouTube banner'ı her cihazda farklı kırpar:

| Görünüm | Görünen alan |
|---|---|
| TV | 2560 × 1440 (tamamı) |
| Masaüstü | 2560 × 423 |
| Tablet | 1855 × 423 |
| **Telefon (güvenli alan)** | **1546 × 423** |

Logo ve onu çerçeveleyen iki ince hat, tamamı **1546 × 423 güvenli alanın
içinde** kalacak şekilde yerleştirildi — yani telefonda da masaüstünde de
kompozisyon aynı okunur, hiçbir şey kesilmez. Dışarıda kalan bölge sadece
atmosfer taşır; kırpılması sorun değil.

## Kompozisyonda ne var

- **Derinlik**: merkezde canlı lacivert, kenarlara doğru neredeyse siyaha
  inen radyal düşüş + vinyet. Bakırın kendiliğinden parlamasını sağlar.
- **Madalyon yankısı**: sağda ve solda, yarısı kadraj dışında kalan soluk
  halkalar; üzerlerinde kazınmış π ve pi basamakları. Markayı taşır ama
  logoyla yarışmaz.
- **Sıcak ışık**: logonun arkasında amber hale — soğuk zeminle karşıtlık
  kurup yazıyı öne çıkarır.
- **Yansıma**: metale ağırlık veren, güvenli alan bitmeden sönen zemin
  yansıması.
- **Çerçeve**: logoyu saran iki ince bakır hat; alttakinin ortasında küçük
  elmas işareti.

## Yeniden üretme

```bash
cd banner
python3 banner.py
```

Gerekenler: `python3`, `pycairo` ve `jenerik/fonts/` içindeki fontların
sistemde kurulu olması (bkz. `jenerik/README.md`).

## Değiştirmek isteyebileceğin yerler

| Ne | Nerede |
|---|---|
| Logo boyutu | `banner.py` → `LOGO_G` |
| Logonun dikey yeri | `banner.py` → `LOGO_Y` |
| Renkler | `banner.py` → `KOYU` / `ACIK` sözlükleri |
| Yansıma gücü | `banner.py` → paletlerdeki `yansima` |
| Madalyon yankılarının yeri/boyu | `banner.py` → `ciz` içindeki `madalyon_yankisi` çağrıları |
