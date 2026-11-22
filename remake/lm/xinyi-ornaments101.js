// lm/xinyi-ornaments101.js: the ornaments of Taipei 101's tiers, and its podium. CJ, 2026-11-22: 「那些弱點也一起修掉」.
// The tower's eight flared tiers each carry a silver 如意 (ruyi) scroll clasped to every corner, and its base carries a giant square-holed coin on each
// face (measured: docs/places/xinyi.json 'taipei-101'; sizes here are fitted to the model by raycast: tier tops at y 75, 88, 102, 116.5, 129.5, 144,
// 157.5, half-width 10.9). The model had the front coin and small mid-face clouds only. Added: 28 corner ruyi; coins on the other three faces; a line
// of warm light under each tier's lip; the crown lit in the colour of the day, as the real tower is (red Monday through violet Sunday, measured as
// a custom, general knowledge); and the mall podium's front: a colonnade with up-lights, lit shop windows, the long vaulted skylight on its roof,
// pole banners, bollards and palms along the forecourt's edge. No brand is drawn.
(window.LM = window.LM || {})['xinyi-ornaments101'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('ornaments-101'), F = L.FONTS, tw = E.scene.children.find(c => c.name === 'tower101'); if (!tw) return;
  const CX = tw.position.x, CZ = tw.position.z, SIL = M.tm('#cfd6da', E.TEX.metal, 2, 0.25, 0.75), SILD = M.tm('#8f999f', E.TEX.metal, 2, 0.35, 0.7), GOLD = M.tm('#d2a23a', E.TEX.metal, 2, 0.3, 0.8);
  // a ruyi scroll: a stem, a three-lobed head with two inward curls, a boss in the middle; flat, about 3.4 m across, standing out from the corner
  const ruyi = (s) => { K.box(0.5 * s, 2.4 * s, 0.4 * s, SIL, 0, -1.6 * s, 0); K.box(1.3 * s, 0.4 * s, 0.45 * s, SILD, 0, -2.7 * s, 0);
    [[0, 0.5, 1.15], [-1.0, -0.1, 0.9], [1.0, -0.1, 0.9]].forEach(([x, y, r]) => K.sph(r * s, SIL, x * s, y * s, 0, 0.85, 1, 0.34)); [[-1.55, -0.75], [1.55, -0.75]].forEach(([x, y]) => { K.sph(0.5 * s, SIL, x * s, y * s, 0, 1, 1, 0.4); K.sph(0.22 * s, SILD, x * s, y * s, 0.12 * s, 1, 1, 0.6); });
    K.sph(0.42 * s, SILD, 0, 0.2 * s, 0.2 * s, 1, 1, 0.5); L.arch(K, SILD, 0, 0.5 * s, 0.14 * s, 0.24 * s, 0.75 * s, 0.1 * s, 0.3, Math.PI - 0.3, 8); };
  const TOPS = [75, 88, 102, 116.5, 129.5, 144, 157.5], HW = 10.9;
  TOPS.forEach((y, i) => { [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dz]) => { K.at(CX + dx * (HW + 0.25), y - 1.2, CZ + dz * (HW + 0.25), Math.atan2(dx, dz)); ruyi(1.05); });
    K.at(); [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dz]) => { const w = dx ? 0.12 : 2 * HW - 1.2, d = dx ? 2 * HW - 1.2 : 0.12; K.box(w, 0.14, d, M.winLit, CX + dx * (HW + 0.06), y - 0.25, CZ + dz * (HW + 0.06)); }); });
  K.at();
  // the coins on the three faces the model left bare (the front one is the model's own)
  [[1, 0], [-1, 0], [0, -1]].forEach(([dx, dz]) => { const x = CX + dx * 11.05, z = CZ + dz * 11.05, rot = dx ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]; K.cyl(3.5, 3.5, 0.5, SIL, x, 54.2, z, 28, rot); K.cyl(2.9, 2.9, 0.56, SILD, x, 54.2, z, 28, rot); K.cyl(2.5, 2.5, 0.62, SIL, x, 54.2, z, 28, rot);
    K.box(dx ? 0.7 : 1.7, 1.7, dx ? 1.7 : 0.7, M.dark, x, 54.2, z); });
  // the crown in the colour of the day
  const DAY = ['#b06cff', '#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#3fa9ff', '#5e5ce6'][new Date().getDay()], dayM = M.lit(DAY, DAY, 2.2); dayM.userData.noCast = true;
  [[159.5, 8.3], [163, 7.3], [166.5, 6.0], [169.6, 3.6]].forEach(([y, hw]) => { [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dz]) => K.box(dx ? 0.12 : 2 * hw, 0.5, dx ? 2 * hw : 0.12, dayM, CX + dx * (hw + 0.08), y, CZ + dz * (hw + 0.08))); });
  K.cyl(0.5, 0.9, 5, dayM, CX, 177, CZ, 8);
  // ── the podium (the mall): its front stands at z CZ + 20.6, 48 m wide and about 12 m high ──
  const PF = CZ + 20.6, STONE = M.tm('#c9c2b4', E.TEX.concrete, 0.5, 0.55);
  for (let i = 0; i < 12; i++) { const x = CX - 22 + i * 4; if (Math.abs(x - CX) < 5.5) continue; K.cyl(0.55, 0.62, 10.4, STONE, x, 5.2, PF + 0.9, 14); K.bx(x - 0.8, x + 0.8, 0, 0.5, PF + 0.1, PF + 1.7, STONE); K.bx(x - 0.75, x + 0.75, 10.4, 10.9, PF + 0.15, PF + 1.65, STONE); K.cyl(0.14, 0.18, 0.1, M.frame, x, 0.55, PF + 1.9, 10); K.cyl(0.1, 0.1, 0.03, M.bulb, x, 0.61, PF + 1.9, 10);
    if (i < 11 && Math.abs(x + 2 - CX) > 5.5) { K.bx(x + 0.7, x + 3.3, 0.7, 5.2, PF + 0.02, PF + 0.1, M.shopLit); K.bx(x + 0.6, x + 3.4, 5.2, 5.5, PF, PF + 0.16, M.frame); K.bx(x + 1.96, x + 2.04, 0.7, 5.2, PF + 0.08, PF + 0.14, M.frame); K.bx(x + 0.7, x + 3.3, 6.2, 9.6, PF + 0.02, PF + 0.08, M.glassWarm); } }
  K.bx(CX - 24.5, CX + 24.5, 10.9, 11.7, PF - 0.3, PF + 2.1, STONE); K.bx(CX - 24.8, CX + 24.8, 11.7, 12.0, PF - 0.5, PF + 2.3, SILD);
  // the vaulted skylight along the podium roof
  for (let i = 0; i <= 10; i++) { K.at(CX - 20 + i * 4, 0, PF - 8, Math.PI / 2); L.arch(K, SILD, 0, 12.0, -0.12, 0.12, 4.2, 0.2, 0, Math.PI, 10); if (i < 10) { K.at(CX - 18 + i * 4, 0, PF - 8, Math.PI / 2); L.arch(K, M.paneGreen, 0, 12.0, -1.9, 1.9, 4.25, 0.05, 0, Math.PI, 8); } }
  K.at();
  // pole banners, bollards and palms along the forecourt's back edge
  for (let i = 0; i < 8; i++) { const x = CX - 21 + i * 6; if (Math.abs(x - CX) < 6) continue; K.cyl(0.07, 0.09, 7.5, M.steel, x, 3.75, PF + 3.2, 8); K.mesh(L.paint(1.0, 3.6, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, i % 2 ? '#0f5c4e' : '#1b2a4a'); gr.addColorStop(1, i % 2 ? '#3fae8f' : '#3f6fb0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = W * 0.02; for (let k = 0; k < 8; k++) g.strokeRect(W * (0.5 - 0.05 * (8 - k)), H * (0.16 + k * 0.035), W * 0.1 * (8 - k), H * 0.03);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${W * 0.2}px "Helvetica Neue",Arial,sans-serif`; g.fillText('TAIPEI', W / 2, H * 0.62); g.fillText('101', W / 2, H * 0.72); g.font = `600 ${W * 0.12}px ${F.HEI}`; g.fillText(i % 2 ? '觀景台 89F' : '購物中心 MALL', W / 2, H * 0.86, W * 0.9); }, { glow: 0.6, depth: 0.03, px: 256 }), x + 0.62, 5.4, PF + 3.2); }
  for (let i = 0; i < 22; i++) { const x = CX - 23 + i * 2.2; if (Math.abs(x - CX) < 4) continue; K.cyl(0.13, 0.13, 0.8, M.chrome, x, 0.4, PF + 6.6, 10); K.sph(0.13, M.chrome, x, 0.82, PF + 6.6); }
  [-19, -11, 11, 19].forEach(d => { const x = CX + d, z = PF + 4.8; K.cyl(0.9, 0.75, 0.8, STONE, x, 0.4, z, 14); K.rod(M.woodDk, [x, 0.8, z], [x + 0.3, 6.2, z], 0.16, 7); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; K.box(0.36, 0.05, 2.6, M.leafDk, x + 0.3 + Math.sin(a) * 1.15, 6.2 - 0.25, z + Math.cos(a) * 1.15, a, 0.35); } });
  const g = K.done(0, 0, 0);
  L.retarget(E, 'taipei-101', g);
};
