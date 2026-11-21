// landmarks-ximen.js: the researched places and events of 西門町, built as real frontages round the 西門紅樓 plaza.
// Research: docs/places/ximen.json (through place-data.js). Layout follows the page's own compass: the Red House
// door looks along +z; the -x edge is the 中華路 side (中華商場, the railway), the +x edge is 成都路 and the
// streets behind it (天后宮, 成都楊桃冰, 蜂大咖啡, 刺青街, 萬年, 美國街, 電影街, 阿宗麵線), and the far +z end is the
// 徒步區 mouth (捷運6號出口, 獅子林, 來來百貨).
//   LANDMARKS_XIMEN(E, { redHouse })  ->  { groups: { key: Group }, count }
// Every building is one THREE.Group of a few merged meshes (one per material) and is registered with PLACES.add
// as a click target; every event gets a marker. The page calls PLACES.mount afterwards.
// Sign wording, layout and colours follow docs/signage/sources.md (CJ, 2026-11-21: 「還有這些招牌都怪怪的請出搜尋真實招牌 海報跟布條」); each sign there
// carries its source and a measured / inferred / guess label. Everything is drawn here on a canvas: no photo and no logo is copied.
(function () {
'use strict';
window.LANDMARKS_XIMEN = function (E, opt) {
opt = opt || {};
const { T, scene, TEX, MATS, GLOW, triMat } = E;
const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';
const rnd = (() => { let s = 77123; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
const rr = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
const std = (c, r = 0.8, m = 0) => new T.MeshStandardMaterial({ color: E.col(c), roughness: r, metalness: m });
const glow = (r, g, b) => { const m = GLOW(r, g, b); m.userData.noCast = true; return m; };
const lit = (c, e, i) => { const m = std(c, 0.5); m.emissive = E.col(e); m.emissiveIntensity = i; return m; };
const tm = (color, tex, scale, rough, metal) => triMat({ color, tex, scale, rough, metal: metal || 0 });
const M = {
  conc: tm('#b9b2a2', TEX.concrete, 0.5, 0.92), concDk: tm('#8e877a', TEX.concrete, 0.5, 0.95), concLt: tm('#d2ccbd', TEX.plaster, 0.3, 0.9),
  cream: tm('#dcc9a4', TEX.plaster, 0.35, 0.85), ochre: tm('#c79a5c', TEX.plaster, 0.35, 0.85), white: tm('#ece7da', TEX.plaster, 0.4, 0.8), pink: tm('#c9a08c', TEX.plaster, 0.35, 0.85),
  green: tm('#4f9a78', TEX.concrete, 1.2, 0.55), greenDk: tm('#2f6e55', TEX.concrete, 1.2, 0.6), tan: tm('#b08d68', TEX.concrete, 1.4, 0.6), tanDk: tm('#7c5f45', TEX.concrete, 1.4, 0.65),
  brick: MATS.brick, brickBurnt: tm('#3a2f2a', TEX.brick, 1, 0.95), stone: tm('#9a968c', TEX.concrete, 1, 0.9),
  glass: tm('#1f2d36', TEX.metal, 1, 0.12, 0.6), glassBlue: tm('#3f6f86', TEX.metal, 1, 0.1, 0.7), frame: std('#26262a', 0.5, 0.3), steel: tm('#c9ccd0', TEX.metal, 3, 0.34, 0.3), steelDk: std('#565a60', 0.5, 0.3),
  shutter: tm('#9aa0a4', TEX.metal, 4, 0.5, 0.25), dark: std('#15120f', 0.95), wood: tm('#8a6a48', TEX.bark, 2, 0.8), woodDk: tm('#4f3a28', TEX.bark, 2, 0.85),
  red: std('#b3271e', 0.55), redDk: std('#7c1a14', 0.6), gold: std('#d9a53a', 0.35, 0.7), tile: std('#c8612c', 0.6), tileGreen: std('#2f7d5a', 0.4), blue: std('#1f4f9c', 0.5), mrt: std('#0a59a4', 0.45),
  skin: std('#e0b693', 0.7), hair: std('#1c1512', 0.8), whiteP: std('#f1ece2', 0.5), black: std('#141416', 0.6),
  winLit: glow(1.5, 1.02, 0.5), shopLit: glow(1.25, 0.9, 0.5), tube: glow(2.3, 2.2, 2.0), bulb: glow(3.6, 2.4, 1.0), neonR: glow(3.4, 0.5, 0.4), neonC: glow(0.4, 2.6, 3.2), neonM: glow(3.2, 0.5, 2.6), lantern: glow(2.6, 0.42, 0.16),
  amber: lit('#d98a1e', '#b0600a', 0.7), biscuit: lit('#d9b06a', '#7a5a20', 0.25), jar: std('#cfe3e0', 0.1, 0.2),
  pane: Object.assign(new T.MeshStandardMaterial({ color: E.col('#cfe6ea'), roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.14, depthWrite: false }), { userData: { noCast: true } }),   // shop-window glass you can see the display through
  canopy: Object.assign(new T.MeshStandardMaterial({ color: E.col('#bfe0ea'), roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.38 }), { userData: { noCast: true } }),
};
const CLOTH = ['#c94f3d', '#e8e2d0', '#3f6f9a', '#e0b23c', '#5d8a5a', '#8a5a8a', '#d98a6a'].map(c => std(c, 0.9));
const SHIRT = ['#c9433a', '#e9e2d2', '#2f5f8f', '#e2b53e', '#4f7f5a', '#7a4f7f', '#d07a55', '#2b2b30', '#7fa8c9'].map(c => std(c, 0.85));
const PANTS = ['#2b3550', '#3a3a3e', '#6a5a48', '#1f2a3a'].map(c => std(c, 0.85));

// ── a kit that merges everything it is given into one mesh per material ──────────────────────
const UNIT = new T.BoxGeometry(1, 1, 1).toNonIndexed(), SPH = new T.SphereGeometry(0.5, 10, 8).toNonIndexed(), CYL = {};
const cylG = (a, b, seg) => { const k = a.toFixed(3) + '|' + b.toFixed(3) + '|' + seg; return CYL[k] || (CYL[k] = new T.CylinderGeometry(a, b, 1, seg).toNonIndexed()); };
function Kit(name) {
  const g = new T.Group(); g.name = name; const bins = new Map();
  const m4 = new T.Matrix4(), q = new T.Quaternion(), eu = new T.Euler(), p = new T.Vector3(), s = new T.Vector3(), n3 = new T.Matrix3(), v = new T.Vector3();
  let pre = null, preRy = 0;
  function add(geo, mat, x, y, z, rot, sx, sy, sz) {
    eu.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0); q.setFromEuler(eu); m4.compose(p.set(x, y, z), q, s.set(sx, sy, sz)); if (pre) m4.premultiply(pre); n3.getNormalMatrix(m4);
    let b = bins.get(mat); if (!b) bins.set(mat, b = { pos: [], nor: [] });
    const P = geo.attributes.position, N = geo.attributes.normal;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); b.nor.push(v.x, v.y, v.z); }
  }
  const K = { g,
    at(x, y, z, ry) { if (x == null) { pre = null; preRy = 0; } else { pre = new T.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z); preRy = ry || 0; } return K; },
    box(w, h, d, mat, x, y, z, ry = 0, rx = 0, rz = 0) { add(UNIT, mat, x, y, z, [rx, ry, rz], w, h, d); return K; },
    bx(x0, x1, y0, y1, z0, z1, mat) { add(UNIT, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, null, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); return K; },
    cyl(rTop, rBot, h, mat, x, y, z, seg = 10, rot = null) { const r = Math.max(rTop, rBot, 1e-4); add(cylG(rTop / r, rBot / r, seg), mat, x, y, z, rot, r, h, r); return K; },
    sph(r, mat, x, y, z, sy = 1) { add(SPH, mat, x, y, z, null, r * 2, r * 2 * sy, r * 2); return K; },
    mesh(m, x, y, z, ry = 0) { m.position.set(x, y, z); if (pre) m.position.applyMatrix4(pre); m.rotation.y = ry + preRy; g.add(m); return m; },
    done() { bins.forEach((b, mat) => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(b.nor, 3));
      const m = new T.Mesh(geo, mat); m.castShadow = !(mat.userData && mat.userData.noCast); m.receiveShadow = true; g.add(m); }); bins.clear(); return g; } };
  return K;
}
const put = (g, x, z, ry) => { g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); g.updateMatrixWorld(true); return g; };
const world = (g, x, y, z) => g.localToWorld(new T.Vector3(x, y, z));

