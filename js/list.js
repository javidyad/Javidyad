// Javidnam list (javidnam.html): people by province and city, search, and links into the poster maker.
import { $, el, urlLang, savedLang, translatePage } from './common.js?v=202610301550';
const STR = {
  en: {
    title: 'Choose a Javidnam', docTitle: 'Choose a Javidnam · JavidYad', back: '← Back',
    step1: 'Pick a province and city', step2: 'Tap a photo', step3: 'The poster is ready to print',
    searchPh: 'Search by name', provLabel: 'Choose a province', cityLabel: 'Choose a city', quick: 'Quick filters',
    all: 'All', allProvinces: 'All provinces', allCities: 'All cities', up: '← All provinces',
    allOf: n => `All of ${n}`, provinceOf: n => `${n} Province`,
    unknownPlace: 'Place not recorded', unknownCity: 'City not recorded',
    about: (n, source, own) => [`The ${n} Javidnaman in this list come from `, source, '. Their photos differ in quality, so each card shows how well the poster will print. If you have a sharper photo of someone, or cannot find them, you can ', own, '.'],
    // print quality of the photo (q in javidnam/people.json)
    q3: 'Prints well', q2: 'Best on A4', q1: 'Low quality', q0: 'Very low quality', qTitle: 'Print quality of the photo',
    legend: 'Print quality of each photo:', more: n => `Show more (${n} left)`,
    sourceLink: 'Iran International’s Javidnaman platform', ownLink: 'make a poster with your own photo',
    people: n => n === 1 ? '1 person' : `${n} people`, make: 'Make poster →',
    loading: 'Loading the list…', empty: 'The list is being prepared. You can still make a poster with your own photo.',
    noMatch: 'No name matches your search.', failed: 'The list could not be loaded. Check your connection and reload the page.',
    otherLang: 'فارسی'
  },
  fa: {
    title: 'فهرست جاویدنامان', docTitle: 'فهرست جاویدنامان · جاویدیاد', back: '→ بازگشت به جاویدیاد',
    step1: 'استان و شهر را انتخاب کنید', step2: 'روی عکس بزنید', step3: 'پوستر آماده‌ی چاپ است',
    searchPh: 'جستجوی نام', provLabel: 'انتخاب استان', cityLabel: 'انتخاب شهر', quick: 'انتخاب سریع',
    all: 'همه', allProvinces: 'همه‌ی استان‌ها', allCities: 'همه‌ی شهرها', up: '→ همه‌ی استان‌ها',
    allOf: n => `همه‌ی ${n}`, provinceOf: n => `استان ${n}`,
    unknownPlace: 'محل ثبت نشده', unknownCity: 'شهر ثبت نشده',
    about: (n, source, own) => [`${n} جاویدنامی که در این فهرست می‌بینید از `, source, ' برگرفته شده‌اند. کیفیت عکس‌ها یکسان نیست، برای همین روی هر کارت نوشته‌ایم پوسترش چقدر خوب چاپ می‌شود. اگر عکس واضح‌تری از عزیزی دارید یا او را پیدا نکردید، می‌توانید ', own, '.'],
    q3: 'چاپ خوب', q2: 'مناسب A4', q1: 'کیفیت پایین', q0: 'کیفیت خیلی پایین', qTitle: 'کیفیت عکس برای چاپ',
    legend: 'کیفیت چاپ هر عکس:', more: n => `نمایش بیشتر (${n} نفر دیگر)`,
    sourceLink: 'پلتفرم جاویدنامان ایران اینترنشنال', ownLink: 'با عکس خودتان پوستر بسازید',
    people: n => `${n.toLocaleString('fa')} نفر`, make: 'ساخت پوستر ←',
    loading: 'در حال بارگذاری فهرست…', empty: 'فهرست در حال آماده شدن است. همچنان می‌توانید با عکس خودتان پوستر بسازید.',
    noMatch: 'نامی با این جستجو پیدا نشد.', failed: 'فهرست بارگذاری نشد. اتصال اینترنت را بررسی کنید و صفحه را دوباره باز کنید.',
    otherLang: 'English'
  }
};

