/* ============ EXE DİSK DEPOSU ÖNYÜKLEMESİ ============
   Yerel sunucu, C:\Notis\Data\kv.json içeriğini window.__NOTIS_KV olarak
   belgeye GÖMER. Burada localStorage'a basılır ve sonraki her yazım diske
   aynalanır. Tarayıcıda (sunucu yokken) bu blok kendini devre dışı bırakır. */
(function(){try{
  if(window.__NOTIS_KV==null)return;
  window.__NOTIS_SRV=true;
  /* Çevrimdışı fontlar: Manrope + Sora exe içinden gelir */
  try{var fl=document.createElement('link');fl.rel='stylesheet';fl.href='/libs/fonts/fonts.css';
    document.head.appendChild(fl)}catch(e){}
  var o=window.__NOTIS_KV;
  for(var k in o){try{localStorage.setItem(k,o[k])}catch(e){}}
  /* TOPLU yazım: değişiklikler 400ms biriktirilip TEK istekle diske gider.
     Yazım başarısız olursa görünür uyarı + otomatik yeniden deneme. */
  var q={},qt=null,failN=0;
  function flush(){
    qt=null;var ks=Object.keys(q);if(!ks.length)return;
    var batch=ks.map(function(k){return {k:k,v:q[k]}});q={};
    var x=new XMLHttpRequest();x.open('POST','/kv',true);
    x.setRequestHeader('Content-Type','application/json');
    x.onload=function(){if(x.status===200){failN=0;return}fail(batch)};
    x.onerror=function(){fail(batch)};
    try{x.send(JSON.stringify({batch:batch}))}catch(e){fail(batch)}
  }
  function fail(batch){
    batch.forEach(function(it){if(!(it.k in q))q[it.k]=it.v});   // kaybetme, tekrar dene
    failN++;
    if(failN<=5)qt=qt||setTimeout(flush,1200);
    if(failN===2&&typeof toast==='function')toast('⚠ Ayarlar diske yazılamıyor — tekrar deneniyor',4000);
    if(failN===5&&typeof toast==='function')toast('⚠ Disk yazımı BAŞARISIZ — Ayarlar → Depolama\'ya bak',6000);
  }
  function enq(k,v){q[k]=v;if(!qt)qt=setTimeout(flush,400)}
  var _s=Storage.prototype.setItem,_r=Storage.prototype.removeItem,_c=Storage.prototype.clear;
  Storage.prototype.setItem=function(k,v){_s.call(this,k,v);if(this===window.localStorage)enq(String(k),String(v))};
  Storage.prototype.removeItem=function(k){_r.call(this,k);if(this===window.localStorage)enq(String(k),null)};
  Storage.prototype.clear=function(){_c.call(this);if(this===window.localStorage){q={};var x=new XMLHttpRequest();x.open('POST','/kv',true);x.setRequestHeader('Content-Type','application/json');x.send(JSON.stringify({clear:true}))}};
  window.addEventListener('pagehide',function(){ // kapanışta bekleyenleri güvenle mühürle
    if(qt){clearTimeout(qt)}var ks=Object.keys(q);if(!ks.length)return;
    var batch=ks.map(function(k){return {k:k,v:q[k]}});q={};
    try{navigator.sendBeacon('/kv',new Blob([JSON.stringify({batch:batch})],{type:'application/json'}))}catch(e){}
  });
}catch(e){}})();
/* --- Açılış efekti: 3.1sn sonra veya dokununca sökülür --- */
(function(){
  const sp=document.getElementById('splash');if(!sp)return;
  let done=false;
  const finish=()=>{if(done)return;done=true;try{sp.remove()}catch(e){}};
  setTimeout(finish,3120);
  sp.addEventListener('click',()=>{sp.style.animation='spOut .35s ease forwards';setTimeout(finish,360)});
  sp.addEventListener('animationend',e=>{if(e.animationName==='spOut')finish()});
})();
/* ============================================================
   NOTIS 2.1 — çekirdek
============================================================ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,10);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function toast(){/* Bildirimler kapalı: çalışma ekranına hiçbir uyarı, bilgi ya da onay metni düşmez. */}

const S={smooth:.45,stab:.22,pressure:true,predict:false,shapeFix:false,snapHl:true,miniBar:true,ring:true,grain:true,
  snapGrid:false,grid:20,guides:true,angleSnap:false,laser:'#FF4D5E',spot:150,
  applyDefaults:true,wheelPage:true,
  /* Opsiyonlar — hepsi kapalı başlar */
  smartSnap:false,focusWrite:false,autoZoom:false,livingInk:false,penDNA:false,memCanvas:false,compact:true,edgeScroll:false,cornerUI:false,hideLeft:false,hideTop:false,ultraInk:false,proPens:false,board:'classic',
  defColor:'#111827',defOp:1};
const INK={z:1}; // Living Ink: geçerli render'ın zoom bağlamı (dışa aktarımda 1)
const ES={dx:0,dy:0,raf:0}; // Kenar oto-kaydırma: kare başına tek redraw
let curCP=null;  // Çark kalemi (özel kalem) aktifse burada tutulur — normal araca geçince sıfırlanır
const DEF={smart:2.2,ball:2.2,fountain:2.4,pencil:2.2,hl:18,text:24};const DEFV=2; // kalınlık kalibrasyon sürümü
const KEYDEF={select:'v',smart:'a',ball:'b',fountain:'f',pencil:'p',hl:'h',eraser:'e',text:'t',line:'l',compass:'c',shapes:'g',fit:'0',randColor:'r',solve:'q'};
let KEYMAP={...KEYDEF};
const KEYLABELS={select:'Seçim aracı',smart:'Akıllı kalem',ball:'Tükenmez kalem',fountain:'Dolma kalem',pencil:'Kurşun kalem',hl:'Fosforlu kalem',eraser:'Silgi',text:'Metin',line:'Akıllı cetvel',compass:'Pergel',shapes:'Şekiller paneli',fit:'Sığdır',randColor:'Rastgele renge geç',solve:'Çözüm modu (soru taşı)'};

const SWATCH=['#243B6B','#111827','#C0392B','#E8590C','#0B7285','#2B8A3E','#845EF7','#FFE066'];
let doc={title:'Adsız Tahta',pages:[]};
let cur=0, curLayerId=null, tool='smart';
let penColor=SWATCH[1], penSize=2.2, penOp=1; // varsayılan renk: siyah (fosforlu kendi sarısını kullanır)
let view={x:0,y:0,s:1};
const GAP=48;
let favs=[
  {name:'Mürekkep',tool:'ball',color:'#243B6B',size:3,op:1},
  {name:'Dolma',tool:'fountain',color:'#111827',size:4.5,op:1},
  {name:'Fosforlu',tool:'hl',color:'#FFE066',size:18,op:.5},
  {name:'Kurşun',tool:'pencil',color:'#4B5563',size:2.5,op:.85},
];
let selection=[];
let eraserTypes={stroke:true,hl:true,text:true,image:false}; // Matis kurali: resimler varsayilan korunur
let laserOn=false, spotOn=false, protractor=null;
let activeSticker=null, importedStickers=[];
let presenting=false, focusMode=false;
let scratch=null, solveDraft=null;
let prevPen='ball';
const EMOJI=['⭐','❤️','✅','🔥','📌','💡','🎯','📚','☕','🌙','☀️','🌈','✏️','📎','🏆','🎉','🧠','⏰','🍀','🎵','💪','🔖','🌸','⚡'];

function newLayer(name){return{id:uid(),name,visible:true,locked:false,opacity:1,objects:[]}}
function newPage(paper='plain'){return{id:uid(),name:'Sayfa '+(doc.pages.length+1),paper,bookmark:false,infinite:false,bg:null,bgImg:null,w:1000,h:1414,layers:[newLayer('Katman 1')],_undo:[],_redo:[]}}
function page(){return scratch?scratch.page:doc.pages[cur]}
function layer(){const p=page();return p.layers.find(l=>l.id===curLayerId)||p.layers[p.layers.length-1]}
function boardMode(){return !!scratch||(doc.pages.length===1&&doc.pages[0].infinite)}

/* ---------- düzen: sayfalar dikey akış ---------- */
let layoutCache=null;
function pageGap(){ // PDF belgelerinde sayfalar BİTİŞİK akar (kitap gibi), tahta sayfalarında boşluk kalır
  return (doc.pages.length>1&&doc.pages.every(p=>p.bg))?0:GAP}
function layout(){if(layoutCache)return layoutCache;
  if(boardMode())return layoutCache=[{x:0,y:0}];
  const g=pageGap();let y=0;const a=[];for(const p of doc.pages){a.push({x:0,y});y+=p.h+g}return layoutCache=a}
function invalidateLayout(){layoutCache=null;if(window.LIB)LIB.dirty()}
function curOff(){return boardMode()?{x:0,y:0}:layout()[cur]}
function bandAt(gy){const L=layout(),g=pageGap();for(let i=0;i<doc.pages.length;i++){if(gy<L[i].y+doc.pages[i].h+g/2)return i}return doc.pages.length-1}

/* ---------- Geri al / Yinele ---------- */
/* PERFORMANS — undo yığını görüntü havuzu:
   Geri-al anlık görüntüleri katmanları JSON'a çevirir. İçe aktarılmış soru
   görselleri / PDF sayfaları MB'larca dataURL taşır; bunlar her çizgi
   başlangıcında (snapshot) yeniden kopyalansaydı çizim belirgin şekilde
   takılırdı ("arkamdan çiziyor" hissi). Büyük src dizeleri havuzda tek kopya
   tutulur, undo kayıtlarına yalnız kısa kimlik yazılır. */
const _srcPool=new Map();let _srcSeq=1;
function _srcTok(v){if(typeof v!=='string'||v.length<512||v.startsWith('@up:'))return v;
  let id=_srcPool.get(v);
  if(id==null){id='@up:'+(_srcSeq++);_srcPool.set(v,id);_srcPool.set(id,v)}
  return id}
function packLayers(layers){return JSON.stringify(layers,(k,v)=>k==='src'?_srcTok(v):v)}
function unpackSrc(o){if(typeof o.src==='string'&&o.src.startsWith('@up:'))o.src=_srcPool.get(o.src)||o.src;
  if(o.type==='group')o.children.forEach(unpackSrc)}
function snapshot(){const p=page();p._undo.push(packLayers(p.layers));if(p._undo.length>40)p._undo.shift();p._redo.length=0;updUndoBtns();if(window.LIB)LIB.dirty()}
function restore(json){const p=page();p.layers=JSON.parse(json);p.layers.forEach(l=>l.objects.forEach(o=>{unpackSrc(o);hydrate(o)}));if(!p.layers.find(l=>l.id===curLayerId))curLayerId=p.layers[p.layers.length-1].id;selection=[];redraw();renderLayers();updUndoBtns()}
function hydrate(o){if(o.type==='image'&&o.src&&!(o._img instanceof HTMLImageElement)){const im=new Image();im.onload=redraw;im.src=o.src;o._img=im}if(o.type==='group')o.children.forEach(hydrate)}
function undo(){const p=page();if(!p._undo.length)return;p._redo.push(packLayers(p.layers));restore(p._undo.pop())}
function redo(){const p=page();if(!p._redo.length)return;p._undo.push(packLayers(p.layers));restore(p._redo.pop())}
function updUndoBtns(){const p=page();$('#undoBtn').disabled=!p._undo.length;$('#redoBtn').disabled=!p._redo.length}

/* ============================================================
   GÖRÜNÜM
============================================================ */
const stage=$('#stage'), cv=$('#cv'), ovl=$('#ovl');
const ctx=cv.getContext('2d'), octx=ovl.getContext('2d');ctx.imageSmoothingQuality='high';octx.imageSmoothingQuality='high';
let DPR=Math.min(2,window.devicePixelRatio||1);
let stageRect=null;
function resize(){const r=stageRect=stage.getBoundingClientRect();[cv,ovl].forEach(c=>{c.width=r.width*DPR;c.height=r.height*DPR;c.style.width=r.width+'px';c.style.height=r.height+'px'});ctx.imageSmoothingQuality='high';octx.imageSmoothingQuality='high';/* boyutlandırma bağlamı sıfırlar — kalite ayarını geri kur */redraw();drawOverlay()}
window.addEventListener('resize',resize);
function toDoc(e){const r=stageRect||(stageRect=stage.getBoundingClientRect());return{x:(e.clientX-r.left-view.x)/view.s,y:(e.clientY-r.top-view.y)/view.s}}
function setZoom(s,cx,cy){if(typeof azCancel==='function')azCancel();const r=stage.getBoundingClientRect();cx=cx??r.width/2;cy=cy??r.height/2;s=clamp(s,.1,8);const k=s/view.s;view.x=cx-(cx-view.x)*k;view.y=cy-(cy-view.y)*k;view.s=s;$('#zoomLbl').textContent=Math.round(s*100)+'%';redraw()}
function fit(){const p=page(),r=stage.getBoundingClientRect();
  if(boardMode()){
    /* Sonsuz tahta: içerik VARSA ekrana ortalayarak sığdır — kütüphaneden açılan
       çözümler köşeye kaçmaz, tam kaydedildiği görünümde karşına gelir.
       Boş tahtada eski davranış (origin görünümü) aynen korunur. */
    let bb=null;
    for(const l of p.layers){if(!l.visible)continue;
      for(const o of l.objects){const b=objBB(o);
        if(!bb)bb={x0:b.x0,y0:b.y0,x1:b.x1,y1:b.y1};
        else{bb.x0=Math.min(bb.x0,b.x0);bb.y0=Math.min(bb.y0,b.y0);bb.x1=Math.max(bb.x1,b.x1);bb.y1=Math.max(bb.y1,b.y1)}}}
    if(bb&&bb.x1-bb.x0>1){
      const pad=56;
      const s=clamp(Math.min((r.width-pad*2)/(bb.x1-bb.x0),(r.height-pad*2)/Math.max(1,bb.y1-bb.y0)),.12,1.5);
      view={s,x:(r.width-(bb.x0+bb.x1)*s)/2,y:(r.height-(bb.y0+bb.y1)*s)/2};
    }else view={x:r.width/2,y:r.height/3,s:1};
  }
  else if(presenting){fitPresent()}
  else{const s=clamp((r.width-64)/p.w,.1,4);const off=layout()[cur];view={x:(r.width-p.w*s)/2+2,y:-off.y*s+8,s}}
  $('#zoomLbl').textContent=Math.round(view.s*100)+'%';redraw()}
function fitPresent(){const p=page(),r=stage.getBoundingClientRect();
  const s=Math.min(r.width/p.w,r.height/p.h)*.97;const off=curOff();
  view={x:(r.width-p.w*s)/2,y:(r.height-p.h*s)/2-off.y*s,s};
  $('#zoomLbl').textContent=Math.round(s*100)+'%';redraw()}

/* ============================================================
   KÂĞIT DESENLERİ
============================================================ */
function paperPattern(c,pp,x0,y0,x1,y1){
  c.save();c.lineWidth=1;
  const g=32,fine=10;
  const strokeLines=(step,color,horiz,vert)=>{c.strokeStyle=color;c.beginPath();
    if(vert)for(let x=Math.floor(x0/step)*step;x<=x1;x+=step){c.moveTo(x,y0);c.lineTo(x,y1)}
    if(horiz)for(let y=Math.floor(y0/step)*step;y<=y1;y+=step){c.moveTo(x0,y);c.lineTo(x1,y)}
    c.stroke()};
  if(pp==='lined')strokeLines(g,'rgba(60,90,160,.20)',true,false);
  else if(pp==='grid')strokeLines(g,'rgba(60,90,160,.16)',true,true);
  else if(pp==='graph'){strokeLines(fine,'rgba(200,90,80,.10)',true,true);strokeLines(fine*5,'rgba(200,90,80,.22)',true,true)}
  else if(pp==='dotted'){c.fillStyle='rgba(60,90,160,.30)';for(let x=Math.floor(x0/28)*28;x<=x1;x+=28)for(let y=Math.floor(y0/28)*28;y<=y1;y+=28){c.beginPath();c.arc(x,y,1.1,0,7);c.fill()}}
  else if(pp==='iso'){c.strokeStyle='rgba(60,90,160,.16)';const st=26,t=Math.tan(Math.PI/6),W=x1-x0,H=y1-y0;c.beginPath();
    for(let i=-Math.ceil(H/(st/t));i<W/st+Math.ceil(H/(st/t));i++){const bx=x0+i*st;c.moveTo(bx,y0);c.lineTo(bx+H/t,y1);c.moveTo(bx,y0);c.lineTo(bx-H/t,y1)}c.stroke()}
  else if(pp==='coord'){strokeLines(g,'rgba(60,90,160,.13)',true,true);const cx=(x0+x1)/2,cy=(y0+y1)/2;c.strokeStyle='rgba(30,50,110,.55)';c.lineWidth=1.6;c.beginPath();c.moveTo(x0,cy);c.lineTo(x1,cy);c.moveTo(cx,y0);c.lineTo(cx,y1);c.stroke();
    c.fillStyle='rgba(30,50,110,.55)';c.beginPath();c.moveTo(x1,cy);c.lineTo(x1-10,cy-5);c.lineTo(x1-10,cy+5);c.fill();c.beginPath();c.moveTo(cx,y0);c.lineTo(cx-5,y0+10);c.lineTo(cx+5,y0+10);c.fill()}
  c.restore();
}

/* ============================================================
   NESNE ÇİZİMİ
============================================================ */
function strokePath(c,pts){if(pts.length<2)return;c.beginPath();c.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length-1;i++){const mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;c.quadraticCurveTo(pts[i].x,pts[i].y,mx,my)}
  c.lineTo(pts.at(-1).x,pts.at(-1).y)}
/* KALİTELİ MÜREKKEP: değişken kalınlıklı stroke'u TEK dolgu poligonu olarak çizer.
   Eski yöntem (segment segment çizim) yarı saydam uçların üst üste binmesiyle
   'noktalı' görünüm yaratıyordu; tek dolguda alfa üniform — tükenmez gibi
   kesintisiz, ama basınca/hıza duyarlı gerçek mürekkep. */
function fillInkStroke(c,rawPts,widthAt){
  // ardışık çakışık noktaları ele (sıfır yön vektörü kalınlığı söndürür)
  const pts=[rawPts[0]];
  for(let i=1;i<rawPts.length;i++){const q=rawPts[i],l=pts[pts.length-1];
    if(Math.abs(q.x-l.x)>.01||Math.abs(q.y-l.y)>.01)pts.push(q)}
  const L=pts.length;
  if(L===1){const w=widthAt(pts[0],0,1)/2;c.beginPath();c.arc(pts[0].x,pts[0].y,Math.max(.3,w),0,7);c.fill();return}
  const dirs=new Array(L);
  for(let i=0;i<L;i++){
    const a=pts[Math.max(0,i-1)],b=pts[Math.min(L-1,i+1)];
    let dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy)||1;dirs[i]=[dx/d,dy/d];
  }
  const Lp=new Array(L),Rp=new Array(L);
  for(let i=0;i<L;i++){
    const w=Math.max(.2,widthAt(pts[i],i,L)/2),[dx,dy]=dirs[i];
    Lp[i]={x:pts[i].x-dy*w,y:pts[i].y+dx*w};
    Rp[i]={x:pts[i].x+dy*w,y:pts[i].y-dx*w};
  }
  c.beginPath();
  c.moveTo(Lp[0].x,Lp[0].y);
  for(let i=1;i<L-1;i++){const mx=(Lp[i].x+Lp[i+1].x)/2,my=(Lp[i].y+Lp[i+1].y)/2;c.quadraticCurveTo(Lp[i].x,Lp[i].y,mx,my)}
  c.lineTo(Lp[L-1].x,Lp[L-1].y);
  { // uç kapağı — yuvarlak
    const[dx,dy]=dirs[L-1],a=Math.atan2(dy,dx),w=Math.max(.2,widthAt(pts[L-1],L-1,L)/2);
    c.arc(pts[L-1].x,pts[L-1].y,w,a+Math.PI/2,a-Math.PI/2,true);
  }
  for(let i=L-2;i>0;i--){const mx=(Rp[i].x+Rp[i-1].x)/2,my=(Rp[i].y+Rp[i-1].y)/2;c.quadraticCurveTo(Rp[i].x,Rp[i].y,mx,my)}
  c.lineTo(Rp[0].x,Rp[0].y);
  { // başlangıç kapağı — yuvarlak
    const[dx,dy]=dirs[0],a=Math.atan2(dy,dx),w=Math.max(.2,widthAt(pts[0],0,L)/2);
    c.arc(pts[0].x,pts[0].y,w,a-Math.PI/2,a+Math.PI/2,true);
  }
  c.closePath();c.fill();
}
/* ============ PRO KALEM SANAT KATMANI ============
   Her kalem kendi imzasını kazanır. Tüm efektler DETERMİNİSTİK
   (tohum, çizginin ilk noktasından türetilir → her redraw'da birebir aynı)
   ve tek geçişli dolgular/inceler üzerine kurulu (performans dostu). */
/* Renk tonlama: PRO mürekkep derinliği için */
function shade(hex,k){ // k: -1..1 (negatif koyulaştırır)
  try{
    const n=parseInt(hex.slice(1),16);
    let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    if(k<0){r*=1+k;g*=1+k;b*=1+k}else{r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k}
    return '#'+((1<<24)|(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b)).toString(16).slice(1);
  }catch(e){return hex}
}
const strokeSeed=(pts)=>((Math.round(pts[0].x*13.7)*73856093)^(Math.round(pts[0].y*7.3)*19349663))>>>0;
function offsetRail(pts,d){ // yol boyunca ±d ofsetli ray (fosforlu pigment kenarı, dolma parlaklığı)
  const L=pts.length,out=new Array(L);
  for(let i=0;i<L;i++){
    const a=pts[Math.max(0,i-1)],b=pts[Math.min(L-1,i+1)];
    let dx=b.x-a.x,dy=b.y-a.y;const n=Math.hypot(dx,dy)||1;
    out[i]={x:pts[i].x-dy/n*d,y:pts[i].y+dx/n*d};
  }
  return out;
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* Air Brush: yol boyunca deterministik püskürtme — seed'li, her redraw'da aynı görüntü */
function drawSpray(c,o){
  const pts=o.points,fx=o.fx,rnd=mulberry32(fx.sd),R=fx.s.r,step=Math.max(2,o.size*fx.s.sp*30);
  c.save();c.fillStyle=o.color;c.globalAlpha*=o.opacity;
  const dots=Math.round(6+fx.s.d*12);
  let acc=0;
  for(let i=1;i<pts.length;i++){
    const p0=pts[i-1],p1=pts[i],d=dist(p0,p1);acc+=d;
    if(acc<step)continue;acc=0;
    const pr=p1.p??.6,rr=R*(0.55+0.9*pr);
    for(let k=0;k<dots;k++){
      const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*rr;      // merkeze yoğun dağılım
      const sz=.5+rnd()*1.6;
      c.beginPath();c.arc(p1.x+Math.cos(a)*r,p1.y+Math.sin(a)*r,sz,0,7);c.fill()}
  }
  c.restore();
}
/* ---------------------------------------------------------------------------
 * Pro Ink — yüksek kalite mürekkep yumuşatma (smooth ink)
 * Serbest kalem çizgilerini el titremesinden arındırıp ipeksi eğrilere çevirir.
 * İki aşama: (1) alçak-geçiren ağırlıklı ortalama (tremor'ı yutar), (2) Chaikin
 * köşe-kesme spline'ı (pürüzsüz eğrilik). Bu, yüksek kaliteli kalem motorlarında
 * kullanılan standart bir tekniktir. Çizgi/şekil/pergel (o.straight) DOKUNULMAZ.
 * Sonuç WeakMap'te önbelleklenir (kayıtta saklanmaz, yeniden çizimde ucuz).
 * ------------------------------------------------------------------------- */
const _inkCache=new WeakMap();
function proInkSmooth(src){
  const n=src.length; if(n<4) return src;
  const P=p=>(p==null?0.6:p);
  // ORİJİNAL kalem teknolojisi: hafif merkez-ağırlıklı alçak-geçiren (/8) —
  // gecikmeyi minimumda tutar, temiz kalem girişinde çizgi kaleme yapışık kalır.
  const a=[src[0]];
  for(let i=1;i<n-1;i++){const p0=src[i-1],p1=src[i],p2=src[i+1];
    a.push({x:(p0.x+6*p1.x+p2.x)/8,y:(p0.y+6*p1.y+p2.y)/8,p:(P(p0.p)+6*P(p1.p)+P(p2.p))/8,t:p1.t});}
  a.push(src[n-1]);
  let cur=a;
  for(let pass=0;pass<2;pass++){
    const out=[cur[0]];
    for(let i=0;i<cur.length-1;i++){const A=cur[i],B=cur[i+1];
      out.push({x:A.x*0.75+B.x*0.25,y:A.y*0.75+B.y*0.25,p:P(A.p)*0.75+P(B.p)*0.25,t:A.t});
      out.push({x:A.x*0.25+B.x*0.75,y:A.y*0.25+B.y*0.75,p:P(A.p)*0.25+P(B.p)*0.75,t:B.t});}
    out.push(cur[cur.length-1]); cur=out;
  }
  return cur;
}
function proInkPts(o){
  const src=o.points;
  if(o.straight||!src||src.length<4) return src;
  const v=1; // orijinal motor: ayar bağımlılığı yok
  /* Geçerlilik: nokta sayısı + UÇ NOKTA KOORDİNATLARI.
     Taşı/ölçekle/döndür noktaları YERİNDE değiştirir, sayıyı değiştirmez —
     uçlar da kontrol edilmezse tuval eski konumdaki gövdeyi çizmeye devam eder
     (nesne "taşınmıyor" gibi görünür, uçlardan hayalet çizgiler sarkar). */
  const h=src[0],t=src[src.length-1];
  let e=_inkCache.get(o);
  if(e&&e.n===src.length&&e.v===v&&e.hx===h.x&&e.hy===h.y&&e.tx===t.x&&e.ty===t.y) return e.pts;
  const pts=proInkSmooth(src); _inkCache.set(o,{n:src.length,v,pts,hx:h.x,hy:h.y,tx:t.x,ty:t.y}); return pts;
}
function drawStroke(c,o){
  const pts=proInkPts(o);if(!pts||!pts.length)return;
  if(o.fx&&o.fx.s){drawSpray(c,o);return}                 // Air Brush özel dalı
  c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=o.color;c.globalAlpha*=o.opacity;
  if(o.tool==='hl'){c.globalCompositeOperation='multiply';c.lineCap='butt'}
  const HLPRO=(o.tool==='hl'&&S.proPens&&pts.length>2&&!o.straight);
  if(o.fx&&o.fx.b)c.globalCompositeOperation=o.fx.b;      // çark kalemi blend (Fosforlu: multiply)
  /* Kalem Stüdyosu: pk = basınç etkisi (0.8 = klasik davranış), nib = uç yapısı
     0 sivri (uçlarda incelir) · 1 ince · 2 dolgun (%18 geniş) · 3 keski (düz kesim) */
  const NIB=o.nib??1, NW=NIB===2?1.18:1, PKK=o.pk==null?1:clamp(o.pk/.8,0,1.75);
  if(NIB===3&&o.tool!=='hl')c.lineCap='butt';
  /* GEOMETRİK NESNELER (şekil düzelt, şekiller paneli, cetvel, pergel):
     hangi kalemle çizilirse çizilsin DAİMA temiz, sabit kalınlıkta çizgi.
     Aşağıdaki kalem-özel dallar (değişken kalınlık, uç inceltme, nefes)
     bunlara uygulanırsa kare gözyaşı damlasına döner. */
  if(o.straight){
    c.lineWidth=o.size*NW;
    c.beginPath();c.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);
    c.stroke();c.restore();return;
  }
  const nibEnd=(i,L)=>NIB===0?(.3+.7*Math.min(1,i/6,(L-i)/6)):1;
  if(o.tool==='smart'){const L=pts.length,EG=ENGINE_DEFAULTS,FX=o.fx;
    const PRO=S.proPens?1.12:1;               // Pro: kalınlık tepkisi zenginleşir
    if(S.proPens&&L>3){                        // PRO İMZA: kâğıda gömülme gölgesi
      const gz=Math.max(1,INK.z);
      c.save();c.globalAlpha*=.085;c.fillStyle='#000';c.translate(.7/gz,1/gz);
      fillInkStroke(c,pts,(pt,i,n)=>{
        const pr=.6+(((pt&&pt.p)??.6)-.6)*PKK;
        return Math.max(.4,o.size*NW*nibEnd(i,n)*(0.45+1.25*pr));
      });c.restore();
    }
    if(S.proPens&&L>3){                        // PRO İMZA: renk-derinlikli mürekkep (uçtan uca ton gradyanı)
      const a=pts[0],b2=pts[L-1];
      try{const gr=c.createLinearGradient(a.x,a.y,b2.x,b2.y);
        gr.addColorStop(0,shade(o.color,-.22));gr.addColorStop(.5,o.color);gr.addColorStop(1,shade(o.color,-.16));
        c.fillStyle=gr;}catch(e){c.fillStyle=o.color}
    }else c.fillStyle=o.color;
    fillInkStroke(c,pts,(pt,i,n)=>{
      const pr=.6+(((pt&&pt.p)??.6)-.6)*PKK*PRO;
      let w=Math.max(.4,o.size*NW*nibEnd(i,n)*(0.45+1.25*pr));
      if(FX)w=clamp(w,EG.minWidth,EG.maxWidth*Math.max(1,o.size/6)); // motor sınırı (çark kalemleri)
      return w;
    });
    if(FX&&(FX.t||FX.g||FX.n)){
      /* Grafit / keçe dokusu: seed'li deterministik ofset geçişleri — silmez, katman ekler */
      const gz=Math.max(1,INK.z),rnd=mulberry32(o.fx.sd),k=(FX.t||0)+(FX.g||0);
      const jit=.4+(FX.n||0)*1.4;
      for(let pass=0;pass<(k>.4?2:1);pass++){
        c.save();c.globalAlpha*=clamp(.16+k*.4,.1,.5);
        c.translate((rnd()*2-1)*jit/gz,(rnd()*2-1)*jit/gz);
        c.lineWidth=o.size*(.4+rnd()*.25);strokePath(c,pts);c.stroke();c.restore()}
    }
    const WETX=Math.max((FX&&FX.w)||0,S.proPens?.18:0);
    if(WETX>.12){                                            // çift-ton: koyu ıslak çekirdek
      c.save();c.globalAlpha*=clamp(WETX*.5,.08,.42);
      c.lineWidth=o.size*.5;strokePath(c,pts);c.stroke();c.restore();
    }
    if(S.proPens&&L>6){                                      // PRO İMZA: yavaşlayınca mürekkep birikir
      const rnd=mulberry32(strokeSeed(pts));c.save();
      for(let i=3;i<L-3;i+=2){
        const pr=(pts[i].p??.6);
        if(pr>.86&&rnd()<.5){                                // yüksek basınç/yavaşlık noktaları
          c.globalAlpha=Math.min(.14,(pr-.86)*.9)*o.opacity;
          c.beginPath();c.arc(pts[i].x,pts[i].y,o.size*NW*(.62+rnd()*.28),0,7);
          c.fillStyle=o.color;c.fill();
        }
      }c.restore();
    }
  }else if(o.tool==='fountain'){const L=pts.length;
    for(let i=1;i<L;i++){const p0=pts[i-1],p1=pts[i];const pr0=((p0.p??.5)+(p1.p??.5))/2,pr=.5+(pr0-.5)*PKK;
      c.lineWidth=Math.max(.4,o.size*NW*nibEnd(i,L)*(0.35+1.35*pr));c.beginPath();c.moveTo(p0.x,p0.y);c.lineTo(p1.x,p1.y);c.stroke()}
      if(S.proPens){
        c.save();c.globalAlpha*=.26;c.lineWidth=o.size*NW*.52;strokePath(c,pts);c.stroke();c.restore();  // koyu mürekkep çekirdeği
        /* PRO İMZA: ıslak mürekkep parlaklığı — çizginin bir yanında ince ışık şeridi */
        c.save();c.globalAlpha*=.16;c.strokeStyle='#FFFFFF';
        c.lineWidth=Math.max(.5,o.size*NW*.14);
        strokePath(c,offsetRail(pts,o.size*NW*.22));c.stroke();c.restore();
      }
}else if(o.tool==='pencil'){
    /* Living Ink açıkken doku ofseti zoom'a göre yeniden hesaplanır — yakınlaşınca
       grain büyüyüp bulanmak yerine gerçek kalem dokusu gibi incelikli kalır. */
    const gz=Math.max(1,INK.z);
    c.globalAlpha*=.82;c.lineWidth=o.size*NW;strokePath(c,pts);c.stroke();
    c.globalAlpha*=.35;c.lineWidth=o.size*.55;c.save();c.translate(.7/gz,.5/gz);strokePath(c,pts);c.stroke();c.restore();
    if(INK.z>1.8){c.globalAlpha*=.5;c.lineWidth=o.size*.3;c.save();c.translate(-.45/gz,.32/gz);strokePath(c,pts);c.stroke();c.restore()}
    if(S.proPens){                            // PRO İMZA Kurşun: gerçek grafit dokusu
      const rnd=mulberry32(strokeSeed(pts));
      for(let k=0;k<2;k++){c.save();
        c.globalAlpha*=.16+rnd()*.08;
        c.translate((rnd()*2-1)*.9/gz,(rnd()*2-1)*.9/gz);
        c.lineWidth=o.size*(.28+rnd()*.2);strokePath(c,pts);c.stroke();c.restore()}
    }
  }else if(o.tool==='ball'&&S.proPens){      // PRO İMZA Tükenmez: ipek 'nefes alan' çizgi
    c.fillStyle=o.color;
    const ph=(strokeSeed(pts)%628)/100;      // deterministik faz
    fillInkStroke(c,pts,(pt,i,n)=>{
      const taper=0.55+0.45*Math.min(1,i/5,(n-1-i)/5);
      const breath=1+0.05*Math.sin(i*.55+ph); // ±%5 canlı kalınlık nefesi
      return o.size*NW*taper*breath;
    });
    c.save();c.globalAlpha*=.5;              // bilye ucunun ilk mürekkep damlası
    c.beginPath();c.arc(pts[0].x,pts[0].y,o.size*NW*.58,0,7);c.fill();c.restore();
  }else{c.lineWidth=o.size*NW;
    if(o.straight){c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y)}
    else strokePath(c,pts);
    c.stroke();
    if(HLPRO){ // PRO İMZA Fosforlu: kenarlarda pigment toplanması
      c.save();c.globalAlpha*=.28;c.lineWidth=Math.max(.6,o.size*NW*.10);
      strokePath(c,offsetRail(pts, o.size*NW*.42));c.stroke();
      strokePath(c,offsetRail(pts,-o.size*NW*.42));c.stroke();
      c.restore();
    }}
  c.restore();
}
/* Yazı tipi: "Güzel El Yazısı" açıkken metin, Excalifont el yazısı fontuyla çizilir */
function textFontCSS(size,scale){const s=size*(scale||1);
  return (typeof S!=='undefined'&&S.handFont)?`400 ${s}px Excalifont, Manrope, sans-serif`:`600 ${s}px Manrope, sans-serif`}
