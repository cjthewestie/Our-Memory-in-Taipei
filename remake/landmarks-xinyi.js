// landmarks-xinyi.js — the researched places and events of 信義, built as real geometry and registered as
// clickable with PLACES. Called once from xinyi.html inside build():  LANDMARKS_XINYI(E, { solid })
//   solid(x, z, halfW, halfD)  the page's own "she walks round this" box.
// Layout (the scene is compressed; the tower is at the north end, x = 13, z = -72):
//   west   威秀影城 (north of 新光三越 A11)            east   微風南山 + 南山廣場 tower, ATT 4 FUN
//   south  誠品信義 (west of the gate), 市府轉運站 + hotel tower (east of the gate)
//   north, across the zebra crossing: the 101 forecourt (entrance, LOVE letters, damper pavilion, the event
//   markers), 四四南村 at its west end, the 象山 trailhead at its east end with the hill beyond.
// Every repeated part is merged into one mesh per material per landmark (maker().done()).
(function () {
'use strict';
window.LANDMARKS_XINYI = function (E, ctx) {
const { T, scene, canvasTex, speckle, TEX, GLOW, triMat, uTime } = E, PI = Math.PI;
const solid = (ctx && ctx.solid) || (() => {});
let seed = 44101; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, rr = (a, b) => a + (b - a) * rnd();
const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';

// ── merging: every box / cylinder a landmark is made of ends up in one mesh per material ──────────────
function merge(geos) { let n = 0; const gs = geos.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  gs.forEach(q => { const c = q.attributes.position.count; P.set(q.attributes.position.array.subarray(0, c * 3), o * 3); N.set(q.attributes.normal.array.subarray(0, c * 3), o * 3); if (q.attributes.uv) U.set(q.attributes.uv.array.subarray(0, c * 2), o * 2); o += c; });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('normal', new T.BufferAttribute(N, 3)); g.setAttribute('uv', new T.BufferAttribute(U, 2)); return g; }
const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _p = new T.Vector3(), _s = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
function maker(name) { const g = new T.Group(); g.name = name; const bins = new Map();
  const bin = (mat, geo) => { let b = bins.get(mat); if (!b) bins.set(mat, b = []); b.push(geo); };
  const put = (mat, geo, x, y, z, rx, ry, rz, sx, sy, sz) => { _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _m.compose(_p.set(x, y, z), _q, _s.set(sx || 1, sy || 1, sz || 1)); geo.applyMatrix4(_m); bin(mat, geo); };
  return { g, geo: put,
    box: (mat, w, h, d, x, y, z, ry, rx, rz) => put(mat, new T.BoxGeometry(w, h, d), x, y, z, rx, ry, rz),
    cyl: (mat, rt, rb, h, x, y, z, seg, rx, ry, rz) => put(mat, new T.CylinderGeometry(rt, rb, h, seg || 12), x, y, z, rx, ry, rz),
    sph: (mat, r, x, y, z, sx, sy, sz) => put(mat, new T.SphereGeometry(r, 12, 8), x, y, z, 0, 0, 0, sx, sy, sz),
    rod(mat, a, b, r) { const va = new T.Vector3(...a), d = new T.Vector3(...b).sub(va), L = d.length(), geo = new T.CylinderGeometry(r, r, L, 6); _q.setFromUnitVectors(UP, d.clone().normalize()); _m.compose(va.addScaledVector(d, 0.5), _q, _s.set(1, 1, 1)); geo.applyMatrix4(_m); bin(mat, geo); },
    add(o, x, y, z, ry) { o.position.set(x || 0, y || 0, z || 0); if (ry) o.rotation.y = ry; g.add(o); return o; },
    done(x, z, ry, parent, y) { bins.forEach((list, mat) => { const m = new T.Mesh(merge(list), mat); m.castShadow = !(mat.isMeshBasicMaterial || mat.userData.noCast); m.receiveShadow = true; g.add(m); }); bins.clear();
      g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; (parent || scene).add(g); return g; } }; }

// ── text and drawn surfaces ───────────────────────────────────────────────────────────────────────────
// lines = [[text, size (share of the height), y 0..1, weight, colour], ...]
function label(lines, w, h, o) { o = o || {}; const W = o.px || 512, H = Math.max(16, Math.round(W * h / w)), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); } if (o.draw) o.draw(g, W, H);
  if (o.border) { const lw = Math.max(3, H * 0.035); g.strokeStyle = o.border; g.lineWidth = lw; g.strokeRect(lw, lw, W - 2 * lw, H - 2 * lw); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([txt, size, y, weight, c]) => { g.font = `${weight || 700} ${Math.round(size * H)}px ${FONT}`; g.fillStyle = c || o.fg || '#fff'; const tw = g.measureText(txt).width, max = W * 0.92;
    g.save(); g.translate(W / 2, y * H); if (tw > max) g.scale(max / tw, 1); g.fillText(txt, 0, 0); g.restore(); });
  const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
  const m = new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: o.glow == null ? 0.35 : o.glow, roughness: 0.6, transparent: !o.bg, alphaTest: o.bg ? 0 : 0.3, side: T.FrontSide });
  const mesh = new T.Mesh(new T.PlaneGeometry(w, h), m); if (!o.both) return mesh;
  const pair = new T.Group(), back = new T.Mesh(mesh.geometry, m); back.rotation.y = PI; mesh.position.z = 0.012; back.position.z = -0.012; pair.add(mesh, back); return pair; }   // readable from both sides, never mirrored
// drawn(w, h, px, draw): a flat face from a canvas this file paints itself (lettering always in code)
const drawn = (w, h, px, draw, o) => label([], w, h, Object.assign({ px, bg: '#000', draw, glow: 0.45 }, o || {}));
const SERIF = '"Songti TC","STSong","Noto Serif TC",serif', MONO = '"SF Mono","Menlo",monospace';
const txt = (g, s, x, y, size, o) => { o = o || {}; g.font = `${o.w || 800} ${Math.round(size)}px ${o.f || FONT}`; g.fillStyle = o.c || '#fff'; g.textAlign = o.a || 'center'; g.textBaseline = 'middle';
  if (o.track) { g.letterSpacing = o.track + 'px'; } const tw = g.measureText(s).width; g.save(); g.translate(x, y); if (o.max && tw > o.max) g.scale(o.max / tw, 1); g.fillText(s, 0, 0); g.restore(); g.letterSpacing = '0px'; };
const burst = (B, mat, x, y, z, r, n) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2, k = 0.55 + (i % 3) * 0.2; B.rod(mat, [x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18, z], [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k, z], 0.012); B.sph(mat, 0.035, x + Math.cos(a) * r * k, y + Math.sin(a) * r * k, z); } };
// face(tex, w, h, glow, both): a plane carrying a texture from the kit (a real sign's material plus lettering)
const face = (tex, w, h, glow, both) => { const m = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow == null ? 0.3 : glow, roughness: 0.7 }), mesh = new T.Mesh(new T.PlaneGeometry(w, h), m);
  if (!both) return mesh; const pair = new T.Group(), back = new T.Mesh(mesh.geometry, m); back.rotation.y = PI; mesh.position.z = 0.012; back.position.z = -0.012; pair.add(mesh, back); return pair; };
// ── real signs (CJ, 2026-11-22: 「每個招牌要根據他的作用跟含義還有真實的招牌去對應」): each one built as its true type, with depth,
// on a Midjourney material from asset/textures/signs/ (DESIGN.signTexture). Where each comes from: docs/signage/sources-xinyi.md.
const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + FONT, LI = '"Libian TC","Baoli TC",' + KAI, DIDOT = 'Didot,"Bodoni 72","Songti TC",Georgia,serif', HEI = '"PingFang TC","Helvetica Neue",Arial,sans-serif';
// ink(lines, o): lettering for a sign face. lines = [[text, size (share of H), y 0..1, font, colour, weight, x 0..1, tracking px]]
//   o.fill paints the face (inset o.inset) before the letters, o.rule draws a border line, o.carve cuts the letters in (a dark offset under each)
const ink = (lines, o) => (g, W, H) => { o = o || {}; const ins = o.inset || 0;
  if (o.fill) { g.fillStyle = o.fill; g.fillRect(W * ins, H * ins, W * (1 - 2 * ins), H * (1 - 2 * ins)); }
  if (o.rule) { const m = Math.min(W, H) * (o.ruleAt || 0.07); g.strokeStyle = o.rule; g.lineWidth = Math.max(2, Math.min(W, H) * 0.03); g.strokeRect(m, m, W - 2 * m, H - 2 * m); }
  if (o.draw) o.draw(g, W, H); g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([t, size, y, font, c, wt, x, tr]) => { const px = Math.round(size * H); g.font = `${wt || 800} ${px}px ${font || FONT}`; g.letterSpacing = (tr || 0) + 'px'; const tw = g.measureText(t).width, max = W * (o.max || 0.9);
    g.save(); g.translate((x == null ? 0.5 : x) * W, y * H); if (tw > max) g.scale(max / tw, 1);
    if (o.carve) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(t, px * 0.035, px * 0.045); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillText(t, -px * 0.02, -px * 0.025); }
    g.fillStyle = o.only || c || '#fff'; g.fillText(t, 0, 0); g.restore(); g.letterSpacing = '0px'; }); };
let signN = 0;
// rs(kind, material, w, h, letter, o): 'box' a backlit light box in a metal case with a lip · 'plate' an enamel / brass / tin plate with
//   four rivets · 'board' a wooden or stone board in a frame. o.d depth, o.both lettered on both faces, o.glow, o.case (the case material)
function rs(kind, mat, w, h, letter, o) { o = o || {}; const ppm = o.ppm || Math.min(300, 1400 / Math.max(w, h)), tex = DESIGN.signTexture(E, mat, Math.max(16, Math.round(w * ppm)), Math.max(16, Math.round(h * ppm)), letter, 'xinyi' + (signN++));
  const d = o.d || (kind === 'box' ? 0.26 : kind === 'plate' ? 0.025 : 0.09), rim = kind === 'box' ? 0.07 : kind === 'board' ? 0.09 : 0, g = new T.Group();
  const fm = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: o.glow == null ? (kind === 'box' ? 0.95 : 0.22) : o.glow, roughness: kind === 'plate' ? 0.35 : 0.75, metalness: mat === 'brass' ? 0.45 : 0 });
  const cm = o.case || (kind === 'box' ? M.char : kind === 'plate' ? M.steel : M.woodD), body = new T.Mesh(new T.BoxGeometry(w + rim * 2, h + rim * 2, d), cm); body.castShadow = body.receiveShadow = true; g.add(body);
  const sides = o.both ? [1, -1] : [1];
  sides.forEach(k => { const f = new T.Mesh(new T.PlaneGeometry(w, h), fm); f.position.z = k * (d / 2 + 0.004); if (k < 0) f.rotation.y = PI; g.add(f);
    if (kind === 'box') [[0, h / 2 + rim / 2, w + rim * 2, rim], [0, -h / 2 - rim / 2, w + rim * 2, rim], [w / 2 + rim / 2, 0, rim, h], [-w / 2 - rim / 2, 0, rim, h]].forEach(([x, y, bw, bh]) => { const l = new T.Mesh(new T.BoxGeometry(bw, bh, 0.05), cm); l.position.set(x, y, k * (d / 2 + 0.02)); g.add(l); });   // the case lip proud of the acrylic
    if (kind === 'plate') { const r = Math.min(w, h) * 0.06; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const s = new T.Mesh(new T.SphereGeometry(Math.max(0.008, r * 0.45), 8, 6), M.silver); s.scale.z = 0.5; s.position.set(a * (w / 2 - r * 1.3), b * (h / 2 - r * 1.3), k * (d / 2 + 0.004)); g.add(s); }); } });
  return g; }
// chan(lines, w, h, o): channel letters, each letter a shell with a lit face and metal returns (stacked cut-outs), on a raceway if o.race
function chan(lines, w, h, o) { o = o || {}; const W = o.px || 1024, H = Math.max(16, Math.round(W * h / w));
  const mk = only => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; ink(lines, { only, max: 0.96 })(cv.getContext('2d'), W, H); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  const ft = mk(null), st = mk(o.side || '#3a3d44'), g = new T.Group(), geo = new T.PlaneGeometry(w, h), dep = o.depth || 0.12, n = o.layers || 5;
  const fm = new T.MeshStandardMaterial({ map: ft, emissiveMap: ft, emissive: new T.Color(1, 1, 1), emissiveIntensity: o.glow == null ? 1.0 : o.glow, alphaTest: 0.4, roughness: 0.45, metalness: o.metal || 0 });
  const sm = new T.MeshStandardMaterial({ map: st, alphaTest: 0.4, roughness: 0.4, metalness: 0.5, emissiveMap: st, emissive: new T.Color(1, 1, 1), emissiveIntensity: 0.05 });
  for (let i = n; i >= 1; i--) { const m = new T.Mesh(geo, sm); m.position.z = -dep * i / n; g.add(m); } const f = new T.Mesh(geo, fm); f.position.z = 0.002; g.add(f);
  if (o.race) { const r = new T.Mesh(new T.BoxGeometry(w * 0.94, h * (o.raceH || 0.12), 0.12), M.char); r.position.set(0, h * (o.raceY || 0), -dep - 0.06); r.castShadow = true; g.add(r); }
  return g; }
// a curtain wall drawn pane by pane: cols x rows, sky colour up top, the warm street lower down, some panes lit
function glass(cols, rows, o) { o = o || {}; const lit = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) lit.push([rnd() < (o.litFn ? o.litFn(r, c) : (o.lit == null ? 0.16 : o.lit)), rnd()]);
  const a = o.top || [62, 108, 140], b = o.bot || [150, 122, 100], gx = o.gx == null ? 1.5 : o.gx, gy = o.gy == null ? 0.2 : o.gy;
  const mk = (emi) => canvasTex(512, (g, s) => { const cw = s / cols, rh = s / rows; g.fillStyle = emi ? '#000' : (o.frame || '#14181d'); g.fillRect(0, 0, s, s);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const [on, v] = lit[r * cols + c], k = r / rows, off = o.darkRow === r;
      if (on && !off) g.fillStyle = `rgb(${225 + v * 30 | 0},${165 + v * 45 | 0},${92 + v * 50 | 0})`; else if (emi) continue; else { const m = i => Math.round((a[i] + (b[i] - a[i]) * k * k) * (0.8 + v * 0.35) * (off ? 0.35 : 1)); g.fillStyle = `rgb(${m(0)},${m(1)},${m(2)})`; }
      g.fillRect(c * cw + gx, r * rh + rh * gy, cw - 2 * gx, rh * (1 - gy) - 1); } }, 1);
  return new T.MeshStandardMaterial({ map: mk(false), emissiveMap: mk(true), emissive: new T.Color(1, 1, 1), emissiveIntensity: o.eI == null ? 0.9 : o.eI, roughness: o.rough == null ? 0.18 : o.rough, metalness: o.metal == null ? 0.35 : o.metal }); }
