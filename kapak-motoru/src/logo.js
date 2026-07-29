/**
 * MATHERA amblemi — vektörel yeniden çizim.
 *
 * Gerçek logo dosyanı `assets/logo.png` olarak koyarsan motor otomatik
 * onu kullanır (bkz. render.mjs → LOGO_DATA_URI). Dosya yoksa bu SVG çizilir.
 */
import { RENK } from './marka.js';

export function amblemSVG(boyut = 96) {
  const id = 'm' + Math.random().toString(36).slice(2, 8);
  return `
<svg width="${boyut}" height="${boyut}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="halka-${id}" x1="18" y1="14" x2="182" y2="188" gradientUnits="userSpaceOnUse">
      <stop offset="0"    stop-color="${RENK.platinIsik}"/>
      <stop offset="0.28" stop-color="${RENK.platinGolge}"/>
      <stop offset="0.50" stop-color="#F4F6F8"/>
      <stop offset="0.74" stop-color="${RENK.platinOrta}"/>
      <stop offset="1"    stop-color="#E6E9ED"/>
    </linearGradient>
    <radialGradient id="disk-${id}" cx="0.38" cy="0.28" r="0.92">
      <stop offset="0"   stop-color="${RENK.laciTepe}"/>
      <stop offset="0.55" stop-color="${RENK.laciOrta}"/>
      <stop offset="1"   stop-color="${RENK.laciSiyah}"/>
    </radialGradient>
    <linearGradient id="yazi-${id}" x1="46" y1="92" x2="154" y2="114" gradientUnits="userSpaceOnUse">
      <stop offset="0"   stop-color="${RENK.bakirIsik}"/>
      <stop offset="0.45" stop-color="${RENK.bakirOrta}"/>
      <stop offset="0.7" stop-color="${RENK.bakirGolge}"/>
      <stop offset="1"   stop-color="${RENK.bakirIsik}"/>
    </linearGradient>
  </defs>

  <circle cx="100" cy="100" r="96" fill="url(#halka-${id})"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="84" fill="url(#disk-${id})"/>
  <circle cx="100" cy="100" r="74" fill="none" stroke="${RENK.bakirGovde}" stroke-width="1.6" opacity="0.85"/>
  <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>

  <text x="100" y="107"
        font-family="Sora, Manrope, sans-serif" font-size="21.5" font-weight="800"
        letter-spacing="1.9" text-anchor="middle" fill="url(#yazi-${id})">MATHERA</text>
</svg>`.trim();
}

/** Kapağın köşesinde duran imza bloğu: amblem + kanal adı. */
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