// ── signs and painted boards (canvas text; no logo is copied) ────────────────────────────────
const EDGE = std('#231f1c', 0.6);
function boardMesh(cv, w, h, o) {
  const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
  const m = new T.MeshStandardMaterial({ map: t, roughness: 0.6, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: (o.glow == null ? 0.4 : o.glow) * (o.light ? 0.42 : 1) });
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, o.depth || 0.1), [EDGE, EDGE, EDGE, EDGE, m, o.oneSide ? EDGE : m]); mesh.castShadow = !o.noCast; return mesh;
}
function paint(w, h, draw, o = {}) {
  const ppm = o.ppm || Math.max(40, Math.min(200, 1024 / Math.max(w, h))), cv = document.createElement('canvas'); cv.width = Math.round(w * ppm); cv.height = Math.round(h * ppm);
  draw(cv.getContext('2d'), cv.width, cv.height); return boardMesh(cv, w, h, o);
}
// Lettering. Old Taipei signs were written, not typeset: 楷書 on most shop boards, 魏碑 and 行書 on cinema titles, 隸書 on temples
// and old firms, 圓體 on the acrylic light boxes of the 1970s–80s. These are system faces (macOS ships them); elsewhere the stack falls back to 黑體.
const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + FONT, WEI = '"Weibei TC",' + KAI, LI = '"Libian TC","Baoli TC",' + KAI, XING = '"Xingkai TC",' + KAI, YUAN = '"Yuanti TC",' + FONT, SONG = '"Songti TC","LiSong Pro","PMingLiU",serif';
// sign(text, w, h, { bg, fg, vertical, sub, glow, border, weight, font, subFont, kind, rtl, outline })
//   kind 'paint' (default): a painted board, thin inset rule, rain streaks · 'box': an acrylic light box in a steel rim, panel seams ·
//   'neon': tube letters on a dark face · 'cloth': a 布條, folds, a hem and eyelets · 'plaque': carved gilt characters on lacquer
//   rtl: a horizontal board read right to left, as pre-1970s boards and every temple plaque are
function sign(text, w, h, o = {}) {
  const bg = o.bg || '#b3271e', fg = o.fg || '#fff3d6', kind = o.kind || 'paint', font = o.font || (kind === 'box' ? YUAN : KAI), wt = o.weight || (kind === 'box' ? 700 : 800);
  { const c = new T.Color(bg); if (c.r * 0.3 + c.g * 0.6 + c.b * 0.1 > 0.6) o.light = true; }                 // a light-backed sign glows less, or the glow pass washes its text out
  return paint(w, h, (g, W, H) => {
    const u = Math.min(W, H), long = Math.max(W, H);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (kind === 'box') { const gr = g.createLinearGradient(0, 0, o.vertical ? W : 0, o.vertical ? 0 : H); gr.addColorStop(0, 'rgba(0,0,0,.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const n = Math.max(1, Math.round(long / u / 1.5)); g.fillStyle = 'rgba(0,0,0,.16)'; for (let i = 1; i < n; i++) { if (o.vertical) g.fillRect(0, H * i / n - 1, W, 2); else g.fillRect(W * i / n - 1, 0, 2, H); }   // the seams between acrylic panels
      g.strokeStyle = '#2b2b30'; g.lineWidth = u * 0.07; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth); }
    else if (kind === 'cloth') { const n = Math.max(3, Math.round((o.vertical ? H : W) / u * 1.3)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, a = 0.05 + rnd() * 0.07; const gr = o.vertical ? g.createLinearGradient(0, H * (t - 0.5 / n), 0, H * (t + 0.5 / n)) : g.createLinearGradient(W * (t - 0.5 / n), 0, W * (t + 0.5 / n), 0);
        gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.8})`); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }                                  // the sag folds of hung cloth
      g.setLineDash([u * 0.05, u * 0.04]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1, u * 0.012); g.strokeRect(u * 0.05, u * 0.05, W - u * 0.1, H - u * 0.1); g.setLineDash([]);
      g.fillStyle = '#d8d2c2'; [[0.07, 0.07], [0.93, 0.07], [0.07, 0.93], [0.93, 0.93]].forEach(([x, y]) => { g.beginPath(); g.arc(o.vertical ? W * x : u * 0.09 + (W - u * 0.18) * (x > 0.5), o.vertical ? u * 0.09 + (H - u * 0.18) * (y > 0.5) : H * y, u * 0.03, 0, 7); g.fill(); }); }
    else if (kind === 'plaque') { g.strokeStyle = fg; g.lineWidth = u * 0.07; g.strokeRect(u * 0.06, u * 0.06, W - u * 0.12, H - u * 0.12); g.lineWidth = u * 0.02; g.strokeRect(u * 0.15, u * 0.15, W - u * 0.3, H - u * 0.3); }
    else if (kind === 'paint') { if (o.border !== false) { g.strokeStyle = fg; g.lineWidth = Math.max(1.5, u * 0.022); const m = u * 0.06; g.strokeRect(m, m, W - 2 * m, H - 2 * m); }
      for (let i = 0; i < long / 14; i++) { g.fillStyle = `rgba(${o.light ? '70,55,35' : '0,0,0'},${0.03 + rnd() * 0.06})`; g.fillRect(rnd() * W, 0, 1 + rnd() * u * 0.05, H * (0.2 + rnd() * 0.8)); } }                 // rain streaks down a painted board
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const draw = (txt, x, y, size, fg = o.fg || '#fff3d6') => {
      if (kind === 'neon') { g.shadowColor = fg; g.shadowBlur = size * 0.22; g.strokeStyle = fg; g.lineWidth = size * 0.085; g.strokeText(txt, x, y); g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = size * 0.025; g.strokeText(txt, x, y); return; }
      if (kind === 'plaque') { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(txt, x + size * 0.03, y + size * 0.04); }
      if (o.outline) { g.strokeStyle = o.outline; g.lineWidth = size * 0.12; g.strokeText(txt, x, y); }
      g.fillStyle = fg; g.fillText(txt, x, y); };
    const fit = (txt, size, maxW, weight, face) => { g.font = `${weight} ${size}px ${face}`; const mw = g.measureText(txt).width; if (mw > maxW) { size *= maxW / mw; g.font = `${weight} ${size}px ${face}`; } return size; };
    const pad = kind === 'box' || kind === 'plaque' ? 0.8 : 0.9;
    if (o.vertical) { const ch = [...text], top = o.sub ? 0.86 : 1, m = kind === 'cloth' ? 0.06 : 0.02, cell = H * (top - 2 * m) / ch.length, size = Math.min(W * 0.78 * pad / 0.9, cell * 0.92); g.font = `${wt} ${size}px ${font}`; ch.forEach((c, i) => { if (c !== '　') draw(c, W / 2, H * m + cell * (i + 0.52), size); });
      if (o.sub) { const z = fit(o.sub, H * 0.07, W * 0.84, 700, o.subFont || FONT); draw(o.sub, W / 2, H * 0.93, z, o.subFg); } }
    else { const t = o.rtl ? [...text].reverse().join('') : text, mainH = o.sub ? 0.56 : 0.72, z = fit(t, H * mainH, W * pad, wt, font); if (o.spread) { const ch = [...t], cw = W * pad / ch.length; ch.forEach((c, i) => draw(c, W * (1 - pad) / 2 + cw * (i + 0.5), H * (o.sub ? 0.4 : 0.53), Math.min(z, cw * 0.95))); } else draw(t, W / 2, H * (o.sub ? 0.4 : 0.53), z);
      if (o.sub) { const z2 = fit(o.sub, H * 0.2, W * pad, 700, o.subFont || FONT); draw(o.sub, W / 2, H * 0.8, z2, o.subFg); } }
  }, o);
}
// a hand-painted film billboard: a dusk sky, two painted figures, a title in fat brushed characters (titles are made up)
function filmPoster(title, tag, hue, grid) {
  return (g, W, H) => {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, `hsl(${hue + 200},55%,24%)`); sky.addColorStop(0.5, `hsl(${hue + 330},60%,46%)`); sky.addColorStop(0.78, `hsl(${hue + 28},85%,58%)`); sky.addColorStop(1, `hsl(${hue + 45},90%,70%)`);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,236,170,.9)'; g.beginPath(); g.arc(W * 0.3, H * 0.62, W * 0.11, 0, 7); g.fill();
    g.fillStyle = `hsl(${hue + 250},35%,16%)`; for (let x = 0; x < W;) { const bw = W * (0.04 + rnd() * 0.07), bh = H * (0.08 + rnd() * 0.16); g.fillRect(x, H * 0.86 - bh, bw + 1, bh + H * 0.14); x += bw; }
    const bust = (cx, cy, s, shirt, hairLong) => { const E = (x, y, rx, ry, c, rot = 0, a0 = 0, a1 = 7) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, a0, a1); g.fill(); };
      if (hairLong) { E(cx, cy - s * 0.05, s * 0.74, s * 0.82, '#1d1512'); g.fillRect(cx - s * 0.74, cy - s * 0.05, s * 1.48, s * 1.05); E(cx - s * 0.5, cy + s * 0.95, s * 0.3, s * 0.4, '#1d1512'); E(cx + s * 0.5, cy + s * 0.95, s * 0.3, s * 0.4, '#1d1512'); }
      E(cx, cy + s * 1.3, s * 1.2, s * 0.85, shirt, 0, Math.PI, 0); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx, cy + s * 0.5, s * 1.2, s * 0.9);
      g.fillStyle = '#d9a078'; g.fillRect(cx - s * 0.2, cy + s * 0.35, s * 0.4, s * 0.5); E(cx, cy, s * 0.5, s * 0.64, '#ecc19a'); E(cx + s * 0.2, cy + s * 0.06, s * 0.3, s * 0.56, 'rgba(176,96,62,.42)'); E(cx - s * 0.2, cy - s * 0.08, s * 0.16, s * 0.3, 'rgba(255,240,214,.55)', 0.2); E(cx + s * 0.02, cy + s * 0.5, s * 0.3, s * 0.16, 'rgba(150,80,55,.3)');
      E(cx - s * 0.24, cy + s * 0.2, s * 0.11, s * 0.07, 'rgba(214,96,80,.4)'); E(cx + s * 0.26, cy + s * 0.2, s * 0.1, s * 0.07, 'rgba(160,60,50,.35)');
      g.strokeStyle = '#2a1a14'; g.lineCap = 'round'; [-1, 1].forEach(k => { g.lineWidth = s * 0.055; g.beginPath(); g.moveTo(cx + k * s * 0.33, cy - s * 0.13); g.quadraticCurveTo(cx + k * s * 0.2, cy - s * 0.22, cx + k * s * 0.08, cy - s * 0.14); g.stroke();                    // brow
        g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(cx + k * s * 0.3, cy + s * 0.01); g.quadraticCurveTo(cx + k * s * 0.2, cy - s * 0.07, cx + k * s * 0.1, cy + s * 0.01); g.stroke(); E(cx + k * s * 0.2, cy + s * 0.005, s * 0.045, s * 0.04, '#2a1a14'); E(cx + k * s * 0.19, cy - s * 0.01, s * 0.012, s * 0.012, '#fff'); });   // lid, iris, a light in the eye
      E(cx + s * 0.07, cy + s * 0.2, s * 0.07, s * 0.035, 'rgba(120,60,40,.5)'); g.fillStyle = '#b3271e'; g.beginPath(); g.moveTo(cx - s * 0.13, cy + s * 0.38); g.quadraticCurveTo(cx, cy + s * 0.33, cx + s * 0.13, cy + s * 0.38); g.quadraticCurveTo(cx, cy + s * 0.47, cx - s * 0.13, cy + s * 0.38); g.fill();
      if (hairLong) { g.fillStyle = '#1d1512'; g.beginPath(); g.moveTo(cx - s * 0.56, cy + s * 0.1); g.quadraticCurveTo(cx - s * 0.6, cy - s * 0.75, cx + s * 0.05, cy - s * 0.66); g.quadraticCurveTo(cx - s * 0.3, cy - s * 0.4, cx - s * 0.4, cy + s * 0.1); g.fill(); g.beginPath(); g.moveTo(cx + s * 0.56, cy + s * 0.1); g.quadraticCurveTo(cx + s * 0.62, cy - s * 0.75, cx, cy - s * 0.66); g.quadraticCurveTo(cx + s * 0.4, cy - s * 0.42, cx + s * 0.44, cy + s * 0.1); g.fill(); }
      else { g.fillStyle = '#1d1512'; g.beginPath(); g.moveTo(cx - s * 0.54, cy - s * 0.05); g.quadraticCurveTo(cx - s * 0.62, cy - s * 0.8, cx + s * 0.1, cy - s * 0.78); g.quadraticCurveTo(cx + s * 0.66, cy - s * 0.74, cx + s * 0.54, cy - s * 0.02); g.quadraticCurveTo(cx + s * 0.46, cy - s * 0.42, cx + s * 0.1, cy - s * 0.44); g.quadraticCurveTo(cx - s * 0.3, cy - s * 0.4, cx - s * 0.46, cy - s * 0.3); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(255,235,200,.25)'; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(cx - s * 0.3, cy - s * 0.62); g.quadraticCurveTo(cx, cy - s * 0.72, cx + s * 0.3, cy - s * 0.58); g.stroke(); };
    bust(W * 0.36, H * 0.4, W * 0.17, `hsl(${hue + 10},70%,42%)`, true); bust(W * 0.66, H * 0.33, W * 0.2, `hsl(${hue + 215},45%,30%)`, false);
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${rnd() < 0.5 ? '255,240,210' : '40,20,30'},${0.03 + rnd() * 0.07})`; g.lineWidth = 2 + rnd() * 7; const x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * W * 0.18, y + (rnd() - 0.5) * H * 0.05); g.stroke(); }   // brush marks
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    // a foreign film's board, as on 樂聲 in the 1964 opening newsreel: the title in heavy block characters read right to left, the English title under it
    const en = grid && grid.en, tt = en ? [...title].reverse().join('　') : title, ty = H * (en ? 0.725 : 0.76), size = Math.min(W * 0.92 / [...tt].length, H * 0.2);
    if (en) { g.fillStyle = 'rgba(20,12,30,.72)'; g.fillRect(0, H * 0.6, W, H * 0.28); }
    g.font = `900 ${size}px ${en ? FONT : WEI}`; g.lineWidth = size * 0.2; g.strokeStyle = '#fff6e0'; if (!en) g.strokeText(tt, W / 2, ty); g.lineWidth = size * 0.1; g.strokeStyle = '#7a120c'; g.strokeText(tt, W / 2, ty); g.fillStyle = en ? '#fff6e0' : '#ffd21f'; g.fillText(tt, W / 2, ty);
    if (en) { g.font = `800 ${H * 0.045}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`; g.fillStyle = '#ffd21f'; g.fillText(en.split('').join(' '), W / 2, H * 0.842); }
    g.font = `800 ${H * 0.062}px ${KAI}`; g.fillStyle = '#fff'; g.fillRect(W * 0.2, H * 0.885, W * 0.6, H * 0.085); g.fillStyle = '#b3271e'; g.fillText(tag, W / 2, H * 0.93);
    if (grid) { g.fillStyle = 'rgba(20,10,5,.4)'; for (let i = 1; i < grid.cols; i++) g.fillRect(W * i / grid.cols - 1.5, 0, 3, H); for (let i = 1; i < grid.rows; i++) g.fillRect(0, H * i / grid.rows - 1.5, W, 3); }   // the seams between the 6尺 canvas panels
    g.strokeStyle = '#f3e6c8'; g.lineWidth = Math.max(3, W * 0.012); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
  };
}
const graffiti = (words) => (g, W, H) => {
  g.fillStyle = '#6f6a66'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += H / 14) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y, W, 2); }
  for (let i = 0; i < 9; i++) { g.fillStyle = `hsla(${rnd() * 360},80%,${45 + rnd() * 20}%,.85)`; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, W * (0.06 + rnd() * 0.12), H * (0.1 + rnd() * 0.2), rnd() * 3, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  words.forEach((w, i) => { const s = H * (0.3 - i * 0.05); g.save(); g.translate(W * (0.3 + 0.4 * (i % 2)), H * (0.32 + 0.3 * i)); g.rotate((rnd() - 0.5) * 0.3); g.font = `900 italic ${s}px Impact, "Arial Black", sans-serif`;
    g.lineWidth = s * 0.22; g.strokeStyle = '#111'; g.strokeText(w, 0, 0); g.lineWidth = s * 0.08; g.strokeStyle = '#fff'; g.strokeText(w, 0, 0); g.fillStyle = `hsl(${rnd() * 360},90%,55%)`; g.fillText(w, 0, 0); g.restore(); });
  for (let i = 0; i < 14; i++) { g.fillStyle = `hsla(${rnd() * 360},85%,55%,.8)`; const x = rnd() * W; g.fillRect(x, H * (0.3 + rnd() * 0.4), 3, H * (0.1 + rnd() * 0.3)); }     // drips
};
const flashArt = (g, W, H) => {
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, W, H); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const cx = W * (c + 0.5) / 4, cy = H * (r + 0.5) / 3, s = Math.min(W / 4, H / 3) * 0.32, k = (r * 4 + c) % 4; g.fillStyle = ['#b3271e', '#1f4f9c', '#2f7d5a', '#d9a53a'][(r + c) % 4]; g.beginPath();
    if (k === 0) { for (let i = 0; i < 11; i++) { const a = i / 10 * 6.283 * 2, rad = i % 2 ? s * 0.45 : s; g.lineTo(cx + Math.sin(a / 2 * 1) * rad, cy - Math.cos(a / 2) * rad); } }           // a star
    else if (k === 1) { g.moveTo(cx, cy + s); g.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.5, cy - s * 1.3, cx, cy - s * 0.4); g.bezierCurveTo(cx + s * 0.5, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s); }   // a heart
    else if (k === 2) { g.arc(cx, cy, s * 0.8, 0, 7); }                                                                                                                             // a rose, as rings
    else { g.moveTo(cx - s, cy - s * 0.3); g.quadraticCurveTo(cx, cy - s * 1.2, cx + s, cy - s * 0.3); g.lineTo(cx + s * 0.3, cy + s); g.lineTo(cx - s * 0.3, cy + s); }           // a dagger-ish banner
    g.closePath(); g.fill(); g.stroke(); if (k === 2) { g.beginPath(); g.arc(cx, cy, s * 0.45, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, s * 0.18, 0, 7); g.stroke(); } }
};
const stripes = (a, b, n) => (g, W, H) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * W / n, 0, W / n + 1, H); } };

