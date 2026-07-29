/**
 * MATHERA — Marka Çekirdeği
 * -------------------------------------------------------------
 * Bu dosyadaki renkler kanal logosundan ve banner'ından türetildi:
 *   • Logo iç dairesi  → derin lacivert
 *   • Logo dış halkası → platin/gümüş
 *   • Banner yazısı    → dövme bakır / rose-gold metal
 *   • Banner zemini    → sıcak greige (kum bej)
 *
 * Burayı normalde ELLEMEZSİN. Metin değiştirmek için ../kapaklar.js
 * -------------------------------------------------------------
 */

export const RENK = {
  // — Bakır metal rampası (banner yazısının ışık-gölge geçişi)
  bakirParlak: '#FFE7D2',
  bakirIsik: '#F2C79E',
  bakirOrta: '#D9A273',
  bakirGovde: '#C0824F',
  bakirGolge: '#8E5A32',
  bakirDip: '#5C3419',

  // — Lacivert (logo iç dairesi)
  laciTepe: '#1B3F70',
  laciOrta: '#0E2749',
  laciDip: '#061529',
  laciSiyah: '#03101F',

  // — Platin halka
  platinIsik: '#EDEFF2',
  platinOrta: '#AEB6BF',
  platinGolge: '#79828C',

  // — Banner zemini (sıcak greige)
  kumIsik: '#DCD3C7',
  kumOrta: '#C4B9AB',
  kumGolge: '#9E9284',

  // — Nötrler
  beyaz: '#FFF8F1',
  sis: 'rgba(255,248,241,0.62)',
};

/** Tema paletleri — kapaklar.js içinde `tema:` ile seçilir. */
export const TEMA = {
  // ANA TEMA — intro videosunun birebir devamı.
  // Sıcak sıva duvar, sağ üstten gelen tek yumuşak ışık, bakır teknik çizim.
  siva: {
    zemin1: '#D9D1C6',
    zemin2: '#A29A90',
    isikHuzmesi: 'rgba(255,252,246,0.85)',
    izgara: 'rgba(122,88,56,0.10)',
    hayaletSembol: 'rgba(96,72,50,0.13)',
    metin: '#1B3350',
    ikincilMetin: 'rgba(27,51,80,0.62)',
    cizgi: 'rgba(140,96,60,0.38)',
    panelZemin: 'rgba(255,253,249,0.40)',
    panelCizgi: 'rgba(140,96,60,0.32)',
  },

  // Ana kimlik: derin lacivert + bakır. Küçük boyutta en yüksek kontrast.
  bakir: {
    zemin1: '#08192F',
    zemin2: '#03101F',
    isikHuzmesi: 'rgba(217,162,115,0.20)',
    izgara: 'rgba(224,175,128,0.075)',
    hayaletSembol: 'rgba(224,175,128,0.055)',
    metin: RENK.beyaz,
    ikincilMetin: RENK.sis,
    cizgi: 'rgba(224,175,128,0.30)',
    panelZemin: 'rgba(255,236,215,0.045)',
    panelCizgi: 'rgba(224,175,128,0.34)',
  },
  // Gece: neredeyse siyah. Feed'de en agresif duran varyant.
  gece: {
    zemin1: '#191512',
    zemin2: '#080706',
    isikHuzmesi: 'rgba(233,180,132,0.16)',
    izgara: 'rgba(233,180,132,0.065)',
    hayaletSembol: 'rgba(233,180,132,0.055)',
    metin: '#FFF6EC',
    ikincilMetin: 'rgba(255,246,236,0.60)',
    cizgi: 'rgba(233,180,132,0.32)',
    panelZemin: 'rgba(255,236,215,0.05)',
    panelCizgi: 'rgba(233,180,132,0.36)',
  },
  // Krem: banner'ın birebir devamı. Seri/eğitim içerikleri için sakin.
  krem: {
    zemin1: '#DED6CA',
    zemin2: '#B8AC9C',
    isikHuzmesi: 'rgba(255,255,255,0.55)',
    izgara: 'rgba(94,74,56,0.085)',
    hayaletSembol: 'rgba(94,74,56,0.085)',
    metin: '#20304A',
    ikincilMetin: 'rgba(32,48,74,0.66)',
    cizgi: 'rgba(140,96,60,0.40)',
    panelZemin: 'rgba(255,252,247,0.42)',
    panelCizgi: 'rgba(140,96,60,0.35)',
  },
};

/** Çıktı boyutları. */
export const BOYUT = {
  kapak: { w: 1280, h: 720 },   // video küçük resmi (YouTube önerisi)
  banner: { w: 2560, h: 1440 }, // kanal başlığı; güvenli alan 1546×423 ortada
};