function drawText(c,o){c.save();c.globalAlpha*=o.opacity??1;c.fillStyle=o.color;c.font=textFontCSS(o.size);c.textBaseline='top';
  o.text.split('\n').forEach((ln,i)=>c.fillText(ln,o.x,o.y+i*o.size*1.25));c.restore()}
function drawImage(c,o){if(!o._img||!o._img.complete)return;c.save();c.globalAlpha*=o.opacity??1;
  c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(o.rot||0);c.drawImage(o._img,-o.w/2,-o.h/2,o.w,o.h);c.restore()}
function drawObj(c,o){const mk=o._mk;if(mk){c.save();c.globalAlpha*=.22}if(o.type==='stroke')drawStroke(c,o);else if(o.type==='text')drawText(c,o);else if(o.type==='image')drawImage(c,o);else if(o.type==='group'){c.save();c.globalAlpha*=o.opacity??1;o.children.forEach(ch=>drawObj(c,ch));c.restore()}if(mk)c.restore()}

function bboxOf(o){
  if(o.type==='stroke'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of o.points){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)}const m=o.size/2+2;return{x0:x0-m,y0:y0-m,x1:x1+m,y1:y1+m}}
  if(o.type==='text'){const lines=o.text.split('\n');const w=Math.max(...lines.map(l=>l.length))*o.size*.58;return{x0:o.x,y0:o.y,x1:o.x+w,y1:o.y+lines.length*o.size*1.25}}
  if(o.type==='image'){const cx=o.x+o.w/2,cy=o.y+o.h/2,r=Math.hypot(o.w,o.h)/2;if(o.rot){return{x0:cx-r,y0:cy-r,x1:cx+r,y1:cy+r}}return{x0:o.x,y0:o.y,x1:o.x+o.w,y1:o.y+o.h}}
  if(o.type==='group'){let b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};for(const ch of o.children){const cb=bboxOf(ch);b.x0=Math.min(b.x0,cb.x0);b.y0=Math.min(b.y0,cb.y0);b.x1=Math.max(b.x1,cb.x1);b.y1=Math.max(b.y1,cb.y1)}return b}
}
function selBBox(){let b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};for(const o of selection){const cb=bboxOf(o);b.x0=Math.min(b.x0,cb.x0);b.y0=Math.min(b.y0,cb.y0);b.x1=Math.max(b.x1,cb.x1);b.y1=Math.max(b.y1,cb.y1)}return b}
/* Performans: bbox önbelleği — geometri değişince transformObj/rotateObj geçersiz kılar.
   Redraw ve Akıllı Snap her karede binlerce noktayı taramak yerine bunu kullanır. */
function objBB(o){return o._bb||(o._bb=bboxOf(o))}
function transformObj(o,fn,sizeK=1){
  o._bb=null;_inkCache.delete(o); // noktalar değişiyor → yumuşatma önbelleği MUTLAKA tazelensin
  if(o.type==='stroke'){o.points.forEach(p=>{const n=fn(p.x,p.y);p.x=n.x;p.y=n.y});o.size*=sizeK}
  else if(o.type==='text'){const n=fn(o.x,o.y);o.x=n.x;o.y=n.y;o.size*=sizeK}
  else if(o.type==='image'){const c=fn(o.x+o.w/2,o.y+o.h/2);o.w*=sizeK;o.h*=sizeK;o.x=c.x-o.w/2;o.y=c.y-o.h/2}
  else if(o.type==='group')o.children.forEach(ch=>transformObj(ch,fn,sizeK));
}
function rotateObj(o,cx,cy,a){
  o._bb=null;
  const rot=(x,y)=>{const dx=x-cx,dy=y-cy;return{x:cx+dx*Math.cos(a)-dy*Math.sin(a),y:cy+dx*Math.sin(a)+dy*Math.cos(a)}};
  if(o.type==='image'){const c=rot(o.x+o.w/2,o.y+o.h/2);o.x=c.x-o.w/2;o.y=c.y-o.h/2;o.rot=(o.rot||0)+a}
  else if(o.type==='group')o.children.forEach(ch=>rotateObj(ch,cx,cy,a));
  else transformObj(o,rot,1);
}

/* ============================================================
   ANA ÇİZİM — sürekli kaydırmalı sayfa akışı
============================================================ */
let scrollDetectLock=false;
function redraw(){ctx.imageSmoothingQuality='high';
  const p=page();if(!p)return;
  invalidateLayout();const L=layout();
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,cv.width,cv.height);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  // Piksel hizalama: kesirli çevirmelerin yol açtığı metin titremesini önler
  ctx.setTransform(DPR*view.s,0,0,DPR*view.s,Math.round(DPR*view.x),Math.round(DPR*view.y));
  const r=stageRect||(stageRect=stage.getBoundingClientRect());
  const vx0=-view.x/view.s,vy0=-view.y/view.s,vx1=(r.width-view.x)/view.s,vy1=(r.height-view.y)/view.s;
  INK.z=S.livingInk?view.s:1; // Living Ink: mürekkep bu zoom'a göre yeniden hesaplanır
  if(boardMode()){
    ctx.fillStyle=boardBg();ctx.fillRect(vx0,vy0,vx1-vx0,vy1-vy0);
    paperPattern(ctx,p.paper,vx0,vy0,vx1,vy1);
    ensureBg(p);
    drawBoardStyle(ctx,vx0,vy0,vx1,vy1);
    drawGridHint(p,vx0,vy0,vx1,vy1);
    for(const l of p.layers){if(!l.visible)continue;ctx.save();ctx.globalAlpha=l.opacity;
      for(const o of l.objects){const bb=objBB(o);if(bb.x1<vx0||bb.x0>vx1||bb.y1<vy0||bb.y0>vy1)continue;drawObj(ctx,o)}ctx.restore()}
  }else{
    /* İKİ GEÇİŞLİ ÇİZİM — kritik:
       Önce TÜM sayfa zeminleri, sonra TÜM çizimler çizilir. Tek geçişte
       sayfa sınırını aşan bir çizgi, sonraki sayfanın beyaz zemini altında
       kalıp SİLİNMİŞ gibi görünüyordu. İki geçişle mürekkep hep üstte kalır. */
    let visA=-1,visB=-1;const visIdx=[];
    for(let i=0;i<doc.pages.length;i++){
      const pg=doc.pages[i],off=L[i];
      if(off.y>vy1||off.y+pg.h<vy0)continue;
      if(visA<0)visA=i;visB=i;visIdx.push(i);
      ensureBg(pg);                              // görünür sayfa: görseli tembel yükle
      ctx.save();ctx.translate(off.x,off.y);
      ctx.save();ctx.shadowColor='rgba(4,8,25,.5)';ctx.shadowBlur=26/view.s;ctx.shadowOffsetY=6/view.s;
      ctx.fillStyle='#FBF8F0';ctx.fillRect(0,0,pg.w,pg.h);ctx.restore();
      ctx.save();ctx.beginPath();ctx.rect(0,0,pg.w,pg.h);ctx.clip();
      if(pg.bgImg&&pg.bgImg.complete)ctx.drawImage(pg.bgImg,0,0,pg.w,pg.h);
      else if(pg.bg){ // görsel yolda: zarif yüklenme göstergesi (boş sayfa sanılmasın)
        ctx.save();ctx.fillStyle='rgba(17,24,39,.10)';
        ctx.font=(13/Math.max(.4,view.s))+'px Manrope,sans-serif';ctx.textAlign='center';
        ctx.fillText('sayfa yükleniyor…',pg.w/2,pg.h/2);ctx.restore()}
      paperPattern(ctx,pg.paper,0,0,pg.w,pg.h);
      if(i===cur)drawGridHint(pg,0,0,pg.w,pg.h);
      ctx.restore();
      ctx.restore();
    }
    /* 2. geçiş: çizimler — komşu sayfalara taşan mürekkep korunur (kırpılmaz) */
    const drawFrom=(i)=>{
      const pg=doc.pages[i],off=L[i];if(!pg||!off)return;
      ctx.save();ctx.translate(off.x,off.y);
      const lx0=vx0-off.x,ly0=vy0-off.y,lx1=vx1-off.x,ly1=vy1-off.y;
      for(const l of pg.layers){if(!l.visible)continue;ctx.save();ctx.globalAlpha=l.opacity;
        for(const o of l.objects){const bb=objBB(o);if(bb.x1<lx0||bb.x0>lx1||bb.y1<ly0||bb.y0>ly1)continue;drawObj(ctx,o)}ctx.restore()}
      ctx.restore();
    };
    // görünmeyen bir önceki/sonraki sayfadan taşan çizimler de görünsün
    if(visA>0)drawFrom(visA-1);
    for(const i of visIdx)drawFrom(i);
    if(visB>=0&&visB+1<doc.pages.length)drawFrom(visB+1);
    prefetchBgs(visA<0?cur:visA,visB<0?cur:visB); // komşu sayfaları önden ısıt
    evictFarBgs(visA<0?cur:visA,visB<0?cur:visB); // uzak sayfaları bellekten bırak
    // kaydırmayla geçerli sayfayı algıla
    if(!scrollDetectLock&&!drag&&!live){const cy=(r.height*.45-view.y)/view.s;const i=bandAt(cy);
      if(i!==cur){cur=i;selection=[];fixLayer();markPages();renderLayers();updUndoBtns();updCornerPg()}}
  }
  if(selection.length){const off=curOff();ctx.save();ctx.translate(off.x,off.y);drawSelection();ctx.restore()}
}
/* TEMBEL SAYFA GÖRSELİ YÜKLEYİCİ + BELLEK TAHLİYESİ
   200 sayfalık PDF açılırken artık TÜM görseller çözülmez (4+ GB bellek!) —
   yalnız görünür sayfalar (±6 komşu) yüklenir, uzaklaşınca bellekten bırakılır. */
const BGQ={q:[],busy:0,MAX:5};
function ensureBg(p){
  if(!p||!p.bg||p.bgImg||p._bgLoad)return;
  p._bgLoad=true;BGQ.q.unshift(p);pumpBG();      // LIFO: en son görünen ÖNCE yüklenir
}
function bgqReset(){BGQ.q.length=0}              // belge değişince kuyruk temizlenir
function pumpBG(){
  while(BGQ.busy<BGQ.MAX&&BGQ.q.length){
    const p=BGQ.q.shift();
    if(!p._bgLoad)continue;
    BGQ.busy++;
    const im=new Image();
    im.decoding='async';
    im.onload=()=>{if(p._bgLoad)p.bgImg=im;p._bgLoad=false;BGQ.busy--;pumpBG();requestRedraw()};
    im.onerror=()=>{p._bgLoad=false;BGQ.busy--;pumpBG()};
    im.src=p.bg;
  }
}
function prefetchBgs(i0,i1){                     // görünenin ötesini önden ısıt — geç kalma biter
  for(let d=1;d<=4;d++){
    if(doc.pages[i1+d])ensureBg(doc.pages[i1+d]);
    if(doc.pages[i0-d])ensureBg(doc.pages[i0-d]);
  }
}
function evictFarBgs(i0,i1){
  if(doc.pages.length<=30)return;
  for(let i=0;i<doc.pages.length;i++){
    if(i>=i0-12&&i<=i1+12)continue;              // geniş histerezis: gel-git ile boşaltma olmaz
    const p=doc.pages[i];
    if(p.bgImg||p._bgLoad){p.bgImg=null;p._bgLoad=false}
  }
}
let rafPending=false;
function requestRedraw(){if(rafPending)return;rafPending=true;requestAnimationFrame(()=>{rafPending=false;redraw()})}
function drawGridHint(p,x0,y0,x1,y1){
  if(S.snapGrid&&p.paper!=='grid'&&p.paper!=='graph'){ctx.save();ctx.fillStyle='rgba(79,160,180,.18)';const g=S.grid;
    for(let x=Math.ceil(x0/g)*g;x<x1;x+=g)for(let y=Math.ceil(y0/g)*g;y<y1;y+=g)ctx.fillRect(x-.7,y-.7,1.4,1.4);ctx.restore()}}
function drawSelection(){
  const b=selBBox();ctx.save();ctx.strokeStyle='#4FE3C1';ctx.lineWidth=1.4/view.s;ctx.setLineDash([6/view.s,4/view.s]);
  ctx.strokeRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);ctx.setLineDash([]);
  const hs=7/view.s;ctx.fillStyle='#4FE3C1';
  for(const[hx,hy]of[[b.x0,b.y0],[b.x1,b.y0],[b.x0,b.y1],[b.x1,b.y1]])ctx.fillRect(hx-hs/2,hy-hs/2,hs,hs);
  const rc={x:(b.x0+b.x1)/2,y:b.y0-24/view.s};
  ctx.beginPath();ctx.moveTo((b.x0+b.x1)/2,b.y0);ctx.lineTo(rc.x,rc.y);ctx.stroke();
  ctx.beginPath();ctx.arc(rc.x,rc.y,5/view.s,0,7);ctx.fill();
  ctx.restore();
}
function fixLayer(){const p=page();if(!p.layers.find(l=>l.id===curLayerId))curLayerId=p.layers[p.layers.length-1].id}
function updCornerPg(){$('#cornerPg').textContent=(cur+1)+'/'+doc.pages.length;
  const one=doc.pages.length<2;$('#pgPrev').style.display=$('#pgNext').style.display=$('#cornerPg').style.display=$('#pgSep').style.display=one?'none':''}

/* ============================================================
   GİRİŞ — işaretçi olayları (yerel sayfa koordinatı)
============================================================ */
let pointers=new Map(), pinch=null, panning=false, spaceHeld=false, hoverPt=null;
let live=null, drag=null, lineDraft=null, compassDraft=null;
let laserTrail=[], stabPt=null;
/* Aktif çizgiyi BAŞLATAN işaretçinin kimliği — mürekkep hattına yalnız bu işaretçi
   girebilir. Yoksa ikinci bir işaretçi (ör. pen çizerken yerinde duran fare imlecinin
   mikro titremesi, avuç dokunuşu, hover) çizgiye yabancı noktalar enjekte eder ve
   çizgide hayalet düz çizgiler + kaymış seçim kutusu oluşurdu. */
let strokePid=null;

function localPt(e){const g=toDoc(e);const off=curOff();return{x:g.x-off.x,y:g.y-off.y}}
function switchPage(i){if(i===cur)return;commitText();cur=i;selection=[];fixLayer();markPages();renderLayers();updUndoBtns();updCornerPg()}

/* Yetim canlı çizgi sigortası: bitirme olayı herhangi bir sebeple kaybolmuşsa
   (örn. işaretçi kaydı düşmüş, kalkış yutulmuş) canlı çizgiyi olduğu yerde mühürle.
   Yoksa 'live' sonsuza dek açık kalır ve imleci takip eden hayalet çizgiye dönüşür. */
function sealOrphanLive(force){
  if(!live)return;
  if(!force&&strokePid!=null&&pointers.has(strokePid))return;  // çizen işaretçi hâlâ aktif — dokunma
  pointers.delete(strokePid);
  if(live.erasing)commitErase();
  else if(live.type==='stroke'&&live.points&&live.points.length>1)commitStroke();
  else{live=null;drawOverlay()}
  fwLeave();azOut();
}
stage.addEventListener('pointerdown',e=>{
  if(e.target!==cv&&e.target!==ovl&&e.target!==stage)return;
  commitText(); // açık metin kutusu varsa ÖNCE kaydet — yoksa blur'dan önce içerik sıfırlanıp yazı kayboluyordu
  hideMiniBar();
  try{stage.setPointerCapture(e.pointerId)}catch(_){} // bazı sentetik/iptal edilmiş işaretçilerde fırlatır — akışı asla kilitleme
  if(e.button===2){sealOrphanLive(true);rightPress(e);return} // çizim ortasında sağ tık: çizgiyi mühürle, asla askıda bırakma
  sealOrphanLive();
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const[a,b]=[...pointers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:view.s,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,vx:view.x,vy:view.y};live=null;fwLeave();azCancel();drawOverlay();return}
  if(!boardMode()&&!presenting){const g=toDoc(e);switchPage(bandAt(g.y))}
  const pt=localPt(e);
  if(spaceHeld||tool==='pan'||e.button===1){panning={sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y};return}
  if(tool==='laser'){laserOn=true;pushLaser(e);return}
  if(tool==='spot')return;
  if(tool==='select'){startSelect(e,pt);return}
  if(tool==='text'){openTextEditor(pt);return}
  if(tool==='sticker'){stampSticker(pt);return}
  if(tool==='eraser'){live={erasing:true,marks:new Set()};strokePid=e.pointerId;markEraseAt(pt);return}
  if(tool==='solve'){solveDraft={a:pt,b:pt};return}
  if(tool==='line'){lineDraft={a:pt,b:pt};return}
  if(tool==='compass'){compassDraft={c:pt,r:0};return}
  if(layer().locked){toast('Bu katman kilitli 🔒');return}
  const p0=S.pressure?(e.pressure||0.5):0.5;
  stabPt={x:pt.x,y:pt.y};
  live={type:'stroke',tool,color:tool==='hl'?'#FFE066':penColor,size:penSize,
    opacity:(tool==='hl'?Math.min(penOp,.6):penOp)*(typeof pkFlowK==='function'?pkFlowK():1)*(curCP&&curCP.flow!=null?curCP.flow:1),
    pk:(typeof pkPressK==='function'?pkPressK():.8),nib:(typeof pkNibK==='function'?pkNibK():1),
    cp:curCP?{...curCP}:undefined,points:[{x:pt.x,y:pt.y,p:p0}]};
  strokePid=e.pointerId;
  fwEnter();azIn(e); // opsiyonlar: Odaklı Yazım Modu + Otomatik Odak Zoom
});
stage.addEventListener('pointermove',e=>{
  if(rightState){if(ringOpen)ringMove(e);return}
  const info=pointers.get(e.pointerId);if(info){info.x=e.clientX;info.y=e.clientY}
  if(pinch&&pointers.size===2){const[a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);
    const ns=clamp(pinch.s*d/pinch.d,.1,8);const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;const k=ns/pinch.s;const r=stage.getBoundingClientRect();
    view.s=ns;
    view.x=(pinch.cx-r.left)-((pinch.cx-r.left)-pinch.vx)*k+(cx-pinch.cx);
    view.y=(pinch.cy-r.top)-((pinch.cy-r.top)-pinch.vy)*k+(cy-pinch.cy);
    $('#zoomLbl').textContent=Math.round(ns*100)+'%';requestRedraw();return}
  if(panning){view.x=panning.vx+e.clientX-panning.sx;view.y=panning.vy+e.clientY-panning.sy;requestRedraw();return}
  const pt=localPt(e);
  if(laserOn&&tool==='laser'){pushLaser(e);return}
  if(tool==='spot'&&spotOn)moveSpot(e);
  hoverPt=pt;
  if(drag){dragMove(pt,e);return}
  if(solveDraft){solveDraft.b=pt;drawOverlay();return}
  if(lineDraft){lineDraft.b=applyAngleSnap(lineDraft.a,pt,e.shiftKey);drawOverlay();return}
  if(compassDraft){compassDraft.r=dist(compassDraft.c,pt);drawOverlay();return}
  if(live&&live.erasing){if(e.pointerId===strokePid){if(!e.buttons)sealOrphanLive(true);else markEraseAt(pt)}return}
  if(live&&live.points&&tool==='smart'&&!live.cp&&live.points.length>1){
    const a=live.points[live.points.length-2],b=live.points[live.points.length-1];
    const dt=Math.max(1,(b.t??1)-(a.t??0));const vv=dist(a,b)/dt;
    const raw=clamp(0.35+0.65*(1-vv/0.9),0.35,1);
    b.p=(a.p??0.7)*0.6+raw*0.4;
  }
  if(live&&live.type==='stroke'){
    if(e.pointerId!==strokePid)return; // yalnız çizgiyi başlatan işaretçi mürekkep besler
    if(!e.buttons){sealOrphanLive(true);return} // kalkış olayı kaybolmuşsa: mühürle — imleci takip eden hayalet çizgi OLMAZ
    /* Yüksek kalite mürekkep: birleştirilmiş (coalesced) olaylar + hıza duyarlı sabitleyici.
       Yavaş çizerken titremeyi yutar, hızlı çizerken gecikmesiz takip eder (One-Euro yaklaşımı). */
    if(S.edgeScroll){
      /* Kenar oto-kaydırma: rAF ile kare başına TEK tam-çizim — kenarda donma yok */
      const r2=stage.getBoundingClientRect(),M=34,sp=9;let ddx=0,ddy=0;
      if(e.clientX<r2.left+M)ddx=sp;else if(e.clientX>r2.right-M)ddx=-sp;
      if(e.clientY<r2.top+M)ddy=sp;else if(e.clientY>r2.bottom-M)ddy=-sp;
      if(ddx||ddy){ES.dx+=ddx;ES.dy+=ddy;
        if(!ES.raf)ES.raf=requestAnimationFrame(()=>{ES.raf=0;
          if(!ES.dx&&!ES.dy)return;
          view.x+=ES.dx;view.y+=ES.dy;ES.dx=ES.dy=0;
          if(azBase)azCancel();redraw()})}
    }
    inkFeed((e.getCoalescedEvents&&e.getCoalescedEvents().length)?e.getCoalescedEvents():[e]);
    requestLiveDraw(e);
  }
});
/* Canlı çizgi örnekleyici — pointermove ve (144Hz modunda) pointerrawupdate
   aynı hattı besler; nokta-aralığı eşiği yinelenen olayları kendiliğinden eler. */
function inkFeed(evs){
    for(const ce of evs){
      const cp=localPt(ce);
      if(live.cp){
        /* Çark kalemi — İPLİ SABİTLEYİCİ (lazy brush): mürekkep, imleci sabit bir ip
           yarıçapıyla izler. EMA'nın aksine deterministiktir: ne titrer ne donar.
           Yarıçap ekran pikseli cinsindendir → 1080p %125 ölçekte de aynı his. */
        const r=(live.cp.stab*13)/view.s;
        const dx=cp.x-stabPt.x,dy=cp.y-stabPt.y,d=Math.hypot(dx,dy);
        if(d>r){const m=(d-r)/d;stabPt={x:stabPt.x+dx*m,y:stabPt.y+dy*m}}
      }else{
        const spd=dist(stabPt,cp)*view.s;                 // ekran pikseli / olay
        const base=1-S.stab*0.85;
        const k=clamp(base+spd/34,base,1);                // hız arttıkça filtre gevşer → sıfır gecikme
        stabPt={x:stabPt.x+(cp.x-stabPt.x)*k,y:stabPt.y+(cp.y-stabPt.y)*k};
      }
      const p=S.pressure?(ce.pressure||0.5):0.5;
      const lp=live.points.at(-1);
      if(dist(lp,stabPt)>(live.cp?0.45:0.35)/view.s)live.points.push({x:stabPt.x,y:stabPt.y,p,t:performance.now()});
    }
}
/* canlı çizimi kare hızına (rAF) kilitle — pointermove seli overlay'i boğmasın */
let liveRaf=false,liveEv=null;
function requestLiveDraw(e){liveEv=e;if(liveRaf)return;liveRaf=true;
  requestAnimationFrame(()=>{liveRaf=false;if(live&&live.type==='stroke')drawLive(liveEv)})}
stage.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);finishPointer(e)});
stage.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);finishPointer(e)});
function finishPointer(e){
  if(rightState){rightRelease(e);return}
  if(pointers.size<2)pinch=null;
  if(panning){panning=false;return}
  if(laserOn){laserOn=false;return}
  if(drag){endDrag();return}
  if(solveDraft){finishSolve();return}
  if(lineDraft){commitLine();return}
  if(compassDraft){commitCompass();return}
  if(live&&live.erasing){if(e.pointerId===strokePid)commitErase();else if(strokePid==null||!pointers.has(strokePid))sealOrphanLive(true);return}
  if(live&&live.type==='stroke'){
    if(e.pointerId!==strokePid){ // yabancı işaretçinin kalkışı çizgiyi bitiremez…
      if(strokePid==null||!pointers.has(strokePid))sealOrphanLive(true); // …ama çizen işaretçi kayıtlardan düşmüşse çizgiyi mühürler
      return}
    // sabitleyicinin geride bıraktığı ucu tamamla: çizgi tam kalemin kalktığı noktada bitsin
    const pt=localPt(e),p=S.pressure?(e.pressure||0.5):0.5;
    const lp=live.points.at(-1);
    if(lp&&dist(lp,pt)>0.05)live.points.push({x:pt.x,y:pt.y,p,t:performance.now()});
    commitStroke();fwLeave();azOut();return}
}
function drawLive(e){
  drawOverlay();
  const off=curOff();
  octx.save();octx.setTransform(DPR*view.s,0,0,DPR*view.s,Math.round(DPR*(view.x+off.x*view.s)),Math.round(DPR*(view.y+off.y*view.s)));
  drawStroke(octx,live);
  if(S.proPens&&live.points.length>1&&['smart','ball','fountain','hl'].includes(live.tool)){
    /* PRO İMZA: canlı uç ışıltısı — yalnız çizim ANINDA görünür, kayda girmez */
    const tip=live.points.at(-1);
    const nw=(live.nib??1)===2?1.18:1;   // NW drawStroke'a yerel; burada aynı formül
    const R=Math.max(8,live.size*nw*3.2);
    const g2=octx.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,R);
    const col=(live.color&&live.color[0]==='#'&&live.color.length===7)?live.color:'#111827';
    g2.addColorStop(0,col+'55');g2.addColorStop(.45,col+'22');g2.addColorStop(1,col+'00');
    octx.save();
    octx.fillStyle=g2;octx.beginPath();octx.arc(tip.x,tip.y,R,0,7);octx.fill();
    octx.fillStyle='rgba(255,255,255,.8)';octx.beginPath();octx.arc(tip.x,tip.y,Math.max(.8,live.size*nw*.18),0,7);octx.fill();
    octx.restore();
  }
  if(live.cp){
    /* Çark kalemi — YETİŞME KUYRUĞU: tarayıcının gürültülü tahmin olayları yerine
       son mürekkep noktasından GERÇEK imlece giden sönümlü düz kuyruk çizilir.
       İpin geride bıraktığı boşluğu doldurur: gecikme hissi yok, atlama yok.
       Kuyruk uzunluğu kalemin Prediction (ms) değeriyle sınırlıdır. */
    if(live.cp.predict>0&&e&&live.points.length){
      const d=localPt(e),lp=live.points.at(-1),dd=dist(lp,d);
      if(dd>0.5/view.s){
        const maxL=clamp(live.cp.predict,6,24)/view.s;
        const t=dd>maxL?maxL/dd:1;
        const tail={...live,opacity:(live.opacity??1)*.8,
          points:[lp,{x:lp.x+(d.x-lp.x)*t,y:lp.y+(d.y-lp.y)*t,p:(lp.p??.6)*.85}]};
        drawStroke(octx,tail);
      }
    }
  }else if(S.predict&&e&&e.getPredictedEvents){
    const pe=e.getPredictedEvents();
    if(pe.length){const q=pe[0],d=localPt(q);
      const tail={...live,points:[live.points.at(-1),{x:d.x,y:d.y,p:q.pressure||.5}]};drawStroke(octx,tail)}
  }
  octx.restore();
}
function commitStroke(){
  let o=live;live=null;
  if(o.points.length<2){drawOverlay();return}
  const cp=o.cp;delete o.cp; // çark kalemi parametreleri — stroke'a serileştirilmez
  const passes=cp?clamp(Math.round(cp.smoothing*1.6+cp.streamline*1.2),1,3):Math.round(S.smooth*2)+(o.tool==='smart'?1:0);
  for(let n=0;n<passes;n++){const np=[o.points[0]];for(let i=0;i<o.points.length-1;i++){const a=o.points[i],b=o.points[i+1];
    np.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25,p:a.p},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75,p:b.p})}np.push(o.points.at(-1));o.points=np}
  if(o.tool==='hl'&&S.snapHl)o=snapStraighten(o);
  else if(cp){o=cpInk(o,cp);
    /* Render efekt tanımlayıcısı — serileştirilebilir, deterministik (seed'li) */
    const fx={};
    if(cp.blend)fx.b=cp.blend;
    if(cp.tx)fx.t=cp.tx; if(cp.gr)fx.g=cp.gr; if(cp.ns)fx.n=cp.ns; if(cp.wet)fx.w=cp.wet;
    if(cp.spray)fx.s={r:cp.sprayR||18,d:clamp(cp.sprayD||.7,.05,1),sp:Math.max(.005,cp.sp||.01)};
    if(Object.keys(fx).length){fx.sd=(Math.random()*0x7fffffff)|0;o.fx=fx}
  }                 // Çark kalemi: basınç+hız karışımı, uç inceltme
  else if(o.tool==='smart'){
    /* Şekil düzelt AÇIKSA akıllı kalemde de çalışır — önceden matisInk zinciri
       şekil tanımayı yutuyordu, akıllı kalemle çizilen kare/daire hiç düzelmiyordu. */
    const f=S.shapeFix?recognizeShape(o):null;
    o=f||matisInk(o)}   // Matis Akilli Kalem: hiz -> basinc, dogal murekkep
  else if(o.tool!=='hl'&&S.shapeFix){const f=recognizeShape(o);if(f)o=f}
  snapshot();layer().objects.push(o);dnaRecord(o);redraw();drawOverlay();
}
/* Çark kalemleri mürekkep motoru: her kalemin kendi Pressure/Velocity karışımı.
   Yavaş çizim → kalın (velocity), sert bastırma → kalın (pressure);
   EMA yumuşatması kalemin smoothing'ine bağlı, uçlar taperS/taperE piksel boyunca incelir. */
