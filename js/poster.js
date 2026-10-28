// Poster maker (index.html): template, photo, name, preview, export, and the Javidnam list hookup.
import { $, params, urlLang, savedLang, translatePage } from './common.js?v=202610281656';

/* ---------- Language ---------- */
const STR = {
  en: {
    title: 'JavidYad', tagline: 'In memory of the Javidnaman', docTitle: 'JavidYad · In memory of the Javidnaman',
    pickMain: 'Choose a photo', pickChange: 'Photo selected. Tap to change it', pickSub: 'or drag and drop it here',
    privacy: 'Your photo is processed only on your device. It is never uploaded or sent anywhere.',
    lowRes: 'This image has a low resolution and may look blurry in a large print. Use a larger version if you have one.',
    nameLabel: 'Enter the full name in English letters', namePh: 'Full Name',
    zoomLabel: 'Photo zoom',
    hint: 'Drag the photo to reposition it. Pinch with two fingers, or use the slider or mouse wheel, to zoom.',
    previewAria: 'Poster preview',
    previewEmpty: 'This is how your finished poster will look. Choose a photo and type a name to fill it in.',
    paperLabel: 'PDF paper size', posterLangLabel: 'Poster language',
    save: 'Save to gallery', jpg: 'Download JPG', pdf: 'Download print PDF', reset: 'Reset',
    saveTip: 'In the menu that opens, choose “Save Image” (iPhone) or Photos / Gallery (Android).',
    preparing: 'Preparing…', done: 'Your poster is ready.', again: 'Make another poster',
    holdTip: 'Press and hold the image, then choose “Save Image” (iPhone) or “Download image” (Android).',
    dlFile: 'Download file', close: 'Close',
    inApp: 'You are in an in-app browser. If saving does not work, open this page in Safari or Chrome.',
    otherLang: 'فارسی', nameLatin: 'Only English letters are allowed in the name.',
    tplFail: 'The poster template (Template.jpg or Template-de.jpg) could not be loaded. Make sure both are in the same folder as this HTML file and that the page is opened from a server or host, not via file://.',
    imgFail: 'This file could not be read as an image.',
    jpgFail: 'JPG export failed: ',
    pdfLib: 'The PDF library did not load. Check your internet connection.',
    pdfFail: 'PDF export failed: ',
    fromListMain: 'Choose a Javidnam from the list', fromListSub: 'Their photo and name are filled in for you',
    or: 'or use your own photo', chosen: 'From the list:', chosenChange: 'Choose someone else',
    personFail: 'This person’s photo could not be loaded. Check your connection, or choose them again from the list.',
    sourceNote: 'The code of this site is public, so anyone can check that photos never leave the device.',
    sourceLink: 'View the code on GitHub'
  },
  fa: {
    title: 'جاویدیاد', tagline: 'به یاد جاویدنامان', docTitle: 'جاویدیاد · به یاد جاویدنامان',
    pickMain: 'انتخاب عکس', pickChange: 'عکس انتخاب شد. برای تغییر لمس کنید', pickSub: 'یا آن را اینجا بکشید و رها کنید',
    privacy: 'عکس شما فقط روی دستگاه خودتان پردازش می‌شود و به هیچ جا آپلود یا ارسال نمی‌شود.',
    lowRes: 'رزولوشن این عکس پایین است و در چاپ بزرگ کدر دیده می‌شود. اگر نسخه‌ی بزرگ‌تری دارید از آن استفاده کنید.',
    nameLabel: 'نام کامل را با حروف انگلیسی وارد کنید', namePh: 'Full Name',
    zoomLabel: 'زوم عکس',
    hint: 'عکس را بکشید تا جابه‌جا شود. با دو انگشت (پینچ)، اسلایدر یا چرخ ماوس می‌توانید زوم کنید.',
    previewAria: 'پیش‌نمایش پوستر',
    previewEmpty: 'پوستر نهایی شما این شکلی می‌شود. عکس را انتخاب کنید و اسم را بنویسید تا جایگزین شوند.',
    paperLabel: 'اندازه‌ی کاغذ PDF', posterLangLabel: 'زبان پوستر',
    save: 'ذخیره در گالری', jpg: 'دانلود JPG', pdf: 'دانلود PDF چاپی', reset: 'پاک کردن',
    saveTip: 'در منویی که باز می‌شود، «Save Image» (آیفون) یا Photos / Gallery (اندروید) را انتخاب کنید.',
    preparing: 'در حال آماده‌سازی…', done: 'پوستر شما آماده است.', again: 'ساخت پوستر جدید',
    holdTip: 'روی عکس انگشت را نگه دارید و «Save Image» (آیفون) یا «Download image» (اندروید) را بزنید.',
    dlFile: 'دانلود فایل', close: 'بستن',
    inApp: 'شما داخل مرورگر داخلی یک برنامه هستید. اگر ذخیره کار نکرد، صفحه را در Safari یا Chrome باز کنید.',
    otherLang: 'English', nameLatin: 'در نام فقط حروف انگلیسی مجاز است.',
    tplFail: 'قالب پوستر (Template.jpg یا Template-de.jpg) بارگذاری نشد. مطمئن شوید هر دو کنار همین فایل HTML هستند و صفحه را از روی سرور یا هاست باز کرده‌اید، نه با file://.',
    imgFail: 'این فایل به‌عنوان عکس خوانده نشد.',
    jpgFail: 'خطا در ساخت JPG: ',
    pdfLib: 'کتابخانه‌ی PDF بارگذاری نشد. اتصال اینترنت را بررسی کنید.',
    pdfFail: 'خطا در ساخت PDF: ',
    fromListMain: 'انتخاب از فهرست جاویدنامان', fromListSub: 'عکس و نام به‌طور خودکار پر می‌شوند',
    or: 'یا عکس خودتان را بگذارید', chosen: 'از فهرست:', chosenChange: 'انتخاب نفر دیگر',
    personFail: 'عکس این جاویدنام بارگذاری نشد. اتصال اینترنت را بررسی کنید یا دوباره از فهرست انتخابش کنید.',
    sourceNote: 'کد این سایت عمومی است تا هر کسی بتواند بررسی کند که عکس‌ها از دستگاه خارج نمی‌شوند.',
    sourceLink: 'دیدن کد در گیت‌هاب'
  }
};
let lang = 'en', lastError = null;
const t = k => STR[lang][k];

