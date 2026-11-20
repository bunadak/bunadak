/* ============================================================================
   SUNUM MODU — eksiksiz çalışır hâle getirildi
   ============================================================================
   NEDEN HİÇ ÇALIŞMADI: enterPresent() tanımlıydı ama UYGULAMANIN HİÇBİR
   YERİNDEN ÇAĞRILMIYORDU. Düğme yok, kısayol yok, komut paletinde kayıt
   yok. Çıkış düğmesi ve sunum araç çubuğu bağlıydı — ama içeri girmenin
   bir yolu olmadığı için hiçbiri görünmüyordu. (v2.4.0'da sunum kaldırılmış,
   geriye çalışmayan iskelet kalmış.)

   Bu dosya sunum modunu baştan kuruyor:

   GİRİŞ NOKTALARI
     · Üst çubukta "Sunum Modu" düğmesi
     · F5 kısayolu (ayarlardan değiştirilebilir)
     · Komut paletinde "Sunum Modu" kaydı

   GİDERİLEN KUSURLAR
     · Giriş animasyonu 360 ms gecikmeli uygulanıyordu; o aralıkta çıkılırsa
       bekleyen zamanlayıcı 'present' sınıfını SONRADAN ekliyor ve mod
       kilitleniyordu. Artık zamanlayıcılar iptal ediliyor ve geç kalan iş
       "hâlâ sunumda mıyız" diye bakıyor.
     · Tam ekrandan F11/Esc ile çıkınca sunum modu açık kalıyordu; artık
       fullscreenchange dinleniyor.
     · Çıkışta araç HER ZAMAN 'smart' yapılıyordu; artık sunuma girmeden
       önceki araç geri yükleniyor.
     · Panel düzeni değişince tuval bit eşlemi yeniden boyutlanmıyordu
       (CSS ızgara değişimi window resize olayı doğurmaz) — çizgiler bulanık
       ve imleç kaymış oluyordu. Artık resize() açıkça çağrılıyor.
     · Sunum çubuğunda SAYFA GEZİNTİSİ ve SAYFA SAYACI yoktu; eklendi.
     · Yinele düğmesi yoktu; eklendi.
     · Kendini onarma (notisRecover) sunumda takılı kalmayı çözmüyordu.
============================================================================ */
(function () {
  if (window.__proPresent) return; window.__proPresent = true;

  const $i = (s) => document.getElementById(s);
  let prevTool = 'smart', timers = [], entering = false;

  function clearTimers() { timers.forEach(clearTimeout); timers.length = 0 }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)) }

  /* TAM EKRAN: ANAHTAR DEĞİL, DURUM ATAMASI
     Eskiden giriş ve çıkış ToggleFullscreen() çağırıyordu. Anahtarın sonucu
     pencerenin o anki durumuna bağlı olduğu için pencere zaten tam ekransa
     sunuma basmak onu tam ekrandan ÇIKARIYOR, bütün düzen küçülüyordu; bir
     giriş/çıkış çifti kaçtığında da parite bozulup sonraki basış ters
     çalışıyordu. Artık istenen durum doğrudan atanır (SetFullscreen) ve
     sunuma girmeden önceki durum hatırlanıp çıkışta aynen geri verilir:
     uygulamayı tam ekran kullanan biri sunumdan çıkınca tam ekran kalır. */
  let oncedenTam = false;
  const api = () => { try { return window.go && window.go.main && window.go.main.App } catch (_) { return null } };

  function goFull() {
    const A = api();
    if (A && A.SetFullscreen) {
      Promise.resolve(A.IsFullscreen ? A.IsFullscreen() : false).catch(() => false)
        .then(v => { oncedenTam = !!v; if (!oncedenTam) { try { A.SetFullscreen(true) } catch (_) { } } });
      return;
    }
    try {   /* eski gövde ya da tarayıcı */
      if (A && A.ToggleFullscreen && !document.fullscreenElement) { A.ToggleFullscreen(); return }
    } catch (_) { }
    try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => { }) } catch (_) { }
  }
  function leaveFull() {
    const A = api();
    if (A && A.SetFullscreen) {
      if (!oncedenTam) { try { A.SetFullscreen(false) } catch (_) { } }
      oncedenTam = false;
      return;
    }
    try { if (document.fullscreenElement) { document.exitFullscreen().catch(() => { }); return } } catch (_) { }
    try { if (A && A.ToggleFullscreen) A.ToggleFullscreen() } catch (_) { }
  }

  /* ---------------------------------------------------------- GİRİŞ */
  window.enterPresent = function () {
    if (presenting || entering) return;
    try { hideMiniBar() } catch (_) { }
    try { if (ringOpen) closeRing(false) } catch (_) { }
    try { if (setDlg && setDlg.open) setDlg.close() } catch (_) { }
    try { if (expDlg && expDlg.open) expDlg.close() } catch (_) { }
    try { if (typeof scratch !== 'undefined' && scratch) exitScratch() } catch (_) { }
    try { if (document.body.classList.contains('side-open')) $i('sideBtn').click() } catch (_) { }

    prevTool = (typeof tool === 'string' ? tool : 'smart');
    presenting = true; entering = true;
    clearTimers();
    goFull();
    document.body.classList.add('present-out');
    stage.classList.add('present-zoom');
    later(() => {
      entering = false;
      if (!presenting) {                       // bu arada çıkıldı → hiçbir şey yapma
        document.body.classList.remove('present-out', 'present');
        return;
      }
      document.body.classList.remove('present-out');
      document.body.classList.add('present');
      /* CSS ızgarası değişti ama window resize olayı doğmaz: tuval bit eşlemi
         elle yenilenmezse çizgiler bulanık, imleç kaymış olur. Düzen bir
         sonraki karede oturduğu için resize iki kez çağrılır. */
      try { resize() } catch (_) { }
      setTool('laser');
      markPr(); armFade(); updPage();
      requestAnimationFrame(() => {
        if (!presenting) return;
        try { resize() } catch (_) { }
        try { fitPresent() } catch (_) { }
      });
    }, 300);
    /* Giriş animasyonu #stage'e scale() uygular; getBoundingClientRect o
       ÖLÇEKLİ değeri döndürdüğü için animasyon sırasında yapılan her ölçüm
       birkaç piksel küçük çıkar. ResizeObserver dönüşümleri görmez, bu yüzden
       animasyon bitince tuvali bir kez daha eşitliyoruz. */
    later(() => {
      stage.classList.remove('present-zoom');
      if (!presenting) return;
      try { resize() } catch (_) { }
      try { fitPresent() } catch (_) { }
    }, 900);
  };

  /* ----------------------------------------------------------- ÇIKIŞ */
  window.exitPresent = function () {
    if (!presenting && !entering) return;
    presenting = false; entering = false;
    clearTimers();
    try { clearTimeout(fadeTimer) } catch (_) { }
    document.body.classList.remove('present', 'present-out');
    stage.classList.remove('present-zoom');
    const bar = $i('presentBar'); if (bar) bar.classList.remove('fade');
    document.body.classList.add('present-in');
    setTimeout(() => document.body.classList.remove('present-in'), 460);
    leaveFull();
    try { toggleSpot(false) } catch (_) { }
    try { setTool(prevTool || 'smart') } catch (_) { }
    /* Izgara eski haline dönerken ölçü bir karede oturmuyor: tuval bit
       eşlemi ve sığdırma iki kez pekiştirilir, yoksa sunumdan çıkışta
       çalışma alanı bir öncekinden küçük kalıyordu. */
    const esitle = () => {
      try { resize() } catch (_) { }
      try { (typeof fitSmart === 'function' ? fitSmart() : fit()) } catch (_) { }
    };
    setTimeout(esitle, 30);
    setTimeout(esitle, 520);
  };

  /* ------------------------------------------- TAM EKRANDAN ÇIKIŞ = SUNUMDAN ÇIKIŞ */
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && presenting && !entering) exitPresent();
  });

  /* ----------------------------------------- SUNUM ÇUBUĞU: SAYFA GEZİNTİSİ */
  function injectBar() {
    const bar = $i('presentBar'); if (!bar || $i('prPageWrap')) return;
    const ic = (id, size) => (typeof ico === 'function' ? ico(id, size || 17, 2.2) : '');
    /* Yinele — Geri Al'ın hemen yanına */
    const undoBtn = $i('prUndo');
    if (undoBtn && !$i('prRedo')) {
      const r = document.createElement('button');
      r.className = 'pbtn'; r.id = 'prRedo'; r.title = 'Yinele (Ctrl+Y)';
      r.innerHTML = ic('redo', 16);
      r.addEventListener('click', () => { try { redo() } catch (_) { } });
      undoBtn.after(r);
    }
    /* Sayfa gezintisi + sayaç — çubuğun sonuna, çıkıştan önce */
    const wrap = document.createElement('span');
    wrap.id = 'prPageWrap'; wrap.className = 'pr-page';
    wrap.innerHTML =
      '<span class="p-sep"></span>' +
      '<button class="pbtn" id="prPrev" title="Önceki sayfa (←)">' + ic('pgPrev', 16) + '</button>' +
      '<span class="pr-lbl" id="prPageLbl">1 / 1</span>' +
      '<button class="pbtn" id="prNext" title="Sonraki sayfa (→)">' + ic('pgNext', 16) + '</button>';
    const exitBtn = $i('prExit');
    if (exitBtn) bar.insertBefore(wrap, exitBtn.previousElementSibling || exitBtn);
    else bar.appendChild(wrap);
    $i('prPrev').addEventListener('click', () => { gotoPage(cur - 1); updPage() });
    $i('prNext').addEventListener('click', () => { gotoPage(cur + 1); updPage() });
  }
  function updPage() {
    const l = $i('prPageLbl'); if (!l) return;
    const n = doc.pages.length;
    l.textContent = (cur + 1) + ' / ' + n;
    const w = $i('prPageWrap'); if (w) w.style.display = n > 1 ? '' : 'none';
    const pv = $i('prPrev'), nx = $i('prNext');
    if (pv) pv.disabled = cur <= 0;
    if (nx) nx.disabled = cur >= n - 1;
  }
  /* sayfa değişince sayaç tazelensin */
  const _goto = window.gotoPage;
  if (typeof _goto === 'function') window.gotoPage = function () {
    const r = _goto.apply(this, arguments);
    if (presenting) { try { updPage(); fitPresent() } catch (_) { } }
    return r;
  };
  /* araç değişince sunum çubuğundaki vurgu tazelensin */
  const _markPr = window.markPr;

  /* ------------------------------------------------------ GİRİŞ NOKTALARI */
  function injectButton() {
    const right = $i('tbRight'); if (!right || $i('presentBtn')) return;
    const b = document.createElement('button');
    b.className = 'tbtn'; b.id = 'presentBtn';
    b.title = 'Sunum Modu — tam ekran, arayüz gizlenir, lazer hazır (F5)';
    b.innerHTML = '<svg width="17" height="17" viewBox="0 0 32 32" fill="none">' +
      '<path d="M4 5.3h24a1.3 1.3 0 0 1 1.3 1.4v12a1.3 1.3 0 0 1-1.3 1.3H4a1.3 1.3 0 0 1-1.3-1.3v-12A1.3 1.3 0 0 1 4 5.3z" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>' +
      '<path d="M16 20v6.7M10.7 26.7h10.6" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>' +
      '<path d="m13.6 9.6 6.8 3.4-6.8 3.4z" fill="var(--ic-acc)" stroke="var(--ic-acc)" stroke-width="2" stroke-linejoin="round"/></svg>';
    b.addEventListener('click', () => enterPresent());
    const slide = $i('slideBtn');
    if (slide) slide.before(b); else right.appendChild(b);
  }

  /* F5 — ayarlardan değiştirilebilen kısayol (KEYDEF.present) */
  window.addEventListener('keydown', (e) => {
    const k = (typeof KEYMAP !== 'undefined' && KEYMAP.present) || 'F5';
    const tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === k || e.key.toLowerCase() === String(k).toLowerCase()) {
      e.preventDefault();
      presenting ? exitPresent() : enterPresent();
    }
  }, { capture: true });

  /* ------------------------------------------------ TUVAL/SAHNE EŞLEMESİ
     resize() yalnız window resize olayında çalışıyordu. Oysa çalışma alanının
     boyutu CSS ızgarası değişince de değişiyor: sunuma girip çıkmak, F9 panel
     döngüsü, yan paneli açmak, kompakt arayüz, solak düzeni... Bu durumlarda
     window resize DOĞMAZ ve tuval bit eşlemi sahneyle uyuşmaz kalır:
     çizgiler hafif bulanık, imleç birkaç piksel kaymış olur.
     ResizeObserver sahneyi doğrudan izleyerek bunu kökten çözer. */
  function watchStage() {
    if (!window.ResizeObserver || window.__stageRO) return;
    let raf = 0, lastW = 0, lastH = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = stage.getBoundingClientRect();
        const w = Math.round(r.width), h = Math.round(r.height);
        if (w === lastW && h === lastH) return;
        lastW = w; lastH = h;
        try { resize() } catch (_) { }
        if (presenting) { try { fitPresent() } catch (_) { } }
      });
    });
    try { ro.observe(stage); window.__stageRO = ro } catch (_) { }
    /* dönüşüm animasyonu biter bitmez son bir eşitleme */
    stage.addEventListener('animationend', () => {
      try { resize() } catch (_) { }
      if (presenting) { try { fitPresent() } catch (_) { } }
    });
  }

  function boot() {
    injectBar(); injectButton(); updPage(); watchStage();
    /* kısayol tablosuna kaydet — Ayarlar › Gelişmiş › Klavye'de görünür */
    try {
      if (typeof KEYDEF !== 'undefined' && !KEYDEF.present) {
        KEYDEF.present = 'F5';
        KEYLABELS.present = 'Sunum modu (tam ekran sunum)';
        if (typeof KEYMAP !== 'undefined' && !KEYMAP.present) KEYMAP.present = 'F5';
        if (typeof renderKeys === 'function') renderKeys();
      }
    } catch (_) { }
    /* komut paletine ekle — PAL_CMDS() bir dizi döndürür, sarmalıyoruz */
    try {
      const _pc = window.PAL_CMDS;
      if (typeof _pc === 'function' && !_pc.__pres) {
        const w = function () {
          const a = _pc.apply(this, arguments) || [];
          a.unshift({ t: 'Sunum Modu — tam ekran sunum', k: ((typeof KEYMAP !== 'undefined' && KEYMAP.present) || 'F5').toUpperCase(), sec: 'Eylem', fn: () => enterPresent() });
          return a;
        };
        w.__pres = true; window.PAL_CMDS = w;
      }
    } catch (_) { }
    /* kendini onarma: sunumda takılı kalmayı çöz */
    try {
      const _rec = window.notisRecover;
      if (typeof _rec === 'function' && !_rec.__pres) {
        const w = function (reason) {
          const r = _rec.apply(this, arguments);
          try {
            if (!presenting && document.body.classList.contains('present')) {
              document.body.classList.remove('present', 'present-out');
            }
          } catch (_) { }
          return r;
        };
        w.__pres = true; window.notisRecover = w;
      }
    } catch (_) { }
  }
  if (document.readyState === 'complete') setTimeout(boot, 80);
  else window.addEventListener('load', () => setTimeout(boot, 80));

  window.proPresent = { enter: () => enterPresent(), exit: () => exitPresent(), updPage };
})();