// ── parts shared by the buildings ────────────────────────────────────────────────────────────
// A window wall with real depth: glass set back `rec`, piers between bays, spandrels between floors, mullions, sills.
function facade(K, o) {
  const { x0, x1, y0, floors, fh, bays, wall, depth } = o, pier = o.pier == null ? 0.5 : o.pier, sill = o.sill == null ? 0.9 : o.sill, head = o.head == null ? 0.45 : o.head, rec = o.rec || 0.22;
  const glass = o.glass || M.glass, y1 = y0 + floors * fh, bw = (x1 - x0) / bays, litP = o.lit == null ? 0.13 : o.lit, band = o.band || wall;
  if (depth) K.bx(x0, x1, y0, y1, -depth, -rec - 0.05, wall);
  for (let b = 0; b <= bays; b++) { const x = x0 + b * bw; K.bx(Math.max(x0, x - pier / 2), Math.min(x1, x + pier / 2), y0, y1, -rec - 0.05, 0, wall); }
  for (let f = 0; f <= floors; f++) { const y = y0 + f * fh; K.bx(x0, x1, Math.max(y0, y - head), Math.min(y1, y + sill), -rec - 0.05, f && f < floors && o.band ? 0.05 : 0, band); }
  for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) {
    const xa = x0 + b * bw + pier / 2, xb = xa + bw - pier, ya = y0 + f * fh + sill, yb = y0 + (f + 1) * fh - head, cx = (xa + xb) / 2;
    K.bx(xa, xb, ya, yb, -rec - 0.03, -rec + 0.02, rnd() < litP ? M.winLit : glass);
    if (o.mullion !== false) { K.bx(cx - 0.03, cx + 0.03, ya, yb, -rec + 0.02, -rec + 0.07, M.frame); K.bx(xa, xb, yb - (yb - ya) * 0.3 - 0.025, yb - (yb - ya) * 0.3 + 0.025, -rec + 0.02, -rec + 0.07, M.frame); }
    K.bx(xa - 0.06, xb + 0.06, ya - 0.07, ya, -0.02, 0.09, o.sillMat || M.concLt);
    if (o.ac && rnd() < o.ac) { const ax = rr(xa + 0.1, xb - 0.75); K.bx(ax, ax + 0.7, ya - 0.5, ya - 0.06, 0, 0.36, M.concLt); K.bx(ax + 0.08, ax + 0.62, ya - 0.44, ya - 0.12, 0.36, 0.38, M.frame); }
    if (o.grille && rnd() < o.grille) { for (let k = 0; k <= 5; k++) { const gx = xa + (xb - xa) * k / 5; K.bx(gx - 0.012, gx + 0.012, ya, yb, 0.28, 0.3, M.frame); } K.bx(xa, xb, ya - 0.03, ya, 0, 0.3, M.frame); K.bx(xa, xb, yb, yb + 0.03, 0, 0.3, M.frame);
      if (rnd() < 0.6) K.bx(xa + 0.15, xa + 0.5, ya, ya + 0.35, 0.05, 0.25, pick(CLOTH)); }
  }
  return y1;
}
// a standing or sitting figure, plain blocks, no likeness. o: shirt, pants, bowl, sit, apron
function person(K, x, z, ry, o = {}) {
  K.at(x, 0, z, ry); const sh = o.shirt || pick(SHIRT), pa = o.pants || pick(PANTS), d = o.sit ? -0.38 : 0, s = o.h || rr(0.94, 1.06);
  if (o.sit) { K.bx(-0.16, -0.03, 0.42, 0.56, 0, 0.42, pa); K.bx(0.03, 0.16, 0.42, 0.56, 0, 0.42, pa); K.bx(-0.16, -0.03, 0, 0.45, 0.32, 0.44, pa); K.bx(0.03, 0.16, 0, 0.45, 0.32, 0.44, pa);
    K.cyl(0.17, 0.15, 0.42, M.wood, 0, 0.21, 0, 8); }
  else { K.bx(-0.16, -0.03, 0, 0.82 * s, -0.08, 0.08, pa); K.bx(0.03, 0.16, 0, 0.82 * s, -0.08, 0.08, pa); K.bx(-0.17, -0.02, 0, 0.07, -0.08, 0.16, M.black); K.bx(0.02, 0.17, 0, 0.07, -0.08, 0.16, M.black); }
  const ty = (0.82 + d) * s; K.cyl(0.19, 0.17, 0.56 * s, sh, 0, ty + 0.28 * s, 0, 8); if (o.apron) K.bx(-0.16, 0.16, ty - 0.2, ty + 0.4, 0.15, 0.19, M.whiteP);
  K.cyl(0.05, 0.06, 0.08, M.skin, 0, ty + 0.6 * s, 0, 6); K.sph(0.115, M.skin, 0, ty + 0.74 * s, 0.01, 1.12); K.sph(0.125, M.hair, 0, ty + 0.79 * s, -0.025, 0.92);
  if (o.bowl) { [-1, 1].forEach(k => { K.box(0.08, 0.3, 0.08, sh, k * 0.24, ty + 0.38 * s, 0.05, 0, -0.45); K.box(0.065, 0.065, 0.26, M.skin, k * 0.17, ty + 0.25 * s, 0.22, k * -0.35); });
    K.cyl(0.095, 0.06, 0.075, M.whiteP, -0.05, ty + 0.27 * s, 0.34, 10); K.box(0.015, 0.16, 0.015, M.whiteP, 0.1, ty + 0.36 * s, 0.33, 0, 0.5); }
  else if (o.reach) { K.box(0.08, 0.3, 0.08, sh, -0.25, ty + 0.36 * s, 0, 0, 0); K.box(0.075, 0.42, 0.075, sh, 0.25, ty + 0.42 * s, 0.16, 0, -1.15); }
  else [-1, 1].forEach(k => K.box(0.08, 0.5 * s, 0.08, sh, k * 0.25, ty + 0.3 * s, 0));
  K.at(); return K;
}
// a shophouse storey stack over a ground-floor opening, used by the small shops and the fill-in rows
function shophouse(K, w, floors, wall, o = {}) {
  const G = o.ground || 3.5, fh = o.fh || 3.1, depth = o.depth || 9, x0 = -w / 2, x1 = w / 2;
  const top = facade(K, { x0, x1, y0: G, floors, fh, bays: o.bays || Math.max(2, Math.round(w / 1.9)), wall, depth, pier: 0.4, ac: 0.3, grille: o.grille == null ? 0.3 : o.grille, lit: 0.18 });
  K.bx(x0, x1, top, top + 0.7, -0.3, 0.06, wall); K.bx(x0 - 0.04, x1 + 0.04, top + 0.7, top + 0.8, -0.36, 0.12, M.concDk); K.bx(x0, x1, top, top + 0.15, -depth, -0.3, M.concDk);
  if (rnd() < 0.7) { const tx = rr(x0 + 0.8, x1 - 0.8); K.cyl(0.55, 0.55, 1.3, M.steel, tx, top + 1.3, -3, 12); [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].forEach(([a, b]) => K.bx(tx + a - 0.03, tx + a + 0.03, top + 0.15, top + 0.7, -3 + b - 0.03, -3 + b + 0.03, M.steelDk)); }   // the roof water tank
  K.bx(x0, x0 + 0.3, 0, G, -depth, 0, wall); K.bx(x1 - 0.3, x1, 0, G, -depth, 0, wall); K.bx(x0, x1, 0, G, -depth, -2.6, M.dark); K.bx(x0, x1, G - 0.25, G, -2.6, 0, wall);
  return { G, top, x0, x1 };
}
const jar = (K, x, y, z, r, h, fill, lid) => { K.cyl(r, r, h * 0.82, fill, x, y + h * 0.41, z, 12); K.cyl(r * 1.04, r * 1.04, h * 0.1, M.jar, x, y + h * 0.87, z, 12); K.cyl(r * 0.8, r * 0.85, h * 0.1, lid || M.red, x, y + h * 0.97, z, 12); };
const lantern = (K, x, y, z, r = 0.22) => { K.sph(r, M.lantern, x, y, z, 0.9); K.cyl(r * 0.45, r * 0.45, 0.05, M.gold, x, y + r * 0.86, z, 8); K.cyl(r * 0.45, r * 0.45, 0.05, M.gold, x, y - r * 0.86, z, 8); K.bx(x - 0.008, x + 0.008, y + r * 0.86, y + r * 0.86 + 0.3, z - 0.008, z + 0.008, M.frame); K.bx(x - 0.03, x + 0.03, y - r * 0.86 - 0.22, y - r * 0.86, z - 0.03, z + 0.03, M.red); };
const waterTank = (K, x, y, z) => { K.cyl(0.7, 0.7, 1.6, M.steel, x, y + 1.5, z, 14); K.cyl(0.1, 0.72, 0.25, M.steel, x, y + 2.42, z, 14); [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([a, b]) => K.bx(x + a - 0.04, x + a + 0.04, y, y + 0.72, z + b - 0.04, z + b + 0.04, M.steelDk)); };
// a steel lattice: two legs, rungs and one diagonal per panel, in the plane z
function lattice(K, xa, xb, y0, y1, z, n, mat = M.steelDk) {
  K.bx(xa - 0.05, xa + 0.05, y0, y1, z - 0.05, z + 0.05, mat); K.bx(xb - 0.05, xb + 0.05, y0, y1, z - 0.05, z + 0.05, mat);
  const h = (y1 - y0) / n, w = xb - xa, len = Math.hypot(w, h), a = Math.atan2(h, w);
  for (let i = 0; i <= n; i++) K.bx(xa, xb, y0 + i * h - 0.035, y0 + i * h + 0.035, z - 0.035, z + 0.035, mat);
  for (let i = 0; i < n; i++) K.box(len, 0.05, 0.05, mat, (xa + xb) / 2, y0 + (i + 0.5) * h, z, 0, 0, i % 2 ? a : -a);
}

const groups = {};

