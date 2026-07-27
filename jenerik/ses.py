# -*- coding: utf-8 -*-
"""
MATHERA jenerikleri — ses tasarımı.

Tüm sesler burada sentezle üretilir; hazır müzik/örnek kullanılmaz,
dolayısıyla telif açısından tamamen serbesttir.

Açılış : yükselen hava + alt bas → logo anında tok vuruş ve çan akoru →
         büyüme anında ikinci kabarma → uzayan kuyruk
Kapanış: yumuşak sıcak pad akoru + hafif çan arpeji, sonda kısılır
"""

import wave

import numpy as np

SR = 48000


# ---------------------------------------------------------------- yardımcılar

def zaman(sure):
    return np.arange(int(sure * SR)) / SR


def zarf_ad(n, atak, sonum, guc=2.0):
    """Atak + üstel sönüm zarfı."""
    t = np.arange(n) / SR
    a = np.clip(t / max(atak, 1e-4), 0, 1) ** 0.6
    d = np.exp(-t / max(sonum, 1e-4)) ** guc
    return a * d


def yerlestir(hedef, ses, baslangic):
    """Sesi ana tampona verilen saniyeden itibaren ekler."""
    i = int(baslangic * SR)
    n = min(len(ses), len(hedef) - i)
    if n > 0:
        hedef[i:i + n] += ses[:n]


def hareketli_ortalama(x, k):
    """cumsum tabanlı hızlı alçak geçiren."""
    if k < 2:
        return x
    c = np.cumsum(np.insert(x, 0, 0.0))
    y = (c[k:] - c[:-k]) / k
    return np.concatenate([y, np.full(len(x) - len(y), y[-1] if len(y) else 0.0)])


def can(frekans, sure, parlaklik=1.0):
    """Katkısal sentezle çan/tınlama sesi."""
    n = int(sure * SR)
    t = np.arange(n) / SR
    ses = np.zeros(n)
    katlar = [(1.00, 1.00, 1.00), (2.01, 0.42, 0.72), (3.02, 0.26, 0.55),
              (4.21, 0.15, 0.40), (5.43, 0.09, 0.30), (6.79, 0.05, 0.22)]
    for oran, genlik, sonum in katlar:
        f = frekans * oran
        if f > SR * 0.45:
            continue
        ses += genlik * parlaklik * np.sin(2 * np.pi * f * t) * \
            np.exp(-t / (sure * 0.42 * sonum))
    return ses * zarf_ad(n, 0.004, sure * 0.5, 0.8)


def alt_vurus(sure=0.9, f0=120.0, f1=42.0):
    """Logo anındaki tok alt bas vuruşu."""
    n = int(sure * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 14)
    faz = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(faz) * np.exp(-t * 4.2)


def yukselen(sure):
    """Hava akımı benzeri kabaran gürültü (parlaklığı zamanla artar)."""
    n = int(sure * SR)
    rnd = np.random.default_rng(4)
    g = rnd.normal(0, 1, n)
    koyu = hareketli_ortalama(g, 220)
    orta = hareketli_ortalama(g, 40)
    parlak = g - hareketli_ortalama(g, 8)
    u = np.linspace(0, 1, n) ** 1.6
    karisim = (1 - u) ** 2 * koyu * 6.0 + 2 * u * (1 - u) * orta * 2.4 + u ** 2 * parlak * 0.55
    return karisim * (np.linspace(0, 1, n) ** 2.4)


def yankilandir(x, sure=1.5, sonum=3.2, karisim=0.28):
    """FFT konvolüsyonlu basit yankı — sese mekân hissi verir."""
    n_ir = int(sure * SR)
    rnd = np.random.default_rng(9)
    t = np.arange(n_ir) / SR
    ir = rnd.normal(0, 1, n_ir) * np.exp(-t * sonum)
    ir = hareketli_ortalama(ir, 6)
    ir[:int(0.012 * SR)] = 0.0                 # ön gecikme
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9

    n = len(x) + n_ir - 1
    nfft = 1 << (n - 1).bit_length()
    islak = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft))[:len(x)]
    return (1 - karisim) * x + karisim * islak


def bitir(sol, sag, hedef_tepe=0.72):
    """Yumuşak sınırlama + normalizasyon + WAV için 16 bit'e çevirme."""
    s = np.stack([sol, sag], axis=1)
    s = np.tanh(s * 1.15) / np.tanh(1.15)
    tepe = np.max(np.abs(s)) + 1e-9
    s = s / tepe * hedef_tepe
    return (s * 32767).astype(np.int16)


