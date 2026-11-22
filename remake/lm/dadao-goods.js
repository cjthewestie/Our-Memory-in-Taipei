// lm/dadao-goods.js: what the shops of 迪化街 put out under their arcades. CJ, 2026-11-22: 「那些弱點也一起修掉」 (the fill-in fronts stood empty behind their piers).
// Nine fronts that are not landmarks each become one of the street's real trades (measured as trades: docs/places/dadao.json 'dihua-shophouse-rows';
// the shop names are old 迪化街 firms recalled from memory, inferred, and not at their real house numbers): 南北貨, 中藥, 布, 茶, 蜜餞, 竹器, 烏魚子 and 海味,
// 燈籠, 糕餅. Each gets back shelves, a counter, a strip light, its goods set out between the piers the way the trade shows them (open sacks and
// round bamboo trays, herb drawers and hung bundles, bolts of cloth, tea tins, glass jars, baskets and steamers, roe laid in rows and squid hung to
// dry, painted lanterns, red gift boxes), and its own carved or painted board over the bay. Landmark fronts keep their own goods.
(window.LM = window.LM || {})['dadao-goods'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('dadao-goods'), F = L.FONTS, ZC = i => 29.6 - i * 4.8;
  let sd = 1851; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, rr = (a, b) => a + (b - a) * R(), pick = a => a[Math.floor(R() * a.length)];
  const C = h => M.std(h, 0.8), BURLAP = M.tm('#b99a68', E.TEX.bark, 5, 0.95), WICK = M.tm('#dcb986', E.TEX.plaster, 3, 0.9), SHELF = M.woodDk;
  const sack = (x, z, col, r = 0.27) => { K.cyl(r * 0.92, r, 0.46, BURLAP, x, 0.23, z, 12); K.cyl(r, r * 0.92, 0.07, BURLAP, x, 0.49, z, 12); K.sph(r * 0.9, col, x, 0.5, z, 0.4); };
  const tray = (x, y, z, col, r = 0.36) => { K.cyl(r, r * 0.92, 0.06, WICK, x, y, z, 16, [0.32, 0, 0]); K.sph(r * 0.86, col, x, y + 0.04, z, 0.28); };
  const jar = (x, y, z, col, r = 0.12, h = 0.3) => { K.cyl(r, r, h, M.pane, x, y + h / 2, z, 12); K.cyl(r * 0.88, r * 0.88, h * 0.72, col, x, y + h * 0.38, z, 10); K.cyl(r * 0.8, r * 0.86, 0.05, M.red, x, y + h + 0.02, z, 12); };
  const shelves = (rows, fill) => { K.bx(-2.05, 2.05, 0, 2.9, 3.0, 3.12, SHELF); for (let r = 0; r < rows; r++) { const y = 0.5 + r * (2.2 / rows); K.bx(-2.0, 2.0, y, y + 0.04, 2.62, 3.0, M.wood); fill(r, y + 0.04); } };
  const counter = (x, w) => { K.bx(x - w / 2, x + w / 2, 0, 0.88, 1.75, 2.25, M.wood); K.bx(x - w / 2 - 0.03, x + w / 2 + 0.03, 0.88, 0.93, 1.72, 2.28, M.woodDk); };
  const name = (zh, sub, bg, fg, kind) => L.paint(3.5, 0.62, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (kind === 'carved') { for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`; g.fillRect(0, Math.random() * H, W, 1 + Math.random() * 2); } g.strokeStyle = fg; g.lineWidth = H * 0.04; g.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16); }
    else { g.fillStyle = fg; g.fillRect(0, H * 0.9, W, H * 0.1); g.fillRect(0, 0, W, H * 0.05); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; const cs = kind === 'carved' ? [...zh].reverse() : [...zh]; g.font = `700 ${H * 0.56}px ${kind === 'carved' ? F.WEI : F.KAI}`; cs.forEach((c, i) => g.fillText(c, W * (0.5 + (i - (cs.length - 1) / 2) * 0.62 / Math.max(3, cs.length - 1) * 1.0), H * (sub ? 0.4 : 0.5)));
    if (sub) { g.font = `600 ${H * 0.17}px ${F.HEI}`; g.fillText(sub, W / 2, H * 0.78, W * 0.9); } }, { glow: 0.4, depth: 0.07, px: 1024 });
  const SHOPS = [
    [-1, 0, '泉通行', '南北貨 · 香菇 干貝 蝦米', '#1c1712', '#e9c46a', 'carved', () => { shelves(4, (r, y) => { for (let k = 0; k < 9; k++) K.box(0.34, 0.3, 0.26, C(['#7a1f1a', '#c9a56a', '#5a4030', '#e9e2d0'][(k + r) % 4]), -1.8 + k * 0.45, y + 0.15, 2.8); });
      [['#5a4030', -1.6, 0.5], ['#c9a56a', -1.0, 0.45], ['#d8a074', -0.45, 0.55], ['#7a1f1a', 0.5, 0.5], ['#e9d8b0', 1.1, 0.45], ['#3d2a1c', 1.65, 0.55], ['#b07a3a', -1.3, 1.05], ['#8a5a3a', 0.8, 1.05], ['#d9852b', 1.45, 1.1]].forEach(([c, x, z]) => sack(x, z, C(c)));
      counter(-0.3, 1.8); K.box(0.36, 0.1, 0.3, M.steelDk, -0.6, 0.98, 2.0); K.cyl(0.17, 0.17, 0.02, M.chrome, -0.6, 1.2, 2.0, 14); K.rod(M.steelDk, [-0.6, 1.03, 2.0], [-0.6, 1.2, 2.0], 0.012, 5); }],
    [-1, 1, '六安堂', '參藥行 · 漢方', '#2a1a10', '#d9b25a', 'carved', () => { K.bx(-2.05, 2.05, 0, 2.9, 3.0, 3.12, SHELF); for (let r = 0; r < 9; r++) for (let c = 0; c < 14; c++) { K.bx(-1.96 + c * 0.28, -1.96 + c * 0.28 + 0.25, 0.3 + r * 0.27, 0.3 + r * 0.27 + 0.24, 2.94, 3.0, M.wood); K.sph(0.018, M.brass, -1.835 + c * 0.28, 0.42 + r * 0.27, 2.93); }
      counter(0, 3.2); [-1.2, -0.7, 0.7, 1.2].forEach((x, i) => jar(x, 0.93, 2.0, C(['#b07a3a', '#7a1f1a', '#c9a56a', '#5a4030'][i]), 0.14, 0.36)); K.box(0.4, 0.03, 0.26, M.brass, 0, 0.96, 2.0); K.rod(M.brass, [0, 0.96, 2.0], [0, 1.3, 2.0], 0.008, 4); K.rod(M.brass, [-0.22, 1.3, 2.0], [0.22, 1.3, 2.0], 0.008, 4); [-0.22, 0.22].forEach(d => K.cyl(0.07, 0.05, 0.02, M.brass, d, 1.12, 2.0, 10));
      for (let k = 0; k < 9; k++) { const x = -1.9 + k * 0.47; K.rod(M.straw, [x, 3.2, 0.5], [x, 2.9, 0.5], 0.004, 3); K.cyl(0.03, 0.09, 0.4, C(['#7d8f3a', '#8a5a3a', '#c9a56a'][k % 3]), x, 2.68, 0.5, 6); }
      [[-1.5, 0.5, '#c9a56a'], [-0.8, 0.45, '#7a1f1a'], [0.8, 0.5, '#d8a074'], [1.5, 0.45, '#5a4030']].forEach(([x, z, c]) => { K.bx(x - 0.3, x + 0.3, 0, 0.5, z - 0.22, z + 0.22, M.wood); tray(x, 0.56, z, C(c), 0.3); }); }],
    [-1, 2, '老布莊', '棉 麻 絲 綢 · 剪布', '#f3ecd9', '#1f4f7a', 'paint', () => { const CL = ['#b3241a', '#e9c46a', '#1f4f7a', '#2f7d5a', '#e8a0b0', '#f1ece2', '#7a4f7f', '#e07a2a', '#3f8f8a', '#22262e'].map(C);
      shelves(5, (r, y) => { for (let k = 0; k < 16; k++) K.cyl(0.085, 0.085, 0.34, CL[(k * 3 + r) % 10], -1.9 + k * 0.25, y + 0.09, 2.82, 8, [Math.PI / 2, 0, 0]); });
      for (let k = 0; k < 14; k++) { const x = -1.9 + k * 0.29 + (k > 6 ? 0.2 : 0); K.cyl(0.085, 0.085, rr(1.2, 1.5), CL[(k * 7) % 10], x, 0.7, 0.42 + (k % 2) * 0.16, 8, [-0.1, 0, rr(-0.05, 0.05)]); }
      counter(0.2, 2.4); K.box(1.7, 0.03, 0.4, CL[4], 0.2, 0.95, 2.0); K.box(0.5, 0.5, 0.03, CL[4], 0.9, 0.7, 1.74); K.box(0.9, 0.012, 0.03, M.wood, -0.3, 0.975, 1.85); }],
    [-1, 3, '臻味茶苑', '烏龍 · 包種 · 東方美人', '#12301f', '#f3ecd9', 'carved', () => { shelves(4, (r, y) => { for (let k = 0; k < 10; k++) { K.cyl(0.16, 0.16, 0.36, C(['#7a1c14', '#12301f', '#c9a23e'][(k + r) % 3]), -1.8 + k * 0.4, y + 0.18, 2.8, 12); K.cyl(0.165, 0.165, 0.05, M.brass, -1.8 + k * 0.4, y + 0.38, 2.8, 12); K.box(0.14, 0.16, 0.01, M.creamP, -1.8 + k * 0.4, y + 0.18, 2.635); } });
      [[-1.5, 0.5], [-0.75, 0.5], [0.75, 0.5], [1.5, 0.5]].forEach(([x, z], i) => { K.cyl(0.36, 0.3, 0.5, WICK, x, 0.25, z, 14); K.sph(0.33, C(['#3f5a2a', '#5a4a2a', '#2f4a2a', '#6a5a30'][i]), x, 0.5, z, 0.35); });
      counter(0, 2.6); K.box(0.9, 0.05, 0.4, M.woodDk, -0.5, 0.96, 2.0); K.cyl(0.07, 0.09, 0.1, C('#7a3a22'), -0.6, 1.03, 2.0, 10); [0, 1, 2, 3].forEach(k => K.cyl(0.03, 0.022, 0.03, M.whiteP, -0.35 + k * 0.08, 1.0, 2.08, 8)); K.cyl(0.11, 0.11, 0.2, M.chrome, 0.7, 1.03, 2.0, 12); }],
    [-1, 8, '蜜餞乾果', '話梅 · 瓜子 · 開心果', '#b3241a', '#ffe9a8', 'paint', () => { shelves(4, (r, y) => { for (let k = 0; k < 12; k++) jar(-1.85 + k * 0.335, y, 2.8, C(['#7a1f1a', '#d9852b', '#c9a56a', '#d43a5a', '#7d8f3a', '#5a4030'][(k + r * 2) % 6]), 0.13, 0.3); });
      for (let k = 0; k < 10; k++) { const x = -1.75 + (k % 5) * 0.4 + (k % 5 > 1 ? 0.4 : 0), z = 0.42 + Math.floor(k / 5) * 0.42; K.bx(x - 0.18, x + 0.18, 0, 0.7 - Math.floor(k / 5) * 0.14, z - 0.18, z + 0.18, M.wood); jar(x, 0.7 - Math.floor(k / 5) * 0.14, z, C(['#d43a5a', '#e9e2d0', '#7a1f1a', '#d9852b', '#7d8f3a'][k % 5]), 0.16, 0.34); }
      counter(0, 2.0); K.box(0.3, 0.24, 0.3, M.red, 0.5, 1.05, 2.0); }],
    [-1, 9, '林豐益商行', '竹器 · 蒸籠 · 籐籃', '#3a2416', '#e6c878', 'carved', () => { K.bx(-2.05, 2.05, 0, 2.9, 3.0, 3.12, SHELF);
      [[-1.5, 0.6], [-0.7, 0.5], [0.7, 0.55], [1.5, 0.6]].forEach(([x, z], i) => { for (let n = 0; n < 5 - (i % 2); n++) K.cyl(0.36 - n * 0.02, 0.36 - n * 0.02, 0.11, M.bamboo, x, 0.06 + n * 0.115, z, 16); K.cyl(0.05, 0.34, 0.1, M.bamboo, x, 0.06 + (5 - (i % 2)) * 0.115, z, 16); });
      for (let k = 0; k < 8; k++) { const x = -1.9 + k * 0.54; K.rod(M.straw, [x, 3.2, 0.9], [x, 2.75, 0.9], 0.005, 3); if (k % 2) { K.cyl(0.24, 0.17, 0.26, WICK, x, 2.6, 0.9, 12); L.arch(K, WICK, x, 2.73, 0.89, 0.91, 0.2, 0.02, 0, Math.PI, 8); } else { K.cyl(0.3, 0.3, 0.04, WICK, x, 2.45, 0.9, 16, [Math.PI / 2, 0, 0]); } }
      for (let k = 0; k < 6; k++) { const x = -1.8 + k * 0.72; K.rod(M.bamboo, [x, 0, 2.9], [x + 0.1, 2.3, 2.95], 0.025, 5); K.box(0.3, 0.4, 0.06, M.straw, x + 0.02, 0.22, 2.86, 0, 0.1); }
      for (let k = 0; k < 5; k++) { K.cyl(0.26, 0.2, 0.3, WICK, -1.6 + k * 0.8, 0.15, 1.5, 12); K.cyl(0.23, 0.18, 0.28, WICK, -1.6 + k * 0.8, 0.44, 1.5, 12); } }],
    [1, 1, '勝益行', '烏魚子 · 海味 · 臘味', '#f3ecd9', '#a3221a', 'paint', () => { shelves(3, (r, y) => { for (let k = 0; k < 8; k++) K.box(0.4, 0.22, 0.28, C(['#c4201a', '#e9c46a'][(k + r) % 2]), -1.75 + k * 0.5, y + 0.11, 2.8); });
      [-1.25, 1.25].forEach(cx => { K.bx(cx - 0.8, cx + 0.8, 0, 0.72, 0.3, 0.95, M.wood); K.box(1.6, 0.03, 0.66, M.whiteP, cx, 0.75, 0.62, 0, 0.14); for (let k = 0; k < 15; k++) K.box(0.25, 0.035, 0.1, C(k % 4 ? '#e0962e' : '#c9741e'), cx - 0.62 + (k % 5) * 0.31, 0.8 + (2 - Math.floor(k / 5)) * 0.03, 0.42 + Math.floor(k / 5) * 0.2, 0, 0.14); });
      K.rod(M.bamboo, [-2.0, 2.75, 0.45], [2.0, 2.75, 0.45], 0.02, 5); for (let k = 0; k < 14; k++) { const x = -1.9 + k * 0.29; if (k % 3 === 0) { K.box(0.22, 0.5, 0.012, C('#d9b98a'), x, 2.45, 0.45); for (let t = -1; t <= 1; t++) K.box(0.03, 0.22, 0.01, C('#d9b98a'), x + t * 0.07, 2.1, 0.45); } else { K.cyl(0.028, 0.028, 0.46, C('#8a1f1a'), x, 2.48, 0.45, 6); K.cyl(0.028, 0.028, 0.46, C('#a8321f'), x + 0.07, 2.46, 0.45, 6); } }
      counter(0, 2.2); K.box(0.36, 0.1, 0.3, M.steelDk, 0.5, 0.98, 2.0); }],
    [1, 2, '老綿成', '手繪燈籠 · 宮燈', '#7a1c14', '#f3d27a', 'carved', () => { K.bx(-2.05, 2.05, 0, 2.9, 3.0, 3.12, SHELF);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) { const x = -1.8 + k * 0.6 + (r % 2) * 0.3, y = 2.75 - r * 0.62, z = 0.5 + r * 0.75, c = [M.lantern, M.std('#f3ecd9', 0.6), M.std('#e9c46a', 0.6), M.lantern][(k + r) % 4], sy = (k + r) % 3 ? 1.25 : 0.8; if (x > 2) continue;
        K.rod(M.black, [x, 3.2, z], [x, y + 0.2, z], 0.004, 3); K.sph(0.2, c, x, y, z, sy); K.cyl(0.09, 0.09, 0.04, M.black, x, y + 0.2 * sy, z, 8); K.cyl(0.09, 0.09, 0.04, M.black, x, y - 0.2 * sy, z, 8); K.box(0.012, 0.2, 0.012, M.gold, x, y - 0.2 * sy - 0.12, z); }
      counter(-0.6, 1.8); K.sph(0.24, M.std('#f3ecd9', 0.6), -0.9, 1.2, 2.0, 1.2); K.cyl(0.05, 0.05, 0.12, C('#1c1712'), -0.3, 0.99, 2.0, 8); K.rod(M.bamboo, [-0.3, 1.0, 2.0], [-0.1, 1.25, 1.95], 0.006, 4);
      for (let k = 0; k < 5; k++) { K.cyl(0.02, 0.02, 1.6, M.bamboo, 1.0 + k * 0.2, 0.8, 2.85, 5, [0.06, 0, 0]); } }],
    [1, 4, '李亭香', '平安龜 · 糕餅 · 年節禮盒', '#b3241a', '#ffe9a8', 'carved', () => { shelves(4, (r, y) => { for (let k = 0; k < 9; k++) { K.box(0.38, 0.14, 0.3, M.red, -1.8 + k * 0.45, y + 0.07, 2.8); K.box(0.38, 0.14, 0.3, C('#e9c46a'), -1.8 + k * 0.45, y + 0.21, 2.8); K.box(0.1, 0.3, 0.31, M.gold, -1.8 + k * 0.45, y + 0.14, 2.8); } });
      [-1.2, 1.2].forEach(cx => { K.bx(cx - 0.8, cx + 0.8, 0, 0.75, 0.35, 0.95, M.wood); K.bx(cx - 0.8, cx + 0.8, 0.75, 1.25, 0.35, 0.95, M.pane); K.bx(cx - 0.78, cx + 0.78, 0.75, 0.78, 0.37, 0.93, M.winLit); for (let k = 0; k < 10; k++) K.sph(0.07, C(['#e9c46a', '#d98a4a', '#f1ece2', '#e8a0b0', '#c4201a'][k % 5]), cx - 0.62 + (k % 5) * 0.31, 0.83, 0.52 + Math.floor(k / 5) * 0.26, 0.6); });
      counter(0, 1.6); for (let n = 0; n < 4; n++) K.box(0.4 - n * 0.04, 0.12, 0.3, n % 2 ? C('#e9c46a') : M.red, 0, 0.99 + n * 0.12, 2.0); }],
  ];
  SHOPS.forEach(([side, slot, zh, sub, bg, fg, kind, fill]) => { K.at(side * 4.95, 0, ZC(slot), side * Math.PI / 2);   // local +z runs from the pier line into the shop
    K.bx(-2.1, 2.1, 0.012, 0.03, 0, 3.0, M.terrazzo); K.bx(-1.6, 1.6, 3.12, 3.17, 1.2, 1.3, M.tube); fill();
    K.mesh(name(zh, sub, bg, fg, kind), 0, 3.32, -0.42); [-1.5, 1.5].forEach(x => K.rod(M.frame, [x, 3.6, -0.3], [x, 3.6, -0.44], 0.012, 4));
    K.at(); });
  K.done(0, 0, 0);
};
