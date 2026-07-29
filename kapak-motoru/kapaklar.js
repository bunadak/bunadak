/* ═══════════════════════════════════════════════════════════════
   MATHERA — KAPAK LİSTESİ
   Tek düzenlemen gereken dosya bu. Metni yaz, kaydet, çalıştır:

       npm run kapak

   Çıktılar → kapak-motoru/out/
   ═══════════════════════════════════════════════════════════════

   ALANLAR
   ───────
   dosya      Çıktı dosyasının adı (Türkçe karakter kullanma)
   tasarim    imza | formul | soru | ikilem | adim | ders | banner
   tema       bakir (lacivert+bakır) · gece (siyah+bakır) · krem (banner rengi)
   ustBaslik  Üstteki küçük etiket — "AYT MATEMATİK", "TYT · 12. SINIF"
   baslik     ANA KONU. Satır kırmak için "|" koy: "TÜREV|UYGULAMALARI"
   vurgu      İkinci satır (italik serif). Başlıkla kontrast yaratır.
   altBaslik  Açıklama. *yıldız arası* yazarsan bakır renkte vurgulanır.
   formul     Formül levhasında/sağ altta görünen bağıntı
   rozet      Sağ üst köşe — "BÖLÜM 04", "2025 MÜFREDAT"
   ─── düzene özel ───
   dugme      (soru)   alt köşedeki bakır buton yazısı
   sol/sag    (ikilem) karşılaştırılan iki kavram
   solRol     (ikilem) sol kavramın altındaki küçük yazı
   sagRol     (ikilem) sağ kavramın altındaki küçük yazı
   karsi      (ikilem) ortadaki bağlaç — "vs", "ya da", "≠"
   rakam      (adim)   dev rakam
   maddeler   (adim)   madde listesi (dizi)
   ═══════════════════════════════════════════════════════════════ */

export const marka = {
  kanal: 'MATHERA',
  etiket: '@eramath',
};

export const kapaklar = [
  {
    dosya: '01-limit',
    tasarim: 'imza',
    tema: 'bakir',
    ustBaslik: 'AYT MATEMATİK',
    baslik: 'LİMİT|BELİRSİZLİĞİ',
    vurgu: 'tek videoda biter',
    altBaslik: '0/0 ve ∞/∞ tiplerini *4 refleksle* çöz — ezber yok.',
    formul: 'lim_{x→0} [sin x]/[x] = 1',
    levhaEtiketi: 'ANAHTAR BAĞINTI',
    rozet: 'BÖLÜM 01',
  },

  {
    dosya: '02-turev-soru',
    tasarim: 'soru',
    tema: 'gece',
    ustBaslik: 'TYT · AYT',
    baslik: 'TÜREV NEDEN|EĞİMDİR?',
    vurgu: 'kimse böyle anlatmadı',
    altBaslik: 'Formülü ezberlemeden önce *ne olduğunu* gör.',
    dugme: '3 dakikada anla',
    rozet: 'KAVRAM',
  },

  {
    dosya: '03-integral-formul',
    tasarim: 'formul',
    tema: 'bakir',
    ustBaslik: 'BELİRLİ İNTEGRAL',
    baslik: 'ALAN HESABININ|TEK KURALI',
    formul: '∫_{a}^{b} f(x)~dx = F(b) − F(a)',
    altBaslik: 'Newton–Leibniz bağıntısı, sıfırdan sınav sorusuna.',
    rozet: 'BÖLÜM 07',
  },

  {
    dosya: '04-permutasyon-kombinasyon',
    tasarim: 'ikilem',
    tema: 'bakir',
    ustBaslik: 'EN ÇOK KARIŞTIRILAN İKİLİ',
    sol: 'PERMÜTASYON',
    solRol: 'sıra önemli',
    sag: 'KOMBİNASYON',
    sagRol: 'sıra önemsiz',
    karsi: 'vs',
    altBaslik: 'Soruyu okurken *hangisi* olduğunu 5 saniyede seçme yöntemi.',
    rozet: 'OLASILIK 02',
  },

  {
    dosya: '05-logaritma-adim',
    tasarim: 'adim',
    tema: 'gece',
    rakam: '3',
    ustBaslik: 'AYT MATEMATİK',
    baslik: 'ADIMDA|LOGARİTMA',
    vurgu: 'sıfırdan sınava',
    maddeler: ['Tabanı okumayı öğren', 'Üç temel özellik', 'Denklem tipleri'],
    rozet: 'HIZLI DERS',
  },

  {
    dosya: '06-trigonometri-ders',
    tasarim: 'ders',
    tema: 'krem',
    ustBaslik: 'TRİGONOMETRİ SERİSİ',
    baslik: 'BİRİM ÇEMBER',
    vurgu: 'her şeyin başladığı yer',
    altBaslik: 'Açı, yay, işaret bölgeleri ve *dönüşüm formülleri* — tek çerçevede.',
    formul: 'sin^2 θ + cos^2 θ = 1',
    rozet: 'DERS 01',
  },

  {
    dosya: '07-fonksiyon-imza',
    tasarim: 'imza',
    tema: 'gece',
    ustBaslik: 'TYT MATEMATİK',
    baslik: 'FONKSİYON|GRAFİKLERİ',
    vurgu: 'okumayı öğren, çözmeyi bırak',
    altBaslik: 'Grafiğe bakıp *çözmeden* cevabı gören öğrenci ol.',
    formul: 'f(x) = a(x − r)^2 + k',
    levhaEtiketi: 'TEPE NOKTA FORMU',
    rozet: 'BÖLÜM 12',
  },

  {
    dosya: '00-kanal-banner',
    tasarim: 'banner',
    tema: 'bakir',
    ustBaslik: 'MATEMATİĞİN DİLİ',
    baslik: 'MATHERA',
    altBaslik: 'TYT · AYT · KAVRAM ANLATIMI   ·   @eramath',
  },
];
