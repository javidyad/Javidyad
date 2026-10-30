// Small copies of each person's finished poster, for the placards in the language-screen scene (js/intro.js).
// Each poster is made by the site itself (English template), exactly as a visitor would download it,
// then scaled to PLACARD_W px wide. Run after tools/build_javidnam.py, from the repo root:
//
//     node tools/build_placards.js          # only people without a placard yet
//     node tools/build_placards.js --all    # redo every placard (after a template or layout change)
//
// Only people whose photo prints well (q 3 in people.json) are held up in the scene.
// Needs the `playwright` package. Writes javidnam/placards/<id>.jpg and removes placards of people no longer listed.
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'javidnam/placards');
const PLACARD_W = 300;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'javidnam/people.json'), 'utf8')).filter(p => p.q === 3);
  fs.mkdirSync(OUT, { recursive: true });
  const ids = new Set(people.map(p => p.id));
  for (const f of fs.readdirSync(OUT)) if (!ids.has(f.replace(/\.jpg$/, ''))) fs.unlinkSync(path.join(OUT, f));
  const todo = process.argv.includes('--all') ? people : people.filter(p => !fs.existsSync(path.join(OUT, `${p.id}.jpg`)));
  if (!todo.length) return console.log('every person already has a placard');

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
  const scaler = await browser.newPage();
  for (const [i, p] of todo.entries()) {
    await page.goto(`${base}index.html?lang=en&p=${encodeURIComponent(p.id)}`);
    await page.waitForFunction(() => !document.getElementById('zoomRow').hidden, null, { timeout: 30000 });
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#jpgBtn')]);
    const big = fs.readFileSync(await d.path()).toString('base64');
    const small = await scaler.evaluate(async ([b64, w]) => {
      const blob = await (await fetch('data:image/jpeg;base64,' + b64)).blob();
      const probe = await createImageBitmap(blob);
      const h = Math.round(probe.height * w / probe.width);
      const bmp = await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(bmp, 0, 0);
      return c.toDataURL('image/jpeg', 0.82).split(',')[1];
    }, [big, PLACARD_W]);
    fs.writeFileSync(path.join(OUT, `${p.id}.jpg`), Buffer.from(small, 'base64'));
    if ((i + 1) % 25 === 0) console.log(`${i + 1} / ${todo.length}`);
  }
  await browser.close();
  server.close();
  console.log(`${todo.length} placard(s) written to javidnam/placards/`);
})().catch(e => { console.error(e); process.exit(1); });
