// Language screen background: Frankfurt at night behind the language card, with a crowd along the bottom of
// the screen holding up the finished posters of Javidnaman, the Prince's portrait in the middle, and Lion and Sun
// flags. Inline SVG, animated with CSS (css/poster.css, .intro-*). The crowd band is laid out for the width it gets:
// a phone shows about six posters, a desktop about fifteen. Nothing moves when the visitor asks for reduced motion.
import { $, urlLang } from './common.js?v=202610281732';

const H = 300, HORIZON = 196;                       // the crowd band is always 300 units high; its width follows the screen
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

function stars(w, h) {
  let out = '';
  for (let i = 0; i < w * h / 9000; i++) {
    out += `<circle class="intro-star" cx="${rand(2, w - 2).toFixed(1)}" cy="${rand(2, h - 2).toFixed(1)}" r="${rand(0.5, 1.4).toFixed(2)}" style="animation-delay:${rand(0, 4).toFixed(2)}s"/>`;
  }
  return `<svg class="intro-stars" viewBox="0 0 ${w} ${h}" xmlns="${NS}">${out}</svg>`;
}

// one person in the crowd, seen from behind. With `card` they hold a placard above the head: a finished poster
// (javidnam/placards/) or a portrait of the Prince, with two images so a new picture loads into the hidden one and
// then they crossfade. With `pole` they hold a flagpole up with both hands (the flag itself is in the sky layer).
function person(x, y, s, card, pole) {
  const body = `<circle cx="${x}" cy="${y}" r="${12 * s}"/><rect x="${x - 22 * s}" y="${y + 13 * s}" width="${44 * s}" height="${H}" rx="${18 * s}"/>`;
  if (pole) {
    return `<g class="intro-crowd"><path class="intro-arm" style="stroke-width:${8 * s}" d="M${x - 17 * s} ${y + 20 * s}L${x - 3 * s} ${y - 20 * s} M${x + 17 * s} ${y + 20 * s}L${x + 3 * s} ${y - 32 * s}"/>${body}</g>`;
  }
  if (!card) return `<g class="intro-crowd">${body}</g>`;
  const cw = 64 * s, ch = 90.5 * s, cx = x - cw / 2, cy = y - 16 * s - ch;
  const pic = `<image class="intro-face" x="${cx}" y="${cy}" width="${cw}" height="${ch}" preserveAspectRatio="xMidYMid slice"/>`;
  return `<g class="intro-card${card.prince ? ' intro-prince' : ''}" style="animation-delay:${card.delay}s">
      <path class="intro-arm" style="stroke-width:${8 * s}" d="M${x - 17 * s} ${y + 20 * s}L${cx + 9 * s} ${cy + ch - 3 * s} M${x + 17 * s} ${y + 20 * s}L${cx + cw - 9 * s} ${cy + ch - 3 * s}"/>
      <rect class="intro-board" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="1.5"/>${pic}${pic}
    </g><g class="intro-crowd">${body}</g>`;
}

// The crowd along the bottom of the screen, W units wide and H high. Returns the drawing and where the flag
// bearers' hands are, so the sky layer can run their poles up to the top of the screen.
function band(W, flagCount) {
  // narrow screens (phones) draw everything a little smaller, so whole posters fit
  const k = W < 500 ? 0.8 : 1, edge = 44 * k;
  // back row: smaller, every third holds a poster; front row: bigger, every other one, the Prince in the middle
  const back = [], front = [];
  for (let x = 14; x < W; x += 36 * k) back.push(x);
  const fn = 2 * Math.max(2, Math.round((W - 2 * edge) / (128 * k)));   // an even number of gaps, so someone stands in the middle
  for (let i = 0; i <= fn; i++) front.push(edge + i * (W - 2 * edge) / fn);
  const mid = front.reduce((best, x, i) => (Math.abs(x - W / 2) < Math.abs(front[best] - W / 2) ? i : best), 0);
  const hasCard = i => i !== mid && i !== mid - 1 && i !== mid + 1 && (i - mid) % 2 === 0;
  // flag bearers: front-row people without a placard, spread evenly, one or more on each side of the Prince
  // (not the rightmost person: a flag flies to the right of its pole and would leave the screen)
  const free = front.map((x, i) => i).filter(i => i !== mid && i !== fn && !hasCard(i));
  const bearers = new Set();
  for (let f = 0; f < Math.min(flagCount, free.length); f++) bearers.add(free[Math.round((f + 0.5) * free.length / Math.min(flagCount, free.length) - 0.5)]);
  const hands = [];
  const backRow = back.map((x, i) => person(x, 244 + (i % 2) * 4, 0.74 * k, i % 3 === 1 && { delay: (i % 5) * 0.5 })).join('');
  const frontRow = front.map((x, i) => {
    if (i === mid) return person(x, 262, 1.22 * k, { delay: 0.2, prince: true });
    const y = 266 + (i % 3) * 3, s = 1.06 * k;
    if (bearers.has(i)) { hands.push({ x, y: y - 32 * s }); return person(x, y, s, null, true); }
    return person(x, y, s, hasCard(i) && { delay: (i % 4) * 0.6 + 0.3 });
  }).join('');
  const svg = `<svg class="intro-band" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="${NS}">
    <defs>
      <radialGradient id="intro-glow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#fec96b" stop-opacity=".22"/><stop offset="1" stop-color="#fec96b" stop-opacity="0"/></radialGradient>
    </defs>
    <rect y="${HORIZON - 120}" width="${W}" height="140" fill="url(#intro-glow)"/>
    ${skyline(W)}
    <rect class="intro-river" y="${HORIZON}" width="${W}" height="${H - HORIZON}"/>
    ${backRow}${frontRow}
  </svg>`;
  return { svg, hands };
}

