// Language screen scene: Frankfurt at night, a crowd holding up placards of Javidnaman, a Lion and Sun flag.
// Drawn as inline SVG, animated with CSS (css/poster.css, .intro-*). The placards show real people from
// javidnam/people.json and change every few seconds. Nothing moves when the visitor asks for reduced motion.
import { $, urlLang } from './common.js?v=202610281701';

const W = 560, H = 300, HORIZON = 196;
const NS = 'http://www.w3.org/2000/svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

// a deterministic sprinkle, so the skyline looks the same on every visit
let seed = 7;
const det = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function skyline() {
  // [x, width, height] of plain towers, then the landmarks drawn by hand
  const towers = [[0, 34, 46], [30, 26, 70], [52, 40, 58], [96, 22, 92], [150, 30, 78], [206, 38, 66], [246, 24, 104],
    [272, 44, 60], [318, 30, 84], [352, 42, 54], [396, 28, 72], [428, 36, 50], [500, 30, 62], [528, 40, 44]];
  let out = '';
  for (const [x, w, h] of towers) {
    out += `<rect x="${x}" y="${HORIZON - h}" width="${w}" height="${h}"/>`;
    for (let wy = HORIZON - h + 6; wy < HORIZON - 4; wy += 7) {
      for (let wx = x + 4; wx < x + w - 3; wx += 6) if (det() < 0.28) out += `<rect class="intro-win" x="${wx}" y="${wy}" width="2" height="3"/>`;
    }
  }
  // Messeturm (pencil top), Commerzbank tower (with mast), Main Tower, and the cathedral spire
  out += `<path d="M118 ${HORIZON}V78h26v18l-13-26-13 26z"/>`;
  out += `<path d="M176 ${HORIZON}V62h28V${HORIZON}z M189 62V34h2v28z"/>`;
  out += `<path d="M222 ${HORIZON}V88q12-10 24 0V${HORIZON}z"/>`;
  out += `<path d="M462 ${HORIZON}V122h8V96l6-6 6 6v26h8V${HORIZON}z M476 90l-4-8 4-40 4 40z"/>`;
  return `<g class="intro-city">${out}</g>`;
}

function stars() {
  let out = '';
  for (let i = 0; i < 34; i++) {
    out += `<circle class="intro-star" cx="${rand(4, W - 4).toFixed(1)}" cy="${rand(4, 120).toFixed(1)}" r="${rand(0.5, 1.3).toFixed(2)}" style="animation-delay:${rand(0, 4).toFixed(2)}s"/>`;
  }
  return out;
}

