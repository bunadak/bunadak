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
| Kum bej (banner) | `#DCD3C7` → `#9E9284` |

---

## ANA KALIP — kapak arka planı

```
A premium YouTube thumbnail background for a Turkish mathematics education
channel. Deep navy studio backdrop (#061529 to #1B3F70), lit from the upper
left by a single soft key light that grazes the surface and falls off into
darkness at the lower right.

Floating in the space: brushed copper mathematical symbols ({{SEMBOL}}),
rendered as physical machined metal with a rose-gold finish (#C0824F body,
#F2C79E specular highlights, #8E5A32 shadow tone), shallow bevels, soft
contact shadows. They sit at varying depths with gentle depth-of-field —
sharp in the midground, softly blurred at the edges.

Faint engineering blueprint grid etched into the backdrop, barely visible,
warm copper at 6% opacity. Subtle film grain. Clean negative space across the
left 55% of the frame, reserved for typography — keep it uncluttered.

Cinematic product photography lighting, macro lens character, 16:9,
ultra sharp, no text, no letters, no numbers, no watermark.
```

**Değiştir:** `{{SEMBOL}}` yerine konunun sembolleri.
Limit → `lim, →, 0, ∞` · İntegral → `∫, dx, curves` · Trigonometri →
`sin, cos, θ, circle` · Olasılık → `dice, C(n,r), Σ` · Türev → `f′(x), tangent line`

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
