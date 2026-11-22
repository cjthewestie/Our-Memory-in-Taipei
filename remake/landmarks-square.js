// landmarks-square.js: the researched places and events of the lantern square (the hub), built as real objects round its edges.
// CJ, 2026-11-21: 「廣場也要加地標跟可以點的事件」. Research: docs/places/square.json (through place-data.js): 12 everyday,
// city-wide places and 11 held events (CJ, 2026-11-21: 「我說的重要事件其實是指辦的大活動啊或有什麼名人來」).
// The square's compass: -x is the 西門町 gate, -z the 大稻埕 gate, +x the 信義 gate, +z the closed south arcade where she starts.
//   LANDMARKS_SQUARE(E)  ->  { groups: { key: Group }, count }
// Every object is one THREE.Group of a few merged meshes (one per material), registered with PLACES.add as a click target,
// and given a footprint (PHOTOWALL.block) so she walks round it. The page calls PLACES.mount afterwards.
// Shapes and props follow reference photos of Taiwan shop fronts, carts and street bronzes (open front under a long sign board,
// steel cart with a glass case and a light-box sign, red stools and folding tables, striped awnings). Nothing is copied:
// shop names, the bus livery and route, and the store's colours are invented; no logo, mascot or real person is drawn.
(function () {
'use strict';
window.LANDMARKS_SQUARE = function (E) {
const { T, scene, TEX, MATS, GLOW, triMat } = E, PI = Math.PI;
const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';
const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + FONT, WEI = '"Weibei TC",' + KAI, YUAN = '"Yuanti TC",' + FONT;
const rnd = (() => { let s = 90217; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
const rr = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
const std = (c, r = 0.8, m = 0) => new T.MeshStandardMaterial({ color: E.col(c), roughness: r, metalness: m });
const glow = (r, g, b) => { const m = GLOW(r, g, b); m.userData.noCast = true; return m; };
const lit = (c, e, i) => { const m = std(c, 0.5); m.emissive = E.col(e); m.emissiveIntensity = i; return m; };
const tm = (color, tex, scale, rough, metal) => triMat({ color, tex, scale, rough, metal: metal || 0 });
const clear = (c, op) => Object.assign(new T.MeshStandardMaterial({ color: E.col(c), roughness: 0.06, metalness: 0.3, transparent: true, opacity: op, depthWrite: false }), { userData: { noCast: true } });
const M = {
  conc: tm('#b9b2a2', TEX.concrete, 0.5, 0.92), concDk: tm('#8e877a', TEX.concrete, 0.5, 0.95), concLt: tm('#d2ccbd', TEX.plaster, 0.3, 0.9), stone: tm('#9a968c', TEX.concrete, 1, 0.9),
  white: tm('#ece7da', TEX.plaster, 0.4, 0.8), cream: tm('#dcc9a4', TEX.plaster, 0.35, 0.85), tileW: tm('#e4e6e0', TEX.concrete, 2.5, 0.35), tileG: tm('#a9c9bb', TEX.concrete, 2.5, 0.4),
  steel: tm('#c9ccd0', TEX.metal, 3, 0.3, 0.45), steelDk: std('#565a60', 0.5, 0.3), chrome: std('#dfe3e6', 0.18, 0.8), roof: tm('#8fa0a8', TEX.metal, 2, 0.4, 0.4), dark: std('#15120f', 0.95), black: std('#141416', 0.55), rubber: std('#1b1b1d', 0.9),
  glassDk: tm('#1f2d36', TEX.metal, 1, 0.12, 0.6), pane: clear('#cfe6ea', 0.16), canopy: clear('#bfe0ea', 0.36), water: std('#3f7f8a', 0.08, 0.5),
  wood: tm('#8a6a48', TEX.bark, 2, 0.8), woodDk: tm('#4f3a28', TEX.bark, 2, 0.85), maple: std('#d9a560', 0.4), soil: std('#4a3626', 0.95), grass: std('#5f8a4a', 0.95), hedge: std('#3f6e3c', 0.95),
  red: std('#c22d22', 0.5), redDk: std('#7c1a14', 0.6), stool: std('#d63a2a', 0.4), stoolB: std('#2f6fc0', 0.4), yellow: std('#f0c22e', 0.5), truckY: std('#f2b90f', 0.45), orange: std('#ee7d1e', 0.45), blue: std('#1f4f9c', 0.5), navy: std('#1c2f5c', 0.5), teal: std('#2f8c8a', 0.5),
  green: std('#3d8a4f', 0.6), brown: std('#8a5a2c', 0.6), pink: std('#f2a0b4', 0.6), whiteP: std('#f4f1ea', 0.5), cream2: std('#efe2c0', 0.55), grey: std('#8d9196', 0.6), gold: std('#e0b23c', 0.3, 0.8), silver: std('#d6dadd', 0.22, 0.85), bronze: std('#7a5a34', 0.38, 0.75),
  skin: std('#e0b693', 0.7), hair: std('#1c1512', 0.8), vest: lit('#f26a1b', '#b03a00', 0.35), reflect: lit('#f4f08a', '#c8c040', 0.6), bagBlue: std('#3f8fd0', 0.35), egg: std('#f6f1e2', 0.4), yolk: lit('#f2b21c', '#a06a00', 0.3), toast: std('#e9cf9a', 0.8), meat: std('#b5563a', 0.6),
  tube: glow(2.3, 2.2, 2.0), bulb: glow(3.6, 2.4, 1.0), warm: glow(1.5, 1.02, 0.5), lantern: glow(2.6, 0.42, 0.16), moon: glow(2.2, 2.2, 2.0), amber: glow(3.0, 1.6, 0.3), neonB: glow(0.5, 1.6, 3.2), neonP: glow(3.0, 0.7, 2.2), headlamp: glow(2.6, 2.4, 1.8),
  beam: Object.assign(new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.3, 0.8), transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), { userData: { noCast: true } }),
  leaf: MATS.leaf,
};
const SHIRT = ['#c9433a', '#e9e2d2', '#2f5f8f', '#e2b53e', '#4f7f5a', '#7a4f7f', '#d07a55', '#7fa8c9'].map(c => std(c, 0.85)), PANTS = ['#2b3550', '#3a3a3e', '#6a5a48', '#1f2a3a'].map(c => std(c, 0.85));
const FLOWER = ['#e8463c', '#f2c12e', '#f08ab0', '#f4f1ea', '#8a5ad0', '#f2843a'].map(c => std(c, 0.6));

// ── a kit that merges everything it is given into one mesh per material ──────────────────────
const UNIT = new T.BoxGeometry(1, 1, 1).toNonIndexed(), SPH = new T.SphereGeometry(0.5, 12, 9).toNonIndexed(), CYL = {};
const cylG = (a, b, seg) => { const k = a.toFixed(3) + '|' + b.toFixed(3) + '|' + seg; return CYL[k] || (CYL[k] = new T.CylinderGeometry(a, b, 1, seg).toNonIndexed()); };
const UP = new T.Vector3(0, 1, 0);
function Kit(name) {
  const g = new T.Group(); g.name = name; const bins = new Map(), stack = []; let cur = new T.Matrix4();
  const m4 = new T.Matrix4(), q = new T.Quaternion(), eu = new T.Euler(), p = new T.Vector3(), s = new T.Vector3(), n3 = new T.Matrix3(), v = new T.Vector3(), d = new T.Vector3();
  function emit(geo, mat) { m4.premultiply(cur); n3.getNormalMatrix(m4);
    let b = bins.get(mat); if (!b) bins.set(mat, b = { pos: [], nor: [] });
    const P = geo.attributes.position, N = geo.attributes.normal;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); b.nor.push(v.x, v.y, v.z); } }
  function put(geo, mat, x, y, z, rot, sx, sy, sz) { eu.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0, 'YXZ'); q.setFromEuler(eu); m4.compose(p.set(x, y, z), q, s.set(sx, sy, sz)); emit(geo, mat); }
  const K = { g,
    push(x, y, z, ry = 0, sc = 1) { stack.push(cur.clone()); cur = cur.clone().multiply(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromAxisAngle(UP, ry), new T.Vector3(sc, sc, sc))); return K; },
    pop() { cur = stack.pop(); return K; },
    cur() { return cur.clone(); },
    box(mat, w, h, dd, x, y, z, ry = 0, rx = 0, rz = 0) { put(UNIT, mat, x, y, z, [rx, ry, rz], w, h, dd); return K; },
    bx(mat, x0, x1, y0, y1, z0, z1) { put(UNIT, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, null, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); return K; },
    cyl(mat, rTop, rBot, h, x, y, z, seg = 10, rot = null) { const r = Math.max(rTop, rBot, 1e-4); put(cylG(rTop / r, rBot / r, seg), mat, x, y, z, rot, r, h, r); return K; },
    sph(mat, r, x, y, z, sx = 1, sy = 1, sz = 1) { put(SPH, mat, x, y, z, null, r * 2 * sx, r * 2 * sy, r * 2 * sz); return K; },
    rod(mat, a, b, r = 0.03, seg = 6) { d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = d.length(); q.setFromUnitVectors(UP, d.normalize()); m4.compose(p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, s.set(r, len, r)); emit(cylG(1, 1, seg), mat); return K; },
    geo(mat, ge, x, y, z, rot = null, sc = 1) { put(ge.index ? ge.toNonIndexed() : ge, mat, x, y, z, rot, sc, sc, sc); return K; },
    add(mesh, x, y, z, ry = 0, rx = 0) { eu.set(rx, ry, 0, 'YXZ'); m4.compose(p.set(x, y, z), q.setFromEuler(eu), s.set(1, 1, 1)).premultiply(cur); m4.decompose(mesh.position, mesh.quaternion, mesh.scale); g.add(mesh); return mesh; },
    done(x, z, ry = 0) { bins.forEach((b, mat) => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(b.nor, 3));
      const m = new T.Mesh(geo, mat); m.castShadow = !(mat.userData && mat.userData.noCast); m.receiveShadow = true; g.add(m); }); bins.clear();
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); g.updateMatrixWorld(true); return g; } };
  return K;
}

// ── signs, labels and ground decals (canvas; every word and picture is drawn here) ────────────
const EDGE = std('#231f1c', 0.6);
function boardMesh(cv, w, h, o) {
  const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
  const m = new T.MeshStandardMaterial({ map: t, roughness: 0.6, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: (o.glow == null ? 0.4 : o.glow) * (o.light ? 0.42 : 1) });
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, o.depth || 0.06), [EDGE, EDGE, EDGE, EDGE, m, o.oneSide ? EDGE : m]); mesh.castShadow = !o.noCast; return mesh;
}
function paint(w, h, draw, o = {}) {
  const ppm = o.ppm || Math.max(48, Math.min(260, 900 / Math.max(w, h))), cv = document.createElement('canvas'); cv.width = Math.round(w * ppm); cv.height = Math.round(h * ppm);
  draw(cv.getContext('2d'), cv.width, cv.height); return boardMesh(cv, w, h, o);
}
const lum = c => { const k = new T.Color(c); return k.r * 0.3 + k.g * 0.6 + k.b * 0.1; };
const fit = (g, txt, size, maxW, weight, face) => { g.font = `${weight} ${size}px ${face}`; const mw = g.measureText(txt).width; if (mw > maxW) { size *= maxW / mw; g.font = `${weight} ${size}px ${face}`; } return size; };
// sign(text, w, h, { bg, fg, kind: 'paint' | 'box' | 'cloth', vertical, sub, stripes, font, glow })
function sign(text, w, h, o = {}) {
  const bg = o.bg || '#b3271e', fg = o.fg || '#fff3d6', kind = o.kind || 'paint', font = o.font || (kind === 'box' ? YUAN : KAI), wt = o.weight || (kind === 'box' ? 700 : 800);
  if (lum(bg) > 0.6) o.light = true;
  return paint(w, h, (g, W, H) => { const u = Math.min(W, H);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (o.stripes) { g.save(); g.beginPath(); g.rect(0, 0, H * 0.8, H); g.rect(W - H * 0.8, 0, H * 0.8, H); g.clip(); g.strokeStyle = o.stripes; g.lineWidth = H * 0.14; for (let x = -H; x < W + H; x += H * 0.34) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); } g.restore(); }
    if (kind === 'box') { const gr = g.createLinearGradient(0, 0, o.vertical ? W : 0, o.vertical ? 0 : H); gr.addColorStop(0, 'rgba(0,0,0,.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#2b2b30'; g.lineWidth = u * 0.07; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth); }
    else if (kind === 'cloth') { const n = Math.max(3, Math.round(Math.max(W, H) / u * 1.3)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, a = 0.05 + rnd() * 0.07, gr = o.vertical ? g.createLinearGradient(0, H * (t - 0.5 / n), 0, H * (t + 0.5 / n)) : g.createLinearGradient(W * (t - 0.5 / n), 0, W * (t + 0.5 / n), 0);
        gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.8})`); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); } }
    else { if (o.border !== false) { g.strokeStyle = fg; g.lineWidth = Math.max(1.5, u * 0.022); const m = u * 0.06; g.strokeRect(m, m, W - 2 * m, H - 2 * m); }
      for (let i = 0; i < Math.max(W, H) / 14; i++) { g.fillStyle = `rgba(${o.light ? '70,55,35' : '0,0,0'},${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * W, 0, 1 + rnd() * u * 0.05, H * (0.2 + rnd() * 0.8)); } }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
    if (o.vertical) { const ch = [...text], top = o.sub ? 0.86 : 1, cell = H * (top - 0.04) / ch.length, size = Math.min(W * 0.78, cell * 0.92); g.font = `${wt} ${size}px ${font}`; ch.forEach((c, i) => g.fillText(c, W / 2, H * 0.02 + cell * (i + 0.52)));
      if (o.sub) { fit(g, o.sub, H * 0.07, W * 0.84, 700, FONT); g.fillStyle = o.subFg || fg; g.fillText(o.sub, W / 2, H * 0.93); } }
    else { const maxW = o.stripes ? W - H * 1.9 : W * 0.88; fit(g, text, H * (o.sub ? 0.56 : 0.72), maxW, wt, font); g.fillText(text, W / 2, H * (o.sub ? 0.4 : 0.53));
      if (o.sub) { fit(g, o.sub, H * 0.2, maxW, 700, o.subFont || FONT); g.fillStyle = o.subFg || fg; g.fillText(o.sub, W / 2, H * 0.8); } }
  }, o);
}
// label(lines, w, h, { bg, border }): lines are [text, size (of H), y (of H), weight, colour, font, x (of W)]
function label(lines, w, h, o = {}) { const bg = o.bg || '#f1e7d2'; if (lum(bg) > 0.6) o.light = true;
  return paint(w, h, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); if (o.band) { g.fillStyle = o.band; g.fillRect(0, 0, W, H * (o.bandH || 0.26)); }
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = Math.max(2, H * 0.03); g.strokeRect(g.lineWidth, g.lineWidth, W - 2 * g.lineWidth, H - 2 * g.lineWidth); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(([t, sz, y, wt, c, f, x]) => { fit(g, t, H * sz, W * 0.9, wt || 700, f || FONT); g.fillStyle = c || '#2a2420'; g.fillText(t, W * (x == null ? 0.5 : x), H * y); }); }, o); }
// a round sign plate, the same picture on both faces
// disc(dia, draw, mat, key): with a Midjourney material (mat), the face is DESIGN.signTexture and a steel band clamps it to its pole
function disc(dia, draw, mat, key) { let t; if (mat && window.DESIGN && DESIGN.signTexture) t = DESIGN.signTexture(E, mat, 384, 384, draw, 'sq|disc|' + (key || dia));
  else { const cv = document.createElement('canvas'); cv.width = cv.height = 384; draw(cv.getContext('2d'), 384, 384); t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; }
  const m = new T.MeshStandardMaterial({ map: t, roughness: mat ? 0.42 : 0.6, metalness: mat === 'tin' ? 0.2 : 0, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: 0.16 }), g = new T.Group();
  if (mat) { const band = new T.Mesh(new T.BoxGeometry(0.05, dia * 0.5, 0.08), EDGE); band.position.z = -0.035; g.add(band); } [0, PI].forEach(ry => { const f = new T.Mesh(new T.CircleGeometry(dia / 2, 32), m); f.rotation.y = ry; f.position.z = ry ? -0.012 : 0.012; f.castShadow = true; g.add(f); });
  const rim = new T.Mesh(new T.CylinderGeometry(dia / 2, dia / 2, 0.022, 32), EDGE); rim.rotation.x = PI / 2; g.add(rim); return g; }
function decal(w, dd, draw, o = {}) { const ppm = o.ppm || 96, cv = document.createElement('canvas'); cv.width = Math.round(w * ppm); cv.height = Math.round(dd * ppm); draw(cv.getContext('2d'), cv.width, cv.height);
  const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
  const m = new T.Mesh(new T.PlaneGeometry(w, dd), new T.MeshStandardMaterial({ map: t, roughness: o.rough || 0.85, transparent: !!o.alpha, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.receiveShadow = true; return m; }   // K.add(decal, x, 0.02, z, ry, -PI / 2)

// ── the real signs of real places (CJ, 2026-11-22: 「每個招牌要根據他的作用跟含義還有真實的招牌去對應」, 「招牌可以用midjourney生成紋理」) ──
// real(type, material, w, h, letter, o) -> Group. The face is DESIGN.signTexture on a Midjourney material in asset/textures/signs/
// (lacquer, redlacquer, teak, tin, enamel, lightbox, neonback, cloth, stone, brass, paper, weathered) with this file's lettering;
// the body is the sign's true build. Each one is logged with its reference in docs/signage/sources-square.md.
//   'box'    a backlit acrylic light box: the face set in a deeper steel case, lit; both faces unless o.oneSide
//   'plate'  an enamel or tin plate, a rivet at each corner
//   'plaque' a carved board (匾額): a raised moulded frame round the face
//   'stone'  a slab with the characters cut into it
//   'neon'   tube letters on a dark backing panel, on stand-off brackets
const METAL = std('#3a3c40', 0.4, 0.6), RIVET = std('#c9c6bd', 0.3, 0.8), STONE = std('#6e6c64', 0.95), FRAME = std('#3a2416', 0.55);
function real(type, material, w, h, letter, o = {}) {
  const ppm = o.ppm || Math.min(420, 1700 / Math.max(w, h)), tex = DESIGN.signTexture(E, material, Math.round(w * ppm), Math.round(h * ppm), letter, 'sq|' + (o.id || type + w + 'x' + h + material));
  const glow = o.glow == null ? { box: 0.9, neon: 1.1 }[type] || 0.16 : o.glow;
  const face = new T.MeshStandardMaterial({ map: tex, roughness: { plate: 0.32, stone: 0.92, box: 0.4 }[type] || 0.58, metalness: material === 'brass' ? 0.55 : material === 'tin' ? 0.2 : 0, emissiveMap: tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow });
  const gr = new T.Group(), add = (geo, mat, x, y, z, ry = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; gr.add(m); return m; };
  const d = o.depth || { box: 0.16, plate: 0.014, plaque: 0.07, stone: 0.05, neon: 0.05 }[type] || 0.04, two = !o.oneSide && type === 'box';
  if (type === 'box') { const r = Math.min(w, h) * 0.06 + 0.02; add(new T.BoxGeometry(w + r, h + r, d), METAL, 0, 0, 0); add(new T.PlaneGeometry(w, h), face, 0, 0, d / 2 + 0.003); if (two) add(new T.PlaneGeometry(w, h), face, 0, 0, -d / 2 - 0.003, PI);
    add(new T.BoxGeometry(w + r * 1.4, r * 0.5, d * 1.15), METAL, 0, h / 2 + r * 0.5, 0); }                                   // the case, its lit face, the drip cap on top
  else if (type === 'neon') { add(new T.BoxGeometry(w, h, d), [EDGE, EDGE, EDGE, EDGE, face, EDGE], 0, 0, 0); [-1, 1].forEach(k => add(new T.BoxGeometry(0.03, 0.03, 0.12), METAL, k * w * 0.42, 0, -d / 2 - 0.06)); }
  else { add(new T.BoxGeometry(w, h, d), [o.body || EDGE, o.body || EDGE, o.body || EDGE, o.body || EDGE, face, o.body || EDGE], 0, 0, 0);
    if (type === 'plate') { const m = Math.min(w, h) * 0.08; [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => { const s = new T.Mesh(new T.SphereGeometry(Math.max(0.008, Math.min(w, h) * 0.025), 8, 6), RIVET); s.position.set(a * (w / 2 - m), b * (h / 2 - m), d / 2); gr.add(s); }); }
    if (type === 'plaque') { const f = Math.min(w, h) * 0.09; [[0, h / 2 - f / 2, w, f], [0, -h / 2 + f / 2, w, f], [-w / 2 + f / 2, 0, f, h], [w / 2 - f / 2, 0, f, h]].forEach(([x, y, bw, bh]) => add(new T.BoxGeometry(bw, bh, d * 0.6), o.frame || FRAME, x, y, d / 2 + d * 0.3)); } }
  if (o.arms) [-1, 1].forEach(k => add(new T.BoxGeometry(0.03, 0.03, o.arms), METAL, 0, k * h * 0.38, -d / 2 - o.arms / 2));   // a projecting sign's brackets back to the wall
  return gr;
}
// ink(g, text, x, y, size, colour, face, { weight, maxW, vertical, carve, neon, stroke, shadow }): lettering on a real sign's face
function ink(g, t, x, y, size, c, face, o = {}) {
  g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; const wt = o.weight || 800;
  if (o.vertical) { const ch = [...t], cell = size * 1.08; ch.forEach((k, i) => ink(g, k, x, y + (i - (ch.length - 1) / 2) * cell, size, c, face, Object.assign({}, o, { vertical: false }))); return; }
  g.font = `${wt} ${size}px ${face}`; if (o.maxW) { const mw = g.measureText(t).width; if (mw > o.maxW) { size *= o.maxW / mw; g.font = `${wt} ${size}px ${face}`; } }
  if (o.neon) { g.shadowColor = c; g.shadowBlur = size * 0.3; g.strokeStyle = c; g.lineWidth = size * 0.1; g.strokeText(t, x, y); g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.88)'; g.lineWidth = size * 0.032; g.strokeText(t, x, y); return; }
  if (o.carve) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(t, x - size * 0.025, y - size * 0.03); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillText(t, x + size * 0.02, y + size * 0.025); }
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(t, x + size * 0.035, y + size * 0.045); }
  if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = size * (o.sw || 0.12); g.strokeText(t, x, y); }
  g.fillStyle = c; g.fillText(t, x, y);
}
const tint = (g, W, H, c) => { g.fillStyle = c; g.fillRect(0, 0, W, H); };