// a lit ground-floor shop front, n bays, with goods in silhouette
function shop(n, hue) { const t = canvasTex(512, (g, s) => { g.fillStyle = '#17191d'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < n; i++) { const x = i * s / n, w = s / n, gr = g.createLinearGradient(0, s * 0.1, 0, s); gr.addColorStop(0, hue || '#ffe6b8'); gr.addColorStop(1, '#f0a45c'); g.fillStyle = gr; g.fillRect(x + 6, s * 0.12, w - 12, s * 0.84);
      g.fillStyle = 'rgba(40,24,12,.6)'; for (let k = 0; k < 4; k++) { const bw = (w - 30) / 4; g.fillRect(x + 14 + k * bw, s * (0.5 + 0.12 * ((i + k) % 3)), bw - 6, s * 0.5); }
      g.fillStyle = '#17191d'; g.fillRect(x + w / 2 - 2, s * 0.12, 4, s * 0.84); g.fillRect(x + 6, s * 0.3, w - 12, 4); } }, 1);
  return new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: 0.9, roughness: 0.3 }); }
const plane = (w, h, mat) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.receiveShadow = true; return m; };
// a film poster / advert drawn from plain shapes: no real artwork
function poster(w, h, title, sub, hue, glow) { return label([[title, 0.13, 0.76, 800, '#fff6e0'], [sub, 0.055, 0.88, 600, '#fff6e0']], w, h, { px: 256, glow: glow == null ? 0.55 : glow, bg: '#111', draw(g, W, H) {
  const gr = g.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, `hsl(${hue},70%,52%)`); gr.addColorStop(1, `hsl(${(hue + 50) % 360},65%,18%)`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = `hsla(${(hue + 180) % 360},80%,70%,.85)`; g.beginPath(); g.arc(W * (0.3 + 0.4 * rnd()), H * 0.3, W * 0.2, 0, 7); g.fill();
  g.fillStyle = 'rgba(10,10,20,.75)'; g.beginPath(); g.moveTo(0, H * 0.62); for (let i = 0; i <= 8; i++) g.lineTo(W * i / 8, H * (0.5 + 0.12 * rnd())); g.lineTo(W, H); g.lineTo(0, H); g.fill(); } }); }

// ── materials ─────────────────────────────────────────────────────────────────────────────────────────
const tileTex = canvasTex(256, (g, s) => { g.fillStyle = '#b9b9b9'; g.fillRect(0, 0, s, s); for (let r = 0; r < 8; r++) { g.fillStyle = `rgba(0,0,0,${0.25 + 0.1 * (r % 2)})`; g.fillRect(0, r * s / 8, s, 5); for (let c = 0; c < 10; c++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.22})`; g.fillRect(c * s / 10 + (r % 2) * s / 20, r * s / 8, s / 10 - 2, s / 8); } } speckle(g, s, 3000, 0.2, true); });
const M = {
  stone: triMat({ color: '#cfc6b6', tex: TEX.concrete, scale: 0.6, rough: 0.55 }), pale: triMat({ color: '#e4dfd4', tex: TEX.concrete, scale: 0.5, rough: 0.6 }),
  beige: triMat({ color: '#c9bda6', tex: TEX.concrete, scale: 0.45, rough: 0.7 }), char: triMat({ color: '#41434b', tex: TEX.metal, scale: 0.8, rough: 0.45, metal: 0.3 }),
  dark: triMat({ color: '#1e2026', tex: TEX.metal, scale: 2, rough: 0.4, metal: 0.4 }), steel: triMat({ color: '#aab2ba', tex: TEX.metal, scale: 2, rough: 0.3, metal: 0.7 }),
  silver: triMat({ color: '#cfd8de', tex: TEX.metal, scale: 1.5, rough: 0.22, metal: 0.75 }), roof: triMat({ color: '#3a3d42', tex: TEX.concrete, scale: 0.3, rough: 0.8 }),
  wood: triMat({ color: '#a37a54', tex: TEX.bark, scale: 2.5, rough: 0.7 }), woodD: triMat({ color: '#5b4433', tex: TEX.bark, scale: 2.5, rough: 0.75 }),
  gold: triMat({ color: '#f2c230', tex: TEX.metal, scale: 3, rough: 0.32, metal: 0.25, emissive: '#8a5a08', eI: 1.0 }), red: triMat({ color: '#cf2630', tex: TEX.metal, scale: 2, rough: 0.35, metal: 0.15, emissive: '#48060a', eI: 0.5 }),
  tile: triMat({ color: '#80848a', tex: tileTex, scale: 1.1, rough: 0.85 }), plaster: triMat({ color: '#cdc8bc', tex: TEX.plaster, scale: 0.45, rough: 0.92 }), damp: triMat({ color: '#7d7b74', tex: TEX.concrete, scale: 0.8, rough: 0.95 }),
  teal: triMat({ color: '#6fb3a8', tex: TEX.bark, scale: 3, rough: 0.8, emissive: '#3f8f84', eI: 0.42 }), brick: triMat({ color: '#c05a48', tex: TEX.bark, scale: 3, rough: 0.8, emissive: '#a03a2a', eI: 0.4 }), win: triMat({ color: '#2a3238', tex: TEX.metal, scale: 2, rough: 0.2, metal: 0.4 }),
  g101: triMat({ color: '#4f8f8a', tex: TEX.metal, scale: 0.6, rough: 0.2, metal: 0.4 }), grass: triMat({ color: '#557a3a', tex: TEX.leafy, scale: 0.8, rough: 0.95 }), hill: triMat({ color: '#35602f', tex: TEX.leafy, scale: 0.09, rough: 0.95 }),
  rock: triMat({ color: '#8d8272', tex: TEX.concrete, scale: 0.7, rough: 0.9 }), skin: triMat({ color: '#d9a98a', rough: 0.8 }), leaf: E.MATS.leaf, bus: triMat({ color: '#e9e4d8', tex: TEX.metal, scale: 1, rough: 0.35, metal: 0.2 }),
  cloth: ['#c8553d', '#3d6f9e', '#e0b84a', '#6b8f5a', '#8a5f9c', '#e8e2d4'].map(c => triMat({ color: c, rough: 0.85 })),
  warm: GLOW(3.2, 2.0, 0.9), white: GLOW(2.2, 2.2, 2.0), redGlow: GLOW(2.6, 0.5, 0.3), doors: GLOW(1.7, 1.25, 0.7),
  pane: new T.MeshStandardMaterial({ color: 0x9fd0e0, transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.3, side: T.DoubleSide }) };
M.pane.userData.noCast = true;

// ── building parts ────────────────────────────────────────────────────────────────────────────────────
// a glazed block: the panes are drawn, the floor slabs and the fins between bays are real and stand proud of the glass
function curtain(B, w, h, d, x, y0, z, bays, floors, go, ribMat, ro) { ro = ro || {}; const bd = Math.max(1, Math.round(d / (w / bays))), f = glass(bays, floors, go), s = glass(bd, floors, go);
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), [s, s, M.roof, M.roof, f, f]); m.position.set(x, y0 + h / 2, z); m.castShadow = m.receiveShadow = true; B.g.add(m);
  if (!ribMat) return; const p = ro.p || 0.22, st = h / floors, fw = ro.finW || 0.16;
  if (ro.slab !== false) for (let i = ro.slabEvery || 1; i <= floors; i += ro.slabEvery || 1) B.box(ribMat, w + 2 * p, ro.slabH || 0.2, d + 2 * p, x, y0 + i * st, z);
  if (ro.fin !== false) { const bw = w / bays, dd = d / bd, e = ro.finEvery || 1;
    for (let i = 0; i <= bays; i += e) for (const k of [-1, 1]) B.box(ribMat, fw, h, p, x - w / 2 + i * bw, y0 + h / 2, z + k * (d / 2 + p / 2));
    for (let i = 0; i <= bd; i += e) for (const k of [-1, 1]) B.box(ribMat, p, h, fw, x + k * (w / 2 + p / 2), y0 + h / 2, z - d / 2 + i * dd); } }
// a plain standing figure with no face: legs, coat, head, hair, arms given as [dx, dy, dz] reaches from the shoulder
function person(B, x, y, z, o) { o = o || {}; if (window.PEOPLE) { (window.__lmPeople = window.__lmPeople || []).push({ g: B.g, x, y, z, ry: o.ry || 0, o }); return; }   /* the people kit (lm/kit-people.js) draws this figure instead: lm/xinyi-people.js reads the list */ const s = o.s || 1, top = o.top || M.cloth[0], leg = o.leg || M.dark, ry = o.ry || 0, c = Math.cos(ry), sn = Math.sin(ry), at = (lx, ly, lz) => [x + (lx * c + lz * sn) * s, y + ly * s, z + (-lx * sn + lz * c) * s];
  for (const k of [-1, 1]) B.rod(leg, at(k * 0.09, 0, 0), at(k * 0.09, 0.78, 0), 0.065 * s);
  B.rod(top, at(0, 0.74, 0), at(0, 1.36, 0), 0.17 * s); const h = at(0, 1.52, 0); B.sph(M.skin, 0.115 * s, h[0], h[1], h[2]); const hr = at(0, 1.57, -0.03); B.sph(o.hair || M.dark, 0.12 * s, hr[0], hr[1], hr[2], 1, 0.8, 1);
  const arms = o.arms || [[-0.1, -0.5, 0.05], [0.1, -0.5, 0.05]]; arms.forEach((a, i) => { const k = i ? 1 : -1; B.rod(top, at(k * 0.2, 1.3, 0), at(k * 0.2 + a[0], 1.3 + a[1], a[2]), 0.05 * s); }); }
const P = k => PLACES.item('xinyi', k), find = n => scene.children.find(c => c.name === n), out = {};

// ══ 1. 台北信義威秀影城, west side north of A11: front to the plaza (+x) ═══════════════════════════════════
{ const B = maker('vieshow'), W = 14.5, D = 19, H = 18, fz = D / 2;
  B.box(M.char, W, H, D, 0, H / 2, 0); B.box(M.dark, W * 0.84, 5, D * 0.6, 0, H + 2.5, -D * 0.16);                     // four storeys, the blank box of the halls set back on top
  B.box(M.roof, W + 0.5, 0.5, D + 0.5, 0, H + 0.25, 0); B.box(M.stone, W + 0.2, 0.5, D + 0.2, 0, 0.25, 0);
  B.add(plane(W - 1, 4.2, shop(5)), 0, 2.6, fz + 0.03);                                                                // shops and the lobby at street level
  for (let i = 0; i <= 5; i++) B.box(M.stone, 0.55, 5.0, 0.6, -W / 2 + 0.3 + i * (W - 0.6) / 5, 2.5, fz + 0.1);
  B.box(M.dark, W + 0.8, 0.55, 3.2, 0, 5.2, fz + 1.5); B.box(M.redGlow, W + 0.84, 0.07, 0.07, 0, 4.92, fz + 3.1); for (const k of [-1, 1]) B.box(M.redGlow, 0.07, 0.07, 3.2, k * (W / 2 + 0.4), 4.92, fz + 1.5);          // the marquee, a red line of light round its edge
  for (let i = 0; i < 18; i++) B.sph(M.warm, 0.07, -W / 2 + 0.3 + i * (W - 0.6) / 17, 4.86, fz + 3.0);
  B.add(rs('box', 'neonback', W - 1.5, 0.5, ink([['現正熱映　NOW SHOWING', 0.6, 0.53, HEI, '#ffb53a', 800, 0.5, 6]], { fill: 'rgba(10,6,8,.72)' }), { d: 0.12, glow: 1.1 }), 0, 5.2, fz + 3.12);   // the marquee's amber LED strip in its black case
  ['夏日午後|ONE SUMMER AFTERNOON', '星際旅人|THE LONG ORBIT', '台北物語|A TAIPEI STORY', '夜行列車|NIGHT TRAIN SOUTH', '山海之間|BETWEEN HILL AND SEA'].forEach((s, i) => { const [a, b] = s.split('|'), x = -5.6 + i * 2.8;
    B.box(M.dark, 2.3, 3.4, 0.16, x, 8.0, fz + 0.08); B.add(poster(2.1, 3.2, a, b, [18, 215, 330, 265, 150][i]), x, 8.0, fz + 0.17); B.box(M.warm, 2.1, 0.05, 0.06, x, 9.78, fz + 0.2); });
  B.box(M.dark, 8.6, 3.9, 0.3, 0, 12.6, fz + 0.15);                                                                    // the LED screen
  B.add(label([['COMING SOON', 0.2, 0.3, 800, '#ffe9c4'], ['即將上映', 0.3, 0.66, 800, '#ffffff']], 8.2, 3.5, { glow: 0.95, bg: '#201030', draw(g, W, H) { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#5a1a6a'); gr.addColorStop(0.5, '#b03050'); gr.addColorStop(1, '#f09040'); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); } } }), 0, 12.6, fz + 0.31);
  for (const k of [-1, 1]) for (let i = 0; i < 3; i++) B.box(M.steel, 0.12, 7.4, 0.3, k * (4.9 + i * 0.75), 11.3, fz + 0.15);  // metal fins either side of the screen
  B.add(chan([['VIESHOW CINEMAS', 0.36, 0.28, HEI, '#ffffff', 900, 0.5, 10], ['信義威秀影城', 0.42, 0.74, HEI, '#ffffff', 800, 0.5, 24]], 9.5, 2.0, { side: '#9a1c24', depth: 0.16, race: true, raceH: 0.08, raceY: -0.02, glow: 1.0 }), 0, 16.2, fz + 0.24);   // white-faced channel letters with red returns on a raceway
  // the ticket booth on the forecourt, a red carpet to the doors, stanchions
  B.box(M.char, 2.6, 2.5, 1.3, -4.6, 1.25, fz + 0.75); B.box(M.dark, 3.0, 0.14, 1.7, -4.6, 2.57, fz + 0.75); B.add(plane(2.2, 1.0, M.doors), -4.6, 1.5, fz + 1.41);
  B.add(rs('box', 'lightbox', 2.4, 0.42, ink([['售票處　TICKETS', 0.62, 0.54, HEI, '#ffffff', 800, 0.5, 4]], { fill: 'rgba(150,24,34,.88)' }), { d: 0.14 }), -4.6, 2.3, fz + 1.47);
  B.add(plane(3.4, 3.4, M.doors), 1.2, 2.2, fz + 0.06); for (let i = 0; i < 3; i++) B.box(M.dark, 0.08, 3.4, 0.08, 1.2 + (i - 1) * 1.1, 2.2, fz + 0.1);
  B.box(M.red, 3.0, 0.03, 3.6, 1.2, 0.03, fz + 1.8);
  for (const k of [-1, 1]) for (let i = 0; i < 3; i++) { B.cyl(M.gold, 0.035, 0.035, 0.95, 1.2 + k * 1.75, 0.475, fz + 0.5 + i * 1.3, 8); B.sph(M.gold, 0.06, 1.2 + k * 1.75, 0.97, fz + 0.5 + i * 1.3); if (i) B.rod(M.red, [1.2 + k * 1.75, 0.86, fz + 0.5 + (i - 1) * 1.3], [1.2 + k * 1.75, 0.86, fz + 0.5 + i * 1.3], 0.025); }
  out.vieshow = B.done(-28.5, -13.5, PI / 2);
  PLACES.add(E, P('vieshow-xinyi'), { target: out.vieshow, near: [-17, -12.3], radius: 5, plaque: { position: [-18.55, 1.6, -9.6], rotation: PI / 2 } }); }

// ══ 2. 台北南山廣場 + 微風南山, east side north: the seven-storey mall to the plaza, the 48-storey tower behind ══
{ const B = maker('nanshan'), fz = 12;
  const tg = { top: [84, 128, 158], bot: [176, 150, 128], lit: 0.1, gx: 2.5, gy: 0.12 }, ro = { slabEvery: 4, slabH: 0.14, p: 0.18, finW: 0.1 };
  curtain(B, 14, 42, 13, 0, 0, -6.5, 14, 17, tg, M.silver, ro); curtain(B, 13, 30, 12, 0, 42, -6.5, 13, 12, tg, M.silver, ro);       // 17 + 12 + 10 + 9 = 48 storeys, narrowing
  curtain(B, 12, 25, 11, 0, 72, -6.5, 12, 10, tg, M.silver, ro); curtain(B, 10.5, 20, 9.5, 0, 97, -6.5, 10, 9, tg, M.silver, ro);
  for (const k of [-1, 1]) B.box(M.silver, 4.6, 9, 9.5, k * 2.6, 121, -6.5, 0, 0, k * 0.2);                                    // the top closes like two hands
  B.cyl(M.steel, 0.08, 0.14, 7, 0, 128, -6.5, 6); B.sph(M.redGlow, 0.3, 0, 131.6, -6.5);
  // the mall block: pale panels, a tall glass atrium in the middle of the front, shops below
  B.box(M.pale, 19, 30, 12, 0, 15, 6); B.box(M.roof, 19.4, 0.5, 12.4, 0, 30.25, 6);
  for (let i = 1; i < 7; i++) B.box(M.char, 19.06, 0.09, 12.06, 0, i * 4.28, 6);                                               // panel joints, one per storey
  for (let i = 0; i < 8; i++) for (const k of [-1, 1]) B.box(M.char, 0.07, 30, 0.04, k * (5.2 + (i % 4) * 1.1), 15, fz + 0.02);
  B.add(plane(8.4, 22.5, glass(7, 6, { top: [90, 140, 170], bot: [240, 190, 130], lit: 0.45, gx: 3, gy: 0.06 })), 0, 17.2, fz + 0.04);
  for (let i = 0; i <= 7; i++) B.box(M.silver, 0.12, 22.5, 0.4, -4.2 + i * 1.2, 17.2, fz + 0.2); for (let i = 0; i <= 6; i++) B.box(M.silver, 8.6, 0.14, 0.3, 0, 5.95 + i * 3.75, fz + 0.15);
  B.add(plane(18.2, 4.6, shop(6)), 0, 2.7, fz + 0.03); for (let i = 0; i <= 6; i++) B.box(M.stone, 0.5, 5.3, 0.5, -9.2 + i * 3.07, 2.65, fz + 0.1);
  B.box(M.steel, 19.6, 0.22, 2.6, 0, 5.5, fz + 1.2); B.box(M.warm, 19.2, 0.04, 0.04, 0, 5.36, fz + 2.4);
  B.add(chan([['BREEZE', 0.46, 0.32, DIDOT, '#fff6e6', 700, 0.5, 14], ['微風南山　NAN SHAN', 0.22, 0.76, HEI, '#fff6e6', 600, 0.5, 8]], 4.7, 2.3, { side: '#8a7550', depth: 0.1, glow: 0.95 }), -7.0, 26.6, fz + 0.16);   // the serif BREEZE wordmark in lit channel letters
  B.add(chan([['南山廣場', 0.46, 0.34, HEI, '#ffffff', 800, 0.5, 16], ['TAIPEI NAN SHAN PLAZA', 0.18, 0.76, HEI, '#dfe8ee', 600, 0.5, 6]], 5.2, 2.0, { side: '#5a6670', depth: 0.1, glow: 0.85 }), 6.6, 26.8, fz + 0.16);
  B.add(poster(3.6, 8, '春季新裝', 'SPRING COLLECTION', 28, 0.7), -7, 14.5, fz + 0.07); B.add(poster(3.6, 8, '品味生活', 'TASTE OF THE CITY', 190, 0.7), 7, 14.5, fz + 0.07);
  // the small faceted glass pavilion at the corner entrance, cut like a diamond
  { const px = -10.4, pz = fz + 1.4, dg = new T.Mesh(new T.OctahedronGeometry(2.3, 0), triMat({ color: '#9fd3e6', tex: TEX.metal, scale: 1, rough: 0.08, metal: 0.6, emissive: '#27485a', eI: 0.6 })); dg.scale.set(1, 1.25, 1); dg.rotation.y = 0.4; dg.castShadow = true; B.add(dg, px, 2.6, pz, 0.4);
    const ed = new T.LineSegments(new T.EdgesGeometry(dg.geometry), new T.LineBasicMaterial({ color: 0xf4f8fa })); dg.add(ed); B.box(M.stone, 3.6, 0.3, 3.6, px, 0.15, pz, 0.4); B.sph(M.warm, 0.25, px, 1.2, pz); }
  out.nanshan = B.done(33, -9.5, -PI / 2);
  PLACES.add(E, P('nan-shan-plaza'), { target: out.nanshan, near: [17, -11], radius: 5.5, plaque: { position: [20.55, 1.6, -12.4], rotation: -PI / 2 } }); }

// ══ 3. ATT 4 FUN, east side south: a ten-storey dark box, screens on the front, terraces up top toward the tower ══
{ const B = maker('att4fun'), W = 19, D = 21, H = 45, fz = D / 2;
  curtain(B, W, H, D, 0, 0, 0, 12, 10, { top: [38, 52, 70], bot: [92, 74, 66], lit: 0.2, frame: '#0b0d10', gy: 0.3 }, M.dark, { p: 0.28, finEvery: 2, slabH: 0.3 });
  B.box(M.dark, 11.2, 13.6, 0.4, 2.4, 22.5, fz + 0.3);                                                                   // the big LED wall
  B.add(label([['4', 0.5, 0.42, 900, '#ffffff'], ['FUN · FOOD · FASHION · FILM', 0.07, 0.8, 700, '#ffe9c4']], 10.6, 13, { px: 512, glow: 0.95, bg: '#101020', draw(g, W, H) { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0c2a6a'); gr.addColorStop(0.55, '#7a2aa0'); gr.addColorStop(1, '#f0508a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(255,255,255,${0.08 + 0.05 * i})`; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H * 0.42, 40 + i * 34, 0, 7); g.stroke(); } } }), 2.4, 22.5, fz + 0.52);
  B.add(chan([['ATT 4 FUN', 0.72, 0.52, HEI, '#ffffff', 900, 0.5, 18]], 12, 3.0, { side: '#c2185b', depth: 0.22, race: true, raceH: 0.1, glow: 1.05 }), 0, 41.4, fz + 0.55);   // the crown sign: white channel letters, magenta returns
  B.add(rs('box', 'lightbox', 2.4, 9, ink([['ATT', 0.13, 0.2, HEI, '#ffffff', 900], ['4', 0.22, 0.5, HEI, '#ff4f9a', 900], ['FUN', 0.13, 0.8, HEI, '#ffffff', 900]], { fill: 'rgba(14,15,22,.9)', inset: 0.04 }), { d: 0.32 }), -7.4, 20, fz + 0.48);   // the upright light box on the corner
  B.add(plane(W - 1, 4.6, shop(6, '#e8f0ff')), 0, 2.7, fz + 0.3); B.box(M.dark, W + 0.8, 0.3, 2.6, 0, 5.6, fz + 1.2); B.box(M.white, W, 0.05, 0.05, 0, 5.42, fz + 2.45);
  B.add(rs('plate', 'tin', 7, 0.5, ink([['←  新光三越 · 威秀　2F 空橋 SKYBRIDGE', 0.56, 0.53, HEI, '#f2f5f8', 700]], { fill: 'rgba(30,34,42,.9)' }), { glow: 0.6 }), 5, 5.6, fz + 2.52);   // a painted aluminium wayfinding plate
  // the restaurant terraces on the two top floors, facing the tower (local -x) and the plaza
  [36.2, 40.7].forEach((y, j) => { B.box(M.char, 3.0, 0.25, D + 0.6, -W / 2 - 1.5, y, 0); B.add(plane(D + 0.6, 1.1, M.pane), -W / 2 - 3.0, y + 0.67, 0, -PI / 2); B.box(M.steel, 0.06, 0.06, D + 0.6, -W / 2 - 3.0, y + 1.24, 0);
    for (let i = 0; i < 6; i++) { const z = -8.5 + i * 3.4; B.cyl(M.woodD, 0.5, 0.5, 0.05, -W / 2 - 1.6, y + 0.85, z, 10); B.cyl(M.steel, 0.03, 0.03, 0.75, -W / 2 - 1.6, y + 0.48, z, 6); B.cyl(M.cloth[(i + j) % 5], 0.05, 1.1, 0.5, -W / 2 - 1.6, y + 2.5, z, 8); B.cyl(M.steel, 0.025, 0.025, 2.3, -W / 2 - 1.6, y + 1.3, z, 6); B.sph(M.warm, 0.07, -W / 2 - 1.6, y + 1.0, z); } });
  for (let i = 0; i < 22; i++) B.sph(M.warm, 0.06, -W / 2 - 2.9, 42.1 - 0.25 * Math.sin(i / 21 * PI * 4), -10 + i * 0.95);
  B.box(M.roof, 6, 3, 8, 3, H + 1.5, -3); B.cyl(M.steel, 0.06, 0.06, 6, 5, H + 6, -5, 6);
  out.att = B.done(31.5, 13, -PI / 2);
  PLACES.add(E, P('att-4-fun'), { target: out.att, near: [17, 12], radius: 5.5, plaque: { position: [20.6, 1.6, 6.4], rotation: -PI / 2 } }); }

