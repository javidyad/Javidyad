// Javidnam list (javidnam.html): people by province and city, search, and links into the poster maker.
import { $, el, urlLang, savedLang, translatePage } from './common.js?v=202610281732';
const STR = {
  en: {
    title: 'Choose a Javidnam', docTitle: 'Choose a Javidnam · JavidYad', back: '← Back',
    step1: 'Pick a province and city', step2: 'Tap a photo', step3: 'The poster is ready to print',
    searchPh: 'Search by name', provLabel: 'Choose a province', cityLabel: 'Choose a city', quick: 'Quick filters',
    all: 'All', allProvinces: 'All provinces', allCities: 'All cities', up: '← All provinces',
    allOf: n => `All of ${n}`, provinceOf: n => `${n} Province`,
    unknownPlace: 'Place not recorded', unknownCity: 'City not recorded',
    // why the list is short: only photos sharp enough to print were taken from the platform
    about: (n, source, own) => [`The ${n} Javidnaman in this list come from `, source, ', chosen because their photos have the minimum quality needed to print a poster. Thousands of other names on the platform are not included here. If you cannot find someone, you can ', own, '.'],
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
    about: (n, source, own) => [`${n} جاویدنامی که در این فهرست می‌بینید از `, source, ' برگرفته شده‌اند، چون عکسشان حداقل کیفیت لازم برای چاپ پوستر را دارد. هزاران نام دیگر در آن پلتفرم هست که در این فهرست نیامده‌اند. اگر عزیزی را پیدا نکردید، می‌توانید ', own, '.'],
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

function setProv(key) { prov = key; city = ''; renderFilters(); renderResults(); }
function setCity(key) {
  city = key;
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
      el('span', { className: 'go', textContent: t('make') })));
}

// provinces, each with its cities
function renderResults() {
  const q = fold($('search').value);
  const match = inProv().filter(p => (!city || cityKey(p) === city) && (!q || fold(p.name).includes(q) || fold(p.name_fa).includes(q)));
  const grid = items => el('div', { className: 'grid' }, ...items.map(card));
  $('results').replaceChildren(...groupBy(match, provKey, provName).map(pg =>
    el('section', { className: 'group' },
      el('h3', {}, pg.key === UNKNOWN ? pg.label : t('provinceOf')(pg.label), count(pg.n)),
      ...(pg.key === UNKNOWN ? [grid(pg.items)]
        : groupBy(pg.items, cityKey, cityName).map(cg => el('div', {}, el('h4', {}, cg.label, count(cg.n)), grid(cg.items)))))));
  $('status').hidden = match.length > 0;
  if (!match.length) $('status').textContent = t('noMatch');
}

function renderAbout() {
  const ready = status === 'ready';
  $('about').hidden = !ready;
  if (!ready) return;
  const source = el('a', { href: 'https://javidnaman.iranintl.com/', target: '_blank', rel: 'noopener noreferrer', textContent: t('sourceLink') });
  const own = el('a', { href: `index.html?lang=${lang}`, textContent: t('ownLink') });
  $('about').replaceChildren(...t('about')(num(people.length), source, own));
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
$('search').addEventListener('input', () => { if (people) renderResults(); });
$('provSelect').addEventListener('change', e => setProv(e.target.value));
$('citySelect').addEventListener('change', e => setCity(e.target.value));
applyLang(lang);

fetch('javidnam/people.json', { cache: 'no-cache' })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(list => { people = list; status = list.length ? 'ready' : 'empty'; render(); })
  .catch(() => { people = []; status = 'failed'; render(); });
