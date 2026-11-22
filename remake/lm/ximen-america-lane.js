// lm/ximen-america-lane.js: 美國街 (昆明街96巷), opened as a lane she can walk into. CJ, 2026-11-22: 「那些弱點也一起修掉」 (it was a painted mouth she could not enter).
// The real lane is where 西門町's imported American street clothes were sold from the 1980s: jeans, jerseys, sneakers and caps hung out into the alley,
// and it is now the district's graffiti lane, walls and shutters painted end to end (measured: docs/places/ximen.json and its sources; the look of each
// wall is inferred, no photo opened in this pass). Here: 14 m of open lane, five fronts a side with half-raised painted shutters, racks of jeans and
// tees, sneaker walls, cap stands, stacked crates, a hoop and a painted key at the end wall under a big piece, bunting and a line of sneakers overhead,
// a spray-can still life. Shop names are invented trade names (guess); no brand, logo or team mark is drawn. The old mouth is hidden.
(window.LM = window.LM || {})['ximen-america-lane'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('america-lane'), F = L.FONTS, hw = 1.5, LEN = 14, old = E.scene.children.find(c => c.name === 'american-street'), X = old ? old.position.x : 23.5, Z = old ? old.position.z : 40;
  let sd = 1980; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, rr = (a, b) => a + (b - a) * R(), pick = a => a[Math.floor(R() * a.length)];
  const CONC = M.tm('#8f8a80', E.TEX.concrete, 1.2, 0.95), DENIM = ['#2f4f7f', '#3f6a9a', '#1f2f4f', '#5a7fa8', '#22262e'].map(c => M.std(c, 0.9)), TEE = ['#e9e2d2', '#d8473a', '#1e1f24', '#e8c23e', '#3d6fb0', '#6fa58a', '#f0a48c'].map(c => M.std(c, 0.9));
  const HOT = ['#ff3d7f', '#ffd23f', '#3ddcff', '#7dff6a', '#ff7a1a', '#b98cff', '#ffffff'];
  // a graffiti piece: a wild fill, bubble letters with an outline and a shine, drips, stars and arrows
  const piece = (words, base, seed) => (g, W, H) => { let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { g.fillStyle = HOT[Math.floor(r() * 6)]; g.globalAlpha = 0.5; g.beginPath(); g.arc(r() * W, r() * H, W * (0.03 + r() * 0.12), 0, 7); g.fill(); } g.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const x = r() * W, y = r() * H * 0.3; g.fillStyle = HOT[Math.floor(r() * 6)]; g.fillRect(x, y, W * 0.008, H * (0.1 + r() * 0.3)); }
    words.forEach((w, i) => { const y = H * ((i + 0.55) / words.length), size = Math.min(H / words.length * 0.74, W * 1.5 / Math.max(2, [...w].length)); g.save(); g.translate(W / 2, y); g.rotate((r() - 0.5) * 0.16); g.font = `900 ${size}px "Arial Black","PingFang TC",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = size * 0.26; g.strokeStyle = '#111'; g.strokeText(w, size * 0.05, size * 0.06, W * 0.92); g.lineWidth = size * 0.13; g.strokeStyle = '#fff'; g.strokeText(w, 0, 0, W * 0.92);
      const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, HOT[(i * 2 + seed) % 6]); gr.addColorStop(1, HOT[(i * 2 + seed + 3) % 6]); g.fillStyle = gr; g.fillText(w, 0, 0, W * 0.92); g.restore(); });
    for (let i = 0; i < 5; i++) { const x = r() * W, y = r() * H, q = W * 0.03; g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rad = k % 2 ? q * 0.45 : q; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } g.fill(); } };
  // the lane: concrete floor with a painted centre line of footprints, side walls two storeys high, the end wall
  K.bx(-hw + 0.04, hw - 0.04, 0.006, 0.016, -LEN, 0.4, M.tm('#6a665e', E.TEX.concrete, 2, 0.9)); for (let i = 0; i < 22; i++) K.box(0.11, 0.004, 0.26, i % 2 ? M.yellow : M.whiteP, (i % 2 ? 0.16 : -0.16), 0.019, -0.4 - i * 0.6, 0.15 * (i % 2 ? 1 : -1));
  [-1, 1].forEach(s => K.bx(s * hw, s * (hw - 0.05), 0, 6.2, -LEN, 0, CONC)); K.bx(-hw, hw, 0, 6.2, -LEN - 0.06, -LEN, CONC);
  // the mouth: a steel gantry with the lane's name sprayed across it, and a strip of bunting
  [-1, 1].forEach(s => { K.bx(s * hw - 0.08, s * hw + 0.08, 0, 4.2, -0.08, 0.08, M.steelDk); K.rod(M.steelDk, [s * hw, 3.2, 0], [s * (hw - 0.7), 4.1, 0], 0.03, 6); }); K.bx(-hw, hw, 3.3, 4.2, -0.05, 0.05, M.black);
  K.mesh(L.paint(2.86, 0.86, piece(['美國街'], '#16213c', 7), { glow: 0.9, depth: 0.06, px: 1024 }), 0, 3.75, 0.06); K.mesh(L.label('AMERICAN STREET · 昆明街96巷', 2.4, 0.15, { bg: '#111', fg: '#ffd23f', glow: 1.1, depth: 0.02, oneSide: true, weight: 800 }), 0, 3.22, 0.07);
  for (let row = 0; row < 4; row++) { const z = -1.6 - row * 3.4, y0 = 5.0 - (row % 2) * 0.3; K.rod(M.black, [-hw, y0, z], [hw, y0, z - 0.5], 0.008, 4); for (let i = 0; i < 11; i++) { const t = (i + 0.5) / 11; K.box(0.2, 0.26, 0.008, [M.red, M.whiteP, M.blue][i % 3], -hw + t * 2 * hw, y0 - 0.15 - Math.sin(t * Math.PI) * 0.12, z - t * 0.5, 0.17, 0, Math.PI / 4); } }
  // a line of sneakers thrown over the wire
  K.rod(M.black, [-hw, 4.3, -6.2], [hw, 4.25, -6.6], 0.008, 4); [[-0.5, 0], [0.2, 1], [0.7, 2]].forEach(([x, c]) => { K.rod(M.whiteP, [x, 4.28, -6.4], [x, 3.92, -6.4], 0.005, 4); [-0.05, 0.05].forEach(d => { K.box(0.09, 0.08, 0.24, TEE[c * 2], x + d, 3.86, -6.4, d * 6, 0.5); K.box(0.095, 0.025, 0.25, M.whiteP, x + d, 3.815, -6.4, d * 6, 0.5); }); });
  // the fronts: five a side, each a painted shutter half up over a lit shop, a light-box name, goods spilling into the lane
  const SHOPS = [['牛仔倉庫', 'JEANS DEPOT', '#1f3f7f'], ['街頭籃球', 'STREETBALL', '#c9361e'], ['舶來品', 'U.S. IMPORT', '#14532d'], ['滑板公園', 'SKATE SHOP', '#111111'], ['球鞋牆', 'SNEAKER WALL', '#e8a81e'], ['嘻哈唱片', 'HIP HOP RECORDS', '#5a1f7a'], ['二手古著', 'VINTAGE', '#7a4a1e'], ['帽子專門', 'CAPS', '#0f4c5c'], ['軍用品', 'SURPLUS', '#3f4a2a'], ['塗鴉噴漆', 'SPRAY SUPPLY', '#b0125a']];
  const WORDS = [['WEST', 'SIDE'], ['西門', 'FRESH'], ['TPE', '1988'], ['YO!', '街頭'], ['KEEP', 'REAL'], ['美國街'], ['BOOM', 'BAP'], ['XIMEN'], ['B-BOY'], ['酷']];
  const U = (LEN - 0.8) / 5;
  [-1, 1].forEach((s, si) => { for (let i = 0; i < 5; i++) { const n = i * 2 + si, z = -0.6 - U * (i + 0.5), x = s * (hw - 0.05), ry = -s * Math.PI / 2, sh = SHOPS[n], open = 1.25 + (n % 3) * 0.35;
    K.bx(x - s * 0.02, x, 0, 3.0, z - U / 2 + 0.12, z + U / 2 - 0.12, M.shopLit); K.bx(x - s * 0.08, x, 0, 3.1, z - U / 2 + 0.04, z - U / 2 + 0.14, M.steelDk); K.bx(x - s * 0.1, x, 3.0, 3.12, z - U / 2 + 0.04, z + U / 2 - 0.04, M.steelDk);
    K.mesh(L.paint(U - 0.26, 3.0 - open, piece(WORDS[n], pick(['#2a2a30', '#1b2a4a', '#3a1a2a', '#14332a']), n * 13 + 5), { glow: 0.4, depth: 0.05, oneSide: true }), x - s * 0.07, open + (3.0 - open) / 2, z, ry);          // the shutter, sprayed
    for (let k = 0; k < 6; k++) K.bx(x - s * 0.105, x - s * 0.095, open + 0.1 + k * (3.0 - open - 0.15) / 6, open + 0.115 + k * (3.0 - open - 0.15) / 6, z - U / 2 + 0.14, z + U / 2 - 0.14, M.steelDk);
    K.mesh(L.paint(U - 0.5, 0.56, (g, W, H) => { g.fillStyle = sh[2]; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, H * 0.86, W, H * 0.05); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = sh[2] === '#e8a81e' ? '#111' : '#fff'; g.font = `900 ${H * 0.5}px ${F.HEI}`; g.fillText(sh[0], W * 0.3, H * 0.44, W * 0.5); g.font = `900 ${H * 0.24}px "Arial Black",sans-serif`; g.fillText(sh[1], W * 0.74, H * 0.46, W * 0.46); }, { glow: 1.0, depth: 0.1, px: 512 }), x - s * 0.1, 3.45, z, ry);
    // what each shop puts out
    const gx = s * (hw - 0.42);
    if (n % 5 === 0 || n % 5 === 2) { K.rod(M.chrome, [gx, 0, z - 0.75], [gx, 1.7, z - 0.75], 0.018, 6); K.rod(M.chrome, [gx, 0, z + 0.75], [gx, 1.7, z + 0.75], 0.018, 6); K.rod(M.chrome, [gx, 1.68, z - 0.78], [gx, 1.68, z + 0.78], 0.018, 6);
      for (let k = 0; k < 10; k++) { const jean = n % 5 === 0; K.box(0.42, jean ? 1.05 : 0.62, 0.045, pick(jean ? DENIM : TEE), gx, jean ? 1.1 : 1.32, z - 0.66 + k * 0.146, rr(-0.1, 0.1)); K.rod(M.chrome, [gx, 1.68, z - 0.66 + k * 0.146], [gx, 1.62, z - 0.66 + k * 0.146], 0.006, 4); } }
    if (n % 5 === 1) { [0.3, 0.74, 1.18, 1.62, 2.06].forEach((y, r) => { K.bx(x - s * 0.36, x - s * 0.02, y, y + 0.025, z - 0.85, z + 0.85, M.whiteP); for (let k = 0; k < 5; k++) { const c = pick(TEE); K.box(0.26, 0.1, 0.11, c, x - s * 0.2, y + 0.085, z - 0.68 + k * 0.34, 0, 0, s * 0.12); K.box(0.27, 0.03, 0.115, M.whiteP, x - s * 0.2, y + 0.035, z - 0.68 + k * 0.34); } }); }   // a sneaker wall
    if (n % 5 === 3) { K.cyl(0.03, 0.03, 1.6, M.chrome, gx, 0.8, z, 6); K.cyl(0.22, 0.26, 0.04, M.steelDk, gx, 0.02, z, 12); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + r * 0.4; K.sph(0.1, pick(TEE), gx + Math.cos(a) * 0.16, 0.6 + r * 0.3, z + Math.sin(a) * 0.16, 0.6); K.box(0.13, 0.012, 0.1, M.black, gx + Math.cos(a) * 0.26, 0.58 + r * 0.3, z + Math.sin(a) * 0.26, -a); } }   // a cap tree
    if (n % 5 === 4) { for (let k = 0; k < 4; k++) { K.box(0.5, 0.32, 0.36, [M.red, M.blue, M.yellow, M.green][k], gx, 0.16 + (k % 2) * 0.32, z - 0.45 + Math.floor(k / 2) * 0.55, rr(-0.15, 0.15)); } [-0.6, -0.1, 0.4].forEach((dz, k) => { K.box(0.2, 0.78, 0.02, pick(TEE), x - s * 0.06, 2.2, z + dz + 0.1, ry + Math.PI / 2, 0, 0); K.cyl(0.028, 0.028, 0.045, M.whiteP, x - s * 0.085, 1.98, z + dz + 0.1, 8, [0, 0, Math.PI / 2]); K.cyl(0.028, 0.028, 0.045, M.whiteP, x - s * 0.085, 2.42, z + dz + 0.1, 8, [0, 0, Math.PI / 2]); }); }   // crates, skate decks on the wall
    // the wall above the shop: a second-storey piece, a window, a tangle of pipes
    K.mesh(L.paint(U - 0.2, 1.9, piece(WORDS[(n + 4) % 10], pick(['#d9d2c0', '#c9b9a8', '#b9c2c8']), n * 31 + 9), { glow: 0.3, depth: 0.03, oneSide: true }), x - s * 0.03, 4.95, z, ry);
    K.rod(M.steelDk, [x - s * 0.1, 0, z + U / 2 - 0.02], [x - s * 0.1, 6.1, z + U / 2 - 0.02], 0.035, 6);
  } });
  // the end wall: the big piece, a hoop over a painted key, spray cans and a boombox on a crate
  K.mesh(L.paint(2.86, 3.4, piece(['AMERICAN', 'STREET', '美國街', 'SINCE 1980s'], '#101826', 77), { glow: 0.55, depth: 0.04, oneSide: true, px: 1024 }), 0, 4.3, -LEN + 0.04);
  K.mesh(L.paint(2.86, 2.55, piece(['TAIPEI', '西門町'], '#3a1a2a', 123), { glow: 0.35, depth: 0.03, oneSide: true }), 0, 1.3, -LEN + 0.03);
  K.bx(-0.55, 0.55, 2.55, 3.35, -LEN + 0.07, -LEN + 0.1, M.whiteP); K.bx(-0.2, 0.2, 2.62, 2.92, -LEN + 0.1, -LEN + 0.105, M.red); K.bx(-0.17, 0.17, 2.65, 2.89, -LEN + 0.105, -LEN + 0.11, M.whiteP);
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; K.box(0.105, 0.02, 0.02, M.orange, Math.cos(a) * 0.23, 2.6, -LEN + 0.36 + Math.sin(a) * 0.23, -a + Math.PI / 2); K.rod(M.whiteP, [Math.cos(a) * 0.23, 2.6, -LEN + 0.36 + Math.sin(a) * 0.23], [Math.cos(a + 0.2) * 0.15, 2.22, -LEN + 0.36 + Math.sin(a + 0.2) * 0.15], 0.006, 3); }
  K.bx(-0.03, 0.03, 2.58, 2.62, -LEN + 0.1, -LEN + 0.14, M.orange);
  K.bx(-1.1, 1.1, 0.017, 0.021, -LEN + 0.1, -LEN + 0.16, M.whiteP); [-1.1, 1.1].forEach(x => K.bx(x - 0.03, x + 0.03, 0.017, 0.021, -LEN + 0.1, -LEN + 2.6, M.whiteP)); L.arch(K, M.whiteP, 0, -LEN + 2.6, 0.017, 0.021, 1.08, 0.06, 0, Math.PI, 14);
  K.box(0.5, 0.34, 0.36, M.yellow, -1.0, 0.19, -LEN + 0.7, 0.3); K.box(0.52, 0.26, 0.16, M.black, -1.0, 0.49, -LEN + 0.7, 0.3); [-0.14, 0.14].forEach(d => K.cyl(0.085, 0.085, 0.02, M.chrome, -1.0 + d, 0.49, -LEN + 0.79, 12, [Math.PI / 2 - 0, 0.3, 0]));
  for (let k = 0; k < 7; k++) { const x = 0.75 + (k % 4) * 0.13, z = -LEN + 0.5 + Math.floor(k / 4) * 0.16; K.cyl(0.033, 0.033, 0.19, M.std(HOT[k % 6], 0.5), x, 0.115, z, 8); K.cyl(0.016, 0.03, 0.04, M.whiteP, x, 0.23, z, 8); }
  const g = K.done(X, Z, -Math.PI / 2);
  L.retarget(E, 'american-street', g, old);
  (window.LM_AREAS = window.LM_AREAS || []).push({ x0: 21, x1: X + LEN - 1.0, z0: Z - 0.9, z1: Z + 0.9 });
};