function cpInk(o,cp){
  const EG=ENGINE_DEFAULTS,pts=o.points,n=pts.length;
  if(n<3){pts.forEach(p=>p.p=.62);return o}
  const v=new Array(n).fill(0);
  for(let i=1;i<n;i++){const dt=Math.max(1,(pts[i].t??i)-(pts[i-1].t??(i-1)));v[i]=dist(pts[i-1],pts[i])/dt}
  v[0]=v[1];
  for(let k=0;k<2;k++)for(let i=1;i<n;i++)v[i]=v[i-1]*.4+v[i]*.6; // oneEuro tarzı hız süzgeci
  const sorted=[...v].sort((a,b)=>a-b);
  const vRef=Math.max(sorted[Math.floor(sorted.length*.9)],.02);
  const flat=pts.every(p=>Math.abs((p.p??.5)-.5)<.03);        // fare/parmak: gerçek basınç yok
  const amp=cp.thin!=null?(.25+1.15*cp.thin):1;               // thinning: kalınlık oynama genliği
  const crv=(x,g)=>{const d=x-.5;return .5+Math.sign(d)*Math.pow(Math.abs(d)*2,g)/2}; // simetrik gamma
  const inertia=clamp(.35+cp.smoothing*.4,.35,.8);
  let ema=.62;
  for(let i=0;i<n;i++){
    const vf=Math.pow(clamp(1-v[i]/vRef,0,1),EG.velocityCurve);// velocityCurve: yavaş=1 kalın, hızlı=0 ince
    let pf=clamp(pts[i].p??.5,0,1);
    if(flat&&cp.simP)pf=vf;                                   // simulatePressure: hızdan basınç sentezi
    pf=crv(pf,EG.pressureCurve);                              // pressureCurve tepki eğrisi
    let w=.62 + amp*(cp.velocity*(vf-.5)*.9 + cp.pressure*(pf-.5)*1.1);
    if(cp.wet)w+=cp.wet*.22*vf;                               // wetness: yavaşta mürekkep birikir
    if(cp.rot==='angle'&&i>0){const a=Math.atan2(pts[i].y-pts[i-1].y,pts[i].x-pts[i-1].x);
      w*=.42+.58*Math.abs(Math.sin(a-Math.PI/4))}             // kaligrafi: 45° keski ucu
    w=clamp(w,.24,1.45);
    ema=ema*inertia+w*(1-inertia);
    pts[i].p=ema;
  }
  if(cp.taperS>0){let acc=0;for(let i=0;i<n-1;i++){pts[i].p*=clamp(acc/cp.taperS,.12,1);acc+=dist(pts[i],pts[i+1]);if(acc>=cp.taperS)break}}
  if(cp.taperE>0){let acc=0;for(let i=n-1;i>0;i--){pts[i].p*=clamp(acc/cp.taperE,.12,1);acc+=dist(pts[i],pts[i-1]);if(acc>=cp.taperE)break}}
  return o;
}
/* Matis Akilli Kalem: yavas cizgide murekkep dolgun, hizlanınca incelir.
   Taban 0.35 (Matis varsayilani). Hizlar 90. yuzdelige gore olceklenir,
   EMA ile yumusatilir, cizgi uclari dogal kalem kalkisi gibi inceltilir. */
function matisInk(o){
  const pts=o.points, n=pts.length;
  if(n<3){pts.forEach(p=>p.p=.62);return o}
  const BASE=0.35;
  const v=new Array(n).fill(0);
  for(let i=1;i<n;i++){
    const dt=Math.max(1,(pts[i].t??i)-(pts[i-1].t??(i-1)));
    v[i]=dist(pts[i-1],pts[i])/dt;
  }
  v[0]=v[1];
  const sorted=[...v].sort((a,b)=>a-b);
  const vRef=Math.max(sorted[Math.floor(sorted.length*0.9)],0.02);
  let ema=0.7;
  for(let i=0;i<n;i++){
    const raw=clamp(BASE+(1-BASE)*(1-v[i]/vRef),BASE,1);
    ema=ema*0.55+raw*0.45;
    pts[i].p=ema;
  }
  const tip=Math.min(4,Math.floor(n/3));
  for(let k=0;k<tip;k++){
    const f=0.45+0.55*(k/tip);
    pts[k].p*=f; pts[n-1-k].p*=f;
  }
  return o;
}
function snapStraighten(o){
  const a=o.points[0],b=o.points.at(-1);let len=0;for(let i=1;i<o.points.length;i++)len+=dist(o.points[i-1],o.points[i]);
  if(dist(a,b)/Math.max(len,1)>.90){let ang=Math.atan2(b.y-a.y,b.x-a.x);const deg=ang*180/Math.PI;
    for(const t of[0,45,90,135,180,-45,-90,-135,-180])if(Math.abs(deg-t)<6){ang=t*Math.PI/180;break}
    const L=dist(a,b);o.points=[a,{x:a.x+Math.cos(ang)*L,y:a.y+Math.sin(ang)*L,p:.5}];o.straight=true}
  return o;
}
function rdp(pts,eps){if(pts.length<3)return pts;let dm=0,idx=0;const a=pts[0],b=pts.at(-1);
  for(let i=1;i<pts.length-1;i++){const p=pts[i];const t=Math.abs((b.y-a.y)*p.x-(b.x-a.x)*p.y+b.x*a.y-b.y*a.x)/Math.max(dist(a,b),.001);if(t>dm){dm=t;idx=i}}
  if(dm>eps){const l=rdp(pts.slice(0,idx+1),eps),r=rdp(pts.slice(idx),eps);return l.slice(0,-1).concat(r)}return[a,b]}
function recognizeShape(o){
  const pts=o.points,b=bboxOf(o),W=b.x1-b.x0,H=b.y1-b.y0,diag=Math.hypot(W,H);
  if(diag<24)return null;
  const closed=dist(pts[0],pts.at(-1))<diag*.22;
  const simp=rdp(pts,diag*.045);
  const mk=p=>({...p,p:.5});
  if(!closed&&simp.length<=2)return{...o,straight:true,points:[mk(pts[0]),mk(pts.at(-1))]};
  if(closed){
    const cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2;let mr=0;for(const p of pts)mr+=Math.hypot(p.x-cx,p.y-cy);mr/=pts.length;
    let varr=0;for(const p of pts)varr+=Math.abs(Math.hypot(p.x-cx,p.y-cy)-mr);varr/=pts.length;
    /* DİKDÖRTGEN ↔ ELİPS AYRIMI: yarıçap sapması dikdörtgende de düşük çıkar,
       bu yüzden tek başına güvenilmez (elle çizilen kareler elipse dönüşüyordu).
       Ayırt edici ölçü, kapalı alanın bbox alanına oranıdır (shoelace):
       dörtgen ~0.95 · elips ~0.785 · üçgen ~0.5. Önce köşe sayısı + doluluk. */
    let area=0;for(let i2=0;i2<pts.length-1;i2++)area+=pts[i2].x*pts[i2+1].y-pts[i2+1].x*pts[i2].y;
    const fill=Math.abs(area/2)/Math.max(1,W*H);
    const corners=simp.length-1;
    if(corners===3&&fill<.72)return{...o,straight:true,points:[...simp.slice(0,3).map(mk),mk(simp[0])]};
    if(corners===4||corners===5||fill>.86)return{...o,straight:true,points:[{x:b.x0,y:b.y0,p:.5},{x:b.x1,y:b.y0,p:.5},{x:b.x1,y:b.y1,p:.5},{x:b.x0,y:b.y1,p:.5},{x:b.x0,y:b.y0,p:.5}]};
    if(varr/mr<.16&&fill<.86){const np=[];for(let a2=0;a2<=64;a2++){const t=a2/64*Math.PI*2;np.push({x:cx+Math.cos(t)*W/2,y:cy+Math.sin(t)*H/2,p:.5})}return{...o,straight:true,points:np}}
  }
  return null;
}
function applyAngleSnap(a,b,force){
  if(!S.angleSnap&&!force)return b;
  const ang=Math.atan2(b.y-a.y,b.x-a.x),L=dist(a,b);
  const sn=Math.round(ang/(Math.PI/12))*(Math.PI/12);
  return{x:a.x+Math.cos(sn)*L,y:a.y+Math.sin(sn)*L};
}
function commitLine(){const d=lineDraft;lineDraft=null;if(dist(d.a,d.b)<3){drawOverlay();return}
  snapshot();layer().objects.push({type:'stroke',tool:'ball',straight:true,color:penColor,size:penSize,opacity:penOp,points:[{...d.a,p:.5},{...d.b,p:.5}]});redraw();drawOverlay()}
function commitCompass(){const d=compassDraft;compassDraft=null;if(!d||d.r<4){drawOverlay();return}
  const np=[];for(let a=0;a<=72;a++){const t=a/72*Math.PI*2;np.push({x:d.c.x+Math.cos(t)*d.r,y:d.c.y+Math.sin(t)*d.r,p:.5})}
  snapshot();layer().objects.push({type:'stroke',tool:'ball',straight:true,color:penColor,size:penSize,opacity:penOp,points:np});redraw();drawOverlay()}

/* Matis silgisi: surukledikce degdiklerin SILINECEK diye isaretlenir (soluklasir),
   parmagini kaldirinca hepsi tek hamlede silinir — tek Ctrl+Z ile tumu geri gelir.
   Resimler ve kilitli katmanlar korunur. */
function markEraseAt(pt){
  if(!live||!live.marks)return;
  const rad=Math.max(8,penSize*2);let hitAny=false;
  for(const l of page().layers){if(l.locked||!l.visible)continue;
    for(const o of l.objects){
      if(o._mk||!eraserAllowed(o))continue;
      if(hitTest(o,pt,rad)){o._mk=true;live.marks.add(o);hitAny=true}
    }}
  if(hitAny)redraw();
}
function commitErase(){
  const marks=live&&live.marks?live.marks:null;live=null;
  if(!marks||!marks.size){redraw();return}
  marks.forEach(o=>{delete o._mk});      // undo gorüntusu temiz kalsin
  snapshot();                            // jest basina tek geri-al adimi
  for(const l of page().layers)l.objects=l.objects.filter(o=>!marks.has(o));
  redraw();
  toast(marks.size+' öge silindi — Ctrl+Z ile geri al');
}
function eraserAllowed(o){
  if(o.type==='stroke')return o.tool==='hl'?eraserTypes.hl:eraserTypes.stroke;
  if(o.type==='text')return eraserTypes.text;
  if(o.type==='image')return eraserTypes.image;
  return true;
}
function hitTest(o,pt,rad){
  if(o.type==='stroke'){for(let i=1;i<o.points.length;i++)if(segDist(pt,o.points[i-1],o.points[i])<rad+o.size/2)return true;
    if(o.points.length===1)return dist(pt,o.points[0])<rad+o.size/2;return false}
  const b=bboxOf(o);return pt.x>=b.x0-rad&&pt.x<=b.x1+rad&&pt.y>=b.y0-rad&&pt.y<=b.y1+rad;
}
function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y;const L=dx*dx+dy*dy;if(!L)return dist(p,a);
  let t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/L,0,1);return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy))}

/* ============================================================
   SEÇİM
============================================================ */
function topHit(pt){const p=page();
  for(let li=p.layers.length-1;li>=0;li--){const l=p.layers[li];if(!l.visible||l.locked)continue;
    for(let oi=l.objects.length-1;oi>=0;oi--){if(hitTest(l.objects[oi],pt,6/view.s))return l.objects[oi]}}
  return null}
function startSelect(e,pt){
  if(selection.length){
    const b=selBBox(),hs=10/view.s;
    const corners=[{x:b.x0,y:b.y0},{x:b.x1,y:b.y0},{x:b.x0,y:b.y1},{x:b.x1,y:b.y1}];
    for(const c of corners)if(dist(pt,c)<hs){drag={type:'scale',b,fix:{x:b.x0+b.x1-c.x,y:b.y0+b.y1-c.y}};snapshot();return}
    const rc={x:(b.x0+b.x1)/2,y:b.y0-24/view.s};
    if(dist(pt,rc)<10/view.s){drag={type:'rotate',cx:(b.x0+b.x1)/2,cy:(b.y0+b.y1)/2,start:Math.atan2(pt.y-(b.y0+b.y1)/2,pt.x-(b.x0+b.x1)/2)};snapshot();return}
  }
  if(selection.length){const b=selBBox();
    if(pt.x>=b.x0&&pt.x<=b.x1&&pt.y>=b.y0&&pt.y<=b.y1){
      const inHit=topHit(pt);
      if(inHit&&inHit.type==='text'&&selection.includes(inHit)&&e.detail===2){editTextObj(inHit);return}
      if(inHit&&!selection.includes(inHit)&&!e.shiftKey){selection=[inHit]}
      else if(inHit&&e.shiftKey&&!selection.includes(inHit))selection.push(inHit);
      drag={type:'move',last:pt,moved:false};snapshot();redraw();renderSelInfo();return}}
  const hit=topHit(pt);
  if(hit){
    if(hit.type==='text'&&selection.includes(hit)&&e.detail===2){editTextObj(hit);return}
    if(e.shiftKey){selection.includes(hit)?selection=selection.filter(o=>o!==hit):selection.push(hit)}
    else if(!selection.includes(hit))selection=[hit];
    drag={type:'move',last:pt,moved:false};snapshot();
  }else{selection=[];drag={type:'marquee',a:pt,b:pt}}
  redraw();renderSelInfo();
}
function dragMove(pt,e){
  if(drag.type==='prot'){protractor.x=pt.x-drag.off.x;protractor.y=pt.y-drag.off.y;drawOverlay();return}
  if(drag.type==='move'){
    let dx=pt.x-drag.last.x,dy=pt.y-drag.last.y;drag.moved=true;
    selection.forEach(o=>transformObj(o,(x,y)=>({x:x+dx,y:y+dy}),1));
    let guides=[];const b=selBBox(),p=page();
    if(S.snapGrid){const g=S.grid;const sx=Math.round(b.x0/g)*g-b.x0,sy=Math.round(b.y0/g)*g-b.y0;
      if(Math.abs(sx)<6/view.s||Math.abs(sy)<6/view.s){selection.forEach(o=>transformObj(o,(x,y)=>({x:x+(Math.abs(sx)<6/view.s?sx:0),y:y+(Math.abs(sy)<6/view.s?sy:0)}),1))}}
    if(S.guides&&!p.infinite){const c={x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2},tol=6/view.s;
      if(Math.abs(c.x-p.w/2)<tol){const d=p.w/2-c.x;selection.forEach(o=>transformObj(o,(x,y)=>({x:x+d,y}),1));guides.push({v:p.w/2})}
      if(Math.abs(c.y-p.h/2)<tol){const d=p.h/2-c.y;selection.forEach(o=>transformObj(o,(x,y)=>({x,y:y+d}),1));guides.push({h:p.h/2})}}
    if(S.smartSnap){
      /* Akıllı Snap (opsiyon): sayfa ortası + diğer nesnelerin/metinlerin kenar ve merkezlerine
         hafif mıknatıslanma. En yakın aday kazanır, hizalanınca kılavuz çizgi belirir. */
      const b2=selBBox(),tol=6/view.s;let bx=null,by=null,gv=null,gh=null;
      const cX=[],cY=[];if(!p.infinite){cX.push(p.w/2);cY.push(p.h/2)}
      let cnt=0;
      outer:for(const l of p.layers){if(!l.visible)continue;
        for(const o of l.objects){if(selection.includes(o))continue;if(++cnt>350)break outer;
          const ob=objBB(o);cX.push(ob.x0,(ob.x0+ob.x1)/2,ob.x1);cY.push(ob.y0,(ob.y0+ob.y1)/2,ob.y1)}}
      const mX=[b2.x0,(b2.x0+b2.x1)/2,b2.x1],mY=[b2.y0,(b2.y0+b2.y1)/2,b2.y1];
      for(const c2 of cX)for(const m of mX){const d=c2-m;if(Math.abs(d)<tol&&(bx===null||Math.abs(d)<Math.abs(bx))){bx=d;gv=c2}}
      for(const c2 of cY)for(const m of mY){const d=c2-m;if(Math.abs(d)<tol&&(by===null||Math.abs(d)<Math.abs(by))){by=d;gh=c2}}
      if(bx!==null||by!==null){selection.forEach(o=>transformObj(o,(x,y)=>({x:x+(bx||0),y:y+(by||0)}),1));
        if(gv!==null)guides.push({v:gv});if(gh!==null)guides.push({h:gh})}}
    drag.last=pt;drag.guides=guides;redraw();drawOverlay();renderSelInfo();return}
  if(drag.type==='scale'){
    const b=drag.b,fx=drag.fix;
    const k=clamp(Math.hypot(pt.x-fx.x,pt.y-fx.y)/Math.hypot(b.x1-b.x0,b.y1-b.y0),.05,20);
    const kk=k/(drag.k||1);drag.k=k;
    selection.forEach(o=>transformObj(o,(x,y)=>({x:fx.x+(x-fx.x)*kk,y:fx.y+(y-fx.y)*kk}),kk));
    redraw();renderSelInfo();return}
  if(drag.type==='rotate'){
    const a=Math.atan2(pt.y-drag.cy,pt.x-drag.cx),da=a-drag.start;drag.start=a;
    selection.forEach(o=>rotateObj(o,drag.cx,drag.cy,da));redraw();return}
  if(drag.type==='marquee'){drag.b=pt;drawOverlay();return}
}
function endDrag(){
  if(drag.type==='marquee'){const a=drag.a,b=drag.b;const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);
    if(x1-x0>4||y1-y0>4){selection=[];for(const l of page().layers){if(!l.visible||l.locked)continue;
      for(const o of l.objects){const ob=bboxOf(o);if(ob.x0>=x0&&ob.x1<=x1&&ob.y0>=y0&&ob.y1<=y1)selection.push(o)}}}
  }
  if(drag.type==='move'&&!drag.moved){const p=page();if(p._undo.length){p._undo.pop();updUndoBtns()}}
  drag=null;redraw();drawOverlay();renderSelInfo();
}
function deleteSelection(){if(!selection.length)return;snapshot();
  for(const l of page().layers)l.objects=l.objects.filter(o=>!selection.includes(o));
  selection=[];redraw();renderSelInfo()}
function groupSelection(){if(selection.length<2)return;snapshot();
  const g={type:'group',children:[...selection],opacity:1};
  for(const l of page().layers)l.objects=l.objects.filter(o=>!selection.includes(o));
  layer().objects.push(g);selection=[g];redraw();renderSelInfo();toast('Nesneler gruplandı')}
function duplicateSelection(){if(!selection.length)return;snapshot();
  const copies=selection.map(o=>{const c=JSON.parse(JSON.stringify(o));hydrate(c);transformObj(c,(x,y)=>({x:x+24,y:y+24}),1);return c});
  layer().objects.push(...copies);selection=copies;redraw()}
function alignSelection(mode){if(!selection.length)return;const p=page();if(boardMode())return toast('Hizalama sayfa modunda çalışır');
  snapshot();const b=selBBox();let dx=0,dy=0;
  if(mode==='l')dx=-b.x0+40;if(mode==='r')dx=p.w-40-b.x1;if(mode==='cx')dx=p.w/2-(b.x0+b.x1)/2;
  if(mode==='t')dy=-b.y0+40;if(mode==='b')dy=p.h-40-b.y1;if(mode==='cy')dy=p.h/2-(b.y0+b.y1)/2;
  selection.forEach(o=>transformObj(o,(x,y)=>({x:x+dx,y:y+dy}),1));redraw();renderSelInfo()}
function renderSelInfo(){const el=$('#selInfo');if(!el)return;if(!selection.length){el.innerHTML='Seçili nesne yok.<br>Seçim aracıyla (V) tıkla veya alan çiz.';return}
  const b=selBBox();el.innerHTML=`<b style="color:var(--tx)">${selection.length} nesne seçili</b><br>Konum: ${Math.round(b.x0)}, ${Math.round(b.y0)}<br>Boyut: ${Math.round(b.x1-b.x0)} × ${Math.round(b.y1-b.y0)} px`}

/* ============================================================
   ÜSTKATMAN — kılavuz, HUD, iletki, lazer, spot, tekerlek
============================================================ */
function drawOverlay(){
  octx.setTransform(DPR,0,0,DPR,0,0);octx.clearRect(0,0,ovl.width,ovl.height);
  const off=curOff();
  octx.setTransform(DPR*view.s,0,0,DPR*view.s,Math.round(DPR*(view.x+off.x*view.s)),Math.round(DPR*(view.y+off.y*view.s)));
  if(drag&&drag.type==='marquee'){octx.strokeStyle='#4FE3C1';octx.setLineDash([5/view.s,4/view.s]);octx.lineWidth=1/view.s;
    octx.strokeRect(drag.a.x,drag.a.y,drag.b.x-drag.a.x,drag.b.y-drag.a.y);octx.setLineDash([])}
  if(drag&&drag.guides)for(const g of drag.guides){octx.strokeStyle='#FF5DAB';octx.lineWidth=1/view.s;octx.beginPath();
    if(g.v!==undefined){octx.moveTo(g.v,-1e4);octx.lineTo(g.v,1e4)}else{octx.moveTo(-1e4,g.h);octx.lineTo(1e4,g.h)}octx.stroke()}
  if(solveDraft){const{a,b}=solveDraft;const x0=Math.min(a.x,b.x),y0=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
    octx.save();octx.fillStyle='rgba(132,94,247,.08)';octx.fillRect(x0,y0,w,h);
    octx.strokeStyle='#845EF7';octx.lineWidth=2/view.s;octx.setLineDash([7/view.s,5/view.s]);
    octx.strokeRect(x0,y0,w,h);octx.setLineDash([]);octx.restore();
    if(w>40)hudLabel(x0+w/2,y0-16/view.s,'Soru alanı — bırakınca taşınır')}
  if(lineDraft){const{a,b}=lineDraft;octx.strokeStyle=penColor;octx.lineWidth=penSize;octx.lineCap='round';
    octx.beginPath();octx.moveTo(a.x,a.y);octx.lineTo(b.x,b.y);octx.stroke();
    const L=dist(a,b),ang=(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+360)%360;
    hudLabel((a.x+b.x)/2,(a.y+b.y)/2-18/view.s,`${(L/37.8).toFixed(1)} cm · ${ang.toFixed(1)}°`)}
  if(compassDraft&&compassDraft.r>2){const d=compassDraft;octx.strokeStyle=penColor;octx.lineWidth=penSize;
    octx.beginPath();octx.arc(d.c.x,d.c.y,d.r,0,7);octx.stroke();
    octx.setLineDash([4/view.s,4/view.s]);octx.lineWidth=1/view.s;octx.beginPath();octx.moveTo(d.c.x,d.c.y);
    octx.lineTo(d.c.x+d.r,d.c.y);octx.stroke();octx.setLineDash([]);
    hudLabel(d.c.x,d.c.y-d.r-16/view.s,`r = ${(d.r/37.8).toFixed(1)} cm`)}
}
function hudLabel(x,y,txt){octx.save();octx.font=`700 ${12/view.s}px Manrope`;const w=octx.measureText(txt).width+14/view.s;
  octx.fillStyle='rgba(20,26,58,.92)';roundRect(octx,x-w/2,y-10/view.s,w,20/view.s,6/view.s);octx.fill();
  octx.fillStyle='#EAEDFF';octx.textAlign='center';octx.textBaseline='middle';octx.fillText(txt,x,y+.5/view.s);octx.restore()}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function hitProt(pt){return protractor&&dist(pt,protractor)<170}
function drawProtractor(){
  const{x,y}=protractor,R=160;octx.save();
  octx.fillStyle='rgba(79,227,193,.10)';octx.strokeStyle='rgba(79,227,193,.9)';octx.lineWidth=1.5/view.s;
  octx.beginPath();octx.arc(x,y,R,Math.PI,0);octx.closePath();octx.fill();octx.stroke();
  octx.fillStyle='rgba(20,60,52,.9)';octx.font=`700 11px Manrope`;octx.textAlign='center';
  for(let a=0;a<=180;a+=10){const t=Math.PI-a*Math.PI/180;const long=a%30===0;
    octx.beginPath();octx.moveTo(x+Math.cos(t)*(R-(long?18:9)),y+Math.sin(t)*-(R-(long?18:9)));
    octx.lineTo(x+Math.cos(t)*R,y+Math.sin(t)*-R);octx.stroke();
    if(long)octx.fillText(a,x+Math.cos(t)*(R-30),y-Math.sin(t)*(R-30)+4)}
  octx.beginPath();octx.arc(x,y,3.5,0,7);octx.fill();octx.restore();
}
function pushLaser(e){const r=stage.getBoundingClientRect();laserTrail.push({x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()})}
function laserLoop(){
  const now=performance.now();laserTrail=laserTrail.filter(p=>now-p.t<550);
  if(laserTrail.length){
    drawOverlay();
    octx.setTransform(DPR,0,0,DPR,0,0);octx.save();octx.lineCap='round';octx.lineJoin='round';
    for(let i=1;i<laserTrail.length;i++){const a=laserTrail[i-1],b=laserTrail[i];const age=(now-b.t)/550;
      octx.strokeStyle=S.laser;octx.globalAlpha=(1-age)*.85;octx.lineWidth=7*(1-age)+2;octx.shadowColor=S.laser;octx.shadowBlur=14;
      octx.beginPath();octx.moveTo(a.x,a.y);octx.lineTo(b.x,b.y);octx.stroke()}
    const lp=laserTrail.at(-1);
    if(lp&&now-lp.t<80){octx.globalAlpha=1;octx.fillStyle='#fff';octx.shadowColor=S.laser;octx.shadowBlur=22;octx.beginPath();octx.arc(lp.x,lp.y,5,0,7);octx.fill();
      octx.fillStyle=S.laser;octx.globalAlpha=.45;octx.beginPath();octx.arc(lp.x,lp.y,9,0,7);octx.fill()}
    octx.restore();
  }
  requestAnimationFrame(laserLoop);
}
const spot=$('#spot');
function moveSpot(e){const r=stage.getBoundingClientRect();
  spot.style.background=`radial-gradient(circle ${S.spot}px at ${e.clientX-r.left}px ${e.clientY-r.top}px, transparent 0, transparent ${S.spot-2}px, rgba(6,9,24,.86) ${S.spot+26}px)`}
function toggleSpot(on){spotOn=on??!spotOn;spot.style.display=spotOn?'block':'none';
  if(spotOn){const r=stage.getBoundingClientRect();spot.style.background=`radial-gradient(circle ${S.spot}px at ${r.width/2}px ${r.height/2}px, transparent 0, transparent ${S.spot-2}px, rgba(6,9,24,.86) ${S.spot+26}px)`}
  markRail()}
stage.addEventListener('pointermove',e=>{if(spotOn)moveSpot(e);if(presenting)armFade()});

/* tekerlek: normalde kaydır · Ctrl ile yakınlaş · sunumda sayfa çevir */
let wheelAcc=0,wheelLock=0;
stage.addEventListener('wheel',e=>{
  e.preventDefault();
  if(spotOn&&!e.ctrlKey){S.spot=clamp(S.spot-Math.sign(e.deltaY)*14,60,420);moveSpot(e);return}
  if(e.ctrlKey){const r=stage.getBoundingClientRect();setZoom(view.s*(e.deltaY<0?1.09:1/1.09),e.clientX-r.left,e.clientY-r.top);return}
  if(presenting&&S.wheelPage&&doc.pages.length>1){
    const now=performance.now();if(now<wheelLock)return;
    wheelAcc+=e.deltaY;
    if(Math.abs(wheelAcc)>80){gotoPage(cur+(wheelAcc>0?1:-1));wheelAcc=0;wheelLock=now+380}
    return;
  }
  view.x-=e.shiftKey?e.deltaY:e.deltaX;view.y-=e.shiftKey?0:e.deltaY;requestRedraw();
},{passive:false});