def wav_yaz(yol, veri):
    with wave.open(yol, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(veri.tobytes())


# ---------------------------------------------------------------- açılış

def intro_sesi(sure=6.4):
    n = int(sure * SR)
    ana = np.zeros(n)

    VURUS = 2.42          # logonun belirdiği an
    BUYUME = 4.15         # halkaların açılıp yazının büyüdüğü an

    # 1) yükselen hava
    yerlestir(ana, yukselen(VURUS + 0.06) * 0.30, 0.0)

    # 2) yükselen alt bas
    t = zaman(VURUS)
    f = 42 + 46 * (t / VURUS) ** 2
    faz = 2 * np.pi * np.cumsum(f) / SR
    yerlestir(ana, np.sin(faz) * (t / VURUS) ** 2.2 * 0.32, 0.0)

    # 3) vuruş
    yerlestir(ana, alt_vurus(1.1) * 0.85, VURUS)

    # 4) çan akoru (Re majör) — logo ile birlikte
    akor = [(146.83, 0.30), (220.00, 0.26), (293.66, 0.34),
            (369.99, 0.24), (440.00, 0.20), (587.33, 0.13)]
    for i, (frk, g) in enumerate(akor):
        yerlestir(ana, can(frk, sure - VURUS, 0.9) * g, VURUS + i * 0.012)

    # 5) büyüme anında ikinci kabarma + üst parıltı
    yerlestir(ana, yukselen(1.05) * 0.16, BUYUME - 0.75)
    for frk, g in [(880.0, 0.08), (1174.7, 0.06), (1318.5, 0.04)]:
        yerlestir(ana, can(frk, 2.0, 1.1) * g, BUYUME)

    ana = yankilandir(ana, 1.6, 3.0, 0.30)

    # stereo: hafif genişlik
    gecikme = int(0.008 * SR)
    sol = ana.copy()
    sag = np.concatenate([np.zeros(gecikme), ana[:-gecikme]]) * 0.97 + ana * 0.03

    # kapanışta kısılma
    kis = np.ones(n)
    b = int(6.00 * SR)
    kis[b:] = np.linspace(1, 0, n - b) ** 1.5
    return bitir(sol * kis, sag * kis, 0.72)


# ---------------------------------------------------------------- kapanış

def outro_sesi(sure=10.0):
    n = int(sure * SR)
    t = np.arange(n) / SR
    ana = np.zeros(n)

    # 1) sıcak pad akoru (hafif detune ile canlı)
    akor = [(146.83, 0.20), (220.00, 0.17), (293.66, 0.15),
            (369.99, 0.11), (440.00, 0.08)]
    giris = np.clip(t / 1.6, 0, 1) ** 1.4
    salinim = 1.0 + 0.05 * np.sin(2 * np.pi * 0.18 * t)
    for frk, g in akor:
        for kayma in (-0.6, 0.0, 0.7):
            ses = np.sin(2 * np.pi * (frk + kayma) * t)
            ses += 0.22 * np.sin(2 * np.pi * (frk + kayma) * 2 * t)
            ana += ses * g / 3.0 * giris * salinim

    # 2) çan arpeji — açılıştaki akorla aynı aile
    for gecikme, frk, g in [(0.35, 587.33, 0.16), (0.85, 739.99, 0.13),
                            (1.35, 880.00, 0.11), (2.10, 1174.66, 0.07)]:
        yerlestir(ana, can(frk, 3.2, 1.0) * g, gecikme)

    ana = yankilandir(ana, 2.0, 2.4, 0.34)

    gecikme = int(0.011 * SR)
    sol = ana.copy()
    sag = np.concatenate([np.zeros(gecikme), ana[:-gecikme]]) * 0.96 + ana * 0.04

    # sonda yumuşak kısılma
    kis = np.ones(n)
    b = int(8.60 * SR)
    kis[b:] = np.linspace(1, 0, n - b) ** 1.3
    return bitir(sol * kis, sag * kis, 0.42)


if __name__ == "__main__":
    wav_yaz("intro.wav", intro_sesi())
    wav_yaz("outro.wav", outro_sesi())
    print("Ses dosyaları üretildi.")