// ══ 1. 中華商場: one of the eight three-storey slabs (the 忠 block), 21 shopfronts each 2 m wide ═════════════
function zhonghua() {
  const ZC = triMat({ color: '#ded5bd', tex: TEX.plaster, scale: 0.4, rough: 0.88, emissive: '#5a4c30', eI: 0.5 });   // the pale painted concrete of the old photos, lifted a little: this front faces away from the sun
  const K = Kit('zhonghua-market'), KB = Kit('zhonghua-footbridge'), x0 = -21, x1 = 21, G = 3.2, F = 3.0, top = G + 2 * F;
  K.bx(x0, x1, 0, G, -9, -2.4, M.dark); K.bx(x0, x1, G, top, -9, -1.3, ZC);
  K.bx(x0 - 0.1, x1 + 0.1, top, top + 0.25, -9.1, 0.8, M.concDk); K.bx(x0, x1, top + 0.25, top + 1.0, 0.6, 0.78, ZC); K.bx(x0, x1, top + 0.25, top + 1.0, -9.1, -8.9, ZC);
  [x0, x1 - 0.25].forEach(x => K.bx(x, x + 0.25, 0, top + 1.0, -9, 0.75, ZC));
  [G, G + F].forEach(y => { K.bx(x0, x1, y - 0.22, y, -1.3, 0.78, M.concDk); K.bx(x0, x1, y, y + 0.82, 0.64, 0.78, ZC); K.bx(x0, x1, y + 1.0, y + 1.05, 0.68, 0.74, M.frame);
    for (let x = x0 + 0.5; x < x1; x += 1) K.bx(x - 0.015, x + 0.015, y + 0.82, y + 1.0, 0.7, 0.72, M.frame); });
  for (let i = 0; i <= 21; i++) { const x = x0 + i * 2; K.bx(Math.max(x0, x - 0.13), Math.min(x1, x + 0.13), 0, top, 0.48, 0.78, ZC); if (i < 21) K.bx(x + 0.94, x + 1.06, 0, G - 0.22, -2.4, 0.3, M.concDk); }
  const counters = [M.wood, M.woodDk, M.steel, M.concLt];
  for (let i = 0; i < 21; i++) {
    const a = x0 + i * 2 + 0.13, b = a + 1.74;
    if (rnd() < 0.2) { K.bx(a, b, 0, 2.55, 0.36, 0.42, M.shutter); for (let y = 0.25; y < 2.5; y += 0.25) K.bx(a, b, y, y + 0.02, 0.42, 0.435, M.steelDk); continue; }
    K.bx(a + 0.08, b - 0.08, 0.95, 2.35, -2.39, -2.34, M.shopLit); K.bx(a + 0.3, b - 0.3, 2.44, 2.5, -0.7, -0.6, M.tube);
    K.bx(a + 0.1, a + 1.05, 0, 0.86, -0.45, 0.28, pick(counters)); for (let k = 0; k < 4; k++) { const gx = a + 0.16 + k * 0.22; K.bx(gx, gx + 0.17, 0.86, 0.86 + rr(0.1, 0.34), -0.3, 0.12, pick(CLOTH)); }
    for (let s = 0; s < 3; s++) { const y = 1.05 + s * 0.45; K.bx(a + 0.08, b - 0.08, y, y + 0.035, -2.32, -2.0, M.wood); for (let k = 0; k < 6; k++) { const gx = a + 0.14 + k * 0.26; K.bx(gx, gx + 0.2, y + 0.035, y + rr(0.14, 0.36), -2.28, -2.05, pick(CLOTH)); } }
    if (rnd() < 0.6) for (let k = 0; k < 4; k++) { const gx = a + 0.2 + k * 0.38; K.bx(gx, gx + 0.26, 1.85, 2.5, 0.28, 0.32, pick(CLOTH)); }                    // goods hung from the lintel
    if (rnd() < 0.45) person(K, a + rr(1.2, 1.5), rr(-1.2, -0.5), rr(-0.5, 0.5), {});
  }
  // the fascia: three painted strips, seven shop names each (trades typical of the block; guesses, not a record)
  // real shop names of the market, from the block lists on zh.wikipedia 中華商場 and the boards legible in the Commons photos (docs/signage/sources.md). One block here stands for all eight, so names from several blocks share it.
  const trades = ['寶島鐘錶', '海利電子', '美聲樂器', '中一皮鞋', '鴻霖唱片行', '吳抄手', '溫州大餛飩', '大漢郵幣社', '海派牛仔褲', '哥倫比亞唱片行', '環球唱片行', '佳佳唱片行', '松竹唱片行', '金門唱片行', '點心世界', '真北平飯館', '徐州啥鍋', '清真館', '致美樓', '禮品', '中華傳統服裝店'];
  const dk = [['#1c1a18', '#f3ecd9'], ['#3a1410', '#f3e2b0'], ['#12301f', '#f3ecd9'], ['#f1ece0', '#1a1a1a'], ['#14233f', '#f3ecd9']], wb = [['#f1ece0', '#1a1a1a'], ['#f1ece0', '#a3221a'], ['#f1ece0', '#1a1a1a'], ['#a3221a', '#f6efdc']];   // dark boards with light brush characters, one white among them (the 信棟 arcade photo); white boards with dark characters upstairs
  const cols = [['#b3271e', '#fff3d6'], ['#f0d35a', '#7a120c'], ['#f3ecd9', '#1f4f9c'], ['#1f5a3a', '#fff3d6'], ['#f3ecd9', '#b3271e'], ['#1f3a6e', '#ffe14a']];
  for (let s = 0; s < 3; s++) K.mesh(paint(14, 0.62, (g, W, H) => { for (let i = 0; i < 7; i++) { const c = dk[(s * 7 + i * 3) % dk.length], x = i * W / 7; g.fillStyle = c[0]; g.fillRect(x + 3, 0, W / 7 - 6, H); g.fillStyle = c[1]; g.textAlign = 'center'; g.textBaseline = 'middle';
    const t = [...trades[s * 7 + i]].reverse().join(''); let size = H * 0.7; g.font = `800 ${size}px ${KAI}`; const mw = g.measureText(t).width; if (mw > W / 7 * 0.86) { size *= W / 7 * 0.86 / mw; g.font = `800 ${size}px ${KAI}`; } g.fillText(t, x + W / 14, H * 0.54); } }, { glow: 0.75, oneSide: true, ppm: 146 }), -14 + s * 14, 2.86, 0.83);
  // the corridor parapets: painted advertisements unit by unit, the look every old photo of the block has (wording is a guess)
  const ads = ['小通天', '榕江樓小吃部', '訂做皮鞋', '寶島鐘錶', '佳佳唱片行', '吳抄手', '大漢郵幣社', '真北平飯館', '點心世界', '海派牛仔褲', '美聲樂器', '徐州啥鍋', '中一皮鞋', '致美樓', '清真館', '海利電子', '溫州大餛飩', '松竹唱片行', '鴻霖唱片行', '金門唱片行', '禮品'];
  [G, G + F].forEach((y, f) => { for (let s = 0; s < 3; s++) K.mesh(paint(14, 0.74, (g, W, H) => { g.fillStyle = '#e4dcc6'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) { const u = f * 21 + s * 7 + i, x = i * W / 7; if (u % 5 === 3) { g.fillStyle = 'rgba(90,80,60,.12)'; for (let k = 0; k < 5; k++) g.fillRect(x + rnd() * W / 7, 0, 3 + rnd() * 8, H); continue; }   // a bare stretch, rain-streaked
      const c = wb[(u * 2 + f) % wb.length]; g.fillStyle = c[0]; g.fillRect(x + 5, 4, W / 7 - 10, H - 8); g.strokeStyle = c[1]; g.lineWidth = 3; g.strokeRect(x + 11, 10, W / 7 - 22, H - 20); g.fillStyle = c[1]; g.textAlign = 'center'; g.textBaseline = 'middle';
      const t = ads[(u * 4 + 1) % ads.length]; let size = H * 0.6; g.font = `800 ${size}px ${KAI}`; const mw = g.measureText(t).width; if (mw > W / 7 * 0.8) { size *= W / 7 * 0.8 / mw; g.font = `800 ${size}px ${KAI}`; } g.fillText(t, x + W / 14, H * 0.54); } }, { glow: 0.6, oneSide: true, ppm: 120, depth: 0.04, noCast: true }), -14 + s * 14, y + 0.41, 0.8); });
  // the upper floors: open access corridors with a door and a window per unit, laundry and clutter on the rail
  const doors = [std('#3f6f8a', 0.7), std('#4f7a5a', 0.7), M.wood, std('#8a8a80', 0.7)];
  [G, G + F].forEach(y => { for (let i = 0; i < 21; i++) { const a = x0 + i * 2 + 0.13, b = a + 1.74;
    K.bx(a + 0.15, a + 0.95, y, y + 2.0, -1.31, -1.26, pick(doors)); K.bx(a + 1.08, b - 0.05, y + 1.0, y + 1.95, -1.31, -1.26, rnd() < 0.3 ? M.winLit : M.glass); K.bx(a + 1.04, b - 0.01, y + 0.94, y + 1.0, -1.3, -1.2, M.concLt);
    if (rnd() < 0.3) { const n = 2 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) { const cx = a + 0.1 + k * 0.42; K.bx(cx, cx + 0.34, y + rr(0.45, 0.6), y + 1.0, 0.83, 0.85, pick(CLOTH)); } }
    if (rnd() < 0.35) K.bx(a + 1.1, a + 1.6, y, y + rr(0.3, 0.7), -1.2, -0.75, pick([M.wood, M.concLt, M.shutter]));
    if (rnd() < 0.25) K.bx(a + 0.2, a + 0.9, y + 2.5, y + 2.56, -1.0, -0.9, M.tube); } });
  // signs sticking out from the columns, the dense red, yellow and white of the old photos
  [['小通天', 0], ['訂做皮鞋', 3], ['寶島鐘錶', 5], ['佳佳唱片', 8], ['吳抄手', 10], ['大漢郵幣社', 13], ['致美樓', 15], ['海利電子', 18], ['清真館', 20]].forEach(([t, i], k) => { const c = cols[k % cols.length];
    K.mesh(sign(t, 0.5, 0.4 * [...t].length + 0.12, { vertical: true, bg: '#f1ece0', fg: k % 3 === 1 ? '#a3221a' : '#1a1a1a', glow: 0.5, border: false }), x0 + i * 2 + 2, G + 1.9 + (k % 2) * 3.0, 1.25, Math.PI / 2); K.bx(x0 + i * 2 + 1.97, x0 + i * 2 + 2.03, G + 2.55 + (k % 2) * 3.0, G + 2.6 + (k % 2) * 3.0, 0.78, 1.25, M.frame); });
  [['美聲樂器', 1], ['中一皮鞋', 4], ['真北平', 6], ['點心世界', 9], ['松竹唱片', 11], ['徐州啥鍋', 14], ['金門唱片', 16], ['榕江樓', 19]].forEach(([t, i], k) => { const c = cols[(k + 3) % cols.length], lv = (k + 1) % 2;
    K.mesh(sign(t, 0.5, 0.4 * [...t].length + 0.12, { vertical: true, bg: '#f1ece0', fg: k % 3 === 1 ? '#a3221a' : '#1a1a1a', glow: 0.5, border: false }), x0 + i * 2 + 2, G + 1.9 + lv * 3.0, 1.25, Math.PI / 2); K.bx(x0 + i * 2 + 1.97, x0 + i * 2 + 2.03, G + 2.55 + lv * 3.0, G + 2.6 + lv * 3.0, 0.78, 1.25, M.frame); });
  K.mesh(sign('中華商場', 7.5, 1.1, { bg: '#f3ecd9', fg: '#b3271e', rtl: true, spread: true, glow: 0.5, oneSide: true }), -2, top + 0.68, 0.84);
  K.mesh(sign('慶祝臺灣光復節', 9.5, 0.72, { kind: 'cloth', bg: '#b3221a', fg: '#ffe14a', spread: true, glow: 0.35, depth: 0.03, noCast: true }), 4, G + 0.42, 0.87);   // the long cloth banner tied along the walkway rail (Commons photo; its wording there is illegible, this one is of the 1975 光復 parade that passed the market)
  // the end walls: a large block numeral under four small characters, as on the 信棟 end wall ("5") in the 1960s night photo; this is the first block
  const endWall = (g, W, H) => { g.fillStyle = '#d6cfbd'; g.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,55,35,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * W, 0, 2 + rnd() * 6, H); } g.fillStyle = '#7a1a14'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${H * 0.15}px ${KAI}`; [...'場商華中'].forEach((c, i) => g.fillText(c, W * (0.2 + i * 0.2), H * 0.14)); g.font = `900 ${H * 0.7}px Georgia, "Times New Roman", serif`; g.fillText('1', W / 2, H * 0.62); };
  K.mesh(paint(2.4, 2.4, endWall, { glow: 0.2, light: true }), x1 + 0.06, 6.4, -4.2, Math.PI / 2); K.mesh(paint(2.4, 2.4, endWall, { glow: 0.2, light: true }), x0 - 0.06, 6.4, -4.2, -Math.PI / 2);
  // the roof line: neon on steel frames. 國際牌 and 黑松汽水 are the two rooftop boards the sources name; two frames stand bare, as after May 1985 when the neon came down
  [[-15, null], [-7.5, null], [6, '黑松汽水']].forEach(([x, t]) => { lattice(K, x - 2.4, x + 2.4, top + 0.25, top + 1.9, -1.2, 3); lattice(K, x - 2.4, x + 2.4, top + 0.25, top + 1.9, -2.4, 3);
    if (t) K.mesh(sign(t, 5.2, 2.3, { kind: 'neon', bg: '#141210', fg: '#ff4a3a', font: WEI, spread: true, glow: 1.5 }), x, top + 3.05, -1.2); });
  const tx = 16.5; [-1.7, 1.7].forEach(z => lattice(K, tx - 1.7, tx + 1.7, top + 0.25, top + 8.2, -3 + z, 4));
  [-1.7, 1.7].forEach(dx => { for (let i = 0; i <= 4; i++) K.bx(tx + dx - 0.035, tx + dx + 0.035, top + 0.25 + i * 1.99 - 0.035, top + 0.25 + i * 1.99 + 0.035, -4.7, -1.3, M.steelDk); });
  K.bx(tx - 2.6, tx + 2.6, top + 8.2, top + 8.3, -3.1, -2.9, M.steelDk); K.bx(tx - 2.6, tx + 2.6, top + 11.4, top + 11.5, -3.1, -2.9, M.steelDk); [-2.6, 2.55].forEach(d => K.bx(tx + d, tx + d + 0.08, top + 8.2, top + 11.5, -3.1, -2.9, M.steelDk));
  for (let i = 1; i < 5; i++) K.bx(tx - 2.6 + i * 1.04, tx - 2.56 + i * 1.04, top + 8.2, top + 11.5, -3.05, -2.95, M.steelDk);                          // the bare bars the letters hung on
  // the footbridge to the second floor at the north end, with its stair down to the pavement
  const bx = -19.5; KB.bx(bx - 1.2, bx + 1.2, G - 0.3, G, 0.78, 5.2, M.concDk); [-1.2, 1.1].forEach(d => { KB.bx(bx + d, bx + d + 0.1, G, G + 0.95, 0.78, 5.2, ZC); }); [1.6, 4.9].forEach(z => KB.bx(bx - 0.2, bx + 0.2, 0, G - 0.3, z - 0.2, z + 0.2, ZC));
  for (let i = 0; i < 16; i++) { const y = G - 0.3 - (i + 1) * 0.181, xs = bx + 1.2 + i * 0.3; KB.bx(xs, xs + 0.32, Math.max(0, y - 0.1), y + 0.19, 3.0, 5.2, M.concDk); }
  KB.box(5.2, 0.9, 0.1, ZC, bx + 3.6, G - 1.0, 5.25, 0, 0, -0.543); KB.box(5.2, 0.9, 0.1, ZC, bx + 3.6, G - 1.0, 2.95, 0, 0, -0.543);
  const g = K.done(); g.userData.bridge = KB.done(); return g;   // the footbridge is its own group, so the market's click box stays at its front wall
}

// ══ 2. 萬年商業大樓: ten storeys, green, the name in neon down the corner ═════════════════════════════════
function wannian() {
  const K = Kit('wannian'), w = 11, x0 = -5.5, x1 = 5.5, G = 4.2, fh = 3.3, D = 12;
  const top = facade(K, { x0, x1, y0: G, floors: 9, fh, bays: 6, wall: M.green, band: M.greenDk, depth: D, pier: 0.36, sill: 1.15, head: 0.5, lit: 0.22, glass: M.glassBlue });
  K.bx(x0, x1, top, top + 1.1, -0.4, 0, M.green); K.bx(x0 - 0.05, x1 + 0.05, top + 1.1, top + 1.25, -0.5, 0.08, M.greenDk); K.bx(x0, x1, top, top + 0.2, -D, -0.4, M.concDk);
  K.bx(-3, 3, top + 0.2, top + 3.2, -8, -4, M.green); waterTank(K, 3.6, top + 0.2, -6); waterTank(K, -4, top + 0.2, -9);
  // ground floor: green piers, the lit arcade of small stalls behind glass, the 峨嵋門 doors under a deep canopy
  K.bx(x0, x1, 0, G, -D, -3.2, M.dark); [x0, -2.4, 2.1, x1 - 0.5].forEach(x => K.bx(x, x + 0.5, 0, G, -3.2, 0, M.green)); [x0 + 0.02, x1 - 0.3].forEach(x => K.bx(x, x + 0.28, 0, G, -D, -3.2, M.green));
  K.bx(x0, x1, G - 0.5, G, -3.2, 0, M.greenDk); K.bx(-2.6, 2.8, 3.1, 3.4, -0.2, 2.1, M.greenDk); K.bx(-2.6, 2.8, 3.4, 3.48, -0.2, 2.1, M.concLt);
  K.mesh(sign('萬年商業大樓', 5.2, 0.8, { kind: 'box', font: KAI, bg: '#f3ecd9', fg: '#1f5a3a', spread: true, glow: 0.75, oneSide: true }), 0.1, 3.86, 2.14);
  K.mesh(sign('峨嵋門', 1.9, 0.5, { bg: '#1f5a3a', fg: '#ffe9a8', glow: 0.8, oneSide: true }), 0.1, 2.8, -0.15);
  K.bx(-1.9, 2.1, 0, 2.5, -0.5, -0.44, M.glassBlue); [-1.9, -0.9, 0.1, 1.1, 2.06].forEach(x => K.bx(x - 0.03, x + 0.03, 0, 2.5, -0.44, -0.38, M.steel)); K.bx(-1.9, 2.1, 2.5, 2.56, -0.5, -0.36, M.steel);
  [-0.4, 0.6].forEach(x => K.bx(x - 0.02, x + 0.02, 0.9, 1.3, -0.38, -0.3, M.steel)); K.bx(-1.8, 2.0, 0.2, 2.4, -3.18, -3.14, M.shopLit);
  [[-5.0, -2.4], [2.6, 5.0]].forEach(([a, b]) => { K.bx(a, b, 0.5, 3.4, -0.6, -0.55, M.pane); K.bx(a, b, 0, 0.5, -0.7, -0.1, M.greenDk); K.bx(a + 0.05, b - 0.05, 0.5, 3.4, -3.18, -3.14, M.shopLit);
    for (let s = 0; s < 5; s++) { const y = 0.55 + s * 0.55; K.bx(a + 0.05, b - 0.05, y, y + 0.03, -1.5, -0.75, M.jar); for (let k = 0; k < 7; k++) { const gx = a + 0.1 + k * (b - a - 0.2) / 7; K.bx(gx, gx + 0.26, y + 0.03, y + rr(0.2, 0.48), -1.4, -0.9, pick(CLOTH)); } } });     // model-kit boxes stacked to the ceiling
  K.mesh(sign('豪華鐘錶公司', 2.3, 0.42, { kind: 'box', bg: '#f1ead6', fg: '#1a1a1a', spread: true, glow: 0.8, oneSide: true }), -3.7, 3.62, 0.06); K.mesh(sign('萬年冰宮', 2.3, 0.42, { kind: 'box', bg: '#1f4f9c', fg: '#ffffff', spread: true, glow: 0.8, oneSide: true }), 3.8, 3.62, 0.06);
  K.mesh(sign('萬年', 5.6, 1.5, { bg: '#1f5a3a', fg: '#ffe9a8', glow: 0.7, oneSide: true }), 0, G + 0.62, 0.08);
  // the corner fin: a three-sided neon tower, name running down nine floors
  const fx = x0 - 0.05; K.box(1.5, top - G - 1, 1.5, M.greenDk, fx, (top + G + 1) / 2, 0.15, Math.PI / 4);
  [[-Math.PI / 4, -0.62, 0.72], [Math.PI / 4, 0.62, 0.72]].forEach(([ry, dx, dz]) => K.mesh(sign('萬年商業大樓', 1.34, 19, { vertical: true, kind: 'neon', font: WEI, bg: '#1d4a39', fg: '#ff4a3a', glow: 1.7, oneSide: true, ppm: 52 }), fx + dx, G + 15.6, 0.15 + dz, ry));
  K.mesh(paint(4.4, 2.4, (g, W, H) => { g.fillStyle = '#1d4a39'; g.fillRect(0, 0, W, H); g.fillStyle = '#16181c'; g.beginPath(); g.ellipse(W / 2, H / 2, W * 0.47, H * 0.44, 0, 0, 7); g.fill(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${H * 0.42}px ${KAI}`;
    [['年', 0.29], ['萬', 0.71]].forEach(([c, x]) => { g.strokeStyle = '#fff'; g.lineWidth = H * 0.035; g.beginPath(); g.arc(W * x, H / 2, H * 0.32, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.fillText(c, W * x, H * 0.52); }); }, { glow: 1.2, oneSide: true }), 1.2, top + 2.5, -0.3);   // the dark oval over the corner sign: 年 and 萬 in two white rings, read right to left (2020 Commons photo) lattice(K, -1.0, 3.4, top + 1.1, top + 3.7, -0.5, 2);
  return K.done();
}

