// lm/kit-build.js: the builder's toolbox shared by the modules in lm/ (window.LMK). Shared kits register no LM key.
//   LMK.kit(name)            a Kit that merges everything into one mesh per material (same calls as the Kit in landmarks-ximen.js):
//                            K.at(x, y, z, ry) · K.box(w, h, d, mat, x, y, z, ry, rx, rz) · K.bx(x0, x1, y0, y1, z0, z1, mat) ·
//                            K.cyl(rTop, rBot, h, mat, x, y, z, seg, [rx, ry, rz]) · K.sph(r, mat, x, y, z, sy, sx, sz) · K.rod(mat, [a], [b], r, seg) ·
//                            K.geo(geometry, mat, x, y, z, [rx, ry, rz], sx, sy, sz) · K.mesh(object, x, y, z, ry) · K.done(x, z, ry, y) -> Group in the scene
//   LMK.mats(E)              a dictionary of textured materials, made once per page
//   LMK.paint(w, h, draw, o) a canvas-painted board: draw(g, W, H). o: glow, px, depth, plane (a one-sided plane), alpha
//   LMK.label(text, w, h, o) lettering on a ground. o: bg, fg, font, weight, sub, subFg, vertical, glow, border, rtl, spread, pad
//   LMK.entry(key)           the clickable registry entry of a place (window.__places.entries)
//   LMK.retarget(E, key, g, old, o)   g becomes a click target of that place; old is hidden and dropped; o: { near, radius }
//   LMK.hide(o) · LMK.unblock(x, z, tol) drops the old footprints at a point · LMK.block(g, u0, u1, v0, v1) blocks a box in g's own frame
//   LMK.hole(E, x0, x1, z0, z1)   cuts a rectangle out of the ground plane, so a stair can really go down
(function () {
'use strict';
const T = THREE;
const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",serif', WEI = '"Weibei TC","Kaiti TC","BiauKai",serif', HEI = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif', LI = '"Libian TC","Baoli TC","Kaiti TC",serif', MING = '"Songti TC","LiSong Pro","PMingLiU",serif', YUAN = '"Yuanti TC","PingFang TC",sans-serif', XING = '"Xingkai TC","Hannotate TC","Kaiti TC",serif';
const UNIT = new T.BoxGeometry(1, 1, 1).toNonIndexed(), SPH = new T.SphereGeometry(0.5, 12, 9).toNonIndexed(), CYL = {}, UP = new T.Vector3(0, 1, 0);
const cylG = (a, b, seg) => { const k = a.toFixed(3) + '|' + b.toFixed(3) + '|' + seg; return CYL[k] || (CYL[k] = new T.CylinderGeometry(a, b, 1, seg).toNonIndexed()); };
function kit(name) {
  const g = new T.Group(); g.name = name; const bins = new Map();
  const m4 = new T.Matrix4(), q = new T.Quaternion(), eu = new T.Euler(), p = new T.Vector3(), s = new T.Vector3(), n3 = new T.Matrix3(), v = new T.Vector3(), d = new T.Vector3();
  let pre = null, preRy = 0;
  function emit(geo, mat) { if (pre) m4.premultiply(pre); n3.getNormalMatrix(m4);
    let b = bins.get(mat); if (!b) bins.set(mat, b = { pos: [], nor: [] });
    const P = geo.attributes.position, N = geo.attributes.normal;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); b.nor.push(v.x, v.y, v.z); } }
  function add(geo, mat, x, y, z, rot, sx, sy, sz) { eu.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0); q.setFromEuler(eu); m4.compose(p.set(x, y, z), q, s.set(sx, sy, sz)); emit(geo, mat); }
  const K = { g,
    at(x, y, z, ry) { if (x == null) { pre = null; preRy = 0; } else { pre = new T.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z); preRy = ry || 0; } return K; },
    box(w, h, dd, mat, x, y, z, ry = 0, rx = 0, rz = 0) { add(UNIT, mat, x, y, z, [rx, ry, rz], w, h, dd); return K; },
    bx(x0, x1, y0, y1, z0, z1, mat) { add(UNIT, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, null, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); return K; },
    cyl(rTop, rBot, h, mat, x, y, z, seg = 10, rot = null) { const r = Math.max(rTop, rBot, 1e-4); add(cylG(rTop / r, rBot / r, seg), mat, x, y, z, rot, r, h, r); return K; },
    sph(r, mat, x, y, z, sy = 1, sx = 1, sz = 1) { add(SPH, mat, x, y, z, null, r * 2 * sx, r * 2 * sy, r * 2 * sz); return K; },
    rod(mat, a, b, r = 0.03, seg = 6) { d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = d.length(); q.setFromUnitVectors(UP, d.normalize()); m4.compose(p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, s.set(r, len, r)); emit(cylG(1, 1, seg), mat); return K; },
    geo(ge, mat, x = 0, y = 0, z = 0, rot = null, sx = 1, sy = sx, sz = sx) { add(ge.index ? ge.toNonIndexed() : ge, mat, x, y, z, rot, sx, sy, sz); return K; },
    mesh(m, x, y, z, ry = 0) { m.position.set(x, y, z); if (pre) m.position.applyMatrix4(pre); m.rotation.y = ry + preRy; g.add(m); return m; },
    done(x, z, ry, y) { bins.forEach((b, mat) => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(b.nor, 3));
      const m = new T.Mesh(geo, mat); m.castShadow = !(mat.userData && mat.userData.noCast); m.receiveShadow = true; g.add(m); }); bins.clear();
      if (x != null) { g.position.set(x, y || 0, z); g.rotation.y = ry || 0; T_scene().add(g); g.updateMatrixWorld(true); } return g; } };
  return K;
}
const T_scene = () => window.ENGINE.current ? window.ENGINE.current.scene : window.__remake.scene;
let MAT = null, MATE = null;
function mats(E) {
  if (MAT && MATE === E) return MAT; MATE = E;
  const { TEX, MATS, triMat, GLOW } = E, tm = (color, tex, scale, rough, metal) => triMat({ color, tex, scale, rough, metal: metal || 0 });
  const std = (c, r = 0.8, m = 0) => new T.MeshStandardMaterial({ color: E.col(c), roughness: r, metalness: m });
  const glow = (r, g, b) => { const m = GLOW(r, g, b); m.userData.noCast = true; return m; };
  const lit = (c, e, i) => { const m = std(c, 0.5); m.emissive = E.col(e); m.emissiveIntensity = i; return m; };
  const clear = (c, op, r = 0.06) => Object.assign(new T.MeshStandardMaterial({ color: E.col(c), roughness: r, metalness: 0.3, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide }), { userData: { noCast: true } });
  MAT = { tm, std, glow, lit, clear,
    conc: tm('#b9b2a2', TEX.concrete, 0.5, 0.92), concDk: tm('#8e877a', TEX.concrete, 0.5, 0.95), concLt: tm('#d2ccbd', TEX.plaster, 0.3, 0.9), asphalt: tm('#4a4640', TEX.concrete, 1.5, 0.97),
    cream: tm('#dcc9a4', TEX.plaster, 0.35, 0.85), ochre: tm('#c79a5c', TEX.plaster, 0.35, 0.85), white: tm('#ece7da', TEX.plaster, 0.4, 0.8), pink: tm('#c9a08c', TEX.plaster, 0.35, 0.85), washed: tm('#a9a59a', TEX.concrete, 2.2, 0.95),
    brick: MATS.brick, brickDk: tm('#a8958a', TEX.brick, 1, 0.92), brickBurnt: tm('#3a2f2a', TEX.brick, 1, 0.95), stone: tm('#9a968c', TEX.concrete, 1, 0.9), granite: tm('#b4b0a8', TEX.concrete, 2.5, 0.55), graniteDk: tm('#6f6c68', TEX.concrete, 2.5, 0.5), stoneWarm: tm('#c2b59c', TEX.concrete, 1.2, 0.85),
    tileW: tm('#e6e2d6', TEX.metal, 3, 0.35), tileG: tm('#7fa893', TEX.metal, 3, 0.4), terrazzo: tm('#bdb6a6', TEX.concrete, 3, 0.6),
    glass: tm('#1f2d36', TEX.metal, 1, 0.12, 0.6), glassBlue: tm('#3f6f86', TEX.metal, 1, 0.1, 0.7), glassGreen: tm('#3f7a70', TEX.metal, 1, 0.1, 0.7), glassWarm: tm('#8a7a5a', TEX.metal, 1, 0.12, 0.6),
    frame: std('#26262a', 0.5, 0.3), steel: tm('#c9ccd0', TEX.metal, 3, 0.34, 0.3), steelDk: std('#565a60', 0.5, 0.3), chrome: tm('#e2e5e8', TEX.metal, 4, 0.18, 0.7), alu: tm('#a9adb2', TEX.metal, 4, 0.4, 0.4),
    shutter: tm('#9aa0a4', TEX.metal, 4, 0.5, 0.25), dark: std('#15120f', 0.95), black: std('#141416', 0.6), rubber: std('#1b1b1d', 0.9),
    wood: tm('#8a6a48', TEX.bark, 2, 0.8), woodDk: tm('#4f3a28', TEX.bark, 2, 0.85), woodRed: tm('#7a2c20', TEX.bark, 2, 0.7), bamboo: tm('#c2a468', TEX.bark, 3, 0.7), straw: tm('#cfa85a', TEX.bark, 4, 0.9),
    red: std('#b3271e', 0.55), redDk: std('#7c1a14', 0.6), verm: std('#c8402a', 0.6), gold: std('#d9a53a', 0.35, 0.7), brass: std('#b8923a', 0.4, 0.6), bronze: tm('#6a5136', TEX.metal, 3, 0.45, 0.6), bronzeGn: tm('#4f6a58', TEX.metal, 3, 0.55, 0.4),
    tile: std('#c8612c', 0.6), tileGreen: std('#2f7d5a', 0.4), tileBlue: std('#2a5a8a', 0.45), blue: std('#1f4f9c', 0.5), mrt: std('#0a59a4', 0.45), yellow: std('#f2c21a', 0.55), green: std('#3f8a5a', 0.6), navy: std('#1c2a4a', 0.6), orange: std('#e07a2a', 0.6),
    whiteP: std('#f1ece2', 0.5), greyP: std('#8d8f92', 0.6), creamP: std('#e6d6b0', 0.7), pinkP: std('#e5a9a0', 0.7), tealP: std('#3f8f8a', 0.6),
    leaf: MATS.leaf, leafDk: tm('#2f5a2c', TEX.leafy, 1.2, 0.95), grass: tm('#5f8a45', TEX.leafy, 0.8, 0.98), soil: tm('#5a4636', TEX.bark, 2, 0.98),
    winLit: glow(1.5, 1.02, 0.5), winCool: glow(0.9, 1.1, 1.3), shopLit: glow(1.25, 0.9, 0.5), tube: glow(2.3, 2.2, 2.0), bulb: glow(3.6, 2.4, 1.0), neonR: glow(3.4, 0.5, 0.4), neonC: glow(0.4, 2.6, 3.2), neonM: glow(3.2, 0.5, 2.6), neonG: glow(0.5, 3.0, 0.9), neonY: glow(3.2, 2.6, 0.4), lantern: glow(2.6, 0.42, 0.16), ledW: glow(2.4, 2.4, 2.5),
    pane: clear('#cfe6ea', 0.16), canopy: clear('#a9d6e2', 0.42, 0.1), paneBlue: clear('#7fb6d6', 0.38, 0.08), paneGreen: clear('#8fc9b6', 0.4, 0.08),
  };
  return MAT;
}
function paint(w, h, draw, o = {}) {
  const px = o.px || 512, W = w >= h ? px : Math.max(16, Math.round(px * w / h)), H = w >= h ? Math.max(16, Math.round(px * h / w)) : px, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  draw(g, W, H); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; cv.__tex = t;
  const m = new T.MeshStandardMaterial({ map: t, roughness: o.rough == null ? 0.6 : o.rough, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: o.glow == null ? 0.3 : o.glow, transparent: !!o.alpha, side: o.plane && o.double ? T.DoubleSide : T.FrontSide });
  let mesh;
  if (o.plane) mesh = new T.Mesh(new T.PlaneGeometry(w, h), m);
  else { const e = new T.MeshStandardMaterial({ color: o.edge || 0x2a2622, roughness: 0.6 }); mesh = new T.Mesh(new T.BoxGeometry(w, h, o.depth || 0.06), [e, e, e, e, m, o.oneSide ? e : m]); }
  mesh.castShadow = !o.plane && !o.noCast; mesh.userData.redraw = fn => { fn(g, W, H); t.needsUpdate = true; };
  if (o.fonts !== false && document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px "Weibei TC"'), document.fonts.load('40px "Kaiti TC"')]).then(() => { g.clearRect(0, 0, W, H); draw(g, W, H); t.needsUpdate = true; }, () => {});
  return mesh;
}
// lettering on a ground: one line (or a column when vertical), an optional smaller line under it
function label(text, w, h, o = {}) {
  return paint(w, h, (g, W, H) => { const pad = (o.pad == null ? 0.1 : o.pad) * Math.min(W, H), font = o.font || HEI, wt = o.weight || 700;
    if (o.bg !== 'none') { g.fillStyle = o.bg || '#f1ece2'; g.fillRect(0, 0, W, H); }
    if (o.draw) o.draw(g, W, H);
    if (o.border) { g.strokeStyle = o.border === true ? (o.fg || '#222') : o.border; g.lineWidth = Math.max(2, Math.min(W, H) * 0.03); g.strokeRect(pad * 0.45, pad * 0.45, W - pad * 0.9, H - pad * 0.9); }
    g.fillStyle = o.fg || '#222'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const chars = [...text], sub = o.sub;
    if (o.vertical) { const n = chars.length, top = pad, bot = H - pad - (sub ? H * 0.1 : 0), cell = (bot - top) / n, size = Math.min(cell * 0.94, (W - pad * 2) * 0.98); g.font = `${wt} ${size}px ${font}`; chars.forEach((c, i) => g.fillText(c, W / 2, top + cell * (i + 0.5)));
      if (sub) { g.fillStyle = o.subFg || o.fg || '#222'; g.save(); g.font = `600 ${Math.min(H * 0.07, W * 0.3)}px ${o.subFont || HEI}`; g.fillText(sub, W / 2, H - pad - H * 0.04, W - pad); g.restore(); } }
    else { const lh = sub ? H * 0.6 : H, cy = sub ? H * 0.38 : H * 0.52; let size = (lh - pad * (sub ? 1 : 2)) * 0.92; g.font = `${wt} ${size}px ${font}`; const shown = o.rtl ? chars.slice().reverse().join('') : text, mw = g.measureText(shown).width, max = W - pad * 2;
      if (mw > max) { size *= max / mw; g.font = `${wt} ${size}px ${font}`; }
      if (o.spread && chars.length > 1) { const cs = o.rtl ? chars.slice().reverse() : chars, step = max / cs.length; cs.forEach((c, i) => g.fillText(c, pad + step * (i + 0.5), cy)); } else g.fillText(shown, W / 2, cy);
      if (sub) { g.fillStyle = o.subFg || o.fg || '#222'; g.font = `600 ${H * 0.2}px ${o.subFont || HEI}`; g.fillText(sub, W / 2, H * 0.8, max); } }
  }, o);
}
const entry = key => (window.__places && window.__places.entries || []).find(e => e.key === key);
// retarget(E, key, g, old, o): g becomes a click target of that place; `old` (the object it replaces) is hidden and dropped from the place's targets.
// o may carry { near: [x, z], radius } to move where the E prompt answers. Goes through PLACES.add, which refreshes the click list.
function retarget(E, key, g, old, o) { const e = entry(key); if (!e) { console.warn('[lmk] no place entry for', key); return null; }
  if (old) { old.visible = false; const i = e.targets.indexOf(old); if (i >= 0) e.targets.splice(i, 1); const j = e.boxes.findIndex(b => b.o === old); if (j >= 0) e.boxes.splice(j, 1); }
  return PLACES.add(E, e.item, Object.assign({ target: g }, o || {})); }
const hide = o => { if (o) o.visible = false; return o; };
function unblock(x, z, tol) { if (!window.PHOTOWALL || !PHOTOWALL.feet) return 0; let n = 0; PHOTOWALL.feet().forEach(f => { if (Math.hypot(f.x - x, f.z - z) <= (tol || 0.05) && PHOTOWALL.unblock(f)) n++; }); return n; }
function block(g, u0, u1, v0, v1) { if (!window.PHOTOWALL || !PHOTOWALL.block) return null; return PHOTOWALL.block({ x: g.position.x, z: g.position.z, facing: g.rotation.y, u0, u1, v0, v1 }); }
// the ground is one plane: holes are cut in its shader (up to four rectangles, world x0 x1 z0 z1)
function hole(E, x0, x1, z0, z1) {
  const gr = E.scene.children.find(m => m.isMesh && m.geometry && m.geometry.type === 'PlaneGeometry' && m.geometry.parameters.width === 240); if (!gr) { console.warn('[lmk] no ground plane'); return false; }
  const mat = gr.material; let H = mat.userData.holes;
  if (!H) { H = mat.userData.holes = { a: [new T.Vector4(1, 0, 1, 0), new T.Vector4(1, 0, 1, 0), new T.Vector4(1, 0, 1, 0), new T.Vector4(1, 0, 1, 0)], n: 0 };
    mat.onBeforeCompile = sh => { sh.uniforms.uHole = { value: H.a };
      sh.vertexShader = 'varying vec3 vHoleW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vHoleW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform vec4 uHole[4]; varying vec3 vHoleW;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n for (int i = 0; i < 4; i++) { if (vHoleW.x > uHole[i].x && vHoleW.x < uHole[i].y && vHoleW.z > uHole[i].z && vHoleW.z < uHole[i].w) discard; }'); };
    mat.customProgramCacheKey = () => 'lmk-hole'; mat.needsUpdate = true; }
  if (H.n >= 4) { console.warn('[lmk] only four ground holes'); return false; }
  H.a[H.n++].set(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)); return true;
}
// a segment of an arch as a merged list of boxes: used for vaults, arcades and round-headed windows. plane 'x' (arch spans x, depth along z)
function arch(K, mat, cx, cy, z0, z1, r, thick, a0 = 0, a1 = Math.PI, n = 12) { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / n, len = (a1 - a0) / n * (r + thick / 2) * 1.04; K.box(len, thick, Math.abs(z1 - z0), mat, cx + Math.cos(a) * (r + thick / 2), cy + Math.sin(a) * (r + thick / 2), (z0 + z1) / 2, 0, 0, a + Math.PI / 2); } return K; }
window.LMK = { kit, mats, paint, label, entry, retarget, hide, unblock, block, hole, arch, FONTS: { KAI, WEI, HEI, LI, MING, YUAN, XING } };
})();
