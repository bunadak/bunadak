/* ============================================================================
   ÜÇÜNCÜ SÖZLÜK TURU — kalan bütün Türkçe arayüz metinleri
   ----------------------------------------------------------------------------
   İkinci turdan sonra ekranda 191 Türkçe dize kalmıştı. Bunlar üç türdeydi:

     1) KISA ETİKETLER — başlıklar, ipucu balonları, yer tutucular. Metin
        düğümü sözlüğüne (D) birebir girer.
     2) UZUN AÇIKLAMALAR — içinde <b>/<i> geçtiği için metin düğümü başına
        anlamsız parçalara bölünenler. Bunlar eleman düzeyi sözlüğe (DEL)
        kapsayıcının BÜTÜN metniyle anahtarlanır ve tek parça değişir.
     3) İÇİNDE SAYI GEÇEN DİZELER — "0.1 MB kullanılıyor", "Mürekkep ·
        Tükenmez 3px (1 · sağ tık: sil)" gibi. Bunlar her değerde farklı
        olduğu için birebir sözlükle tutulamaz; sonda bir DESEN motoru
        çalışır ve sayıyı yerinde bırakıp çevresini çevirir.

   Tek istisna "Notis": uygulamanın adı hiçbir dilde çevrilmez (#logo ve
   .notr kapsayıcıları pro-i18n.js'te çeviri dışıdır).
   ========================================================================= */