function renderError() {
  const b = $('errorBox');
  if (lastError) { b.className = lastError.kind; b.textContent = t(lastError.key) + lastError.extra; b.hidden = false; }
  else b.hidden = true;
}
function showMsg(key, extra = '', kind = 'error') { lastError = key ? { key, extra, kind } : null; renderError(); }
function showError(key, extra = '') { showMsg(key, extra, 'error'); }

function applyLang(l) {
  lang = l;
  translatePage(l, t);
  $('langBtn').textContent = t('otherLang');
  $('fromList').href = $('chosenChange').href = `javidnam.html?lang=${l}`;
  renderChosen();
  renderError();
}
function chooseLang(l) {
  applyLang(l);
  document.body.classList.remove('lang-pick');
  $('langScreen').hidden = $('intro').hidden = true;
  $('container').hidden = false;
}
// the last used language (or the browser language) is highlighted; the screen is still shown every time
const pref = savedLang();
document.querySelectorAll('[data-lang]').forEach(b => {
  if (b.dataset.lang !== pref) b.classList.add('alt');
  b.addEventListener('click', () => chooseLang(b.dataset.lang));
});
$('langBtn').addEventListener('click', () => applyLang(lang === 'fa' ? 'en' : 'fa'));
if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|; wv\)/i.test(navigator.userAgent)) $('inApp').hidden = false;

/* ---------- Settings (coordinates are on the full-size template canvas) ---------- */
const CONFIG = {
  templates: { en: 'Template.jpg', de: 'Template-de.jpg' },   // one background per poster language, same layout
  photoBox: { w: 3866, h: 3200, y: 1150, dx: 12 }, // photo box, matched to the width of the red lines above it; dx = small horizontal shift
  nameZone: { top: 4350, bottom: 5075 },        // empty zone between the photo and the red line
  nameMaxWidth: 3400, nameMaxSize: 340, nameMinSize: 140, nameColor: '#111111',
  latinFont: '"Archivo Black", "Arial Black", Impact, sans-serif',
  previewWidth: 900,
  shareMaxPixels: 9000000,                      // smaller export for the share sheet (renders fast)
  maxExportPixels: 16000000,                    // safe pixel limit for iOS Safari
  minPhotoSide: 1000,                           // warn below this on either side: the owner's rule, as in tools/build_javidnam.py
  focusY: 0.3                                   // default framing: 0.5 = centered, lower = shows more of the top (faces)
};

