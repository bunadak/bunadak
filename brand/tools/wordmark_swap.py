#!/usr/bin/env python3
"""
Madalyondaki mevcut altın MATHERA yazısını temizler ve yerine referans
ekran alıntısındaki bakır wordmark'ı alfa kanallı olarak yerleştirir.

Girdi : brand/kaynak/madalyon-orijinal.webp
        brand/kaynak/wordmark-orijinal.png
Çıktı : brand/mathera-logo.png (+800px), brand/mathera-madalyon-bos.png

Adımlar
  1. Madalyonun geometrisini altın halkaya çember uydurarak ölç.
  2. Mevcut yazıyı + gölgesini maskele.
  3. Krem yüzeyi 3. derece polinomla modelleyip maskeyi doldur (grain dahil).
  4. Wordmark'ın lacivert zeminini R-B kanalıyla anahtarlayıp alfa üret,
     zemin rengini geri çarpımdan arındır (fringe temizliği).
  5. Ölçekle, hafif keskinleştir, yumuşak gölgeyle birleştir.
"""

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = "/home/user/bunadak/brand"
MEDALLION = f"{ROOT}/kaynak/madalyon-orijinal.webp"
WORDMARK = f"{ROOT}/kaynak/wordmark-orijinal.png"


# --------------------------------------------------------------- geometri
def fit_circle(ys, xs):
    """Kasa cebirsel çember uydurma: x^2+y^2 + Dx + Ey + F = 0"""
    A = np.c_[xs, ys, np.ones(len(xs))]
    D, E, F = np.linalg.lstsq(A, -(xs**2 + ys**2), rcond=None)[0]
    cx, cy = -D / 2, -E / 2
    return cx, cy, np.sqrt(cx * cx + cy * cy - F)


def medallion_geometry(img):
    """Altın halkaya çember uydurarak merkez ve halka yarıçapını bul."""
    a = np.asarray(img, dtype=float)
    h, w, _ = a.shape
    gold = ((a[..., 0] - a[..., 2]) > 55) & (a[..., 0] > 140)
    cx, cy = w / 2, h / 2
    for _ in range(6):
        yy, xx = np.mgrid[0:h, 0:w]
        r = np.hypot(xx - cx, yy - cy)
        band = gold & (r > 340) & (r < 460)
        ys, xs = np.nonzero(band)
        cx, cy, R = fit_circle(ys.astype(float), xs.astype(float))
    return cx, cy, R, gold


# ------------------------------------------------------- yazıyı kaldırma
def poly_basis(x, y, deg=3):
    """(x,y) için deg dereceli 2B polinom tasarım matrisi."""
    cols = [x**i * y**j for i in range(deg + 1) for j in range(deg + 1 - i)]
    return np.stack(cols, axis=-1)


def remove_old_text(arr, cx, cy, ring_R, gold):
    """
    Krem yüzeydeki altın yazıyı ve gölgesini kaldır.
    Yüzeyi düzgün bir polinomla modelleyip maskelenen bölgeyi doldurur,
    ardından ölçülen grain'i geri ekler ki yama 'bulanık leke' gibi durmasın.
    """
    out = arr.copy()
    h, w, _ = arr.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx - cx, yy - cy)

    inner = r < ring_R - 10           # sadece krem yüzey; altın halkaya dokunma
    text = gold & (r < ring_R - 30)
    mask = ndi.binary_dilation(text, iterations=9) & inner

    # normalize koordinatlar (polinom koşullandırması için)
    nx = (xx - cx) / ring_R
    ny = (yy - cy) / ring_R

    # Gölge/parlama araması yalnızca yazının yakın çevresinde yapılır;
    # yüzeyin geri kalanı orijinal pikselleriyle korunur.
    near_text = ndi.binary_dilation(text, iterations=45) & inner

    fill = mask.copy()
    for _ in range(2):
        known = inner & ~fill
        Ak = poly_basis(nx[known], ny[known])
        model = np.zeros_like(arr)
        Aall = poly_basis(nx[inner], ny[inner])
        resid_std = []
        for c in range(3):
            coef = np.linalg.lstsq(Ak, arr[..., c][known], rcond=None)[0]
            model[..., c][inner] = Aall @ coef
            resid_std.append(float(np.std(arr[..., c][known] - model[..., c][known])))
        # yazının gölgesi: modelden belirgin koyu sapma
        dev = (arr - model).mean(axis=2)
        outlier = near_text & (dev < -2.5)
        fill = ndi.binary_dilation(mask | outlier, iterations=3) & inner

    rng = np.random.default_rng(7)
    for c in range(3):
        noise = rng.normal(0.0, max(resid_std[c] * 0.7, 0.4), size=fill.sum())
        out[..., c][fill] = model[..., c][fill] + noise
    return np.clip(out, 0, 255), fill


