/**
 * Mini matematik dizgi motoru.
 * LaTeX kurmadan, kapaklarda düzgün görünen formüller üretir.
 *
 * SÖZDİZİMİ (kapaklar.js içinde `formul:` alanına yazılır)
 * ──────────────────────────────────────────────────────────
 *   [pay]/[payda]     dikey kesir      →  [sin x]/[x]
 *   lim_{x→0}         limit (alt satır)→  lim_{x→0} [sin x]/[x] = 1
 *   ∫_{a}^{b}         alt/üst sınırlı integral
 *   x^{2}  veya x^2   üst simge
 *   a_{n}  veya a_1   alt simge
 *   ~                 ince boşluk
 *
 * ÖRNEKLER
 *   'lim_{x→0} [sin x]/[x] = 1'
 *   '∫_{a}^{b} f(x)~dx = F(b) − F(a)'
 *   'f~′(x) = lim_{h→0} [f(x+h) − f(x)]/[h]'
 *   'x = [−b ± √(b^2 − 4ac)]/[2a]'
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

export function dizgi(kaynak = '') {
  let s = esc(kaynak);

  // 1) Sınırlı operatörler: ∫_{a}^{b}, ∑_{n=1}^{∞}
  s = s.replace(/([∫∑∏⋃⋂])_\{([^}]*)\}\^\{([^}]*)\}/g,
    (_, op, alt, ust) =>
      `<span class="op-sinir"><i class="ust">${ust}</i><b class="op">${op}</b><i class="alt">${alt}</i></span>`);

  // 2) lim / max / min / sup / inf — alt satıra inen sınır
  s = s.replace(/\b(lim|max|min|sup|inf)_\{([^}]*)\}/g,
    (_, ad, alt) => `<span class="op-yigin"><b>${ad}</b><i>${alt}</i></span>`);

  // 3) Dikey kesir: [pay]/[payda]
  s = s.replace(/\[([^\[\]]*)\]\s*\/\s*\[([^\[\]]*)\]/g,
    (_, pay, payda) => `<span class="kesir"><i>${pay}</i><b>${payda}</b></span>`);

  // 4) Üst / alt simge  (süslü parantezli ve tek karakterli biçim)
  s = s.replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>')
       .replace(/\^([A-Za-z0-9+\-−])/g, '<sup>$1</sup>')
       .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>')
       .replace(/_([A-Za-z0-9+\-−])/g, '<sub>$1</sub>');

  // 5) İnce boşluk
  s = s.replace(/~/g, '<span class="ince-bosluk"></span>');

  // 6) Elle satır kırma
  s = s.replace(/\n/g, '<br>');

  return s;
}

/** Formülün "ağırlığını" kabaca ölçer — punto ön ayarı için. */
export function agirlik(kaynak = '') {
  return kaynak.replace(/[\[\]{}^_~]/g, '').length;
}