let lang = urlLang || savedLang();
const t = k => STR[lang][k];

let people = null, prov = '', city = '', status = 'loading';
// thousands of people: cards are added PAGE at a time, so the page stays quick on phones
const PAGE = 60;
let shown = PAGE;

// Persian and Arabic letter forms, ZWNJ and case are ignored when searching
const fold = s => s.toLowerCase().replace(/[‌ً-ٟ]/g, '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim();
const nameOf = p => lang === 'fa' ? p.name_fa : p.name;
const posterURL = p => `index.html?lang=${lang}&p=${encodeURIComponent(p.id)}`;

const num = n => n.toLocaleString(lang);
const count = n => el('span', { className: 'n', textContent: t('people')(n) });

const UNKNOWN = '?', TOP_PROVINCES = 8;
const provKey = p => p.province || UNKNOWN;
const cityKey = p => p.city || UNKNOWN;
const provName = p => p.province ? (lang === 'fa' ? p.province_fa : p.province) : t('unknownPlace');
const cityName = p => p.city ? (lang === 'fa' ? p.city_fa : p.city) : t('unknownCity');

// groups with their people, biggest first, "not recorded" last
function groupBy(list, keyFn, labelFn) {
  const m = new Map();
  list.forEach(p => { const k = keyFn(p); if (!m.has(k)) m.set(k, []); m.get(k).push(p); });
  return [...m].map(([key, items]) => ({ key, items, n: items.length, label: labelFn(items[0]) }))
    .sort((a, b) => (a.key === UNKNOWN) - (b.key === UNKNOWN) || b.n - a.n || a.label.localeCompare(b.label, lang));
}
const alphabetical = groups => [...groups].sort((a, b) => (a.key === UNKNOWN) - (b.key === UNKNOWN) || a.label.localeCompare(b.label, lang));
const inProv = () => prov ? people.filter(p => provKey(p) === prov) : people;

function setProv(key) { prov = key; city = ''; shown = PAGE; renderFilters(); renderResults(); }
function setCity(key) {
  city = key; shown = PAGE;
  if (key && key !== UNKNOWN && !prov) prov = provKey(people.find(p => cityKey(p) === key));   // a city opens its province
  renderFilters(); renderResults();
}

// province and city dropdowns, plus buttons: the biggest provinces, or the cities of the chosen province
function renderFilters() {
  const provs = groupBy(people, provKey, provName), cities = groupBy(inProv(), cityKey, cityName);
  const option = (value, label, n) => el('option', { value, textContent: n == null ? label : `${label} (${num(n)})` });
  $('provSelect').replaceChildren(option('', t('allProvinces')), ...alphabetical(provs).map(g => option(g.key, g.label, g.n)));
  $('provSelect').value = prov;
  $('citySelect').replaceChildren(option('', t('allCities')), ...alphabetical(cities).map(g => option(g.key, g.label, g.n)));
  $('citySelect').value = city;

  const chip = (label, n, pressed, onClick, cls) => {
    const b = el('button', { type: 'button', className: 'chip' + (cls ? ' ' + cls : '') }, label, n == null ? null : el('span', { className: 'n', textContent: num(n) }));
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', onClick);
    return b;
  };
  const here = provs.find(g => g.key === prov);
  $('chips').replaceChildren(...(here
    ? [chip(t('up'), null, false, () => setProv(''), 'up'), chip(t('allOf')(here.label), here.n, !city, () => setCity('')),
       ...cities.map(g => chip(g.label, g.n, city === g.key, () => setCity(g.key)))]
    : [chip(t('all'), people.length, !city, () => setProv('')),
       ...provs.filter(g => g.key !== UNKNOWN).slice(0, TOP_PROVINCES).map(g => chip(g.label, g.n, false, () => setProv(g.key)))]));
  const on = $('chips').querySelector('[aria-pressed=true]');
  if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function card(p) {
  const img = el('img', { src: `javidnam/thumbs/${p.id}.jpg`, alt: '', loading: 'lazy', decoding: 'async', width: 360, height: 480 });
  return el('a', { className: 'card', href: posterURL(p) }, img,
    el('span', { className: 'info' },
      el('span', { className: 'name', textContent: nameOf(p) }),
      lang === 'fa' ? el('span', { className: 'latin', textContent: p.name }) : null,
      quality(p.q ?? 3),
      el('span', { className: 'go', textContent: t('make') })));
}
// three bars and a word: how well this photo prints
const quality = q => el('span', { className: `q q${q}`, title: t('qTitle') },
  el('span', { className: 'bars', ariaHidden: 'true' }, ...[1, 2, 3].map(i => el('i', { className: i <= q ? 'on' : '' }))), t('q' + q));

// provinces, each with its cities
function renderResults() {
  const q = fold($('search').value);
  const match = inProv().filter(p => (!city || cityKey(p) === city) && (!q || p.search.includes(q)))
    .sort((a, b) => (b.q ?? 3) - (a.q ?? 3));   // stable: within a city, the sharpest photos first
  // headings count everyone, but only the first `shown` cards are drawn; groups past that are left out
  let left = shown;
  const grid = items => { const some = items.slice(0, Math.max(0, left)); left -= some.length; return el('div', { className: 'grid' }, ...some.map(card)); };
  const sections = [];
  for (const pg of groupBy(match, provKey, provName)) {
    if (left <= 0) break;
    const parts = [];
    for (const cg of pg.key === UNKNOWN ? [{ items: pg.items }] : groupBy(pg.items, cityKey, cityName)) {
      if (left <= 0) break;
      parts.push(cg.label ? el('div', {}, el('h4', {}, cg.label, count(cg.n)), grid(cg.items)) : grid(cg.items));
    }
    sections.push(el('section', { className: 'group' }, el('h3', {}, pg.key === UNKNOWN ? pg.label : t('provinceOf')(pg.label), count(pg.n)), ...parts));
  }
  const rest = match.length - shown;
  if (rest > 0) {
    const more = el('button', { type: 'button', className: 'more', id: 'moreBtn', textContent: t('more')(num(rest)) });
    more.addEventListener('click', () => { shown += PAGE * 2; renderResults(); });
    sections.push(more);
  }
  $('results').replaceChildren(...sections);
  $('status').hidden = match.length > 0;
  if (!match.length) $('status').textContent = t('noMatch');
}

function renderAbout() {
  const ready = status === 'ready';
  $('about').hidden = !ready;
  if (!ready) return;
  const source = el('a', { href: 'https://javidnaman.iranintl.com/', target: '_blank', rel: 'noopener noreferrer', textContent: t('sourceLink') });
  const own = el('a', { href: `index.html?lang=${lang}`, textContent: t('ownLink') });
  $('about').replaceChildren(...t('about')(num(people.length), source, own),
    el('span', { className: 'legend' }, t('legend'), ...[3, 2, 1, 0].map(quality)));
}

function render() {
  $('filters').hidden = !(people && people.length);
  renderAbout();
  if (status !== 'ready') { $('results').replaceChildren(); $('status').hidden = false; $('status').textContent = t(status); return; }
  renderFilters(); renderResults();
}

function applyLang(l) {
  lang = l;
  translatePage(l, t);
  $('langBtn').textContent = t('otherLang');
  $('backLink').href = `index.html?lang=${l}`;
  if (people) render();
}
$('langBtn').addEventListener('click', () => applyLang(lang === 'fa' ? 'en' : 'fa'));
$('search').addEventListener('input', () => { if (people) { shown = PAGE; renderResults(); } });
$('provSelect').addEventListener('change', e => setProv(e.target.value));
$('citySelect').addEventListener('change', e => setCity(e.target.value));
applyLang(lang);

fetch('javidnam/people.json', { cache: 'no-cache' })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(list => {
    list.forEach(p => { p.search = fold(p.name + ' ' + p.name_fa); });   // folded once, not on every key press
    people = list; status = list.length ? 'ready' : 'empty'; render();
  })
  .catch(() => { people = []; status = 'failed'; render(); });
