# -*- coding: utf-8 -*-
"""
MATHERA jeneriklerini üretir.

    python3 yap.py            -> ikisini de üretir
    python3 yap.py intro      -> yalnızca açılış
    python3 yap.py outro      -> yalnızca kapanış

Çıktılar (1920×1080, 60 fps, H.264):
    MATHERA_intro.mp4          sesli açılış jeneriği
    MATHERA_intro_sessiz.mp4   kendi müziğini eklemek istersen
    MATHERA_outro.mp4          sesli kapanış jeneriği
    MATHERA_outro_sessiz.mp4
"""

import os
import subprocess
import sys
import time

import ortak
import ses

FFMPEG = "ffmpeg"


def video_uret(modul, ad, ses_uretici):
    ses_yolu = ad + ".wav"
    ses.wav_yaz(ses_yolu, ses_uretici(modul.SURE))

    cikti = "MATHERA_%s.mp4" % ad
    komut = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "bgr0",
        "-s", "%dx%d" % (ortak.W, ortak.H), "-r", str(ortak.FPS), "-i", "-",
        "-i", ses_yolu,
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-shortest", "-movflags", "+faststart", cikti,
    ]
    p = subprocess.Popen(komut, stdin=subprocess.PIPE)

    t0 = time.time()
    for k in range(modul.KARE_SAYISI):
        yuzey, ctx = ortak.yeni_kare()
        modul.kare_ciz(ctx, k / ortak.FPS)
        p.stdin.write(ortak.kare_baytlari(yuzey, grenlilik=1.5, tohum=k))
        if k % 60 == 0:
            print("  %s: %d/%d kare" % (ad, k, modul.KARE_SAYISI), flush=True)
    p.stdin.close()
    if p.wait() != 0:
        raise SystemExit("ffmpeg hatası: " + ad)

    sessiz = "MATHERA_%s_sessiz.mp4" % ad
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", cikti,
                    "-an", "-c", "copy", "-movflags", "+faststart", sessiz],
                   check=True)
    os.remove(ses_yolu)
    print("  %s tamam (%.1f sn sürdü)" % (cikti, time.time() - t0))


def main():
    hangi = sys.argv[1:] or ["intro", "outro"]
    if "intro" in hangi:
        import intro
        video_uret(intro, "intro", ses.intro_sesi)
    if "outro" in hangi:
        import outro
        video_uret(outro, "outro", ses.outro_sesi)


if __name__ == "__main__":
    main()
