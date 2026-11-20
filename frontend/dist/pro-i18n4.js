/* ============================================================================
   ELEMAN DÜZEYİ ÇEVİRİLER — uzun açıklama blokları
   ----------------------------------------------------------------------------
   Bu metinler içlerinde <b>/<i> vurguları taşıdığı için metin düğümü başına
   anlamsız parçalara bölünüyor ("…ekranına", "daha yakın", "tamamı" gibi).
   Bu yüzden kapsayıcının BÜTÜN metniyle anahtarlanır ve tek parça olarak
   değiştirilir; Türkçeye dönüldüğünde özgün HTML vurgularıyla geri gelir
   (pro-i18n.js · walkEl).

   İçinde değişen bir sayı ya da saat geçen bloklar buraya KONMAZ — onların
   anahtarı her değerde başkalaşır. Onlar için sabit kalan metin parçaları
   kelime sözlüğüne (pro-i18n3.js) girer.
   ========================================================================= */
(function () {
  'use strict';
  function boot() {
    const api = window.proI18n;
    if (!api) return;
    const DEL = api.elDict, D = api.dict;

    /* sıra: [en, de, fr, es] */
    Object.assign(DEL, {
      // ---------------------------------------------------- KALEMLER
      'Akıllı Kalem ile yazı deneyimini test et — üzerine çizebilirsin': [
        'Test the writing feel with the Smart Pen — you can draw on it',
        'Teste das Schreibgefühl mit dem Smart-Stift — du kannst darauf zeichnen',
        'Testez le rendu d’écriture avec le stylo intelligent — vous pouvez dessiner dessus',
        'Prueba la sensación de escritura con el lápiz inteligente — puedes dibujar encima'],
      'Akıllı Kalem için — dokun, anında uygulanır': [
        'For the Smart Pen — tap and it applies instantly',
        'Für den Smart-Stift — antippen, sofort übernommen',
        'Pour le stylo intelligent — touchez, appliqué aussitôt',
        'Para el lápiz inteligente — toca y se aplica al instante'],
      'kendi kurduğun kalemler — tek dokunuşla geri dön': [
        'pens you set up yourself — return to one with a single tap',
        'selbst eingerichtete Stifte — mit einem Tipp zurückkehren',
        'des stylos que vous avez réglés — y revenir d’une seule touche',
        'lápices que configuraste — vuelve a ellos con un solo toque'],
      'uygulama her açılışta buradan başlar': [
        'the app starts from here every time it opens',
        'die App startet bei jedem Öffnen von hier',
        'l’application démarre ici à chaque ouverture',
        'la aplicación empieza aquí en cada apertura'],
      'sağ tık basılı tut › Kalem': [
        'hold right-click › Pen',
        'Rechtsklick halten › Stift',
        'maintenez le clic droit › Stylo',
        'mantén el clic derecho › Lápiz'],

      // ---------------------------------------------------- ÇİZİM
      'dokun — kalem, zemin, palet ve ayarlar birlikte kurulur': [
        'tap — pen, background, palette and settings are set up together',
        'antippen — Stift, Hintergrund, Palette und Einstellungen werden zusammen gesetzt',
        'touchez — stylo, fond, palette et réglages sont configurés ensemble',
        'toca — lápiz, fondo, paleta y ajustes se configuran juntos'],
      'teknik kurulumlar — zemin, ızgara ve hat kilidi dahil': [
        'technical setups — including background, grid and line lock',
        'technische Voreinstellungen — inkl. Hintergrund, Raster und Liniensperre',
        'configurations techniques — fond, grille et verrou de trait inclus',
        'configuraciones técnicas — incluye fondo, rejilla y bloqueo de trazo'],
      'Motor üç kademeli çalışır; kaydıraç yerine gerçek kademeler. Orta fabrika ayarıdır.': [
        'The engine runs in three steps — real steps, not a slider. Medium is the factory setting.',
        'Die Engine arbeitet in drei Stufen — echte Stufen statt Schieberegler. Mittel ist die Werkseinstellung.',
        'Le moteur fonctionne en trois paliers — de vrais paliers, pas un curseur. Moyen est le réglage d’usine.',
        'El motor funciona en tres pasos — pasos reales, no un control deslizante. Medio es el ajuste de fábrica.'],
      'Akıllı Kalem için — her kalemin kendi değeri vardır, Kalem panelinden de ayarlanır.': [
        'For the Smart Pen — every pen has its own value, also adjustable from the Pen panel.',
        'Für den Smart-Stift — jeder Stift hat seinen eigenen Wert, auch im Stift-Panel einstellbar.',
        'Pour le stylo intelligent — chaque stylo a sa propre valeur, réglable aussi depuis le panneau Stylo.',
        'Para el lápiz inteligente — cada lápiz tiene su propio valor, ajustable también desde el panel Lápiz.'],
      'Hareketi önceden kestirerek gecikmeyi azaltır': [
        'Reduces latency by predicting the movement ahead',
        'Verringert die Latenz durch Vorhersage der Bewegung',
        'Réduit la latence en anticipant le mouvement',
        'Reduce la latencia anticipando el movimiento'],
      'Tükenmez / dolma / kurşun kalemde geçerli · Akıllı kalem saf mürekkeptir': [
        'Applies to ballpoint / fountain / pencil · the Smart Pen is pure ink',
        'Gilt für Kugelschreiber / Füller / Bleistift · der Smart-Stift ist reine Tinte',
        'S’applique au stylo à bille / plume / crayon · le stylo intelligent est de l’encre pure',
        'Se aplica a bolígrafo / estilográfica / lápiz · el lápiz inteligente es tinta pura'],
      'Neredeyse düz çizilen fosforlu, iki uç arasında düz bir banda oturur': [
        'A nearly straight highlighter stroke snaps to a straight band between its two ends',
        'Ein nahezu gerader Markerstrich rastet zu einem geraden Band zwischen beiden Enden ein',
        'Un trait de surligneur presque droit s’aligne en une bande droite entre ses deux extrémités',
        'Un trazo de resaltador casi recto se ajusta a una banda recta entre sus dos extremos'],
      'Sayfa merkezine hizalanınca kılavuz göster': [
        'Show a guide when aligned to the page center',
        'Hilfslinie anzeigen, wenn an der Seitenmitte ausgerichtet',
        'Afficher un guide lors de l’alignement au centre de la page',
        'Mostrar una guía al alinear con el centro de la página'],
      '15°\'lik adımlara kilitlenir': [
        'Locks to 15° steps',
        'Rastet in 15°-Schritten ein',
        'Se verrouille par pas de 15°',
        'Se bloquea en pasos de 15°'],
      'Cetvel ve pergelin gösterdiği birim. Ölçek sayfanın gerçek kâğıt boyutundan hesaplanır (A4 = 21 cm).': [
        'The unit shown by the ruler and compass. The scale is computed from the page’s real paper size (A4 = 21 cm).',
        'Die von Lineal und Zirkel angezeigte Einheit. Der Maßstab wird aus der echten Papiergröße der Seite berechnet (A4 = 21 cm).',
        'L’unité affichée par la règle et le compas. L’échelle est calculée d’après la taille réelle du papier (A4 = 21 cm).',
        'La unidad que muestran la regla y el compás. La escala se calcula a partir del tamaño real del papel (A4 = 21 cm).'],
      'tüm kalemlerde geçerli': [
        'applies to all pens', 'gilt für alle Stifte', 's’applique à tous les stylos', 'se aplica a todos los lápices'],
      'Açınca çizimler hiçbir yakınlaştırma düzeyinde titremez ve tırtıklanmaz: eğrilik gürültüsü açı alanında düzlenir, kiriş hedefi yakınlaştırmada da tutulur (nokta bütçesi 40000, geçiş sınırı 9), tarama Ultra kaliteye ve titreme giderme en yüksek seviyeye çıkar. Tüm kalemler için geçerlidir ve kalemlerin karakterini değiştirmez. Kapatınca bütün ayarlar açmadan önceki hâline döner. Karşılığında çok uzun çizgilerin yeniden çizimi bir miktar ağırlaşır.': [
        'When on, strokes never shake or look jagged at any zoom level: curvature noise is faired in the angle domain, the chord target is held even while zoomed in (point budget 40000, pass limit 9), rasterization rises to Ultra quality and tremor removal to its highest level. It applies to every pen and does not change any pen’s character. Turning it off restores every setting exactly as it was. In exchange, redrawing very long strokes gets somewhat heavier.',
        'Eingeschaltet zittern und zacken Striche auf keiner Zoomstufe: Krümmungsrauschen wird im Winkelbereich geglättet, das Sehnenziel wird auch beim Hineinzoomen gehalten (Punktbudget 40000, Durchlaufgrenze 9), die Rasterung steigt auf Ultra-Qualität und die Zitterentfernung auf die höchste Stufe. Gilt für alle Stifte und verändert deren Charakter nicht. Beim Ausschalten kehren alle Einstellungen genau zurück. Dafür wird das Neuzeichnen sehr langer Striche etwas schwerer.',
        'Activée, les tracés ne tremblent et ne crénelent à aucun niveau de zoom : le bruit de courbure est lissé dans le domaine angulaire, la cible de corde est maintenue même en zoom (budget de points 40000, limite de passes 9), la rastérisation passe en qualité Ultra et la suppression du tremblement à son niveau maximal. Valable pour tous les stylos, sans modifier leur caractère. En la désactivant, tous les réglages reviennent exactement à l’état précédent. En contrepartie, le redessin des tracés très longs devient un peu plus lourd.',
        'Activada, los trazos no tiemblan ni se ven dentados en ningún nivel de zoom: el ruido de curvatura se suaviza en el dominio angular, el objetivo de cuerda se mantiene incluso al ampliar (presupuesto de puntos 40000, límite de pasadas 9), el rasterizado sube a calidad Ultra y la eliminación de temblor a su nivel máximo. Se aplica a todos los lápices y no cambia su carácter. Al desactivarla, todos los ajustes vuelven exactamente a como estaban. A cambio, redibujar trazos muy largos resulta algo más costoso.'],
      'Kapalı — motor kendi ayarlarınla çalışır': [
        'Off — the engine runs with your own settings',
        'Aus — die Engine arbeitet mit deinen eigenen Einstellungen',
        'Désactivé — le moteur fonctionne avec vos réglages',
        'Desactivado — el motor funciona con tus propios ajustes'],
      'Fabrika ayarı AÇIK. Çizgi bittiği anda el titremesi (8–12 Hz tremor), sensör gürültüsü ve tırtıklanma ölçülerek ayrıştırılır; çizgi kübik Bézier eğrilerine oturtulur. Şekil düzeltme değildir — ne çizdiysen o kalır, sadece titremesi kalmaz; bilinçli keskin köşeler korunur. Ölçüm: gerçek boyutta el yazısında titreme 14 kata kadar azalır ve çizgi ideal hattına kapalı hâlden daha yakın oturur. Kapatırsan ham el hareketi aynen kalır.': [
        'Factory setting is ON. The moment a stroke ends, hand tremor (8–12 Hz), sensor noise and jaggedness are measured and separated out; the stroke is fitted to cubic Bézier curves. This is not shape correction — what you drew stays what you drew, only the tremor goes, and deliberate sharp corners are preserved. Measured: in real-size handwriting tremor drops by up to 14×, and the stroke sits closer to its ideal line than with the option off. Turn it off and the raw hand movement is kept exactly.',
        'Werkseinstellung EIN. Sobald ein Strich endet, werden Handzittern (8–12 Hz), Sensorrauschen und Zacken gemessen und herausgerechnet; der Strich wird an kubische Bézier-Kurven angepasst. Das ist keine Formkorrektur — was du gezeichnet hast, bleibt; nur das Zittern verschwindet, bewusste scharfe Ecken bleiben erhalten. Gemessen: bei Handschrift in Originalgröße sinkt das Zittern um bis zu 14× und der Strich liegt näher an seiner Ideallinie als im ausgeschalteten Zustand. Ausgeschaltet bleibt die rohe Handbewegung unverändert.',
        'Réglage d’usine ACTIVÉ. Dès la fin d’un tracé, le tremblement de la main (8–12 Hz), le bruit du capteur et le crénelage sont mesurés et séparés ; le tracé est ajusté à des courbes de Bézier cubiques. Ce n’est pas une correction de forme — ce que vous avez dessiné reste tel quel, seul le tremblement disparaît, et les angles vifs voulus sont préservés. Mesuré : sur une écriture à taille réelle, le tremblement diminue jusqu’à 14× et le tracé se rapproche davantage de sa ligne idéale qu’avec l’option désactivée. Désactivée, le geste brut est conservé à l’identique.',
        'El ajuste de fábrica está ACTIVADO. En cuanto termina un trazo, se miden y separan el temblor de la mano (8–12 Hz), el ruido del sensor y el dentado; el trazo se ajusta a curvas Bézier cúbicas. No es corrección de forma — lo que dibujaste sigue igual, solo desaparece el temblor, y las esquinas afiladas intencionadas se conservan. Medido: en escritura a tamaño real el temblor baja hasta 14× y el trazo queda más cerca de su línea ideal que con la opción desactivada. Si la desactivas, el gesto en bruto se mantiene tal cual.'],
      'Hafif: karakteri neredeyse hiç değiştirmez · Dengeli: fabrika ayarı — küçük el yazısında titremeyi 14 kat siler, çizgiyi hiç bozmaz · Maksimum ve Ultra: iri çizimde bir tık daha pürüzsüz, ama küçük yazıda hattı iki kat fazla kaydırır (video ve büyük tahta işi için).': [
        'Light: barely changes the character · Balanced: the factory setting — removes tremor 14× in small handwriting without distorting the stroke · Maximum and Ultra: a touch smoother on large drawings, but they shift the line twice as much in small writing (meant for video and large-board work).',
        'Leicht: verändert den Charakter kaum · Ausgewogen: die Werkseinstellung — entfernt Zittern bei kleiner Handschrift um das 14-Fache, ohne den Strich zu verzerren · Maximum und Ultra: bei großen Zeichnungen eine Spur glatter, verschieben die Linie bei kleiner Schrift aber doppelt so stark (für Video- und Großtafelarbeit).',
        'Léger : modifie à peine le caractère · Équilibré : le réglage d’usine — supprime le tremblement 14× sur une petite écriture sans déformer le tracé · Maximum et Ultra : un peu plus lisses sur les grands dessins, mais décalent deux fois plus le trait en petite écriture (pour la vidéo et le travail au grand tableau).',
        'Ligero: apenas cambia el carácter · Equilibrado: el ajuste de fábrica — elimina el temblor 14× en escritura pequeña sin deformar el trazo · Máximo y Ultra: algo más suaves en dibujos grandes, pero desplazan el trazo el doble en escritura pequeña (para vídeo y trabajo en pizarra grande).'],
      'Bilinçli keskin dönüşler (harf köşeleri, ok uçları, köşeli şekiller) tespit edilip korunur; yumuşatma yalnız köşe olmayan bölümlere uygulanır. Kapatırsan her şey tek akışkan eğriye dönüşür.': [
        'Deliberate sharp turns (letter corners, arrowheads, angular shapes) are detected and preserved; smoothing is applied only to the non-corner parts. Turn it off and everything becomes one flowing curve.',
        'Bewusste scharfe Wendungen (Buchstabenecken, Pfeilspitzen, kantige Formen) werden erkannt und erhalten; die Glättung wirkt nur auf die eckenfreien Abschnitte. Ausgeschaltet wird alles zu einer durchgehenden Kurve.',
        'Les virages vifs intentionnels (angles de lettres, pointes de flèches, formes anguleuses) sont détectés et préservés ; le lissage ne s’applique qu’aux parties sans angle. Désactivé, tout devient une seule courbe fluide.',
        'Los giros bruscos intencionados (esquinas de letras, puntas de flecha, formas angulosas) se detectan y se conservan; el suavizado se aplica solo a las partes sin esquina. Si lo desactivas, todo se convierte en una única curva fluida.'],
      'Her çizgiden sonra, o çizgideki titreşimin ne kadarının yok edildiği ölçülür (yön açısının ikinci farkının RMS enerjisi).': [
        'After every stroke it measures how much of that stroke’s tremor was removed (RMS energy of the second difference of the direction angle).',
        'Nach jedem Strich wird gemessen, wie viel von dessen Zittern entfernt wurde (RMS-Energie der zweiten Differenz des Richtungswinkels).',
        'Après chaque tracé, mesure la part du tremblement supprimée (énergie RMS de la différence seconde de l’angle de direction).',
        'Tras cada trazo mide cuánto temblor se eliminó (energía RMS de la segunda diferencia del ángulo de dirección).'],
      'Bir çizgi çiz — ölçüm burada belirir': [
        'Draw a stroke — the measurement appears here',
        'Zeichne einen Strich — die Messung erscheint hier',
        'Tracez un trait — la mesure apparaît ici',
        'Dibuja un trazo — la medición aparece aquí'],

      // ---------------------------------------------------- ARAYÜZ
      'Araç rayını sağa taşır': [
        'Moves the tool rail to the right',
        'Verschiebt die Werkzeugleiste nach rechts',
        'Déplace la barre d’outils vers la droite',
        'Mueve la barra de herramientas a la derecha'],
      'Açınca: kalem kâğıda değdiği an üst çubuk %80 soluklaşır, sağ panel gizlenir, sol ray küçülür; kalem kalkınca arayüz yumuşakça geri gelir. Video çekimlerinde çok temiz görünür.': [
        'When on: the moment the pen touches the paper the top bar fades to 80%, the right panel hides and the left rail shrinks; when the pen lifts, the interface returns smoothly. Looks very clean in video recordings.',
        'Eingeschaltet: sobald der Stift das Papier berührt, blendet die obere Leiste um 80 % ab, das rechte Panel wird verborgen und die linke Leiste schrumpft; beim Abheben kehrt die Oberfläche sanft zurück. Wirkt in Videoaufnahmen sehr aufgeräumt.',
        'Activé : dès que le stylo touche le papier, la barre supérieure s’estompe à 80 %, le panneau droit se masque et la barre gauche se réduit ; au relevé du stylo, l’interface revient en douceur. Très propre à l’écran en vidéo.',
        'Activado: en cuanto el lápiz toca el papel la barra superior se atenúa al 80 %, el panel derecho se oculta y la barra izquierda se encoge; al levantar el lápiz la interfaz vuelve suavemente. Queda muy limpio en grabaciones de vídeo.'],
      'Üst paneli ve araç rayını daraltır — tuvale daha çok alan kalır': [
        'Narrows the top panel and the tool rail — more room for the canvas',
        'Verschmälert das obere Panel und die Werkzeugleiste — mehr Platz für die Leinwand',
        'Réduit le panneau supérieur et la barre d’outils — plus de place pour la toile',
        'Estrecha el panel superior y la barra de herramientas — más espacio para el lienzo'],
      'Sol alttaki yakınlaştırma ve sayfa gezintisi': [
        'The zoom and page navigation at the bottom left',
        'Zoom und Seitennavigation unten links',
        'Le zoom et la navigation de page en bas à gauche',
        'El zoom y la navegación de páginas abajo a la izquierda'],
      'Çizim bitince imlecin yanında hızlı ayarlar belirir': [
        'Quick settings appear next to the cursor when a stroke ends',
        'Nach dem Strich erscheinen Schnelleinstellungen neben dem Zeiger',
        'Des réglages rapides apparaissent près du curseur à la fin du tracé',
        'Al terminar el trazo aparecen ajustes rápidos junto al cursor'],
      'Sağ tuşu basılı tut — araçlar imlecin etrafında açılır': [
        'Hold the right button — tools open around the cursor',
        'Rechte Taste halten — Werkzeuge öffnen sich um den Zeiger',
        'Maintenez le bouton droit — les outils s’ouvrent autour du curseur',
        'Mantén el botón derecho — las herramientas se abren alrededor del cursor'],
      '%2–3 opaklıkta kâğıt dokusu ve yumuşak kenar gölgesi': [
        'Paper texture at 2–3% opacity plus a soft edge shadow',
        'Papiertextur mit 2–3 % Deckkraft und weicher Randschatten',
        'Texture de papier à 2–3 % d’opacité et ombre de bord douce',
        'Textura de papel al 2–3 % de opacidad y sombra de borde suave'],
      'Sunumda kaydırma sayfaları çevirir': [
        'In presentation, scrolling turns the pages',
        'In der Präsentation blättert Scrollen die Seiten um',
        'En présentation, le défilement change de page',
        'En presentación, el desplazamiento cambia de página'],
      'Akşam 19:00–07:00 arası koyu temaya, gündüz aydınlığa kendiliğinden geçer.': [
        'Switches to the dark theme between 19:00 and 07:00 and back to light during the day, on its own.',
        'Wechselt zwischen 19:00 und 07:00 selbsttätig zum dunklen Thema und tagsüber zurück zum hellen.',
        'Passe automatiquement au thème sombre entre 19 h et 7 h et revient au clair le jour.',
        'Cambia al tema oscuro entre las 19:00 y las 07:00 y vuelve al claro de día, por sí solo.'],
      'Panellerin arkasındaki buzlu cam bulanıklığı.': [
        'The frosted-glass blur behind the panels.',
        'Die Milchglas-Unschärfe hinter den Panels.',
        'Le flou de verre dépoli derrière les panneaux.',
        'El desenfoque de vidrio esmerilado detrás de los paneles.'],
      'Video kaydı için: kenarlar belirginleşir, yazılar netleşir, arayüz ekranda daha okunur olur.': [
        'For video recording: edges become more defined, text sharper and the interface more legible on screen.',
        'Für Videoaufnahmen: Kanten treten deutlicher hervor, Text wird scharfer und die Oberfläche am Bildschirm besser lesbar.',
        'Pour l’enregistrement vidéo : les bords se détachent, le texte devient plus net et l’interface plus lisible à l’écran.',
        'Para grabación de vídeo: los bordes se definen más, el texto se vuelve más nítido y la interfaz más legible en pantalla.'],
      'Uygulamanın TAMAMI premium ekran hissine geçer: tuval kalıcı olarak en az 2× süper-örneklenir (4K his — çizimler, tahta ve arayüz yakınlaştırmada asla piksellenmez), koyu temalarda zemin gerçek OLED siyahına iner, metinler keskinleşir, renkler derinleşir. Bu opsiyon AÇIKKEN içe aktarılan PDF\'ler 4K dokuya kadar yüksek çözünürlükte işlenir. YouTube kayıtları için birebir.': [
        'The WHOLE app moves to a premium display feel: the canvas is permanently super-sampled at least 2× (a 4K feel — strokes, board and interface never pixelate when zoomed), on dark themes the background drops to true OLED black, text sharpens and colors deepen. PDFs imported WHILE this option is on are processed at high resolution, up to a 4K texture. Made for YouTube recordings.',
        'Die GESAMTE App wechselt zu einem Premium-Bildgefühl: die Leinwand wird dauerhaft mindestens 2× supergesampelt (4K-Gefühl — Striche, Tafel und Oberfläche pixeln beim Zoomen nie), bei dunklen Themen sinkt der Hintergrund auf echtes OLED-Schwarz, Text wird scharfer und Farben tiefer. PDFs, die bei EINGESCHALTETER Option importiert werden, werden hochauflösend bis zu einer 4K-Textur verarbeitet. Wie gemacht für YouTube-Aufnahmen.',
        'TOUTE l’application passe à un rendu d’écran premium : la toile est suréchantillonnée en permanence au moins 2× (sensation 4K — tracés, tableau et interface ne pixellisent jamais au zoom), sur les thèmes sombres le fond descend au noir OLED véritable, le texte s’affine et les couleurs gagnent en profondeur. Les PDF importés PENDANT que l’option est active sont traités en haute résolution, jusqu’à une texture 4K. Taillé pour les enregistrements YouTube.',
        'TODA la aplicación pasa a una sensación de pantalla premium: el lienzo se supermuestrea permanentemente al menos 2× (sensación 4K — trazos, pizarra e interfaz nunca se pixelan al ampliar), en temas oscuros el fondo baja a negro OLED real, el texto se afina y los colores ganan profundidad. Los PDF importados MIENTRAS esta opción está activa se procesan en alta resolución, hasta una textura 4K. Hecho para grabaciones de YouTube.'],
      'Panel, diyalog ve araçların açılış-kapanışına yumuşak, yaylı premium animasyonlar katar. \'Zarif\' incecik hissettirir; \'Belirgin\' video anlatımlarında göze görünür şıklık verir.': [
        'Adds soft, spring-based premium animations to the opening and closing of panels, dialogs and tools. ‘Subtle’ feels featherlight; ‘Pronounced’ gives visible elegance in video explanations.',
        'Verleiht dem Öffnen und Schließen von Panels, Dialogen und Werkzeugen weiche, federnde Premium-Animationen. „Zart“ wirkt federleicht; „Deutlich“ sorgt in Videoerklärungen für sichtbare Eleganz.',
        'Ajoute des animations premium douces, à ressort, à l’ouverture et à la fermeture des panneaux, dialogues et outils. « Délicat » paraît très léger ; « Marqué » apporte une élégance visible dans les explications vidéo.',
        'Añade animaciones premium suaves, con resorte, a la apertura y cierre de paneles, diálogos y herramientas. «Delicado» se siente ligerísimo; «Marcado» aporta elegancia visible en explicaciones en vídeo.'],
      'Ekranın kenarlarına çok hafif bir karartma ekler — göz merkeze odaklanır, kayıtlar sinema karesi gibi derinlik kazanır. Tuvale çizilmez, dışa aktarımları etkilemez.': [
        'Adds a very slight darkening at the screen edges — the eye focuses on the center and recordings gain cinematic depth. It is not drawn onto the canvas and does not affect exports.',
        'Fügt an den Bildschirmrändern eine sehr leichte Abdunklung hinzu — das Auge fokussiert die Mitte, Aufnahmen gewinnen filmische Tiefe. Wird nicht auf die Leinwand gezeichnet und beeinflusst Exporte nicht.',
        'Ajoute un très léger assombrissement sur les bords de l’écran — l’œil se concentre au centre et les enregistrements gagnent une profondeur cinématographique. Non dessiné sur la toile, sans effet sur les exports.',
        'Añade un oscurecimiento muy leve en los bordes de la pantalla — la vista se centra y las grabaciones ganan profundidad cinematográfica. No se dibuja en el lienzo ni afecta a las exportaciones.'],
      'Arayüzün ana vurgu rengini kendin seç — tüm butonlar ve göstergeler uyum sağlar.': [
        'Choose the interface’s main accent color yourself — every button and indicator follows it.',
        'Wähle die Hauptakzentfarbe der Oberfläche selbst — alle Schaltflächen und Anzeigen passen sich an.',
        'Choisissez vous-même la couleur d’accent principale de l’interface — tous les boutons et indicateurs s’y accordent.',
        'Elige tú el color de acento principal de la interfaz — todos los botones e indicadores se adaptan.'],
      'Üst çubuktaki hızlı renklerin karakteri.': [
        'The character of the quick colors in the top bar.',
        'Der Charakter der Schnellfarben in der oberen Leiste.',
        'Le caractère des couleurs rapides de la barre supérieure.',
        'El carácter de los colores rápidos de la barra superior.'],
      'Kapalı — doğal renkler': [
        'Off — natural colors', 'Aus — natürliche Farben', 'Désactivé — couleurs naturelles', 'Desactivado — colores naturales'],
      'Tek anahtar, kapsamı uygulamanın tamamı: arayüz, çalışma tahtası ve açtığın PDF / slayt / belge sayfaları birlikte gece görünümüne geçer. Klasik ters çevirme değildir — fotoğraflar ve renkli grafikler negatife dönmez, tonlarını korur. Kaydedilen veri ve dışa aktarılan dosyalar daima orijinaldir; kapattığın anda her şey birebir eski hâline döner.': [
        'One switch covering the entire app: the interface, the board and any PDF / slide / document pages you have open all move to the night look together. It is not a classic invert — photos and color charts are not turned negative, they keep their tones. Saved data and exported files are always the originals; the moment you switch it off everything returns exactly as it was.',
        'Ein Schalter für die gesamte App: Oberfläche, Tafel und alle geöffneten PDF-/Folien-/Dokumentseiten wechseln gemeinsam in die Nachtansicht. Keine klassische Invertierung — Fotos und farbige Diagramme werden nicht negativ, sie behalten ihre Töne. Gespeicherte Daten und exportierte Dateien sind stets die Originale; beim Ausschalten kehrt alles exakt zurück.',
        'Un seul interrupteur pour toute l’application : l’interface, le tableau et les pages PDF / diapositives / documents ouvertes passent ensemble en apparence nocturne. Ce n’est pas une inversion classique — photos et graphiques couleur ne deviennent pas négatifs, ils conservent leurs teintes. Les données enregistrées et les fichiers exportés restent toujours les originaux ; dès que vous le désactivez, tout revient à l’identique.',
        'Un solo interruptor para toda la aplicación: la interfaz, la pizarra y las páginas PDF / diapositivas / documentos abiertas pasan juntas al aspecto nocturno. No es una inversión clásica — las fotos y los gráficos en color no se vuelven negativos, conservan sus tonos. Los datos guardados y los archivos exportados son siempre los originales; en cuanto lo desactivas todo vuelve exactamente a como estaba.'],
    });

    /* İçinde değişen sayı/saat geçen blokların SABİT parçaları */
    Object.assign(D, {
      '· nesneler bu adımlara oturur. Kâğıdın görünen kareleri Sayfa Özellikleri\'nden seçilir.': [
        '· objects snap to these steps. The visible squares of the paper are chosen in Page Properties.',
        '· Objekte rasten in diesen Schritten ein. Die sichtbaren Kästchen des Papiers werden in den Seiteneigenschaften gewählt.',
        '· les objets s’alignent sur ces pas. Les carreaux visibles du papier se choisissent dans les Propriétés de page.',
        '· los objetos se ajustan a estos pasos. Los cuadros visibles del papel se eligen en Propiedades de página.'],
      '· sunumda fare tekeriyle de ayarlanır': [
        '· also adjustable with the mouse wheel during a presentation',
        '· in der Präsentation auch mit dem Mausrad einstellbar',
        '· réglable aussi à la molette pendant une présentation',
        '· también ajustable con la rueda del ratón en presentación'],
      '— normal (önerilen)': ['— normal (recommended)', '— normal (empfohlen)', '— normal (recommandé)', '— normal (recomendado)'],
      '· Notis hazır — Ctrl+K: komut paleti · sağ tık basılı tut: hızlı araçlar': [
        '· Notis ready — Ctrl+K: command palette · hold right-click: quick tools',
        '· Notis bereit — Ctrl+K: Befehlspalette · Rechtsklick halten: Schnellwerkzeuge',
        '· Notis prêt — Ctrl+K : palette de commandes · maintenir le clic droit : outils rapides',
        '· Notis listo — Ctrl+K: paleta de comandos · mantén el clic derecho: herramientas rápidas'],
    });
    if (api.reset) api.reset();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 70));
  else setTimeout(boot, 70);
})();
