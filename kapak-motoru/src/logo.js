/**
 * MATHERA madalyonu — intro videosundaki amblemin vektörel karşılığı.
 *
 * Yapı (dıştan içe):
 *   fırçalanmış çelik halka → kazınmış π/2/3/0/5 işaretleri → iç pah →
 *   lacivert cam disk → ince bakır halka → 3B bakır MATHERA yazısı
 *
 * Gerçek logo dosyanı `assets/logo.png` olarak koyarsan motor onu kullanır.
 */
import { RENK } from './marka.js';

/** Halka üzerindeki kazıma işaretleri — introdaki dizilimin aynısı. */
const KAZIMA = [
  { a: -90, m: 'π' }, { a: -40, m: '3' }, { a: 0, m: '0' },
  { a: 48, m: '5' }, { a: 90, m: 'π' }, { a: 140, m: '2' },
  { a: 180, m: '0' }, { a: -140, m: '2' },
];

export function amblemSVG(boyut = 96, id = 'm' + Math.random().toString(36).slice(2, 8)) {
  // İşaretler dik durur — introda da radyal değil, okunur biçimde kazınmışlar.
  const kazima = KAZIMA.map(({ a, m }) => {
    const r = 89.5;
    const x = 100 + r * Math.cos((a * Math.PI) / 180);
    const y = 100 + r * Math.sin((a * Math.PI) / 180);
    return `<text x="${x.toFixed(1)}" y="${(y + 3.8).toFixed(1)}"
      font-family="Montserrat, sans-serif" font-size="10.5" font-weight="600"
      text-anchor="middle" fill="rgba(34,29,24,0.38)">${m}</text>`;
  }).join('');

  return `
<svg width="${boyut}" height="${boyut}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="celik-${id}" x1="30" y1="14" x2="172" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0"    stop-color="#E8E9EA"/>
      <stop offset="0.16" stop-color="#A9A6A2"/>
      <stop offset="0.34" stop-color="#F2F2F1"/>
      <stop offset="0.52" stop-color="#8B8885"/>
      <stop offset="0.70" stop-color="#D6D4D0"/>
      <stop offset="0.86" stop-color="#78756F"/>
      <stop offset="1"    stop-color="#B6B3AE"/>
    </linearGradient>
    <radialGradient id="disk-${id}" cx="0.34" cy="0.24" r="0.95">
      <stop offset="0"    stop-color="#2B4869"/>
      <stop offset="0.46" stop-color="#1B3350"/>
      <stop offset="1"    stop-color="#0D1E33"/>
    </radialGradient>
    <linearGradient id="bakir-${id}" x1="52" y1="88" x2="150" y2="116" gradientUnits="userSpaceOnUse">
      <stop offset="0"    stop-color="${RENK.bakirIsik}"/>
      <stop offset="0.34" stop-color="${RENK.bakirParlak}"/>
      <stop offset="0.62" stop-color="${RENK.bakirGovde}"/>
      <stop offset="1"    stop-color="${RENK.bakirIsik}"/>
    </linearGradient>
    <linearGradient id="parlama-${id}" x1="40" y1="30" x2="150" y2="150" gradientUnits="userSpaceOnUse">
      <stop offset="0"   stop-color="rgba(255,255,255,0.20)"/>
      <stop offset="0.5" stop-color="rgba(255,255,255,0.03)"/>
      <stop offset="1"   stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>

  <!-- çelik halka -->
  <circle cx="100" cy="100" r="98" fill="url(#celik-${id})"/>
  <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
  ${kazima}

  <!-- iç pah -->
  <circle cx="100" cy="100" r="81" fill="none" stroke="rgba(24,20,16,0.45)" stroke-width="4"/>
  <circle cx="100" cy="100" r="78.5" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1.2"/>

  <!-- lacivert cam disk -->
  <circle cx="100" cy="100" r="78" fill="url(#disk-${id})"/>
  <circle cx="100" cy="100" r="78" fill="url(#parlama-${id})"/>

  <!-- ince bakır halka -->
  <circle cx="100" cy="100" r="68" fill="none" stroke="url(#bakir-${id})" stroke-width="2"/>

  <!-- 3B bakır yazı: önce koyu uzantı, üstüne parlak yüz -->
  <text x="100" y="109.4" font-family="Montserrat, sans-serif" font-size="21.5" font-weight="700"
        letter-spacing="0.7" text-anchor="middle" fill="rgba(46,22,8,0.60)">MATHERA</text>
  <text x="100" y="108" font-family="Montserrat, sans-serif" font-size="21.5" font-weight="700"
        letter-spacing="0.7" text-anchor="middle" fill="url(#bakir-${id})">MATHERA</text>
</svg>`.trim();
}

/** Kapağın köşesindeki imza bloğu: madalyon + kanal adı. */
export function imzaBlogu({ kanal, etiket, logoURI, boyut = 54, sag = false }) {
  const mark = logoURI
    ? `<img class="imza-mark" src="${logoURI}" style="width:${boyut}px;height:${boyut}px"/>`
    : `<span class="imza-mark" style="width:${boyut}px;height:${boyut}px">${amblemSVG(boyut)}</span>`;
  return `
  <div class="imza ${sag ? 'imza--sag' : ''}">
    ${mark}
    <span class="imza-yazi">
      <b>${kanal}</b>
      ${etiket ? `<i>${etiket}</i>` : ''}
    </span>
  </div>`;
}

/** Kapağın kahramanı olarak duran büyük madalyon (gölgesiyle birlikte). */
export function madalyonBlogu({ logoURI, boyut = 400 }) {
  const ic = logoURI
    ? `<img src="${logoURI}" style="width:${boyut}px;height:${boyut}px;border-radius:50%"/>`
    : amblemSVG(boyut);
  return `<div class="madalyon" style="width:${boyut}px;height:${boyut}px">${ic}</div>`;
}
