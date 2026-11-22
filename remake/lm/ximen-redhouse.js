// lm/ximen-redhouse.js: the real details of 西門紅樓 round the model. CJ, 2026-11-22: 「那些弱點也一起修掉」 (it was the old model with a plaque only).
// The model already carries the 1908 building's body: the octagonal brick hall with white bands, arched windows, the pyramid roof with its cupola and
// the cruciform wing behind. Its name board over the door was blank and nothing of the working building showed. Added here, all on or beside the model
// (nothing of it is hidden): the name board; the two long show banners hung at the front corners for the house's real tenants (二樓劇場, 16工房);
// carriage lamps, door furniture and a lit fanlight; the heritage stone by the door; up-lights at the foot of each brick face; a pair of cast-iron
// lamp standards; the weekend 創意市集 tents beside the hall; a bicycle rack. Labels: tenants and market are measured from the place's own research
// (docs/places/ximen.json); the wording and colours of the board and banners are a guess (no photo of them was opened).
(window.LM = window.LM || {})['ximen-redhouse'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('redhouse-details'), F = L.FONTS, A = 6.65;                                           // A: the octagon's apothem (measured by raycast on the model: the front face stands at z 6.65, each face 5.5 wide)
  // the name board on the blank panel over the door (the panel is x ±1.6, y 4.3–5.1, z 7.01)
  K.mesh(L.paint(3.05, 0.74, (g, W, H) => { g.fillStyle = '#efe6d2'; g.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,60,30,${0.02 + Math.random() * 0.04})`; g.fillRect(Math.random() * W, 0, 2 + Math.random() * 5, H); }
    g.strokeStyle = '#7a1c14'; g.lineWidth = H * 0.035; g.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16); g.fillStyle = '#7a1c14'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${H * 0.56}px ${F.WEI}`; [...'西門紅樓'].forEach((c, i) => g.fillText(c, W * (0.2 + i * 0.2), H * 0.42)); g.font = `600 ${H * 0.15}px ${F.MING}`; g.fillText('T H E   R E D   H O U S E   ·   1 9 0 8', W / 2, H * 0.82); }, { glow: 0.35, depth: 0.05, oneSide: true, px: 1024 }), 0, 4.7, 7.04);
  [-1.35, 1.35].forEach(x => { K.rod(M.frame, [x, 5.35, 7.2], [x, 5.1, 7.06], 0.012, 5); K.cyl(0.05, 0.07, 0.1, M.frame, x, 5.36, 7.24, 8, [0.9, 0, 0]); });                                                     // two small picture lights over the board
  // the door: a lit fanlight, brass pulls and kick plates, a mat; a carriage lamp on each side
  K.bx(-1.05, 1.05, 2.25, 2.85, 6.215, 6.235, M.winLit); for (let i = -2; i <= 2; i++) K.box(0.03, 0.62, 0.03, M.frame, i * 0.4, 2.55, 6.24, 0, 0, i * -0.22); K.bx(-1.08, 1.08, 2.22, 2.27, 6.21, 6.26, M.frame);
  [-0.12, 0.12].forEach(x => { K.rod(M.brass, [x, 0.95, 6.27], [x, 1.45, 6.27], 0.018, 6); K.bx(x - 0.04, x + 0.04, 0.9, 0.96, 6.21, 6.28, M.brass); K.bx(x - 0.04, x + 0.04, 1.44, 1.5, 6.21, 6.28, M.brass); });
  [[-1.0, -0.06], [0.06, 1.0]].forEach(([a, b]) => K.bx(a, b, 0.02, 0.26, 6.205, 6.225, M.brass)); K.bx(-0.9, 0.9, 0.0, 0.025, 6.7, 7.6, M.tm('#5a2a22', E.TEX.bark, 4, 0.98));
  [-1.75, 1.75].forEach(x => { K.rod(M.frame, [x, 2.55, 6.66], [x, 2.7, 6.9], 0.015, 5); K.bx(x - 0.09, x + 0.09, 2.2, 2.56, 6.82, 7.0, M.bulb); [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].forEach(([a, b]) => K.bx(x + a - 0.012, x + a + 0.012, 2.18, 2.58, 6.91 + b - 0.012, 6.91 + b + 0.012, M.frame));
    K.box(0.26, 0.03, 0.26, M.frame, x, 2.59, 6.91); K.cyl(0.02, 0.12, 0.12, M.frame, x, 2.66, 6.91, 4, [0, Math.PI / 4, 0]); K.box(0.24, 0.03, 0.24, M.frame, x, 2.17, 6.91); });
  // the heritage stone and the house's notice easels by the door
  K.bx(2.25, 3.05, 0, 0.5, 7.25, 7.6, M.graniteDk); K.box(0.86, 0.6, 0.3, M.granite, 2.65, 0.78, 7.42, 0, -0.12);
  K.mesh(L.paint(0.74, 0.48, (g, W, H) => { g.fillStyle = '#4a3a22'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d9b25a'; g.lineWidth = H * 0.03; g.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12); g.fillStyle = '#e6c878'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${H * 0.13}px ${F.KAI}`; g.fillText('直轄市定古蹟', W / 2, H * 0.24); g.font = `700 ${H * 0.3}px ${F.KAI}`; g.fillText('西門紅樓', W / 2, H * 0.55); g.font = `500 ${H * 0.1}px ${F.MING}`; g.fillText('原西門市場八角堂 · 1908', W / 2, H * 0.84); }, { glow: 0.3, depth: 0.03, oneSide: true }), 2.65, 0.8, 7.585).rotation.x = -0.12;
  // the show banners: a bracket at each front corner of the hall (the corners stand at x ±2.75, z 6.65), a long cloth facing the plaza
  const banner = (side, title, sub, tag, c0, c1, ink) => { const x = side * 3.25, z = 6.95, ry = side * 0.39;
    [9.55, 5.55].forEach(y => { K.rod(M.frame, [side * 2.78, y, 6.62], [side * 3.68, y, 7.02], 0.022, 6); });
    K.mesh(L.paint(0.86, 3.9, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalAlpha = 0.16; g.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(W * 0.5, H * 0.3, W * (0.25 + i * 0.22), 0, 7); g.lineWidth = W * 0.05; g.strokeStyle = '#fff'; g.stroke(); } g.globalAlpha = 1;
      g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; const cs = [...title], cell = H * 0.6 / cs.length; g.font = `700 ${Math.min(cell * 0.92, W * 0.7)}px ${F.WEI}`; cs.forEach((ch, i) => g.fillText(ch, W / 2, H * 0.12 + cell * (i + 0.5)));
      g.fillRect(W * 0.2, H * 0.745, W * 0.6, H * 0.006); g.font = `600 ${W * 0.13}px ${F.HEI}`; g.fillText(sub, W / 2, H * 0.79, W * 0.9); g.font = `700 ${W * 0.105}px ${F.HEI}`; g.fillText(tag, W / 2, H * 0.84, W * 0.9);
      g.font = `600 ${W * 0.085}px ${F.MING}`; g.fillText('西門紅樓 THE RED HOUSE', W / 2, H * 0.94, W * 0.9); }, { glow: 0.4, depth: 0.02, px: 1024 }), x, 7.55, z, ry);
    K.box(0.9, 0.035, 0.035, M.woodDk, x, 9.52, z, ry); K.box(0.9, 0.035, 0.035, M.woodDk, x, 5.58, z, ry); };
  banner(-1, '二樓劇場', '週末 現場演出', 'LIVE · 2F THEATRE', '#7a1c14', '#2a0d0a', '#f6e3b4'); banner(1, '創意市集', '16工房 · 手作設計', 'CREATIVE BOUTIQUE', '#e9dcc0', '#d2b98a', '#5a1a12');
  // up-lights at the foot of the five faces that look onto the plaza, washing the brick
  for (let k = -2; k <= 2; k++) { const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); [-1.6, 1.6].forEach(u => { const x = s * (A + 0.55) + c * u, z = c * (A + 0.55) - s * u; if (k === 0 && Math.abs(u) < 1.7 && false) return; K.cyl(0.1, 0.12, 0.07, M.frame, x, 0.035, z, 10); K.cyl(0.075, 0.075, 0.02, M.bulb, x, 0.075, z, 10); }); }
  // a pair of cast-iron lamp standards where the path meets the door
  [-2.6, 2.6].forEach(x => { K.cyl(0.16, 0.2, 0.3, M.frame, x, 0.15, 10.0, 10); K.cyl(0.055, 0.075, 3.0, M.frame, x, 1.8, 10.0, 10); K.cyl(0.09, 0.06, 0.1, M.frame, x, 3.32, 10.0, 10); K.box(0.7, 0.04, 0.04, M.frame, x, 3.2, 10.0);
    [-0.35, 0.35].forEach(d => { K.rod(M.frame, [x + d, 3.2, 10.0], [x + d, 3.05, 10.0], 0.012, 5); K.sph(0.13, M.bulb, x + d, 2.92, 10.0, 1.15); K.cyl(0.1, 0.14, 0.05, M.frame, x + d, 3.05, 10.0, 8); }); K.sph(0.15, M.bulb, x, 3.52, 10.0, 1.15); K.cyl(0.03, 0.1, 0.1, M.frame, x, 3.72, 10.0, 8); });
  // 創意市集: three white peaked tents beside the hall, tables of handmade goods under them, a string of bulbs along the front
  const GOODS = [M.red, M.yellow, M.tealP, M.pinkP, M.creamP, M.navy, M.orange, M.green];
  [[9.2, 8.6, -0.12], [12.6, 8.9, -0.2], [16.0, 9.4, -0.3]].forEach(([x, z, ry], i) => { K.at(x, 0, z, ry);
    [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([a, b]) => { K.cyl(0.03, 0.03, 2.3, M.chrome, a, 1.15, b, 8); K.cyl(0.09, 0.09, 0.03, M.steelDk, a, 0.015, b, 8); });
    K.cyl(0.02, 2.12, 1.0, M.whiteP, 0, 2.8, 0, 4, [0, Math.PI / 4, 0]); K.bx(-1.5, 1.5, 2.08, 2.32, -1.5, 1.5, M.whiteP); K.bx(-1.46, 1.46, 2.07, 2.33, -1.46, 1.46, M.white);
    K.mesh(L.label(['手作皮件', '插畫明信片', '銀飾 · 陶器'][i], 2.2, 0.2, { bg: 'none', fg: '#7a1c14', font: F.KAI, weight: 700, glow: 0.3, depth: 0.012, alpha: true, plane: true }), 0, 2.2, 1.515);
    K.bx(-1.2, 1.2, 0.72, 0.76, 0.2, 1.0, M.wood); [[-1.1, 0.3], [1.1, 0.3], [-1.1, 0.9], [1.1, 0.9]].forEach(([a, b]) => K.cyl(0.025, 0.025, 0.72, M.steelDk, a, 0.36, b, 6)); K.bx(-1.22, 1.22, 0.3, 0.74, 0.98, 1.0, [M.tm('#c9b48a', E.TEX.plaster, 2, 0.9), M.navy, M.redDk][i]);
    for (let n = 0; n < 16; n++) { const gx = -1.05 + (n % 8) * 0.3, gz = 0.36 + Math.floor(n / 8) * 0.38; if ((n + i) % 3 === 0) K.cyl(0.05, 0.06, 0.12, GOODS[(n * 3 + i) % 8], gx, 0.82, gz, 8); else K.box(0.16, 0.03 + (n % 3) * 0.03, 0.2, GOODS[(n * 5 + i) % 8], gx, 0.78 + (n % 3) * 0.015, gz, n * 0.3); }
    K.bx(-1.3, -0.5, 0.0, 1.5, -1.2, -1.15, M.wood); for (let n = 0; n < 9; n++) K.box(0.2, 0.26, 0.02, GOODS[(n + i * 2) % 8], -1.2 + (n % 3) * 0.3, 0.45 + Math.floor(n / 3) * 0.42, -1.13);                 // a pegboard of prints at the back
    for (let n = 0; n < 9; n++) K.sph(0.04, M.bulb, -1.4 + n * 0.35, 2.02 - Math.sin(n / 8 * Math.PI) * 0.12, 1.5);
    K.at(); });
  // a bicycle rack on the other side of the door
  for (let i = 0; i < 5; i++) { const x = -9.2 - i * 0.62; L.arch(K, M.chrome, x, 0, 9.18, 9.22, 0.38, 0.035, 0, Math.PI, 8); }
  const g = K.done(0, 0, 0);
  L.retarget(E, 'red-house', g);
  L.block(g, 7.4, 17.8, 7.0, 10.9); L.block(g, -2.85, -2.35, 9.75, 10.25); L.block(g, 2.35, 2.85, 9.75, 10.25); L.block(g, 2.2, 3.1, 7.2, 7.7);
};
