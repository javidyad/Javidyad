// Language screen scenes (above and below the language card): Frankfurt at night, a crowd holding up the
// finished posters of Javidnaman and the Prince's portrait, Lion and Sun flags. Inline SVG, animated with CSS
// (css/poster.css, .intro-*). The scene is laid out for the width it gets: a phone shows about ten placards,
// a wide desktop window many more. Nothing moves when the visitor asks for reduced motion.
import { $, urlLang } from './common.js?v=202610281717';

const H = 300, HORIZON = 196;                       // the drawing is always 300 units high; its width follows the screen
const NS = 'http://www.w3.org/2000/svg';
const PRINCE = [1, 2, 3, 4].map(i => `intro/prince-${i}.jpg`);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

// a fixed pseudo-random sequence, so the skyline looks the same on every visit
function sequence(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function skyline(W) {
  const r = sequence(7);
  let out = '';
  for (let x = -6; x < W; ) {
    const w = 22 + r() * 22, h = 44 + r() * 60;
    out += `<rect x="${x.toFixed(1)}" y="${(HORIZON - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
    for (let wy = HORIZON - h + 6; wy < HORIZON - 4; wy += 7) {
      for (let wx = x + 4; wx < x + w - 3; wx += 6) if (r() < 0.28) out += `<rect class="intro-win" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2" height="3"/>`;
    }
    x += w - 2 + r() * 6;
  }
  // Frankfurt's landmarks: Messeturm (pencil top), Commerzbank tower (mast), Main Tower, the cathedral spire.
  // On a wide screen the skyline repeats them every 560 units.
  for (let o = 0; o < W; o += 560) {
    out += `<path d="M${o + 118} ${HORIZON}V78h26v18l-13-26-13 26z"/>`;
    out += `<path d="M${o + 176} ${HORIZON}V62h28V${HORIZON}z M${o + 189} 62V34h2v28z"/>`;
    out += `<path d="M${o + 222} ${HORIZON}V88q12-10 24 0V${HORIZON}z"/>`;
    out += `<path d="M${o + 462} ${HORIZON}V122h8V96l6-6 6 6v26h8V${HORIZON}z M${o + 476} 90l-4-8 4-40 4 40z"/>`;
  }
  return `<g class="intro-city">${out}</g>`;
}

function stars(W) {
  let out = '';
  for (let i = 0; i < W / 16; i++) {
    out += `<circle class="intro-star" cx="${rand(4, W - 4).toFixed(1)}" cy="${rand(4, 120).toFixed(1)}" r="${rand(0.5, 1.3).toFixed(2)}" style="animation-delay:${rand(0, 4).toFixed(2)}s"/>`;
  }
  return out;
}

// one person in the crowd, seen from behind; holding a placard above the head when `card` is given.
// A placard is a finished poster (javidnam/placards/) or a portrait of the Prince; each has two images, so a new
// picture loads into the hidden one and then they crossfade.
function person(x, y, s, card) {
  const body = `<circle cx="${x}" cy="${y}" r="${12 * s}"/><rect x="${x - 22 * s}" y="${y + 13 * s}" width="${44 * s}" height="${H}" rx="${18 * s}"/>`;
  if (!card) return `<g class="intro-crowd">${body}</g>`;
  const cw = 64 * s, ch = 90.5 * s, cx = x - cw / 2, cy = y - 16 * s - ch;
  const pic = `<image class="intro-face" x="${cx}" y="${cy}" width="${cw}" height="${ch}" preserveAspectRatio="xMidYMid slice"/>`;
  return `<g class="intro-card${card.prince ? ' intro-prince' : ''}" style="animation-delay:${card.delay}s">
      <path class="intro-arm" style="stroke-width:${8 * s}" d="M${x - 17 * s} ${y + 20 * s}L${cx + 9 * s} ${cy + ch - 3 * s} M${x + 17 * s} ${y + 20 * s}L${cx + cw - 9 * s} ${cy + ch - 3 * s}"/>
      <rect class="intro-board" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="1.5"/>${pic}${pic}
    </g><g class="intro-crowd">${body}</g>`;
}

// a Lion and Sun flag (the one in the poster header) on a pole held up from the crowd
function flag(x, top, w, delay) {
  const h = w / 1.196;
  return `<g>
    <rect class="intro-pole" x="${x - 1.2}" y="${top}" width="2.4" height="${H - top}"/>
    <g class="intro-flag" style="transform-origin:${x}px ${top + h / 2}px;animation-delay:${delay}s">
      <image href="intro/flag.jpg" x="${x}" y="${top}" width="${w}" height="${h}" preserveAspectRatio="none"/>
      <rect x="${x}" y="${top}" width="${w}" height="${h}" fill="url(#intro-shade)"/>
    </g>
  </g>`;
}