// ── small things used more than once ─────────────────────────────────────────────────────────
// a plain standing or seated figure, about 1.62 m: no face, no likeness. o: { sit, shirt, pants, mat (one material: a bronze), vest, arms: 'down' | 'fwd' | 'up', s }
function person(K, x, z, ry, o = {}) {
  if (window.PEOPLE && !o.mat) { K.push(x, o.y || 0, z, ry, o.s || 1); (window.__lmPeople = window.__lmPeople || []).push({ g: K.g, m: K.cur(), o }); K.pop(); if (!o.shirt) pick(SHIRT); if (!o.pants) pick(PANTS); return; }   // the people kit (lm/kit-people.js) draws this figure instead (a one-material statue figure stays here): lm/square-people.js reads the list
  const sh = o.mat || o.shirt || pick(SHIRT), pa = o.mat || o.pants || pick(PANTS), sk = o.mat || M.skin, ha = o.mat || M.hair, ty = o.sit ? 0.5 : 0.78, arms = o.arms || 'down';
  K.push(x, o.y || 0, z, ry, o.s || 1);
  if (o.sit) { [-1, 1].forEach(k => { K.box(pa, 0.13, 0.13, 0.44, k * 0.09, 0.5, 0.2); K.box(pa, 0.12, 0.46, 0.13, k * 0.09, 0.23, 0.38); K.box(M.black, 0.11, 0.06, 0.22, k * 0.09, 0.03, 0.44); }); }
  else [-1, 1].forEach(k => { K.box(pa, 0.13, 0.76, 0.15, k * 0.09, 0.4, 0); K.box(M.black, 0.12, 0.06, 0.24, k * 0.09, 0.03, 0.04); });
  K.cyl(sh, 0.15, 0.19, 0.56, 0, ty + 0.28, 0, 8); K.cyl(sk, 0.05, 0.055, 0.08, 0, ty + 0.59, 0, 8); K.sph(sk, 0.115, 0, ty + 0.72, 0); K.sph(ha, 0.122, 0, ty + 0.755, -0.025, 1, 0.86, 1);
  if (o.vest) { K.cyl(M.vest, 0.165, 0.2, 0.42, 0, ty + 0.3, 0, 8); K.cyl(M.reflect, 0.172, 0.19, 0.05, 0, ty + 0.24, 0, 8); K.cyl(M.reflect, 0.168, 0.178, 0.05, 0, ty + 0.4, 0, 8); }
  [-1, 1].forEach(k => { const s0 = [k * 0.19, ty + 0.5, 0], e0 = arms === 'fwd' ? [k * 0.2, ty + 0.3, 0.2] : arms === 'up' && k > 0 ? [k * 0.3, ty + 0.72, 0.08] : [k * 0.24, ty + 0.26, 0.02], h0 = arms === 'fwd' ? [k * 0.15, ty + 0.3, 0.42] : arms === 'up' && k > 0 ? [k * 0.26, ty + 1.0, 0.1] : [k * 0.25, ty + 0.02, 0.05];
    K.rod(sh, s0, e0, 0.05); K.rod(o.mat || sk, e0, h0, 0.04); K.sph(o.mat || sk, 0.045, h0[0], h0[1], h0[2]); });
  K.pop();
}
const stool = (K, x, z, mat = M.stool) => { K.cyl(mat, 0.16, 0.15, 0.035, x, 0.44, z, 12); K.cyl(mat, 0.1, 0.12, 0.03, x, 0.2, z, 10); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => K.rod(mat, [x + a * 0.1, 0.43, z + b * 0.1], [x + a * 0.16, 0, z + b * 0.16], 0.018, 5)); };
const foldTable = (K, x, z, ry = 0, w = 1.1, dd = 0.7, top = M.steel) => { K.push(x, 0, z, ry); K.box(top, w, 0.03, dd, 0, 0.74, 0); K.box(M.steelDk, w - 0.04, 0.04, dd - 0.04, 0, 0.71, 0);
  [-1, 1].forEach(a => { K.rod(M.steelDk, [a * (w / 2 - 0.06), 0.7, -dd / 2 + 0.05], [a * (w / 2 - 0.06), 0, dd / 2 - 0.05], 0.014); K.rod(M.steelDk, [a * (w / 2 - 0.06), 0.7, dd / 2 - 0.05], [a * (w / 2 - 0.06), 0, -dd / 2 + 0.05], 0.014); }); K.pop(); };
const bowl = (K, x, y, z, food) => { K.cyl(M.whiteP, 0.09, 0.05, 0.06, x, y + 0.03, z, 10); K.cyl(food, 0.08, 0.08, 0.012, x, y + 0.058, z, 10); };
const TORUS = new T.TorusGeometry(1, 0.09, 6, 18).toNonIndexed(), HALF = new T.SphereGeometry(1, 20, 10, 0, PI * 2, 0, PI / 2).toNonIndexed(), CONE = new T.ConeGeometry(1, 1, 14, 1, true).toNonIndexed();
const wheel = (K, x, y, z, r, w, rot) => { K.cyl(M.rubber, r, r, w, x, y, z, 14, rot); K.cyl(M.steel, r * 0.5, r * 0.5, w + 0.02, x, y, z, 10, rot); };

const out = {}; let count = 0;
const P = k => PLACES.item('square', k);
// reg(key, group, { foot: [[u0, u1, v0, v1], ...], near: [x, z], radius, plaque: [x, y, z, ry, size], targets }): all in the group's own frame (u along its x, v along its z)
function reg(key, g, o = {}) {
  out[key] = g; g.updateMatrixWorld(true);
  (o.foot || []).forEach(f => PHOTOWALL.block({ x: g.position.x, z: g.position.z, facing: g.rotation.y, u0: f[0], u1: f[1], v0: f[2], v1: f[3] }));
  const it = P(key); if (!it) { console.warn('[square] no researched item "' + key + '"'); return g; }
  const a = { target: o.targets ? [g].concat(o.targets) : g, radius: o.radius || 3 };
  if (o.near) { const w = g.localToWorld(new T.Vector3(o.near[0], 0, o.near[1])); a.near = [w.x, w.z]; }
  if (o.plaque) { const w = g.localToWorld(new T.Vector3(o.plaque[0], o.plaque[1], o.plaque[2])); a.plaque = { position: [w.x, w.y, w.z], rotation: g.rotation.y + (o.plaque[3] || 0), size: o.plaque[4] || 0.2 }; }
  PLACES.add(E, it, a); count++; return g;
}
const ACC = { music: '#8a2f6a', sport: '#b7372a', night: '#1c2f5c', green: '#3d7a4a', game: '#2f6f8c' };
// ── the designed pieces that replace the old name boards (eventSign) ────────────────────────────
// CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 … 這種無聊的招牌絕對不能出現」. Each event keeps the
// object that tells its story (the court, the podium, the stage) and gets one piece from design-kit.js in place of its plate: a
// poster on a real mount, a statue on a plinth, an installation or the booth itself dressed in the kit's graphics. The painting
// under each poster is posters/events/<key>.jpg (DESIGN loads it, falls back to the code-drawn version). Why each one, and its
// sources: docs/signage/designs-square.md. No neighbours share a form and a layout.
const D = {
  golden: { form: 'poster', mount: 'column', layout: 'award', layouts: ['award', 'premiere', 'award'], palette: 'award', head: '第十七屆 金曲獎', big: '金曲', kicker: 'GOLDEN MELODY AWARDS', kicker2: '第十七屆', venue: '臺北小巨蛋 TAIPEI ARENA', date: '2006.6.10', en: '17th Golden Melody Awards' },
  dome: { form: 'poster', mount: 'standee', layout: 'concert', palette: ['#f2e8d5', '#e9dcc2', '#1b1430', '#ff2e63', '#7a2bff', '#2a1050'], head: '嘉年華 大巨蛋首演', big: '嘉年華', kicker: 'CARNIVAL WORLD TOUR', kicker2: '周杰倫', venue: '臺北大巨蛋 TAIPEI DOME', date: '2024.12.5', en: 'First concert in the Taipei Dome' },
  ff: { layout: 'anime', palette: 'anime', head: '開拓動漫祭', big: 'FF', kicker: 'FANCY FRONTIER', kicker2: '同人誌販售會', venue: '花博爭艷館', en: 'Fancy Frontier doujin fair' },
  nba: { form: 'statue', motif: 'ball', plinth: 'drum', palette: 'sport', head: 'NBA 來到臺北', story: '小巨蛋裡一萬人一起尖叫', date: '2013.10.13', en: 'NBA Global Games Taipei' },
  yuanzai: { form: 'poster', mount: 'case', layout: 'news', palette: 'news', head: '圓仔 首次亮相', big: '圓仔', kicker: '號外', kicker2: '排隊看小貓熊', story: '排隊看一隻小貓熊', venue: '臺北市立動物園 新光特展館', date: '2014.1.6', en: 'Yuan Zai meets the public' },
  universiade: { form: 'poster', mount: 'banner', layout: 'games', palette: 'games', head: '臺北世大運', big: '2017', kicker: '我的主場', venue: '臺北田徑場', date: '2017.8.19 – 8.30', en: 'Taipei 2017 Summer Universiade' },
  flora: { form: 'poster', mount: 'standee', layout: 'expo', palette: 'expo', head: '臺北國際花卉博覽會', big: '花博', kicker: '彩花 · 流水 · 新視界', venue: '圓山 · 美術 · 新生 · 大佳河濱', date: '2010.11.6 – 2011.4.25', en: 'Taipei International Flora Exposition' },
  lantern: { form: 'installation', piece: 'canopy', obj: 'lantern', layout: 'lantern', palette: 'lantern', head: '台北燈節 士林', big: '士林燈節', kicker: '2022 燈節', date: '2022.2.11 – 2.20', en: 'Taipei Lantern Festival, Shilin' },
  nuit: { form: 'poster', mount: 'case', layout: 'nightart', palette: ['#1a0b3a', '#0b1e5b', '#ffffff', '#ff7a59', '#9be7ff', '#ffe66d'], head: '白晝之夜 公館', big: '公館之夜', kicker: 'NUIT BLANCHE TAIPEI', kicker2: '18:00 → 06:00', venue: '公館 · 臺大 · 寶藏巖', date: '2017.10.7 – 10.8', en: 'Nuit Blanche Taipei 2017' },
  msi: { form: 'poster', mount: 'column', layout: 'esports', layouts: ['esports', 'esports', 'countdown'], palette: 'esports', head: '季中邀請賽 決賽', big: '決賽之夜', kicker: 'MID-SEASON INVITATIONAL', kicker2: '英雄聯盟', venue: '臺北和平籃球館', date: '2019.5.17 – 5.19', en: 'Mid-Season Invitational finals' },
  pokemon: { form: 'installation', piece: 'phones', layout: 'news', palette: ['#0f1a2a', '#16304a', '#ffffff', '#a8f0ff', '#ffd23f', '#ff5a5f'], head: '北投公園 像跨年夜', big: '抓寶人潮', motif: 'pin', date: '2016.8', en: 'The crowds of Beitou Park' },
};
const DESIGNED = {};
// piece(K, key, design, x, z, ry, sc): DESIGN.build(item, design) set into the kit's group at (x, z) of its frame, turned ry.
// Returns { foot: footprints in the group's frame for reg, plaque: [x, y, z, ry, size] where the kit puts its "i" }
function piece(K, key, d, x, z, ry = 0, sc = 1) {
  if (!window.DESIGN) return { foot: [] };
  const g = DESIGN.build(E, P(key), d); K.push(x, 0, z, ry, sc); K.add(g, 0, 0, 0); K.pop(); DESIGNED[key] = g.userData.design;
  const c = Math.cos(ry), sn = Math.sin(ry), at = (u, v) => [x + (u * c + v * sn) * sc, z + (-u * sn + v * c) * sc];
  const foot = (g.userData.feet || [g.userData.foot]).filter(Boolean).map(([u0, u1, v0, v1]) => { const q = [at(u0, v0), at(u1, v0), at(u0, v1), at(u1, v1)];
    return [Math.min(...q.map(a => a[0])), Math.max(...q.map(a => a[0])), Math.min(...q.map(a => a[1])), Math.max(...q.map(a => a[1]))]; });
  const pa = g.userData.plaqueAt, pw = pa ? at(pa[0], pa[2]) : null;
  return { foot, plaque: pw ? [pw[0], pa[1] * sc, pw[1], ry, 0.13] : null };
}
// a printed face from the kit's canvases, on its own plane (front along +Z)
const kitFace = (tex, w, h, glow = 0.35) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: 0.6, emissiveMap: tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow, side: T.DoubleSide })); m.castShadow = true; return m; };

// ══ north-west: 捷運木柵線, the bicycle dock under it, the NBA half court ═══════════════════════
// The elevated line runs along the north arcade's west half: three hammerhead piers, a deck with two running strips, a small
// glazed station with a pitched metal roof, a two-car driverless train half out of it, and a roofed stair down to the paving.
{ const K = Kit('mrt-muzha-line');
  [-5.6, 0.4, 6.2].forEach(x => { K.cyl(M.conc, 0.5, 0.56, 4.0, x, 2.0, 0, 16); K.box(M.conc, 1.0, 0.45, 1.8, x, 4.2, 0); K.box(M.conc, 1.1, 0.5, 3.0, x, 4.65, 0); K.box(M.concDk, 1.5, 0.14, 1.5, x, 0.07, 0); });
  K.bx(M.concLt, -7, 7, 4.9, 5.4, -1.5, 1.5); K.bx(M.concDk, -7, 7, 4.82, 4.9, -1.2, 1.2);
  [-1.44, 1.44].forEach(z => { K.bx(M.conc, -7, 7, 5.4, 5.95, z - 0.07, z + 0.07); K.bx(M.steel, -7, 7, 6.0, 6.05, z - 0.03, z + 0.03); for (let x = -6.8; x < 7; x += 0.8) K.box(M.steel, 0.03, 0.1, 0.03, x, 5.98, z); });
  [-0.55, 0.55].forEach(z => K.bx(M.concDk, -7, 7, 5.4, 5.5, z - 0.16, z + 0.16)); K.bx(M.steelDk, -7, 7, 5.4, 5.6, -0.05, 0.05);          // the two running strips and the guide rail
  // the station: platform edges, steel posts, glass to the square, a blank wall to the arcade, a pitched roof with its trusses
  [-1, 1].forEach(k => K.bx(M.tileW, -6.6, 0.6, 5.4, 5.64, k * 0.86, k * 1.38)); K.bx(M.yellow, -6.6, 0.6, 5.64, 5.65, 0.86, 0.96);
  [-6.5, -4.1, -1.7, 0.5].forEach(x => { [-1.4, 1.4].forEach(z => K.box(M.steelDk, 0.12, 2.4, 0.12, x, 6.6, z)); K.box(M.steelDk, 0.08, 0.1, 2.9, x, 7.78, 0); K.rod(M.steelDk, [x, 7.8, -1.4], [x, 8.3, 0], 0.03); K.rod(M.steelDk, [x, 7.8, 1.4], [x, 8.3, 0], 0.03); });
  K.bx(M.pane, -6.5, 0.5, 5.95, 7.5, 1.38, 1.41); K.bx(M.concLt, -6.5, 0.5, 5.95, 7.8, -1.46, -1.4); for (let x = -5.9; x < 0.5; x += 0.6) K.box(M.steel, 0.04, 1.55, 0.05, x, 6.72, 1.4); K.bx(M.steel, -6.5, 0.5, 7.46, 7.54, 1.36, 1.44); K.bx(M.steelDk, -6.5, 0.5, 7.54, 7.84, 1.36, 1.46);
  [1, -1].forEach(k => K.box(M.roof, 7.7, 0.07, 1.86, -3, 8.12, k * 0.84, 0, k * 0.3)); K.box(M.steelDk, 7.76, 0.1, 0.16, -3, 8.42, 0); for (let x = -6.6; x < 0.8; x += 0.46) [1, -1].forEach(k => K.box(M.steel, 0.04, 0.03, 1.86, x, 8.17, k * 0.84, 0, k * 0.3));
  // the station's name fascia: a long light box, black 圓體 name and its English on a white face, the line's brown band under it
  K.add(real('box', 'lightbox', 4.2, 0.34, (g, W, H) => { tint(g, W, H, 'rgba(252,251,246,.62)'); g.fillStyle = '#8a5a2c'; g.fillRect(0, H * 0.84, W, H * 0.16);
    ink(g, '捷運木柵線', W * 0.34, H * 0.43, H * 0.6, '#1d1d1f', YUAN, { maxW: W * 0.5 }); ink(g, 'MRT  MUZHA  LINE', W * 0.77, H * 0.45, H * 0.3, '#1d1d1f', FONT, { weight: 700, maxW: W * 0.36 }); }, { oneSide: true, id: 'mrt-fascia' }), -3, 7.69, 1.55);
  // the platform's direction box, hung from the roof: white on a dark face, an arrow to the train
  [-2.6, -0.6].forEach(x => K.box(M.tube, 1.2, 0.03, 0.06, x - 1, 7.7, 0.4)); [-0.4, 0.4].forEach(k => K.box(M.steelDk, 0.02, 0.5, 0.02, -3.6 + k, 7.4, -1.2));
  K.add(real('box', 'lightbox', 1.0, 0.36, (g, W, H) => { tint(g, W, H, 'rgba(24,26,30,.9)'); ink(g, '往 動物園', W * 0.42, H * 0.36, H * 0.36, '#ffffff', YUAN, { maxW: W * 0.62 }); ink(g, 'To Taipei Zoo', W * 0.42, H * 0.74, H * 0.2, '#ffffff', FONT, { weight: 600 }); ink(g, '→', W * 0.86, H * 0.52, H * 0.6, '#f2c12e', FONT); }, { id: 'mrt-dir' }), -3.6, 6.95, -1.2);
  // the train: white boxy cars, a brown band under the windows, a flat front with no cab, rubber tyres on the strips
  [-0.8, 2.6].forEach((xc, i) => { K.push(xc, 5.62, 0);
    K.bx(M.whiteP, -1.62, 1.62, 0.26, 1.98, -0.74, 0.74); K.bx(M.brown, -1.63, 1.63, 0.66, 0.84, -0.75, 0.75); K.bx(M.glassDk, -1.36, 1.36, 0.98, 1.62, -0.752, 0.752); K.bx(M.grey, -1.5, 1.5, 1.98, 2.1, -0.58, 0.58); K.bx(M.steelDk, -1.6, 1.6, 0.14, 0.26, -0.66, 0.66);
    [-0.9, 0.1, 1.1].forEach(x => K.bx(M.whiteP, x - 0.06, x + 0.06, 0.9, 1.7, -0.756, 0.756)); [-0.4, 0.6].forEach(x => K.bx(M.steel, x - 0.24, x + 0.24, 0.3, 1.86, -0.757, 0.757)); [-0.4, 0.6].forEach(x => K.bx(M.glassDk, x - 0.2, x + 0.2, 0.98, 1.7, -0.76, 0.76));
    [-1.0, 1.0].forEach(x => [-0.55, 0.55].forEach(z => wheel(K, x, 0.12, z, 0.2, 0.22, [PI / 2, 0, 0])));
    if (i) { K.bx(M.glassDk, 1.6, 1.635, 0.86, 1.8, -0.62, 0.62); K.bx(M.brown, 1.6, 1.64, 0.5, 0.82, -0.74, 0.74); [-0.5, 0.5].forEach(z => K.sph(M.headlamp, 0.07, 1.63, 0.62, z)); K.add(real('box', 'lightbox', 0.7, 0.18, (g, W, H) => { tint(g, W, H, 'rgba(22,24,28,.92)'); ink(g, '動物園', W / 2, H * 0.54, H * 0.62, '#f3d27a', FONT, { weight: 700, maxW: W * 0.84 }); }, { id: 'train-dest', oneSide: true, depth: 0.04, glow: 0.9 }), 1.665, 1.9, 0, PI / 2); }
    K.pop(); });
  // the stair: 27 steps from the paving up to the platform's end, stringers, handrails, a glazed canopy on posts
  { const n = 27, run = 8.2 / n, rise = 5.4 / n, a = Math.atan2(5.4, 8.2), L = Math.hypot(8.2, 5.4);
    for (let i = 0; i < n; i++) K.bx(i % 9 === 8 ? M.concDk : M.conc, 5.0 - (i + 1) * run, 5.0 - i * run, i * rise - 0.14, (i + 1) * rise, 1.82, 3.0);
    [1.76, 3.06].forEach(z => { K.box(M.concDk, L, 0.5, 0.1, 0.9, 2.5, z, 0, 0, -a); K.rod(M.chrome, [5.0, 0.95, z], [-3.2, 6.35, z], 0.03, 8); for (let i = 0; i <= 8; i++) { const x = 5.0 - i * 1.025, y = i * 0.675; K.rod(M.steelDk, [x, y, z], [x, y + 0.95, z], 0.018); } K.rod(M.chrome, [-3.2, 6.35, z], [-4.6, 6.35, z], 0.03, 8); });
    K.bx(M.conc, -4.7, -3.2, 5.1, 5.4, 1.5, 3.1); K.bx(M.steelDk, -4.72, -4.66, 5.4, 6.4, 1.5, 3.1); K.bx(M.pane, -4.7, -3.2, 5.4, 6.35, 3.04, 3.08);
    [[1.4, 2.2], [-2.0, 4.4], [-4.0, 5.1]].forEach(([x, h]) => K.box(M.conc, 0.34, h, 0.34, x, h / 2, 2.42));
    K.box(M.canopy, L + 1.0, 0.05, 1.7, 0.6, 5.3, 2.42, 0, 0, -a); [1.6, 3.24].forEach(z => K.rod(M.steelDk, [5.6, 2.4, z], [-3.6, 8.45, z], 0.035)); for (let i = 0; i <= 4; i++) { const x = 5.0 - i * 2.05, y = i * 1.35; [1.62, 3.22].forEach(z => K.rod(M.steelDk, [x, y, z], [x, y + 2.75, z], 0.03)); K.rod(M.steelDk, [x, y + 2.75, 1.62], [x, y + 2.75, 3.22], 0.025); } }
  // at the foot: the entrance frame and its sign, the line map, the tall 捷運 post, a ticket machine
  [1.66, 3.16].forEach(z => K.box(M.steelDk, 0.12, 2.75, 0.12, 5.55, 1.375, z)); K.box(M.steelDk, 0.14, 0.14, 1.62, 5.55, 2.72, 2.41);
  K.add(real('box', 'lightbox', 1.5, 0.42, (g, W, H) => { tint(g, W, H, 'rgba(252,251,246,.6)'); g.fillStyle = '#8a5a2c'; g.fillRect(0, 0, H * 0.9, H);
    ink(g, '捷', H * 0.45, H * 0.5, H * 0.66, '#ffffff', YUAN); ink(g, '捷運 出入口', W * 0.62, H * 0.4, H * 0.4, '#1d1d1f', YUAN, { maxW: W * 0.58 }); ink(g, 'MRT  ENTRANCE', W * 0.62, H * 0.78, H * 0.18, '#1d1d1f', FONT, { weight: 700 }); }, { id: 'mrt-entry' }), 5.63, 2.38, 2.41, PI / 2);
  // the tall entrance pylon: a square light box on a post, 捷運 down its face
  K.box(M.steelDk, 0.09, 3.6, 0.09, 6.5, 1.8, 1.5); K.add(real('box', 'lightbox', 0.42, 1.1, (g, W, H) => { tint(g, W, H, 'rgba(138,90,44,.92)'); ink(g, '捷運', W / 2, H * 0.4, W * 0.62, '#ffffff', YUAN, { vertical: true }); ink(g, 'MRT', W / 2, H * 0.88, W * 0.3, '#ffffff', FONT); }, { id: 'mrt-pylon', depth: 0.3 }), 6.5, 3.2, 1.5, 0.5);
  [-0.7, 0.7].forEach(k => K.box(M.steelDk, 0.06, 1.9, 0.06, 6.2 + k, 0.95, 3.6)); K.add(paint(1.5, 1.0, (g, W, H) => { g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, W, H); g.fillStyle = '#8a5a2c'; g.fillRect(0, 0, W, H * 0.2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = `700 ${H * 0.12}px ${FONT}`; g.fillText('木柵線 路線圖 · MUZHA LINE', W / 2, H * 0.105);
    const st = ['中山國中', '南京東路', '忠孝復興', '大安', '科技大樓', '六張犁', '麟光', '辛亥', '萬芳醫院', '萬芳社區', '木柵', '動物園']; g.strokeStyle = '#8a5a2c'; g.lineWidth = H * 0.035; g.beginPath(); g.moveTo(W * 0.06, H * 0.36); g.lineTo(W * 0.94, H * 0.36); g.stroke();
    st.forEach((s, i) => { const x = W * (0.06 + 0.88 * i / 11); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, H * 0.36, H * 0.035, 0, 7); g.fill(); g.strokeStyle = '#8a5a2c'; g.lineWidth = H * 0.014; g.stroke(); g.fillStyle = '#2a2420'; g.font = `600 ${H * 0.062}px ${FONT}`; [...s].forEach((c, j) => g.fillText(c, x, H * (0.48 + j * 0.075))); });
    g.fillStyle = '#b7372a'; g.font = `700 ${H * 0.06}px ${FONT}`; g.fillText('往 動物園 →　To Taipei Zoo', W / 2, H * 0.92); }, { glow: 0.5, light: true }), 6.2, 1.5, 3.6);
  K.bx(M.steel, 6.0, 6.5, 0, 1.5, 4.3, 4.7); K.add(real('box', 'lightbox', 0.42, 0.24, (g, W, H) => { tint(g, W, H, 'rgba(31,79,156,.9)'); ink(g, '售票', W / 2, H * 0.38, H * 0.42, '#fff', YUAN); ink(g, 'TICKETS', W / 2, H * 0.78, H * 0.2, '#fff', FONT, { weight: 700 }); }, { oneSide: true, depth: 0.05, id: 'mrt-tix' }), 6.25, 1.36, 4.73); K.bx(M.dark, 6.1, 6.4, 0.5, 0.62, 4.7, 4.72);
  reg('mrt-muzha-line', K.done(-12.5, -17.4, 0), { foot: [[-7, 5.6, -1.6, 3.3], [5.4, 6.9, 1.3, 4.8]], near: [4.6, 5.0], radius: 3.6, plaque: [5.55, 1.5, 3.3, PI / 2] }); }

