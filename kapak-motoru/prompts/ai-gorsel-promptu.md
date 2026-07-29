# MATHERA — AI görsel prompt motoru

Bu klasördeki kalıp, **AI görsel üreticileri** (Midjourney, DALL·E, Nano Banana,
Flux, Firefly vb.) için. Kapak motorunun ürettiği HTML kapaklara ek olarak,
arka plan dokusu / tanıtım görseli / sabit intro karesi üretmek istediğinde kullan.

Değiştireceğin tek şey `{{KONU}}` ve `{{SEMBOL}}`. Geri kalanı sabit — marka
tutarlılığı buradan gelir.

---

## Marka renk kodları (prompt içinde birebir kullan)

| Rol | HEX |
|---|---|
| Bakır parlak | `#FFE7D2` |
| Bakır ışık | `#F2C79E` |
| Bakır gövde | `#C0824F` |
| Bakır gölge | `#8E5A32` |
| Lacivert tepe | `#1B3F70` |
| Lacivert dip | `#061529` |
| Platin halka | `#EDEFF2` → `#79828C` |
| Sıva duvar | `#D9D1C6` (ışıklı) → `#9E958B` (gölgeli) |
| Çelik halka | `#F2F2F1` / `#8B8885` / `#78756F` |

---

## ANA KALIP — kapak arka planı (intro dünyası)

```
A premium backdrop for a Turkish mathematics education channel, matching a
brand intro. Warm greige plaster wall (#9E958B in shadow to #D9D1C6 in light),
lit by a single soft key light from the upper right; long gentle falloff into
the lower left. The surface reads as real plaster: fine tooth, subtle
unevenness, no pattern.

Etched into the wall in thin copper linework: an engineering construction
drawing — straight rules, a right-angle bracket, a tangent arc, dimension
lines with end ticks, small nodes at intersections, and sparse engraved
numerals and symbols ({{SEMBOL}}). Warm copper (#8E5A32) at very low contrast,
like a technical drawing scribed into stone.

The left 55% of the frame is deliberately clean and empty, reserved for
typography. Soft realistic shadows, fine grain, gentle vignette at the edges.
Cinematic product photography, 16:9, no text, no letters, no watermark.
```

**Değiştir:** `{{SEMBOL}}` yerine konunun sembolleri.
Sayılar → `1, 2, 5, 0, ÷` · Üslü sayılar → `x², xⁿ` · Köklü sayılar → `√, ∛` ·
Rasyonel → `a/b, fraction bars` · Mutlak değer → `|x|` · EBOB-EKOK → `2, 3, 5, ×`

---

## VARYANT A — kanal banner'ı (banner arka planı)

```
A wide cinematic banner backdrop for a mathematics channel, 2560x1440.
Warm greige plaster wall (#DCD3C7 to #9E9284) lit by a single soft spotlight
from the upper left, long gentle shadows falling to the lower right.
Faint hand-drawn geometry etched into the surface — circles, arcs, a radius
line, isolated numerals — in warm graphite at very low contrast, like chalk
memory on stone.

Center of the frame intentionally clean and empty for a logo. Shallow depth,
soft vignette, fine paper grain. Editorial, restrained, expensive.
No text, no letters, 16:9.
```

---

## VARYANT B — bölüm/seri kapağı (koyu, dramatik)

```
Extreme close-up of a single brushed copper {{SEMBOL}} symbol resting on a
dark graphite surface (#080706), lit by one hard rim light from behind and a
soft fill from the left. The copper reads as forged metal: fine brush grain,
warm rose-gold reflections (#F2C79E), deep shadow in the recesses (#5C3419).
Dust motes catching the light. Background falls to near black on the right,
leaving clean negative space for typography.
Macro product photography, 85mm, shallow depth of field, 16:9, no text.
```

---

## VARYANT C — sabit ses/arka plan karesi

```
A calm, seamless loop-friendly backdrop for a mathematics lecture video.
Deep navy (#061529) gradient field with a warm copper glow low on the left.
A sparse constellation of faint mathematical notation — {{SEMBOL}} — drifting
in soft focus, copper at 8% opacity. Blueprint grid barely perceptible.
Extremely low visual noise: nothing should compete with a talking voice.
16:9, no text, no watermark.
```

---

## Kullanım notları

- **Yazıyı AI'ya bırakma.** Görsel üreticiler Türkçe karakterleri (İ, Ğ, Ş, Ü, Ö, Ç)
  ve matematik notasyonunu bozuk çiziyor. Arka planı AI ile üret, yazıyı kapak
  motoruyla üstüne bas — `assets/` içine koyup `.tuval` arka planı yaparak.
- **"no text, no letters" ibaresini silme.** Silersen üretici uydurma harfler
  ekler ve marka tutarlılığı bozulur.
- **En-boy oranı:** kapak için `--ar 16:9`, banner için `--ar 16:9` (2560×1440
  zaten 16:9). Midjourney'de `--style raw` daha kontrollü sonuç verir.
- **Tutarlılık için** aynı seed'i sabitle; seri videolarda kapaklar akraba görünür.