// ── the second-floor bridge along the east side, from the skywalk to ATT 4 FUN's door ──────────────────
{ const B = maker('bridge-east'), x = 19.3, z0 = -4.6, z1 = 7.6, L = z1 - z0, zc = (z0 + z1) / 2, y = 6.1;
  B.box(M.stone, 2.6, 0.4, L, x, y - 0.2, zc); B.box(M.warm, 0.04, 0.04, L, x - 1.3, y - 0.42, zc); B.box(M.steel, 2.9, 0.12, L + 0.3, x, y + 3.0, zc);
  for (const k of [-1, 1]) { B.add(plane(L, 1.15, M.pane), x + k * 1.25, y + 0.6, zc, PI / 2); B.box(M.steel, 0.06, 0.06, L, x + k * 1.25, y + 1.2, zc); for (let z = z0; z <= z1 + 0.01; z += L / 6) B.box(M.steel, 0.08, 3.0, 0.08, x + k * 1.25, y + 1.5, z); }
  for (const z of [z0 + 1.2, zc, z1 - 1.2]) B.cyl(M.steel, 0.24, 0.28, y - 0.4, x, (y - 0.4) / 2, z, 12);
  B.box(M.stone, 1.9, 0.4, 2.4, x + 1.0, y - 0.2, z1 - 1.2);
  B.add(rs('plate', 'tin', 2.2, 0.4, ink([['ATT 4 FUN  →', 0.6, 0.53, HEI, '#f2f5f8', 700]], { fill: 'rgba(30,34,42,.9)' }), { both: true, glow: 0.6 }), x, y + 2.6, z0 + 0.4);
  B.done(0, 0, 0); }

// ══ 4. 誠品信義店, south-west of the gate, its front (north face) to the plaza ═════════════════════════════
{ const B = maker('eslite'), W = 25, D = 14, H = 38, fz = D / 2, st = H / 9;
  // six store floors with warm windows (one already dark, the last night), three office floors above
  const lit = (r) => (r < 3 ? 0.1 : r === 5 ? 0 : 0.8), fm = glass(14, 9, { top: [80, 110, 130], bot: [230, 180, 120], litFn: lit, darkRow: 5, gy: 0.36, gx: 2 }), sm = glass(8, 9, { top: [80, 110, 130], bot: [230, 180, 120], litFn: lit, darkRow: 5, gy: 0.36, gx: 2 });
  const body = new T.Mesh(new T.BoxGeometry(W, H, D), [sm, sm, M.roof, M.roof, fm, fm]); body.position.y = H / 2; body.castShadow = body.receiveShadow = true; B.g.add(body);
  for (let i = 1; i <= 9; i++) B.box(M.beige, W + 0.7, st * 0.36, D + 0.7, 0, i * st - st * 0.18 + 0.02, 0);                   // the pale horizontal bands
  for (let i = 0; i <= 14; i += 2) for (const k of [-1, 1]) B.box(M.beige, 0.3, H, 0.3, -W / 2 + i * W / 14, H / 2, k * (D / 2 + 0.15));
  B.box(M.beige, W + 0.9, 1.0, D + 0.9, 0, H + 0.5, 0); B.box(M.roof, 8, 3, 6, -4, H + 2.4, 0);
  // street level: tall glass, wooden shelves and lamps seen inside, readers on the steps
  B.add(plane(W - 1.4, 3.6, new T.MeshStandardMaterial((() => { const t = canvasTex(1024, (g, s) => { g.fillStyle = '#e9b874'; g.fillRect(0, 0, s, s); for (let b = 0; b < 8; b++) { const x = b * s / 8; g.fillStyle = '#6a4424'; g.fillRect(x + 8, s * 0.08, s / 8 - 16, s * 0.86); for (let r = 0; r < 5; r++) { let px = x + 14; const y = s * (0.12 + r * 0.165); g.fillStyle = '#f6d9a0'; g.fillRect(x + 12, y, s / 8 - 24, s * 0.135); while (px < x + s / 8 - 22) { const bw = 5 + Math.random() * 8; g.fillStyle = `hsl(${Math.random() * 360},${30 + Math.random() * 40}%,${30 + Math.random() * 35}%)`; g.fillRect(px, y + s * 0.02 + Math.random() * 8, bw, s * 0.115); px += bw + 1; } } g.fillStyle = '#2a2420'; g.fillRect(x, 0, 6, s); } }, 1); return { map: t, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: 0.85, roughness: 0.3 }; })())), 0, 2.2, fz + 0.36);
  for (let i = 0; i <= 8; i++) B.box(M.beige, 0.6, 4.3, 0.7, -W / 2 + 0.3 + i * (W - 0.6) / 8, 2.15, fz + 0.35);
  B.box(M.woodD, 9, 0.2, 2.6, 0, 4.2, fz + 1.5); B.box(M.warm, 8.6, 0.04, 0.04, 0, 4.08, fz + 2.7);
  B.box(M.dark, 3.3, 1.25, 0.12, -8.6, 6.0, fz + 0.42); B.add(chan([['eslite', 0.5, 0.36, DIDOT, '#ffffff', 400, 0.5, 4], ['誠品信義店', 0.3, 0.8, HEI, '#ffffff', 600, 0.5, 10]], 3.1, 1.1, { side: '#6a6a6a', depth: 0.06, glow: 0.9 }), -8.6, 6.0, fz + 0.56);   // the lower-case serif eslite and 誠品 in lit letters on the dark panel
  B.add(rs('board', 'teak', 4.2, 0.4, ink([['24H BOOKSTORE · 書店 3F', 0.5, 0.53, DIDOT, '#f6e7c4', 600, 0.5, 3]], {}), { d: 0.06, glow: 0.4 }), 0, 4.2, fz + 2.82);   // a timber fascia board under the wooden canopy
  B.box(M.stone, 10, 0.16, 1.2, 0, 0.08, fz + 1.2); B.box(M.stone, 9.4, 0.16, 0.7, 0, 0.24, fz + 0.9);
  person(B, -2.2, 0.32, fz + 0.9, { s: 0.92, top: M.cloth[1], ry: PI * 0.1, arms: [[0.12, -0.3, 0.28], [-0.12, -0.3, 0.28]] }); B.box(M.cloth[5], 0.3, 0.03, 0.22, -2.2, 1.28, fz + 1.2, 0, 0.5);
  person(B, 2.6, 0.32, fz + 1.0, { s: 0.88, top: M.cloth[3], arms: [[0.14, -0.28, 0.26], [-0.02, -0.5, 0.05]] }); B.box(M.wood, 0.34, 0.4, 0.12, 2.95, 0.6, fz + 1.15);
  out.eslite = B.done(-17.5, 30.5, PI);
  // the door she can walk up to: glass leaves in a steel frame under the wooden canopy, long timber pulls, a lit transom, a mat
  { const Dr = maker('eslite-door'), dx = -1.22, dz = fz + 0.36; Dr.box(M.steel, 0.08, 3.1, 0.14, dx - 1.15, 1.87, dz); Dr.box(M.steel, 0.08, 3.1, 0.14, dx + 1.15, 1.87, dz); Dr.box(M.steel, 2.38, 0.08, 0.14, dx, 3.42, dz); Dr.box(M.steel, 2.3, 0.06, 0.12, dx, 2.72, dz); Dr.box(M.steel, 0.05, 2.4, 0.1, dx, 1.52, dz);
    Dr.box(M.warm, 2.2, 0.6, 0.04, dx, 3.07, dz - 0.03); for (const k of [-1, 1]) { Dr.add(plane(1.08, 2.36, M.pane), dx + k * 0.56, 1.5, dz + 0.02); Dr.box(M.woodD, 0.07, 1.3, 0.07, dx + k * 0.14, 1.45, dz + 0.1); Dr.box(M.steel, 0.03, 0.03, 0.1, dx + k * 0.14, 2.0, dz + 0.05); Dr.box(M.steel, 0.03, 0.03, 0.1, dx + k * 0.14, 0.9, dz + 0.05); }
    Dr.box(M.dark, 2.0, 0.02, 0.9, dx, 0.33, dz + 0.6); Dr.add(label([['推 PUSH', 0.6, 0.52, 700]], 0.34, 0.1, { bg: '#22262c', fg: '#f6e7c4', glow: 0.5 }), dx + 0.56, 1.5, dz + 0.04);
    out.esliteDoor = Dr.done(-17.5, 30.5, PI); }
  PLACES.add(E, P('eslite-xinyi'), { target: [out.eslite, out.esliteDoor], near: [-16.3, 20.9], radius: 4.2, plaque: { position: [-14.7, 1.7, 22.75], rotation: PI } }); }

