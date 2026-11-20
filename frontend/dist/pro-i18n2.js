/* ============================================================================
   DİL KATMANI — İKİNCİ PARTİ
   ----------------------------------------------------------------------------
   İlk sözlük arayüzün iskeletini kapsıyordu. Bu dosya kapsama taramasıyla
   (i18ncov) bulunan kalan görünür metinleri ekler: araç adları ve ipuçları,
   kalem kartları, tema ve tahta adları, imleç figürleri, depolama, kütüphane
   ve yan panel metinleri.

   İki sözlük vardır:
     D   — metin düğümü başına TAM eşleşme (kısa etiketler)
     DEL — eleman düzeyi, bütün metinle eşleşir (uzun açıklamalar; bunlar
           <b> etiketleriyle parçalandığı için düğüm başına eşleşmez)
   ========================================================================= */
(function () {
  'use strict';
  const api = window.proI18n;
  if (!api) return;
  const D = api.dict, DEL = api.elDict;

  /* ---------- kısa etiketler : [en, de, fr, es] ---------- */
  Object.assign(D, {
    // --- araç rayı ve ipuçları ---
    'Seçim': ['Select', 'Auswahl', 'Sélection', 'Selección'],
    'Seçim aracı': ['Select tool', 'Auswahlwerkzeug', 'Outil de sélection', 'Herramienta de selección'],
    'Kaydır (El)': ['Pan (Hand)', 'Verschieben (Hand)', 'Déplacer (main)', 'Desplazar (mano)'],
    '✦ Akıllı Kalem': ['✦ Smart Pen', '✦ Smart-Stift', '✦ Stylo intelligent', '✦ Lápiz inteligente'],
    'Tükenmez Kalem': ['Ballpoint Pen', 'Kugelschreiber', 'Stylo à bille', 'Bolígrafo'],
    'Tükenmez kalem': ['Ballpoint pen', 'Kugelschreiber', 'Stylo à bille', 'Bolígrafo'],
    'Dolma Kalem': ['Fountain Pen', 'Füllfederhalter', 'Stylo-plume', 'Pluma estilográfica'],
    'Dolma kalem': ['Fountain pen', 'Füllfederhalter', 'Stylo-plume', 'Pluma estilográfica'],
    'Kurşun Kalem': ['Pencil', 'Bleistift', 'Crayon', 'Lápiz'],
    'Kurşun kalem': ['Pencil', 'Bleistift', 'Crayon', 'Lápiz'],
    'Fosforlu Kalem': ['Highlighter', 'Textmarker', 'Surligneur', 'Marcador'],
    'Fosforlu kalem': ['Highlighter', 'Textmarker', 'Surligneur', 'Marcador'],
    'Akıllı Silgi': ['Smart Eraser', 'Intelligenter Radierer', 'Gomme intelligente', 'Goma inteligente'],
    'Tahtayı Temizle': ['Clear the board', 'Tafel leeren', 'Effacer le tableau', 'Limpiar la pizarra'],
    'Akıllı Cetvel': ['Smart Ruler', 'Intelligentes Lineal', 'Règle intelligente', 'Regla inteligente'],
    'Akıllı cetvel': ['Smart ruler', 'Intelligentes Lineal', 'Règle intelligente', 'Regla inteligente'],
    'İletki (Açıölçer)': ['Protractor', 'Winkelmesser', 'Rapporteur', 'Transportador'],
    'İletki (açıölçer)': ['Protractor', 'Winkelmesser', 'Rapporteur', 'Transportador'],
    'Şekiller & Figürler': ['Shapes & Figures', 'Formen & Figuren', 'Formes et figures', 'Formas y figuras'],
    'Şekiller paneli': ['Shapes panel', 'Formen-Panel', 'Panneau des formes', 'Panel de formas'],
    'Lazer İşaretçi': ['Laser Pointer', 'Laserpointer', 'Pointeur laser', 'Puntero láser'],
    'Spot Işığı': ['Spotlight', 'Spotlight', 'Projecteur', 'Foco'],
    'Pergel': ['Compass', 'Zirkel', 'Compas', 'Compás'],
    'Metin': ['Text', 'Text', 'Texte', 'Texto'],
    'Sığdır — çalışma alanına oturt (PDF/slayt/tahta)': ['Fit — to the workspace (PDF/slide/board)', 'Einpassen — in den Arbeitsbereich', "Ajuster — à l'espace de travail", 'Ajustar — al área de trabajo'],
    'Rastgele renge geç': ['Switch to a random color', 'Zu zufälliger Farbe wechseln', 'Passer à une couleur aléatoire', 'Cambiar a un color aleatorio'],
    'Boş tahta ↔ son çalışmaya dön': ['Blank board ↔ back to last work', 'Leere Tafel ↔ zurück zur letzten Arbeit', 'Tableau vierge ↔ retour au dernier travail', 'Pizarra en blanco ↔ volver al último trabajo'],
    'Panel gizle döngüsü (sol → sol+üst → hepsi görünür)': ['Panel-hide cycle (left → left+top → all visible)', 'Panel-Zyklus (links → links+oben → alle sichtbar)', 'Cycle de masquage (gauche → gauche+haut → tout)', 'Ciclo de ocultar paneles (izq. → izq.+arriba → todo)'],
    'Siyah kaleme geç': ['Switch to the black pen', 'Zum schwarzen Stift wechseln', 'Passer au stylo noir', 'Cambiar al lápiz negro'],
    'Karanlık mod (tüm uygulama) aç/kapat': ['Toggle dark mode (whole app)', 'Dunkelmodus umschalten (ganze App)', 'Basculer le mode sombre (toute l’app)', 'Alternar modo oscuro (toda la app)'],
    'Çözüm modu (soru taşı)': ['Solve mode (carry the question)', 'Lösungsmodus (Frage mitnehmen)', 'Mode résolution (emporter la question)', 'Modo resolución (llevar la pregunta)'],
    'Sabit: Ctrl+Z/Y, Ctrl+G/D/A, Del, Boşluk, Esc, +/−, PgUp/PgDn': ['Fixed: Ctrl+Z/Y, Ctrl+G/D/A, Del, Space, Esc, +/−, PgUp/PgDn', 'Fest: Strg+Z/Y, Strg+G/D/A, Entf, Leer, Esc, +/−, Bild↑/↓', 'Fixes : Ctrl+Z/Y, Ctrl+G/D/A, Suppr, Espace, Échap, +/−, PgPr/PgSv', 'Fijos: Ctrl+Z/Y, Ctrl+G/D/A, Supr, Espacio, Esc, +/−, RePág/AvPág'],
    'Önceki sayfa (←)': ['Previous page (←)', 'Vorherige Seite (←)', 'Page précédente (←)', 'Página anterior (←)'],
    'Sonraki sayfa (→)': ['Next page (→)', 'Nächste Seite (→)', 'Page suivante (→)', 'Página siguiente (→)'],
    'Katman opaklığı': ['Layer opacity', 'Ebenendeckkraft', 'Opacité du calque', 'Opacidad de capa'],
    'Çoğalt': ['Duplicate', 'Duplizieren', 'Dupliquer', 'Duplicar'],
    'Sırala': ['Sort', 'Sortieren', 'Trier', 'Ordenar'],
    'Tarihe göre sırala': ['Sort by date', 'Nach Datum sortieren', 'Trier par date', 'Ordenar por fecha'],
    'Ada göre sırala': ['Sort by name', 'Nach Name sortieren', 'Trier par nom', 'Ordenar por nombre'],
    'Sayfa sayısına göre sırala': ['Sort by page count', 'Nach Seitenzahl sortieren', 'Trier par nombre de pages', 'Ordenar por número de páginas'],

    // --- kalem paneli: kart adları ve bir satırlık tanımlar ---
    'Varsayılan': ['Default', 'Standard', 'Par défaut', 'Predeterminado'],
    'Yumuşak': ['Soft', 'Weich', 'Doux', 'Suave'],
    'Yeni Kalem': ['New Pen', 'Neuer Stift', 'Nouveau stylo', 'Lápiz nuevo'],
    'Seçiliden türet': ['Derive from the selected one', 'Vom Gewählten ableiten', 'Dériver du stylo choisi', 'Derivar del seleccionado'],
    'Fabrikayla karşılaştır': ['Compare with factory', 'Mit Werk vergleichen', "Comparer à l'usine", 'Comparar con fábrica'],
    'Keçeli': ['Felt-tip', 'Filzstift', 'Feutre', 'Rotulador'],
    'Teknik': ['Technical', 'Technisch', 'Technique', 'Técnico'],
    'Fırça': ['Brush', 'Pinsel', 'Pinceau', 'Pincel'],
    'İnce Uç': ['Fine Tip', 'Feine Spitze', 'Pointe fine', 'Punta fina'],
    'Tebeşir': ['Chalk', 'Kreide', 'Craie', 'Tiza'],
    'Nişangâh': ['Crosshair', 'Fadenkreuz', 'Réticule', 'Retícula'],
    'Stylus': ['Stylus', 'Stylus', 'Stylet', 'Stylus'],
    'Kalınlık (px)': ['Width (px)', 'Breite (px)', 'Épaisseur (px)', 'Grosor (px)'],
    'Pressure (basınç etkisi)': ['Pressure (effect)', 'Druck (Wirkung)', 'Pression (effet)', 'Presión (efecto)'],
    'Velocity (hız etkisi)': ['Velocity (effect)', 'Geschwindigkeit (Wirkung)', 'Vitesse (effet)', 'Velocidad (efecto)'],
    'Thinning (incelme genliği)': ['Thinning (amount)', 'Verjüngung (Stärke)', 'Affinage (amplitude)', 'Afinado (amplitud)'],
    'Flow (akış)': ['Flow', 'Fluss', 'Débit', 'Flujo'],
    'Wetness (ıslaklık)': ['Wetness', 'Nässe', 'Humidité', 'Humedad'],
    'Spacing (aralık)': ['Spacing', 'Abstand', 'Espacement', 'Espaciado'],
    'Sprey Yarıçapı (px)': ['Spray radius (px)', 'Sprühradius (px)', 'Rayon de spray (px)', 'Radio de espray (px)'],
    'Sprey Yoğunluğu': ['Spray density', 'Sprühdichte', 'Densité du spray', 'Densidad del espray'],

    // --- mod / tür kısa tanımları ---
    'Keskin, temiz kontur': ['Sharp, clean linework', 'Scharfe, saubere Kontur', 'Trait net et propre', 'Contorno nítido y limpio'],
    'Grafit doku, tonlama': ['Graphite texture, shading', 'Graphittextur, Schattierung', 'Texture graphite, valeurs', 'Textura de grafito, tonos'],
    'Yumuşak geçiş, ölçülü': ['Soft transitions, measured', 'Weiche Übergänge, kontrolliert', 'Transitions douces, mesurées', 'Transiciones suaves, medidas'],
    'Kendinden emin hat': ['Confident line', 'Selbstbewusste Linie', 'Trait assuré', 'Trazo seguro'],
    'İnce denetim, hacim': ['Fine control, volume', 'Feine Kontrolle, Volumen', 'Contrôle fin, volume', 'Control fino, volumen'],
    'Geniş hat, atmosfer': ['Broad line, atmosphere', 'Breite Linie, Atmosphäre', 'Trait large, atmosphère', 'Trazo amplio, atmósfera'],
    'Hızlı ve serbest, en az sabitleme': ['Fast and loose, minimal stabilization', 'Schnell und locker, minimale Stabilisierung', 'Rapide et libre, stabilisation minimale', 'Rápido y suelto, estabilización mínima'],
    'Tek sürekli, eşit kalınlık': ['One continuous line, even width', 'Eine durchgehende Linie, gleiche Breite', 'Un trait continu, épaisseur égale', 'Una línea continua, grosor uniforme'],
    'Dolu kütle, ağır hat': ['Solid mass, heavy line', 'Volle Masse, schwere Linie', 'Masse pleine, trait lourd', 'Masa sólida, trazo pesado'],
    'Canlı, değişken kalınlık': ['Lively, variable width', 'Lebendig, variable Breite', 'Vif, épaisseur variable', 'Vivo, grosor variable'],
    'Kalın mürekkep, net kütle': ['Bold ink, clean mass', 'Kräftige Tinte, klare Masse', 'Encre épaisse, masses nettes', 'Tinta gruesa, masas limpias'],
    'Basınca zengin, pürüzsüz': ['Pressure-rich, smooth', 'Druckreich, glatt', 'Riche en pression, lisse', 'Rico en presión, suave'],
    'Eşit hat, ızgara ve açı kilidi': ['Even line, grid and angle lock', 'Gleichmäßige Linie, Raster- und Winkelfixierung', 'Trait égal, verrouillage grille et angle', 'Trazo uniforme, bloqueo de cuadrícula y ángulo'],
    'İzometrik zemin, ince kalem': ['Isometric ground, fine pen', 'Isometrischer Untergrund, feiner Stift', 'Fond isométrique, stylo fin', 'Fondo isométrico, lápiz fino'],
    'Saf hat, doku yok': ['Pure line, no texture', 'Reine Linie, keine Textur', 'Trait pur, sans texture', 'Línea pura, sin textura'],
    'not, dipnot': ['notes, footnotes', 'Notizen, Fußnoten', 'notes, bas de page', 'notas, pies de página'],
    'günlük yazı': ['everyday writing', 'Alltagsschrift', 'écriture courante', 'escritura diaria'],
    'keski uç': ['chisel tip', 'Meißelspitze', 'pointe biseautée', 'punta de bisel'],
    'serbest el': ['freehand', 'Freihand', 'à main levée', 'a mano alzada'],
    'dolgun, net': ['full, crisp', 'voll, klar', 'plein, net', 'lleno, nítido'],
    'ince uç, canlı': ['fine tip, lively', 'feine Spitze, lebendig', 'pointe fine, vive', 'punta fina, viva'],
    'geniş, yumuşak': ['wide, soft', 'breit, weich', 'large, doux', 'ancho, suave'],
    'bu kalemin aslı': ['this pen’s original', 'das Original dieses Stifts', "l'original de ce stylo", 'el original de este lápiz'],

    // --- tema / tahta ---
    'Aydınlık': ['Light', 'Hell', 'Clair', 'Claro'],
    'Kızıl Gece': ['Red Night', 'Rote Nacht', 'Nuit rouge', 'Noche roja'],
    'Klasik': ['Classic', 'Klassisch', 'Classique', 'Clásico'],
    'Kara Tahta': ['Blackboard', 'Tafel', 'Tableau noir', 'Pizarra'],
    'Matematik Tahtası': ['Math Board', 'Mathe-Tafel', 'Tableau de maths', 'Pizarra de matemáticas'],
    'Noktalı Defter': ['Dot Notebook', 'Punktraster-Heft', 'Carnet pointillé', 'Cuaderno punteado'],
    'Çizgili Defter': ['Lined Notebook', 'Liniertes Heft', 'Carnet ligné', 'Cuaderno rayado'],
    'Orijinal krem tuval': ['Original cream canvas', 'Originale cremefarbene Leinwand', 'Toile crème d’origine', 'Lienzo crema original'],
    'Yeşil tebeşir tahtası — klasik his, toz dokusu': ['Green chalkboard — classic feel, dusty texture', 'Grüne Kreidetafel — klassisch, staubige Textur', 'Tableau vert — toucher classique, texture poussiéreuse', 'Pizarra verde — tacto clásico, textura de polvo'],
    'Koyu zemin, kareli ızgara — geometri ve grafik': ['Dark ground, square grid — geometry and graphs', 'Dunkler Grund, Karoraster — Geometrie und Grafik', 'Fond sombre, grille — géométrie et graphiques', 'Fondo oscuro, cuadrícula — geometría y gráficas'],
    'Krem zemin, noktalı düzen — minimal ve sade': ['Cream ground, dot layout — minimal and plain', 'Cremefarbener Grund, Punktraster — minimal', 'Fond crème, pointillés — minimal et sobre', 'Fondo crema, puntos — minimalista'],
    'Sarı defter, kırmızı kenar — not ve yazı': ['Yellow pad, red margin — notes and writing', 'Gelber Block, roter Rand — Notizen und Text', 'Bloc jaune, marge rouge — notes et écriture', 'Bloc amarillo, margen rojo — notas y escritura'],
    'Yoğun': ['Intense', 'Intensiv', 'Intense', 'Intenso'],
    'Canlı': ['Vivid', 'Lebhaft', 'Vif', 'Vivo'],
    'Sıcak': ['Warm', 'Warm', 'Chaud', 'Cálido'],
    'Sıfırla': ['Reset', 'Zurücksetzen', 'Réinitialiser', 'Restablecer'],
    'Pro Renk & Şema': ['Pro Color & Scheme', 'Pro-Farbe & Schema', 'Couleur et thème Pro', 'Color y esquema Pro'],
    'Karanlık Mod — tüm uygulama': ['Dark Mode — whole app', 'Dunkelmodus — ganze App', 'Mode sombre — toute l’app', 'Modo oscuro — toda la app'],
    'Pro İmleç — Kalem Figürü': ['Pro Cursor — Pen Figure', 'Pro-Zeiger — Stiftfigur', 'Curseur Pro — figure de stylo', 'Cursor Pro — figura de lápiz'],
    'Kapalı — doğal renkler': ['Off — natural colors', 'Aus — natürliche Farben', 'Désactivé — couleurs naturelles', 'Apagado — colores naturales'],
    'İmleç figürü kapalı — sistem imleci kullanılır': ['Cursor figure off — the system cursor is used', 'Zeigerfigur aus — Systemzeiger wird verwendet', 'Figure désactivée — curseur système utilisé', 'Figura desactivada — se usa el cursor del sistema'],
    'Seçtiğin figür + araca duyarlı imleçler, gerçek boyutta': ['Your figure + tool-aware cursors, at true size', 'Deine Figur + werkzeugbewusste Zeiger, in Originalgröße', 'Votre figure + curseurs selon l’outil, taille réelle', 'Tu figura + cursores según la herramienta, a tamaño real'],

    // --- depolama ---
    'Çalışmayı PDF Olarak İndir': ['Download work as PDF', 'Arbeit als PDF herunterladen', 'Télécharger le travail en PDF', 'Descargar el trabajo en PDF'],
    'Tümü': ['All', 'Alle', 'Tout', 'Todo'],
    'Geçerli sayfa': ['Current page', 'Aktuelle Seite', 'Page actuelle', 'Página actual'],
    'Geçerli sayfayı PNG indir': ['Download current page as PNG', 'Aktuelle Seite als PNG', 'Télécharger la page en PNG', 'Descargar la página en PNG'],
    'Tüm tahta, PDF ve görsel çalışmaların — küçük önizlemeleriyle.': ['All your board, PDF and image work — with thumbnails.', 'Alle Tafel-, PDF- und Bildarbeiten — mit Vorschaubildern.', 'Tous vos travaux tableau, PDF et image — avec aperçus.', 'Todos tus trabajos de pizarra, PDF e imagen — con miniaturas.'],
    'Kütüphanedeki bütün çalışmaları temelli siler. Bu işlem geri alınamaz.': ['Permanently deletes everything in the library. This cannot be undone.', 'Löscht alles in der Bibliothek endgültig. Nicht umkehrbar.', 'Supprime définitivement toute la bibliothèque. Irréversible.', 'Elimina definitivamente toda la biblioteca. No se puede deshacer.'],
    'Konum: tarayıcı veritabanı (IndexedDB)': ['Location: browser database (IndexedDB)', 'Ort: Browser-Datenbank (IndexedDB)', 'Emplacement : base du navigateur (IndexedDB)', 'Ubicación: base del navegador (IndexedDB)'],
    'Lisanslar ve Atıflar': ['Licenses and Credits', 'Lizenzen und Danksagungen', 'Licences et crédits', 'Licencias y créditos'],
    '📄 Açık kaynak bileşenler': ['📄 Open-source components', '📄 Open-Source-Komponenten', '📄 Composants open source', '📄 Componentes de código abierto'],
    'Onarım': ['Repair', 'Reparatur', 'Réparation', 'Reparación'],
    '🛟 Takılı durumları sıfırla': ['🛟 Reset stuck states', '🛟 Hängende Zustände zurücksetzen', '🛟 Réinitialiser les états bloqués', '🛟 Restablecer estados atascados'],
    'Ekran bildirimleri kapalıyken de her mesaj buraya yazılır.': ['Every message is logged here even when on-screen notifications are off.', 'Jede Meldung wird hier protokolliert, auch bei ausgeschalteten Hinweisen.', 'Chaque message est consigné ici même sans notifications à l’écran.', 'Cada mensaje se registra aquí aunque los avisos estén apagados.'],
    'Çözüm modundan çıkarken soru ve çözümün kütüphaneye otomatik kaydedilir.': ['On leaving solve mode, the question and your solution are saved to the library automatically.', 'Beim Verlassen des Lösungsmodus werden Frage und Lösung automatisch gespeichert.', 'En quittant le mode résolution, la question et la solution sont enregistrées.', 'Al salir del modo resolución, la pregunta y la solución se guardan automáticamente.'],
    'Deneysel Opsiyonlar — hepsi kapalı başlar, dilediğini aç': ['Experimental options — all start off, turn on what you like', 'Experimentelle Optionen — alle aus, nach Wunsch aktivieren', 'Options expérimentales — toutes désactivées au départ', 'Opciones experimentales — todas apagadas al inicio'],

    // --- uygulama ayarları / dil adları ---
    'Turkish': ['Turkish', 'Türkisch', 'Turc', 'Turco'],
    'İngilizce': ['English', 'Englisch', 'Anglais', 'Inglés'],
    'Almanca': ['German', 'Deutsch', 'Allemand', 'Alemán'],
    'Fransızca': ['French', 'Französisch', 'Français', 'Francés'],
    'İspanyolca': ['Spanish', 'Spanisch', 'Espagnol', 'Español'],
    '🔔 Ekran Bildirimleri': ['🔔 On-screen Notifications', '🔔 Bildschirmhinweise', '🔔 Notifications à l’écran', '🔔 Avisos en pantalla'],

    // --- yan panel ---
    'Oturum': ['Session', 'Sitzung', 'Session', 'Sesión'],
    'uygulama kapandığı gibi açılsın': ['reopen the app exactly as you closed it', 'App genau so öffnen, wie du sie geschlossen hast', "rouvrir l'app telle que vous l'avez quittée", 'reabrir la app tal como la cerraste'],
    '↩️ Kaldığın yerden devam et': ['↩️ Resume where you left off', '↩️ Dort weitermachen, wo du aufgehört hast', '↩️ Reprendre où vous en étiez', '↩️ Continuar donde lo dejaste'],
    'Kalem Profillerim': ['My Pen Profiles', 'Meine Stiftprofile', 'Mes profils de stylo', 'Mis perfiles de lápiz'],
    'Tahta ∞': ['Board ∞', 'Tafel ∞', 'Tableau ∞', 'Pizarra ∞'],
    'Seçili nesne yok.': ['No object selected.', 'Kein Objekt ausgewählt.', 'Aucun objet sélectionné.', 'Ningún objeto seleccionado.'],
    'Seçim aracıyla (V) tıkla veya alan çiz.': ['Use the select tool (V): click, or drag a region.', 'Mit dem Auswahlwerkzeug (V) klicken oder Bereich ziehen.', 'Avec l’outil de sélection (V) : cliquez ou tracez une zone.', 'Con la herramienta de selección (V): haz clic o arrastra un área.'],
    'Henüz kayıt yok': ['Nothing saved yet', 'Noch nichts gespeichert', 'Rien d’enregistré', 'Nada guardado aún'],
    'KÜTÜPHANE': ['LIBRARY', 'BIBLIOTHEK', 'BIBLIOTHÈQUE', 'BIBLIOTECA'],
    'SAYFALAR': ['PAGES', 'SEITEN', 'PAGES', 'PÁGINAS'],
    'BUGÜN': ['TODAY', 'HEUTE', "AUJOURD'HUI", 'HOY'],
    'DÜN': ['YESTERDAY', 'GESTERN', 'HIER', 'AYER'],
    'BU HAFTA': ['THIS WEEK', 'DIESE WOCHE', 'CETTE SEMAINE', 'ESTA SEMANA'],
    'BU AY': ['THIS MONTH', 'DIESEN MONAT', 'CE MOIS-CI', 'ESTE MES'],
    'BU YIL': ['THIS YEAR', 'DIESES JAHR', 'CETTE ANNÉE', 'ESTE AÑO'],
    'Daha eski': ['Older', 'Älter', 'Plus ancien', 'Más antiguo'],
    'Görsel': ['Image', 'Bild', 'Image', 'Imagen'],
    'Tahta': ['Board', 'Tafel', 'Tableau', 'Pizarra'],
  });

  /* ---------- eleman düzeyi : uzun açıklamalar ---------- */
  Object.assign(DEL, {
    // panel başlıkları
    'Kalınlık, renk, opaklık ve basınç — her kalem için ayrı.':
      ['Width, color, opacity and pressure — separately for every pen.', 'Breite, Farbe, Deckkraft und Druck — für jeden Stift einzeln.', 'Épaisseur, couleur, opacité et pression — pour chaque stylo.', 'Grosor, color, opacidad y presión — para cada lápiz.'],
    'Sabitleme, yumuşatma, otomatik şekil ve hizalama kılavuzları.':
      ['Stabilization, smoothing, auto-shape and alignment guides.', 'Stabilisierung, Glättung, Auto-Formen und Hilfslinien.', 'Stabilisation, lissage, formes automatiques et repères.', 'Estabilización, suavizado, formas automáticas y guías.'],
    'Tema, tahta zemini, düzen, odak modu ve sunum.':
      ['Theme, board surface, layout, focus mode and presentation.', 'Thema, Tafeluntergrund, Layout, Fokusmodus und Präsentation.', 'Thème, fond du tableau, mise en page, focus et présentation.', 'Tema, fondo de pizarra, diseño, modo enfoque y presentación.'],
    'Tuş atamaları ve sabit kombinasyonlar — tıkla, yeni tuşa bas.':
      ['Key bindings and fixed combos — click, then press the new key.', 'Tastenbelegung und feste Kombis — klicken, neue Taste drücken.', 'Affectations et combinaisons fixes — cliquez puis appuyez.', 'Asignaciones y combinaciones fijas — haz clic y pulsa la tecla.'],
    'Otomatik kayıt, kütüphane, dışa aktarma ve yedekleme.':
      ['Autosave, library, export and backup.', 'Autospeichern, Bibliothek, Export und Backup.', 'Sauvegarde auto, bibliothèque, export et sauvegarde.', 'Autoguardado, biblioteca, exportación y copia de seguridad.'],
    'Performans, çizgi netliği ve uzman seçenekleri.':
      ['Performance, line sharpness and expert options.', 'Leistung, Linienschärfe und Expertenoptionen.', 'Performance, netteté du trait et options expertes.', 'Rendimiento, nitidez del trazo y opciones expertas.'],
    'Uygulamayı kapattığın andaki çalışman, sayfan, yakınlaştırman, kalemin ve rengin bir sonraki açılışta aynen geri gelir. Kapatırsan uygulama her zaman boş tahtayla başlar.':
      ['Your work, page, zoom, pen and color at the moment you closed the app all come back exactly on the next launch. Turn this off and the app always starts with a blank board.',
       'Arbeit, Seite, Zoom, Stift und Farbe im Moment des Schließens kehren beim nächsten Start genau zurück. Ausgeschaltet startet die App immer mit leerer Tafel.',
       "Votre travail, page, zoom, stylo et couleur au moment de la fermeture reviennent tels quels au lancement suivant. Désactivé, l'app démarre toujours sur un tableau vierge.",
       'Tu trabajo, página, zoom, lápiz y color en el momento de cerrar vuelven igual en el siguiente inicio. Desactivado, la app siempre empieza con una pizarra en blanco.'],
    'Arayüz dili, bildirimler ve sürüm bilgisi.':
      ['Interface language, notifications and version info.', 'Oberflächensprache, Hinweise und Versionsinfo.', 'Langue de l’interface, notifications et version.', 'Idioma de la interfaz, avisos y versión.'],

    // bildirim notu (kullanıcının işaret ettiği metin)
    'Kapalıyken çalışma ekranına hiçbir bildirim düşmez — ne bilgi ne uyarı ne hata. Varsayılan kapalıdır. Bastırılan mesajlar yine de kaydedilir; merak edersen Ayarlar › Depolama › Son bildirimler listesinden bakabilirsin.':
      ['When off, nothing appears on the drawing screen — no info, no warning, no error. Off by default. Suppressed messages are still logged; you can review them under Settings › Storage › Recent notifications.',
       'Wenn aus, erscheint auf der Zeichenfläche nichts — keine Info, keine Warnung, kein Fehler. Standardmäßig aus. Unterdrückte Meldungen werden dennoch protokolliert; nachzulesen unter Einstellungen › Speicher › Letzte Hinweise.',
       "Désactivé, rien n'apparaît sur l'écran de dessin — ni info, ni avertissement, ni erreur. Désactivé par défaut. Les messages supprimés restent consignés ; voyez Paramètres › Stockage › Notifications récentes.",
       'Apagado, no aparece nada en la pantalla de dibujo — ni información, ni avisos, ni errores. Apagado por defecto. Los mensajes suprimidos quedan registrados; consúltalos en Ajustes › Almacenamiento › Avisos recientes.'],

    // yan panel ipuçları
    'Bir PDF veya görsel yükle; çalışmaların buraya sessizce kaydedilir.':
      ['Load a PDF or image; your work is saved here quietly.', 'Lade ein PDF oder Bild; deine Arbeit wird hier still gespeichert.', 'Chargez un PDF ou une image ; votre travail est enregistré ici.', 'Carga un PDF o una imagen; tu trabajo se guarda aquí en silencio.'],
    'PDF ve görsel çalışmaların otomatik ve sessizce buraya kaydedilir. Bir karta dokunarak kaldığın yerden devam et.':
      ['Your PDF and image work is saved here automatically and quietly. Tap a card to pick up where you left off.',
       'Deine PDF- und Bildarbeiten werden hier automatisch und still gespeichert. Tippe auf eine Karte, um weiterzumachen.',
       'Vos travaux PDF et image sont enregistrés ici automatiquement. Touchez une carte pour reprendre.',
       'Tus trabajos de PDF e imagen se guardan aquí automáticamente. Toca una tarjeta para continuar.'],
    'Bir çıkartma seç, tuvale dokunarak yapıştır. Toplu görsel içe aktarabilirsin.':
      ['Pick a sticker and tap the canvas to place it. You can import images in bulk.',
       'Wähle einen Sticker und tippe auf die Leinwand. Bilder lassen sich auch stapelweise importieren.',
       'Choisissez un autocollant et touchez la toile. Vous pouvez importer des images en lot.',
       'Elige una pegatina y toca el lienzo. Puedes importar imágenes en lote.'],

    // çizgi netliği (kullanıcının en çok ilgilendiği ayar)
    'Mürekkep, ekran çözünürlüğünün üzerinde taranır — tırtıklı kenarın gerçek sebebi budur, kalem ayarı değil. Net fabrika ayarıdır ve kutudan çıktığı gibi tırtıksız yazar. Akıcı yalnızca çok zayıf donanımda, Ultra ise aşırı yakınlaştırmada son kırıntı pürüzü için.':
      ['Ink is sampled above the screen resolution — this, not a pen setting, is the real cause of jagged edges. Sharp is the factory setting and writes smoothly out of the box. Fast is only for very weak hardware; Ultra is for the last trace of roughness at extreme zoom.',
       'Tinte wird oberhalb der Bildschirmauflösung abgetastet — das, nicht eine Stifteinstellung, verursacht ausgefranste Kanten. Scharf ist die Werkseinstellung und schreibt ab Werk sauber. Flüssig nur für sehr schwache Hardware; Ultra für den letzten Rest bei extremem Zoom.',
       "L'encre est échantillonnée au-delà de la résolution d'écran — c'est là, et non dans un réglage de stylo, la vraie cause des bords crénelés. Net est le réglage d'usine et écrit proprement d'emblée. Fluide seulement pour un matériel très faible ; Ultra pour l'ultime rugosité en zoom extrême.",
       'La tinta se muestrea por encima de la resolución de pantalla — esa, y no un ajuste del lápiz, es la causa real de los bordes dentados. Nítido es el ajuste de fábrica y escribe limpio de serie. Fluido solo para hardware muy débil; Ultra para el último resto de aspereza con zoom extremo.'],
  });

  try { api.apply() } catch (_) { }
})();