/* ============================================================
   METİN, ÇIKARTMA, GRAFİK
============================================================ */
const textEdit=$('#textEdit');let editingObj=null,textPos=null,textOpenT=0;
function openTextEditor(pt,obj){
  editingObj=obj||null;textPos=pt;textOpenT=performance.now();
  const off=curOff();
  const size=obj?obj.size:DEF.text;
  textEdit.value=obj?obj.text:'';
  textEdit.style.display='block';
  textEdit.style.left=((pt.x+off.x)*view.s+view.x)+'px';
  textEdit.style.top=((pt.y+off.y)*view.s+view.y-4)+'px';
  textEdit.style.font=textFontCSS(size,view.s);
  textEdit.style.color=obj?obj.color:penColor;
  textEdit.style.width='260px';textEdit.style.height=(size*view.s*1.6)+'px';
  setTimeout(()=>textEdit.focus(),0);
}
textEdit.addEventListener('input',()=>{textEdit.style.height='auto';textEdit.style.height=textEdit.scrollHeight+'px'});
function commitText(){
  if(textEdit.style.display==='none'||textEdit.style.display==='')return;
  const val=textEdit.value.trim();textEdit.style.display='none';
  if(editingObj){snapshot();if(val){editingObj.text=textEdit.value;editingObj._bb=null}else{for(const l of page().layers)l.objects=l.objects.filter(o=>o!==editingObj)}editingObj=null}
  else if(val){snapshot();layer().objects.push({type:'text',x:textPos.x,y:textPos.y,text:textEdit.value,size:DEF.text,color:penColor,opacity:penOp})}
  if(val)memStore(val);memHide();
  redraw();
}
textEdit.addEventListener('keydown',e=>{if(e.key==='Escape'){textEdit.style.display='none';editingObj=null}if(e.key==='Enter'&&e.ctrlKey)commitText();e.stopPropagation()});
textEdit.addEventListener('blur',()=>{
  if(performance.now()-textOpenT<250){setTimeout(()=>{if(textEdit.style.display==='block')textEdit.focus()},0);return}
  commitText()});
function editTextObj(o){openTextEditor({x:o.x,y:o.y},o)}
function stampSticker(pt){
  if(!activeSticker)return toast('Önce panelden bir çıkartma seç');
  snapshot();
  if(activeSticker.emoji)layer().objects.push({type:'text',x:pt.x-28,y:pt.y-28,text:activeSticker.emoji,size:56,color:'#000',opacity:1});
  else{const im=new Image();im.src=activeSticker.src;const o={type:'image',x:pt.x-60,y:pt.y-60,w:120,h:120,rot:0,src:activeSticker.src,_img:im,opacity:1};im.onload=()=>{o.h=120*im.height/im.width;redraw()};layer().objects.push(o)}
  redraw();
}
/* ---------- çift tıkla metin düzenle ---------- */
stage.addEventListener('dblclick',e=>{
  /* Çift tık YALNIZCA mevcut bir metni düzenler.
     Boş alana çift tık hiçbir şey yapmaz: ne metin kutusu açar, ne kalem değiştirir
     (hızlı yazarken istem dışı Fosforlu'ya geçiş sorunu bu yüzden kaldırıldı). */
  const pt=localPt(e);const hit=topHit(pt);
  if(hit&&hit.type==='text')editTextObj(hit);
});