// ══ 5. 市府轉運站, south-east of the gate: coach bays under a seven-storey store, the slim hotel tower above ══
{ const B = maker('bus-station'), W = 24, D = 15, H = 30, fz = D / 2;
  curtain(B, W, H - 5.4, D, 0, 5.4, 0, 12, 6, { top: [88, 120, 146], bot: [200, 160, 120], lit: 0.4, gy: 0.3 }, M.pale, { p: 0.3, finEvery: 2, slabH: 0.5 });
  B.box(M.roof, W + 0.6, 0.5, D + 0.6, 0, H + 0.25, 0); B.box(M.pale, W, 0.6, D, 0, 5.3, 0);
  B.box(M.char, W - 1, 5, D - 7, 0, 2.5, -3.4);                                                                          // the open coach hall, the back wall dark
  for (let i = 0; i <= 4; i++) { const x = -W / 2 + 0.5 + i * (W - 1) / 4; B.box(M.pale, 0.9, 5.2, 0.9, x, 2.6, fz - 0.5); B.box(M.pale, 0.9, 5.2, 0.9, x, 2.6, 0.2);
    if (i < 4) { const cx = x + (W - 1) / 8; B.add(rs('box', 'lightbox', 0.8, 0.8, ink([[String(i + 1), 0.72, 0.56, HEI, '#1a1a1a', 900]], { fill: 'rgba(242,194,48,.92)' }), { d: 0.12, glow: 0.8 }), cx, 4.4, fz - 0.38); B.box(M.dark, 1.0, 1.0, 0.1, cx, 4.4, fz - 0.5); B.box(M.white, 4.4, 0.06, 0.3, cx, 4.95, 3); } }
  // one coach waiting in bay 2: body, window band, wheels, the destination blind
  { const bx = -3, bz = 3.6; B.box(M.bus, 10.5, 2.7, 2.5, bx, 1.85, bz); B.box(M.win, 9.8, 1.0, 2.54, bx - 0.2, 2.35, bz); B.box(M.cloth[1], 10.52, 0.35, 2.52, bx, 1.05, bz); B.box(M.dark, 10.3, 0.3, 2.3, bx, 0.45, bz);
    for (const wx of [-3.6, 3.2, 4.2]) for (const k of [-1, 1]) B.cyl(M.dark, 0.48, 0.48, 0.3, bx + wx, 0.48, bz + k * 1.12, 14, PI / 2);
    B.add(label([['台北 → 桃園機場', 0.6, 0.52, 700]], 2.2, 0.36, { bg: '#111', fg: '#ffb23a', glow: 1.0 }), bx - 5.27, 2.9, bz, -PI / 2); B.box(M.warm, 0.05, 0.16, 0.3, bx - 5.27, 0.9, bz + 0.9); B.box(M.warm, 0.05, 0.16, 0.3, bx - 5.27, 0.9, bz - 0.9); }
  B.add(rs('box', 'lightbox', 8.4, 1.5, ink([['市府轉運站', 0.5, 0.38, HEI, '#ffffff', 800, 0.5, 30], ['Taipei City Hall Bus Station', 0.2, 0.78, HEI, '#ffffff', 600, 0.5, 2]], { fill: 'rgba(22,74,128,.9)' }), { d: 0.3 }), -4, 5.9, fz + 0.45);   // a long backlit box, white on transit blue
  B.add(chan([['統一時代百貨', 0.46, 0.36, HEI, '#ffffff', 800, 0.5, 14], ['UNI-USTYLE', 0.22, 0.78, HEI, '#ffd9a0', 700, 0.5, 12]], 7.6, 2.2, { side: '#555a60', depth: 0.14, race: true, raceH: 0.07, raceY: 0.06 }), 6.4, 26.8, fz + 0.56);
  B.add(poster(3.2, 7.5, '週年慶', 'ANNIVERSARY', 345, 0.7), -8.6, 16, fz + 0.36);
  // the hotel: about thirty storeys of glass rising out of the podium
  curtain(B, 12, 78, 11, 4, H, -1.5, 10, 23, { top: [70, 112, 150], bot: [170, 148, 132], lit: 0.24, gx: 2, gy: 0.16 }, M.silver, { p: 0.2, slabEvery: 1, slabH: 0.12, finEvery: 5, finW: 0.3 });
  B.box(M.char, 12.4, 4, 11.4, 4, H + 80, -1.5); B.box(M.silver, 10, 1.2, 9, 4, H + 82.6, -1.5);
  B.add(chan([['W', 0.78, 0.48, HEI, '#ffffff', 300], ['TAIPEI', 0.14, 0.9, HEI, '#ffffff', 600, 0.5, 14]], 4.4, 4.4, { side: '#8a8f96', depth: 0.25, glow: 1.1 }), 4, H + 74.5, 4.4);   // the plain W letter high on the hotel (a letter, not the hotel's logo artwork)
  out.bus = B.done(18.5, 31, PI);
  // the door she can walk up to: the ticket hall's sliding glass doors in the fourth bay, the blue header the station's signs use, a departures board beside it
  { const Dr = maker('bus-station-door'), dx = 8.62, dz = fz - 1.0; Dr.box(M.pale, 4.6, 5.0, 0.2, dx, 2.5, dz - 0.3); Dr.box(M.steel, 0.1, 3.0, 0.16, dx - 1.5, 1.5, dz); Dr.box(M.steel, 0.1, 3.0, 0.16, dx + 1.5, 1.5, dz); Dr.box(M.steel, 3.1, 0.1, 0.16, dx, 3.05, dz); Dr.box(M.char, 2.9, 3.0, 0.05, dx, 1.5, dz - 0.12);
    for (const k of [-1, 1]) { Dr.add(plane(1.4, 2.9, M.pane), dx + k * 0.72, 1.5, dz + 0.02); Dr.box(M.steel, 0.04, 2.9, 0.06, dx + k * 0.03, 1.5, dz + 0.04); Dr.box(M.warm, 0.5, 0.04, 0.02, dx + k * 0.72, 1.2, dz + 0.04); }
    Dr.add(label([['售票大廳 Ticket Hall', 0.46, 0.38, 800], ['國道客運 · 統一時代百貨 入口', 0.24, 0.78, 600]], 3.0, 0.62, { bg: '#164a80', fg: '#ffffff', glow: 0.9 }), dx, 3.5, dz + 0.1);
    Dr.add(label([['往 桃園機場  1960  每 20 分', 0.2, 0.2, 700], ['往 基隆  2088  每 15 分', 0.2, 0.44, 700], ['往 宜蘭 羅東  1571  每 30 分', 0.2, 0.68, 700], ['往 新竹  1728  每 20 分', 0.2, 0.9, 700]], 1.3, 1.5, { bg: '#0d0f14', fg: '#ffb23a', glow: 1.0 }), dx - 2.25, 2.0, dz - 0.15);
    out.busDoor = Dr.done(18.5, 31, PI); }
  PLACES.add(E, P('city-hall-bus-station'), { target: [out.bus, out.busDoor], near: [9.9, 21.4], radius: 4.2, plaque: { position: [11.8, 1.7, 24.3], rotation: PI } }); }

// ══ 6. 四四南村, at the west end of the tower's forecourt: two long single-storey rows and the lane between ══
{ const B = maker('village'), L = 20, Dp = 4.5, Hw = 2.7, paint = [M.teal, M.brick, M.teal, M.teal, M.brick];
  B.box(M.damp, 23.4, 0.05, 14.4, 0, 0.035, 0.2);
  const row = (zc, n0) => { const fz = zc + Dp / 2, bz = zc - Dp / 2;
    B.box(M.plaster, L, Hw, Dp, 0, Hw / 2, zc); B.box(M.damp, L + 0.08, 0.4, Dp + 0.08, 0, 0.2, zc);
    const sh = new T.Shape(); sh.moveTo(-Dp / 2 - 0.5, 0); sh.lineTo(Dp / 2 + 0.5, 0); sh.lineTo(0, 1.5); sh.closePath();
    B.geo(M.tile, new T.ExtrudeGeometry(sh, { depth: L + 0.7, bevelEnabled: false }), -(L + 0.7) / 2, Hw, zc, 0, PI / 2, 0);                // the low pitched roof of dark grey tile
    B.box(M.roof, L + 0.8, 0.14, 0.34, 0, Hw + 1.5, zc); for (const k of [-1, 1]) { B.box(M.woodD, L + 0.7, 0.12, 0.1, 0, Hw - 0.02, zc + k * (Dp / 2 + 0.47)); B.box(M.plaster, 0.06, 1.3, Dp * 0.86, k * (L / 2 + 0.36), Hw + 0.5, zc); }
    for (let i = 0; i < 5; i++) { const ux = -8 + i * 4, pm = paint[(i + n0) % 5];
      B.box(pm, 0.92, 2.0, 0.07, ux - 0.9, 1.0, fz + 0.03); B.box(M.woodD, 1.12, 0.1, 0.12, ux - 0.9, 2.06, fz + 0.04); for (const k of [-1, 1]) B.box(M.woodD, 0.1, 2.1, 0.12, ux - 0.9 + k * 0.51, 1.05, fz + 0.04);
      B.box(M.dark, 0.5, 0.03, 0.02, ux - 0.9, 1.5, fz + 0.075); B.sph(M.gold, 0.035, ux - 0.6, 1.02, fz + 0.09); B.box(M.damp, 1.4, 0.14, 0.5, ux - 0.9, 0.07, fz + 0.27);
      B.box((i + n0) % 2 ? M.doors : M.win, 1.3, 1.0, 0.05, ux + 0.95, 1.6, fz + 0.02); for (const k of [-1, 1]) { B.box(pm, 0.08, 1.1, 0.09, ux + 0.95 + k * 0.65, 1.6, fz + 0.04); B.box(pm, 1.38, 0.08, 0.09, ux + 0.95, 1.6 + k * 0.52, fz + 0.04); }
      B.box(pm, 0.05, 1.0, 0.07, ux + 0.95, 1.6, fz + 0.04); B.box(pm, 1.3, 0.05, 0.07, ux + 0.95, 1.6, fz + 0.04); B.box(M.damp, 1.5, 0.07, 0.16, ux + 0.95, 1.04, fz + 0.07);
      B.add(rs('plate', 'enamel', 0.34, 0.2, ink([['松勤街', 0.24, 0.27, HEI, '#f4f4ee', 700], [(n0 * 5 + i + 1) * 2 + '號', 0.44, 0.67, HEI, '#ffffff', 800]], { fill: 'rgba(32,74,150,.92)', rule: '#f4f4ee', ruleAt: 0.05 }), { ppm: 400, glow: 0.18 }), ux - 0.18, 2.04, fz + 0.06);   // the blue 門牌 by each door: street on top, number large
      B.sph(M.warm, 0.05, ux - 0.9, 2.3, fz + 0.22); B.cyl(M.dark, 0.02, 0.12, 0.08, ux - 0.9, 2.37, fz + 0.22, 8); B.rod(M.dark, [ux - 0.9, 2.4, fz], [ux - 0.9, 2.4, fz + 0.22], 0.012);
      B.cyl(M.damp, 0.045, 0.045, Hw, ux + 1.98, Hw / 2, fz + 0.06, 6);
      B.box(M.win, 1.0, 0.8, 0.05, ux, 1.7, bz - 0.02); for (const k of [-1, 1]) { B.box(pm, 0.07, 0.9, 0.08, ux + k * 0.5, 1.7, bz - 0.04); B.box(pm, 1.07, 0.07, 0.08, ux, 1.7 + k * 0.42, bz - 0.04); } B.box(pm, 0.05, 0.8, 0.07, ux, 1.7, bz - 0.04);
      if (i % 2 === 0) { B.cyl(M.brick, 0.2, 0.15, 0.3, ux + 0.2, 0.15, fz + 0.3, 10); B.sph(M.leaf, 0.26, ux + 0.2, 0.52, fz + 0.3, 1, 1.2, 1); } }
    B.cyl(M.damp, 0.16, 0.16, 0.9, 6.5, Hw + 1.4, zc - 0.8, 8); B.cyl(M.dark, 0.2, 0.2, 0.06, 6.5, Hw + 1.88, zc - 0.8, 8); };
  row(3.75, 0); row(-3.75, 1);
  // the lane: washing on a line, a stool and a water vat, a bench; then the sign and the grass mound at the east end
  B.rod(M.dark, [-7.5, 2.45, 1.45], [-7.5, 2.45, -1.45], 0.012); for (let i = 0; i < 4; i++) B.box(M.cloth[[5, 1, 0, 2][i]], 0.02, 0.7 + 0.2 * (i % 2), 0.5, -7.5, 2.05 - 0.1 * (i % 2), 1.0 - i * 0.65);
  B.rod(M.dark, [4.5, 2.45, 1.45], [4.5, 2.45, -1.45], 0.012); for (let i = 0; i < 3; i++) B.box(M.cloth[[3, 5, 4][i]], 0.02, 0.8, 0.6, 4.5, 2.0, 0.8 - i * 0.8);
  B.cyl(M.brick, 0.34, 0.26, 0.6, 1.2, 0.3, -1.1, 12); B.cyl(M.win, 0.3, 0.3, 0.02, 1.2, 0.57, -1.1, 12); B.box(M.wood, 0.36, 0.05, 0.3, -2.6, 0.4, 1.1); for (const k of [-1, 1]) B.box(M.woodD, 0.04, 0.4, 0.28, -2.6 + k * 0.15, 0.2, 1.1);
  B.box(M.wood, 1.5, 0.06, 0.4, 8.4, 0.44, 6.5); for (const k of [-1, 1]) B.box(M.damp, 0.12, 0.44, 0.4, 8.4 + k * 0.6, 0.22, 6.5);
  for (const k of [-1, 1]) B.box(M.woodD, 0.14, 2.3, 0.14, 11.8 + k * 1.1, 1.15, 6.6); B.box(M.woodD, 2.6, 0.12, 0.2, 11.8, 2.3, 6.6);
  B.add(rs('board', 'teak', 2.06, 1.3, ink([['四四南村', 0.34, 0.36, LI, '#f3e6c6', 800, 0.5, 6], ['信義公民會館', 0.13, 0.7, KAI, '#f3e6c6', 700, 0.5, 8], ['Xinyi Public Assembly Hall', 0.08, 0.86, HEI, '#e8d8b4', 600]], { carve: true }), { both: true, d: 0.1 }), 11.8, 1.55, 6.6);   // a carved timber name board, light letters cut into dark wood
  B.sph(M.grass, 2.6, 13.2, 0, -3.4, 1, 0.34, 1); B.box(M.wood, 1.4, 0.06, 0.4, 12.6, 0.44, -0.4, 0.5); B.box(M.damp, 0.8, 0.44, 0.3, 12.6, 0.22, -0.4, 0.5);
  out.village = B.done(-26, -43.25, 0);
  solid(-26, -39.5, 10.35, 2.6); solid(-14.2, -36.65, 1.4, 0.25);
  PLACES.add(E, P('four-four-south-village'), { target: out.village, radius: 2.5, plaque: { position: [-12.9, 2.0, -36.55], rotation: 0 } }); }

