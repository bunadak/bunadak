/**
 * MATHERA Kapak Motoru — üretici
 *
 *   node src/render.mjs              → kapaklar.js'teki her şeyi üretir
 *   node src/render.mjs limit turev  → sadece adı eşleşenleri üretir
 *
 * Çıktı: out/<dosya>.jpg  (1280×720, YouTube'a yüklemeye hazır)
 *        out/<dosya>@2x.png (2560×1440, arşiv/baskı kalitesi)
 */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { kapakHTML } from './kalip.js';
import { BOYUT } from './marka.js';
import { marka, kapaklar } from '../kapaklar.js';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.join(KOK, '..');
const CIKTI = path.join(PROJE, 'out');
const GECICI = path.join(KOK, '.gecici');

/** Gerçek logo dosyası varsa onu göm; yoksa vektörel amblem çizilir. */
async function logoyuYukle() {
  for (const ad of ['logo.png', 'logo.jpg', 'logo.webp', 'logo.svg']) {
    const p = path.join(PROJE, 'assets', ad);
    if (existsSync(p)) {
      const tur = ad.endsWith('.svg') ? 'svg+xml' : ad.endsWith('.png') ? 'png' : ad.endsWith('.webp') ? 'webp' : 'jpeg';
      const b64 = (await readFile(p)).toString('base64');
      console.log(`  logo: assets/${ad} kullanılıyor`);
      return `data:image/${tur};base64,${b64}`;
    }
  }
  console.log('  logo: assets/ boş → vektörel amblem çiziliyor');
  return null;
}

async function main() {
  const filtre = process.argv.slice(2).map((s) => s.toLowerCase());
  const liste = filtre.length
    ? kapaklar.filter((k) => filtre.some((f) => (k.dosya + ' ' + k.baslik).toLowerCase().includes(f)))
    : kapaklar;

  if (!liste.length) {
    console.error('Eşleşen kapak yok. kapaklar.js içindeki "dosya" adlarına bak.');
    process.exit(1);
  }

  await mkdir(CIKTI, { recursive: true });
  await mkdir(GECICI, { recursive: true });
  const logoURI = await logoyuYukle();

  const tarayici = await chromium.launch();
  const uretilen = [];

  for (const kayit of liste) {
    const olcu = kayit.tasarim === 'banner' ? BOYUT.banner : BOYUT.kapak;
    const html = kapakHTML(kayit, marka, logoURI);

    // stil.css ve ../fonts göreli çözülsün diye src/ içine yazıyoruz
    const gecici = path.join(GECICI, `${kayit.dosya}.html`);
    await writeFile(path.join(KOK, path.basename(gecici)), html); // src/<ad>.html
    const sayfaURL = pathToFileURL(path.join(KOK, path.basename(gecici))).href;

    for (const [olcek, uzanti] of [[2, 'png'], [1, 'jpg']]) {
      const ctx = await tarayici.newContext({
        viewport: { width: olcu.w, height: olcu.h },
        deviceScaleFactor: olcek,
      });
      const page = await ctx.newPage();
      await page.goto(sayfaURL, { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.dataset.hazir === '1');
      await page.evaluate(() => document.fonts.ready);

      const ad = olcek === 2 ? `${kayit.dosya}@2x.png` : `${kayit.dosya}.jpg`;
      const hedef = path.join(CIKTI, ad);
      await page.screenshot(
        uzanti === 'jpg'
          ? { path: hedef, type: 'jpeg', quality: 92 }
          : { path: hedef, type: 'png' }
      );
      await ctx.close();
      if (uzanti === 'jpg') uretilen.push(hedef);
    }

    await rm(path.join(KOK, path.basename(gecici)), { force: true });
    console.log(`  ✓ ${kayit.dosya}  [${kayit.tasarim}/${kayit.tema || 'bakir'}]  ${olcu.w}×${olcu.h}`);
  }

  await tarayici.close();
  await rm(GECICI, { recursive: true, force: true });

  console.log(`\n${uretilen.length} kapak hazır → kapak-motoru/out/`);
  for (const f of uretilen) {
    const kb = Math.round((await stat(f)).size / 1024);
    console.log(`  ${path.basename(f)}  ${kb} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
