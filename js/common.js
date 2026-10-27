// Shared by every page: DOM helpers and the interface language (English or Persian).
export const $ = id => document.getElementById(id);

export function el(tag, props, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids.filter(k => k != null));
  return e;
}

export const params = new URLSearchParams(location.search);
const isLang = l => l === 'en' || l === 'fa';
// links between the pages carry ?lang=
export const urlLang = isLang(params.get('lang')) ? params.get('lang') : null;
// the language used here last time, or the browser's
export function savedLang() {
  let l = null;
  try { l = localStorage.getItem('lang'); } catch (e) {}
  return isLang(l) ? l : /^fa/i.test(navigator.language) ? 'fa' : 'en';
}

// direction, font, title and every data-i18n / data-i18n-ph / data-i18n-aria text
export function translatePage(l, t) {
  try { localStorage.setItem('lang', l); } catch (e) {}
  const d = document.documentElement;
  d.lang = l; d.dir = l === 'fa' ? 'rtl' : 'ltr';
  document.body.classList.toggle('fa', l === 'fa');
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
}