// ══ 7. Taipei 101: the entrance on its podium, coins and a ruyi over the doors ═══════════════════════════
{ const B = maker('entrance-101'), x = 13, z = -44.3;
  for (const k of [-1, 1]) B.box(M.stone, 1.1, 7.2, 1.0, x + k * 4.6, 3.6, z); B.box(M.stone, 10.3, 1.5, 1.0, x, 7.2, z); B.box(M.silver, 10.7, 0.2, 1.3, x, 8.05, z);
  B.add(plane(8.1, 5.2, shop(6, '#fff2d4')), x, 2.75, z + 0.38); for (let i = 0; i <= 6; i++) B.box(M.steel, 0.08, 5.3, 0.1, x - 4.05 + i * 1.35, 2.7, z + 0.42); B.box(M.steel, 8.2, 0.1, 0.1, x, 2.5, z + 0.42);
  B.box(M.pane, 9.4, 0.1, 3.0, x, 5.55, z + 2.0); B.box(M.steel, 9.5, 0.14, 0.14, x, 5.5, z + 3.5); for (const k of [-1, 1]) { B.cyl(M.steel, 0.09, 0.09, 5.5, x + k * 4.5, 2.75, z + 3.4, 10); B.rod(M.steel, [x + k * 4.5, 5.5, z + 3.4], [x + k * 4.5, 7.4, z + 0.5], 0.03); solid(x + k * 4.5, z + 3.4, 0.1, 0.1); }
  B.add(chan([['TAIPEI 101', 0.72, 0.54, HEI, '#e9edf0', 700, 0.5, 26]], 8.2, 0.95, { side: '#7d858c', depth: 0.1, glow: 0.55, metal: 0.5 }), x, 7.35, z + 0.62);   // brushed-metal letters fixed to the stone lintel
  for (let i = -1; i <= 1; i++) { B.cyl(M.gold, 0.62, 0.62, 0.14, x + i * 1.5, 9.2, z + 0.25, 28, PI / 2); B.cyl(M.gold, 0.66, 0.66, 0.06, x + i * 1.5, 9.2, z + 0.25, 28, PI / 2); B.box(M.dark, 0.34, 0.34, 0.18, x + i * 1.5, 9.2, z + 0.25); }   // three old coins with square holes
  // a ruyi (the curled cloud-head) in silver above the coins
  { const tor = (r, cx, cy, a0, arc) => { const g = new T.TorusGeometry(r, 0.09, 6, 22, arc); B.geo(M.silver, g, x + cx, cy, z + 0.3, 0, 0, a0); };
    tor(0.55, 0, 11.0, -0.4, PI + 0.8); tor(0.34, -0.86, 10.75, 0.4, PI * 1.5); tor(0.34, 0.86, 10.75, PI * 1.1, PI * 1.5); B.box(M.silver, 0.16, 0.7, 0.16, x, 10.2, z + 0.3); }
  for (const k of [-1, 1]) { B.box(M.stone, 1.5, 0.6, 1.5, x + k * 6.2, 0.3, z + 1.3); B.sph(M.leaf, 0.7, x + k * 6.2, 1.1, z + 1.3, 1, 0.9, 1); solid(x + k * 6.2, z + 1.3, 0.75, 0.75); }
  out.entrance = B.done(0, 0, 0);
  PLACES.add(E, P('taipei-101'), { target: [find('tower101'), out.entrance], near: [13, -40.5], radius: 6.5, plaque: { position: [8.4, 1.6, -43.75], rotation: 0 } }); }

// ══ 8. LOVE: four block capitals in a 2 x 2 grid, red faces and gold sides, on a low plinth ═══════════════
{ const B = maker('love'), U = 1.25, gap = 0.08, dep = 0.7, gold = new T.MeshStandardMaterial({ color: new T.Color('#d8a730').convertSRGBToLinear(), roughness: 0.3, metalness: 0.7 }), red = new T.MeshStandardMaterial({ color: new T.Color('#d1232c').convertSRGBToLinear(), roughness: 0.35, emissive: new T.Color('#3a0508').convertSRGBToLinear() });
  const poly = pts => { const s = new T.Shape(); pts.forEach(([a, b], i) => i ? s.lineTo(a, b) : s.moveTo(a, b)); s.closePath(); return s; };
  const O = new T.Shape(); O.absellipse(0.5, 0.5, 0.5, 0.5, 0, PI * 2); const hole = new T.Path(); hole.absellipse(0.5, 0.5, 0.2, 0.27, 0, PI * 2, true); O.holes.push(hole);
  const letters = [[poly([[0, 0], [1, 0], [1, 0.32], [0.38, 0.32], [0.38, 1], [0, 1]]), 0, 1], [O, 1, 1], [poly([[0, 1], [0.36, 1], [0.5, 0.42], [0.64, 1], [1, 1], [0.66, 0], [0.34, 0]]), 0, 0], [poly([[0, 0], [1, 0], [1, 0.26], [0.38, 0.26], [0.38, 0.38], [0.86, 0.38], [0.86, 0.62], [0.38, 0.62], [0.38, 0.74], [1, 0.74], [1, 1], [0, 1]]), 1, 0]];
  letters.forEach(([sh, cx, cy]) => { const m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: dep / U, bevelEnabled: false, curveSegments: 20 }), [red, gold]); m.scale.setScalar(U); m.castShadow = m.receiveShadow = true; B.add(m, -U - gap / 2 + cx * (U + gap), 0.42 + cy * (U + gap), -dep / 2); });
  B.box(M.stone, 3.5, 0.3, 1.6, 0, 0.15, 0); B.box(M.dark, 3.1, 0.12, 1.2, 0, 0.36, 0); for (const k of [-1, 1]) B.box(M.warm, 0.3, 0.04, 0.08, k * 1.0, 0.33, 0.78);
  // the queue for a photo: three plain figures and one holding up a phone
  person(B, 1.4, 0, 3.2, { top: M.cloth[2], ry: PI, arms: [[0.05, 0.02, 0.3], [-0.05, 0.02, 0.3]] }); B.box(M.dark, 0.16, 0.09, 0.02, 1.4, 1.34, 2.86);
  person(B, 2.9, 0, 2.6, { top: M.cloth[4], ry: PI * 0.9, s: 0.95 }); person(B, 3.5, 0, 2.9, { top: M.cloth[5], ry: PI * 0.8, s: 0.7 });
  out.love = B.done(-8.5, -41.2, 0); solid(-8.5, -41.2, 1.85, 0.9);
  PLACES.add(E, P('love-sculpture'), { target: out.love, near: [-8.5, -39.2], radius: 3.5, plaque: { position: [-6.55, 0.75, -40.35], rotation: 0, size: 0.16 } }); }

// ══ 9. the tuned mass damper, shown in an open pavilion at the tower's foot: a gold ball of stacked plates, hung ══
{ const B = maker('damper'), Rb = 1.05, cy = 2.25;
  B.cyl(M.stone, 2.3, 2.4, 0.3, 0, 0.15, 0, 28); B.cyl(M.dark, 1.9, 1.9, 0.08, 0, 0.34, 0, 28);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.52; B.cyl(M.steel, 0.07, 0.07, 4.3, Math.cos(a) * 2.05, 2.45, Math.sin(a) * 2.05, 8); }
  B.geo(M.dark, new T.TorusGeometry(2.05, 0.12, 8, 36), 0, 4.6, 0, PI / 2); for (let i = 0; i < 3; i++) B.box(M.dark, 4.1, 0.12, 0.14, 0, 4.6, 0, i * PI / 3); B.cyl(M.dark, 0.5, 0.5, 0.3, 0, 4.6, 0, 12); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; B.sph(M.warm, 0.09, Math.cos(a) * 1.9, 4.42, Math.sin(a) * 1.9); }
  B.geo(M.steel, new T.TorusGeometry(1.2, 0.07, 8, 36), 0, 0.95, 0, PI / 2);                                                 // the bumper ring under the ball
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; B.rod(M.steel, [Math.cos(a) * 1.75, 0.4, Math.sin(a) * 1.75], [Math.cos(a) * 0.62, cy - 0.82, Math.sin(a) * 0.62], 0.055); B.rod(M.silver, [Math.cos(a) * 1.3, 0.75, Math.sin(a) * 1.3], [Math.cos(a) * 0.62, cy - 0.82, Math.sin(a) * 0.62], 0.03); B.sph(M.dark, 0.1, Math.cos(a) * 1.75, 0.42, Math.sin(a) * 1.75); }   // eight piston arms
  const Pn = maker('damper-ball'), N = 21;                                                                                   // the pendulum: plates, the cradle of cables
  for (let i = 0; i < N; i++) { const y = -Rb + (i + 0.5) * 2 * Rb / N, r = Math.sqrt(Math.max(0.02, Rb * Rb - y * y)); Pn.cyl(M.gold, r, r, 2 * Rb / N * 0.8, 0, y - (4.6 - cy), 0, 28); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.39, c = Math.cos(a), s = Math.sin(a); Pn.rod(M.steel, [c * 0.3, 0, s * 0.3], [c * Rb * 1.0, -(4.6 - cy), s * Rb * 1.0], 0.022); Pn.rod(M.steel, [c * Rb, -(4.6 - cy), s * Rb], [c * 0.55, -(4.6 - cy) - Rb * 0.86, s * 0.55], 0.022); }
  const pend = Pn.done(0, 0, 0, B.g, 4.6); pend.children[0].onBeforeRender = () => { const t = uTime.value; pend.rotation.z = Math.sin(t * 0.8) * 0.03; pend.rotation.x = Math.sin(t * 0.57 + 1) * 0.02; };
  B.add(rs('plate', 'brass', 1.5, 0.95, ink([['風阻尼器', 0.28, 0.26, KAI, '#2a1c0c', 800, 0.5, 8], ['TUNED MASS DAMPER', 0.12, 0.52, HEI, '#2a1c0c', 700, 0.5, 4], ['660 t · 5.5 m · 87–92F', 0.12, 0.76, HEI, '#3a2a14', 600]], { carve: true, rule: '#3a2a14' }), { both: true, d: 0.03, glow: 0.3 }), 1.75, 1.15, 1.75, 0.6);   // an etched brass plaque
  B.box(M.dark, 0.08, 0.7, 0.08, 1.75, 0.35, 1.75);
  out.damper = B.done(21.5, -40.9, 0); solid(21.5, -40.9, 2.2, 2.2);
  PLACES.add(E, P('taipei-101-damper'), { target: out.damper, near: [21.5, -38], radius: 3.5, plaque: { position: [21.5, 1.3, -38.76], rotation: 0, size: 0.16 } }); }