// `variant` 0 or 1 shifts who holds a placard and where the flags stand, so the two scenes differ
function build(W, variant) {
  const back = [], front = [];
  for (let x = 10; x < W; x += 26) back.push(x);
  const fn = Math.max(5, Math.round((W - 36) / 54));
  for (let i = 0; i <= fn; i++) front.push(18 + i * (W - 36) / fn);
  const mid = front.reduce((best, x, i) => (Math.abs(x - W / 2) < Math.abs(front[best] - W / 2) ? i : best), 0);   // the Prince, in the middle
  const backRow = back.map((x, i) => person(x, 246 + (i % 2) * 4, 0.6, (i + variant * 2) % 4 === 1 && { delay: (i % 5) * 0.5 })).join('');
  const frontRow = front.map((x, i) => {
    const prince = i === mid, card = prince || (i !== mid - 1 && i !== mid + 1 && (i + variant) % 2 === 1);
    return person(x, 266 + (i % 3) * 3, 0.92, card && { delay: (i % 4) * 0.6 + 0.3, prince });
  }).join('');
  // flags: about one per 140 units, alternating behind and in front of the back row, kept off the Prince
  const nf = Math.max(4, Math.round(W / 140)), flagsBack = [], flagsFront = [];
  for (let k = 0; k < nf; k++) {
    let x = (k + 0.5 + (variant ? 0.35 : 0)) * W / nf;
    if (x > W - 66) x -= W / nf / 2;
    if (Math.abs(x - front[mid]) < 40) x += 70;
    (k % 2 ? flagsBack : flagsFront).push(k % 2 ? flag(x, 54 + (k * 7) % 12, 46 + (k % 3) * 2, (k * 0.37) % 1.6) : flag(x, 90 + (k * 5) % 8, 60 + (k % 2) * 4, (k * 0.53) % 1.6));
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="${NS}">
    <defs>
      <linearGradient id="intro-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2550"/><stop offset="1" stop-color="#071931"/></linearGradient>
      <radialGradient id="intro-glow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#fec96b" stop-opacity=".22"/><stop offset="1" stop-color="#fec96b" stop-opacity="0"/></radialGradient>
      <linearGradient id="intro-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#intro-sky)"/>
    ${stars(W)}
    <rect y="${HORIZON - 120}" width="${W}" height="140" fill="url(#intro-glow)"/>
    ${skyline(W)}
    <rect class="intro-river" y="${HORIZON}" width="${W}" height="${H - HORIZON}"/>
    ${flagsBack.join('')}${backRow}${flagsFront.join('')}${frontRow}
  </svg>`;
}

// links from the list page (?lang=) skip the language screen, so they skip the scenes too
const hosts = [$('intro'), $('introBottom')].filter(Boolean);
if (hosts.length && !urlLang) {
  let posters = [], princes = [], people = [], next = 0, nextPrince = 0;
  const swap = (pair, src) => {
    const [shown, spare] = pair[0].classList.contains('on') ? pair : [pair[1], pair[0]];
    const img = new Image();
    img.onload = () => { spare.setAttribute('href', src); spare.classList.add('on'); shown.classList.remove('on'); };
    img.src = src;
  };
  const nextPoster = pair => people.length && swap(pair, `javidnam/placards/${encodeURIComponent(people[next++ % people.length].id)}.jpg`);
  const nextPortrait = pair => swap(pair, PRINCE[nextPrince++ % PRINCE.length]);

  // (re)draw both scenes for their current width, and fill the placards
  let drawnFor = '';
  const draw = () => {
    const sizes = hosts.map(h => Math.round(H * h.clientWidth / Math.max(1, h.clientHeight)));
    if (sizes.join() === drawnFor || hosts[0].hidden) return;
    drawnFor = sizes.join();
    hosts.forEach((h, i) => { h.innerHTML = build(Math.max(400, sizes[i]), i % 2); });
    const pairs = sel => hosts.flatMap(h => [...h.querySelectorAll(sel)].map(c => [...c.querySelectorAll('.intro-face')]));
    posters = pairs('.intro-card:not(.intro-prince)');
    princes = pairs('.intro-prince');
    princes.forEach(nextPortrait);
    if (people.length) posters.forEach(nextPoster);
    else if (peopleLoaded) posters.forEach(([a]) => a.closest('.intro-card').remove());
  };
  let peopleLoaded = false;
  draw();
  let resizing;
  addEventListener('resize', () => { clearTimeout(resizing); resizing = setTimeout(draw, 300); });

  fetch('javidnam/people.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : []))
    .catch(() => [])
    .then(list => {
      // one shuffled queue for both scenes, so the same person is not up twice at once
      people = [...list].sort(() => Math.random() - 0.5);
      peopleLoaded = true;
      if (people.length) posters.forEach(nextPoster);
      else posters.forEach(([a]) => a.closest('.intro-card').remove());
      if (reduced) return;
      // about every second a different poster placard, in either scene, fades to another person;
      // the Prince's placards change portrait every few seconds
      let last = -1, tick = 0;
      const timer = setInterval(() => {
        if (hosts[0].hidden) return clearInterval(timer);
        if (people.length && posters.length) {
          let i;
          do i = Math.floor(Math.random() * posters.length); while (i === last && posters.length > 1);
          last = i;
          nextPoster(posters[i]);
        }
        if (++tick % 5 === 0) princes.forEach(nextPortrait);
      }, 900);
    });
}