const canvas = $('posterCanvas'), ctx = canvas.getContext('2d');
const nameInput = $('nameInput'), zoomInput = $('zoomInput');
let template = null;          // background image for the chosen poster language
let design = null;            // pixel size of the English Template.jpg; every CONFIG coordinate is in this space
let templateReady = false, tplPreview = null;
let userImage = null, userPreview = null, imageURL = null;
let zoom = 1, panX = 0, panY = 0, previewScale = 0.2;

/* ---------- Template ---------- */
const tplCache = {};
function loadTemplate(l) {
  if (!tplCache[l]) {
    tplCache[l] = new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => { delete tplCache[l]; reject(new Error(CONFIG.templates[l])); };
      im.src = CONFIG.templates[l];
    });
  }
  return tplCache[l];
}
let tplRequest = 0;
async function setPosterLang(l) {
  const req = ++tplRequest;
  try {
    const en = await loadTemplate('en');
    if (!design) design = { w: en.naturalWidth, h: en.naturalHeight };
    const im = await loadTemplate(l);
    if (req !== tplRequest) return;            // a newer choice arrived while this one was loading
    template = im;
    previewScale = CONFIG.previewWidth / design.w;
    canvas.width = Math.round(design.w * previewScale);
    canvas.height = Math.round(design.h * previewScale);
    // downscale the big template once, so redraws while dragging stay fast (any resolution is stretched to the design size)
    tplPreview = document.createElement('canvas');
    tplPreview.width = canvas.width; tplPreview.height = canvas.height;
    const pc = tplPreview.getContext('2d');
    pc.imageSmoothingQuality = 'high';
    pc.drawImage(template, 0, 0, canvas.width, canvas.height);
    if (!templateReady) { try { await document.fonts.load('900 300px "Archivo Black"'); } catch (e) { /* fall back to system fonts */ } }
    templateReady = true;
    if (lastError && lastError.key === 'tplFail') showError('');
    redraw();
  } catch (e) {
    if (req === tplRequest) showError('tplFail');
  }
}
let posterLang = 'en';
try { posterLang = localStorage.getItem('posterLang') === 'de' ? 'de' : 'en'; } catch (e) {}
$('posterLang').value = posterLang;
$('posterLang').addEventListener('change', e => {
  posterLang = e.target.value;
  try { localStorage.setItem('posterLang', posterLang); } catch (err) {}
  $('done').hidden = true;
  setPosterLang(posterLang);
});
setPosterLang(posterLang);

/* ---------- User photo ---------- */
function makeUserPreview(img) {
  const k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
  if (k === 1) return img;
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
  const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}
function setPicked(has) {
  $('pick').classList.toggle('has', has);
  const m = $('pickMain'); m.dataset.i18n = has ? 'pickChange' : 'pickMain'; m.textContent = t(m.dataset.i18n);
}
let imageRequest = 0;
// own = picked by the user; list photos skip the low-resolution warning, since the user cannot swap them for a bigger file
function setImage(src, own) {
  const req = ++imageRequest;
  const img = new Image();
  img.onload = () => {
    if (req !== imageRequest) return;          // a newer photo was chosen while this one was loading
    userImage = img; userPreview = makeUserPreview(img);
    zoom = 1; zoomInput.value = 1; updateZoomLabel();
    panX = 0; panY = Math.max(0, (imageSize().h - CONFIG.photoBox.h) * (0.5 - CONFIG.focusY));
    $('lowRes').hidden = !own || Math.min(img.naturalWidth, img.naturalHeight) >= CONFIG.minPhotoSide;
    $('done').hidden = true; showError('');
    setPicked(own); redraw();
  };
  img.onerror = () => { if (req === imageRequest) showError(own ? 'imgFail' : 'personFail'); };
  img.src = src;
}
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  setChosen(null);
  if (imageURL) URL.revokeObjectURL(imageURL);
  imageURL = URL.createObjectURL(file);
  setImage(imageURL, true);
}