// ══ 3. 電影街: a cinema front of 武昌街二段 (豪華戲院, with 日新 and 樂聲 named beside it as on the street) ═══════
function cinema() {
  const K = Kit('movie-street'), x0 = -5.25, x1 = 5.25, G = 4.4, H = 19, D = 12;
  K.bx(x0, x1, G, H, -D, -0.1, M.cream); K.bx(x0, x1, 0, G, -D, -3.0, M.dark); K.bx(x0, x0 + 0.5, 0, H + 1, -D, 0, M.ochre); K.bx(x1 - 0.5, x1, 0, H + 1, -D, 0, M.ochre);
  K.bx(x0, x1, H, H + 1, -0.5, 0, M.ochre); K.bx(x0 - 0.06, x1 + 0.06, H + 1, H + 1.15, -0.6, 0.1, M.concDk); for (let i = 0; i < 7; i++) K.bx(x0 + 0.5, x1 - 0.5, 5.6 + i * 1.9, 5.7 + i * 1.9, -0.1, -0.02, M.ochre);
  // the hand-painted billboard over the whole upper front, cloth banners either side
  K.bx(-3.75, 3.75, 6.3, 16.5, -0.1, 0.14, M.woodDk); K.mesh(paint(7.2, 9.0, filmPoster('畢業生', '本院獨家獻映', 0, { cols: 4, rows: 5, en: 'THE GRADUATE' }), { glow: 0.42, oneSide: true, ppm: 100, depth: 0.08 }), 0, 11.4, 0.18);   // 豪華 ran 《畢業生》 alone in 1973, queues for a month; a board is 20 panels of 6尺, four across and five up
  [[-4.25, '冷氣開放', '#b3271e', '#ffe14a'], [4.25, '獨家獻映', '#f3ecd9', '#b3271e']].forEach(([x, t, bg, fg]) => K.mesh(sign(t, 0.8, 6.4, { vertical: true, kind: 'cloth', font: WEI, bg, fg, glow: 0.7, depth: 0.03 }), x, 11.6, 0.12));
  K.mesh(sign('豪華大戲院', 6.4, 1.6, { kind: 'neon', bg: '#1a0d0b', fg: '#ffd24a', font: WEI, spread: true, glow: 1.5, oneSide: true }), 0, 17.6, 0.06);
  K.mesh(sign('豪華大戲院', 1.15, 7.5, { vertical: true, kind: 'neon', font: WEI, bg: '#151515', fg: '#ff5a48', glow: 1.7 }), x1 + 0.1, 11.4, 1.0, Math.PI / 2); [9.2, 13.6].forEach(y => K.bx(x1 + 0.07, x1 + 0.13, y, y + 0.06, 0, 0.45, M.frame));
  K.mesh(sign('日新大戲院', 0.8, 3.8, { vertical: true, kind: 'box', font: KAI, bg: '#f3ecd9', fg: '#b3271e', glow: 0.8 }), x0 - 0.1, 8.2, 0.75, Math.PI / 2); K.mesh(sign('樂聲大戲院', 0.8, 3.8, { vertical: true, kind: 'neon', font: WEI, bg: '#10182c', fg: '#7fd8ff', glow: 1.4 }), x0 - 0.1, 13, 0.75, Math.PI / 2);
  // the deep canopy over the pavement with its marquee and bulbs
  K.bx(x0, x1, G - 0.1, G + 0.5, 0, 2.5, M.ochre); K.bx(x0, x1, G + 0.5, G + 0.58, -0.1, 2.56, M.concDk); K.mesh(sign('本院獨家獻映　畢業生　　下期　真善美', 9.6, 0.5, { kind: 'box', font: SONG, weight: 900, bg: '#f3ecd9', fg: '#1a1a1a', glow: 0.9, oneSide: true }), 0, G + 0.2, 2.52);
  for (let x = x0 + 0.2; x < x1; x += 0.35) { K.bx(x - 0.04, x + 0.04, G - 0.18, G - 0.1, 2.36, 2.44, M.bulb); K.bx(x - 0.04, x + 0.04, G - 0.18, G - 0.1, 1.2, 1.28, M.bulb); }
  [x0 + 0.3, x1 - 0.3].forEach(x => K.cyl(0.11, 0.11, G - 0.1, M.redDk, x, (G - 0.1) / 2, 2.25, 10));
  // street level: the ticket windows, the doors, lit poster cases, the rope queue
  K.bx(-4.7, -1.9, 0, 3.0, -1.2, -0.2, M.redDk); K.bx(-4.7, -1.9, 3.0, 3.12, -1.3, -0.1, M.gold); [-3.95, -2.65].forEach(x => { K.bx(x - 0.42, x + 0.42, 1.1, 2.0, -0.2, -0.15, M.winLit); K.bx(x - 0.48, x + 0.48, 1.02, 1.1, -0.2, 0.02, M.gold); K.bx(x - 0.03, x + 0.03, 1.1, 2.0, -0.15, -0.12, M.frame); });
  K.mesh(sign('售票處', 1.9, 0.5, { kind: 'box', font: KAI, bg: '#ffe14a', fg: '#7a120c', spread: true, glow: 0.9, oneSide: true }), -3.3, 2.5, -0.14); K.mesh(sign('全票　半票　軍警票', 1.9, 0.26, { bg: '#f3ecd9', fg: '#1a1a1a', glow: 0.6, oneSide: true, border: false }), -3.3, 0.8, -0.14);
  [-0.55, 1.1].forEach(x => { K.bx(x - 0.75, x + 0.75, 0, 2.6, -2.2, -2.1, M.red); K.bx(x - 0.03, x + 0.03, 0, 2.6, -2.1, -2.06, M.gold); [-0.38, 0.38].forEach(d => { K.cyl(0.2, 0.2, 0.05, M.winLit, x + d, 1.7, -2.08, 12, [Math.PI / 2, 0, 0]); K.bx(x + d * 0.2 - 0.02, x + d * 0.2 + 0.02, 0.9, 1.3, -2.08, -2.0, M.gold); }); });
  K.bx(-1.5, 2.1, 2.6, 3.0, -2.2, -2.05, M.gold); K.bx(-1.9, 4.7, 0.05, 3.6, -2.98, -2.94, M.shopLit);
  [['真善美', 2.9, 120], ['回到未來', 4.05, 220]].forEach(([t, x, hue]) => { K.bx(x - 0.52, x + 0.52, 0.55, 2.35, -0.4, -0.2, M.woodDk); K.mesh(paint(0.9, 1.6, filmPoster(t, '下期上映', hue), { glow: 0.75, oneSide: true, ppm: 160, depth: 0.04 }), x, 1.45, -0.18); });
  for (let i = 0; i < 4; i++) { const x = -4.4 + i * 0.95; K.cyl(0.035, 0.035, 0.95, M.gold, x, 0.475, 1.3, 8); K.cyl(0.14, 0.16, 0.04, M.gold, x, 0.02, 1.3, 10); K.sph(0.06, M.gold, x, 0.98, 1.3); if (i) K.box(0.95, 0.04, 0.04, M.redDk, x - 0.475, 0.82, 1.3, 0, 0, 0); }
  person(K, -3.9, 0.6, Math.PI, {}); person(K, -3.2, 1.0, Math.PI + 0.2, {}); person(K, -2.6, 0.7, Math.PI - 0.3, {}); person(K, 3.4, 0.5, Math.PI + 0.1, { reach: true });
  K.cyl(1.0, 1.0, 2.6, M.steel, 0, H + 2.3, -7, 14);
  return K.done();
}

// ══ 4. 台北天后宮: the narrow gate squeezed between shops on 成都路 ═══════════════════════════════════════
function tianhou() {
  const K = Kit('tianhou-temple'), w = 6, x0 = -3, x1 = 3;
  K.bx(x0, x1, 0, 10.5, -10, -1.6, M.pink); facade(K, { x0, x1, y0: 7.0, floors: 1, fh: 3.2, bays: 3, wall: M.pink, pier: 0.5, lit: 0.3 }); K.bx(x0, x1, 10.2, 10.9, -0.3, 0.05, M.pink);
  K.bx(x0, x0 + 0.45, 0, 7, -1.6, 0, M.pink); K.bx(x1 - 0.45, x1, 0, 7, -1.6, 0, M.pink);
  // a glimpse of the courtyard and the main hall through the gate
  K.mesh(paint(4.6, 3.9, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1410'); gr.addColorStop(1, '#6a3a20'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c8612c'; g.beginPath(); g.moveTo(W * 0.05, H * 0.3); g.quadraticCurveTo(W * 0.5, H * 0.16, W * 0.95, H * 0.3); g.lineTo(W * 0.88, H * 0.4); g.lineTo(W * 0.12, H * 0.4); g.fill();
    g.fillStyle = '#8a1a12'; [0.18, 0.4, 0.6, 0.82].forEach(x => g.fillRect(W * x - W * 0.02, H * 0.4, W * 0.04, H * 0.5)); g.fillStyle = '#ffd98a'; g.fillRect(W * 0.3, H * 0.52, W * 0.4, H * 0.3);
    g.fillStyle = '#d9a53a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.62, W * 0.07, H * 0.11, 0, 0, 7); g.fill(); g.fillStyle = '#b3271e'; g.fillRect(W * 0.43, H * 0.68, W * 0.14, H * 0.14);
    for (let i = 0; i < 7; i++) { g.fillStyle = '#ff5a30'; g.beginPath(); g.arc(W * (0.14 + i * 0.12), H * 0.46, W * 0.025, 0, 7); g.fill(); }
    g.fillStyle = '#3a2a20'; g.fillRect(0, H * 0.9, W, H * 0.1); }, { glow: 0.7, oneSide: true }), 0, 2.0, -1.55);
  // the gate: four red columns on stone bases, painted beams, the gold-on-black plaque
  [-2.45, -1.15, 1.15, 2.45].forEach(x => { K.cyl(0.2, 0.2, 4.3, M.red, x, 2.45, 0.2, 12); K.cyl(0.26, 0.3, 0.32, M.stone, x, 0.16, 0.2, 12); K.bx(x - 0.26, x + 0.26, 4.5, 4.7, -0.06, 0.46, M.gold); });
  K.bx(-2.75, 2.75, 3.95, 4.3, 0.05, 0.35, M.tileGreen); K.bx(-2.75, 2.75, 4.3, 4.42, 0.02, 0.38, M.gold); K.bx(-2.75, 2.75, 4.7, 5.0, 0, 0.4, M.redDk); K.bx(-1.3, 1.3, 5.0, 5.9, 0.02, 0.38, M.redDk);
  for (let i = 0; i < 9; i++) K.bx(-2.6 + i * 0.62, -2.6 + i * 0.62 + 0.3, 4.02, 4.24, 0.35, 0.37, i % 2 ? M.gold : M.blue);
  K.mesh(sign('台北天后宮', 2.4, 0.72, { bg: '#8f3a2c', fg: '#ffffff', font: KAI, spread: true, border: false, glow: 0.7, oneSide: true }), 0, 5.42, 0.42);
  [-1.15, 1.15].forEach(x => K.mesh(sign('台北天后宮', 0.34, 2.3, { vertical: true, kind: 'box', font: KAI, bg: '#f2c832', fg: '#b3221a', glow: 0.7, oneSide: true, depth: 0.05 }), x, 2.6, 0.42));   // the two yellow uprights with the name in red, one each side (2025 Commons photo)
  // swallow-tail roofs: a high one over the middle bay, a lower one each side
  const roof = (cx, rw, yE, rise, up) => { const zF = 1.25, zB = -1.5, zm = -0.1, a = Math.atan2(rise, zF - zm), L = Math.hypot(rise, zF - zm), b = Math.atan2(rise, zm - zB), Lb = Math.hypot(rise, zm - zB);
    K.box(rw, 0.14, L, M.tile, cx, yE + rise / 2, (zF + zm) / 2, 0, a); K.box(rw, 0.14, Lb, M.tile, cx, yE + rise / 2, (zB + zm) / 2, 0, -b);
    for (let x = cx - rw / 2 + 0.16; x < cx + rw / 2; x += 0.3) K.cyl(0.055, 0.055, L, M.tile, x, yE + rise / 2 + 0.09, (zF + zm) / 2, 6, [a + Math.PI / 2, 0, 0]);
    K.box(rw, 0.12, 0.08, M.tileGreen, cx, yE - 0.02, zF + 0.02); for (let x = cx - rw / 2 + 0.16; x < cx + rw / 2; x += 0.3) K.cyl(0.07, 0.07, 0.05, M.tileGreen, x, yE + 0.04, zF + 0.05, 8, [Math.PI / 2, 0, 0]);
    const n = 6, hw = rw / 2 + 0.25, yR = yE + rise + 0.16; let px = -hw, py = yR + up;
    for (let i = -n + 1; i <= n; i++) { const t = i / n, x = t * hw, y = yR + up * Math.pow(Math.abs(t), 2.4), dx = x - px, dy = y - py; K.box(Math.hypot(dx, dy) + 0.04, 0.26, 0.26, M.red, cx + (x + px) / 2, (y + py) / 2, zm, 0, 0, Math.atan2(dy, dx)); K.box(Math.hypot(dx, dy) + 0.04, 0.06, 0.3, M.tileGreen, cx + (x + px) / 2, (y + py) / 2 + 0.16, zm, 0, 0, Math.atan2(dy, dx)); px = x; py = y; }
    [-1, 1].forEach(k => { K.box(0.9, 0.09, 0.12, M.tileGreen, cx + k * (hw + 0.33), yR + up + 0.34, zm, 0, 0, k * 0.85); });                                 // the swallow tails
    for (let i = -2; i <= 2; i++) if (i) K.sph(0.13, pick([M.tileGreen, M.blue, M.gold]), cx + i * rw * 0.16, yR + up * Math.pow(Math.abs(i) * 0.32, 2.4) + 0.3, zm);
    K.sph(0.17, M.gold, cx, yR + 0.42, zm); K.cyl(0.03, 0.09, 0.3, M.gold, cx, yR + 0.2, zm, 8); };
  roof(0, 3.0, 5.95, 0.95, 0.75); roof(-2.15, 1.9, 5.0, 0.75, 0.5); roof(2.15, 1.9, 5.0, 0.75, 0.5);
  [-1.8, -0.6, 0.6, 1.8].forEach(x => lantern(K, x, 3.3, 0.75)); lantern(K, 0, 3.55, 0.95, 0.3);
  [-2.75, 2.75].forEach(x => { K.bx(x - 0.3, x + 0.3, 0, 0.55, 0.75, 1.35, M.stone); K.box(0.36, 0.5, 0.5, M.stone, x, 0.8, 1.05, 0, -0.25); K.sph(0.2, M.stone, x, 1.2, 1.2); K.sph(0.09, M.stone, x - 0.0, 1.05, 1.36); });     // the stone lions, as blocks
  K.cyl(0.42, 0.3, 0.5, M.gold, 0, 0.95, -0.7, 12); K.cyl(0.46, 0.46, 0.06, M.gold, 0, 1.22, -0.7, 12); [0, 2.1, 4.2].forEach(a => K.cyl(0.05, 0.04, 0.7, M.gold, Math.sin(a) * 0.28, 0.35, -0.7 + Math.cos(a) * 0.28, 6));
  [-0.42, 0.42].forEach(x => K.cyl(0.035, 0.035, 0.4, M.gold, x, 1.3, -0.7, 6));
  return K.done();
}

