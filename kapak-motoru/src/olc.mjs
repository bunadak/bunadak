/** Teşhis aracı: bir kapağın kutu ölçülerini döker. node src/olc.mjs 04 */
import { chromium } from 'playwright';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kapakHTML } from './kalip.js';
import { marka, kapaklar } from '../kapaklar.js';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const hedef = process.argv[2] || '01';
const kayit = kapaklar.find((k) => k.dosya.includes(hedef));

const html = kapakHTML(kayit, marka, null);
const dosya = path.join(KOK, '_olc.html');
await writeFile(dosya, html);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(pathToFileURL(dosya).href, { waitUntil: 'load' });
await p.waitForFunction(() => document.documentElement.dataset.hazir === '1');

const rapor = await p.evaluate(() => {
  const cik = [];
  document.querySelectorAll('.sahne, .sahne *').forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width === 0) return;
    cik.push({
      sec: e.className.toString().slice(0, 34) || e.tagName,
      sol: Math.round(r.left), sag: Math.round(r.right),
      gen: Math.round(r.width), ust: Math.round(r.top), alt: Math.round(r.bottom),
      punto: Math.round(parseFloat(getComputedStyle(e).fontSize)),
    });
  });
  return cik;
});
console.table(rapor);
await b.close();
await rm(dosya, { force: true });