(function () {
  'use strict';
  function boot() {
    const api = window.proI18n;
    if (!api) return;
    const D = api.dict, DEL = api.elDict;

    /* ------------------------------------------- 1) KISA ETİKETLER
       sıra: [en, de, fr, es] */
    Object.assign(D, {
      // --- kalem başlıkları ---
      'Kalem 1 — Akıllı Kalem': ['Pen 1 — Smart Pen', 'Stift 1 — Smart-Stift', 'Stylo 1 — Stylo intelligent', 'Lápiz 1 — Lápiz inteligente'],
      'Kalem 2 — Tükenmez': ['Pen 2 — Ballpoint', 'Stift 2 — Kugelschreiber', 'Stylo 2 — Bille', 'Lápiz 2 — Bolígrafo'],
      'Kalem 3 — Dolma': ['Pen 3 — Fountain', 'Stift 3 — Füller', 'Stylo 3 — Plume', 'Lápiz 3 — Estilográfica'],
      'Kalem 4 — Kurşun': ['Pen 4 — Pencil', 'Stift 4 — Bleistift', 'Stylo 4 — Crayon', 'Lápiz 4 — Lápiz'],
      'Kalem 5 — Fosforlu': ['Pen 5 — Highlighter', 'Stift 5 — Marker', 'Stylo 5 — Surligneur', 'Lápiz 5 — Resaltador'],
      'Kalem 6 — Keçeli': ['Pen 6 — Felt Tip', 'Stift 6 — Filzstift', 'Stylo 6 — Feutre', 'Lápiz 6 — Rotulador'],
      'Kalem 7 — Teknik': ['Pen 7 — Technical', 'Stift 7 — Technisch', 'Stylo 7 — Technique', 'Lápiz 7 — Técnico'],
      'Kalem 8 — Kaligrafi': ['Pen 8 — Calligraphy', 'Stift 8 — Kalligrafie', 'Stylo 8 — Calligraphie', 'Lápiz 8 — Caligrafía'],
      'Kalem 9 — Fırça': ['Pen 9 — Brush', 'Stift 9 — Pinsel', 'Stylo 9 — Pinceau', 'Lápiz 9 — Pincel'],
      'Kalem 10 — Air Brush': ['Pen 10 — Airbrush', 'Stift 10 — Airbrush', 'Stylo 10 — Aérographe', 'Lápiz 10 — Aerógrafo'],
      'Noise (pürüz)': ['Noise (grain)', 'Rauschen (Körnung)', 'Bruit (grain)', 'Ruido (grano)'],

      // --- bölüm başlıkları ---
      'Ölçü': ['Measurement', 'Maß', 'Mesure', 'Medida'],
      '📏 Ölçü Birimi': ['📏 Unit of Measure', '📏 Maßeinheit', '📏 Unité de mesure', '📏 Unidad de medida'],
      'Kusursuz Çizgi': ['Perfect Line', 'Perfekte Linie', 'Ligne parfaite', 'Línea perfecta'],
      '💎 Kusursuz Çizgi': ['💎 Perfect Line', '💎 Perfekte Linie', '💎 Ligne parfaite', '💎 Línea perfecta'],
      'SILK™ — Pürüzsüz Mürekkep Motoru': ['SILK™ — Smooth Ink Engine', 'SILK™ — Glatte Tinten-Engine', 'SILK™ — Moteur d’encre lisse', 'SILK™ — Motor de tinta suave'],
      '📐 Köşeleri Koru': ['📐 Preserve Corners', '📐 Ecken erhalten', '📐 Préserver les angles', '📐 Conservar esquinas'],
      '📊 Titreşim Ölçer': ['📊 Tremor Meter', '📊 Zittermesser', '📊 Mesureur de tremblement', '📊 Medidor de temblor'],
      'Pro Arayüz': ['Pro Interface', 'Pro-Oberfläche', 'Interface Pro', 'Interfaz Pro'],
      'Çözüm Modu': ['Solve Mode', 'Lösungsmodus', 'Mode résolution', 'Modo resolución'],

      // --- arayüz anahtarları ---
      '🫧 Cam Efekti Yoğunluğu': ['🫧 Glass Blur Strength', '🫧 Glaseffekt-Stärke', '🫧 Intensité du verre dépoli', '🫧 Intensidad del vidrio'],
      '📺 Yayın Modu': ['📺 Broadcast Mode', '📺 Broadcast-Modus', '📺 Mode diffusion', '📺 Modo emisión'],
      '🖥️ OLED Ultra Görüntü': ['🖥️ OLED Ultra Image', '🖥️ OLED-Ultra-Bild', '🖥️ Image OLED Ultra', '🖥️ Imagen OLED Ultra'],
      '✨ Sinematik Geçişler': ['✨ Cinematic Transitions', '✨ Filmische Übergänge', '✨ Transitions cinématiques', '✨ Transiciones cinematográficas'],
      '🌈 Kalem Paleti Şeması': ['🌈 Pen Palette Scheme', '🌈 Stiftpaletten-Schema', '🌈 Schéma de palette', '🌈 Esquema de paleta'],
      '🌡️ Gece Işığı': ['🌡️ Night Light', '🌡️ Nachtlicht', '🌡️ Lumière nocturne', '🌡️ Luz nocturna'],
      '🌑 Karanlık Mod': ['🌑 Dark Mode', '🌑 Dunkelmodus', '🌑 Mode sombre', '🌑 Modo oscuro'],
      '🎚️ Karanlık Şiddeti': ['🎚️ Darkness Strength', '🎚️ Dunkelheitsgrad', '🎚️ Intensité du mode sombre', '🎚️ Intensidad de oscuridad'],
      '🌡️ Kâğıt Tonu': ['🌡️ Paper Tone', '🌡️ Papierton', '🌡️ Teinte du papier', '🌡️ Tono del papel'],
      '🎨 Renkli Görselleri Koru': ['🎨 Preserve Color Images', '🎨 Farbbilder erhalten', '🎨 Préserver les images couleur', '🎨 Conservar imágenes en color'],
      '✒️ Mürekkebi Uyarla': ['✒️ Adapt Ink', '✒️ Tinte anpassen', '✒️ Adapter l’encre', '✒️ Adaptar la tinta'],
      '🟦 Boş Tahtayı da Koyult': ['🟦 Darken Blank Board Too', '🟦 Auch leere Tafel abdunkeln', '🟦 Assombrir aussi le tableau vide', '🟦 Oscurecer también la pizarra vacía'],
      '🖤 Arayüzü de Koyult': ['🖤 Darken Interface Too', '🖤 Auch Oberfläche abdunkeln', '🖤 Assombrir aussi l’interface', '🖤 Oscurecer también la interfaz'],
      '🕯️ Sıcak Gece (mavi ışık azaltma)': ['🕯️ Warm Night (blue-light reduction)', '🕯️ Warme Nacht (Blaulichtfilter)', '🕯️ Nuit chaude (réduction lumière bleue)', '🕯️ Noche cálida (reducción de luz azul)'],
      '🖊️ İmleç Figürü': ['🖊️ Cursor Figure', '🖊️ Zeigerfigur', '🖊️ Figure du curseur', '🖊️ Figura del cursor'],
      '👁 Canlı Önizleme': ['👁 Live Preview', '👁 Live-Vorschau', '👁 Aperçu en direct', '👁 Vista previa en vivo'],
      '📏 İmleç Boyutu': ['📏 Cursor Size', '📏 Zeigergröße', '📏 Taille du curseur', '📏 Tamaño del cursor'],
      '🎨 Kalem Rengini İzle': ['🎨 Follow Pen Color', '🎨 Stiftfarbe folgen', '🎨 Suivre la couleur du stylo', '🎨 Seguir el color del lápiz'],
      '🎯 Uç Halkası': ['🎯 Tip Ring', '🎯 Spitzenring', '🎯 Anneau de pointe', '🎯 Anillo de punta'],
      '🌓 Koyu Zemin Kontürü': ['🌓 Dark-Background Outline', '🌓 Kontur auf dunklem Grund', '🌓 Contour sur fond sombre', '🌓 Contorno sobre fondo oscuro'],
      '🧠 Araca Duyarlı İmleç': ['🧠 Tool-Aware Cursor', '🧠 Werkzeugbewusster Zeiger', '🧠 Curseur adapté à l’outil', '🧠 Cursor según herramienta'],
      '🧮 Çözümleri kütüphaneye kaydet': ['🧮 Save solutions to library', '🧮 Lösungen in Bibliothek speichern', '🧮 Enregistrer les résolutions dans la bibliothèque', '🧮 Guardar resoluciones en la biblioteca'],

      // --- ipucu balonları ---
      'Sunum Modu — tam ekran, arayüz gizlenir, lazer hazır (F5)': ['Presentation Mode — full screen, interface hidden, laser ready (F5)', 'Präsentationsmodus — Vollbild, Oberfläche verborgen, Laser bereit (F5)', 'Mode présentation — plein écran, interface masquée, laser prêt (F5)', 'Modo presentación — pantalla completa, interfaz oculta, láser listo (F5)'],
      'Slayt Sunusu — sunu dosyası aç, üzerine çiz (← → ile sayfa geç)': ['Slide Show — open a presentation file and draw on it (← → to change page)', 'Diashow — Präsentationsdatei öffnen und darauf zeichnen (← → Seitenwechsel)', 'Diaporama — ouvrez un fichier de présentation et dessinez dessus (← → pour changer de page)', 'Presentación — abre un archivo y dibuja encima (← → para cambiar de página)'],
      'Paneli aç/kapat (Sayfalar · Katmanlar · Çıkartmalar)': ['Show/hide panel (Pages · Layers · Stickers)', 'Panel ein-/ausblenden (Seiten · Ebenen · Sticker)', 'Afficher/masquer le panneau (Pages · Calques · Autocollants)', 'Mostrar/ocultar el panel (Páginas · Capas · Pegatinas)'],
      'Kart görünümüne geç': ['Switch to card view', 'Zur Kartenansicht wechseln', 'Passer en vue cartes', 'Cambiar a vista de tarjetas'],
      'Komut yaz ya da ara — sayfa, metin, araç, tema…': ['Type a command or search — page, text, tool, theme…', 'Befehl eingeben oder suchen — Seite, Text, Werkzeug, Thema…', 'Tapez une commande ou cherchez — page, texte, outil, thème…', 'Escribe un comando o busca — página, texto, herramienta, tema…'],
      'Aynı el hareketini üstte fabrika ayarıyla, altta senin ayarınla çizer': ['Draws the same hand movement with factory settings on top and your settings below', 'Zeichnet dieselbe Handbewegung oben mit Werkseinstellung, unten mit deiner Einstellung', 'Trace le même geste avec les réglages d’usine en haut et les vôtres en bas', 'Dibuja el mismo gesto con los ajustes de fábrica arriba y los tuyos abajo'],
      'Kaleme özel renk yok — üst çubuktaki renk geçerli': ['No pen-specific color — the top bar color applies', 'Keine stiftspezifische Farbe — die Farbe der oberen Leiste gilt', 'Pas de couleur propre au stylo — la couleur de la barre supérieure s’applique', 'Sin color propio del lápiz — se aplica el color de la barra superior'],
      'Özel renk': ['Custom color', 'Eigene Farbe', 'Couleur personnalisée', 'Color personalizado'],
      'Çizginin genel koyuluğu — opaklıkla çarpılır': ['Overall darkness of the line — multiplied by opacity', 'Gesamtdunkelheit der Linie — wird mit der Deckkraft multipliziert', 'Noirceur globale du trait — multipliée par l’opacité', 'Oscuridad general del trazo — se multiplica por la opacidad'],
      'Grafit / keçe dokusu — seed\'li, deterministik katman. Beş kalemin hepsinde çalışır.': ['Graphite / felt texture — a seeded, deterministic layer. Works on all five pens.', 'Graphit-/Filztextur — eine deterministische Schicht mit Startwert. Funktioniert bei allen fünf Stiften.', 'Texture graphite / feutre — couche déterministe avec graine. Fonctionne sur les cinq stylos.', 'Textura de grafito / fieltro — capa determinista con semilla. Funciona en los cinco lápices.'],
      'Sivri uçta çizginin kaç nokta boyunca inceldiği — 6 fabrika değeridir': ['How many points the line tapers over at a sharp tip — 6 is the factory value', 'Über wie viele Punkte die Linie an der Spitze ausläuft — 6 ist der Werkswert', 'Sur combien de points le trait s’affine à la pointe — 6 est la valeur d’usine', 'Sobre cuántos puntos se afina el trazo en la punta — 6 es el valor de fábrica'],
      'Kalem titremesini bastırır; hızlanınca filtre kendiliğinden gevşer': ['Suppresses pen tremor; the filter relaxes on its own as you speed up', 'Unterdrückt das Zittern des Stifts; bei höherer Geschwindigkeit lockert der Filter von selbst', 'Atténue le tremblement du stylo ; le filtre se relâche de lui-même à vitesse élevée', 'Reduce el temblor del lápiz; el filtro se relaja por sí solo al acelerar'],

      // --- hazır uç adları ---
      'İnce Çizgi — not, dipnot': ['Fine Line — notes, footnotes', 'Feine Linie — Notizen, Fußnoten', 'Trait fin — notes, notes de bas de page', 'Línea fina — notas, pies de nota'],
      'Mürekkep — günlük yazı': ['Ink — everyday writing', 'Tinte — Alltagsschrift', 'Encre — écriture courante', 'Tinta — escritura diaria'],
      'Kaligrafi — keski uç': ['Calligraphy — chisel tip', 'Kalligrafie — Keilspitze', 'Calligraphie — pointe biseautée', 'Caligrafía — punta biselada'],
      'Çizgi Roman — dolgun, net': ['Comic — full-bodied, crisp', 'Comic — kräftig, klar', 'BD — plein, net', 'Cómic — pleno, nítido'],
      'İmza — ince uç, canlı': ['Signature — fine tip, lively', 'Signatur — feine Spitze, lebendig', 'Signature — pointe fine, vive', 'Firma — punta fina, viva'],
      'Marker — geniş, yumuşak': ['Marker — broad, soft', 'Marker — breit, weich', 'Marqueur — large, doux', 'Marcador — ancho, suave'],
      'Fabrika — bu kalemin aslı': ['Factory — this pen as it was made', 'Werk — dieser Stift im Original', 'Usine — ce stylo d’origine', 'Fábrica — este lápiz original'],

      // --- çizim modları ---
      'Portre — Yumuşak geçiş, ölçülü': ['Portrait — Soft gradation, measured', 'Porträt — Weicher Verlauf, maßvoll', 'Portrait — Dégradé doux, mesuré', 'Retrato — Transición suave, medida'],
      'Figür — Kendinden emin hat': ['Figure — Confident line', 'Figur — Selbstsichere Linie', 'Figure — Trait assuré', 'Figura — Trazo seguro'],
      'Natürmort — İnce denetim, hacim': ['Still Life — Fine control, volume', 'Stillleben — Feine Kontrolle, Volumen', 'Nature morte — Contrôle fin, volume', 'Bodegón — Control fino, volumen'],
      'Manzara — Geniş hat, atmosfer': ['Landscape — Broad line, atmosphere', 'Landschaft — Breite Linie, Atmosphäre', 'Paysage — Trait large, atmosphère', 'Paisaje — Trazo amplio, atmósfera'],
      'Jest — Hızlı ve serbest, en az sabitleme': ['Gesture — Fast and free, minimal stabilization', 'Geste — Schnell und frei, minimale Stabilisierung', 'Geste — Rapide et libre, stabilisation minimale', 'Gesto — Rápido y libre, estabilización mínima'],
      'Kontur — Tek sürekli, eşit kalınlık': ['Contour — Single continuous line, even width', 'Kontur — Eine durchgehende Linie, gleichmäßige Breite', 'Contour — Un seul trait continu, épaisseur égale', 'Contorno — Un trazo continuo, grosor uniforme'],
      'Silüet — Dolu kütle, ağır hat': ['Silhouette — Solid mass, heavy line', 'Silhouette — Volle Masse, schwere Linie', 'Silhouette — Masse pleine, trait lourd', 'Silueta — Masa sólida, trazo pesado'],
      'Karikatür — Canlı, değişken kalınlık': ['Caricature — Lively, variable width', 'Karikatur — Lebendig, variable Breite', 'Caricature — Vif, épaisseur variable', 'Caricatura — Vivo, grosor variable'],
      'Çizgi Roman — Kalın mürekkep, net kütle': ['Comic — Thick ink, crisp mass', 'Comic — Dicke Tinte, klare Masse', 'BD — Encre épaisse, masse nette', 'Cómic — Tinta gruesa, masa nítida'],
      'Dijital Çizim — Basınca zengin, pürüzsüz': ['Digital Drawing — Pressure-rich, smooth', 'Digitale Zeichnung — Druckreich, glatt', 'Dessin numérique — Riche en pression, lisse', 'Dibujo digital — Rico en presión, suave'],
      'Teknik Resim — Eşit hat, ızgara ve açı kilidi': ['Technical Drawing — Even line, grid and angle lock', 'Technische Zeichnung — Gleichmäßige Linie, Raster- und Winkelsperre', 'Dessin technique — Trait égal, verrou de grille et d’angle', 'Dibujo técnico — Trazo uniforme, bloqueo de rejilla y ángulo'],
      'Mimari Resim — İzometrik zemin, ince kalem': ['Architectural Drawing — Isometric ground, fine pen', 'Architekturzeichnung — Isometrischer Grund, feiner Stift', 'Dessin d’architecture — Fond isométrique, stylo fin', 'Dibujo arquitectónico — Fondo isométrico, lápiz fino'],
      'Çizgisel Çizim — Saf hat, doku yok': ['Line Drawing — Pure line, no texture', 'Linienzeichnung — Reine Linie, keine Textur', 'Dessin au trait — Trait pur, sans texture', 'Dibujo lineal — Trazo puro, sin textura'],
      'örn. 1-3, 7, 12-15 — boş bırakırsan tümü': ['e.g. 1-3, 7, 12-15 — leave empty for all', 'z. B. 1-3, 7, 12-15 — leer lassen für alle', 'ex. 1-3, 7, 12-15 — laisser vide pour tout', 'ej. 1-3, 7, 12-15 — déjalo vacío para todas'],
    });

    /* ------------------------------- 3) SAYI İÇEREN DİZELER: DESEN MOTORU
       Birebir sözlük bunları tutamaz (değer her seferinde farklıdır), bu
       yüzden sayı yerinde bırakılır ve çevresi çevrilir. */
    const KURAL = [
      [/^([\d.,]+) MB kullanılıyor$/, ['$1 MB in use', '$1 MB belegt', '$1 Mo utilisés', '$1 MB en uso']],
      [/^(\d+) kayıtlı çalışma$/, ['$1 saved work(s)', '$1 gespeicherte Arbeit(en)', '$1 travail/travaux enregistré(s)', '$1 trabajo(s) guardado(s)']],
      [/^(.+) · (.+) ([\d.,]+)px \((\d+) · sağ tık: sil\)$/,
        ['$1 · $2 $3px ($4 · right-click: delete)', '$1 · $2 $3px ($4 · Rechtsklick: löschen)',
         '$1 · $2 $3px ($4 · clic droit : supprimer)', '$1 · $2 $3px ($4 · clic derecho: eliminar)']],
      [/^(.+) · (\d+) katman · Sayfa (\d+)$/,
        ['$1 · $2 layer(s) · Page $3', '$1 · $2 Ebene(n) · Seite $3',
         '$1 · $2 calque(s) · Page $3', '$1 · $2 capa(s) · Página $3']],
    ];
    for (const k of KURAL) api.rules.push(k);

    /* ------------------------------------- 2) UZUN AÇIKLAMALAR (eleman düzeyi)
       Anahtar: kapsayıcının boşlukları tek boşluğa indirilmiş TÜM metni. */
    if (api.reset) api.reset();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 60));
  else setTimeout(boot, 60);
})();