// ══ 5. 成都楊桃冰: white and green, the amber jars on an open counter ═════════════════════════════════════
function starfruit() {
  const K = Kit('chengdu-starfruit'), w = 4.5, S = shophouse(K, w, 2, M.white, { ground: 3.5, bays: 2, depth: 9 }), x0 = S.x0, x1 = S.x1;
  K.bx(x0, x1, 3.5, 3.62, -0.05, 0.1, M.tileGreen); K.mesh(sign('成都楊桃冰', 4.1, 0.95, { kind: 'box', font: XING, bg: '#f6f3ea', fg: '#0f5a34', sub: '創於1966年', subFont: KAI, subFg: '#b3221a', glow: 0.7, oneSide: true }), 0, 2.95, 0.1);
  K.mesh(paint(4.3, 1.5, stripes('#f6f3ea', '#2f8a5a', 12), { glow: 0.3, depth: 0.04, ppm: 60 }), 0, 2.35, 0.8).rotation.x = -Math.PI / 2 + 0.28;
  K.bx(x0 + 0.3, x1 - 0.3, 0.3, 3.0, -2.58, -2.54, M.shopLit);
  K.mesh(paint(1.5, 1.1, (g, W, H) => { g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2f8a5a'; g.lineWidth = 4; g.strokeRect(4, 4, W - 8, H - 8);
    [0.2, 0.5, 0.8].forEach((x, i) => { g.fillStyle = ['#d9c23a', '#d98a1e', '#cfe3e0'][i]; g.beginPath(); if (i === 0) { for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, r = W * (k % 2 ? 0.05 : 0.11); g.lineTo(W * x + Math.sin(a) * r, H * 0.42 - Math.cos(a) * r); } } else g.rect(W * x - W * 0.07, H * 0.25, W * 0.14, H * 0.36); g.fill(); g.stroke(); if (i < 2) { g.fillStyle = '#2f8a5a'; g.font = `800 ${H * 0.2}px ${FONT}`; g.textAlign = 'center'; g.fillText('→', W * (x + 0.15), H * 0.5); } });
    g.fillStyle = '#2f8a5a'; g.font = `800 ${H * 0.15}px ${KAI}`; g.textAlign = 'center'; g.fillText('楊桃冰　鳳梨冰　綜合冰', W / 2, H * 0.86); }, { glow: 0.6, oneSide: true }), -1.2, 1.9, -2.5);
  // the counter stand: jars of amber juice, stacked cups, a ladle
  K.bx(-1.9, 1.5, 0, 0.95, 0.15, 0.95, M.white); K.bx(-1.9, 1.5, 0.3, 0.42, 0.95, 0.97, M.tileGreen); K.bx(-1.95, 1.55, 0.95, 1.0, 0.1, 1.0, M.steel);
  [-1.5, -0.85, -0.2, 0.45].forEach(x => jar(K, x, 1.0, 0.5, 0.26, 0.62, M.amber, M.tileGreen)); for (let i = 0; i < 3; i++) for (let k = 0; k < 3 - i; k++) K.cyl(0.05, 0.04, 0.11, M.whiteP, 0.95 + k * 0.12 + i * 0.06, 1.055 + i * 0.11, 0.6, 8);
  K.cyl(0.05, 0.04, 0.11, M.amber, 1.25, 1.055, 0.3, 8); person(K, -0.5, -0.4, 0, { apron: true, shirt: SHIRT[1] }); person(K, 0.9, 1.6, Math.PI, { bowl: true });
  K.mesh(sign('楊桃湯', 0.42, 1.05, { vertical: true, bg: '#1f7a4a', fg: '#fff3d6', glow: 0.6 }), 1.95, 0.6, 1.1, 0.25); K.mesh(sign('鳳梨冰', 0.5, 1.5, { vertical: true, kind: 'box', font: KAI, bg: '#f6f3ea', fg: '#1f7a4a', glow: 0.7 }), x1 - 0.05, 5.6, 0.75, Math.PI / 2);
  return K.done();
}

// ══ 6. 蜂大咖啡, with 南美咖啡 next door: an arcade shopfront and its row of biscuit jars ═════════════════
function fongda() {
  const K = Kit('fong-da'), x0 = -3.5, x1 = 3.5, G = 3.7, mid = 0.5;
  const top = facade(K, { x0, x1, y0: G, floors: 3, fh: 3.1, bays: 4, wall: M.cream, depth: 10, pier: 0.42, ac: 0.4, grille: 0.45, lit: 0.2 });
  K.bx(x0, x1, top, top + 0.8, -0.3, 0.05, M.cream); K.bx(x0, x1, top, top + 0.15, -10, -0.3, M.concDk); waterTank(K, 1.5, top + 0.15, -4);
  K.bx(x0, x1, 0, G, -10, -3.0, M.dark); [x0, mid - 0.22, x1 - 0.45].forEach(x => K.bx(x, x + 0.45, 0, G, -0.45, 0, M.stone)); K.bx(x0, x1, 3.0, G, -0.45, 0, M.cream); K.bx(mid - 0.08, mid + 0.08, 0, 3.0, -3, -0.45, M.concDk);
  [x0, x1 - 0.2].forEach(x => K.bx(x, x + 0.2, 0, G, -3, -0.45, M.concDk)); K.bx(x0, x1, 2.95, 3.0, -3, -0.45, M.concLt); [-1.5, 2.0].forEach(x => K.bx(x - 0.6, x + 0.6, 2.88, 2.94, -1.6, -1.5, M.tube));
  K.mesh(sign('蜂大咖啡', 3.5, 0.82, { kind: 'box', font: FONT, weight: 900, bg: '#f4f1e8', fg: '#141414', sub: '創立於西元1956年　咖啡器材專業經營', glow: 0.8, oneSide: true }), -1.5, 3.36, 0.06); K.mesh(sign('南美咖啡', 2.6, 0.82, { font: XING, bg: '#4a1f1a', fg: '#f3e6c8', border: false, glow: 0.7, oneSide: true }), 2.0, 3.36, 0.06);
  K.mesh(sign('蜂大咖啡', 0.5, 2.6, { vertical: true, kind: 'box', font: FONT, weight: 900, bg: '#f4f1e8', fg: '#141414', glow: 0.9 }), x0 + 0.5, 6.2, 0.85, Math.PI / 2); K.mesh(sign('南美咖啡', 0.5, 2.2, { vertical: true, font: XING, bg: '#4a1f1a', fg: '#f3e6c8', border: false, glow: 0.6 }), x1 - 0.4, 5.6, 0.75, Math.PI / 2);
  // 蜂大: the counter at the door with big glass jars of biscuits, the shelves and bean bins behind, the roaster deep inside
  K.bx(x0 + 0.5, mid - 0.4, 0, 0.95, -1.15, -0.5, M.woodDk); K.bx(x0 + 0.45, mid - 0.35, 0.95, 1.0, -1.2, -0.45, M.wood); for (let i = 0; i < 7; i++) jar(K, x0 + 0.78 + i * 0.42, 1.0, -0.82, 0.17, 0.46, M.biscuit, M.red);
  K.bx(x0 + 0.3, mid - 0.2, 0.2, 2.8, -2.98, -2.94, M.shopLit); for (let s = 0; s < 4; s++) { const y = 0.9 + s * 0.48; K.bx(x0 + 0.3, mid - 0.2, y, y + 0.04, -2.9, -2.55, M.woodDk); for (let k = 0; k < 9; k++) { const gx = x0 + 0.4 + k * 0.38; if (rnd() < 0.85) K.cyl(0.11, 0.11, rr(0.2, 0.36), pick([M.biscuit, M.woodDk, M.red, M.jar]), gx, y + 0.2, -2.72, 8); } }
  K.cyl(0.42, 0.42, 0.9, M.black, -0.4, 1.4, -2.3, 12, [0, 0, Math.PI / 2]); K.cyl(0.09, 0.09, 1.6, M.steelDk, -0.4, 2.2, -2.4, 8); K.bx(-0.9, 0.1, 0, 0.95, -2.7, -1.9, M.steelDk); K.cyl(0.2, 0.05, 0.35, M.gold, -0.9, 2.05, -2.3, 10);    // the roaster: drum, flue, hopper
  for (let i = 0; i < 3; i++) { const bx = x0 + 0.6 + i * 0.55; K.bx(bx, bx + 0.45, 0, 0.6, -2.4, -1.9, M.wood); K.bx(bx + 0.04, bx + 0.41, 0.6, 0.66, -2.36, -1.94, std('#2a1a10', 0.9)); }
  person(K, -2.2, -1.6, 0.1, { apron: true }); person(K, -1.2, 0.5, Math.PI + 0.3, {});
  // 南美: a glazed front, a counter with siphon brewers
  K.bx(mid + 0.3, x1 - 0.6, 0, 0.9, -0.75, -0.6, M.woodDk); K.bx(mid + 0.3, x1 - 1.6, 0.9, 2.9, -0.7, -0.66, M.pane); K.bx(mid + 0.3, x1 - 0.5, 0.2, 2.8, -2.98, -2.94, M.shopLit);
  K.bx(mid + 0.4, x1 - 0.7, 0, 0.95, -2.2, -1.7, M.wood); for (let i = 0; i < 4; i++) { const sx = mid + 0.7 + i * 0.5; K.sph(0.09, M.jar, sx, 1.1, -1.95); K.cyl(0.07, 0.07, 0.16, M.jar, sx, 1.3, -1.95, 8); K.cyl(0.012, 0.012, 0.3, M.gold, sx + 0.12, 1.1, -1.95, 5); }
  return K.done();
}

