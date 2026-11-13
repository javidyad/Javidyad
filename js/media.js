// Campaign gallery (gallery.html) and posters and placards to print (placards.html): one module, the page's
// data-kind says which. Items come from <kind>/items.json, built by tools/build_media.py.
import { $, el, urlLang, savedLang, translatePage } from './common.js?v=202611131139';
const KIND = document.body.dataset.kind;
const COMMON = {
  en: {
    back: '← Back', loading: 'Loading…', failed: 'This page could not be loaded. Check your connection and reload the page.',
    close: 'Close', prev: 'Previous', next: 'Next', more: n => `Show more (${n} left)`, otherLang: 'فارسی'
  },
  fa: {
    back: '→ بازگشت به جاویدیاد', loading: 'در حال بارگذاری…', failed: 'این صفحه بارگذاری نشد. اتصال اینترنت را بررسی کنید و صفحه را دوباره باز کنید.',
    close: 'بستن', prev: 'قبلی', next: 'بعدی', more: n => `نمایش بیشتر (${n} مورد دیگر)`, otherLang: 'English'
  }
};
const STR = {
  gallery: {
    en: {
      title: 'Campaign gallery', docTitle: 'Campaign gallery · JavidYad',
      about: 'Posters of the Javidnaman held up at ceremonies and rallies around the world, made with JavidYad. The photos were shared publicly online.',
      empty: 'The first photos will be here soon.', view: 'View photo', by: 'Photo:'
    },
    fa: {
      title: 'گالری کمپین', docTitle: 'گالری کمپین · جاویدیاد',
      about: 'پوسترهای جاویدنامان در دست مردم، در مراسم و تجمع‌ها در سراسر جهان، ساخته‌شده با جاویدیاد. این عکس‌ها پیش‌تر در شبکه‌های اجتماعی منتشر شده‌اند.',
      empty: 'به‌زودی نخستین عکس‌ها اینجا قرار می‌گیرند.', view: 'دیدن عکس', by: 'عکس:'
    }
  },
  placards: {
    en: {
      title: 'Posters and placards', docTitle: 'Posters and placards · JavidYad',
      about: 'Ready-made posters and placards for rallies and marches, shared by groups around the world. Download, print and use them freely.',
      empty: 'The first designs will be here soon.', view: 'View larger', by: 'By', download: 'Download'
    },
    fa: {
      title: 'پوسترها و پلاکاردها', docTitle: 'پوسترها و پلاکاردها · جاویدیاد',
      about: 'پوسترها و پلاکاردهای آماده برای تجمع‌ها و راهپیمایی‌ها، که گروه‌های مختلف در سراسر جهان در اختیار همه گذاشته‌اند. دانلود کنید، چاپ کنید و آزادانه استفاده کنید.',
      empty: 'به‌زودی نخستین طرح‌ها اینجا قرار می‌گیرند.', view: 'دیدن بزرگ‌تر', by: 'از', download: 'دانلود'
    }
  }
};

let lang = urlLang || savedLang();
const t = k => STR[KIND][lang][k] ?? COMMON[lang][k];
const num = n => n.toLocaleString(lang);
const PAGE = 60;
let items = null, shown = PAGE, status = 'loading', open = -1;

const thumb = p => `${KIND}/${KIND === 'gallery' ? 'thumbs' : 'previews'}/${encodeURIComponent(p.id)}.jpg`;
const large = p => KIND === 'gallery' ? `gallery/photos/${encodeURIComponent(p.id)}.jpg` : thumb(p);
const caption = p => (lang === 'fa' ? p.caption_fa || p.title_fa : p.caption || p.title) || p.caption || p.title || '';
const credit = p => p.credit ? `${t('by')} ${p.credit}` : '';
const size = b => b >= 1e6 ? `${num(Math.round(b / 1e5) / 10)} MB` : `${num(Math.max(1, Math.round(b / 1e3)))} KB`;

function card(p, i) {
  const img = el('img', { src: thumb(p), alt: caption(p), loading: 'lazy', decoding: 'async', width: p.w, height: p.h });
  const zoom = el('button', { type: 'button', className: 'shot', title: t('view') }, img);
  zoom.addEventListener('click', () => show(i));
  if (KIND === 'gallery') return el('figure', { className: 'item' }, zoom,
    caption(p) || p.credit ? el('figcaption', {}, caption(p), p.credit ? el('span', { className: 'credit', textContent: credit(p) }) : null) : null);
  const ext = p.file.split('.').pop().toUpperCase();
  return el('figure', { className: 'item' }, zoom,
    el('figcaption', {},
      caption(p) ? el('span', { className: 'name', textContent: caption(p) }) : null,
      p.credit ? el('span', { className: 'credit', textContent: credit(p) }) : null,
      el('a', { className: 'download', href: `placards/files/${encodeURIComponent(p.file)}`, download: p.file },
        `${t('download')} `, el('span', { className: 'n', textContent: `${ext} · ${size(p.size)}` }))));
}

function render() {
  $('status').hidden = status === 'ready';
  if (status !== 'ready') { $('items').replaceChildren(); $('status').textContent = t(status); return; }
  const parts = items.slice(0, shown).map(card);
  if (items.length > shown) {
    const more = el('button', { type: 'button', className: 'more', id: 'moreBtn', textContent: t('more')(num(items.length - shown)) });
    more.addEventListener('click', () => { shown += PAGE; render(); });
    parts.push(more);
  }
  $('items').replaceChildren(...parts);
}

// the larger view: its buttons and the arrow keys move through the items (in reading order, so mirrored in Persian)
function show(i) {
  open = (i + items.length) % items.length;
  const p = items[open];
  $('viewerImg').src = large(p); $('viewerImg').alt = caption(p);
  $('viewerText').textContent = [caption(p), credit(p)].filter(Boolean).join(' · ');
  $('prevBtn').hidden = $('nextBtn').hidden = items.length < 2;
  if (!$('viewer').open) $('viewer').showModal();
}
$('closeBtn').addEventListener('click', () => $('viewer').close());
$('prevBtn').addEventListener('click', () => show(open - 1));
$('nextBtn').addEventListener('click', () => show(open + 1));
$('viewer').addEventListener('click', e => { if (e.target === $('viewer')) $('viewer').close(); });
$('viewer').addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') show(open + (lang === 'fa' ? 1 : -1));
  if (e.key === 'ArrowRight') show(open + (lang === 'fa' ? -1 : 1));
});

function applyLang(l) {
  lang = l;
  translatePage(l, t);
  $('langBtn').textContent = t('otherLang');
  $('backLink').href = `index.html?lang=${l}`;
  if (items) render();
}
$('langBtn').addEventListener('click', () => applyLang(lang === 'fa' ? 'en' : 'fa'));
applyLang(lang);

fetch(`${KIND}/items.json`, { cache: 'no-cache' })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(list => { items = list; status = list.length ? 'ready' : 'empty'; render(); })
  .catch(() => { items = []; status = 'failed'; render(); });
