// lm/ximen-tattoo-lane.js: 刺青街 (漢中街50巷), opened as a lane she can walk into. CJ, 2026-11-22: 「那些弱點也一起修掉」 (it was a painted mouth she could not enter).
// The real lane is a narrow covered alley of small tattoo and piercing studios: dark fronts, windows papered with flash sheets, neon in every doorway,
// signs hung across the passage, a translucent roof with strip lights (measured: docs/places/ximen.json and its sources; general look inferred, no photo
// opened in this pass). Here: 14 m of lane, six studio fronts a side, each with its own drawn neon (swallow, rose, anchor, koi, dagger, lotus), flash
// windows, doors, stools and price boards; hanging signs; cables and AC units; a koi-and-wave mural with the lane's name at the end. Studio names are
// invented (guess): no real business is named. The old mouth is hidden. She walks x 21 to 36 in world, kept in by window.LM_AREAS.
(window.LM = window.LM || {})['ximen-tattoo-lane'] = function (E) {
  const L = window.LMK; if (!L) return;
  const T = E.T, M = L.mats(E), K = L.kit('tattoo-lane'), F = L.FONTS, hw = 1.5, LEN = 14, old = E.scene.children.find(c => c.name === 'tattoo-street'), X = old ? old.position.x : 23.5, Z = old ? old.position.z : 26;
  const WALL = M.std('#16161a', 0.85), TRIM = M.std('#2c2c33', 0.6), FLOOR = M.tm('#4c4a48', E.TEX.concrete, 2.5, 0.55);
  const NEON = { m: '#ff4fb0', c: '#4fe0ff', r: '#ff5a48', y: '#ffe14a', g: '#6dff8a', v: '#b98cff' };
  // drawn motifs, each a few neon strokes
  const MOTIF = {
    swallow: (g, s) => { g.beginPath(); g.moveTo(-s, -s * 0.2); g.quadraticCurveTo(-s * 0.3, -s * 0.9, 0, 0); g.quadraticCurveTo(s * 0.3, -s * 0.9, s, -s * 0.2); g.moveTo(0, 0); g.lineTo(-s * 0.25, s * 0.8); g.moveTo(0, 0); g.lineTo(s * 0.25, s * 0.8); g.stroke(); },
    rose: (g, s) => { g.beginPath(); for (let a = 0; a < 15; a += 0.2) { const r = s * 0.06 * a; g.lineTo(Math.cos(a) * r, Math.sin(a) * r - s * 0.2); } g.stroke(); g.beginPath(); g.moveTo(0, s * 0.55); g.lineTo(0, s); g.moveTo(0, s * 0.8); g.quadraticCurveTo(s * 0.5, s * 0.5, s * 0.6, s * 0.85); g.stroke(); },
    anchor: (g, s) => { g.beginPath(); g.arc(0, -s * 0.75, s * 0.16, 0, 7); g.moveTo(0, -s * 0.6); g.lineTo(0, s * 0.8); g.moveTo(-s * 0.4, -s * 0.3); g.lineTo(s * 0.4, -s * 0.3); g.moveTo(-s * 0.7, s * 0.3); g.quadraticCurveTo(0, s * 1.3, s * 0.7, s * 0.3); g.stroke(); },
    koi: (g, s) => { g.beginPath(); g.ellipse(0, 0, s * 0.8, s * 0.36, -0.4, 0, 7); g.moveTo(-s * 0.7, s * 0.3); g.lineTo(-s * 1.1, s * 0.8); g.lineTo(-s * 0.95, s * 0.2); g.moveTo(s * 0.1, -s * 0.3); g.quadraticCurveTo(s * 0.1, -s * 0.8, s * 0.5, -s * 0.6); g.stroke(); g.beginPath(); g.arc(s * 0.5, -s * 0.28, s * 0.05, 0, 7); g.stroke(); },
    dagger: (g, s) => { g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.14, -s * 0.2); g.lineTo(0, s * 0.3); g.lineTo(-s * 0.14, -s * 0.2); g.closePath(); g.moveTo(-s * 0.45, s * 0.3); g.lineTo(s * 0.45, s * 0.3); g.moveTo(0, s * 0.3); g.lineTo(0, s * 0.9); g.stroke(); },
    lotus: (g, s) => { for (let k = -2; k <= 2; k++) { g.save(); g.rotate(k * 0.45); g.beginPath(); g.moveTo(0, s * 0.5); g.quadraticCurveTo(-s * 0.35, -s * 0.2, 0, -s * 0.8); g.quadraticCurveTo(s * 0.35, -s * 0.2, 0, s * 0.5); g.stroke(); g.restore(); } },
  };
  const tube = (g, col, w) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = w * 3.2; };
  const neon = (w, h, motif, text, col, col2, font) => L.paint(w, h, (g, W, H) => { g.fillStyle = '#08080b'; g.fillRect(0, 0, W, H); g.strokeStyle = '#26262c'; g.lineWidth = 4; g.strokeRect(4, 4, W - 8, H - 8);
    const tall = H > W * 1.2; tube(g, col2, Math.min(W, H) * 0.03); g.save(); if (tall) g.translate(W / 2, H * 0.2); else g.translate(H * 0.5, H * 0.5); if (motif) MOTIF[motif](g, (tall ? W : H) * 0.3); g.restore();
    tube(g, col, Math.min(W, H) * 0.02); g.textAlign = 'center'; g.textBaseline = 'middle'; const cs = [...text];
    if (tall) { const top = motif ? H * 0.4 : H * 0.08, cell = (H * 0.94 - top) / cs.length; g.font = `700 ${Math.min(cell * 0.9, W * 0.72)}px ${font || F.HEI}`; cs.forEach((ch, i) => { g.fillText(ch, W / 2, top + cell * (i + 0.5)); }); }
    else { g.font = `700 ${H * 0.5}px ${font || F.HEI}`; g.fillText(text, motif ? W * 0.5 + H * 0.45 : W / 2, H * 0.54, motif ? W - H * 1.2 : W * 0.9); } }, { glow: 1.7, depth: 0.07, px: 512, edge: 0x101012 });
  const flash = seed => L.paint(1.1, 1.5, (g, W, H) => { let s = seed; const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; g.fillStyle = '#e9dfc6'; g.fillRect(0, 0, W, H); const names = Object.keys(MOTIF);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = W * (0.18 + c * 0.32), y = H * (0.14 + r * 0.24); g.fillStyle = '#f6efdc'; g.fillRect(x - W * 0.14, y - H * 0.105, W * 0.28, H * 0.21); g.strokeStyle = '#8a8270'; g.lineWidth = 1; g.strokeRect(x - W * 0.14, y - H * 0.105, W * 0.28, H * 0.21);
      g.save(); g.translate(x, y); g.shadowBlur = 0; g.strokeStyle = ['#1a1a1a', '#8a1a14', '#1a3a6a'][Math.floor(R() * 3)]; g.lineWidth = 3; g.lineCap = 'round'; MOTIF[names[Math.floor(R() * names.length)]](g, W * 0.085); g.restore(); } }, { glow: 0.28, depth: 0.02, oneSide: true });
  // the passage: floor with a drain, side walls, the roof of translucent sheet on steel, strip lights
  K.bx(-hw + 0.04, hw - 0.04, 0.006, 0.016, -LEN, 0.4, FLOOR); K.bx(-0.07, 0.07, 0.016, 0.02, -LEN, 0.3, M.steelDk);
  [-1, 1].forEach(s => { K.bx(s * hw, s * (hw - 0.05), 0, 4.5, -LEN, 0, WALL); });
  K.bx(-hw, hw, 0, 4.5, -LEN - 0.06, -LEN, WALL);
  for (let z = -0.6; z > -LEN; z -= 1.9) { K.bx(-hw, hw, 4.3, 4.38, z - 0.03, z + 0.03, M.steelDk); K.bx(-0.5, 0.5, 4.22, 4.27, z - 0.04, z + 0.04, M.tube); }
  K.mesh(Object.assign(new T.Mesh(new T.BoxGeometry(2 * hw, 0.03, LEN), Object.assign(M.clear('#d9e2c9', 0.55, 0.5), { emissive: E.col('#ffb46a'), emissiveIntensity: 0.12 })), { castShadow: true }), 0, 4.42, -LEN / 2);
  [-0.9, 0.3, 1.05].forEach((x, i) => K.rod(M.black, [x, 4.15 - i * 0.07, 0], [x + 0.2, 4.1 - i * 0.05, -LEN], 0.012, 4));                                                    // cables run the length of the lane
  // the mouth: a painted fascia and the lane's own neon over it
  K.bx(-hw, hw, 3.35, 4.5, -0.12, 0.1, WALL); K.mesh(neon(2.7, 0.86, 'swallow', '刺青街', NEON.y, NEON.m, F.XING), 0, 3.9, 0.14); K.mesh(L.label('TATTOO STREET · 漢中街50巷', 2.4, 0.16, { bg: '#0a0a0c', fg: '#4fe0ff', glow: 1.3, depth: 0.02, oneSide: true }), 0, 3.4, 0.12);
  // the studios: six fronts a side, each its own colours, motif and name
  const SHOPS = [['龍紋堂', 'koi', 'm', 'y'], ['INK HOUSE', 'dagger', 'c', 'r'], ['飛燕刺青', 'swallow', 'r', 'c'], ['穿孔 PIERCING', 'anchor', 'g', 'm'], ['蓮花彩繪', 'lotus', 'v', 'y'], ['玫瑰紋身', 'rose', 'r', 'g'], ['OLD SCHOOL', 'anchor', 'y', 'c'], ['墨人工作室', 'dagger', 'c', 'v'], ['半永久紋眉', 'lotus', 'm', 'c'], ['錦鯉刺青', 'koi', 'y', 'r'], ['TATTOO 紋身', 'rose', 'c', 'm'], ['黑白圖騰', 'swallow', 'v', 'g']];
  const U = (LEN - 0.6) / 6;
  [-1, 1].forEach((s, si) => { for (let i = 0; i < 6; i++) { const z = -0.5 - U * (i + 0.5), x = s * (hw - 0.05), sh = SHOPS[i * 2 + si], c1 = NEON[sh[2]], c2 = NEON[sh[3]], ry = -s * Math.PI / 2, tr = TRIM;
    K.bx(x - s * 0.04, x, 0, 0.35, z - U / 2 + 0.05, z + U / 2 - 0.05, tr); K.bx(x - s * 0.06, x, 2.45, 2.55, z - U / 2 + 0.05, z + U / 2 - 0.05, tr); K.bx(x - s * 0.06, x, 0, 2.5, z - U / 2 + 0.03, z - U / 2 + 0.09, tr);          // plinth, lintel, pier
    K.mesh(flash(31 + i * 7 + si * 3), x - s * 0.03, 1.32, z - 0.48, ry); K.bx(x - s * 0.035, x - s * 0.02, 0.45, 2.2, z - 1.08, z + 0.12, M.pane);                                         // the window of flash sheets
    K.bx(x - s * 0.035, x - s * 0.005, 0.02, 2.3, z + 0.28, z + 1.0, M.black); K.bx(x - s * 0.045, x - s * 0.03, 1.0, 2.1, z + 0.36, z + 0.92, M.glass); K.bx(x - s * 0.07, x - s * 0.04, 1.0, 1.12, z + 0.34, z + 0.38, M.chrome);     // the door
    K.mesh(L.label(i % 2 ? 'OPEN' : '營業中', 0.42, 0.16, { bg: '#0a0a0c', fg: c2, glow: 1.8, depth: 0.02, oneSide: true }), x - s * 0.05, 1.75, z + 0.64, ry);
    K.mesh(neon(U - 0.3, 0.62, sh[1], sh[0], c1, c2), x - s * 0.06, 2.95, z, ry);                                                                                                 // the fascia sign
    if ((i + si) % 2 === 0) { const hx = s * (hw - 0.5); K.mesh(neon(0.5, 1.25, null, ['刺青', '紋身', 'TATTOO', '穿孔', '彩繪', '紋眉'][(i + si * 3) % 6], c2, c1), hx, 3.55 - (i % 3) * 0.12, z + 0.9, 0); K.bx(hx - 0.01, hx + 0.01, 4.15, 4.4, z + 0.89, z + 0.91, M.frame); }   // a sign hung across the passage
    if (i % 3 === 0) { K.box(0.3, 0.5, 0.7, M.greyP, s * (hw - 0.22), 3.6, z - 0.2); K.cyl(0.2, 0.2, 0.02, M.steelDk, s * (hw - 0.38), 3.6, z - 0.2, 12, [0, 0, Math.PI / 2]); }             // an air-conditioner on its bracket
    if ((i + si) % 3 === 1) { K.cyl(0.15, 0.13, 0.42, M.red, s * (hw - 0.35), 0.21, z + 0.1, 10); }                                                                                    // a plastic stool by the door
    if ((i + si) % 3 === 2) { const bx = s * (hw - 0.3); K.box(0.44, 0.78, 0.03, M.black, bx, 0.4, z - 0.86, 0, -0.18); K.box(0.44, 0.78, 0.03, M.black, bx, 0.4, z - 1.02, 0, 0.18);
      K.mesh(L.label('小圖 500 起', 0.4, 0.5, { vertical: true, bg: '#101014', fg: c1, font: F.KAI, glow: 1.0, depth: 0.012, oneSide: true }), bx, 0.44, z - 0.83, 0).rotation.x = -0.18; }
    if (i % 2 === 1) { K.cyl(0.14, 0.11, 0.26, M.tm('#7a4a32', E.TEX.concrete, 3, 0.9), s * (hw - 0.26), 0.13, z - 1.2, 10); for (let k = 0; k < 5; k++) K.sph(0.12, M.leafDk, s * (hw - 0.26) + Math.cos(k * 1.3) * 0.08, 0.42 + (k % 3) * 0.13, z - 1.2 + Math.sin(k * 1.3) * 0.08, 1.2); }
  } });
  // the end wall: a koi and waves painted floor to ceiling, the lane's name in neon above it
  K.mesh(L.paint(2.84, 3.3, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d1a33'); gr.addColorStop(1, '#16324f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e9dfc6'; g.lineWidth = W * 0.008; for (let r = 0; r < 7; r++) for (let c = -1; c < 7; c++) { const x = W * (c * 0.17 + (r % 2) * 0.085), y = H * (0.5 + r * 0.085); [1, 0.66, 0.33].forEach(k => { g.beginPath(); g.arc(x, y, W * 0.085 * k, Math.PI, 0); g.stroke(); }); }
    g.save(); g.translate(W * 0.5, H * 0.3); g.rotate(-0.5); g.fillStyle = '#d8402a'; g.beginPath(); g.ellipse(0, 0, W * 0.3, H * 0.085, 0, 0, 7); g.fill(); g.fillStyle = '#f2e6cf'; g.beginPath(); g.ellipse(W * 0.05, H * 0.01, W * 0.12, H * 0.05, 0, 0, 7); g.fill();
    g.fillStyle = '#d8402a'; g.beginPath(); g.moveTo(-W * 0.27, 0); g.lineTo(-W * 0.44, -H * 0.09); g.lineTo(-W * 0.38, 0); g.lineTo(-W * 0.44, H * 0.09); g.fill(); g.beginPath(); g.moveTo(0, -H * 0.08); g.quadraticCurveTo(W * 0.05, -H * 0.17, W * 0.14, -H * 0.07); g.fill();
    g.strokeStyle = '#1a1210'; g.lineWidth = W * 0.006; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-W * 0.2 + i * W * 0.07, 0, H * 0.05, -1.1, 1.1); g.stroke(); } g.fillStyle = '#1a1210'; g.beginPath(); g.arc(W * 0.22, -H * 0.015, W * 0.014, 0, 7); g.fill(); g.restore(); }, { glow: 0.5, depth: 0.03, oneSide: true, px: 1024 }), 0, 1.68, -LEN + 0.03);
  K.mesh(neon(2.5, 0.7, null, 'TATTOO STREET', NEON.c, NEON.m), 0, 3.82, -LEN + 0.06);
  K.bx(-hw + 0.08, hw - 0.08, 0.016, 0.5, -LEN + 0.02, -LEN + 0.5, M.tm('#3a3a40', E.TEX.concrete, 2, 0.7)); [-0.8, 0, 0.8].forEach(x => { K.cyl(0.16, 0.12, 0.3, M.black, x, 0.65, -LEN + 0.26, 10); for (let k = 0; k < 6; k++) K.sph(0.13, M.leafDk, x + Math.cos(k) * 0.1, 0.95 + (k % 3) * 0.12, -LEN + 0.26 + Math.sin(k) * 0.08, 1.3); });
  const g = K.done(X, Z, -Math.PI / 2);
  L.retarget(E, 'tattoo-street', g, old);
  (window.LM_AREAS = window.LM_AREAS || []).push({ x0: 21, x1: X + LEN - 0.9, z0: Z - 0.95, z1: Z + 0.95 });
};
