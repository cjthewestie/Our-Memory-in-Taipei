// design-kit.js: the designed pieces of the site's own furniture (kind B), shared by every scene.
//
// CJ, 2026-11-21/22: 「招牌可以有設計感一點 不行的話就用海報 反正也不是店家招牌」, then 「反正這些招牌 字都是要設計過的可以是
// 海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」.
// So an event marker, a photo-topic header, a gate board or an exhibition header is never a name plate. It is one of:
//   a POSTER in the graphic style of that event's kind and year, on a real mount (A-frame standee, lit case, column of pasted
//   posters, pole banners, a wall of pasted posters, a scaffold billboard); a STATUE on a designed plinth with a cast plate and a
//   floor ring; an INSTALLATION (ring tunnel, rainbow arch, giant lantern, bulb digits, hanging canopy, flower arch, a field of
//   phone glows, a book arch, an open-air screen, a firework burst); or a BOOTH (truss, tent, stage or container, with a printed
//   header band, a backdrop, a counter skirt, feather flags and props).
// Real places' own signs (a shop board, a temple plaque, a station plate) are kind (A) and are not drawn here.
// Research behind each layout and form: docs/signage/research/{posters,sculpture,booths}.md. The kit's guide: docs/signage/kit.md.
//
// Load before places.js. Everything is drawn in code: canvas shapes, patterns and gradients. No logos, no mascots, no likeness.
// ── API ──────────────────────────────────────────────────────────────────────────────────────
//   PLACES.add(E, item, { position, rotation, design: { form, layout, mount, palette, motif, ... } })   the usual way in
//   DESIGN.build(E, item, design) -> THREE.Group (front looks along +Z, origin on the ground; userData.foot / feet / height / plaqueAt)
//   DESIGN.choose(item, typeHint) -> the design a bare item gets (the curated one for its key, else read from its kind, years, wording)
//   DESIGN.posterTexture(E, item, design, pxWidth, aspect) · DESIGN.wideTexture(E, item, design, pxW, aspect, mode) -> CanvasTexture
//   DESIGN.headerTexture(E, topic, info, w, h) -> the exhibition graphic of a photo topic's showcase header
//   DESIGN.drawPoster(ctx, W, H, layout, spec) · DESIGN.spec(item, design) for a page that paints its own canvas
//   DESIGN.gateTexture(E, district, design, px, aspect) · DESIGN.signTexture(E, material, w, h, letter, key) (real signs: material + your lettering)
//   DESIGN.reloadArt() · DESIGN.artStatus(): the Midjourney paintings under asset/textures/ (see 'painted artwork' below); design.art picks or turns one off
// design fields: form 'poster'|'statue'|'installation'|'booth' · layout (LAYOUTS) · mount (MOUNTS) · palette (PAL key or 6 hex)
//   · motif (a drawn subject) · head (the headline) · big (the huge element: digits or a word) · kicker · venue · story
//   · variant (shifts the palette) · layouts (the mix on a wall or column) · plinth ('block'|'drum'|'podium') · piece (installation)
//   · booth (booth kind) · props · carpet · scale (on PLACES.add)
(function () {
  'use strict';
  const SANS = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';
  const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + SANS, WEI = '"Weibei TC",' + KAI, XING = '"Xingkai TC",' + KAI, SONG = '"Songti TC","LiSong Pro","PMingLiU",serif';
  const SERIF = 'Didot,"Bodoni 72",Georgia,"Times New Roman",serif', COND = '"Avenir Next Condensed","DIN Condensed","Arial Narrow",Impact,sans-serif', BLACK = '"Arial Black","Helvetica Neue",Arial,sans-serif';
  const ROUND = '"Arial Rounded MT Bold","Hiragino Maru Gothic ProN","Yuanti TC",' + SANS, MONO = '"American Typewriter","Courier New",monospace', DECO = 'Futura,"Avenir Next",' + SANS, NUM = '"Helvetica Neue",Arial,sans-serif';

  // ── seeded randomness: a poster repaints the same every time ───────────────────────────────
  function rng(seed) { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ── palettes: [ground, second ground, ink, accent a, accent b, accent c] (guesses from the research, docs/signage/research/posters.md)
  const PAL = {
    award: ['#0b0b10', '#2a1c2a', '#ffffff', '#c9a24a', '#f3d98b', '#a3142b'],   expo: ['#0e7a4a', '#16b3c9', '#ffffff', '#e4007f', '#f39800', '#ffe100'],
    games: ['#f4f1ea', '#ffffff', '#1d1d1d', '#0072bc', '#e60012', '#ffd200'],   esports: ['#0a0f2c', '#1a1050', '#ffffff', '#00c2ff', '#ff2e63', '#8a5cff'],
    concert: ['#f2e8d5', '#e9dcc2', '#1b1430', '#ff5a36', '#2b2dff', '#3a1e6b'], nightart: ['#0b1e5b', '#1b0c4a', '#ffffff', '#d7263d', '#ffe66d', '#9be7ff'],
    lantern: ['#c8102e', '#8f0b20', '#fff1cf', '#f2c14e', '#ffdf8a', '#1f1a3a'], anime: ['#6fd6ff', '#ffffff', '#2b2d7a', '#ff4fa3', '#ffe14f', '#38d39f'],
    premiere: ['#0e0d12', '#2a1a1c', '#f3e2b0', '#c9a24a', '#9c1418', '#e8d6a8'], painted: ['#1d3557', '#e76f51', '#fff4d6', '#f1c453', '#e63946', '#2a9d8f'],
    street: ['#f6efe0', '#efe3c8', '#1a1a1a', '#ff7f11', '#ffd60a', '#d62828'],  countdown: ['#050818', '#141a44', '#ffffff', '#ff3d7f', '#3ddcff', '#ffd23f'],
    news: ['#edebe6', '#dedad2', '#1a1a1a', '#b3261e', '#555555', '#8a8a8a'],    deco: ['#f1e6cf', '#14181f', '#14181f', '#c39a3e', '#1f4e5a', '#9c2a2a'],
    market: ['#c9a273', '#b48a5b', '#3a2412', '#c4201a', '#f2c14e', '#2f6b3a'],  memory: ['#e8dcc0', '#cdbb92', '#3b2a1a', '#9a3b26', '#2c4a5a', '#c8a050'],
    rainbow: ['#1a1a2e', '#25254a', '#ffffff', '#e2342c', '#f4d23c', '#2a6ac0'], orange: ['#ff7a00', '#ffb000', '#1a0f05', '#ffffff', '#7a1fa2', '#00b3a6'],
    temple: ['#7a1410', '#4a0c08', '#ffe9b0', '#f0c75a', '#1f6b5a', '#ffffff'],  hiphop: ['#111111', '#2a2a2a', '#f4f4f4', '#c6ff00', '#ff2bd6', '#ffffff'],
    river: ['#0d2a44', '#1d4e6e', '#fff6e0', '#ff7a59', '#ffd23f', '#9be7ff'],    sport: ['#0d3b66', '#0a2a4a', '#ffffff', '#f95738', '#ee964b', '#faf0ca'],
  };
  const LAYOUT_PAL = { award: 'award', expo: 'expo', games: 'games', esports: 'esports', concert: 'concert', nightart: 'nightart', lantern: 'lantern', anime: 'anime', premiere: 'premiere', painted: 'painted', street: 'street', countdown: 'countdown', news: 'news', deco: 'deco', market: 'market', memory: 'memory' };
  const pal = (p, v) => { const a = (Array.isArray(p) ? p : PAL[p]) || PAL.street, o = { bg: a[0], bg2: a[1], ink: a[2], a: a[3], b: a[4], c: a[5] };
    if (v) { const x = [o.a, o.b, o.c], s = v % 3; o.a = x[s]; o.b = x[(s + 1) % 3]; o.c = x[(s + 2) % 3]; } return o; };

  // ── lettering ───────────────────────────────────────────────────────────────────────────────
  const setF = (g, wt, px, face) => { g.font = `${wt} ${px}px ${face}`; };
  function fit(g, txt, px, maxW, face, wt) { setF(g, wt, px, face); const w = g.measureText(txt).width; if (w > maxW) { px = Math.max(6, px * maxW / w); setF(g, wt, px, face); } return px; }
  function tx(g, txt, x, y, px, maxW, face, wt, fill, align, base) { if (txt == null || txt === '') return 0; txt = String(txt); const q = fit(g, txt, px, maxW, face, wt);
    g.textAlign = align || 'center'; g.textBaseline = base || 'middle'; if (fill) g.fillStyle = fill; g.fillText(txt, x, y); return q; }
  const trk = (g, px) => { if ('letterSpacing' in g) g.letterSpacing = px ? Math.round(px) + 'px' : '0px'; };
  function tracked(g, txt, x, y, px, maxW, face, wt, fill, sp, align) { if (txt == null || txt === '') return 0; txt = String(txt); sp = sp == null ? 0.25 : sp; trk(g, 0); setF(g, wt, px, face);   // the tracking counts in the fit
    const w = g.measureText(txt).width + px * sp * [...txt].length; if (w > maxW) { px = Math.max(5, px * maxW / w); setF(g, wt, px, face); } trk(g, px * sp); g.textAlign = align || 'center'; g.textBaseline = 'middle'; if (fill) g.fillStyle = fill; g.fillText(txt, x, y); trk(g, 0); return px; }
  function vtext(g, txt, x, y0, px, face, wt, fill) { g.textAlign = 'center'; g.textBaseline = 'middle'; setF(g, wt, px, face); g.fillStyle = fill; [...String(txt)].forEach((c, i) => g.fillText(c, x, y0 + i * px * 1.06)); }
  function split2(t) { t = String(t || ''); const ch = [...t]; if (ch.length <= 8) return [t]; const mid = ch.length / 2; let best = -1, bd = 99;
    ch.forEach((c, i) => { if (/[\s·・：:「《（]/.test(c) && i > 1 && i < ch.length - 2) { const d = Math.abs(i - mid); if (d < bd) { bd = d; best = i; } } });
    if (best < 0) { best = Math.ceil(mid); const lat = i => /[A-Za-z0-9]/.test(ch[i] || ''); while (best < ch.length - 1 && lat(best) && lat(best - 1)) best++; while (best > 1 && lat(best) && lat(best - 1)) best--; } const a = ch.slice(0, best).join('').trim(), b = ch.slice(best).join('').replace(/^[\s·・：:]/, '').trim(); return [a, b]; }
  const lum = hex => { const n = parseInt(String(hex).slice(1, 7), 16); return ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) / 255; };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const disc = (g, x, y, r, c) => { if (c) g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0.3, r), 0, 6.2832); g.fill(); };
  function star4(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * 0.22 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
  function star5(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
  const grain = (g, W, H, n, rgb, a, R) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${rgb},${R() * a})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); } };
  const off = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return [c, c.getContext('2d')]; };
  function burst(g, x, y, r, n, c1, c2, R) { for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + R() * 0.05, q = r * (0.6 + R() * 0.4), gr = g.createLinearGradient(x, y, x + Math.cos(a) * q, y + Math.sin(a) * q);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, c1); gr.addColorStop(1, c2); g.strokeStyle = gr; g.lineWidth = Math.max(1, r * 0.018); g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.12, y + Math.sin(a) * r * 0.12); g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); g.stroke(); disc(g, x + Math.cos(a) * q, y + Math.sin(a) * q, r * 0.02, c2); } }
  const line = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };

  // ── drawn subjects (a box from -100 to 100; the caller sets the colour) ─────────────────────
  // stick figures are built from joints: head, neck, hip, two hands, two feet (and knees, elbows)
  const POSE = {
    run: [[10, -78], [4, -56], [-6, 4], [[22, -40], [44, -10]], [[-12, -42], [-36, -24]], [[14, 34], [-2, 86]], [[-20, 30], [-52, 52]]],
    swim: [[-60, -10], [-40, -6], [30, 6], [[-70, -40], [-96, -30]], [[-20, 16], [10, 30]], [[60, 0], [92, -6]], [[60, 14], [90, 22]]],
    jump: [[0, -84], [0, -62], [0, 0], [[-30, -84], [-44, -104]], [[30, -84], [44, -104]], [[-22, 36], [-40, 70]], [[22, 36], [40, 70]]],
    hoop: [[0, -70], [0, -50], [4, 10], [[18, -82], [30, -100]], [[-16, -82], [-20, -100]], [[-14, 44], [-20, 90]], [[22, 40], [30, 86]]],
    bat: [[-10, -74], [-8, -52], [0, 8], [[20, -60], [40, -70]], [[18, -54], [38, -62]], [[-24, 44], [-38, 88]], [[22, 44], [34, 88]]],
    lift: [[0, -64], [0, -44], [0, 14], [[-40, -60], [-44, -96]], [[40, -60], [44, -96]], [[-30, 44], [-36, 90]], [[30, 44], [36, 90]]],
    dance: [[14, -76], [8, -54], [-4, 2], [[40, -66], [70, -92]], [[-24, -40], [-60, -54]], [[30, 30], [64, 40]], [[-16, 40], [-30, 92]]],
    stand: [[0, -78], [0, -56], [0, 8], [[-22, -30], [-26, 6]], [[22, -30], [26, 6]], [[-10, 48], [-12, 92]], [[10, 48], [12, 92]]],
  };
  function stick(g, pose, cx, cy, r, c) { const P = POSE[pose] || POSE.stand, k = r / 100, X = p => cx + p[0] * k, Y = p => cy + p[1] * k;
    g.save(); g.strokeStyle = g.fillStyle = c; g.lineCap = g.lineJoin = 'round'; g.lineWidth = 13 * k; disc(g, X(P[0]), Y(P[0]), 15 * k);
    line(g, [[X(P[1]), Y(P[1])], [X(P[2]), Y(P[2])]]); [3, 4].forEach(i => line(g, [[X(P[1]), Y(P[1])], [X(P[i][0]), Y(P[i][0])], [X(P[i][1]), Y(P[i][1])]]));
    [5, 6].forEach(i => line(g, [[X(P[2]), Y(P[2])], [X(P[i][0]), Y(P[i][0])], [X(P[i][1]), Y(P[i][1])]])); g.restore(); }
  const MOTIF = {
    mic(g) { g.beginPath(); g.ellipse(0, -50, 34, 46, 0, 0, 6.2832); g.fill(); g.lineWidth = 11; g.beginPath(); g.arc(0, -34, 54, 0.15, Math.PI - 0.15); g.stroke(); line(g, [[0, 20], [0, 82]]); line(g, [[-40, 88], [40, 88]]); },
    star(g) { star5(g, 0, 4, 92, g.fillStyle); },
    tower(g) { g.fillRect(-34, 74, 68, 22); for (let i = 0; i < 8; i++) { const y = 72 - (i + 1) * 17; g.beginPath(); g.moveTo(-16, y + 15); g.lineTo(16, y + 15); g.lineTo(23, y); g.lineTo(-23, y); g.closePath(); g.fill(); } g.fillRect(-9, -80, 18, 12); g.fillRect(-3, -100, 6, 22); },
    lantern(g) { g.beginPath(); g.ellipse(0, 0, 60, 50, 0, 0, 6.2832); g.fill(); g.fillRect(-24, -62, 48, 13); g.fillRect(-24, 49, 48, 13); g.lineWidth = 6; line(g, [[0, -62], [0, -98]]); line(g, [[0, 62], [0, 98]]); },
    flower(g) { for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4); g.beginPath(); g.ellipse(0, -50, 22, 46, 0, 0, 6.2832); g.fill(); g.restore(); } g.save(); g.fillStyle = '#ffffff'; disc(g, 0, 0, 22); g.restore(); },
    rings(g) { g.lineWidth = 12; [[-56, -16], [0, -16], [56, -16], [-28, 22], [28, 22]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 30, 0, 6.2832); g.stroke(); }); },
    ball(g) { disc(g, 0, 0, 80); g.save(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 7; line(g, [[-80, 0], [80, 0]]); line(g, [[0, -80], [0, 80]]); g.beginPath(); g.arc(-110, 0, 80, -0.8, 0.8); g.stroke(); g.beginPath(); g.arc(110, 0, 80, Math.PI - 0.8, Math.PI + 0.8); g.stroke(); g.restore(); },
    panda(g) { const c = g.fillStyle; g.save(); g.fillStyle = '#ffffff'; disc(g, 0, 20, 70); disc(g, 0, -46, 48); g.fillStyle = c; disc(g, -38, -84, 18); disc(g, 38, -84, 18); g.beginPath(); g.ellipse(-18, -48, 12, 16, 0.5, 0, 6.2832); g.fill(); g.beginPath(); g.ellipse(18, -48, 12, 16, -0.5, 0, 6.2832); g.fill(); disc(g, -60, 20, 20); disc(g, 60, 20, 20); disc(g, -34, 84, 22); disc(g, 34, 84, 22); disc(g, 0, -30, 7); g.restore(); },
    phone(g) { rr(g, -44, -86, 88, 172, 16); g.fill(); g.save(); g.fillStyle = 'rgba(255,255,255,.9)'; rr(g, -36, -70, 72, 132, 6); g.fill(); g.restore(); g.save(); g.fillStyle = g.strokeStyle; disc(g, 0, 74, 7); g.restore(); },
    pin(g) { g.beginPath(); g.arc(0, -30, 60, Math.PI * 0.85, Math.PI * 0.15); g.lineTo(0, 96); g.closePath(); g.fill(); g.save(); g.fillStyle = '#ffffff'; disc(g, 0, -30, 24); g.restore(); },
    book(g) { g.lineWidth = 8; [1, -1].forEach(k => { g.beginPath(); g.moveTo(0, -30); g.lineTo(k * 84, -48); g.lineTo(k * 84, 44); g.lineTo(0, 62); g.closePath(); g.globalAlpha = 0.4; g.fill(); g.globalAlpha = 1; g.stroke(); [-14, 8, 30].forEach(y => line(g, [[k * 16, y], [k * 68, y - 12]])); }); },
    cinema(g) { g.lineWidth = 9; g.strokeRect(-82, -58, 164, 116); for (let i = 0; i < 6; i++) { g.fillRect(-72 + i * 26, -50, 14, 14); g.fillRect(-72 + i * 26, 36, 14, 14); } g.beginPath(); g.moveTo(-18, -22); g.lineTo(26, 0); g.lineTo(-18, 22); g.closePath(); g.fill(); },
    rainbow(g) { const c = ['#e2342c', '#f08a24', '#f4d23c', '#3a9a4a', '#2a6ac0', '#7a3a9a']; g.lineWidth = 13; c.forEach((k, i) => { g.strokeStyle = k; g.beginPath(); g.arc(0, 60, 96 - i * 13, Math.PI, 0); g.stroke(); }); },
    heel(g) { g.beginPath(); g.moveTo(-90, 40); g.quadraticCurveTo(-40, 50, 0, 10); g.lineTo(60, -60); g.lineTo(80, -50); g.lineTo(76, 70); g.lineTo(66, 70); g.lineTo(62, -10); g.quadraticCurveTo(10, 70, -90, 66); g.closePath(); g.fill(); },
    heart(g) { g.beginPath(); g.moveTo(0, 80); g.bezierCurveTo(-110, 0, -60, -90, 0, -36); g.bezierCurveTo(60, -90, 110, 0, 0, 80); g.fill(); },
    firework(g) { g.lineWidth = 6; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, r = i % 2 ? 62 : 86; line(g, [[Math.cos(a) * 16, Math.sin(a) * 16], [Math.cos(a) * r, Math.sin(a) * r]]); disc(g, Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), 6); } },
    bowl(g) { g.beginPath(); g.moveTo(-86, -6); g.lineTo(86, -6); g.quadraticCurveTo(80, 70, 0, 74); g.quadraticCurveTo(-80, 70, -86, -6); g.fill(); g.lineWidth = 7; line(g, [[20, -90], [70, -14]]); line(g, [[36, -96], [84, -20]]); g.lineWidth = 5; [-40, -10, 20].forEach(x => { g.beginPath(); g.moveTo(x, -20); g.bezierCurveTo(x - 16, -44, x + 16, -60, x, -86); g.stroke(); }); },
    parade(g) { disc(g, -34, -64, 15); g.fillRect(-46, -100, 24, 24); g.beginPath(); g.moveTo(-50, -46); g.lineTo(-18, -46); g.lineTo(-6, 90); g.lineTo(-62, 90); g.closePath(); g.fill(); disc(g, 38, -20, 17); g.beginPath(); g.moveTo(18, 0); g.lineTo(58, 0); g.lineTo(72, 90); g.lineTo(4, 90); g.closePath(); g.fill(); },
    climber(g) { g.globalAlpha = 0.3; for (let i = 0; i < 3; i++) { const y = 100 - (i + 1) * 66; g.beginPath(); g.moveTo(-62, y + 62); g.lineTo(-10, y + 62); g.lineTo(6, y); g.lineTo(-62, y); g.closePath(); g.fill(); } g.globalAlpha = 1; stick(g, 'jump', 24, -6, 52, g.fillStyle); },
    runner(g) { stick(g, 'run', 0, 0, 100, g.fillStyle); },
    thread(g) { stick(g, 'stand', -50, 0, 70, g.fillStyle); stick(g, 'stand', 50, 0, 70, g.fillStyle); g.save(); g.strokeStyle = '#e8243a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-34, -10); g.bezierCurveTo(-10, -110, 10, 80, 34, -10); g.stroke(); g.restore(); },
    container(g) { g.fillRect(-90, -50, 180, 100); g.save(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 5; for (let x = -80; x <= 80; x += 14) line(g, [[x, -44], [x, 44]]); g.restore(); },
    generic(g) { g.beginPath(); g.arc(0, -24, 46, Math.PI * 0.82, Math.PI * 0.18); g.lineTo(0, 92); g.closePath(); g.fill(); },
  };
  MOTIF.train = MOTIF.generic; MOTIF.mask = MOTIF.parade;
  function motif(g, name, cx, cy, r, color) { g.save(); g.translate(cx, cy); g.scale(r / 100, r / 100); g.fillStyle = g.strokeStyle = color; g.lineCap = g.lineJoin = 'round';
    if (MOTIF[name]) MOTIF[name](g); else if (window.PLACES && PLACES.picto) { g.restore(); PLACES.picto(g, name, cx, cy, r, color); return; } else MOTIF.generic(g); g.restore(); }

  // ── the poster layouts. Each paints a whole poster (any size; drawn for about W:H = 1:1.41) ───
  // s = spec(item, design): title, full, en, date, year, big, kicker, venue, story, motif, p (palette), key
  const LAY = {
    // 2000s award night: dense collage, a giant vinyl disc, tape ribbons, gold foil type (posters.md §1)
    award(g, W, H, s, R) { const p = s.p, gr = g.createRadialGradient(W * 0.6, H * 0.3, 10, W * 0.5, H * 0.45, H * 0.85); gr.addColorStop(0, p.bg2); gr.addColorStop(1, p.bg); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; [[0.18, 0.3], [0.86, -0.25]].forEach(([x, k]) => { const b = g.createLinearGradient(0, 0, 0, H * 0.75); b.addColorStop(0, 'rgba(255,225,160,.34)'); b.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = b; g.beginPath(); g.moveTo(W * x - 6, 0); g.lineTo(W * x + 6, 0); g.lineTo(W * (x + k) + W * 0.2, H * 0.75); g.lineTo(W * (x + k) - W * 0.2, H * 0.75); g.fill(); }); g.restore();
      const cx = W * 0.64, cy = H * 0.3, r = W * 0.42; g.fillStyle = '#050507'; disc(g, cx, cy, r); g.lineWidth = 1;
      for (let q = r * 0.34; q < r; q += W * 0.0055) { g.strokeStyle = `rgba(255,255,255,${0.03 + R() * 0.07})`; g.beginPath(); g.arc(cx, cy, q, 0, 6.2832); g.stroke(); }
      g.save(); g.translate(cx, cy); g.rotate(-0.7); const sh = g.createLinearGradient(-r, 0, r, 0); sh.addColorStop(0.36, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,236,190,.26)'); sh.addColorStop(0.64, 'rgba(255,255,255,0)'); g.fillStyle = sh; disc(g, 0, 0, r); g.restore();
      const foil = (y0, y1) => { const f = g.createLinearGradient(0, y0, 0, y1); f.addColorStop(0, p.b); f.addColorStop(0.45, '#fffbe8'); f.addColorStop(0.55, p.a); f.addColorStop(1, '#7a5418'); return f; };
      g.fillStyle = foil(cy - r * 0.3, cy + r * 0.3); disc(g, cx, cy, r * 0.3); g.fillStyle = p.bg; disc(g, cx, cy, r * 0.03);
      tracked(g, s.kicker || 'AWARDS NIGHT', cx, cy - r * 0.15, r * 0.055, r * 0.46, NUM, 800, p.bg, 0.25); tracked(g, s.year, cx, cy + r * 0.16, r * 0.07, r * 0.46, NUM, 800, p.bg, 0.2);
      g.lineCap = 'round'; [[p.c, 0, 0.05], ['#5a3a22', W * 0.07, 0.035]].forEach(([c, o, lw]) => { g.lineWidth = W * lw; g.strokeStyle = c; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(-W * 0.05, H * 0.1 + o); g.bezierCurveTo(W * 0.28, H * 0.0 + o, W * 0.36, H * 0.56 + o, W * 1.06, H * 0.43 + o); g.stroke(); }); g.globalAlpha = 1;
      for (let i = 0; i < 50; i++) star4(g, R() * W, R() * H * 0.62, W * (0.004 + R() * 0.016), R() > 0.3 ? '#fff6d0' : p.b);
      for (let i = 0; i < 18; i++) { g.save(); g.translate(R() * W, R() * H * 0.6); g.rotate(R() * 6); g.fillStyle = [p.a, p.c, '#ffffff'][i % 3]; g.fillRect(0, 0, W * 0.012, W * 0.024); g.restore(); }   // confetti
      g.save(); const q = fit(g, s.big, H * 0.19, W * 0.84, BLACK, 900); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = H * 0.02; g.shadowOffsetY = H * 0.008;
      g.fillStyle = foil(H * 0.68 - q * 0.8, H * 0.68); g.fillText(s.big, W * 0.06, H * 0.68); g.shadowColor = 'rgba(0,0,0,0)'; g.lineWidth = Math.max(1, H * 0.003); g.strokeStyle = '#fff6d0'; g.strokeText(s.big, W * 0.06, H * 0.68); g.restore();
      if (s.kicker2) { g.fillStyle = p.c; g.fillRect(W * 0.86, H * 0.47, W * 0.1, H * 0.24); vtext(g, s.kicker2, W * 0.91, H * 0.5, Math.min(W * 0.06, H * 0.2 / [...s.kicker2].length), SANS, 800, '#fff6d0'); }
      tx(g, s.title, W * 0.06, H * 0.735, H * 0.042, W * 0.88, SANS, 800, p.ink, 'left'); tracked(g, String(s.en).toUpperCase(), W * 0.06, H * 0.775, H * 0.017, W * 0.88, NUM, 700, p.b, 0.28, 'left');
      g.fillStyle = foil(H * 0.8, H * 0.87); g.fillRect(0, H * 0.8, W * 0.8, H * 0.07); tx(g, s.date, W * 0.06, H * 0.836, H * 0.052, W * 0.68, NUM, 800, p.bg, 'left');
      g.fillStyle = '#101014'; g.fillRect(0, H * 0.915, W, H * 0.085); tracked(g, s.venue, W / 2, H * 0.958, H * 0.024, W * 0.9, SANS, 700, p.b, 0.25); },
    // a flower expo: a dancer made of petals leaping across a green-to-cyan ground (posters.md §2)
    expo(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const FL = [p.a, p.b, p.c, '#8fc31f', '#00a0e9', '#ffffff']; for (let i = 0; i < 9; i++) { g.globalAlpha = 0.14; disc(g, R() * W, R() * H * 0.7, W * (0.12 + R() * 0.25), FL[i % 5]); } g.globalAlpha = 1;
      const pet = (x, y, k) => { g.save(); g.translate(x, y); g.rotate(R() * 6.28); g.fillStyle = FL[(R() * 5) | 0]; g.beginPath(); g.ellipse(0, 0, W * 0.02 * k, W * 0.008 * k, 0, 0, 6.2832); g.fill(); g.restore(); };
      const bone = [[[0.55, 0.25], [0.47, 0.42]], [[0.53, 0.28], [0.66, 0.2], [0.84, 0.1]], [[0.52, 0.29], [0.36, 0.24], [0.2, 0.26]], [[0.47, 0.42], [0.66, 0.48], [0.88, 0.44]], [[0.47, 0.42], [0.33, 0.53], [0.14, 0.56]]];
      bone.forEach(seg => { for (let i = 0; i < seg.length - 1; i++) for (let k = 0; k < 46; k++) { const t = R(), x = seg[i][0] + (seg[i + 1][0] - seg[i][0]) * t, y = seg[i][1] + (seg[i + 1][1] - seg[i][1]) * t; pet(W * (x + (R() - 0.5) * 0.04), H * (y + (R() - 0.5) * 0.025), 1); } });
      g.save(); g.translate(W * 0.57, H * 0.19); for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillStyle = FL[i % 4]; g.beginPath(); g.ellipse(0, -W * 0.05, W * 0.022, W * 0.05, 0, 0, 6.2832); g.fill(); } g.fillStyle = '#ffffff'; disc(g, 0, 0, W * 0.03); g.restore();
      for (let i = 0; i < 120; i++) pet(R() * W, H * (0.05 + R() * 0.55), 0.6);
      tracked(g, s.kicker || 'FLORA EXPO', W * 0.07, H * 0.06, H * 0.02, W * 0.6, NUM, 800, '#ffffff', 0.4, 'left'); tx(g, s.year, W * 0.93, H * 0.06, H * 0.03, W * 0.3, ROUND, 800, p.c, 'right');
      const L = split2(s.title); g.save(); g.shadowColor = 'rgba(0,40,30,.45)'; g.shadowOffsetY = H * 0.006; L.forEach((t, i) => tx(g, t, W * 0.07, H * (0.67 + i * 0.075), H * 0.068, W * 0.86, ROUND, 800, '#ffffff', 'left')); g.restore();
      tx(g, s.en, W * 0.07, H * (0.7 + L.length * 0.075), H * 0.024, W * 0.86, ROUND, 600, '#eafff4', 'left');
      const nums = String(s.date).split(/[^0-9]+/).filter(Boolean).slice(0, 8); nums.forEach((n, i) => { const x = W * (0.1 + i * 0.8 / Math.max(1, nums.length - 1 || 1)), y = H * 0.9;
        g.save(); g.translate(x, y); for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.fillStyle = FL[i % 5]; g.beginPath(); g.ellipse(0, -W * 0.024, W * 0.014, W * 0.024, 0, 0, 6.2832); g.fill(); } g.restore(); disc(g, x, y, W * 0.02, '#ffffff'); tx(g, n, x, y, W * 0.022, W * 0.05, ROUND, 800, '#0e5a3a'); }); },
    // multi-sport games: the year as an op-art figure ringed by concentric outlines to the edges (Mexico 68), a row of sport pictograms
    games(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); const yr = String(s.big || s.year).slice(0, 4);
      for (let y = 0; y < H * 0.6; y += H * 0.014) { g.fillStyle = p.ink; g.fillRect(0, y, W, H * 0.006); }
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, yr, H * 0.32, W * 0.8, BLACK, 900); g.lineJoin = 'round';
      for (let k = 18; k >= 1; k--) { g.lineWidth = k * H * 0.011; g.strokeStyle = k % 2 ? p.bg : p.ink; g.strokeText(yr, W / 2, H * 0.32); }
      const gr = g.createLinearGradient(0, H * 0.2, 0, H * 0.44); gr.addColorStop(0, p.a); gr.addColorStop(1, p.b); g.fillStyle = gr; g.fillText(yr, W / 2, H * 0.32); g.restore();
      g.fillStyle = p.bg; g.fillRect(0, H * 0.6, W, H * 0.4); const sports = ['run', 'swim', 'jump', 'lift', 'bat'], C = [p.a, p.b, p.c, '#009944', p.ink];
      sports.forEach((sp, i) => { const x = W * (0.12 + i * 0.19), y = H * 0.68; disc(g, x, y, W * 0.075, C[i]); stick(g, sp, x, y + W * 0.005, W * 0.055, '#ffffff'); });
      const L = split2(s.title); L.forEach((t, i) => tx(g, t, W * 0.06, H * (0.79 + i * 0.06), H * 0.05, W * 0.88, BLACK, 900, p.ink, 'left'));
      tracked(g, String(s.en).toUpperCase(), W * 0.06, H * (0.83 + L.length * 0.06 - 0.02), H * 0.017, W * 0.88, NUM, 700, p.ink, 0.2, 'left');
      C.forEach((c, i) => { g.fillStyle = c; g.fillRect(W * i / 5, H * 0.955, W / 5, H * 0.045); }); tx(g, s.date, W * 0.94, H * 0.977, H * 0.026, W * 0.5, NUM, 800, '#ffffff', 'right'); },
    // an e-sports final: liquid-metal marbling, a hex arena, team bars, a condensed headline in chromatic offset (posters.md §4)
    esports(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, p.bg2); gr.addColorStop(1, p.bg); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 70; i++) { const y = R() * H * 0.7, c = i % 2 ? p.a : p.c; g.strokeStyle = c; g.globalAlpha = 0.05 + R() * 0.08; g.lineWidth = W * (0.004 + R() * 0.02);
        g.beginPath(); g.moveTo(-20, y); g.bezierCurveTo(W * 0.3, y - H * 0.2 * R(), W * 0.6, y + H * 0.2 * R(), W + 20, y + (R() - 0.5) * H * 0.2); g.stroke(); } g.restore(); g.globalAlpha = 1;
      const hex = (x, y, r) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
      g.strokeStyle = 'rgba(0,194,255,.14)'; g.lineWidth = 1.5; const hr = W * 0.05; for (let y = 0; y < H * 0.62; y += hr * 1.5) for (let x = 0; x < W + hr; x += hr * 1.732) { hex(x + ((y / (hr * 1.5)) % 2) * hr * 0.866, y, hr); g.stroke(); }
      const cx = W / 2, cy = H * 0.33; g.save(); g.shadowColor = p.a; g.shadowBlur = W * 0.04; g.strokeStyle = p.a; g.lineWidth = W * 0.012; hex(cx, cy, W * 0.3); g.stroke(); g.strokeStyle = p.b; g.lineWidth = W * 0.006; hex(cx, cy, W * 0.24); g.stroke(); g.restore();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; line(g, [[cx - W * 0.2, cy + W * 0.12], [cx + W * 0.2, cy - W * 0.12]]); disc(g, cx - W * 0.2, cy + W * 0.12, W * 0.03, p.a); disc(g, cx + W * 0.2, cy - W * 0.12, W * 0.03, p.b);
      motif(g, s.motif === 'mic' ? 'star' : s.motif, cx, cy, W * 0.08, '#ffffff');
      [[p.a, 0.62, -1], [p.b, 0.55, 1]].forEach(([c, f, k], i) => { const y = H * 0.54 + i * H * 0.04; g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(W * 0.08, y, W * 0.84, H * 0.022); g.fillStyle = c; g.fillRect(k < 0 ? W * 0.08 : W * 0.92 - W * 0.84 * f, y, W * 0.84 * f, H * 0.022); });
      const head = s.big || s.title; g.save(); g.transform(1, 0, -0.2, 1, H * 0.1, 0); [[p.a, -W * 0.008], [p.b, W * 0.008], ['#ffffff', 0]].forEach(([c, o]) => { g.globalCompositeOperation = c === '#ffffff' ? 'source-over' : 'lighter'; tx(g, head, W / 2 + o, H * 0.7, H * 0.11, W * 0.86, COND, 900, c); }); g.restore();
      tracked(g, (s.kicker || 'FINALS NIGHT') + '  ' + s.year, W / 2, H * 0.78, H * 0.022, W * 0.86, COND, 700, p.a, 0.4);
      ['SEMI · 1', 'SEMI · 2', 'FINAL'].forEach((t, i) => { const x = W * (0.08 + i * 0.29), y = H * 0.82; g.strokeStyle = i === 2 ? p.b : 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(x, y, W * 0.26, H * 0.08); tx(g, t, x + W * 0.13, y + H * 0.026, H * 0.02, W * 0.24, COND, 800, '#ffffff'); tx(g, i === 2 ? s.date : '—', x + W * 0.13, y + H * 0.057, H * 0.02, W * 0.24, NUM, 600, i === 2 ? p.b : 'rgba(255,255,255,.6)'); });
      tx(g, s.title, W / 2, H * 0.94, H * 0.026, W * 0.9, SANS, 700, 'rgba(255,255,255,.85)'); },
    // a three-ink screen-printed gig poster: beams, a crowd of dots, the headline built from lines (Troxler), all info at one size
    concert(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); grain(g, W, H, 1500, '120,90,50', 0.08, R); const sx = W * 0.5, sy = H * 0.56;
      g.save(); g.globalCompositeOperation = 'multiply'; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.17; g.fillStyle = i % 2 ? p.a : p.b; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - 0.04) * H, sy + Math.sin(a - 0.04) * H); g.lineTo(sx + Math.cos(a + 0.04) * H, sy + Math.sin(a + 0.04) * H); g.closePath(); g.fill(); }
      g.globalAlpha = 1; g.fillStyle = p.c; g.beginPath(); g.ellipse(sx, sy + H * 0.01, W * 0.3, H * 0.03, 0, 0, 6.2832); g.fill();
      for (let row = 0; row < 14; row++) { const y = H * (0.6 + row * 0.02), n = 18 + row * 3, r = W * (0.006 + row * 0.0011); for (let i = 0; i < n; i++) { const x = W * (i + 0.5 + (row % 2) * 0.5) / n; g.fillStyle = p.b; disc(g, x, y + (R() - 0.5) * r, r); if (R() < 0.12) { g.fillRect(x - r * 0.15, y - r * 3, r * 0.3, r * 2.5); disc(g, x, y - r * 3.2, r * 0.5, p.a); } } }
      g.restore(); const [mc, m] = off(W, H); m.textAlign = 'center'; m.textBaseline = 'middle'; const head = s.big || s.title; fit(m, head, H * 0.2, W * 0.92, COND, 900); m.fillStyle = '#000'; m.fillText(head, W / 2, H * 0.2);
      const [sc2, sg2] = off(W, H); sg2.fillStyle = p.ink; for (let y = 0; y < H * 0.4; y += H * 0.009) sg2.fillRect(0, y, W, H * 0.0055); m.globalCompositeOperation = 'source-in'; m.drawImage(sc2, 0, 0); g.drawImage(mc, 0, 0);
      g.save(); g.globalCompositeOperation = 'multiply'; tx(g, s.kicker || 'LIVE', W * 0.07, H * 0.06, H * 0.04, W * 0.5, COND, 900, p.a, 'left'); g.restore();
      tracked(g, s.year, W * 0.93, H * 0.06, H * 0.03, W * 0.3, COND, 800, p.ink, 0.2, 'right');
      [[0.04, 0.04], [0.96, 0.04], [0.04, 0.96], [0.96, 0.96]].forEach(([x, y]) => { g.strokeStyle = p.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(W * x, H * y, W * 0.012, 0, 6.2832); g.stroke(); line(g, [[W * x - W * 0.02, H * y], [W * x + W * 0.02, H * y]]); line(g, [[W * x, H * y - W * 0.02], [W * x, H * y + W * 0.02]]); });
      g.fillStyle = p.bg; g.fillRect(0, H * 0.88, W, H * 0.12); const info = [s.title, s.date, s.venue].filter(Boolean).join('  /  ');
      tx(g, info, W * 0.06, H * 0.915, H * 0.026, W * 0.88, SANS, 800, p.ink, 'left'); tx(g, s.en, W * 0.06, H * 0.955, H * 0.026, W * 0.88, COND, 700, p.c, 'left'); },
    // a night art festival: night blue, a thermal-pixel creature, a window-grille border, the name split light / dark, a dusk-to-dawn clock arc
    nightart(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const m = W * 0.05; g.strokeStyle = 'rgba(155,231,255,.5)'; g.lineWidth = 1.5; for (let i = 0; i * m < W; i++) [[i * m, 0], [i * m, H - m]].forEach(([x, y]) => { g.strokeRect(x, y, m, m); line(g, [[x, y], [x + m, y + m]]); line(g, [[x + m, y], [x, y + m]]); });
      for (let i = 1; i * m < H - m; i++) [[0, i * m], [W - m, i * m]].forEach(([x, y]) => { g.strokeRect(x, y, m, m); line(g, [[x + m / 2, y], [x + m / 2, y + m]]); line(g, [[x, y + m / 2], [x + m, y + m / 2]]); });
      const gw = 24, gh = 30, [sc, sg] = off(gw, gh); sg.fillStyle = '#000'; motif(sg, s.motif && s.motif !== 'generic' ? s.motif : 'parade', gw / 2, gh / 2, gw * 0.46, '#000'); const A = sg.getImageData(0, 0, gw, gh).data;
      const ramp = ['#1b0c4a', '#4b1a8a', '#d7263d', '#ff8c42', '#ffe66d', '#ffffff'], cw = W * 0.022, x0 = W / 2 - cw * gw / 2, y0 = H * 0.09;
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const a = A[(j * gw + i) * 4 + 3] / 255, d = Math.hypot(i - gw / 2, j - gh / 2) / gw, v = Math.max(0, Math.min(0.999, a * (1.05 - d) + R() * 0.18)); g.fillStyle = ramp[(v * ramp.length) | 0]; g.globalAlpha = a > 0.1 ? 1 : 0.35; g.fillRect(x0 + i * cw, y0 + j * cw, cw * 0.86, cw * 0.86); }
      g.globalAlpha = 1; const t = [...String(s.big || s.title)], half = Math.ceil(t.length / 2);
      tx(g, t.slice(0, half).join(''), m * 1.6, H * 0.67, H * 0.1, W * 0.8, SANS, 900, '#ffffff', 'left');
      g.save(); fit(g, t.slice(half).join(''), H * 0.1, W * 0.8, SANS, 900); g.textAlign = 'right'; g.textBaseline = 'middle'; g.lineWidth = Math.max(2, H * 0.004); g.strokeStyle = p.c; g.strokeText(t.slice(half).join(''), W - m * 1.6, H * 0.77); g.restore();
      const cx = W / 2, cy = H * 0.935, r = W * 0.16; g.lineWidth = H * 0.008; const ag = g.createLinearGradient(cx - r, 0, cx + r, 0); ag.addColorStop(0, '#ff7a59'); ag.addColorStop(0.5, '#2a1b6e'); ag.addColorStop(1, '#9be7ff'); g.strokeStyle = ag; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.stroke();
      tx(g, '18:00', cx - r, cy - H * 0.035, H * 0.022, W * 0.2, NUM, 800, '#ff7a59'); tx(g, '06:00', cx + r, cy - H * 0.035, H * 0.022, W * 0.2, NUM, 800, '#9be7ff'); tx(g, s.date, cx, cy - H * 0.02, H * 0.022, r * 1.4, NUM, 700, '#ffffff');
      tracked(g, (s.kicker || 'NUIT BLANCHE') , m * 1.6, H * 0.6, H * 0.02, W * 0.7, NUM, 800, p.b, 0.45, 'left'); tx(g, s.en, m * 1.6, H * 0.83, H * 0.02, W * 0.8, NUM, 600, 'rgba(255,255,255,.8)', 'left'); },
    // a lantern festival: a red banner, a gilt 如意 cloud border, a giant lantern, cut-paper lettering punched with holes
    lantern(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = p.a; g.lineWidth = W * 0.008; const cl = (x, y, k) => { g.beginPath(); g.arc(x, y, W * 0.03, Math.PI, 0); g.arc(x + W * 0.045 * k, y, W * 0.015, Math.PI, 0, k < 0); g.stroke(); };
      for (let x = W * 0.06; x < W; x += W * 0.1) { cl(x, H * 0.035, 1); cl(x, H * 0.975, -1); } g.strokeRect(W * 0.03, H * 0.055, W * 0.94, H * 0.9);
      for (let i = 0; i < 7; i++) { const x = W * (0.12 + i * 0.127), y = H * 0.1 + Math.sin(i * 0.9) * H * 0.012; g.strokeStyle = 'rgba(255,220,150,.6)'; g.lineWidth = 1; line(g, [[x, H * 0.06], [x, y]]); g.fillStyle = i % 2 ? p.a : '#ff5a3a'; g.beginPath(); g.ellipse(x, y + W * 0.03, W * 0.026, W * 0.032, 0, 0, 6.2832); g.fill(); }
      const cx = W / 2, cy = H * 0.37, rx = W * 0.3, ry = W * 0.26, lg = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 4, cx, cy, rx * 1.1); lg.addColorStop(0, '#fff4c8'); lg.addColorStop(0.5, p.b); lg.addColorStop(1, '#d9861a');
      g.save(); g.shadowColor = '#ffcf6a'; g.shadowBlur = W * 0.08; g.fillStyle = lg; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); g.fill(); g.restore();
      g.strokeStyle = 'rgba(140,40,10,.55)'; g.lineWidth = W * 0.006; for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(cx, cy, Math.abs(k) / 3 * rx + 1, ry, 0, 0, 6.2832); g.stroke(); }
      g.fillStyle = '#5a1a10'; g.fillRect(cx - rx * 0.45, cy - ry - W * 0.03, rx * 0.9, W * 0.04); g.fillRect(cx - rx * 0.45, cy + ry - W * 0.01, rx * 0.9, W * 0.04); for (let i = -3; i <= 3; i++) { g.strokeStyle = p.a; g.lineWidth = 2; line(g, [[cx + i * W * 0.02, cy + ry + W * 0.03], [cx + i * W * 0.024, cy + ry + W * 0.12]]); }
      motif(g, s.motif === 'lantern' || s.motif === 'generic' ? 'firework' : s.motif, cx, cy, ry * 0.5, 'rgba(160,30,10,.55)');
      const [mc, m] = off(W, H); m.fillStyle = p.b; const L = split2(s.big || s.title); L.forEach((t, i) => { fit(m, t, H * 0.1, W * 0.84, WEI, 900); m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText(t, W / 2, H * (0.7 + i * 0.105)); });
      m.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { const x = R() * W, y = H * (0.6 + R() * 0.28); if (i % 3) disc(m, x, y, W * 0.004 + R() * W * 0.004, '#000'); else { m.save(); m.translate(x, y); m.rotate(R() * 3); m.fillStyle = '#000'; m.fillRect(-W * 0.012, -1.5, W * 0.024, 3); m.restore(); } }
      g.save(); g.shadowColor = 'rgba(60,0,0,.6)'; g.shadowOffsetY = 3; g.shadowBlur = 4; g.drawImage(mc, 0, 0); g.restore();
      const sx = W * 0.8, sy = H * 0.86, sw = W * 0.12; g.fillStyle = p.a; g.fillRect(sx, sy, sw, sw * 1.3); vtext(g, String(s.year).slice(0, 4), sx + sw / 2, sy + sw * 0.2, sw * 0.24, NUM, 900, p.bg);
      tx(g, s.date, W * 0.08, H * 0.905, H * 0.024, W * 0.64, NUM, 800, p.a, 'left'); tx(g, s.en, W * 0.08, H * 0.935, H * 0.018, W * 0.64, NUM, 600, '#ffe9c0', 'left'); },
    // a doujin / anime fair: a cel-shaded sky, an original character in two flat colours (no face), the fair number in an outlined pop face, the hall map
    anime(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, 0, H * 0.8); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) { const x = R() * W, y = H * (0.1 + R() * 0.4); for (let k = 0; k < 5; k++) disc(g, x + (k - 2) * W * 0.05, y + (k % 2) * W * 0.02, W * (0.04 + R() * 0.03), 'rgba(255,255,255,.9)'); }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let i = 0; i < 26; i++) { const a = i / 26 * 6.28, cx = W * 0.62, cy = H * 0.36; line(g, [[cx + Math.cos(a) * W * 0.36, cy + Math.sin(a) * W * 0.36], [cx + Math.cos(a) * W * 0.6, cy + Math.sin(a) * W * 0.6]]); }
      const cx = W * 0.64, cy = H * 0.36, r = W * 0.17; g.fillStyle = p.c; g.beginPath(); g.moveTo(cx - r * 1.1, cy + r * 2.4); g.lineTo(cx, cy + r * 0.7); g.lineTo(cx + r * 1.1, cy + r * 2.4); g.closePath(); g.fill();
      g.fillStyle = p.a; g.beginPath(); for (let i = 0; i <= 14; i++) { const a = Math.PI * 0.95 + i / 14 * Math.PI * 1.1, q = i % 2 ? r * 1.05 : r * 1.42; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.lineTo(cx + r * 1.3, cy + r * 1.4); g.lineTo(cx - r * 1.3, cy + r * 1.4); g.closePath(); g.fill();
      g.fillStyle = '#ffe9dc'; disc(g, cx, cy + r * 0.15, r * 0.9); g.fillStyle = p.a; g.beginPath(); g.arc(cx, cy, r * 0.98, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(cx + r * 0.4, cy - r * 0.1); g.lineTo(cx - r * 0.1, cy - r * 0.35); g.lineTo(cx - r * 0.5, cy - r * 0.05); g.closePath(); g.fill();
      [-1, 1].forEach(k => { g.fillStyle = p.ink; g.beginPath(); g.ellipse(cx + k * r * 0.34, cy + r * 0.25, r * 0.13, r * 0.2, 0, 0, 6.2832); g.fill(); disc(g, cx + k * r * 0.34 - r * 0.04, cy + r * 0.17, r * 0.05, '#ffffff'); g.fillStyle = 'rgba(255,120,150,.5)'; g.beginPath(); g.ellipse(cx + k * r * 0.55, cy + r * 0.5, r * 0.12, r * 0.06, 0, 0, 6.2832); g.fill(); });
      g.strokeStyle = p.ink; g.lineWidth = r * 0.05; g.beginPath(); g.arc(cx, cy + r * 0.5, r * 0.12, 0.3, Math.PI - 0.3); g.stroke(); g.lineWidth = W * 0.008; line(g, [[cx + r * 0.9, cy + r * 1.1], [cx + r * 1.8, cy - r * 0.4]]); star5(g, cx + r * 1.85, cy - r * 0.5, r * 0.32, p.b);
      for (let i = 0; i < 30; i++) star4(g, R() * W, R() * H * 0.62, W * (0.008 + R() * 0.02), i % 2 ? '#ffffff' : p.b);
      const big = s.big || 'FF'; g.save(); g.textAlign = 'left'; g.textBaseline = 'middle'; fit(g, big, H * 0.2, W * 0.6, BLACK, 900); g.lineJoin = 'round';
      g.fillStyle = p.ink; g.fillText(big, W * 0.06 + W * 0.014, H * 0.2 + W * 0.014); g.lineWidth = H * 0.014; g.strokeStyle = '#ffffff'; g.strokeText(big, W * 0.06, H * 0.2); g.fillStyle = p.a; g.fillText(big, W * 0.06, H * 0.2); g.restore();
      const L = split2(s.title); L.forEach((t, i) => { g.save(); g.lineWidth = H * 0.01; g.strokeStyle = '#ffffff'; g.lineJoin = 'round'; fit(g, t, H * 0.052, W * 0.88, ROUND, 900); g.textAlign = 'left'; g.strokeText(t, W * 0.06, H * (0.66 + i * 0.06)); g.restore(); tx(g, t, W * 0.06, H * (0.66 + i * 0.06), H * 0.052, W * 0.88, ROUND, 900, p.ink, 'left'); });
      const y0 = H * 0.79; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, y0, W, H * 0.21); const cols = 12, rows = 4, cw = W * 0.6 / cols, ch = H * 0.15 / rows, C = [p.a, p.b, p.c, '#8fd3ff'];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { if (i === 6) continue; g.fillStyle = C[(i * 7 + j * 3) % 4]; g.fillRect(W * 0.04 + i * cw, y0 + H * 0.03 + j * ch * (j % 2 ? 1.1 : 1), cw * 0.86, ch * 0.8); }
      tx(g, s.date, W * 0.96, y0 + H * 0.06, H * 0.03, W * 0.32, ROUND, 900, p.ink, 'right'); tx(g, s.venue || s.en, W * 0.96, y0 + H * 0.11, H * 0.02, W * 0.32, ROUND, 700, p.ink, 'right'); tx(g, 'BOOTH MAP', W * 0.96, y0 + H * 0.16, H * 0.016, W * 0.32, ROUND, 700, p.a, 'right'); },
    // a premiere: crossed searchlights, a red carpet into the distance, two figures from behind, flashbulbs, a laurel, gold Song lettering
    premiere(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#16151c'); gr.addColorStop(1, p.bg); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; [[0.1, 0.7], [0.9, 0.3]].forEach(([x, tx2]) => { const b = g.createLinearGradient(W * x, H * 0.62, W * tx2, 0); b.addColorStop(0, 'rgba(255,240,200,.4)'); b.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = b; g.beginPath(); g.moveTo(W * x - 4, H * 0.62); g.lineTo(W * tx2 - W * 0.12, 0); g.lineTo(W * tx2 + W * 0.12, 0); g.lineTo(W * x + 4, H * 0.62); g.fill(); }); g.restore();
      g.fillStyle = '#1c1a22'; g.fillRect(W * 0.3, H * 0.3, W * 0.4, H * 0.12); for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) star5(g, W * (0.33 + i * 0.068 + (j % 2) * 0.034), H * (0.32 + j * 0.027), W * 0.008, 'rgba(201,162,74,.7)');
      const cg = g.createLinearGradient(0, H * 0.42, 0, H * 0.64); cg.addColorStop(0, '#5a0a0e'); cg.addColorStop(1, p.b); g.fillStyle = cg; g.beginPath(); g.moveTo(W * 0.44, H * 0.42); g.lineTo(W * 0.56, H * 0.42); g.lineTo(W * 0.9, H * 0.64); g.lineTo(W * 0.1, H * 0.64); g.closePath(); g.fill();
      g.fillStyle = '#060608'; [[0.47, 0.62], [0.555, 0.56]].forEach(([x, k]) => { const bx = W * x, by = H * 0.5, q = W * 0.1 * k; disc(g, bx, by - q * 2.2, q * 0.32); g.beginPath(); g.moveTo(bx - q * 0.62, by - q * 1.75); g.lineTo(bx + q * 0.62, by - q * 1.75); g.lineTo(bx + q * 0.5, by); g.lineTo(bx - q * 0.5, by); g.closePath(); g.fill(); });
      for (let i = 0; i < 30; i++) { const x = R() < 0.5 ? R() * W * 0.22 : W - R() * W * 0.22, y = H * (0.3 + R() * 0.3); star4(g, x, y, W * (0.012 + R() * 0.025), 'rgba(255,255,255,.95)'); }
      const lx = W / 2, ly = H * 0.12; g.fillStyle = p.a; [-1, 1].forEach(k => { for (let i = 0; i < 9; i++) { const a = Math.PI / 2 + k * (0.5 + i * 0.22), x = lx + Math.cos(a) * W * 0.18, y = ly + Math.sin(a) * W * 0.09; g.save(); g.translate(x, y); g.rotate(a + k * 0.6); g.beginPath(); g.ellipse(0, 0, W * 0.02, W * 0.008, 0, 0, 6.2832); g.fill(); g.restore(); } });
      tracked(g, s.kicker || 'WORLD PREMIERE', lx, ly - H * 0.012, H * 0.02, W * 0.3, SERIF, 700, p.c, 0.3); tracked(g, s.year, lx, ly + H * 0.02, H * 0.022, W * 0.2, SERIF, 700, p.a, 0.3);
      const L = split2(s.big || s.title); L.forEach((t, i) => { const y = H * (0.71 + i * 0.085); fit(g, t, H * 0.075, W * 0.88, SONG, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; const f = g.createLinearGradient(0, y - H * 0.04, 0, y + H * 0.04); f.addColorStop(0, '#fff3c8'); f.addColorStop(0.5, p.a); f.addColorStop(1, '#7a5418'); g.fillStyle = f; g.fillText(t, W / 2, y); });
      const yb = H * (0.75 + L.length * 0.085); tracked(g, String(s.en).toUpperCase(), W / 2, yb, H * 0.017, W * 0.86, SERIF, 700, p.c, 0.25);
      ['紅毯 RED CARPET', s.date, s.venue].filter(Boolean).forEach((t, i) => tracked(g, t, W / 2, yb + H * (0.04 + i * 0.028), H * 0.018, W * 0.8, COND, 700, 'rgba(243,226,176,.75)', 0.3)); },
    // a hand-painted cinema billboard: saturated blocks, silhouettes, broad visible strokes, brush lettering (posters.md §9, 顏振發's tradition)
    painted(g, W, H, s, R) { const p = s.p, u = Math.min(W, H), gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, p.bg); gr.addColorStop(0.7, p.b); gr.addColorStop(1, p.a); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      disc(g, W * 0.72, H * 0.34, u * 0.24, p.a); g.fillStyle = '#2a1a22'; let x = 0; while (x < W) { const w = u * (0.12 + R() * 0.18), h = H * (0.25 + R() * 0.22); g.fillRect(x, H * 0.72 - h, w, h + H); for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,214,120,.8)'; g.fillRect(x + w * 0.2 + k * w * 0.22, H * 0.72 - h * 0.7, w * 0.1, h * 0.12); } g.fillStyle = '#2a1a22'; x += w + u * 0.01; }
      g.fillStyle = '#120a10'; [[0.3, 1], [0.4, 0.9]].forEach(([fx, k]) => { const bx = W * fx, by = H * 0.98, q = u * 0.3 * k; disc(g, bx, by - q * 1.7, q * 0.26); g.beginPath(); g.moveTo(bx - q * 0.55, by - q * 1.35); g.lineTo(bx + q * 0.55, by - q * 1.35); g.lineTo(bx + q * 0.45, by); g.lineTo(bx - q * 0.45, by); g.closePath(); g.fill(); });
      const C = [p.a, p.b, p.c, p.bg, '#ffffff']; for (let i = 0; i < 1600; i++) { g.strokeStyle = C[(R() * 5) | 0]; g.globalAlpha = 0.07 + R() * 0.12; g.lineWidth = u * (0.006 + R() * 0.014); const sx = R() * W, sy = R() * H, a = -0.5 + R() * 0.4, l = u * (0.03 + R() * 0.06); line(g, [[sx, sy], [sx + Math.cos(a) * l, sy + Math.sin(a) * l]]); } g.globalAlpha = 1;
      g.save(); const head = s.big || s.title; g.textAlign = 'left'; g.textBaseline = 'middle'; fit(g, head, H * 0.3, W * 0.56, XING, 400); g.lineJoin = 'round'; g.lineWidth = u * 0.03; g.strokeStyle = '#1a0a0a'; g.strokeText(head, W * 0.04, H * 0.24); g.fillStyle = p.ink; g.fillText(head, W * 0.04, H * 0.24); g.restore();
      g.fillStyle = 'rgba(10,6,8,.78)'; g.fillRect(W * 0.58, H * 0.8, W * 0.4, H * 0.16); [s.title, s.en, s.date].forEach((t, i) => tx(g, t, W * 0.6, H * (0.84 + i * 0.045), H * (i ? 0.035 : 0.05), W * 0.36, i ? COND : SANS, 800, i === 2 ? p.a : p.ink, 'left')); },
    // a street festival: a three-ink screenprint, bunting, a dancer with a feather fan, stencil date numerals
    street(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); grain(g, W, H, 1200, '90,60,20', 0.08, R); const C = [p.a, p.b, p.c, p.ink];
      [0.05, 0.13].forEach((y0, k) => { for (let i = 0; i < 12; i++) { const x0 = W * i / 12, x1 = W * (i + 1) / 12, sag = H * 0.03, y = t => H * y0 + Math.sin(Math.PI * t) * sag; g.fillStyle = C[(i + k) % 4]; g.beginPath(); g.moveTo(x0, y(i / 12)); g.lineTo(x1, y((i + 1) / 12)); g.lineTo((x0 + x1) / 2, y((i + 0.5) / 12) + H * 0.045); g.closePath(); g.fill(); } });
      g.save(); g.globalCompositeOperation = 'multiply'; const fx = W * 0.5, fy = H * 0.44; for (let i = 0; i < 44; i++) { const a = Math.PI * (1.05 + i / 43 * 0.9), r = W * (0.36 + (i % 3) * 0.04); g.fillStyle = i % 2 ? p.a : p.b; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a - 0.03) * r, fy + Math.sin(a - 0.03) * r); g.lineTo(fx + Math.cos(a + 0.03) * r, fy + Math.sin(a + 0.03) * r); g.closePath(); g.fill(); } g.restore();
      g.fillStyle = p.ink; disc(g, fx, fy - W * 0.13, W * 0.04); g.beginPath(); g.moveTo(fx - W * 0.05, fy - W * 0.08); g.lineTo(fx + W * 0.05, fy - W * 0.08); g.lineTo(fx + W * 0.03, fy + W * 0.02); g.lineTo(fx - W * 0.03, fy + W * 0.02); g.closePath(); g.fill();
      for (let i = 0; i < 14; i++) { const a = Math.PI * (0.15 + i / 13 * 0.7); g.fillStyle = i % 2 ? p.c : p.ink; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a - 0.08) * W * 0.2, fy + Math.sin(a - 0.08) * W * 0.2); g.lineTo(fx + Math.cos(a + 0.08) * W * 0.2, fy + Math.sin(a + 0.08) * W * 0.2); g.closePath(); g.fill(); }
      const d = String(s.big && /\d/.test(s.big) ? s.big : s.date).replace(/–.*/, ''); g.save(); fit(g, d, H * 0.16, W * 0.9, COND, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = p.c; g.fillText(d, W / 2 + 3, H * 0.74 + 2); g.fillStyle = p.ink; g.fillText(d, W / 2, H * 0.74); g.restore();
      g.fillStyle = p.bg; for (let x = W * 0.08; x < W * 0.94; x += W * 0.045) g.fillRect(x, H * 0.7, W * 0.007, H * 0.09);
      const L = split2(s.title); L.forEach((t, i) => tx(g, t, W * 0.06, H * (0.84 + i * 0.055), H * 0.045, W * 0.88, SANS, 900, p.ink, 'left')); tx(g, s.en, W * 0.06, H * (0.87 + L.length * 0.055 - 0.02), H * 0.02, W * 0.88, COND, 700, p.c, 'left'); },
    // New Year countdown: midnight, three flowing ribbons, a slim tower, firework bursts, the year in bulb lettering
    countdown(g, W, H, s, R) { const p = s.p, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) disc(g, R() * W, R() * H * 0.6, R() * 1.5, 'rgba(255,255,255,.7)');
      g.save(); g.globalCompositeOperation = 'lighter'; [[p.a, p.b], [p.b, p.c], [p.c, p.a]].forEach(([c1, c2], i) => { const rg = g.createLinearGradient(0, H, W, 0); rg.addColorStop(0, c1); rg.addColorStop(1, c2); g.strokeStyle = rg; g.globalAlpha = 0.55; g.lineWidth = W * (0.05 - i * 0.012); g.beginPath(); g.moveTo(-20, H * (0.86 - i * 0.05)); g.bezierCurveTo(W * 0.3, H * (0.5 - i * 0.08), W * 0.55, H * (0.9 - i * 0.05), W + 20, H * (0.25 + i * 0.07)); g.stroke(); }); g.restore(); g.globalAlpha = 1;
      const tx0 = W * 0.78; g.fillStyle = '#0a0f30'; for (let i = 0; i < 8; i++) { const y = H * (0.66 - i * 0.055); g.beginPath(); g.moveTo(tx0 - W * 0.035, y); g.lineTo(tx0 + W * 0.035, y); g.lineTo(tx0 + W * 0.05, y - H * 0.05); g.lineTo(tx0 - W * 0.05, y - H * 0.05); g.closePath(); g.fill(); g.fillStyle = 'rgba(160,220,255,.5)'; g.fillRect(tx0 - W * 0.03, y - H * 0.03, W * 0.06, 2); g.fillStyle = '#0a0f30'; } g.fillRect(tx0 - 2, H * 0.14, 4, H * 0.08); g.fillRect(tx0 - W * 0.03, H * 0.66, W * 0.06, H * 0.4);
      [[0.25, 0.2, p.a], [0.55, 0.12, p.c], [0.78, 0.08, p.b], [0.15, 0.42, p.c], [0.5, 0.33, p.b]].forEach(([x, y, c], i) => burst(g, W * x, H * y, W * (0.12 + (i % 2) * 0.05), 48, c, '#ffffff', R));
      const big = String(s.big || s.year); g.save(); fit(g, big, H * 0.2, W * 0.86, BLACK, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = H * 0.004; g.strokeStyle = p.c; g.strokeText(big, W / 2, H * 0.6);
      g.beginPath(); g.rect(0, 0, W, H); g.clip(); const [mc, m] = off(W, H); m.font = g.font; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText(big, W / 2, H * 0.6); m.globalCompositeOperation = 'source-in';
      const st = W * 0.018, [bc, bg2] = off(W, H); bg2.fillStyle = '#ffe8a3'; for (let y = 0; y < H; y += st) for (let x = 0; x < W; x += st) { bg2.beginPath(); bg2.arc(x, y, st * 0.36, 0, 6.2832); bg2.fill(); } m.drawImage(bc, 0, 0); g.shadowColor = '#ffd23f'; g.shadowBlur = W * 0.02; g.drawImage(mc, 0, 0); g.restore();
      tracked(g, '10 · 9 · 8 · 7 · 6 · 5 · 4 · 3 · 2 · 1', W / 2, H * 0.73, H * 0.02, W * 0.86, NUM, 700, p.c, 0.15); const L = split2(s.title); L.forEach((t, i) => tx(g, t, W / 2, H * (0.8 + i * 0.055), H * 0.044, W * 0.88, SANS, 900, '#ffffff'));
      tracked(g, [s.date, s.venue].filter(Boolean).join('  ·  '), W / 2, H * (0.83 + L.length * 0.055), H * 0.019, W * 0.88, NUM, 700, p.b, 0.15); },
    // a newspaper front: masthead, six columns, a headline, a halftone crowd photo (posters.md §12: the coverage is the story)
    news(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); grain(g, W, H, 2000, '60,60,60', 0.06, R); const m = W * 0.05;
      tx(g, '臺北日報', W / 2, H * 0.06, H * 0.06, W * 0.8, WEI, 900, p.ink); g.fillStyle = p.ink; g.fillRect(m, H * 0.1, W - 2 * m, 3); g.fillRect(m, H * 0.125, W - 2 * m, 1);
      tx(g, s.date + '  ·  TAIPEI DAILY  ·  第 ' + (((s.key.length * 37) % 900) + 100) + ' 號', W / 2, H * 0.113, H * 0.014, W * 0.86, MONO, 700, p.ink);
      const L = split2(s.big || s.title); L.forEach((t, i) => tx(g, t, m, H * (0.18 + i * 0.075), H * 0.068, W - 2 * m, SANS, 900, p.ink, 'left'));
      const y1 = H * (0.16 + L.length * 0.075); tx(g, s.en, m, y1 + H * 0.01, H * 0.02, W - 2 * m, SERIF, 700, p.a, 'left');
      const px0 = m, py0 = y1 + H * 0.035, pw = W * 0.6, ph = H * 0.34, st = W * 0.013;
      for (let y = 0; y < ph; y += st) for (let x = 0; x < pw; x += st) { let v = 0.25 + 0.35 * (y / ph); for (let k = 0; k < 7; k++) { const hx = pw * (k + 0.5) / 7, hy = ph * (0.45 + (k % 3) * 0.08); v += Math.max(0, 0.5 - Math.hypot(x - hx, (y - hy) * 0.8) / (pw * 0.07)); }
        if (y > ph * 0.15 && y < ph * 0.35) v += 0.3 * Math.max(0, 1 - Math.abs(x - pw * 0.7) / (pw * 0.2)); disc(g, px0 + x + st / 2, py0 + y + st / 2, st * 0.5 * Math.min(1, v + R() * 0.1), p.ink); }
      tx(g, '▲ ' + (s.story || s.title), px0, py0 + ph + H * 0.015, H * 0.014, pw, SANS, 600, p.b, 'left');
      const cx0 = m + pw + W * 0.03, cw = W - m - cx0; g.fillStyle = p.c; for (let y = py0; y < py0 + ph; y += H * 0.012) g.fillRect(cx0, y, cw * (0.7 + R() * 0.3), H * 0.005);
      const y2 = py0 + ph + H * 0.04; for (let c = 0; c < 6; c++) for (let y = y2; y < H * 0.95; y += H * 0.012) { g.fillStyle = y === y2 ? p.ink : p.c; g.fillRect(m + c * (W - 2 * m) / 6, y, (W - 2 * m) / 6 - W * 0.012, y === y2 ? H * 0.008 : H * 0.0045); }
      g.save(); g.translate(W * 0.8, H * 0.88); g.rotate(-0.18); g.strokeStyle = p.a; g.lineWidth = 3; g.strokeRect(-W * 0.13, -H * 0.03, W * 0.26, H * 0.06); tx(g, s.kicker || '號外 EXTRA', 0, 0, H * 0.028, W * 0.24, SANS, 900, p.a); g.restore(); },
    // 1920s Art Deco: a stepped arch, a gold sunburst, a geometric pair in cloche hat and boater, tracked capitals
    deco(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); const cx = W / 2, cy = H * 0.6;
      g.save(); g.beginPath(); g.rect(W * 0.08, H * 0.06, W * 0.84, H * 0.62); g.clip(); for (let i = 0; i < 36; i++) { const a = Math.PI + i / 35 * Math.PI; g.fillStyle = i % 2 ? p.a : p.bg; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.045) * H, cy + Math.sin(a - 0.045) * H); g.lineTo(cx + Math.cos(a + 0.045) * H, cy + Math.sin(a + 0.045) * H); g.closePath(); g.fill(); } g.restore();
      g.strokeStyle = p.ink; for (let k = 0; k < 4; k++) { g.lineWidth = k ? 2 : W * 0.012; const i = k * W * 0.018; g.beginPath(); g.moveTo(W * 0.08 + i, H * 0.68); g.lineTo(W * 0.08 + i, H * 0.2 + i); g.lineTo(W * 0.24 + i, H * 0.2 + i); g.lineTo(W * 0.24 + i, H * 0.12 + i); g.lineTo(W * 0.36 + i, H * 0.12 + i); g.lineTo(W * 0.36 + i, H * 0.06 + i); g.lineTo(W * 0.64 - i, H * 0.06 + i); g.lineTo(W * 0.64 - i, H * 0.12 + i); g.lineTo(W * 0.76 - i, H * 0.12 + i); g.lineTo(W * 0.76 - i, H * 0.2 + i); g.lineTo(W * 0.92 - i, H * 0.2 + i); g.lineTo(W * 0.92 - i, H * 0.68); g.stroke(); }
      g.fillStyle = p.ink; const fig = (x, hat, k) => { const q = W * 0.1; disc(g, x, cy - q * 2.4, q * 0.3); g.beginPath(); if (hat === 'cloche') { g.arc(x, cy - q * 2.5, q * 0.38, Math.PI, 0); g.lineTo(x + q * 0.44, cy - q * 2.38); g.lineTo(x - q * 0.44, cy - q * 2.38); } else { g.rect(x - q * 0.32, cy - q * 2.9, q * 0.64, q * 0.24); g.rect(x - q * 0.5, cy - q * 2.68, q, q * 0.06); } g.fill();
        g.beginPath(); g.moveTo(x - q * 0.5, cy - q * 2.0); g.lineTo(x + q * 0.5, cy - q * 2.0); g.lineTo(x + q * (k ? 0.7 : 0.4), cy - q * 0.4); g.lineTo(x - q * (k ? 0.7 : 0.4), cy - q * 0.4); g.closePath(); g.fill(); g.fillRect(x - q * 0.28, cy - q * 0.4, q * 0.18, q * 0.5); g.fillRect(x + q * 0.1, cy - q * 0.4, q * 0.18, q * 0.5);
        if (k) { g.fillStyle = p.c; for (let i = 0; i < 5; i++) g.fillRect(x - q * 0.62 + i * q * 0.26, cy - q * 0.4 - q * 0.12, q * 0.2, q * 0.12); g.fillStyle = p.ink; } };
      fig(W * 0.4, 'cloche', 1); fig(W * 0.6, 'boater', 0); g.fillStyle = p.b; g.fillRect(W * 0.08, H * 0.68, W * 0.84, H * 0.012);
      const L = split2(s.big || s.title); L.forEach((t, i) => tracked(g, t, W / 2, H * (0.75 + i * 0.07), H * 0.06, W * 0.84, WEI, 900, p.ink, 0.12));
      const yb = H * (0.77 + L.length * 0.07); tracked(g, String(s.en).toUpperCase(), W / 2, yb, H * 0.018, W * 0.8, DECO, 600, p.b, 0.35);
      g.save(); g.translate(W / 2, yb + H * 0.06); g.rotate(Math.PI / 4); g.fillStyle = p.a; g.fillRect(-H * 0.03, -H * 0.03, H * 0.06, H * 0.06); g.restore(); tx(g, s.year, W / 2, yb + H * 0.06, H * 0.018, H * 0.07, DECO, 800, p.ink);
      tracked(g, s.kicker || 'COSTUME PARADE', W * 0.12, yb + H * 0.06, H * 0.016, W * 0.3, DECO, 700, p.c, 0.3, 'left'); tracked(g, s.date, W * 0.88, yb + H * 0.06, H * 0.016, W * 0.3, DECO, 700, p.c, 0.2, 'right'); },
    // a market poster: kraft paper, a woodblock border, a grid of drawn goods, a hand-stamped title, price stickers
    market(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); for (let i = 0; i < 600; i++) { g.strokeStyle = `rgba(80,50,20,${R() * 0.15})`; g.lineWidth = 1; const x = R() * W, y = R() * H; line(g, [[x, y], [x + (R() - 0.5) * 20, y + (R() - 0.5) * 6]]); }
      const m = W * 0.04; g.strokeStyle = p.a; g.lineWidth = W * 0.02; g.strokeRect(m, m, W - 2 * m, H - 2 * m); [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => { g.fillStyle = p.a; g.fillRect(x - W * 0.03, y - W * 0.03, W * 0.06, W * 0.06); g.fillStyle = p.b; g.fillRect(x - W * 0.012, y - W * 0.012, W * 0.024, W * 0.024); });
      const goods = [(x, y, r) => { disc(g, x, y, r * 0.5, p.a); g.fillStyle = p.b; g.beginPath(); g.moveTo(x - r * 0.5, y); g.lineTo(x - r, y - r * 0.3); g.lineTo(x - r, y + r * 0.3); g.fill(); g.beginPath(); g.moveTo(x + r * 0.5, y); g.lineTo(x + r, y - r * 0.3); g.lineTo(x + r, y + r * 0.3); g.fill(); },
        (x, y, r) => { g.fillStyle = p.a; g.fillRect(x - r * 0.5, y - r * 0.8, r, r * 1.6); disc(g, x, y, r * 0.3, p.b); },
        (x, y, r) => { g.fillStyle = '#8a2a1a'; rr(g, x - r, y - r * 0.25, r * 2, r * 0.5, r * 0.25); g.fill(); },
        (x, y, r) => { g.fillStyle = '#e88a2a'; g.beginPath(); g.ellipse(x, y, r * 0.8, r * 0.6, 0, 0, 6.2832); g.fill(); g.fillStyle = p.c; g.fillRect(x - r * 0.1, y - r * 0.8, r * 0.2, r * 0.3); },
        (x, y, r) => { g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(x, y, r * 0.7, Math.PI, 0); g.fill(); g.fillStyle = '#e9d6b0'; g.fillRect(x - r * 0.15, y, r * 0.3, r * 0.5); },
        (x, y, r) => motif(g, 'lantern', x, y, r * 0.8, p.a)];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const x = W * (0.22 + i * 0.28), y = H * (0.14 + j * 0.14), r = W * 0.08; g.fillStyle = 'rgba(255,248,230,.5)'; disc(g, x, y, r * 1.15); goods[(i + j * 3 + s.variant) % goods.length](x, y, r); }
      const [mc, mm] = off(W, H); const L = split2(s.big || s.title); L.forEach((t, i) => { fit(mm, t, H * 0.1, W * 0.84, KAI, 900); mm.textAlign = 'center'; mm.textBaseline = 'middle'; mm.fillStyle = p.a; mm.fillText(t, W / 2, H * (0.6 + i * 0.1)); });
      mm.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 1400; i++) disc(mm, R() * W, H * (0.5 + R() * 0.3), R() * 2.2, '#000'); g.save(); g.translate(W / 2, H * 0.62); g.rotate(-0.03); g.drawImage(mc, -W / 2, -H * 0.62); g.restore();
      g.save(); g.translate(W * 0.8, H * 0.47); g.rotate(0.2); g.fillStyle = p.b; g.fillRect(-W * 0.1, -H * 0.03, W * 0.2, H * 0.06); tx(g, s.kicker || '新春特賣', 0, 0, H * 0.03, W * 0.18, SANS, 900, p.ink); g.restore();
      g.save(); g.translate(W * 0.78, H * 0.86); g.rotate(-0.2); g.strokeStyle = p.c; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, W * 0.09, 0, 6.2832); g.stroke(); tx(g, s.year, 0, -H * 0.012, H * 0.03, W * 0.15, NUM, 900, p.c); tx(g, '迪化', 0, H * 0.022, H * 0.02, W * 0.15, KAI, 900, p.c); g.restore();
      tx(g, s.en, W * 0.1, H * 0.84, H * 0.022, W * 0.55, SERIF, 700, p.ink, 'left'); tx(g, s.date, W * 0.1, H * 0.88, H * 0.02, W * 0.55, MONO, 700, p.ink, 'left'); },
    // a place memory: a sepia halftone photograph with deckled edges and photo corners, a ticket stub with a stamped date, a typewritten caption
    memory(g, W, H, s, R) { const p = s.p; g.fillStyle = p.bg; g.fillRect(0, 0, W, H); grain(g, W, H, 2500, '90,60,30', 0.08, R);
      const px0 = W * 0.08, py0 = H * 0.06, pw = W * 0.84, ph = H * 0.5; g.fillStyle = '#f7f1e2'; g.fillRect(px0 - W * 0.02, py0 - W * 0.02, pw + W * 0.04, ph + W * 0.04);
      const [sc, sg] = off(48, 30); const sk = sg.createLinearGradient(0, 0, 0, 30); sk.addColorStop(0, '#999'); sk.addColorStop(1, '#ddd'); sg.fillStyle = sk; sg.fillRect(0, 0, 48, 30); motif(sg, s.motif, 24, 17, 13, '#111'); sg.fillStyle = '#333'; sg.fillRect(0, 26, 48, 4); const A = sg.getImageData(0, 0, 48, 30).data;
      const st = pw / 48; for (let j = 0; j < 30; j++) for (let i = 0; i < 48; i++) { const v = 1 - A[(j * 48 + i) * 4] / 255; disc(g, px0 + (i + 0.5) * st, py0 + (j + 0.5) * (ph / 30), st * 0.55 * Math.min(1, v + R() * 0.12), p.ink); }
      g.fillStyle = p.c; g.globalAlpha = 0.18; g.fillRect(px0, py0, pw, ph); g.globalAlpha = 1; g.fillStyle = '#2a1a10'; [[px0, py0, 1, 1], [px0 + pw, py0, -1, 1], [px0, py0 + ph, 1, -1], [px0 + pw, py0 + ph, -1, -1]].forEach(([x, y, a, b]) => { g.beginPath(); g.moveTo(x - a * 4, y - b * 4); g.lineTo(x + a * W * 0.08, y - b * 4); g.lineTo(x - a * 4, y + b * W * 0.08); g.closePath(); g.fill(); });
      const L = split2(s.big || s.title); L.forEach((t, i) => tx(g, t, W * 0.08, H * (0.64 + i * 0.075), H * 0.065, W * 0.84, KAI, 900, p.ink, 'left'));
      tx(g, s.en, W * 0.08, H * (0.67 + L.length * 0.075 - 0.02), H * 0.02, W * 0.84, MONO, 700, p.b, 'left');
      const tx0 = W * 0.5, ty0 = H * 0.8, tw = W * 0.44, th = H * 0.14; g.fillStyle = '#f2e3b8'; g.fillRect(tx0, ty0, tw, th); g.fillStyle = p.bg; for (let y = ty0; y < ty0 + th; y += H * 0.016) disc(g, tx0 + tw * 0.28, y + H * 0.008, H * 0.004);
      tx(g, 'ADMIT ONE', tx0 + tw * 0.14, ty0 + th * 0.5, H * 0.016, tw * 0.24, MONO, 700, p.b); tx(g, s.kicker || '入場券', tx0 + tw * 0.64, ty0 + th * 0.3, H * 0.03, tw * 0.6, KAI, 900, p.ink);
      g.save(); g.translate(tx0 + tw * 0.64, ty0 + th * 0.68); g.rotate(-0.12); g.strokeStyle = p.a; g.lineWidth = 2.5; g.strokeRect(-tw * 0.3, -th * 0.18, tw * 0.6, th * 0.36); tx(g, s.date, 0, 0, H * 0.026, tw * 0.56, MONO, 700, p.a); g.restore();
      tx(g, s.story || s.venue, W * 0.08, H * 0.9, H * 0.016, W * 0.38, MONO, 600, p.b, 'left'); },
  };
  const LAYOUTS = Object.keys(LAY);

  // ── the wide faces: a booth's header band, a step-and-repeat backdrop, a counter skirt, a vertical pole banner ──
  function wideFace(g, W, H, s, mode, R) {
    const p = s.p, u = H, head0 = s.big && !/^\d+$/.test(s.big) ? s.big : s.title;
    // booth faces by kind (checker 2026-11-22: market, food and container booths read as one template): each takes a sign material
    if (mode === 'lacquer') {   // a market stall's red-lacquer 招牌: gilt double rule, 春 / 福 diamonds, the name in gilt kai
      drawMaterial(g, W, H, 'redlacquer', R); g.strokeStyle = '#e0b24a'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16); g.lineWidth = H * 0.015; g.strokeRect(H * 0.18, H * 0.18, W - H * 0.36, H - H * 0.36);
      [H * 0.75, W - H * 0.75].forEach((x, i) => { g.save(); g.translate(x, H / 2); g.rotate(Math.PI / 4); g.fillStyle = '#e0b24a'; g.fillRect(-H * 0.24, -H * 0.24, H * 0.48, H * 0.48); g.restore(); tx(g, i ? '福' : '春', x, H * 0.52, H * 0.32, H * 0.4, WEI, 900, '#7a1410'); });
      g.fillStyle = 'rgba(0,0,0,.45)'; tx(g, head0, W / 2 + 3, H * 0.46 + 3, H * 0.56, W - H * 2.6, KAI, 900, null); tx(g, head0, W / 2, H * 0.46, H * 0.56, W - H * 2.6, KAI, 900, '#f2c75a');
      tracked(g, String(s.en).toUpperCase() + '  ·  ' + s.year, W / 2, H * 0.8, H * 0.075, W - H * 2.8, NUM, 700, '#f2c75a', 0.3); return; }
    if (mode === 'noren') {   // a food stall's 暖簾: indigo cloth split into panels, one brushed character per panel, a red seal
      const ch = [...String(s.title)].slice(0, 6), n = Math.max(4, ch.length), gw = W / n; g.fillStyle = '#101014'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < n; i++) { g.save(); g.beginPath(); g.rect(i * gw + W * 0.004, 0, gw - W * 0.008, H); g.clip(); drawMaterial(g, W, H, 'cloth', R); g.fillStyle = 'rgba(22,32,72,.84)'; g.fillRect(0, 0, W, H); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 0, W, H * 0.1); ch.forEach((c, i) => tx(g, c, gw * (i + 0.5 + (n - ch.length) / 2), H * 0.56, H * 0.6, gw * 0.86, XING, 900, '#f4efe2'));
      g.fillStyle = '#b3261e'; g.fillRect(W - gw * 0.42, H * 0.66, gw * 0.3, H * 0.26); tx(g, s.year, W - gw * 0.27, H * 0.79, H * 0.1, gw * 0.26, NUM, 800, '#f4efe2'); return; }
    if (mode === 'stencil') {   // a shipping container's own face: corrugated tin, stencil name, owner code, a hazard band
      drawMaterial(g, W, H, 'tin', R); for (let x = 0; x < W; x += H * 0.12) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x, 0, H * 0.04, H); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + H * 0.05, 0, H * 0.02, H); }
      g.fillStyle = '#16161a'; g.fillRect(0, H * 0.84, W, H * 0.16); g.fillStyle = '#f2c14e'; for (let x = -H; x < W; x += H * 0.36) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H * 0.18, H); g.lineTo(x + H * 0.34, H * 0.84); g.lineTo(x + H * 0.16, H * 0.84); g.fill(); }
      tx(g, head0, W * 0.34, H * 0.44, H * 0.56, W * 0.58, COND, 900, '#ffffff'); tx(g, s.title, W * 0.8, H * 0.32, H * 0.2, W * 0.32, SANS, 900, p.b);
      tracked(g, 'TWPR ' + s.year + ' 5 · 22G1', W * 0.8, H * 0.6, H * 0.09, W * 0.32, MONO, 700, '#ffffff', 0.2); return; }
    if (mode === 'clothskirt') {   // a red cloth hung on the counter, the name in gilt, a tassel fringe
      drawMaterial(g, W, H, 'cloth', R); g.fillStyle = '#e0b24a'; g.fillRect(0, H * 0.06, W, H * 0.03); g.fillRect(0, H * 0.8, W, H * 0.03); for (let x = 0; x < W; x += W / 60) { g.fillRect(x, H * 0.84, W / 160, H * 0.16); }
      tx(g, s.title, W / 2, H * 0.42, H * 0.36, W * 0.8, KAI, 900, '#f2c75a'); tracked(g, s.kicker || s.date, W / 2, H * 0.68, H * 0.08, W * 0.7, NUM, 700, '#f2c75a', 0.3); return; }
    if (mode === 'slats') {   // an oiled teak counter front, the name carved and inked
      drawMaterial(g, W, H, 'teak', R); for (let x = W / 9; x < W; x += W / 9) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, 0, 3, H); }
      g.fillStyle = 'rgba(255,230,190,.35)'; tx(g, s.title, W / 2 + 2, H * 0.44 + 2, H * 0.4, W * 0.8, KAI, 900, null); tx(g, s.title, W / 2, H * 0.44, H * 0.4, W * 0.8, KAI, 900, '#1c120a');
      tx(g, (s.kicker || '') + '  ·  ' + s.year, W / 2, H * 0.78, H * 0.11, W * 0.6, KAI, 700, '#2a1a0e'); return; }
    if (mode === 'crates') {   // a stack of stencilled crates in front of the container
      drawMaterial(g, W, H, 'weathered', R); for (let i = 0; i < 4; i++) { const x = W * i / 4; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 4; g.strokeRect(x + 4, 4, W / 4 - 8, H - 8); g.beginPath(); g.moveTo(x + 4, 4); g.lineTo(x + W / 4 - 4, H - 4); g.stroke();
        tx(g, ['PIER', String(s.year), 'FRESH', 'NO.5'][i], x + W / 8, H * 0.5, H * 0.3, W / 4 - 30, COND, 900, i % 2 ? '#f2c14e' : '#ffffff'); } return; }
    if (mode === 'paste') {   // a counter papered with handbills for the day, pasted over each other
      drawMaterial(g, W, H, 'paper', R); const C = [p.a, p.b, p.c, p.ink, p.bg2]; for (let i = 0; i < 9; i++) { g.save(); g.translate(W * (0.06 + i * 0.11), H * (0.5 + (R() - 0.5) * 0.2)); g.rotate((R() - 0.5) * 0.18); g.fillStyle = C[i % 5]; g.fillRect(-W * 0.06, -H * 0.42, W * 0.12, H * 0.84);
        const ink = lum(C[i % 5]) > 0.5 ? '#16121a' : '#ffffff'; tx(g, i % 3 === 1 ? s.year : [...String(head0)].slice(0, 3).join(''), 0, -H * 0.05, H * 0.3, W * 0.1, BLACK, 900, ink); tx(g, s.kicker || '', 0, H * 0.28, H * 0.09, W * 0.1, NUM, 700, ink); g.restore(); } return; }
    if (mode === 'repeat') { g.fillStyle = p.bg; g.fillRect(0, 0, W, H); const word = s.kicker || s.big || s.title; for (let j = 0; j < 9; j++) for (let i = -1; i < 7; i++) { const x = W * (i + (j % 2) * 0.5) / 5.5, y = H * (j + 0.5) / 8.5; tx(g, j % 2 ? s.year : word, x + W * 0.09, y, H * 0.055, W * 0.15, j % 2 ? NUM : SANS, 900, j % 2 ? p.a : p.ink); motif(g, s.motif, x, y, H * 0.03, p.b); } return; }
    if (mode === 'skirt') { const base = lum(p.ink) > 0.5 ? p.bg : p.ink, fore = base === p.ink ? p.bg : p.ink; g.fillStyle = base; g.fillRect(0, 0, W, H); const n = 18; for (let i = 0; i < n; i++) { g.fillStyle = [p.a, p.b, p.c][i % 3]; g.beginPath(); g.moveTo(W * i / n, H); g.lineTo(W * (i + 0.5) / n, H * 0.62); g.lineTo(W * (i + 1) / n, H); g.closePath(); g.fill(); }
      tx(g, s.title, W / 2, H * 0.3, H * 0.3, W * 0.86, SANS, 900, lum(fore) > 0.5 ? fore : '#ffffff'); tracked(g, String(s.en).toUpperCase(), W / 2, H * 0.55, H * 0.09, W * 0.8, NUM, 700, p.b, 0.3); return; }
    // the header band: a palette field with a big pictogram bleeding off the left, the name huge, a tracked Latin line, a date chip
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) { g.fillStyle = [p.a, p.b, p.c][i % 3]; g.globalAlpha = 0.18; g.beginPath(); g.moveTo(W * (0.2 + i * 0.06), 0); g.lineTo(W * (0.24 + i * 0.06), 0); g.lineTo(W * (0.14 + i * 0.06), H); g.lineTo(W * (0.1 + i * 0.06), H); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = p.a; disc(g, u * 0.45, H * 0.5, u * 0.62); motif(g, s.motif, u * 0.45, H * 0.52, u * 0.42, p.bg);
    const head = s.big && !/^\d+$/.test(s.big) ? s.big : s.title; g.save(); g.textAlign = 'left'; g.textBaseline = 'middle'; fit(g, head, H * 0.56, W - u * 1.55 - W * 0.17, SANS, 900); g.fillStyle = p.c; g.fillText(head, u * 1.2 + H * 0.03, H * 0.42 + H * 0.03); g.fillStyle = p.ink; g.fillText(head, u * 1.2, H * 0.42); g.restore();
    tracked(g, String(s.en).toUpperCase(), u * 1.2, H * 0.82, H * 0.12, W - u * 1.4 - W * 0.17, NUM, 700, p.ink, 0.25, 'left');
    g.fillStyle = p.b; rr(g, W - W * 0.16, H * 0.18, W * 0.14, H * 0.64, H * 0.12); g.fill(); tx(g, s.year, W - W * 0.09, H * 0.4, H * 0.26, W * 0.12, NUM, 900, p.bg === '#ffffff' ? p.ink : p.bg); tx(g, s.kicker || '', W - W * 0.09, H * 0.66, H * 0.1, W * 0.12, NUM, 700, p.ink);
  }
  function bannerFace(g, W, H, s, i, n, R) {
    const p = s.p, C = [p.a, p.b, p.c, p.ink], col = C[i % 4]; g.fillStyle = col; g.fillRect(0, 0, W, H); const ink = col === p.ink ? p.bg : (col === p.b && /ffd|ffe|fff|f4d|f2c/i.test(p.b) ? p.ink : '#ffffff');
    g.strokeStyle = ink; g.globalAlpha = 0.25; g.lineWidth = W * 0.012; for (let k = 1; k < 12; k++) { g.beginPath(); g.arc(W / 2, H * 0.2, W * 0.06 * k, 0, 6.2832); g.stroke(); } g.globalAlpha = 1;
    const sp = ['run', 'swim', 'jump', 'lift', 'bat', 'hoop'][i % 6]; if (s.layout === 'games') stick(g, sp, W / 2, H * 0.2, W * 0.32, ink); else motif(g, s.motif, W / 2, H * 0.2, W * 0.3, ink);
    const chars = [...String(s.big || s.year)], c = chars.length >= n ? chars[i] || '' : chars[i % chars.length]; tx(g, c, W / 2, H * 0.55, H * 0.26, W * 0.96, BLACK, 900, ink);
    vtext(g, [...String(s.title)].slice(0, 9).join(''), W * 0.5, H * 0.72, Math.min(W * 0.12, H * 0.022), SANS, 800, ink);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, H * 0.96, W, H * 0.04); tx(g, s.date, W / 2, H * 0.98, H * 0.016, W * 0.9, NUM, 700, '#ffffff');
  }

  // ── the cast plate of a statue, and the ring set in the ground in front of it ──────────────
  function castPlate(g, W, H, s, R) {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#5a3a1c'); gr.addColorStop(0.5, '#2c1b0d'); gr.addColorStop(1, '#4a3016'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    grain(g, W, H, 2600, '255,210,140', 0.1, R); grain(g, W, H, 2000, '0,0,0', 0.22, R); const u = Math.min(W, H);
    g.strokeStyle = '#c49a52'; g.lineWidth = u * 0.03; g.strokeRect(u * 0.04, u * 0.04, W - u * 0.08, H - u * 0.08); g.fillStyle = '#c49a52'; for (let x = u * 0.1; x < W - u * 0.08; x += u * 0.035) { disc(g, x, u * 0.09, u * 0.008); disc(g, x, H - u * 0.09, u * 0.008); }
    const mx = u * 0.46, my = H / 2, mr = u * 0.3; g.strokeStyle = '#c49a52'; g.lineWidth = u * 0.015; g.beginPath(); g.arc(mx, my, mr, 0, 6.2832); g.stroke(); motif(g, s.motif, mx, my, mr * 0.62, 'rgba(0,0,0,.5)'); motif(g, s.motif, mx - 2, my - 2, mr * 0.62, '#d9b06a');
    const x0 = mx + mr + u * 0.1, mw = W - x0 - u * 0.12, rel = (t, y, px, face, wt, c) => { g.save(); g.fillStyle = 'rgba(0,0,0,.65)'; tx(g, t, x0 + 2, y + 2, px, mw, face, wt, null, 'left'); g.fillStyle = 'rgba(255,236,190,.45)'; tx(g, t, x0 - 1, y - 1, px, mw, face, wt, null, 'left'); tx(g, t, x0, y, px, mw, face, wt, c, 'left'); g.restore(); };
    rel(s.title, H * 0.3, H * 0.2, KAI, 900, '#e2bd74'); trk(g, H * 0.02); rel(String(s.en).toUpperCase(), H * 0.48, H * 0.07, SERIF, 700, '#c9a05a'); trk(g, 0);
    g.fillStyle = '#c49a52'; g.fillRect(x0, H * 0.56, mw * 0.5, 2); rel(s.date, H * 0.67, H * 0.11, SERIF, 700, '#e2bd74'); if (s.story) rel(s.story, H * 0.82, H * 0.065, KAI, 700, '#c9a05a');
  }
  function ringFace(g, W, H, s) {
    g.clearRect(0, 0, W, H); const c = W / 2, r = W * 0.48; g.fillStyle = '#3a2614'; disc(g, c, c, r); g.fillStyle = '#20150b'; disc(g, c, c, r * 0.72); g.strokeStyle = '#c49a52'; g.lineWidth = W * 0.01; [r * 0.97, r * 0.74].forEach(q => { g.beginPath(); g.arc(c, c, q, 0, 6.2832); g.stroke(); });
    motif(g, s.motif, c, c, r * 0.4, '#c49a52'); const t = ('  ' + s.title + '  ★  ' + s.date + '  ★  ' + (s.en || '').toUpperCase() + '  ★').slice(0, 64), ch = [...t];
    g.fillStyle = '#e2bd74'; setF(g, 700, W * 0.05, SANS); g.textAlign = 'center'; g.textBaseline = 'middle'; ch.forEach((x, i) => { const a = -Math.PI / 2 + i / ch.length * 6.2832; g.save(); g.translate(c + Math.cos(a) * r * 0.855, c + Math.sin(a) * r * 0.855); g.rotate(a + Math.PI / 2); g.fillText(x, 0, 0); g.restore(); });
  }

  // ── the photo-topic showcase headers: each topic its own exhibition graphic ─────────────────
  // a header: the topic's name set huge on a grid, offset in a second colour, a drawn panel of the subject bleeding off the right,
  // an exhibit number, the English name tracked, the years in a chip. HDR[topic] = [palette, panel drawing, face]
  const HP = (g, x, y, w, h) => [x, y, w, h];
  const PANEL = {
    family(g, x, y, w, h, p, R) { for (let i = 0; i < 5; i++) { g.save(); g.translate(x + w * (0.2 + i * 0.17), y + h * (0.5 + (i % 2 ? -0.08 : 0.08))); g.rotate((R() - 0.5) * 0.5); g.fillStyle = '#ffffff'; g.fillRect(-h * 0.3, -h * 0.36, h * 0.6, h * 0.72); g.fillStyle = [p.a, p.b, p.c, '#8fb8c8', '#e8b48a'][i]; g.fillRect(-h * 0.25, -h * 0.31, h * 0.5, h * 0.46);
      g.fillStyle = 'rgba(30,20,15,.62)'; const n = 2 + (i % 3); for (let k = 0; k < n; k++) { const fx = -h * 0.17 + k * h * 0.34 / Math.max(1, n - 1), q = h * (k === n - 1 && n > 2 ? 0.045 : 0.07), top = h * 0.15 - q * 4.2; disc(g, fx, top, q * 0.75); g.beginPath(); g.moveTo(fx - q * 1.2, h * 0.15); g.quadraticCurveTo(fx - q * 1.2, top + q * 1.2, fx, top + q * 1.1); g.quadraticCurveTo(fx + q * 1.2, top + q * 1.2, fx + q * 1.2, h * 0.15); g.fill(); } g.restore(); } },
    school(g, x, y, w, h, p) { const L = [[p.a, 0.3], [p.b, 0.55], [p.c, 0.78]]; L.forEach(([c, k], i) => { g.strokeStyle = c; g.lineWidth = h * 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y + h * k); g.lineTo(x + w * (0.35 + i * 0.1), y + h * k); g.lineTo(x + w * (0.55 + i * 0.1), y + h * (k - 0.2 + i * 0.1)); g.lineTo(x + w * 1.1, y + h * (k - 0.2 + i * 0.1)); g.stroke(); for (let s = 0; s < 4; s++) { disc(g, x + w * (0.12 + s * 0.22), y + h * (s > 1 ? k - 0.2 + i * 0.1 : k), h * 0.05, '#ffffff'); g.lineWidth = h * 0.02; g.stroke(); } }); },
    food(g, x, y, w, h, p) { [[0.3, 0.55, 0.34, p.a], [0.62, 0.5, 0.42, p.b], [0.9, 0.6, 0.3, p.c]].forEach(([fx, fy, r, c]) => { g.save(); g.translate(x + w * fx, y + h * fy); g.scale(h * r / 100, h * r / 100); g.fillStyle = g.strokeStyle = c; MOTIF.bowl(g); g.restore(); }); },
    chunghwa(g, x, y, w, h, p) { for (let i = 0; i < 8; i++) { const bx = x + i * w / 8; g.fillStyle = i % 2 ? p.a : p.b; g.fillRect(bx, y + h * 0.2, w / 8 - 3, h * 0.65); g.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 3; k++) g.fillRect(bx + 4, y + h * (0.28 + k * 0.17), w / 8 - 11, h * 0.08); } g.fillStyle = p.c; g.fillRect(x, y + h * 0.1, w, h * 0.06); g.fillStyle = '#ffffff'; g.fillRect(x, y + h * 0.86, w, h * 0.03); for (let k = 0; k < 9; k++) g.fillRect(x + k * w / 9, y + h * 0.9, w / 18, h * 0.03); },
    cinema(g, x, y, w, h, p) { g.fillStyle = '#16161a'; g.fillRect(x, y + h * 0.12, w, h * 0.76); g.fillStyle = '#f4f1e4'; for (let i = 0; i < w / (h * 0.12); i++) { g.fillRect(x + i * h * 0.12 + h * 0.02, y + h * 0.16, h * 0.07, h * 0.08); g.fillRect(x + i * h * 0.12 + h * 0.02, y + h * 0.76, h * 0.07, h * 0.08); }
      for (let k = 0; k < 3; k++) { g.fillStyle = [p.a, p.b, p.c][k]; g.fillRect(x + w * (0.04 + k * 0.33), y + h * 0.3, w * 0.29, h * 0.4); g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.moveTo(x + w * (0.16 + k * 0.33), y + h * 0.4); g.lineTo(x + w * (0.22 + k * 0.33), y + h * 0.5); g.lineTo(x + w * (0.16 + k * 0.33), y + h * 0.6); g.fill(); } },
    walk(g, x, y, w, h, p, R) { for (let i = 0; i < 7; i++) { g.fillStyle = '#ffffff'; g.fillRect(x + i * w / 7, y + h * 0.15, w / 14, h * 0.7); } for (let i = 0; i < 10; i++) { g.fillStyle = [p.a, p.b, p.c][i % 3]; const fx = x + w * (0.05 + i * 0.1), fy = y + h * (i % 2 ? 0.35 : 0.6); g.beginPath(); g.ellipse(fx, fy, h * 0.05, h * 0.09, 0.3, 0, 6.2832); g.fill(); disc(g, fx + h * 0.03, fy - h * 0.12, h * 0.03); } },
    redhouse(g, x, y, w, h, p) { const cx = x + w * 0.5, cy = y + h * 0.55, r = h * 0.4; g.fillStyle = p.a; g.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; for (let yy = cy - r; yy < cy + r; yy += h * 0.05) line(g, [[cx - r, yy], [cx + r, yy]]);
      g.fillStyle = p.b; g.fillRect(cx - r * 0.2, cy - r * 1.35, r * 0.4, r * 0.5); g.beginPath(); g.moveTo(cx - r * 0.3, cy - r * 1.35); g.lineTo(cx, cy - r * 1.7); g.lineTo(cx + r * 0.3, cy - r * 1.35); g.fill(); g.fillStyle = '#fff3d6'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(cx + k * r * 0.45, cy + r * 0.2, r * 0.14, Math.PI, 0); g.lineTo(cx + k * r * 0.45 + r * 0.14, cy + r * 0.6); g.lineTo(cx + k * r * 0.45 - r * 0.14, cy + r * 0.6); g.fill(); } },
    newyear(g, x, y, w, h, p) { for (let i = 0; i < 6; i++) { const lx = x + w * (0.08 + i * 0.17), ly = y + h * (0.4 + Math.sin(i) * 0.12); g.strokeStyle = p.b; g.lineWidth = 2; line(g, [[lx, y], [lx, ly]]); motif(g, 'lantern', lx, ly + h * 0.15, h * 0.18, i % 2 ? p.a : '#ff5a3a'); } g.save(); g.translate(x + w * 0.5, y + h * 0.62); g.rotate(Math.PI / 4); g.fillStyle = p.a; g.fillRect(-h * 0.2, -h * 0.2, h * 0.4, h * 0.4); g.restore(); tx(g, '春', x + w * 0.5, y + h * 0.63, h * 0.3, h * 0.4, WEI, 900, p.bg); },
    temple(g, x, y, w, h, p) { g.fillStyle = p.a; g.beginPath(); g.moveTo(x, y + h * 0.4); g.quadraticCurveTo(x + w * 0.5, y + h * 0.28, x + w, y + h * 0.4); g.lineTo(x + w * 0.92, y + h * 0.5); g.lineTo(x + w * 0.08, y + h * 0.5); g.closePath(); g.fill(); g.strokeStyle = p.b; g.lineWidth = h * 0.02; [[0.1, 0.24], [0.9, 0.24]].forEach(([k]) => { g.beginPath(); g.arc(x + w * k, y + h * 0.3, h * 0.1, Math.PI, 0); g.stroke(); });
      for (let i = 0; i < 3; i++) { const cx = x + w * (0.3 + i * 0.2), cy = y + h * 0.75; g.strokeStyle = [p.b, '#ffffff', p.c][i]; g.lineWidth = 2; for (let k = 1; k < 6; k++) { g.beginPath(); g.ellipse(cx, cy, k * h * 0.03, k * h * 0.012, 0, 0, 6.2832); g.stroke(); } line(g, [[cx, cy], [cx, y + h * 0.5]]); } },
    fabric(g, x, y, w, h, p, R) { for (let i = 0; i < 6; i++) { const bx = x + i * w / 6, c = [p.a, p.b, p.c, '#2a6a8a', '#e8b4c4', '#6a8a3a'][i]; g.fillStyle = c; g.fillRect(bx, y + h * 0.1, w / 6 - 4, h * 0.8); g.fillStyle = 'rgba(255,255,255,.5)';
      if (i % 3 === 0) for (let yy = 0; yy < h * 0.8; yy += h * 0.08) g.fillRect(bx, y + h * 0.1 + yy, w / 6 - 4, h * 0.02); else if (i % 3 === 1) for (let k = 0; k < 12; k++) disc(g, bx + (k % 3 + 0.5) * (w / 18), y + h * (0.16 + ((k / 3) | 0) * 0.2), h * 0.025); else for (let k = 0; k < 6; k++) { g.save(); g.translate(bx + w / 12, y + h * (0.2 + k * 0.13)); g.rotate(0.8); g.fillRect(-h * 0.04, -h * 0.04, h * 0.08, h * 0.08); g.restore(); } } },
    wharf(g, x, y, w, h, p) { g.fillStyle = p.c; g.fillRect(x, y + h * 0.6, w, h * 0.4); g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.02; for (let k = 0; k < 3; k++) { g.beginPath(); for (let xx = x; xx < x + w; xx += h * 0.2) { g.moveTo(xx, y + h * (0.7 + k * 0.1)); g.quadraticCurveTo(xx + h * 0.05, y + h * (0.66 + k * 0.1), xx + h * 0.1, y + h * (0.7 + k * 0.1)); } g.stroke(); }
      g.fillStyle = p.a; g.beginPath(); g.moveTo(x + w * 0.3, y + h * 0.6); g.lineTo(x + w * 0.7, y + h * 0.6); g.lineTo(x + w * 0.64, y + h * 0.7); g.lineTo(x + w * 0.36, y + h * 0.7); g.fill(); g.fillRect(x + w * 0.49, y + h * 0.2, 3, h * 0.4); g.beginPath(); g.moveTo(x + w * 0.5, y + h * 0.22); g.lineTo(x + w * 0.66, y + h * 0.56); g.lineTo(x + w * 0.5, y + h * 0.56); g.fill(); },
    fireworks(g, x, y, w, h, p, R) { g.fillStyle = '#060818'; g.fillRect(x, y, w, h); [[0.2, 0.4, p.a], [0.5, 0.35, p.b], [0.8, 0.45, p.c]].forEach(([fx, fy, c]) => burst(g, x + w * fx, y + h * fy, h * 0.38, 40, c, '#ffffff', R)); },
    quiet(g, x, y, w, h, p) { g.fillStyle = p.c; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(x + w * 0.42, y + h * 0.9); g.lineTo(x + w * 1.0, y + h * 0.98); g.lineTo(x + w, y + h); g.lineTo(x + w * 0.42, y + h); g.fill(); g.fillStyle = p.ink; g.fillRect(x + w * 0.4, y + h * 0.15, 4, h * 0.78); g.fillRect(x + w * 0.4, y + h * 0.15, w * 0.1, 4); disc(g, x + w * 0.5, y + h * 0.2, h * 0.04, p.b); for (let k = 0; k < 4; k++) g.fillRect(x + w * (0.1 + k * 0.08), y + h * (0.6 - k * 0.08), w * 0.05, h * (0.33 + k * 0.08)); },
    skywalk(g, x, y, w, h, p) { const B = [[0.05, 0.2, 0.18], [0.3, 0.05, 0.16], [0.55, 0.25, 0.18], [0.8, 0.1, 0.18]]; B.forEach(([bx, by, bw], i) => { g.fillStyle = [p.a, p.b, p.c, p.ink][i]; g.fillRect(x + w * bx, y + h * by, w * bw, h * (1 - by)); }); g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.05; line(g, [[x + w * 0.23, y + h * 0.55], [x + w * 0.3, y + h * 0.55]]); line(g, [[x + w * 0.46, y + h * 0.5], [x + w * 0.55, y + h * 0.5]]); line(g, [[x + w * 0.73, y + h * 0.5], [x + w * 0.8, y + h * 0.5]]); },
    climb(g, x, y, w, h, p) { g.save(); g.translate(x + w * 0.5, y + h * 0.5); g.scale(h / 210, h / 210); g.fillStyle = p.a; MOTIF.tower(g); g.restore(); g.strokeStyle = p.b; g.lineWidth = 2; g.setLineDash([4, 4]); line(g, [[x + w * 0.56, y + h], [x + w * 0.54, y + h * 0.5], [x + w * 0.52, y + h * 0.1]]); g.setLineDash([]); stick(g, 'jump', x + w * 0.58, y + h * 0.4, h * 0.12, p.c); },
    lookup(g, x, y, w, h, p) { const cx = x + w * 0.5, cy = y + h * 1.1; for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.15 + i / 17 * 0.7); g.strokeStyle = i % 2 ? p.a : p.b; g.lineWidth = h * 0.02; line(g, [[cx, cy], [cx + Math.cos(a) * w, cy + Math.sin(a) * w]]); } g.fillStyle = p.c; g.beginPath(); g.moveTo(cx - w * 0.08, y + h); g.lineTo(cx - w * 0.01, y); g.lineTo(cx + w * 0.01, y); g.lineTo(cx + w * 0.08, y + h); g.fill(); },
  };
  const HDR = {
    family: ['memory', 'family', WEI], school: ['games', 'school', SANS], food: ['market', 'food', XING], chunghwa: ['deco', 'chunghwa', WEI], cinema: ['premiere', 'cinema', SONG], walk: ['sport', 'walk', SANS],
    redhouse: ['memory', 'redhouse', KAI], newyear: ['lantern', 'newyear', XING], temple: ['temple', 'temple', KAI], fabric: ['street', 'fabric', KAI], wharf: ['river', 'wharf', XING], fireworks: ['countdown', 'fireworks', SANS],
    quiet: ['news', 'quiet', SONG], skywalk: ['esports', 'skywalk', SANS], climb: ['sport', 'climb', SANS], lookup: ['nightart', 'lookup', SANS],
  };
  function drawHeader(g, W, H, topic, info) {
    const R = rng('hdr' + topic), h = HDR[topic] || HDR[Object.keys(HDR)[[...String(topic)].reduce((a, c) => a + c.charCodeAt(0), 0) % 16]], p = pal(h[0]), face = h[2], zh = String(info.zh || topic), en = String(info.en || ''), no = Object.keys(HDR).indexOf(topic) + 1;
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2); g.fillStyle = gr; g.fillRect(0, 0, W, H); grain(g, W, H, 900, '128,128,128', 0.06, R);
    const im = art(info.art === false ? null : info.art || 'posters/topics/' + topic + '.jpg'), pw = W * (im ? 0.46 : 0.4), px = W - pw; g.save(); g.beginPath(); g.rect(px, 0, pw, H); g.clip();
    if (im) {   // the topic's painting in the panel, graded to the palette, the drawn subject laid over it as a print layer, a fade into the ground
      coverArt(g, im, px, 0, pw, H, 0.5, 0.5); gradeArt(g, px, 0, pw, H, p, 0.8); g.globalAlpha = 0.28; g.globalCompositeOperation = 'screen'; (PANEL[h[1]] || PANEL.family)(g, px, 0, pw, H, p, R);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; const fd = g.createLinearGradient(px, 0, px + pw * 0.28, 0); fd.addColorStop(0, p.bg); fd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fd; g.fillRect(px, 0, pw * 0.28, H);
      g.strokeStyle = p.b; g.lineWidth = Math.max(2, H * 0.012); g.strokeRect(px + pw * 0.06, H * 0.08, pw * 0.88, H * 0.84);
    } else (PANEL[h[1]] || PANEL.family)(g, px, 0, pw, H, p, R); g.restore();
    g.fillStyle = p.a; g.fillRect(0, 0, H * 0.22, H); g.save(); g.translate(H * 0.11, H * 0.5); g.rotate(-Math.PI / 2); tracked(g, 'No. ' + String(no || 0).padStart(2, '0'), 0, 0, H * 0.12, H * 0.9, NUM, 800, lum(p.a) > 0.55 ? '#1a1410' : '#ffffff', 0.2); g.restore();
    const ch = zh.match(/[0-9A-Za-z.]+|\S/g) || [zh], wgt = t => (t.length > 1 ? t.length * 0.58 : 1), tot = ch.reduce((a, t) => a + wgt(t), 0), x0 = H * 0.34, maxW = px - x0 - H * 0.08, cell = Math.min(maxW / tot, H * 0.7), q = cell * 0.96;
    setF(g, 900, q, face); g.textAlign = 'center'; g.textBaseline = 'middle'; const ink = /^#(f|e)/i.test(p.bg) ? p.ink : '#ffffff';
    let acc = 0; ch.forEach((c, i) => { const span = cell * wgt(c), cx = x0 + acc + span / 2, cy = H * 0.44 + (i % 2 ? H * 0.03 : -H * 0.01); acc += span; fit(g, c, q, span * 0.98, face, 900); g.fillStyle = p.b; g.fillText(c, cx + q * 0.06, cy + q * 0.06); g.fillStyle = ink; g.fillText(c, cx, cy); });
    g.fillStyle = p.b; g.fillRect(x0, H * 0.79, Math.min(maxW, cell * tot) * 0.4, Math.max(2, H * 0.015));
    tracked(g, en.toUpperCase(), x0, H * 0.89, H * 0.09, maxW * 0.62, NUM, 700, ink, 0.3, 'left');
    tracked(g, 'PHOTO EXHIBITION · 照片展', x0, H * 0.1, H * 0.06, maxW * 0.5, NUM, 600, ink, 0.2, 'left');
    if (info.years) { g.fillStyle = p.c; rr(g, px - H * 0.08 - W * 0.12, H * 0.08, W * 0.12, H * 0.18, H * 0.09); g.fill(); tx(g, info.years, px - H * 0.08 - W * 0.06, H * 0.17, H * 0.11, W * 0.11, NUM, 800, p.bg === '#ffffff' ? p.ink : p.bg); }
  }

  // ── what a bare item gets: the curated design for its key, else one read from its kind, years and wording ──
  // Each curated piece uses a different form / layout / mount / palette, so no two markers in the city share a template.
  const CUR = {
    // 西門 Ximen
    'mayday-5th-anniv-2004': { form: 'poster', layout: 'concert', mount: 'wall', layouts: ['concert', 'street', 'concert', 'news'], palette: 'concert', head: '五月天 五週年', big: 'MAYDAY 5', kicker: 'LIVE', venue: '西門町 · 台北' },
    'jay-chou-signing-2004': { form: 'booth', booth: 'signing', layout: 'concert', palette: 'hiphop', head: '七里香 簽唱會', big: '七里香', kicker: 'SIGNING', venue: '西門町 徒步區' },
    'lantern-festival-2017': { form: 'installation', piece: 'lantern', layout: 'lantern', palette: 'lantern', head: '台北燈節', big: '西門燈節', kicker: '2017 燈節' },
    'golden-horse-outdoor-2018': { form: 'installation', piece: 'screen', layout: 'premiere', palette: 'river', head: '電影公園 露天放映', big: '露天電影夜', kicker: 'OPEN-AIR CINEMA' },
    'rainbow-crossing-2019': { form: 'installation', piece: 'arch', layout: 'street', palette: 'rainbow', motif: 'rainbow', head: '彩虹地景', big: '六號出口' },
    'backstreet-fest-2020': { form: 'poster', layout: 'street', mount: 'wall', layouts: ['street', 'anime', 'concert', 'street'], palette: 'hiphop', head: '後街文化祭', big: 'BACK ST.', venue: '西門町後街' },
    'play-now-concert-2021': { form: 'booth', booth: 'stage', layout: 'concert', palette: 'hiphop', head: 'PLAY NOW', big: '嘻嘻哈哈', kicker: 'HIP-HOP' },
    'orange-carnival-2024': { form: 'booth', booth: 'carnival', layout: 'street', palette: 'orange', head: '橘子嘉年華', big: '紅樓夜嗨祭', kicker: 'CARNIVAL' },
    'gatao-fanmeet-2025': { form: 'booth', booth: 'fanmeet', layout: 'premiere', palette: 'premiere', head: '角頭 鬥陣欸', big: '封街見面會', kicker: 'FAN MEET', venue: '西門町電影街' },
    'drag-festival-2025': { form: 'statue', motif: 'heel', plinth: 'drum', palette: 'rainbow', head: '國際變裝藝術節', story: '紅樓前的一夜，鞋跟與羽毛' },
    // 大稻埕 Dadaocheng
    'new-year-goods-street': { form: 'booth', booth: 'market', layout: 'market', palette: 'market', head: '年貨大街', big: '迪化年貨', kicker: '新春特賣' },
    'city-god-procession': { form: 'statue', motif: 'parade', plinth: 'block', palette: 'temple', head: '迎城隍', story: '五月十三，七爺八爺開路' },
    'dadaocheng-fireworks': { form: 'installation', piece: 'burst', layout: 'countdown', palette: 'river', head: '大稻埕煙火', big: '七夕煙火' },
    'tttifa-arts-festival': { form: 'poster', layout: 'deco', mount: 'standee', palette: 'deco', head: '大稻埕國際藝術節', big: '一九二〇', kicker: 'COSTUME PARADE' },
    'film-twa-tiu-tiann-2014': { form: 'poster', layout: 'painted', mount: 'billboard', palette: 'painted', head: '大稻埕', big: '大稻埕', venue: '2014 春節檔' },
    'solitary-gourmet-yongle': { form: 'booth', booth: 'food', layout: 'market', palette: ['#f3e9d2', '#e8d8b4', '#2a1a10', '#b3261e', '#e9b53a', '#2f6b3a'], head: '孤獨的美食家', big: '永樂市場', kicker: '一人份' },
    'pier5-container-market': { form: 'booth', booth: 'container', layout: 'street', palette: ['#1f5e8c', '#123a5c', '#ffffff', '#f2c14e', '#e76f51', '#9be7ff'], head: 'PIER5 貨櫃市集', big: 'PIER 5', kicker: 'MARKET' },
    'yuelao-matchmaker-crowds': { form: 'statue', motif: 'thread', plinth: 'drum', palette: 'temple', head: '月老牽紅線', story: '排隊求一條紅線的人潮' },
    // 信義 Xinyi
    'taipei-101-opening-2004': { form: 'statue', motif: 'tower', plinth: 'block', head: '台北101 啟用', story: '世界最高樓開幕的那一夜' },
    'first-nye-fireworks-2005': { form: 'installation', piece: 'digits', big: '2005', palette: 'countdown', head: '第一場101煙火' },
    'alain-robert-climb-2004': { form: 'poster', layout: 'news', mount: 'case', palette: 'news', head: '蜘蛛人 攀上101', kicker: '號外' },
    'alex-honnold-free-solo-2026': { form: 'statue', motif: 'climber', plinth: 'podium', head: '無繩攀登101', story: '沒有繩子，一層一層往上' },
    'eslite-xinyi-last-night-2023': { form: 'installation', piece: 'books', palette: 'memory', head: '誠品信義 最後一夜', big: '最後一夜' },
    'taipei-nye-party-2020': { form: 'poster', layout: 'countdown', mount: 'column', layouts: ['countdown', 'concert', 'countdown'], palette: 'countdown', head: '最HIGH新年城', big: '2020', venue: '市府前廣場' },
    'taiwan-pride-city-hall-2024': { form: 'installation', piece: 'canopy', obj: 'umbrella', layout: 'street', palette: 'rainbow', motif: 'rainbow', head: '彩虹遊行', big: '彩虹' },
    'taipei-101-run-up-2005': { form: 'statue', motif: 'runner', plinth: 'podium', palette: 'sport', head: '101 國際登高賽', story: '2046 級台階，一口氣跑上去' },
    'nuit-blanche-xinyi-2023': { form: 'installation', piece: 'rings', layout: 'nightart', palette: 'nightart', head: '白晝之夜', big: '白晝之夜', kicker: 'NUIT BLANCHE' },
    'simple-life-urban-2019': { form: 'booth', booth: 'craft', layout: 'market', palette: ['#efe6d2', '#dfd2b4', '#2a3a2a', '#2f6b3a', '#e9b53a', '#c4201a'], head: '簡單生活節', big: 'SIMPLE LIFE', kicker: 'URBAN+' },
    'deadpool-reynolds-2016': { form: 'booth', booth: 'carpet', layout: 'premiere', palette: ['#1a0a0c', '#3a0a10', '#ffffff', '#c81d25', '#f3e2b0', '#111111'], head: '紅毯之夜', big: 'RED CARPET', kicker: 'PREMIERE', venue: '信義威秀' },
    'weekend-in-taipei-2024': { form: 'poster', layout: 'premiere', mount: 'case', carpet: true, palette: 'premiere', head: '台北追緝令', big: '台北追緝令', venue: '信義威秀 · 世界首映' },
    // city-wide square
    'golden-melody-arena-2006': { form: 'poster', layout: 'award', mount: 'case', carpet: true, palette: 'award', head: '金曲獎 登上小巨蛋', big: '金曲', kicker: 'GOLDEN MELODY', kicker2: '第十七屆', venue: '臺北小巨蛋 TAIPEI ARENA' },
    'flora-expo-2010': { form: 'installation', piece: 'flowers', layout: 'expo', palette: 'expo', head: '臺北國際花卉博覽會', big: '花博' },
    'nba-taipei-game-2013': { form: 'statue', motif: 'ball', plinth: 'podium', palette: 'sport', head: '籃球來到臺北', story: '小巨蛋裡一萬人一起尖叫' },
    'yuanzai-first-day-2014': { form: 'statue', motif: 'panda', plinth: 'drum', palette: ['#e9efe4', '#cfdcc8', '#1a1a1a', '#2f6b3a', '#e9b53a', '#ffffff'], head: '圓仔 第一次見面', story: '排隊看一隻小貓熊' },
    'pokemon-go-beitou-2016': { form: 'installation', piece: 'phones', layout: 'news', palette: ['#0f1a2a', '#16304a', '#ffffff', '#a8f0ff', '#ffd23f', '#ff5a5f'], head: '北投公園 像跨年夜', big: '抓寶人潮', motif: 'pin' },
    'universiade-2017': { form: 'poster', layout: 'games', mount: 'banner', palette: 'games', head: '臺北世大運', big: '2017', kicker: '我的主場' },
    'nuit-blanche-gongguan-2017': { form: 'poster', layout: 'nightart', mount: 'case', palette: ['#1a0b3a', '#0b1e5b', '#ffffff', '#ff7a59', '#9be7ff', '#ffe66d'], head: '白晝之夜 公館', big: '公館之夜', kicker: 'NUIT BLANCHE' },
    'msi-2019-heping': { form: 'booth', booth: 'esports', layout: 'esports', palette: 'esports', head: '季中邀請賽 決賽', big: '決賽之夜', kicker: 'FINALS NIGHT', venue: '和平籃球館' },
    'lantern-fest-shilin-2022': { form: 'installation', piece: 'canopy', obj: 'lantern', layout: 'lantern', palette: 'lantern', head: '台北燈節 士林', big: '士林燈節' },
    'jay-chou-taipei-dome-2024': { form: 'poster', layout: 'concert', mount: 'column', layouts: ['concert', 'concert', 'street'], palette: ['#f2e8d5', '#e9dcc2', '#1b1430', '#ff2e63', '#7a2bff', '#2a1050'], head: '嘉年華 大巨蛋', big: '嘉年華', kicker: 'CARNIVAL LIVE', venue: '臺北大巨蛋' },
    'fancy-frontier-ff': { form: 'booth', booth: 'doujin', layout: 'anime', palette: 'anime', head: '開拓動漫祭', big: 'FF', venue: '花博爭艷館' },
  };
  const has = (s, re) => re.test(s);
  function choose(it, type, shape) {
    it = it || {}; const c = CUR[it.key]; if (c) return Object.assign({}, c);
    const s = (it.zh || '') + ' ' + (it.en || ''), sh = shape || (it.marker && it.marker.shape) || 'generic', t = type || (it.marker && it.marker.type), d = { motif: sh };
    const L = has(s, /金曲|金馬|頒獎|award/i) ? 'award' : has(s, /花博|博覽|expo/i) ? 'expo' : has(s, /世大運|運動會|NBA|賽|games|race/i) ? 'games' : has(s, /電競|英雄聯盟|esports|LoL|MSI/i) ? 'esports'
      : has(s, /白晝|藝術節|nuit/i) ? 'nightart' : has(s, /燈節|燈會|lantern/i) ? 'lantern' : has(s, /動漫|同人|cosplay|FF/i) ? 'anime' : has(s, /首映|紅毯|見面會|premiere|fan meet/i) ? 'premiere'
      : has(s, /電影|影展|film|movie/i) ? 'painted' : has(s, /跨年|倒數|煙火|new year|firework/i) ? 'countdown' : has(s, /演唱|簽唱|音樂|concert|live/i) ? 'concert' : has(s, /市集|年貨|market/i) ? 'market'
      : has(s, /遊行|嘉年華|祭|parade|festival|carnival/i) ? 'street' : has(s, /人潮|crowd|新聞/i) ? 'news' : it.kind === 'event' ? 'street' : 'memory';
    d.layout = L; d.palette = L;
    if (t === 'statue') return Object.assign(d, { form: 'statue', plinth: ['block', 'drum', 'podium'][(it.key || '').length % 3] });
    if (t === 'stand') return Object.assign(d, { form: 'booth', booth: { concert: 'stage', premiere: 'fanmeet', market: 'market', anime: 'doujin', esports: 'esports', award: 'carpet' }[L] || 'craft' });
    if (t === 'wall') return Object.assign(d, { form: 'poster', mount: 'wall' });
    const mount = { award: 'case', expo: 'column', games: 'banner', esports: 'case', concert: 'column', nightart: 'case', lantern: 'banner', anime: 'standee', premiere: 'case', painted: 'billboard', countdown: 'column', news: 'case', market: 'standee', street: 'wall', deco: 'standee', memory: 'case' }[L];
    return Object.assign(d, { form: 'poster', mount });
  }
  function shortDate(it) { if (window.PLACES && PLACES.shortYears) return PLACES.shortYears(it); const m = String(it.years || '').match(/(1[5-9]\d\d|20\d\d)/); return m ? m[1] : ''; }
  function spec(it, d) {
    it = it || {}; d = d || {}; const zh = String(it.zh || d.head || '').replace(/（.*?）/g, '').trim(), date = d.date || shortDate(it);
    const year = d.year || (String(date).match(/(1[5-9]\d\d|20\d\d)/) || [])[1] || (String(it.years || '').match(/(1[5-9]\d\d|20\d\d)/) || [])[1] || '';
    const layout = d.layout || 'street';
    return { key: (it.district || '') + ':' + (it.key || zh), title: d.head || zh, full: zh, en: d.en != null ? d.en : (it.en || ''), date: date || year, year, big: d.big || year || [...zh].slice(0, 2).join(''),
      kicker: d.kicker || '', kicker2: d.kicker2 || '', venue: d.venue || String(it.where || '').split(/[，,;；。]/)[0].slice(0, 22), story: d.story || '', motif: d.motif || (it.marker && it.marker.shape) || 'generic',
      layout, ikey: it.key || '', art: d.art, variant: d.variant || 0, p: pal(d.palette || LAYOUT_PAL[layout] || 'street', d.variant || 0) };
  }
  function drawPoster(g, W, H, layout, s, im) {
    const R = rng(s.key + '|' + layout + '|' + s.variant); g.save(); if (im) artPoster(g, W, H, layout, s, im, R); else (LAY[layout] || LAY.street)(g, W, H, s, R); g.restore(); trk(g, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; grain(g, W, H, Math.round(W * H / 400), '255,255,255', 0.05, R);
  }

  // ── painted artwork (Midjourney, no lettering), saved by the lead into asset/textures/ as it lands ──
  // CJ, 2026-11-22: 「招牌可以用midjourney生成紋理 或海報更換所有的招牌或有字的牌子直到他們有質感跟好看」. A poster is the painted
  // artwork plus lettering, grid, graphic layer and frame set here in code; the art never carries text. art(rel) returns the loaded
  // Image or null: null draws the code-drawn fallback, and the canvas that asked is painted again when the file lands.
  // A directory listing (python http.server) is fetched once per folder, so a missing file costs no 404; without a listing each
  // file is tried directly. DESIGN.reloadArt() checks again (after new art lands). ?arttest=1 maps every request onto the
  // old film posters in asset/textures/posters/, only to check the compositions before the real art exists.
  const ART_BASE = window.DESIGN_ART_BASE || '../asset/textures/', ART = {}, DIRS = {}; let PAINTING = null;
  const ART_TEST = (() => { try { return new URLSearchParams(location.search).get('arttest'); } catch (_) { return null; } })();
  const TEST_IMG = ['case-a.jpg', 'case-b.jpg', 'kids.jpg', 'army.jpg', 'denim.jpg', 'billboard.jpg', 'lailai.jpg', 'notice.jpg'];
  function listing(dir) {   // dir like 'posters/events/'. The parent's listing is read first, so a folder that does not exist yet costs no 404
    if (DIRS[dir]) return DIRS[dir]; const cut = dir.slice(0, -1).lastIndexOf('/'), parent = cut < 0 ? '' : dir.slice(0, cut + 1), name = dir.slice(parent.length);
    const own = () => fetch(ART_BASE + dir, { cache: 'no-store' }).then(r => (r.ok ? r.text().then(t => (/<a href=/i.test(t) ? new Set([...t.matchAll(/href="([^"?#]+)"/g)].map(m => decodeURIComponent(m[1]))) : null)) : new Set())).catch(() => null);
    return (DIRS[dir] = (dir ? listing(parent).then(set => (set && !set.has(name) ? new Set() : own())) : own()));   // null: no listing to read, so try the file itself
  }
  function probe(rel, a) {
    const dir = rel.slice(0, rel.lastIndexOf('/') + 1), file = rel.slice(dir.length);
    listing(dir).then(set => { if (set && !set.has(file)) { a.state = 'missing'; return; } const im = new Image();
      im.onload = () => { a.img = im; a.state = 'ok'; a.subs.forEach(f => { try { f(); } catch (e) { console.warn('[design] repaint failed', e); } }); a.subs.clear(); };
      im.onerror = () => { a.state = 'missing'; }; im.src = ART_BASE + rel; });
  }
  function art(rel) {
    if (!rel) return null; if (ART_TEST) { if (/^signs\//.test(rel)) return null; let h = 0; for (const ch of rel) h = (h * 31 + ch.charCodeAt(0)) | 0; rel = 'posters/' + TEST_IMG[Math.abs(h) % TEST_IMG.length]; }
    let a = ART[rel]; if (!a) { a = ART[rel] = { img: null, state: 'wait', subs: new Set() }; probe(rel, a); }
    if (a.state !== 'ok' && PAINTING) a.subs.add(PAINTING); return a.img;
  }
  function reloadArt() { Object.keys(DIRS).forEach(k => delete DIRS[k]); Object.keys(ART).forEach(k => { const a = ART[k]; if (a.state === 'missing') { a.state = 'wait'; probe(k, a); } });
    return Promise.all(Object.keys(DIRS).map(k => DIRS[k])).then(() => artStatus()); }
  function artStatus() { const o = { ok: [], missing: [], wait: [] }; Object.keys(ART).forEach(k => o[ART[k].state].push(k)); return o; }
  // cover-fit an image into a box, the focus point (fx, fy) kept in view
  function coverArt(g, im, x, y, w, h, fx, fy) { const k = Math.max(w / im.width, h / im.height), cw = w / k, ch = h / k;
    const sx = Math.max(0, Math.min(im.width - cw, im.width * (fx == null ? 0.5 : fx) - cw / 2)), sy = Math.max(0, Math.min(im.height - ch, im.height * (fy == null ? 0.5 : fy) - ch / 2)); g.drawImage(im, sx, sy, cw, ch, x, y, w, h); }
  // grade the painting toward the poster's palette, so a painting and its type read as one print
  function gradeArt(g, x, y, w, h, p, k) { k = k == null ? 1 : k; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.28 * k; const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, p.bg2); gr.addColorStop(1, p.bg); g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.35 * k; g.fillStyle = p.a; g.fillRect(x, y, w, h); g.restore(); }
  // where each layout takes its painting. bleed: the painting fills the top down to `cut`, the layout's own graphic is laid over it with
  // `blend` at `ga`, and the layout's type block (cut and below) is printed solid with a soft edge. inset: the layout is printed whole and
  // the painting fills its picture box [x, y, w, h], the layout's graphic in that box laid over it.
  const ART_AT = {
    award: { cut: 0.5, blend: 'screen', ga: 0.75 }, expo: { cut: 0.61, blend: 'screen', ga: 0.6 }, games: { cut: 0.6, blend: 'multiply', ga: 0.3 }, esports: { cut: 0.6, blend: 'screen', ga: 0.55 },
    concert: { box: [0, 0.17, 1, 0.38], blend: 'multiply', ga: 0.35 }, nightart: { cut: 0.6, blend: 'screen', ga: 0.75 }, lantern: { cut: 0.64, blend: 'screen', ga: 0.4 }, anime: { box: [0, 0.2, 1, 0.42], blend: 'multiply', ga: 0.22 },
    premiere: { cut: 0.66, blend: 'screen', ga: 0.7 }, painted: { cut: 0.86, blend: 'lighten', ga: 0.85 }, street: { cut: 0.6, blend: 'multiply', ga: 0.45 }, countdown: { cut: 0.48, blend: 'screen', ga: 0.75 },
    news: { box: [0.05, 0.26, 0.58, 0.35], blend: 'multiply', ga: 0.3, mono: true }, deco: { cut: 0.73, blend: 'multiply', ga: 0.4 }, market: { cut: 0.5, blend: 'multiply', ga: 0.45 }, memory: { box: [0.06, 0.05, 0.88, 0.51], blend: 'multiply', ga: 0.35, mono: true },
  };
  function artPoster(g, W, H, layout, s, im, R) {
    const A = ART_AT[layout] || ART_AT.street, p = s.p, [lc, l] = off(W, H); (LAY[layout] || LAY.street)(l, W, H, s, R); trk(l, 0);
    if (A.box) {   // inset: the whole print, the painting in its picture box
      g.drawImage(lc, 0, 0); const [x, y, w, h] = [A.box[0] * W, A.box[1] * H, A.box[2] * W, A.box[3] * H];
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); if (A.mono) g.filter = 'grayscale(1) contrast(1.15)'; coverArt(g, im, x, y, w, h, 0.5, 0.45); g.filter = 'none'; gradeArt(g, x, y, w, h, p, A.mono ? 0.6 : 1);
      g.globalCompositeOperation = A.blend; g.globalAlpha = A.ga; g.drawImage(lc, x, y, w, h, x, y, w, h); g.restore();
      g.strokeStyle = p.ink; g.lineWidth = Math.max(1.5, W * 0.004); g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); return;
    }
    const cut = A.cut * H, fe = H * 0.07;   // bleed: the painting on top, the type block below
    g.fillStyle = p.bg; g.fillRect(0, 0, W, H); coverArt(g, im, 0, 0, W, cut + fe, 0.5, 0.42); gradeArt(g, 0, 0, W, cut + fe, p);
    g.save(); g.beginPath(); g.rect(0, 0, W, cut + fe); g.clip(); g.globalCompositeOperation = A.blend; g.globalAlpha = A.ga; g.drawImage(lc, 0, 0); g.restore();
    const [mc, m] = off(W, H); m.drawImage(lc, 0, 0); m.globalCompositeOperation = 'destination-in'; const fade = m.createLinearGradient(0, cut - fe, 0, cut);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)'); m.fillStyle = fade; m.fillRect(0, 0, W, H); g.drawImage(mc, 0, 0);
    // the print's grid: a margin frame with corner ticks and a hairline at the cut, in the palette's second accent
    const mg = W * 0.035, tk = W * 0.035; g.save(); g.strokeStyle = p.b; g.globalAlpha = 0.85; g.lineWidth = Math.max(1, W * 0.0025); g.strokeRect(mg, mg, W - 2 * mg, cut - mg - fe * 0.5);
    [[mg, mg, 1, 1], [W - mg, mg, -1, 1]].forEach(([x, y, sx, sy]) => { g.beginPath(); g.moveTo(x - sx * tk, y); g.lineTo(x + sx * tk * 2, y); g.moveTo(x, y - sy * tk); g.lineTo(x, y + sy * tk * 2); g.stroke(); }); g.restore();
  }
  // a sign's material for the real places' own signs (kind A users): the tileable painting when it has landed, a code-drawn one until then,
  // then the caller's lettering on top. material: lacquer redlacquer teak tin enamel lightbox neonback cloth stone brass paper weathered
  const MAT_FALL = { lacquer: ['#141012', '#2a2024', 0.9], redlacquer: ['#7a1410', '#a3221a', 0.8], teak: ['#6a4426', '#8a5a32', 0.5], tin: ['#2a5a6a', '#3a7a8a', 0.6], enamel: ['#1a3a7a', '#24499a', 0.9],
    lightbox: ['#f4f0e4', '#ffffff', 0.3], neonback: ['#0c0c14', '#1a1a26', 0.6], cloth: ['#a3141a', '#c21e22', 0.4], stone: ['#8a857a', '#a8a294', 0.4], brass: ['#a8823a', '#e0b860', 0.9], paper: ['#e8e0cc', '#f4eedc', 0.3], weathered: ['#6a7a6a', '#8a9a84', 0.5] };
  function drawMaterial(g, W, H, material, R) {
    const im = art('signs/' + material + '.jpg'), f = MAT_FALL[material] || MAT_FALL.weathered;
    if (im) { const k = Math.max(H / im.height, 0.25), tw = im.width * k, th = im.height * k; for (let y = 0; y < H; y += th) for (let x = 0; x < W; x += tw) g.drawImage(im, x, y, tw, th); return true; }
    const gr = g.createLinearGradient(0, 0, W * 0.3, H); gr.addColorStop(0, f[1]); gr.addColorStop(0.55, f[0]); gr.addColorStop(1, f[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (/teak|weathered|lacquer|redlacquer/.test(material)) for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(0,0,0,${R() * 0.18})`; g.lineWidth = 1 + R() * 2; const y = R() * H; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (R() - 0.5) * 8, W * 0.7, y + (R() - 0.5) * 8, W, y + (R() - 0.5) * 6); g.stroke(); }
    if (/cloth/.test(material)) for (let x = 0; x < W; x += 3) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x, 0, 1, H); }
    if (/stone|paper|weathered|tin/.test(material)) grain(g, W, H, Math.round(W * H / 60), material === 'stone' ? '30,30,30' : '255,255,255', 0.12, R);
    const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, `rgba(255,255,255,${0.12 * f[2]})`); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, `rgba(0,0,0,${0.18 * f[2]})`); g.fillStyle = sh; g.fillRect(0, 0, W, H);
    return false;
  }

  // ── textures and materials, made once per engine and shared ─────────────────────────────────
  const caches = new WeakMap(), REPAINT = []; let fontsReady = false;
  function C(E) {
    let c = caches.get(E); if (c) return c; const T = E.T;
    c = { T, geo: {}, mat: {}, tex: {}, box: new T.BoxGeometry(1, 1, 1), sph: new T.SphereGeometry(1, 16, 12), plane: new T.PlaneGeometry(1, 1),
      cyl(rt, rb, h, seg, open) { const k = [rt, rb, h, seg, open].join(); return this.geo[k] || (this.geo[k] = new T.CylinderGeometry(rt, rb, h, seg || 16, 1, !!open)); },
      tor(r, t, arc, seg) { const k = ['t', r, t, arc, seg].join(); return this.geo[k] || (this.geo[k] = new T.TorusGeometry(r, t, 8, seg || 40, arc || 6.2832)); },
      std(hex, rough, metal, emi, ei, extra) { const k = ['s', hex, rough, metal, emi, ei, JSON.stringify(extra || 0)].join(); return this.mat[k] || (this.mat[k] = new T.MeshStandardMaterial(Object.assign({ color: E.col(hex), roughness: rough == null ? 0.7 : rough, metalness: metal || 0, emissive: emi ? E.col(emi) : new T.Color(0), emissiveIntensity: ei == null ? 1 : ei }, extra || {}))); },
      glow(hex, k) { const key = ['g', hex, k].join(); if (this.mat[key]) return this.mat[key]; return (this.mat[key] = new T.MeshBasicMaterial({ color: new T.Color(hex).convertSRGBToLinear().multiplyScalar(k || 2) })); },
      face(tex, glow, double) { const k = ['f', tex.uuid, glow, double ? 1 : 0].join(); return this.mat[k] || (this.mat[k] = new T.MeshStandardMaterial({ map: tex, roughness: 0.55, emissiveMap: tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow == null ? 0.25 : glow, side: double ? T.DoubleSide : T.FrontSide })); },
      light(hex, op) { const k = ['l', hex, op].join(); return this.mat[k] || (this.mat[k] = new T.MeshBasicMaterial({ color: E.col(hex), transparent: true, opacity: op || 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); },
    };
    c.K = { bronze: E.triMat({ color: '#a8743a', tex: E.TEX.metal, scale: 3, rough: 0.38, metal: 0.6, emissive: '#3a2208', eI: 0.4 }), gold: E.triMat({ color: '#e0b24a', tex: E.TEX.metal, scale: 3, rough: 0.26, metal: 0.65, emissive: '#5a3a08', eI: 0.6 }),
      silver: E.triMat({ color: '#d8dce0', tex: E.TEX.metal, scale: 3, rough: 0.22, metal: 0.8 }), granite: E.triMat({ color: '#4a4744', tex: E.TEX.concrete, scale: 1.6, rough: 0.4 }), stone: E.triMat({ color: '#c2bbae', tex: E.TEX.concrete, scale: 1.2, rough: 0.7 }),
      alu: c.std('#b9bec4', 0.3, 0.8), dark: c.std('#1c1a1c', 0.5, 0.3), black: c.std('#0c0c0e', 0.4, 0.2), wood: E.triMat({ color: '#8a6a48', tex: E.TEX.bark, scale: 2, rough: 0.8 }), cream: c.std('#efe6d2', 0.85),
      carpet: c.std('#8f1418', 0.95), paper: c.std('#ffd9a0', 0.9, 0, '#ff9a3a', 1.1, { transparent: true, opacity: 0.92 }), warm: c.glow('#ffd28a', 3.2), white: c.glow('#ffffff', 2.4), rope: c.std('#a3142b', 0.8) };
    caches.set(E, c); return c;
  }
  function canvasTex(E, key, w, h, draw) {
    const c = C(E); if (c.tex[key]) return c.tex[key]; const T = E.T, cv = document.createElement('canvas'); cv.width = Math.round(w); cv.height = Math.round(h); const g = cv.getContext('2d');
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; const paint = () => { const was = PAINTING; PAINTING = paint; try { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); draw(g, cv.width, cv.height); } finally { PAINTING = was; } t.needsUpdate = true; };
    paint(); if (!fontsReady) REPAINT.push(paint); return (c.tex[key] = t);
  }
  if (document.fonts && document.fonts.load) Promise.all(['Weibei TC', 'Kaiti TC', 'Xingkai TC', 'Songti TC'].map(f => document.fonts.load('40px "' + f + '"').catch(() => null))).then(() => { fontsReady = true; REPAINT.splice(0).forEach(f => { try { f(); } catch (_) {} }); });
  const posterTexture = (E, it, d, px, aspect) => { const s = d && d.p ? d : spec(it, d), lay = (d && d.layout) || s.layout; px = px || 640; aspect = aspect || 1.414; return canvasTex(E, ['P', lay, s.key, s.variant, px, aspect, s.title].join('|'), px, px * aspect, (g, W, H) => drawPoster(g, W, H, lay, s, artFor(s))); };
  // the painting a poster takes: d.art (a path under asset/textures/, or false for none), else the event's own posters/events/<key>.jpg
  const artFor = s => (s.art === false ? null : art(s.art || (s.ikey ? 'posters/events/' + s.ikey + '.jpg' : null)));
  const signTexture = (E, material, w, h, letter, key) => canvasTex(E, ['S', material, w, h, key || ''].join('|'), w, h, (g, W, H) => { drawMaterial(g, W, H, material, rng(material + (key || ''))); if (letter) { g.save(); letter(g, W, H); g.restore(); trk(g, 0); } });
  const wideTexture = (E, it, d, px, aspect, mode) => { const s = d && d.p ? d : spec(it, d); px = px || 1024; aspect = aspect || 0.2; return canvasTex(E, ['W', mode, s.key, px, aspect, s.title].join('|'), px, px * aspect, (g, W, H) => { wideFace(g, W, H, s, mode, rng(s.key + mode)); trk(g, 0); }); };
  const headerTexture = (E, topic, info, w, h) => canvasTex(E, ['H', topic, info && info.zh, w, h].join('|'), 1024, 1024 * h / w, (g, W, H) => { drawHeader(g, W, H, topic, info || {}); trk(g, 0); });

  // ── the 3D maker ────────────────────────────────────────────────────────────────────────────
  function mk(E, name) {
    const c = C(E), T = E.T, g = new T.Group(); g.name = name;
    const put = (m, x, y, z, cast) => { m.position.set(x || 0, y || 0, z || 0); m.castShadow = cast !== false; m.receiveShadow = true; g.add(m); return m; };
    return { g, c, T, K: c.K,
      box: (w, h, d, mat, x, y, z, cast) => { const m = put(new T.Mesh(c.box, mat), x, y, z, cast); m.scale.set(w, h, d); return m; },
      cyl: (rt, rb, h, mat, x, y, z, seg, cast) => put(new T.Mesh(c.cyl(rt, rb, h, seg), mat), x, y, z, cast),
      sph: (r, mat, x, y, z, cast) => { const m = put(new T.Mesh(c.sph, mat), x, y, z, cast); m.scale.setScalar(r); return m; },
      tor: (r, t, mat, x, y, z, arc, seg) => put(new T.Mesh(c.tor(r, t, arc, seg), mat), x, y, z),
      pl: (w, h, mat, x, y, z, ry) => { const m = put(new T.Mesh(c.plane, mat), x, y, z, false); m.scale.set(w, h, 1); if (ry) m.rotation.y = ry; return m; },
      rod: (a, b, r, mat, seg) => { const va = new T.Vector3(...a), vb = new T.Vector3(...b), m = new T.Mesh(c.cyl(r, r, 1, seg || 6), mat); m.scale.y = Math.max(0.001, va.distanceTo(vb)); m.position.copy(va).lerp(vb, 0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vb.clone().sub(va).normalize()); m.castShadow = true; g.add(m); return m; },
      add: (o, x, y, z) => { o.position.set(x || 0, y || 0, z || 0); g.add(o); return o; },
      done(foot, height, plaqueAt, feet) { g.userData.foot = foot; g.userData.height = height; if (feet) g.userData.feet = feet; if (plaqueAt) g.userData.plaqueAt = plaqueAt; return g; } };
  }
  const LIGHT = { games: 1, concert: 1, street: 1, news: 1, deco: 1, market: 1, memory: 1, anime: 1 }, gl = (s, k) => (LIGHT[s.layout] ? k * 0.3 : k);
  // a poster both ways round: front looks +Z, the back -Z (each reads the right way from its side)
  function twoFace(B, tex, w, h, x, y, z, gap, glow, backTex) { B.pl(w, h, B.c.face(tex, glow), x, y, z + gap); B.pl(w, h, B.c.face(backTex || tex, glow), x, y, z - gap, Math.PI); }
  function bulbs(E, B, pts, r, mat) { const T = E.T, m = new T.InstancedMesh(B.c.sph, mat, pts.length), o = new T.Object3D(); pts.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.scale.setScalar(r); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = false; B.g.add(m); return m; }
  function catenary(a, b, sag, n) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]); } return pts; }

  // ── POSTER mounts ───────────────────────────────────────────────────────────────────────────
  const MOUNTS = {
    standee(E, B, s, d) { const T = E.T, t = posterTexture(E, null, s, 640), tb = posterTexture(E, null, Object.assign({}, s, { variant: s.variant + 1, p: pal(d.palette || LAYOUT_PAL[s.layout], s.variant + 1) }), 512);   // an A-frame: two leaves hinged at the top, the back a second colourway
      [[1, t, 0], [-1, tb, Math.PI]].forEach(([k, tex, ry]) => { const leaf = new T.Group(); leaf.position.set(0, 2.0, 0); leaf.rotation.x = -k * 0.15; B.g.add(leaf);
        const fr = new T.Mesh(B.c.box, B.K.black); fr.scale.set(1.32, 1.9, 0.04); fr.position.set(0, -0.98, k * 0.02); fr.castShadow = true; leaf.add(fr);
        const f = new T.Mesh(B.c.plane, B.c.face(tex, gl(s, 0.3))); f.scale.set(1.22, 1.73, 1); f.position.set(0, -0.98, k * 0.042); f.rotation.y = ry; leaf.add(f); });
      B.cyl(0.025, 0.025, 1.36, B.K.alu, 0, 2.0, 0, 8).rotation.z = Math.PI / 2; [-0.6, 0.6].forEach(x => { B.rod([x, 0.75, 0.2], [x, 0.75, -0.2], 0.006, B.K.alu); B.box(0.3, 0.1, 0.18, B.c.std('#2a2a2a', 0.9), x, 0.05, 0.3); B.box(0.3, 0.1, 0.18, B.c.std('#2a2a2a', 0.9), x, 0.05, -0.3); });
      B.cyl(0.06, 0.08, 0.1, B.K.dark, 0.85, 0.05, 0.75, 10); const sp = B.cyl(0.07, 0.05, 0.14, B.K.dark, 0.85, 0.16, 0.75, 10); sp.rotation.x = -0.9; sp.rotation.z = 0.5; B.sph(0.045, B.K.warm, 0.8, 0.2, 0.69, false);
      return B.done([-0.75, 0.75, -0.62, 0.62], 2.2, [0.78, 1.5, 0.45]); },
    case(E, B, s, d) { const t = posterTexture(E, null, s, 640); B.box(1.56, 0.34, 0.62, B.K.granite, 0, 0.17, 0); B.box(1.62, 0.04, 0.68, B.K.alu, 0, 0.36, 0);   // a lit poster case on a plinth: aluminium frame, glowing faces, a light bar under the cap
      [[1.42, 0.07, 0, 2.47], [1.42, 0.07, 0, 0.42], [0.07, 2.12, -0.675, 1.445], [0.07, 2.12, 0.675, 1.445]].forEach(([w, h, x, y]) => B.box(w, h, 0.18, B.K.alu, x, y, 0));
      B.box(1.28, 1.98, 0.1, B.c.std('#fff6e0', 0.6, 0, '#fff0d0', 0.9), 0, 1.445, 0); twoFace(B, t, 1.24, 1.88, 0, 1.445, 0, 0.065, gl(s, 0.62));
      B.box(1.5, 0.1, 0.26, B.K.black, 0, 2.55, 0); B.box(1.3, 0.025, 0.04, B.K.warm, 0, 2.49, 0.08, false); B.box(1.3, 0.025, 0.04, B.K.warm, 0, 2.49, -0.08, false);
      [-0.5, 0.5].forEach(x => B.box(0.14, 0.04, 0.06, B.K.warm, x, 0.38, 0.33, false));
      if (d.carpet) { B.box(1.3, 0.012, 3.2, B.K.carpet, 0, 0.006, 1.95, false); [-0.78, 0.78].forEach(x => { [0.9, 1.9, 2.9].forEach(z => { B.cyl(0.025, 0.025, 0.9, B.K.gold, x, 0.45, z, 8); B.cyl(0.11, 0.12, 0.03, B.K.gold, x, 0.015, z, 14); B.sph(0.045, B.K.gold, x, 0.92, z); }); B.rod([x, 0.86, 0.9], [x, 0.72, 1.4], 0.016, B.K.rope); B.rod([x, 0.72, 1.4], [x, 0.86, 1.9], 0.016, B.K.rope); B.rod([x, 0.86, 1.9], [x, 0.72, 2.4], 0.016, B.K.rope); B.rod([x, 0.72, 2.4], [x, 0.86, 2.9], 0.016, B.K.rope); }); }
      return B.done([-0.8, 0.8, -0.34, 0.34], 2.65, [0.84, 1.1, 0.32]); },
    column(E, B, s, d) { const T = E.T, lays = d.layouts || [s.layout], key = ['C', s.key, lays.join()].join('|');   // an advertising column pasted with layers of posters, peeled and torn
      const atlas = canvasTex(E, key, 1536, 1024, (g, W, H) => { const R = rng(key); g.fillStyle = '#d9d0bc'; g.fillRect(0, 0, W, H); grain(g, W, H, 3000, '90,80,60', 0.12, R);
        for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) { const pw = 384, ph = 543, lay = lays[(i + row * 2) % lays.length], ss = Object.assign({}, s, { layout: lay, variant: i + row, p: pal(lay === s.layout ? (d.palette || LAYOUT_PAL[lay]) : LAYOUT_PAL[lay], i + row) });
          const [pc, pg] = off(pw, ph); drawPoster(pg, pw, ph, lay, ss); pg.globalCompositeOperation = 'destination-out'; pg.beginPath(); const corner = (i + row) % 4; const cx = corner % 2 ? pw : 0, cy = corner > 1 ? ph : 0; pg.moveTo(cx, cy);
          for (let k = 0; k <= 8; k++) pg.lineTo(cx + (corner % 2 ? -1 : 1) * (k / 8) * pw * 0.35 + (R() - 0.5) * 12, cy + (corner > 1 ? -1 : 1) * (1 - k / 8) * ph * 0.25 + (R() - 0.5) * 12); pg.closePath(); pg.fill();
          g.save(); g.translate(i * pw + pw / 2 + (row ? pw / 2 : 0), row ? H - ph / 2 + 30 : ph / 2 - 20); g.rotate((R() - 0.5) * 0.08); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6; g.drawImage(pc, -pw / 2, -ph / 2); g.restore(); if (row && i === 3) { g.save(); g.translate(-pw / 2, H - ph / 2 + 30); g.drawImage(pc, -pw / 2, -ph / 2); g.restore(); } } });
      const col = new T.Mesh(B.c.cyl(0.56, 0.56, 2.4, 40, true), B.c.face(atlas, 0.07)); col.position.y = 1.45; col.rotation.y = -Math.PI / 4; col.castShadow = col.receiveShadow = true; B.g.add(col);
      B.cyl(0.54, 0.54, 2.38, B.K.dark, 0, 1.45, 0, 24); B.cyl(0.64, 0.68, 0.25, B.K.dark, 0, 0.125, 0, 32); B.cyl(0.66, 0.6, 0.14, B.K.dark, 0, 2.72, 0, 32); B.cyl(0.08, 0.6, 0.36, B.c.std('#2a4a3a', 0.5, 0.4), 0, 2.97, 0, 32); B.sph(0.09, B.K.gold, 0, 3.2, 0);
      B.tor(0.62, 0.02, B.K.warm, 0, 2.64, 0).rotation.x = Math.PI / 2; return B.done([-0.68, 0.68, -0.68, 0.68], 3.3, [0, 2.9, 0.7]); },
    banner(E, B, s, d) { const n = Math.max(3, Math.min(5, [...String(s.big)].length)), gap = 1.3, x0 = -(n - 1) * gap / 2, feet = [];   // a row of street poles, one vertical banner each; the big word is spelled across them
      for (let i = 0; i < n; i++) { const x = x0 + i * gap, t = canvasTex(E, ['B', s.key, s.layout, i, n].join('|'), 320, 1024, (g, W, H) => { bannerFace(g, W, H, s, i, n, rng(s.key + i)); trk(g, 0); });
        B.cyl(0.05, 0.06, 4.4, B.K.alu, x, 2.2, 0, 10); B.cyl(0.16, 0.2, 0.18, B.K.granite, x, 0.09, 0, 14); B.rod([x, 4.0, 0], [x + 0.5, 4.0, 0.0], 0.02, B.K.alu); B.rod([x, 1.7, 0], [x + 0.5, 1.7, 0.0], 0.02, B.K.alu);
        twoFace(B, t, 0.62, 2.25, x + 0.32, 2.85, 0.0, 0.012, 0.3); B.sph(0.07, B.K.warm, x, 4.45, 0, false); feet.push([x - 0.2, x + 0.2, -0.2, 0.2]); }
      return B.done([x0 - 0.2, -x0 + 0.8, -0.2, 0.2], 4.6, [x0 + 0.05, 1.3, 0.08], feet); },
    wall(E, B, s, d) { const lays = d.layouts || [s.layout, s.layout, s.layout]; B.box(3.9, 2.45, 0.3, B.K.stone, 0, 1.225, 0); B.box(4.0, 0.1, 0.4, B.K.granite, 0, 2.5, 0); B.box(4.1, 0.14, 0.5, B.K.granite, 0, 0.07, 0);   // a wall of pasted posters, overlapping, a few torn
      const R = rng(s.key + 'wall'), spots = [[-1.45, 1.45], [-0.55, 1.6], [0.4, 1.42], [1.38, 1.58], [-1.0, 0.68], [0.0, 0.62], [1.0, 0.7], [-1.62, 0.6], [1.66, 0.62]];
      spots.forEach(([x, y], i) => { const lay = lays[i % lays.length], ss = Object.assign({}, s, { layout: lay, variant: i, p: pal(lay === s.layout ? (d.palette || LAYOUT_PAL[lay]) : LAYOUT_PAL[lay], i) }), w = i < 4 ? 0.86 : 0.7, t = posterTexture(E, null, ss, 384);
        const m = B.pl(w, w * 1.414, B.c.face(t, gl(ss, 0.18)), x, y, 0.151 + i * 0.003); m.rotation.z = (R() - 0.5) * 0.08; });
      for (let i = 0; i < 6; i++) { const m = B.pl(0.1 + R() * 0.2, 0.05 + R() * 0.15, B.c.std(['#f2e8d5', '#ffd60a', '#ff7f11'][i % 3], 0.9), -1.8 + R() * 3.6, 0.3 + R() * 2, 0.185); m.rotation.z = R() * 3; }
      [-1.2, 0, 1.2].forEach(x => { B.rod([x, 2.5, 0.2], [x, 2.6, 0.55], 0.015, B.K.dark); const h = B.cyl(0.06, 0.1, 0.12, B.K.dark, x, 2.58, 0.55, 10); h.rotation.x = 0.6; B.sph(0.05, B.K.warm, x, 2.53, 0.58, false); });
      return B.done([-2.05, 2.05, -0.26, 0.26], 2.7, [1.95, 1.2, 0.24]); },
    billboard(E, B, s, d) { const t = posterTexture(E, null, Object.assign({}, s, { layout: 'painted' }), 1024, 0.55);   // a scaffold billboard, hand-painted, with two floodlights on arms
      [-1.8, 0, 1.8].forEach(x => { [-0.25, 0.25].forEach(z => B.cyl(0.03, 0.03, 3.5, B.K.alu, x, 1.75, z - 0.2, 6)); for (let k = 0; k < 5; k++) B.rod([x, 0.2 + k * 0.6, -0.45], [x, 0.8 + k * 0.6, 0.05], 0.015, B.K.alu); B.box(0.3, 0.04, 0.7, B.K.alu, x, 0.02, -0.2); });
      [1.2, 3.3].forEach(y => { B.rod([-1.9, y, -0.45], [1.9, y, -0.45], 0.02, B.K.alu); B.rod([-1.9, y, 0.05], [1.9, y, 0.05], 0.02, B.K.alu); }); B.box(3.9, 0.06, 0.6, B.K.wood, 0, 1.25, -0.2);
      B.box(4.0, 2.24, 0.08, B.K.dark, 0, 2.42, 0.1); B.pl(3.86, 2.12, B.c.face(t, 0.3), 0, 2.42, 0.145);
      [-1.3, 1.3].forEach(x => { B.rod([x, 3.54, 0.1], [x, 3.8, 0.8], 0.02, B.K.dark); const l = B.box(0.3, 0.12, 0.18, B.K.dark, x, 3.8, 0.85); l.rotation.x = 0.7; B.box(0.26, 0.02, 0.1, B.K.white, x, 3.74, 0.9, false);
        const cone = new E.T.Mesh(B.c.cyl(0.08, 1.0, 1.6, 20, true), B.c.light('#ffe6b0', 0.08)); cone.position.set(x, 3.15, 0.55); cone.rotation.x = -0.45; B.g.add(cone); });
      return B.done([-2.0, 2.0, -0.6, 0.25], 3.9, [1.95, 1.0, 0.25]); },
  };

  // ── STATUES ─────────────────────────────────────────────────────────────────────────────────
  const FIG = {   // each returns its height. No faces, no likeness: anonymous figures and objects that tell the story
    figure(E, B, x, y, z, mat, pose, k) { k = k || 1; const P = { run: [0.35, -0.3], stand: [0, 0], wave: [0, 1] }[pose] || [0, 0]; const g = B.g;
      B.cyl(0.07 * k, 0.055 * k, 0.62 * k, mat, x - 0.09 * k, y + 0.31 * k, z + P[0] * 0.1, 8).rotation.x = P[0]; B.cyl(0.07 * k, 0.055 * k, 0.62 * k, mat, x + 0.09 * k, y + 0.31 * k, z - P[0] * 0.1, 8).rotation.x = -P[0];
      B.cyl(0.14 * k, 0.17 * k, 0.55 * k, mat, x, y + 0.9 * k, z, 10); B.sph(0.12 * k, mat, x, y + 1.3 * k, z); B.rod([x - 0.15 * k, y + 1.12 * k, z], [x - 0.28 * k, y + (P[1] ? 1.5 : 0.72) * k, z + P[0] * 0.3], 0.04 * k, mat); B.rod([x + 0.15 * k, y + 1.12 * k, z], [x + 0.28 * k, y + 0.72 * k, z - P[0] * 0.3], 0.04 * k, mat); return 1.45 * k; },
    record(E, B, y) { const disc = B.cyl(0.62, 0.62, 0.05, B.K.black, 0, y + 0.72, 0, 48); disc.rotation.x = Math.PI / 2; [0.3, 0.4, 0.5, 0.58].forEach(r => B.tor(r, 0.006, B.K.dark, 0, y + 0.72, 0.03));
      const lab = B.cyl(0.18, 0.18, 0.06, B.K.gold, 0, y + 0.72, 0.005, 32); lab.rotation.x = Math.PI / 2; B.box(0.5, 0.12, 0.4, B.K.gold, 0, y + 0.06, 0); B.cyl(0.04, 0.04, 1.2, B.K.gold, 0.55, y + 1.1, 0.12, 10); B.rod([0.55, y + 1.7, 0.12], [0.85, y + 1.55, 0.12], 0.04, B.K.gold); B.sph(0.12, B.K.gold, 0.44, y + 0.5, 0.12).scale.set(0.15, 0.1, 0.1); const h = B.sph(0.12, B.K.gold, 0.47, y + 0.52, 0.12); h.scale.set(0.15, 0.11, 0.1); return 1.8; },
    rings(E, B, y) { [[0, 0.5, 0.2, B.K.gold], [0.15, 0.95, -0.3, B.K.silver], [-0.1, 1.4, 0.45, B.K.gold], [0.1, 1.85, -0.15, B.K.silver], [0, 2.25, 0.3, B.K.gold]].forEach(([x, h, a, m]) => { const r = B.tor(0.32, 0.05, m, x, y + h, 0); r.rotation.set(a, 0.4, a * 0.5); }); B.cyl(0.03, 0.03, 2.2, B.K.alu, 0, y + 1.1, 0, 8); return 2.5; },
    heel(E, B, y) { const sq = B.c.std('#d4b4ff', 0.2, 0.9, '#5a2a8a', 0.6); B.box(1.1, 0.1, 0.36, sq, -0.15, y + 0.06, 0).rotation.z = 0.05; B.box(0.7, 0.1, 0.34, sq, 0.32, y + 0.36, 0).rotation.z = 0.75; B.cyl(0.04, 0.07, 0.62, sq, 0.6, y + 0.31, 0, 10);
      B.box(0.36, 0.3, 0.38, sq, -0.5, y + 0.22, 0); const C = ['#ff4fa3', '#ffd23f', '#3ddcff', '#ff7a59', '#9be05a', '#7a3a9a']; for (let i = 0; i < 26; i++) { const a = i / 25 * Math.PI * 1.6; B.sph(0.07, B.c.std(C[i % 6], 0.9), -0.4 + Math.cos(a) * 0.5, y + 0.7 + Math.sin(a) * 0.35 + i * 0.01, Math.sin(a * 2) * 0.2); } return 1.2; },
    thread(E, B, y) { const T = E.T, m = B.K.bronze; FIG.figure(E, B, -0.4, y, 0, m, 'stand', 0.85); FIG.figure(E, B, 0.4, y, 0, m, 'stand', 0.78); const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new T.Vector3(-0.62 + t * 1.24 + Math.sin(t * 9) * 0.08, y + 0.75 + Math.sin(t * Math.PI) * 0.9, Math.cos(t * 9) * 0.25)); }
      const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.014, 6), B.c.glow('#ff2a3a', 2.6)); B.g.add(tube); return 1.8; },
    runner(E, B, y) { for (let i = 0; i < 6; i++) B.box(1.1, 0.12, 0.22, B.K.granite, 0, y + 0.06 + i * 0.12, 0.45 - i * 0.18); const k = 0.8, m = B.K.bronze; FIG.figure(E, B, 0, y + 0.5, -0.1, m, 'run', k); return 1.7; },
    ball(E, B, y) { const m = B.K.bronze; B.cyl(0.05, 0.06, 2.2, m, -0.55, y + 1.1, -0.2, 10); B.rod([-0.55, y + 2.1, -0.2], [-0.2, y + 2.15, -0.2], 0.04, m); B.box(0.9, 0.6, 0.05, B.c.std('#e8eef2', 0.3, 0, '#ffffff', 0.15, { transparent: true, opacity: 0.6 }), 0.05, y + 2.25, -0.2);
      B.tor(0.2, 0.018, B.c.std('#e05a1a', 0.4, 0.6), 0.05, y + 1.98, 0.02).rotation.x = Math.PI / 2; const ball = B.sph(0.34, B.c.std('#d9661e', 0.7), 0.15, y + 0.34, 0.15); [0, Math.PI / 2].forEach(a => { const t = B.tor(0.345, 0.012, B.K.black, 0.15, y + 0.34, 0.15); t.rotation.y = a; }); return 2.6; },
    panda(E, B, y) { const W = B.c.std('#f2f0ea', 0.8), K = B.c.std('#1a1a1a', 0.8); B.sph(0.55, W, 0, y + 0.55, 0).scale.set(0.55, 0.5, 0.5); B.sph(0.4, W, 0, y + 1.2, 0.05); [-1, 1].forEach(k => { B.sph(0.12, K, k * 0.28, y + 1.52, 0.05); B.sph(0.09, K, k * 0.14, y + 1.24, 0.37).scale.set(0.09, 0.12, 0.05); B.sph(0.16, K, k * 0.45, y + 0.72, 0.2); B.sph(0.18, K, k * 0.3, y + 0.16, 0.35); }); B.sph(0.05, K, 0, y + 1.12, 0.43); return 1.7; },
    mic(E, B, y) { const m = B.K.silver; B.cyl(0.03, 0.03, 1.6, m, 0, y + 0.8, 0, 10); B.cyl(0.3, 0.34, 0.05, m, 0, y + 0.03, 0, 24); B.cyl(0.11, 0.07, 0.4, B.K.black, 0, y + 1.8, 0, 16); B.sph(0.17, B.c.std('#b8bcc2', 0.4, 0.9), 0, y + 2.08, 0); return 2.3; },
  };
  function statue(E, it, d, s) {
    const B = mk(E, 'design-statue'), K = B.K, plinth = d.plinth || 'block'; let top = 0, plateAt = null, foot;
    if (plinth === 'podium') { [[-0.68, 0.48, '2'], [0, 0.78, '1'], [0.68, 0.36, '3']].forEach(([x, h, n]) => { B.box(0.66, h, 0.8, K.granite, x, h / 2, 0); B.box(0.7, 0.04, 0.84, K.alu, x, h, 0); const t = canvasTex(E, 'num' + n, 128, 128, (g, W, H) => { g.fillStyle = '#4a4744'; g.fillRect(0, 0, W, H); tx(g, n, W / 2, H / 2, H * 0.8, W, BLACK, 900, '#e0b24a'); }); B.pl(0.32, 0.32, B.c.face(t, 0.3), x, h - 0.22, 0.402); });
      top = 0.8; plateAt = [0, 0.342, 0.962, 0.92, 0.5, -0.35]; foot = [-1.05, 1.05, -0.45, 1.1];
      B.box(1.0, 0.56, 0.12, K.granite, 0, 0.32, 0.9).rotation.x = -0.35; }
    else if (plinth === 'drum') { B.cyl(0.78, 0.82, 0.14, K.stone, 0, 0.07, 0, 40); B.cyl(0.6, 0.62, 0.9, K.granite, 0, 0.59, 0, 40); B.cyl(0.7, 0.66, 0.1, K.stone, 0, 1.09, 0, 40); B.tor(0.62, 0.02, K.gold, 0, 0.98, 0).rotation.x = Math.PI / 2; top = 1.14;
      B.box(0.96, 0.08, 0.5, K.granite, 0, 0.55, 0.98); B.box(0.92, 0.55, 0.1, K.granite, 0, 0.55, 1.05).rotation.x = -0.4; plateAt = [0, 0.575, 1.106, 0.86, 0.48, -0.4]; foot = [-0.85, 0.85, -0.85, 1.3]; }
    else { B.box(1.5, 0.16, 1.5, K.stone, 0, 0.08, 0); B.box(1.24, 0.12, 1.24, K.stone, 0, 0.22, 0); B.box(1.0, 0.92, 1.0, K.granite, 0, 0.74, 0); B.box(1.14, 0.08, 1.14, K.stone, 0, 1.24, 0); B.box(1.06, 0.05, 1.06, K.granite, 0, 1.305, 0); top = 1.33; plateAt = [0, 0.76, 0.505, 0.86, 0.52, 0]; foot = [-0.8, 0.8, -0.8, 0.8]; }
    const pt = canvasTex(E, ['cast', s.key].join('|'), 768, 440, (g, W, H) => { castPlate(g, W, H, s, rng(s.key + 'cast')); trk(g, 0); });
    const pm = B.pl(plateAt[3], plateAt[4], B.c.face(pt, 0.08), plateAt[0], plateAt[1], plateAt[2]); pm.rotation.x = plateAt[5]; const bk = B.box(plateAt[3] + 0.04, plateAt[4] + 0.04, 0.02, K.bronze, plateAt[0], plateAt[1] + Math.sin(plateAt[5]) * 0.012, plateAt[2] - Math.cos(plateAt[5]) * 0.012); bk.rotation.x = plateAt[5];
    let fh = 1.4; const fm = d.motif || s.motif;
    if (FIG[fm] && fm !== 'figure') fh = FIG[fm](E, B, top); else if (window.PLACES && PLACES.figure) { const f = PLACES.figure(E, fm); f.position.y = top; f.scale.setScalar(1.15); B.g.add(f); fh = 1.6; } else fh = FIG.figure(E, B, 0, top, 0, K.bronze, 'wave', 1);
    const rt = canvasTex(E, ['ring', s.key].join('|'), 512, 512, (g, W, H) => ringFace(g, W, H, s)); const ring = B.pl(1.0, 1.0, B.c.std('#ffffff', 0.5, 0.3, null, 1, { map: rt, transparent: true, alphaTest: 0.3 }), 0, 0.012, foot[3] + 0.55); ring.rotation.x = -Math.PI / 2;
    [[-1, 1], [1, 1]].forEach(([a]) => { B.box(0.12, 0.05, 0.08, K.warm, a * (foot[1] - 0.05), 0.03, foot[3] - 0.05, false); });
    return B.done(foot, top + fh, [foot[1] + 0.1, 0.9, foot[3] - 0.2]);
  }

  // ── INSTALLATIONS ───────────────────────────────────────────────────────────────────────────
  const INSTALL = {
    rings(E, B, s) { const C = ['#ff7a59', '#e0408a', '#7a3ad8', '#3a6ad8', '#9be7ff'];   // a walk-through tunnel of cut rings facing the street, dusk to dawn, each ring turned a little more
      for (let i = 0; i < 5; i++) { const z = -1.2 + i * 0.6, grp = new E.T.Group(); grp.position.set(0, 1.75, z); grp.rotation.z = i * 0.35; B.g.add(grp);
        for (let k = 0; k < 6; k++) { const m = new E.T.Mesh(B.c.tor(1.6, 0.045, 0.78, 16), B.c.glow(C[i], 1.8)); m.rotation.z = k * Math.PI / 3; grp.add(m); } B.box(0.12, 0.08, 0.12, B.K.dark, 1.6, 0.04, z); B.box(0.12, 0.08, 0.12, B.K.dark, -1.6, 0.04, z); }
      const t = posterTexture(E, null, s, 512); B.box(0.9, 1.4, 0.12, B.K.black, -2.5, 0.95, 1.2); twoFace(B, t, 0.82, 1.18, -2.5, 1.0, 1.2, 0.065, 0.5); B.box(0.6, 0.25, 0.3, B.K.granite, -2.5, 0.125, 1.2);
      return B.done([-2.95, 1.75, -1.35, 1.4], 3.5, [-2.05, 1.0, 1.3], [[-1.7, -1.5, -1.3, 1.3], [1.5, 1.7, -1.3, 1.3], [-2.95, -2.05, 1.0, 1.4]]); },
    arch(E, B, s) { const C = ['#e2342c', '#f08a24', '#f4d23c', '#3a9a4a', '#2a6ac0', '#7a3a9a'];   // a rainbow arch to walk through, its colours carried on as stripes in the ground
      C.forEach((c, i) => { const r = 2.3 - i * 0.12; B.tor(r, 0.055, B.c.std(c, 0.5, 0, c, 0.6), 0, 0, 0, Math.PI, 48); B.box(0.22, 0.012, 3.0, B.c.std(c, 0.8, 0, c, 0.25), -1.1 + i * 0.44, 0.007, 0.4, false); });
      [-1, 1].forEach(k => B.box(0.8, 0.1, 0.2, B.K.granite, k * 2.0, 0.05, 0)); const t = posterTexture(E, null, s, 512); B.box(0.8, 1.2, 0.1, B.K.black, 2.9, 0.9, 1.3); twoFace(B, t, 0.72, 1.02, 2.9, 0.9, 1.3, 0.055, 0.4); B.cyl(0.03, 0.03, 0.4, B.K.alu, 2.9, 0.2, 1.3, 8);
      return B.done([-2.45, 3.35, -0.2, 1.9], 2.6, [2.5, 0.9, 1.4], [[-2.45, -1.6, -0.15, 0.15], [1.6, 2.45, -0.15, 0.15], [2.45, 3.35, 1.2, 1.4]]); },
    lantern(E, B, s) { const T = E.T, body = B.sph(1.05, B.K.paper, 0, 1.75, 0, false); body.scale.set(1.15, 0.95, 1);   // a round creature lantern on a cart: paper over ribs, two big eyes, a string of fish lanterns
      for (let i = 0; i < 8; i++) { const r = B.tor(1.0, 0.012, B.K.dark, 0, 1.75, 0, 6.2832, 32); r.rotation.y = i * Math.PI / 8; r.scale.set(1.16, 0.96, 1); } [-0.5, 0, 0.5].forEach(y => { const q = Math.sqrt(1 - y * y); const r = B.tor(1.0 * q, 0.012, B.K.dark, 0, 1.75 + y * 0.95, 0, 6.2832, 32); r.rotation.x = Math.PI / 2; r.scale.set(1.15, 1, 1); });
      [-1, 1].forEach(k => { B.sph(0.26, B.c.glow('#ffffff', 1.6), k * 0.42, 2.0, 0.88, false).scale.set(0.26, 0.3, 0.1); B.sph(0.12, B.K.black, k * 0.4, 1.98, 0.97, false).scale.set(0.12, 0.15, 0.05); const e = B.cyl(0, 0.22, 0.5, B.K.paper, k * 0.7, 2.75, 0, 10); e.rotation.z = -k * 0.4; B.sph(0.1, B.c.glow('#ff6a8a', 1.4), k * 0.68, 1.62, 0.95, false).scale.set(0.12, 0.07, 0.05); });
      B.box(2.6, 0.3, 1.6, B.c.std('#8f0b20', 0.6), 0, 0.45, 0); B.box(2.7, 0.06, 1.7, B.K.gold, 0, 0.62, 0); [-1, 1].forEach(a => [-1, 1].forEach(b => { const w = B.cyl(0.25, 0.25, 0.1, B.K.dark, a * 0.95, 0.25, b * 0.82, 16); w.rotation.x = Math.PI / 2; }));
      const pts = catenary([-2.8, 4.0, 0.8], [2.8, 4.0, 0.8], 0.6, 12); for (let i = 0; i < pts.length - 1; i++) B.rod(pts[i], pts[i + 1], 0.008, B.K.dark); [-2.8, 2.8].forEach(x => B.cyl(0.04, 0.05, 4.1, B.K.dark, x, 2.05, 0.8, 8));
      pts.slice(1, -1).forEach((p, i) => { const f = B.sph(0.16, B.c.std(i % 2 ? '#ffb347' : '#ff5a3a', 0.8, 0, i % 2 ? '#ff9a2a' : '#ff3a1a', 1.4), p[0], p[1] - 0.25, p[2], false); f.scale.set(0.24, 0.13, 0.11); const tl = B.cyl(0, 0.1, 0.16, f.material, p[0] - 0.28, p[1] - 0.25, p[2], 4, false); tl.rotation.z = Math.PI / 2; });
      const t = canvasTex(E, ['B', s.key, 'lant'].join('|'), 320, 1024, (g, W, H) => { bannerFace(g, W, H, s, 0, 1, rng(s.key)); trk(g, 0); }); twoFace(B, t, 0.6, 1.9, 1.75, 1.6, 0.85, 0.01, 0.35);
      return B.done([-1.45, 1.45, -0.95, 0.95], 3.3, [1.45, 0.8, 0.9], [[-1.45, 1.45, -0.9, 0.9], [-2.9, -2.7, 0.7, 0.9], [2.7, 2.9, 0.7, 0.9]]); },
    digits(E, B, s) { const yr = String(s.big || s.year).replace(/\D/g, '').slice(0, 4) || '2005', SEG = { a: [0, 1, 1, 1], b: [1, 1, 1, 0.5], c: [1, 0.5, 1, 0], d: [0, 0, 1, 0], e: [0, 0.5, 0, 0], f: [0, 1, 0, 0.5], g: [0, 0.5, 1, 0.5] };   // the year in giant bulb digits
      const MAP = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' }, pts = [], dw = 0.95, dh = 1.9;
      [...yr].forEach((ch, i) => { const ox = -1.65 + i * 1.1; (MAP[ch] || '').split('').forEach(sg => { const [x0, y0, x1, y1] = SEG[sg], ax = ox + (x0 - 0.5) * dw, ay = 0.48 + y0 * dh, bx = ox + (x1 - 0.5) * dw, by = 0.48 + y1 * dh, L = Math.hypot(bx - ax, by - ay), n = Math.round(L / 0.085);
        B.box(Math.abs(bx - ax) + 0.12, Math.abs(by - ay) + 0.12, 0.12, B.K.dark, (ax + bx) / 2, (ay + by) / 2, 0); for (let k = 0; k <= n; k++) pts.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n, 0.075]); }); });
      bulbs(E, B, pts, 0.03, B.c.glow('#ffe08a', 3.4)); B.box(4.7, 0.36, 0.8, B.K.granite, 0, 0.18, 0); B.box(4.8, 0.04, 0.9, B.K.gold, 0, 0.37, 0);
      const t = wideTexture(E, null, s, 1024, 0.12, 'band'); B.pl(2.6, 0.31, B.c.face(t, 0.3), 0, 0.18, 0.405);
      return B.done([-2.4, 2.4, -0.42, 0.42], 2.4, [2.3, 0.6, 0.45]); },
    canopy(E, B, s, d) { const T = E.T, R = rng(s.key + 'can'), obj = d.obj || 'umbrella', C = obj === 'lantern' ? ['#e8243a', '#ff5a3a', '#f2c14e'] : ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c'];   // a walk-under canopy hung on cables
      const P = [[-2.4, -1.5], [2.4, -1.5], [-2.4, 1.5], [2.4, 1.5]]; P.forEach(([x, z]) => { B.cyl(0.05, 0.06, 4.3, B.K.alu, x, 2.15, z, 8); B.cyl(0.16, 0.2, 0.16, B.K.granite, x, 0.08, z, 12); });
      for (let r = 0; r < 5; r++) { const z = -1.5 + r * 0.75, pts = catenary([-2.4, 4.1, z], [2.4, 4.1, z], 0.25, 10); for (let i = 0; i < pts.length - 1; i++) B.rod(pts[i], pts[i + 1], 0.005, B.K.dark);
        for (let i = 1; i < 9; i++) { const p = pts[i], c = C[(r * 3 + i) % C.length], y = p[1] - 0.1 - R() * 0.3;
          if (obj === 'lantern') { B.rod([p[0], p[1], p[2]], [p[0], y + 0.18, p[2]], 0.004, B.K.dark); const l = B.sph(0.17, B.c.std(c, 0.8, 0, c, 1.5), p[0], y, p[2], false); l.scale.set(0.17, 0.15, 0.17); B.cyl(0.08, 0.08, 0.05, B.K.gold, p[0], y + 0.15, p[2], 10, false); B.cyl(0.08, 0.08, 0.05, B.K.gold, p[0], y - 0.15, p[2], 10, false); }
          else { const u = new T.Mesh(B.c.cyl(0.02, 0.42, 0.22, 8, true), B.c.std(c, 0.8, 0, c, 0.25, { side: T.DoubleSide, transparent: true, opacity: 0.88 })); u.position.set(p[0], y, p[2]); u.rotation.set((R() - 0.5) * 0.5, R() * 3, (R() - 0.5) * 0.5); u.castShadow = true; B.g.add(u); B.rod([p[0], y, p[2]], [p[0], y - 0.32, p[2]], 0.008, B.K.dark); } } }
      const t = canvasTex(E, ['B', s.key, 'can'].join('|'), 320, 1024, (g, W, H) => { bannerFace(g, W, H, s, 1, 2, rng(s.key)); trk(g, 0); }); twoFace(B, t, 0.7, 2.2, 0, 2.9, -1.5, 0.012, 0.35); B.rod([-0.4, 4.0, -1.5], [0.4, 4.0, -1.5], 0.015, B.K.alu);
      return B.done([-2.5, 2.5, -1.6, 1.6], 4.4, [2.4, 1.2, 1.62], P.map(([x, z]) => [x - 0.2, x + 0.2, z - 0.2, z + 0.2])); },
    flowers(E, B, s) { const R = rng(s.key + 'fl'), C = ['#e4007f', '#f39800', '#ffe100', '#8fc31f', '#00a0e9', '#ff6a8a', '#ffffff', '#f39800', '#e4007f'], stem = B.c.std('#3a8a3a', 0.7), feet = [];   // giant flowers leaning in over the walk, a ribbon of water tiles under them
      for (let i = 0; i < 9; i++) { const side = i % 2 ? 1 : -1, x = -2.4 + i * 0.6, z0 = side * 1.5, h = 3.0 + R() * 1.8, top = [x, h, side * 0.3]; B.rod([x, 0, z0], top, 0.05, stem); feet.push([x - 0.12, x + 0.12, z0 - 0.12, z0 + 0.12]);
        const fl = new E.T.Group(); fl.position.set(...top); fl.rotation.set(-side * 0.9, 0, R() * 0.6); B.g.add(fl); const pm = B.c.std(C[i], 0.6, 0, C[i], 0.35); for (let k = 0; k < 8; k++) { const p = new E.T.Mesh(B.c.sph, pm); p.scale.set(0.12, 0.04, 0.42); p.position.set(Math.sin(k * 0.785) * 0.38, 0, Math.cos(k * 0.785) * 0.38); p.rotation.y = k * 0.785; p.castShadow = true; fl.add(p); }
        const ctr = new E.T.Mesh(B.c.sph, B.c.glow('#fff2a0', 1.6)); ctr.scale.set(0.16, 0.1, 0.16); fl.add(ctr); }
      for (let i = 0; i < 24; i++) B.box(0.24, 0.015, 0.3, B.c.std(i % 2 ? '#5bc0eb' : '#8fd8f8', 0.2, 0, '#2a8ad8', 0.25), -2.8 + i * 0.245, 0.008, Math.sin(i * 0.5) * 0.3, false);
      const t = posterTexture(E, null, s, 512); B.box(0.86, 1.3, 0.1, B.K.black, 3.3, 1.0, 1.3); twoFace(B, t, 0.78, 1.12, 3.3, 1.0, 1.3, 0.055, 0.4); B.box(0.5, 0.3, 0.3, B.K.granite, 3.3, 0.15, 1.3); feet.push([2.9, 3.7, 1.15, 1.45]);
      return B.done([-2.6, 3.8, -1.7, 1.7], 4.8, [2.85, 1.0, 1.4], feet); },
    phones(E, B, s) { const R = rng(s.key + 'ph'), scr = B.c.glow('#a8f0ff', 2.2);   // a field of phone glows at waist height and a giant map pin over them; beside it the newspaper front
      for (let i = 0; i < 60; i++) { const x = -2.2 + R() * 4.4, z = -1.2 + R() * 2.4; if (Math.hypot(x, z) < 0.5) continue; const g = new E.T.Group(); g.position.set(x, 0.9 + R() * 0.5, z); g.rotation.set(-0.3 - R() * 0.4, R() * 6.28, 0); B.g.add(g);
        const b = new E.T.Mesh(B.c.box, B.K.black); b.scale.set(0.075, 0.15, 0.01); g.add(b); const f = new E.T.Mesh(B.c.plane, scr); f.scale.set(0.065, 0.13, 1); f.position.z = 0.006; g.add(f); B.rod([x, 0, z], [x, g.position.y - 0.08, z], 0.006, B.K.dark); }
      const pin = B.c.std(s.p.c || '#ff5a5f', 0.4, 0.2, s.p.c || '#ff5a5f', 0.3); B.sph(0.55, pin, 0, 2.9, 0); const cone = B.cyl(0.52, 0, 1.0, pin, 0, 2.3, 0, 24); B.sph(0.22, B.c.glow('#ffffff', 2), 0, 2.95, 0.42, false).scale.set(0.22, 0.22, 0.12); B.cyl(0.03, 0.03, 1.8, B.K.alu, 0, 0.9, 0, 8); B.cyl(0.3, 0.36, 0.08, B.K.granite, 0, 0.04, 0, 20);
      const t = posterTexture(E, null, Object.assign({}, s, { layout: 'news', p: pal('news') }), 640); B.box(1.2, 1.76, 0.12, B.K.alu, 2.9, 1.25, 0.6); twoFace(B, t, 1.1, 1.56, 2.9, 1.25, 0.6, 0.065, 0.5); B.box(1.2, 0.3, 0.4, B.K.granite, 2.9, 0.15, 0.6);
      return B.done([-2.3, 3.55, -1.3, 1.3], 3.5, [2.2, 1.0, 0.7], [[-0.36, 0.36, -0.36, 0.36], [2.25, 3.55, 0.35, 0.85]]); },
    books(E, B, s) { const R = rng(s.key + 'bk'), C = ['#9a3b26', '#2c4a5a', '#c8a050', '#e8dcc0', '#3b2a1a', '#6a8a6a', '#b85a3a'], feet = [];   // an arch built of books, glowing letter cards of the last night hanging from it
      [-1, 1].forEach(k => { let y = 0; for (let i = 0; i < 16; i++) { const h = 0.12 + R() * 0.06, w = 0.5 + R() * 0.25, b = B.box(w, h, 0.36, B.c.std(C[(i + (k > 0 ? 3 : 0)) % 7], 0.8), k * 1.4 + (R() - 0.5) * 0.05, y + h / 2, 0); b.rotation.y = (R() - 0.5) * 0.3; y += h; } feet.push([k * 1.4 - 0.4, k * 1.4 + 0.4, -0.3, 0.3]); });
      for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14, b = B.box(0.13, 0.42, 0.36, B.c.std(C[i % 7], 0.8), -Math.cos(a) * 1.4, 2.25 + Math.sin(a) * 0.9, 0); b.rotation.z = Math.PI / 2 - a; }
      const cards = [...String(s.big || '最後一夜')].slice(0, 6); cards.forEach((ch, i) => { const x = -0.75 + i * 1.5 / Math.max(1, cards.length - 1), t = canvasTex(E, 'card' + ch + s.key, 256, 320, (g, W, H) => { g.fillStyle = '#fff6e0'; g.fillRect(0, 0, W, H); g.strokeStyle = '#9a3b26'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); tx(g, ch, W / 2, H * 0.48, H * 0.6, W * 0.8, KAI, 900, '#3b2a1a'); tx(g, s.date, W / 2, H * 0.88, H * 0.07, W * 0.8, MONO, 700, '#9a3b26'); });
        B.rod([x, 3.05, 0], [x, 2.4, 0], 0.004, B.K.dark); B.pl(0.34, 0.42, B.c.face(t, 0.7, true), x, 2.2, 0); });
      B.sph(0.08, B.K.warm, 0, 3.0, 0.3, false); const t = posterTexture(E, null, s, 512); B.box(0.8, 1.2, 0.1, B.K.black, 2.4, 0.85, 0.9); twoFace(B, t, 0.72, 1.02, 2.4, 0.85, 0.9, 0.055, 0.4);
      return B.done([-1.85, 2.85, -0.35, 1.0], 3.3, [2.0, 0.9, 1.0], feet.concat([[2.0, 2.8, 0.8, 1.0]])); },
    screen(E, B, s) { const t = canvasTex(E, ['scr', s.key].join('|'), 1024, 576, (g, W, H) => { const R = rng(s.key + 's'), gr = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.6); gr.addColorStop(0, '#2a3a5a'); gr.addColorStop(1, '#05070e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);   // an open-air cinema: a screen on a truss, deck chairs, a projector and its beam
        for (let i = 0; i < 200; i++) disc(g, R() * W, R() * H, R() * 1.6, 'rgba(255,255,255,.8)'); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, H / 2, H * 0.3, 0, 6.2832); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, H * 0.36, 0, 6.2832); g.stroke();
        line(g, [[W / 2, H * 0.1], [W / 2, H * 0.9]]); line(g, [[W * 0.2, H / 2], [W * 0.8, H / 2]]); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(W / 2, H / 2); g.arc(W / 2, H / 2, H * 0.3, -Math.PI / 2, 0.9); g.fill(); tx(g, '3', W / 2, H / 2, H * 0.36, W, BLACK, 900, '#ffffff');
        tx(g, s.big || s.title, W / 2, H * 0.12, H * 0.08, W * 0.8, SONG, 900, '#f3e2b0'); tracked(g, (s.kicker || 'OPEN-AIR CINEMA') + '  ·  ' + s.date, W / 2, H * 0.92, H * 0.04, W * 0.9, NUM, 700, '#f3e2b0', 0.3); });
      [-2.1, 2.1].forEach(x => { B.box(0.14, 3.9, 0.14, B.K.alu, x, 1.95, -1.2); B.box(0.6, 0.06, 0.8, B.K.alu, x, 0.03, -1.2); B.rod([x, 3.0, -1.2], [x, 0.1, -1.8], 0.02, B.K.alu); });
      B.box(4.3, 2.5, 0.06, B.K.black, 0, 2.5, -1.24); B.pl(4.1, 2.3, B.c.face(t, 0.8), 0, 2.5, -1.2);
      for (let i = 0; i < 6; i++) { const x = -1.5 + (i % 3) * 1.5, z = 0.4 + ((i / 3) | 0) * 1.0, c = B.c.std(['#e63946', '#f1c453', '#2a9d8f'][i % 3], 0.9); B.box(0.55, 0.04, 0.5, c, x, 0.38, z).rotation.x = 0.15; B.box(0.55, 0.5, 0.04, c, x, 0.62, z + 0.28).rotation.x = -0.35; B.rod([x - 0.28, 0, z - 0.25], [x - 0.28, 0.85, z + 0.35], 0.015, B.K.wood); B.rod([x + 0.28, 0, z - 0.25], [x + 0.28, 0.85, z + 0.35], 0.015, B.K.wood); }
      B.box(0.4, 0.3, 0.5, B.K.dark, 0, 1.4, 2.6); B.cyl(0.08, 0.08, 0.12, B.K.alu, 0, 1.45, 2.32, 12).rotation.x = Math.PI / 2; [[-0.25, 2.5], [0.25, 2.5], [0, 2.85]].forEach(([x, z]) => B.rod([x, 0, z], [0, 1.25, 2.6], 0.012, B.K.alu));
      const beam = new E.T.Mesh(B.c.cyl(1.4, 0.06, 3.8, 24, true), B.c.light('#cfe6ff', 0.06)); beam.position.set(0, 1.95, 0.4); beam.rotation.x = -Math.PI / 2 + 0.15; B.g.add(beam);
      return B.done([-2.3, 2.3, -1.4, 2.9], 3.9, [2.3, 1.0, -1.0], [[-2.3, 2.3, -1.4, -1.0], [-0.3, 0.3, 2.3, 2.9]]); },
    burst(E, B, s) { const R = rng(s.key + 'b'), m = B.K.bronze;   // a firework burst sculpture on the quay: steel stems, a hundred glowing tips, a railing and the river poster
      B.box(2.4, 0.3, 1.4, B.K.granite, 0, 0.15, 0); B.box(2.5, 0.04, 1.5, B.K.alu, 0, 0.32, 0); const tips = [], C = [B.c.glow('#ffd23f', 3), B.c.glow('#ff3d7f', 3), B.c.glow('#3ddcff', 3)];
      [[0, 3.0, 0, 1.2, 60], [-0.8, 2.2, 0.1, 0.7, 30], [0.8, 1.9, -0.1, 0.6, 26]].forEach(([x, y, z, len, n], bi) => { B.rod([x * 0.3, 0.34, z], [x, y, z], 0.025, m); B.sph(0.08, B.K.gold, x, y, z);
        for (let i = 0; i < n; i++) { const u = 1 - (i + 0.5) / n * 2, th = i * 2.39996, r = Math.sqrt(1 - u * u), dd = [Math.cos(th) * r, u, Math.sin(th) * r], l = len * (0.8 + R() * 0.2); B.rod([x, y, z], [x + dd[0] * l, y + dd[1] * l, z + dd[2] * l], 0.008, B.K.gold); tips.push([x + dd[0] * l, y + dd[1] * l, z + dd[2] * l, (i + bi) % 3]); } });
      [0, 1, 2].forEach(k => bulbs(E, B, tips.filter(t => t[3] === k), 0.035, C[k]));
      for (let i = 0; i < 6; i++) B.cyl(0.03, 0.03, 0.9, B.K.alu, -1.2 + i * 0.48, 0.45, 0.95, 8); B.rod([-1.25, 0.9, 0.95], [1.25, 0.9, 0.95], 0.025, B.K.alu); B.rod([-1.25, 0.55, 0.95], [1.25, 0.55, 0.95], 0.015, B.K.alu);
      const t = wideTexture(E, null, s, 1024, 0.25, 'band'); B.pl(2.3, 0.26, B.c.face(t, 0.3), 0, 0.16, 0.705);
      return B.done([-1.25, 1.25, -0.72, 1.0], 4.2, [1.2, 1.2, 1.0]); },
  };
  function installation(E, it, d, s) { const B = mk(E, 'design-installation'); return (INSTALL[d.piece] || INSTALL.rings)(E, B, s, d); }

  // ── BOOTHS ──────────────────────────────────────────────────────────────────────────────────
  const BOOTHS = {   // the frame, the back wall and the props each kind of booth carries (booths.md)
    // band / skirt / flags: the header, counter front and pole banners each kind wears (default: the kit band, bunting skirt, feather flags)
    signing: { frame: 'truss', back: 'poster', props: ['cds', 'placards', 'barrier'], skirt: 'paste' }, stage: { frame: 'stage', back: 'screen', props: ['speakers', 'lightsticks'] },
    carnival: { frame: 'tent', back: 'repeat', props: ['balloons', 'merch'] }, fanmeet: { frame: 'riser', back: 'keyart', props: ['mics', 'ledboards', 'cones'] },   /* a street closed for a cast greeting: a low riser under a goalpost truss, the film's key art, fans' LED boards; its own shape, not the red-carpet booth's (checker 2026-11-22) */ carpet: { frame: 'truss', back: 'repeat', props: ['carpet', 'flashes'] },
    market: { frame: 'tent', back: 'poster', props: ['jars', 'lanterns', 'goods'], band: 'lacquer', skirt: 'clothskirt', flags: 'cloth' }, food: { frame: 'tent', back: 'poster', props: ['bowls', 'stools', 'menu'], band: 'noren', skirt: 'slats', flags: false },
    container: { frame: 'container', back: 'poster', props: ['goods', 'festoon'], band: 'stencil', skirt: 'crates', flags: false },
    craft: { frame: 'tent', back: 'poster', props: ['goods', 'festoon', 'plants'] }, esports: { frame: 'truss', back: 'screen', props: ['chairs', 'lightsticks', 'merch'] }, doujin: { frame: 'table', back: 'poster', props: ['books', 'acrylic', 'pullup'] },
  };
  const PROPS = {
    mics(E, B) { [-0.55, 0.1, 0.75].forEach((x, i) => { B.cyl(0.14, 0.16, 0.02, B.K.black, x, 0.43, -0.2, 12); B.rod([x, 0.43, -0.2], [x, 1.72 - (i % 2) * 0.12, -0.2], 0.01, B.K.alu); B.rod([x, 1.72 - (i % 2) * 0.12, -0.2], [x, 1.8 - (i % 2) * 0.12, -0.08], 0.014, B.K.black); B.sph(0.035, B.K.dark, x, 1.82 - (i % 2) * 0.12, -0.05); }); [-1.2, 1.2].forEach(x => { const w = B.box(0.5, 0.26, 0.36, B.K.black, x, 0.55, 0.1); w.rotation.x = -0.5; }); },
    ledboards(E, B, s) { const cs = [...String(s.big)].slice(0, 3); [[-1.35, 1.75], [-0.45, 2.0], [0.5, 1.9], [1.4, 1.7]].forEach(([x, z], i) => { const t = canvasTex(E, 'led' + i + s.key, 256, 160, (g, W, H) => { g.fillStyle = '#07070a'; g.fillRect(0, 0, W, H); for (let y = 6; y < H; y += 8) for (let x2 = 6; x2 < W; x2 += 8) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x2, y, 2, 2); } const c = [s.p.a, '#ffe14a', '#4fe0ff', '#ff5a48'][i % 4]; g.shadowColor = c; g.shadowBlur = 14; tx(g, i % 2 ? cs.join('') : (cs[0] || '讚') + ' 讚', W / 2, H * 0.52, H * 0.56, W * 0.9, ROUND, 900, c); });
      B.rod([x, 0, z], [x, 1.55 + (i % 2) * 0.12, z], 0.012, B.K.alu); const m = B.pl(0.5, 0.31, B.c.face(t, 1.4, true), x, 1.74 + (i % 2) * 0.12, z); m.rotation.y = Math.PI + (i - 1.5) * 0.14; B.pl(0.5, 0.31, B.c.face(t, 1.4, true), x, 1.74 + (i % 2) * 0.12, z + 0.006).rotation.y = (i - 1.5) * 0.14; }); },
    cones(E, B, s) { [[-1.75, 1.15], [1.75, 1.15]].forEach(([x, z]) => { B.cyl(0.03, 0.14, 0.5, B.c.std('#e8601c', 0.6), x, 0.37, z, 12); B.cyl(0.085, 0.1, 0.09, B.c.std('#f4f1ea', 0.5), x, 0.42, z, 12); B.box(0.34, 0.03, 0.34, B.c.std('#e8601c', 0.6), x, 0.135, z); });
      const t = canvasTex(E, 'closed' + s.key, 512, 128, (g, W, H) => { for (let i = -2; i < 12; i++) { g.fillStyle = i % 2 ? '#f2c21a' : '#15151a'; g.beginPath(); g.moveTo(i * W / 9, 0); g.lineTo((i + 1) * W / 9, 0); g.lineTo((i + 2) * W / 9, H); g.lineTo((i + 1) * W / 9, H); g.fill(); } g.fillStyle = '#15151a'; g.fillRect(W * 0.2, H * 0.14, W * 0.6, H * 0.72); tx(g, '活動封街　車輛改道', W / 2, H * 0.52, H * 0.44, W * 0.56, ROUND, 900, '#f2c21a'); });
      [-1, 1].forEach(k => { B.rod([k * 0.55, 0.12, 2.5], [k * 0.55, 1.05, 2.5], 0.02, B.K.alu); B.rod([k * 1.55, 0.12, 2.5], [k * 1.55, 1.05, 2.5], 0.02, B.K.alu); B.box(0.4, 0.03, 0.3, B.K.alu, k * 1.05, 0.135, 2.5); const m = B.pl(1.0, 0.25, B.c.face(t, 0.5, true), k * 1.05, 0.86, 2.5); m.rotation.y = Math.PI; B.pl(1.0, 0.25, B.c.face(t, 0.5), k * 1.05, 0.86, 2.51); }); },
    cds(E, B, s) { for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) B.box(0.14, 0.012, 0.14, B.c.std([s.p.a, s.p.b, s.p.c, '#ffffff'][i], 0.5), -0.7 + i * 0.2, 0.96 + k * 0.013, 0.55); const t = posterTexture(E, null, s, 256); [0.3, 0.55].forEach(x => { const p = B.pl(0.16, 0.16, B.c.face(t, 0.3), x, 1.05, 0.5); p.rotation.x = -0.3; }); B.cyl(0.006, 0.006, 0.14, B.K.black, 0.75, 0.97, 0.6, 6).rotation.z = Math.PI / 2; },
    placards(E, B, s) { [[-1.3, 1.3], [-0.6, 1.5], [0.6, 1.45], [1.3, 1.3]].forEach(([x, z], i) => { const t = canvasTex(E, 'plac' + i + s.key, 256, 192, (g, W, H) => { g.fillStyle = i % 2 ? '#ffd23f' : '#ff7ab8'; g.fillRect(0, 0, W, H); motif(g, 'heart', W * 0.2, H * 0.5, H * 0.25, '#ff2a5a'); tx(g, [...String(s.big)].slice(0, 4).join(''), W * 0.62, H * 0.45, H * 0.36, W * 0.6, ROUND, 900, '#2a1030'); tx(g, '♥ ' + s.year, W * 0.62, H * 0.8, H * 0.14, W * 0.6, ROUND, 700, '#2a1030'); });
      B.rod([x, 0, z], [x, 1.5, z], 0.012, B.K.wood); B.pl(0.42, 0.32, B.c.face(t, 0.35, true), x, 1.65, z).rotation.y = (i - 1.5) * 0.15; }); },
    barrier(E, B) { [-1, 1].forEach(k => { B.rod([k * 0.5, 0.95, 1.3], [k * 1.6, 0.95, 1.3], 0.02, B.K.alu); for (let i = 0; i < 4; i++) B.rod([k * (0.55 + i * 0.35), 0, 1.3], [k * (0.55 + i * 0.35), 0.95, 1.3], 0.012, B.K.alu); }); },
    speakers(E, B) { [-1.45, 1.45].forEach(x => { [0.5, 1.15].forEach(y => { B.box(0.5, 0.6, 0.45, B.K.black, x, y + 0.3, 0.1); B.tor(0.15, 0.02, B.K.alu, x, y + 0.3, 0.33); B.sph(0.12, B.K.dark, x, y + 0.3, 0.3).scale.set(0.12, 0.12, 0.04); }); }); },
    lightsticks(E, B, s) { const pts = []; for (let i = 0; i < 30; i++) pts.push([-1.2 + (i % 15) * 0.17, 1.12 + ((i / 15) | 0) * 0.05, 0.45 + ((i / 15) | 0) * 0.12]); const m = new E.T.InstancedMesh(B.c.cyl(0.012, 0.012, 0.26, 6), B.c.glow(s.p.a, 2.4), pts.length), o = new E.T.Object3D(); pts.forEach((p, i) => { o.position.set(...p); o.rotation.z = 0.2; o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); B.g.add(m); },
    balloons(E, B, s) { const C = [s.p.a, s.p.b, s.p.c, '#ffffff']; for (let i = 0; i < 14; i++) { const k = i < 7 ? -1 : 1, j = i % 7, y = 0.4 + j * 0.42; B.sph(0.2, B.c.std(C[i % 4], 0.3, 0.1), k * 1.7, y, 1.2, true).scale.set(0.2, 0.24, 0.2); } },
    merch(E, B, s) { B.box(0.9, 1.6, 0.35, B.K.wood, -1.25, 0.92, -0.6); for (let r = 0; r < 4; r++) { B.box(0.86, 0.02, 0.33, B.K.wood, -1.25, 0.3 + r * 0.38, -0.6); for (let i = 0; i < 4; i++) B.box(0.18, 0.1, 0.22, B.c.std([s.p.a, s.p.b, s.p.c, s.p.ink][(i + r) % 4], 0.85), -1.55 + i * 0.2, 0.36 + r * 0.38, -0.58); }
      const t = posterTexture(E, null, s, 256); for (let i = 0; i < 3; i++) { B.rod([0.4 + i * 0.45, 2.3, -0.9], [0.4 + i * 0.45, 2.15, -0.9], 0.004, B.K.dark); const m = B.pl(0.4, 0.46, B.c.std([s.p.a, '#ffffff', s.p.ink][i], 0.9, 0, null, 1, { side: E.T.DoubleSide }), 0.4 + i * 0.45, 1.9, -0.85); B.pl(0.18, 0.24, B.c.face(t, 0.2), 0.4 + i * 0.45, 1.95, -0.84); } },
    carpet(E, B) { B.box(1.4, 0.012, 3.0, B.K.carpet, 0, 0.13, 1.9, false); [-0.85, 0.85].forEach(x => [1.0, 2.0, 3.0].forEach(z => { B.cyl(0.025, 0.025, 0.9, B.K.gold, x, 0.45, z, 8); B.sph(0.045, B.K.gold, x, 0.92, z); B.cyl(0.1, 0.12, 0.03, B.K.gold, x, 0.015, z, 12); })); [-0.85, 0.85].forEach(x => [[1.0, 2.0], [2.0, 3.0]].forEach(([a, b]) => { B.rod([x, 0.86, a], [x, 0.7, (a + b) / 2], 0.016, B.K.rope); B.rod([x, 0.7, (a + b) / 2], [x, 0.86, b], 0.016, B.K.rope); })); },
    flashes(E, B) { [[-1.5, 1.2, 1.6], [1.5, 1.35, 1.7], [-1.4, 1.5, 2.6]].forEach(([x, y, z]) => { B.rod([x, 0, z], [x, y, z], 0.01, B.K.dark); B.box(0.1, 0.08, 0.08, B.K.black, x, y, z); star4; B.sph(0.06, B.K.white, x, y + 0.08, z + 0.04, false); }); },
    jars(E, B, s) { const glass = B.c.std('#e8f2f4', 0.1, 0, '#ffffff', 0.1, { transparent: true, opacity: 0.45 }); for (let i = 0; i < 6; i++) { const x = -0.9 + i * 0.34; B.cyl(0.11, 0.11, 0.26, glass, x, 1.08, 0.55, 14); B.cyl(0.095, 0.095, 0.16, B.c.std([s.p.a, s.p.b, '#e88a2a', '#8a2a1a'][i % 4], 0.7), x, 1.03, 0.55, 12); B.cyl(0.12, 0.12, 0.03, B.c.std('#c4201a', 0.6), x, 1.22, 0.55, 14); } },
    lanterns(E, B) { [-1.25, -0.4, 0.4, 1.25].forEach(x => { B.rod([x, 2.45, 1.05], [x, 2.2, 1.05], 0.005, B.K.dark); const l = B.sph(0.16, B.c.std('#e8243a', 0.8, 0, '#ff3a1a', 1.4), x, 2.05, 1.05, false); l.scale.set(0.18, 0.15, 0.18); B.cyl(0.08, 0.08, 0.04, B.K.gold, x, 2.19, 1.05, 10); }); },
    goods(E, B, s) { const R = rng(s.key + 'g'), C = [s.p.a, s.p.b, s.p.c, '#e9d6b0', '#8a5a3a']; for (let i = 0; i < 18; i++) B.box(0.1 + R() * 0.12, 0.06 + R() * 0.1, 0.1 + R() * 0.08, B.c.std(C[i % 5], 0.8), -1.0 + R() * 2.0, 1.0, 0.45 + R() * 0.25); },
    bowls(E, B) { const w = B.c.std('#f4f1ea', 0.4); for (let i = 0; i < 4; i++) { const x = -0.8 + i * 0.5; B.cyl(0.13, 0.08, 0.1, w, x, 1.0, 0.55, 16); B.cyl(0.12, 0.12, 0.01, B.c.std('#b86a2a', 0.6), x, 1.04, 0.55, 16); B.rod([x + 0.05, 1.04, 0.5], [x + 0.18, 1.18, 0.6], 0.005, B.K.wood); } B.cyl(0.25, 0.25, 0.4, B.K.alu, 1.0, 1.15, -0.2, 16); B.sph(0.2, B.c.std('#ffffff', 1, 0, '#ffffff', 0.3, { transparent: true, opacity: 0.25 }), 1.0, 1.55, -0.2, false); },
    stools(E, B) { [-1.0, -0.3, 0.4, 1.1].forEach((x, i) => { B.cyl(0.16, 0.14, 0.04, B.c.std(['#c4201a', '#1d5fa8'][i % 2], 0.6), x, 0.45, 1.2, 12); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B.rod([x + a * 0.1, 0, 1.2 + b * 0.1], [x + a * 0.08, 0.44, 1.2 + b * 0.08], 0.012, B.c.std(['#c4201a', '#1d5fa8'][i % 2], 0.6))); }); },
    menu(E, B, s) { const t = canvasTex(E, 'menu' + s.key, 384, 512, (g, W, H) => { g.fillStyle = '#1a2a1a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c8a050'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); tx(g, '本日', W / 2, H * 0.1, H * 0.07, W * 0.8, KAI, 900, '#f1e6cf'); ['米粉湯 40', '黑白切 60', '紅燒肉 50', '豬肝湯 45', '油豆腐 30'].forEach((t2, i) => tx(g, t2, W / 2, H * (0.25 + i * 0.13), H * 0.07, W * 0.8, KAI, 700, ['#f1e6cf', '#f2c14e'][i % 2])); });
      B.box(0.5, 0.66, 0.04, B.K.wood, 1.45, 1.5, 0.95); B.pl(0.44, 0.6, B.c.face(t, 0.2), 1.45, 1.5, 0.975); },
    festoon(E, B) { const pts = catenary([-1.6, 2.55, 1.15], [1.6, 2.55, 1.15], 0.25, 14); for (let i = 0; i < pts.length - 1; i++) B.rod(pts[i], pts[i + 1], 0.004, B.K.dark); bulbs(E, B, pts.slice(1, -1).map(p => [p[0], p[1] - 0.05, p[2]]), 0.035, B.K.warm); },
    plants(E, B) { [-1.5, 1.5].forEach(x => { B.cyl(0.18, 0.14, 0.34, B.c.std('#b86a3a', 0.8), x, 0.3, 1.0, 12); for (let i = 0; i < 6; i++) B.sph(0.14, E.MATS.leaf || B.c.std('#3a7a3a', 0.8), x + Math.sin(i) * 0.1, 0.55 + i * 0.06, 1.0 + Math.cos(i) * 0.1); }); },
    chairs(E, B, s) { for (let i = 0; i < 4; i++) { const x = -1.2 + i * 0.8, c = B.c.std(i % 2 ? s.p.a : s.p.b, 0.6); B.box(0.45, 0.08, 0.45, B.K.black, x, 0.6, 1.2); B.box(0.45, 0.7, 0.08, B.K.black, x, 0.98, 1.42).rotation.x = -0.15; B.box(0.3, 0.5, 0.02, c, x, 1.0, 1.37).rotation.x = -0.15; B.cyl(0.03, 0.03, 0.42, B.K.alu, x, 0.35, 1.2, 8); B.cyl(0.25, 0.25, 0.03, B.K.black, x, 0.14, 1.2, 5); } },
    books(E, B, s) { const C = [s.p.a, s.p.b, s.p.c, '#ffffff', '#8fd3ff']; for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) B.box(0.18, 0.015, 0.25, B.c.std(C[(i + k) % 5], 0.6), -1.1 + i * 0.32, 0.96 + k * 0.016, 0.5); for (let i = 0; i < 4; i++) { const p = B.box(0.18, 0.25, 0.015, B.c.std(C[i], 0.6, 0, C[i], 0.15), -0.95 + i * 0.6, 1.1, 0.68); p.rotation.x = -0.3; } },
    acrylic(E, B, s) { const t = posterTexture(E, null, Object.assign({}, s, { layout: 'anime' }), 256); for (let i = 0; i < 5; i++) { const x = 0.3 + i * 0.16; B.box(0.08, 0.01, 0.06, B.c.std('#e8f2f4', 0.1, 0, null, 1, { transparent: true, opacity: 0.5 }), x, 0.955, 0.75); B.pl(0.1, 0.15, B.c.face(t, 0.5, true), x, 1.03, 0.75); } },
    pullup(E, B, s) { const t = posterTexture(E, null, Object.assign({}, s, { layout: 'anime', variant: 1, p: pal('anime', 1) }), 384, 2.6); [-1.25, 1.25].forEach(x => { B.box(0.66, 0.06, 0.2, B.K.alu, x, 0.03, -0.75); B.pl(0.6, 1.6, B.c.face(t, 0.4), x, 0.86, -0.7); B.box(0.62, 0.03, 0.04, B.K.alu, x, 1.67, -0.7); }); },
  };
  function booth(E, it, d, s) {
    const B = mk(E, 'design-booth'), K = B.K, kind = BOOTHS[d.booth] ? d.booth : 'craft', cfg = BOOTHS[kind], T = E.T, base = cfg.frame === 'stage' ? 0.45 : 0.12;
    B.box(3.5, base, 2.5, cfg.frame === 'stage' ? K.black : K.stone, 0, base / 2, 0); if (cfg.frame === 'stage') { B.box(1.0, 0.22, 0.4, K.black, 0, 0.11, 1.45); B.box(3.5, 0.04, 0.06, B.c.glow(s.p.a, 2), 0, base, 1.26, false); }
    if (cfg.frame === 'truss') { [[-1.6, -1.1], [1.6, -1.1], [-1.6, 1.1], [1.6, 1.1]].forEach(([x, z]) => { [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]].forEach(([a, b]) => B.cyl(0.015, 0.015, 3.0, K.alu, x + a, 1.5, z + b, 6)); for (let i = 0; i < 10; i++) B.rod([x - 0.08, 0.15 + i * 0.29, z + 0.08], [x + 0.08, 0.44 + i * 0.29, z + 0.08], 0.007, K.alu); });
      [[0, -1.1, 3.36, 0], [0, 1.1, 3.36, 0], [-1.6, 0, 2.36, 1], [1.6, 0, 2.36, 1]].forEach(([x, z, l, r]) => { [-0.08, 0.08].forEach(o => { const b = B.cyl(0.015, 0.015, l, K.alu, x + (r ? o : 0), 3.0 + (r ? 0 : o), z + (r ? 0 : 0), 6); b.rotation[r ? 'x' : 'z'] = Math.PI / 2; }); }); }
    else if (cfg.frame === 'stage') { [-1.65, 1.65].forEach(x => B.box(0.24, 3.2, 0.24, K.alu, x, 1.6 + base / 2, -1.05)); B.box(3.6, 0.24, 0.24, K.alu, 0, 3.2, -1.05); [-1.0, -0.35, 0.35, 1.0].forEach((x, i) => { const c = B.cyl(0.08, 0.06, 0.2, K.black, x, 3.0, -0.8, 10); c.rotation.x = 0.8; B.sph(0.06, B.c.glow(i % 2 ? s.p.a : s.p.b, 3), x, 2.93, -0.72, false); }); }
    else if (cfg.frame === 'container') { const cm = E.triMat({ color: s.p.bg, tex: E.TEX.metal, scale: 6, rough: 0.6, metal: 0.4 }); B.box(3.5, 2.6, 0.08, cm, 0, 1.42, -1.2); [-1, 1].forEach(k => B.box(0.08, 2.6, 2.4, cm, k * 1.72, 1.42, 0)); B.box(3.5, 0.08, 2.4, cm, 0, 2.72, 0); for (let i = 0; i < 24; i++) B.box(0.03, 2.5, 0.02, B.K.dark, -1.7 + i * 0.148, 1.42, -1.15);
      [-1, 1].forEach(k => B.box(0.06, 2.5, 1.0, cm, k * 1.78, 1.42, 1.72)); }
    else if (cfg.frame === 'tent') { const cl = B.c.std(s.p.a, 0.9, 0, null, 1, { side: T.DoubleSide }), tr = B.c.std(s.p.bg === '#ffffff' ? s.p.b : s.p.bg, 0.9, 0, null, 1, { side: T.DoubleSide }); [[-1.6, -1.1], [1.6, -1.1], [-1.6, 1.1], [1.6, 1.1]].forEach(([x, z]) => B.cyl(0.03, 0.03, 2.5, K.alu, x, 1.37, z, 8));
      const roof = B.cyl(0, 2.3, 0.8, cl, 0, 2.97, 0, 4); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.72; for (let i = 0; i < 12; i++) B.box(0.28, 0.2, 0.02, i % 2 ? cl : tr, -1.54 + i * 0.28, 2.48, 1.13); B.box(3.3, 2.3, 0.03, tr, 0, 1.38, -1.12); }
    else if (cfg.frame === 'riser') { B.box(3.4, 0.3, 1.5, K.black, 0, base + 0.15, -0.45); B.box(3.4, 0.04, 0.05, B.c.glow(s.p.a, 2), 0, base + 0.3, 0.31, false); B.box(1.0, 0.15, 0.36, K.black, 0, base + 0.075, 0.5);
      [-1.6, 1.6].forEach(x => { [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]].forEach(([a, b]) => B.cyl(0.016, 0.016, 3.3, K.alu, x + a, 1.65 + base, -1.1 + b, 6)); for (let i = 0; i < 11; i++) B.rod([x - 0.09, base + 0.1 + i * 0.29, -1.01], [x + 0.09, base + 0.39 + i * 0.29, -1.01], 0.007, K.alu); B.box(0.5, 0.05, 0.5, K.black, x, base + 0.025, -1.1); });
      [-0.09, 0.09].forEach(o => { [-0.09, 0.09].forEach(q => { const b = B.cyl(0.016, 0.016, 3.4, K.alu, 0, 3.3 + base + o, -1.1 + q, 6); b.rotation.z = Math.PI / 2; }); }); for (let i = 0; i < 11; i++) B.rod([-1.6 + i * 0.29, 3.21 + base, -1.01], [-1.31 + i * 0.29, 3.39 + base, -1.01], 0.007, K.alu);
      [-1.1, -0.37, 0.37, 1.1].forEach((x, i) => { const c = B.cyl(0.08, 0.06, 0.2, K.black, x, 3.12 + base, -0.92, 10); c.rotation.x = 0.9; B.sph(0.055, B.c.glow(i % 2 ? s.p.a : '#fff2d0', 3), x, 3.05 + base, -0.84, false); }); }
    else { [-1.3, 1.3].forEach(x => B.box(0.05, 0.9, 0.05, K.alu, x, 0.45, 0.55)); }
    if (cfg.frame === 'riser') { const band = wideTexture(E, null, s, 1024, 0.2, cfg.band || 'band'); B.box(3.0, 0.56, 0.05, K.black, 0, 2.98 + base, -0.98); B.pl(2.92, 0.5, B.c.face(band, 0.45), 0, 2.98 + base, -0.95); }
    else if (cfg.frame !== 'table') { const band = wideTexture(E, null, s, 1024, 0.2, cfg.band || 'band'); const bz2 = cfg.frame === 'tent' ? 1.5 : 1.12;   // a tent's header hangs in front of its roof, which pierced the band (checker 2026-11-22)
      B.box(3.3, 0.7, 0.06, K.black, 0, cfg.frame === 'stage' ? 3.62 : cfg.frame === 'tent' ? 2.75 : cfg.frame === 'container' ? 2.95 : 2.75, bz2); B.pl(3.2, 0.64, B.c.face(band, 0.4), 0, cfg.frame === 'stage' ? 3.62 : cfg.frame === 'tent' ? 2.75 : cfg.frame === 'container' ? 2.95 : 2.75, bz2 + 0.035); if (cfg.frame === 'tent') [-1.6, 1.6].forEach(x => B.box(0.04, 0.04, 0.42, K.alu, x, 3.05, 1.3)); }
    const by = cfg.frame === 'stage' ? 1.8 : 1.45, bz = cfg.frame === 'container' ? -1.14 : -1.08;
    if (cfg.back === 'repeat') { const r = wideTexture(E, null, s, 1024, 0.62, 'repeat'); B.box(3.2, 2.1, 0.06, K.black, 0, by, bz - 0.04); B.pl(3.1, 2.0, B.c.face(r, 0.35), 0, by, bz); }
    else if (cfg.back === 'keyart') { const ka = posterTexture(E, null, s, 1024, 0.62); B.box(3.0, 1.95, 0.05, K.black, 0, 1.62 + base, -1.0); B.pl(2.9, 1.8, B.c.face(ka, 0.5), 0, 1.62 + base, -0.97); }
    else if (cfg.back === 'screen') { const sc = posterTexture(E, null, Object.assign({}, s, { layout: s.layout === 'esports' ? 'esports' : 'concert' }), 1024, 0.56); B.box(3.2, 1.9, 0.12, K.black, 0, by + 0.1, bz - 0.04); B.pl(3.0, 1.7, B.c.face(sc, 0.9), 0, by + 0.1, bz + 0.03); }
    else if (cfg.frame !== 'table') { const t = posterTexture(E, null, s, 512), t2 = posterTexture(E, null, Object.assign({}, s, { variant: s.variant + 1, p: pal(d.palette || LAYOUT_PAL[s.layout], s.variant + 1) }), 384); B.pl(0.9, 1.27, B.c.face(t, 0.3), -0.75, by + 0.1, bz + 0.02); B.pl(0.7, 0.99, B.c.face(t2, 0.3), 0.55, by + 0.25, bz + 0.02); B.pl(0.5, 0.7, B.c.face(t, 0.3), 1.25, by - 0.05, bz + 0.02); }
    if (cfg.frame !== 'stage' && cfg.frame !== 'riser') { B.box(2.6, 0.82, 0.55, K.wood, 0, base + 0.41, 0.55); B.box(2.7, 0.04, 0.62, K.cream, 0, base + 0.84, 0.55); const sk = wideTexture(E, null, s, 1024, 0.31, cfg.skirt || 'skirt'); B.pl(2.62, 0.8, B.c.face(sk, 0.16), 0, base + 0.41, 0.83); }
    if (cfg.flags !== false) [-1, 1].forEach(k => { const t = canvasTex(E, ['flag', cfg.flags || 'feather', s.key, k].join('|'), 256, 1024, (g, W, H) => { if (cfg.flags === 'cloth') { const R = rng(s.key + k); drawMaterial(g, W, H, 'cloth', R); g.strokeStyle = '#e0b24a'; g.lineWidth = W * 0.04; g.strokeRect(W * 0.08, W * 0.08, W * 0.84, H - W * 0.16);
        const words = k > 0 ? '恭賀新禧' : '年年有餘'; vtext(g, words, W / 2, H * 0.16, Math.min(W * 0.62, H * 0.17), KAI, 900, '#f2c75a'); tx(g, s.year, W / 2, H * 0.92, W * 0.2, W * 0.8, NUM, 800, '#f2c75a'); } else bannerFace(g, W, H, s, k > 0 ? 1 : 2, 3, rng(s.key + k)); trk(g, 0); }); const x = k * 1.95, z = 1.3; B.cyl(0.015, 0.015, 3.0, K.alu, x, 1.5, z, 6);
      const geo = new T.PlaneGeometry(0.5, 2.3, 1, 8), pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const v = (pa.getY(i) + 1.15) / 2.3; pa.setX(i, pa.getX(i) + Math.sin(v * 2.4) * 0.08 * v); } geo.computeVertexNormals(); const f = new T.Mesh(geo, B.c.face(t, 0.14, true)); f.position.set(x - k * 0.25, 1.75, z); B.g.add(f); });
    cfg.props.forEach(p => PROPS[p] && PROPS[p](E, B, s)); if (d.props) d.props.forEach(p => PROPS[p] && PROPS[p](E, B, s));
    const carpet = cfg.props.includes('carpet'); return B.done([-1.8, 1.8, -1.3, 1.3], cfg.frame === 'stage' ? 4.0 : 3.3, [1.62, 1.25, 1.12], [[-1.8, 1.8, -1.3, carpet ? 1.0 : 1.3]].concat(carpet ? [] : []));
  }

  // ── the entry point ─────────────────────────────────────────────────────────────────────────
  function build(E, it, d) {
    it = it || {}; d = Object.assign({}, choose(it, d && d.type, d && d.shape), d || {}); const form = d.form || 'poster';
    if (form !== 'poster' && form !== 'statue' && form !== 'installation' && form !== 'booth') console.warn('[design] unknown form "' + form + '", making a poster');
    const s = spec(it, d); let g;
    if (form === 'statue') g = statue(E, it, d, s); else if (form === 'installation') g = installation(E, it, d, s); else if (form === 'booth') g = booth(E, it, d, s);
    else { const B = mk(E, 'design-poster-' + (d.mount || 'case')); g = (MOUNTS[d.mount] || MOUNTS.case)(E, B, s, d); }
    g.userData.design = { form, layout: s.layout, mount: d.mount || null, piece: d.piece || null, booth: d.booth || null, plinth: d.plinth || null, motif: d.motif || s.motif, palette: d.palette || null };
    return g;
  }

  window.DESIGN = { build, choose, spec, pal, PAL, LAYOUTS, MOUNTS: Object.keys(MOUNTS), INSTALLATIONS: Object.keys(INSTALL), BOOTHS: Object.keys(BOOTHS), STATUES: Object.keys(FIG).filter(k => k !== 'figure'), PLINTHS: ['block', 'drum', 'podium'], CURATED: CUR,
    drawPoster, posterTexture, wideTexture, headerTexture, drawHeader, signTexture, drawMaterial, MATERIALS: Object.keys(MAT_FALL), art, reloadArt, artStatus, ART_AT,
    gateTexture: (E, district, d, px, aspect) => posterTexture(E, null, Object.assign({ layout: 'painted', art: 'posters/gates/' + district + '.jpg' }, d || {}), px, aspect), HEADERS: Object.keys(HDR), motif };
})();