/* ============================================================
   ŞEKİL KÜTÜPHANESİ — matematiksel şekiller & figürler
============================================================ */
function cPts(cx,cy,rx,ry,t0=0,t1=Math.PI*2,n=48){const a=[];for(let i=0;i<=n;i++){const t=t0+(t1-t0)*i/n;a.push([cx+Math.cos(t)*rx,cy+Math.sin(t)*ry])}return a}
function nPoly(n,rot=-Math.PI/2){const a=[];for(let i=0;i<=n;i++){const t=rot+i/n*Math.PI*2;a.push([50+Math.cos(t)*42,52+Math.sin(t)*42])}return a}
function fxPts(f,x0,x1,n=64){const a=[];for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;a.push([x,f(x)])}return a}
const SHAPES=[
 ['Kare',[[[12,12],[88,12],[88,88],[12,88],[12,12]]]],
 ['Dikdörtgen',[[[6,26],[94,26],[94,74],[6,74],[6,26]]]],
 ['Daire',[cPts(50,50,40,40)]],
 ['Elips',[cPts(50,50,44,27)]],
 ['Üçgen',[[[50,10],[90,86],[10,86],[50,10]]]],
 ['Dik Üçgen',[[[16,12],[16,86],[88,86],[16,12]],[[16,72],[30,72],[30,86]]]],
 ['Beşgen',[nPoly(5)]],
 ['Altıgen',[nPoly(6)]],
 ['Sekizgen',[nPoly(8,Math.PI/8)]],
 ['Yıldız',[(()=>{const a=[];for(let i=0;i<=10;i++){const t=-Math.PI/2+i/10*Math.PI*2,r=i%2?18:44;a.push([50+Math.cos(t)*r,52+Math.sin(t)*r])}return a})()]],
 ['Eşkenar Dörtgen',[[[50,8],[88,50],[50,92],[12,50],[50,8]]]],
 ['Yamuk',[[[26,26],[74,26],[94,76],[6,76],[26,26]]]],
 ['Paralelkenar',[[[26,28],[94,28],[74,74],[6,74],[26,28]]]],
 ['Yarım Daire',[cPts(50,62,40,40,Math.PI,Math.PI*2),[[10,62],[90,62]]]],
 ['Daire Dilimi',[[[50,58],...cPts(50,58,40,40,-2.35,-0.55),[50,58]]]],
 ['Venn',[cPts(37,50,27,27),cPts(63,50,27,27)]],
 ['Ok',[[[8,50],[82,50]],[[64,32],[84,50],[64,68]]]],
 ['Çift Ok',[[[18,50],[82,50]],[[64,32],[84,50],[64,68]],[[36,32],[16,50],[36,68]]]],
 ['Açı',[[[10,84],[92,84]],[[10,84],[74,20]],cPts(10,84,24,24,-0.72,0)]],
 ['Dik Açı',[[[16,12],[16,86]],[[16,86],[90,86]],[[16,70],[32,70],[32,86]]]],
 ['Koordinat',[[[50,6],[50,94]],[[6,50],[94,50]],[[46,12],[50,6],[54,12]],[[88,46],[94,50],[88,54]]]],
 ['Sayı Doğrusu',[[[4,50],[96,50]],[[10,44],[4,50],[10,56]],[[90,44],[96,50],[90,56]],...[20,32,44,56,68,80].map(x=>[[x,44],[x,56]])]],
 ['Parabol',[fxPts(x=>88-((x-50)*(x-50))/23,12,88)]],
 ['Sinüs',[fxPts(x=>50-26*Math.sin((x-5)/90*Math.PI*3),5,95,90),[[5,50],[95,50]]]],
 ['Mutlak Değer',[[[14,18],[50,86],[86,18]]]],
 ['Kesişen Doğrular',[[[8,18],[92,82]],[[8,82],[92,18]]]],
 ['Çember + r',[cPts(50,50,38,38),[[50,50],[88,50]],cPts(50,50,2,2)]],
 ['Tablo',[[[8,20],[92,20],[92,80],[8,80],[8,20]],[[8,40],[92,40]],[[8,60],[92,60]],[[36,20],[36,80]],[[64,20],[64,80]]]],
 ['Küp',[[[20,38],[70,38],[70,88],[20,88],[20,38]],[[20,38],[38,20],[88,20],[70,38]],[[88,20],[88,70],[70,88]]]],
 ['Silindir',[cPts(50,24,32,11),[[18,24],[18,76]],[[82,24],[82,76]],cPts(50,76,32,11,0,Math.PI)]],
 ['Koni',[[[50,12],[80,78]],[[50,12],[20,78]],cPts(50,78,30,10)]],
 ['Piramit',[[[50,88],[14,68],[50,56],[86,68],[50,88]],[[50,12],[14,68]],[[50,12],[86,68]],[[50,12],[50,88]]]],
 ['Doğru Parçası',[[[12,50],[88,50]],cPts(12,50,3,3),cPts(88,50,3,3)]],
 ['Işın',[[[12,50],[84,50]],cPts(12,50,3,3),[[68,36],[86,50],[68,64]]]],
 ['Yedigen',[nPoly(7)]],
 ['Ongen',[nPoly(10)]],
 ['Altı Köşeli Yıldız',[nPoly(3),nPoly(3,Math.PI/2)]],
 ['Yay',[cPts(50,72,42,42,Math.PI+0.5,Math.PI*2-0.5),cPts(50+Math.cos(Math.PI+0.5)*42,72+Math.sin(Math.PI+0.5)*42,2.5,2.5),cPts(50+Math.cos(-0.5)*42,72+Math.sin(-0.5)*42,2.5,2.5)]],
 ['Kiriş',[cPts(50,50,38,38),[[22,24],[85,62]]]],
 ['Teğet',[cPts(50,58,32,32),[[8,26],[92,26]]]],
 ['Merkez Açı',[cPts(50,52,38,38),[[50,52],[86,38]],[[50,52],[70,86]],cPts(50,52,16,16,-0.37,1.04)]],
 ['Küre',[cPts(50,50,38,38),cPts(50,50,38,13),cPts(50,50,13,38)]],
 ['Dikdörtgen Prizma',[[[12,40],[64,40],[64,88],[12,88],[12,40]],[[12,40],[32,22],[84,22],[64,40]],[[84,22],[84,70],[64,88]]]],
 ['Hiperbol',[fxPts(x=>50-350/(x-50),58,92),fxPts(x=>50-350/(x-50),8,42),[[50,6],[50,94]],[[6,50],[94,50]]]],
 ['Üstel Eğri',[fxPts(x=>92-2.2*Math.exp((x-10)/24),10,88),[[10,92],[92,92]],[[10,8],[10,92]]]],
 ['Logaritma',[fxPts(x=>62-17*Math.log((x-8)/6),16,92),[[10,8],[10,92]],[[6,62],[94,62]]]],
 ['Kosinüs',[fxPts(x=>50-26*Math.cos((x-5)/90*Math.PI*3),5,95,90),[[5,50],[95,50]]]],
 ['Pasta Grafiği',[cPts(50,52,38,38),[[50,52],[88,52]],[[50,52],[50,14]],[[50,52],[24,80]]]],
 ['Sütun Grafiği',[[[12,10],[12,88]],[[12,88],[92,88]],[[22,88],[22,58],[36,58],[36,88]],[[44,88],[44,34],[58,34],[58,88]],[[66,88],[66,48],[80,48],[80,88]]]],
 ['Çizgi Grafiği',[[[12,10],[12,88]],[[12,88],[92,88]],[[16,74],[36,50],[54,62],[72,28],[90,40]],cPts(36,50,2.5,2.5),cPts(54,62,2.5,2.5),cPts(72,28,2.5,2.5)]],
 ['Kalp',[(()=>{const a=[];for(let i=0;i<=60;i++){const t=i/60*Math.PI*2;a.push([50+2.4*16*Math.pow(Math.sin(t),3),46-2.4*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}return a})()]],
];
const SYMBOLS=['π','θ','α','β','Δ','∑','√','∞','∠','≈','≠','≤','≥','±','°','⊥','∥','∈','∅','∫','x²','½','⇒','⇔'];
function polysToPath(polys){return polys.map(pl=>'M'+pl.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')).join(' ')}
let shapeBuilt=false;
function buildShapePop(){if(shapeBuilt)return;shapeBuilt=true;
  const g=$('#shapeGrid');
  SHAPES.forEach(([name,polys])=>{const b=document.createElement('button');b.className='shp';b.title=name;
    b.innerHTML=`<svg width="30" height="30" viewBox="0 0 100 100"><path d="${polysToPath(polys)}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    b.addEventListener('click',()=>{insertShape(polys);$('#shapePop').classList.remove('on')});
    g.appendChild(b)});
  const s=$('#symGrid');
  SYMBOLS.forEach(ch=>{const b=document.createElement('button');b.className='sym';b.textContent=ch;
    b.addEventListener('click',()=>{insertSymbol(ch);$('#shapePop').classList.remove('on')});
    s.appendChild(b)});
}
function toggleShapePop(anchor){buildShapePop();const p=$('#shapePop');
  if(p.classList.contains('on')){p.classList.remove('on');return}
  const r=(anchor||$('.rtool[data-t="shapes"]')).getBoundingClientRect();
  p.style.left=(document.body.classList.contains('present')?70:(r.right+12))+'px';
  p.style.top=clamp(r.top-40,60,innerHeight-420)+'px';
  p.classList.add('on');
}
document.addEventListener('pointerdown',e=>{const p=$('#shapePop');
  if(p.classList.contains('on')&&!p.contains(e.target)&&!e.target.closest('.rtool[data-t="shapes"]'))p.classList.remove('on')});
function viewCenterLocal(){const r=stage.getBoundingClientRect(),off=curOff();
  return{x:(r.width/2-view.x)/view.s-off.x,y:(r.height/2-view.y)/view.s-off.y}}
function insertShape(polys){
  snapshot();const c=viewCenterLocal(),K=2.2;
  const children=polys.map(pl=>({type:'stroke',tool:'ball',straight:true,color:penColor,size:clamp(penSize,2,6),opacity:1,
    points:pl.map(([x,y])=>({x:c.x+(x-50)*K,y:c.y+(y-50)*K,p:.5}))}));
  const g={type:'group',children,opacity:1};
  layer().objects.push(g);selection=[g];setTool('select');redraw();renderSelInfo();
}
function insertSymbol(ch){
  snapshot();const c=viewCenterLocal();
  const o={type:'text',x:c.x-24,y:c.y-34,text:ch,size:64,color:penColor,opacity:1};
  layer().objects.push(o);selection=[o];setTool('select');redraw();renderSelInfo();
}

/* ============================================================
   TAHTAYI TEMİZLE
============================================================ */
function wipeBoard(){
  const p=page();if(!p.layers.some(l=>l.objects.length))return toast('Tahta zaten temiz ✨');
  snapshot();
  p.layers.forEach(l=>{if(!l.locked)l.objects=[]});
  selection=[];redraw();renderSelInfo();
  toast('Tahta temizlendi — Ctrl+Z ile geri alabilirsin');
}

/* ============================================================
   ÇÖZÜM MODU — soruyu çerçevele, boş alanda çöz, iz bırakma
============================================================ */
function solveClick(){
  if(scratch){exitScratch();return}
  if(presenting){toast('Önce sunum modundan çık');return}
  setTool('solve');
  toast('Soruyu sürükleyerek çerçeve içine al — çözüm alanına taşınacak');
}
function capturePageRegion(pg,x0,y0,w,h){
  // Soru büyük gösterileceği için yakalama çözünürlüğü bölge genişliğine göre artar (keskin görüntü)
  const k=clamp(1000/Math.max(w,1),2,4),c=document.createElement('canvas');c.width=Math.max(2,Math.round(w*k));c.height=Math.max(2,Math.round(h*k));
  const g=c.getContext('2d');g.imageSmoothingQuality='high';g.scale(k,k);g.translate(-x0,-y0);
  g.fillStyle='#FBF8F0';g.fillRect(x0,y0,w,h);
  if(pg.bgImg&&pg.bgImg.complete)g.drawImage(pg.bgImg,0,0,pg.w,pg.h);
  paperPattern(g,pg.paper,x0,y0,x0+w,y0+h);
  for(const l of pg.layers){if(!l.visible)continue;g.save();g.globalAlpha=l.opacity;for(const o of l.objects)drawObj(g,o);g.restore()}
  return c.toDataURL('image/png');
}
function finishSolve(){
  const d=solveDraft;solveDraft=null;drawOverlay();
  if(!d)return;
  const x0=Math.min(d.a.x,d.b.x),y0=Math.min(d.a.y,d.b.y),w=Math.abs(d.b.x-d.a.x),h=Math.abs(d.b.y-d.a.y);
  if(w<30||h<30){toast('Çerçeve çok küçük — soruyu kapsayacak şekilde sürükle');return}
  enterScratch(x0,y0,w,h);
}
function enterScratch(x0,y0,w,h){
  const pg=page();
  const url=capturePageRegion(pg,x0,y0,w,h);
  /* Referans düzen: soru SOL ÜSTTE kenar payıyla durur —
     YATAY kesit genişlik ağırlıklı, KARE/DİKEY kesit yükseklik ağırlıklı büyür.
     Kalan tüm sonsuz alan çözüm alanıdır. */
  const r=stageRect||stage.getBoundingClientRect();
  const m=Math.round(Math.min(r.width,r.height)*.08);
  const land=w/h>=1.15;
  let dispW,dispH;
  if(land){dispW=r.width*.54;dispH=dispW*h/w;
    if(dispH>r.height*.78){dispH=r.height*.78;dispW=dispH*w/h}}
  else{dispH=r.height*.78;dispW=dispH*w/h;
    if(dispW>r.width*.54){dispW=r.width*.54;dispH=dispW*h/w}}
  const qLayer=newLayer('Soru');qLayer.locked=true;
  const sLayer=newLayer('Çözüm');
  const im=new Image();im.onload=redraw;im.src=url;
  qLayer.objects.push(
    {type:'image',x:0,y:0,w:dispW,h:dispH,rot:0,src:url,_img:im,opacity:1}
  );
  const sp={id:uid(),name:'Çözüm',paper:'plain',bookmark:false,infinite:true,bg:null,bgImg:null,w:1000,h:1414,layers:[qLayer,sLayer],_undo:[],_redo:[]};
  scratch={page:sp,backView:{...view},backLayer:curLayerId,backTool:tool};
  curLayerId=sLayer.id;selection=[];
  document.body.classList.add('scratch');document.body.classList.remove('side-open');
  setTool('smart');
  view={x:m,y:m,s:1};
  $('#zoomLbl').textContent='100%';
  updUndoBtns();renderLayers();redraw();
  toast(land?'Soru üstte — altı ve sağı çözüm alanın':'Soru solda — sağdaki tüm alan çözüm alanın');
}
function exitScratch(){
  if(!scratch)return;
  const solved=scratch.page;
  view=scratch.backView;curLayerId=scratch.backLayer;
  scratch=null;solveDraft=null;selection=[];
  document.body.classList.remove('scratch');
  setTool('smart');
  fixLayer();updUndoBtns();renderLayers();markPages();updCornerPg();
  $('#zoomLbl').textContent=Math.round(view.s*100)+'%';
  redraw();
  saveSolveToLibrary(solved);
}
/* Çözüm modundan çıkarken çözülen soruyu kütüphaneye kaydet.
   Küçük resim, çözümün gerçek sınırlarından (bbox) yakalanır. */
function saveSolveToLibrary(sp){
  try{
    if(localStorage.getItem('notis_solve_save')==='0')return;   // opsiyonel: kapatılabilir
    if(!sp||!sp.layers||!sp.layers.some(l=>l.objects&&l.objects.length))return;
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    for(const l of sp.layers)for(const o of l.objects){
      const b=bboxOf(o);if(!b)continue;
      x0=Math.min(x0,b.x0);y0=Math.min(y0,b.y0);x1=Math.max(x1,b.x1);y1=Math.max(y1,b.y1)}
    if(!isFinite(x0)){x0=0;y0=0;x1=sp.w;y1=sp.h}
    const pad=28;x0-=pad;y0-=pad;x1+=pad;y1+=pad;
    const w=Math.max(8,x1-x0),h=Math.max(8,y1-y0);
    const title='Çözüm · '+new Date().toLocaleString('tr-TR',
      {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    const done=()=>toast('Çözüm kütüphaneye kaydedildi ✓');
    let url='';try{url=capturePageRegion(sp,x0,y0,w,h)}catch(e){}
    if(!url){LIB.saveExternal(title,[sp],'solve').then(done).catch(()=>{});return}
    const tw=220,th=Math.max(80,Math.min(300,Math.round(tw*h/w)));
    const c=document.createElement('canvas');c.width=tw;c.height=th;
    const g=c.getContext('2d');g.fillStyle='#FBF8F0';g.fillRect(0,0,tw,th);
    const im=new Image();
    im.onload=()=>{try{g.drawImage(im,0,0,tw,th)}catch(e){}
      LIB.saveExternal(title,[sp],'solve',null,c.toDataURL('image/jpeg',.72)).then(done).catch(()=>{})};
    im.onerror=()=>LIB.saveExternal(title,[sp],'solve').then(done).catch(()=>{});
    im.src=url;
  }catch(e){console.warn('çözüm kaydı:',e)}
}
$('#scBack').addEventListener('click',exitScratch);
$('#scWipe').addEventListener('click',()=>{if(!scratch)return;
  snapshot();scratch.page.layers.forEach(l=>{if(!l.locked)l.objects=[]});selection=[];redraw()});


/* ============================================================
   ARAÇ RAYI
============================================================ */
const I={
select:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 3l7 17 2.5-7L21 10.5 4 3z"/></svg>',
smart:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="M19 13l.9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9z" fill="currentColor" stroke="none"/></svg>',
ball:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
fountain:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6 7 7-9.4 9.4a1 1 0 0 1-.7.3H4.5a.5.5 0 0 1-.5-.5v-6.4a1 1 0 0 1 .3-.7L14 6z"/><path d="m13 7 4 4"/><path d="M14 6l3.5-3.5a2.1 2.1 0 0 1 3 3L17 9"/></svg>',
pencil:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 21h8"/><path d="m15 5 4 4L7.5 20.5 2 22l1.5-5.5L15 5z"/></svg>',
hl:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8z"/></svg>',
eraser:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>',
text:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7V5h16v2M12 5v14m-3 0h6"/></svg>',
line:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21 21 3"/><path d="M6 21H3v-3M21 6V3h-3"/></svg>',
compass:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="m12 7-6.5 14M12 7l6.5 14M7 16.5c3 2 7 2 10 0"/></svg>',
prot:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18a9 9 0 0 1 18 0H3z"/><path d="M12 18V9m4.5 9-1-4M7.5 18l1-4"/></svg>',
graph:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M6 15c2-6 4-9 6-9s4 6 6 9"/></svg>',
laser:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".5"/></svg>',
spot:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg>',
pan:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5m0-3.5V4a2 2 0 0 0-4 0v7M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
focus:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/></svg>',
solve:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="10" height="10" rx="1.5"/><path d="M13 10h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2"/><path d="m15 12 2 2 4-4" stroke-width="2.2"/></svg>',
shapes:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="7.5" cy="7.5" r="4.2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2"/><path d="M8 13.5 3.5 21h9L8 13.5z"/></svg>',
wipe:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 4-7.5 7.5"/><path d="M11 10l-7.2 7.2a2.4 2.4 0 0 0 0 3.4 2.4 2.4 0 0 0 3.4 0L14.4 13.4"/><path d="m8.5 15.5 3 3"/><path d="M19.5 9.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="currentColor" stroke="none"/></svg>'};
const TOOLS=[
 {id:'select',n:'Seçim',k:'select'},{id:'pan',n:'Kaydır (El)',k:''},'—',
 {id:'smart',n:'Akıllı Kalem',k:'smart'},{id:'ball',n:'Tükenmez Kalem',k:'ball'},{id:'fountain',n:'Dolma Kalem',k:'fountain'},{id:'pencil',n:'Kurşun Kalem',k:'pencil'},{id:'hl',n:'Fosforlu Kalem',k:'hl'},{id:'eraser',n:'Akıllı Silgi',k:'eraser'},{id:'wipe',n:'Tahtayı Temizle',k:''},'—',
 {id:'text',n:'Metin',k:'text'},{id:'line',n:'Akıllı Cetvel',k:'line'},{id:'compass',n:'Dijital Pergel',k:'compass'},{id:'shapes',n:'Şekiller & Figürler',k:'shapes'},'—',
 {id:'laser',n:'Lazer İşaretçi',k:''},{id:'spot',n:'Spot Işığı',k:''},'—',
 {id:'solve',n:'Çözüm Modu',k:'solve'}
];
function buildRail(){const el=$('#rail');el.innerHTML='';
  for(const t of TOOLS){
    if(t==='—'){el.insertAdjacentHTML('beforeend','<div class="rail-sep"></div>');continue}
    const b=document.createElement('button');b.className='rtool';b.dataset.t=t.id;
    const key=t.k&&KEYMAP[t.k]?KEYMAP[t.k].toUpperCase():'';
    b.innerHTML=(I[t.id]||'')+`<span class="tip">${t.n}${key?`<kbd>${key}</kbd>`:''}</span>`;
    b.addEventListener('click',()=>{
      if(t.id==='shapes'){toggleShapePop(b);return}
      if(t.id==='wipe'){wipeBoard();return}
      if(t.id==='spot'){toggleSpot();return}
      if(t.id==='solve'){solveClick();return}
      setTool(t.id);
    });
    el.appendChild(b);
  }
  markRail();
}
function toDocCenterLocal(){const r=stage.getBoundingClientRect();const off=curOff();
  return{x:(r.width/2-view.x)/view.s-off.x,y:(r.height/2-view.y)/view.s-off.y}}
function markRail(){$$('.rtool').forEach(b=>{b.classList.toggle('on',b.dataset.t===tool);
  if(b.dataset.t==='spot')b.classList.toggle('on2',spotOn);
  if(b.dataset.t==='solve')b.classList.toggle('on2',!!scratch||tool==='solve')})}
const TOOLNAMES={select:'Seçim',smart:'Akıllı Kalem',ball:'Tükenmez',fountain:'Dolma Kalem',pencil:'Kurşun Kalem',hl:'Fosforlu',eraser:'Akıllı Silgi',text:'Metin',line:'Akıllı Cetvel',compass:'Pergel',laser:'Lazer',spot:'Spot',pan:'Kaydır',sticker:'Çıkartma',solve:'Soru Taşı'};
function setTool(t){const _PENS=['smart','ball','fountain','pencil','hl'];if(_PENS.includes(tool)&&tool!==t)prevPen=tool;curCP=null;tool=t;if(t!=='select'){selection=[];renderSelInfo();redraw()}
  if(S.applyDefaults&&DEF[t]!==undefined){penSize=DEF[t];$('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize}
  if(S.applyDefaults&&typeof PCFG!=='undefined'&&PCFG[t]){penOp=PCFG[t].op??penOp;
    $('#opRng').value=Math.round(penOp*100);$('#opOut').textContent=Math.round(penOp*100)}
  if(typeof pkOnTool==='function')pkOnTool(t);
  markRail();renderOpts();
  stage.style.cursor=t==='pan'?'grab':t==='text'?'text':'default'}
function renderOpts(){
  $('#toolName').textContent=(tool==='smart'?'✦ ':'')+(TOOLNAMES[tool]||tool);
  // Bağlama duyarlı üst çubuk: yalnızca seçili araçla ilgili kontroller görünür
  const PENS=['smart','ball','fountain','pencil','hl'];
  const showColor=(PENS.includes(tool)&&tool!=='hl')||['text','line','compass'].includes(tool);
  const showSize=PENS.includes(tool)||['line','compass','eraser'].includes(tool);
  const showOp=PENS.includes(tool)||['line','compass'].includes(tool);
  const showFav=PENS.includes(tool);
  $('#colorWrap').style.display=showColor?'flex':'none';
  $('#sizeCtrl').style.display=showSize?'flex':'none';
  $('#opCtrl').style.display=showOp?'flex':'none';
  $('#favRow').style.display=showFav?'flex':'none';
  $('#favSave').style.display=showFav?'':'none';
  const box=$('#toolOpts');box.innerHTML='';
  const tgl=(lbl,key,scope)=>{const on=scope?eraserTypes[key]:S[key];
    const l=document.createElement('label');l.className='tglrow'+(on?' on':'');
    const c=document.createElement('input');c.type='checkbox';c.checked=on;
    c.addEventListener('change',()=>{if(scope)eraserTypes[key]=c.checked;else{S[key]=c.checked;syncSettingsUI()}l.classList.toggle('on',c.checked);redraw()});
    l.append(c,document.createTextNode(lbl));box.appendChild(l)};
  if(tool==='hl')tgl('Düzleştir','snapHl');
  if(['ball','fountain','pencil'].includes(tool))tgl('Şekil düzelt','shapeFix');
  if(tool==='line')tgl('15° yapış','angleSnap');
  if(tool==='eraser'){tgl('Çizgi','stroke',1);tgl('Vurgu','hl',1);tgl('Metin','text',1);tgl('Görsel','image',1)}
  if(tool==='text'){
    const sel=document.createElement('select');sel.className='num';sel.style.width='76px';sel.title='Yazı boyutu';
    [14,16,18,20,24,28,32,40,48,64].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v+' pt';if(v===DEF.text)o.selected=true;sel.appendChild(o)});
    sel.addEventListener('change',()=>{DEF.text=+sel.value;const d=$('#dText');if(d)d.value=DEF.text});
    box.appendChild(sel);
  }
}

/* ============================================================
   RENKLER & PROFİLLER
============================================================ */
function buildSwatches(){const el=$('#swatches');el.innerHTML='';
  SWATCH.forEach(c=>{const b=document.createElement('button');b.className='sw'+(c===penColor?' on':'');b.style.background=c;
    b.addEventListener('click',()=>{penColor=c;buildSwatches()});el.appendChild(b)})}
$('#sizeRng').addEventListener('input',e=>{penSize=+e.target.value;$('#sizeOut').textContent=penSize});
$('#opRng').addEventListener('input',e=>{penOp=e.target.value/100;$('#opOut').textContent=e.target.value});
const wheelPop=$('#wheelPop'),wcv=$('#wheelCv'),wctx=wcv.getContext('2d');
let hue=222;
function drawWheel(){const W=180,cx=90,cy=90,R=86,r=64;
  wctx.clearRect(0,0,W,W);
  for(let a=0;a<360;a+=2){wctx.beginPath();wctx.strokeStyle=`hsl(${a},95%,55%)`;wctx.lineWidth=R-r;
    wctx.arc(cx,cy,(R+r)/2,(a-1.5)*Math.PI/180,(a+1.5)*Math.PI/180);wctx.stroke()}
  const sz=84,x0=cx-sz/2,y0=cy-sz/2;
  for(let i=0;i<sz;i++)for(let j=0;j<sz;j++){const s=i/sz,v=1-j/sz;wctx.fillStyle=`hsl(${hue} ${s*100}% ${(v*(1-s/2))*100}%)`;wctx.fillRect(x0+i,y0+j,1,1)}
  wctx.strokeStyle='#fff';wctx.lineWidth=2;wctx.strokeRect(x0,y0,sz,sz);
}
function wheelPick(e){const r=wcv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,cx=90,cy=90,d=Math.hypot(x-cx,y-cy);
  if(d>60&&d<92){hue=((Math.atan2(y-cy,x-cx)*180/Math.PI)+360)%360;drawWheel()}
  else if(Math.abs(x-cx)<=42&&Math.abs(y-cy)<=42){const s=(x-(cx-42))/84,v=1-(y-(cy-42))/84;
    penColor=hslToHex(hue,s*100,(v*(1-s/2))*100);$('#hexInp').value=penColor;$('#wheelPrev').style.background=penColor;buildSwatches()}}
wcv.addEventListener('pointerdown',e=>{wheelPick(e);const mv=ev=>wheelPick(ev);const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up)};
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up)});
function hslToHex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return'#'+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}
$('#wheelBtn').addEventListener('click',e=>{const r=e.target.getBoundingClientRect();
  wheelPop.style.left=Math.min(r.left,innerWidth-220)+'px';wheelPop.style.top=(r.bottom+10)+'px';
  wheelPop.classList.toggle('on');drawWheel();$('#wheelPrev').style.background=penColor;$('#hexInp').value=penColor});
$('#hexInp').addEventListener('change',e=>{const v=e.target.value.trim();if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)){penColor=v;$('#wheelPrev').style.background=v;buildSwatches()}});
document.addEventListener('pointerdown',e=>{if(!wheelPop.contains(e.target)&&e.target.id!=='wheelBtn')wheelPop.classList.remove('on')});
function renderFavs(){const el=$('#favRow');el.innerHTML='';
  favs.slice(0,6).forEach((f,i)=>{const b=document.createElement('button');b.className='fdot';b.style.background=f.color;
    b.title=`${f.name} · ${TOOLNAMES[f.tool]} ${f.size}px  (${i+1} · sağ tık: sil)`;
    b.innerHTML=`<span>${i+1}</span>`;
    b.addEventListener('click',()=>applyFav(i));
    b.addEventListener('contextmenu',e=>{e.preventDefault();favs.splice(i,1);renderFavs();toast('Profil silindi')});
    el.appendChild(b)})}
function applyFav(i){const f=favs[i];if(!f)return;if(f.tool!=='hl')penColor=f.color;penOp=f.op;
  tool=f.tool;penSize=f.size; // profil kalınlığı varsayılanı ezer
  $('#sizeRng').value=f.size;$('#sizeOut').textContent=f.size;$('#opRng').value=f.op*100;$('#opOut').textContent=Math.round(f.op*100);
  buildSwatches();markRail();renderOpts();stage.style.cursor='default'}
$('#favSave').addEventListener('click',()=>{if(favs.length>=6)return toast('En fazla 6 profil (sağ tık: sil)');
  const nm=prompt('Profil adı:',TOOLNAMES[tool]||'Kalem');if(!nm)return;
  favs.push({name:nm.slice(0,12),tool:['smart','ball','fountain','pencil','hl'].includes(tool)?tool:'ball',color:penColor,size:penSize,op:penOp});renderFavs()});

/* ============================================================
   PANELLER
============================================================ */
$('#sideBtn').addEventListener('click',()=>{document.body.classList.toggle('side-open');
  $('#sideBtn').classList.toggle('on',document.body.classList.contains('side-open'));
  if(document.body.classList.contains('side-open'))renderPages();resize()});
$$('.stab').forEach(t=>t.addEventListener('click',()=>{
  $$('.stab').forEach(x=>x.classList.remove('on'));t.classList.add('on');
  $$('.spanel').forEach(x=>x.classList.remove('on'));$('#p-'+t.dataset.p).classList.add('on');
  if(t.dataset.p==='pages')renderPages();
  if(t.dataset.p==='library'&&window.LIB)LIB.renderLib();
}));
function renderPageTo(c,p,scale){INK.z=1;const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);
  g.setTransform(scale,0,0,scale,0,0);g.fillStyle='#FBF8F0';g.fillRect(0,0,p.w,p.h);
  if(p.bgImg&&p.bgImg.complete)g.drawImage(p.bgImg,0,0,p.w,p.h);
  paperPattern(g,p.paper,0,0,p.w,p.h);
  for(const l of p.layers){if(!l.visible)continue;g.save();g.globalAlpha=l.opacity;for(const o of l.objects)drawObj(g,o);g.restore()}}
function dupPage(i){const sPg=doc.pages[i];const c=JSON.parse(JSON.stringify(sPg));c.id=uid();c.name+=' (kopya)';c._undo=[];c._redo=[];
  c.layers.forEach(l=>l.objects.forEach(hydrate));if(sPg.bgImg)c.bgImg=sPg.bgImg;
  if(boardMode())doc.pages[0].infinite=false;
  doc.pages.splice(i+1,0,c);invalidateLayout();renderPages();gotoPage(i+1)}
function renderPages(){if(scratch)return;const el=$('#pgList');if(!document.body.classList.contains('side-open'))return;el.innerHTML='';
  doc.pages.forEach((p,i)=>{
    const d=document.createElement('div');d.className='pg'+(i===cur?' on':'');d.dataset.i=i;
    // Büyük görsel önizleme (GoodNotes tarzı kart)
    const th=document.createElement('canvas');th.width=248;th.height=Math.max(60,Math.round(248*p.h/p.w));
    renderPageTo(th,p,248/p.w);
    const num=document.createElement('span');num.className='num';num.textContent=i+1;
    const bk=document.createElement('button');bk.className='bk'+(p.bookmark?' on':'');bk.title='Yer imi';
    bk.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="'+(p.bookmark?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    bk.addEventListener('click',e=>{e.stopPropagation();p.bookmark=!p.bookmark;renderPages()});
    const meta=document.createElement('div');meta.className='meta';
    meta.innerHTML=`<div class="nm">${esc(p.name)}${p.infinite?' ∞':''}</div><div class="sub">${paperName(p.paper)} · ${p.layers.length} katman · Sayfa ${i+1}</div>`;
    // Üzerine gelince beliren eylemler: çoğalt · yeniden adlandır · özellikler · sil
    const acts=document.createElement('div');acts.className='acts';
    const mkA=(title,svg,fn,danger)=>{const b=document.createElement('button');if(danger)b.className='danger';b.title=title;b.innerHTML=svg;
      b.addEventListener('click',e=>{e.stopPropagation();fn()});acts.appendChild(b)};
    mkA('Çoğalt','<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',()=>dupPage(i));
    mkA('Yeniden adlandır','<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',()=>{const v=prompt('Sayfa adı:',p.name);if(v){p.name=v;renderPages()}});
    mkA('Özellikler','<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v3m0 16v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M1 12h3m16 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',()=>openPageDlg(i));
    mkA('Sil','<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',()=>{
      if(doc.pages.length===1)return toast('Son sayfa silinemez');
      doc.pages.splice(i,1);invalidateLayout();renderPages();gotoPage(Math.min(cur,doc.pages.length-1))},true);
    d.append(th,num,bk,acts,meta);
    d.addEventListener('click',()=>gotoPage(i));
    d.addEventListener('dblclick',()=>openPageDlg(i));
    el.appendChild(d);
  });
}
function markPages(){$$('#pgList .pg').forEach(d=>d.classList.toggle('on',+d.dataset.i===cur))}
function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function paperName(p){return{plain:'Düz',lined:'Çizgili',dotted:'Noktalı',grid:'Kareli',graph:'Milimetrik',iso:'İzometrik',coord:'Koordinat'}[p]||p}
function gotoPage(i){if(scratch)return;i=clamp(i,0,doc.pages.length-1);switchPage(i);if(window.LIB)LIB.dirty();
  if(presenting)fitPresent();
  else if(!boardMode()){invalidateLayout();const off=layout()[cur];
    scrollDetectLock=true;view.y=-off.y*view.s+26;redraw();scrollDetectLock=false}
  else redraw();
  updCornerPg()}
$('#pgAdd').addEventListener('click',()=>{
  if(boardMode())doc.pages[0].infinite=false; // tahtadan belgeye geç
  doc.pages.splice(cur+1,0,newPage(page().paper==='plain'&&doc.pages.length===1?'dotted':page().paper));
  invalidateLayout();renderPages();gotoPage(cur+1);toast('Yeni sayfa eklendi')});
$('#pgDup').addEventListener('click',()=>{const c=JSON.parse(JSON.stringify(page()));c.id=uid();c.name+=' (kopya)';c._undo=[];c._redo=[];
  c.layers.forEach(l=>l.objects.forEach(hydrate));if(page().bgImg)c.bgImg=page().bgImg;
  if(boardMode())doc.pages[0].infinite=false;
  doc.pages.splice(cur+1,0,c);invalidateLayout();renderPages();gotoPage(cur+1)});
let pageDlgIdx=0;
function openPageDlg(i){pageDlgIdx=i;const p=doc.pages[i];
  $('#pgName').value=p.name;$('#pgPaper').value=p.paper;$('#pgInf').checked=p.infinite;$('#pgBk').checked=p.bookmark;
  $('#pgInf').disabled=doc.pages.length>1;
  pageDlg.showModal()}
$('#pgName').addEventListener('input',e=>{doc.pages[pageDlgIdx].name=e.target.value;renderPages()});
$('#pgPaper').addEventListener('change',e=>{doc.pages[pageDlgIdx].paper=e.target.value;redraw();renderPages()});
$('#pgInf').addEventListener('change',e=>{doc.pages[pageDlgIdx].infinite=e.target.checked;invalidateLayout();fit();renderPages();updCornerPg()});
$('#pgBk').addEventListener('change',e=>{doc.pages[pageDlgIdx].bookmark=e.target.checked;renderPages()});
$('#pgBg').addEventListener('click',()=>{imgTarget='bg';$('#fileInp').accept='image/*';$('#fileInp').click();pageDlg.close()});
$('#pgRot').addEventListener('click',()=>{const p=doc.pages[pageDlgIdx];[p.w,p.h]=[p.h,p.w];invalidateLayout();fit();renderPages()});
$('#pgDel').addEventListener('click',()=>{if(doc.pages.length===1)return toast('Son sayfa silinemez');
  doc.pages.splice(pageDlgIdx,1);invalidateLayout();pageDlg.close();renderPages();gotoPage(Math.min(cur,doc.pages.length-1))});

function renderLayers(){const el=$('#layList');if(!el)return;el.innerHTML='';const p=page();
  [...p.layers].reverse().forEach(l=>{
    const d=document.createElement('div');d.className='lay'+(l.id===curLayerId?' on':'');
    const eye=document.createElement('button');eye.className='icobtn'+(l.visible?' on':'');
    eye.innerHTML=l.visible?'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 2 20 20M6.7 6.7C3.6 8.8 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.5 5-1.2M10.6 5.1C11 5 11.5 5 12 5c6.5 0 10 7 10 7s-.9 1.8-2.6 3.5"/></svg>';
    eye.addEventListener('click',e=>{e.stopPropagation();l.visible=!l.visible;redraw();renderLayers()});
    const lock=document.createElement('button');lock.className='icobtn'+(l.locked?' on':'');
    lock.innerHTML=l.locked?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.7-1.5"/></svg>';
    lock.addEventListener('click',e=>{e.stopPropagation();l.locked=!l.locked;renderLayers()});
    const nm=document.createElement('span');nm.className='nm';nm.textContent=l.name;
    nm.addEventListener('dblclick',e=>{e.stopPropagation();const v=prompt('Katman adı:',l.name);if(v){l.name=v;renderLayers()}});
    const op=document.createElement('input');op.type='range';op.min=10;op.max=100;op.value=l.opacity*100;op.title='Katman opaklığı';
    op.addEventListener('input',e=>{l.opacity=e.target.value/100;redraw()});op.addEventListener('pointerdown',e=>e.stopPropagation());
    const del=document.createElement('button');del.className='icobtn';del.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';
    del.addEventListener('click',e=>{e.stopPropagation();if(p.layers.length===1)return toast('Son katman silinemez');
      snapshot();p.layers=p.layers.filter(x=>x!==l);if(curLayerId===l.id)curLayerId=p.layers[p.layers.length-1].id;redraw();renderLayers()});
    d.append(eye,lock,nm,op,del);
    d.addEventListener('click',()=>{curLayerId=l.id;renderLayers()});
    el.appendChild(d);
  });
}
$('#layAdd').addEventListener('click',()=>{const p=page();const l=newLayer('Katman '+(p.layers.length+1));p.layers.push(l);curLayerId=l.id;renderLayers();toast('Katman eklendi')});
$('#layGroupBtn').addEventListener('click',groupSelection);
$$('#p-layers .chip[data-al]').forEach(b=>b.addEventListener('click',()=>alignSelection(b.dataset.al)));
function renderStickers(){const el=$('#stkGrid');el.innerHTML='';
  const mk=(data)=>{const b=document.createElement('button');b.className='stk';
    if(data.emoji)b.textContent=data.emoji;else{const im=document.createElement('img');im.src=data.src;b.appendChild(im)}
    b.addEventListener('click',()=>{activeSticker=data;$$('.stk').forEach(x=>x.classList.remove('on'));b.classList.add('on');setTool('sticker')});
    el.appendChild(b)};
  importedStickers.forEach(mk);
  EMOJI.forEach(e=>mk({emoji:e}));
}
$('#stkImport').addEventListener('click',()=>$('#stkInp').click());
$('#stkInp').addEventListener('change',e=>{const files=[...e.target.files];let n=0;
  files.forEach(f=>{const r=new FileReader();r.onload=()=>{importedStickers.unshift({src:r.result});if(++n===files.length){renderStickers();toast(n+' çıkartma içe aktarıldı')}};r.readAsDataURL(f)});
  e.target.value=''});

/* ============================================================
   İÇE / DIŞA AKTARMA
============================================================ */
let imgTarget='object';
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(Error('yüklenemedi'));document.head.appendChild(s)})}
$('#importBtn').addEventListener('click',()=>{imgTarget='object';$('#fileInp').accept='.pdf,image/*';$('#fileInp').click()});
$('#fileInp').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  if(f.type==='application/pdf'){await importPDF(f);return}
  const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{
    if(imgTarget==='bg'){const p=page();p.bgImg=im;p.bg=r.result;redraw();renderPages();toast('Görsel özel arka plan olarak ayarlandı')}
    else{snapshot();const p=page();const w=Math.min(420,im.width);const h=w*im.height/im.width;
      const rct=stage.getBoundingClientRect();const off=curOff();
      const cx=boardMode()?(rct.width/2-view.x)/view.s:(p.w/2), cy=boardMode()?(rct.height/2-view.y)/view.s:(p.h/2);
      const o={type:'image',x:cx-w/2,y:cy-h/2,w,h,rot:0,src:r.result,_img:im,opacity:1};
      layer().objects.push(o);selection=[o];setTool('select');redraw();toast('Görsel eklendi — sürükleyip boyutlandırabilirsin')}
    imgTarget='object';
  };im.src=r.result};
  r.readAsDataURL(f);
});
/* Görseli tahtaya yerleştir — dosya seçiciyle birebir aynı akış, bildirimsiz */
/* İçe aktarılan dikdörtgeni referans düzene göre yerleştir:
   sol-üst köşeye kenar payıyla · YATAY ise genişlik ağırlıklı,
   KARE/DİKEY ise yükseklik ağırlıklı büyük görünüm. */
function placeImportedRect(iw,ih){
  const r=stageRect||stage.getBoundingClientRect();
  const m=Math.round(Math.min(r.width,r.height)*.08);
  const land=iw/ih>=1.15;
  let W,H;
  if(land){W=r.width*.54;H=W*ih/iw;
    if(H>r.height*.78){H=r.height*.78;W=H*iw/ih}}
  else{H=r.height*.78;W=H*iw/ih;
    if(W>r.width*.54){W=r.width*.54;H=W*ih/iw}}
  return {x:(m-view.x)/view.s, y:(m-view.y)/view.s, w:W/view.s, h:H/view.s, m, W, H};
}
function importImageFile(f){if(window.LIB)LIB.tag('image',f.name);const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{
    snapshot();
    const g=placeImportedRect(im.width,im.height);   // referans yerleşim: sol-üst, orana göre boyut
    const o={type:'image',x:g.x,y:g.y,w:g.w,h:g.h,rot:0,src:r.result,_img:im,opacity:1};
    layer().objects.push(o);selection=[o];setTool('select');redraw();
  };im.src=r.result};
  r.readAsDataURL(f)}
/* Pano: kopyalanan/kesilen foto, ekran alıntısı veya PDF → Ctrl+V ile doğrudan tahtaya */
window.addEventListener('paste',e=>{
  if(document.activeElement&&/^(input|textarea)$/i.test(document.activeElement.tagName))return; // yazı alanlarına karışma
  const items=e.clipboardData&&e.clipboardData.items;if(!items)return;
  for(const it of items){
    if(it.kind!=='file')continue;
    const f=it.getAsFile();if(!f)continue;
    if(f.type==='application/pdf'){e.preventDefault();importPDF(f);return}
    if(f.type.startsWith('image/')){e.preventDefault();importImageFile(f);return}
  }
});
/* Sürükle-bırak: foto veya PDF dosyasını tut, tahtaya bırak */
stage.addEventListener('dragover',e=>{e.preventDefault()});
stage.addEventListener('drop',e=>{e.preventDefault();
  const fs=e.dataTransfer&&e.dataTransfer.files;if(!fs||!fs.length)return;
  for(const f of fs){
    if(f.type==='application/pdf'){importPDF(f);return}
    if(f.type.startsWith('image/')){importImageFile(f);return}
  }
});
async function importPDF(f){
  toast('PDF kütüphaneye ekleniyor…');
  try{
    const LB=window.__NOTIS_SRV?(location.origin+'/libs'):'https://cdnjs.cloudflare.com/ajax/libs';
    const N0=2000;
    let targetW=Math.min(2400,Math.max(1600,(screen.width||1920)*(window.devicePixelRatio||1)));
    /* OLED Ultra Görüntü: PDF sayfaları 4K dokuya kadar yüksek çözünürlükte
       örneklenir — yakınlaştırmada metinler jilet gibi kalır (video kaydı kalitesi). */
    if(S.oledUltra)targetW=Math.min(3840,Math.round(targetW*1.6));
    const buf=await f.arrayBuffer();
    const title=f.name.replace(/\.pdf$/i,'');
    const workId=uid();let chunk=[],total=0,atlanan=0,N=0;
    const meta=()=>({id:workId,title,updatedAt:Date.now(),pages:total,kind:'pdf',thumb:window.__pdfThumb||'',res:window.__pdfRes||0});
    const flushChunk=async()=>{
      if(!chunk.length)return;
      const pagesJson=JSON.stringify(chunk);chunk=[];
      if(window.__NOTIS_SRV){
        let lastErr=null;
        for(let a=0;a<3;a++){
          try{
            const r=await fetch('/lib/append',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({meta:meta(),pagesJson})});
            if(r.ok){lastErr=null;break}
            lastErr=new Error('sunucu '+r.status);
          }catch(e){lastErr=e}
          await new Promise(r2=>setTimeout(r2,400*(a+1)));
        }
        if(lastErr)throw new Error('kayıt yazılamadı: '+lastErr.message);
      }else{
        window.__pdfAll=(window.__pdfAll||[]).concat(JSON.parse(pagesJson));
        await LIB.saveExternal(title,window.__pdfAll,'pdf',workId);
      }
      if(typeof LIB!=='undefined'&&LIB.renderLib)LIB.renderLib();
    };
    const mkThumb=async(bg,pw,ph)=>{try{
      const tc=document.createElement('canvas');tc.width=220;tc.height=Math.round(220*ph/pw);
      const tg=tc.getContext('2d');tg.imageSmoothingQuality='high';
      const im=new Image();await new Promise(r=>{im.onload=r;im.onerror=r;im.src=bg});
      tg.drawImage(im,0,0,tc.width,tc.height);window.__pdfThumb=tc.toDataURL('image/jpeg',.72)}catch(e){}};
    const canWorker=window.__NOTIS_SRV&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined';
    if(canWorker){
      await new Promise((resolve,reject)=>{
        const w=new Worker('/libs/notis/pdf-import-worker.js');
        let pending=Promise.resolve();
        let wd=null;const kick=()=>{clearTimeout(wd);wd=setTimeout(()=>{
          w.terminate();
          reject(new Error('işleme yarıda kesildi — '+total+' sayfa kaydedildi.'))},180000)};
        kick();
        w.onerror=e=>{clearTimeout(wd);reject(new Error(e.message||'worker hatası'))};
        w.onmessage=ev=>{
          kick();
          const m=ev.data;
          pending=pending.then(async()=>{
            if(m.t==='n'){N=m.N}
            else if(m.t==='p'){
              if(total===0){await mkThumb(m.bg,m.pw,m.ph);window.__pdfRes=m.pw}
              chunk.push({id:uid(),name:title+' · s.'+m.i,paper:'plain',bookmark:false,infinite:false,
                bg:m.bg,bgImg:undefined,w:1000,h:Math.round(1000*m.ph/m.pw),
                layers:[newLayer('Katman 1')],_undo:[],_redo:[]});
              total++;ev.data.bg=null;
              if(chunk.length>=4)await flushChunk();
              if(m.i%10===0)toast('PDF işleniyor… '+m.i+'/'+N);
              w.postMessage({t:'ack'});
            }
            else if(m.t==='skip'){atlanan++;w.postMessage({t:'ack'})}
            else if(m.t==='done'){clearTimeout(wd);await flushChunk();w.terminate();resolve()}
            else if(m.t==='err'){clearTimeout(wd);w.terminate();reject(new Error(m.m))}
          }).catch(e=>{w.terminate();reject(e)});
        };
        w.postMessage({buf,targetW,cap:3.0,maxN:N0,base:LB},[buf]);
      });
    }else{
      if(!window.pdfjsLib){await loadScript(LB+'/pdf.js/3.11.174/pdf.min.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc=LB+'/pdf.js/3.11.174/pdf.worker.min.js'}
      const pdf=await pdfjsLib.getDocument(Object.assign({data:buf},
        window.__NOTIS_SRV?{standardFontDataUrl:'/libs/pdf.js/3.11.174/standard_fonts/',
          cMapUrl:'/libs/pdf.js/3.11.174/cmaps/',cMapPacked:true}:{})).promise;
      N=Math.min(pdf.numPages,N0);
      let tw=targetW;
      if(N>250)tw=Math.min(tw,1400);else if(N>120)tw=Math.min(tw,1600);else if(N>60)tw=Math.min(tw,2000);
      const q=N>120?.86:.93;
      const cnv=document.createElement('canvas'),g=cnv.getContext('2d');
      for(let i=1;i<=N;i++){
        try{
          const pg=await pdf.getPage(i);const vp1=pg.getViewport({scale:1});
          const vp=pg.getViewport({scale:Math.min(3.0,Math.max(1.15,tw/vp1.width))});
          cnv.width=Math.round(vp.width);cnv.height=Math.round(vp.height);
          await pg.render({canvasContext:g,viewport:vp}).promise;
          let bg=cnv.toDataURL('image/webp',q);if(!bg.startsWith('data:image/webp'))bg=cnv.toDataURL('image/jpeg',q+.02);
          if(total===0)await mkThumb(bg,cnv.width,cnv.height);
          chunk.push({id:uid(),name:title+' · s.'+i,paper:'plain',bookmark:false,infinite:false,
            bg,bgImg:undefined,w:1000,h:Math.round(1000*vp.height/vp.width),
            layers:[newLayer('Katman 1')],_undo:[],_redo:[]});
          total++;pg.cleanup&&pg.cleanup();
        }catch(pe){atlanan++}
        if(chunk.length>=4)await flushChunk();
        if(i%10===0)toast('PDF işleniyor… '+i+'/'+N);
        await new Promise(r=>requestAnimationFrame(r));
      }
      await flushChunk();cnv.width=cnv.height=0;
    }
    delete window.__pdfAll;delete window.__pdfThumb;delete window.__pdfRes;
    if(!total)throw new Error('hiçbir sayfa işlenemedi');
    let diskte=total;
    if(window.__NOTIS_SRV){try{
      const ms=await(await fetch('/lib')).json();
      const me=ms.find(x=>x.id===workId); if(me)diskte=me.pages;
    }catch(e){}}
    if(typeof LIB!=='undefined'&&LIB.renderLib)LIB.renderLib();
    if(diskte<total)
      toast('⚠ '+total+' sayfadan '+diskte+' tanesi kaydedilebildi.',7000);
    else
      toast('“'+title+'” kütüphaneye eklendi ('+total+' sayfa'+(atlanan?' · '+atlanan+' sayfa atlandı':'')+') 📚');
  }catch(err){console.error(err);toast('PDF eklenemedi: '+(err&&err.message||err),4500)}
}
                                                                                                                                                                                                                                                                                                                                                    
$('#exportBtn').addEventListener('click',()=>expDlg.showModal());
$('#expGo').addEventListener('click',async()=>{
  const fmt=$('#expFmt').value;expDlg.close();
  const title=(doc.title||'notis').replace(/[^\wğüşöçıİĞÜŞÖÇ -]/g,'');
  if(fmt==='png'){
    if(scratch){ // Cozum modu: soru (sol) + cozum (sag) tek karede
      const sp=scratch.page;
      let b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9},any=false;
      for(const l of sp.layers){if(!l.visible)continue;
        for(const o of l.objects){const ob=bboxOf(o);any=true;
          b.x0=Math.min(b.x0,ob.x0);b.y0=Math.min(b.y0,ob.y0);
          b.x1=Math.max(b.x1,ob.x1);b.y1=Math.max(b.y1,ob.y1)}}
      if(!any){toast('Dışa aktarılacak içerik yok');return}
      const PAD=48, W=b.x1-b.x0+PAD*2, H=b.y1-b.y0+PAD*2;
      const k=clamp(2400/W,1,3);
      const c=document.createElement('canvas');
      c.width=Math.round(W*k);c.height=Math.round(H*k);
      const g=c.getContext('2d');INK.z=1;
      g.scale(k,k);g.translate(-(b.x0-PAD),-(b.y0-PAD));
      g.fillStyle='#FBF8F0';g.fillRect(b.x0-PAD,b.y0-PAD,W,H);
      for(const l of sp.layers){if(!l.visible)continue;
        g.save();g.globalAlpha=l.opacity;for(const o of l.objects)drawObj(g,o);g.restore()}
      dl(c.toDataURL('image/png'),title+'-cozum.png');
      toast('Soru + çözüm tek görselde indirildi');
    }else{
      const p=page();
      if(p.infinite){
        /* Sonsuz tahta: sabit sayfa dikdörtgeni değil, İÇERİĞİN TAMAMI aktarılır —
           foto ve çizimler nerede olursa olsun hiçbiri kırpılmaz. */
        let b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9},any=false;
        for(const l of p.layers){if(!l.visible)continue;
          for(const o of l.objects){const ob=bboxOf(o);any=true;
            b.x0=Math.min(b.x0,ob.x0);b.y0=Math.min(b.y0,ob.y0);
            b.x1=Math.max(b.x1,ob.x1);b.y1=Math.max(b.y1,ob.y1)}}
        if(!any){toast('Dışa aktarılacak içerik yok');return}
        const PAD=48,W=b.x1-b.x0+PAD*2,H=b.y1-b.y0+PAD*2;
        const k=clamp(2600/Math.max(W,H),1,3);
        const c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);
        const g=c.getContext('2d');INK.z=1;
        g.scale(k,k);g.translate(-(b.x0-PAD),-(b.y0-PAD));
        g.fillStyle=boardBg();g.fillRect(b.x0-PAD,b.y0-PAD,W,H);
        paperPattern(g,p.paper,b.x0-PAD,b.y0-PAD,b.x1+PAD,b.y1+PAD);
        drawBoardStyle(g,b.x0-PAD,b.y0-PAD,b.x1+PAD,b.y1+PAD);
        for(const l of p.layers){if(!l.visible)continue;g.save();g.globalAlpha=l.opacity;for(const o of l.objects)drawObj(g,o);g.restore()}
        dl(c.toDataURL('image/png'),title+'.png');
        toast('Tahtadaki tüm içerik PNG olarak indirildi ✓');
      }else{
        const k=2,c=document.createElement('canvas');c.width=p.w*k;c.height=p.h*k;renderPageTo(c,p,k);
        dl(c.toDataURL('image/png'),title+'.png');
      }
    }}
  else if(fmt==='notis'){const data=JSON.stringify({title:doc.title,pages:doc.pages.map(p=>({...p,_undo:[],_redo:[],bgImg:undefined}))});
    dl('data:application/json;charset=utf-8,'+encodeURIComponent(data),title+'.notis')}
  else{
    toast('PDF hazırlanıyor…');
    try{if(!window.jspdf)await loadScript((window.__NOTIS_SRV?'/libs':'https://cdnjs.cloudflare.com/ajax/libs')+'/jspdf/2.5.1/jspdf.umd.min.js');
      const{jsPDF}=window.jspdf;let pdf=null;
      for(const p of doc.pages){const k=1.5,c=document.createElement('canvas');c.width=p.w*k;c.height=p.h*k;renderPageTo(c,p,k);
        const or=p.w>p.h?'l':'p';
        if(!pdf)pdf=new jsPDF({orientation:or,unit:'px',format:[p.w,p.h]});else pdf.addPage([p.w,p.h],or);
        pdf.addImage(c.toDataURL('image/jpeg',.9),'JPEG',0,0,p.w,p.h)}
      pdf.save(title+'.pdf');toast('PDF indirildi')}
    catch(err){toast('PDF dışa aktarılamadı: '+err.message)}
  }
});
function dl(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click()}

/* ============================================================
   SUNUM · ODAK · ÇÖZÜM
============================================================ */
let fadeTimer=null;
function enterPresent(){hideMiniBar();if(ringOpen)closeRing(false);if(focusMode)toggleFocus(false);
  if(presenting)return;presenting=true;
  document.documentElement.requestFullscreen?.().catch(()=>{});
  document.body.classList.add('present-out');  // 1) üst çubuk fade, ray/panel slide
  stage.classList.add('present-zoom');         // 2) tuval yumuşak zoom
  setTimeout(()=>{
    document.body.classList.remove('present-out');
    document.body.classList.add('present');
    setTool('laser');fitPresent();markPr();armFade();
  },360);
  setTimeout(()=>stage.classList.remove('present-zoom'),950)}
function exitPresent(){presenting=false;
  document.body.classList.remove('present','present-out');
  stage.classList.remove('present-zoom');
  document.body.classList.add('present-in');   // paneller yumuşakça geri süzülür
  setTimeout(()=>document.body.classList.remove('present-in'),480);
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  toggleSpot(false);setTool('smart');fit()}
function armFade(){clearTimeout(fadeTimer);$('#presentBar').classList.remove('fade');
  fadeTimer=setTimeout(()=>$('#presentBar').classList.add('fade'),2600)}
{const wb=$('#webBtn');if(wb)wb.addEventListener('click',()=>{if(window.proWebAsk)window.proWebAsk()});}
/* 🎲 Rastgele renge geç (kısayul atanabilir: Ayarlar › Kısayollar) —
   canlı, doygun ve mevcut renkten belirgin şekilde farklı bir renk üretir */
function randPenColor(){
  const cur=penColor;
  let hex=cur,guard=0;
  while(hex.toLowerCase()===cur.toLowerCase()&&guard++<8){
    const h=Math.floor(Math.random()*360),s=.62+Math.random()*.28,l=.34+Math.random()*.2;
    const f=n=>{const k=(n+h/30)%12;const a=s*Math.min(l,1-l);
      return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};
    hex='#'+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  penColor=hex;buildSwatches();
  if(typeof buildMiniBar==='function')try{buildMiniBar()}catch(_){}
  drawOverlay();
}
$('#prExit').addEventListener('click',exitPresent);
$('#prSmart').addEventListener('click',()=>{setTool('smart');markPr()});
$('#prPen').addEventListener('click',()=>{setTool('ball');markPr()});
$('#prHl').addEventListener('click',()=>{setTool('hl');markPr()});
$('#prEraser').addEventListener('click',()=>{setTool('eraser');markPr()});
$('#prUndo').addEventListener('click',undo);
$$('.pdot').forEach(d=>d.addEventListener('click',()=>{penColor=d.dataset.c;buildSwatches();markPr()}));
$('#prLaser').addEventListener('click',()=>{setTool('laser');markPr()});
$('#prSpot').addEventListener('click',()=>{toggleSpot();markPr()});
function markPr(){$('#prSmart').classList.toggle('on',tool==='smart');$('#prPen').classList.toggle('on',tool==='ball');
  $('#prHl').classList.toggle('on',tool==='hl');$('#prEraser').classList.toggle('on',tool==='eraser');
  $('#prLaser').classList.toggle('on',tool==='laser');$('#prSpot').classList.toggle('on',spotOn);
  $$('.pdot').forEach(d=>d.classList.toggle('on',d.dataset.c.toLowerCase()===penColor.toLowerCase()))}

function toggleFocus(on){focusMode=on??!focusMode;document.body.classList.toggle('focus',focusMode);
  markRail();resize();if(focusMode)toast('Odak modu — Esc ile çık')}
$('#focusExit').addEventListener('click',()=>toggleFocus(false));



/* ============================================================
   AYARLAR — sekmeler, klavye düzenleyici, bağlamalar
============================================================ */
$$('.set-tab').forEach(t=>t.addEventListener('click',()=>{
  if(!t.dataset.s)return;                       // Çıkış Yap gibi eylem düğmeleri pane açmaz
  $$('.set-tab').forEach(x=>x.classList.remove('on'));t.classList.add('on');
  $$('.set-pane').forEach(x=>x.classList.remove('on'));$('#sp-'+t.dataset.s).classList.add('on');
  if(typeof updPaneHead==='function')updPaneHead(t.dataset.s);
  if(t.dataset.s==='pens'&&typeof pkSizeCv==='function')requestAnimationFrame(pkSizeCv);
  if(t.dataset.s==='storage'&&window.LIB)LIB.fillPane();
}));
function openSettings(tab){setDlg.showModal();if(tab){$$('.set-tab').forEach(x=>x.classList.toggle('on',x.dataset.s===tab));
  $$('.set-pane').forEach(x=>x.classList.toggle('on',x.id==='sp-'+tab))}
  const _cur=$$('.set-tab').find(x=>x.classList.contains('on'));
  if(typeof updPaneHead==='function'&&_cur)updPaneHead(_cur.dataset.s);
  if(typeof renderPenCards==='function'){renderPenCards();syncPenUI();requestAnimationFrame(pkSizeCv)}
  if(tab==='storage'&&window.LIB)LIB.fillPane()}
const bindT=(id,key,cb)=>$(id).addEventListener('change',e=>{S[key]=e.target.checked;cb&&cb();saveOpts();redraw()});
const bindR=(id,key,k=1,cb)=>$(id).addEventListener('input',e=>{S[key]=e.target.value*k;cb&&cb();saveOpts()});
bindT('#sPressure','pressure');bindT('#sPredict','predict');
bindT('#sShape','shapeFix',renderOpts);bindT('#sSnapHl','snapHl',renderOpts);
bindT('#sSnapGrid','snapGrid');bindT('#sGuides','guides');bindT('#sAngle','angleSnap',renderOpts);
bindT('#sApplyDef','applyDefaults');bindT('#sWheelPage','wheelPage');
bindR('#sSmooth','smooth',.01);bindR('#sStab','stab',.01);
bindR('#sGrid','grid',1,()=>{$('#sGridOut').textContent=S.grid+' px';redraw()});
bindR('#sSpot','spot',1,()=>$('#sSpotOut').textContent=S.spot+' px · sunumda fare tekeriyle de ayarlanır');
$('#sLaser').addEventListener('input',e=>S.laser=e.target.value);
const THEMES=[['ink','Notis','#161C38','#FFB454'],['light','Aydınlık','#F2F4FB','#E8930C'],
 ['netflix','Kızıl Gece','#141414','#E50914'],['disney','Gece Mavisi','#0F1B33','#0072D2'],
 ['prime','Buz Mavisi','#161F2A','#00A8E1'],['rakuten','Bordo','#1C1416','#BF0000'],
 ['youtube','Saf Beyaz','#FFFFFF','#FF0000']];
function renderThemes(){const el=$('#themeGrid');if(!el)return;el.innerHTML='';
  const curT=document.documentElement.dataset.theme||'ink';
  THEMES.forEach(([id,n,pc,ac])=>{const b=document.createElement('button');b.className='thm'+(curT===id?' on':'');
    b.innerHTML=`<span class="prev" style="background:${pc}"><b style="background:${ac}"></b></span>${n}`;
    b.addEventListener('click',()=>{document.documentElement.dataset.theme=id;renderThemes();saveOpts()});
    el.appendChild(b)})}
$('#sLeft').addEventListener('change',e=>{const on=e.target.checked;
  $('#rail').style.order=on?2:'';$('#stage').style.order=on?1:'';
  document.body.style.gridTemplateAreas=on?'"top top top" "canvas rail side"':'';
  document.body.style.gridTemplateColumns=on?('1fr '+(S.compact?'46px':'58px')+' auto'):'';resize()});
$('#sCorner').addEventListener('change',e=>{S.cornerUI=e.target.checked;$('#corner').style.display=S.cornerUI?'flex':'none';if(typeof saveOpts==='function')saveOpts()});
bindT('#sMini','miniBar');bindT('#sRing','ring');
$('#sGrain').addEventListener('change',e=>{S.grain=e.target.checked;document.body.classList.toggle('nograin',!S.grain);saveOpts()});
function syncSettingsUI(){$('#sShape').checked=S.shapeFix;$('#sSnapHl').checked=S.snapHl;$('#sAngle').checked=S.angleSnap;$('#sSnapGrid').checked=S.snapGrid}
/* kalem varsayılanları */
const DEFIDS={text:'#dText'}; // kalem kalınlıkları Kalem Stüdyosu kartlarından yönetilir
for(const[k,id]of Object.entries(DEFIDS)){$(id).addEventListener('change',e=>{DEF[k]=clamp(+e.target.value||DEF[k],.5,80);
  e.target.value=DEF[k];if(S.applyDefaults&&tool===k){penSize=DEF[k];$('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize}
  if(typeof saveOpts==='function')saveOpts()})}
/* klavye düzenleyici */
let recAction=null;
function renderKeys(){const el=$('#keyList');el.innerHTML='';
  for(const[act,lbl]of Object.entries(KEYLABELS)){
    const row=document.createElement('div');row.className='set-row';
    const kb=document.createElement('kbd');kb.className='k';kb.textContent=(KEYMAP[act]||'—').toUpperCase();
    kb.addEventListener('click',()=>{if(recAction){renderKeys();}recAction=act;kb.classList.add('rec');kb.textContent='tuşa bas…'});
    row.innerHTML=`<div class="t">${lbl}</div>`;row.appendChild(kb);el.appendChild(row);
  }
}
window.addEventListener('keydown',e=>{
  if(!recAction)return;
  e.preventDefault();e.stopPropagation();
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(k==='Escape'){recAction=null;renderKeys();return}
  if(/^([a-z0-9]|F([1-9]|1[0-2]))$/.test(k)){
    for(const a in KEYMAP)if(KEYMAP[a]===k&&a!==recAction)KEYMAP[a]=null; // çakışmayı boşalt
    KEYMAP[recAction]=k;recAction=null;renderKeys();buildRail();saveOpts();toast('Kısayol güncellendi')}
},true);
$('#keyReset').addEventListener('click',()=>{KEYMAP={...KEYDEF};recAction=null;renderKeys();buildRail();saveOpts();toast('Kısayollar sıfırlandı')});
$('#setBtn').addEventListener('click',()=>openSettings());
$('#fs2Btn').addEventListener('click',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen());
$('#homeBtn').addEventListener('click',()=>{
  const hasContent=doc.pages.some(p=>p.layers.some(l=>l.objects.length))||doc.pages.length>1;
  /* onay penceresi yok — direkt yeni tahta */
  if(scratch)exitScratch();
  if(presenting)exitPresent();
  if(window.LIB)LIB.fresh();               // mevcut çalışmayı mühürle, yeni oturum aç
  doc={title:'Adsız Tahta',pages:[]};seedDoc();cur=0;selection=[];
  invalidateLayout();renderPages();renderLayers();updCornerPg();updUndoBtns();
  setTool('smart');fit();toast('Yeni boş tahta hazır ✨')});
$('#undoBtn').addEventListener('click',undo);$('#redoBtn').addEventListener('click',redo);
$('#zoomIn').addEventListener('click',()=>setZoom(view.s*1.2));
$('#zoomOut').addEventListener('click',()=>setZoom(view.s/1.2));
$('#zoomLbl').addEventListener('click',fit);
$('#pgPrev').addEventListener('click',()=>gotoPage(cur-1));
$('#pgNext').addEventListener('click',()=>gotoPage(cur+1));

/* ============================================================
   KLAVYE
============================================================ */
window.addEventListener('keydown',e=>{
  if(recAction)return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(e.code==='Space'&&!spaceHeld){spaceHeld=true;stage.style.cursor='grab';e.preventDefault();return}
  if(e.ctrlKey||e.metaKey){
    if(k==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
    if(k==='y'){e.preventDefault();redo();return}
    if(k==='g'){e.preventDefault();groupSelection();return}
    if(k==='d'){e.preventDefault();duplicateSelection();return}
    if(k==='a'){e.preventDefault();selection=page().layers.flatMap(l=>l.locked||!l.visible?[]:l.objects);redraw();renderSelInfo();return}
    if(k==='k'){e.preventDefault();openPalette();return}
    return;
  }
  const act=Object.keys(KEYMAP).find(a=>KEYMAP[a]===k);
  if(act){
    e.preventDefault();
    const tm={select:1,smart:1,ball:1,fountain:1,pencil:1,hl:1,eraser:1,text:1,line:1,compass:1};
    if(tm[act]){setTool(act);return}
    if(act==='shapes'){toggleShapePop();return}
    if(act==='fit'){fit();return}
    if(act==='randColor'){randPenColor();return}
    if(act==='solve'){solveClick();return}
  }
  if(k==='x'&&!Object.values(KEYMAP).includes('x')){swapPen();return}
  if(['1','2','3','4','5','6'].includes(k)&&!Object.values(KEYMAP).includes(k)){applyFav(+k-1);return}
  if(k==='+'||k==='=')setZoom(view.s*1.2);
  if(k==='-')setZoom(view.s/1.2);
  if(k==='Delete'||k==='Backspace')deleteSelection();
  if(k==='PageUp'||(presenting&&k==='ArrowLeft'))gotoPage(cur-1);
  if(k==='PageDown'||(presenting&&k==='ArrowRight'))gotoPage(cur+1);
  if(k==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
  if(presenting&&k==='s'){toggleSpot();markPr()}
  if(k==='Escape'){
    if(palWrap.classList.contains('on')){closePalette();return}
    if(ringOpen){closeRing(false);return}
    hideMiniBar();
    if(presenting)exitPresent();
    else if(scratch)exitScratch();
    else if(focusMode)toggleFocus(false);
    else{if(tool==='solve')setTool('smart');selection=[];lineDraft=null;compassDraft=null;solveDraft=null;redraw();drawOverlay()}}
  if(k==='?')openSettings('keys');
});
window.addEventListener('keyup',e=>{if(e.code==='Space'){spaceHeld=false;stage.style.cursor=tool==='pan'?'grab':'default'}});


/* ============================================================
   YÜZEN MİNİ ARAÇ ÇUBUĞU (PDF #2)
   Çizim bitince ya da fare sağ tık (kısa) — imlecin yanında belirir
============================================================ */
const miniBar=$('#miniBar');let miniTimer=null;
function buildMiniBar(){
  miniBar.innerHTML='';
  SWATCH.slice(0,5).forEach(c=>{const b=document.createElement('button');b.className='msw'+(c.toLowerCase()===penColor.toLowerCase()?' on':'');b.style.background=c;b.title=c;
    b.addEventListener('click',()=>{penColor=c;buildSwatches();buildMiniBar();armMini()});miniBar.appendChild(b)});
  const sep=()=>{const s=document.createElement('span');s.className='msep';miniBar.appendChild(s)};
  sep();
  const rng=document.createElement('input');rng.type='range';rng.min=1;rng.max=40;rng.step=.5;rng.value=penSize;rng.title='Kalınlık';
  rng.addEventListener('input',e=>{penSize=+e.target.value;$('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize;armMini()});
  rng.addEventListener('pointerdown',()=>clearTimeout(miniTimer));
  miniBar.appendChild(rng);
  sep();
  const mk=(html,title,fn)=>{const b=document.createElement('button');b.className='mbtn';b.title=title;b.innerHTML=html;
    b.addEventListener('click',()=>{fn();armMini()});miniBar.appendChild(b)};
  mk('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>','Geri al (Ctrl+Z)',undo);
  mk('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 21h8"/><path d="m15 5 4 4L7.5 20.5 2 22l1.5-5.5L15 5z"/></svg>','Kurşun kalem (P)',()=>{setTool('pencil');hideMiniBar()});
  mk('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>','Silgi (E)',()=>{setTool('eraser');hideMiniBar()});
  if(favs.length){sep();
    favs.slice(0,3).forEach((f,i)=>{const b=document.createElement('button');b.className='msw';b.style.background=f.color;b.title=f.name+' · '+f.size+'px';
      b.addEventListener('click',()=>{applyFav(i);buildMiniBar();armMini()});miniBar.appendChild(b)});
  }
}
function showMiniBar(cx,cy){
  if(!S.miniBar||presenting||ringOpen)return;
  buildMiniBar();
  miniBar.classList.add('on');
  const w=miniBar.offsetWidth,h=miniBar.offsetHeight;
  miniBar.style.left=clamp(cx+16,10,innerWidth-w-10)+'px';
  miniBar.style.top=clamp(cy+20,64,innerHeight-h-10)+'px';
  requestAnimationFrame(()=>miniBar.classList.add('vis'));
  armMini();
}
function armMini(){clearTimeout(miniTimer);miniTimer=setTimeout(hideMiniBar,2800)}
function hideMiniBar(){clearTimeout(miniTimer);if(!miniBar.classList.contains('on'))return;
  miniBar.classList.remove('vis');setTimeout(()=>miniBar.classList.remove('on'),200)}
miniBar.addEventListener('pointerenter',()=>clearTimeout(miniTimer));
miniBar.addEventListener('pointerleave',armMini);

/* ============================================================
   HAREKET HALKASI (PDF #11-12)
   Sağ tuşu BASILI TUT → araçlar imlecin etrafında · bırakınca seçilir
   Kısa sağ tık (fare) → mini araç çubuğu · Stylus yan tuşu → önceki kalem
============================================================ */
const gring=$('#gring');let ringOpen=false,ringHot=-1,rightState=null;
const RING=[
 {n:'Akıllı',ic:'smart',fn:()=>setTool('smart')},
 {n:'Kalem',ic:'ball',fn:()=>morphRingToPens()},
 {n:'Fosforlu',ic:'hl',fn:()=>setTool('hl')},
 {n:'Silgi',ic:'eraser',fn:()=>setTool('eraser')},
 {n:'Metin',ic:'text',fn:()=>setTool('text')},
 {n:'Şekiller',ic:'shapes',fn:()=>morphRingToShapes()},
 {n:'Geri Al',svg:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',fn:undo},
 {n:'Seçim',ic:'select',fn:()=>setTool('select')},
];
/* Sekil carki: matematik figurlerinin en cok kullanilan 11'i + Tumu.
   Arac carki ile AYNI halka, AYNI kayarak-secme mantigi. */
const RING_SHAPES=(()=>{
  const pick=['Kare','Daire','Üçgen','Elips','Koordinat','Sayı Doğrusu','Parabol','Açı','Çember + r','Küp','Silindir'];
  const items=pick.map(nm=>{const f=SHAPES.find(x=>x[0]===nm);return f?{n:f[0],shp:f[1],
    fn:()=>insertShape(f[1])}:null}).filter(Boolean);
  items.push({n:'Tümü…',svg:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/></svg>',
    fn:()=>toggleShapePop()});
  return items;
})();
let ringItems=RING, ringMode='tools';
/* Kalem çarkı: yalnızca sonradan eklenen özel kalemler burada yaşar (CPENS).
   Şekil çarkı ile AYNI halka, AYNI kayarak-seçme mantığı. */
/* Kalem çarkı: 10 profesyonel kalem — CPENS ile birebir eşleşir */
const _PI=(d)=>'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
const RING_PENS=[
 {n:'Akıllı ⭐',svg:_PI('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><circle cx="19" cy="18" r="2.4" fill="currentColor" stroke="none"/>'),fn:()=>applyCPen(0)},
 {n:'Tükenmez',svg:_PI('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>'),fn:()=>applyCPen(1)},
 {n:'Dolma',svg:_PI('<path d="m14 6 7 7-9.4 9.4a1 1 0 0 1-.7.3H4.5a.5.5 0 0 1-.5-.5v-6.4a1 1 0 0 1 .3-.7L14 6z"/><path d="M14 6l3.5-3.5a2.1 2.1 0 0 1 3 3L17 9"/>'),fn:()=>applyCPen(2)},
 {n:'Kurşun',svg:_PI('<path d="M13 4l7 7L8 23H1v-7L13 4z"/><path d="M13 4l3-3 7 7-3 3"/>'),fn:()=>applyCPen(3)},
 {n:'Fosforlu',svg:_PI('<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>'),fn:()=>applyCPen(4)},
 {n:'Keçeli',svg:_PI('<path d="M12 2v6M8 8h8l1 8H7l1-8z"/><path d="M9 16v5h6v-5"/>'),fn:()=>applyCPen(5)},
 {n:'Teknik',svg:_PI('<path d="M12 2L2 22h20L12 2z"/><path d="M12 9v7"/>'),fn:()=>applyCPen(6)},
 {n:'Kaligrafi',svg:_PI('<path d="M4 20c4-1 6-3 7-6l5-9 4 4-9 5c-3 1-5 3-6 7z"/><path d="M14 7l3 3"/>'),fn:()=>applyCPen(7)},
 {n:'Fırça',svg:_PI('<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>'),fn:()=>applyCPen(8)},
 {n:'Air Brush',svg:_PI('<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="7" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r=".8" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r=".8" fill="currentColor" stroke="none"/>'),fn:()=>applyCPen(9)},
];
function morphRingToPens(){
  ringMode='pens';fillRing(RING_PENS);
  ringOpen=true;ringHot=-1;gring.classList.add('on');markRingHot();
}
function fillRing(items){
  gring.querySelectorAll('.gwheel,.gseg').forEach(x=>x.remove());
  ringItems=items;
  const N=items.length;
  const R=N>9?192:(N<5?150:170), R0=Math.round(R*.34);   // dış yarıçap / göbek
  const wrap=document.createElement('div');wrap.className='gwheel';
  wrap.style.width=wrap.style.height=(R*2)+'px';
  wrap.style.margin=(-R)+'px 0 0 '+(-R)+'px';
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+(R*2)+' '+(R*2));
  svg.setAttribute('width',R*2);svg.setAttribute('height',R*2);
  svg.setAttribute('class','gpie');
  const seg=Math.PI*2/N,gap=0.017,P=(r,a)=>[R+Math.cos(a)*r,R+Math.sin(a)*r];
  items.forEach((it,i)=>{
    const mid=-Math.PI/2+i*seg,a0=mid-seg/2+gap,a1=mid+seg/2-gap;
    const[x0,y0]=P(R-2,a0),[x1,y1]=P(R-2,a1),[x2,y2]=P(R0+5,a1),[x3,y3]=P(R0+5,a0);
    const path=document.createElementNS(NS,'path');
    path.setAttribute('d','M'+x0+' '+y0+' A'+(R-2)+' '+(R-2)+' 0 0 1 '+x1+' '+y1+' L'+x2+' '+y2+' A'+(R0+5)+' '+(R0+5)+' 0 0 0 '+x3+' '+y3+' Z');
    path.setAttribute('class','gwedge');path.dataset.i=i;
    path.addEventListener('click',ev=>{ev.stopPropagation();ringHot=i;closeRing(true)});
    svg.appendChild(path)});
  const hub=document.createElementNS(NS,'circle');
  hub.setAttribute('cx',R);hub.setAttribute('cy',R);hub.setAttribute('r',R0-5);hub.setAttribute('class','ghub');svg.appendChild(hub);
  const hub2=document.createElementNS(NS,'circle');
  hub2.setAttribute('cx',R);hub2.setAttribute('cy',R);hub2.setAttribute('r',R0-12);hub2.setAttribute('class','ghub2');svg.appendChild(hub2);
  wrap.appendChild(svg);
  const DOTC=['#3B82F6','#F59E0B','#8B5CF6','#EF4444','#EC4899','#16A34A','#0EA5E9','#F97316','#14B8A6','#A855F7','#64748B','#DC2626'];
  items.forEach((it,i)=>{
    const mid=-Math.PI/2+i*seg,rr=(R0+R)/2+7;
    const d=document.createElement('div');d.className='gseg';d.dataset.i=i;
    d.style.left=(R+Math.cos(mid)*rr)+'px';d.style.top=(R+Math.sin(mid)*rr)+'px';
    const ic=it.shp?`<svg width="22" height="22" viewBox="0 0 100 100"><path d="${polysToPath(it.shp)}" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`:(it.svg||I[it.ic]||'');
    d.innerHTML=ic+'<span>'+it.n+'</span><i style="background:'+DOTC[i%DOTC.length]+'"></i>';
    wrap.appendChild(d)});
  gring.appendChild(wrap);
}
function buildRing(){fillRing(RING);ringMode='tools'}
function morphRingToShapes(){
  ringMode='shapes';fillRing(RING_SHAPES);
  ringOpen=true;ringHot=-1;gring.classList.add('on');markRingHot();
}
function openRing(x,y){buildRing();ringOpen=true;ringHot=-1;
  gring.style.left=clamp(x,205,innerWidth-205)+'px';
  gring.style.top=clamp(y,215,innerHeight-215)+'px';
  gring.classList.add('on');markRingHot()}
function closeRing(run){
  const h=ringHot,items=ringItems;ringHot=-1;
  const fn=run&&h>=0?items[h].fn:null;
  gring.classList.remove('on');ringOpen=false;ringMode='tools';
  if(fn)fn();
  if(ringOpen){/* morphRingToShapes yeniden acti: acik kalsin */}
}
function ringMove(e){if(!ringOpen)return;
  const gx=parseFloat(gring.style.left),gy=parseFloat(gring.style.top);
  const dx=e.clientX-gx,dy=e.clientY-gy,d=Math.hypot(dx,dy);
  if(d<44)ringHot=-1;
  else{let a=Math.atan2(dy,dx)+Math.PI/2;if(a<0)a+=Math.PI*2;
    ringHot=Math.round(a/(Math.PI*2)*ringItems.length)%ringItems.length}
  markRingHot()}
function markRingHot(){
  $$('#gring .gseg').forEach(b=>b.classList.toggle('hot',+b.dataset.i===ringHot));
  $$('#gring .gwedge').forEach(w=>w.classList.toggle('hot',+w.dataset.i===ringHot))}
function rightPress(e){
  hideMiniBar();
  rightState={x:e.clientX,y:e.clientY,pen:e.pointerType==='pen',timer:null};
  if(S.ring)rightState.timer=setTimeout(()=>{if(rightState)openRing(rightState.x,rightState.y)},200);
}
function rightRelease(e){
  const st=rightState;rightState=null;if(!st)return;
  clearTimeout(st.timer);
  if(ringOpen){closeRing(true);return}
  if(st.pen){swapPen();return}                 // stylus yan tuşu: önceki kaleme dön (PDF #10)
  showMiniBar(e.clientX,e.clientY);            // fare kısa sağ tık: mini araç çubuğu
}
stage.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('pointermove',e=>{if(ringOpen&&(ringMode==='shapes'||ringMode==='pens'))ringMove(e)},{capture:true});
window.addEventListener('pointerdown',e=>{
  if(ringOpen&&(ringMode==='shapes'||ringMode==='pens')){
    e.preventDefault();e.stopPropagation();
    if(e.button===0)closeRing(true);else closeRing(false);
  }
},{capture:true});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&ringOpen&&(ringMode==='shapes'||ringMode==='pens'))closeRing(false)});

/* ============================================================
   AKILLI KALEM GEÇİŞİ (PDF #10) — X tuşu / stylus yan tuşu
============================================================ */
function swapPen(){
  const PENS=['smart','ball','fountain','pencil','hl'];
  if(!PENS.includes(prevPen))prevPen='ball';
  const target=prevPen;
  setTool(target);
  toast('Kalem: '+(TOOLNAMES[target]||target));
}

/* ============================================================
   KOMUT PALETİ + EVRENSEL ARAMA (PDF #7-8) — Ctrl+K
   Komutlar · araçlar · temalar · sayfa adları · sayfa içi metinler
============================================================ */
const palWrap=$('#palWrap'),palInp=$('#palInp'),palList=$('#palList');
let palIdx=0,palItems=[];
function PAL_CMDS(){return[
 {t:'Yeni sayfa',sec:'Eylem',fn:()=>$('#pgAdd').click()},
 {t:'Sayfayı çoğalt',sec:'Eylem',fn:()=>dupPage(cur)},
 {t:'PDF / Görsel içe aktar',sec:'Eylem',fn:()=>$('#importBtn').click()},
 {t:'Dışa aktar — PNG · PDF · .notis',sec:'Eylem',fn:()=>expDlg.showModal()},
 {t:'Rastgele renge geç',k:(KEYMAP.randColor||'').toUpperCase(),sec:'Eylem',fn:()=>randPenColor()},
 {t:'Çözüm modu — soruyu taşı',k:(KEYMAP.solve||'').toUpperCase(),sec:'Eylem',fn:solveClick},
 {t:'Tahtayı temizle',sec:'Eylem',fn:wipeBoard},
 {t:'Sığdır',k:'0',sec:'Eylem',fn:fit},
 {t:'Paneli aç/kapat — Sayfalar · Katmanlar',sec:'Eylem',fn:()=>$('#sideBtn').click()},
 {t:'Önceki kaleme dön',k:'X',sec:'Eylem',fn:swapPen},
 {t:'Ayarlar',sec:'Eylem',fn:()=>openSettings()},
 {t:'Klavye kısayolları',k:'?',sec:'Eylem',fn:()=>openSettings('keys')},
 {t:'Şekiller & Semboller',k:(KEYMAP.shapes||'').toUpperCase(),sec:'Araç',fn:()=>toggleShapePop()},
 {t:'Seçim aracı',k:(KEYMAP.select||'').toUpperCase(),sec:'Araç',fn:()=>setTool('select')},
 {t:'Akıllı kalem',k:(KEYMAP.smart||'').toUpperCase(),sec:'Araç',fn:()=>setTool('smart')},
 {t:'Tükenmez kalem',k:(KEYMAP.ball||'').toUpperCase(),sec:'Araç',fn:()=>setTool('ball')},
 {t:'Dolma kalem',k:(KEYMAP.fountain||'').toUpperCase(),sec:'Araç',fn:()=>setTool('fountain')},
 {t:'Kurşun kalem',k:(KEYMAP.pencil||'').toUpperCase(),sec:'Araç',fn:()=>setTool('pencil')},
 {t:'Fosforlu kalem',k:(KEYMAP.hl||'').toUpperCase(),sec:'Araç',fn:()=>setTool('hl')},
 {t:'Akıllı silgi',k:(KEYMAP.eraser||'').toUpperCase(),sec:'Araç',fn:()=>setTool('eraser')},
 {t:'Metin',k:(KEYMAP.text||'').toUpperCase(),sec:'Araç',fn:()=>setTool('text')},
 {t:'Akıllı cetvel',k:(KEYMAP.line||'').toUpperCase(),sec:'Araç',fn:()=>setTool('line')},
 {t:'Dijital pergel',k:(KEYMAP.compass||'').toUpperCase(),sec:'Araç',fn:()=>setTool('compass')},
 {t:'Lazer işaretçi',sec:'Araç',fn:()=>setTool('laser')},
 ...THEMES.map(([id,n])=>({t:'Tema: '+n,sec:'Tema',fn:()=>{document.documentElement.dataset.theme=id;renderThemes()}})),
]}
function palSearchDoc(q){
  const out=[];
  doc.pages.forEach((p,i)=>{
    if(p.name.toLocaleLowerCase('tr').includes(q))
      out.push({t:p.name,sub:'Sayfaya git · '+(i+1),sec:'Sayfalar',fn:()=>gotoPage(i)});
    p.layers.forEach(l=>l.objects.forEach(o=>{
      if(o.type==='text'&&out.length<26&&o.text.toLocaleLowerCase('tr').includes(q)){
        const s=o.text.replace(/\n/g,' ');
        out.push({t:'\u201C'+(s.length>46?s.slice(0,46)+'…':s)+'\u201D',sub:p.name+' · Sayfa '+(i+1),sec:'Metinler',
          fn:()=>{gotoPage(i);selection=[o];setTool('select');redraw();renderSelInfo()}});
      }}));
  });
  return out;
}
function palRender(){
  const q=palInp.value.trim().toLocaleLowerCase('tr');
  let items=PAL_CMDS();
  if(q)items=items.filter(c=>c.t.toLocaleLowerCase('tr').includes(q)).concat(palSearchDoc(q));
  palItems=items.slice(0,30);
  palIdx=clamp(palIdx,0,Math.max(0,palItems.length-1));
  palList.innerHTML='';let lastSec='';
  palItems.forEach((c,i)=>{
    if(c.sec&&c.sec!==lastSec){lastSec=c.sec;const h=document.createElement('div');h.className='psec';h.textContent=c.sec;palList.appendChild(h)}
    const b=document.createElement('button');b.className='pitem'+(i===palIdx?' sel':'');
    b.innerHTML=`<span class="pi"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span><span style="min-width:0"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.t)}</div>${c.sub?`<div class="psub">${esc(c.sub)}</div>`:''}</span>${c.k?`<span class="pk">${c.k}</span>`:''}`;
    b.addEventListener('click',()=>palRun(i));
    b.addEventListener('pointerenter',()=>{palIdx=i;palList.querySelectorAll('.pitem').forEach((x,j)=>x.classList.toggle('sel',j===i))});
    palList.appendChild(b)});
  if(!palItems.length)palList.innerHTML='<div style="padding:18px;text-align:center;color:var(--mut);font-size:12px;font-weight:700">Sonuç bulunamadı</div>';
  const sel=palList.querySelector('.pitem.sel');if(sel)sel.scrollIntoView({block:'nearest'});
}
function palRun(i){const c=palItems[i];closePalette();if(c)c.fn()}
function openPalette(){palWrap.classList.add('on');palInp.value='';palIdx=0;palRender();setTimeout(()=>palInp.focus(),30)}
function closePalette(){palWrap.classList.remove('on')}
palInp.addEventListener('input',()=>{palIdx=0;palRender()});
palInp.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();palIdx=Math.min(palIdx+1,palItems.length-1);palRender()}
  else if(e.key==='ArrowUp'){e.preventDefault();palIdx=Math.max(palIdx-1,0);palRender()}
  else if(e.key==='Enter'){e.preventDefault();palRun(palIdx)}
  else if(e.key==='Escape'){e.preventDefault();closePalette()}
  e.stopPropagation();
});
palWrap.addEventListener('pointerdown',e=>{if(e.target===palWrap)closePalette()});
$('#palBtn').addEventListener('click',openPalette);

/* ============================================================
   OPSİYONLAR — motorlar (hepsi kapalı başlar, ayarlardan açılır)
============================================================ */
/* --- Odaklı Yazım Modu: kalem değince arayüz kenara çekilir --- */
let fwT=null,azBase=null,azRaf=0,azOutT=null;
function fwEnter(){if(!S.focusWrite)return;clearTimeout(fwT);document.body.classList.add('fwrite')}
function fwLeave(){if(!document.body.classList.contains('fwrite'))return;clearTimeout(fwT);
  fwT=setTimeout(()=>document.body.classList.remove('fwrite'),650)} // vuruşlar arasında titremesin

/* --- Otomatik Odak Zoom: yazarken kamera hafif yaklaşır, bitince döner --- */
function azTo(to,dur,done){cancelAnimationFrame(azRaf);const f={...view},t0=performance.now();
  const step=()=>{const t=clamp((performance.now()-t0)/dur,0,1),e2=1-Math.pow(1-t,3);
    view.x=f.x+(to.x-f.x)*e2;view.y=f.y+(to.y-f.y)*e2;view.s=f.s+(to.s-f.s)*e2;
    $('#zoomLbl').textContent=Math.round(view.s*100)+'%';redraw();drawOverlay();
    if(t<1)azRaf=requestAnimationFrame(step);else done&&done()};
  azRaf=requestAnimationFrame(step)}
function azIn(e){if(!S.autoZoom||presenting)return;clearTimeout(azOutT);if(azBase)return;
  azBase={...view};const r=stage.getBoundingClientRect(),cx=e.clientX-r.left,cy=e.clientY-r.top,k=1.07;
  azTo({s:view.s*k,x:cx-(cx-view.x)*k,y:cy-(cy-view.y)*k},300)}
function azOut(){if(!azBase)return;clearTimeout(azOutT);
  azOutT=setTimeout(()=>{if(!azBase)return;const b=azBase;azBase=null;azTo(b,420)},600)}
function azCancel(){cancelAnimationFrame(azRaf);clearTimeout(azOutT);azBase=null}

/* --- Pen DNA: en çok kullanılan araç+renk+kalınlık+opaklık öğrenilir --- */
let DNA={},dnaSaveT=null;
try{DNA=JSON.parse(localStorage.getItem('notis_dna')||'{}')}catch{}
function dnaRecord(o){if(!S.penDNA||!o||!['smart','ball','fountain','pencil','hl'].includes(o.tool))return;
  const k=o.tool+'|'+o.color+'|'+o.size+'|'+o.opacity;DNA[k]=(DNA[k]||0)+1;
  if(!dnaSaveT)dnaSaveT=setTimeout(()=>{dnaSaveT=null;try{localStorage.setItem('notis_dna',JSON.stringify(DNA))}catch{}},1200)}
function dnaApply(announce){const e=Object.entries(DNA).sort((a,b)=>b[1]-a[1])[0];
  if(!e||e[1]<12){if(announce)toast('Pen DNA öğreniyor — biraz daha çiz, imzanı tanıyacak 🧬');return}
  const[t,c2,s,op]=e[0].split('|');setTool(t);penColor=c2;penSize=+s;penOp=+op;
  $('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize;
  $('#opRng').value=Math.round(penOp*100);$('#opOut').textContent=Math.round(penOp*100);
  buildSwatches();toast('Pen DNA: imza kalemin hazır 🧬')}

/* --- Memory Canvas: yazılan metinleri hatırlar, tekrarında önerir --- */
let MEMTX=[],memSug=null;
try{MEMTX=JSON.parse(localStorage.getItem('notis_memtx')||'[]')}catch{}
const memHint=document.createElement('div');memHint.id='memHint';document.body.appendChild(memHint);
function memStore(t){if(!S.memCanvas)return;t=t.trim();if(t.length<4)return;
  MEMTX=MEMTX.filter(x=>x!==t);MEMTX.unshift(t);if(MEMTX.length>300)MEMTX.length=300;
  try{localStorage.setItem('notis_memtx',JSON.stringify(MEMTX))}catch{}}
function memCheck(){
  if(!S.memCanvas)return memHide();
  const v=textEdit.value.trim().toLowerCase();
  if(v.length<3)return memHide();
  const hit=MEMTX.find(t=>t.toLowerCase().startsWith(v)&&t.toLowerCase()!==v);
  if(!hit)return memHide();
  memSug=hit;
  memHint.innerHTML='💭 <b>Bunu daha önce kullanmıştın</b><span class="mt">'+hit.replace(/</g,'&lt;').slice(0,64)+'</span>';
  const r=textEdit.getBoundingClientRect();
  memHint.style.display='flex';
  memHint.style.left=clamp(r.left,8,innerWidth-360)+'px';memHint.style.top=(r.bottom+8)+'px';
}
function memHide(){memHint.style.display='none';memSug=null}
memHint.addEventListener('pointerdown',e=>{e.preventDefault();
  if(memSug){textEdit.value=memSug;textEdit.dispatchEvent(new Event('input'))}
  memHide();textEdit.focus()});
textEdit.addEventListener('input',memCheck);
textEdit.addEventListener('keydown',e=>{if(e.key==='Escape')memHide()});

/* --- Çark Kalemleri (özel): yalnızca hareket halkasındaki kalem çarkında yaşarlar ---
   Fable 5 kalibrasyonu · 1920×1080 @ %125 Windows ölçeği referans alınmıştır.
   stab = ipli sabitleyici yarıçapı (ekran pikseline ölçeklenir), predict = yetişme kuyruğu (ms/px). */
const CPV=3; // kalibrasyon sürümü — eski kayıtlı değerler geri yüklenmez (v3: 10 kalemlik yeni set)
/* ============================================================
   BRUSH ENGINE ÇEKİRDEĞİ — motor sabitleri (spesifikasyon)
   Aktif kullanılanlar: minWidth/maxWidth (render sınırı),
   pressureCurve & velocityCurve (tepki eğrileri),
   smoothingIterations (geçiş tavanı), velocityFiltering (oneEuro EMA),
   strokeInterpolation (catmull ≈ ikinci derece orta-nokta eğrisi).
============================================================ */
const ENGINE_DEFAULTS={
 minWidth:0.35, maxWidth:18, pressureCurve:1.65, velocityCurve:0.72,
 smoothingIterations:3, catmullRom:true, adaptiveSampling:true,
 adaptivePrediction:true, adaptivePressure:true, gpuInterpolation:true,
 bezierCorrection:true, edgeAntialiasing:true, subPixelRendering:true,
 floatingPointPrecision:true, pressureFiltering:"kalman",
 velocityFiltering:"oneEuro", strokeInterpolation:"catmull", quality:"ultra"};
/* 10 çark kalemi — verilen varsayılanlarla. Alan haritası:
   width=size · op=opacity · stab=stabilizer · predict=prediction(ms) ·
   taperS/E=start/endTaper · thin=thinning · tx=texture · gr=grain ·
   ns=noise · wet=wetness · sp=spacing · simP=simulatePressure */
const CPENS=[
 {n:'Akıllı Kalem',d:'⭐ Varsayılan — dengeli basınç+hız, doğal el yazısı hissi',color:'#000000',
  width:2.2,op:1,pressure:.30,velocity:.38,streamline:.84,smoothing:.78,stab:.62,predict:10,
  thin:.42,simP:true,taperS:6,taperE:10,tx:.02,ns:.01,gr:0,wet:.05,flow:.96,sp:.10,rot:'velocity'},
 {n:'Tükenmez',d:'Sabit ve net çizgi — hızlı not için ideal',
  width:2.2,op:1,pressure:.12,velocity:.10,streamline:.92,smoothing:.86,stab:.82,predict:5,
  thin:.08,simP:false,taperS:2,taperE:2,tx:0,ns:0,gr:0,wet:0,flow:1,sp:.05},
 {n:'Dolma',d:'Basınca duyarlı mürekkep — akışkan, ıslak uç',
  width:2.4,op:1,pressure:.65,velocity:.28,streamline:.80,smoothing:.70,stab:.55,predict:8,
  thin:.70,simP:true,taperS:12,taperE:16,tx:.05,ns:.02,gr:.04,wet:.30,flow:1,sp:.08},
 {n:'Kurşun',d:'Grafit dokusu — eskiz ve gölgeleme',
  width:2.2,op:.92,pressure:.32,velocity:.15,streamline:.72,smoothing:.60,stab:.45,predict:6,
  thin:.18,simP:true,taperS:0,taperE:0,tx:.40,ns:.18,gr:.42,wet:0,flow:.82,sp:.14},
 {n:'Fosforlu',d:'Yarı saydam vurgu — metin üstünde çarpar (multiply)',
  width:12,op:.28,pressure:0,velocity:0,streamline:.96,smoothing:.94,stab:.92,predict:4,
  thin:0,simP:false,taperS:0,taperE:0,tx:0,ns:0,gr:0,wet:0,flow:1,sp:.02,blend:'multiply'},
 {n:'Keçeli',d:'Dolgun keçe ucu — poster ve şema',
  width:4,op:1,pressure:.15,velocity:.12,streamline:.84,smoothing:.74,stab:.68,predict:5,
  thin:.10,simP:true,taperS:0,taperE:0,tx:.12,gr:.08,ns:.04,wet:.05,flow:.96,sp:.06},
 {n:'Teknik',d:'⭐ Mutlak sabit kalınlık — teknik çizim ve cetvel işi',
  width:1.6,op:1,pressure:0,velocity:0,streamline:.98,smoothing:.96,stab:.94,predict:2,
  thin:0,simP:false,taperS:0,taperE:0,tx:0,ns:0,gr:0,wet:0,flow:1,sp:.04},
 {n:'Kaligrafi',d:'45° keski ucu — yöne göre incelen zarif hat',
  width:4,op:1,pressure:.75,velocity:.35,streamline:.76,smoothing:.66,stab:.55,predict:8,
  thin:.78,simP:true,taperS:0,taperE:0,tx:.04,ns:0,gr:0,wet:.15,flow:1,sp:.06,rot:'angle'},
 {n:'Fırça',d:'Basınçla açılan kıl fırça — boya hissi',
  width:6,op:.95,pressure:.82,velocity:.30,streamline:.70,smoothing:.60,stab:.42,predict:8,
  thin:.85,simP:true,taperS:0,taperE:0,tx:.18,gr:.12,ns:.06,wet:.22,flow:.92,sp:.07},
 {n:'Air Brush',d:'Püskürtme sprey — yumuşak gölge ve hava',
  width:22,op:.10,pressure:.30,velocity:0,streamline:1,smoothing:1,stab:1,predict:2,
  thin:0,simP:true,taperS:0,taperE:0,tx:.50,gr:.32,ns:.42,wet:0,flow:.40,sp:.01,
  spray:true,sprayR:18,sprayD:.72},
];
/* (eski 3 kalemlik set kaldırıldı — 10 kalemlik yeni set yukarıda) */
function applyCPen(i){const p=CPENS[i];if(!p)return;
  setTool('smart');curCP=p;          // sıra önemli: setTool curCP'yi sıfırlar, sonra atarız
  penSize=p.width;penOp=p.op;
  if(p.color){penColor=p.color;if(typeof buildSwatches==='function')buildSwatches()}
  $('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize;
  $('#opRng').value=Math.round(penOp*100);$('#opOut').textContent=Math.round(penOp*100);
  const tn=$('#toolName');if(tn)tn.textContent=p.n;
  toast(p.n+' aktif — çark kalemi')}
function renderCPenSet(){const box=$('#cpenSet');if(!box)return;box.innerHTML='';
  const F=[['width','Kalınlık (px)','num',.5,40,.1],['op','Opaklık','pct'],
    ['pressure','Pressure (basınç etkisi)','pct'],['velocity','Velocity (hız etkisi)','pct'],
    ['streamline','Streamline','pct'],['smoothing','Smoothing','pct'],['stab','Stabilizer','pct'],
    ['predict','Prediction (ms)','num',0,40,1],
    ['thin','Thinning (incelme genliği)','pct'],['flow','Flow (akış)','pct'],
    ['taperS','Taper Start (px)','num',0,30,1],['taperE','Taper End (px)','num',0,30,1],
    ['tx','Texture (doku)','pct'],['gr','Grain (tanecik)','pct'],['ns','Noise (pürüz)','pct'],
    ['wet','Wetness (ıslaklık)','pct'],['sp','Spacing (aralık)','pct'],
    ['sprayR','Sprey Yarıçapı (px)','num',4,60,1],['sprayD','Sprey Yoğunluğu','pct']];
  CPENS.forEach((p,pi)=>{
    const h=document.createElement('div');h.className='set-sec-t';h.style.marginTop=pi?'18px':'4px';
    h.textContent='Kalem '+(pi+1)+' — '+p.n;box.appendChild(h);
    const dd=document.createElement('div');dd.className='d';dd.style.margin='0 0 8px';dd.textContent=p.d;box.appendChild(dd);
    for(const[key,lbl,kind,mn,mx,st]of F){
      if(!(key in p))continue;   // yalnız bu kalemin tanımladığı alanlar (ör. sprey alanları sadece Air Brush)
      const row=document.createElement('div');row.className='set-row';
      const left=document.createElement('div');left.innerHTML=`<div class="t">${lbl}</div>`;
      const val=document.createElement('div');val.className='d';left.appendChild(val);row.appendChild(left);
      let inp;
      if(kind==='pct'){
        inp=document.createElement('input');inp.type='range';inp.min=0;inp.max=100;inp.value=Math.round(p[key]*100);
        val.textContent='%'+inp.value;
        inp.addEventListener('input',()=>{p[key]=+inp.value/100;val.textContent='%'+inp.value;
          if(curCP===p&&key==='op'){penOp=p.op;$('#opRng').value=inp.value;$('#opOut').textContent=inp.value}
          saveOpts()});
      }else{
        inp=document.createElement('input');inp.type='number';inp.className='num';inp.min=mn;inp.max=mx;inp.step=st;inp.value=p[key];
        inp.addEventListener('change',()=>{p[key]=clamp(+inp.value||p[key],mn,mx);inp.value=p[key];
          if(curCP===p&&key==='width'){penSize=p.width;$('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize}
          saveOpts()});
      }
      row.appendChild(inp);box.appendChild(row);
    }
    const st2=document.createElement('div');st2.className='d';st2.style.margin='6px 0 0';
    st2.textContent=(pi===0?'⭐ Varsayılan · ':'')+'Brush Engine: '+ENGINE_DEFAULTS.quality+' · '+ENGINE_DEFAULTS.strokeInterpolation+' interpolasyon · '+ENGINE_DEFAULTS.velocityFiltering+' hız süzgeci · Anti Alias: Ultra · Palm Rejection: Açık';box.appendChild(st2);
  });
}

/* --- Tahta Stilleri (opsiyon): sonsuz tahtanın zemini — varsayılan Klasik --- */
const BOARDS=[
 ['classic','Klasik','Orijinal krem tuval','#FBF8F0'],
 ['chalk','Kara Tahta','Yeşil tebeşir tahtası — klasik his, toz dokusu','#2C4A3B'],
 ['mathgrid','Matematik Tahtası','Koyu zemin, kareli ızgara — geometri ve grafik','#14171D'],
 ['dotnote','Noktalı Defter','Krem zemin, noktalı düzen — minimal ve sade','#F5F1E4'],
 ['linednote','Çizgili Defter','Sarı defter, kırmızı kenar — not ve yazı','#F7EFC8'],
];
function boardBg(){const b=BOARDS.find(x=>x[0]===(S.board||'classic'));return b?b[3]:'#FBF8F0'}
function drawBoardStyle(c,x0,y0,x1,y1){
  const st=S.board||'classic';if(st==='classic')return;
  c.save();c.lineWidth=1;
  const lines=(step,color,horiz,vert)=>{c.strokeStyle=color;c.beginPath();
    if(vert)for(let x=Math.floor(x0/step)*step;x<=x1;x+=step){c.moveTo(x,y0);c.lineTo(x,y1)}
    if(horiz)for(let y=Math.floor(y0/step)*step;y<=y1;y+=step){c.moveTo(x0,y);c.lineTo(x1,y)}
    c.stroke()};
  if(st==='chalk'){
    /* Tebeşir tozu: hücre koordinatından türetilen deterministik serpinti —
       her karede aynı yerde durur, kaydırınca doğal biçimde akar. */
    c.fillStyle='rgba(244,246,240,.05)';const cell=56;
    for(let gx=Math.floor(x0/cell)*cell;gx<=x1;gx+=cell)
      for(let gy=Math.floor(y0/cell)*cell;gy<=y1;gy+=cell){
        const hsh=(((gx*73856093)^(gy*19349663))>>>0);if(hsh%5)continue;
        c.beginPath();c.arc(gx+hsh%53,gy+hsh%37,(hsh%3)*.5+.45,0,7);c.fill()}
  }else if(st==='mathgrid'){
    lines(24,'rgba(150,170,205,.09)',true,true);
    lines(120,'rgba(150,170,205,.17)',true,true);
  }else if(st==='dotnote'){
    c.fillStyle='rgba(96,86,64,.30)';
    for(let x=Math.floor(x0/26)*26;x<=x1;x+=26)
      for(let y=Math.floor(y0/26)*26;y<=y1;y+=26){c.beginPath();c.arc(x,y,1.05,0,7);c.fill()}
  }else if(st==='linednote'){
    lines(34,'rgba(70,110,170,.22)',true,false);
    if(x0<=64&&64<=x1){c.strokeStyle='rgba(198,60,60,.5)';c.lineWidth=1.5;
      c.beginPath();c.moveTo(64,y0);c.lineTo(64,y1);c.stroke()}
  }
  c.restore()}
function applyBoard(id){
  const prev=S.board||'classic';S.board=id;
  const dark=x=>x==='chalk'||x==='mathgrid';
  /* Zeki mürekkep: koyu tahtaya geçince varsayılan siyah kalem tebeşir beyazına döner (ve tersi) */
  if(dark(id)&&!dark(prev)&&penColor==='#111827'){penColor='#F3F2EA';buildSwatches()}
  if(!dark(id)&&dark(prev)&&penColor==='#F3F2EA'){penColor='#111827';buildSwatches()}
  renderBoards();saveOpts();redraw()}
function renderBoards(){const el=$('#boardGrid');if(!el)return;el.innerHTML='';
  const cur=S.board||'classic';
  const PREV={
   classic:'background:#FBF8F0',
   chalk:'background:#2C4A3B;box-shadow:inset 0 0 0 3px #7A4F26,inset 0 0 0 4px #9A6B36',
   mathgrid:'background:#14171D;background-image:linear-gradient(rgba(150,170,205,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(150,170,205,.2) 1px,transparent 1px);background-size:9px 9px',
   dotnote:'background:#F5F1E4;background-image:radial-gradient(rgba(96,86,64,.45) 1px,transparent 1.3px);background-size:8px 8px',
   linednote:'background:#F7EFC8;background-image:linear-gradient(rgba(70,110,170,.35) 1px,transparent 1px);background-size:100% 8px;border-left:3px solid rgba(198,60,60,.65)'};
  BOARDS.forEach(([id,n,d])=>{const b=document.createElement('button');
    b.className='brd'+(cur===id?' on':'');
    b.innerHTML='<span class="bprev" style="'+PREV[id]+'"></span><span class="bw"><span class="bt">'+n+'</span><span class="bd">'+d+'</span></span>';
    b.addEventListener('click',()=>applyBoard(id));el.appendChild(b)})}

/* --- Opsiyonlar + kalem varsayılanları: bağla ve kalıcı sakla --- */
const OPTKEYS={oSnap:'smartSnap',oFocusW:'focusWrite',oAutoZoom:'autoZoom',oLiving:'livingInk',oPenDNA:'penDNA',oMemCanvas:'memCanvas',oEdge:'edgeScroll'};
function saveOpts(){try{localStorage.setItem('notis_opts',JSON.stringify({
  smartSnap:S.smartSnap,focusWrite:S.focusWrite,autoZoom:S.autoZoom,livingInk:S.livingInk,
  penDNA:S.penDNA,memCanvas:S.memCanvas,compact:S.compact,edgeScroll:S.edgeScroll,esD:2,cornerUI:S.cornerUI,board:S.board,defColor:S.defColor,defOp:S.defOp,DEF,DEFV,CPV,
  S2:{...S},                                   // TÜM ayarlar — hiçbir ayar unutulmaz
  KEYS:{...KEYMAP},                            // klavye kısayolları
  theme:document.documentElement.dataset.theme||'',
  CP:CPENS.map(p=>({width:p.width,op:p.op,pressure:p.pressure,velocity:p.velocity,
    streamline:p.streamline,smoothing:p.smoothing,stab:p.stab,predict:p.predict,taperS:p.taperS,taperE:p.taperE}))}))}catch{}}
function loadOpts(){try{const o=JSON.parse(localStorage.getItem('notis_opts')||'null');if(!o)return;
  for(const k of['smartSnap','focusWrite','autoZoom','livingInk','penDNA','memCanvas','compact','cornerUI','board','defColor','defOp'])
    if(o[k]!==undefined)S[k]=o[k];
  if(S.defColor==='#243B6B')S.defColor='#111827'; // eski varsayılan lacivert → siyah geçişi
  if(o.S2)for(const k in o.S2){if(k==='edgeScroll')continue;if(k in S)S[k]=o.S2[k]}  // genel ayar geri yüklemesi
  if(o.KEYS)for(const a in KEYDEF)if(a in o.KEYS)KEYMAP[a]=o.KEYS[a];                 // klavye kısayolları
  if(o.theme)document.documentElement.dataset.theme=o.theme;                          // tema
  if(o.esD===2)S.edgeScroll=!!o.edgeScroll;   // yalnız yeni sürümde kaydedilen tercihi uygula (eski v19'un istem dışı 'açık' kaydı yok sayılır)
  if(o.DEF&&o.DEFV===DEFV)Object.assign(DEF,o.DEF);
  if(o.CP&&o.CPV===CPV)o.CP.forEach((c,i)=>{if(CPENS[i])Object.assign(CPENS[i],c)})}catch{}}
for(const[id,key]of Object.entries(OPTKEYS)){$('#'+id).addEventListener('change',e=>{
  S[key]=e.target.checked;saveOpts();redraw();
  if(key==='focusWrite'&&!S.focusWrite){clearTimeout(fwT);document.body.classList.remove('fwrite')}
  if(key==='autoZoom'&&!S.autoZoom)azCancel();
  if(key==='memCanvas'&&!S.memCanvas)memHide();
  if(key==='penDNA'&&S.penDNA)dnaApply(true);
})}
function syncOptsUI(){
  for(const[id,key]of Object.entries(OPTKEYS))$('#'+id).checked=!!S[key];
  $('#sCompact').checked=!!S.compact;
  $('#sCorner').checked=!!S.cornerUI;$('#corner').style.display=S.cornerUI?'flex':'none';
  $('#dColor').value=S.defColor||'#111827';
  $('#dOp').value=Math.round((S.defOp??1)*100);$('#dOpOut').textContent='%'+Math.round((S.defOp??1)*100);
  for(const[k,id]of Object.entries(DEFIDS))$(id).value=DEF[k];
}
$('#dColor').addEventListener('input',e=>{S.defColor=e.target.value;penColor=S.defColor;buildSwatches();saveOpts()});
$('#dOp').addEventListener('input',e=>{S.defOp=+e.target.value/100;penOp=S.defOp;
  $('#dOpOut').textContent='%'+e.target.value;$('#opRng').value=e.target.value;$('#opOut').textContent=e.target.value;saveOpts()});
/* Kompakt arayüz: solak düzeniyle uyumlu çalışır (satır genişliği birlikte hesaplanır) */
function applyCompact(){document.body.classList.toggle('compact',!!S.compact);
  if($('#sLeft').checked)document.body.style.gridTemplateColumns='1fr '+(S.compact?'46px':'58px')+' auto';
  resize()}
$('#sCompact').addEventListener('change',e=>{S.compact=e.target.checked;applyCompact();saveOpts()});
/* Fabrika değerleri — Sıfırla için parse anında dondurulur (loadOpts'tan önce) */
const FACTORY={
 S:{smartSnap:false,focusWrite:false,autoZoom:false,livingInk:false,penDNA:false,memCanvas:false,
    edgeScroll:false,compact:true,cornerUI:false,board:'classic',defColor:'#111827',defOp:1},
 DEF:{...DEF},
 CP:CPENS.map(p=>({width:p.width,op:p.op,pressure:p.pressure,velocity:p.velocity,
   streamline:p.streamline,smoothing:p.smoothing,stab:p.stab,predict:p.predict,taperS:p.taperS,taperE:p.taperE}))};
$('#setSave').addEventListener('click',()=>{saveOpts();if(typeof savePK==='function')savePK();setDlg.close()});
$('#setReset').addEventListener('click',()=>{
  /* onay penceresi yok — direkt sıfırla */
  try{localStorage.removeItem('notis_opts')}catch{}
  Object.assign(S,FACTORY.S);Object.assign(DEF,FACTORY.DEF);
  FACTORY.CP.forEach((c,i)=>{if(CPENS[i])Object.assign(CPENS[i],c)});
  penColor=S.defColor;penOp=S.defOp;
  if(typeof pkFactoryReset==='function')pkFactoryReset();
  syncOptsUI();renderCPenSet();renderBoards();applyCompact();buildSwatches();
  document.body.classList.remove('fwrite');redraw()});


/* ============================================================
   KALEM STÜDYOSU v18 — kartlar, per-kalem ayarlar, canlı önizleme
   Foto uyarlaması: kalem kartları + Kalınlık / Basınç / Opaklık /
   Stabilizasyon / Akış / Uç Yapısı + çizilebilir canlı önizleme.
============================================================ */
const PK_STABV=[0,.15,.32,.55], PK_STABL=['Kapalı','Düşük','Orta','Yüksek'];
const PK_NIBL=['Sivri','İnce','Dolgun','Keski'];
const PK_META={
 smart:{n:'Akıllı Kalem',sub:()=>'Varsayılan',c:'#FFB454'},
 ball:{n:'Tükenmez',sub:()=>DEF.ball+' px',c:'#5B8CFF'},
 fountain:{n:'Dolma Kalem',sub:()=>DEF.fountain+' px',c:'#A78BFA'},
 pencil:{n:'Kurşun Kalem',sub:()=>'2B',c:'#B9C0CF'},
 hl:{n:'Fosforlu Kalem',sub:()=>'Yumuşak',c:'#2DD4BF'}};
let PCFG={
 smart:{op:1,press:80,stab:3,flow:95,nib:0},
 ball:{op:1,press:55,stab:1,flow:100,nib:1},
 fountain:{op:1,press:85,stab:2,flow:90,nib:0},
 pencil:{op:.92,press:70,stab:1,flow:85,nib:2},
 hl:{op:.6,press:0,stab:2,flow:100,nib:3}};
let PKCUSTOM=[];        // özel kalemler: {id,name,base,color,size,op,press,stab,flow,nib}
let selPen='smart';     // kartlarda seçili kalem
let livePen='smart';    // strok motorunu besleyen kalem
const PK_FACTORY=JSON.parse(JSON.stringify(PCFG));
function pkCfg(id){return PCFG[id]||PKCUSTOM.find(x=>x.id===id)}
function pkBase(id){return PCFG[id]?id:((PKCUSTOM.find(x=>x.id===id)||{}).base||'ball')}
function pkSizeOf(id){return PCFG[id]?DEF[id]:((pkCfg(id)||{}).size??2.2)}
function pkSetSize(id,v){if(PCFG[id])DEF[id]=v;else{const c=pkCfg(id);if(c)c.size=v}}
function pkColorOf(id){return PK_META[id]?PK_META[id].c:((pkCfg(id)||{}).color||'#FFB454')}
function pkNameOf(id){return PK_META[id]?PK_META[id].n:((pkCfg(id)||{}).name||'Kalem')}
/* strok motoru bu üçünü okur */
function pkFlowK(){const c=pkCfg(livePen);return c?(c.flow??100)/100:1}
function pkPressK(){const c=pkCfg(livePen);return c?(c.press??80)/100:.8}
function pkNibK(){const c=pkCfg(livePen);return (pkCfg(livePen)||{}).nib??1}
/* setTool bildirir: dahili kaleme geçilince stüdyo o kalemi izler */
function pkOnTool(t){
  if(!PCFG[t])return;
  livePen=t;selPen=t;
  const c=PCFG[t];
  S.pressure=(c.press??80)>0;S.stab=PK_STABV[c.stab??2]??S.stab;
  const sp=$('#sPressure');if(sp)sp.checked=S.pressure;
  const st=$('#sStab');if(st)st.value=Math.round(S.stab*100);
  if(setDlg&&setDlg.open){renderPenCards();syncPenUI();pkRender()}
}
function pkApply(id){
  const c=pkCfg(id);if(!c)return;
  const base=pkBase(id);
  setTool(base);            // motor + üst çubuk kuruldu
  selPen=id;livePen=id;
  if(!PCFG[id]&&c.color&&base!=='hl'){penColor=c.color;buildSwatches()}
  penSize=pkSizeOf(id);penOp=c.op??1;
  S.pressure=(c.press??80)>0;S.stab=PK_STABV[c.stab??2]??S.stab;
  $('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize;
  $('#opRng').value=Math.round(penOp*100);$('#opOut').textContent=Math.round(penOp*100);
  renderPenCards();syncPenUI();pkRender();savePK();
}
/* --- kartlar --- */
const PK_STROKE='M14 36 C 26 8, 40 6, 48 21 S 64 46, 86 12';
function pkCardSVG(color){return '<svg class="strk" viewBox="0 0 100 50" fill="none" style="filter:drop-shadow(0 0 7px '+color+'99)">'
 +'<path d="'+PK_STROKE+'" stroke="'+color+'" stroke-width="4.4" stroke-linecap="round"/>'
 +'<path d="'+PK_STROKE+'" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".28"/></svg>'}
function renderPenCards(){
  const el=$('#penCards');if(!el)return;el.innerHTML='';
  const chev='<span class="chev"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>';
  const mk=(id,name,sub,color,custom)=>{
    const b=document.createElement('div');b.className='pk-cd'+(selPen===id?' on':'');
    b.innerHTML=pkCardSVG(color)+'<div class="nm">'+name+'</div><div class="sb">'+sub+'</div>'
      +(selPen===id?'<span class="chk">✓</span>':chev)
      +(custom?'<button class="del" title="Kalemi sil">✕</button>':'');
    b.addEventListener('click',e=>{if(e.target.closest('.del'))return;pkApply(id)});
    if(custom)b.querySelector('.del').addEventListener('click',e=>{e.stopPropagation();
      /* onay yok — direkt sil */
      PKCUSTOM=PKCUSTOM.filter(x=>x.id!==id);
      if(selPen===id){selPen='smart';livePen='smart'}
      renderPenCards();syncPenUI();pkRender();savePK()});
    el.appendChild(b)};
  for(const[id,m]of Object.entries(PK_META))mk(id,m.n,m.sub(),m.c);
  PKCUSTOM.forEach(cp=>mk(cp.id,cp.name,(PK_META[cp.base]||{}).n||'Özel',cp.color,true));
  const nb=document.createElement('div');nb.className='pk-cd new';
  nb.innerHTML='<span class="plus">+</span><div class="nm">Yeni Kalem</div><div class="sb">Seçiliden türet</div>';
  nb.addEventListener('click',()=>{
    if(PKCUSTOM.length>=4)return alert('En fazla 4 özel kalem oluşturabilirsin.\nYer açmak için bir kartın üzerine gelip ✕ ile sil.');
    const nm=prompt('Yeni kalemin adı:','Kalemim');if(!nm)return;
    const s=pkCfg(selPen)||{};
    PKCUSTOM.push({id:'cp'+uid(),name:nm.slice(0,14),base:pkBase(selPen),color:penColor,
      size:pkSizeOf(selPen),op:s.op??1,press:s.press??80,stab:s.stab??2,flow:s.flow??95,nib:s.nib??1});
    pkApply(PKCUSTOM.at(-1).id)});
  el.appendChild(nb);
}
/* --- kontrolleri seçili kaleme eşitle --- */
function syncPenUI(){
  const c=pkCfg(selPen);if(!c||!$('#pkSize'))return;
  const sz=pkSizeOf(selPen);
  $('#pkSize').value=sz;$('#pkSizeOut').textContent=String(sz).replace('.',',')+' px';
  $('#pkPress').value=c.press??80;$('#pkPressOut').textContent='%'+(c.press??80);
  $('#pkOp').value=Math.round((c.op??1)*100);$('#pkOpOut').textContent='%'+Math.round((c.op??1)*100);
  $('#pkFlow').value=c.flow??95;$('#pkFlowOut').textContent='%'+(c.flow??95);
  $('#pkStabOut').textContent=PK_STABL[c.stab??2];
  $$('#pkStab button').forEach((b,i)=>b.classList.toggle('on',i===(c.stab??2)));
  $('#pkNibOut').textContent=PK_NIBL[c.nib??1];
  $$('#pkNibs .pk-nib').forEach((b,i)=>b.classList.toggle('on',i===(c.nib??1)));
  $('#pkCap').textContent=pkNameOf(selPen)+' ile yazı deneyimini test et — üzerine çizebilirsin';
}
/* --- kontrol bağlamaları --- */
function pkLiveSync(){ // seçili kalem aynı zamanda aktifse üst çubuğu da güncelle
  if(livePen!==selPen)return;const c=pkCfg(selPen);if(!c)return;
  penSize=pkSizeOf(selPen);penOp=c.op??1;
  $('#sizeRng').value=penSize;$('#sizeOut').textContent=penSize;
  $('#opRng').value=Math.round(penOp*100);$('#opOut').textContent=Math.round(penOp*100);
  S.pressure=(c.press??80)>0;S.stab=PK_STABV[c.stab??2]??S.stab;
  const sp=$('#sPressure');if(sp)sp.checked=S.pressure;
  const st=$('#sStab');if(st)st.value=Math.round(S.stab*100);
}
if($('#pkSize')){
  $('#pkSize').addEventListener('input',e=>{const v=Math.round(clamp(+e.target.value,.5,40)*10)/10;
    pkSetSize(selPen,v);$('#pkSizeOut').textContent=String(v).replace('.',',')+' px';
    pkLiveSync();renderPenCards();pkRender();savePK()});
  $('#pkPress').addEventListener('input',e=>{const c=pkCfg(selPen);c.press=+e.target.value;
    $('#pkPressOut').textContent='%'+c.press;pkLiveSync();pkRender();savePK()});
  $('#pkOp').addEventListener('input',e=>{const c=pkCfg(selPen);c.op=+e.target.value/100;
    $('#pkOpOut').textContent='%'+e.target.value;pkLiveSync();pkRender();savePK()});
  $('#pkFlow').addEventListener('input',e=>{const c=pkCfg(selPen);c.flow=+e.target.value;
    $('#pkFlowOut').textContent='%'+c.flow;pkRender();savePK()});
  $$('#pkStab button').forEach((b,i)=>b.addEventListener('click',()=>{const c=pkCfg(selPen);c.stab=i;
    pkLiveSync();syncPenUI();pkRender();savePK()}));
  $$('#pkNibs .pk-nib').forEach((b,i)=>b.addEventListener('click',()=>{const c=pkCfg(selPen);c.nib=i;
    syncPenUI();pkRender();savePK()}));
  $$('.pk-step').forEach(b=>b.addEventListener('click',()=>{const t=$('#'+b.dataset.t);if(!t)return;
    const st=+t.step||1;t.value=(+t.value)+(+b.dataset.d)*st;t.dispatchEvent(new Event('input'))}));
  $('#pkMore').addEventListener('click',()=>$('#pkMore').closest('.pk-extra').classList.toggle('open'));
}
/* --- Canlı Önizleme: uygulamanın GERÇEK kalem motoruyla çizer —
       drawStroke + matisInk hattı; kurşun kalem dokusu, fosforlu, hepsi birebir --- */
const pkCvEl=$('#pkCv');const pkCtx=pkCvEl?pkCvEl.getContext('2d'):null;
let pkUser=[],pkLive=null;   // css-px ham noktalar
function pkSizeCv(){if(!pkCvEl)return;const r=pkCvEl.getBoundingClientRect();if(!r.width)return;
  pkCvEl.width=Math.round(r.width*DPR);pkCvEl.height=Math.round(r.height*DPR);pkRender()}
function pkDemoPts(w,h){const pts=[],N=84;
  for(let i=0;i<=N;i++){const t=i/N;
    pts.push({x:w*.11+t*w*.78,
      y:h*.52-Math.sin(t*Math.PI*1.85+.35)*h*.29*(1-t*.2),
      p:.32+.58*Math.sin(Math.min(1,t*1.06)*Math.PI),t:i*9})}
  return pts}
function pkBuildStroke(raw){
  const cfg=pkCfg(selPen)||{},base=pkBase(selPen);
  const o={type:'stroke',tool:base,color:pkColorOf(selPen),
    size:Math.max(.5,pkSizeOf(selPen))*(cfg.nib===2?1.15:1),
    opacity:(cfg.op??1)*((cfg.flow??100)/100),
    points:raw.map(pt=>({...pt}))};
  const passes=cfg.stab??2;                        // stabilizasyon → yumuşatma geçişleri
  for(let n=0;n<passes;n++){const np=[o.points[0]];
    for(let i=0;i<o.points.length-1;i++){const a=o.points[i],b=o.points[i+1];
      np.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25,p:a.p,t:a.t},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75,p:b.p,t:b.t})}
    np.push(o.points.at(-1));o.points=np}
  if(base==='smart')matisInk(o);                   // gerçek mürekkep dinamiği
  const k=clamp((cfg.press??80)/80,0,1.75);        // basınç hassasiyeti
  for(const pt of o.points)pt.p=.6+((pt.p??.6)-.6)*k;
  if(cfg.nib===3)for(const pt of o.points)pt.p=.62;// keski: sabit kalın hat
  if(cfg.nib===0){                                  // sivri: uçlarda incelt
    const pts=o.points,n=pts.length,T=Math.max(6,o.size*2.4);let acc=0;
    for(let i=0;i<n-1;i++){pts[i].p*=clamp(acc/T,.12,1);acc+=Math.hypot(pts[i+1].x-pts[i].x,pts[i+1].y-pts[i].y);if(acc>=T)break}
    acc=0;
    for(let i=n-1;i>0;i--){pts[i].p*=clamp(acc/T,.12,1);acc+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);if(acc>=T)break}}
  return o}
function pkRender(){
  if(!pkCtx||!pkCvEl.width)return;
  pkCtx.setTransform(1,0,0,1,0,0);pkCtx.clearRect(0,0,pkCvEl.width,pkCvEl.height);
  pkCtx.setTransform(DPR,0,0,DPR,0,0);
  const old=INK.z;INK.z=1;
  const W=pkCvEl.width/DPR,H=pkCvEl.height/DPR;
  if(!pkUser.length&&!pkLive)drawStroke(pkCtx,pkBuildStroke(pkDemoPts(W,H)));
  for(const s of pkUser)drawStroke(pkCtx,pkBuildStroke(s));
  if(pkLive)drawStroke(pkCtx,pkBuildStroke(pkLive));
  INK.z=old}
if(pkCvEl){
  pkCvEl.addEventListener('pointerdown',e=>{e.preventDefault();
    try{pkCvEl.setPointerCapture(e.pointerId)}catch{}
    const r=pkCvEl.getBoundingClientRect();
    pkLive=[{x:e.clientX-r.left,y:e.clientY-r.top,p:e.pressure||.5,t:performance.now()}];
    const mv=ev=>{const rr=pkCvEl.getBoundingClientRect();
      const pt={x:ev.clientX-rr.left,y:ev.clientY-rr.top,p:ev.pressure||.5,t:performance.now()};
      const lp=pkLive.at(-1);if(Math.hypot(pt.x-lp.x,pt.y-lp.y)>.6)pkLive.push(pt);pkRender()};
    const up=()=>{pkCvEl.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);
      if(pkLive&&pkLive.length>2){pkUser.push(pkLive);if(pkUser.length>14)pkUser.shift()}
      pkLive=null;pkRender()};
    pkCvEl.addEventListener('pointermove',mv);window.addEventListener('pointerup',up)});
  $('#pkClear').addEventListener('click',()=>{pkUser=[];pkLive=null;pkRender()});
  new ResizeObserver(()=>pkSizeCv()).observe(pkCvEl);
}
/* --- pane başlıkları --- */
const PANE_META={
 pens:['Kalem Ayarları','Kalem deneyimini kendi stiline göre özelleştir.'],
 draw:['Çizim Ayarları','Mürekkep ve çizgi davranışını ayarla.'],
 align:['Hizalama','Izgara, yapışma ve akıllı kılavuzlar.'],
 present:['Sunum','Lazer, spot ışığı ve sayfa geçişi.'],
 keys:['Klavye','Kısayolları kendine göre düzenle.'],
 ui:['Arayüz','Tema, tahta stili ve görünüm.'],
 opts:['Opsiyonlar','Deneysel özellikler — dilediğini aç.'],
 storage:['Depolama','Yedekleme, kütüphane ve alan yönetimi.']};
function updPaneHead(s){const m=PANE_META[s];if(!m)return;
  $('#paneT').textContent=m[0];$('#paneD').textContent=m[1];
  const t=$$('.set-tab').find(x=>x.dataset.s===s);
  $('#paneIco').innerHTML=t?t.querySelector('svg').outerHTML:''}
/* --- kalıcılık + fabrika --- */
function savePK(){try{localStorage.setItem('notis_pk1',JSON.stringify({PCFG,PKCUSTOM}))}catch{}}
function loadPK(){try{const o=JSON.parse(localStorage.getItem('notis_pk1')||'null');if(!o)return;
  if(o.PCFG)for(const k in PCFG)if(o.PCFG[k])Object.assign(PCFG[k],o.PCFG[k]);
  if(Array.isArray(o.PKCUSTOM))PKCUSTOM=o.PKCUSTOM.slice(0,4)}catch{}}
function pkFactoryReset(){
  PCFG=JSON.parse(JSON.stringify(PK_FACTORY));PKCUSTOM=[];selPen='smart';livePen='smart';
  try{localStorage.removeItem('notis_pk1')}catch{}
  pkUser=[];pkLive=null;renderPenCards();syncPenUI();pkRender()}
/* v20 göçü — TEK SEFER: önceki sürümde izinsiz değişen kalem değerlerini at,
   v18 fabrika varsayılanlarına dön. Kullanıcının ÖZEL kalemleri (PKCUSTOM) korunur. */
try{if(!localStorage.getItem('notis_mig_v20')){
  const _o=JSON.parse(localStorage.getItem('notis_opts')||'null');
  if(_o){delete _o.DEF;delete _o.CP;delete _o.esD;delete _o.edgeScroll;localStorage.setItem('notis_opts',JSON.stringify(_o))}
  const _pk=JSON.parse(localStorage.getItem('notis_pk1')||'null');
  if(_pk){delete _pk.PCFG;localStorage.setItem('notis_pk1',JSON.stringify(_pk))}
  localStorage.setItem('notis_mig_v20','1')}}catch{}
loadPK();

/* ============================================================
   KÜTÜPHANE & DEPOLAMA — sessiz otomatik kayıt (IndexedDB)
   · Her çizim/sayfa/PDF/görsel çalışması arka planda loglanır
   · Hiçbir kayıt bildirimi gösterilmez
   · Çekmece → Kütüphane sekmesinden aç / temelli sil
============================================================ */
const LIB=(()=>{
  const DBN='notis_lib';let db=null,tmr=null,sessId=uid(),kind='board',lastJson='';
  /* EXE'de veriler tarayıcıya değil DİSKE yazılır (C:\Notis\Data) —
     yerel sunucunun /kv ve /lib uçları. Tarayıcıda IndexedDB kullanılır. */
  const SRV=!!window.__NOTIS_SRV;
  const api=async(u,body)=>{const r=await fetch(u,body!==undefined
    ?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
    if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
  const AS=()=>{try{return localStorage.getItem('notis_autosave')!=='0'}catch{return true}};
  function open(){return new Promise((res,rej)=>{if(db)return res(db);
    const rq=indexedDB.open(DBN,1);
    rq.onupgradeneeded=()=>{const d=rq.result;
      if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'id'});
      if(!d.objectStoreNames.contains('data'))d.createObjectStore('data',{keyPath:'id'})};
    rq.onsuccess=()=>{db=rq.result;res(db)};rq.onerror=()=>rej(rq.error)})}
  const tx=(st,mode,fn)=>open().then(d=>new Promise((res,rej)=>{
    const t=d.transaction(st,mode);const r=fn(t.objectStore(st));
    t.oncomplete=()=>res(r&&'result'in r?r.result:undefined);t.onerror=()=>rej(t.error)}));
  const hasContent=()=>doc.pages.some(p=>p.bg||p.layers.some(l=>l.objects.length))||doc.pages.length>1;
  function serialize(){return JSON.stringify({title:doc.title,cur,
    pages:doc.pages.map(p=>({...p,_undo:[],_redo:[],bgImg:undefined}))})}
  function thumb(){try{const p=doc.pages[0];const w=220,h=Math.max(80,Math.min(300,Math.round(w*p.h/p.w)));
    const c=document.createElement('canvas');c.width=w;c.height=h;renderPageTo(c,p,w/p.w);
    return c.toDataURL('image/jpeg',.72)}catch{return ''}}
  async function saveNow(){
    if(kind==='board'&&localStorage.getItem('notis_board_save')!=='1')return; // tahta kaydı opsiyonel (varsayılan kapalı)
    if(!AS()||scratch||!hasContent())return;
    try{
      const meta={id:sessId,title:doc.title||'Adsız Tahta',updatedAt:Date.now(),
        pages:doc.pages.length,kind,thumb:thumb()};
      if(SRV){
        /* İNCE YAMA: değişmeyen sayfa görselleri '@keep' — 50MB yerine KB'lar gider */
        const thin=JSON.stringify({title:doc.title,cur,
          pages:doc.pages.map(p=>({...p,_undo:[],_redo:[],bgImg:undefined,bg:p.bg?'@keep':null}))});
        if(thin===lastJson)return;lastJson=thin;
        const r=await fetch('/lib/patch',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({meta,thinJson:thin})});
        if(!r.ok)throw new Error('patch '+r.status);
      }else{
        const json=serialize();if(json===lastJson)return;lastJson=json;
        await tx('data','readwrite',s=>s.put({id:sessId,json}));
        await tx('meta','readwrite',s=>s.put(meta))}
      fillPane(); // depolama paneli açıksa sayıları tazele (sessiz)
    }catch(e){console.warn('kütüphane kaydı:',e)}
  }
  function dirty(){if(!AS())return;clearTimeout(tmr);
    tmr=setTimeout(()=>{
      /* PERFORMANS: kalem kâğıttayken / nesne sürüklenirken ağır serileştirme
         çalışmasın — kayıt, el kalkana kadar sessizce ertelenir (takılma yok). */
      if(live||drag||pinch||panning){dirty();return}
      saveNow();
    },1200)}
  function fresh(){saveNow();sessId=uid();kind='board';lastJson='';if(typeof bgqReset==='function')bgqReset()}
  function tag(k,name){kind=k;
    if(name&&(doc.title==='Adsız Tahta'||!doc.title))doc.title=name.replace(/\.(pdf|png|jpe?g|webp|gif)$/i,'');
    dirty()}
  const all=()=>SRV?api('/lib'):tx('meta','readonly',s=>s.getAll()).then(a=>(a||[]).sort((x,y)=>y.updatedAt-x.updatedAt));
  async function openWork(id){
    await saveNow();  // mevcut çalışmayı sessizce mühürle
    let rec,meta;
    if(SRV){try{const r=await api('/lib/get?id='+encodeURIComponent(id));rec={json:r.json};meta=r.meta}catch{rec=null}}
    else{rec=await tx('data','readonly',s=>s.get(id));meta=await tx('meta','readonly',s=>s.get(id))}
    if(!rec||!rec.json)return toast('Kayıt açılamadı');
    const o=JSON.parse(rec.json);
    doc={title:o.title||'Adsız Tahta',pages:o.pages||[]};
    if(!doc.pages.length)return toast('Kayıt boş');
    if(typeof bgqReset==='function')bgqReset();
    doc.pages.forEach(p=>{p._undo=[];p._redo=[];
      p.bgImg=null;p._bgLoad=false;             // tembel: görünen sayfa gelince yüklenecek
      p.layers.forEach(l=>l.objects.forEach(hydrate))});
    sessId=id;kind=(meta&&meta.kind)||'board';
    lastJson=SRV?JSON.stringify({title:doc.title,cur:clamp(o.cur||0,0,doc.pages.length-1),
      pages:doc.pages.map(p=>({...p,_undo:[],_redo:[],bgImg:undefined,bg:p.bg?'@keep':null}))}):rec.json;
    selection=[];curLayerId=doc.pages[0].layers[0].id;
    invalidateLayout();cur=clamp(o.cur||0,0,doc.pages.length-1);
    renderPages();renderLayers();gotoPage(cur);updUndoBtns();
    /* Panel açıkken sığdırma dar alana göre hesaplanıyordu; önce paneli kapat,
       tuval tam genişliğe ulaşınca sığdır — sağda boşluk kalmaz. */
    if(document.body.classList.contains('side-open'))$('#sideBtn').click();
    requestAnimationFrame(()=>{resize();fit()});
    toast('“'+doc.title+'” kütüphaneden açıldı — kaldığın yerden devam');
    if(kind==='pdf'&&doc.pages[0]&&doc.pages[0].bg){
      const probe=new Image();
      probe.onload=()=>{if(probe.naturalWidth<2000)
        toast('⚠ Bu kayıt ESKİ düşük çözünürlükte ('+probe.naturalWidth+'p). En iyi kalite için: kaydı sil, PDF\'i yeniden yükle.',6500)};
      probe.src=doc.pages[0].bg;
    }
  }
  /* Dış kayıt: mevcut belgeye dokunmadan doğrudan kütüphaneye yaz (PDF içe aktarımı) */
  async function saveExternal(title,pages,knd,fixedId,thumbOverride){
    const id=fixedId||uid();
    const json=JSON.stringify({title,cur:0,
      pages:pages.map(p=>({...p,_undo:[],_redo:[],bgImg:undefined}))});
    let th=thumbOverride||'';
    try{if(!th){const p=pages[0];const w=220,h=Math.max(80,Math.min(300,Math.round(w*p.h/p.w)));
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const g=c.getContext('2d');g.fillStyle='#FBF8F0';g.fillRect(0,0,w,h);
      if(p.bgImg&&p.bgImg.complete)g.drawImage(p.bgImg,0,0,w,h);
      else if(p.bg){const im=new Image();
        await new Promise(r=>{im.onload=r;im.onerror=r;im.src=p.bg});
        g.drawImage(im,0,0,w,h)}
      th=c.toDataURL('image/jpeg',.72)}}catch{}
    const meta={id,title:title||'PDF',updatedAt:Date.now(),pages:pages.length,kind:knd||'pdf',thumb:th};
    if(SRV)await api('/lib/put',{meta,json});
    else{await tx('data','readwrite',s=>s.put({id,json}));
      await tx('meta','readwrite',s=>s.put(meta))}
    renderLib();fillPane();
    return id;
  }
  async function del(id){
    if(SRV)await api('/lib/del',{id});
    else{await tx('data','readwrite',s=>s.delete(id));
      await tx('meta','readwrite',s=>s.delete(id))}
    if(id===sessId){sessId=uid();lastJson=''}
    renderLib();fillPane();
  }
  async function wipe(){
    if(SRV)await api('/lib/clear',{});
    else{await tx('data','readwrite',s=>s.clear());
      await tx('meta','readwrite',s=>s.clear())}
    sessId=uid();lastJson='';renderLib();fillPane();toast('Kütüphane temizlendi');
  }
  const BADGE={pdf:'PDF',image:'GÖRSEL',board:'TAHTA'};
  const fmtDate=t=>{const d=new Date(t),M=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return d.getDate()+' '+M[d.getMonth()]+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
  async function renderLib(){
    const el=$('#libList');if(!el)return;
    const items=await all();
    $('#libCount').textContent=items.length?items.length+' kayıt':'';
    el.innerHTML='';
    if(!items.length){el.innerHTML='<div class="lib-empty">Henüz kayıt yok.<br>Bir PDF veya görsel yükle — çalışmaların buraya sessizce kaydedilir.</div>';return}
    for(const m of items){
      const card=document.createElement('div');card.className='lib-card';
      card.innerHTML=(m.thumb?'<img src="'+m.thumb+'" alt="">':'<div style="height:104px;background:#FBF8F0"></div>')+
        '<span class="lc-badge">'+(BADGE[m.kind]||'TAHTA')+'</span>'+
        '<button class="lc-del" title="Temelli sil"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>'+
        '<div class="lc-meta"><div class="lc-t">'+esc(m.title||'Adsız')+(m.id===sessId?' · <span style="color:var(--acc)">şu an açık</span>':'')+'</div>'+
        '<div class="lc-d">'+fmtDate(m.updatedAt)+' · '+m.pages+' sayfa'+(m.res?' · <b style="color:'+(m.res>=2000?'var(--acc)':'#EF4444')+'">'+m.res+'p</b>':'')+'</div></div>';
      card.querySelector('.lc-del').addEventListener('click',e=>{e.stopPropagation();
        del(m.id);toast('“'+(m.title||'Adsız')+'” temelli silindi')});
      card.addEventListener('click',()=>openWork(m.id));
      el.appendChild(card);
    }
  }
  async function fillPane(){
    const t=$('#stUsageT');if(!t||!setDlg.open)return;
    try{
      if(SRV){
        const u=await api('/usage');
        $('#stLibT').textContent=u.count+' kayıtlı çalışma';
        t.textContent=(u.bytes/1048576).toFixed(2)+' MB kullanılıyor · Disk deposu: '+(u.writable?'AKTİF ✓':'⚠ YAZILAMIYOR');
        $('#stUsageBar').style.width=Math.max(1.5,Math.min(100,u.bytes/1048576/500*100))+'%';
        $('#stUsageD').textContent='Konum: '+u.path+' — veriler diskte dosya olarak saklanır';
        return;
      }
      if(window.__NOTIS_EXE){ // exe'de ama sunucu yok: görünür uyarı
        t.textContent='⚠ Disk deposuna bağlanılamadı — kayıtlar kalıcı OLMAYABİLİR';
        $('#stUsageD').textContent='Lütfen uygulamayı yeniden başlat.';return}
      const est=await(navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():null);
      const items=await all();
      $('#stLibT').textContent=items.length+' kayıtlı çalışma';
      if(est&&est.quota){
        const mb=x=>(x/1048576).toFixed(1);
        const pct=Math.min(100,est.usage/est.quota*100);
        t.textContent=mb(est.usage)+' MB kullanılıyor';
        $('#stUsageBar').style.width=Math.max(1.5,pct)+'%';
        $('#stUsageD').textContent='Toplam alan: '+(est.quota/1073741824).toFixed(1)+' GB · %'+pct.toFixed(1)+' dolu';
      }else t.textContent='Alan bilgisi bu tarayıcıda desteklenmiyor';
    }catch{t.textContent='Alan bilgisi alınamadı'}
  }
  function exit(){
    clearTimeout(tmr);
    Promise.resolve(saveNow()).finally(()=>{
      setDlg.close();
      if(window.notisExit){notisExit();return}   // EXE: pencereyi yerli yoldan kapat
      window.close();
      setTimeout(()=>toast('Her şey kaydedildi ✓ — pencereyi güvenle kapatabilirsin'),350);
    });
  }
  /* kapanışta son durumu mühürle (sessiz) */
  window.addEventListener('beforeunload',()=>{clearTimeout(tmr);saveNow()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(tmr);saveNow()}});
  window.addEventListener('pagehide',()=>{clearTimeout(tmr);saveNow()});
  return{dirty,fresh,tag,renderLib,fillPane,wipe,exit,openWork,saveNow,saveExternal};
})();
window.LIB=LIB;   // kancalar window.LIB üzerinden erişir — const window'a çıkmaz
/* Depolama paneli bağları */
$('#libRefresh').addEventListener('click',()=>LIB.renderLib());
$('#stOpenLib').addEventListener('click',()=>{setDlg.close();
  if(!document.body.classList.contains('side-open'))$('#sideBtn').click();
  const t=$$('.stab').find(x=>x.dataset.p==='library');if(t)t.click()});
$('#stWipe').addEventListener('click',()=>LIB.wipe());
$('#exitApp').addEventListener('click',()=>LIB.exit());
/* Panel gizleme + kalite opsiyonları */
function applyPanels(refit){
  document.body.classList.toggle('hide-left',!!S.hideLeft);
  document.body.classList.toggle('hide-top',!!S.hideTop);
  $('#oHideLeft').checked=!!S.hideLeft;$('#oHideTop').checked=!!S.hideTop;
  $('#oHideBoth').checked=!!(S.hideLeft&&S.hideTop);
  resize();
  if(refit&&!boardMode())fit();               // PDF/sayfa yeni alana yeniden sığdırılır
}
function applyDPR(){
  const base=Math.min(2,window.devicePixelRatio||1);
  let d=S.ultraInk?Math.min(3,base*1.6):base;   // Ultra Netlik: süper-örnekleme
  /* 144Hz Ultra HD: tuval ekran çözünürlüğünün çok üzerinde örneklenir —
     yüksek tazeleme hızlı ekranlarda kenarlar jilet gibi, piksel kırılması yok. */
  /* OLED Ultra Görüntü: uygulama geneli 4K hissi — tuval her zaman en az 2× süper-
     örneklenir; çizim, PDF ve arayüz yakınlaştırmada dahi piksel göstermez. */
  if(S.oledUltra)d=Math.min(4,Math.max(d,base*2));
  /* PİKSEL BÜTÇESİ: süper-örnekleme, tuval başına ~8.5MP'yi aşamaz. Aşarsa
     canlı çizim kare hızı düşüp kalem gecikmeli hissettiriyordu; bütçe, büyük
     ekranlarda netlikten görünür ödün vermeden akıcılığı garanti eder. */
  try{const r=stage.getBoundingClientRect();
    const px=Math.max(1,(r.width||1280)*(r.height||800));
    d=Math.min(d,Math.sqrt(8.5e6/px));
  }catch(_){}
  d=Math.max(d,Math.min(base,1.5));   // temel netliğin altına asla inme
  DPR=d;
  resize();
}
$('#oHideLeft').addEventListener('change',e=>{S.hideLeft=e.target.checked;saveOpts();applyPanels(true)});
$('#oHideTop').addEventListener('change',e=>{S.hideTop=e.target.checked;saveOpts();applyPanels(true)});
$('#oHideBoth').addEventListener('change',e=>{S.hideLeft=S.hideTop=e.target.checked;saveOpts();applyPanels(true)});
$('#oUltraInk').addEventListener('change',e=>{S.ultraInk=e.target.checked;saveOpts();applyDPR();
  toast(S.ultraInk?'Ultra Netlik AÇIK — çizgiler süper-örnekleniyor':'Ultra Netlik kapalı')});
$('#oProPens').addEventListener('change',e=>{S.proPens=e.target.checked;saveOpts();redraw();
  toast(S.proPens?'Pro Kalem Modu AÇIK ✒️':'Pro Kalem Modu kapalı')});
$('#uiRestore').addEventListener('click',()=>{S.hideLeft=S.hideTop=false;saveOpts();applyPanels(true)});
{const b=$('#oBoardSave');
 try{b.checked=localStorage.getItem('notis_board_save')==='1'}catch{}
 b.addEventListener('change',()=>{try{localStorage.setItem('notis_board_save',b.checked?'1':'0')}catch{};if(b.checked)LIB.dirty()})}
{const c=$('#oAutosave');
 try{c.checked=localStorage.getItem('notis_autosave')!=='0'}catch{}
 c.addEventListener('change',()=>{try{localStorage.setItem('notis_autosave',c.checked?'1':'0')}catch{};if(c.checked)LIB.dirty()})}


/* ============================================================
   BAŞLAT — Excalidraw gibi boş sonsuz tahta
============================================================ */
function seedDoc(){
  const p=newPage('plain');p.name='Tahta';p.infinite=true;
  doc.pages=[p];curLayerId=p.layers[0].id;
}
function init(){
  loadOpts();
  /* Geri yüklenen ayarları kontrollere yansıt (kaydet-yükle döngüsü tam olsun) */
  try{
    $('#sSmooth').value=Math.round(S.smooth*100);$('#sStab').value=Math.round(S.stab*100);
    $('#sPressure').checked=S.pressure;$('#sPredict').checked=S.predict;
    $('#sMini').checked=S.miniBar;$('#sRing').checked=S.ring;
    $('#sGrain').checked=S.grain;document.body.classList.toggle('nograin',!S.grain);
    syncSettingsUI();
    $('#oUltraInk').checked=!!S.ultraInk;$('#oProPens').checked=!!S.proPens;
    applyPanels(false);applyDPR();
  }catch(e){}
  if(S.defColor)penColor=S.defColor;
  if(S.defOp!=null)penOp=S.defOp;
  $('#opRng').value=Math.round(penOp*100);$('#opOut').textContent=Math.round(penOp*100);
  seedDoc();buildRail();buildSwatches();renderFavs();renderOpts();renderLayers();renderStickers();renderKeys();renderThemes();
  syncOptsUI();renderCPenSet();renderBoards();applyCompact();
  resize();fit();updUndoBtns();updCornerPg();laserLoop();
  new ResizeObserver(()=>resize()).observe(stage);
  setTool('smart');
  if(S.penDNA)dnaApply(); // imza kalem: en çok kullanılan kombinasyon
  toast('Notis hazır — Ctrl+K: komut paleti · sağ tık basılı tut: hızlı araçlar');
}
init();