# ------------------------------------------------- wordmark alfa matlama
def key_wordmark(img):
    """
    Lacivert zemini R-B kanalıyla anahtarla. Bakır harfler (koyu bevel
    kenarları dahil) R-B'de güçlü pozitif, lacivert zemin güçlü negatif,
    dolayısıyla parlaklık eşiğinden çok daha temiz ayrışır.
    Zemin rengini geri çarpımdan arındırarak mavi saçağı yok eder.
    """
    a = np.asarray(img.convert("RGB"), dtype=float)
    m = a[..., 0] - a[..., 2]

    border = np.concatenate([a[0, :], a[-1, :], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)

    alpha = np.clip((m - 2.0) / 23.0, 0.0, 1.0)
    # izole tek piksel gürültüsünü at
    solid = ndi.binary_opening(alpha > 0.5, structure=np.ones((2, 2)))
    alpha[(alpha > 0.5) & ~ndi.binary_dilation(solid, iterations=2)] = 0.0

    # P = a*F + (1-a)*BG  ->  F = (P - (1-a)*BG) / a
    ad = np.maximum(alpha, 0.15)[..., None]
    F = np.clip((a - (1 - alpha)[..., None] * bg) / ad, 0, 255)

    rgba = np.dstack([F, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def resize_premultiplied(rgba, nw, nh, blur=0.0, sharpen=None):
    """
    Ön-çarpımlı (premultiplied) ölçekleme + merdiven giderme.

    İki ayrı sorunu birlikte çözer:

    * Alfa'dan bağımsız ölçeklenen RGB, saydam bölgelerdeki anlamsız renkleri
      kenara taşır ve keskinleştirme bunu noktalı halo'ya çevirir. Renk
      kanallarını alfa ile çarpıp ölçekleyip sonra geri bölmek bunu engeller.
    * Kaynaktaki 1 px'lik bevel parlaklığı çapraz kenarlarda merdiven yapar;
      1.9x büyütmede diş diş görünür. Önce yumuşatıp sonra geri keskinleştirmek
      dişleri siler ama bevel tanımını korur.
    """
    a = np.asarray(rgba, dtype=float)
    al = a[..., 3:4] / 255.0
    pm = np.dstack([a[..., :3] * al, a[..., 3]])
    im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), "RGBA")
    im = im.resize((nw, nh), Image.LANCZOS)

    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))

    if sharpen:
        radius, percent, threshold = sharpen
        rgb = Image.merge("RGB", im.split()[:3]).filter(
            ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=threshold)
        )
        im = Image.merge("RGBA", rgb.split() + (im.split()[3],))

    b = np.asarray(im, dtype=float)
    al2 = b[..., 3:4] / 255.0
    rgb = np.where(al2 > 0.004, b[..., :3] / np.maximum(al2, 0.004), 0.0)
    out = np.dstack([np.clip(rgb, 0, 255), b[..., 3]])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def ink_bbox(rgba):
    al = np.asarray(rgba)[..., 3]
    ys, xs = np.nonzero(al > 24)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


# ---------------------------------------------------------------- birleştir
def main():
    med = Image.open(MEDALLION).convert("RGB")
    arr = np.asarray(med, dtype=float)
    cx, cy, ring_R, gold = medallion_geometry(med)
    print(f"merkez=({cx:.1f},{cy:.1f})  altin halka R={ring_R:.1f}")

    # mevcut yazının yerleşimi (hedef kutu)
    yy, xx = np.mgrid[0 : arr.shape[0], 0 : arr.shape[1]]
    r = np.hypot(xx - cx, yy - cy)
    ty, tx = np.nonzero(gold & (r < ring_R - 30))
    tgt_w = tx.max() - tx.min() + 1
    tgt_cx, tgt_cy = (tx.min() + tx.max()) / 2, (ty.min() + ty.max()) / 2
    print(f"eski yazi: {tgt_w}x{ty.max()-ty.min()+1} @ ({tgt_cx:.1f},{tgt_cy:.1f})")

    cleaned, filled = remove_old_text(arr, cx, cy, ring_R, gold)
    print(f"doldurulan piksel: {int(filled.sum())}")
    base = Image.fromarray(cleaned.astype(np.uint8), "RGB")
    base.save(f"{ROOT}/mathera-madalyon-bos.png")   # yazısız temiz plaka

    # wordmark'ı anahtarla ve ölçekle
    wm = key_wordmark(Image.open(WORDMARK))
    x0, y0, x1, y1 = ink_bbox(wm)
    wm = wm.crop((x0, y0, x1, y1))
    iw, ih = wm.size
    scale = tgt_w / iw
    nw, nh = round(iw * scale), round(ih * scale)
    wm = resize_premultiplied(wm, nw, nh, blur=1.3, sharpen=(3.0, 60, 0))
    print(f"wordmark ink {iw}x{ih} -> {nw}x{nh}  (x{scale:.3f})")

    px, py = round(tgt_cx - nw / 2), round(tgt_cy - nh / 2)

    # kabartma hissi için yumuşak gölge
    sh = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sh.paste((61, 44, 30, 255), (px + 3, py + 5), wm.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(5.0))
    sh.putalpha(sh.split()[3].point(lambda v: int(v * 0.30)))

    comp = base.convert("RGBA")
    comp.alpha_composite(sh)
    comp.alpha_composite(wm, (px, py))
    final = comp.convert("RGB")

    # inceleme için wordmark bölgesinin 2x kırpımı
    SP = "/tmp/claude-0/-home-user-bunadak/d3c599fa-b7d6-5d8a-89bb-fc3817f44bff/scratchpad"
    cr = final.crop((px - 20, py - 30, px + nw + 20, py + nh + 40))
    cr.resize((cr.width * 2, cr.height * 2), Image.LANCZOS).save(f"{SP}/wm-crop.png")

    final.save(f"{ROOT}/mathera-logo.png")
    final.resize((800, 800), Image.LANCZOS).save(f"{ROOT}/mathera-logo-800.png")
    print("yazildi: mathera-logo.png, mathera-logo-800.png")


if __name__ == "__main__":
    main()