// ══ 7. 阿宗麵線: no seats, steel pots at the front, people eating on their feet ═══════════════════════════
function aychung() {
  const K = Kit('ay-chung'), w = 6, S = shophouse(K, w, 3, M.ochre, { ground: 3.8, bays: 3, depth: 9 }), x0 = S.x0, x1 = S.x1;
  K.mesh(paint(5.6, 1.25, (g, W, H) => { g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d9a53a'; g.lineWidth = H * 0.035; for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x <= W; x += 6) g.lineTo(x, H * (0.84 + k * 0.045) + Math.sin(x / W * 30 + k) * H * 0.02); g.stroke(); }   // white fascia, the name in red brush characters, gold noodle waves along the bottom (2020 Commons photo)
    g.fillStyle = '#c21f1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${H * 0.62}px ${XING}`; [...'阿宗麵線'].forEach((c, i) => g.fillText(c, W * (0.17 + i * 0.22), H * 0.42)); g.strokeStyle = '#2b2b30'; g.lineWidth = H * 0.05; g.strokeRect(0, 0, W, H); }, { glow: 0.4, oneSide: true, light: true }), 0, 3.1, 0.1);
  K.mesh(sign('阿宗麵線', 0.7, 3.0, { vertical: true, kind: 'box', font: XING, bg: '#f6f3ea', fg: '#c21f1a', glow: 1.0 }), x0 + 0.4, 6.4, 0.9, Math.PI / 2);
  K.bx(x0 + 0.3, x1 - 0.3, 0.2, 3.3, -2.58, -2.54, M.shopLit); [-1.5, 1.5].forEach(x => K.bx(x - 0.7, x + 0.7, 3.38, 3.44, -1.2, -1.1, M.tube));
  K.mesh(sign('大碗麵線　小碗麵線', 2.6, 0.4, { bg: '#f3ecd9', fg: '#b3271e', glow: 0.7, oneSide: true, border: false }), -1.2, 2.2, -2.5);
  // the serving counter and its two big pots
  K.bx(-2.6, 0.6, 0, 0.9, 0.1, 0.95, M.steel); K.bx(-2.65, 0.65, 0.9, 0.95, 0.05, 1.0, M.steel); K.bx(-2.6, 0.6, 0.35, 0.5, 0.95, 0.97, M.red);
  const pots = [[-1.9, 0.5], [-0.8, 0.5]]; pots.forEach(([x, z]) => { K.cyl(0.4, 0.37, 0.55, M.steel, x, 1.22, z, 16); K.cyl(0.36, 0.36, 0.02, std('#8a5a30', 0.6), x, 1.49, z, 16); [-1, 1].forEach(k => K.bx(x + k * 0.4 - 0.04, x + k * 0.4 + 0.04, 1.36, 1.42, z - 0.08, z + 0.08, M.steelDk)); });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) K.cyl(0.085, 0.055, 0.045, M.whiteP, 0.05 + (i % 2) * 0.2, 0.97 + k * 0.045, 0.3 + Math.floor(i / 2) * 0.22, 10);
  // the self-serve sauce station: chilli, garlic, vinegar
  K.bx(1.3, 2.5, 0, 0.85, 0.2, 0.75, M.steel); [[1.55, '#b3271e'], [1.9, '#e8e2c8'], [2.25, '#2a1a12']].forEach(([x, c]) => { K.cyl(0.11, 0.1, 0.16, M.steel, x, 0.93, 0.48, 10); K.cyl(0.095, 0.095, 0.02, std(c, 0.5), x, 1.0, 0.48, 10); });
  K.mesh(sign('辣椒 蒜泥 烏醋', 1.1, 0.2, { bg: '#f3ecd9', fg: '#1a1a1a', glow: 0.5, oneSide: true, border: false }), 1.9, 0.6, 0.77);
  person(K, -1.9, -0.3, 0, { apron: true, reach: true, shirt: SHIRT[0] }); person(K, -0.6, -0.4, 0.1, { apron: true, shirt: SHIRT[0] });
  [[-2.4, 1.7, 2.6], [-1.5, 2.2, 3.4], [-0.5, 1.75, 2.9], [0.4, 2.25, -2.8], [1.2, 1.5, 3.3], [2.2, 2.1, -2.6], [2.6, 1.3, 3.6]].forEach(([x, z, ry]) => person(K, x, z, ry, { bowl: true }));
  const g = K.done(); g.userData.pots = pots; return g;
}

// ══ 8. 獅子林商業大樓: ten storeys, film posters for the cinemas upstairs, escalators seen through the door ═
function lions() {
  const K = Kit('lions-plaza'), x0 = -6.5, x1 = 6.5, G = 4.6, P = 4, D = 12;
  K.bx(x0, x1, G, G + P * 3.2, -D, -0.05, M.tan); for (let i = 0; i <= 13; i++) K.bx(x0 + i - 0.06, x0 + i + 0.06, G, G + P * 3.2, -0.05, 0.05, M.tanDk);
  const top = facade(K, { x0, x1, y0: G + P * 3.2, floors: 5, fh: 3.2, bays: 8, wall: M.tan, band: M.tanDk, depth: D, pier: 0.34, sill: 1.0, lit: 0.2 });
  K.bx(x0, x1, top, top + 1.0, -0.4, 0, M.tan); K.bx(x0, x1, top, top + 0.2, -D, -0.4, M.concDk); waterTank(K, -3, top + 0.2, -6); K.bx(1, 5, top + 0.2, top + 3, -8, -4, M.tanDk);
  [['好小子', -4.1, 40], ['大頭兵', 0, 150], ['七匹狼', 4.1, 260]].forEach(([t, x, hue]) => { K.bx(x - 1.85, x + 1.85, G + 4.5, G + 11.3, -0.05, 0.1, M.woodDk); K.mesh(paint(3.5, 6.5, filmPoster(t, '樓上戲院上映', hue), { glow: 0.42, oneSide: true, ppm: 110, depth: 0.06 }), x, G + 7.9, 0.13); });
  K.mesh(sign('獅子林商業大樓', 10.5, 1.7, { bg: '#8f6f4e', fg: '#d9261c', font: WEI, spread: true, border: false, glow: 0.8, oneSide: true }), 0, G + 2.2, 0.12);
  K.mesh(sign('獅子林', 1.3, 9, { vertical: true, kind: 'neon', font: WEI, bg: '#151515', fg: '#ffb23a', glow: 1.6 }), x1 + 0.1, top - 6, 1.0, Math.PI / 2);
  // street level: a wide mouth, two escalators rising inside a lit lobby
  K.bx(x0, x1, 0, G, -D, -5.5, M.dark); [x0, x1 - 0.7].forEach(x => K.bx(x, x + 0.7, 0, G, -5.5, 0, M.tanDk)); [-3.6, 3.0].forEach(x => K.bx(x, x + 0.6, 0, G, -0.6, 0, M.tanDk)); K.bx(x0, x1, G - 0.7, G, -0.6, 0, M.tanDk);
  K.bx(x0, x1, G - 0.25, G + 0.1, 0, 1.6, M.tanDk); K.mesh(sign('十樓　金獅大酒樓', 6, 0.42, { kind: 'box', font: KAI, bg: '#f3ecd9', fg: '#a3221a', glow: 0.8, oneSide: true }), 0, G - 0.36, 1.62);
  K.bx(-3.0, 3.0, 0.05, G - 0.7, -5.48, -5.44, M.shopLit); K.bx(-3.0, 3.0, G - 0.78, G - 0.72, -3, -2.9, M.tube);
  [-1.3, 1.3].forEach(x => { K.box(1.0, 0.25, 5.4, M.steelDk, x, 1.6, -3.0, 0, 0.6); [-0.5, 0.5].forEach(d => { K.box(0.08, 0.7, 5.6, M.jar, x + d, 2.1, -3.0, 0, 0.6); K.box(0.1, 0.06, 5.7, M.black, x + d, 2.46, -3.0, 0, 0.6); }); for (let i = 0; i < 12; i++) K.box(0.84, 0.03, 0.2, M.steel, x, 0.3 + i * 0.27, -1.1 - i * 0.39); });
  [[-5.1, '#b3271e'], [4.9, '#1f3a6e']].forEach(([x, c]) => { K.bx(x - 1.1, x + 1.1, 0.6, 3.4, -0.5, -0.45, M.pane); K.bx(x - 1.05, x + 1.05, 0.6, 3.4, -1.6, -1.56, M.shopLit); K.bx(x - 1.1, x + 1.1, 0, 0.6, -0.6, -0.1, std(c, 0.6)); for (let k = 0; k < 3; k++) person(K, x - 0.7 + k * 0.7, -1.0, 0, { h: 1 }); });
  // the portrait artists on the pavement outside, with easels and stools
  [[-2.6, 3.4, 0.5], [3.9, 3.9, -0.6]].forEach(([x, z, ry]) => { person(K, x, z, ry, { sit: true }); person(K, x + Math.sin(ry) * 1.5, z + Math.cos(ry) * 1.5, ry + Math.PI, { sit: true });
    K.at(x + Math.sin(ry) * 0.7, 0, z + Math.cos(ry) * 0.7, ry); [-0.28, 0.28].forEach(d => K.box(0.04, 1.6, 0.04, M.wood, d, 0.78, 0, 0, 0.12)); K.box(0.04, 1.6, 0.04, M.wood, 0, 0.78, 0.35, 0, -0.3); K.box(0.62, 0.8, 0.03, M.whiteP, 0, 1.2, -0.06, 0, 0.12); K.box(0.3, 0.38, 0.01, M.skin, 0, 1.22, -0.08, 0, 0.12); K.at(); });
  return K.done();
}

// ══ 9. 來來百貨: eight storeys of department store, the name high on the front, sale banners down it ═════
function lailai() {
  const K = Kit('lai-lai'), x0 = -6.5, x1 = 6.5, G = 4.6, fh = 3.4, D = 12, top = G + 7 * fh;
  K.bx(x0, x1, G, top, -D, -0.3, M.white); for (let i = 0; i <= 26; i++) { const x = x0 + i * 0.5; K.bx(Math.max(x0, x - 0.09), Math.min(x1, x + 0.09), G + fh, top, -0.3, 0, M.concLt); }
  for (let f = 1; f < 7; f++) { K.bx(x0, x1, G + f * fh - 0.25, G + f * fh + 0.25, -0.3, 0.04, M.white); for (let i = 0; i < 26; i++) if (i % 2) K.bx(x0 + i * 0.5 + 0.09, x0 + i * 0.5 + 0.41, G + f * fh + 0.9, G + (f + 1) * fh - 0.7, -0.28, -0.24, rnd() < 0.25 ? M.winLit : M.glass); }
  K.bx(x0, x1, top, top + 1.2, -0.4, 0.04, M.white); K.bx(x0, x1, top, top + 0.2, -D, -0.4, M.concDk); K.bx(x0, x1, G, G + fh, -0.3, 0.06, M.blue); waterTank(K, 3, top + 0.2, -7);
  K.mesh(sign('來來', 9, 2.5, { font: YUAN, weight: 700, bg: '#16306e', fg: '#ffffff', sub: 'LAI LAI', border: false, glow: 0.55, oneSide: true }), 0, top - 2.2, 0.1);
  K.mesh(sign('來來百貨', 11.5, 1.5, { font: YUAN, weight: 700, bg: '#16306e', fg: '#ffffff', spread: true, glow: 0.9, oneSide: true, border: false }), 0, G + fh / 2 + 0.3, 0.1);
  K.mesh(sign('來來', 1.0, 2.0, { vertical: true, kind: 'box', bg: '#16306e', fg: '#ffffff', glow: 1.1 }), x0 - 0.1, G + 3.2, 0.8, Math.PI / 2);   // the small projecting sign at the corner, second floor (opening-day press photo)
  // the framed poster under the name: a woman's face and OPEN, as in the opening-day press photo (which is black and white; the colours are a guess). The sale banners that hung here before had no source and are gone.
  K.bx(-2.75, 2.75, G + fh + 3.3, G + fh + 11.5, -0.02, 0.1, M.frame); K.mesh(paint(5.2, 7.9, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#e9d9b8'); gr.addColorStop(1, '#d99a6a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a1a14'; g.beginPath(); g.ellipse(W * 0.5, H * 0.36, W * 0.36, H * 0.27, 0, 0, 7); g.fill(); g.fillRect(W * 0.14, H * 0.36, W * 0.72, H * 0.34);                                                       // hair
    g.fillStyle = '#eec3a0'; g.beginPath(); g.ellipse(W * 0.5, H * 0.4, W * 0.23, H * 0.2, 0, 0, 7); g.fill(); g.fillRect(W * 0.42, H * 0.55, W * 0.16, H * 0.12); g.fillStyle = 'rgba(170,90,60,.3)'; g.beginPath(); g.ellipse(W * 0.6, H * 0.42, W * 0.12, H * 0.17, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1a14'; g.beginPath(); g.ellipse(W * 0.5, H * 0.27, W * 0.25, H * 0.09, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#2a1a14'; g.lineCap = 'round'; g.lineWidth = W * 0.014; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(W * (0.5 + k * 0.14), H * 0.385); g.quadraticCurveTo(W * (0.5 + k * 0.09), H * 0.37, W * (0.5 + k * 0.045), H * 0.385); g.stroke(); });
    g.fillStyle = '#b3271e'; g.beginPath(); g.ellipse(W * 0.5, H * 0.5, W * 0.06, H * 0.013, 0, 0, 7); g.fill(); g.fillStyle = '#16306e'; g.beginPath(); g.ellipse(W * 0.5, H * 0.78, W * 0.42, H * 0.13, 0, Math.PI, 0); g.fill(); g.fillRect(0, H * 0.78, W, H * 0.22);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${H * 0.13}px Georgia, "Times New Roman", serif`; [...'OPEN'].forEach((c, i) => g.fillText(c, W * (0.2 + i * 0.2), H * 0.89)); }, { glow: 0.4, oneSide: true, depth: 0.04 }), 0, G + fh + 7.4, 0.14);
  // street level: display windows with mannequins, glass doors under a canopy
  K.bx(x0, x1, 0, G, -D, -2.6, M.dark); [x0, -2.2, 1.7, x1 - 0.5].forEach(x => K.bx(x, x + 0.5, 0, G, -2.6, 0, M.white)); K.bx(x0, x1, G - 0.6, G, -2.6, 0, M.white); K.bx(-2.6, 2.6, 3.5, 3.8, 0, 1.9, M.blue);
  K.bx(-1.7, 1.7, 0, 3.4, -0.5, -0.45, M.glassBlue); [-1.7, -0.85, 0, 0.85, 1.67].forEach(x => K.bx(x - 0.03, x + 0.03, 0, 3.4, -0.45, -0.4, M.steel)); K.bx(-1.6, 1.6, 0.1, 3.3, -2.58, -2.54, M.shopLit);
  [[-6.0, -2.2], [2.2, 6.0]].forEach(([a, b]) => { K.bx(a, b, 0.5, 3.6, -0.45, -0.4, M.pane); K.bx(a, b, 0, 0.5, -0.6, -0.1, M.concLt); K.bx(a, b, 0.5, 3.6, -2.2, -2.16, M.shopLit); for (let k = 0; k < 4; k++) { K.at(0, 0.5, 0, 0); person(K, a + 0.5 + k * (b - a - 1) / 3, -1.2, rr(-0.4, 0.4), { shirt: pick(CLOTH), pants: pick(CLOTH) }); } K.at(); });
  K.mesh(sign('OPEN', 3.2, 0.5, { bg: '#2a2622', fg: '#f3ecd9', font: 'Georgia, "Times New Roman", serif', weight: 700, spread: true, border: false, glow: 0.8, oneSide: true }), 0, 3.65, 1.92);
  return K.done();
}

// ══ 10. 捷運西門站6號出口: the canopy, the stair and escalator going down, the lift, the pylon ═════════════
function mrt() {
  const K = Kit('pedestrian-zone-exit6'), hw = 1.9, z0 = -4.4, z1 = 2.6;
  [-hw, hw - 0.25].forEach(x => K.bx(x, x + 0.25, 0, 1.05, z0, z1, M.stone)); K.bx(-hw, hw, 0, 1.05, z0, z0 + 0.25, M.stone); [-hw, hw - 0.25].forEach(x => K.bx(x - 0.03, x + 0.28, 1.05, 1.12, z0, z1, M.concDk));
  K.bx(-hw + 0.25, hw - 0.25, 0.0, 0.03, z0 + 0.25, z1, M.black);
  for (let i = 0; i < 12; i++) { const z = z1 - 0.3 - i * 0.5, c = 0.5 - i * 0.04; K.bx(-hw + 0.3, -0.15, 0.03, 0.045, z - 0.42, z, std(new T.Color(c, c, c * 0.95).getStyle(), 0.8)); }        // the stair, fading into the dark as it drops
  K.box(0.9, 0.05, 6.2, M.steelDk, 0.9, -0.55, -0.9, 0, -0.22); [0.38, 1.42].forEach(x => { K.box(0.07, 0.75, 6.4, M.jar, x, -0.1, -0.9, 0, -0.22); K.box(0.1, 0.07, 6.5, M.black, x, 0.3, -0.9, 0, -0.22); });   // the escalator, sinking below the paving
  K.box(0.05, 0.05, 6.3, M.steel, -hw + 0.4, 0.2, -0.9, 0, -0.22); K.box(0.05, 0.05, 6.3, M.steel, -0.12, 0.2, -0.9, 0, -0.22);
  // the canopy: steel posts, a glass roof that tips up toward the street
  [[-hw + 0.12, z0 + 0.2], [hw - 0.12, z0 + 0.2], [-hw + 0.12, -0.9], [hw - 0.12, -0.9], [-hw + 0.12, z1 - 0.1], [hw - 0.12, z1 - 0.1]].forEach(([x, z]) => K.cyl(0.07, 0.07, 3.4 + (z - z0) * 0.08, M.steel, x, (3.4 + (z - z0) * 0.08) / 2, z, 10));
  K.box(2 * hw + 0.7, 0.05, z1 - z0 + 1.0, M.canopy, 0, 3.72, (z0 + z1) / 2, 0, -0.08); [-hw - 0.3, 0, hw + 0.3].forEach(x => K.box(0.09, 0.12, z1 - z0 + 1.0, M.steel, x, 3.62, (z0 + z1) / 2, 0, -0.08));
  for (let i = 0; i < 6; i++) { const z = z0 - 0.3 + i * 1.55; K.bx(-hw - 0.3, hw + 0.3, 3.4 + (z - z0) * 0.08 + 0.05, 3.4 + (z - z0) * 0.08 + 0.13, z - 0.04, z + 0.04, M.steel); }
  K.mesh(sign('西門 Ximen', 3.6, 0.62, { font: FONT, bg: '#0a59a4', fg: '#ffffff', sub: '出口 6 Exit', glow: 1.0, border: false }), 0, 3.15, z1 + 0.05);
  // the lift and the station pylon
  K.bx(hw + 0.5, hw + 2.3, 0, 0.3, z0 + 0.3, z0 + 2.1, M.stone); K.bx(hw + 0.55, hw + 2.25, 0.3, 3.0, z0 + 0.35, z0 + 2.05, M.canopy); K.bx(hw + 0.5, hw + 2.3, 3.0, 3.2, z0 + 0.3, z0 + 2.1, M.steel);
  [[hw + 0.5, z0 + 0.3], [hw + 2.24, z0 + 0.3], [hw + 0.5, z0 + 2.04], [hw + 2.24, z0 + 2.04]].forEach(([x, z]) => K.bx(x, x + 0.06, 0.3, 3.0, z, z + 0.06, M.steel)); K.bx(hw + 0.9, hw + 1.9, 0.3, 2.4, z0 + 2.06, z0 + 2.1, M.steel);
  K.bx(-hw - 1.5, -hw - 0.7, 0, 0.2, z1 - 0.3, z1 + 0.1, M.stone); K.bx(-hw - 1.42, -hw - 0.78, 0.2, 3.6, z1 - 0.22, z1 + 0.02, M.mrt);
  K.mesh(sign('西門', 0.6, 2.2, { vertical: true, font: FONT, bg: '#0a59a4', fg: '#ffffff', sub: 'Ximen', glow: 1.0, border: false, depth: 0.03 }), -hw - 1.1, 1.75, z1 + 0.04);
  K.mesh(paint(0.56, 0.56, (g, W, H) => { g.fillStyle = '#0a59a4'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd400'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.42, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = `900 ${H * 0.62}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('6', W / 2, H * 0.54); }, { glow: 1.0, depth: 0.03 }), -hw - 1.1, 3.2, z1 + 0.04);
  person(K, -0.9, z1 + 1.2, Math.PI, {}); person(K, 0.7, z1 + 1.9, 0.4, {});
  return K.done();
}