// The flags fly at the top of the screen, above the language card and above everything else; their poles run down
// behind the card to the bearers' hands in the crowd. In screen pixels. Nothing is drawn over a flag.
function sky(vw, vh, hands, toPx, cardTop) {
  const w = vw < 600 ? 66 : 96, h = w / 1.196;
  let out = '';
  hands.forEach((hand, i) => {
    const x = hand.x * toPx.x, bottom = toPx.top + hand.y * toPx.y;
    if (x + w > vw - 6) return;                                   // the cloth would leave the screen
    const top = Math.max(8, Math.min(i % 2 ? 30 : 14, cardTop - h - 12));
    out += `<rect class="intro-pole" x="${(x - 1.6).toFixed(1)}" y="${top}" width="3.2" height="${(bottom - top).toFixed(1)}"/>
      <circle class="intro-pole" cx="${x.toFixed(1)}" cy="${top - 3}" r="3.4"/>
      <g class="intro-flag" style="transform-origin:${x.toFixed(1)}px ${(top + h / 2).toFixed(1)}px;animation-delay:${(i * 0.45) % 1.6}s">
        <image href="intro/flag.jpg" x="${x.toFixed(1)}" y="${top}" width="${w}" height="${h.toFixed(1)}" preserveAspectRatio="none"/>
        <rect x="${x.toFixed(1)}" y="${top}" width="${w}" height="${h.toFixed(1)}" fill="url(#intro-shade)"/>
      </g>`;
  });
  return `<svg class="intro-sky" viewBox="0 0 ${vw} ${vh}" xmlns="${NS}">
    <defs><linearGradient id="intro-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
    ${out}</svg>`;
}

// links from the list page (?lang=) skip the language screen, so they skip the scenes too
const hosts = [$('intro')].filter(Boolean);
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
    const host = hosts[0], bandH = Math.round(Math.min(480, Math.max(220, innerHeight * 0.45)));
    const size = `${host.clientWidth}x${host.clientHeight}x${bandH}`;
    if (size === drawnFor || host.hidden) return;
    drawnFor = size;
    host.style.setProperty('--band', bandH + 'px');
    const vw = host.clientWidth, vh = host.clientHeight, W = Math.max(280, Math.round(H * vw / bandH));
    const crowd = band(W, vw < 600 ? 2 : Math.max(3, Math.round(vw / 260)));
    const toPx = { x: vw / W, y: bandH / H, top: vh - bandH };
    host.innerHTML = stars(vw, Math.max(100, vh - bandH * 0.6)) + crowd.svg + sky(vw, vh, crowd.hands, toPx, $('langScreen').getBoundingClientRect().top);
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
      // a calm pace: every 2.4 s one poster fades to another person; the Prince's portrait changes every ~10 s
      let last = -1, tick = 0;
      const timer = setInterval(() => {
        if (hosts[0].hidden) return clearInterval(timer);
        if (people.length && posters.length) {
          let i;
          do i = Math.floor(Math.random() * posters.length); while (i === last && posters.length > 1);
          last = i;
          nextPoster(posters[i]);
        }
        if (++tick % 4 === 0) princes.forEach(nextPortrait);
      }, 2400);
    });
}