// ══ 10. 象山: the hill beyond the east end of the forecourt (stairs, the six rocks, a deck, a pavilion), and the trailhead ══
{ const C = new T.Vector3(172, -6, -96), Rx = 84, Ry = 54, Rz = 104, f = (x, y, z) => 1 + 0.11 * Math.sin(x * 2.3 + 0.5) * Math.cos(z * 2.9 + 0.4) + 0.06 * Math.sin(x * 9 + 1) * Math.sin(z * 8 + 2) + 0.03 * Math.sin(y * 14 + x * 11);   // a ridge, longer than it is tall, with a shoulder
  const on = (th, ph, k) => { const x = Math.cos(th) * Math.cos(ph), y = Math.sin(th), z = Math.cos(th) * Math.sin(ph), s = f(x, y, z) * (k || 1); return new T.Vector3(C.x + x * Rx * s, C.y + y * Ry * s, C.z + z * Rz * s); };
  const sg = new T.SphereGeometry(1, 56, 22, 0, PI * 2, 0, PI * 0.56), p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), s = f(x, y, z); p.setXYZ(i, x * Rx * s, y * Ry * s, z * Rz * s); } sg.computeVertexNormals();
  const hill = new T.Mesh(sg, M.hill); hill.position.copy(C); hill.receiveShadow = true; hill.name = 'xiangshan'; scene.add(hill);
  const tufts = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), M.hill, 1800), d = new T.Object3D(), cl = new T.Color();                // tree crowns, so the outline is a forest's and not a ball's
  for (let i = 0; i < 1800; i++) { const q = on(Math.asin(rr(0.01, 0.995)), rr(1.2, 4.6), 0.992); d.position.copy(q); const ts = rr(1.5, 2.9); d.scale.set(ts, ts * rr(0.55, 0.8), ts); d.rotation.set(rr(0, 3), rr(0, 3), 0); d.updateMatrix(); tufts.setMatrixAt(i, d.matrix); cl.setHSL(rr(0.22, 0.34), rr(0.35, 0.6), rr(0.3, 0.75)); tufts.setColorAt(i, cl); }
  tufts.frustumCulled = false; scene.add(tufts);
  const B = maker('xiangshan-trail'), ph0 = 2.72, path = t => on(0.1 + t * 0.92, ph0 + 0.26 * Math.sin(t * PI * 5) * (1 - t * 0.5), 1.035);
  for (let i = 0; i < 90; i++) { const a = path(i / 90), b = path((i + 1) / 90), ry = Math.atan2(b.x - a.x, b.z - a.z), len = a.distanceTo(b), nT = 4, sx = Math.cos(ry), sz = -Math.sin(ry);
    for (let k = 0; k < nT; k++) { const u = (k + 0.5) / nT; B.box(M.pale, 2.6, 0.45, len / nT + 0.12, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * (k + 1) / nT - 0.2, a.z + (b.z - a.z) * u, ry); }                       // flat treads, each a riser higher: steps, not a ramp
    for (const k of [-1, 1]) { B.rod(M.steel, [a.x + sx * k * 1.3, a.y + 1.5, a.z + sz * k * 1.3], [b.x + sx * k * 1.3, b.y + 1.5, b.z + sz * k * 1.3], 0.09); B.box(M.steel, 0.14, 1.6, 0.14, a.x + sx * k * 1.3, a.y + 0.75, a.z + sz * k * 1.3); }   // a metal handrail and its posts on both sides
    if (i % 9 === 4) B.sph(M.warm, 0.45, a.x, a.y + 2.2, a.z); }
  { const q = on(0.62, ph0 + 0.1, 1.05), ry = Math.atan2(q.x - C.x, q.z - C.z);                                              // the deck and the six rocks
    B.box(M.wood, 11, 0.5, 7, q.x, q.y, q.z, ry); B.box(M.woodD, 11, 0.12, 0.12, q.x + Math.sin(ry) * 3.4, q.y + 1.5, q.z + Math.cos(ry) * 3.4, ry); for (let i = 0; i < 6; i++) B.box(M.woodD, 0.14, 6, 0.14, q.x + Math.sin(ry) * 3.4 + Math.cos(ry) * (i - 2.5) * 2.1, q.y - 1.6, q.z + Math.cos(ry) * 3.4 - Math.sin(ry) * (i - 2.5) * 2.1);
    for (let i = 0; i < 6; i++) { const r = on(0.5 + (i % 3) * 0.035, ph0 - 0.2 - (i % 2) * 0.07 - i * 0.012, 1.04); B.geo(M.rock, new T.DodecahedronGeometry(2.6 + (i % 3) * 0.6, 1), r.x, r.y, r.z, i, i * 2, 0, 1, 0.85, 1.1); } }
  { const q = on(1.12, ph0, 1.03); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.cyl(M.woodD, 0.14, 0.14, 4, q.x + a * 1.7, q.y + 2, q.z + b * 1.7, 6); B.cyl(M.tile, 0.2, 3.4, 1.8, q.x, q.y + 4.9, q.z, 4, 0, PI / 4); B.sph(M.warm, 0.4, q.x, q.y + 3.2, q.z); }   // the small pavilion near the top
  const trail = B.done(0, 0, 0); trail.children.forEach(m => { m.frustumCulled = false; });
  // the trailhead on the forecourt: a timber fingerpost, the first stone steps with a rail, two sandstone boulders
  const H = maker('xiangshan-head');
  for (let i = 0; i < 4; i++) H.box(M.stone, 2.0, 0.2, 0.5, 0.6, 0.1 + i * 0.2, -0.3 - i * 0.45); H.rod(M.steel, [1.65, 0.9, 0.1], [1.65, 1.65, -1.8], 0.03); for (const z of [0.1, -1.8]) H.cyl(M.steel, 0.03, 0.03, z ? 1.65 : 0.9, 1.65, (z ? 1.65 : 0.9) / 2, z, 6);
  H.geo(M.rock, new T.DodecahedronGeometry(0.75, 1), -1.0, 0.5, -0.9, 0.4, 1, 0, 1.2, 0.85, 1); H.geo(M.rock, new T.DodecahedronGeometry(0.5, 1), -0.5, 0.35, 0.1, 1, 2, 0); H.sph(M.leaf, 0.5, 1.3, 0.3, -2.0, 1.4, 0.8, 1); H.sph(M.leaf, 0.6, -0.2, 0.4, -2.1, 1.5, 0.9, 1);
  H.cyl(M.woodD, 0.07, 0.08, 2.9, -1.4, 1.45, 0.5, 8);
  H.add(rs('board', 'teak', 2.3, 0.8, ink([['象山親山步道  →', 0.4, 0.34, KAI, '#fff4d8', 800, 0.5, 6], ['Xiangshan Hiking Trail · 六巨石 Six Giant Rocks', 0.14, 0.75, HEI, '#f3e6c6', 600]], { carve: true }), { both: true, d: 0.08 }), -0.45, 2.4, 0.63);   // a timber fingerpost arm, the letters routed and painted cream
  H.add(rs('board', 'teak', 1.9, 0.32, ink([['往山頂 約 20 分鐘 · 20 min to the top', 0.5, 0.54, HEI, '#fff4d8', 700]], { carve: true }), { both: true, d: 0.06 }), -0.6, 1.75, 0.62);
  out.trailhead = H.done(33.6, -41.4, 0); solid(33.6, -41.9, 1.9, 1.5);
  PLACES.add(E, P('xiangshan'), { target: [out.trailhead, hill, trail], near: [33.4, -39.2], radius: 4, plaque: { position: [32.2, 1.15, -40.8], rotation: 0, size: 0.16 } }); }

// ══ 11. the skywalk, 新光三越 A11 and 香堤大道's street performer: existing models made clickable, with what they lacked ══
{ const B = maker('wayfinding');                                                                                       // a wayfinding pylon at the foot of the east stair
  B.box(M.dark, 0.7, 2.6, 0.18, 0, 1.3, 0); B.box(M.steel, 0.9, 0.08, 0.3, 0, 0.04, 0); B.box(M.white, 0.7, 0.05, 0.19, 0, 2.62, 0);
  { const L = ink([['空橋 SKYWALK ↑', 0.05, 0.1, HEI, '#ffd9a0', 800], ['台北101 Taipei 101  ↑', 0.036, 0.3, HEI, '#eef2f8', 600], ['新光三越 A11 · A9 · A8 · A4  ←', 0.036, 0.44, HEI, '#eef2f8', 600], ['威秀影城 Vieshow  ←', 0.036, 0.58, HEI, '#eef2f8', 600], ['ATT 4 FUN · 微風南山  →', 0.036, 0.72, HEI, '#eef2f8', 600], ['市府轉運站 Bus Station  ↓', 0.036, 0.86, HEI, '#eef2f8', 600]], { fill: 'rgba(26,30,38,.92)', draw: (g, W, H) => { g.fillStyle = '#ffd9a0'; g.fillRect(0, H * 0.19, W, H * 0.008); } });
    B.add(rs('box', 'lightbox', 0.66, 2.3, L, { both: true, d: 0.2, glow: 0.7, ppm: 420 }), 0, 1.38, 0); }   // a backlit wayfinding pylon, lettered both sides
  out.pylon = B.done(4.7, 5.0, 0.25); solid(4.7, 5.0, 0.4, 0.2);
  const sk = scene.children.filter(c => c.name === 'crossing' || c.name === 'segment');
  PLACES.add(E, P('xinyi-skywalk'), { target: sk.concat([out.pylon]), near: [4.7, 6.2], radius: 3.5, plaque: { position: [4.52, 2.95, 5.2], rotation: 0.25, size: 0.16 } });
  // A11: its building code high on the front, two tall banners, and the busker's circle on 香堤大道
  const A = maker('a11-dress');
  A.add(chan([['A11', 0.8, 0.54, HEI, '#ffffff', 900, 0.5, 10]], 4.2, 2.2, { side: '#8a8f96', depth: 0.2 }), -18.7, 29.5, 4, PI / 2);
  A.add(chan([['新光三越', 0.6, 0.4, HEI, '#e8202a', 900, 0.5, 30], ['SHIN KONG MITSUKOSHI', 0.2, 0.84, HEI, '#e8202a', 700, 0.5, 10]], 7.2, 1.9, { side: '#7a0c12', depth: 0.18, race: true, raceH: 0.06, raceY: 0.12, glow: 1.1 }), -18.65, 26.2, 4, PI / 2);   // the store's red name in channel letters (no logo mark)
  [[-2.3, '週年慶', 'ANNIVERSARY SALE', 350], [10.4, '冬季美妝', 'WINTER BEAUTY', 300]].forEach(([z, a, b, h]) => { A.box(M.dark, 0.14, 8.4, 2.5, -18.8, 14.2, z); A.add(poster(2.3, 8.2, a, b, h, 0.65), -18.72, 14.2, z, PI / 2); });
  A.done(0, 0, 0);
  const S = maker('busker');
  S.geo(M.warm, new T.RingGeometry(1.75, 1.8, 40), 0, 0.03, 0, -PI / 2); S.box(M.dark, 1.0, 0.02, 0.6, 0, 0.03, 0.9);
  person(S, 0, 0, 0, { top: M.cloth[0], ry: 0, arms: [[0.3, -0.3, 0.22], [-0.16, -0.36, 0.26]] });                                     // the performer, a guitar across the body
  S.box(M.wood, 0.36, 0.44, 0.1, 0.04, 1.0, 0.24, 0, 0, 0.5); S.cyl(M.dark, 0.09, 0.09, 0.11, 0.04, 1.0, 0.25, 12, PI / 2); S.rod(M.woodD, [0.1, 1.08, 0.24], [-0.52, 1.44, 0.22], 0.025);
  S.cyl(M.steel, 0.012, 0.012, 1.5, -0.1, 0.75, 0.45, 6); S.sph(M.dark, 0.045, -0.1, 1.5, 0.43); S.cyl(M.steel, 0.16, 0.16, 0.02, -0.1, 0.01, 0.45, 10);
  S.box(M.dark, 0.5, 0.46, 0.3, 0.9, 0.23, -0.2, 0.3); S.box(M.char, 0.4, 0.34, 0.02, 0.86, 0.25, -0.04, 0.3); S.box(M.woodD, 0.9, 0.08, 0.34, -0.55, 0.04, 1.0, 0.2); S.box(M.red, 0.84, 0.02, 0.28, -0.55, 0.085, 1.0, 0.2);
  for (let i = 0; i < 5; i++) S.cyl(M.gold, 0.02, 0.02, 0.01, -0.8 + i * 0.12, 0.1, 0.95 + (i % 2) * 0.08, 8);
  S.box(M.woodD, 0.04, 0.9, 0.04, 1.3, 0.45, 0.9); S.add(drawn(0.7, 0.5, 384, (g, W, H) => { g.fillStyle = '#1f2a24'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a6a44'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14);   // the busker's own chalkboard, chalk lettering
    g.globalAlpha = 0.08; g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) g.fillRect(rr(0, W), rr(0, H), rr(20, 90), 3); g.globalAlpha = 1;
    txt(g, '今晚', W * 0.22, H * 0.22, H * 0.13, { c: '#ffd24a', f: SERIF }); txt(g, '街頭演唱', W * 0.58, H * 0.4, H * 0.24, { c: '#f4efe4', w: 900, max: W * 0.7 });
    g.strokeStyle = '#ff8fa3'; g.lineWidth = 4; g.beginPath(); g.moveTo(W * 0.26, H * 0.55); g.quadraticCurveTo(W * 0.58, H * 0.62, W * 0.9, H * 0.53); g.stroke();
    g.strokeStyle = '#f4efe4'; g.lineWidth = 3; g.beginPath(); g.ellipse(W * 0.14, H * 0.66, W * 0.06, H * 0.1, 0, 0, PI * 2); g.ellipse(W * 0.14, H * 0.48, W * 0.045, H * 0.07, 0, 0, PI * 2); g.moveTo(W * 0.14, H * 0.41); g.lineTo(W * 0.14, H * 0.12); g.stroke();
    txt(g, 'LIVE · 19:00 – 21:30', W * 0.58, H * 0.7, H * 0.08, { c: '#9be7ff', track: 2 }); txt(g, '香堤大道 · 歡迎點歌 · 打賞隨意', W * 0.58, H * 0.86, H * 0.075, { c: '#f4efe4', w: 600, max: W * 0.66 }); }, { both: true, glow: 0.35 }), 1.3, 0.95, 0.9, -0.3);
  person(S, -1.3, 0, 2.3, { top: M.cloth[1], ry: PI * 0.85, s: 0.96 }); person(S, 0.3, 0, 2.6, { top: M.cloth[2], ry: PI, s: 1.02, arms: [[0.12, -0.2, 0.25], [-0.12, -0.2, 0.25]] }); person(S, 0.9, 0, 2.4, { top: M.cloth[4], ry: PI * 1.1, s: 0.68 });
  out.busker = S.done(5.4, 8.6, PI * 0.9); solid(5.4, 8.6, 0.6, 0.5); solid(5.3, 6.2, 1.1, 0.4);
  PLACES.add(E, P('skm-xinyi-place'), { target: [find('a11'), out.busker], near: [-16.4, 4], radius: 5.5, plaque: { position: [-18.5, 1.7, 9.6], rotation: PI / 2 } }); }

