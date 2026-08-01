let _ar=null,_cancel=false;const _wa=()=>new Promise(r=>{_ar=r});
onmessage=async e=>{const d=e.data;
if(d&&d.t==='ack'){if(_ar){const r=_ar;_ar=null;r()}return}
if(d&&d.t==='cancel'){_cancel=true;if(_ar){const r=_ar;_ar=null;r()}return}
if(!d||!d.buf)return;
const{buf,targetW,cap,maxN,base,startAt:s0}=d;
try{
importScripts(base+'/pdf.js/3.11.174/pdf.min.js');
importScripts(base+'/pdf.js/3.11.174/pdf.worker.min.js');
const pdf=await pdfjsLib.getDocument({data:buf,
standardFontDataUrl:base+'/pdf.js/3.11.174/standard_fonts/',
cMapUrl:base+'/pdf.js/3.11.174/cmaps/',cMapPacked:true,
useWorkerFetch:true,disableFontFace:true}).promise;
const N=Math.min(pdf.numPages,maxN);
let tw=targetW;
tw=N>250?Math.min(tw,1400):N>120?Math.min(tw,1600):N>60?Math.min(tw,2000):tw;
const q=N>120?.86:.93;
const c=new OffscreenCanvas(4,4);
postMessage({t:'n',N,tw});
for(let i=Math.max(1,s0|0);i<=N;i++){
if(_cancel){postMessage({t:'done',cancelled:true});return}
try{
const pg=await pdf.getPage(i);
const vp1=pg.getViewport({scale:1});
const vp=pg.getViewport({scale:Math.min(cap,Math.max(1.15,tw/vp1.width))});
c.width=Math.round(vp.width);c.height=Math.round(vp.height);
const tk=pg.render({canvasContext:c.getContext('2d'),viewport:vp});
await Promise.race([tk.promise,new Promise((_,rj)=>setTimeout(()=>{try{tk.cancel()}catch(_){}rj(new Error('timeout'))},45000))]);
let bl;try{bl=await c.convertToBlob({type:'image/webp',quality:q})}
catch(_){bl=await c.convertToBlob({type:'image/jpeg',quality:q+.02})}
const u=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(bl)});
postMessage({t:'p',i,bg:u,pw:Math.round(vp.width),ph:Math.round(vp.height)});
pg.cleanup&&pg.cleanup();
await _wa();
}catch(pe){postMessage({t:'skip',i,m:String(pe&&pe.message||pe)});await _wa()}
}
postMessage({t:'done'});
}catch(err){postMessage({t:'err',m:String(err&&err.message||err)})}
};