// YouBike: seven docking posts with card readers, five orange step-through bikes with yellow mudguards and baskets, a kiosk post
{ const K = Kit('youbike-dock');
  K.bx(M.concDk, -2.7, 3.3, 0, 0.04, -0.2, 0.2);
  for (let i = 0; i < 7; i++) { const x = -2.25 + i * 0.75; K.box(M.steel, 0.16, 0.62, 0.2, x, 0.35, 0); K.box(M.orange, 0.17, 0.1, 0.21, x, 0.7, 0); K.box(M.dark, 0.1, 0.012, 0.1, x, 0.756, 0); K.box(M.black, 0.05, 0.12, 0.03, x, 0.42, 0.11);
    if (i === 2 || i === 5) continue;
    K.push(x, 0, 0.16, rr(-0.04, 0.04));                                                                                    // one bike, its nose in the post
    [0.34, 1.38].forEach(z => { K.geo(M.rubber, TORUS, 0, 0.31, z, [0, PI / 2, 0], 0.29); K.geo(M.chrome, TORUS, 0, 0.31, z, [0, PI / 2, 0], 0.2); K.cyl(M.steelDk, 0.03, 0.03, 0.08, 0, 0.31, z, 8, [0, 0, PI / 2]); K.box(M.yellow, 0.07, 0.02, 0.5, 0, 0.64, z + (z > 1 ? -0.05 : 0.05), 0, z > 1 ? 0.25 : -0.25); });
    K.rod(M.orange, [0, 0.33, 1.36], [0, 0.34, 0.86], 0.028); K.rod(M.orange, [0, 0.34, 0.86], [0, 0.9, 0.52], 0.036); K.rod(M.orange, [0, 0.34, 0.86], [0, 0.86, 0.96], 0.03); K.rod(M.orange, [0, 0.33, 1.36], [0, 0.8, 0.98], 0.022); K.rod(M.chrome, [0, 0.31, 0.34], [0, 1.02, 0.5], 0.022);
    K.box(M.black, 0.16, 0.06, 0.26, 0, 0.92, 1.0); K.rod(M.black, [-0.27, 1.04, 0.52], [0.27, 1.04, 0.52], 0.016); [-0.27, 0.27].forEach(k => K.rod(M.black, [k, 1.04, 0.52], [k, 1.04, 0.62], 0.02));
    K.box(M.steelDk, 0.32, 0.2, 0.24, 0, 0.82, 0.26); K.box(M.dark, 0.28, 0.16, 0.2, 0, 0.85, 0.26); K.box(M.orange, 0.2, 0.3, 0.02, 0, 0.5, 1.56, 0, 0.2); K.cyl(M.steelDk, 0.07, 0.07, 0.03, 0.02, 0.34, 0.86, 10, [0, 0, PI / 2]);
    K.pop(); }
  K.box(M.steel, 0.34, 1.9, 0.26, 3.05, 0.95, 0); K.box(M.orange, 0.36, 0.32, 0.28, 3.05, 2.06, 0); K.add(real('box', 'lightbox', 0.32, 0.28, (g, W, H) => { tint(g, W, H, 'rgba(238,125,30,.9)'); ink(g, 'YouBike', W / 2, H * 0.32, H * 0.26, '#fff', FONT, { maxW: W * 0.86 }); ink(g, '微笑單車', W / 2, H * 0.7, H * 0.22, '#fff', YUAN, { maxW: W * 0.86 }); }, { oneSide: true, depth: 0.03, id: 'ubike-head', ppm: 600 }), 3.05, 2.06, 0.156);
  K.add(paint(0.26, 0.34, (g, W, H) => { g.fillStyle = '#0f2a3a'; g.fillRect(0, 0, W, H); g.fillStyle = '#9fe0ff'; g.font = `700 ${H * 0.12}px ${FONT}`; g.textAlign = 'center'; g.fillText('請靠卡', W / 2, H * 0.24); g.fillStyle = '#f2c12e'; g.fillRect(W * 0.2, H * 0.4, W * 0.6, H * 0.36); g.fillStyle = '#0f2a3a'; g.fillText('可借 5', W / 2, H * 0.62); }, { glow: 1.0 }), 3.05, 1.42, 0.135);
  reg('youbike-dock', K.done(-11.4, -13.3, 0), { foot: [[-2.7, 3.3, -0.3, 1.8]], near: [0.4, 2.8], plaque: [3.05, 1.05, 0.15] }); }

