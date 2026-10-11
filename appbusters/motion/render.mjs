// Запись ролика: node render.mjs <out_dir> [fps=60] [sub=3] [stills]
// Каждый кадр 60 fps собирается из sub подкадров (motion blur через ffmpeg tmix).
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';
const [out, fpsArg, subArg, mode] = process.argv.slice(2);
const fps = +(fpsArg || 60), sub = +(subArg || 3), DUR = 18;
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 494, height: 494 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(path.resolve('services-morph.html')).href);
await p.waitForFunction(() => window.ready === true);
if (mode === 'stills') {
  const times = process.env.STILLS ? process.env.STILLS.split(",").map(Number) : [0, 1.0, 1.9, 2.5, 3.4, 4.25, 5.6, 6.35, 7.5, 8.45, 9.8, 10.5, 12.2, 13.5, 14.15, 15, 16.25, 17.5];
  for (const t of times) {
    await p.evaluate(t => seek(t), t); await p.screenshot({ path: `${out}/s_${String(t).padStart(5, '0')}.png` });
  }
} else {
  const N = DUR * fps * sub;
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => seek(t), i / (fps * sub));
    await p.screenshot({ path: `${out}/f_${String(i).padStart(5, '0')}.png` });
  }
}
await b.close();
