// End-to-end smoke test: drives both pages in Chromium and checks the paths people use.
// Run from the repo root:  node tests/smoke.js   (needs the `playwright` package)
// Exits non-zero on the first failure. Also checks that javidnam/ matches javidnam/source.csv.
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

let step = '';
function check(ok, what) {
  if (!ok) throw new Error(`${step}: ${what}`);
}

// every page and script must ask for the same ?v= of css/ and js/ (tools/bump_version.py)
function checkVersions() {
  step = 'asset versions';
  const files = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'js')).map(f => 'js/' + f)];
  const seen = new Set();
  for (const f of files) {
    const refs = fs.readFileSync(path.join(ROOT, f), 'utf8').match(/\.(css|js)\?v=\w+/g) || [];
    refs.forEach(r => seen.add(r.split('?v=')[1]));
    if (f !== 'js/common.js') check(refs.length, `${f} loads css/js without ?v=`);   // common.js imports nothing
  }
  check(seen.size === 1, `mixed versions ${[...seen]}: run tools/bump_version.py`);
}

function checkData() {
  step = 'data';
  const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'javidnam/people.json'), 'utf8'));
  const rows = fs.readFileSync(path.join(ROOT, 'javidnam/source.csv'), 'utf8').trim().split('\n').slice(1);
  check(rows.length === people.length, `source.csv has ${rows.length} rows but people.json has ${people.length}: run tools/build_javidnam.py`);
  rows.forEach((row, i) => check(row.split(',')[0].trim() === people[i].name, `row ${i + 2} (${row.split(',')[0]}) does not match people.json: run tools/build_javidnam.py`));
  for (const p of people) {
    check(/^[A-Za-z .'’-]{1,40}$/.test(p.name), `bad poster name ${p.name}`);
    check(!p.city || p.province, `${p.name} has a city but no province`);
    for (const d of ['photos', 'thumbs', 'placards']) check(fs.existsSync(path.join(ROOT, `javidnam/${d}/${p.id}.jpg`)), `missing ${d}/${p.id}.jpg (placards: node tools/build_placards.js)`);
  }
  return people;
}

async function main() {
  checkVersions();
  const people = checkData();
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  // CI uses the runner's installed Chrome (PW_CHANNEL=chrome) instead of downloading a browser
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const problems = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  context.on('page', watch);
  function watch(page) {
    page.on('pageerror', e => problems.push(`page error: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
    page.on('request', r => { if (!r.url().startsWith(base) && !/^(data|blob):/.test(r.url())) problems.push(`outside request: ${r.url()}`); });
    page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
  }
  const p = await context.newPage();
  const download = async btn => {
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click(btn)]);
    return fs.readFileSync(await d.path());
  };
  const photoReady = () => p.waitForFunction(() => !document.getElementById('zoomRow').hidden, null, { timeout: 30000 });
  const allTranslated = async () => {
    const empty = await p.$$eval('[data-i18n]', els => els.filter(e => !e.closest('[hidden]') && !e.textContent.trim()).map(e => e.dataset.i18n));
    check(!empty.length, `untranslated: ${empty}`);
  };

  step = 'poster maker: language screen';
  await p.goto(base + 'index.html');
  check(await p.isVisible('#langScreen') && await p.isHidden('#container'), 'language screen first');
  await p.waitForSelector('#intro svg .intro-face.on', { state: 'attached', timeout: 15000 });   // the scene shows real people
  check(await p.$$eval('#intro .intro-face', c => c.length) >= 8 && await p.$$eval('#introBottom .intro-face', c => c.length) >= 8, 'both scenes have posters');
  await p.waitForSelector('#intro .intro-prince .intro-face.on', { state: 'attached', timeout: 15000 });   // the Prince's portrait
  await p.click('[data-lang=fa]');
  check(await p.isHidden('#intro') && await p.isHidden('#introBottom'), 'both scenes go with the language screen');
  check(await p.getAttribute('html', 'dir') === 'rtl', 'Persian is RTL');
  await p.waitForSelector('#fromList:not([hidden])');
  await allTranslated();
  check(await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('900 40px "Archivo Black"') && document.fonts.check('16px Vazirmatn'); }), 'fonts load');
  check(await p.evaluate(() => !!window.jspdf), 'jsPDF loads');

  step = 'poster maker: own photo and name';
  check(await p.isDisabled('#jpgBtn'), 'export disabled before input');
  await p.setInputFiles('#imageInput', path.join(ROOT, 'og-image.jpg'));          // 1200 x 630: below the 1000 px rule
  await photoReady();
  check(await p.isVisible('#lowRes'), 'low-resolution warning for a small photo');
  await p.setInputFiles('#imageInput', path.join(ROOT, 'Template.jpg'));          // large photo
  await p.waitForFunction(() => document.getElementById('lowRes').hidden);
  await p.fill('#nameInput', 'Sara ۱۲ Test');
  check(await p.inputValue('#nameInput') === 'Sara  Test', 'non-Latin letters removed');
  check(await p.isVisible('#errorBox'), 'Latin-only warning shown');
  await p.fill('#nameInput', "Sara O'Test-Name");
  const jpg = await download('#jpgBtn');
  check(jpg[0] === 0xff && jpg[1] === 0xd8 && jpg.length > 300000, 'JPG export');
  const pdf = await download('#pdfBtn');
  check(pdf.slice(0, 4).toString() === '%PDF', 'PDF export');
  await p.click('#langBtn');
  check(await p.getAttribute('html', 'dir') === 'ltr', 'English is LTR');
  await allTranslated();
  await p.click('#resetBtn');
  check(await p.inputValue('#nameInput') === '' && await p.isHidden('#zoomRow'), 'reset clears');

  step = 'list page';
  await p.click('#fromList');
  await p.waitForSelector('.card');
  check(p.url().includes('javidnam.html?lang=en'), 'list keeps the language');
  check(await p.$$eval('.card', c => c.length) === people.length, 'one card per person');
  await allTranslated();
  check((await p.textContent('#about')).includes(String(people.length)), 'note shows the count');
  const lastGroup = await p.$eval('.group:last-of-type h3', h => h.textContent);
  check(!people.some(x => !x.province) || lastGroup.startsWith('Place not recorded'), 'unknown place last');
  const prov = people.find(x => x.province).province;
  await p.selectOption('#provSelect', prov);
  check(await p.$$eval('.card', c => c.length) === people.filter(x => x.province === prov).length, 'province filter');
  const city = people.find(x => x.province === prov && x.city).city;
  await p.click(`.chip:has-text("${city}")`);
  check(await p.$$eval('.card', c => c.length) === people.filter(x => x.city === city).length, 'city filter');
  await p.click('.chip.up');
  check(await p.inputValue('#provSelect') === '', 'back to all provinces');
  const someone = people[Math.floor(people.length / 2)];
  await p.fill('#search', someone.name.split(' ').pop());
  check(await p.$$eval('.card .name', (c, n) => c.some(x => x.textContent === n), someone.name), 'English search');
  await p.click('#langBtn');
  await p.fill('#search', someone.name_fa.split(' ')[0]);
  check(await p.$$eval('.card .name', (c, n) => c.some(x => x.textContent === n), someone.name_fa), 'Persian search');
  await p.fill('#search', 'zzzz');
  check(await p.isVisible('#status'), 'no-match message');
  await p.fill('#search', '');

  step = 'list to poster';
  await p.click(`.card[href$="p=${encodeURIComponent(someone.id)}"]`);
  await photoReady();
  check(await p.isHidden('#langScreen'), 'language screen skipped');
  check(await p.inputValue('#nameInput') === someone.name, 'name filled');
  check((await p.textContent('#chosenText')).includes(someone.name_fa), 'banner names the person');
  const jpg2 = await download('#jpgBtn');
  check(jpg2.length > 300000, 'JPG export from a list photo');
  await p.click('#resetBtn');
  check(await p.isHidden('#chosen') && !p.url().includes('p='), 'reset forgets the person');
  await p.click('#fromList');
  await p.waitForSelector('.card');
  await p.click('#backLink');
  await p.waitForSelector('#container:not([hidden])');

  step = 'clean run';
  check(!problems.length, problems.join('\n  '));
  await browser.close();
  server.close();
  console.log(`smoke test passed (${people.length} people)`);
}

main().catch(e => { console.error('FAILED', e.message); process.exit(1); });