// ══ 12. 台北市政府: the model stands far off down the gap to the north-west; a board on the plaza points at it ══
// (its pointing board is a designed poster, built with the events below)
{ const B = maker('cityhall-model'), y0 = 0.9, H = 0.46, zc = -0.28;
  B.box(M.stone, 2.6, 0.8, 1.7, 0, 0.4, 0); B.box(M.dark, 2.72, 0.07, 1.82, 0, 0.835, 0); B.box(M.beige, 2.56, 0.03, 1.66, 0, 0.885, 0); B.box(M.stone, 2.8, 0.12, 1.9, 0, 0.06, 0);
  const bar = (w, d, x, z) => { B.box(M.pale, w, H, d, x, y0 + H / 2, z); for (let f = 1; f < 12; f++) B.box(M.win, w + 0.012, 0.016, d + 0.012, x, y0 + (f + 0.45) * H / 12.6, z);          // 12 storeys: eleven dark window bands and the door floor
    B.box(M.roof, w - 0.03, 0.012, d - 0.03, x, y0 + H + 0.006, z); };
  for (const cx of [-0.52, 0.52]) { bar(1.04, 0.3, cx, zc); bar(0.3, 0.92, cx, zc); B.box(M.stone, 0.2, 0.05, 0.2, cx, y0 + H + 0.03, zc); B.cyl(M.steel, 0.006, 0.006, 0.12, cx, y0 + H + 0.11, zc, 5); }   // two plus-signs side by side
  B.box(M.pale, 0.44, 0.11, 0.22, 0, y0 + 0.055, zc + 0.26); for (const k of [-1, 0, 1]) B.box(M.doors, 0.09, 0.07, 0.01, k * 0.13, y0 + 0.04, zc + 0.375); B.box(M.stone, 0.5, 0.012, 0.3, 0, y0 + 0.116, zc + 0.28);   // the central entrance and its canopy
  B.add(chan([['臺北市政府', 0.72, 0.54, KAI, '#d9b24a', 800, 0.5, 6]], 0.5, 0.07, { px: 512, side: '#5a4416', depth: 0.008, layers: 2, glow: 0.5, metal: 0.4 }), 0, y0 + 0.2, zc + 0.165);   // gilt letters over the doors, at model scale
  B.box(M.stone, 2.3, 0.008, 0.62, 0, y0 + 0.004, 0.45); for (let i = 0; i < 9; i++) { const x = -0.8 + i * 0.2; B.cyl(M.steel, 0.005, 0.005, 0.3, x, y0 + 0.15, 0.3, 5); B.box(i % 2 ? M.cloth[1] : M.red, 0.07, 0.045, 0.004, x + 0.04, y0 + 0.27, 0.3); }   // the paved plaza in front, a row of flagpoles
  for (let i = 0; i < 8; i++) for (const k of [-1, 1]) B.sph(M.leaf, 0.045, k * (1.12 - (i % 2) * 0.08), y0 + 0.05, -0.62 + i * 0.17, 1, 1.2, 1);
  for (let i = 0; i < 7; i++) B.sph(M.leaf, 0.04, -0.9 + i * 0.3, y0 + 0.045, 0.72, 1, 1.2, 1);
  B.add(drawn(1.9, 0.5, 1024, (g, W, H) => { g.fillStyle = '#efe9dc'; g.fillRect(0, 0, W, H); g.fillStyle = '#1d3a5c'; g.fillRect(0, 0, W * 0.24, H);   // an architecture-exhibition caption: plan drawing, number, name, scale bar
    const cx = W * 0.12, cy = H * 0.5, u = H * 0.09; g.strokeStyle = '#f2d98b'; g.lineWidth = 4; for (const k of [-1, 1]) { const x = cx + k * u * 1.7; g.strokeRect(x - u * 1.6, cy - u * 0.5, u * 3.2, u); g.strokeRect(x - u * 0.5, cy - u * 1.6, u, u * 3.2); }
    txt(g, '雙十字平面 · PLAN', cx, H * 0.88, H * 0.07, { c: '#f2d98b', w: 600 }); txt(g, 'No. 07', cx, H * 0.11, H * 0.08, { c: '#ffffff', track: 3 });
    txt(g, '臺北市政府', W * 0.27, H * 0.3, H * 0.3, { c: '#1d3a5c', f: SERIF, w: 900, a: 'left' }); txt(g, 'TAIPEI CITY HALL · SCALE MODEL', W * 0.275, H * 0.56, H * 0.075, { c: '#9c2a2a', a: 'left', track: 6 });
    txt(g, '1986 動工 — 1994 落成 · 地上 12 層 · 市民廣場在前', W * 0.275, H * 0.72, H * 0.075, { c: '#2a2420', w: 600, a: 'left' });
    g.fillStyle = '#c39a3e'; g.fillRect(W * 0.76, H * 0.12, W * 0.2, H * 0.42); txt(g, '1994', W * 0.86, H * 0.33, H * 0.22, { c: '#1d3a5c', f: SERIF, w: 900 });
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#efe9dc' : '#1d3a5c'; g.fillRect(W * 0.275 + i * W * 0.05, H * 0.86, W * 0.05, H * 0.035); } g.strokeStyle = '#1d3a5c'; g.lineWidth = 2; g.strokeRect(W * 0.275, H * 0.86, W * 0.25, H * 0.035);
    txt(g, '0     10     20     40 m', W * 0.4, H * 0.94, H * 0.045, { c: '#1d3a5c', w: 600 }); }, { glow: 0.3 }), 0, 0.45, 0.862);
  out.cityModel = B.done(-13.3, -11.0, PI / 2); solid(-13.3, -11.0, 0.95, 1.4);
  PLACES.add(E, P('taipei-city-hall'), { target: out.cityModel }); }

// ══ the events: each one a designed piece (design-kit.js), never a name plate ═══════════════════════════
// CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」.
// Each design below is argued, with its reference, in docs/signage/designs-xinyi.md. Neighbours never share form + layout.
// A painted artwork lands at asset/textures/posters/events/<key>.jpg and is picked up by the kit; until then the code-drawn poster shows.

// ── the forecourt, west of the entrance: the opening, the two climbs ──
// 2004.12.31, the opening: the tower in bronze on a stepped granite block, and in front of it the opening-day ribbon, cut, on two gold posts
PLACES.add(E, P('taipei-101-opening-2004'), { position: [-2.4, -41.7], rotation: 0, design: { form: 'statue', motif: 'tower', plinth: 'block', palette: 'award',
  head: '台北101 正式啟用', story: '508 公尺，世界第一高樓開幕的那一夜', en: 'TAIPEI 101 OPENS · 508 M · THE WORLD\'S TALLEST', date: '2004.12.31' } });
{ const B = maker('opening-ribbon'); for (const k of [-1, 1]) { B.cyl(M.gold, 0.035, 0.035, 0.95, k * 0.95, 0.475, 0, 10); B.sph(M.gold, 0.06, k * 0.95, 0.97, 0); B.cyl(M.gold, 0.13, 0.15, 0.04, k * 0.95, 0.02, 0, 14); }
  B.box(M.red, 0.62, 0.07, 0.012, -0.62, 0.86, 0, 0, 0, -0.32); B.box(M.red, 0.62, 0.07, 0.012, 0.62, 0.86, 0, 0, 0, 0.32);              // the ribbon, cut in the middle, its two ends hanging
  B.sph(M.red, 0.12, -0.95, 0.92, 0.03, 1, 0.8, 0.5); B.sph(M.red, 0.12, 0.95, 0.92, 0.03, 1, 0.8, 0.5);                                   // a rosette on each post
  B.box(M.silver, 0.24, 0.02, 0.05, 0.05, 0.62, 0.15, 0.4); B.box(M.dark, 0.08, 0.03, 0.05, -0.08, 0.62, 0.2, 0.4);                        // the scissors, left on the rope
  B.done(-2.4, -40.25, 0); }
// 2004.12.25, Alain Robert in the rain: a newspaper EXTRA in a lit case, the next morning's bundles tied with string at its foot
PLACES.add(E, P('alain-robert-climb-2004'), { position: [0.75, -41.7], rotation: 0, design: { form: 'poster', layout: 'news', mount: 'case', palette: 'news',
  head: '法國蜘蛛人 雨中攀上101', kicker: '號外', kicker2: '聖誕節', big: '4小時', en: 'SPIDERMAN IN THE RAIN · ROPED · 4 HOURS TO THE SPIRE', venue: '台北101 · 信義區', date: '2004.12.25' } });
{ const B = maker('news-bundles'), paper = triMat({ color: '#e6e1d4', tex: TEX.plaster, scale: 2, rough: 0.95 }), str = triMat({ color: '#a07a4a', rough: 0.9 });
  [[0, 0, 0.0], [0.05, 0.16, 0.25], [0.62, 0, -0.2]].forEach(([x, y, r]) => { B.box(paper, 0.46, 0.15, 0.32, x, 0.075 + y, 0, r); B.box(str, 0.47, 0.155, 0.015, x, 0.075 + y, 0, r); B.box(str, 0.015, 0.155, 0.33, x, 0.075 + y, 0, r); });
  B.add(drawn(0.42, 0.28, 256, (g, W, H) => { g.fillStyle = '#efeadf'; g.fillRect(0, 0, W, H); g.fillStyle = '#b3261e'; g.fillRect(0, 0, W * 0.3, H * 0.5); txt(g, '號外', W * 0.15, H * 0.25, H * 0.3, { c: '#fff', f: SERIF });
    txt(g, '蜘蛛人攻頂', W * 0.64, H * 0.24, H * 0.24, { c: '#1a1a1a', f: SERIF, w: 900, max: W * 0.62 }); for (let i = 0; i < 9; i++) { g.fillStyle = '#9a9a9a'; g.fillRect(W * 0.05 + (i % 3) * W * 0.31, H * 0.6 + ((i / 3) | 0) * H * 0.12, W * 0.27, H * 0.05); } }, { glow: 0.15 }), 0.62, 0.155, 0.17, -0.2).rotation.x = -PI / 2;
  B.done(1.35, -40.9, 0.15); }
// 2026.01.25, Alex Honnold, no rope: a small bronze climber on a drum, the life-size storey of the corner stands just east of it (below)
PLACES.add(E, P('alex-honnold-free-solo-2026'), { position: [4.0, -41.4], rotation: 0, design: { form: 'statue', motif: 'climber', plinth: 'drum', palette: 'sport',
  head: '無繩攀登101', story: '沒有繩子，一層一層往上，1:31:43', en: 'FREE SOLO · NO ROPE · 1 H 31 M 43 S', date: '2026.01.25' } });

// ── the forecourt, east, at the tower's foot: the stair race and the first fireworks ──
// 2005.11.20, the first Run Up: a bronze runner on the race podium, a chequered start line and a race clock on a pylon
PLACES.add(E, P('taipei-101-run-up-2005'), { position: [25.4, -41.6], rotation: 0, design: { form: 'statue', motif: 'runner', plinth: 'podium', palette: 'sport',
  head: '101 國際登高賽', story: '2,046 級台階，91 層，一口氣跑上去', en: 'TAIPEI 101 RUN UP · 2,046 STEPS · 91 FLOORS', date: '2005.11.20' } });
{ const B = maker('runup-start'); B.add(drawn(2.6, 0.4, 512, (g, W, H) => { const n = 26; for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) { g.fillStyle = (i + r) % 2 ? '#f4f1ea' : '#15171b'; g.fillRect(i * W / n, r * H / 2, W / n + 1, H / 2 + 1); } }, { glow: 0.2 }), 0, 0.012, 1.55).rotation.x = -PI / 2;
  B.box(M.dark, 0.32, 1.9, 0.32, 1.75, 0.95, 1.2); B.box(M.steel, 0.36, 0.06, 0.36, 1.75, 1.93, 1.2);
  B.add(drawn(0.3, 0.86, 256, (g, W, H) => { g.fillStyle = '#0d3b66'; g.fillRect(0, 0, W, H); g.fillStyle = '#f95738'; g.fillRect(0, 0, W, H * 0.16); txt(g, 'RUN UP', W / 2, H * 0.08, H * 0.07, { c: '#fff', track: 4 });
    g.fillStyle = '#050505'; g.fillRect(W * 0.08, H * 0.22, W * 0.84, H * 0.2); txt(g, '10:29', W / 2, H * 0.32, H * 0.13, { c: '#ff3b2f', f: MONO, w: 700 }); txt(g, '大會紀錄 RECORD', W / 2, H * 0.47, H * 0.045, { c: '#faf0ca' });
    for (let f = 0; f < 10; f++) { const y = H * (0.94 - f * 0.042); g.fillStyle = f % 2 ? '#ee964b' : '#faf0ca'; g.fillRect(W * 0.2, y, W * (0.1 + f * 0.05), H * 0.028); }
    txt(g, '91F', W * 0.82, H * 0.56, H * 0.06, { c: '#fff' }); txt(g, '1F', W * 0.82, H * 0.94, H * 0.05, { c: '#fff' }); }, { glow: 0.55 }), 1.75, 1.05, 1.365);
  B.done(25.4, -41.6, 0); solid(27.15, -40.4, 0.2, 0.2); }
// 2005.01.01 00:00, the first fireworks: the year in bulbs, three bursts on rods above it, and the countdown clock stopped at 00:00
PLACES.add(E, P('first-nye-fireworks-2005'), { position: [29.6, -41.6], rotation: 0, design: { form: 'installation', piece: 'digits', big: '2005', palette: 'countdown',
  head: '第一場 101 跨年煙火', kicker: 'COUNTDOWN', en: 'FIRST TAIPEI 101 NEW YEAR FIREWORKS · 00:00', date: '2005.01.01' } });
{ const B = maker('fireworks-bursts'), C = [GLOW(3.4, 0.9, 1.9), GLOW(0.9, 2.8, 3.4), GLOW(3.6, 2.8, 0.9)];
  [[-1.6, 3.3, 0.55, 3], [0.2, 3.7, 0.7, 1], [1.8, 3.2, 0.5, 2]].forEach(([x, y, r, c], i) => { B.cyl(M.dark, 0.012, 0.012, y - 2.3, x, 2.3 + (y - 2.3) / 2, -0.25, 5); burst(B, C[i], x, y, -0.25, r, 14 + i * 2); });
  B.box(M.dark, 0.9, 0.42, 0.14, 0, 2.95, -0.32); B.add(drawn(0.84, 0.36, 256, (g, W, H) => { g.fillStyle = '#050818'; g.fillRect(0, 0, W, H); txt(g, '00:00', W / 2, H * 0.48, H * 0.62, { c: '#ff3d7f', f: MONO, w: 700 }); txt(g, '2004 → 2005', W / 2, H * 0.9, H * 0.12, { c: '#3ddcff' }); }, { glow: 1.2 }), 0, 2.95, -0.245);
  B.done(29.6, -41.6, 0); }

// ── 信義威秀's red carpets ──
// 2016.01.21: the premiere's carpet booth, with fans' placards and the crowd barrier added to the step-and-repeat and flashes
PLACES.add(E, P('deadpool-reynolds-2016'), { position: [-14.3, -7.9], rotation: PI / 2, design: { form: 'booth', booth: 'carpet', layout: 'premiere', palette: ['#1a0a0c', '#3a0a10', '#ffffff', '#c81d25', '#f3e2b0', '#111111'],
  head: '紅毯之夜', big: 'RED CARPET', kicker: 'PREMIERE', kicker2: '01.21', venue: '信義威秀', en: 'RYAN REYNOLDS ON THE CARPET · VIESHOW XINYI', date: '2016.01.21', props: ['placards', 'barrier'] } });
// 2024.09.01, Weekend in Taipei: a pasted advertising column, the hand-painted cinema poster in a neon-noir palette, the morning paper beside it
PLACES.add(E, P('weekend-in-taipei-2024'), { position: [-14.9, -14.3], rotation: PI / 2, design: { form: 'poster', layout: 'painted', mount: 'column', layouts: ['painted', 'news', 'painted'],
  palette: ['#0d1b2a', '#1b263b', '#fff4d6', '#ff2e63', '#00d1c1', '#f1c453'], head: '台北追緝令', big: '台北追緝令', kicker: 'WORLD PREMIERE', venue: '信義威秀 · 世界首映', en: 'WEEKEND IN TAIPEI · WORLD PREMIERE', date: '2024.09.01' } });

// ── 市府前廣場: the countdown party, the parade, the board that points at City Hall ──
// 2019.12.31, 最HIGH新年城: a small stage with its LED screen, speakers and a sea of light sticks, set like the real stage in front of City Hall
PLACES.add(E, P('taipei-nye-party-2020'), { position: [-8.4, -18.4], rotation: 0.35, design: { form: 'booth', booth: 'stage', mount: null, layouts: null, layout: 'countdown', palette: 'countdown',
  head: '臺北最HIGH新年城', big: '2020', kicker: 'COUNTDOWN PARTY', kicker2: '12.31', venue: '市府前廣場', en: 'TAIPEI NEW YEAR\'S EVE PARTY · CITY HALL PLAZA', date: '2019.12.31' } });
