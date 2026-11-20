/* ============================================================================
   SON SÖZLÜK TURU — bölüm başlıkları, kalem açıklamaları ve kalan bloklar
   ----------------------------------------------------------------------------
   Burada üç şey var:
     · Ayar kategorilerinin alt başlıkları (.set-sec-t) — tek metin düğümü.
     · On çark kaleminin açıklamaları (CPENS[].d) — tek metin düğümü.
     · Motor künyesi gibi parçalardan kurulan dizeler — desen kuralıyla.
   Bu turdan sonra ekranda çevrilmemiş Türkçe metin kalmaz; tek istisna
   uygulamanın adı olan "Notis"tir.
   ========================================================================= */
(function () {
  'use strict';
  function boot() {
    const api = window.proI18n;
    if (!api) return;
    const D = api.dict, DEL = api.elDict;

    Object.assign(D, {
      // ------------------------------- PRO ARAYÜZ: gerçek masaüstü yetenekleri
      'Pro Arayüz': ['Pro Interface', 'Pro-Oberfläche', 'Interface Pro', 'Interfaz Pro'],
      'uygulamanın onsuz yapamadığı şeyler': [
        'things the app cannot do without them', 'was die App ohne sie nicht kann',
        'ce que l’application ne peut pas faire sans elles', 'lo que la aplicación no puede hacer sin ellas'],
      'Görünüm İnceliği': ['Visual Refinement', 'Visuelle Feinheit', 'Finesse visuelle', 'Refinamiento visual'],
      'kayıt ve sunum için ince dokunuşlar': [
        'subtle touches for recording and presenting', 'feine Akzente für Aufnahme und Präsentation',
        'touches subtiles pour l’enregistrement et la présentation', 'toques sutiles para grabar y presentar'],
      '🔎 Arayüz Ölçeği': ['🔎 Interface Scale', '🔎 Oberflächen-Skalierung', '🔎 Échelle de l’interface', '🔎 Escala de la interfaz'],
      '📌 Pencere Her Zaman Üstte': ['📌 Keep Window Always on Top', '📌 Fenster immer im Vordergrund', '📌 Fenêtre toujours au premier plan', '📌 Ventana siempre encima'],
      '🪟 Pencere Çerçevesini Hatırla': ['🪟 Remember Window Frame', '🪟 Fensterrahmen merken', '🪟 Mémoriser le cadre de la fenêtre', '🪟 Recordar el marco de la ventana'],
      '· yalnız uygulamada': ['· desktop app only', '· nur in der Desktop-App', '· application de bureau uniquement', '· solo en la aplicación de escritorio'],
      '%100 — fabrika ayarı': ['100% — factory setting', '100 % — Werkseinstellung', '100 % — réglage d’usine', '100 % — ajuste de fábrica'],
      // ------------------------------------------ KATEGORİ ALT BAŞLIKLARI
      'Kalınlık, renk, opaklık ve basınç — her kalem için ayrı.': [
        'Width, color, opacity and pressure — separately for every pen.',
        'Breite, Farbe, Deckkraft und Druck — für jeden Stift einzeln.',
        'Épaisseur, couleur, opacité et pression — pour chaque stylo séparément.',
        'Grosor, color, opacidad y presión — por separado para cada lápiz.'],
      'Sabitleme, yumuşatma, otomatik şekil ve hizalama kılavuzları.': [
        'Stabilization, smoothing, automatic shapes and alignment guides.',
        'Stabilisierung, Glättung, automatische Formen und Hilfslinien.',
        'Stabilisation, lissage, formes automatiques et guides d’alignement.',
        'Estabilización, suavizado, formas automáticas y guías de alineación.'],
      'Tema, tahta zemini, düzen, odak modu ve sunum.': [
        'Theme, board background, layout, focus mode and presentation.',
        'Thema, Tafelhintergrund, Layout, Fokusmodus und Präsentation.',
        'Thème, fond du tableau, disposition, mode focus et présentation.',
        'Tema, fondo de la pizarra, disposición, modo enfoque y presentación.'],
      'Tuş atamaları ve sabit kombinasyonlar — tıkla, yeni tuşa bas.': [
        'Key assignments and fixed combinations — click, then press the new key.',
        'Tastenbelegungen und feste Kombinationen — anklicken, neue Taste drücken.',
        'Affectations de touches et combinaisons fixes — cliquez, puis appuyez sur la nouvelle touche.',
        'Asignaciones de teclas y combinaciones fijas — haz clic y pulsa la nueva tecla.'],
      'Otomatik kayıt, kütüphane, dışa aktarma ve yedekleme.': [
        'Auto-save, library, export and backup.',
        'Automatisches Speichern, Bibliothek, Export und Sicherung.',
        'Enregistrement automatique, bibliothèque, export et sauvegarde.',
        'Guardado automático, biblioteca, exportación y copia de seguridad.'],
      'Performans, çizgi netliği ve uzman seçenekleri.': [
        'Performance, stroke sharpness and expert options.',
        'Leistung, Strichschärfe und Expertenoptionen.',
        'Performance, netteté du trait et options avancées.',
        'Rendimiento, nitidez del trazo y opciones avanzadas.'],
      'Arayüz dili, bildirimler ve sürüm bilgisi.': [
        'Interface language, notifications and version information.',
        'Oberflächensprache, Benachrichtigungen und Versionsinformationen.',
        'Langue de l’interface, notifications et informations de version.',
        'Idioma de la interfaz, notificaciones e información de versión.'],

      // ---------------------------------------- ON ÇARK KALEMİ AÇIKLAMASI
      '⭐ Varsayılan — dengeli basınç+hız, doğal el yazısı hissi': [
        '⭐ Default — balanced pressure + speed, a natural handwriting feel',
        '⭐ Standard — ausgewogener Druck + Geschwindigkeit, natürliches Schreibgefühl',
        '⭐ Par défaut — pression + vitesse équilibrées, sensation d’écriture naturelle',
        '⭐ Predeterminado — presión + velocidad equilibradas, sensación de escritura natural'],
      'Sabit ve net çizgi — hızlı not için ideal': [
        'A steady, crisp line — ideal for quick notes',
        'Gleichmäßige, klare Linie — ideal für schnelle Notizen',
        'Un trait régulier et net — idéal pour les notes rapides',
        'Un trazo firme y nítido — ideal para notas rápidas'],
      'Basınca duyarlı mürekkep — akışkan, ıslak uç': [
        'Pressure-sensitive ink — fluid, wet tip',
        'Druckempfindliche Tinte — fließend, feuchte Spitze',
        'Encre sensible à la pression — fluide, pointe humide',
        'Tinta sensible a la presión — fluida, punta húmeda'],
      'Grafit dokusu — eskiz ve gölgeleme': [
        'Graphite texture — sketching and shading',
        'Graphittextur — Skizzieren und Schattieren',
        'Texture graphite — croquis et ombrage',
        'Textura de grafito — bocetos y sombreado'],
      'Yarı saydam vurgu — metin üstünde çarpar (multiply)': [
        'Translucent highlight — multiplies over text (multiply)',
        'Durchscheinende Hervorhebung — multipliziert über Text (multiply)',
        'Surlignage translucide — se multiplie sur le texte (multiply)',
        'Resaltado translúcido — multiplica sobre el texto (multiply)'],
      'Dolgun keçe ucu — poster ve şema': [
        'A full felt tip — posters and diagrams',
        'Volle Filzspitze — Poster und Diagramme',
        'Pointe feutre pleine — affiches et schémas',
        'Punta de fieltro plena — carteles y esquemas'],
      '⭐ Mutlak sabit kalınlık — teknik çizim ve cetvel işi': [
        '⭐ Absolutely constant width — technical drawing and ruler work',
        '⭐ Absolut konstante Breite — technisches Zeichnen und Linealarbeit',
        '⭐ Épaisseur absolument constante — dessin technique et travail à la règle',
        '⭐ Grosor absolutamente constante — dibujo técnico y trabajo con regla'],
      '45° keski ucu — yöne göre incelen zarif hat': [
        'A 45° chisel tip — an elegant line that thins with direction',
        '45°-Keilspitze — elegante Linie, die sich je nach Richtung verjüngt',
        'Pointe biseautée à 45° — un trait élégant qui s’affine selon la direction',
        'Punta biselada a 45° — un trazo elegante que se afina según la dirección'],
      'Basınçla açılan kıl fırça — boya hissi': [
        'A bristle brush that opens with pressure — a painting feel',
        'Borstenpinsel, der sich mit Druck öffnet — Malgefühl',
        'Un pinceau à poils qui s’ouvre sous la pression — sensation de peinture',
        'Un pincel de cerdas que se abre con la presión — sensación de pintura'],
      'Püskürtme sprey — yumuşak gölge ve hava': [
        'An atomized spray — soft shadow and air',
        'Zerstäubter Sprühnebel — weicher Schatten und Luft',
        'Un spray atomisé — ombre douce et air',
        'Un espray atomizado — sombra suave y aire'],

      // ----------------------------------------------- KALAN KISA METİNLER
      'Bu kalem fabrika ayarlarında — iki şerit birebir aynı.': [
        'This pen is at its factory settings — the two bands are identical.',
        'Dieser Stift ist in Werkseinstellung — die beiden Streifen sind identisch.',
        'Ce stylo est à ses réglages d’usine — les deux bandes sont identiques.',
        'Este lápiz está en sus ajustes de fábrica — las dos bandas son idénticas.'],
      'Bir çizgi çiz — ölçüm burada belirir': [
        'Draw a stroke — the measurement appears here',
        'Zeichne einen Strich — die Messung erscheint hier',
        'Tracez un trait — la mesure apparaît ici',
        'Dibuja un trazo — la medición aparece aquí'],
      'Fotoğraf dostu': ['Photo-friendly', 'Fotofreundlich', 'Respectueux des photos', 'Respetuoso con las fotos'],
      'Teknik Kalem': ['Technical Pen', 'Technischer Stift', 'Stylo technique', 'Lápiz técnico'],
      // üst çubuk sık-renk ipuçlarında geçen tek sözcük kalem adları
      'Mürekkep': ['Ink', 'Tinte', 'Encre', 'Tinta'],
      'Dolma': ['Fountain', 'Füller', 'Plume', 'Estilográfica'],
      'Kurşun': ['Pencil', 'Bleistift', 'Crayon', 'Lápiz'],
      'Keçeli': ['Felt Tip', 'Filzstift', 'Feutre', 'Rotulador'],
      'Kaligrafi': ['Calligraphy', 'Kalligrafie', 'Calligraphie', 'Caligrafía'],
      'Fırça': ['Brush', 'Pinsel', 'Pinceau', 'Pincel'],
      'Teknik': ['Technical', 'Technisch', 'Technique', 'Técnico'],
      'Üzerine çizdiğin PDF\'i': ['The PDF you drew on', 'Das PDF, auf dem du gezeichnet hast', 'Le PDF sur lequel vous avez dessiné', 'El PDF sobre el que dibujaste'],
      'tek dosya olarak indirir. Kütüphanedeki çalışman': [
        'is downloaded as a single file. Your work in the library',
        'wird als eine einzelne Datei heruntergeladen. Deine Arbeit in der Bibliothek',
        'est téléchargé en un seul fichier. Votre travail dans la bibliothèque',
        'se descarga como un único archivo. Tu trabajo en la biblioteca'],
      'silinmez, değişmez': ['is neither deleted nor altered', 'wird weder gelöscht noch verändert', 'n’est ni supprimé ni modifié', 'no se elimina ni se altera'],
      '— bu işlem yalnızca okur. Boş tahtada içeriğin tamamı, çözüm alanında soru ve çözüm tek sayfada basılır.': [
        '— this operation only reads. On a blank board the whole content is printed; in the solve area the question and the solution go on a single page.',
        '— dieser Vorgang liest nur. Auf einer leeren Tafel wird der gesamte Inhalt gedruckt; im Lösungsbereich kommen Aufgabe und Lösung auf eine Seite.',
        '— cette opération ne fait que lire. Sur un tableau vierge tout le contenu est imprimé ; dans la zone de résolution, l’énoncé et la solution tiennent sur une seule page.',
        '— esta operación solo lee. En una pizarra vacía se imprime todo el contenido; en el área de resolución el enunciado y la solución van en una sola página.'],
      'Kayıtların bu bilgisayarda, uygulamanın kendi yerel veritabanında saklanır ve kapatıp açınca yerli yerindedir.': [
        'Your records are kept on this computer, in the app’s own local database, and are right where you left them after closing and reopening.',
        'Deine Aufzeichnungen liegen auf diesem Computer in der eigenen lokalen Datenbank der App und sind nach dem Schließen und Öffnen unverändert da.',
        'Vos enregistrements sont conservés sur cet ordinateur, dans la base de données locale de l’application, et se retrouvent intacts après fermeture et réouverture.',
        'Tus registros se guardan en este ordenador, en la base de datos local de la aplicación, y siguen ahí tras cerrar y volver a abrir.'],
      'Yedek almak için aşağıdaki “Tümünü yedekle” düğmesini kullan — klasörü elle kopyalamak güvenilir değildir.': [
        'Use the “Back up everything” button below to make a backup — copying the folder by hand is not reliable.',
        'Nutze die Schaltfläche „Alles sichern“ unten für eine Sicherung — den Ordner per Hand zu kopieren ist nicht zuverlässig.',
        'Utilisez le bouton « Tout sauvegarder » ci-dessous pour une sauvegarde — copier le dossier à la main n’est pas fiable.',
        'Usa el botón «Respaldar todo» de abajo para hacer una copia — copiar la carpeta a mano no es fiable.'],
      'Bu ürün, kendi lisansları altında dağıtılan açık kaynak bileşenler kullanır:': [
        'This product uses open-source components distributed under their own licenses:',
        'Dieses Produkt verwendet Open-Source-Komponenten unter deren eigenen Lizenzen:',
        'Ce produit utilise des composants open source distribués sous leurs propres licences :',
        'Este producto usa componentes de código abierto distribuidos bajo sus propias licencias:'],
      've el yazısı fontu (SIL Open Font License 1.1). Lisans metinleri uygulama paketindeki': [
        'and the handwriting font (SIL Open Font License 1.1). The license texts are, inside the application package, in',
        'und die Handschriftschrift (SIL Open Font License 1.1). Die Lizenztexte liegen im Anwendungspaket in',
        'et la police manuscrite (SIL Open Font License 1.1). Les textes de licence se trouvent, dans le paquet de l’application, dans',
        'y la tipografía manuscrita (SIL Open Font License 1.1). Los textos de licencia están, dentro del paquete de la aplicación, en'],
      'dosyasında korunmuştur. Notis Pro tescilli bir yazılımdır; kopyalanamaz ve dağıtılamaz.': [
        'Notis Pro is proprietary software; it may not be copied or distributed.',
        'Notis Pro ist proprietäre Software; Kopieren und Weitergabe sind nicht erlaubt.',
        'Notis Pro est un logiciel propriétaire ; il ne peut être copié ni distribué.',
        'Notis Pro es software propietario; no puede copiarse ni distribuirse.'],
      '; yalnız yarım kalmış etkileşimleri temizler. Kısayol:': [
        '; it only clears half-finished interactions. Shortcut:',
        '; es löscht nur unvollendete Interaktionen. Tastenkürzel:',
        '; il n’efface que les interactions inachevées. Raccourci :',
        '; solo limpia interacciones a medias. Atajo:'],
      'Çözüm alanı — soru ve çözüm tek sayfada': [
        'Solve area — question and solution on a single page',
        'Lösungsbereich — Aufgabe und Lösung auf einer Seite',
        'Zone de résolution — énoncé et solution sur une seule page',
        'Área de resolución — enunciado y solución en una sola página'],
    });

    /* Hem kapsayıcı hem tek metin düğümü olabildikleri için iki sözlüğe de girer */
    const IKI = {
      'Araç rayı, üst panel, simgeler ve yazılar birlikte ölçeklenir. 4K ekranda arayüz fazla küçük, küçük dizüstünde fazla iri kalıyordu; burada kendine göre ayarlarsın. Çalışma alanı daralıp genişler ama çizimlerin ölçeği değişmez — tuval yeniden ölçülür.': [
        'The tool rail, top panel, icons and text scale together. The interface was too small on a 4K screen and too large on a small laptop; here you set it to suit you. The work area narrows or widens, but the scale of your drawings does not change — the canvas is re-measured.',
        'Werkzeugleiste, obere Leiste, Symbole und Text skalieren gemeinsam. Auf einem 4K-Bildschirm war die Oberfläche zu klein, auf einem kleinen Laptop zu groß; hier stellst du sie passend ein. Der Arbeitsbereich wird schmaler oder breiter, der Maßstab deiner Zeichnungen bleibt gleich — die Leinwand wird neu gemessen.',
        'La barre d’outils, le panneau supérieur, les icônes et le texte s’échelonnent ensemble. L’interface était trop petite sur un écran 4K et trop grande sur un petit portable ; ici vous l’ajustez à votre goût. La zone de travail se resserre ou s’élargit, mais l’échelle de vos dessins ne change pas — la toile est remesurée.',
        'La barra de herramientas, el panel superior, los iconos y el texto escalan juntos. La interfaz quedaba demasiado pequeña en una pantalla 4K y demasiado grande en un portátil pequeño; aquí la ajustas a tu medida. El área de trabajo se estrecha o se amplía, pero la escala de tus dibujos no cambia — el lienzo se vuelve a medir.'],
      'Tahta diğer bütün pencerelerin üstünde durur: tarayıcıya, bir sunuma ya da videoya üstünden çizebilirsin, arkadaki uygulama görünmeye devam eder.': [
        'The board stays above every other window: you can draw over a browser, a presentation or a video, and the application behind keeps showing through.',
        'Die Tafel bleibt über allen anderen Fenstern: du kannst über einen Browser, eine Präsentation oder ein Video zeichnen, die Anwendung dahinter bleibt sichtbar.',
        'Le tableau reste au-dessus de toutes les autres fenêtres : vous pouvez dessiner par-dessus un navigateur, une présentation ou une vidéo, et l’application en dessous reste visible.',
        'La pizarra permanece encima de todas las demás ventanas: puedes dibujar sobre un navegador, una presentación o un vídeo, y la aplicación de detrás sigue visible.'],
      'Uygulamayı hangi konumda ve boyutta kapattıysan bir sonraki açılışta aynı çerçevede açılır. Çift ekranlı kurulumlarda tahtayı her seferinde yeniden yerleştirmekten kurtarır.': [
        'The app reopens in the same frame — the position and size you closed it at. On dual-screen setups it saves you from repositioning the board every time.',
        'Die App öffnet sich im selben Rahmen — in Position und Größe, in der du sie geschlossen hast. Bei Zwei-Monitor-Aufbauten ersparst du dir das Neuplatzieren der Tafel.',
        'L’application se rouvre dans le même cadre — la position et la taille auxquelles vous l’avez fermée. Sur une configuration à deux écrans, cela évite de replacer le tableau chaque fois.',
        'La aplicación se reabre en el mismo marco — la posición y el tamaño con los que la cerraste. En configuraciones de dos pantallas te ahorra recolocar la pizarra cada vez.'],
      'Sonsuz tahtanın zemini — hepsi opsiyonel, varsayılan Klasik. Koyu tahtaya geçince siyah kalem kendiliğinden tebeşir beyazına döner.': [
        'The background of the infinite board — all optional, Classic by default. Switch to a dark board and a black pen turns chalk-white on its own.',
        'Der Hintergrund der unendlichen Tafel — alles optional, standardmäßig Klassisch. Bei einer dunklen Tafel wird ein schwarzer Stift von selbst kreideweiß.',
        'Le fond du tableau infini — tout est optionnel, Classique par défaut. En passant à un tableau sombre, un stylo noir devient blanc craie de lui-même.',
        'El fondo de la pizarra infinita — todo opcional, Clásico por defecto. Al pasar a una pizarra oscura, un lápiz negro se vuelve blanco tiza por sí solo.'],
      'Tuşa tıkla, yeni tuşa bas. Sabit: Ctrl+Z/Y, Ctrl+G/D/A, Del, Boşluk, Esc, +/−, PgUp/PgDn.': [
        'Click a key, then press the new one. Fixed: Ctrl+Z/Y, Ctrl+G/D/A, Del, Space, Esc, +/−, PgUp/PgDn.',
        'Taste anklicken, dann neue Taste drücken. Fest: Ctrl+Z/Y, Ctrl+G/D/A, Entf, Leertaste, Esc, +/−, Bild↑/Bild↓.',
        'Cliquez sur une touche, puis appuyez sur la nouvelle. Fixes : Ctrl+Z/Y, Ctrl+G/D/A, Suppr, Espace, Échap, +/−, PgUp/PgDn.',
        'Haz clic en una tecla y pulsa la nueva. Fijas: Ctrl+Z/Y, Ctrl+G/D/A, Supr, Espacio, Esc, +/−, PgUp/PgDn.'],
      'Bir PDF veya görsel yükle; çalışmaların buraya sessizce kaydedilir.': [
        'Load a PDF or an image; your works are saved here quietly.',
        'Lade ein PDF oder ein Bild; deine Arbeiten werden hier still gespeichert.',
        'Chargez un PDF ou une image ; vos travaux sont enregistrés ici en silence.',
        'Carga un PDF o una imagen; tus trabajos se guardan aquí en silencio.'],
      'PDF ve görsel çalışmaların otomatik ve sessizce buraya kaydedilir. Bir karta dokunarak kaldığın yerden devam et.': [
        'Your PDF and image works are saved here automatically and quietly. Tap a card to continue where you left off.',
        'Deine PDF- und Bildarbeiten werden hier automatisch und still gespeichert. Tippe eine Karte an, um dort weiterzumachen, wo du aufgehört hast.',
        'Vos travaux PDF et image sont enregistrés ici automatiquement et en silence. Touchez une carte pour reprendre où vous en étiez.',
        'Tus trabajos de PDF e imagen se guardan aquí automática y silenciosamente. Toca una tarjeta para continuar donde lo dejaste.'],
      'Bir çıkartma seç, tuvale dokunarak yapıştır. Toplu görsel içe aktarabilirsin.': [
        'Pick a sticker and tap the canvas to place it. You can import images in bulk.',
        'Wähle einen Sticker und tippe auf die Leinwand, um ihn zu setzen. Du kannst Bilder stapelweise importieren.',
        'Choisissez un autocollant et touchez la toile pour le poser. Vous pouvez importer des images en lot.',
        'Elige una pegatina y toca el lienzo para colocarla. Puedes importar imágenes en lote.'],
    };
    Object.assign(DEL, IKI);
    Object.assign(D, IKI);

    /* Motor künyesi parçalardan kuruluyor; sayı yerine sabit sözcükler
       çevrilsin diye desen kuralı kullanılır. */
    api.rules.push(
      [/^(⭐ Varsayılan · )?Brush Engine: (\S+) · (\S+) interpolasyon · (\S+) hız süzgeci · Anti Alias: Ultra · Palm Rejection: Açık$/,
        ['Brush Engine: $2 · $3 interpolation · $4 velocity filter · Anti-Alias: Ultra · Palm Rejection: On',
         'Brush Engine: $2 · $3-Interpolation · $4-Geschwindigkeitsfilter · Anti-Aliasing: Ultra · Palm Rejection: Ein',
         'Brush Engine : $2 · interpolation $3 · filtre de vitesse $4 · anti-aliasing : Ultra · rejet de la paume : activé',
         'Brush Engine: $2 · interpolación $3 · filtro de velocidad $4 · Anti-Alias: Ultra · rechazo de palma: activado']],
      [/^(.+) · (.+) ([\d.,]+)px\s+\((\d+) · sağ tık: sil\)$/,
        ['$1 · $2 $3px ($4 · right-click: delete)', '$1 · $2 $3px ($4 · Rechtsklick: löschen)',
         '$1 · $2 $3px ($4 · clic droit : supprimer)', '$1 · $2 $3px ($4 · clic derecho: eliminar)']],
      [/^(\d+) sayfanın tamamı$/, ['all $1 pages', 'alle $1 Seiten', 'les $1 pages', 'las $1 páginas']],
      [/^(\d+) \/ (\d+) sayfa\s+·\s+(.+)$/,
        ['$1 / $2 pages · $3', '$1 / $2 Seiten · $3', '$1 / $2 pages · $3', '$1 / $2 páginas · $3']],
      [/^%(\d+)$/, ['$1%', '$1 %', '$1 %', '$1 %']],
      [/^%(\d+) sıcaklık · gece için göz dostu$/,
        ['$1% warmth · easy on the eyes at night', '$1 % Wärme · nachts augenschonend',
         '$1 % de chaleur · reposant pour les yeux la nuit', '$1 % de calidez · agradable para los ojos de noche']],
      [/^([\d.,]+) px · sunumda fare tekeriyle de ayarlanır$/,
        ['$1 px · also adjustable with the mouse wheel during a presentation',
         '$1 px · in der Präsentation auch mit dem Mausrad einstellbar',
         '$1 px · réglable aussi à la molette pendant une présentation',
         '$1 px · también ajustable con la rueda del ratón en presentación']]
    );

    if (api.reset) api.reset();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 90));
  else setTimeout(boot, 90);
})();
