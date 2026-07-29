/**
 * Teknik çizim katmanı — intro videosundaki ince bakır blueprint linework.
 *
 * Elle kompoze edildi (rastgele değil). İki bölge bilinçli olarak boş bırakıldı:
 *   • sol blok (x < 700)      → konu metni oturur
 *   • sağ üst köşe (y < 120)  → bölüm rozeti oturur
 *   • sol alt köşe (y > 590)  → kanal imzası oturur
 * Tuval koordinatları 1280×720 üzerinden.
 */

const C = 'rgba(122,88,56,0.30)';   // ana çizgi
const CI = 'rgba(122,88,56,0.15)';  // ikincil çizgi
const Y = 'rgba(96,72,50,0.32)';    // rakam / sembol

export function cizimSVG(w = 1280, h = 720) {
  return `
<svg class="cizim" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="none" stroke="${CI}" stroke-width="1">
    <!-- yapı ızgarası: sadece sağ yarıda -->
    <path d="M700 152 H1280 M700 578 H1280"/>
    <path d="M772 0 V720 M1180 0 V720"/>
  </g>

  <g fill="none" stroke="${C}" stroke-width="1.15">
    <!-- sağ üst: dik açı konstrüksiyonu (rozetin altında kalır) -->
    <path d="M812 168 H1160 V286"/>
    <path d="M812 168 V262 H960"/>
    <path d="M960 262 L1112 168"/>
    <!-- ölçü çizgisi -->
    <path d="M836 200 H928 M836 194 V206 M928 194 V206"/>

    <!-- sağ alt: yay + teğet -->
    <path d="M1000 520 a92 92 0 0 1 160 -32"/>
    <path d="M1000 520 L1160 488"/>
    <path d="M1080 458 V566"/>

    <!-- alt orta: küçük eksen takımı -->
    <path d="M700 644 H852 M700 644 V566"/>
    <path d="M744 644 V630 M792 644 V630 M840 644 V630"/>
  </g>

  <!-- kesikli yardımcı çizgiler -->
  <g fill="none" stroke="${CI}" stroke-width="1" stroke-dasharray="5 7">
    <path d="M772 262 H1280"/>
    <path d="M700 578 H1180"/>
  </g>

  <!-- düğüm noktaları -->
  <g fill="none" stroke="${C}" stroke-width="1.15">
    <circle cx="812"  cy="168" r="4.5"/>
    <circle cx="960"  cy="262" r="4.5"/>
    <circle cx="1160" cy="286" r="4.5"/>
    <circle cx="1080" cy="458" r="4.5"/>
    <circle cx="700"  cy="644" r="4.5"/>
  </g>

  <!-- kazınmış rakam ve semboller -->
  <g fill="${Y}" font-family="Montserrat, sans-serif" font-size="21" font-weight="600">
    <text x="1206" y="228">2</text>
    <text x="782"  y="308">5</text>
    <text x="1214" y="418">1</text>
    <text x="864"  y="688">3</text>
    <text x="1124" y="628">0</text>
  </g>
  <g fill="${Y}" font-family="Playfair, serif" font-style="italic" font-size="25">
    <text x="1120" y="212">π</text>
    <text x="716"  y="212">√</text>
    <text x="952"  y="632">Δ</text>
    <text x="1228" y="530">x²</text>
  </g>
  <g fill="none" stroke="${Y}" stroke-width="1.15">
    <rect x="1178" y="452" width="13" height="13"/>
    <rect x="908"  y="676" width="13" height="13"/>
  </g>
</svg>`.trim();
}