// 2024.10.26, Pride: rainbow umbrellas hung over the plaza, and under them the long six-stripe flag carried by a line of marchers
PLACES.add(E, P('taiwan-pride-city-hall-2024'), { position: [-16.0, -20.6], rotation: 0.35, design: { form: 'installation', piece: 'canopy', obj: 'umbrella', layout: 'street', palette: 'rainbow', motif: 'rainbow',
  head: '臺灣同志遊行', big: '彩虹', kicker: 'TAIWAN PRIDE', en: 'TAIWAN PRIDE · FROM CITY HALL PLAZA · 180,000 MARCHING', date: '2024.10.26' } });
{ const B = maker('pride-flag'), S6 = ['#e2342c', '#f08a24', '#f4d23c', '#3a9a4a', '#2a6ac0', '#7a3a9a'].map(c => triMat({ color: c, rough: 0.85, emissive: c, eI: 0.25 })), L = 4.6;
  for (let i = 0; i < 6; i++) for (let k = 0; k < 8; k++) { const x = -L / 2 + (k + 0.5) * L / 8, y = 1.95 - i * 0.075 + Math.sin(k * 1.3) * 0.05; B.box(S6[i], L / 8 + 0.01, 0.075, 0.012, x, y, Math.sin(k * 0.9) * 0.06); }
  [-2.0, -0.7, 0.6, 1.9].forEach((x, i) => { B.rod(M.steel, [x, 0.95, 0.12], [x, 2.02, 0.05], 0.012); person(B, x, 0, 0.32, { top: M.cloth[[5, 1, 0, 4][i]], ry: -0.1, s: 0.95 + (i % 2) * 0.05, arms: [[0.12, 0.35, -0.1], [-0.12, 0.35, -0.1]] }); });
  B.done(-15.2, -18.2, 0.35); solid(-15.2, -18.2, 2.4, 0.4); }
// 台北市政府: the board that points down the gap at the model, an architecture-exhibition poster on an A-frame
PLACES.add(E, P('taipei-city-hall'), { position: [-12.4, -16.2], rotation: 0.35, target: find('cityhall'), design: { form: 'poster', layout: 'deco', mount: 'standee',
  palette: ['#e9e4d6', '#1d3a5c', '#1d3a5c', '#c39a3e', '#2a6ac0', '#9c2a2a'], head: '臺北市政府', big: '1994', kicker: 'CITY HALL', kicker2: '市民廣場', en: 'TAIPEI CITY HALL & CITIZENS PLAZA · BUILT 1986 – 1994', venue: '信義計畫區 · 雙十字平面', date: '1986–1994' } });

// ── 香堤大道: 白晝之夜 2023, a tunnel of cut rings to walk through, a moon hung over its far end ──
PLACES.add(E, P('nuit-blanche-xinyi-2023'), { position: [-14.3, 1.6], rotation: PI / 2, design: { form: 'installation', piece: 'rings', layout: 'nightart', palette: 'nightart',
  head: '白晝之夜', big: '白晝之夜', kicker: 'NUIT BLANCHE TAIPEI', kicker2: '18:00→06:00', en: 'NUIT BLANCHE · XINYI · ALL NIGHT LONG', date: '2023.10.07' } });
{ const B = maker('nuit-moon'); B.cyl(M.dark, 0.02, 0.02, 1.8, 0, 3.6, 0, 5); B.sph(M.white, 0.55, 0, 4.4, 0, 1, 1, 0.25); B.sph(GLOW(0.9, 1.6, 2.6), 0.62, 0, 4.4, -0.03, 1, 1, 0.12);
  B.done(-16.0, 1.6, PI / 2); }

// ── the south end, either side of the gate ──
// 2019, Simple Life Urban+ at the fountain plaza: a canvas market tent with festoon lights, and the busker's guitar on a stand beside it
PLACES.add(E, P('simple-life-urban-2019'), { position: [6.4, 17.6], rotation: PI, design: { form: 'booth', booth: 'craft', layout: 'market', palette: ['#f3ede2', '#e6dccb', '#2f4f4f', '#c65d3b', '#e8b04b', '#2f6b3a'],
  head: '簡單生活節', big: 'URBAN+', kicker: 'SIMPLE LIFE', kicker2: '2019', venue: '台北101 噴水池廣場', en: 'SIMPLE LIFE FESTIVAL · URBAN+ · NINE DAYS', date: '2019.11.30–12.08', props: ['books'] } });
{ const B = maker('simple-guitar'), body = triMat({ color: '#c9893a', tex: TEX.bark, scale: 3, rough: 0.45 });
  B.sph(body, 0.2, 0, 0.42, 0, 1, 1.15, 0.28); B.sph(body, 0.16, 0, 0.7, 0, 1, 1, 0.28); B.cyl(M.dark, 0.06, 0.06, 0.02, 0, 0.5, 0.06, 14, PI / 2); B.box(M.woodD, 0.06, 0.5, 0.04, 0, 1.05, 0); B.box(M.woodD, 0.09, 0.14, 0.05, 0, 1.36, 0);
  B.rod(M.dark, [-0.18, 0, -0.12], [0, 0.4, -0.08], 0.012); B.rod(M.dark, [0.18, 0, -0.12], [0, 0.4, -0.08], 0.012); B.rod(M.dark, [0, 0, 0.18], [0, 0.4, -0.08], 0.012);
  B.done(3.9, 17.9, PI + 0.3); }
// 2023.12.24, Eslite Xinyi's last night: an arch of books, a reading lamp still lit, a clock stopped at 22:30
PLACES.add(E, P('eslite-xinyi-last-night-2023'), { position: [-6.3, 17.6], rotation: PI, design: { form: 'installation', piece: 'books', palette: 'memory',
  head: '誠品信義 最後一夜', big: '22:30', kicker: 'LAST NIGHT', en: 'ESLITE XINYI · 2006.01.01 – 2023.12.24 · LIGHTS OUT 22:30', date: '2023.12.24' } });
{ const B = maker('eslite-lamp'); B.cyl(M.dark, 0.16, 0.18, 0.03, 0, 0.015, 0, 16); B.cyl(M.dark, 0.015, 0.015, 1.45, 0, 0.74, 0, 6); B.rod(M.dark, [0, 1.45, 0], [0.3, 1.58, 0], 0.012);
  B.cyl(triMat({ color: '#2f5a3a', rough: 0.5 }), 0.06, 0.16, 0.14, 0.32, 1.52, 0, 16); B.sph(M.warm, 0.07, 0.32, 1.45, 0);
  B.cyl(M.woodD, 0.2, 0.2, 0.05, 0, 1.92, 0.0, 24, PI / 2); B.add(drawn(0.34, 0.34, 256, (g, W, H) => { g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.48, 0, PI * 2); g.fill();
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.fillStyle = '#3b2a1a'; g.fillRect(W / 2 + Math.cos(a) * W * 0.4 - 3, H / 2 + Math.sin(a) * H * 0.4 - 3, 6, 6); }
    g.strokeStyle = '#3b2a1a'; g.lineCap = 'round'; g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + Math.cos(-PI / 2 + 10.5 / 12 * PI * 2) * W * 0.22, H / 2 + Math.sin(-PI / 2 + 10.5 / 12 * PI * 2) * H * 0.22); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2, H / 2 + H * 0.34); g.stroke(); txt(g, '22:30', W / 2, H * 0.3, H * 0.09, { c: '#9a3b26', f: SERIF }); }, { glow: 0.5, bg: null }), 0, 1.92, 0.03);
  B.done(-3.7, 17.9, PI); solid(-3.7, 17.9, 0.25, 0.25); }
// the 2026 climb, life size: one storey of a flared corner of the tower with a plain figure on it, no rope
{ const B = maker('climb-slice'), h = 3.4, rb = 1.2, rt = 1.62;
  B.box(M.stone, 2.8, 0.3, 2.8, 0, 0.15, 0); B.cyl(M.g101, rt, rb, h, 0, 0.3 + h / 2, 0, 4, 0, PI / 4);
  const hw = y => (rb + (rt - rb) * y / h) * Math.SQRT1_2;
  for (let i = 0; i <= 8; i++) { const y = i * h / 8, w = hw(y) * 2 + 0.06; B.box(M.silver, w, 0.05, w, 0, 0.3 + y, 0); }
  for (let i = -2; i <= 2; i++) for (const s of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const a = [s[0] ? s[0] * hw(0) : i * hw(0) / 2.5, 0.3, s[1] ? s[1] * hw(0) : i * hw(0) / 2.5], b = [s[0] ? s[0] * hw(h) : i * hw(h) / 2.5, 0.3 + h, s[1] ? s[1] * hw(h) : i * hw(h) / 2.5]; B.rod(M.silver, a, b, 0.022); }
  B.box(M.silver, hw(h) * 2 + 0.5, 0.16, hw(h) * 2 + 0.5, 0, 0.3 + h + 0.08, 0); B.box(M.g101, hw(h) * 2 - 0.5, 0.5, hw(h) * 2 - 0.5, 0, 0.3 + h + 0.4, 0);
  for (const [a, b] of [[1, 1], [-1, 1]]) { B.geo(M.silver, new T.TorusGeometry(0.26, 0.06, 6, 16, PI * 1.5), a * (hw(h) + 0.3), 0.3 + h - 0.1, b * (hw(h) + 0.3), 0, a > 0 ? -PI / 4 : PI / 4, 0.6); }   // the ruyi-like corner ornaments
  // the figure: reaching up with one hand, a chalk bag at the waist
  { const y0 = 1.25, z0 = hw(1.7) + 0.13, tilt = Math.atan2(hw(h) - hw(0), h), F = maker('climber'), red = M.cloth[0];
    F.rod(red, [0, 0, 0], [0, 0.6, 0], 0.15); F.sph(M.skin, 0.115, 0, 0.78, 0); F.sph(M.dark, 0.12, 0, 0.82, 0.03, 1, 0.8, 1);
    F.rod(red, [-0.16, 0.55, 0], [-0.3, 1.12, -0.1], 0.045); F.rod(red, [0.16, 0.55, 0], [0.42, 0.72, -0.1], 0.045); F.rod(M.dark, [-0.08, 0, 0], [-0.3, -0.5, -0.08], 0.06); F.rod(M.dark, [-0.3, -0.5, -0.08], [-0.24, -0.86, -0.1], 0.05);
    F.rod(M.dark, [0.08, 0, 0], [0.26, -0.3, -0.06], 0.06); F.rod(M.dark, [0.26, -0.3, -0.06], [0.3, -0.72, -0.1], 0.05); F.box(M.pale, 0.14, 0.16, 0.1, 0, 0.02, 0.16);
    const fg = F.done(0.15, z0, 0, B.g, y0 + 0.3); fg.rotation.x = -tilt; }
  B.add(drawn(1.2, 0.5, 768, (g, W, H) => { g.fillStyle = '#121418'; g.fillRect(0, 0, W, H); g.fillStyle = '#c9a24a'; g.fillRect(0, 0, W * 0.012, H); g.fillRect(W * 0.988, 0, W * 0.012, H);   // a chronograph plate: the time in red LED, the climb as an altitude bar
    txt(g, 'FREE SOLO · 無繩攀登', W * 0.05, H * 0.15, H * 0.1, { c: '#c9a24a', a: 'left', track: 4 }); g.fillStyle = '#050505'; g.fillRect(W * 0.05, H * 0.27, W * 0.62, H * 0.44);
    g.shadowColor = '#ff2a1a'; g.shadowBlur = 18; txt(g, '1:31:43', W * 0.36, H * 0.5, H * 0.36, { c: '#ff3b2f', f: MONO, w: 700, max: W * 0.58 }); g.shadowBlur = 0;
    txt(g, '2026.01.25 · 508 M · NO ROPE', W * 0.05, H * 0.85, H * 0.085, { c: '#e8e2d4', a: 'left', w: 600, track: 2 });
    for (let f = 0; f <= 10; f++) { const y = H * (0.9 - f * 0.075); g.fillStyle = f === 10 ? '#ff3b2f' : '#3a3e46'; g.fillRect(W * 0.76, y, W * 0.1, H * 0.05); }
    g.fillStyle = '#c9a24a'; g.fillRect(W * 0.78, H * 0.12, W * 0.06, H * 0.78); txt(g, '101F', W * 0.93, H * 0.14, H * 0.08, { c: '#fff' }); txt(g, '1F', W * 0.93, H * 0.88, H * 0.08, { c: '#fff' }); }, { glow: 0.6 }), -0.72, 0.16, 1.41);
  out.slice = B.done(7.4, -42.0, 0); solid(7.4, -42.0, 1.45, 1.45);
  PLACES.add(E, P('alex-honnold-free-solo-2026'), { target: out.slice }); }
// 2021: beside the notice board, the door furniture of that summer, a temperature stand and a bottle of sanitiser
{ const B = maker('covid-props'); B.cyl(M.steel, 0.03, 0.03, 1.1, 0, 0.55, 0, 8); B.cyl(M.steel, 0.2, 0.2, 0.03, 0, 0.015, 0, 12); B.box(M.steel, 0.3, 0.03, 0.24, 0, 1.1, 0); B.cyl(M.pale, 0.05, 0.05, 0.18, 0, 1.2, 0, 10); B.cyl(M.cloth[1], 0.02, 0.03, 0.07, 0, 1.32, 0, 8);
  B.box(M.dark, 0.06, 1.5, 0.06, 0.7, 0.75, 0); B.add(face(DESIGN.signTexture(E, 'paper', 384, 412, (g, W, H) => { g.fillStyle = 'rgba(246,242,232,0.9)'; g.fillRect(W * 0.03, H * 0.03, W * 0.94, H * 0.94); g.fillStyle = 'rgba(200,190,150,0.55)'; [[W * 0.1, H * 0.02, -0.3], [W * 0.78, H * 0.02, 0.3]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.fillRect(0, 0, W * 0.14, H * 0.05); g.restore(); });   // a printed A4 notice, taped on
    g.fillStyle = '#7a1f2a'; g.fillRect(W * 0.08, H * 0.1, W * 0.84, H * 0.16); txt(g, '營業時間', W / 2, H * 0.18, H * 0.1, { c: '#fff' }); txt(g, '12:00 – 20:00', W / 2, H * 0.37, H * 0.11, { c: '#2a2420', f: MONO, w: 700 });
    g.strokeStyle = '#2a2420'; g.lineWidth = 4; g.beginPath(); g.arc(W * 0.26, H * 0.6, H * 0.08, 0, PI * 2); g.stroke(); g.beginPath(); g.moveTo(W * 0.2, H * 0.62); g.quadraticCurveTo(W * 0.26, H * 0.69, W * 0.32, H * 0.62); g.stroke();
    txt(g, '請配戴口罩', W * 0.62, H * 0.56, H * 0.075, { c: '#2a2420' }); txt(g, '入場量體溫', W * 0.62, H * 0.66, H * 0.075, { c: '#2a2420' });
    txt(g, 'Masks on · temperature check', W / 2, H * 0.82, H * 0.05, { c: '#555', w: 600 }); txt(g, '2021.07', W / 2, H * 0.92, H * 0.045, { c: '#7a1f2a', w: 600 }); }, 'xinyi-covid-notice'), 0.7, 0.75, 0.3, true), 0.7, 1.45, 0.04);
  B.done(-14.3, -3.9, PI / 2); }
return out;
};
})();
