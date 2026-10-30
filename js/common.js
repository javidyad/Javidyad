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

// one line about a person from the Javidnam list: age, date of death (Persian calendar in Persian) and city,
// leaving out what the platform does not have
const dateFmt = {
  fa: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
};
export function personFacts(p, l) {
  const age = p.age && (l === 'fa' ? `${p.age.toLocaleString('fa')} ساله` : `${p.age} years old`);
  const died = p.died && dateFmt[l].format(new Date(p.died + 'T00:00:00Z'));
  const city = l === 'fa' ? p.city_fa : p.city;
  return [age, died, city].filter(Boolean).join(' · ');
}
