// lm/xinyi-village44.js: 四四南村 on a courtyard plan. CJ, 2026-11-22: 「那些弱點也一起修掉」 (it was two rows and a lane; the grass could not be walked on).
// What is kept of the village is four low single-storey halls of grey plaster and dark tile round an open lawn, the grass mound on it, and Taipei 101
// standing over the roofs (measured: docs/places/xinyi.json 'four-four-south-village'; the four halls A to D are the 信義公民會館; which hall sits
// on which side, and their uses on the plates, are from memory, inferred). Here: a long north range (two halls), a west hall and a south hall round the
// lawn, open on the east toward the tower. Doors and window frames in the village's blue-green and brick red, door plates, rain pipes, washing lines,
// benches under a tree, weekend market tables, the carved name board at the way in. The lawn is walkable (WALK gets its rectangle); the old rows are hidden.
(window.LM = window.LM || {})['xinyi-village44'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('village44-courtyard'), F = L.FONTS, old = E.scene.children.find(c => c.name === 'village');
  const PL = M.tm('#b9b6ae', E.TEX.plaster, 0.5, 0.9), DAMP = M.tm('#7f7c76', E.TEX.concrete, 1, 0.95), TILE = M.tm('#3f4246', E.TEX.concrete, 2.2, 0.8), TEAL = M.std('#3f8a84', 0.6), BR = M.std('#a2452f', 0.7), PAINT = [TEAL, BR, TEAL, TEAL, BR];
  const Dp = 4.5, Hw = 2.7;
  const plate = (a, b) => L.paint(0.36, 0.22, (g, W, H) => { g.fillStyle = '#204a96'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f4ee'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${H * 0.24}px ${F.HEI}`; g.fillText(a, W / 2, H * 0.3); g.font = `800 ${H * 0.4}px ${F.HEI}`; g.fillText(b, W / 2, H * 0.68); }, { glow: 0.2, depth: 0.012, oneSide: true, px: 256 });
  const hallBoard = (id, zh, en) => L.paint(1.5, 0.5, (g, W, H) => { g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.08})`; g.fillRect(0, Math.random() * H, W, 2); } g.fillStyle = '#f3e6c6'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = `800 ${H * 0.62}px ${F.LI}`; g.fillText(id, W * 0.16, H * 0.5); g.fillRect(W * 0.3, H * 0.18, W * 0.006, H * 0.64);
    g.font = `700 ${H * 0.36}px ${F.KAI}`; g.fillText(zh, W * 0.65, H * 0.38, W * 0.62); g.font = `600 ${H * 0.15}px ${F.HEI}`; g.fillText(en, W * 0.65, H * 0.76, W * 0.62); }, { glow: 0.3, depth: 0.05, px: 512 });
  // one range: len along local x, the doors on +z. units of 4 m, each a door and a window in front and a window behind
  const range = (len, n0, halls) => { const n = Math.round(len / 4), fz = Dp / 2, bz = -Dp / 2;
    K.bx(-len / 2, len / 2, 0, Hw, bz, fz, PL); K.bx(-len / 2 - 0.04, len / 2 + 0.04, 0, 0.4, bz - 0.04, fz + 0.04, DAMP);
    const sl = Math.atan2(1.5, Dp / 2 + 0.5), sw = Math.hypot(1.5, Dp / 2 + 0.5); [-1, 1].forEach(s => K.box(len + 0.7, 0.1, sw, TILE, 0, Hw + 0.75, s * (Dp / 4 + 0.25), 0, s * sl)); K.bx(-len / 2 - 0.4, len / 2 + 0.4, Hw + 1.46, Hw + 1.6, -0.17, 0.17, M.concDk);
    for (let x = -len / 2 - 0.2; x < len / 2 + 0.3; x += 0.42) [-1, 1].forEach(s => K.box(0.07, 0.05, sw, M.concDk, x, Hw + 0.81, s * (Dp / 4 + 0.25), 0, s * sl));                                // the tile rolls
    [-1, 1].forEach(s => { for (let k = 0; k < 5; k++) K.bx(s * len / 2 - 0.03, s * len / 2 + 0.03, Hw + k * 0.3, Hw + (k + 1) * 0.3, -(Dp / 2) * (1 - k / 5), (Dp / 2) * (1 - k / 5), PL); K.box(0.08, 0.9, 0.7, M.woodDk, s * (len / 2 + 0.05), Hw + 0.55, 0); });   // gable ends and their vents
    [-1, 1].forEach(s => K.bx(-len / 2 - 0.35, len / 2 + 0.35, Hw - 0.08, Hw + 0.04, s * (Dp / 2 + 0.47) - 0.05, s * (Dp / 2 + 0.47) + 0.05, M.woodDk));
    for (let i = 0; i < n; i++) { const ux = -len / 2 + 2 + i * 4, pm = PAINT[(i + n0) % 5];
      K.bx(ux - 1.36, ux - 0.44, 0, 2.0, fz, fz + 0.07, pm); K.bx(ux - 1.46, ux - 0.34, 2.0, 2.12, fz, fz + 0.1, M.woodDk); [-1.46, -0.44].forEach(d => K.bx(ux + d, ux + d + 0.1, 0, 2.1, fz, fz + 0.1, M.woodDk)); K.bx(ux - 1.15, ux - 0.65, 1.48, 1.52, fz + 0.07, fz + 0.09, M.dark); K.sph(0.035, M.brass, ux - 0.6, 1.02, fz + 0.09); K.bx(ux - 1.6, ux - 0.2, 0, 0.14, fz, fz + 0.52, DAMP);
      K.bx(ux + 0.3, ux + 1.6, 1.1, 2.1, fz - 0.01, fz + 0.03, (i + n0) % 2 ? M.winLit : M.glass); [[0.26, 0.34], [1.56, 1.64], [0.91, 0.99]].forEach(([a, b]) => K.bx(ux + a, ux + b, 1.05, 2.15, fz, fz + 0.08, pm)); [[1.05, 1.13], [2.07, 2.15], [1.56, 1.62]].forEach(([a, b]) => K.bx(ux + 0.26, ux + 1.64, a, b, fz, fz + 0.08, pm)); K.bx(ux + 0.2, ux + 1.7, 0.98, 1.05, fz, fz + 0.16, DAMP);
      K.mesh(plate('松勤街', (n0 * 5 + i + 1) * 2 + ' 號'), ux - 0.9, 2.32, fz + 0.03); K.sph(0.05, M.bulb, ux - 0.1, 2.3, fz + 0.22); K.cyl(0.02, 0.12, 0.08, M.dark, ux - 0.1, 2.37, fz + 0.22, 8);
      K.cyl(0.045, 0.045, Hw, DAMP, ux + 1.95, Hw / 2, fz + 0.06, 6); K.bx(ux - 0.5, ux + 0.5, 1.3, 2.1, bz - 0.03, bz + 0.01, M.glass); K.bx(ux - 0.56, ux + 0.56, 1.24, 1.3, bz - 0.08, bz, pm); K.bx(ux - 0.56, ux + 0.56, 2.1, 2.16, bz - 0.08, bz, pm);
      if (i % 2 === 0) { K.cyl(0.2, 0.15, 0.3, BR, ux + 0.1, 0.15, fz + 0.32, 10); K.sph(0.26, M.leaf, ux + 0.1, 0.52, fz + 0.32, 1.2); } }
    (halls || []).forEach(([x, id, zh, en]) => { K.mesh(hallBoard(id, zh, en), x, 2.62, fz + 0.52); K.bx(x - 0.7, x - 0.66, 2.4, 2.8, fz, fz + 0.52, M.frame); K.bx(x + 0.66, x + 0.7, 2.4, 2.8, fz, fz + 0.52, M.frame); }); };
  K.at(-27.5, 0, -49.0, 0); range(20, 0, [[-7.1, 'B', '特展館', 'Exhibition Hall'], [4.9, 'C', '展演館', 'Performance Hall']]);
  K.at(-38.3, 0, -41.2, Math.PI / 2); range(8, 2, [[1.1, 'A', '社區館', 'Community Hall']]);
  K.at(-29.5, 0, -36.2, Math.PI); range(12, 3, [[-1.1, 'D', '眷村展示館', 'Village Museum']]);
  K.at();
  // the courtyard: stone paving, the lawn and its mound, a path across
  K.bx(-36, -13.2, 0.03, 0.06, -46.7, -38.4, M.tm('#8f8c86', E.TEX.concrete, 0.6, 0.9)); K.bx(-23, -13.2, 0.03, 0.06, -38.4, -34.9, M.tm('#8f8c86', E.TEX.concrete, 0.6, 0.9));
  K.cyl(1, 1, 0.05, M.grass, -25.5, 0.075, -42.6, 28, null); K.sph(0.5, M.grass, -25.5, 0.06, -42.6, 0.012, 13.6, 6.6); K.sph(0.5, M.grass, -22.6, 0.05, -42.5, 0.24, 5.6, 4.6);
  // a tree with a ring bench, washing on a line, an old water vat, two market tables, a bicycle, benches
  K.cyl(0.24, 0.34, 3.0, M.woodDk, -33.2, 1.5, -44.6, 9); [[0, 4.4, 0, 2.2], [1.4, 3.9, 0.6, 1.6], [-1.3, 4.0, -0.5, 1.7], [0.3, 5.3, -0.9, 1.5], [-0.5, 5.0, 1.1, 1.5]].forEach(([dx, y, dz, r], i) => K.sph(r, i % 2 ? M.leafDk : M.leaf, -33.2 + dx, y, -44.6 + dz, 0.8));
  for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; K.box(0.62, 0.06, 0.4, M.wood, -33.2 + Math.cos(a) * 0.95, 0.46, -44.6 + Math.sin(a) * 0.95, -a + Math.PI / 2); K.box(0.06, 0.44, 0.06, M.woodDk, -33.2 + Math.cos(a) * 0.95, 0.24, -44.6 + Math.sin(a) * 0.95); }
  K.rod(M.black, [-35.9, 2.45, -39.0], [-30.2, 2.45, -38.5], 0.01, 4); [M.whiteP, M.tealP, M.pinkP, M.creamP, M.navy].forEach((c, i) => K.box(0.6, 0.75 + (i % 2) * 0.15, 0.02, c, -35.2 + i * 1.05, 2.05 - (i % 2) * 0.07, -38.94 + i * 0.09, 0.09));
  K.cyl(0.36, 0.27, 0.62, BR, -35.2, 0.31, -46.2, 12); K.cyl(0.32, 0.32, 0.02, M.glassBlue, -35.2, 0.58, -46.2, 12);
  [[-18.6, -45.2, 0.15], [-15.8, -45.0, -0.1]].forEach(([x, z, ry], i) => { K.at(x, 0, z, ry); [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]].forEach(([a, b]) => K.cyl(0.02, 0.02, 2.1, M.chrome, a, 1.05, b, 6)); K.cyl(0.02, 1.36, 0.6, M.whiteP, 0, 2.4, 0, 4, [0, Math.PI / 4, 0]);
    K.bx(-0.8, 0.8, 0.72, 0.76, -0.35, 0.35, M.wood); K.bx(-0.82, 0.82, 0.3, 0.74, 0.33, 0.35, i ? M.tealP : M.creamP); for (let n = 0; n < 10; n++) K.box(0.16, 0.05 + (n % 3) * 0.04, 0.18, [M.red, M.yellow, M.tealP, M.pinkP, M.creamP][n % 5], -0.66 + (n % 5) * 0.33, 0.8, -0.14 + Math.floor(n / 5) * 0.28, n); K.at(); });
  [[-28.5, -46.2, 0], [-20.5, -39.2, Math.PI]].forEach(([x, z, ry]) => { K.box(1.5, 0.06, 0.4, M.wood, x, 0.44, z, ry); [-0.6, 0.6].forEach(d => K.box(0.1, 0.44, 0.38, DAMP, x + d, 0.22, z)); });
  // the way in: the carved name board on its timber frame, a low brick wall with the village's number
  [-1.15, 1.15].forEach(d => K.bx(-14.4 + d - 0.07, -14.4 + d + 0.07, 0, 2.4, -35.4, -35.26, M.woodDk)); K.bx(-15.75, -13.05, 2.3, 2.44, -35.45, -35.2, M.woodDk);
  K.mesh(L.paint(2.06, 1.3, (g, W, H) => { g.fillStyle = '#4a3220'; g.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.08})`; g.fillRect(0, Math.random() * H, W, 2); } g.fillStyle = '#f3e6c6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${H * 0.34}px ${F.LI}`; [...'四四南村'].forEach((c, i) => g.fillText(c, W * (0.2 + i * 0.2), H * 0.34)); g.font = `700 ${H * 0.13}px ${F.KAI}`; g.fillText('信義公民會館', W / 2, H * 0.68); g.font = `600 ${H * 0.08}px ${F.HEI}`; g.fillText('Xinyi Public Assembly Hall · 1948', W / 2, H * 0.86); }, { glow: 0.35, depth: 0.1, px: 1024 }), -14.4, 1.55, -35.33, 0);
  K.bx(-22.9, -16.2, 0, 0.7, -35.0, -34.78, BR); K.bx(-22.95, -16.15, 0.7, 0.78, -35.03, -34.75, DAMP);
  const g = K.done(0, 0, 0);
  L.retarget(E, 'four-four-south-village', g, old, { near: [-23.5, -41.5], radius: 7.5 });
  // walking: drop the old rows' boxes, add the three ranges, open the courtyard
  try { for (let i = SOLID.length - 1; i >= 0; i--) { const s = SOLID[i]; if ((Math.abs(s[0] + 26) < 0.01 && Math.abs(s[1] + 39.5) < 0.01) || (Math.abs(s[0] + 14.2) < 0.01 && Math.abs(s[1] + 36.65) < 0.01)) SOLID.splice(i, 1); }
    SOLID.push([-29.5, -36.2, 6.5, 2.75], [-38.3, -41.2, 2.75, 4.6], [-14.4, -35.33, 1.6, 0.4], [-33.2, -44.6, 1.5, 1.5], [-18.6, -45.2, 1.3, 0.9], [-15.8, -45.0, 1.3, 0.9]);
    WALK.push([-35.6, -13, -46.3, -38.9]); } catch (err) { console.warn('[village44] walk area not opened: ' + err); }
};
