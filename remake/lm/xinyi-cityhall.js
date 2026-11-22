// lm/xinyi-cityhall.js: 台北市政府 as the real building, in its real direction. CJ, 2026-11-22: 「那些弱點也一起修掉」 (it was a scale model on a plinth, and a far model standing to the wrong side).
// City Hall (市府路1號, 1994) is twelve storeys on a double-cross plan: two plus-shaped blocks side by side, joined by a lower middle with the main
// doors, pale stone with dark window bands, a paved forecourt and a row of flagpoles (measured: docs/places/xinyi.json 'taipei-city-hall'; the
// proportions here are inferred from that description, no drawing was opened). It lies north-north-east of 香堤大道, beyond 新光三越 A4 and the
// bus station. In this scene north is +z and east is +x, so it now closes the view down the mall past the south gate, a little east of the axis.
// The old far model stood south-west, down the gap the sun comes through: hidden. The little model on the plaza stays as the exhibit it is.
(window.LM = window.LM || {})['xinyi-cityhall'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('cityhall-real'), F = L.FONTS, old = E.scene.children.find(c => c.name === 'cityhall');
  const ST = M.tm('#d9cfbb', E.TEX.concrete, 0.35, 0.6), STD = M.tm('#b9ae98', E.TEX.concrete, 0.35, 0.65), WIN = M.tm('#27323a', E.TEX.metal, 1, 0.15, 0.6), FL = 3.7, N = 12, H = FL * N;
  let sd = 1994; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  const bar = (cx, cz, w, d, h) => { K.bx(cx - w / 2, cx + w / 2, 0, h, cz - d / 2, cz + d / 2, ST);
    for (let f = 0; f < Math.round(h / FL); f++) { const y = f * FL + 1.5; K.bx(cx - w / 2 - 0.06, cx + w / 2 + 0.06, y, y + 1.55, cz - d / 2 - 0.06, cz + d / 2 + 0.06, WIN);
      for (let k = 0; k < 5; k++) if (R() < 0.3) { const along = w > d, t = (k + 0.5) / 5 - 0.5, s = R() < 0.5 ? 1 : -1; if (along) K.bx(cx + t * w - w * 0.07, cx + t * w + w * 0.07, y + 0.1, y + 1.45, cz + s * (d / 2 + 0.1) - 0.03, cz + s * (d / 2 + 0.1) + 0.03, M.winLit); else K.bx(cx + s * (w / 2 + 0.1) - 0.03, cx + s * (w / 2 + 0.1) + 0.03, y + 0.1, y + 1.45, cz + t * d - d * 0.07, cz + t * d + d * 0.07, M.winLit); } }
    const n = Math.round(Math.max(w, d) / 4.2); for (let k = 0; k <= n; k++) { const t = k / n - 0.5; if (w > d) [-1, 1].forEach(s => K.bx(cx + t * w - 0.3, cx + t * w + 0.3, 0, h, cz + s * d / 2 - 0.14, cz + s * d / 2 + 0.14, ST)); else [-1, 1].forEach(s => K.bx(cx + s * w / 2 - 0.14, cx + s * w / 2 + 0.14, 0, h, cz + t * d - 0.3, cz + t * d + 0.3, ST)); }   // stone piers up the face
    K.bx(cx - w / 2 - 0.4, cx + w / 2 + 0.4, h, h + 1.2, cz - d / 2 - 0.4, cz + d / 2 + 0.4, STD); };
  // the two crosses
  [-21, 21].forEach(cx => { bar(cx, 0, 38, 13, H); bar(cx, 0, 13, 38, H); K.bx(cx - 5, cx + 5, H + 1.2, H + 5, -5, 5, STD); K.cyl(0.12, 0.12, 9, M.steel, cx, H + 9.5, 0, 6); K.sph(0.35, M.neonR, cx, H + 14.2, 0); });
  // the lower middle that joins them, the main doors in it, the canopy on its columns, the name over the doors
  bar(0, 2, 16, 15, FL * 6); K.bx(-9, 9, 0, 6.2, -6.2, -5.4, WIN); for (let k = 0; k < 7; k++) K.bx(-7.5 + k * 2.5 - 0.04, -7.5 + k * 2.5 + 0.04, 0, 6.2, -6.3, -6.1, M.steel); K.bx(-7, 7, 0.3, 5.6, -5.42, -5.38, M.winLit);
  K.bx(-11, 11, 6.6, 7.6, -13, -5.5, ST); K.bx(-11.3, 11.3, 7.6, 8.0, -13.3, -5.2, STD); [-9.6, -4.8, 0, 4.8, 9.6].forEach(x => K.cyl(0.55, 0.6, 6.6, ST, x, 3.3, -12.2, 14));
  K.mesh(L.paint(13, 2.0, (g, W, H2) => { g.fillStyle = '#d9cfbb'; g.fillRect(0, 0, W, H2); g.fillStyle = '#a8842e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${H2 * 0.5}px ${F.KAI}`; [...'臺北市政府'].forEach((c, i) => g.fillText(c, W * (0.18 + i * 0.16), H2 * 0.4)); g.font = `600 ${H2 * 0.17}px ${F.MING}`; g.fillText('T A I P E I   C I T Y   H A L L', W / 2, H2 * 0.82); }, { glow: 0.5, depth: 0.2, px: 1024 }), 0, 9.6, -13.35, Math.PI);
  for (let k = 0; k < 6; k++) K.bx(-13 - k * 0.6, 13 + k * 0.6, k * 0.0, 0.9 - k * 0.15, -14 - k * 0.9, -13.1 - k * 0.9, STD);                                                    // the steps down to the forecourt
  // the forecourt: paving, a row of flagpoles with pale pennants (no flag design is drawn), clipped trees, lamp globes
  K.bx(-46, 46, 0.02, 0.05, -44, -19, M.tm('#a79c8c', E.TEX.concrete, 0.3, 0.6)); for (let i = 0; i < 11; i++) { const x = -30 + i * 6; K.cyl(0.09, 0.12, 13, M.steel, x, 6.5, -24, 8); K.sph(0.16, M.gold, x, 13.1, -24); K.box(2.3, 1.4, 0.04, i % 2 ? M.whiteP : M.tm('#1c5a9a', E.TEX.concrete, 2, 0.8), x + 1.2, 12.0, -24, 0, 0, -0.06); }
  for (let i = 0; i < 12; i++) [-1, 1].forEach(s => { const x = s * (8 + i * 3.2), z = -30 - (i % 2) * 6; K.cyl(0.14, 0.18, 2.6, M.woodDk, x, 1.3, z, 7); K.sph(1.6, i % 2 ? M.leaf : M.leafDk, x, 3.8, z, 0.9); });
  for (let i = 0; i < 8; i++) { const x = -31.5 + i * 9; K.cyl(0.06, 0.08, 3.6, M.steelDk, x, 1.8, -20.5, 8); K.sph(0.3, M.bulb, x, 3.8, -20.5); }
  // the page scatters far towers at random round the block: the ones that would stand on City Hall or between it and the mall are taken out of the view
  E.scene.children.forEach(c => { if (c.isMesh && !c.name && c.geometry && (c.geometry.type === 'BoxGeometry' || c.geometry.type === 'SphereGeometry') && c.position.z > 106 && c.position.z < 230 && c.position.x > -75 && c.position.x < 95) c.visible = false; });
  const g = K.done(10, 148, 0);
  if (old) L.retarget(E, 'taipei-city-hall', g, old); else L.retarget(E, 'taipei-city-hall', g);
};
