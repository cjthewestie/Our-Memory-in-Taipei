// lm/xinyi-skm.js: 新光三越 A9, A8 and A4, and the skywalks that tie the four stores together. CJ, 2026-11-22: 「那些弱點也一起修掉」 (only A11 was built).
// 信義新天地 is four stores in a chain: A11 by the plaza, then A9, A8 and, across 松高路, A4, joined at the upper floors by glazed footbridges
// (measured: the chain and its order, docs/places/xinyi.json 'skm-xinyi-place'; the wayfinding plate already in this scene reads A11 · A9 · A8 · A4).
// This scene is a compressed block with the plaza at A11's door, so the other three stand down the mall's own axis beyond the south gate, in that
// order, where she sees them through the gap as she walks back: A9 on the west, A8 on the east, A4 beyond on the west (which side each stands on
// is inferred; 誠品 really faces A8, here it is nearer). Each is its own block: stone-clad, a tall glazed atrium slot with lit floors, lit shop
// windows under a canopy, a seasonal banner, the store's name in red channel-style letters and its block letter on a blade sign into the mall.
// No logo is drawn. The bridges cross the mall between them at the third floor. A11 gets its block letter too.
(window.LM = window.LM || {})['xinyi-skm'] = function (E) {
  const L = window.LMK; if (!L) return;
  const T = E.T, M = L.mats(E), K = L.kit('skm-chain'), F = L.FONTS;
  const STONE = [M.tm('#cdbfa8', E.TEX.concrete, 0.5, 0.6), M.tm('#b9b4ac', E.TEX.concrete, 0.5, 0.55), M.tm('#d6cdbd', E.TEX.concrete, 0.5, 0.6)], BAND = M.tm('#8f8a80', E.TEX.concrete, 0.8, 0.6), GL = M.glassBlue, RED = '#d81e2a';
  const nameSign = (id, w, h, vertical) => L.paint(w, h, (g, W, H) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = RED; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (vertical) { g.fillRect(0, 0, W, W); g.fillStyle = '#fff'; g.font = `900 ${W * 0.62}px "Helvetica Neue",Arial,sans-serif`; g.fillText(id, W / 2, W * 0.54); g.fillStyle = RED; const cs = [...'新光三越'], cell = (H - W * 1.15) / 4; g.font = `900 ${Math.min(cell * 0.9, W * 0.8)}px ${F.HEI}`; cs.forEach((c, i) => g.fillText(c, W / 2, W * 1.1 + cell * (i + 0.5))); }
    else { g.font = `900 ${H * 0.5}px ${F.HEI}`; g.fillText('新光三越', W * 0.4, H * 0.4, W * 0.7); g.font = `700 ${H * 0.16}px "Helvetica Neue",Arial,sans-serif`; g.fillText('SHIN KONG MITSUKOSHI', W * 0.4, H * 0.8, W * 0.7); g.fillRect(W * 0.8, H * 0.12, H * 0.76, H * 0.76); g.fillStyle = '#fff'; g.font = `900 ${H * 0.5}px "Helvetica Neue",Arial,sans-serif`; g.fillText(id, W * 0.8 + H * 0.38, H * 0.54); } }, { glow: 0.5, depth: 0.3, px: 1024 });
  const banner = (w, h, zh, en, c0, c1) => L.paint(w, h, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 0.2; g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(W * (0.2 + (i * 37 % 60) / 100), H * (0.1 + (i * 53 % 80) / 100), W * (0.08 + (i % 4) * 0.05), 0, 7); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; const cs = [...zh], cell = H * 0.56 / cs.length; g.font = `900 ${Math.min(cell * 0.9, W * 0.62)}px ${F.HEI}`; cs.forEach((c, i) => g.fillText(c, W / 2, H * 0.14 + cell * (i + 0.5))); g.font = `700 ${W * 0.1}px "Helvetica Neue",Arial,sans-serif`; g.fillText(en, W / 2, H * 0.8, W * 0.86); g.fillRect(W * 0.3, H * 0.86, W * 0.4, H * 0.006); }, { glow: 0.8, depth: 0.1, px: 512 });
  // one store: x0..x1 by z0..z1, `face` is the side that looks onto the mall (+1: its +x side, -1: its -x side)
  const store = (id, x0, x1, z0, z1, h, face, stone, ban) => { const fx = face > 0 ? x1 : x0, n = Math.round(h / 4.6), fh = h / n, zc = (z0 + z1) / 2, zl = z1 - z0;
    K.bx(x0, x1, 0, h, z0, z1, stone); K.bx(x0 - 0.3, x1 + 0.3, h, h + 0.9, z0 - 0.3, z1 + 0.3, BAND); K.bx(x0 + 3, x1 - 3, h + 0.9, h + 4, zc - 4, zc + 4, BAND); K.sph(0.4, M.neonR, (x0 + x1) / 2, h + 4.6, zc);
    for (let i = 1; i < n; i++) K.bx(fx - 0.12, fx + 0.12, i * fh - 0.25, i * fh + 0.25, z0, z1, BAND);                                                       // floor bands on the mall face
    for (let i = 1; i < n; i++) for (let k = 0; k < 6; k++) { const za = z0 + 1 + k * (zl - 2) / 6; K.bx(fx - 0.06, fx + 0.06, i * fh + 0.7, (i + 1) * fh - 0.7, za + 0.3, za + (zl - 2) / 6 - 0.3, (i * 3 + k) % 4 ? GL : M.winLit); }
    K.bx(fx - 0.25, fx + 0.25, 0.4, 5.4, z0 + 0.8, z1 - 0.8, M.shopLit); for (let k = 0; k <= 8; k++) K.bx(fx - 0.35, fx + 0.35, 0, 5.8, z0 + 0.5 + k * (zl - 1) / 8 - 0.25, z0 + 0.5 + k * (zl - 1) / 8 + 0.25, stone);                 // lit shop windows between stone piers
    K.bx(fx + face * 0.2 - 1.6, fx + face * 0.2 + 1.6, 5.9, 6.2, z0 - 0.4, z1 + 0.4, M.steel);                                                                // the canopy along the mall
    // the atrium slot: floor to roof, glass, every floor's lit edge showing through
    const az0 = z0 + zl * 0.12, az1 = z0 + zl * 0.3; K.bx(fx - 0.2 + face * 0.25, fx + 0.2 + face * 0.25, 6.2, h - 0.6, az0, az1, M.paneBlue); K.bx(fx - 0.5, fx + 0.5, 6.2, h - 0.6, az0, az0 + 0.25, M.steel); K.bx(fx - 0.5, fx + 0.5, 6.2, h - 0.6, az1 - 0.25, az1, M.steel);
    for (let i = 2; i <= n; i++) K.bx(fx - 0.3, fx + 0.1 * face + 0.1, i * fh - 0.12, i * fh + 0.12, az0 + 0.25, az1 - 0.25, M.winLit);
    // the face toward the plaza: the name high up, a seasonal banner
    K.mesh(nameSign(id, 11, 2.6, false), (x0 + x1) / 2, h - 3.2, z0 - 0.2, Math.PI);
    K.mesh(banner(4.2, 14, ban[0], ban[1], ban[2], ban[3]), fx - face * 3.4, h * 0.48, z0 - 0.12, Math.PI); for (let i = 1; i < n; i++) K.bx(x0, x1, i * fh - 0.2, i * fh + 0.2, z0 - 0.1, z0 + 0.1, BAND);
    // the blade sign into the mall: the block letter on red, the name down it
    K.bx(fx, fx + face * 2.4, 22.0, 22.3, z0 + 1.9, z0 + 2.1, M.steelDk); K.bx(fx, fx + face * 2.4, 12.1, 12.4, z0 + 1.9, z0 + 2.1, M.steelDk); K.mesh(nameSign(id, 2.2, 10.2, true), fx + face * 1.6, 17.2, z0 + 2.0, 0); };
  store('A9', -25, -7.5, 41, 64, 37, 1, STONE[0], ['週年慶', 'ANNIVERSARY', '#c2185b', '#7b1fa2']);
  store('A8', 7.5, 27, 46, 72, 41, -1, STONE[1], ['冬季新裝', 'WINTER COLLECTION', '#1565c0', '#00838f']);
  store('A4', -27, -7.5, 76, 104, 46, 1, STONE[2], ['耶誕城', 'CHRISTMASLAND', '#b71c1c', '#e65100']);
  // the skywalks: glazed bridges on round columns, crossing the mall from store to store
  const bridge = (xa, xb, z, y) => { const xc = (xa + xb) / 2, len = Math.abs(xb - xa); K.bx(xa, xb, y - 0.4, y, z - 1.5, z + 1.5, BAND); K.bx(xa, xb, y + 3.0, y + 3.2, z - 1.7, z + 1.7, M.steel); [-1.5, 1.5].forEach(d => { K.bx(xa, xb, y, y + 3.0, z + d - 0.03, z + d + 0.03, M.paneBlue); K.bx(xa, xb, y + 1.05, y + 1.12, z + d - 0.05, z + d + 0.05, M.steel); });
    for (let k = 0; k <= 6; k++) { const x = xa + (xb - xa) * k / 6; [-1.5, 1.5].forEach(d => K.bx(x - 0.06, x + 0.06, y, y + 3.0, z + d - 0.07, z + d + 0.07, M.steel)); } K.bx(xa, xb, y + 2.9, y + 2.96, z - 0.1, z + 0.1, M.tube);
    [xc - len * 0.28, xc + len * 0.28].forEach(x => K.cyl(0.3, 0.36, y - 0.4, M.steel, x, (y - 0.4) / 2, z, 12)); };
  bridge(-7.5, 7.5, 54, 10.2); bridge(-7.5, 7.5, 70.5, 10.2);
  K.bx(-9.2, -7.5, 9.8, 13.4, 64, 76, M.paneBlue); K.bx(-9.3, -7.4, 9.8, 10.0, 64, 76, BAND); K.bx(-9.3, -7.4, 13.2, 13.4, 64, 76, M.steel);                      // A9 to A4, along the west side over the cross street
  // the mall between them: a line of trees in planters and lamp standards, so the vista reads as a street
  for (let z = 43; z < 104; z += 7.5) [-4.6, 4.6].forEach((x, i) => { if ((z > 51 && z < 57) || (z > 68 && z < 73)) return; K.bx(x - 0.8, x + 0.8, 0, 0.45, z - 0.8, z + 0.8, STONE[1]); K.cyl(0.11, 0.15, 3.2, M.woodDk, x, 2.0, z, 7); for (let k = 0; k < 6; k++) K.sph(1.0, k % 2 ? M.leaf : M.leafDk, x + Math.cos(k * 1.1) * 0.8, 4.2 + (k % 3) * 0.6, z + Math.sin(k * 1.1) * 0.8, 0.85);
    K.cyl(0.05, 0.07, 4.4, M.steelDk, x * 0.55, 2.2, z + 3.7, 8); K.sph(0.2, M.bulb, x * 0.55, 4.5, z + 3.7); });
  K.bx(-7.4, 7.4, 0.02, 0.035, 38, 106, M.tm('#6a665e', E.TEX.concrete, 0.4, 0.6));
  // A11's own block letter, under the red name already on its front
  K.mesh(L.paint(1.9, 1.9, (g, W, H) => { g.fillStyle = RED; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${H * 0.52}px "Helvetica Neue",Arial,sans-serif`; g.fillText('A11', W / 2, H * 0.54); }, { glow: 1.0, depth: 0.16, px: 256 }), -18.7, 23.6, 9.4, Math.PI / 2);
  const g = K.done(0, 0, 0);
  L.retarget(E, 'skm-xinyi-place', g);
};
