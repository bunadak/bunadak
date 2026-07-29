/* ═══════════════════════════════════════════════════════════════
   MATHERA — KONU LİSTESİ
   ═══════════════════════════════════════════════════════════════

   Kapak tasarımı SABİTTİR. Sen sadece `konu` yazarsın.

       npm run kapak

   Çıktılar → kapak-motoru/out/

   ── Zorunlu ──────────────────────────────────────────────────
   dosya      Çıktı dosyasının adı (Türkçe karakter kullanma)
   konu       KONU ADI. Uzunsa "|" ile satır kır: 'ÜSLÜ|SAYILAR'

   ── İsteğe bağlı (boş bırakırsan o öğe çizilmez) ─────────────
   ustBaslik  Lacivert etiket — 'TYT MATEMATİK'
   altBaslik  Tek satır vaat. *yıldız arası* bakır renkte vurgulanır
   rozet      Sağ üst köşe — 'BÖLÜM 01'
   ═══════════════════════════════════════════════════════════════ */

export const marka = {
  kanal: 'MATHERA',
  etiket: '@eramath',
};

export const kapaklar = [
  {
    dosya: '01-sayilar',
    konu: 'SAYILAR',
    ustBaslik: 'TYT MATEMATİK',
    altBaslik: 'Her şeyin başladığı konu — *sıfırdan* ve eksiksiz.',
    rozet: 'BÖLÜM 01',
  },
  {
    dosya: '02-bolme-bolunebilme',
    konu: 'BÖLME VE|BÖLÜNEBİLME',
    ustBaslik: 'TYT MATEMATİK',
    altBaslik: 'Kalan bulmanın *tek mantığı* var.',
    rozet: 'BÖLÜM 02',
  },
  {
    dosya: '03-ebob-ekok',
    konu: 'EBOB – EKOK',
    ustBaslik: 'TYT MATEMATİK',
    altBaslik: 'Soruda hangisini soruyor? *5 saniyede* anla.',
    rozet: 'BÖLÜM 03',
  },
  {
    dosya: '04-rasyonel-sayilar',
    konu: 'RASYONEL|SAYILAR',
    ustBaslik: 'TYT MATEMATİK',
    altBaslik: 'Kesirlerle işlem yapmayı *bitiriyoruz*.',
    rozet: 'BÖLÜM 04',
  },
  {
    dosya: '05-uslu-sayilar',
    konu: 'ÜSLÜ SAYILAR',
    ustBaslik: 'TYT MATEMATİK',
    altBaslik: 'Altı kural, *hiç ezber yok*.',
    rozet: 'BÖLÜM 05',
  },
  {
    dosya: '06-mutlak-deger',
    konu: 'MUTLAK DEĞER',
    ustBaslik: 'TYT MATEMATİK',
    altBaslik: 'İşaret tuzaklarına *bir daha düşme*.',
    rozet: 'BÖLÜM 06',
  },

  /* Kanal başlığı (banner) — 2560×1440 */
  {
    dosya: '00-kanal-banner',
    tasarim: 'banner',
    baslik: 'MATHERA',
    ustBaslik: 'MATEMATİĞİN DİLİ',
    altBaslik: 'TYT · AYT · KAVRAM ANLATIMI   ·   @eramath',
  },
];
