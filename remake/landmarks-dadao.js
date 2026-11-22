// landmarks-dadao.js — the researched places and events of 大稻埕 / 迪化街, built as real geometry and made clickable.
// CJ, 2026-11-21: "use reference to build them into these three scene, big event use stand or 立牌 or 雕像 ... be
// interactive i can click into and see the history ... as for everything need to be detailed".
//
// Used by dadao.html only:  LANDMARKS_DADAO(E, { FX, sq, temple, yongle, houses, BLOCKS, AREAS })  inside build(), then
// PLACES.mount(E, { district: 'dadao' }). Research: docs/places/dadao.json. Every building is one merged mesh per
// material (see Bag), so a whole shophouse costs a handful of draw calls.
//
// Local frame of a street building: x runs along the street front, y up, +z points INTO the street. The arcade piers'
// front face is z = F, the shopfront wall inside the arcade is z = AB, the back of the house is z = BACK.
(function () {
  'use strict';
  const F = 0.85, AB = -1.75, BACK = -9.5, PI = Math.PI;
  const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';

  // ── the designed pieces of 大稻埕's own furniture (kind B): one per event, plus the street's exhibit board. Every field is a
  // DESIGN kit option (docs/signage/kit.md); why each form, and its reference: docs/signage/designs-dadao.md. Neighbours never
  // share form + layout: archway booth · street news case · forecourt banners and statue · film billboard · deco column · food booth · quay installation · container stage.
  const DADAO_DESIGNS = {
    'new-year-goods-street': { form: 'booth', booth: 'market', layout: 'market', palette: 'market', head: '迪化街年貨大街', big: '迪化年貨', kicker: '試吃 · 南北貨', kicker2: '一九九六起',
      en: 'Dihua Street Lunar New Year Market', date: '1996', venue: '迪化街一段 · 永樂市場至民生西路' },
    'dihua-shophouse-rows': { form: 'poster', mount: 'case', layout: 'news', palette: 'news', head: '搶救迪化街', big: '迪化街保住了', kicker: '77 棟歷史街屋',
      en: 'The street that was not widened: 77 historic shophouses kept under the 1995 plan', date: '1995', venue: '大稻埕歷史風貌特定專用區' },
    'city-god-procession': { form: 'poster', mount: 'banner', layout: 'lantern', palette: ['#7a1410', '#4a0c08', '#ffe9b0', '#c4201a', '#f0c75a', '#1f6b5a'], motif: 'parade', head: '霞海城隍遶境', big: '五月十三', kicker: '人看人',
      en: 'Xiahai City God Procession', date: '農曆五月十三', venue: '霞海城隍廟出發' },
    'yuelao-matchmaker-crowds': { form: 'statue', motif: 'thread', plinth: 'drum', palette: 'temple', head: '月下老人', story: '一條紅線，排到騎樓外的人潮',
      en: 'Yue Lao, the matchmaker of Xiahai temple', date: '1971 起' },
    'film-twa-tiu-tiann-2014': { form: 'poster', mount: 'billboard', layout: 'painted', palette: ['#2a1f3d', '#e86a3a', '#fff1d0', '#f3c14b', '#c8283a', '#2a8f86'], head: '大稻埕', big: '大稻埕',
      kicker: '穿越回到一九二〇', en: 'Twa-Tiu-Tiann (2014)', date: '2014', venue: '2014.1.30 春節檔 全台上映' },
    'tttifa-arts-festival': { form: 'poster', mount: 'column', layouts: ['deco', 'premiere', 'memory', 'deco'], layout: 'deco', palette: 'deco', head: '大稻埕國際藝術節', big: '一九二〇',
      kicker: 'COSTUME PARADE', kicker2: '變裝遊行', en: 'Twatutia International Festival of Arts', date: '2015', venue: '永樂廣場 · 十月' },
    'solitary-gourmet-yongle': { form: 'booth', booth: 'food', layout: 'memory', motif: 'bowl', palette: ['#f4efe4', '#e3dccb', '#1a1410', '#b3261e', '#d9a13a', '#2f5a3a'], head: '孤獨的美食家', big: '一人份',
      kicker: '雞肉飯 · 旗魚米粉', en: 'The Solitary Gourmet, season 5', date: '2015', venue: '永樂市場' },
    'dadaocheng-fireworks': { form: 'installation', piece: 'burst', layout: 'nightart', palette: 'river', head: '大稻埕情人節煙火', big: '七夕', kicker: '夏日節',
      en: 'Dadaocheng Summer Festival fireworks', date: '2006 起', venue: '大稻埕碼頭 · 三、五號水門' },
    'pier5-container-market': { form: 'booth', booth: 'container', layout: 'concert', motif: 'mic', palette: ['#f2f2ee', '#dfe3e6', '#14202c', '#ff6b3d', '#f2c14e', '#1f5e8c'], head: 'PIER5 貨櫃市集', big: 'PIER 5',
      kicker: 'LIVE · SUNSET', en: 'Dadaocheng Wharf Container Market', date: '2018.4.1', venue: '大稻埕碼頭 五號水門', props: ['speakers'] },
  };

  window.LANDMARKS_DADAO = function (E, ctx) {
    const { T, scene, triMat, TEX, MATS, GLOW, col } = E, FX = ctx.FX, BLOCKS = ctx.BLOCKS, TZ = ctx.TZ || 0, MZ = ctx.MZ || 0, LZ = ctx.LZ || 0;   // TZ, MZ, LZ: how far the temple's, the market's and the lane's things moved when the street was put in its true order (dadao.html)
    const std = (c, rough = 0.7, metal = 0) => new T.MeshStandardMaterial({ color: col(c), roughness: rough, metalness: metal });
    const M = {
      brick: triMat({ color: '#f4ddd0', tex: TEX.brick, scale: 1, rough: 0.9 }), brickTR: triMat({ color: '#c79f88', tex: TEX.brick, scale: 1, rough: 0.9 }),
      stone: triMat({ color: '#a8a59b', tex: TEX.concrete, scale: 0.9, rough: 0.92 }), stoneL: triMat({ color: '#cdc8ba', tex: TEX.concrete, scale: 0.9, rough: 0.9 }),
      stoneD: triMat({ color: '#6f6c66', tex: TEX.concrete, scale: 1.2, rough: 0.8 }), granite: triMat({ color: '#3a3a3e', tex: TEX.concrete, scale: 1.5, rough: 0.45 }),
      cream: triMat({ color: '#e3d4b3', tex: TEX.concrete, scale: 0.6, rough: 0.88 }), white: triMat({ color: '#f0eadd', tex: TEX.concrete, scale: 0.6, rough: 0.88 }),
      mint: triMat({ color: '#b9c9b4', tex: TEX.concrete, scale: 0.6, rough: 0.88 }), ochre: triMat({ color: '#d9b77c', tex: TEX.concrete, scale: 0.6, rough: 0.88 }),
      timber: triMat({ color: '#7a5636', tex: TEX.bark, scale: 2, rough: 0.8 }), timberD: triMat({ color: '#43301f', tex: TEX.bark, scale: 2, rough: 0.8 }),
      tile: triMat({ color: '#c9623a', tex: TEX.bark, scale: 3, rough: 0.65 }), floor: triMat({ color: '#a39685', tex: TEX.concrete, scale: 0.8, rough: 0.55 }),
      concrete: triMat({ color: '#b3aea2', tex: TEX.concrete, scale: 0.45, rough: 0.9 }), steel: triMat({ color: '#5f7686', tex: TEX.metal, scale: 2, rough: 0.4, metal: 0.7 }),
      wicker: triMat({ color: '#dcb986', tex: TEX.plaster, scale: 3, rough: 0.9 }),
      teal: std('#3f6f6a', 0.6), frameW: std('#ece6d8', 0.6), frameD: std('#3a2a20', 0.6), green: std('#3f9273', 0.3), gold: std('#c9a13c', 0.35, 0.7),
      red: std('#b3241a', 0.6), redD: std('#7a1c14', 0.7), blue: std('#2f5f9a', 0.6), yellow: std('#e0b23a', 0.6), tealC: std('#2f8a86', 0.6), orange: std('#d9692b', 0.6),
      glass: std('#17232b', 0.12, 0.6), dark: std('#14110f', 0.9), cloth: std('#b3241a', 0.9), rice: std('#8a5a2a', 0.8), paper: std('#efe6d0', 0.8),
      lit: GLOW(1.0, 0.72, 0.4), litSoft: GLOW(0.6, 0.45, 0.27), lantern: GLOW(2.6, 0.5, 0.25), ink: MATS.ink,
    };
    const GOODS = ['#7a1f1a', '#d9852b', '#5a4030', '#c9a56a', '#d43a5a', '#7d8f3a', '#e9e2d0', '#a8501f'].map(c => std(c, 0.75));

    // ── Bag: collects boxes and shapes per material, then makes ONE mesh per material ──
    function Bag() {
      const parts = new Map(), m4 = new T.Matrix4(), q = new T.Quaternion(), eu = new T.Euler(), v = new T.Vector3(), s = new T.Vector3();
      const B = { xf: null };
      B.put = (mat, geo, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sc = null) => {
        const g = geo.index ? geo.toNonIndexed() : geo.clone(); eu.set(rx, ry, rz); q.setFromEuler(eu); s.set(1, 1, 1); if (sc) s.set(sc[0], sc[1], sc[2]);
        m4.compose(v.set(x, y, z), q, s); if (B.xf) m4.premultiply(B.xf); g.applyMatrix4(m4);
        if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g); };
      B.bx = (mat, x0, x1, y0, y1, z0, z1) => B.put(mat, new T.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      B.cyl = (mat, r0, r1, h, x, y, z, seg = 12, rx = 0, rz = 0) => B.put(mat, new T.CylinderGeometry(r0, r1, h, seg), x, y + h / 2, z, 0, rx, rz);
      B.ball = (mat, r, x, y, z, sy = 1) => B.put(mat, new T.SphereGeometry(r, 12, 8), x, y, z, 0, 0, 0, [1, sy, 1]);
      B.build = (group) => { parts.forEach((list, mat) => { let n = 0; list.forEach(g => { n += g.attributes.position.count; });
        const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0; list.forEach(g => { P.set(g.attributes.position.array, o); N.set(g.attributes.normal.array, o); o += g.attributes.position.count * 3; g.dispose(); });
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3));
        const mesh = new T.Mesh(geo, mat); mesh.castShadow = !mat.isMeshBasicMaterial; mesh.receiveShadow = true; group.add(mesh); }); parts.clear(); return group; };
      return B;
    }
    const slot = (side, zc) => { const g = new T.Group(); g.position.set(side * FX, 0, zc); g.rotation.y = -side * PI / 2; scene.add(g); return g; };
    const free = (x, z, ry = 0) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g; };
    const at = (g, mesh, x, y, z, ry = 0) => { mesh.position.set(x, y, z); mesh.rotation.y = ry; g.add(mesh); return mesh; };

    // ── text and pictures on canvas ──
    // mat: one of DESIGN.MATERIALS. Then the board is that material (the Midjourney texture under asset/textures/signs/ once it lands,
    // a code-drawn one until then, repainted when it lands) and `draw` only letters it. key: what makes this canvas unique.
    function canvasMat(w, h, draw, glow = 0.2, ppm = 220, mat = null, key = '') {
      const cw = Math.max(32, Math.min(1024, Math.round(w * ppm))), ch = Math.max(32, Math.min(1024, Math.round(h * ppm))); let t;
      if (mat && window.DESIGN && DESIGN.signTexture) t = DESIGN.signTexture(E, mat, cw, ch, draw, 'dadao|' + key);
      else { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; draw(cv.getContext('2d'), cw, ch); t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; }
      return new T.MeshStandardMaterial({ map: t, roughness: mat === 'brass' || mat === 'enamel' || mat === 'lacquer' || mat === 'redlacquer' ? 0.35 : 0.7, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow });
    }
    // the real shops' and temples' own boards (kind A) are made of something: a board's flat colour names its material
    const MAT_OF = { '#1c1712': 'lacquer', '#2a2420': 'lacquer', '#3a3a3e': 'stone', '#b3241a': 'redlacquer', '#7a1c14': 'redlacquer', '#6a1d14': 'redlacquer', '#22392f': 'weathered',
      '#cfc7b4': 'stone', '#c9c4b6': 'stone', '#a8a59b': 'stone', '#b3aea2': 'stone', '#f7ecd0': 'paper', '#e9dcc0': 'paper', '#f0eadd': 'paper', '#1f4f7a': 'enamel', '#1f2a44': 'enamel' };
    // Real signs (kind A) follow the standard set in landmarks-ximen.js: brush lettering, five-plus kinds, each on its Midjourney material.
    //   kind 'plaque' 匾額: carved characters on lacquer or teak, a raised frame, read right to left (rtl) · 'box' 招牌燈箱: acrylic face in a steel case ·
    //   'neon': tubes on a dark backing panel · 'cloth' 布條: a sagging banner · 'enamel' 琺瑯牌: a blue plate with rivets · 'stone': characters cut in a
    //   plaster or stone parapet · 'paint' (default): a painted board. sources: docs/signage/sources-dadao.md
    const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + FONT, WEI = '"Weibei TC",' + KAI, LI = '"Libian TC","Baoli TC",' + KAI, XING = '"Xingkai TC",' + KAI, YUAN = '"Yuanti TC",' + FONT;
    const KIND_MAT = { plaque: 'lacquer', box: 'lightbox', neon: 'neonback', cloth: 'cloth', enamel: 'enamel', stone: 'stone', paint: 'teak' };
    const KIND_FONT = { plaque: WEI, box: KAI, neon: WEI, cloth: WEI, enamel: FONT, stone: KAI, paint: KAI };
    const TINT = { box: 0.92, enamel: 0.85, cloth: 0.7, neon: 0.55, paint: 0.0, plaque: 0.0, stone: 0.0 };
    const matOf = o => (o.mat === false ? null : o.mat || (o.kind ? KIND_MAT[o.kind] : MAT_OF[String(o.bg || '#2a2420').toLowerCase()]) || null);
    function drawText(g, cw, ch, text, o) {
      const kind = o.kind || 'paint', u = Math.min(cw, ch), long = Math.max(cw, ch), fg = o.fg || '#f3d27a';
      if (!o.noBg) { g.fillStyle = o.bg || '#2a2420'; g.fillRect(0, 0, cw, ch); }
      else { const a = o.tint != null ? o.tint : o.mat === 'paper' ? 0.6 : (o.kind ? TINT[kind] : 0); if (a > 0 && o.bg) { g.globalAlpha = a; g.fillStyle = o.bg; g.fillRect(0, 0, cw, ch); g.globalAlpha = 1; } }
      g.lineJoin = 'round';
      if (kind === 'plaque') { g.strokeStyle = o.border || fg; g.lineWidth = u * 0.06; g.strokeRect(u * 0.05, u * 0.05, cw - u * 0.1, ch - u * 0.1); g.lineWidth = u * 0.015; g.strokeRect(u * 0.13, u * 0.13, cw - u * 0.26, ch - u * 0.26); }
      else if (kind === 'box') { const gr = g.createLinearGradient(0, 0, o.vertical ? cw : 0, o.vertical ? 0 : ch); gr.addColorStop(0, 'rgba(0,0,0,.12)'); gr.addColorStop(0.5, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.14)'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
        const n = Math.max(1, Math.round(long / u / 1.6)); g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 1; i < n; i++) { if (o.vertical) g.fillRect(0, ch * i / n - 1, cw, 3); else g.fillRect(cw * i / n - 1, 0, 3, ch); }
        g.strokeStyle = '#2b2b30'; g.lineWidth = u * 0.06; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, cw - g.lineWidth, ch - g.lineWidth); }
      else if (kind === 'enamel') { g.strokeStyle = fg; g.lineWidth = u * 0.035; g.strokeRect(u * 0.09, u * 0.09, cw - u * 0.18, ch - u * 0.18);
        [[0.045, 0.045], [0.955, 0.045], [0.045, 0.955], [0.955, 0.955]].forEach(([x, y]) => { const px = x < 0.5 ? u * 0.05 : cw - u * 0.05, py = y < 0.5 ? u * 0.05 : ch - u * 0.05; g.fillStyle = '#4a4e52'; g.beginPath(); g.arc(px, py, u * 0.025, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(px - u * 0.007, py - u * 0.007, u * 0.009, 0, 7); g.fill(); });
        g.fillStyle = 'rgba(40,30,20,.55)'; for (let i = 0; i < 5; i++) { const x = ((i * 0.37 + 0.11) % 1) * cw, y = (i % 2 ? 0.02 : 0.97) * ch; g.beginPath(); g.ellipse(x, y, u * 0.03, u * 0.015, i, 0, 7); g.fill(); } }   // rust chips at the plate's edge
      else if (kind === 'cloth') { const n = Math.max(3, Math.round((o.vertical ? ch : cw) / u * 1.3)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, a = 0.06 + (i % 3) * 0.03;
          const gr = o.vertical ? g.createLinearGradient(0, ch * (t - 0.5 / n), 0, ch * (t + 0.5 / n)) : g.createLinearGradient(cw * (t - 0.5 / n), 0, cw * (t + 0.5 / n), 0); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.8})`); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); }
        g.setLineDash([u * 0.05, u * 0.04]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1, u * 0.012); g.strokeRect(u * 0.05, u * 0.05, cw - u * 0.1, ch - u * 0.1); g.setLineDash([]); }
      else if (kind === 'paint' && o.border !== false && o.border) { g.strokeStyle = o.border; g.lineWidth = Math.max(2, u * 0.03); const m = u * 0.07; g.strokeRect(m, m, cw - 2 * m, ch - 2 * m); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; const font = o.font || (o.kind ? KIND_FONT[kind] : FONT), wgt = o.weight || (o.kind ? 800 : 700);
      const fill = (txt, x, y, size) => {
        if (kind === 'neon') { g.shadowColor = fg; g.shadowBlur = size * 0.25; g.strokeStyle = fg; g.lineWidth = size * 0.09; g.strokeText(txt, x, y); g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = size * 0.028; g.strokeText(txt, x, y); return; }
        if (kind === 'stone') { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillText(txt, x + size * 0.025, y + size * 0.03); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillText(txt, x - size * 0.02, y - size * 0.025); g.fillStyle = fg; g.fillText(txt, x, y); return; }   // cut into the parapet: lit lower lip, shadowed upper lip
        if (kind === 'plaque' || o.relief || o.noBg) { g.fillStyle = o.relief || 'rgba(0,0,0,.55)'; g.fillText(txt, x + size * 0.03, y + size * 0.04); }
        if (o.outline) { g.strokeStyle = o.outline; g.lineWidth = size * 0.12; g.strokeText(txt, x, y); }
        g.fillStyle = fg; g.fillText(txt, x, y); if (kind === 'plaque' && !o.flat) { g.fillStyle = 'rgba(255,250,220,.28)'; g.fillText(txt, x - size * 0.012, y - size * 0.015); } };
      const fit = (txt, size, maxW, w8, face) => { g.font = `${w8} ${Math.round(size)}px ${face}`; const mw = g.measureText(txt).width; if (mw > maxW) { size *= maxW / mw; g.font = `${w8} ${Math.round(size)}px ${face}`; } return size; };
      const pad = Math.min(cw, ch) * (kind === 'plaque' || kind === 'box' ? 0.2 : 0.12), subH = o.sub ? (o.vertical ? ch * 0.1 : ch * 0.28) : 0;
      if (o.vertical) { const chars = [...text], step = (ch - 2 * pad - subH) / chars.length, size = Math.min(step * 0.9, (cw - 2 * pad * 0.6) * 0.9); g.font = `${wgt} ${Math.round(size)}px ${font}`; chars.forEach((c, i) => { if (c !== ' ' && c !== '　') fill(c, cw / 2, pad + step * (i + 0.52), size); });
        if (o.sub) { const z = fit(o.sub, subH * 0.6, cw * 0.84, 600, o.subFont || FONT); g.fillStyle = o.subFg || fg; g.fillText(o.sub, cw / 2, ch - pad * 0.6 - subH / 2); } }
      else { const t = o.rtl ? [...text].reverse().join('') : text, cy = (ch - subH) / 2 + (subH ? pad * 0.3 : 0);
        if (o.spread) { const chars = [...t], cell = (cw - 2 * pad) / chars.length, size = Math.min((ch - subH - pad) * 0.8, cell * 0.92); g.font = `${wgt} ${Math.round(size)}px ${font}`; chars.forEach((c, i) => fill(c, pad + cell * (i + 0.5), cy, size)); }
        else { const size = fit(t, (ch - subH) * (kind === 'plaque' || kind === 'box' ? 0.62 : 0.7), cw - 2 * pad, wgt, font); fill(t, cw / 2, cy, size); }
        if (o.sub) { fit(o.sub, subH * 0.6, cw - 2 * pad, 600, o.subFont || FONT); g.fillStyle = o.subFg || fg; g.fillText(o.sub, cw / 2, ch - pad * 0.45 - subH * 0.4); } }
    }
    const signFace = (text, w, h, o, glow) => { const mt = matOf(o), oo = mt ? Object.assign({}, o, { noBg: true }) : o;
      if (o.bg && o.kind !== 'neon') { const c = new T.Color(o.bg); if (c.r * 0.3 + c.g * 0.6 + c.b * 0.1 > 0.6) glow = Math.min(glow, 0.45); }   // a light face glows less, or the bloom washes its text out
      return canvasMat(w, h, (g, cw, ch) => drawText(g, cw, ch, text, oo), glow, 220, mt, [text, w, h, o.bg, o.fg, o.sub || '', o.vertical ? 'v' : 'h', o.border || '', o.kind || '', o.rtl ? 'r' : '', o.spread ? 's' : ''].join('|')); };
    const label = (text, w, h, o = {}) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), signFace(text, w, h, o, o.glow == null ? 0.2 : o.glow)); return m; };
    const edgeMat = std('#2a2420', 0.6), caseMat = std('#3b3f44', 0.45, 0.6), giltMat = std('#c9a13c', 0.35, 0.75), plateEdge = std('#d9d4c6', 0.4, 0.3);
    const KIND_GLOW = { box: 0.85, neon: 1.4, enamel: 0.18, stone: 0.05, plaque: 0.3, cloth: 0.25, paint: 0.25 };
    const KIND_THICK = { box: 0.2, neon: 0.05, enamel: 0.02, cloth: 0.012, plaque: 0.1, stone: 0.06, paint: 0.05 };
    // hang: a real sign with depth. Returns a Group (face + frame / case / tube clips / sagging cloth).
    const hang = (text, w, h, o = {}) => {
      const kind = o.kind || 'paint', glow = o.glow != null ? o.glow : (o.kind ? KIND_GLOW[kind] : 0.3), f = signFace(text, w, h, o, glow), grp = new T.Group(), d = o.thick || (o.kind ? KIND_THICK[kind] : 0.07);
      if (kind === 'cloth') { const geo = new T.PlaneGeometry(w, h, o.vertical ? 1 : 16, o.vertical ? 16 : 1), p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); if (o.vertical) p.setZ(i, 0.03 * Math.sin((y / h + 0.5) * PI * 3)); else { p.setY(i, y - 0.06 * h * Math.sin((x / w + 0.5) * PI)); p.setZ(i, 0.025 * Math.sin((x / w + 0.5) * PI * 5)); } }
        geo.computeVertexNormals(); f.side = T.DoubleSide; const m = new T.Mesh(geo, f); grp.add(m);
        if (!o.vertical) [-1, 1].forEach(k => { const r = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.5, 4), M.ink); r.position.set(k * w / 2, h / 2 + 0.22, 0); r.rotation.z = k * 0.5; grp.add(r); }); return grp; }   // the ties
      const em = kind === 'box' ? caseMat : kind === 'enamel' ? plateEdge : kind === 'plaque' ? (o.frameMat || edgeMat) : edgeMat;
      const body = new T.Mesh(new T.BoxGeometry(w, h, d), [em, em, em, em, f, f]); body.castShadow = true; grp.add(body);
      if (kind === 'plaque') { const fr = o.frameMat || giltMat, t = Math.min(w, h) * 0.07, dz = d / 2 + 0.012; [[0, h / 2 - t / 2, w + t, t], [0, -h / 2 + t / 2, w + t, t], [-w / 2 + t / 2, 0, t, h], [w / 2 - t / 2, 0, t, h]].forEach(([x, y, bw, bh]) => { [1, -1].forEach(s => { const b = new T.Mesh(new T.BoxGeometry(bw, bh, 0.03), fr); b.position.set(x, y, s * dz); grp.add(b); }); }); }   // the raised gilt frame, both faces
      if (kind === 'box') { const t = 0.035; [[0, h / 2, w + t, t], [0, -h / 2, w + t, t], [-w / 2, 0, t, h + t], [w / 2, 0, t, h + t]].forEach(([x, y, bw, bh]) => { const b = new T.Mesh(new T.BoxGeometry(bw, bh, d + 0.03), caseMat); b.position.set(x, y, 0); grp.add(b); }); }   // the folded steel rim of the light box
      if (kind === 'neon') { [[-0.42, 0.4], [0.42, 0.4], [-0.42, -0.4], [0.42, -0.4]].forEach(([x, y]) => [1, -1].forEach(s => { const c = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.06, 5), caseMat); c.rotation.x = PI / 2; c.position.set(x * w, y * h, s * (d / 2 + 0.03)); grp.add(c); })); }   // the stand-off clips that hold the tubes
      return grp; };
    const pic = (w, h, draw, glow = 0.45) => new T.Mesh(new T.PlaneGeometry(w, h), canvasMat(w, h, draw, glow));
    // a board over the arcade, and a 直招 standing out from a pier on two brackets and a stay, so it reads as you walk the street
    const nameBoard = (g, text, w, h, x, y, o = {}) => { const b = hang(text, w, h, Object.assign({ border: o.fg || '#f3d27a' }, o)); at(g, b, x, y, F + 0.21); return b; };
    const sideSign = (g, text, x, y, h, o = {}) => { const w = o.w || 0.52; const b = hang(text, w, h, Object.assign({ vertical: true, border: o.fg || '#f3d27a' }, o)); at(g, b, x, y, F + 0.14 + w / 2, PI / 2);
      [h / 2 + 0.05, -h / 2 + 0.12].forEach(dy => { const br = new T.Mesh(new T.BoxGeometry(0.035, 0.035, w + 0.2), M.ink); br.position.set(x, y + dy, F + w / 2 + 0.04); g.add(br); });
      const st = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, Math.hypot(w + 0.1, 0.55), 5), M.ink); st.position.set(x, y + h / 2 + 0.3, F + (w + 0.1) / 2); st.rotation.x = Math.atan2(w + 0.1, 0.55); g.add(st); return b; };   // the stay wire to the wall

    // ── parts of a shophouse front ──
    const vase = new T.LatheGeometry([[0.045, 0], [0.1, 0.06], [0.12, 0.26], [0.055, 0.46], [0.085, 0.6], [0.05, 0.7]].map(p => new T.Vector2(p[0], p[1])), 7).toNonIndexed();
    function balustrade(B, x0, x1, y, z, h, posts, rail, bal) {
      B.bx(rail, x0, x1, y, y + 0.1, z - 0.13, z + 0.13); B.bx(rail, x0, x1, y + h - 0.12, y + h, z - 0.16, z + 0.16);
      const ps = posts.slice().sort((a, b) => a - b); ps.forEach(px => { B.bx(rail, px - 0.2, px + 0.2, y, y + h + 0.12, z - 0.2, z + 0.2); B.bx(rail, px - 0.26, px + 0.26, y + h + 0.12, y + h + 0.2, z - 0.26, z + 0.26); });
      for (let k = 0; k < ps.length - 1; k++) { const a = ps[k] + 0.2, b = ps[k + 1] - 0.2, n = Math.max(1, Math.round((b - a) / 0.3)); for (let j = 0; j < n; j++) B.put(bal, vase, a + (j + 0.5) * (b - a) / n, y + 0.1, z, 0, 0, 0, [1, (h - 0.22) / 0.7, 1]); }
    }
    function win(B, cx, y0, w, h, o) {              // o: trim, frame, arch, lit, bars
      const zt = F - 0.04, gl = o.lit ? M.litSoft : M.glass, fr = o.frame || M.frameW, t = o.trim;
      B.bx(t, cx - w / 2 - 0.1, cx + w / 2 + 0.1, y0 - 0.06, y0 + h + (o.arch ? 0 : 0.1), F - 0.16, zt); B.bx(gl, cx - w / 2, cx + w / 2, y0, y0 + h, F - 0.14, zt + 0.02);
      if (o.arch) { B.put(t, new T.CylinderGeometry(w / 2 + 0.12, w / 2 + 0.12, 0.12, 16, 1, false, PI / 2, PI), cx, y0 + h, F - 0.1, 0, PI / 2); B.put(gl, new T.CylinderGeometry(w / 2, w / 2, 0.14, 16, 1, false, PI / 2, PI), cx, y0 + h, F - 0.08, 0, PI / 2);
        B.bx(t, cx - 0.1, cx + 0.1, y0 + h + w / 2 - 0.02, y0 + h + w / 2 + 0.24, F - 0.14, zt + 0.08); B.bx(fr, cx - w / 2, cx + w / 2, y0 + h - 0.03, y0 + h + 0.03, F - 0.1, zt + 0.04); }
      else { B.bx(t, cx - w / 2 - 0.16, cx + w / 2 + 0.16, y0 + h + 0.1, y0 + h + 0.26, F - 0.16, zt + 0.08); B.bx(fr, cx - w / 2, cx + w / 2, y0 + h - 0.05, y0 + h, F - 0.1, zt + 0.04); }
      B.bx(t, cx - w / 2 - 0.16, cx + w / 2 + 0.16, y0 - 0.2, y0 - 0.06, F - 0.16, zt + 0.14);                                    // sill
      B.bx(fr, cx - w / 2, cx - w / 2 + 0.05, y0, y0 + h, F - 0.1, zt + 0.04); B.bx(fr, cx + w / 2 - 0.05, cx + w / 2, y0, y0 + h, F - 0.1, zt + 0.04); B.bx(fr, cx - w / 2, cx + w / 2, y0, y0 + 0.05, F - 0.1, zt + 0.04);
      const nb = o.bars == null ? (w > 1.2 ? 2 : 1) : o.bars; for (let i = 1; i <= nb; i++) B.bx(fr, cx - w / 2 + i * w / (nb + 1) - 0.025, cx - w / 2 + i * w / (nb + 1) + 0.025, y0, y0 + h + (o.arch ? w / 2 - 0.08 : 0), F - 0.1, zt + 0.04);
      B.bx(fr, cx - w / 2, cx + w / 2, y0 + h * 0.5 - 0.025, y0 + h * 0.5 + 0.025, F - 0.1, zt + 0.04);
    }
    function archSpan(B, mat, trim, x0, x1, ya, yt) {   // the brick above an arcade bay, with a round-headed opening cut out of it
      const cx = (x0 + x1) / 2, r = (x1 - x0) / 2, rise = Math.min(yt - ya - 0.3, r), s = new T.Shape();
      s.moveTo(x0, ya); s.lineTo(x0, yt); s.lineTo(x1, yt); s.lineTo(x1, ya); s.absellipse(cx, ya, r, rise, 0, PI, false);
      B.put(mat, new T.ExtrudeGeometry(s, { depth: 0.46, bevelEnabled: false, curveSegments: 14 }), 0, 0, F - 0.5);
      B.bx(trim, cx - 0.13, cx + 0.13, ya + rise - 0.06, yt - 0.06, F - 0.3, F + 0.06);
    }
    // the shell every street building shares: piers, arcade, upper wall with windows, floor bands. Returns its measures.
    function shell(B, o) {
      const W = o.W, hw = W / 2, n = o.bays, gf = o.gf || 3.7, fh = o.fh || 3.3, st = o.storeys, H = gf + (st - 1) * fh, pw = o.pw || 0.56, wall = o.wall, trim = o.trim, pier = o.pier || wall;
      const bw = (W - pw) / n, pierX = []; for (let i = 0; i <= n; i++) pierX.push(-hw + pw / 2 + i * bw);
      if (st > 1) B.bx(wall, -hw, hw, gf, H, BACK, F - 0.12); B.bx(o.inner || wall, -hw, hw, 0, gf, BACK, AB); B.bx(M.floor, -hw, hw, 0, 0.08, AB, F + 0.1);
      B.bx(o.side || wall, -hw, -hw + 0.12, 0, gf, AB, F - 0.6); B.bx(o.side || wall, hw - 0.12, hw, 0, gf, AB, F - 0.6);
      const capY = o.arcade === 'arch' ? gf - 1.3 : gf - 0.5;
      pierX.forEach(px => { B.bx(pier, px - pw / 2, px + pw / 2, 0, gf, F - 0.6, F); B.bx(trim, px - pw / 2 - 0.05, px + pw / 2 + 0.05, 0, 0.4, F - 0.65, F + 0.05); B.bx(trim, px - pw / 2 - 0.05, px + pw / 2 + 0.05, capY - 0.16, capY, F - 0.65, F + 0.05);
        if (st > 1) { B.bx(pier, px - pw / 2 + 0.07, px + pw / 2 - 0.07, gf, H, F - 0.3, F - 0.03); } });
      for (let i = 0; i < n; i++) { const x0 = pierX[i] + pw / 2, x1 = pierX[i + 1] - pw / 2; if (o.arcade === 'arch') archSpan(B, pier, trim, x0, x1, capY, gf); else B.bx(o.beam || pier, x0, x1, gf - 0.5, gf, F - 0.5, F - 0.04); }
      for (let f = 0; f < st; f++) { const y = gf + f * fh; B.bx(trim, -hw, hw, y - 0.1, y + 0.14, F - 0.22, F + 0.1); B.bx(trim, -hw, hw, y + 0.14, y + 0.22, F - 0.22, F + 0.16); }
      const ww = o.ww || Math.min(1.5, bw - pw - 0.5), wh = o.wh || 1.7;
      for (let f = 1; f < st; f++) for (let i = 0; i < n; i++) { if (o.skipWin && o.skipWin(f, i)) continue; win(B, (pierX[i] + pierX[i + 1]) / 2, gf + (f - 1) * fh + 0.95, ww, wh - (o.win === 'arch' ? ww / 2 - 0.1 : 0), { trim, frame: o.frame, arch: o.win === 'arch', lit: ((f * 7 + i * 3 + (o.seed || 0)) % 4) === 0, bars: o.bars }); }
      // the roof, so the house is finished from above too: a tiled gable behind the parapet, or a flat deck with a stair hut and a water tank
      if (st > 1 && o.roof !== 'none') { const z0 = BACK, z1 = F - 0.5, zm = (z0 + z1) / 2, half = (z1 - z0) / 2, sd = o.seed || 0;
        if (o.roof === 'tile') { const rise = 1.5, a = Math.atan(rise / half), len = half / Math.cos(a) + 0.12;
          [[1, a], [-1, -a]].forEach(([k, rx]) => { B.put(M.tile, new T.BoxGeometry(W - 0.36, 0.12, len), 0, H + rise / 2 + 0.02, zm + k * half / 2, 0, rx); for (let x = -hw + 0.4; x < hw - 0.3; x += 0.42) B.put(M.tile, new T.BoxGeometry(0.12, 0.2, len), x, H + rise / 2 + 0.05, zm + k * half / 2, 0, rx); });
          B.bx(M.tile, -hw + 0.1, hw - 0.1, H + rise - 0.02, H + rise + 0.16, zm - 0.14, zm + 0.14); B.bx(trim, -hw + 0.1, hw - 0.1, H + rise + 0.16, H + rise + 0.22, zm - 0.09, zm + 0.09);
          const tri = new T.Shape(); tri.moveTo(-half, 0); tri.lineTo(0, rise + 0.3); tri.lineTo(half, 0); const tg = new T.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false });
          B.put(wall, tg, -hw, H, zm, PI / 2); B.put(wall, tg, hw - 0.2, H, zm, PI / 2); }
        else { B.bx(M.stoneD, -hw + 0.16, hw - 0.16, H, H + 0.06, z0 + 0.16, z1); B.bx(wall, -hw, -hw + 0.16, H, H + 0.62, z0, z1); B.bx(wall, hw - 0.16, hw, H, H + 0.62, z0, z1); B.bx(wall, -hw, hw, H, H + 0.62, z0, z0 + 0.16);
          B.bx(trim, -hw - 0.03, -hw + 0.19, H + 0.62, H + 0.7, z0, z1); B.bx(trim, hw - 0.19, hw + 0.03, H + 0.62, H + 0.7, z0, z1); B.bx(trim, -hw, hw, H + 0.62, H + 0.7, z0 - 0.03, z0 + 0.19);
          const hx = (sd % 2 ? 1 : -1) * (hw - 1.15); B.bx(wall, hx - 0.95, hx + 0.95, H, H + 2.2, -7.9, -5.6); B.bx(trim, hx - 1.05, hx + 1.05, H + 2.2, H + 2.32, -8.0, -5.5); B.bx(M.dark, hx - 0.4, hx + 0.4, H + 0.06, H + 1.9, -5.6, -5.57);      // the stair hut and its door
          const tx = -hx * 0.75; [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].forEach(([dx, dz]) => B.bx(M.ink, tx + dx - 0.04, tx + dx + 0.04, H, H + 0.7, -3.4 + dz - 0.04, -3.4 + dz + 0.04)); B.cyl(M.steel, 0.62, 0.62, 1.25, tx, H + 0.7, -3.4, 16); B.cyl(M.steel, 0.1, 0.64, 0.16, tx, H + 1.95, -3.4, 16);      // the steel water tank on its stand
          B.bx(M.stoneL, -hx - 0.5, -hx + 0.5, H + 0.06, H + 0.55, -7.4, -6.7); B.bx(M.ink, -hx - 0.4, -hx + 0.4, H + 0.12, H + 0.5, -6.72, -6.68); } }
      return { W, hw, n, gf, fh, H, bw, pw, pierX, mid: i => (pierX[i] + pierX[i + 1]) / 2 };
    }
    // the shopfront inside an arcade bay: a door, a lit window over a riser, a timber frame
    function shopfront(B, x0, x1, gf, o = {}) {
      const z = AB, fr = o.frame || M.timberD, w = x1 - x0, dw = o.doorW || 1.05, dx = o.door == null ? x0 + w * 0.5 : o.door, top = gf - 0.75;
      B.bx(fr, x0 + 0.08, x1 - 0.08, top, top + 0.14, z, z + 0.1); B.bx(M.dark, dx - dw / 2, dx + dw / 2, 0.08, top, z, z + 0.04); B.bx(fr, dx - dw / 2 - 0.08, dx - dw / 2, 0.08, top, z, z + 0.1); B.bx(fr, dx + dw / 2, dx + dw / 2 + 0.08, 0.08, top, z, z + 0.1);
      [[x0 + 0.15, dx - dw / 2 - 0.15], [dx + dw / 2 + 0.15, x1 - 0.15]].forEach(([a, b]) => { if (b - a < 0.4) return; B.bx(o.riser || fr, a, b, 0.08, 0.85, z, z + 0.08); B.bx(o.pane || M.lit, a, b, 0.9, top - 0.08, z, z + 0.03);
        B.bx(fr, a - 0.05, a, 0.08, top, z, z + 0.1); B.bx(fr, b, b + 0.05, 0.08, top, z, z + 0.1); B.bx(fr, (a + b) / 2 - 0.025, (a + b) / 2 + 0.025, 0.9, top - 0.08, z, z + 0.07); B.bx(fr, a, b, 0.85, 0.92, z, z + 0.12); });
      B.bx(o.pane || M.litSoft, x0 + 0.15, x1 - 0.15, top + 0.2, gf - 0.18, z, z + 0.03);                                         // the transom light
      for (let x = x0 + 0.15 + (w - 0.3) / 5; x < x1 - 0.2; x += (w - 0.3) / 5) B.bx(fr, x - 0.02, x + 0.02, top + 0.2, gf - 0.18, z, z + 0.07);
    }
    const basket = (B, x, z, i, r = 0.3) => { B.cyl(M.wicker, r, r * 0.8, 0.4, x, 0.08, z, 12); B.ball(GOODS[i % GOODS.length], r * 0.94, x, 0.5, z, 0.45); };
    const sackRow = (B, x0, x1, z, seed) => { const n = Math.max(1, Math.round((x1 - x0) / 0.66)); for (let i = 0; i < n; i++) basket(B, x0 + (i + 0.5) * (x1 - x0) / n, z, seed + i * 3); };
    const chest = (B, g, x, z, w, h, text) => { B.bx(M.timber, x - w / 2, x + w / 2, 0.08, 0.08 + h, z - w / 2, z + w / 2); B.bx(M.timberD, x - w / 2 - 0.01, x + w / 2 + 0.01, 0.08 + h - 0.05, 0.08 + h, z - w / 2 - 0.01, z + w / 2 + 0.01);
      if (text) at(g, label(text, w * 0.7, h * 0.7, { bg: '#e9dcc0', fg: '#7a1c14', glow: 0.1 }), x, 0.08 + h / 2, z + w / 2 + 0.006); };
    const redLantern = (B, x, y, z, r = 0.3) => { B.ball(M.lantern, r, x, y, z, 1.15); B.cyl(M.gold, r * 0.45, r * 0.45, 0.07, x, y + r * 1.1, z, 10); B.cyl(M.gold, r * 0.4, r * 0.4, 0.07, x, y - r * 1.15 - 0.07, z, 10); B.cyl(M.ink, 0.01, 0.01, 0.5, x, y + r * 1.1, z, 4); };
    function pediment(B, mat, cx, w, y, h, kind, depth = 0.32) {
      const a = cx - w / 2, b = cx + w / 2, s = new T.Shape(); s.moveTo(a, y);
      if (kind === 'tri') { s.lineTo(a, y + h * 0.22); s.lineTo(cx, y + h); s.lineTo(b, y + h * 0.22); }
      else if (kind === 'step') { s.lineTo(a, y + h * 0.4); s.lineTo(a + w * 0.2, y + h * 0.4); s.lineTo(a + w * 0.2, y + h * 0.72); s.lineTo(a + w * 0.36, y + h * 0.72); s.lineTo(a + w * 0.36, y + h); s.lineTo(b - w * 0.36, y + h); s.lineTo(b - w * 0.36, y + h * 0.72); s.lineTo(b - w * 0.2, y + h * 0.72); s.lineTo(b - w * 0.2, y + h * 0.4); s.lineTo(b, y + h * 0.4); }
      else { s.lineTo(a, y + h * 0.3); s.quadraticCurveTo(a + w * 0.14, y + h * 0.3, a + w * 0.2, y + h * 0.55); s.bezierCurveTo(a + w * 0.26, y + h * 1.15, b - w * 0.26, y + h * 1.15, b - w * 0.2, y + h * 0.55); s.quadraticCurveTo(b - w * 0.14, y + h * 0.3, b, y + h * 0.3); }
      s.lineTo(b, y); B.put(mat, new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 }), 0, 0, F - depth + 0.02);
    }
    const urn = (B, mat, x, y, z) => { B.cyl(mat, 0.1, 0.14, 0.14, x, y, z, 8); B.ball(mat, 0.17, x, y + 0.3, z, 1.1); B.cyl(mat, 0.03, 0.08, 0.16, x, y + 0.46, z, 6); };
    const OUT = {};

    // ═════════ 1. 新芳春茶行: three storeys, three bays, brown-red TR brick, moulded ornament, couplets at the door ═════════
    { const g = slot(-1, -20.8), B = Bag(), S = shell(B, { W: 9.4, bays: 3, storeys: 3, wall: M.brickTR, trim: M.stoneL, arcade: 'arch', win: 'flat', frame: M.frameW, ww: 1.5, wh: 1.85, seed: 1, roof: 'tile', skipWin: (f, i) => i === 1 });
      // centre bay: a recessed loggia with a balcony on each upper floor
      for (let f = 1; f < 3; f++) { const y = S.gf + (f - 1) * S.fh, x0 = S.pierX[1] + 0.3, x1 = S.pierX[2] - 0.3; B.bx(M.dark, x0, x1, y + 0.3, y + 2.75, F - 0.14, F - 0.1); B.bx(f === 1 ? M.litSoft : M.glass, x0 + 0.5, x1 - 0.5, y + 0.3, y + 2.3, F - 0.12, F - 0.07);
        B.bx(M.stoneL, x0 - 0.1, x1 + 0.1, y + 2.75, y + 2.95, F - 0.2, F + 0.12); B.bx(M.frameW, (x0 + x1) / 2 - 0.03, (x0 + x1) / 2 + 0.03, y + 0.3, y + 2.3, F - 0.1, F - 0.04);
        B.bx(M.stoneL, x0 - 0.15, x1 + 0.15, y + 0.2, y + 0.32, F - 0.2, F + 0.55); balustrade(B, x0 - 0.1, x1 + 0.1, y + 0.32, F + 0.4, 0.85, [x0 + 0.1, x1 - 0.1], M.stoneL, M.green); }
      balustrade(B, -S.hw, S.hw, S.H + 0.22, F - 0.1, 0.9, [...S.pierX, -1.5, 1.5], M.stoneL, M.green);
      pediment(B, M.brickTR, 0, 3.4, S.H + 0.22, 2.0, 'round'); B.bx(M.stoneL, -1.75, 1.75, S.H + 0.22, S.H + 0.36, F - 0.34, F + 0.1); urn(B, M.stoneL, -1.5, S.H + 1.42, F - 0.1); urn(B, M.stoneL, 1.5, S.H + 1.42, F - 0.1); urn(B, M.stoneL, 0, S.H + 2.25, F - 0.14);
      at(g, label('行茶春芳新', 2.5, 0.55, { kind: 'stone', font: KAI, bg: '#cfc7b4', fg: '#5a2d20', glow: 0.05 }), 0, S.H + 0.95, F + 0.03);
      B.put(M.stoneL, new T.CylinderGeometry(0.34, 0.34, 0.06, 20), 0, S.H + 1.62, F + 0.02, 0, PI / 2); B.put(M.green, new T.CylinderGeometry(0.22, 0.22, 0.08, 6), 0, S.H + 1.62, F + 0.03, 0, PI / 2);
      for (let i = 0; i < 3; i++) shopfront(B, S.pierX[i] + 0.2, S.pierX[i + 1] - 0.2, S.gf, i === 1 ? { doorW: 1.5 } : { door: S.mid(i) + (i ? 0.7 : -0.7), frame: M.teal });
      at(g, hang('芳尋顧渚', 0.34, 1.9, { kind: 'plaque', mat: 'redlacquer', font: XING, vertical: true, bg: '#6a1d14', fg: '#f3d27a', thick: 0.04, flat: true }), S.mid(1) + 1.02, 1.75, AB + 0.12); at(g, hang('春採蒙山', 0.34, 1.9, { kind: 'plaque', mat: 'redlacquer', font: XING, vertical: true, bg: '#6a1d14', fg: '#f3d27a', thick: 0.04, flat: true }), S.mid(1) - 1.02, 1.75, AB + 0.12);
      at(g, hang('新芳春茶行', 1.5, 0.42, { kind: 'plaque', rtl: true, bg: '#1c1712', fg: '#e9c46a', thick: 0.06 }), S.mid(1), 3.2, AB + 0.13);
      at(g, hang('新芳春茶行', 3.0, 0.7, { kind: 'plaque', mat: 'teak', rtl: true, bg: '#5a3a22', fg: '#f1e2b8', frameMat: M.timberD }), 0, S.gf - 0.18, F + 0.6); sideSign(g, '新芳春茶行', S.pierX[0], 5.3, 2.5, { kind: 'paint', mat: 'weathered', bg: '#22392f', fg: '#f1e7d2' });
      [[-3.4, 0.1, '茶'], [-2.8, 0.15, '烏龍'], [2.8, 0.1, '包種'], [3.4, 0.12, '茶']].forEach(([x, z, t]) => chest(B, g, x, z, 0.5, 0.46, t));
      B.bx(M.timber, -3.35, -2.85, 0.54, 0.96, -0.15, 0.35);
      [[1.9, -0.6], [2.6, -0.9]].forEach(([x, z], i) => { B.cyl(M.wicker, 0.5, 0.5, 0.05, x, 0.55 + i * 0.2, z, 18); B.cyl(std('#55683a'), 0.44, 0.44, 0.03, x, 0.6 + i * 0.2, z, 18); B.cyl(M.timber, 0.03, 0.03, 0.5 + i * 0.2, x, 0.08, z, 6); });
      B.build(g); OUT.tea = g; }

    // ═════════ 2. 乾元參藥行: a Modernist front, horizontal bands, a ginseng relief on the parapet ═════════
    { const g = slot(1, -28.0), B = Bag(), S = shell(B, { W: 4.6, bays: 1, storeys: 3, wall: M.stoneL, trim: M.stone, pier: M.stone, arcade: 'flat', win: 'flat', frame: M.frameD, ww: 3.0, wh: 1.5, bars: 4, seed: 0 });
      for (let f = 1; f < 3; f++) { const y = S.gf + (f - 1) * S.fh; [0.55, 2.95].forEach(dy => B.bx(M.stone, -S.hw + 0.3, S.hw - 0.3, y + dy, y + dy + 0.1, F - 0.12, F + 0.2)); }      // the long sun-shades
      B.bx(M.stoneL, -S.hw, S.hw, S.H + 0.22, S.H + 0.95, F - 0.4, F - 0.02); pediment(B, M.stoneL, 0, 3.4, S.H + 0.95, 1.5, 'step'); [-1.9, 1.9].forEach(x => B.bx(M.stone, x - 0.16, x + 0.16, S.H + 0.22, S.H + 1.5, F - 0.42, F + 0.04));
      for (let k = 0; k < 3; k++) B.bx(M.stone, -S.hw, S.hw, S.H + 0.36 + k * 0.2, S.H + 0.42 + k * 0.2, F - 0.1, F + 0.03);
      at(g, pic(1.15, 1.15, (c, w, h) => { c.fillStyle = '#c9c4b6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8b8577'; c.lineWidth = w * 0.03; c.beginPath(); c.arc(w / 2, h / 2, w * 0.46, 0, 7); c.stroke();
        const root = (ox, col2) => { c.strokeStyle = col2; c.lineCap = 'round'; c.lineWidth = w * 0.11; c.beginPath(); c.moveTo(w / 2 + ox, h * 0.25); c.lineTo(w / 2 + ox, h * 0.52); c.stroke(); c.lineWidth = w * 0.06; [[-0.16, 0.8], [0.14, 0.82], [-0.03, 0.86]].forEach(([dx, y]) => { c.beginPath(); c.moveTo(w / 2 + ox, h * 0.5); c.quadraticCurveTo(w / 2 + ox + dx * w * 0.5, h * 0.62, w / 2 + ox + dx * w, h * y); c.stroke(); });
          c.lineWidth = w * 0.02; [[-0.2, 0.12], [0.2, 0.1], [0, 0.08]].forEach(([dx, y]) => { c.beginPath(); c.moveTo(w / 2 + ox, h * 0.26); c.lineTo(w / 2 + ox + dx * w, h * y); c.stroke(); }); };
        root(3, '#7f786a'); root(0, '#efe7d2'); }, 0.08), 0, S.H + 1.75, F + 0.045);
      at(g, label('行藥參元乾', 3.2, 0.5, { kind: 'stone', font: KAI, bg: '#c9c4b6', fg: '#3a332b', glow: 0.05 }), 0, S.H + 0.62, F + 0.04);
      B.bx(M.inner || M.timberD, -S.hw + 0.4, S.hw - 0.4, 0.08, S.gf - 0.2, AB, AB + 0.05);
      at(g, pic(3.6, 2.4, (c, w, h) => { c.fillStyle = '#2b1c12'; c.fillRect(0, 0, w, h); const nx = 12, ny = 8; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { c.fillStyle = (i + j) % 2 ? '#6b4526' : '#5c3a1f'; c.fillRect(i * w / nx + 3, j * h / ny + 3, w / nx - 6, h / ny - 6); c.fillStyle = '#d9b96a'; c.beginPath(); c.arc((i + 0.5) * w / nx, (j + 0.62) * h / ny, 4, 0, 7); c.fill(); c.fillStyle = '#e9dcc0'; c.fillRect((i + 0.3) * w / nx, (j + 0.18) * h / ny, w / nx * 0.4, h / ny * 0.22); } }, 0.5), 0, 2.15, AB + 0.08);
      B.bx(M.timberD, -1.7, 1.7, 0.08, 1.0, AB + 0.5, AB + 1.05); B.bx(M.timber, -1.75, 1.75, 1.0, 1.06, AB + 0.45, AB + 1.1);                // the counter, jars of ginseng and the brass scale on it
      [-1.4, -0.95, -0.5, 0.7, 1.2].forEach((x, i) => { B.cyl(std('#cfe0dc', 0.1, 0.2), 0.14, 0.14, 0.36, x, 1.06, AB + 0.8, 10); B.cyl(GOODS[(i * 2 + 3) % 8], 0.11, 0.11, 0.24, x, 1.07, AB + 0.8, 8); B.cyl(M.red, 0.15, 0.15, 0.05, x, 1.42, AB + 0.8, 10); });
      B.cyl(M.gold, 0.02, 0.02, 0.45, 0.1, 1.06, AB + 0.8, 6); B.bx(M.gold, -0.15, 0.35, 1.5, 1.53, AB + 0.78, AB + 0.82); [-0.13, 0.33].forEach(x => B.cyl(M.gold, 0.11, 0.08, 0.03, x, 1.28, AB + 0.8, 10));
      sackRow(B, -1.9, -0.3, 0.25, 2); sackRow(B, 0.5, 1.9, 0.25, 5); sackRow(B, -1.9, -0.9, -0.5, 1);
      nameBoard(g, '乾元參藥行', 3.3, 0.62, 0, S.gf - 0.18, { kind: 'plaque', rtl: true, bg: '#1c1712', fg: '#e9c46a' }); sideSign(g, '乾元參藥行', S.pierX[1], 5.4, 2.4, { kind: 'box', bg: '#a8201a', fg: '#fff3d6' });
      at(g, hang('人參 鹿茸 燕窩', 1.5, 0.3, { kind: 'paint', mat: 'paper', font: KAI, bg: '#f7ecd0', fg: '#b3241a', glow: 0.25 }), 0, 2.75, 0.3);
      B.build(g); OUT.qianyuan = g; }

    // ═════════ 3. 屈臣氏大藥房 / 小藝埕: three storeys of grey washed stone on the corner of the lane, flat lintels ═════════
    { const g = slot(-1, 8.0), B = Bag(), S = shell(B, { W: 9.4, bays: 3, storeys: 3, wall: M.stone, trim: M.stoneL, pier: M.stone, arcade: 'flat', win: 'flat', frame: M.frameW, ww: 1.7, wh: 1.9, seed: 2, roof: 'tile' });
      B.bx(M.stone, -S.hw, S.hw, S.H + 0.22, S.H + 1.0, F - 0.4, F - 0.02); B.bx(M.stoneL, -S.hw, S.hw, S.H + 1.0, S.H + 1.14, F - 0.46, F + 0.08); S.pierX.forEach(x => { B.bx(M.stone, x - 0.24, x + 0.24, S.H + 0.22, S.H + 1.3, F - 0.44, F + 0.03); urn(B, M.stoneL, x, S.H + 1.3, F - 0.2); });
      pediment(B, M.stone, 0, 3.6, S.H + 1.14, 1.9, 'tri'); B.bx(M.stoneL, -1.9, 1.9, S.H + 1.14, S.H + 1.26, F - 0.34, F + 0.1);
      B.put(M.stoneL, new T.CylinderGeometry(0.52, 0.52, 0.06, 24), 0, S.H + 1.95, F + 0.03, 0, PI / 2); B.put(M.stone, new T.CylinderGeometry(0.42, 0.42, 0.08, 24), 0, S.H + 1.95, F + 0.04, 0, PI / 2);      // a plain roundel where the old trade mark sits (the mark itself is not copied)
      B.put(M.stoneL, new T.CylinderGeometry(0.2, 0.2, 0.1, 8), 0, S.H + 1.95, F + 0.05, 0, PI / 2);
      at(g, label('房藥大氏臣屈', 5.6, 0.56, { kind: 'stone', font: WEI, bg: '#a8a59b', fg: '#efe9da', glow: 0.06 }), 0, S.H + 0.62, F + 0.02);
      at(g, label('A.S. WATSON & CO.', 5.2, 0.3, { kind: 'stone', font: 'Didot,"Times New Roman",serif', bg: '#a8a59b', fg: '#efe9da', glow: 0.06, weight: 700 }), 0, S.gf + S.fh + 0.48, F + 0.115);
      // the side front on the lane (local +x): the same bands and windows, and the small ArtYard door
      B.xf = new T.Matrix4().makeRotationY(PI / 2).setPosition(S.hw - F + 0.15, 0, (BACK + F) / 2 - 0.1);
      { const L = F - BACK - 0.2, hl = L / 2; for (let f = 0; f < 3; f++) { const y = S.gf + f * S.fh; B.bx(M.stoneL, -hl, hl, y - 0.1, y + 0.14, F - 0.05, F + 0.1); }
        [-3.6, -1.2, 1.2, 3.6].forEach((x, i) => { for (let f = 1; f < 3; f++) win(B, x, S.gf + (f - 1) * S.fh + 0.95, 1.3, 1.9, { trim: M.stoneL, frame: M.frameW, lit: (i + f) % 3 === 0 }); B.bx(M.stone, x - 1.25, x - 1.1, 0, S.H, F - 0.02, F + 0.07); });
        [-3.6, 1.2].forEach(x => win(B, x, 1.2, 1.5, 1.7, { trim: M.stoneL, frame: M.frameW, lit: true })); B.bx(M.dark, -1.75, -0.65, 0.05, 2.4, F - 0.02, F + 0.03); B.bx(M.stoneL, -1.9, -0.5, 2.4, 2.6, F - 0.02, F + 0.1); B.bx(M.teal, -1.2, -0.68, 0.05, 2.38, F, F + 0.06);
        B.bx(M.stone, -hl, hl, S.H + 0.22, S.H + 1.0, F - 0.4, F); B.bx(M.stoneL, -hl, hl, S.H + 1.0, S.H + 1.14, F - 0.46, F + 0.08); }
      B.xf = null;
      at(g, hang('小藝埕', 0.42, 1.1, { kind: 'paint', mat: 'paper', vertical: true, bg: '#f0eadd', fg: '#2a2420', glow: 0.25 }), S.hw + 0.3, 2.9, -2.4, 0); at(g, label('ArtYard', 1.0, 0.24, { kind: 'paint', mat: 'paper', font: FONT, bg: '#f0eadd', fg: '#2a2420', weight: 600 }), S.hw + 0.02, 2.95, -4.5, PI / 2);
      // ground floor: the bookshop window, the pharmacy door, the old glass cabinets
      shopfront(B, S.pierX[0] + 0.2, S.pierX[1] - 0.2, S.gf, { frame: M.teal }); shopfront(B, S.pierX[1] + 0.2, S.pierX[2] - 0.2, S.gf, { frame: M.teal, doorW: 1.4 }); shopfront(B, S.pierX[2] + 0.2, S.pierX[3] - 0.2, S.gf, { frame: M.teal, door: S.pierX[3] - 0.95 });
      at(g, pic(1.75, 1.95, (c, w, h) => { c.fillStyle = '#f2dfb0'; c.fillRect(0, 0, w, h); const cols = ['#b3241a', '#22392f', '#2f5f9a', '#d9852b', '#6b4526', '#e9e2d0', '#7d8f3a', '#43301f']; for (let r = 0; r < 4; r++) { c.fillStyle = '#5c3a1f'; c.fillRect(0, (r + 1) * h / 4 - 8, w, 8); let x = 4; let k = r * 3; while (x < w - 10) { const bw2 = 9 + ((k * 7) % 11), bh = h / 4 * (0.6 + ((k * 5) % 4) * 0.08); c.fillStyle = cols[k % cols.length]; c.fillRect(x, (r + 1) * h / 4 - 8 - bh, bw2, bh); x += bw2 + 2; k++; } } }, 0.7), S.mid(2) - 0.62, 1.86, AB + 0.045);
      at(g, label('書店 BOOKS', 1.2, 0.26, { kind: 'paint', mat: 'weathered', bg: '#22392f', fg: '#f1e7d2' }), S.mid(2) - 0.5, 3.2, AB + 0.13); at(g, hang('屈臣氏大藥房', 1.9, 0.4, { kind: 'plaque', rtl: true, bg: '#1c1712', fg: '#e9c46a', thick: 0.06 }), S.mid(1), 3.2, AB + 0.13);
      nameBoard(g, '小藝埕 ArtYard', 3.0, 0.5, 0, S.gf - 0.2, { kind: 'paint', mat: 'teak', bg: '#3a2414', fg: '#f1e7d2', border: false });
      B.bx(M.timberD, -3.9, -2.3, 0.08, 0.95, -0.9, -0.3); B.bx(std('#cfe0dc', 0.1, 0.2), -3.85, -2.35, 0.95, 1.5, -0.85, -0.35); [-3.6, -3.1, -2.6].forEach((x, i) => B.cyl(i % 2 ? M.blue : std('#8a5a2a'), 0.09, 0.09, 0.3, x, 0.98, -0.6, 8));     // a glass cabinet of bottles
      B.build(g); OUT.watsons = g; }

    // ═════════ 4. 波麗路西餐廳: a 1930s café front in the 1947 mid-century manner, coloured relief panels upstairs ═════════
    // Two shops on the same side of the road (Nos. 308 and 314 in life): the corner one by the lane also gets a side front on the lane.
    const boleroShop = (zc, v) => { const g = slot(-1, zc), B = Bag(), wallM = v ? M.ochre : M.cream, sx = v ? -1 : 1;
      const S = shell(B, { W: 4.6, bays: 1, storeys: 2, wall: wallM, trim: M.stoneL, pier: wallM, arcade: 'flat', win: 'flat', frame: M.frameD, ww: 1.3, wh: 1.6, seed: 3 + v, skipWin: () => true });
      const y = S.gf; win(B, -1.2 * sx, y + 0.95, 1.2, 1.6, { trim: M.stoneL, frame: M.frameD, lit: true });
      [[0.1, 0.7, 1.1, 0.5, M.orange], [0.75, 0.7, 1.75, 1.25, M.tealC], [0.1, 1.3, 0.65, 2.6, M.yellow], [0.8, 1.35, 1.75, 1.75, M.frameD], [0.8, 1.85, 1.3, 2.6, M.red], [1.4, 1.85, 1.75, 2.6, M.stoneL]].forEach(([x0, y0, x1, y1, m], i) => B.bx(m, x0 * sx, x1 * sx, y + Math.min(y0, y1), y + Math.max(y0, y1) + (i === 0 ? 0.7 : 0), F - 0.14, F - 0.02 + (i % 3) * 0.03));
      B.bx(wallM, -S.hw, S.hw, S.H + 0.22, S.H + 1.2, F - 0.4, F - 0.02); B.bx(M.stoneL, -S.hw, S.hw, S.H + 1.2, S.H + 1.32, F - 0.45, F + 0.06); for (let k = 0; k < 4; k++) B.bx(M.stoneL, -S.hw + 0.3, S.hw - 0.3, S.H + 0.4 + k * 0.2, S.H + 0.45 + k * 0.2, F - 0.1, F + 0.02);
      if (v) { B.bx(wallM, -1.1, 1.1, S.H + 1.32, S.H + 1.9, F - 0.4, F - 0.02); B.bx(M.stoneL, -1.2, 1.2, S.H + 1.9, S.H + 2.0, F - 0.45, F + 0.04); at(g, label('BOLERO', 1.8, 0.4, { kind: 'stone', font: 'Didot,"Times New Roman",serif', bg: '#d9b77c', fg: '#7a1c14', glow: 0.05, weight: 800 }), 0, S.H + 1.6, F - 0.005); }
      B.bx(M.timber, -S.hw + 0.35, S.hw - 0.35, 0.08, S.gf - 0.2, AB, AB + 0.06); B.bx(M.timberD, -0.55, 0.55, 0.08, 2.5, AB + 0.02, AB + 0.1); B.put(M.litSoft, new T.CylinderGeometry(0.24, 0.24, 0.04, 20), 0, 1.75, AB + 0.11, 0, PI / 2); B.bx(M.gold, 0.35, 0.4, 1.0, 1.5, AB + 0.1, AB + 0.16);
      [-1.45, 1.45].forEach(x => { B.put(M.litSoft, new T.CylinderGeometry(0.42, 0.42, 0.04, 24), x, 1.9, AB + 0.07, 0, PI / 2); B.bx(M.timberD, x - 0.42, x + 0.42, 1.88, 1.92, AB + 0.08, AB + 0.11); B.bx(M.timberD, x - 0.02, x + 0.02, 1.48, 2.32, AB + 0.08, AB + 0.11); B.put(M.timberD, new T.TorusGeometry(0.44, 0.045, 6, 24), x, 1.9, AB + 0.09); });
      at(g, hang('BOLERO', 2.0, 0.4, { kind: 'neon', font: '"Snell Roundhand","Brush Script MT",cursive', bg: '#1c1712', fg: '#ff9a6a', glow: 1.3 }), 0, 3.05, AB + 0.08);
      B.bx(v ? M.tealC : M.redD, -S.hw + 0.2, S.hw - 0.2, S.gf - 0.52, S.gf - 0.44, F - 0.04, F + 0.7);                                         // the awning
      nameBoard(g, '台北老店波麗路', 3.4, 0.62, 0, S.gf + 0.3, { kind: 'plaque', mat: 'teak', font: LI, bg: '#7a5636', fg: '#f3e2b8', frameMat: M.timberD, glow: 0.35 });
      sideSign(g, 'BOLERO', S.pierX[v ? 0 : 1], 5.0, 2.6, { kind: 'neon', font: 'Didot,"Times New Roman",serif', bg: '#1c1712', fg: '#ff9a6a' }); if (!v) sideSign(g, '波麗路西餐廳', S.pierX[0], 5.2, 2.6, { kind: 'box', font: KAI, bg: '#f6efe0', fg: '#a8201a' });
      B.bx(M.timberD, 1.3, 1.75, 0.08, 1.25, 0.1, 0.16); at(g, label(v ? '法式鴨子飯 咖啡' : '咖啡 牛排 定食', 0.4, 0.9, { kind: 'paint', mat: 'paper', vertical: true, bg: '#f7ecd0', fg: '#2a2420', glow: 0.25 }), 1.52, 0.72, 0.165);       // the menu board; a record player in the window
      B.bx(M.timberD, -1.75, -1.15, 0.08, 0.95, -0.9, -0.4); B.cyl(M.dark, 0.2, 0.2, 0.03, -1.45, 0.95, -0.65, 18); B.cyl(M.red, 0.06, 0.06, 0.035, -1.45, 0.95, -0.65, 10);
      if (v) { [[0.2, -0.75], [1.0, -0.75]].forEach(([x, z]) => { B.cyl(M.timber, 0.3, 0.3, 0.04, x, 0.74, z, 12); B.cyl(M.ink, 0.03, 0.03, 0.66, x, 0.08, z, 6); B.cyl(M.steel, 0.14, 0.14, 0.015, x, 0.78, z, 12, 0, 0); }); }          // two booth tables with steel oval plates
      if (!v) {   // the side front on the lane (local −x): windows, the 1947 colour panels, portholes, a side door, the name painted on the plaster
        const tx = -(S.hw - F) - 0.05, tz = (BACK + F) / 2, hl = (F - BACK) / 2, gx = AB - tz - 0.1;                    // gx: where the open arcade begins on this side
        B.xf = new T.Matrix4().makeRotationY(-PI / 2).setPosition(tx, 0, tz);
        [S.gf, S.H].forEach(yy => { B.bx(M.stoneL, -hl, hl, yy - 0.1, yy + 0.14, F - 0.05, F + 0.1); B.bx(M.stoneL, -hl, hl, yy + 0.14, yy + 0.22, F - 0.05, F + 0.15); });
        B.bx(M.stoneL, -hl, gx, 0, 0.45, F - 0.02, F + 0.09); B.bx(M.cream, -hl, hl, S.H + 0.22, S.H + 1.2, F - 0.3, F + 0.02); B.bx(M.stoneL, -hl, hl, S.H + 1.2, S.H + 1.32, F - 0.35, F + 0.1); for (let k = 0; k < 4; k++) B.bx(M.stoneL, -hl + 0.3, hl - 0.3, S.H + 0.4 + k * 0.2, S.H + 0.45 + k * 0.2, F - 0.05, F + 0.05);
        [-4.0, -1.9, 0.2].forEach((x, i) => win(B, x, y + 0.95, 1.2, 1.6, { trim: M.stoneL, frame: M.frameD, lit: i === 1 }));
        [[1.5, 0.7, 2.5, 0.5 + 1.4, M.orange], [2.6, 0.7, 3.7, 1.25, M.tealC], [3.8, 0.7, 4.6, 1.9, M.yellow], [2.6, 1.35, 3.7, 1.75, M.frameD], [1.5, 2.0, 2.2, 2.6, M.stoneL], [2.3, 1.85, 3.2, 2.6, M.red], [3.3, 2.0, 4.6, 2.6, M.blue]].forEach(([x0, y0, x1, y1, m], i) => B.bx(m, x0, x1, y + y0, y + y1, F - 0.1, F + 0.04 + (i % 3) * 0.03));
        [-4.2, -2.9, -1.6].forEach(x => { B.put(M.litSoft, new T.CylinderGeometry(0.42, 0.42, 0.05, 24), x, 1.9, F + 0.02, 0, PI / 2); B.bx(M.timberD, x - 0.42, x + 0.42, 1.88, 1.92, F + 0.03, F + 0.07); B.bx(M.timberD, x - 0.02, x + 0.02, 1.48, 2.32, F + 0.03, F + 0.07); B.put(M.timberD, new T.TorusGeometry(0.44, 0.05, 6, 24), x, 1.9, F + 0.05); });
        B.bx(M.timberD, 0.3, 1.5, 0.05, 2.5, F - 0.02, F + 0.06); B.bx(M.timber, 0.4, 1.4, 0.15, 2.4, F + 0.06, F + 0.09); B.put(M.litSoft, new T.CylinderGeometry(0.22, 0.22, 0.04, 20), 0.9, 1.8, F + 0.1, 0, PI / 2); B.bx(M.gold, 1.22, 1.27, 1.0, 1.4, F + 0.09, F + 0.15);      // the side door
        B.bx(M.stoneL, 0.1, 1.7, 0, 0.14, F, F + 0.5); B.put(M.redD, new T.BoxGeometry(1.7, 0.05, 0.9), 0.9, 2.78, F + 0.4, 0, 0.3); B.bx(M.ink, 1.72, 1.78, 2.2, 2.26, F, F + 0.22); B.bx(M.lantern, 1.66, 1.84, 1.98, 2.2, F + 0.12, F + 0.3);
        B.cyl(M.steel, 0.05, 0.05, S.H + 0.2, -4.95, 0, F + 0.1, 8); B.bx(M.steel, -5.03, -4.87, 2.2, 2.26, F + 0.02, F + 0.16); B.bx(M.steel, -5.03, -4.87, 5.2, 5.26, F + 0.02, F + 0.16);
        B.bx(M.stoneL, -2.3, -1.5, y + 0.26, y + 0.7, F + 0.02, F + 0.42); B.bx(M.ink, -2.2, -1.6, y + 0.32, y + 0.64, F + 0.42, F + 0.44);                                                             // an air-conditioner on its bracket
        B.xf = null;
        const sideAt = (m, x, yy, dz = 0.03) => at(g, m, -(F + dz) + tx, yy, x + tz, -PI / 2);
        sideAt(label('BOLERO', 3.3, 0.62, { kind: 'stone', font: 'Didot,"Times New Roman",serif', bg: '#e3d4b3', fg: '#7a1c14', glow: 0.08, weight: 800 }), -2.9, 3.05); sideAt(label('波麗路西餐廳', 3.3, 0.24, { kind: 'stone', font: KAI, bg: '#e3d4b3', fg: '#3a2a20', glow: 0.06, spread: true }), -2.9, 2.62);
        sideAt(label('BOLERO', 0.9, 0.2, { kind: 'paint', mat: 'brass', font: 'Didot,"Times New Roman",serif', bg: '#7a5636', fg: '#2a1a10', weight: 800 }), 0.9, 2.62, 0.1); }
      B.build(g); return g; };
    OUT.bolero = boleroShop(-32.8, 0); OUT.bolero2 = boleroShop(-37.6, 1);

    // ═════════ 5. 林柳新紀念偶戲博物館: a red-brick 洋樓 with arched windows, a glove-puppet stage in the arcade ═════════
    { const g = slot(-1, 0.8), B = Bag(), S = shell(B, { W: 4.6, bays: 2, storeys: 3, wall: M.brick, trim: M.stoneL, arcade: 'arch', win: 'arch', frame: M.teal, ww: 1.05, wh: 1.9, seed: 5, pw: 0.5, roof: 'tile' });
      balustrade(B, -S.hw, S.hw, S.H + 0.22, F - 0.1, 0.85, [...S.pierX], M.stoneL, M.green); pediment(B, M.brick, 0, 2.0, S.H + 0.22, 1.5, 'round'); urn(B, M.stoneL, 0, S.H + 1.7, F - 0.14);
      B.put(M.stoneL, new T.CylinderGeometry(0.3, 0.3, 0.06, 18), 0, S.H + 0.95, F + 0.03, 0, PI / 2);
      B.bx(M.brick, -S.hw + 0.3, S.hw - 0.3, 0.08, S.gf - 0.2, AB, AB + 0.05); B.bx(M.dark, 0.75, 1.8, 0.08, 2.5, AB + 0.02, AB + 0.08); B.bx(M.teal, 0.68, 0.75, 0.08, 2.55, AB + 0.02, AB + 0.12); B.bx(M.teal, 1.8, 1.87, 0.08, 2.55, AB + 0.02, AB + 0.12);
      // the carved stage: red posts, gold fretwork, a painted backdrop, three glove puppets
      { const x0 = -1.85, x1 = 0.35, zf = AB + 0.75; B.bx(M.timberD, x0, x1, 0.08, 1.05, AB + 0.05, zf); B.bx(M.red, x0, x1, 1.05, 1.15, AB + 0.05, zf + 0.06); [x0, x1 - 0.12].forEach(x => B.bx(M.red, x, x + 0.12, 1.15, 2.75, zf - 0.14, zf)); B.bx(M.red, x0 - 0.06, x1 + 0.06, 2.75, 3.0, AB + 0.05, zf + 0.06);
        B.bx(M.gold, x0 + 0.12, x1 - 0.12, 2.55, 2.75, zf - 0.08, zf - 0.02); B.bx(M.gold, x0 + 0.12, x1 - 0.12, 1.15, 1.25, zf - 0.08, zf - 0.02); for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.3) B.bx(M.gold, x, x + 0.05, 2.35, 2.55, zf - 0.08, zf - 0.03);
        B.put(M.tile, new T.BoxGeometry(x1 - x0 + 0.5, 0.06, 0.8), (x0 + x1) / 2, 3.12, AB + 0.5, 0, 0.3); at(g, label('掌中戲', 0.9, 0.22, { kind: 'paint', mat: 'redlacquer', font: WEI, bg: '#7a1c14', fg: '#f3d27a' }), (x0 + x1) / 2, 2.875, zf + 0.065);
        at(g, pic(1.95, 1.3, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2c46a'); gr.addColorStop(1, '#c9623a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#7a1c14'; [[0.2, 0.7], [0.5, 0.55], [0.8, 0.7]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x * w - w * 0.2, h); c.lineTo(x * w, y * h); c.lineTo(x * w + w * 0.2, h); c.fill(); }); c.fillStyle = '#f7ecd0'; c.beginPath(); c.arc(w * 0.75, h * 0.25, h * 0.1, 0, 7); c.fill(); }, 0.6), (x0 + x1) / 2, 1.85, AB + 0.07);
        [[-1.4, M.blue, '#f0d9c0'], [-0.75, M.red, '#f0d9c0'], [-0.1, M.green, '#e9c9a8']].forEach(([x, robe, skin], i) => { B.cyl(robe, 0.05, 0.17, 0.42, x, 1.17, zf - 0.3, 8); B.ball(std(skin), 0.09, x, 1.66, zf - 0.3); B.bx(i === 1 ? M.gold : M.dark, x - 0.1, x + 0.1, 1.72, 1.8, zf - 0.38, zf - 0.22); B.bx(robe, x - 0.24, x + 0.24, 1.42, 1.5, zf - 0.34, zf - 0.26); B.bx(M.gold, x - 0.05, x + 0.05, 1.2, 1.5, zf - 0.215, zf - 0.2); }); }
      nameBoard(g, '林柳新紀念偶戲博物館', 3.4, 0.5, 0, S.gf + 0.55, { kind: 'paint', mat: 'teak', font: KAI, bg: '#3a2414', fg: '#f1e2b8', border: false, sub: 'Lin Liu-Hsin Puppet Theatre Museum', subFont: FONT }); sideSign(g, '偶戲館', S.pierX[2], 5.4, 1.6, { kind: 'cloth', font: WEI, bg: '#7a1c14', fg: '#f6e3a8', w: 0.5 });
      B.build(g); OUT.puppet = g; }

    // ═════════ 6. 李臨秋故居: two storeys, brick below and white plaster above, four posts and three bays, a tiled eave ═════════
    { const g = slot(-1, -4.0), B = Bag(), S = shell(B, { W: 4.6, bays: 3, storeys: 2, wall: M.white, trim: M.timber, pier: M.brick, arcade: 'flat', beam: M.timberD, win: 'flat', frame: M.teal, ww: 0.95, wh: 1.5, seed: 0, pw: 0.34, fh: 3.0, roof: 'none' });
      for (let k = 0; k < 2; k++) B.put(M.tile, new T.BoxGeometry(S.W + 0.3, 0.1, 2.2), 0, S.H + 0.55 - k * 0.02, F - 0.75, 0, 0.42); for (let x = -S.hw; x <= S.hw + 0.01; x += 0.33) B.put(M.tile, new T.CylinderGeometry(0.06, 0.06, 2.2, 6), x, S.H + 0.62, F - 0.75, 0, PI / 2 + 0.42);
      B.bx(M.white, -S.hw, S.hw, S.H, S.H + 1.0, BACK, F - 1.4); B.bx(M.tile, -S.hw - 0.1, S.hw + 0.1, S.H + 0.98, S.H + 1.1, F - 1.9, F - 1.5);
      B.bx(M.brick, -S.hw + 0.2, S.hw - 0.2, 0.08, S.gf - 0.2, AB, AB + 0.05); B.bx(M.timberD, -0.5, 0.5, 0.08, 2.4, AB + 0.02, AB + 0.1); B.bx(M.teal, -0.02, 0.02, 0.08, 2.4, AB + 0.1, AB + 0.12);
      [-1.45, 1.45].forEach(x => { B.bx(M.teal, x - 0.5, x + 0.5, 1.0, 2.4, AB + 0.02, AB + 0.1); B.bx(M.lit, x - 0.42, x + 0.42, 1.08, 2.32, AB + 0.1, AB + 0.12); B.bx(M.teal, x - 0.02, x + 0.02, 1.08, 2.32, AB + 0.12, AB + 0.14); });
      B.bx(M.timber, 0.9, 1.95, 0.75, 0.8, -1.3, -0.7); [[0.95, -1.25], [1.9, -1.25], [0.95, -0.75], [1.9, -0.75]].forEach(([x, z]) => B.bx(M.timber, x - 0.03, x + 0.03, 0.08, 0.75, z - 0.03, z + 0.03));          // his writing desk at the window, lyric sheets on it
      B.bx(M.paper, 1.1, 1.4, 0.8, 0.81, -1.15, -0.8); B.bx(M.paper, 1.45, 1.75, 0.8, 0.815, -1.1, -0.75); B.cyl(M.dark, 0.03, 0.03, 0.12, 1.85, 0.8, -1.15, 6); B.bx(M.timberD, 1.2, 1.6, 0.08, 0.5, -0.55, -0.2);
      at(g, label('望春風', 0.3, 0.75, { kind: 'paint', mat: 'paper', font: XING, vertical: true, bg: '#f7ecd0', fg: '#2a2420', glow: 0.3 }), -1.45, 1.75, AB + 0.13); at(g, label('臺北市歷史建築 · 李臨秋故居', 0.96, 0.26, { kind: 'enamel', mat: 'brass', tint: 0, font: FONT, bg: '#43301f', fg: '#2a1a10', weight: 700 }), 0, 2.8, AB + 0.12);
      nameBoard(g, '李臨秋故居', 2.4, 0.46, 0, S.gf - 0.2, { kind: 'plaque', mat: 'teak', font: KAI, bg: '#43301f', fg: '#f6e3a8', frameMat: M.timberD });
      B.build(g); OUT.li = g; }

    // ═════════ 7. 義美 創始地 (延平門市): a clean shop front, a red band sign, glass counters of pastries ═════════
    { const g = slot(1, 29.6), B = Bag(), S = shell(B, { W: 4.6, bays: 1, storeys: 3, wall: M.cream, trim: M.white, pier: M.white, arcade: 'flat', win: 'flat', frame: M.frameD, ww: 3.1, wh: 1.6, bars: 3, seed: 1 });
      B.bx(M.cream, -S.hw, S.hw, S.H + 0.22, S.H + 0.9, F - 0.4, F - 0.02); B.bx(M.white, -S.hw, S.hw, S.H + 0.9, S.H + 1.0, F - 0.45, F + 0.05); B.bx(M.red, -S.hw, S.hw, S.gf + S.fh - 0.42, S.gf + S.fh - 0.14, F - 0.1, F + 0.02);
      B.bx(M.white, -S.hw + 0.3, S.hw - 0.3, 0.08, S.gf - 0.2, AB, AB + 0.05); B.bx(M.lit, -1.9, 1.9, 1.1, 3.0, AB + 0.05, AB + 0.07);
      at(g, pic(3.8, 1.9, (c, w, h) => { c.fillStyle = '#f6e6c0'; c.fillRect(0, 0, w, h); for (let r = 0; r < 3; r++) { c.fillStyle = '#b08a5a'; c.fillRect(0, (r + 1) * h / 3 - 10, w, 10); for (let i = 0; i < 9; i++) { c.fillStyle = ['#b3241a', '#e0b23a', '#d9852b', '#f0eadd', '#7a1c14'][(i + r * 2) % 5]; c.fillRect(i * w / 9 + 8, (r + 1) * h / 3 - 10 - h * 0.2, w / 9 - 16, h * 0.2); c.fillStyle = '#f3d27a'; c.fillRect(i * w / 9 + 8, (r + 1) * h / 3 - 10 - h * 0.12, w / 9 - 16, h * 0.03); } } }, 0.65), 0, 2.05, AB + 0.08);
      [-1.25, 1.25].forEach(x => { B.bx(M.white, x - 0.85, x + 0.85, 0.08, 0.6, -1.0, -0.3); B.bx(std('#cfe0dc', 0.1, 0.2), x - 0.83, x + 0.83, 0.6, 1.15, -0.98, -0.32); B.bx(M.white, x - 0.86, x + 0.86, 1.15, 1.2, -1.01, -0.29);
        for (let i = 0; i < 5; i++) { B.bx(i % 2 ? M.yellow : std('#c9884a'), x - 0.72 + i * 0.3, x - 0.5 + i * 0.3, 0.62, 0.74 + (i % 3) * 0.05, -0.85, -0.45); } });
      [[-0.2, 0.12, M.red], [0.15, 0.2, M.yellow], [-0.02, 0.2, M.red]].forEach(([x, z, m], i) => B.bx(m, x - 0.2, x + 0.2, 0.08 + (i === 2 ? 0.26 : 0), 0.34 + (i === 2 ? 0.26 : 0), z - 0.15 + 0.15, z + 0.3));                // gift boxes stacked at the door
      nameBoard(g, '義美食品', 3.7, 0.8, 0, S.gf - 0.1, { kind: 'box', font: KAI, spread: true, bg: '#c4201a', fg: '#ffffff' }); sideSign(g, '義美', S.pierX[0], 5.2, 1.5, { kind: 'box', font: KAI, bg: '#c4201a', fg: '#ffffff' });
      B.bx(M.granite, 1.55, 2.05, 0.08, 1.15, 0.25, 0.4); at(g, label('大安醫院舊址', 0.42, 0.9, { kind: 'stone', vertical: true, bg: '#3a3a3e', fg: '#e9dcc0', glow: 0.2 }), 1.8, 0.68, 0.405); at(g, label('蔣渭水 1916', 0.44, 0.13, { bg: '#3a3a3e', fg: '#e9dcc0', weight: 600 }), 1.8, 0.2, 0.406);
      // the upper floors of a 1960s–70s shop block: sun-shade slabs over each window, fins, a tall fin sign, a roof board (plain text, no logo)
      for (let f = 1; f < 3; f++) { const yy = S.gf + (f - 1) * S.fh; B.bx(M.white, -1.95, 1.95, yy + 2.82, yy + 2.92, F - 0.12, F + 0.42); B.bx(M.white, -1.95, 1.95, yy + 0.62, yy + 0.72, F - 0.12, F + 0.3);
        for (let x = -1.5; x <= 1.51; x += 0.5) B.bx(M.red, x - 0.03, x + 0.03, yy + 0.3, yy + 0.62, F + 0.22, F + 0.26); B.bx(M.red, -1.9, 1.9, yy + 0.58, yy + 0.62, F + 0.2, F + 0.28);                 // a little red rail under each window
        B.bx(M.stoneL, -1.3 + f * 0.9, -0.5 + f * 0.9, yy + 0.16, yy + 0.56, F - 0.02, F + 0.36); B.bx(M.ink, -1.22 + f * 0.9, -0.58 + f * 0.9, yy + 0.22, yy + 0.5, F + 0.36, F + 0.38); }
      [-2.0, 2.0].forEach(x => B.bx(M.white, x - 0.07, x + 0.07, S.gf + 0.3, S.H + 0.2, F - 0.12, F + 0.2));
      sideSign(g, '義美食品', S.pierX[1], S.gf + 3.4, 4.6, { kind: 'box', font: KAI, bg: '#c4201a', fg: '#ffffff', w: 0.66 });
      [-1.5, 1.5].forEach(x => { B.bx(M.steel, x - 0.04, x + 0.04, S.H + 1.0, S.H + 2.9, F - 0.75, F - 0.67); B.bx(M.steel, x - 0.04, x + 0.04, S.H + 1.0, S.H + 1.06, F - 1.9, F - 0.7); B.put(M.steel, new T.BoxGeometry(0.06, 2.2, 0.06), x, S.H + 1.9, F - 1.3, 0, 0.55); });
      at(g, hang('義美', 3.6, 1.5, { kind: 'box', font: KAI, spread: true, bg: '#c4201a', fg: '#ffffff' }), 0, S.H + 2.2, F - 0.6);
      B.put(M.red, new T.BoxGeometry(S.W - 0.3, 0.05, 1.2), 0, S.gf - 0.95, F + 0.55, 0, 0.3); for (let x = -S.hw + 0.3; x < S.hw - 0.2; x += 0.5) B.put(M.paper, new T.BoxGeometry(0.22, 0.055, 1.2), x + 0.1, S.gf - 0.948, F + 0.55, 0, 0.3);
      at(g, hang('蛋捲　喜餅　禮盒　冰棒', 3.2, 0.28, { kind: 'box', font: KAI, bg: '#fff6e0', fg: '#b3241a', thick: 0.08 }), 0, 3.2, AB + 0.09);
      B.build(g); OUT.imei = g; }

    // ═════════ 8. 天馬茶房 (the old low building, before 2005): a plain plaster front, the tea-house sign, an awning ═════════
    { const g = slot(1, 15.2), B = Bag(), S = shell(B, { W: 4.6, bays: 2, storeys: 2, wall: M.mint, trim: M.stoneL, pier: M.mint, arcade: 'flat', win: 'flat', frame: M.frameD, ww: 1.2, wh: 1.5, seed: 2, fh: 3.1, pw: 0.5 });
      B.bx(M.mint, -S.hw, S.hw, S.H + 0.22, S.H + 0.85, F - 0.4, F - 0.02); B.bx(M.stoneL, -S.hw, S.hw, S.H + 0.85, S.H + 0.97, F - 0.45, F + 0.06); B.bx(M.mint, -0.9, 0.9, S.H + 0.97, S.H + 1.5, F - 0.4, F - 0.02); B.bx(M.stoneL, -1.0, 1.0, S.H + 1.5, S.H + 1.6, F - 0.45, F + 0.04);
      at(g, label('房茶馬天', 1.6, 0.36, { kind: 'stone', font: KAI, bg: '#b9c9b4', fg: '#3a332b', glow: 0.05 }), 0, S.H + 1.22, F - 0.005);
      shopfront(B, S.pierX[0] + 0.2, S.pierX[1] - 0.2, S.gf, { frame: M.frameD }); shopfront(B, S.pierX[1] + 0.2, S.pierX[2] - 0.2, S.gf, { frame: M.frameD, door: S.pierX[2] - 0.85 });
      B.put(M.redD, new T.BoxGeometry(S.W - 0.3, 0.05, 1.3), 0, S.gf - 0.75, F + 0.5, 0, 0.32); for (let x = -S.hw + 0.3; x < S.hw - 0.2; x += 0.5) B.put(M.paper, new T.BoxGeometry(0.22, 0.055, 1.3), x + 0.1, S.gf - 0.748, F + 0.5, 0, 0.32);
      nameBoard(g, '茶房', 2.0, 0.62, 0, S.gf + 0.45, { kind: 'plaque', mat: 'teak', rtl: true, bg: '#5a3a22', fg: '#f6e3a8', frameMat: M.timberD }); sideSign(g, '茶', S.pierX[0], 4.9, 1.4, { kind: 'cloth', font: WEI, bg: '#22392f', fg: '#f6e3a8', w: 0.6 });
      B.cyl(M.timber, 0.36, 0.36, 0.04, -1.3, 0.76, 0.0, 14); B.cyl(M.ink, 0.03, 0.03, 0.7, -1.3, 0.08, 0.0, 6); [[-1.8, 0.1], [-0.8, -0.1]].forEach(([x, z]) => { B.cyl(M.timberD, 0.17, 0.17, 0.04, x, 0.5, z, 10); B.cyl(M.ink, 0.02, 0.02, 0.44, x, 0.08, z, 5); });          // a café table and two stools under the arcade
      B.build(g); OUT.tianma = g; }

    // ═════════ 9. 大稻埕慈聖宮: the Mazu temple's front, dragon columns, swallowtail ridge, food stalls on the forecourt ═════════
    { const g = slot(1, -35.2), B = Bag(), hw = 4.7, zf = -4.2, tile = M.tile;
      B.bx(M.stoneL, -hw, hw, 0, 0.3, BACK, zf + 1.3); B.bx(M.stoneL, -2.4, 2.4, 0, 0.15, zf + 1.3, zf + 1.65); B.bx(M.floor, -hw, hw, 0, 0.04, zf + 1.3, F + 0.1);
      B.bx(M.red, -hw, hw, 0.3, 4.3, BACK, zf); B.bx(M.stone, -hw, hw, 0.3, 1.1, BACK + 0.1, zf + 0.04);
      // three doors with studded red leaves; the name plaque over the middle one
      const studs = (w, h) => pic(w, h, (c, cw, ch) => { c.fillStyle = '#9a1f16'; c.fillRect(0, 0, cw, ch); c.strokeStyle = '#5a120c'; c.lineWidth = 6; c.strokeRect(3, 3, cw - 6, ch - 6); c.beginPath(); c.moveTo(cw / 2, 0); c.lineTo(cw / 2, ch); c.stroke(); c.fillStyle = '#e0b23a'; for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) { c.beginPath(); c.arc((i + 0.5) * cw / 6, (j + 0.6) * ch / 7.6, cw * 0.022, 0, 7); c.fill(); } c.strokeStyle = '#e0b23a'; c.lineWidth = 5; [-1, 1].forEach(s => { c.beginPath(); c.arc(cw / 2 + s * cw * 0.09, ch * 0.52, cw * 0.035, 0, 7); c.stroke(); }); }, 0.3);
      [[0, 2.0, 3.0], [-3.1, 1.3, 2.6], [3.1, 1.3, 2.6]].forEach(([x, w, h]) => { at(g, studs(w, h), x, 0.3 + h / 2, zf + 0.06); B.bx(M.stoneL, x - w / 2 - 0.16, x - w / 2, 0.3, 0.3 + h + 0.16, zf, zf + 0.12); B.bx(M.stoneL, x + w / 2, x + w / 2 + 0.16, 0.3, 0.3 + h + 0.16, zf, zf + 0.12); B.bx(M.stoneL, x - w / 2 - 0.16, x + w / 2 + 0.16, 0.3 + h, 0.3 + h + 0.18, zf, zf + 0.14); });
      at(g, hang('慈聖宮', 1.5, 0.6, { kind: 'plaque', rtl: true, spread: true, bg: '#1c1712', fg: '#e9c46a', border: '#e9c46a', frameMat: M.red, glow: 0.45 }), 0, 3.85, zf + 0.35); at(g, hang('天上聖母', 0.3, 1.5, { kind: 'plaque', mat: 'redlacquer', font: XING, vertical: true, bg: '#6a1d14', fg: '#f3d27a', thick: 0.04, flat: true }), -1.35, 1.9, zf + 0.07); at(g, hang('大稻埕媽祖', 0.3, 1.5, { kind: 'plaque', mat: 'redlacquer', font: XING, vertical: true, bg: '#6a1d14', fg: '#f3d27a', thick: 0.04, flat: true }), 1.35, 1.9, zf + 0.07);
      [-1.9, 1.9].forEach(x => { B.bx(M.stone, x - 0.28, x + 0.28, 0.3, 0.6, zf + 0.9 - 0.28, zf + 0.9 + 0.28); B.cyl(M.stone, 0.2, 0.22, 3.5, x, 0.6, zf + 0.9, 12); B.bx(M.stone, x - 0.26, x + 0.26, 4.1, 4.3, zf + 0.64, zf + 1.16);
        for (let k = 0; k < 26; k++) { const a = k * 0.8, yy = 0.75 + k * 0.125; B.put(M.stoneL, new T.SphereGeometry(0.085, 6, 5), x + Math.cos(a) * 0.2, yy, zf + 0.9 + Math.sin(a) * 0.2); } B.ball(M.stoneL, 0.14, x + 0.05, 3.9, zf + 1.12, 0.9); });                // the dragon coiling up each column
      [-4.4, 4.4].forEach(x => { B.bx(M.stone, x - 0.2, x + 0.2, 0.3, 4.3, zf + 0.7, zf + 1.1); });
      [-2.5, 2.5].forEach(x => { B.bx(M.stoneD, x - 0.3, x + 0.3, 0.3, 1.9, zf + 0.04, zf + 0.16); });                                                                                             // the stone tablets
      // roofs: a raised middle, lower wings, round tile ribs, a ridge that sweeps up to swallowtails
      const roof = (x0, x1, yr, lift) => { const cx = (x0 + x1) / 2, w = x1 - x0; B.put(tile, new T.BoxGeometry(w + 0.3, 0.14, 3.3), cx, yr - 0.62, zf + 0.3, 0, 0.38); for (let x = x0; x <= x1 + 0.01; x += 0.3) B.put(tile, new T.CylinderGeometry(0.065, 0.065, 3.3, 6), x, yr - 0.52, zf + 0.3, 0, PI / 2 + 0.38);
        B.put(tile, new T.BoxGeometry(w + 0.3, 0.14, 3.0), cx, yr - 0.58, zf - 2.4, 0, -0.38); B.bx(M.green, x0 - 0.15, x1 + 0.15, yr - 1.3, yr - 1.18, zf + 1.75, zf + 1.9);
        const s = new T.Shape(); s.moveTo(x0 - 0.5, yr + lift); s.quadraticCurveTo(cx, yr - lift * 0.75, x1 + 0.5, yr + lift); s.lineTo(x1 + 0.25, yr + lift - 0.3); s.quadraticCurveTo(cx, yr - lift * 0.75 - 0.42, x0 - 0.25, yr + lift - 0.3);
        B.put(M.redD, new T.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 16 }), 0, 0, zf - 1.15);
        for (let x = x0 + 0.3; x < x1; x += 0.45) { const u = (x - cx) / (w / 2 + 0.5), yy = yr - lift * 0.75 + (lift * 1.75) * u * u * 0.98; B.bx([M.green, M.yellow, M.blue][Math.round(x * 7 + 50) % 3], x - 0.1, x + 0.1, yy - 0.1, yy + 0.08, zf - 1.2, zf - 0.9); } };
      B.bx(M.red, -2.4, 2.4, 4.3, 5.2, BACK, zf); roof(-2.4, 2.4, 6.45, 0.75); roof(-hw, -2.4, 5.5, 0.55); roof(2.4, hw, 5.5, 0.55);
      B.ball(M.gold, 0.2, 0, 6.12, zf - 1.05); B.ball(M.red, 0.13, 0, 6.42, zf - 1.05); B.cyl(M.gold, 0.02, 0.06, 0.25, 0, 6.5, zf - 1.05, 6);
      [-1.25, 1.25].forEach(x => redLantern(B, x, 3.2, zf + 1.3, 0.34)); [-3.1, 3.1].forEach(x => redLantern(B, x, 3.0, zf + 1.3, 0.26));
      B.cyl(M.stoneD, 0.5, 0.36, 0.55, 0, 0.75, zf + 2.6, 16); [0, 2.1, 4.2].forEach(a => B.cyl(M.stoneD, 0.06, 0.05, 0.7, Math.cos(a) * 0.32, 0.05, zf + 2.6 + Math.sin(a) * 0.32, 6)); B.cyl(M.lit, 0.44, 0.44, 0.02, 0, 1.3, zf + 2.6, 16);
      // the forecourt's eating tables: folding tables and plastic stools (the cooked-food stall itself comes from the engine)
      [[-3.2, -1.6], [-1.6, -0.2], [2.9, -0.9]].forEach(([x, z], i) => { B.bx(M.steel, x - 0.45, x + 0.45, 0.7, 0.74, z - 0.45, z + 0.45); [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]].forEach(([a, b]) => B.cyl(M.ink, 0.015, 0.015, 0.66, x + a, 0.04, z + b, 4));
        [[-0.75, 0], [0.75, 0], [0, -0.75], [0, 0.75]].forEach(([a, b], j) => B.cyl((i + j) % 2 ? M.red : M.blue, 0.13, 0.16, 0.42, x + a, 0.04, z + b, 8)); B.cyl(M.paper, 0.1, 0.07, 0.07, x + 0.1, 0.74, z, 8); B.cyl(M.paper, 0.1, 0.07, 0.07, x - 0.2, 0.74, z + 0.15, 8); });
      // the brick wall with a tiled coping that parts the temple yard from the market's front
      B.bx(M.brick, hw + 0.02, hw + 0.22, 0, 2.5, zf, F - 0.2); B.bx(tile, hw - 0.06, hw + 0.3, 2.5, 2.62, zf, F - 0.2);
      B.build(g); OUT.cisheng = g;
      ['1 肉粥', '2 排骨湯', '3 炸紅糟'].forEach((t, i) => at(g, label(t, 1.1, 0.34, { bg: '#f7ecd0', fg: '#b3241a', border: '#b3241a', glow: 0.3 }), 4.68, 2.05, -3.4 + i * 1.35, -PI / 2));   // numbered stall cards on the yard's south wall
    }

    // ═════════ 10. 林五湖本館: the 1851 Minnan house already in the row; its boards, lanterns and the fortune-teller's table ═════════
    { const g = slot(-1, -42.4), B = Bag();
      at(g, hang('林五湖本館', 2.4, 0.5, { kind: 'plaque', rtl: true, bg: '#1c1712', fg: '#e9c46a' }), 0, 3.05, F + 0.1); at(g, hang('命相', 0.5, 0.95, { kind: 'cloth', font: WEI, vertical: true, bg: '#b3241a', fg: '#f3d27a' }), -1.95, 2.3, F + 0.4, PI / 2); at(g, hang('擇日 卜卦', 0.42, 1.3, { kind: 'paint', mat: 'paper', font: KAI, vertical: true, bg: '#f7ecd0', fg: '#2a2420' }), 1.95, 2.15, F + 0.4, PI / 2);
      redLantern(B, -1.2, 2.45, F + 0.25, 0.22); redLantern(B, 1.2, 2.45, F + 0.25, 0.22);
      B.bx(M.cloth, -0.6, 0.6, 0.02, 0.78, 0.0, 0.6); B.bx(M.gold, -0.62, 0.62, 0.78, 0.8, -0.02, 0.62); B.cyl(M.timber, 0.07, 0.07, 0.2, -0.35, 0.8, 0.3, 8); for (let i = 0; i < 7; i++) B.cyl(M.paper, 0.008, 0.008, 0.3, -0.35 + Math.cos(i) * 0.04, 0.85, 0.3 + Math.sin(i) * 0.04, 4);     // the 籤筒
      B.bx(M.paper, 0.0, 0.4, 0.8, 0.82, 0.15, 0.45); B.cyl(M.timberD, 0.16, 0.16, 0.04, 0, 0.45, -0.5, 10); B.cyl(M.timberD, 0.02, 0.02, 0.45, 0, 0.02, -0.5, 5);
      at(g, label('1851', 0.5, 0.2, { bg: '#b3241a', fg: '#f3d27a', weight: 800 }), 0, 0.42, 0.605);
      B.build(g); OUT.linwuhu = g; }

    // ═════════ 11. 霞海城隍廟: the temple model already stands on its forecourt; add the offering table, 月老's stand and a stele ═════════
    { const g = free(0, TZ), B = Bag();
      B.bx(M.cloth, 9.0, 9.9, 0.03, 0.85, -0.6, 2.2); B.bx(M.gold, 8.98, 9.92, 0.85, 0.88, -0.62, 2.22); [[-0.2, 3], [0.5, 1], [1.2, 0], [1.8, 6]].forEach(([z, i]) => { B.cyl(M.paper, 0.2, 0.14, 0.05, 9.45, 0.88, z, 12); for (let k = 0; k < 4; k++) B.ball(GOODS[(i + k) % 2 ? 1 : 4], 0.075, 9.45 + Math.cos(k * 2.1) * 0.09, 0.98 + (k === 3 ? 0.1 : 0), z + Math.sin(k * 2.1) * 0.09); });
      B.cyl(M.red, 0.03, 0.03, 0.3, 9.2, 0.88, 0.8, 6); B.cyl(M.red, 0.03, 0.03, 0.3, 9.2, 0.88, 1.5, 6); B.ball(M.lit, 0.035, 9.2, 1.21, 0.8); B.ball(M.lit, 0.035, 9.2, 1.21, 1.5);
      B.bx(M.granite, 10.15, 10.4, 0, 2.25, 3.3, 4.2); B.bx(M.stone, 10.05, 10.5, 0, 0.2, 3.2, 4.3);
      B.build(g); at(g, label('霞海城隍廟', 0.6, 1.25, { kind: 'stone', font: WEI, vertical: true, bg: '#3a3a3e', fg: '#9a6a1c', glow: 0.2 }), 10.14, 1.0, 3.75, -PI / 2); at(g, label('1859', 0.6, 0.2, { bg: '#3a3a3e', fg: '#e9c46a', weight: 600 }), 10.14, 0.3, 3.75, -PI / 2);
      at(g, hang('月下老人', 0.36, 1.5, { kind: 'cloth', font: WEI, vertical: true, bg: '#b3241a', fg: '#f3d27a', glow: 0.4 }), 9.45, 1.9, -1.2, -PI / 2); at(g, new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 2.7, 6), M.ink), 9.45, 1.35, -1.2);
      BLOCKS.push([9.45, 0.3 + TZ, 0.9], [9.45, 1.4 + TZ, 0.9]); OUT.xiahaiExtras = g; }

    // ═════════ 12. 永樂市場 + 大稻埕戲苑 + 林合發油飯店 ═════════
    { // the brick octagonal tower at the market's north corner, the theatre's lift lobby at its foot
      const g = free(10.9, -28.9 + MZ), B = Bag(), r = 2.0, h = 15.5;
      B.put(M.brick, new T.CylinderGeometry(r, r, h, 8), 0, h / 2, 0, PI / 8); [0.0, 4.2, 8.0, 11.8, 15.3].forEach(y => B.put(M.stoneL, new T.CylinderGeometry(r + 0.12, r + 0.12, 0.28, 8), 0, y + 0.14, 0, PI / 8));
      B.put(M.tile, new T.ConeGeometry(r + 0.35, 1.6, 8), 0, h + 0.8 + 0.28, 0, PI / 8); B.ball(M.gold, 0.16, 0, h + 1.95, 0);
      for (let k = 0; k < 8; k++) { const a = k * PI / 4, nx = Math.sin(a), nz = Math.cos(a), d = r * Math.cos(PI / 8) + 0.01; [5.2, 9.0, 12.8].forEach(y => { B.put(M.glass, new T.BoxGeometry(0.5, 1.9, 0.06), nx * d, y + 0.95, nz * d, a); B.put(M.stoneL, new T.BoxGeometry(0.7, 0.12, 0.12), nx * d, y - 0.06, nz * d, a); B.put(M.stoneL, new T.BoxGeometry(0.7, 0.12, 0.12), nx * d, y + 1.96, nz * d, a); }); }
      // lift lobby facing the market's front yard (world −x)
      B.bx(M.stoneL, -3.1, -1.7, 0, 3.3, -1.5, 1.5); B.bx(M.dark, -3.14, -3.08, 0.05, 2.5, -1.0, 1.0); B.bx(M.steel, -3.16, -3.1, 0.05, 2.5, -0.95, -0.05); B.bx(M.steel, -3.16, -3.1, 0.05, 2.5, 0.05, 0.95); B.bx(M.lit, -3.16, -3.1, 2.55, 2.8, -1.0, 1.0);
      B.bx(M.redD, -3.9, -3.0, 3.3, 3.42, -1.7, 1.7); [-1.6, 1.6].forEach(z => B.cyl(M.steel, 0.04, 0.04, 3.3, -3.8, 0, z, 8)); B.bx(M.red, -3.75, -3.2, 0, 0.02, -0.8, 0.8);
      B.build(g); at(g, hang('大稻埕戲苑', 2.9, 0.6, { kind: 'box', font: KAI, bg: '#7a1c14', fg: '#f6e3a8', sub: 'Dadaocheng Theater 8F', subFont: FONT }), -3.95, 3.85, 0, -PI / 2);
      at(g, hang('大稻埕戲苑', 0.6, 4.2, { kind: 'box', font: KAI, vertical: true, bg: '#7a1c14', fg: '#f6e3a8' }), -2.25, 6.6, 0.9, -PI / 2); at(g, hang('永樂市場', 0.6, 3.2, { kind: 'box', font: KAI, vertical: true, bg: '#f3ecd9', fg: '#1f4f7a' }), -2.25, 6.1, -0.2, -PI / 2);
      at(g, label('今日演出 歌仔戲 · 布袋戲', 0.9, 1.3, { kind: 'paint', mat: 'paper', font: KAI, bg: '#f7ecd0', fg: '#7a1c14', border: '#7a1c14', glow: 0.3 }), -3.12, 1.6, 1.28, -PI / 2).scale.set(0.45, 0.9, 1);
      BLOCKS.push([8.7, -28.4 + MZ, 1.6], [8.7, -29.5 + MZ, 1.6]); OUT.theatre = g; }
    { // 林合發油飯店: the open stall on the market's ground-floor corner, steamer tubs of oil rice on the counter
      const g = free(7.4, -11.75 + MZ, PI), B = Bag(), wood = M.timber;
      B.bx(M.white, -1.5, 1.5, 0, 0.95, -0.1, 0.55); B.bx(M.steel, -1.55, 1.55, 0.95, 1.0, -0.15, 0.6); B.bx(M.red, -1.5, 1.5, 0.3, 0.75, 0.55, 0.56);
      [-0.85, 0.05].forEach((x, i) => { B.cyl(wood, 0.36, 0.33, 0.34, x, 1.0, 0.2, 16); B.cyl(M.steel, 0.375, 0.375, 0.04, x, 1.12, 0.2, 16); B.ball(M.rice, 0.33, x, 1.34, 0.2, 0.42); for (let k = 0; k < 5; k++) B.ball(k % 2 ? std('#3d2a1c') : std('#c9884a'), 0.04, x + Math.cos(k * 1.4) * 0.16, 1.47, 0.2 + Math.sin(k * 1.4) * 0.16); });
      for (let k = 0; k < 6; k++) B.bx(M.paper, 0.75, 1.05, 1.0 + k * 0.045, 1.04 + k * 0.045, 0.05, 0.35); for (let k = 0; k < 4; k++) B.bx(M.paper, 1.12, 1.42, 1.0 + k * 0.045, 1.04 + k * 0.045, 0.1, 0.4);
      B.bx(M.steel, 0.8, 1.2, 1.0, 1.05, -0.08, 0.02); B.cyl(M.paper, 0.14, 0.14, 0.03, 1.0, 1.22, -0.03, 12, PI / 2); B.bx(M.steel, 0.98, 1.02, 1.05, 1.1, -0.05, -0.01);                                                                   // the scale
      [-1.5, 1.5].forEach(x => B.cyl(M.steel, 0.03, 0.03, 2.7, x, 0, 0.55, 6)); B.put(M.redD, new T.BoxGeometry(3.3, 0.05, 1.4), 0, 2.62, 0.75, 0, 0.25); B.bx(M.white, -1.6, 1.6, 0, 2.9, -0.5, -0.38);
      B.bx(M.lit, -1.2, 1.2, 2.3, 2.36, 0.3, 0.36);
      B.build(g); at(g, hang('林合發油飯店', 2.8, 0.52, { kind: 'paint', mat: 'tin', tint: 0.82, font: KAI, bg: '#b3241a', fg: '#fff3c4', glow: 0.4 }), 0, 2.2, 0.62); at(g, label('油飯 紅蛋 雞腿', 0.36, 1.15, { kind: 'paint', mat: 'paper', font: KAI, vertical: true, bg: '#f7ecd0', fg: '#b3241a', border: '#b3241a', glow: 0.3 }), -1.25, 1.7, -0.37);
      E.steamSrc.push(new T.Vector3(7.4 + 0.85, 1.5, -11.95 + MZ), new T.Vector3(7.4 - 0.05, 1.5, -11.95 + MZ)); OUT.linhefa = g; }

    // ═════════ 13. 大稻埕碼頭: the flood wall, water gate No. 5 with its steel leaf run back, the container market on the quay ═════════
    { const g = free(0, LZ), B = Bag(), x0 = -19.6, x1 = -18.7, zA = -16.7, zB = -10.5, hgt = 6.2;
      B.bx(M.concrete, x0, x1, 0, hgt, -46, zA); B.bx(M.concrete, x0, x1, 0, hgt, zB, 40); B.bx(M.concrete, x0 - 0.25, x1 + 0.25, 4.7, hgt + 0.5, zA - 0.9, zB + 0.9);
      [zA - 0.45, zB + 0.45].forEach(z => { B.bx(M.concrete, x0 - 0.3, x1 + 0.3, 0, 4.7, z - 0.45, z + 0.45); B.bx(M.yellow, x1 + 0.3, x1 + 0.32, 0, 1.2, z - 0.45, z + 0.45); for (let k = 0; k < 3; k++) B.bx(M.ink, x1 + 0.32, x1 + 0.33, 0.15 + k * 0.4, 0.33 + k * 0.4, z - 0.45, z + 0.45); });
      B.bx(M.concrete, x0 - 0.02, x1 + 0.02, hgt, hgt + 0.18, -46, 40); for (let z = -45; z < 40; z += 6) if (z < zA - 1 || z > zB + 1) B.bx(M.concrete, x0 - 0.12, x1 + 0.12, 0, hgt, z - 0.2, z + 0.2);
      // the steel gate leaf, slid north along the river face, on its rail
      const gx = x0 - 0.5, gz0 = zB + 1.0, gz1 = zB + 7.2; B.bx(M.steel, gx - 0.14, gx + 0.14, 0.12, 4.6, gz0, gz1); for (let y = 0.5; y < 4.6; y += 0.8) B.bx(M.steel, gx - 0.24, gx + 0.24, y, y + 0.14, gz0, gz1); for (let z = gz0; z <= gz1 + 0.01; z += 1.24) B.bx(M.steel, gx - 0.24, gx + 0.24, 0.12, 4.6, z - 0.08, z + 0.08);
      B.bx(M.ink, gx - 0.1, gx + 0.1, 0, 0.1, zA - 0.5, gz1 + 0.5); [gz0 + 0.6, gz1 - 0.6].forEach(z => B.put(M.ink, new T.CylinderGeometry(0.2, 0.2, 0.16, 12), gx, 0.26, z, 0, 0, PI / 2));
      // the container market: two long boxes on the ground, one across the top with a rail and parasols
      const cont = (m, cx, cy, cz, lx, lz) => { B.bx(m, cx - lx / 2, cx + lx / 2, cy, cy + 2.5, cz - lz / 2, cz + lz / 2); const along = lx > lz; for (let k = 0; k < (along ? lx : lz) / 0.3 - 1; k++) { const p = -(along ? lx : lz) / 2 + 0.3 * (k + 0.5) + 0.15; if (along) { B.bx(m, cx + p - 0.05, cx + p + 0.05, cy + 0.12, cy + 2.38, cz - lz / 2 - 0.03, cz + lz / 2 + 0.03); } else { B.bx(m, cx - lx / 2 - 0.03, cx + lx / 2 + 0.03, cy + 0.12, cy + 2.38, cz + p - 0.05, cz + p + 0.05); } } };
      cont(M.red, -22.6, 0.1, -20.6, 2.5, 6); cont(M.tealC, -25.4, 0.1, -20.6, 2.5, 6); cont(M.yellow, -24.0, 2.62, -19.4, 5.6, 2.5);
      [[-22.6, M.redD], [-25.4, M.steel]].forEach(([cx, m], i) => { B.bx(M.dark, cx - 0.95, cx + 0.95, 1.0, 2.15, -17.62, -17.56); B.bx(M.lit, cx - 0.85, cx + 0.85, 1.1, 2.05, -17.6, -17.53); B.bx(M.timber, cx - 1.1, cx + 1.1, 0.95, 1.02, -17.6, -17.2); B.put(m, new T.BoxGeometry(2.3, 0.05, 1.0), cx, 2.45, -17.2, 0, 0.3);
        [-0.6, 0, 0.6].forEach(dx => { B.cyl(M.timberD, 0.15, 0.15, 0.04, cx + dx, 0.6, -16.75, 10); B.cyl(M.ink, 0.02, 0.02, 0.6, cx + dx, 0, -16.75, 5); }); });
      B.bx(M.ink, -26.8, -21.2, 6.02, 6.08, -18.2, -18.14); B.bx(M.ink, -26.8, -21.2, 5.55, 5.59, -18.2, -18.14); for (let x = -26.8; x <= -21.19; x += 0.8) B.bx(M.ink, x - 0.025, x + 0.025, 5.12, 6.08, -18.2, -18.14);
      [[-25.6, M.orange], [-22.6, M.white]].forEach(([x, m]) => { B.cyl(M.ink, 0.025, 0.025, 2.1, x, 5.12, -19.4, 6); B.put(m, new T.ConeGeometry(1.15, 0.45, 10), x, 7.3, -19.4); B.cyl(M.steel, 0.4, 0.4, 0.04, x + 0.2, 5.82, -19.1, 12); B.cyl(M.ink, 0.02, 0.02, 0.7, x + 0.2, 5.12, -19.1, 5); });
      B.build(g);
      at(g, hang('大稻埕碼頭', 4.4, 0.95, { kind: 'enamel', font: FONT, weight: 700, spread: true, bg: '#1f4f7a', fg: '#ffffff', sub: 'Dadaocheng Wharf', glow: 0.3 }), x1 + 0.27, 5.45, (zA + zB) / 2, PI / 2);
      const gateNo = () => pic(0.88, 1.12, (c, cw, ch) => { c.fillStyle = '#b4afa3'; c.fillRect(0, 0, cw, ch); for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(60,55,45,${0.03 + (k * 37 % 10) * 0.006})`; c.fillRect((k * 53) % cw, 0, 2 + k % 5, ch); }
        c.strokeStyle = '#1f4f7a'; c.lineWidth = cw * 0.045; c.beginPath(); c.arc(cw / 2, ch * 0.4, cw * 0.4, 0, 7); c.stroke(); c.fillStyle = '#1f4f7a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${Math.round(cw * 0.62)}px "Helvetica Neue",Arial,sans-serif`; c.fillText('5', cw / 2, ch * 0.42);
        c.font = `800 ${Math.round(cw * 0.15)}px ${FONT}`; c.fillText('五號水門', cw / 2, ch * 0.82); c.font = `700 ${Math.round(cw * 0.07)}px "Helvetica Neue",Arial,sans-serif`; c.fillText('FLOOD GATE No. 5 · 大稻埕', cw / 2, ch * 0.93); }, 0.1);   // the gate's number as flood gates carry it: a ringed numeral stencilled straight onto the pier, in the pier's own concrete colour, no plate (checker 2026-11-22: the pale square plate read as a name plate)
      at(g, gateNo(), x1 + 0.315, 3.0, zB + 0.45, PI / 2); at(g, gateNo(), x1 + 0.315, 3.0, zA - 0.45, PI / 2);
      const wave = (z, w) => at(g, pic(w, 2.6, (c, cw, ch) => { c.fillStyle = '#b9b4a8'; c.fillRect(0, 0, cw, ch); ['#1f4f7a', '#2f7f9a', '#7fb7c4'].forEach((colr, k) => { c.fillStyle = colr; c.beginPath(); c.moveTo(0, ch); for (let x = 0; x <= cw; x += 8) c.lineTo(x, ch * (0.45 + k * 0.18) + Math.sin(x / cw * 22 + k * 1.7) * ch * 0.06); c.lineTo(cw, ch); c.fill(); });
        c.fillStyle = '#efe6d0'; [[0.2, 0.3], [0.62, 0.24]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x * cw, y * ch + ch * 0.2); c.lineTo(x * cw + cw * 0.09, y * ch + ch * 0.2); c.lineTo(x * cw + cw * 0.06, y * ch + ch * 0.26); c.lineTo(x * cw + cw * 0.01, y * ch + ch * 0.26); c.fill(); c.fillStyle = '#b3241a'; c.beginPath(); c.moveTo(x * cw + cw * 0.04, y * ch + ch * 0.18); c.lineTo(x * cw + cw * 0.04, y * ch - ch * 0.02); c.lineTo(x * cw + cw * 0.085, y * ch + ch * 0.18); c.fill(); c.fillStyle = '#efe6d0'; }); }, 0.12, 100), x1 + 0.015, 1.5, z, PI / 2);
      wave(zB + 0.9 + 4.2, 8); wave(zA - 0.9 - 4.2, 8);
      // the container market's name and its two counters: light boxes in steel cases bolted to the containers (sources-dadao.md)
      at(g, hang('貨櫃市集 PIER 5', 2.3, 0.4, { kind: 'box', font: FONT, weight: 800, bg: '#1c1712', fg: '#f3d27a', thick: 0.16, glow: 0.7 }), -24.0, 4.3, -18.0);
      at(g, hang('啤酒 · 小吃', 1.6, 0.3, { kind: 'box', font: FONT, weight: 700, bg: '#f7ecd0', fg: '#b3241a', thick: 0.08, glow: 0.5 }), -22.6, 2.3, -17.5); at(g, hang('咖啡 · 冰品', 1.6, 0.3, { kind: 'box', font: FONT, weight: 700, bg: '#f7ecd0', fg: '#1f4f7a', thick: 0.08, glow: 0.5 }), -25.4, 2.3, -17.5);
      OUT.wharf = g; }

    // the white line of the 20-metre road that was never cut: 10 m out from the street's middle, across the temple forecourt
    { const g = free(0, TZ), line = new T.Mesh(new T.PlaneGeometry(0.16, 12), new T.MeshBasicMaterial({ color: 0xf4f0e6 })); line.rotation.x = -PI / 2; line.position.set(10.0, 0.035, 0.8); g.add(line);
      const t = label('20 m 計畫道路線 · 1977', 3.4, 0.3, { bg: '#a79c8c', fg: '#ffffff', glow: 0.35, weight: 600 }); t.rotation.set(-PI / 2, 0, PI / 2); t.position.set(9.72, 0.036, 0.8); g.add(t); OUT.line = g; }

    // ═════════ register every place and every event ═════════
    const P = k => PLACES.item('dadao', k), H = ctx.houses, HP = PI / 2;
    PLACES.add(E, P('xiahai-city-god-temple'), { target: [ctx.temple, OUT.xiahaiExtras], plaque: { position: [10.12, 1.95, 3.75 + TZ], rotation: -HP }, near: [8.6, 1.5 + TZ], radius: 3.6 });
    PLACES.add(E, P('yongle-market'), { target: ctx.yongle, plaque: { position: [9.15, 1.5, -20.8 + MZ], rotation: -HP, size: 0.24 }, near: [8.0, -20.8 + MZ], radius: 3.2 });
    PLACES.add(E, P('dadaocheng-theatre'), { target: OUT.theatre, plaque: { position: [7.72, 1.5, -30.2 + MZ], rotation: -HP }, near: [7.2, -28.4 + MZ], radius: 3 });
    PLACES.add(E, P('lin-he-fa-oil-rice'), { target: OUT.linhefa, plaque: { position: [9.05, 1.5, -12.3 + MZ], rotation: PI }, near: [7.4, -12.6 + MZ], radius: 2.6 });
    PLACES.add(E, P('dihua-shophouse-rows'), { position: [3.45, 20.2], rotation: -HP, design: DADAO_DESIGNS['dihua-shophouse-rows'] });   // the street's own exhibit: the 1988 fight that saved it, as a front page
    PLACES.add(E, P('dihua-shophouse-rows'), { target: [H['1:1'], H['1:2'], H['1:4'], H['-1:0'], H['-1:4']].filter(Boolean) });
    PLACES.add(E, P('watsons-pharmacy-artyard'), { target: OUT.watsons, plaque: { position: [-4.4, 1.5, -11.05 + 14.4], rotation: HP }, near: [-3.6, -6.4 + 14.4], radius: 4.2 });
    PLACES.add(E, P('dadaocheng-wharf'), { target: OUT.wharf, plaque: { position: [-18.38, 1.5, -10.05 + LZ], rotation: HP, size: 0.26 }, near: [-17.5, -13.6 + LZ], radius: 5 });
    PLACES.add(E, P('sin-hong-choon-tea'), { target: OUT.tea, plaque: { position: [-4.4, 1.5, 12.95 - 38.4], rotation: HP }, near: [-3.6, 17.6 - 38.4], radius: 4.2 });
    PLACES.add(E, P('bolero-restaurant'), { target: [OUT.bolero, OUT.bolero2], plaque: { position: [-4.4, 1.5, -16.25 - 14.4], rotation: HP }, near: [-3.6, -18.4 - 14.4], radius: 2.8 });
    PLACES.add(E, P('lin-wuhu-house'), { target: [H['-1:15'], OUT.linwuhu].filter(Boolean), plaque: { position: [-4.4, 1.5, 7.75 - 48], rotation: HP }, near: [-3.4, -39.0], radius: 4.2 });   // the last house she can reach at the north end
    PLACES.add(E, P('cisheng-temple'), { target: OUT.cisheng, plaque: { position: [4.42, 1.5, -30.75], rotation: -HP }, near: [5.2, -35.2], radius: 4.6 });
    PLACES.add(E, P('li-linqiu-house'), { target: OUT.li, plaque: { position: [-4.4, 1.5, -30.62 + 28.8], rotation: HP }, near: [-3.6, -32.8 + 28.8], radius: 2.8 });
    PLACES.add(E, P('puppet-theatre-museum'), { target: OUT.puppet, plaque: { position: [-4.4, 1.5, -25.4 + 24], rotation: HP }, near: [-3.6, -23.2 + 24], radius: 2.8 });
    // HANDOFF.md: "二二八 (1947, 天馬茶房) deliberately left out of the story, per the original brief." The research covered it by
    // mistake; both items are held out of the public data (tools/places/build_data.py HELD) for good. CJ, 2026-11-21: "Keep them out". The shopfront stays as an unnamed tea house.
    if (P('tianma-tea-house')) PLACES.add(E, P('tianma-tea-house'), { target: OUT.tianma, plaque: { position: [4.4, 1.5, 17.38], rotation: -HP }, near: [3.6, 15.2], radius: 2.8 });
    PLACES.add(E, P('qianyuan-herb-shop'), { target: OUT.qianyuan, plaque: { position: [4.4, 1.5, -28.0 - 2.18], rotation: -HP }, near: [3.6, -28.0], radius: 2.8 });   // east side, a few doors north of the temple (No. 71)
    PLACES.add(E, P('i-mei-original-shop'), { target: OUT.imei, plaque: { position: [4.4, 1.5, 31.78], rotation: -HP }, near: [3.6, 29.6], radius: 2.8 });
    // events: each stands where it happened in this layout, each a designed piece (kind B), never a name plate.
    // CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 ... 這種無聊的招牌絕對不能出現就對了」.
    // Why each form, and the reference behind it: docs/signage/designs-dadao.md. The painting under each poster is
    // asset/textures/posters/events/<key>.jpg (DESIGN picks it up; the code-drawn poster shows until it lands).
    const D = DADAO_DESIGNS;
    PLACES.add(E, P('new-year-goods-street'), { position: [-3.45, 33.0], rotation: HP, design: D['new-year-goods-street'] });          // just inside the archway
    PLACES.add(E, P('yuelao-matchmaker-crowds'), { position: [7.0, 6.35 + TZ], rotation: PI, design: D['yuelao-matchmaker-crowds'] });     // in the temple forecourt, where the queue for 月老 forms
    if (P('228-flash-point-1947')) PLACES.add(E, P('228-flash-point-1947'), { position: [3.3, 12.2], rotation: -HP });                           // held out of the data for good (see above); never built
    PLACES.add(E, P('city-god-procession'), { position: [5.3, 2.5 + TZ], rotation: -HP, design: D['city-god-procession'] });               // setting out from the temple forecourt
    PLACES.add(E, P('dadaocheng-fireworks'), { position: [-25.4, -13.6 + LZ], rotation: HP, design: D['dadaocheng-fireworks'] });          // on the quay, the river behind it
    PLACES.add(E, P('tttifa-arts-festival'), { position: [-3.45, -10.4], rotation: HP, design: D['tttifa-arts-festival'] });          // the costume parade's route, between the café and the puppet museum
    PLACES.add(E, P('film-twa-tiu-tiann-2014'), { position: [-3.45, -14.6], rotation: HP, design: D['film-twa-tiu-tiann-2014'] });    // on the street the film was named for
    PLACES.add(E, P('solitary-gourmet-yongle'), { position: [3.45, -17.2 + MZ], rotation: -HP, design: D['solitary-gourmet-yongle'] });    // on the kerb by 永樂市場, where 五郎 ate
    PLACES.add(E, P('pier5-container-market'), { position: [-25.4, -8.6 + LZ], rotation: HP, design: D['pier5-container-market'] });       // on the quay beside the fireworks stand
    eventProps();
    return OUT;

    // ── the second layer round each event piece: the things people remember from it, standing beside the poster or statue ──
    function eventProps() {
      const K = { red: std('#c4201a', 0.85), redP: std('#d8352a', 0.9), rope: std('#a3142b', 0.8), brass: std('#c9a13c', 0.3, 0.8), skin: std('#e9d2b0', 0.8), drum: std('#b3241a', 0.5), hide: std('#e9dcc0', 0.7),
        mat1: std('#2f7f9a', 0.95), mat2: std('#e9b53a', 0.95), cool: std('#f0eadd', 0.6), can: std('#d9d9d9', 0.3, 0.8), black: std('#151515', 0.5, 0.2), alu: std('#b9bec4', 0.3, 0.8) };
      // 迎城隍: the procession's drum on its cart, a gong, and the red paper of spent firecrackers all over the forecourt
      { const g = free(5.3, 2.5 + TZ, -HP), B = Bag(), R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
        B.bx(M.timberD, -3.05, -2.25, 0.3, 0.42, 0.55, 1.35); [[-3.0, 0.6], [-2.3, 0.6], [-3.0, 1.3], [-2.3, 1.3]].forEach(([x, z]) => B.cyl(M.timberD, 0.03, 0.03, 0.3, x, 0, z, 6));
        B.put(K.drum, new T.CylinderGeometry(0.42, 0.42, 0.5, 20), -2.65, 0.95, 0.95, 0, 0, PI / 2); [-1, 1].forEach(k => B.put(K.hide, new T.CylinderGeometry(0.4, 0.4, 0.02, 20), -2.65 + k * 0.255, 0.95, 0.95, 0, 0, PI / 2));
        B.bx(M.timber, -3.05, -2.95, 0.42, 1.35, 0.9, 1.0); B.bx(M.timber, -2.35, -2.25, 0.42, 1.35, 0.9, 1.0);
        B.cyl(M.timberD, 0.02, 0.02, 1.5, -3.4, 0, 1.6, 6); B.cyl(M.timberD, 0.02, 0.02, 1.5, -1.9, 0, 1.6, 6); B.put(K.brass, new T.CylinderGeometry(0.32, 0.32, 0.04, 24), -2.65, 1.15, 1.62, 0, PI / 2); B.bx(M.timberD, -3.4, -1.9, 1.48, 1.52, 1.58, 1.62);
        for (let i = 0; i < 70; i++) { const x = -3.4 + R() * 6.4, z = -0.6 + R() * 2.6; B.put(i % 3 ? K.redP : K.red, new T.BoxGeometry(0.05 + R() * 0.06, 0.004, 0.03 + R() * 0.04), x, 0.01, z, R() * 3); }
        B.build(g); BLOCKS.push([5.3 - 0.95, 2.5 - 2.65 + TZ, 0.6]); }
      // 月老: a queue of brass posts and red rope leading up to Him, and a tray of red-thread packets on a low table
      { const g = free(7.0, 6.35 + TZ, PI), B = Bag();
        [[-0.75, 1.5], [-0.75, 2.4], [-0.75, 3.3], [0.75, 1.5], [0.75, 2.4], [0.75, 3.3]].forEach(([x, z]) => { B.cyl(K.brass, 0.13, 0.15, 0.04, x, 0, z, 14); B.cyl(K.brass, 0.025, 0.025, 0.92, x, 0.04, z, 8); B.ball(K.brass, 0.05, x, 0.98, z); });
        [-0.75, 0.75].forEach(x => [[1.5, 2.4], [2.4, 3.3]].forEach(([a, b]) => { const mid = (a + b) / 2; B.put(K.rope, new T.CylinderGeometry(0.018, 0.018, 0.5, 6), x, 0.85, (a + mid) / 2, 0, -1.25 - 0.08); B.put(K.rope, new T.CylinderGeometry(0.018, 0.018, 0.5, 6), x, 0.85, (mid + b) / 2, 0, 1.25 + 0.08); }));
        B.bx(M.timberD, 1.05, 1.65, 0.0, 0.62, -0.3, 0.3); B.bx(M.cloth, 1.03, 1.67, 0.62, 0.66, -0.32, 0.32); for (let i = 0; i < 12; i++) B.bx(i % 2 ? K.red : M.paper, 1.1 + (i % 4) * 0.13, 1.1 + (i % 4) * 0.13 + 0.1, 0.66, 0.68 + (i % 3) * 0.01, -0.22 + ((i / 4) | 0) * 0.15, -0.12 + ((i / 4) | 0) * 0.15);
        B.build(g); BLOCKS.push([7.0 - 1.35, 6.35 + TZ, 0.45]); }
      // 1920 變裝遊行: a face-in-hole board of two paraders in 1920s dress, for the photo everyone took
      { const g = free(-3.45, -10.4, HP), w = 1.5, h = 1.95;
        const fm = canvasMat(w, h, (c, W, H) => faceHole(c, W, H), 0.25, 300, 'paper', 'tttifa-facehole'); fm.transparent = true; fm.alphaTest = 0.5; fm.side = T.DoubleSide;
        at(g, new T.Mesh(new T.PlaneGeometry(w, h), fm), -1.75, h / 2 + 0.05, 0.1); const B = Bag(); [-2.42, -1.08].forEach(x => { B.bx(M.timberD, x - 0.03, x + 0.03, 0, 1.9, 0.02, 0.08); B.bx(M.timberD, x - 0.03, x + 0.03, 0, 0.06, 0.08, -0.6); });
        B.bx(M.timber, -2.4, -1.1, 0, 0.18, -0.2, -0.7); B.build(g); BLOCKS.push([-3.45, -10.4 + 1.75, 0.8]); }
      // 電影《大稻埕》: a clapperboard leant on the billboard's foot, and a film camera on its tripod pointed at the street
      { const g = free(-3.45, -14.6, HP), B = Bag();
        const slate = canvasMat(0.5, 0.42, (c, W, H) => clapper(c, W, H), 0.2, 600, 'lacquer', 'film-slate'); const sm = at(g, new T.Mesh(new T.BoxGeometry(0.5, 0.42, 0.02), [edgeMat, edgeMat, edgeMat, edgeMat, slate, edgeMat]), -1.2, 0.24, 0.5); sm.rotation.x = -0.25;
        const cx = 2.45, cz = 0.9; const tl = Math.atan(0.32 / 1.38); [0.3, 2.4, 4.5].forEach(a => B.put(K.black, new T.CylinderGeometry(0.015, 0.022, 1.42, 6), cx + Math.cos(a) * 0.16, 0.69, cz + Math.sin(a) * 0.16, 0, -tl * Math.sin(a), tl * Math.cos(a)));   // legs leaning in to the head
        B.bx(K.black, cx - 0.08, cx + 0.08, 1.36, 1.42, cz - 0.08, cz + 0.08); B.bx(K.black, cx - 0.16, cx + 0.16, 1.42, 1.74, cz - 0.3, cz + 0.22); B.put(K.alu, new T.CylinderGeometry(0.08, 0.1, 0.24, 14), cx, 1.56, cz + 0.34, 0, PI / 2);   // body and lens, toward the street
        [-0.16, 0.12].forEach(dz => B.put(K.black, new T.CylinderGeometry(0.19, 0.19, 0.06, 20), cx, 1.98, cz + dz, 0, 0, PI / 2)); B.bx(K.black, cx - 0.02, cx + 0.02, 1.74, 1.82, cz - 0.2, cz + 0.16);   // the two film reels on top
        B.build(g); BLOCKS.push([-3.45 + 0.9, -14.6 - 2.45, 0.45]); }
      // 情人節煙火: picnic mats and a cool box on the quay, where people wait for dark
      { const g = free(-25.4, -13.6 + LZ, HP), B = Bag();
        B.put(K.mat1, new T.BoxGeometry(1.4, 0.01, 1.1), -0.9, 0.006, 2.3, 0.2); B.put(K.mat2, new T.BoxGeometry(1.3, 0.01, 1.0), 0.9, 0.006, 2.4, -0.15);
        for (let x = -1.55; x < -0.2; x += 0.2) B.put(M.white, new T.BoxGeometry(0.06, 0.012, 1.05), x, 0.008, 2.3 + (x + 0.9) * 0.2, 0.2);
        B.bx(K.cool, 0.4, 0.85, 0.0, 0.36, 2.0, 2.3); B.bx(M.tealC, 0.38, 0.87, 0.36, 0.42, 1.98, 2.32); [-0.5, -0.38, 1.1].forEach((x, i) => B.cyl(K.can, 0.03, 0.03, 0.11, x, 0.01, 2.2 + i * 0.1, 8));
        B.build(g); }
      // 年貨大街: the seller's sample tray held out over the counter
      { const g = free(-3.45, 33.0, HP), B = Bag(); B.put(M.timber, new T.CylinderGeometry(0.3, 0.3, 0.03, 20), 0.95, 0.99, 0.62); for (let i = 0; i < 7; i++) B.ball(GOODS[i], 0.05, 0.95 + Math.cos(i * 0.9) * 0.17, 1.04, 0.62 + Math.sin(i * 0.9) * 0.17, 0.6);
        for (let i = 0; i < 5; i++) B.bx(M.paper, 0.45 + i * 0.07, 0.5 + i * 0.07, 0.99, 1.05, 0.7, 0.75); B.build(g); }
    }
    // the face-in-hole board: a gentleman in a three-piece suit and boater, a lady in a cloche hat with a parasol, both faces cut out
    function faceHole(c, W, H) {
      const ink = '#1c1a20', gold = '#c39a3e', u = W / 100; c.save();
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, 'rgba(241,230,207,0.35)'); sky.addColorStop(1, 'rgba(195,154,62,0.25)'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.strokeStyle = gold; c.lineWidth = u * 0.8; for (let i = 0; i < 13; i++) { const a = Math.PI * (1.05 + i * 0.07); c.beginPath(); c.moveTo(W / 2, H * 0.62); c.lineTo(W / 2 + Math.cos(a) * W, H * 0.62 + Math.sin(a) * W); c.stroke(); }
      c.strokeStyle = ink; c.lineWidth = u * 1.6; c.strokeRect(u * 3, u * 3, W - u * 6, H - u * 6); c.lineWidth = u * 0.6; c.strokeRect(u * 5, u * 5, W - u * 10, H - u * 10);
      // him: boater, suit, waistcoat, bow tie, cane
      const hx = W * 0.3; c.fillStyle = '#2a2f3a'; c.beginPath(); c.moveTo(hx - u * 13, H * 0.36); c.lineTo(hx + u * 13, H * 0.36); c.lineTo(hx + u * 16, H * 0.86); c.lineTo(hx - u * 16, H * 0.86); c.fill();
      c.fillStyle = '#f1e6cf'; c.beginPath(); c.moveTo(hx - u * 4, H * 0.36); c.lineTo(hx + u * 4, H * 0.36); c.lineTo(hx, H * 0.5); c.fill(); c.fillStyle = '#9c2a2a'; c.fillRect(hx - u * 4, H * 0.355, u * 8, u * 2.4);
      c.fillStyle = '#7a5a2a'; c.fillRect(hx - u * 6, H * 0.46, u * 12, H * 0.14); c.fillStyle = gold; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(hx, H * 0.48 + k * H * 0.03, u * 0.9, 0, 7); c.fill(); }
      c.fillStyle = ink; c.fillRect(hx - u * 14, H * 0.86, u * 11, H * 0.08); c.fillRect(hx + u * 3, H * 0.86, u * 11, H * 0.08); c.strokeStyle = ink; c.lineWidth = u * 1.2; c.beginPath(); c.moveTo(hx + u * 17, H * 0.6); c.lineTo(hx + u * 20, H * 0.93); c.stroke();
      c.fillStyle = '#e6d2a6'; c.beginPath(); c.ellipse(hx, H * 0.21, u * 16, u * 3, 0, 0, 7); c.fill(); c.fillRect(hx - u * 9, H * 0.15, u * 18, H * 0.06); c.fillStyle = ink; c.fillRect(hx - u * 9, H * 0.19, u * 18, u * 2);
      // her: cloche hat, a drop-waist dress with a fringe, beads, a parasol over her shoulder
      const sx = W * 0.7; c.fillStyle = '#1f4e5a'; c.beginPath(); c.moveTo(sx - u * 11, H * 0.37); c.lineTo(sx + u * 11, H * 0.37); c.lineTo(sx + u * 17, H * 0.84); c.lineTo(sx - u * 17, H * 0.84); c.fill();
      c.fillStyle = gold; for (let k = 0; k < 18; k++) c.fillRect(sx - u * 17 + k * u * 1.9, H * 0.84, u * 0.8, H * 0.05); c.fillRect(sx - u * 13, H * 0.6, u * 26, u * 1.5);
      c.fillStyle = '#f1e6cf'; for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(sx - u * 6 + k * u * 1.5, H * 0.4 + Math.sin(k / 8 * Math.PI) * u * 5, u * 0.9, 0, 7); c.fill(); }
      c.fillStyle = '#e9d2b0'; c.fillRect(sx - u * 4, H * 0.89, u * 3, H * 0.06); c.fillRect(sx + u * 2, H * 0.89, u * 3, H * 0.06);
      c.fillStyle = '#9c2a2a'; c.beginPath(); c.ellipse(sx, H * 0.17, u * 11, u * 9, 0, Math.PI, 0); c.fill(); c.fillRect(sx - u * 12, H * 0.165, u * 24, u * 2.5); c.fillStyle = gold; c.fillRect(sx - u * 11, H * 0.155, u * 22, u * 1.2);
      c.strokeStyle = ink; c.lineWidth = u * 0.9; c.beginPath(); c.moveTo(sx + u * 10, H * 0.55); c.lineTo(sx + u * 26, H * 0.1); c.stroke(); c.fillStyle = '#e8b4c4'; c.beginPath(); c.moveTo(sx + u * 26, H * 0.1);
      for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.95 + k * 0.1); c.lineTo(sx + u * 26 + Math.cos(a) * u * 22, H * 0.1 - Math.sin(a) * u * 14 + (k % 2) * u * 2); } c.closePath(); c.fill();
      // the lettering: a deco title band, the year big, the call to step in
      c.fillStyle = ink; c.fillRect(u * 5, H * 0.66, W - u * 10, H * 0.12); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = gold; c.font = `900 ${Math.round(H * 0.07)}px Futura,"Avenir Next","PingFang TC",sans-serif`; c.fillText('1920', W / 2, H * 0.695);
      c.fillStyle = '#f1e6cf'; c.font = `700 ${Math.round(H * 0.03)}px "PingFang TC","Heiti TC",sans-serif`; c.fillText('變裝遊行 · 探出頭來拍一張', W / 2, H * 0.755);
      c.fillStyle = ink; c.font = `700 ${Math.round(H * 0.022)}px Futura,"Avenir Next",sans-serif`; c.fillText('T W A T U T I A   ·   C O S T U M E   P A R A D E', W / 2, H * 0.975);
      c.globalCompositeOperation = 'destination-out'; [[hx, H * 0.285], [sx, H * 0.285]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, u * 7.5, u * 9.5, 0, 0, 7); c.fill(); });
      c.restore();
    }
    // the slate: striped clapper sticks, the chalk fields of a real slate, the film's name and release date
    function clapper(c, W, H) {
      c.save(); const bar = H * 0.2; for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f4f1ea' : '#111'; c.beginPath(); c.moveTo(i * W / 7 - bar, bar); c.lineTo(i * W / 7, 0); c.lineTo((i + 0.5) * W / 7, 0); c.lineTo((i + 0.5) * W / 7 - bar, bar); c.fill(); }
      c.strokeStyle = 'rgba(244,241,234,.85)'; c.lineWidth = Math.max(2, W * 0.008); c.strokeRect(W * 0.04, bar + H * 0.04, W * 0.92, H * 0.72); [0.47, 0.7].forEach(y => { c.beginPath(); c.moveTo(W * 0.04, H * y); c.lineTo(W * 0.96, H * y); c.stroke(); });
      [0.36, 0.66].forEach(x => { c.beginPath(); c.moveTo(W * x, H * 0.47); c.lineTo(W * x, H * 0.96); c.stroke(); }); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(244,241,234,.92)';
      c.font = `600 ${Math.round(H * 0.06)}px "American Typewriter","Courier New",monospace`; c.fillText('PROD.', W * 0.06, H * 0.29); c.fillText('ROLL', W * 0.06, H * 0.52); c.fillText('SCENE', W * 0.38, H * 0.52); c.fillText('TAKE', W * 0.68, H * 0.52); c.fillText('DATE', W * 0.06, H * 0.76);
      c.font = `800 ${Math.round(H * 0.15)}px "Kaiti TC","BiauKai","PingFang TC",serif`; c.fillText('大稻埕', W * 0.26, H * 0.36);
      c.font = `700 ${Math.round(H * 0.12)}px "Chalkboard SE","Marker Felt","Comic Sans MS",sans-serif`; c.fillText('A7', W * 0.12, H * 0.62); c.fillText('1920', W * 0.4, H * 0.62); c.fillText('3', W * 0.78, H * 0.62);
      c.font = `700 ${Math.round(H * 0.09)}px "Chalkboard SE","Marker Felt",sans-serif`; c.fillText('2014.01.30  春節檔', W * 0.06, H * 0.87); c.restore();
    }
  };
})();