// ══ 11. 刺青街: the covered alley of small tattoo fronts ═════════════════════════════════════════════════
function tattoo() {
  const K = Kit('tattoo-street'), hw = 1.5, D = 10;
  K.bx(-hw, hw, 4.3, 4.45, -D, 0.2, M.concDk); K.bx(-hw, hw, 0, 4.3, -D - 0.1, -D, M.dark); K.bx(-hw, hw, 3.4, 4.3, -0.1, 0.12, M.black);
  K.mesh(sign('刺青', 2.7, 0.8, { kind: 'cloth', font: XING, bg: '#14204a', fg: '#d8e84a', sub: 'TATTOO', glow: 0.9, oneSide: true }), 0, 3.86, 0.16);
  for (let z = -1; z > -D; z -= 1.8) { K.bx(-hw + 0.3, hw - 0.3, 4.2, 4.26, z - 0.05, z + 0.05, M.tube); }
  const neon = [['刺青', M.neonM, '#ff4fb0'], ['TATTOO', M.neonC, '#4fe0ff'], ['紋身', M.neonR, '#ff5a48'], ['穿孔', M.neonC, '#4fe0ff'], ['彩繪', M.neonM, '#ff4fb0']];
  [-1, 1].forEach(side => { for (let i = 0; i < 5; i++) { const z = -0.9 - i * 1.85, x = side * (hw - 0.02), n = neon[(i + (side > 0 ? 2 : 0)) % neon.length];
    K.bx(x - 0.03, x + 0.03, 0, 3.2, z - 0.85, z + 0.85, M.black); K.bx(x - 0.05, x + 0.05, 0.1, 2.3, z - 0.75, z - 0.05, M.glass);                                   // a dark front with a window of flash sheets and a door
    K.mesh(paint(0.7, 1.0, flashArt, { glow: 0.7, oneSide: true, depth: 0.03 }), x - side * 0.07, 1.5, z + 0.42, -side * Math.PI / 2);
    K.mesh(sign(n[0], 0.5, 0.9, { vertical: n[0].length < 3, bg: '#0a0a0c', fg: n[2], glow: 2.0, border: false }), x - side * 0.4, 2.85, z, 0); K.bx(x - side * 0.4 - 0.01, x - side * 0.4 + 0.01, 3.3, 4.3, z - 0.01, z + 0.01, M.frame); } });
  person(K, 0.4, -2.5, 0.2, { shirt: SHIRT[7] }); person(K, -0.5, -5, Math.PI - 0.3, { shirt: SHIRT[7] });
  return K.done();
}

// ══ 12. 美國街: graffiti on walls and shutters, racks of jeans and T-shirts in the lane ═══════════════════
function american() {
  const K = Kit('american-street'), hw = 1.5, D = 10;
  K.bx(-hw, hw, 0, 5.2, -D - 0.1, -D, M.concDk); K.mesh(paint(2.9, 3.4, graffiti(['TPE', '1999', 'WEST']), { glow: 0.45, oneSide: true }), 0, 1.75, -D + 0.06);
  K.bx(-hw - 0.05, -hw + 0.1, 3.0, 3.25, -0.3, 0.3, M.steelDk); K.bx(hw - 0.1, hw + 0.05, 3.0, 3.25, -0.3, 0.3, M.steelDk); K.bx(-hw, hw, 3.25, 3.33, -0.05, 0.05, M.steelDk);
  K.mesh(sign('美國街', 2.6, 0.85, { font: FONT, bg: '#16213c', fg: '#ffffff', glow: 1.2 }), 0, 3.78, 0);
  [-1, 1].forEach(side => { for (let i = 0; i < 3; i++) { const z = -1.9 - i * 3.0, x = side * (hw - 0.04);
    K.mesh(paint(2.6, 2.7, graffiti(side > 0 ? ['XIMEN', 'FRESH'] : ['STREET', 'YO', '西門']), { glow: 0.4, oneSide: true, depth: 0.04 }), x, 1.4, z, -side * Math.PI / 2);
    K.bx(x - 0.03, x + 0.03, 2.8, 4.6, z - 1.4, z + 1.4, M.shutter); } });
  // racks of jeans and T-shirts spilling into the lane, sneakers on the wall
  [[-0.85, -0.9], [0.8, -2.8], [-0.8, -4.8]].forEach(([x, z], r) => { K.bx(x - 0.03, x + 0.03, 0, 1.7, z - 0.7, z - 0.64, M.steel); K.bx(x - 0.03, x + 0.03, 0, 1.7, z + 0.64, z + 0.7, M.steel); K.bx(x - 0.02, x + 0.02, 1.66, 1.7, z - 0.7, z + 0.7, M.steel);
    for (let k = 0; k < 9; k++) K.bx(x - 0.22, x + 0.22, r === 1 ? 0.6 : 0.95, 1.62, z - 0.6 + k * 0.14, z - 0.52 + k * 0.14, r === 1 ? pick([PANTS[0], PANTS[3], std('#4a6a9a', 0.9)]) : pick(CLOTH)); });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { K.bx(hw - 0.42, hw - 0.1, 3.0 + r * 0.42, 3.03 + r * 0.42, -1.0 + c * 0.45 - 0.16, -1.0 + c * 0.45 + 0.16, M.steel); K.bx(hw - 0.4, hw - 0.14, 3.03 + r * 0.42, 3.15 + r * 0.42, -1.0 + c * 0.45 - 0.12, -1.0 + c * 0.45 + 0.12, pick(CLOTH)); }
  person(K, 0.3, -1.6, -0.6, { shirt: SHIRT[3] });
  return K.done();
}

// ══ the fill-in shophouses between and beyond the landmarks (not clickable) ═══════════════════════════════
function fill() {
  const K = Kit('ximen-fill'), walls = [M.cream, M.concLt, M.pink, M.conc, M.ochre, M.white];
  const unit = (x, z, ry, w, floors, text, hue) => { K.at(x, 0, z, ry); const S = shophouse(K, w, floors, pick(walls), { depth: 9, ground: 3.6 });
    K.bx(S.x0 + 0.4, S.x1 - 0.4, 0.2, 3.0, -2.58, -2.54, M.shopLit); K.bx(S.x0 + 0.35, S.x1 - 0.9, 0, 0.9, -0.9, -0.3, pick([M.wood, M.steel, M.woodDk])); for (let k = 0; k < 5; k++) K.bx(S.x0 + 0.5 + k * 0.4, S.x0 + 0.8 + k * 0.4, 0.9, rr(1.05, 1.4), -0.8, -0.4, pick(CLOTH));
    K.mesh(sign(text, w - 0.5, 0.8, { bg: `hsl(${hue},50%,24%)`, fg: '#f6ecd2', font: hue % 3 ? KAI : WEI, spread: true, glow: 0.6, oneSide: true }), 0, 3.15, 0.08); K.mesh(sign(text, 0.55, 0.62 * [...text].length, { vertical: true, kind: 'box', font: KAI, bg: '#f4f0e4', fg: `hsl(${hue},70%,28%)`, glow: 0.45 }), S.x1 - 0.5, 6.2, 0.75, Math.PI / 2); K.at(); };
  const R = -Math.PI / 2, L = Math.PI / 2;
  [[1.5, 4, '世運食品', 210], [-2.7, 4, '美觀園', 150], [-7, 4, '老天祿', 8]].forEach(([z, f, t, h]) => unit(23.5, z, R, 4.3, f, t, h));
  [[60.3, 3, '雪王冰淇淋', 350], [64.6, 4, '大車輪', 28]].forEach(([z, f, t, h]) => unit(23.5, z, R, 4.3, f, t, h));
  [[4.5, 3, '楊記冰店', 150], [0.2, 4, '鴨肉扁', 8], [-4.1, 3, '謝謝魷魚羹', 210]].forEach(([z, f, t, h]) => unit(-23.5, z, L, 4.3, f, t, h));
  [[57.6, 4, '金園排骨', 28], [61.9, 3, '天天利', 350], [66.2, 4, '張記排骨酥', 150]].forEach(([z, f, t, h]) => unit(-23.5, z, L, 4.3, f, t, h));
  return K.done();
}

// ══ the old track and the level-crossing signal beside the railway wall ═══════════════════════════════════
function tracks() {
  const K = Kit('ximen-tracks'), x = -20.9, z0 = 15, z1 = 29.5;
  K.bx(x - 1.0, x + 1.0, 0, 0.05, z0, z1, tm('#6a655c', TEX.concrete, 3, 0.98)); for (let z = z0 + 0.3; z < z1; z += 0.62) K.bx(x - 0.85, x + 0.85, 0.05, 0.11, z - 0.11, z + 0.11, M.woodDk);
  [-0.53, 0.53].forEach(d => { K.bx(x + d - 0.035, x + d + 0.035, 0.11, 0.22, z0, z1, M.steelDk); K.bx(x + d - 0.03, x + d + 0.03, 0.22, 0.225, z0, z1, M.steel); });
  const px = -19.3, pz = 28.6; K.cyl(0.06, 0.06, 3.6, M.steel, px, 1.8, pz, 8); K.cyl(0.2, 0.24, 0.3, M.concDk, px, 0.15, pz, 10);
  [0.6, -0.6].forEach(a => { K.box(1.5, 0.16, 0.04, M.whiteP, px, 3.2, pz + 0.07, 0, 0, a); K.box(0.36, 0.165, 0.045, M.black, px + Math.cos(a) * 0.55, 3.2 + Math.sin(a) * 0.55, pz + 0.07, 0, 0, a); K.box(0.36, 0.165, 0.045, M.black, px - Math.cos(a) * 0.55, 3.2 - Math.sin(a) * 0.55, pz + 0.07, 0, 0, a); });
  K.bx(px - 0.5, px + 0.5, 2.3, 2.6, pz + 0.02, pz + 0.1, M.black); [-0.3, 0.3].forEach(d => K.cyl(0.11, 0.11, 0.06, M.neonR, px + d, 2.45, pz + 0.12, 12, [Math.PI / 2, 0, 0]));
  K.bx(px - 0.12, px + 0.12, 0.9, 1.15, pz - 0.3, pz + 0.3, M.steelDk); for (let i = 0; i < 9; i++) K.bx(px - 0.04, px + 0.04, 0.98, 1.08, pz - 0.3 - (i + 1) * 0.45, pz - 0.3 - i * 0.45, i % 2 ? M.whiteP : M.red);              // the barrier arm, down across the old line
  return K.done();
}

// ── build, place, register ───────────────────────────────────────────────────────────────────
const R = -Math.PI / 2, L = Math.PI / 2, XE = 23.5;
const G = groups;
G['tianhou-temple'] = put(tianhou(), XE, 10, R);
G['chengdu-starfruit'] = put(starfruit(), XE, 15.25, R);
G['fong-da'] = put(fongda(), XE, 21, R);
G['tattoo-street'] = put(tattoo(), XE, 26, R);
G['wannian'] = put(wannian(), XE, 33, R);
G['american-street'] = put(american(), XE, 40, R);
G['movie-street'] = put(cinema(), XE, 46.75, R);
G['ay-chung'] = put(aychung(), XE, 55, R);
G['zhonghua-market'] = put(zhonghua(), -XE, 30, L); put(G['zhonghua-market'].userData.bridge, -XE, 30, L);
G['lions-plaza'] = put(lions(), 13.5, 63, Math.PI);
G['lai-lai'] = put(lailai(), -13.5, 63, Math.PI);
G['pedestrian-zone-exit6'] = put(mrt(), -11, 53.5, Math.PI);
put(fill(), 0, 0, 0); put(tracks(), 0, 0, 0);
if (opt.redHouse) G['red-house'] = opt.redHouse;
// steam off the noodle pots and smoke off the incense burner
G['ay-chung'].userData.pots.forEach(([x, z]) => E.steamSrc.push(world(G['ay-chung'], x, 1.55, z))); E.steamSrc.push(world(G['tianhou-temple'], 0, 1.5, -0.7));
// she cannot walk through the things that stand inside the plaza
if (window.PHOTOWALL && PHOTOWALL.block) { PHOTOWALL.block({ x: -11, z: 53.5, facing: Math.PI, u0: -2.3, u1: 4.3, v0: -4.6, v1: 2.8 }); PHOTOWALL.block({ x: -19.6, z: 49.5, facing: 0, u0: -1.5, u1: 1.5, v0: -1.6, v1: 1.6 }); PHOTOWALL.block({ x: -19.4, z: 45.9, facing: 0, u0: -1.2, u1: 1.2, v0: -2.5, v1: 2.5 }); }   // Exit 6, the footbridge posts, the footbridge stair

let count = 0;
if (window.PLACES) {
  const P = k => PLACES.item('ximen', k);
  const tgt = (key, lx, ly, lz, o) => { const g = G[key], it = P(key); if (!g || !it) { console.warn('[landmarks-ximen] no group or item for', key); return; } const p = world(g, lx, ly, lz);
    PLACES.add(E, it, Object.assign({ target: g, plaque: { position: [p.x, p.y, p.z], rotation: g.rotation.y, size: 0.22 }, radius: 3.6 }, o || {})); count++; };
  tgt('tianhou-temple', 2.72, 1.5, 0.06, { near: [20.6, 11.6], radius: 3 }); /* the gate sits at the walk bound's corner: without a near point the 楊桃冰 counter next door took the prompt */ tgt('chengdu-starfruit', -2.08, 1.6, 0.06); tgt('fong-da', -3.27, 1.6, 0.06); tgt('tattoo-street', 1.2, 3.1, 0.2, { near: [21, 26] }); tgt('wannian', -2.15, 1.6, 0.06);
  tgt('american-street', -1.25, 2.6, 0.36, { near: [21, 40] }); tgt('movie-street', 4.98, 1.6, 0.06); tgt('ay-chung', 2.84, 1.6, 0.06); tgt('zhonghua-market', -3, 1.6, 0.84, { radius: 2.8 });   // a short reach: the two events on its pavement must win the E prompt when she stands at them
  tgt('lions-plaza', -3.3, 1.6, 0.06, { near: [10.5, 58], radius: 4 }); tgt('lai-lai', 1.95, 1.6, 0.06, { near: [-15, 58.2], radius: 3.2 }); tgt('pedestrian-zone-exit6', -3.0, 1.2, 2.72, { near: [-11, 49.6], radius: 3 });
  if (G['red-house']) { PLACES.add(E, P('red-house'), { target: G['red-house'], plaque: { position: [2.6, 1.6, 8.75], rotation: 0, size: 0.24 }, near: [0, 11.6], radius: 4 }); count++; }
  // the events, each near where it happened in this layout
  const ev = (key, o) => { const it = P(key); if (!it) { console.warn('[landmarks-ximen] no event', key); return; } PLACES.add(E, it, o); count++; };
  // CJ, 2026-11-21: 「我說的重要事件其實是指辦的大活動啊或有什麼名人來 年輕人比較關心的活動不是古早的大事」: concerts, signings, festivals and fan meets
  ev('orange-carnival-2024', { position: [-4.8, 15.4], rotation: 0.22 });                      // in front of the octagon, where the stage stood
  ev('drag-festival-2025', { position: [-12.6, 13.6], rotation: 0.3 });                        // beside the Red House
  ev('jay-chou-signing-2004', { position: [-18.6, 22], rotation: L });
  ev('lantern-festival-2017', { position: [-17.6, 45.2], rotation: L - 0.25 });                // on the 中華路 side, where the lanterns ran
  ev('backstreet-fest-2020', { position: [16.8, 33.2], rotation: -L });                        // toward 美國街 and the back streets
  ev('golden-horse-outdoor-2018', { position: [16.5, 47.5], rotation: -L });                   // on the 電影街 side
  ev('rainbow-crossing-2019', { position: [-6.6, 50.6], rotation: Math.PI + 0.3 });            // at Exit 6
  ev('mayday-5th-anniv-2004', { position: [4.6, 55.6], rotation: Math.PI - 0.15 });            // at the mouth of the car-free streets
  ev('gatao-fanmeet-2025', { position: [12.8, 56.4], rotation: Math.PI - 0.3 });
  ev('play-now-concert-2021', { position: [-17.6, 56.6], rotation: Math.PI - 0.35 });
}
return { groups, count };
};
})();
