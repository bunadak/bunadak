/* ============================================================================
   DİL KATMANI — Türkçe · English · Deutsch · Français · Español
   ----------------------------------------------------------------------------
   Arayüz Türkçe yazıldığı için çeviri anahtarları Türkçe dizelerin kendisidir.
   Çevirici, metin düğümlerini ve title/placeholder/aria-label özniteliklerini
   TAM EŞLEŞME ile değiştirir — parça eşleşmesi yapmaz. Böylece bir dizenin
   içinde geçen kısa bir kelime yanlışlıkla çevrilmez.

   Her düğümün özgün Türkçesi ilk geçişte saklanır; dil değiştirince çeviri
   her zaman ÖZGÜN metinden üretilir, çevirinin çevirisi alınmaz.

   Arayüz sonradan değişen parçalar da içerdiği için (ayar panelleri, kalem
   kartları, sayfa listesi) bir MutationObserver yeni gelen düğümleri de
   çevirir; bu yüzden dil seçimi uygulamanın her yerinde tutarlı kalır.
   ========================================================================= */
(function () {
  'use strict';
  const LSK = 'notis_lang1';
  const LANGS = [
    { c: 'tr', fl: '🇹🇷', n: 'Türkçe', e: 'Turkish' },
    { c: 'en', fl: '🇬🇧', n: 'English', e: 'İngilizce' },
    { c: 'de', fl: '🇩🇪', n: 'Deutsch', e: 'Almanca' },
    { c: 'fr', fl: '🇫🇷', n: 'Français', e: 'Fransızca' },
    { c: 'es', fl: '🇪🇸', n: 'Español', e: 'İspanyolca' },
  ];
  const IDX = { en: 0, de: 1, fr: 2, es: 3 };

  /* tr: [en, de, fr, es] */
  const D = {
    // --- gezinme / kategoriler ---
    'Ayarlar': ['Settings', 'Einstellungen', 'Paramètres', 'Ajustes'],
    "Notis'i senin için özelleştir": ['Make Notis yours', 'Notis anpassen', 'Personnalisez Notis', 'Personaliza Notis'],
    'Kalem': ['Pen', 'Stift', 'Stylo', 'Lápiz'],
    'Kalem Ayarları': ['Pen Settings', 'Stift-Einstellungen', 'Réglages du stylo', 'Ajustes del lápiz'],
    'Kalınlık, renk, opaklık, basınç': ['Width, color, opacity, pressure', 'Breite, Farbe, Deckkraft, Druck', 'Épaisseur, couleur, opacité, pression', 'Grosor, color, opacidad, presión'],
    'Çizim': ['Drawing', 'Zeichnen', 'Dessin', 'Dibujo'],
    'Sabitleme, yumuşatma, otomatik şekil': ['Stabilization, smoothing, auto-shape', 'Stabilisierung, Glättung, Auto-Form', 'Stabilisation, lissage, forme auto', 'Estabilización, suavizado, auto-forma'],
    'Çalışma Alanı': ['Workspace', 'Arbeitsbereich', 'Espace de travail', 'Área de trabajo'],
    'Tema, tahta zemini, düzen, odak': ['Theme, board, layout, focus', 'Thema, Tafel, Layout, Fokus', 'Thème, tableau, mise en page, focus', 'Tema, pizarra, diseño, enfoque'],
    'Klavye ve Kısayollar': ['Keyboard & Shortcuts', 'Tastatur & Kurzbefehle', 'Clavier et raccourcis', 'Teclado y atajos'],
    'Tuş atamaları ve sabit kombinasyonlar': ['Key bindings and fixed combos', 'Tastenbelegung und feste Kombis', 'Affectations et combinaisons fixes', 'Asignaciones y combinaciones fijas'],
    'Tuş Atamaları': ['Key Bindings', 'Tastenbelegung', 'Affectations de touches', 'Asignación de teclas'],
    'tuşa tıkla, yeni tuşa bas': ['click a key, press the new one', 'Taste anklicken, neue drücken', 'cliquez sur une touche, appuyez sur la nouvelle', 'haz clic en una tecla y pulsa la nueva'],
    'PDF ve Kayıt': ['PDF & Saving', 'PDF & Speichern', 'PDF et enregistrement', 'PDF y guardado'],
    'Otomatik kayıt, kütüphane, yedekleme': ['Autosave, library, backup', 'Autospeichern, Bibliothek, Backup', 'Sauvegarde auto, bibliothèque', 'Autoguardado, biblioteca, copia'],
    'Gelişmiş': ['Advanced', 'Erweitert', 'Avancé', 'Avanzado'],
    'Kısayollar, performans, uzman': ['Performance and expert options', 'Leistung und Expertenoptionen', 'Performance et options expertes', 'Rendimiento y opciones expertas'],
    'Uygulama Ayarları': ['App Settings', 'App-Einstellungen', "Réglages de l'application", 'Ajustes de la app'],
    'Dil, bildirimler ve sürüm': ['Language, notifications, version', 'Sprache, Hinweise, Version', 'Langue, notifications, version', 'Idioma, avisos, versión'],
    'Dil': ['Language', 'Sprache', 'Langue', 'Idioma'],
    'arayüz dili — anında uygulanır': ['interface language — applies instantly', 'Oberflächensprache — sofort wirksam', "langue de l'interface — effet immédiat", 'idioma de la interfaz — efecto inmediato'],
    'Sürüm': ['Version', 'Version', 'Version', 'Versión'],
    'Bildirimler': ['Notifications', 'Hinweise', 'Notifications', 'Avisos'],

    // --- kalem paneli ---
    'Canlı fırça önizleme': ['Live brush preview', 'Live-Pinselvorschau', 'Aperçu du pinceau en direct', 'Vista previa del pincel'],
    'Kalınlık': ['Width', 'Breite', 'Épaisseur', 'Grosor'],
    'Basınç Hassasiyeti': ['Pressure Sensitivity', 'Druckempfindlichkeit', 'Sensibilité à la pression', 'Sensibilidad a la presión'],
    'Opaklık': ['Opacity', 'Deckkraft', 'Opacité', 'Opacidad'],
    'Akış': ['Flow', 'Fluss', 'Débit', 'Flujo'],
    'Doku': ['Texture', 'Textur', 'Texture', 'Textura'],
    'Uç İnceltme': ['Tip Taper', 'Spitzen-Verjüngung', 'Effilage de pointe', 'Afilado de punta'],
    'Stabilizasyon': ['Stabilization', 'Stabilisierung', 'Stabilisation', 'Estabilización'],
    'Titreme azaltma': ['Jitter reduction', 'Zitter-Reduktion', 'Réduction du tremblement', 'Reducción de temblor'],
    'Uç Yapısı': ['Tip Shape', 'Spitzenform', 'Forme de pointe', 'Forma de punta'],
    'Renk': ['Color', 'Farbe', 'Couleur', 'Color'],
    'Sivri': ['Pointed', 'Spitz', 'Pointue', 'Puntiaguda'],
    'Sivri — uçlarda incelir': ['Pointed — tapers at the ends', 'Spitz — läuft an den Enden aus', 'Pointue — s’effile aux extrémités', 'Puntiaguda — se afina en los extremos'],
    'İnce — standart uç': ['Fine — standard tip', 'Fein — Standardspitze', 'Fine — pointe standard', 'Fina — punta estándar'],
    'Dolgun — geniş yuvarlak uç': ['Full — wide round tip', 'Voll — breite runde Spitze', 'Pleine — pointe ronde large', 'Gruesa — punta redonda ancha'],
    'Keski — düz kesim': ['Chisel — flat cut', 'Meißel — flacher Schnitt', 'Biseau — coupe plate', 'Bisel — corte plano'],
    'Hazır uçlar': ['Ready-made tips', 'Fertige Spitzen', 'Pointes prêtes', 'Puntas listas'],
    'seçili kalem için — dokun, anında uygulanır': ['for the selected pen — tap to apply instantly', 'für den gewählten Stift — tippen, sofort aktiv', 'pour le stylo choisi — appliqué aussitôt', 'para el lápiz elegido — se aplica al instante'],
    'Varsayılanlar': ['Defaults', 'Standardwerte', 'Valeurs par défaut', 'Valores por defecto'],
    'uygulama her açılışta buradan başlar': ['the app starts from these every launch', 'die App startet jedes Mal hiermit', "l'app démarre toujours avec ceci", 'la app arranca siempre con esto'],
    'Metin punto': ['Text size', 'Textgröße', 'Taille du texte', 'Tamaño de texto'],
    'Araca geçince varsayılanı uygula': ['Apply default when switching tools', 'Standard bei Werkzeugwechsel anwenden', "Appliquer le défaut au changement d'outil", 'Aplicar el valor por defecto al cambiar'],
    'Çark kalemleri': ['Wheel pens', 'Rad-Stifte', 'Stylos de la roue', 'Lápices de la rueda'],
    'sağ tık basılı tut › Kalem': ['hold right-click › Pen', 'Rechtsklick halten › Stift', 'clic droit maintenu › Stylo', 'mantén clic derecho › Lápiz'],
    'Önizlemeyi temizle': ['Clear preview', 'Vorschau leeren', "Effacer l'aperçu", 'Limpiar vista previa'],
    'Geçerli kalemi profil olarak kaydet': ['Save current pen as a profile', 'Aktuellen Stift als Profil sichern', 'Enregistrer le stylo comme profil', 'Guardar el lápiz como perfil'],
    'Akıllı Kalem': ['Smart Pen', 'Smart-Stift', 'Stylo intelligent', 'Lápiz inteligente'],
    'Akıllı kalem': ['Smart pen', 'Smart-Stift', 'Stylo intelligent', 'Lápiz inteligente'],
    'Tükenmez': ['Ballpoint', 'Kugelschreiber', 'Stylo à bille', 'Bolígrafo'],
    'Fosforlu': ['Highlighter', 'Textmarker', 'Surligneur', 'Marcador'],
    'Silgi': ['Eraser', 'Radierer', 'Gomme', 'Goma'],

    // --- çizim paneli ---
    'Çizgi Davranışı': ['Line Behaviour', 'Linienverhalten', 'Comportement du trait', 'Comportamiento del trazo'],
    'Çizgi yumuşatma': ['Line smoothing', 'Linienglättung', 'Lissage du trait', 'Suavizado del trazo'],
    'Gecikme tahmini': ['Latency prediction', 'Latenzvorhersage', 'Prédiction de latence', 'Predicción de latencia'],
    'Hareketi önceden kestirerek gecikmeyi azaltır': ['Predicts motion to cut latency', 'Sagt die Bewegung voraus und senkt die Latenz', 'Anticipe le geste pour réduire la latence', 'Anticipa el movimiento y reduce la latencia'],
    'Otomatik Düzeltme': ['Auto-Correct', 'Autokorrektur', 'Correction auto', 'Autocorrección'],
    'Şekilleri otomatik düzelt': ['Auto-correct shapes', 'Formen automatisch korrigieren', 'Corriger les formes', 'Corregir formas automáticamente'],
    'Fosforlu kalemi düzleştir': ['Straighten the highlighter', 'Textmarker begradigen', 'Redresser le surligneur', 'Enderezar el marcador'],
    'Hizalama': ['Alignment', 'Ausrichtung', 'Alignement', 'Alineación'],
    'Hizalama ve Kılavuzlar': ['Alignment & Guides', 'Ausrichtung & Hilfslinien', 'Alignement et repères', 'Alineación y guías'],
    'Izgaraya yapış (Snap)': ['Snap to grid', 'Am Raster einrasten', 'Aimanter à la grille', 'Ajustar a la cuadrícula'],
    'Yapışma aralığı': ['Snap spacing', 'Raster-Abstand', "Pas d'aimantation", 'Paso de ajuste'],
    "15°'lik adımlara kilitlenir": ['Locks to 15° steps', 'Rastet in 15°-Schritten ein', 'Verrouille par pas de 15°', 'Bloquea en pasos de 15°'],
    'Cetvelde açı yapışması': ['Angle snapping on the ruler', 'Winkelrasterung am Lineal', "Aimantation d'angle sur la règle", 'Ajuste de ángulo en la regla'],
    'Akıllı kılavuz çizgileri': ['Smart guide lines', 'Intelligente Hilfslinien', 'Repères intelligents', 'Guías inteligentes'],
    'Sayfa merkezine hizalanınca kılavuz göster': ['Show a guide when centred on the page', 'Hilfslinie zeigen, wenn mittig', 'Afficher un repère au centrage', 'Mostrar guía al centrar'],
    'Kapalı': ['Off', 'Aus', 'Désactivé', 'Apagado'],
    'Düşük': ['Low', 'Niedrig', 'Faible', 'Bajo'],
    'Orta': ['Medium', 'Mittel', 'Moyen', 'Medio'],
    'Yüksek': ['High', 'Hoch', 'Élevé', 'Alto'],
    'Akıcı': ['Fast', 'Flüssig', 'Fluide', 'Fluido'],
    'Net': ['Sharp', 'Scharf', 'Net', 'Nítido'],
    'Ultra': ['Ultra', 'Ultra', 'Ultra', 'Ultra'],

    // --- çalışma alanı ---
    'Tema': ['Theme', 'Thema', 'Thème', 'Tema'],
    'Tahta Stili': ['Board Style', 'Tafelstil', 'Style de tableau', 'Estilo de pizarra'],
    'Solak düzeni': ['Left-handed layout', 'Linkshänder-Layout', 'Disposition gaucher', 'Disposición zurda'],
    'Araç rayını sağa taşır': ['Moves the tool rail to the right', 'Verschiebt die Werkzeugleiste nach rechts', "Déplace la barre d'outils à droite", 'Mueve la barra de herramientas a la derecha'],
    'Kompakt arayüz': ['Compact interface', 'Kompakte Oberfläche', 'Interface compacte', 'Interfaz compacta'],
    'Arayüz Gizleme': ['Hide Interface', 'Oberfläche ausblenden', "Masquer l'interface", 'Ocultar interfaz'],
    'Hepsi görünür': ['All visible', 'Alle sichtbar', 'Tout visible', 'Todo visible'],
    'Sol gizli': ['Left hidden', 'Links verborgen', 'Gauche masquée', 'Izquierda oculta'],
    'İkisi gizli': ['Both hidden', 'Beide verborgen', 'Les deux masqués', 'Ambos ocultos'],
    'Köşe kontrollerini göster': ['Show corner controls', 'Ecksteuerung anzeigen', 'Afficher les commandes de coin', 'Mostrar controles de esquina'],
    'Sol alttaki yakınlaştırma ve sayfa gezintisi': ['Zoom and page nav at bottom-left', 'Zoom und Seitennavigation unten links', 'Zoom et navigation en bas à gauche', 'Zoom y navegación abajo a la izquierda'],
    'Yüzen mini araç çubuğu': ['Floating mini toolbar', 'Schwebende Mini-Leiste', 'Mini-barre flottante', 'Mini barra flotante'],
    'Hareket halkası': ['Gesture ring', 'Gestenring', 'Anneau de gestes', 'Anillo de gestos'],
    'Hızlı Erişim': ['Quick Access', 'Schnellzugriff', 'Accès rapide', 'Acceso rápido'],
    'Sunum ve İşaretçi': ['Presentation & Pointer', 'Präsentation & Zeiger', 'Présentation et pointeur', 'Presentación y puntero'],
    'Lazer işaretçi': ['Laser pointer', 'Laserpointer', 'Pointeur laser', 'Puntero láser'],
    'Lazer rengi': ['Laser color', 'Laserfarbe', 'Couleur du laser', 'Color del láser'],
    'Spot ışığı': ['Spotlight', 'Spotlight', 'Projecteur', 'Foco'],
    'Spot ışığı yarıçapı': ['Spotlight radius', 'Spotlight-Radius', 'Rayon du projecteur', 'Radio del foco'],
    'Sunumda kaydırma sayfaları çevirir': ['Scrolling flips pages in presentation', 'Scrollen blättert in der Präsentation', 'Le défilement tourne les pages', 'El desplazamiento pasa páginas'],
    'Tekerlekle sayfa geçişi': ['Wheel changes pages', 'Mausrad wechselt Seiten', 'La molette change de page', 'La rueda cambia de página'],
    'Sonsuz tuval': ['Infinite canvas', 'Unendliche Leinwand', 'Toile infinie', 'Lienzo infinito'],
    'Tek sayfalık belgede sınırsız tahta': ['Unlimited board in a single-page document', 'Unbegrenzte Tafel in einem Einseiten-Dokument', 'Tableau illimité sur un document d’une page', 'Pizarra ilimitada en un documento de una página'],

    // --- sayfa / kenar paneli ---
    'Sayfalar': ['Pages', 'Seiten', 'Pages', 'Páginas'],
    'Katmanlar': ['Layers', 'Ebenen', 'Calques', 'Capas'],
    'Çıkartma': ['Sticker', 'Sticker', 'Autocollant', 'Pegatina'],
    'Çıkartmalar': ['Stickers', 'Sticker', 'Autocollants', 'Pegatinas'],
    'Kütüphane': ['Library', 'Bibliothek', 'Bibliothèque', 'Biblioteca'],
    'Kütüphaneyi Aç': ['Open Library', 'Bibliothek öffnen', 'Ouvrir la bibliothèque', 'Abrir biblioteca'],
    'Sayfa': ['Page', 'Seite', 'Page', 'Página'],
    'Sayfa ara (ad / no)': ['Search pages (name / no)', 'Seiten suchen (Name / Nr.)', 'Rechercher (nom / n°)', 'Buscar páginas (nombre / n.º)'],
    'Yeni sayfa': ['New page', 'Neue Seite', 'Nouvelle page', 'Nueva página'],
    'Yeni katman': ['New layer', 'Neue Ebene', 'Nouveau calque', 'Nueva capa'],
    'Sayfayı çoğalt': ['Duplicate page', 'Seite duplizieren', 'Dupliquer la page', 'Duplicar página'],
    'Sayfayı sil': ['Delete page', 'Seite löschen', 'Supprimer la page', 'Eliminar página'],
    'Sayfayı döndür': ['Rotate page', 'Seite drehen', 'Pivoter la page', 'Girar página'],
    'Sayfa Özellikleri': ['Page Properties', 'Seiteneigenschaften', 'Propriétés de la page', 'Propiedades de página'],
    'Önceki sayfa': ['Previous page', 'Vorherige Seite', 'Page précédente', 'Página anterior'],
    'Sonraki sayfa': ['Next page', 'Nächste Seite', 'Page suivante', 'Página siguiente'],
    'Sayfaya git (Ctrl+Alt+G)': ['Go to page (Ctrl+Alt+G)', 'Zur Seite (Strg+Alt+G)', 'Aller à la page (Ctrl+Alt+G)', 'Ir a la página (Ctrl+Alt+G)'],
    'Yer imi': ['Bookmark', 'Lesezeichen', 'Signet', 'Marcador'],
    'Yalnız yer imleri (Ctrl+B ile ekle)': ['Bookmarks only (add with Ctrl+B)', 'Nur Lesezeichen (mit Strg+B)', 'Signets seulement (Ctrl+B)', 'Solo marcadores (Ctrl+B)'],
    'Sırala': ['Sort', 'Sortieren', 'Trier', 'Ordenar'],
    'Tarih': ['Date', 'Datum', 'Date', 'Fecha'],
    'Ad': ['Name', 'Name', 'Nom', 'Nombre'],
    'Liste / kart görünümü': ['List / card view', 'Listen-/Kartenansicht', 'Vue liste / carte', 'Vista lista / tarjeta'],
    'Kayıt ara…': ['Search saves…', 'Speicherstände suchen…', 'Rechercher…', 'Buscar guardados…'],
    'Kayıtlı çalışma': ['Saved work', 'Gespeicherte Arbeit', 'Travail enregistré', 'Trabajo guardado'],
    'Aramayı temizle': ['Clear search', 'Suche leeren', 'Effacer la recherche', 'Limpiar búsqueda'],
    'Tüm kayıtları sil': ['Delete all saves', 'Alle Speicherstände löschen', 'Supprimer tout', 'Eliminar todo'],
    'Temelli Sil': ['Delete Permanently', 'Endgültig löschen', 'Supprimer définitivement', 'Eliminar definitivamente'],
    'Alan Kullanımı': ['Storage Used', 'Speicherbelegung', 'Espace utilisé', 'Uso de espacio'],
    'Hesaplanıyor…': ['Calculating…', 'Wird berechnet…', 'Calcul en cours…', 'Calculando…'],
    'Konum hesaplanıyor…': ['Locating…', 'Ort wird ermittelt…', 'Localisation…', 'Calculando ubicación…'],

    // --- kâğıt / biçim ---
    'KÂĞIT TÜRÜ': ['PAPER TYPE', 'PAPIERART', 'TYPE DE PAPIER', 'TIPO DE PAPEL'],
    'BİÇİM': ['FORMAT', 'FORMAT', 'FORMAT', 'FORMATO'],
    'SAYFA ETİKETİ': ['PAGE LABEL', 'SEITENBESCHRIFTUNG', 'ÉTIQUETTE DE PAGE', 'ETIQUETA DE PÁGINA'],
    'Düz': ['Plain', 'Blanko', 'Uni', 'Liso'],
    'Çizgili': ['Lined', 'Liniert', 'Ligné', 'Rayado'],
    'Kareli': ['Grid', 'Kariert', 'Quadrillé', 'Cuadriculado'],
    'Noktalı': ['Dotted', 'Gepunktet', 'Pointillé', 'Punteado'],
    'İzometrik': ['Isometric', 'Isometrisch', 'Isométrique', 'Isométrico'],
    'Milimetrik (grafik kâğıdı)': ['Graph paper', 'Millimeterpapier', 'Papier millimétré', 'Papel milimetrado'],
    'Koordinat düzlemi': ['Coordinate plane', 'Koordinatensystem', 'Plan de coordonnées', 'Plano de coordenadas'],
    'Özel arka plan': ['Custom background', 'Eigener Hintergrund', 'Fond personnalisé', 'Fondo personalizado'],
    'Bir görseli sayfa zemini yap': ['Use an image as the page background', 'Bild als Seitenhintergrund', 'Utiliser une image comme fond', 'Usar una imagen como fondo'],
    'Görsel Seç': ['Choose Image', 'Bild wählen', 'Choisir une image', 'Elegir imagen'],
    'Beyaz': ['White', 'Weiß', 'Blanc', 'Blanco'],
    'Lacivert': ['Navy', 'Marineblau', 'Marine', 'Azul marino'],
    'Kırmızı': ['Red', 'Rot', 'Rouge', 'Rojo'],
    'Yeşil': ['Green', 'Grün', 'Vert', 'Verde'],

    // --- araçlar / genel eylemler ---
    'Geri al': ['Undo', 'Rückgängig', 'Annuler', 'Deshacer'],
    'Geri Al (Ctrl+Z)': ['Undo (Ctrl+Z)', 'Rückgängig (Strg+Z)', 'Annuler (Ctrl+Z)', 'Deshacer (Ctrl+Z)'],
    'Yinele (Ctrl+Y)': ['Redo (Ctrl+Y)', 'Wiederholen (Strg+Y)', 'Rétablir (Ctrl+Y)', 'Rehacer (Ctrl+Y)'],
    'Sil': ['Delete', 'Löschen', 'Supprimer', 'Eliminar'],
    'Yenile': ['Refresh', 'Aktualisieren', 'Actualiser', 'Actualizar'],
    'Tamam': ['OK', 'OK', 'OK', 'OK'],
    'Vazgeç': ['Cancel', 'Abbrechen', 'Annuler', 'Cancelar'],
    '✓ Kaydet': ['✓ Save', '✓ Speichern', '✓ Enregistrer', '✓ Guardar'],
    '↺ Sıfırla': ['↺ Reset', '↺ Zurücksetzen', '↺ Réinitialiser', '↺ Restablecer'],
    'Varsayılanlara dön': ['Restore defaults', 'Standard wiederherstellen', 'Rétablir les valeurs par défaut', 'Restaurar valores'],
    'Çık (Esc)': ['Exit (Esc)', 'Beenden (Esc)', 'Quitter (Échap)', 'Salir (Esc)'],
    'Çıkış Yap': ['Quit', 'Beenden', 'Quitter', 'Salir'],
    'Kaydet ve uygulamayı kapat': ['Save and close the app', 'Speichern und App schließen', "Enregistrer et fermer l'app", 'Guardar y cerrar la app'],
    'Yaklaş (+)': ['Zoom in (+)', 'Vergrößern (+)', 'Zoom avant (+)', 'Acercar (+)'],
    'Uzaklaş (-)': ['Zoom out (-)', 'Verkleinern (-)', 'Zoom arrière (-)', 'Alejar (-)'],
    'Sığdır (0)': ['Fit (0)', 'Einpassen (0)', 'Ajuster (0)', 'Ajustar (0)'],
    'Tam ekran (F11)': ['Full screen (F11)', 'Vollbild (F11)', 'Plein écran (F11)', 'Pantalla completa (F11)'],
    'Komut Paleti · Evrensel Arama (Ctrl+K)': ['Command Palette · Universal Search (Ctrl+K)', 'Befehlspalette · Suche (Strg+K)', 'Palette de commandes · Recherche (Ctrl+K)', 'Paleta de comandos · Búsqueda (Ctrl+K)'],
    'Seçili nesneleri grupla (Ctrl+G)': ['Group selection (Ctrl+G)', 'Auswahl gruppieren (Strg+G)', 'Grouper la sélection (Ctrl+G)', 'Agrupar selección (Ctrl+G)'],
    '90° Döndür': ['Rotate 90°', 'Um 90° drehen', 'Pivoter de 90°', 'Girar 90°'],
    'Ortala X': ['Center X', 'X zentrieren', 'Centrer X', 'Centrar X'],
    'Ortala Y': ['Center Y', 'Y zentrieren', 'Centrer Y', 'Centrar Y'],
    'Üste': ['To front', 'Nach vorn', 'Au premier plan', 'Al frente'],
    'Alta': ['To back', 'Nach hinten', "À l'arrière-plan", 'Al fondo'],
    'Sola': ['Left', 'Links', 'Gauche', 'Izquierda'],
    'Sağa': ['Right', 'Rechts', 'Droite', 'Derecha'],
    'Aktar': ['Export', 'Exportieren', 'Exporter', 'Exportar'],
    'Dışa Aktar': ['Export', 'Exportieren', 'Exporter', 'Exportar'],
    'Dışa aktar': ['Export', 'Exportieren', 'Exporter', 'Exportar'],
    'PDF / Görsel içe aktar': ['Import PDF / image', 'PDF / Bild importieren', 'Importer PDF / image', 'Importar PDF / imagen'],
    'Görsel klasöründen içe aktar': ['Import from your images folder', 'Aus dem Bilderordner importieren', 'Importer depuis vos images', 'Importar desde tus imágenes'],
    'PDF — tüm sayfalar': ['PDF — all pages', 'PDF — alle Seiten', 'PDF — toutes les pages', 'PDF — todas las páginas'],
    'PNG — geçerli sayfa (yüksek çözünürlük)': ['PNG — current page (high resolution)', 'PNG — aktuelle Seite (hohe Auflösung)', 'PNG — page actuelle (haute résolution)', 'PNG — página actual (alta resolución)'],
    'SVG — vektörel (Illustrator / Figma / web)': ['SVG — vector (Illustrator / Figma / web)', 'SVG — Vektor (Illustrator / Figma / Web)', 'SVG — vectoriel (Illustrator / Figma / web)', 'SVG — vectorial (Illustrator / Figma / web)'],
    '.notis — düzenlenebilir proje dosyası': ['.notis — editable project file', '.notis — bearbeitbare Projektdatei', '.notis — fichier de projet modifiable', '.notis — archivo de proyecto editable'],
    'Web Sayfası — tahtaya yansıt & üzerine çiz': ['Web page — cast to the board & draw on it', 'Webseite — auf die Tafel spiegeln & bemalen', 'Page web — projeter et dessiner dessus', 'Página web — proyectar y dibujar encima'],
    'Boş tahtaya dön (yeni çalışma alanı)': ['Back to a blank board (new workspace)', 'Zurück zur leeren Tafel (neuer Bereich)', 'Revenir à un tableau vierge', 'Volver a una pizarra en blanco'],
    'Çözüm alanını temizle': ['Clear the solving area', 'Lösungsbereich leeren', 'Effacer la zone de résolution', 'Limpiar el área de resolución'],
    'Geri dön — karalamalar kaydedilmez (Esc)': ['Go back — scratch work is not saved (Esc)', 'Zurück — Notizen werden nicht gespeichert (Esc)', 'Retour — le brouillon n’est pas enregistré (Échap)', 'Volver — el borrador no se guarda (Esc)'],
    'Renk Tekerleği': ['Color Wheel', 'Farbrad', 'Roue chromatique', 'Rueda de color'],
    'Kalem kalınlığı': ['Pen width', 'Stiftbreite', 'Épaisseur du stylo', 'Grosor del lápiz'],
    'Not': ['Note', 'Notiz', 'Note', 'Nota'],
    'Not Al · Çiz · Planla': ['Take notes · Draw · Plan', 'Notieren · Zeichnen · Planen', 'Noter · Dessiner · Planifier', 'Anota · Dibuja · Planifica'],
    'Notis — Not Al, Çiz, Planla': ['Notis — Take Notes, Draw, Plan', 'Notis — Notieren, Zeichnen, Planen', 'Notis — Noter, Dessiner, Planifier', 'Notis — Anota, Dibuja, Planifica'],

    // --- gelişmiş anahtarlar ---
    '🔬 Çizgi netliği': ['🔬 Line sharpness', '🔬 Linienschärfe', '🔬 Netteté du trait', '🔬 Nitidez del trazo'],
    '✒️ Pro Kalem Modu': ['✒️ Pro Pen Mode', '✒️ Pro-Stift-Modus', '✒️ Mode stylo Pro', '✒️ Modo lápiz Pro'],
    '✒️ Living Ink': ['✒️ Living Ink', '✒️ Living Ink', '✒️ Encre vivante', '✒️ Tinta viva'],
    '💭 Memory Canvas': ['💭 Memory Canvas', '💭 Memory Canvas', '💭 Toile mémoire', '💭 Lienzo con memoria'],
    '💾 Sessiz otomatik kayıt': ['💾 Silent autosave', '💾 Stilles Autospeichern', '💾 Sauvegarde auto silencieuse', '💾 Autoguardado silencioso'],
    '🖋 Odaklı Yazım Modu': ['🖋 Focused Writing Mode', '🖋 Fokussierter Schreibmodus', '🖋 Mode écriture concentrée', '🖋 Modo escritura enfocada'],
    '🎥 Otomatik Odak Zoom': ['🎥 Auto Focus Zoom', '🎥 Auto-Fokus-Zoom', '🎥 Zoom auto', '🎥 Zoom automático'],
    '🧬 Pen DNA': ['🧬 Pen DNA', '🧬 Pen DNA', '🧬 ADN du stylo', '🧬 ADN del lápiz'],
    '🧭 Kenar Oto-Kaydırma': ['🧭 Edge Auto-Scroll', '🧭 Rand-Autoscroll', '🧭 Défilement auto des bords', '🧭 Autodesplazamiento de borde'],
    '🧲 Akıllı Snap': ['🧲 Smart Snap', '🧲 Intelligentes Einrasten', '🧲 Aimantation intelligente', '🧲 Ajuste inteligente'],
    '⛶ Panel gizleme': ['⛶ Hide panels', '⛶ Panels ausblenden', '⛶ Masquer les panneaux', '⛶ Ocultar paneles'],
    '🖨 Yazdır — gerçek kâğıt ölçüsünde': ['🖨 Print — at true paper size', '🖨 Drucken — in echter Papiergröße', '🖨 Imprimer — taille réelle', '🖨 Imprimir — tamaño real'],
    '🧑‍🏫 Tahta çizimlerini de kaydet': ['🧑‍🏫 Save board drawings too', '🧑‍🏫 Tafelzeichnungen mitspeichern', '🧑‍🏫 Enregistrer aussi le tableau', '🧑‍🏫 Guardar también la pizarra'],
    'Otomatik Kayıt': ['Autosave', 'Autospeichern', 'Sauvegarde auto', 'Autoguardado'],
    'Premium Görünüm': ['Premium Look', 'Premium-Optik', 'Apparence premium', 'Aspecto premium'],
    'Doku & vinyet': ['Texture & vignette', 'Textur & Vignette', 'Texture et vignettage', 'Textura y viñeta'],
    'Kalem Kalitesi': ['Pen Quality', 'Stiftqualität', 'Qualité du stylo', 'Calidad del lápiz'],

    // --- çizim modları / türleri ---
    'Çizim Modları': ['Drawing Modes', 'Zeichenmodi', 'Modes de dessin', 'Modos de dibujo'],
    'Çizim Türleri': ['Drawing Types', 'Zeichenarten', 'Types de dessin', 'Tipos de dibujo'],
    'dokun — kalem, zemin, palet ve ayarlar birlikte kurulur': ['tap — pen, surface, palette and settings are set together', 'tippen — Stift, Untergrund, Palette und Einstellungen zusammen', 'touchez — stylo, fond, palette et réglages ensemble', 'toca — lápiz, fondo, paleta y ajustes a la vez'],
    'teknik kurulumlar — zemin, ızgara ve hat kilidi dahil': ['technical setups — surface, grid and line lock included', 'technische Setups — Untergrund, Raster und Linienfixierung', 'configurations techniques — fond, grille et verrouillage', 'configuraciones técnicas — fondo, cuadrícula y bloqueo'],
    'Manga': ['Manga', 'Manga', 'Manga', 'Manga'],
    'Karakalem': ['Graphite', 'Graphit', 'Fusain', 'Grafito'],
    'Portre': ['Portrait', 'Porträt', 'Portrait', 'Retrato'],
    'Figür': ['Figure', 'Figur', 'Figure', 'Figura'],
    'Natürmort': ['Still Life', 'Stillleben', 'Nature morte', 'Bodegón'],
    'Manzara': ['Landscape', 'Landschaft', 'Paysage', 'Paisaje'],
    'Jest': ['Gesture', 'Geste', 'Geste', 'Gesto'],
    'Kontur': ['Contour', 'Kontur', 'Contour', 'Contorno'],
    'Silüet': ['Silhouette', 'Silhouette', 'Silhouette', 'Silueta'],
    'Karikatür': ['Cartoon', 'Karikatur', 'Caricature', 'Caricatura'],
    'Çizgi Roman': ['Comic', 'Comic', 'Bande dessinée', 'Cómic'],
    'Dijital Çizim': ['Digital Drawing', 'Digitales Zeichnen', 'Dessin numérique', 'Dibujo digital'],
    'Teknik Resim': ['Technical Drawing', 'Technische Zeichnung', 'Dessin technique', 'Dibujo técnico'],
    'Mimari Resim': ['Architectural Drawing', 'Architekturzeichnung', 'Dessin architectural', 'Dibujo arquitectónico'],
    'Çizgisel Çizim': ['Line Art', 'Linienzeichnung', 'Dessin au trait', 'Arte lineal'],

    // --- profiller ---
    'Kalem Profillerim': ['My Pen Profiles', 'Meine Stiftprofile', 'Mes profils de stylo', 'Mis perfiles de lápiz'],
    'kendi kurduğun kalemler — tek dokunuşla geri dön': ['pens you built — return with one tap', 'deine eigenen Stifte — mit einem Tipp zurück', 'vos stylos — un seul geste pour revenir', 'tus lápices — vuelve con un toque'],
    '＋ Şu anki kalemi profil olarak kaydet': ['＋ Save current pen as a profile', '＋ Aktuellen Stift als Profil sichern', '＋ Enregistrer le stylo actuel', '＋ Guardar el lápiz actual'],
    'Profil adı': ['Profile name', 'Profilname', 'Nom du profil', 'Nombre del perfil'],
    'Kaydet': ['Save', 'Speichern', 'Enregistrer', 'Guardar'],
    'Yeniden adlandır': ['Rename', 'Umbenennen', 'Renommer', 'Renombrar'],
    'Profili sil': ['Delete profile', 'Profil löschen', 'Supprimer le profil', 'Eliminar perfil'],
    'Henüz profil yok. Bir kalemi istediğin gibi ayarla, sonra yukarıdaki düğmeyle adıyla kaydet.':
      ['No profiles yet. Set a pen up exactly how you like it, then save it by name with the button above.',
       'Noch keine Profile. Richte einen Stift nach deinem Geschmack ein und sichere ihn oben mit Namen.',
       "Aucun profil. Réglez un stylo à votre goût, puis enregistrez-le avec le bouton ci-dessus.",
       'Aún no hay perfiles. Ajusta un lápiz a tu gusto y guárdalo con el botón de arriba.'],
    'İnce Çizgi': ['Fine Line', 'Feine Linie', 'Trait fin', 'Línea fina'],
    'Mürekkep': ['Ink', 'Tinte', 'Encre', 'Tinta'],
    'Kaligrafi': ['Calligraphy', 'Kalligrafie', 'Calligraphie', 'Caligrafía'],
    'Eskiz': ['Sketch', 'Skizze', 'Esquisse', 'Boceto'],
    'İmza': ['Signature', 'Unterschrift', 'Signature', 'Firma'],
    'Marker': ['Marker', 'Marker', 'Marqueur', 'Rotulador'],
    'Fabrika': ['Factory', 'Werk', 'Usine', 'Fábrica'],
  };

  /* ---- çevirici ---- */
  let cur = 'tr';
  try { cur = localStorage.getItem(LSK) || 'tr' } catch (_) { }

  const tr = (s) => {
    if (cur === 'tr') return null;
    const row = D[s]; if (!row) return null;
    const v = row[IDX[cur]];
    return (v && v !== s) ? v : null;
  };

  const ATTRS = ['title', 'placeholder', 'aria-label'];
  const SKIP = { SCRIPT: 1, STYLE: 1, CANVAS: 1, SVG: 1 };

  function walk(root) {
    if (!root) return;
    // metin düğümleri
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode;
        if (!p || SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const list = []; let n;
    while ((n = it.nextNode())) list.push(n);
    for (const t of list) {
      if (t.__o === undefined) t.__o = t.nodeValue;
      const raw = t.__o, s = raw.trim();
      const v = tr(s);
      t.nodeValue = v == null ? raw : raw.replace(s, v);
    }
    // öznitelikler
    const els = root.querySelectorAll ? root.querySelectorAll('[title],[placeholder],[aria-label]') : [];
    const all = (root.nodeType === 1 && (root.hasAttribute('title') || root.hasAttribute('placeholder') || root.hasAttribute('aria-label'))) ? [root, ...els] : [...els];
    for (const el of all) {
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        const k = '__o_' + a;
        if (el[k] === undefined) el[k] = el.getAttribute(a);
        const raw = el[k], v = tr((raw || '').trim());
        el.setAttribute(a, v == null ? raw : v);
      }
    }
  }

  let pending = false, obs = null;
  function applyAll() {
    walk(document.body);
    try { document.documentElement.lang = cur } catch (_) { }
    renderPicker();
  }
  function schedule(root) {
    if (cur === 'tr' && !pending) { /* Türkçe'de de özgün metni geri yazmalıyız */ }
    if (pending) return; pending = true;
    requestAnimationFrame(() => { pending = false; try { walk(root || document.body); renderPicker() } catch (_) { } });
  }

  function setLang(c) {
    /* IDX.en === 0 olduğu için burada truthy kontrolü kullanılamaz:
       sıfır falsy'dir ve İngilizce sessizce reddedilirdi. */
    if (c !== 'tr' && IDX[c] === undefined) return;
    cur = c; try { localStorage.setItem(LSK, c) } catch (_) { }
    applyAll();
    const L = LANGS.find(x => x.c === c);
    try { if (typeof toast === 'function') toast((L ? L.n : c) + ' ✓') } catch (_) { }
  }

  /* ---- dil seçici ---- */
  function renderPicker() {
    const host = document.getElementById('langGrid'); if (!host) return;
    if (host.childElementCount !== LANGS.length) {
      host.innerHTML = '';
      for (const L of LANGS) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'lang-b'; b.dataset.l = L.c;
        b.innerHTML = '<span class="fl">' + L.fl + '</span><span class="lw"><span class="ln">' + L.n +
          '</span><span class="le">' + L.e + '</span></span><span class="ck">✓</span>';
        b.addEventListener('click', () => setLang(L.c));
        host.appendChild(b);
      }
    }
    for (const b of host.children) b.classList.toggle('on', b.dataset.l === cur);
    const v = document.getElementById('appVer');
    if (v && !v.dataset.done) {
      v.dataset.done = '1';
      v.textContent = 'Notis Pro';
      try {
        if (window.go && window.go.main && window.go.main.App && window.go.main.App.Info)
          window.go.main.App.Info().then(i => { if (i && i.version) v.textContent = 'Notis Pro ' + i.version });
      } catch (_) { }
    }
  }

  function init() {
    renderPicker();
    if (cur !== 'tr') applyAll();
    if (!obs) {
      obs = new MutationObserver(ms => {
        for (const m of ms) if (m.addedNodes && m.addedNodes.length) { schedule(document.body); return }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
    const dlg = document.getElementById('setDlg');
    if (dlg && !dlg.__i18n) {
      dlg.__i18n = true;
      new MutationObserver(() => { if (dlg.open) schedule(dlg) }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.proI18n = { setLang, lang: () => cur, LANGS, dict: D, apply: applyAll };
})();
