// Language screen scene: Frankfurt at night, a crowd holding up placards of Javidnaman, a Lion and Sun flag.
// Drawn as inline SVG, animated with CSS (css/poster.css, .intro-*). The placards show real people from
// javidnam/people.json and change every few seconds. Nothing moves when the visitor asks for reduced motion.
import { $, urlLang } from './common.js?v=202610281641';

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

// one person in the crowd, seen from behind; holding a placard above the head when `card` is given
function person(x, y, s, card) {
  const body = `<circle cx="${x}" cy="${y}" r="${12 * s}"/><rect x="${x - 22 * s}" y="${y + 13 * s}" width="${44 * s}" height="${H}" rx="${18 * s}"/>`;
  if (!card) return `<g class="intro-crowd">${body}</g>`;
  const cw = 78 * s, ch = 102 * s, cx = x - cw / 2, cy = y - 18 * s - ch;
  return `<g class="intro-card" style="animation-delay:${card.delay}s">
      <path class="intro-arm" style="stroke-width:${8 * s}" d="M${x - 17 * s} ${y + 20 * s}L${cx + 10 * s} ${cy + ch - 4 * s} M${x + 17 * s} ${y + 20 * s}L${cx + cw - 10 * s} ${cy + ch - 4 * s}"/>
      <rect class="intro-board" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="2"/>
      <image class="intro-face" x="${cx + 5 * s}" y="${cy + 5 * s}" width="${cw - 10 * s}" height="${ch - 10 * s}" preserveAspectRatio="xMidYMid slice"/>
    </g><g class="intro-crowd">${body}</g>`;
}

function flag(x, y) {
  // pole held up from the crowd; the cloth waves around the pole
  return `<g class="intro-flag-group">
    <rect class="intro-pole" x="${x - 1.5}" y="${y}" width="3" height="${H - y}"/>
    <g class="intro-flag" style="transform-origin:${x}px ${y + 30}px">
      <rect x="${x}" y="${y}" width="96" height="20" fill="#239f40"/>
      <rect x="${x}" y="${y + 20}" width="96" height="20" fill="#ffffff"/>
      <rect x="${x}" y="${y + 40}" width="96" height="20" fill="#da0000"/>
      <image href="Lion_and_Sun.png" x="${x + 34}" y="${y + 21}" width="28" height="18" preserveAspectRatio="xMidYMid meet"/>
      <rect x="${x}" y="${y}" width="96" height="60" fill="url(#intro-shade)"/>
    </g>
  </g>`;
}

function build() {
  const cards = [[72, 258, 1, 0], [200, 266, 0.9, 0.9], [398, 260, 1, 0.4], [508, 268, 0.88, 1.3]];
  const back = [14, 40, 112, 138, 160, 246, 272, 300, 334, 356, 444, 470, 548].map(x => person(x, 270, 0.72)).join('');
  const front = cards.map(([x, y, s, delay]) => person(x, y, s, { delay })).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="${NS}">
    <defs>
      <linearGradient id="intro-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2550"/><stop offset="1" stop-color="#071931"/></linearGradient>
      <radialGradient id="intro-glow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#fec96b" stop-opacity=".22"/><stop offset="1" stop-color="#fec96b" stop-opacity="0"/></radialGradient>
      <linearGradient id="intro-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".15"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#intro-sky)"/>
    ${stars()}
    <rect y="${HORIZON - 120}" width="${W}" height="140" fill="url(#intro-glow)"/>
    ${skyline()}
    <rect class="intro-river" y="${HORIZON}" width="${W}" height="${H - HORIZON}"/>
    ${back}${flag(300, 74)}${front}
  </svg>`;
}

const host = $('intro');
// links from the list page (?lang=) skip the language screen, so they skip the scene too
if (host && !urlLang) {
  host.innerHTML = build();
  const faces = [...host.querySelectorAll('.intro-face')];
  fetch('javidnam/people.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : []))
    .then(people => {
      if (!people.length) { host.querySelectorAll('.intro-card').forEach(c => c.remove()); return; }
      const order = [...people].sort(() => Math.random() - 0.5);
      let next = 0;
      const show = (face, person) => {
        const src = `javidnam/thumbs/${encodeURIComponent(person.id)}.jpg`;
        const img = new Image();
        img.onload = () => { face.setAttribute('href', src); face.classList.add('on'); };
        img.src = src;
      };
      faces.forEach(f => show(f, order[next++ % order.length]));
      if (reduced) return;
      // every few seconds one placard fades to another person, round the crowd
      let turn = 0;
      const timer = setInterval(() => {
        if (host.hidden) return clearInterval(timer);
        const face = faces[turn++ % faces.length];
        face.classList.remove('on');
        setTimeout(() => show(face, order[next++ % order.length]), 600);
      }, 2600);
    })
    .catch(() => {});
}