// 2013, NBA 臺北賽: a neighbourhood half court. A hoop with the ball caught in the net, a strip of maple floor, a bench with a fan's hand-written board
{ const K = Kit('nba-taipei-game-2013');
  K.add(decal(4.0, 3.9, (g, W, H) => { g.fillStyle = '#d6a15c'; g.fillRect(0, 0, W, H); for (let x = 0; x < W; x += W / 26) { g.fillStyle = `rgba(110,70,30,${0.05 + rnd() * 0.12})`; g.fillRect(x, 0, W / 26 - 1, H); g.fillStyle = 'rgba(60,35,15,.3)'; g.fillRect(x, 0, 1, H); }
    g.strokeStyle = '#f4efe2'; g.lineWidth = W * 0.014; g.strokeRect(W * 0.02, H * 0.02, W * 0.96, H * 0.96); g.fillStyle = 'rgba(183,55,42,.75)'; g.fillRect(W * 0.3, 0, W * 0.4, H * 0.62); g.strokeRect(W * 0.3, 0, W * 0.4, H * 0.62); g.beginPath(); g.arc(W / 2, H * 0.62, W * 0.2, 0, PI); g.stroke(); g.setLineDash([W * 0.03, W * 0.03]); g.beginPath(); g.arc(W / 2, H * 0.62, W * 0.2, PI, PI * 2); g.stroke(); }, { rough: 0.35 }), 0, 0.025, 1.9, 0, -PI / 2);
  K.box(M.steelDk, 0.7, 0.3, 0.9, 0, 0.15, -0.2); K.box(M.navy, 0.72, 0.9, 0.12, 0, 0.75, 0.26); K.rod(M.steelDk, [0, 0.3, -0.2], [0, 2.7, -0.1], 0.075, 10); K.rod(M.steelDk, [0, 2.7, -0.1], [0, 3.2, 0.62], 0.06, 10); K.rod(M.steelDk, [0, 2.2, -0.12], [0, 2.95, 0.6], 0.03);
  K.add(paint(1.8, 1.05, (g, W, H) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c22d22'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.04, H * 0.04, W - H * 0.08, H - H * 0.08); g.strokeRect(W * 0.34, H * 0.42, W * 0.32, H * 0.42); }, { glow: 0.15, light: true, depth: 0.05 }), 0, 3.3, 0.66);
  K.geo(M.orange, TORUS, 0, 3.05, 0.94, [PI / 2, 0, 0], 0.23); K.box(M.orange, 0.12, 0.04, 0.12, 0, 3.05, 0.72); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2, b = (i + 0.5) / 10 * PI * 2; K.rod(M.whiteP, [Math.sin(a) * 0.22, 3.05, 0.94 + Math.cos(a) * 0.22], [Math.sin(b) * 0.13, 2.62, 0.94 + Math.cos(b) * 0.13], 0.008, 4); K.rod(M.whiteP, [Math.sin(b) * 0.22, 3.05, 0.94 + Math.cos(b) * 0.22], [Math.sin(a) * 0.13, 2.62, 0.94 + Math.cos(a) * 0.13], 0.008, 4); }
  const ball = (x, y, z) => { K.sph(M.orange, 0.12, x, y, z); K.geo(M.dark, TORUS, x, y, z, [PI / 2, 0, 0], 0.118); K.geo(M.dark, TORUS, x, y, z, [0, 0, 0], 0.118); }; ball(0, 2.86, 0.94);
  K.push(-1.75, 0, 1.6, PI / 2); K.box(M.wood, 1.5, 0.05, 0.34, 0, 0.44, 0); [-0.6, 0.6].forEach(x => K.box(M.steelDk, 0.05, 0.44, 0.3, x, 0.22, 0)); K.box(M.whiteP, 0.3, 0.03, 0.2, -0.4, 0.48, 0); K.cyl(M.teal, 0.04, 0.04, 0.2, 0.1, 0.57, 0.05, 8); ball(0.5, 0.59, 0);
  K.add(label([['林書豪', 0.4, 0.3, 800, '#c22d22', KAI], ['歡迎回來 加油', 0.2, 0.72, 700, '#1c2f5c', KAI]], 0.9, 0.62, { bg: '#f6f0d8', border: '#1c2f5c', glow: 0.3 }), 0.1, 0.36, 0.28, 0, -0.22); K.pop();
  K.push(1.75, 0, 0.5); K.box(M.steelDk, 0.5, 0.04, 0.4, 0, 0.02, 0); [0, 1, 2].forEach(i => { ball(0, 0.2 + i * 0.25, 0); }); [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].forEach(([x, z]) => K.rod(M.steelDk, [x, 0, z], [x, 0.9, z], 0.012)); K.pop();
  const pc = piece(K, 'nba-taipei-game-2013', D.nba, 1.55, 3.0, -0.3);                                    // a bronze ball on a drum at the court's edge, a cast plate on its lectern
  reg('nba-taipei-game-2013', K.done(-5.2, -13.4, 0), { foot: [[-0.5, 0.5, -0.7, 0.4], [-2.0, -1.5, 0.8, 2.4], [1.5, 2.0, 0.2, 0.8]].concat(pc.foot), near: [0, 2.6], radius: 3.2, plaque: pc.plaque || [0.45, 1.25, 0.33] }); }

// ══ west side, north half: 動物園大門 and 圓仔 ═══════════════════════════════════════════════════
// two stone pylons under a long flat canopy with the name, a ticket booth, turnstiles, painted hills behind, an elephant and a giraffe at the gate
{ const K = Kit('taipei-zoo-gate');
  K.bx(M.stone, -3.0, 3.0, 0, 0.1, -1.0, 1.0); [-2.3, 2.3].forEach(x => { K.box(M.stone, 0.8, 3.3, 0.8, x, 1.65, 0); K.box(M.concLt, 0.9, 0.14, 0.9, x, 0.9, 0); K.box(M.concLt, 0.9, 0.14, 0.9, x, 2.6, 0); });
  K.box(M.concLt, 6.4, 0.5, 1.7, 0, 3.55, 0); K.box(M.green, 6.5, 0.1, 1.8, 0, 3.85, 0); K.box(M.green, 6.5, 0.1, 1.8, 0, 3.27, 0); [-2.6, -1.3, 0, 1.3, 2.6].forEach(x => K.box(M.tube, 0.5, 0.03, 0.1, x, 3.2, 0.3));
  // the gate's name: raised characters on a carved teak board in a moulded frame, read left to right, the English under it
  K.add(real('plaque', 'teak', 4.6, 0.66, (g, W, H) => { ink(g, '臺北市立動物園', W / 2, H * 0.42, H * 0.5, '#f3d27a', KAI, { maxW: W * 0.82, carve: true, shadow: 'rgba(20,10,4,.55)' }); ink(g, 'TAIPEI  ZOO', W / 2, H * 0.8, H * 0.15, '#f3d27a', FONT, { weight: 700, shadow: 'rgba(20,10,4,.5)' }); }, { id: 'zoo-gate', glow: 0.32 }), 0, 4.25, 0.5); [-1.9, 1.9].forEach(x => K.box(M.steelDk, 0.06, 0.4, 0.06, x, 4.0, 0.46));
  K.add(paint(3.8, 2.9, (g, W, H) => { const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f2c98a'); sky.addColorStop(0.6, '#f6e2b8'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    [['#8fb08a', 0.42, 0.1], ['#5f9460', 0.55, 0.14], ['#3d7a4a', 0.68, 0.1]].forEach(([c, y, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, H * (y + a * Math.sin(x / W * (5 + k * 2) + k * 2) * 0.6 - a * 0.3 * Math.sin(x / W * 13 + k))); g.lineTo(W, H); g.fill(); });
    g.fillStyle = '#d9c9a0'; g.beginPath(); g.moveTo(W * 0.38, H); g.quadraticCurveTo(W * 0.5, H * 0.74, W * 0.56, H * 0.66); g.lineTo(W * 0.6, H * 0.66); g.quadraticCurveTo(W * 0.6, H * 0.8, W * 0.7, H); g.fill();
    for (let i = 0; i < 26; i++) { const x = rnd() * W, y = H * (0.7 + rnd() * 0.28); if (Math.abs(x - W * 0.52) < W * 0.14) continue; g.fillStyle = ['#2f6e3c', '#3d8a4f', '#4f9a5a'][i % 3]; g.beginPath(); g.arc(x, y, H * (0.03 + rnd() * 0.04), 0, 7); g.fill(); } }, { glow: 0.25, light: true, oneSide: true }), 0, 1.6, -0.86);
  K.bx(M.concLt, -1.9, -0.6, 0.1, 2.4, -0.7, 0.5); K.bx(M.green, -2.0, -0.5, 2.4, 2.52, -0.8, 0.7); K.bx(M.warm, -1.7, -0.8, 1.15, 1.9, 0.5, 0.52); K.bx(M.steel, -1.75, -0.75, 1.05, 1.13, 0.48, 0.66); K.add(real('box', 'lightbox', 1.0, 0.3, (g, W, H) => { tint(g, W, H, 'rgba(179,39,30,.9)'); ink(g, '售票處', W / 2, H * 0.4, H * 0.5, '#fff3d6', YUAN); ink(g, 'TICKETS', W / 2, H * 0.82, H * 0.16, '#fff3d6', FONT, { weight: 700 }); }, { oneSide: true, depth: 0.08, id: 'zoo-tix' }), -1.25, 2.15, 0.56); person(K, -1.25, 0.1, 0, { y: 0.1, shirt: SHIRT[4] });
  [0.1, 0.9, 1.7].forEach(x => { K.box(M.steel, 0.16, 0.95, 0.9, x, 0.57, 0.2); K.box(M.green, 0.17, 0.06, 0.92, x, 1.06, 0.2); if (x < 1.5) [0, 1, 2].forEach(i => K.rod(M.chrome, [x + 0.08, 0.85, 0.2], [x + 0.08 + 0.5 * Math.cos(i * 2.1), 0.85 - 0.3 * Math.abs(Math.sin(i * 2.1)), 0.2 + 0.3 * Math.sin(i * 2.1)], 0.02)); });
  // the elephant (grey) on the left, the giraffe (ochre, brown patches) on the right
  K.push(-2.75, 0, 1.25, 0.5); K.box(M.stone, 1.6, 0.14, 1.0, 0, 0.07, 0); K.sph(M.grey, 0.5, 0, 0.92, 0, 1.25, 0.95, 0.9); K.sph(M.grey, 0.33, 0.62, 1.12, 0, 1, 1.05, 1); [[-0.38, -0.2], [-0.38, 0.2], [0.34, -0.2], [0.34, 0.2]].forEach(([x, z]) => K.cyl(M.grey, 0.13, 0.14, 0.6, x, 0.44, z, 10));
  [-1, 1].forEach(k => K.sph(M.grey, 0.26, 0.52, 1.14, k * 0.3, 0.3, 1.1, 0.8)); K.rod(M.grey, [0.86, 1.02, 0], [1.02, 0.6, 0], 0.085, 8); K.rod(M.grey, [1.02, 0.6, 0], [1.16, 0.42, 0], 0.065, 8); K.rod(M.grey, [1.16, 0.42, 0], [1.3, 0.56, 0], 0.05, 8); [-1, 1].forEach(k => K.rod(M.whiteP, [0.8, 0.98, k * 0.14], [1.02, 0.84, k * 0.17], 0.025)); K.rod(M.grey, [-0.6, 1.0, 0], [-0.74, 0.6, 0], 0.02); K.pop();
  K.push(2.9, 0, 1.2, -2.4); K.box(M.stone, 1.3, 0.14, 0.8, 0, 0.07, 0); K.sph(M.yellow, 0.36, 0, 1.56, 0, 1.4, 0.85, 0.8); [[-0.34, -0.14], [-0.34, 0.14], [0.36, -0.14], [0.36, 0.14]].forEach(([x, z]) => { K.cyl(M.yellow, 0.06, 0.05, 1.3, x, 0.78, z, 8); K.cyl(M.brown, 0.055, 0.06, 0.1, x, 0.19, z, 8); });
  K.rod(M.yellow, [0.4, 1.7, 0], [0.86, 3.2, 0], 0.12, 8); K.sph(M.yellow, 0.16, 0.98, 3.3, 0, 1.5, 0.9, 0.9); [-1, 1].forEach(k => { K.rod(M.brown, [0.86, 3.4, k * 0.07], [0.84, 3.56, k * 0.08], 0.018); K.sph(M.yellow, 0.05, 0.8, 3.38, k * 0.14, 1, 0.5, 1); });
  [[0.1, 1.72, 0.26], [-0.3, 1.6, 0.27], [0.3, 1.45, 0.25], [-0.1, 1.4, 0.26], [0.52, 2.2, 0.1], [0.64, 2.6, 0.095], [0.76, 2.95, 0.09], [-0.42, 1.78, 0.18]].forEach(([x, y, z], i) => [-1, 1].forEach(k => K.sph(M.brown, 0.09, x, y, k * z, 1, 1, 0.3))); K.rod(M.yellow, [-0.5, 1.6, 0], [-0.62, 1.1, 0], 0.018); K.pop();
  reg('taipei-zoo-gate', K.done(-17.3, -10.8, PI / 2), { foot: [[-3.6, 3.7, -1.1, 1.8]], near: [0.5, 2.6], radius: 3.4, plaque: [2.3, 1.5, 0.42] }); }

// 2014, 圓仔: a round cub in painted stone sitting on a log, one paw up, at a child's height, a queue rope and a bamboo pot beside it
{ const K = Kit('yuanzai-first-day-2014');
  K.cyl(M.stone, 0.8, 0.86, 0.1, 0, 0.05, 0, 20); K.cyl(M.woodDk, 0.2, 0.22, 1.0, 0, 0.3, 0, 12, [0, 0, PI / 2]); [-0.5, 0.5].forEach(x => K.cyl(M.toast, 0.17, 0.17, 0.012, x, 0.3, 0, 12, [0, 0, PI / 2]));
  K.sph(M.whiteP, 0.3, 0, 0.74, 0, 1.05, 1, 0.95); K.sph(M.whiteP, 0.22, 0, 1.13, 0.05, 1.1, 0.95, 1); K.sph(M.whiteP, 0.09, 0, 1.08, 0.24, 1.1, 0.8, 0.9); K.sph(M.black, 0.03, 0, 1.11, 0.32);
  [-1, 1].forEach(k => { K.sph(M.black, 0.075, k * 0.18, 1.32, 0, 1, 1, 0.6); K.sph(M.black, 0.055, k * 0.095, 1.17, 0.235, 0.9, 1.2, 0.5); K.sph(M.whiteP, 0.014, k * 0.095, 1.18, 0.262); K.sph(M.black, 0.13, k * 0.17, 0.5, 0.26, 0.9, 0.8, 1.5); K.sph(M.black, 0.07, k * 0.17, 0.5, 0.44); });
  K.rod(M.black, [-0.26, 0.9, 0.06], [-0.34, 0.62, 0.2], 0.085, 8); K.rod(M.black, [0.26, 0.9, 0.06], [0.44, 1.12, 0.16], 0.085, 8); K.sph(M.black, 0.09, 0.46, 1.15, 0.18); K.box(M.black, 0.5, 0.16, 0.3, 0, 0.93, -0.02);
  [[-0.95, 0.75], [0.95, 0.75]].forEach(([x, z]) => { K.cyl(M.gold, 0.03, 0.03, 0.9, x, 0.45, z, 10); K.cyl(M.gold, 0.13, 0.15, 0.04, x, 0.02, z, 14); K.sph(M.gold, 0.05, x, 0.93, z); }); for (let i = 0; i < 8; i++) { const t0 = i / 8, t1 = (i + 1) / 8, sag = t => 0.86 - 0.22 * Math.sin(t * PI); K.rod(M.red, [-0.95 + 1.9 * t0, sag(t0), 0.75], [-0.95 + 1.9 * t1, sag(t1), 0.75], 0.022); }
  K.cyl(M.brown, 0.2, 0.15, 0.3, -0.85, 0.15, -0.3, 12); [0, 1, 2, 3].forEach(i => { const x = -0.85 + (i - 1.5) * 0.07, z = -0.3 + (i % 2) * 0.08; K.rod(M.green, [x, 0.3, z], [x + (i - 1.5) * 0.05, 1.5 + i * 0.12, z], 0.02); [0.7, 1.0, 1.3].forEach(y => K.sph(M.leaf, 0.12, x + (i - 1.5) * 0.04 + 0.08, y + i * 0.06, z, 1.2, 0.25, 0.5)); });
  const pc = piece(K, 'yuanzai-first-day-2014', D.yuanzai, 1.75, -0.45, 0.55);                              // the day's front page in a lit case beside the cub
  reg('yuanzai-first-day-2014', K.done(-14.4, -6.6, 1.0), { foot: [[-1.1, 0.9, -0.6, 0.85]].concat(pc.foot), near: [0.2, 2.0], plaque: pc.plaque || [0.95, 1.2, 0.8, 0, 0.14] }); }

// ══ north side, east half: the night-market row, and the 2022 lantern over it ═════════════════════
// four steel pushcarts under one striped canopy, each with a glass food case, a gas ring, a light-box sign and a hand-written price board;
// one of them a balloon-dart game; bare bulbs and red lanterns overhead; folding tables and red stools in front
{ const K = Kit('night-market-stalls');
  [-4.3, -1.45, 1.45, 4.3].forEach(x => { K.box(M.steelDk, 0.07, 2.9, 0.07, x, 1.45, -1.2); K.box(M.steelDk, 0.07, 2.5, 0.07, x, 1.25, 1.1); K.rod(M.steelDk, [x, 2.9, -1.2], [x, 2.5, 1.1], 0.03); });
  for (let i = 0; i < 22; i++) K.box(i % 2 ? M.whiteP : M.red, 0.41, 0.03, 2.6, -4.3 + (i + 0.5) * 0.391, 2.74, -0.05, 0, 0.172); for (let i = 0; i < 22; i++) K.box(i % 2 ? M.whiteP : M.red, 0.41, 0.26, 0.02, -4.3 + (i + 0.5) * 0.391, 2.38, 1.23);
  K.rod(M.dark, [-4.3, 2.5, 1.1], [4.3, 2.5, 1.1], 0.012); for (let i = 0; i < 12; i++) { const x = -4.0 + i * 0.73; K.rod(M.dark, [x, 2.5, 1.1], [x, 2.2, 1.1], 0.006, 4); if (i % 3 === 1) { K.sph(M.lantern, 0.13, x, 2.06, 1.1, 1, 0.85, 1); K.cyl(M.dark, 0.05, 0.05, 0.03, x, 2.18, 1.1, 8); K.cyl(M.gold, 0.04, 0.04, 0.03, x, 1.94, 1.1, 8); } else K.sph(M.bulb, 0.045, x, 2.17, 1.1); }
  const DISH = [['蚵仔煎', '#f2c12e', '#b3271e', ['蚵仔煎 50', '蝦仁煎 60', '蛋　煎 35']], ['大雞排', '#b3271e', '#fff3d6', ['雞排 55', '甜不辣 30', '薯條 30']], ['射氣球', '#1f4f9c', '#fff3d6', ['十發 50', '中五發有獎']], ['珍珠奶茶', '#f6efd8', '#8a3a1a', ['珍奶 25', '青茶 15', '冬瓜茶 15']]];
  DISH.forEach(([dish, bg, fg, prices], i) => { const x = -3.2 + i * 2.13; K.push(x, 0, 0);
    K.add(real('box', 'lightbox', 0.38, 1.25, (g, W, H) => { tint(g, W, H, bg); g.globalAlpha = 0.82; tint(g, W, H, bg); g.globalAlpha = 1; ink(g, dish, W / 2, H * 0.5, Math.min(W * 0.7, H * 0.86 / ([...dish].length * 1.08)), fg, YUAN, { vertical: true, stroke: 'rgba(0,0,0,.18)', sw: 0.06 }); }, { id: 'stall-' + dish, depth: 0.12 }), -0.86, 1.86, 0.5); K.box(M.steelDk, 0.04, 2.5, 0.04, -0.86, 1.25, 0.46);
    K.add(paint(0.62, 0.5, (g, W, H) => { g.fillStyle = '#f6f0dc'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b3271e'; g.lineWidth = 4; g.strokeRect(4, 4, W - 8, H - 8); g.textAlign = 'center'; g.textBaseline = 'middle'; prices.forEach((p, j) => { g.fillStyle = j ? '#2a2420' : '#b3271e'; g.font = `800 ${H * 0.2}px ${KAI}`; g.save(); g.translate(W / 2, H * (0.22 + j * 0.28)); g.rotate((j - 1) * 0.03); g.fillText(p, 0, 0); g.restore(); }); }, { glow: 0.45, light: true, ppm: 300 }), 0.5, 2.05, 0.3, -0.12);
    if (i === 2) {                                                                                                         // the game stall: a board of balloons, a counter with darts, prizes on a shelf
      K.box(M.wood, 1.5, 1.5, 0.06, 0, 1.45, -0.7); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) K.sph(FLOWER[(r * 2 + c) % 6], 0.1, -0.6 + c * 0.24, 0.92 + r * 0.32, -0.62, 1, 1.15, 0.8);
      K.box(M.wood, 1.6, 0.9, 0.5, 0, 0.45, 0.35); K.box(M.red, 1.66, 0.04, 0.56, 0, 0.92, 0.35); [-0.5, -0.3, 0.2].forEach(dx => { K.rod(M.yellow, [dx, 0.95, 0.3], [dx + 0.12, 0.95, 0.42], 0.008, 4); K.sph(M.red, 0.018, dx + 0.12, 0.95, 0.42); }); [0.45, 0.62].forEach((dx, j) => { K.sph(j ? M.pink : M.yellow, 0.12, dx, 1.06, 0.3); K.sph(j ? M.pink : M.yellow, 0.08, dx, 1.22, 0.3); [-1, 1].forEach(k => K.sph(j ? M.pink : M.yellow, 0.035, dx + k * 0.06, 1.3, 0.3)); });
    } else {
      K.bx(M.steel, -0.75, 0.75, 0.3, 0.86, -0.36, 0.36); K.bx(M.chrome, -0.8, 0.8, 0.86, 0.9, -0.4, 0.4); K.bx(M.steelDk, -0.7, 0.7, 0.2, 0.3, -0.3, 0.3); [[-0.6, -0.28], [0.6, -0.28], [-0.6, 0.28], [0.6, 0.28]].forEach(([wx, wz]) => wheel(K, wx, 0.12, wz, 0.12, 0.06, [0, 0, PI / 2])); K.rod(M.chrome, [0.82, 0.8, -0.3], [0.82, 0.8, 0.3], 0.018);
      K.bx(M.pane, -0.74, 0.0, 0.9, 1.3, 0.02, 0.38); [[-0.74, 0.02], [0, 0.02], [-0.74, 0.38], [0, 0.38]].forEach(([fx, fz]) => K.box(M.chrome, 0.025, 0.42, 0.025, fx, 1.1, fz)); K.bx(M.chrome, -0.75, 0.01, 1.3, 1.32, 0.01, 0.39); K.box(M.tube, 0.6, 0.02, 0.03, -0.37, 1.28, 0.2);
      const food = i === 0 ? M.egg : i === 1 ? lit('#c9822e', '#7a4a10', 0.25) : M.brown; for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { K.box(M.chrome, 0.2, 0.02, 0.14, -0.6 + a * 0.23, 0.92, 0.12 + b * 0.17); if (i === 3) K.cyl(a % 2 ? M.cream2 : M.brown, 0.04, 0.035, 0.12, -0.6 + a * 0.23, 0.98, 0.12 + b * 0.17, 10); else K.sph(food, 0.07, -0.6 + a * 0.23, 0.96, 0.12 + b * 0.17, 1.2, 0.5, 0.9); }
      K.cyl(M.steelDk, 0.17, 0.17, 0.08, 0.42, 0.94, 0.05, 12); if (i === 3) { K.cyl(M.chrome, 0.16, 0.16, 0.4, 0.42, 1.14, 0.05, 14); K.cyl(M.chrome, 0.13, 0.16, 0.06, 0.42, 1.37, 0.05, 14); } else { K.cyl(M.black, 0.26, 0.12, 0.1, 0.42, 1.02, 0.05, 16); K.cyl(i ? M.yolk : M.egg, 0.22, 0.22, 0.012, 0.42, 1.06, 0.05, 14); K.rod(M.wood, [0.6, 1.06, 0.1], [0.86, 1.14, 0.3], 0.014); }
      K.cyl(M.blue, 0.14, 0.14, 0.4, 0.3, 0.5, -0.5, 10); K.cyl(M.steelDk, 0.03, 0.03, 0.08, 0.3, 0.74, -0.5, 8);                                                         // the gas bottle behind
      [-0.2, 0.1].forEach((bx, j) => { K.box(j ? M.stoolB : M.red, 0.12, 0.16, 0.08, bx - 0.4, 0.99, -0.3); });
      person(K, 0.1, -0.72, 0, { arms: 'fwd', shirt: SHIRT[(i * 3 + 1) % 8] }); }
    K.rod(M.dark, [0.1, 2.72, 0.2], [0.1, 2.05, 0.2], 0.006, 4); K.sph(M.bulb, 0.06, 0.1, 2.0, 0.2); K.cyl(M.steelDk, 0.12, 0.03, 0.08, 0.1, 2.07, 0.2, 10);
    K.pop(); });
  [[-2.3, 2.0, 0.2], [2.2, 2.05, -0.15]].forEach(([x, z, ry], j) => { foldTable(K, x, z, ry, 1.1, 0.7); [[-0.45, -0.62], [0.4, -0.62], [-0.4, 0.62], [0.45, 0.62]].forEach(([a, b], i) => stool(K, x + a, z + b, (i + j) % 3 === 2 ? M.stoolB : M.stool)); bowl(K, x - 0.2, 0.755, z, M.egg); bowl(K, x + 0.25, 0.755, z + 0.1, M.brown); K.cyl(M.red, 0.03, 0.03, 0.14, x, 0.82, z - 0.2, 8); K.box(M.steel, 0.1, 0.1, 0.1, x + 0.4, 0.8, z - 0.22); });
  person(K, -2.75, 2.62, 2.6, { sit: true }); person(K, 2.6, 1.43, -0.3, { sit: true });
  // over the lane: 夜市 in red neon tube on a dark backing panel, a yellow tube outline round it, as night-market arches are lit
  K.add(real('neon', 'neonback', 1.6, 0.6, (g, W, H) => { tint(g, W, H, 'rgba(10,8,14,.35)'); g.save(); g.shadowColor = '#f2c12e'; g.shadowBlur = H * 0.08; g.strokeStyle = '#ffd84a'; g.lineWidth = H * 0.025; g.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16); g.restore();
    ink(g, '夜市', W / 2, H * 0.42, H * 0.5, '#ff3b2e', YUAN, { neon: true }); ink(g, 'NIGHT  MARKET', W / 2, H * 0.8, H * 0.13, '#7fe6ff', FONT, { neon: true, weight: 700 }); }, { id: 'nm-neon' }), 0, 3.25, 1.0, 0, 0.1); [-0.6, 0.6].forEach(x => K.box(M.steelDk, 0.05, 0.5, 0.05, x, 2.9, 0.98));
  reg('night-market-stalls', K.done(11.7, -17.3, 0), { foot: [[-4.45, 4.45, -1.4, 0.8], [-3.0, -1.6, 1.4, 2.6], [1.5, 2.9, 1.4, 2.7]], near: [0, 2.6], radius: 4.2, plaque: [-4.3, 1.5, 1.2] }); }

// 2022, 台北燈節: the red and white saucer lantern hanging from a small crane arm, a ring of round lanterns under it (no mascot on top)
{ const K = Kit('lantern-fest-shilin-2022');
  K.box(M.concDk, 1.0, 0.3, 1.0, 0, 0.15, 0); [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([x, z]) => K.rod(M.yellow, [x, 0.3, z], [x, 5.0, z], 0.03)); for (let i = 0; i < 9; i++) { const y = 0.5 + i * 0.52, k = i % 2 ? 1 : -1; K.rod(M.yellow, [-0.14 * k, y, 0.14], [0.14 * k, y + 0.52, 0.14], 0.015, 4); K.rod(M.yellow, [0.14, y, -0.14 * k], [0.14, y + 0.52, 0.14 * k], 0.015, 4); }
  K.rod(M.yellow, [-0.7, 5.05, 0], [1.9, 5.05, 0], 0.045); K.rod(M.yellow, [0, 5.55, 0], [1.9, 5.05, 0], 0.02); K.rod(M.yellow, [0, 5.55, 0], [-0.7, 5.05, 0], 0.02); K.rod(M.yellow, [0, 5.0, 0], [0, 5.55, 0], 0.04); K.box(M.concDk, 0.4, 0.3, 0.4, -0.7, 4.85, 0); K.rod(M.dark, [1.6, 5.05, 0], [1.6, 4.3, 0], 0.012, 4);
  K.geo(M.red, HALF, 1.6, 3.95, 0, null, 0.42); K.sph(M.whiteP, 0.7, 1.6, 3.9, 0, 1, 0.22, 1); K.geo(M.lantern, TORUS, 1.6, 3.9, 0, [PI / 2, 0, 0], 0.72); K.cyl(M.warm, 0.3, 0.16, 0.14, 1.6, 3.72, 0, 16); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; K.sph(M.bulb, 0.035, 1.6 + Math.cos(a) * 0.52, 3.82, Math.sin(a) * 0.52); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, x = 1.6 + Math.cos(a) * 0.62, z = Math.sin(a) * 0.62; K.rod(M.dark, [x, 3.85, z], [x, 3.3, z], 0.005, 4); K.sph(i % 2 ? M.lantern : M.moon, 0.1, x, 3.2, z, 1, 0.9, 1); }
  const pc = piece(K, 'lantern-fest-shilin-2022', D.lantern, 0.5, 2.45, 0);                                  // a canopy of lanterns to walk under, in front of the crane
  reg('lantern-fest-shilin-2022', K.done(5.6, -15.4, 0), { foot: [[-0.6, 0.6, -0.6, 0.6]].concat(pc.foot), near: [0.4, 2.6], plaque: pc.plaque || [-0.3, 1.5, 0.24, 0, 0.14] }); }

// ══ east side, north half: 會唱歌的垃圾車 ═════════════════════════════════════════════════════════
// a yellow rear-loading compactor truck with its hopper open, a horn on the cab roof (and three notes of the tune in the air),
// two workers in reflective vests on the step, neighbours waiting with tied blue bags, three labelled recycling bins
{ const K = Kit('garbage-truck-music');
  K.bx(M.steelDk, -2.9, 2.6, 0.5, 0.72, -0.5, 0.5); [[-2.15, 1], [0.9, 1], [1.85, 1]].forEach(([x]) => [-1, 1].forEach(k => wheel(K, x, 0.46, k * 0.92, 0.46, 0.3, [PI / 2, 0, 0])));
  K.bx(M.truckY, -3.0, -1.55, 0.72, 2.5, -1.08, 1.08); K.bx(M.glassDk, -3.03, -2.98, 1.5, 2.3, -0.95, 0.95); [-1, 1].forEach(k => { K.bx(M.glassDk, -2.75, -1.85, 1.55, 2.25, k * 1.085, k * 1.09); K.box(M.black, 0.08, 0.3, 0.16, -2.95, 1.9, k * 1.24); K.sph(M.headlamp, 0.1, -3.02, 1.05, k * 0.8, 0.4, 1, 1); K.bx(M.whiteP, -2.9, -1.65, 1.0, 1.16, k * 1.085, k * 1.095); });
  K.bx(M.steelDk, -3.1, -2.98, 0.6, 0.9, -1.1, 1.1); K.box(M.amber, 0.5, 0.1, 0.16, -2.3, 2.56, 0); K.geo(M.chrome, CONE, -2.6, 2.74, 0.5, [0, 0, PI / 2], 0.2); K.box(M.steelDk, 0.1, 0.24, 0.1, -2.5, 2.62, 0.5);
  K.bx(M.truckY, -1.45, 2.1, 0.75, 2.75, -1.12, 1.12); for (let x = -1.3; x < 2.1; x += 0.56) [-1, 1].forEach(k => K.bx(M.yellow, x, x + 0.08, 0.8, 2.72, k * 1.12, k * 1.17)); K.bx(M.yellow, -1.45, 2.1, 2.7, 2.8, -1.16, 1.16); K.bx(M.yellow, -1.45, 2.1, 0.75, 0.86, -1.16, 1.16);
  [-1, 1].forEach(k => { const s = real('plate', 'tin', 2.2, 0.5, (g, W, H) => { tint(g, W, H, 'rgba(246,240,220,.86)'); g.fillStyle = '#2f6e3c'; g.fillRect(0, H * 0.86, W, H * 0.14); ink(g, '垃圾不落地', W * 0.5, H * 0.38, H * 0.5, '#2f6e3c', KAI, { maxW: W * 0.8 }); ink(g, '臺北市政府環境保護局', W * 0.5, H * 0.74, H * 0.15, '#2a2420', FONT, { weight: 700 }); }, { id: 'gt-side' + k, glow: 0.12 }); K.add(s, 0.3, 1.9, k * 1.185, k > 0 ? 0 : PI); });
  K.box(M.truckY, 1.3, 1.5, 2.3, 2.6, 2.05, 0, 0, 0, -0.35); K.bx(M.dark, 2.5, 3.0, 0.9, 1.9, -0.95, 0.95); K.bx(M.steelDk, 2.3, 3.1, 0.72, 0.92, -1.1, 1.1); K.bx(M.steelDk, 3.05, 3.12, 0.92, 1.3, -1.1, 1.1); [-1, 1].forEach(k => { K.bx(M.truckY, 2.2, 3.1, 0.9, 2.4, k * 1.0, k * 1.12); K.sph(M.amber, 0.07, 3.12, 2.2, k * 0.95); K.box(M.red, 0.04, 0.14, 0.2, 3.13, 1.0, k * 0.9); });
  K.bx(M.steelDk, 3.1, 3.5, 0.42, 0.48, -1.0, 1.0); [[3.3, -0.7, -0.5], [3.3, 0.72, 0.4]].forEach(([x, z, ry]) => person(K, x, z, PI / 2 + ry, { y: 0.48, vest: true, pants: PANTS[0], arms: 'fwd' }));
  [[2.9, 1.3, 0], [2.7, 1.4, 0.3], [2.8, 1.25, -0.4]].forEach(([x, y, z]) => K.sph(M.bagBlue, 0.2, x, y, z, 1, 0.9, 1));
  const NOTE = (x, y, z, s) => { const m = decal(s, s, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = '#fff2b0'; g.font = `700 ${H * 0.9}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', W / 2, H * 0.55); }, { alpha: true, ppm: 200 }); m.material.emissive = new T.Color(1, 0.9, 0.5); m.material.emissiveMap = m.material.map; m.material.side = T.DoubleSide; m.receiveShadow = false; K.add(m, x, y, z, 0.3); }; NOTE(-2.3, 3.3, 1.0, 0.34); NOTE(-1.7, 3.75, 1.15, 0.28); NOTE(-2.7, 4.15, 0.9, 0.24);
  // the queue behind the truck, each with a tied city bag, and the bins
  [[4.2, 0.5, -1.4, 0], [4.9, 0.9, -1.7, 3], [5.5, 0.35, -1.5, 5]].forEach(([x, z, ry, c]) => { person(K, x, z, ry, { shirt: SHIRT[c], arms: 'down' }); K.sph(M.bagBlue, 0.19, x - 0.1, 0.3, z + 0.3, 1, 1.1, 1); K.cyl(M.bagBlue, 0.02, 0.06, 0.1, x - 0.1, 0.52, z + 0.3, 6); });
  [['紙類', M.blue], ['瓶罐', M.green], ['廚餘', M.red]].forEach(([t, m], i) => { const x = 3.9 + i * 0.6; K.box(m, 0.5, 0.8, 0.5, x, 0.4, -0.9); K.box(M.steelDk, 0.54, 0.05, 0.54, x, 0.83, -0.9); K.add(label([[t, 0.6, 0.52, 800, '#fff']], 0.4, 0.22, { bg: '#2a2420', glow: 0.5, ppm: 300 }), x, 0.5, -0.64); });
  reg('garbage-truck-music', K.done(17.4, -11.4, -PI / 2), { foot: [[-3.2, 3.6, -1.25, 1.3], [3.6, 5.8, -1.2, 1.3]], near: [1.0, 2.6], radius: 4, plaque: [-1.3, 1.35, 1.2, 0, 0.18] }); }

// ══ east side, south half: 便利商店 and the pair of public phones ═══════════════════════════════════
// a glass front under a long backlit fascia (an invented name and colours), sliding doors, white tube light, the counter with a tea-egg
// cooker and an oden pot, drink fridges along the back, two shelf gondolas, a magazine rack at the window, a newspaper rack outside
{ const K = Kit('convenience-store'), W2 = 3.2, D = 1.9;
  K.bx(M.tileW, -W2, W2, 0, 0.1, -D, 0.3); K.bx(M.white, -W2, W2, 0.1, 3.0, -D, -D + 0.1); [-1, 1].forEach(k => K.bx(M.white, k * W2, k * (W2 - 0.12), 0.1, 3.0, -D, 0)); K.bx(M.concLt, -W2 - 0.05, W2 + 0.05, 2.9, 3.05, -D, 0.35); K.bx(M.whiteP, -W2, W2, 2.84, 2.9, -D, 0);
  // the fascia: one long backlit light box in a steel case, as 1990s Taipei chain-store fronts were: colour bands top and bottom,
  // the invented name in heavy black 黑體, a round 24H mark at the right end (no chain's logo or colours copied)
  K.add(real('box', 'lightbox', 6.5, 0.72, (g, W, H) => { tint(g, W, H, 'rgba(246,245,238,.55)'); g.fillStyle = '#f2b90f'; g.fillRect(0, 0, W, H * 0.16); g.fillStyle = '#1c2f5c'; g.fillRect(0, H * 0.16, W, H * 0.08); g.fillRect(0, H * 0.84, W, H * 0.16);
    ink(g, '巷口便利店', W * 0.42, H * 0.53, H * 0.46, '#0f1c40', FONT, { maxW: W * 0.6 }); g.fillStyle = '#f2b90f'; g.beginPath(); g.arc(W * 0.86, H * 0.52, H * 0.26, 0, 7); g.fill(); ink(g, '24H', W * 0.86, H * 0.53, H * 0.24, '#1c2f5c', FONT);
    ink(g, 'CORNER STORE · 全年無休', W * 0.42, H * 0.92, H * 0.12, '#ffffff', FONT, { weight: 600 }); }, { oneSide: true, id: 'cvs-fascia', glow: 0.75 }), 0, 3.4, 0.28);
  // glass front: fixed panes, a pair of sliding doors, frames
  [[-W2, -0.85], [0.85, W2]].forEach(([a, b]) => { K.bx(M.pane, a, b, 0.5, 2.84, -0.02, 0.01); K.bx(M.whiteP, a, b, 0.1, 0.5, -0.05, 0.03); K.bx(M.navy, a, b, 0.5, 0.58, -0.05, 0.04); }); K.bx(M.pane, -0.8, -0.02, 0.1, 2.5, 0.03, 0.05); K.bx(M.pane, 0.02, 0.8, 0.1, 2.5, 0.03, 0.05);
  [-W2 + 0.03, -1.9, -0.85, 0.85, 1.9, W2 - 0.03].forEach(x => K.box(M.chrome, 0.05, 2.74, 0.06, x, 1.47, 0)); [-0.8, -0.02, 0.02, 0.8].forEach(x => K.box(M.chrome, 0.035, 2.4, 0.03, x, 1.3, 0.04)); K.bx(M.chrome, -0.85, 0.85, 2.5, 2.6, -0.03, 0.06); K.bx(M.steelDk, -0.85, 0.85, 2.6, 2.84, -0.03, 0.03); K.bx(M.rubber, -0.8, 0.8, 0.1, 0.115, 0.06, 0.6);
  K.add(label([['歡迎光臨', 0.5, 0.52, 700, '#1c2f5c']], 0.5, 0.14, { bg: '#fdfdf8', glow: 0.5, ppm: 300 }), -0.41, 1.5, 0.062); K.add(label([['代收', 0.36, 0.3, 800, '#fff'], ['水電費', 0.3, 0.72, 700, '#fff']], 0.3, 0.3, { bg: '#c22d22', glow: 0.5, ppm: 300 }), 0.41, 1.5, 0.062);
  for (let x = -2.6; x < 3; x += 1.3) [-0.5, -1.3].forEach(z => K.box(M.tube, 1.0, 0.03, 0.08, x, 2.82, z));
  // back wall: four fridge doors of drinks
  K.add(paint(4.2, 2.1, (g, W, H) => { g.fillStyle = '#e9f3f5'; g.fillRect(0, 0, W, H); for (let d = 0; d < 4; d++) { const x0 = d * W / 4; for (let r = 0; r < 5; r++) { g.fillStyle = '#cfd8da'; g.fillRect(x0, H * (r + 1) / 5 - 6, W / 4, 6); for (let c = 0; c < 9; c++) { g.fillStyle = `hsl(${(d * 67 + r * 41 + c * 23) % 360},${50 + (c * 7) % 30}%,${42 + (r * 9) % 22}%)`; const bw = W / 4 / 10.5; g.fillRect(x0 + bw * 0.6 + c * bw * 1.08, H * r / 5 + H * 0.045, bw * 0.8, H / 5 - H * 0.045 - 6); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x0 + bw * 0.6 + c * bw * 1.08, H * r / 5 + H * 0.1, bw * 0.8, H * 0.03); } } g.strokeStyle = '#7d868a'; g.lineWidth = 8; g.strokeRect(x0 + 4, 4, W / 4 - 8, H - 8); g.fillStyle = '#5a6266'; g.fillRect(x0 + W / 4 - 26, H * 0.4, 8, H * 0.2); } }, { glow: 0.8, light: true, oneSide: true }), -1.0, 1.25, -D + 0.14);
  // the counter on the right: register, tea eggs, oden, a hot cabinet, cigarettes behind; a clerk
  K.bx(M.whiteP, 1.3, 3.0, 0.1, 1.0, -1.25, -0.8); K.bx(M.navy, 1.28, 3.02, 1.0, 1.05, -1.27, -0.78); K.box(M.black, 0.34, 0.24, 0.3, 2.6, 1.17, -1.02); K.box(M.neonB, 0.24, 0.14, 0.01, 2.6, 1.4, -0.97); K.cyl(M.dark, 0.16, 0.15, 0.2, 1.55, 1.15, -1.02, 14); K.cyl(M.brown, 0.14, 0.14, 0.01, 1.55, 1.255, -1.02, 12); for (let i = 0; i < 6; i++) K.sph(M.woodDk, 0.04, 1.55 + Math.cos(i) * 0.08, 1.27, -1.02 + Math.sin(i) * 0.08, 1, 1.2, 1);
  K.box(M.chrome, 0.44, 0.16, 0.3, 2.05, 1.13, -1.02); [[-0.1, M.toast], [0.1, M.meat]].forEach(([dx, m]) => { K.box(M.brown, 0.18, 0.01, 0.24, 2.05 + dx, 1.215, -1.02); [0, 1, 2].forEach(j => K.rod(M.wood, [2.05 + dx, 1.2, -1.1 + j * 0.08], [2.05 + dx, 1.36, -1.1 + j * 0.08], 0.006, 4)); [0, 1, 2].forEach(j => K.sph(m, 0.028, 2.05 + dx, 1.3, -1.1 + j * 0.08)); });
  K.add(label([['茶葉蛋 8元', 0.42, 0.5, 700, '#2a2420']], 0.36, 0.1, { bg: '#f2c12e', glow: 0.5, ppm: 360 }), 1.55, 0.9, -0.775); K.add(label([['關東煮', 0.5, 0.5, 700, '#fff']], 0.36, 0.1, { bg: '#c22d22', glow: 0.5, ppm: 360 }), 2.05, 0.9, -0.775);
  K.bx(M.whiteP, 1.3, 3.0, 1.5, 2.6, -D + 0.1, -D + 0.3); for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) K.box([M.red, M.whiteP, M.navy, M.gold, M.green][(r * 3 + c) % 5], 0.1, 0.2, 0.04, 1.42 + c * 0.135, 1.68 + r * 0.25, -D + 0.32); person(K, 2.3, -1.52, 0, { y: 0.1, shirt: std('#f2b90f', 0.8) });
  // two gondolas of snacks, the magazine rack at the left window
  [-2.2, -0.7].forEach((x, k) => { K.bx(M.whiteP, x - 0.28, x + 0.28, 0.1, 1.5, -1.6, -0.5); for (let r = 0; r < 4; r++) { K.bx(M.steel, x - 0.34, x + 0.34, 0.36 + r * 0.33, 0.39 + r * 0.33, -1.6, -0.5); for (let c = 0; c < 8; c++) [-1, 1].forEach(s => K.box(FLOWER[(r + c * 2 + k + (s > 0 ? 1 : 0)) % 6], 0.1, 0.2 + (c % 3) * 0.03, 0.13, x + s * 0.26, 0.5 + r * 0.33, -1.53 + c * 0.138)); } });
  K.bx(M.steelDk, -3.0, -1.2, 0.5, 1.5, -0.25, -0.12); for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) K.box(FLOWER[(r * 2 + c) % 6], 0.2, 0.28, 0.02, -2.86 + c * 0.25, 0.72 + r * 0.31, -0.1, 0, -0.15);
  // outside: newspaper rack, a bin, the mat, an air-conditioner on the roof
  K.push(-2.5, 0, 0.55); [[-0.3, 0], [0.3, 0]].forEach(([x]) => K.box(M.steelDk, 0.03, 1.1, 0.3, x, 0.55, 0)); [0.3, 0.6, 0.9].forEach((y, r) => { K.box(M.steelDk, 0.6, 0.02, 0.3, 0, y, 0, 0, 0.3); [-0.14, 0.14].forEach(x => K.box(r % 2 ? M.cream2 : M.whiteP, 0.25, 0.03, 0.26, x, y + 0.03, 0, 0, 0.3)); }); K.add(label([['報紙 10元', 0.5, 0.5, 700, '#fff']], 0.56, 0.12, { bg: '#1c2f5c', glow: 0.4, ppm: 300 }), 0, 1.14, 0.02); K.pop();
  K.cyl(M.steel, 0.2, 0.18, 0.7, 2.7, 0.35, 0.6, 14); K.cyl(M.dark, 0.21, 0.21, 0.03, 2.7, 0.7, 0.6, 14); K.box(M.grey, 1.0, 0.5, 0.6, 1.8, 3.3, -1.3); K.cyl(M.dark, 0.2, 0.2, 0.02, 1.8, 3.3, -0.99, 14, [PI / 2, 0, 0]);
  reg('convenience-store', K.done(16.3, 9.4, -PI / 2), { foot: [[-3.3, 3.3, -2.0, 0.25], [-2.9, -2.1, 0.25, 0.85]], near: [0, 1.6], radius: 3.6, plaque: [-3.17, 1.5, 0.08, 0, 0.18] }); }

// 公共電話: a pair of half-height hoods on posts, a coin phone and a card phone (their colours are a guess), coiled cords, a book shelf, a light box above
{ const K = Kit('public-phone-booth');
  K.bx(M.concDk, -1.0, 1.0, 0, 0.06, -0.35, 0.4);
  [[-0.48, M.blue, '投幣'], [0.48, M.green, '插卡']].forEach(([x, body, t]) => { K.push(x, 0, 0); K.box(M.steelDk, 0.09, 2.2, 0.09, 0, 1.1, -0.25);
    K.bx(M.steel, -0.42, 0.42, 2.0, 2.06, -0.3, 0.3); K.bx(M.steel, -0.42, 0.42, 0.95, 2.0, -0.3, -0.27); [-1, 1].forEach(k => { K.bx(M.pane, k * 0.4, k * 0.42, 1.0, 2.0, -0.28, 0.3); K.box(M.steel, 0.03, 1.02, 0.03, k * 0.41, 1.5, 0.3); }); K.bx(M.steel, -0.42, 0.42, 0.95, 1.0, -0.3, 0.12);
    K.box(body, 0.3, 0.46, 0.14, 0, 1.52, -0.19); K.box(M.chrome, 0.26, 0.06, 0.02, 0, 1.69, -0.115); K.add(paint(0.16, 0.16, (g, W, H) => { g.fillStyle = '#2b2e33'; g.fillRect(0, 0, W, H); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.fillStyle = '#d7dadc'; g.fillRect(W * (0.1 + c * 0.3), H * (0.06 + r * 0.24), W * 0.22, H * 0.17); g.fillStyle = '#16181c'; g.font = `700 ${H * 0.13}px ${FONT}`; g.textAlign = 'center'; g.fillText('123456789*0#'[r * 3 + c], W * (0.21 + c * 0.3), H * (0.19 + r * 0.24)); } }, { glow: 0.2, depth: 0.012, ppm: 500 }), 0.04, 1.47, -0.112);
    K.box(M.black, 0.06, 0.26, 0.06, -0.19, 1.52, -0.14); K.sph(M.black, 0.045, -0.19, 1.66, -0.13); K.sph(M.black, 0.045, -0.19, 1.38, -0.13); for (let i = 0; i < 9; i++) { const t0 = i / 9, t1 = (i + 1) / 9, f = u => [-0.19 + 0.06 * Math.sin(u * 28), 1.36 - 0.36 * Math.sin(u * PI) , -0.12 + 0.1 * u]; K.rod(M.chrome, f(t0), f(t1), 0.008, 4); }
    K.box(M.black, 0.1, 0.02, 0.02, 0.06, 1.34, -0.115); K.box(M.whiteP, 0.3, 0.05, 0.22, 0, 1.03, 0); K.box(M.yellow, 0.26, 0.04, 0.2, 0, 1.075, 0);
    K.add(label([[t, 0.6, 0.52, 700, '#fff']], 0.3, 0.1, { bg: '#2a2420', glow: 0.5, ppm: 400 }), 0, 1.84, -0.26); K.pop(); });
  K.add(real('box', 'lightbox', 1.5, 0.3, (g, W, H) => { tint(g, W, H, 'rgba(250,250,246,.6)'); g.fillStyle = '#c22d22'; g.fillRect(0, H * 0.88, W, H * 0.12); ink(g, '公用電話', W / 2, H * 0.38, H * 0.48, '#1f4f9c', YUAN); ink(g, 'PUBLIC  TELEPHONE', W / 2, H * 0.73, H * 0.15, '#1f4f9c', FONT, { weight: 700 }); }, { id: 'phone-head', depth: 0.12 }), 0, 2.25, 0.05);
  reg('public-phone-booth', K.done(17.2, 14.1, -PI / 2), { foot: [[-1.0, 1.0, -0.4, 0.45]], near: [-0.4, 1.6], plaque: [0, 1.0, 0.42, 0, 0.13] }); }

// ══ south-east corner: 大安森林公園 under the banyan, and the 2016 crowd with their phones ═══════════
// a lawn, a ring bench round the trunk, the park's name stone, a pond with an island and an egret, a low hedge, a jogging-path marker
{ const lawn = new T.Mesh(new T.CircleGeometry(4.3, 40), M.grass); lawn.rotation.x = -PI / 2; lawn.position.set(12.9, 0.025, 13.6); lawn.receiveShadow = true; scene.add(lawn);
  const K = Kit('daan-forest-park');
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2, b = (i + 1) / 14 * PI * 2; if (i === 3) continue; K.push(Math.sin((a + b) / 2) * 1.45, 0, Math.cos((a + b) / 2) * 1.45, (a + b) / 2); K.box(M.wood, 0.66, 0.05, 0.42, 0, 0.45, 0); K.box(M.steelDk, 0.05, 0.45, 0.36, 0, 0.225, 0); K.pop(); }
  K.cyl(M.stone, 1.2, 1.24, 0.3, 0, 0.15, 0, 20); K.cyl(M.soil, 1.12, 1.12, 0.02, 0, 0.3, 0, 20);
  K.push(-1.9, 0, -2.5, -2.3); K.box(M.concDk, 2.0, 0.14, 0.7, 0, 0.07, 0); K.sph(M.stone, 0.62, 0, 0.6, 0, 1.45, 0.82, 0.42); K.add(real('stone', 'stone', 1.36, 0.4, (g, W, H) => { ink(g, '大安森林公園', W / 2, H * 0.42, H * 0.52, '#b3271e', KAI, { maxW: W * 0.88, carve: true }); ink(g, 'DAAN FOREST PARK', W / 2, H * 0.84, H * 0.13, '#3a3a36', FONT, { weight: 700, carve: true }); }, { id: 'daan-stone', body: STONE, glow: 0.1 }), 0, 0.62, 0.262, 0, -0.08); [-0.8, 0.8].forEach(x => { K.sph(M.hedge, 0.2, x, 0.26, 0.1, 1.2, 0.8, 1); K.sph(FLOWER[1], 0.05, x, 0.42, 0.18); }); K.pop();
  K.push(2.0, 0, -2.5); K.cyl(M.stone, 1.25, 1.3, 0.2, 0, 0.1, 0, 22); K.cyl(M.water, 1.12, 1.12, 0.02, 0, 0.2, 0, 22); K.cyl(M.grass, 0.4, 0.46, 0.1, 0.2, 0.24, -0.1, 12); [[0.1, -0.3], [0.42, 0], [-0.02, 0.12]].forEach(([x, z], i) => { K.rod(M.green, [x, 0.28, z], [x + 0.03, 0.8 + i * 0.1, z], 0.012, 4); K.sph(M.brown, 0.025, x + 0.03, 0.8 + i * 0.1, z, 1, 3, 1); });
  K.rod(M.dark, [0.22, 0.29, -0.02], [0.22, 0.58, -0.02], 0.008, 4); K.rod(M.dark, [0.28, 0.29, -0.06], [0.27, 0.58, -0.04], 0.008, 4); K.sph(M.whiteP, 0.1, 0.25, 0.64, -0.03, 1.5, 0.9, 0.9); K.rod(M.whiteP, [0.36, 0.68, -0.03], [0.44, 0.9, -0.03], 0.022); K.sph(M.whiteP, 0.04, 0.45, 0.93, -0.03); K.rod(M.yellow, [0.47, 0.93, -0.03], [0.58, 0.9, -0.03], 0.01, 4);
  [[-0.7, 0.5], [-0.4, 0.75], [0.6, 0.6]].forEach(([x, z]) => K.cyl(M.green, 0.14, 0.14, 0.01, x, 0.215, z, 10)); K.sph(FLOWER[2], 0.04, -0.4, 0.24, 0.75); K.pop();
  for (let i = 0; i < 9; i++) { const a = -0.5 + i * 0.2; K.sph(M.hedge, 0.3, Math.sin(a) * 3.9 + 0.3, 0.26, Math.cos(a) * 3.9 - 3.7 + 3.6, 1.2, 0.85, 1); }
  K.push(-2.7, 0, 1.3, -1.6); K.box(M.steelDk, 0.06, 1.3, 0.06, 0, 0.65, 0); K.add(label([['慢跑步道', 0.3, 0.3, 800, '#fff'], ['一圈 2.3 公里 →', 0.22, 0.72, 600, '#fff']], 0.7, 0.4, { bg: '#3d7a4a', glow: 0.5 }), 0, 1.2, 0.04); K.pop();
  person(K, 0.75, -1.3, 2.6, { sit: true, shirt: SHIRT[4], y: 0.02 });
  reg('daan-forest-park', K.done(12.5, 13.8, 0), { foot: [[-1.75, 1.75, -1.75, 1.75], [0.8, 3.2, -3.7, -1.3], [-2.9, -1.0, -3.0, -2.0]], near: [-1.2, -3.6], radius: 3.4, plaque: [-2.75, 0.75, -1.85, -2.3, 0.14] }); }

// 2016, 北投公園: a hand holding up a phone taller than a person, a plain map and a pin on its screen, a ring of footprints all facing it
{ const K = Kit('pokemon-go-beitou-2016');
  K.add(decal(3.2, 3.2, (g, W, H) => { g.clearRect(0, 0, W, H); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2 + 0.2, r = W * (0.3 + (i % 3) * 0.06), x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r; g.save(); g.translate(x, y); g.rotate(a - PI / 2); g.fillStyle = 'rgba(250,245,225,.8)'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * W * 0.022, k * W * 0.012, W * 0.014, W * 0.03, 0, 0, 7); g.fill(); g.beginPath(); g.arc(k * W * 0.022, k * W * 0.012 + W * 0.042, W * 0.011, 0, 7); g.fill(); }); g.restore(); } }, { alpha: true }), 0, 0.03, 0, 0, -PI / 2);
  K.cyl(M.stone, 0.6, 0.66, 0.2, 0, 0.1, 0, 20); K.cyl(M.skin, 0.2, 0.24, 0.9, 0, 0.65, -0.06, 14); K.cyl(std('#2f5f8f', 0.8), 0.25, 0.27, 0.36, 0, 0.38, -0.06, 14); K.box(M.skin, 0.62, 0.7, 0.26, 0, 1.4, -0.1); K.rod(M.skin, [-0.3, 1.2, -0.04], [-0.48, 1.62, 0.1], 0.085, 8); K.sph(M.skin, 0.085, -0.48, 1.64, 0.1);
  [0, 1, 2, 3].forEach(i => { K.rod(M.skin, [0.3, 1.2 + i * 0.16, -0.12], [0.42, 1.24 + i * 0.16, 0.08], 0.065, 8); K.rod(M.skin, [0.42, 1.24 + i * 0.16, 0.08], [0.3, 1.26 + i * 0.16, 0.14], 0.06, 8); });
  K.box(M.black, 0.84, 1.62, 0.09, 0, 2.0, 0.07, 0, -0.06); K.add(paint(0.74, 1.46, (g, W, H) => { g.fillStyle = '#bfe3c8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f1e6'; g.lineWidth = W * 0.07; [[0, 0.3, 1, 0.42], [0.2, 0, 0.36, 1], [0.7, 0, 0.6, 1], [0, 0.72, 1, 0.66]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(W * a, H * b); g.lineTo(W * c, H * d); g.stroke(); });
    g.fillStyle = '#8fc7e0'; g.beginPath(); g.ellipse(W * 0.84, H * 0.52, W * 0.12, H * 0.05, 0.3, 0, 7); g.fill(); g.fillStyle = '#c22d22'; g.beginPath(); g.arc(W * 0.46, H * 0.44, W * 0.09, PI, 0); g.lineTo(W * 0.46, H * 0.56); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(W * 0.46, H * 0.44, W * 0.035, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,40,60,.85)'; g.beginPath(); g.arc(W * 0.5, H * 0.26, W * 0.13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `800 ${W * 0.2}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', W * 0.5, H * 0.265); g.fillStyle = '#1c2f5c'; g.fillRect(0, H * 0.86, W, H * 0.14); g.fillStyle = '#fff'; g.font = `700 ${W * 0.1}px ${FONT}`; g.fillText('北投公園 · 附近有東西', W / 2, H * 0.93); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H * 0.045); }, { glow: 1.0, depth: 0.02, oneSide: true, light: true }), 0, 2.0, 0.125, 0, -0.06);
  K.box(M.whiteP, 0.3, 0.5, 0.12, 0.75, 0.3, 0.4, 0.4); K.rod(M.whiteP, [0.75, 0.5, 0.4], [0.42, 1.3, 0.1], 0.01, 4);                                                    // a power bank on its cable
  const pc = piece(K, 'pokemon-go-beitou-2016', D.pokemon, -0.4, 2.2, 0, 0.85);                             // a field of phone glows round a map pin, the crowd as light
  reg('pokemon-go-beitou-2016', K.done(8.6, 12.2, -1.9), { foot: [[-0.7, 0.95, -0.5, 0.6]].concat(pc.foot), near: [0, 2.2], plaque: pc.plaque || [0.5, 1.0, 0.35, 0, 0.14] }); }

// ══ west side, south half: 早餐店 ═════════════════════════════════════════════════════════════════
// a fully open front under a long red sign board with yellow stripes and a blue-and-white awning; the steel griddle at the pavement edge with
// the cook behind it, toast, eggs, a sandwich warmer and sealed cups on the counter, a backlit menu board, folding tables and red stools
{ const K = Kit('breakfast-shop'), W2 = 3.0, D = 1.95;
  K.bx(M.tileG, -W2, W2, 0, 0.08, -D, 0.2); K.bx(M.tileW, -W2, W2, 0.08, 3.0, -D, -D + 0.1); [-1, 1].forEach(k => { K.bx(M.tileW, k * W2, k * (W2 - 0.14), 0.08, 3.0, -D, 0); K.bx(M.conc, k * (W2 + 0.02), k * (W2 - 0.3), 0, 3.0, -0.3, 0.02); }); K.bx(M.concLt, -W2, W2, 2.9, 3.05, -D, 0.05);
  // the board: a long red acrylic light box in a steel case, the name in white 圓體, yellow slash stripes at both ends, the menu line under it
  K.add(real('box', 'lightbox', 6.0, 0.8, (g, W, H) => { tint(g, W, H, 'rgba(194,45,34,.9)'); g.save(); g.beginPath(); g.rect(0, 0, H * 0.8, H); g.rect(W - H * 0.8, 0, H * 0.8, H); g.clip(); g.strokeStyle = '#f2c12e'; g.lineWidth = H * 0.14; for (let x = -H; x < W + H; x += H * 0.34) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); } g.restore();
    ink(g, '晨光早餐店', W / 2, H * 0.4, H * 0.52, '#ffffff', YUAN, { maxW: W - H * 2, stroke: 'rgba(120,20,12,.5)', sw: 0.08 }); ink(g, '漢堡 · 三明治 · 蛋餅 · 奶茶　　06:00–11:00', W / 2, H * 0.82, H * 0.15, '#fff3d6', FONT, { weight: 700, maxW: W - H * 2 }); }, { oneSide: true, id: 'bfast-board', glow: 0.8 }), 0, 3.45, 0.11);
  for (let i = 0; i < 20; i++) { K.box(i % 2 ? M.whiteP : M.blue, 0.3, 0.025, 1.25, -W2 + (i + 0.5) * 0.3, 2.75, 0.6, 0, 0.32); K.box(i % 2 ? M.whiteP : M.blue, 0.3, 0.2, 0.02, -W2 + (i + 0.5) * 0.3, 2.47, 1.19); } [-2.9, 0, 2.9].forEach(x => K.rod(M.steelDk, [x, 2.9, 0.02], [x, 2.56, 1.18], 0.018));
  [-1.6, 0.6].forEach(x => K.box(M.tube, 1.2, 0.03, 0.08, x, 2.86, -0.9));
  // the griddle counter on the left, at the pavement edge
  K.bx(M.steel, -2.8, -0.5, 0.08, 0.9, -0.35, 0.3); K.bx(M.chrome, -2.84, -0.46, 0.9, 0.94, -0.4, 0.34); K.bx(M.black, -2.7, -1.5, 0.94, 0.97, -0.3, 0.26); K.bx(M.chrome, -2.74, -1.46, 0.94, 1.0, 0.26, 0.3); K.bx(M.pane, -2.8, -0.5, 0.94, 1.3, 0.31, 0.33);
  [[-2.5, 0.05], [-2.25, -0.1], [-2.0, 0.08]].forEach(([x, z]) => { K.cyl(M.egg, 0.085, 0.085, 0.012, x, 0.978, z, 12); K.sph(M.yolk, 0.032, x + 0.01, 0.985, z, 1, 0.6, 1); }); [0, 1, 2].forEach(i => K.box(M.meat, 0.16, 0.012, 0.035, -1.72, 0.978, -0.15 + i * 0.06, 0.2)); K.box(M.toast, 0.22, 0.03, 0.12, -1.72, 0.985, 0.1, 0.3); K.box(M.chrome, 0.1, 0.01, 0.14, -2.1, 0.99, -0.22, 0.5); K.rod(M.woodDk, [-2.06, 0.99, -0.16], [-1.94, 1.05, -0.02], 0.012);
  [0, 1].forEach(i => { for (let j = 0; j < 7 + i * 2; j++) K.box(j % 4 ? M.whiteP : M.toast, 0.13, 0.016, 0.13, -1.25 + i * 0.17, 0.95 + j * 0.017, 0.05); }); for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) K.sph(a + b & 1 ? M.egg : M.toast, 0.024, -1.3 + a * 0.05, 0.975, -0.28 + b * 0.05, 1, 1.25, 1); K.box(M.brown, 0.28, 0.02, 0.24, -1.2, 0.95, -0.2);
  K.bx(M.chrome, -0.9, -0.55, 0.94, 0.98, -0.3, 0.2); K.bx(M.pane, -0.9, -0.55, 0.98, 1.3, -0.3, 0.2); K.box(M.warm, 0.3, 0.02, 0.4, -0.725, 1.29, -0.05); [0, 1].forEach(r => [0, 1, 2].forEach(c => K.box(M.toast, 0.1, 0.07, 0.1, -0.83 + r * 0.2, 1.03, -0.22 + c * 0.16, 0.785)));
  K.rod(M.dark, [-1.6, 2.9, 0.1], [-1.6, 2.2, 0.1], 0.006, 4); K.sph(M.bulb, 0.055, -1.6, 2.15, 0.1); K.box(M.steel, 1.5, 0.3, 0.7, -2.0, 2.3, -0.5, 0, 0.2); K.box(M.steelDk, 0.3, 0.6, 0.3, -2.0, 2.65, -0.7);                             // the hood and its duct
  person(K, -1.9, -0.75, 0, { y: 0.08, arms: 'fwd', shirt: M.whiteP }); K.box(M.red, 0.34, 0.5, 0.02, -1.9, 0.9 + 0.08, -0.555);
  // the drinks counter on the right: sealed cups, a tea urn, a sealing machine; takeaway bags hanging
  K.bx(M.steel, 0.9, 2.8, 0.08, 0.9, -0.35, 0.25); K.bx(M.chrome, 0.86, 2.84, 0.9, 0.94, -0.4, 0.3); for (let i = 0; i < 8; i++) { K.cyl(i % 3 ? M.cream2 : M.brown, 0.045, 0.035, 0.13, 1.05 + i * 0.12, 1.005, 0.15, 10); K.cyl(M.red, 0.047, 0.047, 0.006, 1.05 + i * 0.12, 1.073, 0.15, 10); }
  K.cyl(M.chrome, 0.16, 0.16, 0.42, 2.5, 1.15, -0.1, 14); K.cyl(M.steelDk, 0.17, 0.17, 0.03, 2.5, 1.37, -0.1, 14); K.rod(M.dark, [2.5, 1.02, 0.07], [2.5, 1.02, 0.14], 0.012); K.box(M.whiteP, 0.3, 0.36, 0.3, 2.05, 1.12, -0.15); K.box(M.red, 0.3, 0.06, 0.3, 2.05, 1.33, -0.15);
  [1.2, 1.36, 1.52].forEach((x, i) => { K.rod(M.steelDk, [x, 1.9, 0.3], [x, 1.84, 0.3], 0.006, 4); K.box(M.whiteP, 0.13, 0.24, 0.05, x, 1.72, 0.3, i * 0.3); K.box(M.red, 0.135, 0.02, 0.055, x, 1.76, 0.3, i * 0.3); K.box(M.red, 0.135, 0.02, 0.055, x, 1.68, 0.3, i * 0.3); }); K.rod(M.steelDk, [0.95, 1.9, 0.3], [1.7, 1.9, 0.3], 0.01);
  // the back wall: the lit menu, a calendar, a fridge, a fan; inside tables
  K.add(paint(3.4, 0.9, (g, W, H) => { g.fillStyle = '#fffdf2'; g.fillRect(0, 0, W, H); const cols = [['漢堡類', ['豬肉堡 25', '雞腿堡 40', '起司堡 30', '鱈魚堡 35']], ['三明治', ['火腿蛋 25', '鮪魚蛋 30', '總匯 45', '肉鬆蛋 25']], ['蛋餅', ['原味 20', '玉米 25', '起司 30', '培根 30']], ['中式', ['蘿蔔糕 25', '鐵板麵 40', '鍋貼 35', '飯糰 30']], ['飲料', ['奶茶 15', '豆漿 15', '紅茶 10', '咖啡 25']]];
    g.textBaseline = 'middle'; cols.forEach(([h, rows], c) => { const x0 = W * (0.01 + c * 0.198), cw = W * 0.19; g.fillStyle = ['#c22d22', '#1f4f9c', '#2f6e3c', '#b06a12', '#7a2f6a'][c]; g.fillRect(x0, H * 0.04, cw, H * 0.17); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 ${H * 0.12}px ${FONT}`; g.fillText(h, x0 + cw / 2, H * 0.13);
      rows.forEach((r, i) => { const [n, p] = r.split(' '); g.fillStyle = '#2a2420'; g.textAlign = 'left'; g.font = `600 ${H * 0.1}px ${FONT}`; g.fillText(n, x0 + cw * 0.04, H * (0.32 + i * 0.17)); g.fillStyle = '#c22d22'; g.textAlign = 'right'; g.fillText(p, x0 + cw * 0.97, H * (0.32 + i * 0.17)); }); }); }, { glow: 0.9, light: true, oneSide: true, depth: 0.08 }), -0.3, 2.3, -D + 0.16);
  K.bx(M.whiteP, 2.0, 2.8, 0.08, 1.9, -D + 0.1, -D + 0.75); K.bx(M.chrome, 2.02, 2.05, 0.9, 1.5, -D + 0.75, -D + 0.78); K.add(label([['15', 0.5, 0.56, 800, '#c22d22'], ['星期日', 0.16, 0.14, 700, '#fff']], 0.34, 0.44, { bg: '#fffdf2', band: '#c22d22', bandH: 0.26, glow: 0.3, ppm: 300 }), 1.5, 1.5, -D + 0.12);
  [[0.4, -1.15, 0.1], [-1.2, -1.3, -0.05]].forEach(([x, z, ry], j) => { foldTable(K, x, z, ry, 1.0, 0.65, j ? M.steel : M.cream2); [[-0.3, -0.55], [0.3, -0.55], [-0.3, 0.55], [0.3, 0.55]].forEach(([a, b]) => stool(K, x + a, z + b)); K.cyl(M.red, 0.025, 0.025, 0.14, x + 0.3, 0.82, z, 8); K.cyl(M.dark, 0.025, 0.025, 0.14, x + 0.36, 0.82, z + 0.05, 8); });
  person(K, 0.7, -1.67, 0.1, { sit: true, y: 0.02, shirt: SHIRT[2] }); bowl(K, 0.6, 0.755, -1.25, M.egg);
  // outside on the pavement: one more table with stools, a standing menu, a potted plant
  foldTable(K, 1.6, 1.25, 0.12, 1.0, 0.65, M.cream2); [[-0.35, -0.55], [0.35, -0.55], [-0.35, 0.55], [0.3, 0.6]].forEach(([a, b], i) => stool(K, 1.6 + a, 1.25 + b, i === 3 ? M.stoolB : M.stool)); K.box(M.whiteP, 0.2, 0.015, 0.2, 1.5, 0.76, 1.2); K.box(M.toast, 0.12, 0.05, 0.12, 1.5, 0.79, 1.2, 0.785); K.cyl(M.cream2, 0.04, 0.032, 0.12, 1.85, 0.81, 1.3, 10);
  K.push(-0.1, 0, 0.75, 0.2); K.box(M.woodDk, 0.5, 0.9, 0.03, 0, 0.45, 0.1, 0, -0.2); K.box(M.woodDk, 0.5, 0.9, 0.03, 0, 0.45, -0.1, 0, 0.2); K.add(label([['今日特餐', 0.2, 0.18, 800, '#f2c12e', KAI], ['蛋餅＋奶茶', 0.19, 0.48, 700, '#fff', KAI], ['35 元', 0.26, 0.8, 800, '#f08ab0', KAI]], 0.44, 0.78, { bg: '#1f2a24', glow: 0.35, ppm: 300 }), 0, 0.46, 0.125, 0, -0.2); K.pop();
  K.cyl(M.brown, 0.18, 0.13, 0.3, 2.75, 0.15, 0.6, 12); K.sph(M.leaf, 0.3, 2.75, 0.62, 0.6, 1, 1.2, 1);
  reg('breakfast-shop', K.done(-16.35, 11.6, PI / 2), { foot: [[-3.1, 3.1, -2.05, 0.38], [0.9, 2.3, 0.5, 2.0], [-0.45, 0.25, 0.5, 1.0]], near: [-0.6, 1.9], radius: 3.6, plaque: [-3.02, 1.5, 0.1, 0, 0.18] }); }

// 開拓動漫祭 FF: a fair table under a cloth, stacks of thin self-published books, a 新刊 card, a poster stand, a tote bag, the queue's 最後尾 sign
{ const K = Kit('fancy-frontier-ff');
  K.box(M.navy, 1.9, 0.72, 0.8, 0, 0.38, 0); K.box(M.whiteP, 1.96, 0.03, 0.86, 0, 0.75, 0); K.add(kitFace(DESIGN.wideTexture(E, P('fancy-frontier-ff'), D.ff, 1024, 0.31, 'skirt'), 1.9, 0.6, 0.3), 0, 0.42, 0.412);   // the table cloth printed with the fair's art
  [[-0.7, 7, 0], [-0.42, 4, 2], [-0.1, 9, 4], [0.25, 5, 1], [0.55, 6, 3]].forEach(([x, n, c]) => { for (let i = 0; i < n; i++) K.box(i === n - 1 ? FLOWER[c] : M.whiteP, 0.22, 0.012, 0.3, x + (i % 2) * 0.005, 0.772 + i * 0.012, 0.05, (i % 3 - 1) * 0.03); });
  K.box(FLOWER[2], 0.22, 0.3, 0.012, 0.2, 0.94, -0.22, 0, -0.25); K.box(FLOWER[4], 0.22, 0.3, 0.012, -0.5, 0.94, -0.22, 0, -0.25); K.add(label([['新刊', 0.4, 0.3, 800, '#c22d22', YUAN], ['一本 100', 0.26, 0.74, 700, '#2a2420']], 0.26, 0.2, { bg: '#fffdf2', border: '#c22d22', glow: 0.5, ppm: 400 }), 0.82, 0.88, 0.2, -0.2, -0.2); K.box(M.steel, 0.14, 0.08, 0.1, -0.86, 0.81, 0.25);
  [-0.7, 0.7].forEach(x => K.rod(M.steelDk, [x, 0, -0.75], [x, 2.3, -0.75], 0.018)); K.rod(M.steelDk, [-0.7, 2.3, -0.75], [0.7, 2.3, -0.75], 0.018);
  K.add(kitFace(DESIGN.posterTexture(E, P('fancy-frontier-ff'), D.ff, 640), 1.3, 1.84, 0.45), 0, 1.38, -0.74);                                  // the circle's own poster on the back frame (kit layout anime, its painting from posters/events/)
  K.add(kitFace(DESIGN.posterTexture(E, P('fancy-frontier-ff'), Object.assign({}, D.ff, { variant: 1, big: '新刊', kicker: 'NEW RELEASE' }), 384, 2.6), 0.6, 1.56, 0.4), -1.45, 0.86, -0.3, 0.35);   // an X-banner by the chair
  K.box(FLOWER[3], 0.34, 0.38, 0.03, 1.02, 0.5, 0.3, PI / 2); K.rod(M.navy, [1.0, 0.76, 0.2], [1.02, 0.68, 0.3], 0.01, 4); K.rod(M.navy, [1.0, 0.76, 0.4], [1.02, 0.68, 0.3], 0.01, 4);
  [-0.4, 0.4].forEach(x => { K.box(M.steelDk, 0.4, 0.04, 0.4, x, 0.45, -0.45); K.box(M.steelDk, 0.4, 0.4, 0.03, x, 0.68, -0.64); [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([a, b]) => K.rod(M.steelDk, [x + a, 0, -0.45 + b], [x + a, 0.45, -0.45 + b], 0.012, 4)); }); person(K, -0.4, -0.5, 0, { sit: true, shirt: SHIRT[5] });
  K.push(1.75, 0, 0.5, -0.3); K.cyl(M.concDk, 0.2, 0.22, 0.06, 0, 0.03, 0, 12); K.rod(M.steelDk, [0, 0.06, 0], [0, 1.7, 0], 0.02); K.add(label([['最後尾', 0.44, 0.34, 800, '#c22d22', YUAN], ['隊伍由此排起 · END OF LINE', 0.15, 0.78, 700, '#2a2420']], 0.7, 0.44, { bg: '#fffdf2', border: '#c22d22', glow: 0.45 }), 0, 1.75, 0.02); K.pop();
  reg('fancy-frontier-ff', K.done(-12.6, 6.4, PI / 2), { foot: [[-1.05, 2.0, -0.9, 0.7]], near: [0.3, 2.2], plaque: [-0.9, 1.2, 0.44, 0, 0.14] }); }

// ══ south kerb: 聯營公車站牌 and the old bus ═══════════════════════════════════════════════════════
// a boxy non-air-conditioned bus in an invented two-colour livery: sliding windows (some open), two folding doors, painted route plates;
// at the stop, round pink signs on poles (big red number, 聯 營, the stop's name), a bench, a boy with a school bag waiting
{ const K = Kit('lianying-bus-stop'), L = 4.3;
  K.bx(M.steelDk, -L + 0.3, L - 0.3, 0.3, 0.5, -1.0, 1.0); [[-2.9], [2.5]].forEach(([x]) => [-1, 1].forEach(k => wheel(K, x, 0.48, k * 1.0, 0.48, 0.28, [PI / 2, 0, 0])));
  K.bx(M.teal, -L, L, 0.45, 1.35, -1.18, 1.18); K.bx(M.whiteP, -L, L, 1.35, 1.47, -1.19, 1.19); K.bx(M.cream2, -L, L, 1.47, 2.95, -1.18, 1.18); K.bx(M.cream2, -L + 0.1, L - 0.1, 2.95, 3.05, -1.05, 1.05); [-2.5, 0, 2.5].forEach(x => K.box(M.grey, 0.7, 0.1, 0.5, x, 3.1, 0));
  [-1, 1].forEach(k => { for (let i = 0; i < 6; i++) { const x = -3.0 + i * 1.05; if (k > 0 && (i === 2)) continue; K.bx(M.glassDk, x - 0.46, x + 0.46, 1.6, 2.45, k * 1.185, k * 1.192); K.bx(M.chrome, x - 0.02, x + 0.02, 1.6, 2.45, k * 1.19, k * 1.2); K.bx(M.chrome, x - 0.48, x + 0.48, 2.0, 2.03, k * 1.19, k * 1.2); if (i % 3 === 1) K.bx(M.pane, x - 0.44, x - 0.04, 1.62, 2.0, k * 1.195, k * 1.205); } });
  [3.55, -0.9].forEach(x => { K.bx(M.steelDk, x - 0.5, x + 0.5, 0.5, 2.6, 1.185, 1.2); [-0.24, 0.24].forEach(dx => { K.bx(M.glassDk, x + dx - 0.19, x + dx + 0.19, 1.3, 2.45, 1.195, 1.21); K.bx(M.glassDk, x + dx - 0.19, x + dx + 0.19, 0.65, 1.15, 1.195, 1.21); }); K.bx(M.chrome, x - 0.02, x + 0.02, 0.5, 2.6, 1.2, 1.215); K.bx(M.steelDk, x - 0.5, x + 0.5, 0.3, 0.5, 1.0, 1.3); });
  K.bx(M.glassDk, L, L + 0.02, 1.55, 2.6, -1.05, 1.05); K.bx(M.chrome, L, L + 0.03, 1.5, 2.65, -0.02, 0.02); K.bx(M.steelDk, L, L + 0.12, 0.42, 0.62, -1.15, 1.15); [-1, 1].forEach(k => { K.sph(M.headlamp, 0.12, L + 0.01, 0.95, k * 0.82, 0.3, 1, 1); K.sph(M.amber, 0.06, L + 0.01, 0.95, k * 1.04, 0.3, 1, 1); K.box(M.black, 0.06, 0.34, 0.2, L - 0.05, 2.2, k * 1.36); K.rod(M.steelDk, [L - 0.05, 2.3, k * 1.18], [L - 0.05, 2.3, k * 1.36], 0.012, 4); });
  K.bx(M.glassDk, -L - 0.02, -L, 1.6, 2.5, -0.9, 0.9); [-1, 1].forEach(k => K.box(M.red, 0.03, 0.2, 0.14, -L - 0.01, 1.0, k * 0.95)); K.cyl(M.steelDk, 0.05, 0.05, 0.3, -L - 0.1, 0.4, -0.8, 8, [0, 0, PI / 2]);
  const plate = (w, h) => real('plate', 'enamel', w, h, (g, W, H) => { tint(g, W, H, 'rgba(255,253,242,.93)'); g.fillStyle = '#c22d22'; g.beginPath(); g.arc(H * 0.55, H / 2, H * 0.4, 0, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${H * 0.5}px ${FONT}`; g.fillText('0', H * 0.55, H * 0.54); g.fillStyle = '#16181c'; g.font = `800 ${H * 0.52}px ${KAI}`; g.fillText('廣場 — 動物園', (W + H) / 2, H * 0.54); }, { glow: 0.2, id: 'busplate' + w });
  K.add(plate(1.9, 0.34), L + 0.03, 2.8, 0, PI / 2); K.add(plate(1.5, 0.27), 1.4, 2.72, 1.2); K.add(label([['聯營公車', 0.6, 0.52, 800, '#fff3d6', KAI]], 1.4, 0.24, { bg: '#2f8c8a', glow: 0.3, depth: 0.02 }), -2.6, 1.0, 1.195); K.add(label([['上車投現 · 不找零', 0.5, 0.5, 700, '#c22d22']], 0.9, 0.14, { bg: '#fffdf2', glow: 0.4, depth: 0.02, ppm: 300 }), 2.75, 1.42, 1.2);
  K.box(M.dark, 0.5, 0.9, 0.5, 3.1, 1.6, -0.6); K.rod(M.dark, [3.7, 1.3, -0.6], [3.5, 1.75, -0.6], 0.025); K.geo(M.dark, TORUS, 3.72, 1.75, -0.6, [0, PI / 2, 0.5], 0.2); K.box(M.steel, 0.2, 0.36, 0.2, 3.5, 1.3, 0.55);                              // the driver's seat and wheel, the coin box by the door
  // the stop: two poles of round signs, a bench, a waiting boy
  const stopSign = (num, name) => disc(0.62, (g, W, H) => { g.fillStyle = 'rgba(246,201,207,.84)'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.49, 0, 7); g.fill(); g.strokeStyle = '#c22d22'; g.lineWidth = W * 0.03; g.stroke(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#c22d22'; g.font = `800 ${H * 0.3}px ${FONT}`; g.fillText(num, W / 2, H * 0.3); g.fillStyle = '#16181c'; g.font = `700 ${H * 0.09}px ${KAI}`; g.fillText('聯', W * 0.2, H * 0.3); g.fillText('營', W * 0.8, H * 0.3); g.fillStyle = '#c22d22'; g.font = `800 ${H * 0.15}px ${KAI}`; g.fillText(name, W / 2, H * 0.56); g.fillStyle = '#2a2420'; g.font = `600 ${H * 0.055}px ${FONT}`; g.fillText('車站 · 圓環 · 廣場 · 公園 · 動物園', W / 2, H * 0.72); g.fillText('頭班 05:30　末班 22:30', W / 2, H * 0.82); }, 'tin', 'stop' + num + name);   // a painted tin route plate (sources-square.md)
  [[-1.4, 2.3, ['0', '12']], [-2.3, 2.3, ['廣1']]].forEach(([x, z, nums]) => { K.cyl(M.concDk, 0.22, 0.26, 0.12, x, 0.06, z, 12); K.rod(M.steel, [x, 0.1, z], [x, 2.9 + (nums.length - 1) * 0.3, z], 0.03, 8); nums.forEach((n, i) => K.add(stopSign(n, '廣場'), x, 2.45 + i * 0.68, z + 0.035)); });
  K.push(1.3, 0, 2.45); K.box(M.wood, 1.5, 0.05, 0.36, 0, 0.44, 0); K.box(M.wood, 1.5, 0.3, 0.04, 0, 0.75, -0.18); [-0.62, 0.62].forEach(x => { K.box(M.steelDk, 0.05, 0.44, 0.34, x, 0.22, 0); K.box(M.steelDk, 0.05, 0.5, 0.04, x, 0.66, -0.18); }); K.pop();
  person(K, -0.6, 2.5, 0.3, { s: 0.86, shirt: M.whiteP, pants: PANTS[0] }); K.box(M.navy, 0.26, 0.3, 0.12, -0.64, 0.92, 2.36, 0.3); person(K, 1.6, 2.38, 0, { sit: true, shirt: SHIRT[6] });
  reg('lianying-bus-stop', K.done(7.4, 17.75, PI), { foot: [[-4.5, 4.5, -1.3, 1.4], [-2.6, 2.1, 2.0, 2.8]], near: [-0.5, 4.3], radius: 4, plaque: [-1.4, 1.4, 2.36, 0, 0.14] }); }

// ══ inside the square ═══════════════════════════════════════════════════════════════════════════════
// 臺北車站, a 1:60 model on a stone table: the square block, rows of small windows, the orange hipped roof round a raised central roof, three doors a side under a canopy
{ const K = Kit('taipei-main-station'), bw = 2.48, bd = 1.84, y0 = 0.86;
  K.box(M.stone, 3.1, 0.7, 2.4, 0, 0.35, 0); K.box(M.concLt, 3.3, 0.12, 2.6, 0, 0.76, 0); K.box(M.grass, 3.1, 0.02, 2.4, 0, 0.83, 0); K.box(M.conc, 2.9, 0.025, 2.2, 0, 0.84, 0);
  K.box(M.concLt, bw, 0.58, bd, 0, y0 + 0.29, 0); const win = (w) => paint(w, 0.42, (g, W, H) => { g.fillStyle = '#d9d2c2'; g.fillRect(0, 0, W, H); const n = Math.round(w * 17); for (let r = 0; r < 4; r++) for (let c = 0; c < n; c++) { g.fillStyle = (r * 7 + c * 3) % 5 ? '#3a4650' : '#e9c56a'; g.fillRect(W * (c + 0.25) / n, H * (0.08 + r * 0.235), W * 0.5 / n, H * 0.14); } }, { glow: 0.35, depth: 0.01, oneSide: true, ppm: 300, noCast: true });
  [[0, bd / 2 + 0.006, 0, bw], [0, -bd / 2 - 0.006, PI, bw], [bw / 2 + 0.006, 0, PI / 2, bd], [-bw / 2 - 0.006, 0, -PI / 2, bd]].forEach(([x, z, ry, w]) => { K.add(win(w - 0.1), x, y0 + 0.34, z, ry);
    K.push(x, y0, z, ry); K.box(M.concDk, 0.9, 0.03, 0.16, 0, 0.14, 0.08); [-0.28, 0, 0.28].forEach(dx => K.box(M.dark, 0.16, 0.12, 0.012, dx, 0.06, 0.004)); [-0.42, -0.14, 0.14, 0.42].forEach(dx => K.box(M.concLt, 0.03, 0.14, 0.03, dx, 0.07, 0.14)); K.pop(); });
  const F4 = (rt, rb, h, y, sx, sz, mat) => { const ge = new T.CylinderGeometry(rt, rb, h, 4).toNonIndexed(); ge.rotateY(PI / 4); ge.scale(sx, 1, sz); K.geo(mat, ge, 0, y, 0); };
  const tile = std('#d2622a', 0.55); F4(0.62, 1.0, 0.2, y0 + 0.68, bw * 0.76, bd * 0.76, tile); K.box(M.concDk, bw + 0.08, 0.03, bd + 0.08, 0, y0 + 0.585, 0); K.box(M.concLt, 1.2, 0.2, 0.9, 0, y0 + 0.86, 0); F4(0.3, 1.0, 0.2, y0 + 1.05, 1.36 * 0.72, 1.04 * 0.72, tile); K.box(std('#e0b23c', 0.4, 0.5), 0.5, 0.03, 0.04, 0, y0 + 1.16, 0);
  K.add(real('plaque', 'lacquer', 0.5, 0.09, (g, W, H) => ink(g, '臺北車站', W / 2, H * 0.54, H * 0.62, '#f3d27a', KAI, { maxW: W * 0.8, shadow: 'rgba(0,0,0,.6)' }), { id: 'tms-facade', depth: 0.012, glow: 0.45, ppm: 900 }), 0, y0 + 0.2, bd / 2 + 0.17);
  [[-1.3, 1.05], [1.32, 1.05], [-1.3, -1.0], [1.3, -0.95], [0.9, 1.08], [-0.85, 1.08]].forEach(([x, z]) => { K.cyl(M.woodDk, 0.008, 0.008, 0.06, x, 0.88, z, 5); K.sph(M.leaf, 0.045, x, 0.94, z); }); [[0.3, 1.06, M.red], [-0.4, 1.08, M.yellow], [0.6, -1.06, M.teal]].forEach(([x, z, m]) => K.box(m, 0.14, 0.04, 0.045, x, 0.875, z));
  K.add(real('plate', 'brass', 1.5, 0.4, (g, W, H) => { ink(g, '臺北車站', W / 2, H * 0.36, H * 0.34, '#2a1a0c', KAI, { carve: true }); ink(g, 'TAIPEI MAIN STATION · 1989 · 模型 1:60', W / 2, H * 0.74, H * 0.13, '#2a1a0c', FONT, { weight: 700, maxW: W * 0.86 }); }, { id: 'tms-plinth', glow: 0.14, depth: 0.012 }), 0, 0.38, 1.212);
  reg('taipei-main-station', K.done(-6.6, 4.3, 2.85), { foot: [[-1.65, 1.65, -1.3, 1.3]], near: [0, 2.2], plaque: [1.3, 0.5, 1.22, 0, 0.13] }); }

// 圓山大飯店: far off on its hill to the north, beside the 大稻埕 gate's dome (away from the low sun in the north-west, whose glare wipes out anything behind it), red columns under a golden roof, lit; near at hand, a coin viewer and a board pointing at it
{ const nofog = m => { m.fog = false; m.userData.noCast = true; return m; }, K = Kit('grand-hotel-far'), red = nofog(lit('#c9735c', '#8a3a28', 0.35)), goldR = nofog(lit('#e6bf6a', '#b08a30', 0.4)), creamL = nofog(lit('#eadfc6', '#bfae80', 0.25)), hillM = [nofog(std('#9fb394', 0.95)), nofog(std('#a9bb9c', 0.95)), nofog(std('#97ab8e', 0.95))];
  K.sph(hillM[0], 40, 0, 2, 0, 1.6, 0.86, 1.0); K.sph(hillM[1], 26, -40, 0, 10, 1.4, 0.8, 1); K.sph(hillM[2], 24, 44, 0, 6, 1.3, 0.8, 1);
  K.box(creamL, 46, 20, 12, 0, 46, 0); for (let f = 0; f < 7; f++) { K.box(red, 46.6, 0.7, 12.6, 0, 37.6 + f * 2.8, 0); } for (let i = 0; i < 16; i++) K.box(red, 0.9, 20, 12.8, -22.6 + i * 3.013, 46, 0);
  K.box(red, 48, 1.2, 14, 0, 56.6, 0); const roofG = new T.CylinderGeometry(0.42, 1, 1, 4).toNonIndexed(); roofG.rotateY(PI / 4); K.geo(goldR, roofG.clone().scale(37, 5, 13), 0, 59.7, 0); K.box(creamL, 28, 3, 8, 0, 63.5, 0); K.geo(goldR, roofG.clone().scale(24, 5, 9), 0, 67.5, 0); K.box(goldR, 20, 0.8, 0.8, 0, 70.2, 0); [-1, 1].forEach(k => K.box(goldR, 1, 2, 1, k * 10, 70.8, 0));
  K.box(red, 18, 6, 3, 0, 33, 9); K.geo(goldR, roofG.clone().scale(14, 2.5, 4), 0, 37.2, 9);
  const far = K.done(27, -100, -0.25); far.scale.setScalar(0.8); far.updateMatrixWorld(true);   // right of the gate's dome as she sees it from the start, not over the title board
  const V = Kit('grand-hotel-yuanshan');
  V.cyl(M.concDk, 0.26, 0.3, 0.1, 0, 0.05, 0, 14); V.cyl(M.steel, 0.06, 0.08, 1.2, 0, 0.7, 0, 10); V.box(M.steel, 0.3, 0.2, 0.2, 0, 1.38, 0); [-0.09, 0.09].forEach(x => { V.cyl(M.chrome, 0.06, 0.07, 0.36, x, 1.5, -0.1, 12, [-(PI / 2 - 0.25), 0, 0]); V.cyl(M.glassDk, 0.062, 0.062, 0.01, x, 1.545, -0.275, 12, [-(PI / 2 - 0.25), 0, 0]); }); V.box(M.red, 0.1, 0.12, 0.06, 0.2, 1.36, 0); V.box(M.concDk, 0.4, 0.16, 0.3, 0, 0.18, 0.4);
  V.push(0.95, 0, 0.1, -0.25); [-0.5, 0.5].forEach(x => V.box(M.woodDk, 0.06, 1.3, 0.06, x, 0.65, 0)); V.add(real('plate', 'enamel', 1.2, 0.8, (g, W, H) => { const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f0b070'); sky.addColorStop(1, '#f6e2b8'); g.fillStyle = sky; g.fillRect(0, 0, W, H); g.fillStyle = '#4f7a52'; g.beginPath(); g.moveTo(0, H * 0.74); g.quadraticCurveTo(W * 0.5, H * 0.36, W, H * 0.74); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#efe2c0'; g.fillRect(W * 0.3, H * 0.34, W * 0.4, H * 0.2); g.fillStyle = '#b3271e'; for (let i = 0; i < 9; i++) g.fillRect(W * (0.3 + i * 0.048), H * 0.34, W * 0.014, H * 0.2); g.fillRect(W * 0.29, H * 0.32, W * 0.42, H * 0.025); g.fillStyle = '#e0a92e'; g.beginPath(); g.moveTo(W * 0.26, H * 0.32); g.lineTo(W * 0.36, H * 0.2); g.lineTo(W * 0.64, H * 0.2); g.lineTo(W * 0.74, H * 0.32); g.fill();
    g.fillStyle = '#3a2a1c'; g.fillRect(0, H * 0.76, W, H * 0.24); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f3d27a'; g.font = `800 ${H * 0.13}px ${KAI}`; g.fillText('↗ 圓山大飯店', W / 2, H * 0.84); g.font = `600 ${H * 0.06}px ${FONT}`; g.fillText('THE GRAND HOTEL · 1973 · 往北邊的山上看', W / 2, H * 0.94); }, { glow: 0.22, id: 'yuanshan-board' }), 0, 1.25, 0.04); V.pop();
  reg('grand-hotel-yuanshan', V.done(-3.5, 3.3, Math.atan2(27 + 3.5, -100 - 3.3) + PI), { foot: [[-0.4, 1.6, -0.4, 0.6]], near: [0.3, 1.7], radius: 3, plaque: [0.95, 0.5, 0.16, -0.25, 0.13], targets: [far] }); }

// 2010, 花博: a round bed planted in bands of colour, and a five-petal flower taller than a person, the dates on its stem
{ const K = Kit('flora-expo-2010');
  K.cyl(M.stone, 1.35, 1.4, 0.34, 0, 0.17, 0, 24); K.cyl(M.soil, 1.24, 1.24, 0.02, 0, 0.34, 0, 24);
  for (let ring = 0; ring < 4; ring++) { const r = 0.3 + ring * 0.29, n = 7 + ring * 6; for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + ring * 0.4, x = Math.cos(a) * r, z = Math.sin(a) * r; K.sph(M.leaf, 0.09, x, 0.4, z, 1, 0.7, 1); K.sph(FLOWER[(ring + (Math.floor(i / 3) % 2)) % 6], 0.062, x, 0.5 + (i % 2) * 0.03, z, 1, 0.8, 1); } }
  K.rod(M.green, [0, 0.34, 0], [0.05, 2.5, 0], 0.07, 8); [[0.9, 1], [1.5, -1]].forEach(([y, k]) => K.sph(M.green, 0.3, k * 0.3, y, 0, 1, 0.22, 0.5));
  ['#e8463c', '#f2c12e', '#f08ab0', '#8a5ad0', '#f2843a'].forEach((c, i) => { const a = i / 5 * PI * 2 + PI / 2; K.sph(lit(c, c, 0.25), 0.4, 0.05 + Math.cos(a) * 0.5, 2.6 + Math.sin(a) * 0.5, 0, 1, 1, 0.18); }); K.sph(lit('#f6e27a', '#c8a020', 0.4), 0.26, 0.05, 2.6, 0.03, 1, 1, 0.4);
  [[-0.9, 1.3], [0.95, 1.25]].forEach(([x, z], i) => { K.rod(M.steelDk, [x, 0, z], [x, 0.6, z], 0.012, 4); K.box(FLOWER[i + 1], 0.24, 0.18, 0.01, x, 0.66, z, i ? -0.3 : 0.3); });                         // small bed labels
  const pc = piece(K, 'flora-expo-2010', D.flora, 0, 2.15, 0);                                              // the expo's poster on an A-frame at the bed's edge
  reg('flora-expo-2010', K.done(5.0, -5.6, -0.73), { foot: [[-1.4, 1.4, -1.4, 1.4]].concat(pc.foot), near: [0, 2.8], radius: 3.2, plaque: pc.plaque || [1.1, 0.75, 1.72, 0, 0.13] }); }

// 2017, 世大運: a three-step podium, a javelin planted beside it, a barbell on the top step, a strip of red track on the paving
{ const K = Kit('universiade-2017');
  K.add(decal(3.4, 2.2, (g, W, H) => { g.fillStyle = '#b8402e'; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,220,200' : '60,10,5'},.08)`; g.fillRect(rnd() * W, rnd() * H, 3, 3); } g.fillStyle = '#f4efe2'; for (let i = 0; i <= 4; i++) g.fillRect(0, H * i / 4 - (i === 4 ? 5 : i ? 2.5 : 0), W, 5); g.font = `800 ${H * 0.16}px ${FONT}`; g.textBaseline = 'middle'; [1, 2, 3, 4].forEach(n => g.fillText(String(n), W * 0.04, H * (n - 0.5) / 4)); g.fillRect(W * 0.16, 0, 6, H); }), 0, 0.025, 0.2, 0, -PI / 2);
  [[0, 0.75, '1', '#e0b23c'], [-0.8, 0.52, '2', '#c9ccd0'], [0.8, 0.36, '3', '#b06a3a']].forEach(([x, h, n, c]) => { K.box(M.whiteP, 0.8, h, 0.8, x, h / 2, 0); K.box(std(c, 0.35, 0.6), 0.82, 0.04, 0.82, x, h - 0.02, 0); K.add(label([[n, 0.8, 0.54, 800, '#c22d22']], 0.4, Math.min(0.4, h * 0.8), { bg: '#f4f1ea', glow: 0.3, depth: 0.01, ppm: 200 }), x, h * 0.5, 0.406); });
  [-1, 1].forEach(k => { K.cyl(M.red, 0.2, 0.2, 0.05, k * 0.4, 0.97, 0, 18, [0, 0, PI / 2]); K.cyl(M.blue, 0.2, 0.2, 0.04, k * 0.46, 0.97, 0, 18, [0, 0, PI / 2]); K.cyl(M.yellow, 0.15, 0.15, 0.03, k * 0.51, 0.97, 0, 16, [0, 0, PI / 2]); }); K.rod(M.chrome, [-0.62, 0.97, 0], [0.62, 0.97, 0], 0.016, 8);
  K.rod(M.yellow, [1.55, 0, -0.3], [1.5, 2.3, -0.3], 0.016, 8); K.rod(M.chrome, [1.5, 2.3, -0.3], [1.495, 2.55, -0.3], 0.012, 6); K.rod(M.dark, [1.53, 1.0, -0.3], [1.525, 1.25, -0.3], 0.02, 8);
  K.cyl(M.steelDk, 0.016, 0.016, 1.1, -1.5, 0.55, -0.3, 6); K.box(M.red, 0.5, 0.3, 0.01, -1.24, 0.94, -0.3); K.box(M.whiteP, 0.5, 0.1, 0.012, -1.24, 0.94, -0.3);
  const pc = piece(K, 'universiade-2017', D.universiade, -0.25, -1.05, 0);                                    // a row of street-pole banners behind the podium spelling 2017
  reg('universiade-2017', K.done(-5.0, -5.6, 0.73), { foot: [[-1.25, 1.25, -0.45, 0.45]].concat(pc.foot), near: [0, 2.3], plaque: pc.plaque || [1.0, 0.75, 1.17, 0, 0.13] }); }

// 2017, 白晝之夜: a lamp post with a glowing white moon tied to it, a clock whose hands run from six to six, a row of paper-cut palms for 椰林大道
{ const K = Kit('nuit-blanche-gongguan-2017');
  K.cyl(M.concDk, 0.3, 0.34, 0.16, 0, 0.08, 0, 14); K.cyl(M.navy, 0.06, 0.08, 3.6, 0, 1.9, 0, 10); K.cyl(M.navy, 0.1, 0.1, 0.3, 0, 0.5, 0, 10); K.sph(M.warm, 0.14, 0, 3.78, 0); K.cyl(M.navy, 0.2, 0.05, 0.08, 0, 3.9, 0, 12);
  K.sph(glow(1.35, 1.33, 1.25), 0.62, 0.5, 4.9, 0.1); K.rod(M.whiteP, [0, 3.4, 0], [0.42, 4.25, 0.08], 0.006, 4); K.rod(M.whiteP, [0.05, 3.0, 0], [0.42, 4.25, 0.08], 0.006, 4);
  K.add(paint(0.7, 0.7, (g, W, H) => { g.fillStyle = '#1c2f5c'; g.fillRect(0, 0, W, H); g.fillStyle = '#fdfdf5'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.46, 0, 7); g.fill(); g.fillStyle = 'rgba(28,47,92,.2)'; g.beginPath(); g.moveTo(W / 2, H / 2); g.arc(W / 2, H / 2, W * 0.42, PI / 2, PI / 2 + PI * 2 * 0.999); g.fill(); g.fillStyle = '#1c2f5c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${W * 0.12}px ${FONT}`; [['12', 0.5, 0.14], ['3', 0.86, 0.5], ['6', 0.5, 0.86], ['9', 0.14, 0.5]].forEach(([t, x, y]) => g.fillText(t, W * x, H * y));
    g.strokeStyle = '#1c2f5c'; g.lineCap = 'round'; g.lineWidth = W * 0.045; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2, H * 0.76); g.stroke(); g.lineWidth = W * 0.03; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2, H * 0.17); g.stroke(); g.font = `700 ${W * 0.07}px ${FONT}`; g.fillStyle = '#c22d22'; g.fillText('18:00 → 06:00', W / 2, H * 0.64); }, { glow: 0.8, light: true }), 0, 2.5, 0.1);
  for (let i = 0; i < 5; i++) { const x = -1.0 + i * 0.5, h = 0.8 + (i % 2) * 0.2; K.box(M.cream2, 0.05, h, 0.012, x, 0.16 + h / 2, 0.35); for (let j = 0; j < 6; j++) { const a = -1.3 + j * 0.52; K.box(M.green, 0.3, 0.05, 0.012, x + Math.sin(a) * 0.14, 0.16 + h + Math.cos(a) * 0.1 - Math.abs(a) * 0.05, 0.35, 0, 0, -a * 0.75 + PI / 2); } } K.box(M.woodDk, 2.5, 0.16, 0.14, 0, 0.08, 0.35);
  const pc = piece(K, 'nuit-blanche-gongguan-2017', D.nuit, 1.75, 0.9, -0.35);                               // the night's poster glowing in a lit case beside the moon
  reg('nuit-blanche-gongguan-2017', K.done(6.6, 3.5, -0.9), { foot: [[-1.3, 1.3, -0.4, 0.5]].concat(pc.foot), near: [0, 2.3], plaque: pc.plaque || [1.02, 0.75, 0.97, 0, 0.13] }); }

// 2019, MSI 決賽: a stage riser, two facing rows of five seats and screens, a plain silver cup between them, the big screen behind
{ const K = Kit('msi-2019-heping');
  K.box(M.dark, 3.6, 0.3, 2.3, 0, 0.15, 0); K.box(M.neonB, 3.64, 0.03, 0.03, 0, 0.29, 1.16); [-1, 1].forEach(k => { K.push(k * 1.05, 0.3, 0.1, -k * 0.5);
    K.box(M.black, 0.4, 0.72, 1.9, 0.1, 0.36, 0); K.box(k > 0 ? M.neonB : M.amber, 0.02, 0.04, 1.9, -0.11, 0.6, 0); for (let i = 0; i < 5; i++) { const z = -0.76 + i * 0.38; K.box(M.black, 0.03, 0.2, 0.3, 0.16, 0.86, z); K.box(M.neonB, 0.005, 0.16, 0.26, 0.178, 0.86, z); K.box(M.black, 0.3, 0.06, 0.3, 0.55, 0.42, z); K.box(k > 0 ? M.blue : M.gold, 0.05, 0.5, 0.28, 0.72, 0.68, z, 0, 0, -0.1); K.cyl(M.steelDk, 0.02, 0.02, 0.4, 0.55, 0.2, z, 6); }
    K.pop(); });
  K.cyl(M.dark, 0.2, 0.24, 0.6, 0, 0.6, 0.55, 14); K.cyl(M.silver, 0.05, 0.1, 0.08, 0, 0.94, 0.55, 12); K.cyl(M.silver, 0.02, 0.03, 0.12, 0, 1.04, 0.55, 8); K.cyl(M.silver, 0.13, 0.05, 0.22, 0, 1.21, 0.55, 14); [-1, 1].forEach(k => K.geo(M.silver, TORUS, k * 0.14, 1.2, 0.55, [0, 0, 0], 0.07));
  [-1.7, 1.7].forEach(x => K.box(M.steelDk, 0.08, 2.9, 0.08, x, 1.75, -1.0)); K.add(paint(3.3, 1.5, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#0e2a5c'); gr.addColorStop(0.5, '#0a1024'); gr.addColorStop(1, '#6a4a10'); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(${i % 2 ? '90,160,255' : '240,190,80'},.22)`; g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H * 1.2); g.lineTo(W * (i / 8), 0); g.stroke(); }
    // the broadcast's score frame, not a name plate (checker 2026-11-22): a GRAND FINAL chip, two team bars in their colours with
    // pick slots, the score set huge in a hexagon, a game-time clock and a lower third with the venue
    g.textAlign = 'center'; g.textBaseline = 'middle'; const hex = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = PI / 6 + i * PI / 3; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); };
    g.fillStyle = '#f3d27a'; g.beginPath(); g.moveTo(W * 0.36, 0); g.lineTo(W * 0.64, 0); g.lineTo(W * 0.6, H * 0.12); g.lineTo(W * 0.4, H * 0.12); g.fill(); g.fillStyle = '#0a1024'; g.font = `900 ${H * 0.075}px ${FONT}`; g.fillText('GRAND FINAL · 季中邀請賽', W / 2, H * 0.06);
    [[-1, '#2f7bff', '藍方'], [1, '#e0473a', '紅方']].forEach(([k, c, name]) => { const x0 = k < 0 ? W * 0.03 : W * 0.6; g.fillStyle = c; g.beginPath(); g.moveTo(x0, H * 0.22); g.lineTo(x0 + W * 0.37, H * 0.22); g.lineTo(x0 + W * 0.37 - k * W * 0.03, H * 0.42); g.lineTo(x0, H * 0.42); g.fill();
      g.fillStyle = '#ffffff'; g.font = `900 ${H * 0.13}px ${FONT}`; g.fillText(name, x0 + W * 0.185, H * 0.32); for (let i = 0; i < 5; i++) { const sx = x0 + W * (0.02 + i * 0.07); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(sx, H * 0.47, W * 0.06, H * 0.2); g.strokeStyle = c; g.lineWidth = 3; g.strokeRect(sx, H * 0.47, W * 0.06, H * 0.2); g.fillStyle = c; g.fillRect(sx, H * 0.63, W * 0.06, H * 0.04); }
      for (let i = 0; i < 3; i++) { g.fillStyle = k < 0 ? '#f3d27a' : 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x0 + W * (0.12 + i * 0.065), H * 0.75, H * 0.025, 0, 6.2832); g.fill(); } });
    g.fillStyle = '#0a1024'; hex(W / 2, H * 0.42, H * 0.26); g.fill(); g.strokeStyle = '#f3d27a'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#ffffff'; g.font = `900 ${H * 0.2}px ${FONT}`; g.fillText('3 : 0', W / 2, H * 0.4); g.fillStyle = '#9fd0ff'; g.font = `700 ${H * 0.06}px ${FONT}`; g.fillText('BO5 · 34:12', W / 2, H * 0.58);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, H * 0.84, W, H * 0.16); g.fillStyle = '#f3d27a'; g.fillRect(0, H * 0.84, W * 0.012, H * 0.16); g.textAlign = 'left'; g.fillStyle = '#ffffff'; g.font = `800 ${H * 0.07}px ${FONT}`; g.fillText('決賽之夜  2019.5.19', W * 0.04, H * 0.92); g.textAlign = 'right'; g.fillStyle = '#9fd0ff'; g.font = `700 ${H * 0.055}px ${FONT}`; g.fillText('臺北和平籃球館 · TAIPEI HEPING ARENA', W * 0.97, H * 0.92); }, { glow: 1.0, oneSide: true }), 0, 2.4, -0.98);
  [[-1.5, M.neonB], [1.5, M.amber]].forEach(([x, m]) => { K.rod(M.steelDk, [x, 3.2, -1.0], [x * 0.6, 3.2, -0.4], 0.02); K.sph(m, 0.08, x * 0.6, 3.16, -0.4); }); [[-1.2, 1.35, M.neonB], [1.3, 1.4, M.amber]].forEach(([x, z, m]) => { K.rod(m, [x, 0, z], [x + 0.1, 0.5, z], 0.035, 8); K.rod(m, [x + 0.2, 0, z + 0.1], [x + 0.25, 0.5, z + 0.05], 0.035, 8); });   // cheering sticks left at the edge
  const pc = piece(K, 'msi-2019-heping', D.msi, 2.55, 1.15, 0);                                               // an arena column wrapped in the finals' key art at the stage's corner
  reg('msi-2019-heping', K.done(12.8, 4.9, -PI / 2), { foot: [[-1.85, 1.85, -1.2, 1.2]].concat(pc.foot), near: [0, 2.8], radius: 3.2, plaque: pc.plaque || [1.2, 0.75, 1.62, 0, 0.13] }); }

// 2006, 金曲獎: a short red carpet between crowd barriers up to a small gold stage arch, a plain golden note on a base under it
{ const K = Kit('golden-melody-arena-2006');
  K.box(M.red, 1.0, 0.03, 2.4, 0, 0.02, 0.3); K.box(M.dark, 1.8, 0.16, 0.9, 0, 0.08, -0.9); [-0.75, 0.75].forEach(x => { K.box(M.gold, 0.14, 2.3, 0.14, x, 1.31, -0.9); }); for (let i = 0; i <= 8; i++) { const a = i / 8 * PI, b = (i + 1) / 8 * PI; if (i < 8) K.rod(M.gold, [Math.cos(a) * 0.75, 2.46 + Math.sin(a) * 0.45, -0.9], [Math.cos(b) * 0.75, 2.46 + Math.sin(b) * 0.45, -0.9], 0.07, 8); }
  for (let i = 0; i < 7; i++) K.sph(M.bulb, 0.04, -0.6 + i * 0.2, 2.42, -0.86); K.add(kitFace(DESIGN.wideTexture(E, P('golden-melody-arena-2006'), Object.assign({}, D.golden, { layout: 'award' }), 1024, 0.25, 'band'), 1.2, 0.3, 0.7), 0, 2.25, -0.84);
  K.cyl(M.dark, 0.26, 0.3, 0.5, 0, 0.41, -0.9, 16); K.cyl(M.gold, 0.2, 0.24, 0.06, 0, 0.69, -0.9, 16); K.sph(M.gold, 0.15, -0.06, 0.86, -0.9, 1.2, 0.85, 1); K.rod(M.gold, [0.08, 0.88, -0.9], [0.08, 1.6, -0.9], 0.028, 8); K.rod(M.gold, [0.08, 1.6, -0.9], [0.32, 1.38, -0.9], 0.045, 8); K.rod(M.gold, [0.08, 1.42, -0.9], [0.3, 1.22, -0.9], 0.035, 8);
  [-1, 1].forEach(k => { K.push(k * 0.72, 0, 0.5); [-0.8, 0.8].forEach(z => { K.rod(M.chrome, [0, 0, z], [0, 0.95, z], 0.02); K.box(M.chrome, 0.3, 0.02, 0.04, 0, 0.01, z); }); K.rod(M.chrome, [0, 0.95, -0.8], [0, 0.95, 0.8], 0.02); K.rod(M.chrome, [0, 0.3, -0.8], [0, 0.3, 0.8], 0.016); for (let i = 1; i < 8; i++) K.rod(M.chrome, [0, 0.3, -0.8 + i * 0.2], [0, 0.95, -0.8 + i * 0.2], 0.009, 4); K.pop(); });
  [-1, 1].forEach(k => { K.rod(M.dark, [k * 1.0, 0, -0.5], [k * 0.95, 1.5, -0.5], 0.02); K.box(M.dark, 0.2, 0.14, 0.16, k * 0.95, 1.56, -0.46); K.sph(M.headlamp, 0.05, k * 0.95, 1.56, -0.37); });                    // two press lights
  const pc = piece(K, 'golden-melody-arena-2006', D.golden, 1.45, 2.3, 0, 0.9);                             // an arena column wrapped in the night's black-and-gold posters at the carpet's mouth, just past the exhibition wall's end (clear of viewpoints 1 and 6)
  reg('golden-melody-arena-2006', K.done(-4.6, 12.3, 1.76), { foot: [[-1.1, 1.1, -1.4, 1.4]].concat(pc.foot), near: [0, 2.6], radius: 1.9, plaque: pc.plaque || [1.0, 0.75, 1.77, 0, 0.13] }); }   // a small radius: the E prompt must not already be up where she starts

// 2024, 大巨蛋首場演唱會: the Dome's silver shell with its roof lifted like a lid, a piano on a round stage inside, stage light and confetti coming out
{ const K = Kit('jay-chou-taipei-dome-2024');
  K.cyl(M.stone, 1.0, 1.06, 0.7, 0, 0.35, 0, 22); const ring = new T.CylinderGeometry(1, 1, 1, 28, 1, true).toNonIndexed(); K.geo(M.silver, ring.clone().scale(0.95, 0.4, 0.7), 0, 0.9, 0); K.geo(M.steelDk, ring.clone().scale(0.9, 0.4, 0.66), 0, 0.9, 0); K.cyl(M.green, 0.88, 0.88, 0.02, 0, 0.72, 0, 24); K.cyl(M.dark, 0.3, 0.3, 0.06, 0, 0.76, 0, 18);
  K.box(M.black, 0.26, 0.1, 0.2, 0, 0.87, 0); K.box(M.black, 0.26, 0.012, 0.2, 0, 0.99, -0.04, 0, -0.5); K.box(M.whiteP, 0.22, 0.012, 0.04, 0, 0.9, 0.11); [-0.1, 0.1].forEach(x => K.cyl(M.black, 0.012, 0.012, 0.06, x, 0.81, 0.06, 5)); K.box(M.black, 0.1, 0.03, 0.08, 0, 0.82, 0.22);
  for (let i = 0; i < 22; i++) { const a = i / 22 * PI * 2; K.sph(i % 3 ? M.neonP : M.moon, 0.022, Math.cos(a) * 0.82, 1.0 + (i % 2) * 0.05, Math.sin(a) * 0.6); }                             // light sticks round the stands
  { const lid = HALF.clone().scale(0.98, 0.42, 0.73); lid.translate(0, 0, 0.72); const m = new T.Mesh(lid, M.silver); m.castShadow = true; K.add(m, 0, 1.12, -0.72, 0, -1.2); const inner = lit('#2a2f6a', '#3a3f9a', 0.6); inner.side = T.BackSide; K.add(new T.Mesh(lid, inner), 0, 1.12, -0.72, 0, -1.2); const rib = new T.Mesh(new T.TorusGeometry(1, 0.03, 6, 28).rotateX(PI / 2).scale(0.98, 1, 0.73).translate(0, 0.02, 0.72), M.steelDk); K.add(rib, 0, 1.12, -0.72, 0, -1.2); }
  [[-0.3, 0.2, 0.1], [0.25, -0.15, -0.05], [0, 0, 0.25]].forEach(([x, rz, rx]) => { const c = new T.Mesh(new T.ConeGeometry(0.34, 2.6, 16, 1, true), Object.assign(M.beam.clone(), { opacity: 0.07 })); c.rotation.set(PI + rx, 0, rz); K.add(c, x + rz * 1.2, 2.2, 0.1 - rx); c.rotation.set(PI + rx, 0, rz); });
  for (let i = 0; i < 40; i++) K.box(FLOWER[i % 6], 0.035, 0.035, 0.004, rr(-0.9, 0.9), rr(1.5, 3.3), rr(-0.3, 0.6), rr(0, 3), rr(0, 3));
  const pc = piece(K, 'jay-chou-taipei-dome-2024', D.dome, 1.75, 0.55, -0.4);                                // the tour poster on an A-frame beside the model
  reg('jay-chou-taipei-dome-2024', K.done(-8.9, 12.9, 1.3), { foot: [[-1.1, 1.1, -1.1, 1.1]].concat(pc.foot), near: [0, 2.3], plaque: pc.plaque || [0.9, 0.6, 0.72, 0.6, 0.13] }); }

return { groups: out, count, designs: DESIGNED };
};
})();