/* ---------- Javidnam list (javidnam.html, data in javidnam/people.json) ---------- */
let hasList = false, chosen = null;
function renderChosen() {
  $('chosen').hidden = !chosen;
  $('fromList').hidden = $('orLine').hidden = !hasList || !!chosen;
  if (!chosen) return;
  const where = lang === 'fa' ? chosen.city_fa || chosen.province_fa : chosen.city || chosen.province;
  $('chosenText').textContent = `${t('chosen')} ${lang === 'fa' ? chosen.name_fa : chosen.name}` + (where ? ` (${where})` : '');
}
function setChosen(p) {
  chosen = p; renderChosen();
  if (!p && params.has('p')) {                 // forget the person in the address, so a reload starts clean
    params.delete('p');
    const q = params.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
  }
}
fetch('javidnam/people.json', { cache: 'no-cache' })
  .then(r => (r.ok ? r.json() : []))
  .then(list => {
    hasList = list.length > 0;
    const p = list.find(x => x.id === params.get('p'));
    if (p) {
      setChosen(p);
      nameInput.value = p.name;
      setImage(`javidnam/photos/${encodeURIComponent(p.id)}.jpg`, false);
    } else renderChosen();
  })
  .catch(() => {});
$('imageInput').addEventListener('change', e => handleFile(e.target.files[0]));

