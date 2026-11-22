// lm/dadao-arcade.js: the 亭仔腳 (arcade) of 迪化街 in its New Year dress. CJ, 2026-11-22: 「那些弱點也一起修掉」 (the arcades were bare piers).
// On the nine fill-in fronts: spring couplets (春聯) brushed on red paper down the outer piers with a diamond 春 or 福 on the middle one (the pairs are
// stock New Year couplets for a shop, general knowledge); the enamel door plate of 迪化街一段 (numbers are a guess: these fronts are not at real
// addresses); timber joists under the upper floor with enamel-shade pendant lamps; a granite kerb with a plank ramp for the hand trucks; a potted
// kumquat tree at a pier, the New Year plant of every shop door; rolled bamboo blinds half down on the side the sun comes from; a string of
// firecrackers, a rain pipe, an old delivery bicycle, a bench with an abacus. Everything stays behind the pier line, off the road she walks.
(window.LM = window.LM || {})['dadao-arcade'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('dadao-arcade'), F = L.FONTS, ZC = i => 29.6 - i * 4.8;
  const PAIRS = [['生意興隆通四海', '財源茂盛達三江'], ['天增歲月人增壽', '春滿乾坤福滿門'], ['一帆風順年年好', '萬事如意步步高'], ['爆竹一聲除舊歲', '桃符萬戶迎新春'], ['和氣生財長富貴', '順意平安永吉祥'], ['門迎春夏秋冬福', '戶納東西南北財'], ['新春富貴年年好', '佳歲平安步步高'], ['迎新春事事如意', '接鴻福步步高升'], ['大地回春人增壽', '福滿人間喜臨門']];
  const paper = (text, w, h) => L.paint(w, h, (g, W, H) => { g.fillStyle = '#c2261c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,220,120,${Math.random() * 0.25})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } g.strokeStyle = '#e9c46a'; g.lineWidth = W * 0.04; g.strokeRect(W * 0.06, W * 0.06, W - W * 0.12, H - W * 0.12);
    g.fillStyle = '#17120f'; g.textAlign = 'center'; g.textBaseline = 'middle'; const cs = [...text], cell = (H - W * 0.3) / cs.length; g.font = `700 ${Math.min(cell * 0.92, W * 0.74)}px ${F.KAI}`; cs.forEach((c, i) => g.fillText(c, W / 2, W * 0.15 + cell * (i + 0.5))); }, { glow: 0.3, depth: 0.012, oneSide: true, px: 512 });
  const diamond = ch => { const m = L.paint(0.5, 0.5, (g, W, H) => { g.fillStyle = '#c2261c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e9c46a'; g.lineWidth = W * 0.05; g.strokeRect(W * 0.06, W * 0.06, W * 0.88, H * 0.88); g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.PI / 4); g.fillStyle = '#e9c46a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${W * 0.6}px ${F.WEI}`; g.fillText(ch, 0, W * 0.02); g.restore(); }, { glow: 0.35, depth: 0.012, oneSide: true, px: 256 }); m.rotation.z = Math.PI / 4; return m; };
  const plate = no => L.paint(0.3, 0.2, (g, W, H) => { g.fillStyle = '#12648a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${H * 0.24}px ${F.HEI}`; g.fillText('迪化街一段', W / 2, H * 0.3); g.font = `800 ${H * 0.42}px ${F.HEI}`; g.fillText(no + ' 號', W / 2, H * 0.68); }, { glow: 0.3, depth: 0.012, oneSide: true, px: 256 });
  const kumquat = (x, z) => { K.cyl(0.24, 0.18, 0.36, M.tm('#3a5a7a', E.TEX.concrete, 3, 0.5), x, 0.18, z, 12); K.cyl(0.25, 0.25, 0.04, M.whiteP, x, 0.36, z, 12); K.rod(M.woodDk, [x, 0.36, z], [x, 0.9, z], 0.02, 5);
    for (let k = 0; k < 9; k++) { const a = k * 2.4, r = 0.14 + (k % 3) * 0.06, y = 0.85 + (k % 4) * 0.13; K.sph(0.17, M.leafDk, x + Math.cos(a) * r, y, z + Math.sin(a) * r, 0.85); }
    for (let k = 0; k < 14; k++) { const a = k * 1.9, r = 0.2 + (k % 3) * 0.05, y = 0.78 + (k % 5) * 0.12; K.sph(0.035, M.orange, x + Math.cos(a) * r, y, z + Math.sin(a) * r); }
    K.box(0.1, 0.16, 0.004, M.red, x + 0.2, 0.75, z + 0.18, 0.6); };
  const SLOTS = [[-1, 0, 0], [-1, 1, 0], [-1, 2, 0], [-1, 3, 0], [-1, 8, 1], [-1, 9, 0], [1, 1, 0], [1, 2, 1], [1, 4, 0]];      // side, slot, 1 = a three-storey front (two piers, set further out)
  SLOTS.forEach(([side, slot, tall], n) => { K.at(side * 4.95, 0, ZC(slot), side * Math.PI / 2); const zf = tall ? -0.43 : -0.23, pair = PAIRS[n % PAIRS.length], no = side < 0 ? 46 + slot * 6 : 27 + slot * 6;
    // couplets and the door plate. Read from the street: the first line hangs on the right pier
    K.mesh(paper(pair[0], 0.28, 1.6), side < 0 ? -2.2 : 2.2, 1.75, zf, Math.PI); K.mesh(paper(pair[1], 0.28, 1.6), side < 0 ? 2.2 : -2.2, 1.75, zf, Math.PI);
    if (!tall) K.mesh(diamond(n % 2 ? '福' : '春'), 0, 1.9, zf, Math.PI);
    K.mesh(plate(no), side < 0 ? -2.2 : 2.2, 2.82, zf, Math.PI);
    // joists and pendant lamps under the upper floor
    for (let k = 0; k < 5; k++) K.bx(-2.0 + k * 1.0 - 0.06, -2.0 + k * 1.0 + 0.06, 3.02, 3.2, 0.25, 2.95, M.woodDk);
    [-1.1, 1.1].forEach(x => { K.rod(M.black, [x, 3.05, 0.9], [x, 2.62, 0.9], 0.006, 4); K.cyl(0.05, 0.2, 0.1, M.tm('#2f5a4a', E.TEX.metal, 3, 0.4, 0.3), x, 2.58, 0.9, 14); K.sph(0.06, M.bulb, x, 2.5, 0.9); });
    // the kerb, with a plank ramp in one bay
    K.bx(-2.35, 2.35, 0, 0.1, -0.5, 0.0, M.granite); K.box(0.8, 0.03, 0.55, M.wood, n % 2 ? -1.1 : 1.1, 0.06, -0.62, 0, n % 2 ? -0.2 : -0.2);
    kumquat(n % 2 ? 2.05 : -2.05, -0.72);
    // rolled bamboo blinds on the west side, where the low sun comes in
    if (side < 0 && n % 2 === 0) [-1.1, 1.1].forEach((x, i) => { K.cyl(0.07, 0.07, 1.7, M.bamboo, x, 3.0, -0.12, 8, [0, 0, Math.PI / 2]); if (i) { K.box(1.7, 0.7, 0.015, M.bamboo, x, 2.62, -0.12); for (let k = 0; k < 7; k++) K.box(1.7, 0.012, 0.02, M.straw, x, 2.3 + k * 0.1, -0.11); } });
    // one extra per front
    const pick = n % 4;
    if (pick === 0) { const x = side < 0 ? 2.05 : -2.05; K.rod(M.red, [x, 2.9, zf - 0.06], [x, 1.2, zf - 0.06], 0.012, 4); for (let k = 0; k < 22; k++) K.cyl(0.018, 0.018, 0.09, k % 5 ? M.red : M.gold, x + (k % 2 ? 0.04 : -0.04), 2.85 - k * 0.075, zf - 0.06, 6, [0, 0, k % 2 ? 0.7 : -0.7]); }       // a string of firecrackers
    if (pick === 1) { K.at(side * 4.95 + side * -0.75 * 0, 0, ZC(slot), side * Math.PI / 2); const bx = -1.3; [-0.48, 0.48].forEach(d => { for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; K.box(0.17, 0.02, 0.02, M.black, bx + d + Math.cos(a) * 0.31, 0.43 + Math.sin(a) * 0.31, -0.75, 0, 0, a + Math.PI / 2); } });
      K.rod(M.frame, [bx - 0.48, 0.43, -0.75], [bx - 0.1, 0.9, -0.75], 0.016, 5); K.rod(M.frame, [bx - 0.1, 0.9, -0.75], [bx + 0.36, 0.92, -0.75], 0.016, 5); K.rod(M.frame, [bx + 0.36, 0.92, -0.75], [bx + 0.48, 0.43, -0.75], 0.016, 5); K.rod(M.frame, [bx - 0.1, 0.9, -0.75], [bx + 0.05, 0.43, -0.75], 0.016, 5); K.rod(M.frame, [bx + 0.05, 0.43, -0.75], [bx + 0.36, 0.92, -0.75], 0.016, 5);
      K.box(0.22, 0.04, 0.1, M.woodDk, bx - 0.14, 0.98, -0.75); K.rod(M.chrome, [bx + 0.38, 0.92, -0.97], [bx + 0.38, 1.05, -0.53], 0.012, 5); K.box(0.36, 0.3, 0.3, M.wood, bx - 0.5, 0.85, -0.75); }                                              // the shop's delivery bicycle, a crate on its rack
    if (pick === 2) { K.bx(0.4, 1.9, 0.4, 0.45, 0.15, 0.5, M.wood); [[0.5, 0.2], [1.8, 0.2], [0.5, 0.45], [1.8, 0.45]].forEach(([x, z]) => K.bx(x - 0.03, x + 0.03, 0.03, 0.4, z - 0.03, z + 0.03, M.woodDk)); K.box(0.42, 0.03, 0.2, M.woodDk, 1.2, 0.47, 0.32, 0.2); for (let r = 0; r < 7; r++) { K.rod(M.bamboo, [1.03 + r * 0.055, 0.5, 0.25], [1.03 + r * 0.055, 0.5, 0.4], 0.004, 3); K.sph(0.014, M.black, 1.03 + r * 0.055, 0.5, 0.3); K.sph(0.014, M.black, 1.03 + r * 0.055, 0.5, 0.36); } }   // a bench with the abacus left on it
    if (pick === 3) { const x = side < 0 ? -2.42 : 2.42; K.rod(M.greyP, [x, 0.1, zf + 0.1], [x, 5.4, zf + 0.1], 0.04, 6); [1.2, 3.0, 4.6].forEach(y => K.box(0.12, 0.04, 0.06, M.steelDk, x, y, zf + 0.12)); K.box(0.24, 0.32, 0.12, M.greyP, x - (side < 0 ? -0.3 : 0.3), 1.6, zf + 0.02); }                              // a rain pipe and the meter box
    K.at(); });
  K.done(0, 0, 0);
};
