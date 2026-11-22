// lm/ximen-exit6.js: 捷運西門站6號出口, rebuilt as a real exit. CJ, 2026-11-22: 「那些弱點也一起修掉」 (the old stair was a painted illusion on flat ground).
// What is here: a well cut into the paving, with a real stair going down beside an escalator (the 2025 press line 「搭乘捷運西門站6號出口手扶梯，
// 一踏出捷運口即是西門町」: measured, escalator), tiled walls, handrails on both sides and down the middle, yellow nosings, a lit concourse mouth at
// the bottom; granite parapets with glass and a steel rail round the well; a vaulted steel-and-glass canopy that catches the evening light; the blue
// 板南線 station fascia with the yellow exit number; the pylon; a neighbourhood map case; a glass lift (inferred: a travel guide says Exit 6 has one,
// no official page opened); tactile paving to the mouth. No operator logo is drawn. The old group is hidden, its footprint and plaque are kept.
(window.LM = window.LM || {})['ximen-exit6'] = function (E) {
  const L = window.LMK; if (!L) return;
  const T = E.T, M = L.mats(E), K = L.kit('exit6-real'), F = L.FONTS, hw = 1.9, z0 = -4.4, z1 = 2.6, D = 4.6;                         // D: how deep the concourse floor lies
  const old = E.scene.children.find(c => c.name === 'pedestrian-zone-exit6'), X = -11, Z = 53.5;
  // the well: cut the paving, line the hole
  L.hole(E, X - (hw - 0.25), X + (hw - 0.25), Z - (z1 + 0.05), Z - (z0 + 0.25));
  const xi = hw - 0.25, tile = M.tileW, band = M.mrt;
  K.bx(-xi - 0.12, -xi, -D, 0, z0 + 0.25, z1, tile); K.bx(xi, xi + 0.12, -D, 0, z0 + 0.25, z1, tile); K.bx(-xi, xi, -D, 0, z0 + 0.13, z0 + 0.25, tile);          // side and end walls
  K.bx(-xi, -xi + 0.01, -D, 0, z0 + 0.25, z1, tile); [-1.1, -2.3, -3.5].forEach(y => { K.bx(-xi, -xi + 0.015, y, y + 0.12, z0 + 0.25, z1, band); K.bx(xi - 0.015, xi, y, y + 0.12, z0 + 0.25, z1, band); });   // the line's blue band along the walls
  K.bx(-xi, xi, -D - 0.1, -D, z0 + 0.25, z1 + 0.1, M.terrazzo);                                                                                    // the concourse floor
  K.bx(-xi, xi, -D, -D + 2.6, z0 + 0.26, z0 + 0.3, M.winLit); K.bx(-xi, xi, -D + 2.6, -D + 3.0, z0 + 0.25, z0 + 0.34, M.frame);                      // the lit mouth of the concourse
  K.mesh(L.label('西門站　Ximen Station', 2.4, 0.3, { bg: '#0a59a4', fg: '#ffffff', glow: 1.1, depth: 0.03, oneSide: true }), 0, -D + 2.8, z0 + 0.36);
  // the stair: 23 risers of 0.2 m, a landing half-way, yellow nosings
  const sx0 = -xi, sx1 = -0.12, run = 0.27, rise = D / 24, top = z1 - 0.25;
  let z = top, y = 0;
  for (let i = 0; i < 24; i++) { if (i === 12) { K.bx(sx0, sx1, y - 0.08, y, z - 0.9, z, M.granite); z -= 0.9; continue; }                                 // the half landing
    y -= rise; K.bx(sx0, sx1, y - 0.5, y, z - run, z, M.granite); K.bx(sx0, sx1, y, y + 0.012, z - 0.05, z, M.yellow); z -= run; }
  K.bx(sx0, sx1, -0.02, 0.0, top, z1, M.granite);
  const zEnd = z, slope = Math.atan2(D, top - zEnd), len = Math.hypot(D, top - zEnd), mz = (top + zEnd) / 2;
  // handrails: wall side, well side, and one down the middle of the stair, on posts
  [[sx0 + 0.08, 0], [sx1 - 0.04, 0], [(sx0 + sx1) / 2, 1]].forEach(([x, posts]) => { K.rod(M.chrome, [x, 0.92, top], [x, 0.92 - D, zEnd], 0.024, 8); K.rod(M.chrome, [x, 0.92, top], [x, 0.92, top + 0.3], 0.024, 8);
    if (posts) for (let k = 0; k <= 6; k++) { const t = k / 6, pz = top + (zEnd - top) * t, py = -D * t; K.rod(M.chrome, [x, py, pz], [x, py + 0.92, pz], 0.018, 6); }
    else for (let k = 0; k <= 8; k++) { const t = k / 8, pz = top + (zEnd - top) * t, py = 0.92 - D * t; K.rod(M.chrome, [x, py, pz], [x + (x < (sx0 + sx1) / 2 ? -0.07 : 0.07), py - 0.05, pz], 0.012, 5); } });
  // the escalator: truss, steps with yellow edges, glass balustrades, black handrails, comb plates
  const ex0 = 0.12, ex1 = xi - 0.1, ec = (ex0 + ex1) / 2, ew = ex1 - ex0;
  K.box(ew, 0.5, len + 0.6, M.steelDk, ec, -D / 2 - 0.34, mz, 0, -slope);
  for (let i = 0; i < 30; i++) { const t = (i + 0.5) / 30, pz = top + (zEnd - top) * t, py = -D * t; K.bx(ex0 + 0.16, ex1 - 0.16, py - 0.16, py - 0.02, pz - 0.2, pz + 0.2, M.rubber); K.bx(ex0 + 0.16, ex1 - 0.16, py - 0.02, py - 0.008, pz + 0.16, pz + 0.2, M.yellow); }
  [ex0 + 0.08, ex1 - 0.08].forEach(x => { K.box(0.025, 0.72, len + 0.2, M.pane, x, -D / 2 + 0.42, mz, 0, -slope); K.box(0.085, 0.07, len + 0.5, M.rubber, x, -D / 2 + 0.82, mz, 0, -slope); K.box(0.14, 0.16, len + 0.5, M.chrome, x, -D / 2 + 0.03, mz, 0, -slope);
    K.box(0.085, 0.07, 0.9, M.rubber, x, 0.82, top + 0.45); K.box(0.025, 0.72, 0.9, M.pane, x, 0.42, top + 0.45); K.box(0.14, 0.16, 0.9, M.chrome, x, 0.06, top + 0.45); K.cyl(0.07, 0.07, 0.09, M.rubber, x, 0.8, top + 0.9, 10, [0, 0, Math.PI / 2]); });
  K.bx(ex0, ex1, -0.03, 0.012, top, top + 0.95, M.chrome); for (let i = 0; i < 9; i++) K.bx(ex0 + 0.2 + i * (ew - 0.4) / 9, ex0 + 0.2 + i * (ew - 0.4) / 9 + 0.02, 0.012, 0.018, top + 0.05, top + 0.9, M.steelDk);   // the landing plate and its grooves
  K.bx(ex0 + 0.16, ex1 - 0.16, 0.012, 0.02, top - 0.02, top + 0.06, M.yellow);
  K.bx(-0.12, 0.12, -D, 0.0, zEnd - 0.2, top + 0.0, M.tileW); K.bx(-0.13, 0.13, 0, 0.9, top - 0.4, top + 0.95, M.granite); K.bx(-0.15, 0.15, 0.9, 0.96, top - 0.42, top + 0.97, M.graniteDk);                 // the wall between stair and escalator
  // round the well at street level: granite parapets, glass above, a steel rail on top
  const wall = (xa, xb, za, zb) => { K.bx(xa, xb, 0, 0.62, za, zb, M.granite); K.bx(xa - 0.03, xb + 0.03, 0.62, 0.7, za - 0.03, zb + 0.03, M.graniteDk); };
  wall(-hw, -hw + 0.25, z0, z1); wall(hw - 0.25, hw, z0, z1); wall(-hw, hw, z0, z0 + 0.25);
  [[-hw + 0.125, z0 + 0.3, -hw + 0.125, z1 - 0.1], [hw - 0.125, z0 + 0.3, hw - 0.125, z1 - 0.1], [-hw + 0.3, z0 + 0.125, hw - 0.3, z0 + 0.125]].forEach(([xa, za, xb, zb]) => { const along = Math.abs(xb - xa) > 0.01, n = along ? 3 : 5;
    for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, ax = xa + (xb - xa) * t0, az = za + (zb - za) * t0, bx = xa + (xb - xa) * t1, bz = za + (zb - za) * t1;
      if (along) K.bx(ax + 0.03, bx - 0.03, 0.72, 1.3, az - 0.012, az + 0.012, M.pane); else K.bx(ax - 0.012, ax + 0.012, 0.72, 1.3, az + 0.03, bz - 0.03, M.pane);
      K.rod(M.chrome, [ax, 0.7, az], [ax, 1.36, az], 0.022, 6); if (k === n - 1) K.rod(M.chrome, [bx, 0.7, bz], [bx, 1.36, bz], 0.022, 6); }
    K.rod(M.chrome, [xa, 1.36, za], [xb, 1.36, zb], 0.028, 8); });
  // the canopy: six posts, arched steel ribs, glass between them, a ridge and two eaves beams
  const cw = hw + 0.35, ey = 3.05, rz0 = z0 - 0.35, rz1 = z1 + 1.15, ribs = 7, glassM = Object.assign(M.clear('#bfe6f2', 0.5, 0.08), { emissive: E.col('#ffb46a'), emissiveIntensity: 0.16 });
  [[-hw + 0.12, z0 + 0.12], [hw - 0.12, z0 + 0.12], [-hw + 0.12, -0.9], [hw - 0.12, -0.9], [-hw + 0.12, z1 - 0.12], [hw - 0.12, z1 - 0.12]].forEach(([x, pz]) => { K.cyl(0.075, 0.075, ey - 0.7, M.steel, x, 0.7 + (ey - 0.7) / 2, pz, 12); K.cyl(0.12, 0.12, 0.06, M.steelDk, x, 0.73, pz, 12); K.rod(M.steel, [x, ey - 0.5, pz], [x < 0 ? -cw : cw, ey, pz], 0.035, 6); });
  const R = 3.0, half = Math.asin(cw / R), cyc = ey - R * Math.cos(half);                                                                           // a shallow barrel vault across the well
  for (let i = 0; i < ribs; i++) { const rzz = rz0 + (rz1 - rz0) * i / (ribs - 1); L.arch(K, M.steel, 0, cyc, rzz - 0.04, rzz + 0.04, R, 0.09, Math.PI / 2 - half, Math.PI / 2 + half, 10); }
  for (let i = 0; i < ribs - 1; i++) { const za = rz0 + (rz1 - rz0) * i / (ribs - 1) + 0.05, zb = rz0 + (rz1 - rz0) * (i + 1) / (ribs - 1) - 0.05; L.arch(K, glassM, 0, cyc, za, zb, R + 0.03, 0.02, Math.PI / 2 - half, Math.PI / 2 + half, 8); }
  [-1, 0, 1].forEach(k => { const a = Math.PI / 2 + k * half, x = Math.cos(a) * (R + 0.05), yy = cyc + Math.sin(a) * (R + 0.05); K.bx(x - 0.05, x + 0.05, yy - 0.06, yy + 0.06, rz0 - 0.1, rz1 + 0.1, M.steel); });
  [-0.5, 0.5].forEach(k => { const a = Math.PI / 2 + k * half, x = Math.cos(a) * (R + 0.02), yy = cyc + Math.sin(a) * (R + 0.02); K.bx(x - 0.025, x + 0.025, yy - 0.03, yy + 0.03, rz0, rz1, M.steel); });
  K.bx(-0.04, 0.04, cyc + R - 0.14, cyc + R - 0.08, z0 + 0.4, z1 + 0.6, M.tube);                                                                    // the light under the ridge
  // the station fascia over the mouth: the line's blue, the name in two languages, the yellow exit disc
  K.mesh(L.paint(3.5, 0.62, (g, W, H) => { g.fillStyle = '#0a59a4'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `700 ${H * 0.46}px ${F.HEI}`; g.fillText('西門站', W * 0.2, H * 0.36);
    g.font = `600 ${H * 0.22}px ${F.HEI}`; g.fillText('Ximen Station', W * 0.2, H * 0.76); g.textAlign = 'right'; g.font = `700 ${H * 0.3}px ${F.HEI}`; g.fillText('出口 Exit', W * 0.96, H * 0.36); g.font = `600 ${H * 0.19}px ${F.HEI}`; g.fillText('西門町徒步區 · 西門紅樓', W * 0.96, H * 0.76);
    g.fillStyle = '#ffd400'; g.beginPath(); g.arc(W * 0.095, H * 0.5, H * 0.38, 0, 7); g.fill(); g.fillStyle = '#111'; g.textAlign = 'center'; g.font = `900 ${H * 0.56}px ${F.HEI}`; g.fillText('6', W * 0.095, H * 0.54); }, { glow: 1.0, depth: 0.08, px: 1024 }), 0, 2.62, z1 - 0.1);
  K.bx(-hw + 0.1, hw - 0.1, 2.28, 2.31, z1 - 0.16, z1 - 0.04, M.steelDk);
  // the pylon: a dark post, the lit station box, the exit disc (where the old one stood, so the plaque stays on it)
  const px = -hw - 1.1; K.bx(px - 0.42, px + 0.42, 0, 0.16, z1 - 0.32, z1 + 0.12, M.graniteDk); K.bx(px - 0.34, px + 0.34, 0.16, 3.7, z1 - 0.24, z1 + 0.02, M.frame); K.bx(px - 0.36, px + 0.36, 3.7, 3.76, z1 - 0.26, z1 + 0.04, M.chrome);
  K.mesh(L.label('西門', 0.56, 1.5, { vertical: true, bg: '#0a59a4', fg: '#ffffff', sub: 'Ximen', glow: 1.0, depth: 0.03, oneSide: true, weight: 800 }), px, 2.05, z1 + 0.035);
  K.mesh(L.paint(0.56, 0.56, (g, W, H) => { g.fillStyle = '#26262a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd400'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.43, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = `900 ${H * 0.62}px ${F.HEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('6', W / 2, H * 0.54); }, { glow: 1.0, depth: 0.03, oneSide: true, px: 256 }), px, 3.25, z1 + 0.035);
  // the neighbourhood map case on the outer wall, and the last-train plate
  K.mesh(L.paint(1.3, 0.95, (g, W, H) => { g.fillStyle = '#f3efe4'; g.fillRect(0, 0, W, H); g.fillStyle = '#0a59a4'; g.fillRect(0, 0, W, H * 0.14); g.fillStyle = '#fff'; g.font = `700 ${H * 0.085}px ${F.HEI}`; g.textBaseline = 'middle'; g.fillText('西門站周邊街道圖　Vicinity Map', W * 0.03, H * 0.075);
    g.strokeStyle = '#c9c2b0'; g.lineWidth = H * 0.035; [[0.1, 0.3, 0.95, 0.3], [0.1, 0.62, 0.95, 0.62], [0.3, 0.18, 0.3, 0.95], [0.62, 0.18, 0.62, 0.95], [0.82, 0.18, 0.82, 0.95]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(W * a, H * b); g.lineTo(W * c, H * d); g.stroke(); });
    g.fillStyle = '#d9d2bd'; [[0.33, 0.33, 0.27, 0.27], [0.65, 0.33, 0.15, 0.27], [0.33, 0.66, 0.27, 0.26], [0.04, 0.33, 0.24, 0.27], [0.65, 0.66, 0.15, 0.26]].forEach(([a, b, c, d]) => g.fillRect(W * a, H * b, W * c, H * d));
    g.fillStyle = '#b3271e'; g.beginPath(); g.arc(W * 0.3, H * 0.62, H * 0.035, 0, 7); g.fill(); g.fillStyle = '#333'; g.font = `600 ${H * 0.055}px ${F.HEI}`; [['成都路', 0.44, 0.3], ['漢中街', 0.3, 0.9], ['峨眉街', 0.44, 0.62], ['西門紅樓', 0.12, 0.47], ['中華路', 0.86, 0.9], ['現在位置', 0.33, 0.56]].forEach(([t, a, b]) => g.fillText(t, W * a, H * b)); }, { glow: 0.7, depth: 0.05, oneSide: true }), hw + 0.03, 1.5, 0.6, Math.PI / 2);
  K.bx(hw, hw + 0.05, 0.98, 2.02, -0.1, 1.3, M.chrome);
  // the lift (inferred): a glass shaft in a steel frame, the door on the plaza side, the wheelchair plate
  const lx0 = hw + 0.55, lx1 = hw + 2.25, lz0 = z0 + 0.35, lz1 = z0 + 2.05;
  K.bx(lx0 - 0.08, lx1 + 0.08, 0, 0.28, lz0 - 0.08, lz1 + 0.08, M.granite); K.bx(lx0, lx1, 0.28, 3.05, lz0, lz1, M.paneBlue); K.bx(lx0 - 0.1, lx1 + 0.1, 3.05, 3.3, lz0 - 0.1, lz1 + 0.5, M.steel);
  [[lx0, lz0], [lx1 - 0.07, lz0], [lx0, lz1 - 0.07], [lx1 - 0.07, lz1 - 0.07]].forEach(([x, pz]) => K.bx(x, x + 0.07, 0.28, 3.05, pz, pz + 0.07, M.steel)); [1.2, 2.1].forEach(yy => { K.bx(lx0, lx1, yy, yy + 0.05, lz0, lz0 + 0.05, M.steel); K.bx(lx0, lx0 + 0.05, yy, yy + 0.05, lz0, lz1, M.steel); K.bx(lx1 - 0.05, lx1, yy, yy + 0.05, lz0, lz1, M.steel); });
  K.bx(lx0 + 0.3, lx1 - 0.3, 0.28, 2.4, lz1 - 0.02, lz1 + 0.04, M.chrome); K.bx((lx0 + lx1) / 2 - 0.006, (lx0 + lx1) / 2 + 0.006, 0.28, 2.4, lz1 + 0.04, lz1 + 0.045, M.steelDk); K.bx(lx0 + 0.3, lx1 - 0.3, 2.4, 2.7, lz1 - 0.02, lz1 + 0.05, M.frame);
  K.bx(lx1 - 0.24, lx1 - 0.12, 1.0, 1.3, lz1 + 0.0, lz1 + 0.06, M.chrome); K.bx(lx1 - 0.2, lx1 - 0.16, 1.18, 1.22, lz1 + 0.06, lz1 + 0.07, M.neonG);
  K.mesh(L.paint(0.36, 0.36, (g, W, H) => { g.fillStyle = '#0a59a4'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = W * 0.07; g.lineCap = 'round'; g.beginPath(); g.arc(W * 0.47, H * 0.24, W * 0.07, 0, 7); g.fill();
    g.beginPath(); g.moveTo(W * 0.46, H * 0.36); g.lineTo(W * 0.48, H * 0.58); g.lineTo(W * 0.68, H * 0.58); g.lineTo(W * 0.76, H * 0.8); g.stroke(); g.beginPath(); g.arc(W * 0.44, H * 0.66, W * 0.2, 0.5, 4.6); g.stroke(); }, { glow: 0.9, depth: 0.03, oneSide: true, px: 256 }), (lx0 + lx1) / 2, 2.55, lz1 + 0.07);
  K.bx(lx0 + 0.2, lx1 - 0.2, 0, 0.3, lz1 + 0.08, lz1 + 1.3, M.granite); K.box(lx1 - lx0 - 0.4, 0.04, 1.3, M.granite, (lx0 + lx1) / 2, 0.15, lz1 + 1.9, 0, 0.23);                                    // the ramp up to the lift door
  // tactile paving from the plaza to the mouth, and a drain slot across it
  for (let i = 0; i < 8; i++) K.bx(-1.15, -0.85, 0.012, 0.022, z1 + 0.2 + i * 0.3, z1 + 0.48 + i * 0.3, M.yellow); K.bx(-xi, xi, 0.008, 0.016, z1 + 0.02, z1 + 0.14, M.steelDk);
  const g = K.done(X, Z, Math.PI);
  L.retarget(E, 'pedestrian-zone-exit6', g, old);
};
