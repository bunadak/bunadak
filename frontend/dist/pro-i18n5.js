/* ============================================================================
   ELEMAN DÜZEYİ ÇEVİRİLER — ikinci bölüm
   Karanlık mod ayrıntıları, imleç figürü, klavye, depolama ve deneysel
   opsiyonların uzun açıklamaları. Biçim ve gerekçe pro-i18n4.js ile aynıdır.
   ========================================================================= */
(function () {
  'use strict';
  function boot() {
    const api = window.proI18n;
    if (!api) return;
    const DEL = api.elDict;

    Object.assign(DEL, {
      // ------------------------------------------- KARANLIK MOD AYRINTILARI
      'Keskin (önerilen): dönüşüm ekran kartında, çizim anında yapılır — sayfa anında doğru renkte açılır, tam çözünürlük korunur (metin kılı kılına keskin kalır), bellek kullanmaz. Metin ve şema ağırlıklı belgeler için en iyisi; fotoğraflar negatife döner. Fotoğraf dostu: piksel analiziyle fotoğraf ve renkli grafiklerin tonu korunur — karşılığında daha yavaştır ve bellek kullanır.': [
        'Sharp (recommended): the conversion happens on the graphics card at draw time — the page opens in the right color instantly, full resolution is kept (text stays hair-sharp) and no memory is used. Best for text- and diagram-heavy documents; photos turn negative. Photo-friendly: pixel analysis preserves the tones of photos and color charts — in exchange it is slower and uses memory.',
        'Scharf (empfohlen): die Umwandlung erfolgt auf der Grafikkarte beim Zeichnen — die Seite öffnet sofort in der richtigen Farbe, die volle Auflösung bleibt erhalten (Text bleibt haarscharf) und es wird kein Speicher belegt. Am besten für text- und diagrammlastige Dokumente; Fotos werden negativ. Fotofreundlich: per Pixelanalyse bleiben die Töne von Fotos und Farbgrafiken erhalten — dafür ist es langsamer und belegt Speicher.',
        'Net (recommandé) : la conversion a lieu sur la carte graphique au moment du tracé — la page s’ouvre aussitôt dans la bonne couleur, la pleine résolution est conservée (le texte reste parfaitement net) et aucune mémoire n’est utilisée. Idéal pour les documents riches en texte et schémas ; les photos passent en négatif. Respectueux des photos : l’analyse des pixels préserve les teintes des photos et graphiques couleur — en contrepartie, c’est plus lent et cela consomme de la mémoire.',
        'Nítido (recomendado): la conversión se hace en la tarjeta gráfica al dibujar — la página se abre al instante con el color correcto, se conserva la resolución completa (el texto queda nítido al detalle) y no usa memoria. Lo mejor para documentos con mucho texto y esquemas; las fotos se vuelven negativas. Respetuoso con las fotos: el análisis de píxeles conserva los tonos de fotos y gráficos en color — a cambio es más lento y consume memoria.'],
      'Yumuşak: gözü zorlamayan gri · Standart: dengeli (önerilen) · Derin: en koyu.': [
        'Soft: an easy gray · Standard: balanced (recommended) · Deep: the darkest.',
        'Weich: augenschonendes Grau · Standard: ausgewogen (empfohlen) · Tief: am dunkelsten.',
        'Doux : un gris reposant · Standard : équilibré (recommandé) · Profond : le plus sombre.',
        'Suave: un gris que no cansa · Estándar: equilibrado (recomendado) · Profundo: el más oscuro.'],
      'Gece kâğıdının rengi. Sıcak mavi ışığı azaltır (uzun okuma), Serin daha kontrastlı görünür.': [
        'The color of the night paper. Warm reduces blue light (for long reading); Cool looks more contrasty.',
        'Die Farbe des Nachtpapiers. Warm reduziert Blaulicht (langes Lesen), Kühl wirkt kontrastreicher.',
        'La couleur du papier nocturne. Chaud réduit la lumière bleue (lecture prolongée), Froid paraît plus contrasté.',
        'El color del papel nocturno. Cálido reduce la luz azul (lectura prolongada), Frío se ve más contrastado.'],
      'Fotoğraf, grafik ve renkli tabloların tonu ve doygunluğu korunur; yalnız parlaklıkları dengelenir. Kapatırsan her şey tek tip gri-ters çevrilir (bazı teknik çizimlerde tercih edilebilir).': [
        'The tone and saturation of photos, charts and color tables are preserved; only their brightness is balanced. Turn it off and everything is inverted into uniform gray (which some technical drawings may prefer).',
        'Ton und Sättigung von Fotos, Grafiken und Farbtabellen bleiben erhalten; nur ihre Helligkeit wird ausgeglichen. Ausgeschaltet wird alles einheitlich grau invertiert (bei manchen technischen Zeichnungen erwünscht).',
        'La teinte et la saturation des photos, graphiques et tableaux couleur sont préservées ; seule leur luminosité est équilibrée. Désactivé, tout est inversé en gris uniforme (parfois préférable pour certains dessins techniques).',
        'Se conservan el tono y la saturación de fotos, gráficos y tablas en color; solo se equilibra su brillo. Si lo desactivas, todo se invierte a un gris uniforme (preferible en algunos dibujos técnicos).'],
      'Koyu zeminde siyah çizimler kaybolmasın diye çizimlerinin rengi ekranda dengelenir. Kaydedilen veri ve dışa aktarım orijinal renklerdedir. Fosforlu kalem koyu zeminde parlar.': [
        'So that black strokes do not vanish on a dark background, your strokes’ color is balanced on screen. Saved data and exports keep the original colors. The highlighter glows on a dark background.',
        'Damit schwarze Striche auf dunklem Grund nicht verschwinden, wird die Farbe deiner Striche am Bildschirm ausgeglichen. Gespeicherte Daten und Exporte behalten die Originalfarben. Der Marker leuchtet auf dunklem Grund.',
        'Pour que les traits noirs ne disparaissent pas sur fond sombre, la couleur de vos tracés est équilibrée à l’écran. Les données enregistrées et les exports conservent les couleurs d’origine. Le surligneur brille sur fond sombre.',
        'Para que los trazos negros no desaparezcan sobre fondo oscuro, el color de tus trazos se equilibra en pantalla. Los datos guardados y las exportaciones mantienen los colores originales. El resaltador brilla sobre fondo oscuro.'],
      'Boş çalışma tahtasının zemini ve ızgarası da gece tonuna iner. Kapatırsan karanlık mod yalnız arayüz ve belgeler için çalışır. (Kara Tahta / Matematik Tahtası stilleri zaten koyudur, değişmez.)': [
        'The blank board’s background and grid also drop to the night tone. Turn it off and dark mode applies only to the interface and documents. (The Blackboard / Math Board styles are already dark and stay unchanged.)',
        'Auch Hintergrund und Raster der leeren Tafel sinken auf den Nachtton. Ausgeschaltet gilt der Dunkelmodus nur für Oberfläche und Dokumente. (Die Stile Schultafel / Mathetafel sind bereits dunkel und bleiben unverändert.)',
        'Le fond et la grille du tableau vierge passent aussi à la teinte nocturne. Désactivé, le mode sombre ne s’applique qu’à l’interface et aux documents. (Les styles Tableau noir / Tableau de maths sont déjà sombres et ne changent pas.)',
        'El fondo y la rejilla de la pizarra vacía también pasan al tono nocturno. Si lo desactivas, el modo oscuro se aplica solo a la interfaz y los documentos. (Los estilos Pizarra / Pizarra de matemáticas ya son oscuros y no cambian.)'],
      'Üst çubuk, araç rayı, paneller ve pencereler gece paletine iner. Temanı değiştirmez — seçtiğin vurgu rengi aynı kalır, yalnız yüzeyler koyulaşır ve kontrast uzun okuma için yumuşar. Zaten koyu bir tema kullanıyorsan bir tık daha derine iner.': [
        'The top bar, tool rail, panels and windows drop to the night palette. It does not change your theme — the accent color you chose stays the same, only the surfaces darken and the contrast softens for long reading. If you already use a dark theme, it goes one step deeper.',
        'Obere Leiste, Werkzeugleiste, Panels und Fenster wechseln zur Nachtpalette. Dein Thema bleibt unverändert — die gewählte Akzentfarbe bleibt gleich, nur die Flächen werden dunkler und der Kontrast weicher für langes Lesen. Bei einem bereits dunklen Thema geht es eine Stufe tiefer.',
        'La barre supérieure, la barre d’outils, les panneaux et les fenêtres passent à la palette nocturne. Votre thème n’est pas modifié — la couleur d’accent choisie reste la même, seules les surfaces s’assombrissent et le contraste s’adoucit pour la lecture prolongée. Si vous utilisez déjà un thème sombre, cela descend d’un cran.',
        'La barra superior, la barra de herramientas, los paneles y las ventanas pasan a la paleta nocturna. No cambia tu tema — el color de acento elegido se mantiene, solo se oscurecen las superficies y el contraste se suaviza para lectura prolongada. Si ya usas un tema oscuro, baja un paso más.'],
      'Kapalı Gece çalışırken ekranın mavi ışığını kısar. Yalnız ekrandaki görüntüyü etkiler; kaydedilen ve dışa aktarılan hiçbir şey değişmez.': [
        'Off While night mode is running it cuts the screen’s blue light. It affects only what you see on screen; nothing saved or exported changes.',
        'Aus Während der Nachtmodus läuft, senkt es das Blaulicht des Bildschirms. Es betrifft nur die Bildschirmdarstellung; nichts Gespeichertes oder Exportiertes ändert sich.',
        'Désactivé Pendant le mode nuit, réduit la lumière bleue de l’écran. N’affecte que l’affichage ; rien de ce qui est enregistré ou exporté ne change.',
        'Desactivado Mientras el modo noche está activo reduce la luz azul de la pantalla. Solo afecta a lo que ves en pantalla; nada de lo guardado o exportado cambia.'],

      // ------------------------------------------------------ İMLEÇ FİGÜRÜ
      'Çizim yaparken fare okunun yerine gerçek bir kalem görünür; mürekkep tam ucundan çıkar. Aşağıdan seç — her figür kendi boyutunda önizlenir. Kapalıyken uygulama eski imlecini kullanır.': [
        'While you draw, a real pen appears instead of the mouse arrow and the ink leaves exactly its tip. Pick one below — every figure is previewed at its own size. When off, the app uses its former cursor.',
        'Beim Zeichnen erscheint anstelle des Mauszeigers ein echter Stift; die Tinte tritt genau an seiner Spitze aus. Wähle unten — jede Figur wird in ihrer eigenen Größe vorgeschaut. Ausgeschaltet nutzt die App ihren früheren Zeiger.',
        'Pendant le tracé, un vrai stylo remplace la flèche de la souris et l’encre sort exactement de sa pointe. Choisissez ci-dessous — chaque figure est prévisualisée à sa propre taille. Désactivé, l’application utilise son ancien curseur.',
        'Al dibujar aparece un lápiz real en lugar de la flecha del ratón y la tinta sale justo de su punta. Elige abajo — cada figura se previsualiza a su propio tamaño. Desactivado, la aplicación usa su cursor anterior.'],
      'Seçtiğin figür + araca duyarlı imleçler, gerçek boyutta': [
        'The figure you picked plus tool-aware cursors, at real size',
        'Die gewählte Figur und werkzeugbewusste Zeiger, in Originalgröße',
        'La figure choisie et les curseurs adaptés à l’outil, en taille réelle',
        'La figura elegida y los cursores según herramienta, a tamaño real'],
      'İmlecin mürekkebi seçili kalem rengine boyanır — hangi renkle çizdiğini imlece bakarak görürsün (fosforluda sarı).': [
        'The cursor’s ink is painted in the selected pen color — you can see which color you are drawing with just by looking at the cursor (yellow for the highlighter).',
        'Die Tinte des Zeigers wird in der gewählten Stiftfarbe eingefärbt — du siehst schon am Zeiger, mit welcher Farbe du zeichnest (beim Marker gelb).',
        'L’encre du curseur prend la couleur du stylo sélectionné — vous voyez d’un coup d’œil avec quelle couleur vous dessinez (jaune pour le surligneur).',
        'La tinta del cursor se pinta con el color del lápiz seleccionado — ves con qué color dibujas solo mirando el cursor (amarillo en el resaltador).'],
      'Kalemin ucunda, gerçek çizgi kalınlığı kadar bir halka gösterilir; yakınlaştırdıkça büyür. Temas noktası milimetrik belli olur.': [
        'A ring the size of the real stroke width is shown at the pen tip; it grows as you zoom in. The contact point becomes clear to the millimeter.',
        'An der Stiftspitze wird ein Ring in der echten Strichbreite angezeigt; beim Hineinzoomen wächst er mit. Der Berührungspunkt wird millimetergenau sichtbar.',
        'Un anneau de la largeur réelle du trait s’affiche à la pointe du stylo ; il grandit avec le zoom. Le point de contact devient clair au millimètre.',
        'En la punta del lápiz se muestra un anillo del grosor real del trazo; crece al ampliar. El punto de contacto queda claro al milímetro.'],
      'Figürün etrafına ince beyaz kontur eklenir — koyu tahtada, PDF\'te ve videoda imleç her zaman net görünür.': [
        'A thin white outline is added around the figure — the cursor stays clearly visible on a dark board, on a PDF and in video.',
        'Um die Figur wird eine dünne weiße Kontur gelegt — der Zeiger bleibt auf dunkler Tafel, in PDFs und im Video stets gut sichtbar.',
        'Un fin contour blanc est ajouté autour de la figure — le curseur reste bien visible sur tableau sombre, sur un PDF et en vidéo.',
        'Se añade un contorno blanco fino alrededor de la figura — el cursor se ve siempre con claridad en pizarra oscura, en PDF y en vídeo.'],
      'Silgide silgi figürü, cetvel/pergel/çözüm modunda hassas nişangâh belirir; seçim ve metin araçlarında uygulamanın kendi imleci korunur.': [
        'The eraser shows an eraser figure, and the ruler / compass / solve modes show a precision crosshair; the selection and text tools keep the app’s own cursor.',
        'Beim Radierer erscheint eine Radiererfigur, in den Modi Lineal / Zirkel / Lösung ein Präzisions-Fadenkreuz; bei Auswahl- und Textwerkzeug bleibt der eigene Zeiger der App.',
        'La gomme affiche une figure de gomme, et les modes règle / compas / résolution un réticule de précision ; les outils de sélection et de texte conservent le curseur propre de l’application.',
        'La goma muestra una figura de goma, y los modos regla / compás / resolución un retículo de precisión; las herramientas de selección y texto conservan el cursor propio de la aplicación.'],

      // ------------------------------------------------------------ KLAVYE
      'tuşa tıkla, yeni tuşa bas': [
        'click a key, then press the new one',
        'Taste anklicken, dann neue Taste drücken',
        'cliquez sur une touche, puis appuyez sur la nouvelle',
        'haz clic en una tecla y pulsa la nueva'],

      // ---------------------------------------------------------- DEPOLAMA
      'Açarsan serbest tahta çizimlerin de kütüphaneye kaydedilir. Kapalıyken yalnız PDF ve görsel çalışmaları saklanır.': [
        'Turn it on and your free-board drawings are saved to the library too. When off, only PDF and image works are kept.',
        'Eingeschaltet werden auch deine Zeichnungen auf der freien Tafel in der Bibliothek gespeichert. Ausgeschaltet werden nur PDF- und Bildarbeiten behalten.',
        'Activé, vos dessins du tableau libre sont aussi enregistrés dans la bibliothèque. Désactivé, seuls les travaux PDF et image sont conservés.',
        'Si lo activas, tus dibujos de pizarra libre también se guardan en la biblioteca. Desactivado, solo se conservan los trabajos de PDF e imagen.'],
      'PDF ve görsel çalışmaların hiçbir bildirim göstermeden arka planda kaydedilir; kütüphaneden kaldığın yerden devam edersin. Boş tahta çizimleri kaydedilmez.': [
        'Your PDF and image works are saved in the background with no notification at all; you continue from where you left off via the library. Blank-board drawings are not saved.',
        'Deine PDF- und Bildarbeiten werden ohne jede Benachrichtigung im Hintergrund gespeichert; über die Bibliothek machst du dort weiter, wo du aufgehört hast. Zeichnungen auf der leeren Tafel werden nicht gespeichert.',
        'Vos travaux PDF et image sont enregistrés en arrière-plan sans aucune notification ; vous reprenez où vous en étiez depuis la bibliothèque. Les dessins du tableau vierge ne sont pas enregistrés.',
        'Tus trabajos de PDF e imagen se guardan en segundo plano sin ninguna notificación; continúas donde lo dejaste desde la biblioteca. Los dibujos de pizarra vacía no se guardan.'],
      'Tüm tahta, PDF ve görsel çalışmaların — küçük önizlemeleriyle.': [
        'All your board, PDF and image works — with small previews.',
        'Alle deine Tafel-, PDF- und Bildarbeiten — mit kleinen Vorschauen.',
        'Tous vos travaux de tableau, PDF et image — avec de petits aperçus.',
        'Todos tus trabajos de pizarra, PDF e imagen — con pequeñas vistas previas.'],
      'Kütüphanedeki bütün çalışmaları temelli siler. Bu işlem geri alınamaz.': [
        'Permanently deletes every work in the library. This cannot be undone.',
        'Löscht alle Arbeiten in der Bibliothek endgültig. Dies kann nicht rückgängig gemacht werden.',
        'Supprime définitivement tous les travaux de la bibliothèque. Cette action est irréversible.',
        'Elimina permanentemente todos los trabajos de la biblioteca. Esta acción no se puede deshacer.'],
      'Bu ürün, kendi lisansları altında dağıtılan açık kaynak bileşenler kullanır: pdf.js (Apache-2.0, Mozilla) · jsPDF (MIT) · Manrope, Sora ve el yazısı fontu (SIL Open Font License 1.1). Lisans metinleri uygulama paketindeki libs/THIRD_PARTY.md dosyasında korunmuştur. Notis Pro tescilli bir yazılımdır; kopyalanamaz ve dağıtılamaz.': [
        'This product uses open-source components distributed under their own licenses: pdf.js (Apache-2.0, Mozilla) · jsPDF (MIT) · Manrope, Sora and the handwriting font (SIL Open Font License 1.1). The license texts are kept in libs/THIRD_PARTY.md inside the application package. Notis Pro is proprietary software; it may not be copied or distributed.',
        'Dieses Produkt verwendet Open-Source-Komponenten unter deren eigenen Lizenzen: pdf.js (Apache-2.0, Mozilla) · jsPDF (MIT) · Manrope, Sora und die Handschriftschrift (SIL Open Font License 1.1). Die Lizenztexte liegen in libs/THIRD_PARTY.md im Anwendungspaket. Notis Pro ist proprietäre Software; Kopieren und Weitergabe sind nicht erlaubt.',
        'Ce produit utilise des composants open source distribués sous leurs propres licences : pdf.js (Apache-2.0, Mozilla) · jsPDF (MIT) · Manrope, Sora et la police manuscrite (SIL Open Font License 1.1). Les textes de licence sont conservés dans libs/THIRD_PARTY.md au sein du paquet de l’application. Notis Pro est un logiciel propriétaire ; il ne peut être copié ni distribué.',
        'Este producto usa componentes de código abierto distribuidos bajo sus propias licencias: pdf.js (Apache-2.0, Mozilla) · jsPDF (MIT) · Manrope, Sora y la tipografía manuscrita (SIL Open Font License 1.1). Los textos de licencia se conservan en libs/THIRD_PARTY.md dentro del paquete de la aplicación. Notis Pro es software propietario; no puede copiarse ni distribuirse.'],
      'Bir kısayol, panel ya da opsiyon aniden cevap vermez olursa uygulamayı kapatmadan buradan toparlayabilirsin. Çizimlerine ve kayıtlarına dokunmaz; yalnız yarım kalmış etkileşimleri temizler. Kısayol: Ctrl+Alt+R.': [
        'If a shortcut, panel or option suddenly stops responding, you can recover from here without closing the app. It does not touch your drawings or records; it only clears half-finished interactions. Shortcut: Ctrl+Alt+R.',
        'Wenn eine Tastenkombination, ein Panel oder eine Option plötzlich nicht mehr reagiert, kannst du hier ohne Schließen der App aufräumen. Deine Zeichnungen und Aufzeichnungen bleiben unberührt; nur unvollendete Interaktionen werden gelöscht. Tastenkürzel: Ctrl+Alt+R.',
        'Si un raccourci, un panneau ou une option ne répond plus, vous pouvez remettre d’aplomb depuis ici sans fermer l’application. Vos dessins et enregistrements ne sont pas touchés ; seules les interactions inachevées sont effacées. Raccourci : Ctrl+Alt+R.',
        'Si un atajo, un panel o una opción deja de responder, puedes recomponerlo desde aquí sin cerrar la aplicación. No toca tus dibujos ni tus registros; solo limpia interacciones a medias. Atajo: Ctrl+Alt+R.'],
      'Ekran bildirimleri kapalıyken de her mesaj buraya yazılır.': [
        'Every message is written here even when on-screen notifications are off.',
        'Jede Meldung wird hier festgehalten, auch wenn Bildschirmbenachrichtigungen aus sind.',
        'Chaque message est consigné ici, même lorsque les notifications à l’écran sont désactivées.',
        'Cada mensaje se registra aquí incluso con las notificaciones en pantalla desactivadas.'],
      'Çözüm modundan çıkarken soru ve çözümün kütüphaneye otomatik kaydedilir.': [
        'When you leave solve mode, the question and your solution are saved to the library automatically.',
        'Beim Verlassen des Lösungsmodus werden Aufgabe und Lösung automatisch in der Bibliothek gespeichert.',
        'En quittant le mode résolution, l’énoncé et votre solution sont enregistrés automatiquement dans la bibliothèque.',
        'Al salir del modo resolución, el enunciado y tu solución se guardan automáticamente en la biblioteca.'],

      // ------------------------------------------------- DENEYSEL OPSİYONLAR
      'Açınca: taşınan nesneler yalnızca ızgaraya değil; sayfa ortasına, diğer nesnelere, başlıklara ve metin kutularına hafifçe mıknatıslanır. Hizalanınca pembe kılavuz belirir.': [
        'When on: dragged objects are gently magnetized not only to the grid but also to the page center, other objects, headings and text boxes. A pink guide appears when they align.',
        'Eingeschaltet: verschobene Objekte werden nicht nur am Raster, sondern auch an der Seitenmitte, anderen Objekten, Überschriften und Textfeldern sanft magnetisch gehalten. Bei Ausrichtung erscheint eine rosa Hilfslinie.',
        'Activé : les objets déplacés sont doucement aimantés non seulement à la grille, mais aussi au centre de la page, aux autres objets, aux titres et aux zones de texte. Un guide rose apparaît lors de l’alignement.',
        'Activado: los objetos arrastrados se imantan suavemente no solo a la rejilla, sino también al centro de la página, a otros objetos, a los títulos y a los cuadros de texto. Al alinearse aparece una guía rosa.'],
      'Açınca: yazmaya başladığında kamera kalemin olduğu noktaya doğru hafifçe yaklaşır, bitirince yumuşakça geri çekilir. Video anlatımlarına sinematik his katar.': [
        'When on: as you start writing the camera eases in toward the pen, and pulls back smoothly when you finish. Adds a cinematic feel to video explanations.',
        'Eingeschaltet: beim Schreibbeginn fährt die Kamera sanft zum Stift hin und zieht sich am Ende weich zurück. Verleiht Videoerklärungen ein filmisches Gefühl.',
        'Activé : dès que vous écrivez, la caméra se rapproche doucement du stylo et recule en douceur à la fin. Donne une touche cinématographique aux explications vidéo.',
        'Activado: al empezar a escribir la cámara se acerca suavemente al lápiz y se retira con suavidad al terminar. Aporta un aire cinematográfico a las explicaciones en vídeo.'],
      'Açınca: mürekkep her yakınlaştırmada vektörden yeniden hesaplanır, çizgi asla piksellenmez; kurşun kalemin kenar dokusu bile zoom seviyesine göre yeniden üretilir.': [
        'When on: the ink is recomputed from the vector at every zoom level, so the stroke never pixelates; even the pencil’s edge texture is regenerated for the current zoom.',
        'Eingeschaltet: die Tinte wird bei jeder Zoomstufe neu aus dem Vektor berechnet, der Strich pixelt nie; selbst die Kantentextur des Bleistifts wird für die aktuelle Zoomstufe neu erzeugt.',
        'Activé : l’encre est recalculée depuis le vecteur à chaque niveau de zoom, le trait ne pixellise jamais ; même la texture de bord du crayon est régénérée selon le zoom.',
        'Activado: la tinta se recalcula desde el vector en cada nivel de zoom, por lo que el trazo nunca se pixela; incluso la textura de borde del lápiz se regenera según el zoom.'],
      'Açınca: uygulama alışkanlığını öğrenir — en çok kullandığın araç + renk + kalınlık + opaklık kombinasyonunu (yeterli veri birikince) sonraki açılışlarda otomatik seçer.': [
        'When on: the app learns your habit — once it has enough data it automatically selects your most-used tool + color + width + opacity combination the next time it opens.',
        'Eingeschaltet: die App lernt deine Gewohnheit — sobald genügend Daten vorliegen, wählt sie beim nächsten Start automatisch deine häufigste Kombination aus Werkzeug + Farbe + Breite + Deckkraft.',
        'Activé : l’application apprend vos habitudes — dès qu’elle a assez de données, elle sélectionne automatiquement au prochain démarrage votre combinaison la plus utilisée outil + couleur + épaisseur + opacité.',
        'Activado: la aplicación aprende tu hábito — cuando tiene datos suficientes selecciona automáticamente en el siguiente arranque tu combinación más usada de herramienta + color + grosor + opacidad.'],
      'Açınca: çizim ekranın kenarına yaklaştığında tuval o yöne kendiliğinden kaymaya başlar — kalemi kaldırmadan sonsuza yaz.': [
        'When on: as your stroke nears the edge of the screen the canvas starts scrolling that way on its own — write endlessly without lifting the pen.',
        'Eingeschaltet: nähert sich der Strich dem Bildschirmrand, beginnt die Leinwand selbsttätig in diese Richtung zu scrollen — schreibe endlos, ohne den Stift zu heben.',
        'Activé : lorsque le tracé approche du bord de l’écran, la toile commence à défiler d’elle-même dans cette direction — écrivez sans fin sans lever le stylo.',
        'Activado: cuando el trazo se acerca al borde de la pantalla el lienzo empieza a desplazarse por sí solo en esa dirección — escribe sin fin sin levantar el lápiz.'],
      'Çalışma alanını genişletir; PDF her değişimde ekrana yeniden sığdırılır. Aynı döngü F9 tuşuyla da çalışır.': [
        'Widens the work area; the PDF is refitted to the screen at every change. The same cycle also works with the F9 key.',
        'Erweitert den Arbeitsbereich; das PDF wird bei jeder Änderung neu an den Bildschirm angepasst. Derselbe Zyklus funktioniert auch mit der Taste F9.',
        'Élargit la zone de travail ; le PDF est réajusté à l’écran à chaque changement. Le même cycle fonctionne aussi avec la touche F9.',
        'Amplía el área de trabajo; el PDF se reajusta a la pantalla en cada cambio. El mismo ciclo también funciona con la tecla F9.'],
      'Kalemler yaşamaya başlar: çizerken ucunda seni takip eden yumuşak IŞIK NEFESİ · mürekkep uçtan uca renk-derinlikli akar (ton gradyanı) · çizgiler kâğıda gömülme gölgesiyle kâğıdın ÜSTÜNDE durur · Akıllı\'da yavaşlayınca doğal mürekkep birikintileri · Dolma\'da hattat kontrastı + ıslak parlaklık şeridi · Tükenmez\'de ipek \'nefes alan\' çizgi + bilye damlası · Kurşun\'da gerçek grafit dokusu · Fosforlu\'da kenar pigmenti. Yazmak bağımlılık yapar.': [
        'The pens come alive: a soft BREATH OF LIGHT follows the tip as you draw · the ink flows with color depth from end to end (a tonal gradient) · strokes sit ON TOP of the paper with an embedding shadow · the Smart pen leaves natural ink pools when you slow down · the Fountain pen adds calligraphic contrast plus a wet highlight band · the Ballpoint gets a silky ‘breathing’ line plus a ball droplet · the Pencil gets real graphite texture · the Highlighter gets edge pigment. Writing becomes addictive.',
        'Die Stifte werden lebendig: ein sanfter LICHTATEM folgt der Spitze beim Zeichnen · die Tinte fließt von Ende zu Ende mit Farbtiefe (Tonverlauf) · Striche liegen mit Einsinkschatten AUF dem Papier · der Smart-Stift hinterlässt beim Verlangsamen natürliche Tintenansammlungen · der Füller bringt Kalligrafiekontrast und ein feuchtes Glanzband · der Kugelschreiber eine seidige „atmende“ Linie und einen Kugeltropfen · der Bleistift echte Graphittextur · der Marker Randpigment. Schreiben macht süchtig.',
        'Les stylos s’animent : un doux SOUFFLE DE LUMIÈRE suit la pointe pendant le tracé · l’encre coule avec une profondeur de couleur d’un bout à l’autre (dégradé tonal) · les traits reposent SUR le papier avec une ombre d’enfoncement · le stylo intelligent laisse des amas d’encre naturels quand vous ralentissez · la plume ajoute un contraste calligraphique et une bande de brillance humide · le stylo à bille gagne une ligne soyeuse « qui respire » et une gouttelette de bille · le crayon une vraie texture de graphite · le surligneur un pigment de bord. Écrire devient addictif.',
        'Los lápices se vuelven vivos: un suave ALIENTO DE LUZ sigue la punta al dibujar · la tinta fluye con profundidad de color de extremo a extremo (degradado tonal) · los trazos descansan SOBRE el papel con una sombra de hundimiento · el lápiz inteligente deja acumulaciones naturales de tinta al ir más despacio · la estilográfica añade contraste caligráfico y una banda de brillo húmedo · el bolígrafo gana una línea sedosa «que respira» y una gota de bola · el lápiz una textura de grafito real · el resaltador pigmento de borde. Escribir se vuelve adictivo.'],
      'Açınca: yazdığın metinleri hatırlar. Aynı ifadeyi aylar sonra başka sayfada yazmaya başladığında "bunu daha önce kullanmıştın" diye önerir; tek dokunuşla getirir.': [
        'When on: it remembers the texts you write. If you start typing the same phrase months later on another page it suggests “you used this before” and brings it back with a single tap.',
        'Eingeschaltet: es merkt sich die von dir geschriebenen Texte. Beginnst du Monate später auf einer anderen Seite dieselbe Formulierung, schlägt es „das hast du schon verwendet“ vor und holt sie mit einem Tipp zurück.',
        'Activé : il mémorise les textes que vous écrivez. Si vous recommencez la même formule des mois plus tard sur une autre page, il propose « vous l’avez déjà utilisée » et la rappelle d’une seule touche.',
        'Activado: recuerda los textos que escribes. Si meses después empiezas la misma expresión en otra página, sugiere «ya usaste esto» y la trae con un solo toque.'],

      // ------------------------------------------------------- UYGULAMA
      'arayüz dili — anında uygulanır': [
        'interface language — applied instantly',
        'Oberflächensprache — sofort übernommen',
        'langue de l’interface — appliquée aussitôt',
        'idioma de la interfaz — se aplica al instante'],
      'uygulama kapandığı gibi açılsın': [
        'open the app exactly as you closed it',
        'die App genau so öffnen, wie du sie geschlossen hast',
        'ouvrir l’application telle que vous l’avez fermée',
        'abrir la aplicación tal como la cerraste'],
    });
    if (api.reset) api.reset();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 80));
  else setTimeout(boot, 80);
})();
