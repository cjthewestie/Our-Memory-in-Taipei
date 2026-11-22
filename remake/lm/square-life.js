// lm/square-life.js: the everyday street life of a Taipei square, round its edges. CJ, 2026-11-22: 「那些弱點也一起修掉」 (the square had landmarks and events, little of an ordinary day).
// Each piece is a thing every Taipei neighbourhood has (general knowledge of the city, inferred; none is a named real business): a tin kiosk that cuts
// keys, carves seals and mends shoes; the green and red twin postboxes; a roast sweet-potato cart with its drum oven, smoking; a hand-shaken tea
// stand with its sealing machine and menu; a recycling cart stacked with flattened boxes, a cat asleep on top; old men at a stone chess table with
// two looking on, bird cages hung beside them; pigeons; a morning dance group with a cassette player; a line of schoolchildren in yellow caps behind
// their teacher. All stand in gaps between the landmarks, off the paths to the three gates. Signs are trade words in the hand such stalls use.
(window.LM = window.LM || {})['square-life'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('square-life'), F = L.FONTS, blocks = [], C = h => M.std(h, 0.8);
  const sign = (t, w, h, bg, fg, o) => L.label(t, w, h, Object.assign({ bg, fg, font: F.KAI, weight: 700, glow: 0.45, depth: 0.03 }, o || {}));
  // ── west: the key, seal and shoe-repair kiosk ──
  K.at(-17.3, 0, -3.6, Math.PI / 2); { const TIN = M.tm('#6f8f8a', E.TEX.metal, 4, 0.5, 0.3);
    K.bx(-1.0, 1.0, 0, 2.3, -0.8, -0.72, TIN); K.bx(-1.0, -0.94, 0, 2.3, -0.8, 0.5, TIN); K.bx(0.94, 1.0, 0, 2.3, -0.8, 0.5, TIN); K.box(2.3, 0.05, 1.7, TIN, 0, 2.36, 0, 0, 0.1); K.bx(-1.0, 1.0, 0, 0.9, 0.42, 0.5, TIN); K.bx(-1.04, 1.04, 0.9, 0.95, 0.2, 0.6, M.wood);
    K.mesh(sign('配鎖 刻印 修鞋', 2.0, 0.42, '#f3ecd9', '#b3271e'), 0, 2.05, 0.56); K.mesh(sign('換電池', 0.3, 0.9, '#ffe14a', '#1a1a1a', { vertical: true }), -1.2, 1.5, 0.5); K.mesh(sign('雨傘修理', 0.3, 1.1, '#1f4f9c', '#ffffff', { vertical: true }), 1.2, 1.45, 0.5);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) { K.box(0.03, 0.11, 0.012, (r + k) % 3 ? M.brass : M.chrome, -0.8 + k * 0.145, 1.2 + r * 0.22, -0.7); K.cyl(0.03, 0.03, 0.012, (r + k) % 3 ? M.brass : M.chrome, -0.8 + k * 0.145, 1.28 + r * 0.22, -0.7, 8, [Math.PI / 2, 0, 0]); }           // rows of key blanks on the back board
    K.box(0.5, 0.36, 0.4, M.steelDk, -0.5, 1.13, 0.35); K.cyl(0.09, 0.09, 0.06, M.chrome, -0.5, 1.2, 0.58, 12, [Math.PI / 2, 0, 0]); K.box(0.26, 0.1, 0.1, M.woodRed, 0.3, 1.0, 0.4, 0.3); K.box(0.26, 0.1, 0.1, M.black, 0.6, 1.0, 0.35, -0.2); K.cyl(0.15, 0.13, 0.42, M.red, 0, 0.21, -0.2, 10); }
  blocks.push([-17.3, -3.6, Math.PI / 2, -1.3, 1.3, -0.9, 0.7]);
  // ── west: the twin postboxes, green for ordinary mail, red for express and airmail ──
  K.at(-17.2, 0, 3.4, Math.PI / 2); [[-0.42, '#1f7a4a', '普通郵件'], [0.42, '#c2261c', '限時 航空']].forEach(([x, c, t]) => { const m = C(c); K.cyl(0.07, 0.09, 0.6, m, x, 0.3, 0, 10); K.bx(x - 0.3, x + 0.3, 0.6, 1.35, -0.22, 0.22, m); K.cyl(0.3, 0.3, 0.44, m, x, 1.35, 0, 14, [Math.PI / 2, 0, 0]); K.bx(x - 0.2, x + 0.2, 1.12, 1.17, 0.2, 0.24, M.black); K.mesh(sign(t, 0.42, 0.14, '#f1ece2', c, { font: F.HEI, depth: 0.012, oneSide: true }), x, 0.95, 0.228); K.bx(x - 0.12, x + 0.12, 0.66, 0.84, 0.2, 0.235, M.whiteP); });
  blocks.push([-17.2, 3.4, Math.PI / 2, -0.85, 0.85, -0.4, 0.4]);
  // ── east: the roast sweet-potato cart ──
  K.at(17.2, 0, -5.2, -Math.PI / 2); { K.bx(-0.75, 0.75, 0.55, 0.62, -0.45, 0.45, M.steelDk); [-0.55, 0.55].forEach(x => { for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; K.box(0.15, 0.03, 0.03, M.black, x + 0.0, 0.3 + Math.sin(a) * 0.28, -0.52 + 0 + Math.cos(a) * 0.0 + 0, 0, 0, 0); } K.cyl(0.3, 0.3, 0.05, M.rubber, x, 0.3, -0.5, 14, [Math.PI / 2, 0, 0]); K.cyl(0.3, 0.3, 0.05, M.rubber, x, 0.3, 0.5, 14, [Math.PI / 2, 0, 0]); });
    K.cyl(0.42, 0.42, 1.0, M.tm('#4a4038', E.TEX.metal, 3, 0.6, 0.4), -0.1, 1.05, 0, 16, [0, 0, Math.PI / 2]); K.cyl(0.44, 0.44, 0.04, M.steelDk, -0.6, 1.05, 0, 16, [0, 0, Math.PI / 2]); K.cyl(0.44, 0.44, 0.04, M.steelDk, 0.4, 1.05, 0, 16, [0, 0, Math.PI / 2]); K.bx(-0.35, 0.15, 0.95, 1.2, 0.4, 0.44, M.neonR);
    K.cyl(0.05, 0.05, 0.9, M.steelDk, 0.25, 1.9, -0.2, 8); K.cyl(0.09, 0.05, 0.1, M.steelDk, 0.25, 2.38, -0.2, 8); for (let k = 0; k < 6; k++) K.sph(0.09, C(['#8a4a2a', '#a8582e', '#7a3f22'][k % 3]), 0.55 + (k % 2) * 0.12, 0.7 + Math.floor(k / 2) * 0.09, -0.2 + (k % 3) * 0.2, 0.7, 1.6, 0.8);
    K.rod(M.steelDk, [-0.75, 0.6, -0.4], [-1.25, 1.0, -0.4], 0.02, 5); K.rod(M.steelDk, [-0.75, 0.6, 0.4], [-1.25, 1.0, 0.4], 0.02, 5); K.rod(M.steelDk, [-1.25, 1.0, -0.4], [-1.25, 1.0, 0.4], 0.02, 5);
    K.mesh(sign('烤地瓜', 0.9, 0.36, '#3a2416', '#ffd98a', { sub: '甜 · 一斤 40' }), 0, 2.0, 0.42); [-0.4, 0.4].forEach(x => K.rod(M.steelDk, [x, 1.45, 0.4], [x, 1.85, 0.42], 0.012, 4)); K.g.userData.steam = [[17.2, 2.5, -5.2]]; }
  blocks.push([17.2, -5.2, -Math.PI / 2, -1.4, 0.9, -0.7, 0.7]);
  // ── east: the hand-shaken tea stand ──
  K.at(17.3, 0, 3.6, -Math.PI / 2); { const WH = M.whiteP, GR = C('#2f7d5a');
    K.bx(-1.1, 1.1, 0, 1.0, 0.1, 0.6, WH); K.bx(-1.15, 1.15, 1.0, 1.05, 0.05, 0.66, M.chrome); K.bx(-1.1, 1.1, 0.25, 0.5, 0.6, 0.61, GR); K.bx(-1.1, 1.1, 0, 2.5, -0.7, -0.62, WH); K.bx(-1.15, 1.15, 2.5, 2.62, -0.75, 0.8, GR); [-1.1, 1.06].forEach(x => K.bx(x, x + 0.04, 1.05, 2.5, 0.56, 0.6, M.chrome));
    K.mesh(L.paint(2.2, 0.6, (g, W, H) => { g.fillStyle = '#2f7d5a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${H * 0.5}px ${F.YUAN}`; g.fillText('手搖茶', W * 0.3, H * 0.52); g.font = `600 ${H * 0.2}px ${F.HEI}`; g.fillText('珍珠奶茶 · 青茶 · 冬瓜檸檬', W * 0.7, H * 0.36, W * 0.52); g.fillText('半糖少冰  大杯 35', W * 0.7, H * 0.68, W * 0.52); }, { glow: 0.9, depth: 0.1, px: 512 }), 0, 2.9, 0.78);
    K.mesh(L.paint(1.9, 0.9, (g, W, H) => { g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a1a1a'; g.textBaseline = 'middle'; g.font = `600 ${H * 0.085}px ${F.HEI}`; [['紅茶', 20], ['綠茶', 20], ['奶茶', 30], ['珍珠奶茶', 35], ['冬瓜茶', 25], ['檸檬青茶', 35], ['烏龍奶', 35], ['多多綠', 35], ['仙草凍', 30], ['百香果', 40]].forEach(([n, p], i) => { const c = i % 2, r = Math.floor(i / 2); g.textAlign = 'left'; g.fillText(n, W * (0.05 + c * 0.5), H * (0.14 + r * 0.18)); g.textAlign = 'right'; g.fillStyle = '#b3271e'; g.fillText(String(p), W * (0.45 + c * 0.5), H * (0.14 + r * 0.18)); g.fillStyle = '#1a1a1a'; }); }, { glow: 0.6, depth: 0.02, oneSide: true }), 0, 1.85, -0.6);
    K.box(0.4, 0.5, 0.4, M.chrome, -0.7, 1.3, 0.3); K.box(0.3, 0.04, 0.3, M.rubber, -0.7, 1.12, 0.32); for (let k = 0; k < 4; k++) { K.cyl(0.11, 0.11, 0.3, M.chrome, 0.2 + k * 0.26, 1.2, 0.2, 10); K.cyl(0.03, 0.03, 0.1, M.black, 0.2 + k * 0.26, 1.4, 0.2, 6); }
    for (let k = 0; k < 3; k++) { K.cyl(0.05, 0.04, 0.16, [C('#c9a06a'), C('#d9c27a'), C('#8a5a3a')][k], -0.2 + k * 0.16, 1.13, 0.5, 10); K.cyl(0.052, 0.052, 0.01, M.whiteP, -0.2 + k * 0.16, 1.215, 0.5, 10); K.box(0.008, 0.12, 0.008, C('#d8473a'), -0.2 + k * 0.16, 1.27, 0.5, 0, 0.1); } }
  blocks.push([17.3, 3.6, -Math.PI / 2, -1.3, 1.3, -0.8, 0.8]);
  // ── north: the recycling cart, cardboard stacked and tied, a cat asleep on top ──
  K.at(3.7, 0, -17.2, 0.25); { K.bx(-0.7, 0.7, 0.3, 0.36, -0.45, 0.45, M.steelDk); [-0.5, 0.5].forEach(x => [-0.5, 0.5].forEach(z => K.cyl(0.18, 0.18, 0.06, M.rubber, x, 0.18, z, 12, [Math.PI / 2, 0, 0])));
    for (let k = 0; k < 9; k++) K.box(1.3 - (k % 3) * 0.08, 0.1, 0.84 - (k % 2) * 0.06, C(['#b98a55', '#a87a48', '#c49a66'][k % 3]), (k % 2) * 0.04, 0.42 + k * 0.105, 0, (k % 3) * 0.05); K.bx(-0.02, 0.02, 0.36, 1.33, -0.46, 0.46, C('#c2261c')); K.bx(-0.7, 0.7, 0.8, 0.83, -0.43, 0.43, C('#c2261c'));
    K.rod(M.steelDk, [-0.7, 0.33, -0.4], [-1.15, 0.95, -0.4], 0.02, 5); K.rod(M.steelDk, [-0.7, 0.33, 0.4], [-1.15, 0.95, 0.4], 0.02, 5); K.rod(M.steelDk, [-1.15, 0.95, -0.4], [-1.15, 0.95, 0.4], 0.02, 5); for (let k = 0; k < 2; k++) K.sph(0.26, C(k ? '#cfe6ea' : '#e9e2d2'), 0.95, 0.3, -0.25 + k * 0.5, 1.1);
    const cat = C('#e0a060'); K.sph(0.17, cat, 0.1, 1.44, 0.05, 0.55, 1.5, 1.0); K.sph(0.1, cat, 0.36, 1.46, 0.12); [-1, 1].forEach(s => K.box(0.05, 0.07, 0.03, cat, 0.38 + s * 0.05, 1.56, 0.12, 0, 0, s * 0.3)); K.rod(cat, [-0.15, 1.42, 0.1], [-0.3, 1.4, -0.12], 0.025, 5); }
  blocks.push([3.7, -17.2, 0.25, -1.3, 1.3, -0.6, 0.6]);
  // ── south: the stone chess table and its four stools, bird cages on a frame beside it ──
  K.at(-1.2, 0, 15.4, Math.PI); { K.cyl(0.55, 0.55, 0.08, M.granite, 0, 0.72, 0, 16); K.cyl(0.16, 0.22, 0.7, M.granite, 0, 0.35, 0, 10); [[0, 0.85], [0, -0.85], [0.85, 0], [-0.85, 0]].forEach(([x, z]) => K.cyl(0.19, 0.17, 0.44, M.granite, x, 0.22, z, 12));
    K.mesh(L.paint(0.62, 0.62, (g, W, H) => { g.fillStyle = '#e6d6a8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#3a2416'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(W * (0.1 + i * 0.1), H * 0.08); g.lineTo(W * (0.1 + i * 0.1), H * 0.46); g.moveTo(W * (0.1 + i * 0.1), H * 0.54); g.lineTo(W * (0.1 + i * 0.1), H * 0.92); g.stroke(); } for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(W * 0.1, H * (0.08 + i * 0.0933)); g.lineTo(W * 0.9, H * (0.08 + i * 0.0933)); g.stroke(); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${H * 0.05}px ${F.KAI}`; g.fillStyle = '#3a2416'; g.fillText('楚河', W * 0.3, H * 0.5); g.fillText('漢界', W * 0.7, H * 0.5); }, { glow: 0.3, plane: true, px: 256 }), 0, 0.765, 0).rotation.x = -Math.PI / 2;
    for (let k = 0; k < 14; k++) K.cyl(0.028, 0.028, 0.014, k % 2 ? C('#b3271e') : C('#1a1a1a'), -0.22 + (k % 5) * 0.11 + (k % 3) * 0.01, 0.775, -0.2 + Math.floor(k / 5) * 0.2, 10);
    K.rod(M.bamboo, [1.6, 0, -0.5], [1.6, 2.1, -0.5], 0.03, 6); K.rod(M.bamboo, [2.9, 0, -0.5], [2.9, 2.1, -0.5], 0.03, 6); K.rod(M.bamboo, [1.5, 2.05, -0.5], [3.0, 2.05, -0.5], 0.025, 6);
    [1.95, 2.55].forEach((x, i) => { K.rod(M.black, [x, 2.05, -0.5], [x, 1.9, -0.5], 0.006, 4); K.cyl(0.17, 0.17, 0.02, M.bamboo, x, 1.52, -0.5, 14); K.sph(0.17, M.bamboo, x, 1.86, -0.5, 0.5); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; K.rod(M.bamboo, [x + Math.cos(a) * 0.165, 1.53, -0.5 + Math.sin(a) * 0.165], [x + Math.cos(a) * 0.165, 1.86, -0.5 + Math.sin(a) * 0.165], 0.004, 3); } K.sph(0.045, i ? C('#e8c23e') : C('#7fa8c9'), x, 1.62, -0.5, 0.9, 1, 1.4); }); }
  blocks.push([-1.2, 15.4, Math.PI, -1.2, 3.1, -1.1, 1.1]);
  // pigeons on the paving near the chess table, and the dancers' cassette player on a stool
  K.at(); [[2.6, 14.5, 0.3], [3.0, 14.9, 1.2], [2.3, 15.0, -0.7], [3.3, 14.4, 2.2], [2.75, 15.4, 0.9], [-5.4, 15.2, 0.2], [-5.9, 14.8, 1.8]].forEach(([x, z, ry], i) => { K.at(x, 0, z, ry); const c = C(['#8d939a', '#a9adb2', '#6f757c'][i % 3]); K.sph(0.085, c, 0, 0.11, 0, 0.9, 0.9, 1.6); K.sph(0.045, c, 0, 0.2, 0.1); K.box(0.012, 0.012, 0.04, C('#d98a3a'), 0, 0.195, 0.15); K.box(0.06, 0.012, 0.1, C('#5f656c'), 0, 0.13, -0.14, 0, -0.3); });
  K.at(13.9, 0, -6.2, -Math.PI / 2); K.cyl(0.15, 0.13, 0.42, M.red, 0, 0.21, 0, 10); K.box(0.46, 0.26, 0.14, M.black, 0, 0.56, 0); [-0.13, 0.13].forEach(d => K.cyl(0.08, 0.08, 0.02, M.chrome, d, 0.56, 0.075, 12, [Math.PI / 2, 0, 0])); K.rod(M.chrome, [-0.2, 0.69, 0], [0.2, 0.69, 0], 0.01, 4);
  K.at(); const g = K.done(0, 0, 0);
  (K.g.userData.steam || []).forEach(p => E.steamSrc && E.steamSrc.push(new E.T.Vector3(...p)));
  if (window.PHOTOWALL && PHOTOWALL.block) blocks.forEach(([x, z, th, u0, u1, v0, v1]) => PHOTOWALL.block({ x, z, facing: th, u0, u1, v0, v1 }));
  // the people of these scenes, drawn with the shared kit
  if (window.PEOPLE) { const P = PEOPLE.crowd(E, { seed: 1967, palette: 'modern', name: 'square-life-people' });
    P.add(-17.75, -3.6, Math.PI / 2, { pose: 'sit', apron: '#3a4a66', hair: '#8d8a86', woman: false, skirt: false, shorts: false, stool: false }); P.add(-15.9, -3.2, -Math.PI / 2 + 0.2, { pose: 'stand', bag: true });
    P.add(17.9, -5.0, -Math.PI / 2, { pose: 'reach', hat: 'douli', woman: false, skirt: false }); P.add(16.2, -4.3, Math.PI / 2 - 0.3, { pose: 'stand', kid: true });
    P.add(17.9, 3.6, -Math.PI / 2, { pose: 'reach', apron: '#2f7d5a', hat: 'cap', hatColor: '#2f7d5a' }); P.queue(16.1, 3.6, Math.PI / 2, 3, 0.8);
    P.add(2.4, -16.9, 1.9, { pose: 'carry', hat: 'douli', hair: '#8d8a86', woman: true, skirt: false, shorts: false, bagColor: '#e9e2d2' });
    [[-1.2, 14.55, 0], [-1.2, 16.25, Math.PI]].forEach(([x, z, ry], i) => P.add(x, z, ry, { pose: i ? 'sit' : 'sitDraw', hair: '#8d8a86', woman: false, skirt: false, shorts: false, stool: false, shirt: i ? '#e9e2d2' : '#7fa8c9' }));
    P.add(-2.35, 15.2, Math.PI / 2 + 0.2, { pose: 'stand', hair: '#8d8a86', woman: false, skirt: false, shorts: false, hat: 'cap' }); P.add(0.0, 15.7, -Math.PI / 2 - 0.3, { pose: 'talk', hair: '#a9a6a2', woman: false, skirt: false, shorts: false });
    for (let i = 0; i < 6; i++) P.drop(12.4 - Math.floor(i / 3) * 1.3, -7.3 + (i % 3) * 1.15, Math.PI / 2, { pose: i % 2 ? 'wave' : 'pray', woman: true, skirt: false, shorts: false, hair: i % 3 ? '#221912' : '#8d8a86', shirt: ['#e8a0b0', '#f2c21a', '#7fd0c0'][i % 3] }, 0.6);
    P.drop(13.2, 2.6, Math.PI, { pose: 'walk', woman: true, pack: false }, 0.5); for (let i = 0; i < 5; i++) P.drop(13.2, 3.5 + i * 0.62, Math.PI, { pose: i % 2 ? 'walk' : 'walk2', kid: true, hat: 'cap', hatColor: '#f2c21a', pack: i % 2 ? '#c2261c' : '#1f4f9c', shirt: '#f1ece2', shorts: true, skirt: false }, 0.4);
    P.build(); }
  void g;
};