// one person in the crowd, seen from behind; holding a placard above the head when `card` is given.
// A placard is the finished poster (javidnam/placards/), or the Prince's photo on a plain board.
function person(x, y, s, card) {
  const body = `<circle cx="${x}" cy="${y}" r="${12 * s}"/><rect x="${x - 22 * s}" y="${y + 13 * s}" width="${44 * s}" height="${H}" rx="${18 * s}"/>`;
  if (!card) return `<g class="intro-crowd">${body}</g>`;
  const cw = 64 * s, ch = 90.5 * s, cx = x - cw / 2, cy = y - 16 * s - ch;
  const inner = card.prince
    ? `<rect class="intro-board" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="1.5"/>
       <image href="intro/prince.jpg" x="${cx + 3 * s}" y="${cy + 3 * s}" width="${cw - 6 * s}" height="${ch - 6 * s}" preserveAspectRatio="xMidYMin slice"/>`
    : `<rect class="intro-board" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="1.5"/>
       <image class="intro-face" x="${cx}" y="${cy}" width="${cw}" height="${ch}" preserveAspectRatio="xMidYMid slice"/>
       <image class="intro-face" x="${cx}" y="${cy}" width="${cw}" height="${ch}" preserveAspectRatio="xMidYMid slice"/>`;   // two, to crossfade
  return `<g class="intro-card" style="animation-delay:${card.delay}s">
      <path class="intro-arm" style="stroke-width:${8 * s}" d="M${x - 17 * s} ${y + 20 * s}L${cx + 9 * s} ${cy + ch - 3 * s} M${x + 17 * s} ${y + 20 * s}L${cx + cw - 9 * s} ${cy + ch - 3 * s}"/>
      ${inner}
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

// two arrangements, so the scenes above and below the language card do not look copied
const LAYOUTS = [
  { backCards: [36, 138, 240, 344, 448, 526], front: [[18], [74, 1], [128], [184, 1], [240], [286, 'prince'], [340], [392, 1], [446], [500, 1], [552]],
    flags: [[98, 58, 46, 0.7, 'back'], [414, 50, 50, 1.4, 'back'], [212, 92, 64, 0, 'front'], [468, 96, 60, 1, 'front']] },
  { backCards: [10, 112, 214, 318, 422, 500], front: [[22, 1], [76], [132, 1], [188], [244, 1], [298], [352, 1], [404], [458, 'prince'], [512], [552, 1]],
    flags: [[176, 54, 48, 0.3, 'back'], [496, 62, 44, 1.1, 'back'], [56, 94, 60, 0.6, 'front'], [322, 88, 64, 1.6, 'front']] },
];

function build(layout) {
  // back row: small, dense; front row: bigger. [x, placard?]
  const back = [10, 36, 60, 86, 112, 138, 162, 188, 214, 240, 266, 292, 318, 344, 370, 396, 422, 448, 474, 500, 526, 552];
  const backCards = new Set(layout.backCards), front = layout.front;
  const flags = row => layout.flags.filter(f => f[4] === row).map(([x, top, w, delay]) => flag(x, top, w, delay)).join('');
  const backRow = back.map((x, i) => person(x, 246 + (i % 2) * 4, 0.6, backCards.has(x) && { delay: (i % 5) * 0.5 })).join('');
  const frontRow = front.map(([x, c], i) => person(x, 266 + (i % 3) * 3, 0.92, c && { delay: (i % 4) * 0.6 + 0.3, prince: c === 'prince' })).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="${NS}">
    <defs>
      <linearGradient id="intro-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2550"/><stop offset="1" stop-color="#071931"/></linearGradient>
      <radialGradient id="intro-glow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#fec96b" stop-opacity=".22"/><stop offset="1" stop-color="#fec96b" stop-opacity="0"/></radialGradient>
      <linearGradient id="intro-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#intro-sky)"/>
    ${stars()}
    <rect y="${HORIZON - 120}" width="${W}" height="140" fill="url(#intro-glow)"/>
    ${skyline()}
    <rect class="intro-river" y="${HORIZON}" width="${W}" height="${H - HORIZON}"/>
    ${flags('back')}
    ${backRow}
    ${flags('front')}
    ${frontRow}
  </svg>`;
}

// links from the list page (?lang=) skip the language screen, so they skip the scenes too
const hosts = [$('intro'), $('introBottom')].filter(Boolean);
if (hosts.length && !urlLang) {
  hosts.forEach((host, i) => { host.innerHTML = build(LAYOUTS[i % LAYOUTS.length]); });
  // each poster placard has two images: the new poster loads into the hidden one, then they crossfade
  const faces = hosts.flatMap(h => [...h.querySelectorAll('.intro-card')].map(c => [...c.querySelectorAll('.intro-face')]).filter(f => f.length));
  fetch('javidnam/people.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : []))
    .then(people => {
      if (!people.length) { faces.forEach(([a]) => a.closest('.intro-card').remove()); return; }   // keep the Prince's placards
      // one shuffled queue for both scenes, so the same person is not up twice at once
      const order = [...people].sort(() => Math.random() - 0.5);
      let next = 0;
      const show = (pair, person) => {
        const src = `javidnam/placards/${encodeURIComponent(person.id)}.jpg`;
        const [shown, spare] = pair[0].classList.contains('on') ? pair : [pair[1], pair[0]];
        const img = new Image();
        img.onload = () => { spare.setAttribute('href', src); spare.classList.add('on'); shown.classList.remove('on'); };
        img.src = src;
      };
      faces.forEach(f => show(f, order[next++ % order.length]));
      if (reduced) return;
      // every second or so a different placard, in either scene, fades to another person
      let last = -1;
      const timer = setInterval(() => {
        if (hosts[0].hidden) return clearInterval(timer);
        let i;
        do i = Math.floor(Math.random() * faces.length); while (i === last && faces.length > 1);
        last = i;
        show(faces[i], order[next++ % order.length]);
      }, 900);
    })
    .catch(() => {});
}