const container = $('container');
['dragenter', 'dragover'].forEach(ev => container.addEventListener(ev, e => { e.preventDefault(); container.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(ev => container.addEventListener(ev, e => { e.preventDefault(); container.classList.remove('dragover'); }));
container.addEventListener('drop', e => { if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });

nameInput.addEventListener('input', e => {
  $('done').hidden = true;
  if (!e.isComposing) {
    const clean = nameInput.value.replace(/[^A-Za-z\s.'’-]/g, '');
    if (clean !== nameInput.value) { nameInput.value = clean; showMsg('nameLatin', '', 'warn'); }
    else if (lastError && lastError.key === 'nameLatin') showError('');
  }
  redraw();
});

/* ---------- Zoom and pan ---------- */
function updateZoomLabel() { $('zoomLabel').textContent = Math.round(zoom * 100) + '%'; }
function setZoom(z) {
  zoom = Math.min(3, Math.max(1, z));
  zoomInput.value = zoom; updateZoomLabel();
  clampPan(); redraw();
}
zoomInput.addEventListener('input', () => setZoom(parseFloat(zoomInput.value)));
canvas.addEventListener('wheel', e => {
  if (!userImage) return;
  e.preventDefault();
  setZoom(zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
}, { passive: false });
canvas.addEventListener('keydown', e => {
  if (!userImage) return;
  const m = { ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, -60], ArrowDown: [0, 60] }[e.key];
  if (m) { panX += m[0]; panY += m[1]; }
  else if (e.key === '+' || e.key === '=') zoom *= 1.1;
  else if (e.key === '-') zoom /= 1.1;
  else return;
  e.preventDefault(); setZoom(zoom);
});

function imageSize() {
  const { w, h } = CONFIG.photoBox;
  const r = userImage.naturalWidth / userImage.naturalHeight;
  const base = r > w / h ? { w: h * r, h } : { w, h: w / r };
  return { w: base.w * zoom, h: base.h * zoom };
}
function clampPan() {
  if (!userImage) return;
  const { w, h } = CONFIG.photoBox, s = imageSize();
  const maxX = (s.w - w) / 2, maxY = (s.h - h) / 2;
  panX = Math.min(maxX, Math.max(-maxX, panX));
  panY = Math.min(maxY, Math.max(-maxY, panY));
}

const pointers = new Map();
let gesture = null;
function toDesign(p) {
  const rect = canvas.getBoundingClientRect();
  const k = design.w / rect.width;
  return { x: (p.clientX - rect.left) * k, y: (p.clientY - rect.top) * k };
}
function pinchInfo(a, b) {
  return {
    dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1,
    mid: toDesign({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 })
  };
}
function startGesture() {
  const pts = [...pointers.values()];
  if (pts.length === 1) {
    const d = toDesign(pts[0]);
    gesture = { type: 'pan', sx: d.x - panX, sy: d.y - panY };
  } else if (pts.length >= 2) {
    gesture = { type: 'pinch', zoom, panX, panY, ...pinchInfo(pts[0], pts[1]) };
  } else gesture = null;
}
canvas.addEventListener('pointerdown', e => {
  if (!userImage) return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
  startGesture();
  canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove', e => {
  if (!gesture || !pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
  const pts = [...pointers.values()];
  if (gesture.type === 'pan' && pts.length === 1) {
    const p = toDesign(pts[0]);
    panX = p.x - gesture.sx; panY = p.y - gesture.sy;
  } else if (gesture.type === 'pinch' && pts.length >= 2) {
    const now = pinchInfo(pts[0], pts[1]);
    zoom = Math.min(3, Math.max(1, gesture.zoom * now.dist / gesture.dist));
    zoomInput.value = zoom; updateZoomLabel();
    panX = gesture.panX + (now.mid.x - gesture.mid.x);
    panY = gesture.panY + (now.mid.y - gesture.mid.y);
  } else return;
  clampPan(); redraw();
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  startGesture();
  if (!pointers.size) canvas.classList.remove('dragging');
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

/* ---------- Drawing ---------- */
let raf = 0;
// the preview and the export buttons appear only once there is a photo or a name
function updateState() {
  const has = !!userImage || nameInput.value.trim() !== '';
  $('stage').classList.toggle('sample', !has);   // small example until there is a photo or a name
  canvas.classList.toggle('idle', !userImage);
  $('hintNote').hidden = !userImage;
  $('emptyNote').hidden = !!userImage;
  $('zoomRow').hidden = !userImage;
  ['saveBtn', 'jpgBtn', 'pdfBtn'].forEach(id => { $(id).disabled = !(templateReady && has); });
}
function redraw() {
  updateState();
  if (!templateReady) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => render(ctx, previewScale, tplPreview, userPreview, true));
}

// choose the line break that makes both lines closest in width
function splitName(c, words) {
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(c.measureText(words.slice(0, i).join(' ')).width - c.measureText(words.slice(i).join(' ')).width);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

function drawName(c, W, allowPlaceholder) {
  let text = nameInput.value.trim().replace(/\s+/g, ' ');
  const isPh = !text && allowPlaceholder;
  if (isPh) text = 'Firstname Lastname';
  if (!text) return;
  const fontAt = sz => `900 ${sz}px ${CONFIG.latinFont}`;
  const words = text.split(' ');
  c.fillStyle = isPh ? '#d2ccbd' : CONFIG.nameColor;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.direction = 'ltr';

  c.font = fontAt(CONFIG.nameMaxSize);
  const lines = words.length > 1 ? splitName(c, words) : [text];
  let size = CONFIG.nameMaxSize;
  while (size > CONFIG.nameMinSize) {
    c.font = fontAt(size);
    if (Math.max(...lines.map(l => c.measureText(l).width)) <= CONFIG.nameMaxWidth) break;
    size -= 5;
  }
  c.font = fontAt(size);

  const { top, bottom } = CONFIG.nameZone;
  const capH = size * 0.72, gap = size * 0.18;
  const blockH = capH * lines.length + gap * (lines.length - 1);
  let y = top + (bottom - top - blockH) / 2 + capH;
  lines.forEach(l => { c.fillText(l, W / 2, y); y += capH + gap; });
}

// a ghosted frame and sample name, shown only in the preview (never exported) until the user adds their own
function drawPhotoPlaceholder(c, W) {
  const { w: bw, h: bh, y: by } = CONFIG.photoBox, bx = (W - bw) / 2 + (CONFIG.photoBox.dx || 0), cx = bx + bw / 2;
  c.save();
  c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
  c.fillStyle = '#ece8dd'; c.fillRect(bx, by, bw, bh);
  c.fillStyle = '#d3cdbd';
  c.beginPath(); c.arc(cx, by + bh * 0.4, bh * 0.17, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(cx, by + bh * 1.02, bw * 0.27, bh * 0.4, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  c.save();
  c.strokeStyle = '#bdb6a3'; c.lineWidth = 14; c.setLineDash([60, 40]);
  c.strokeRect(bx + 20, by + 20, bw - 40, bh - 40);
  c.restore();
}

function render(c, scale, tplSrc, imgSrc, ph) {
  const W = design.w, H = design.h;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.setTransform(scale, 0, 0, scale, 0, 0);
  c.drawImage(tplSrc || template, 0, 0, W, H);

  if (userImage) {
    const { w: bw, h: bh, y: by } = CONFIG.photoBox, bx = (W - bw) / 2 + (CONFIG.photoBox.dx || 0);
    const s = imageSize();
    c.save();
    c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
    c.imageSmoothingQuality = 'high';
    c.drawImage(imgSrc || userImage, bx + (bw - s.w) / 2 + panX, by + (bh - s.h) / 2 + panY, s.w, s.h);
    c.restore();
  } else if (ph) drawPhotoPlaceholder(c, W);
  drawName(c, W, ph);
}

/* ---------- Export ---------- */
function renderFull(limit = CONFIG.maxExportPixels) {
  const W = design.w, H = design.h;
  const k = Math.min(1, Math.sqrt(limit / (W * H)));
  const off = document.createElement('canvas');
  off.width = Math.round(W * k); off.height = Math.round(H * k);
  render(off.getContext('2d'), k);
  return off;
}
function fileBase() {
  const n = nameInput.value.trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
  return 'poster-' + (n || 'javidnam');
}
function makeJpegBlob(limit) {
  return new Promise((resolve, reject) => {
    try { renderFull(limit).toBlob(b => (b ? resolve(b) : reject(new Error('empty'))), 'image/jpeg', 0.95); }
    catch (e) { reject(e); }
  });
}
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function withBusy(btn, fn) {
  btn.disabled = true; btn.textContent = t('preparing');
  await new Promise(r => setTimeout(r, 30));   // let the "Preparing…" label paint first
  try { await fn(); } finally { btn.textContent = t(btn.dataset.i18n); updateState(); }
}

// fallback for browsers without a share sheet: show the poster as a normal image the user can press and hold
let resultBlob = null, resultName = '', resultURL = null;
function openResult(blob, name) {
  resultBlob = blob; resultName = name;
  resultURL = URL.createObjectURL(blob);
  $('resultImg').src = resultURL;
  $('modal').hidden = false;
  $('closeBtn').focus();
}
function closeResult() {
  $('modal').hidden = true;
  $('resultImg').removeAttribute('src');
  if (resultURL) URL.revokeObjectURL(resultURL);
  resultURL = null;
}
$('closeBtn').addEventListener('click', closeResult);
$('dlBtn').addEventListener('click', () => downloadBlob(resultBlob, resultName));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) closeResult(); });

$('saveBtn').addEventListener('click', () => withBusy($('saveBtn'), async () => {
  showError('');
  try {
    const blob = await makeJpegBlob(CONFIG.shareMaxPixels);
    const file = new File([blob], fileBase() + '.jpg', { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); $('done').hidden = false; return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    openResult(blob, file.name);
    $('done').hidden = false;
  } catch (e) { showError('jpgFail', e.message); }
}));

$('jpgBtn').addEventListener('click', () => withBusy($('jpgBtn'), async () => {
  showError('');
  try { downloadBlob(await makeJpegBlob(), fileBase() + '.jpg'); $('done').hidden = false; }
  catch (e) { showError('jpgFail', e.message); }
}));

$('pdfBtn').addEventListener('click', () => withBusy($('pdfBtn'), async () => {
  showError('');
  if (!window.jspdf) return showError('pdfLib');
  try {
    const off = renderFull();
    const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: $('paperSize').value, orientation: 'portrait' });
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    let w = pw, h = pw * off.height / off.width;
    if (h > ph) { h = ph; w = ph * off.width / off.height; }
    pdf.addImage(off.toDataURL('image/jpeg', 0.95), 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h, undefined, 'FAST');
    pdf.save(fileBase() + '.pdf');
    $('done').hidden = false;
  } catch (e) { showError('pdfFail', e.message); }
}));

function resetAll() {
  if (imageURL) URL.revokeObjectURL(imageURL);
  imageURL = userImage = userPreview = null;
  zoom = 1; panX = panY = 0; zoomInput.value = 1; updateZoomLabel();
  $('imageInput').value = ''; nameInput.value = '';
  imageRequest++; setChosen(null);
  $('lowRes').hidden = true; $('done').hidden = true; showError('');
  setPicked(false); redraw();
}
$('resetBtn').addEventListener('click', resetAll);
$('againBtn').addEventListener('click', () => { resetAll(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

// links from the list page carry ?lang=, so those visitors go straight to the form
if (urlLang) chooseLang(urlLang);
