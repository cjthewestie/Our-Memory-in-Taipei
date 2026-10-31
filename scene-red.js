// scene-red.js — When We Were Young: Ximending 1985–1999. Everything here is rebuilt from a
// real building: the Red House octagon and its cross-shaped market wing, the eight blocks of
// 中華商場 with their rooftop neon, 樂聲戲院 with hand-painted billboards, 萬年大樓, and the
// 1999 pedestrian zone. The teammate's Ximending asset library fills the shopfronts between.
// Primitives, canvas textures and the palette, plus the Red House glb (issue #5). References are listed in HANDOFF.md.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, anchors, libGroup, asset, findAsset, walkX, lam, withFog, people } = window.SCENE;
  const RED = ['red'], ALL = ['red', 'dadao', 'tower'];
  const RH = anchors.redhouse;                                                  // { x: 11, z: -70 }
  const hOf = (h, eras) => { const o = {}; (eras || RED).forEach(k => o[k] = h); return o; };
  const CJK = '-apple-system, "PingFang TC", "Heiti TC", "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';

  // ── shared geometry (base at y = 0) ─────────────────────────────────────────
  const pyr = new THREE.CylinderGeometry(0, 1, 1, 4); pyr.translate(0, 0.5, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 10); wheelGeo.rotateZ(Math.PI / 2); wheelGeo.translate(0, 0.5, 0);
  const basketGeo = new THREE.CylinderGeometry(0.5, 0.38, 1, 8); basketGeo.translate(0, 0.5, 0);
  const planeGeo = new THREE.PlaneGeometry(1, 1); planeGeo.translate(0, 0.5, 0);           // faces +z

  // ── item buckets, one InstancedMesh each ────────────────────────────────────
  const furn = [], crowd = [], wheels = [], baskets = [];
  const bollards = [], aboards = [], plants = [], boxes = [];                     // issue #5 glb instances
  const F = (x, z, y, w, d, h, col, eras, r) => furn.push({ x, z, y: y || 0, w, d, r: r || 0, h: hOf(h, eras), c: C(col) });

  // ── canvas text helpers ─────────────────────────────────────────────────────
  function canvas(w, h, bg) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); g.fillStyle = PALETTE[bg] || bg; g.fillRect(0, 0, w, h);
    return { cv, g };
  }
  const tex = cv => { const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
  function fitText(g, text, px, maxW, weight) {
    g.font = `${weight || 700} ${px}px ${CJK}`;
    const tw = g.measureText(text).width;
    if (tw > maxW) g.font = `${weight || 700} ${Math.floor(px * maxW / tw)}px ${CJK}`;
  }
  // a horizontal board: lines = [{ text, size, y, col }]
  function boardTex(w, h, bg, lines, border) {
    const { cv, g } = canvas(w, h, bg);
    if (border) { g.strokeStyle = PALETTE[border]; g.lineWidth = Math.max(4, h * 0.04); g.strokeRect(g.lineWidth, g.lineWidth, w - 2 * g.lineWidth, h - 2 * g.lineWidth); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(L => { fitText(g, L.text, L.size, w * 0.9, L.weight); g.fillStyle = PALETTE[L.col || 'bone']; g.fillText(L.text, w / 2, L.y); });
    return tex(cv);
  }
  // a vertical sign: one character per row
  function vertTex(str, bg, fg, border) {
    const n = str.length, { cv, g } = canvas(160, 160 * n + 40, bg);
    if (border) { g.strokeStyle = PALETTE[border]; g.lineWidth = 8; g.strokeRect(8, 8, 144, 160 * n + 24); }
    g.fillStyle = PALETTE[fg]; g.font = `700 118px ${CJK}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) g.fillText(str[i], 80, 100 + i * 160);
    return { t: tex(cv), aspect: 160 / (160 * n + 40) };
  }
  // a textured board as a part. axis 'x': faces the road (±x); axis 'z': faces the camera (+z)
  function board(x, y, z, w, h, t, eras, axis, emis) {
    const p = axis === 'x' ? part(x, y, z, 0.12, w, only(eras || RED, h, 'bone')) : part(x, y, z, w, 0.12, only(eras || RED, h, 'bone'));
    const m = p.mesh.material; m.map = t; if (emis) { m.emissiveMap = t; m.emissive = C('bone'); m.emissiveIntensity = emis; } m.needsUpdate = true;
    return p;
  }
  // window grid facade texture: bg with ink windows, optionally a balcony rail under each row
  function facadeTex(cols, rows, bg, rail) {
    const { cv, g } = canvas(64 * cols, 64 * rows, bg);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      g.fillStyle = PALETTE.ink; g.fillRect(i * 64 + 18, j * 64 + 12, 28, 34);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(i * 64 + 18, j * 64 + 12, 28, 6);
      if (rail) { g.fillStyle = PALETTE[rail]; g.fillRect(i * 64 + 6, j * 64 + 48, 52, 6); }
    }
    const t = tex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }

  // ═══ 1. 西門紅樓 — the 1908 octagon and the cross-shaped market hall (十字樓) ═══════════
  // Reference: Kondo Juro's 1908 market: a two-storey red-brick octagon (~16 m across, eight
  // arched openings at street level, paired windows above, pale horizontal bands and quoins,
  // an eight-sided slate roof with a small lantern) and, behind it, the one-storey cross-shaped
  // hall with gable roofs. Octagon centred east of the road; the cross wing runs away from it.
  // Issue #5 step 1: the building is a glb built by asset/blender/red-house.py (bevelled edges,
  // boolean-cut openings, flat palette materials, 30.7k triangles) and loaded here in place of
  // the canvas-textured primitives. The glb keeps the primitive build's sizes: circumradius
  // 7.2, eave 8.8, the long arm 30 x 8.4 centred 21 m behind the octagon, the cross arm 23 m.
  // Its front faces +Z before rotation, like the library assets, so -π/2 turns it to the road.
  (() => {
    const cx = 16.6, cz = RH.z, EAVE = 8.8;
    const house = libGroup(ALL);                                                  // there in every era
    MODELS.load('red-house', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(cx, 0, cz);
      root.rotation.y = -Math.PI / 2;
      house.add(root);
    });
    // the plaza in front: packed earth in the 80s, the 2002 paving after
    part(cx - 2, 0, cz + 11, 18, 10, { red: { h: 0.06, col: 'haze' }, dadao: { h: 0.08, col: 'walk' }, tower: { h: 0.08, col: 'walk' } });
    RH.top = EAVE + 7.5;
  })();

  let MARKET = null;                                                           // the block layout, for the signs below
  // ═══ 2. 中華商場 — eight three-storey blocks along 中華路, 1961–1992 ═════════════════════
  // Reference: research/realism-ximen/zone2-chunghwa/README.md. Eight joined concrete blocks,
  // numbered 1–8 (忠孝仁愛信義和平), three storeys: a 3.5 m arcade with a signboard band on its
  // fascia, open corridors behind solid parapets on floors 2 and 3, canvas awnings, 2nd-floor
  // bridges across the cross streets, and on each end wall a lattice panel, 中華商場 painted
  // vertically and the block's big number. The blocks never carried 忠棟 … plates.
  // West side of the street, 1985–1991 in scroll time; demolished in 1992, so the childhood
  // chapter only.
  // CJ, 2026-09-24: 「這個youtbue講怎麼shade像是arcade 試試看」— the Arcane method: the silhouette is
  // geometry (chunghwa.glb: arcade recess, corridor gap, shopfront setback, bridges, tanks), the
  // rest is painted (asset/paint/chunghwa_paint.py → asset/textures/chunghwa-*.webp) with the
  // light baked in and a normal map for the relief: every shop unit's frontage and what it
  // sells, shutters, sign frames, the lattice, concrete stains and formwork lines.
  // CJ, 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— the real block is three storeys
  // and is drawn so for the realism pass (2026-09-24); FLOORS = 2 in chunghwa.py and FLOOR * 2
  // below give the lower street back.
  (() => {
    const L = 9.4, GAP = 2.6, FLOOR = 3.3, TOP = FLOOR * 3, XF = -6.2, DEPTH = 10;  // match chunghwa.py
    const ARCADE = 3.5, CORR = 3.0, SLAB = 0.34, CLEAR = FLOOR - SLAB;
    // Rooftop neon: the big rooftop signs came down from 1 May 1985, so a strictly 1985–1992
    // roof is bare. ROOF_NEON keeps the sourced ones for the memory: the National tower on
    // 信棟 (block 5), and 黑松, 大同, 精工, 森永, 旭光 boards on steel lattice.
    const ROOF_NEON = true;
    const NEON = [['黑松汽水', 'verm'], ['大同', 'lamp'], ['精工錶 SEIKO', 'verm'], ['森永', 'lamp'], null, ['旭光日光燈', 'verm'], ['黑松沙士', 'lamp'], ['大同電視', 'verm']];
    const blockZ = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 46 - L / 2 - i * (L + GAP));
    const rot = Math.PI / 2, blocks = [], bridges = [];
    blockZ.forEach((z, i) => {
      blocks.push({ x: XF, z, r: rot, w: 1, d: 1, h: hOf(1) });
      if (i < 7) bridges.push({ x: XF, z: z - L / 2 - GAP / 2, r: rot, w: 1, d: 1, h: hOf(1) });
    });
    // ── the painted textures (linear, like the palette: the page applies gamma in its post pass) ──
    const TL = new THREE.TextureLoader();
    const tx = (name, wrap) => { const t = TL.load('asset/textures/' + name + '.webp'); t.anisotropy = 8; if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const concrete = tx('chunghwa-concrete', true), concreteN = tx('chunghwa-concrete-n', true), awning = tx('chunghwa-awning', true);
    MODELS.load('chunghwa', gltf => {
      const paint = sets => sets.forEach(({ mesh }) => {
        const m = mesh.material, hex = m.color.getHex();
        if (hex === C('verm').getHex()) { m.map = awning; m.color.set(0xffffff); }       // the stripes are painted in palette colour
        else if ([C('walk'), C('bone'), C('haze'), C('leaf')].some(c => c.getHex() === hex)) { m.map = concrete; m.normalMap = concreteN; m.normalScale.set(0.8, 0.8); }
        m.needsUpdate = true;
      });
      paint(MODELS.instance(MODELS.node(gltf.scene, 'block'), blocks));
      paint(MODELS.instance(MODELS.node(gltf.scene, 'bridge'), bridges));
    });
    // ── the painted walls: every shop unit's frontage on the arcade's back wall and on the two
    //    corridors' back walls, and the end walls; all quads in two meshes, one draw call each ──
    // chunghwa-shops.webp: 5 painted blocks (2 x 3 slots of 960 x 906 px), each a ground strip
    // and two upper strips of 5 units; the blocks the camera passes in zone 2 (4–8) are all
    // different, the first three reuse slots. chunghwa-ends.webp: 8 end walls, 2 x 4 of 384 x 380.
    const SW = 1920, SH = 2718, SLOT = [1, 2, 3, 0, 4, 2, 3, 1];                   // slot 4 carries 點心世界 on 信棟
    MARKET = { blockZ, L, GAP, XF, FLOOR, SLOT };                                   // the shop signs (below) hang in front of the painted units
    const EW = 768, EH = 1520;
    const shopQ = [], endQ = [];
    // a quad facing +x (road) from z0 (image left) to z1 (image right), or facing +z from x0 to x1
    const quadX = (out, x, z0, z1, y0, y1, u0, u1, v0, v1) => out.push([[x, y0, z0, u0, v0], [x, y0, z1, u1, v0], [x, y1, z1, u1, v1], [x, y1, z0, u0, v1]]);
    const quadZ = (out, z, x0, x1, y0, y1, u0, u1, v0, v1) => out.push([[x0, y0, z, u0, v0], [x1, y0, z, u1, v0], [x1, y1, z, u1, v1], [x0, y1, z, u0, v1]]);
    blockZ.forEach((z, i) => {
      const zN = z + L / 2, zS = z - L / 2, s = SLOT[i];
      const bx = (s % 2) * 960, by = Math.floor(s / 2) * 906;
      const u0 = bx / SW, u1 = (bx + 960) / SW;
      const vOf = py => 1 - py / SH;
      quadX(shopQ, XF - ARCADE + 0.05, zN, zS, 0, CLEAR, u0, u1, vOf(by + 302), vOf(by));
      [1, 2].forEach(f => quadX(shopQ, XF - CORR + 0.05, zN, zS, f * FLOOR, f * FLOOR + CLEAR, u0, u1, vOf(by + (f + 1) * 302), vOf(by + f * 302)));
      // the end wall, 10 m deep x TOP high: the arcade's opening is left out
      const ex = (i % 2) * 384, ey = Math.floor(i / 2) * 380;
      const eu = x => (ex + (x - (XF - DEPTH)) / DEPTH * 384) / EW, ev = y => 1 - (ey + (1 - y / TOP) * 380) / EH;
      quadZ(endQ, zN + 0.05, XF - DEPTH, XF, CLEAR, TOP, eu(XF - DEPTH), eu(XF), ev(CLEAR), ev(TOP));
      quadZ(endQ, zN + 0.05, XF - DEPTH, XF - ARCADE, 0, CLEAR, eu(XF - DEPTH), eu(XF - ARCADE), ev(0), ev(CLEAR));
    });
    const quads = qs => {
      const pos = [], uv = [], idx = [];
      qs.forEach(q => { const b = pos.length / 3; q.forEach(([x, y, z, u, v]) => { pos.push(x, y, z); uv.push(u, v); }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    const painted = libGroup(RED);
    // the shop fronts stand in the arcade's and corridors' shade, which is painted into them:
    // unlit, so the paint shows as painted. The end walls take the sun: lit, with the normal map.
    const shops = new THREE.Mesh(quads(shopQ), withFog(new THREE.MeshBasicMaterial({ map: tx('chunghwa-shops') })));
    const ends = new THREE.Mesh(quads(endQ), withFog(new THREE.MeshLambertMaterial({ map: tx('chunghwa-ends'), normalMap: tx('chunghwa-ends-n') })));
    ends.receiveShadow = true;
    [shops, ends].forEach(m => { m.material.polygonOffset = true; m.material.polygonOffsetFactor = -2; m.material.polygonOffsetUnits = -4; });   // never fight the wall behind
    painted.add(shops, ends);
    blockZ.forEach((z, i) => {
      if (!ROOF_NEON) return;
      const y = TOP + 0.3, x0 = XF - DEPTH / 2;
      if (!NEON[i]) {
        // the National / 國際牌 tower on 信棟's south end: a box on a steel truss, logo on three faces
        const tz = z - L / 2 + 2.4, tx = x0 + 1.2;
        [-1.6, 1.6].forEach(dx => [-1.6, 1.6].forEach(dz => F(tx + dx, tz + dz, y, 0.2, 0.2, 1.6, 'ink')));
        F(tx, tz, y + 1.6, 3.6, 3.6, 0.2, 'ink');
        F(tx, tz, y + 1.8, 3.4, 3.4, 4.2, 'ink');
        const nt = () => boardTex(512, 640, 'ink', [{ text: 'National', size: 110, y: 190, col: 'lamp' }, { text: '國際牌', size: 130, y: 420, col: 'verm' }], 'lamp');
        board(tx + 1.77, y + 1.9, tz, 3.2, 4.0, nt(), RED, 'x', 0.8);
        board(tx, y + 1.9, tz + 1.77, 3.2, 4.0, nt(), RED, 'z', 0.8);
        return;
      }
      // a steel lattice frame and the board, turned a little toward the camera
      const sx = x0 + 1.5;
      [-1.9, 1.9].forEach(dz => F(sx, z + dz, y, 0.18, 0.18, 3.4, 'ink'));
      F(sx, z, y + 3.4, 0.18, 4.2, 0.18, 'ink');
      F(sx, z, y + 1.7, 0.18, 4.2, 0.14, 'ink');
      const [txt, colr] = NEON[i];
      const t = boardTex(768, 320, 'ink', [{ text: txt, size: 190, y: 160, col: colr }], colr);
      const p = board(sx + 0.15, y + 0.5, z, 4.4, 2.5, t, RED, 'x', 0.7); p.mesh.rotation.y = -0.35;
    });
  })();

  // ═══ 3. 樂聲戲院 — the cinema on 武昌街 with hand-painted billboards ═══════════════════
  // Reference: Lux Theatre (1964), a plain five-storey block whose whole street face was
  // covered by painters' billboards for the current films, a vertical 樂聲 neon on the corner,
  // a marquee canopy over the doors and poster cases at the pavement. West side, opposite the
  // Red House, so it is in frame with the octagon from the second keyframe.
  (() => {
    const z = -66, W = 15, XF = -9.3;                                              // three storeys: the childhood street stays low
    // Issue #5 step 2: the block, marquee, lobby, ticket booth, poster cases and roof lattice are
    // the glb from asset/blender/lux.py; the painted billboards below stay canvas text on it.
    const lux = libGroup(ALL);
    MODELS.load('lux', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(XF, 0, z); root.rotation.y = Math.PI / 2;
      lux.add(root);
    });
    // two painted billboards filling the upper facade
    function poster(title, sub, bg, blob) {
      const { cv, g } = canvas(1024, 768, bg);
      g.fillStyle = PALETTE[blob]; g.beginPath(); g.arc(700, 300, 230, 0, Math.PI * 2); g.fill();
      g.fillStyle = PALETTE.ink; g.beginPath(); g.moveTo(560, 768); g.quadraticCurveTo(640, 380, 780, 420); g.quadraticCurveTo(900, 470, 940, 768); g.fill();
      g.textAlign = 'left'; g.textBaseline = 'middle';
      fitText(g, title, 210, 560); g.fillStyle = PALETTE.ink; g.fillText(title, 50, 250);
      fitText(g, sub, 64, 520); g.fillStyle = PALETTE.ink; g.fillText(sub, 54, 420);
      g.fillStyle = PALETTE.verm; g.fillRect(50, 500, 420, 14);
      fitText(g, '樂聲戲院 · 今日上映', 58, 500); g.fillStyle = PALETTE.verm; g.fillText('樂聲戲院 · 今日上映', 50, 580);
      return tex(cv);
    }
    board(XF + 0.08, 4.6, z + 3.7, 6.8, 3.9, poster('英雄本色', 'A BETTER TOMORROW · 1986', 'haze', 'verm'), ALL, 'x');
    board(XF + 0.08, 4.6, z - 3.7, 6.8, 3.9, poster('倩女幽魂', 'A CHINESE GHOST STORY · 1987', 'bone', 'lamp'), ALL, 'x');
    board(XF + 0.08, 8.55, z, 13.8, 1.4, boardTex(2048, 680, 'bone', [{ text: '楚留香 · 成龍 · 周潤發 · 林青霞', size: 150, y: 250, col: 'ink' }, { text: '武昌街電影街', size: 110, y: 500, col: 'verm' }], 'verm'), ALL, 'x');
    const v = vertTex('樂聲戲院', 'verm', 'bone', 'bone');
    board(XF + 0.9, 3.6, z + W / 2 + 0.36, 6 * v.aspect, 6, v.t, ALL, 'z', 0.6);      // corner neon, read from the street
    F(XF + 0.6, z + W / 2 + 0.12, 3.4, 2.2, 0.3, 6.4, 'ink', ALL);                    // its dark backing, behind the board
  })();

  // ═══ 4. 萬年大樓 — the 1973 commercial tower, the tall landmark at the end of the chapter ═
  // Reference: 萬年商業大樓 on 西寧南路: a ten-storey concrete slab with a tight window grid,
  // a maze of small shops inside, an ice rink on top, a wall of vertical shop signs on the
  // street face and its name in big characters on the roof.
  (() => {
    const z = -124, W = 16, D = 14, ST = 10, FH = 3.3, XF = -9.3;
    const t = facadeTex(6, 10, 'haze');
    const p = part(XF - D / 2, 0, z, D, W, only(ALL, ST * FH, 'bone'));
    p.mesh.material.map = t; p.mesh.material.needsUpdate = true;
    part(XF - D / 2, ST * FH, z, D + 0.3, W + 0.3, only(ALL, 0.6, 'haze'));
    part(XF - D / 2 - 2, ST * FH + 0.6, z, D - 6, W - 6, only(ALL, 2.2, 'haze'));  // the rooftop rink hall
    board(XF - 1, ST * FH + 0.6, z, 12, 3.4, boardTex(1536, 440, 'bone', [{ text: '萬年商業大樓', size: 250, y: 220, col: 'verm' }], 'verm'), ALL, 'x', 0.4);
    const v = vertTex('萬年', 'verm', 'bone');
    board(XF + 0.1, 12, z + W / 2 - 1.5, 9 * v.aspect, 9, v.t, ALL, 'x', 0.5);
    for (let k = 0; k < 7; k++) { const vv = vertTex(['電玩', '冰宮', '唱片', '服飾', '漫畫', '模型', '小吃'][k], k % 2 ? 'bone' : 'lamp', 'ink'); board(XF + 0.1, 4 + (k % 3) * 2.6, z - 6.5 + k * 1.9, 5 * vv.aspect, 5, vv.t, ALL, 'x'); }
    part(XF - 0.7, 0, z, 1.4, W - 2, only(ALL, 3.6, 'ink'));                       // the dark ground-floor entrance
    part(XF + 0.02, 3.6, z, 0.1, W - 2, only(ALL, 0.6, 'verm'));
  })();

  // ═══ 5. the 1999 pedestrian zone — pavers on the road, bollards, the 西門町 gateway ═══════
  // Reference: 西門町行人徒步區 opened 1999: the road surface replaced by patterned pavers,
  // bollards at the entry and the arched 西門町 gateway signs. The camera reaches z -96 in 1996.
  (() => {
    const z0 = -96, z1 = -144;
    // CJ, 2026-09-24: 「後面地板破圖了」. On a phone the paving fills the bottom third of the frame, and what it showed there
    // was one lone half-strength red square per tile on near-white pavers with grey joins between them: it read as missing
    // textures (the same at 1440, only smaller and in the vignette; the pixel ratio and the shadow map were tested and
    // change nothing). The joins are now faint and the red is a band across every tile, the 西門町 pavers' own banding, so
    // the surface reads as one paved floor with a pattern in it rather than tiles with something showing through.
    const { cv, g } = canvas(128, 128, 'walk');
    g.fillStyle = PALETTE.verm; g.globalAlpha = 0.16; g.fillRect(0, 48, 128, 32); g.globalAlpha = 1;
    g.fillStyle = 'rgba(43,47,58,0.18)'; for (let i = 0; i < 4; i++) { g.fillRect(0, i * 32, 128, 2); g.fillRect(i * 32 + (i % 2) * 16, 0, 2, 128); }
    const t = tex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 16);
    const pv = part(0, 0, (z0 + z1) / 2, 12.4, z0 - z1, only(ALL, 0.08, 'haze'));
    pv.mesh.material.map = t; pv.mesh.material.needsUpdate = true;
    [-5.4, -3.2, 3.2, 5.4].forEach(x => [z0 + 0.6, z1 - 0.6].forEach(z => bollards.push({ x, z, w: 1, d: 1, h: hOf(1, ALL) })));   // bollards (bollard.glb), the centre kept clear for the girl
    // the gateway: two posts, a flat arch, the sign
    [-6.4, 6.4].forEach(x => part(x, 0, z0, 0.5, 0.5, only(ALL, 6.2, 'verm')));
    const sh = new THREE.Shape(); sh.absarc(0, 0, 1, 0, Math.PI, false); sh.absarc(0, 0, 0.82, Math.PI, 0, true);
    const arcGeo = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); arcGeo.translate(0, 0, -0.5);
    part(0, 5.4, z0, 6.65, 0.5, only(ALL, 2.2, 'verm'), 0, arcGeo);
    board(0, 6.3, z0 + 0.3, 5.2, 1.7, boardTex(1024, 336, 'bone', [{ text: '西門町', size: 200, y: 140, col: 'verm' }, { text: '行人徒步區 · SINCE 1999', size: 64, y: 280, col: 'ink' }], 'verm'), ALL, 'z', 0.4);
  })();

  // ═══ the shopfronts between: the teammate's Ximending library, with building bodies behind ═
  const lib = libGroup(['red']);
  // place a library storefront with its front on the sidewalk's outer edge (|x| = 9.2)
  // WALLS: every real street face a sign can be fixed to, { side, z0, z1, top }, filled here by
  // front() and body(). CJ, 2026-09-24: 「有些招牌懸空了」— the signs below test it (SIGNS.anchor).
  const WALLS = [];
  function front(id, side, z, scale) {
    const a = findAsset(id); if (!a) return null;
    const probe = a.build(window.NostalgiaCore); probe.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(probe), k = scale || 1, maxz = b.max.z * k, hw = (b.max.x - b.min.x) * k / 2;
    // street furniture (a phone booth, scooters, a cabinet, a standee) stands on the pavement with
    // its back to the wall, not in it, and is not a wall a sign can be fixed to; a front is the wall
    const loose = ['prop', 'arcade', 'vehicle'].indexOf(a.category) >= 0 || id === 'bbcall-ad-standee';
    if (loose) return asset(id, lib, side * (9.35 + b.min.z * k), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, scale);
    WALLS.push({ side, z0: z - hw, z1: z + hw, top: b.max.y * k });
    return asset(id, lib, side * (9.2 + maxz), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, scale);
  }
  // a building body behind the storefront, x 9.4 outward. Issue #5: tiled from shopfront.glb
  // (asset/blender/shopfront.py): a ground module, one storey module per floor, a roof module,
  // each 6 m wide and scaled to the body's length; the body's colour goes on the walls.
  const tiles = { ground: [], storey: [], roof: [] };
  const body = (side, z, len, h, col) => {
    const nx = Math.max(1, Math.round(len / 6)), tw = len / nx, ny = Math.max(1, Math.round((h - 0.6) / 3.3));
    const r = side > 0 ? -Math.PI / 2 : Math.PI / 2, c = C(col);
    WALLS.push({ side, z0: z - len / 2, z1: z + len / 2, top: ny * 3.3 + 0.8, floors: ny, body: true });   // to the roof parapet's top
    for (let i = 0; i < nx; i++) {
      const zz = z + len / 2 - tw * (i + 0.5);
      tiles.ground.push({ x: side * 9.4, z: zz, y: 0, r, w: tw / 6, d: 1, h: hOf(1), c });
      for (let f = 1; f < ny; f++) tiles.storey.push({ x: side * 9.4, z: zz, y: f * 3.3, r, w: tw / 6, d: 1, h: hOf(1), c });
      tiles.roof.push({ x: side * 9.4, z: zz, y: ny * 3.3, r, w: tw / 6, d: 1, h: hOf(1), c });
    }
  };
  // east side, from the street start: the 1980s row, then the Red House, then the 1990s
  // CJ, 2026-09-21: 「我希望一開始的兩邊不要太多大建築」— the opening stays open: two-storey
  // bodies only until the Red House plaza; the tall blocks start further down the street.
  // the library's cinema wall carries a generic 樂聲戲院 neon on its top; the real 樂聲 is at z -66,
  // so that neon is hidden here and the wall is named 國賓大戲院 (成都路, 1957) in mounted letters (signs, below)
  { const cw = front('movie-billboard-wall', 1, 38); if (cw) cw.traverse(o => { if (o !== cw && Math.abs(o.position.y - 7.1) < 0.01) o.visible = false; }); }
  body(1, 38, 10, 3.8, 'bone');
  front('record-shop', 1, 27); body(1, 27, 8, 4, 'haze');
  front('comic-rental-shop', 1, 17); body(1, 17, 7, 6.4, 'bone');
  front('public-phone-booth', 1, 10);
  front('yeh-lang-125', 1, 7.5); front('yeh-lang-125', 1, 6.3);
  front('internet-cafe', 1, 2); body(1, 2, 8, 4.2, 'walk');
  // z 0 … -50 is 1990–1992 in scroll time: no 2000s phone shop (Sony Ericsson, 2001), no
  // Pikachu gashapon (1996) and no photo-sticker booth (1995) here; 1980s fronts instead
  front('record-shop', 1, -8); body(1, -8, 8, 6.4, 'bone');
  front('arcade-cabinet', 1, -14.5); front('public-phone-booth', 1, -16);
  front('manga-rental', 1, -22); body(1, -22, 8, 4, 'haze');
  front('yeh-lang-125', 1, -29.4); front('yeh-lang-125', 1, -30.6);
  front('tower-records', 1, -38); body(1, -38, 12, 6.6, 'lamp');                 // 淘兒 1992: the yellow front on the corner before the Red House plaza, two storeys
  front('bbcall-ad-standee', 1, -46);
  // zone 2 (z 0 … -50), the east side facing 中華商場: the gaps between the fronts get their own
  // shophouses, and every shophouse storey here is painted (asset/paint/chunghwa_paint.py →
  // ximen-fronts.webp): two 3 m shops per ground floor, each with what it sells; iron-grille
  // cages, air conditioners, tile and vertical signs upstairs. The shopfront.glb modules stay
  // behind the paint for the silhouette (balcony slabs, AC boxes, parapets, tanks).
  body(1, -15, 6, 7.2, 'bone'); body(1, -29, 6, 10.5, 'haze'); body(1, -47, 6, 7.2, 'walk');
  (() => {
    const FW = 1536, FH = 844, CW = 384, CH = 211, X = 9.4 - 0.12;                // in front of the modules' sign boards
    const q = [];
    let g = 0, u = 0;
    // one painted face per 6 m module per storey, facing the road (-x): u runs south → north
    const face = (z, len, h, ground) => {
      const nx = Math.max(1, Math.round(len / 6)), tw = len / nx, ny = Math.max(1, Math.round((h - 0.6) / 3.3));
      for (let i = 0; i < nx; i++) {
        const zz = z + len / 2 - tw * (i + 0.5);
        for (let f = ground ? 0 : 1; f < ny; f++) {
          const k = f === 0 ? (g++ % 8) : 8 + (u++ * 3 % 8), cx = (k % 4) * CW, cy = Math.floor(k / 4) * CH;
          const u0 = cx / FW, u1 = (cx + CW) / FW, v1 = 1 - cy / FH, v0 = 1 - (cy + CH) / FH;
          q.push([[X, f * 3.3, zz - tw / 2, u0, v0], [X, f * 3.3, zz + tw / 2, u1, v0], [X, (f + 1) * 3.3, zz + tw / 2, u1, v1], [X, (f + 1) * 3.3, zz - tw / 2, u0, v1]]);
        }
      }
    };
    face(-8, 8, 6.4, false); face(-38, 12, 6.6, false);                           // behind library fronts: the storeys only
    face(-15, 6, 7.2, true); face(-29, 6, 10.5, true); face(-47, 6, 7.2, true);
    const pos = [], uv = [], idx = [];
    q.forEach(qq => { const b = pos.length / 3; qq.forEach(([x, y, z, a, c]) => { pos.push(x, y, z); uv.push(a, c); }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const TL = new THREE.TextureLoader(), t = n => { const x = TL.load('asset/textures/' + n + '.webp'); x.anisotropy = 8; return x; };
    const m = new THREE.Mesh(geo, withFog(new THREE.MeshLambertMaterial({ map: t('ximen-fronts'), normalMap: t('ximen-fronts-n'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
    m.receiveShadow = true;
    lib.add(m);
  })();
  // west side after 中華商場 and 樂聲: the 1990s–2000s
  front('f4-poster-wall', -1, -82); body(-1, -82, 8, 6.6, 'bone');
  front('zhangjunya-snack-shelf', -1, -88.5);
  front('kamatiam-cooler-storefront', -1, -95); body(-1, -95, 8, 6.6, 'haze');
  front('concert-stage', -1, -106, 0.9); body(-1, -106, 10, 8, 'bone');          // the 簽唱會 stage at the pedestrian-zone corner
  // east side after the Red House: 2000s items toward the chapter's end
  front('zhangjunya-snack-shelf', 1, -90);
  front('creative-cafe-storefront', 1, -96); body(1, -96, 8, 8, 'walk');
  front('f4-poster-wall', 1, -104); body(1, -104, 8, 9, 'haze');
  front('bbcall-ad-standee', 1, -110);
  front('internet-cafe', 1, -117); body(1, -117, 10, 10, 'bone');
  front('photo-sticker-booth', 1, -125); front('gashapon-machine', 1, -127); front('arcade-cabinet', 1, -128.5);
  front('phone-shop-window', 1, -134); body(1, -134, 9, 11, 'haze');
  // a body behind the Red House plaza edge and beyond 萬年 so the row does not end in a field
  body(-1, -140, 8, 9, 'bone'); body(1, -142, 8, 10, 'walk');

  // ═══ the city behind the street (2026-09-24) ════════════════════════════════════════════════
  // CJ, 2026-09-24: 「紅樓旁邊是空的」— beside the Red House the camera looked out over the engine's
  // green ground plane. Walking the chapter (0.02 … 0.34) found the same everywhere the street wall
  // had a hole or the roofs were low enough to see over: a lawn behind the phone booth, open ground
  // west of 樂聲, blank side walls at the Red House plaza and in the pedestrian zone. Real Ximending
  // is dense low blocks, 巷 alleys and the 西門町 pedestrian streets, never open ground. So:
  //   1. the street wall's holes of 4 m or more get shophouses; narrower ones stay as alleys, and
  //      the rows behind close them;
  //   2. two rows of blocks behind each side, and around the Red House's cross wing (south of the
  //      plaza, north of the wing, and closing the east), built the Arcane way: simple boxes, every
  //      face painted from ximen-fronts.webp (shops at street level, grille-cage storeys above), so
  //      no side wall is blank; one merged mesh for the faces, one for the boxes and roof sheds;
  //   3. the at-grade railway behind 中華商場 (to 1989), seen down the market's cross streets;
  //   4. paving over the green plane for the whole chapter.
  // Heights stay low (CJ, 2026-09-21: 「盡量矮點」): three to five storeys behind, four to seven on
  // the far row that closes the horizon.
  // 1. the street wall's holes
  body(1, 50.5, 15, 7.2, 'bone'); body(1, 9.75, 7.5, 7.2, 'haze');                  // the opening; behind the phone booth and scooters
  body(1, -86.5, 11, 7.2, 'walk'); body(1, -110, 4, 10.5, 'bone'); body(1, -125.75, 7.5, 10.5, 'walk');   // the plaza's south edge; the pedestrian zone
  body(-1, -52.25, 12.5, 7.2, 'haze'); body(-1, -75.75, 4.5, 7.2, 'bone'); body(-1, -88.5, 5, 7.2, 'walk');   // west, past 中華商場, either side of 樂聲
  body(-1, -113.5, 5, 10.5, 'haze'); body(-1, -134, 4, 10.5, 'bone');
  (() => {
    const FW = 1536, FH = 844, CW = 384, CH = 211, FL = 3.3;
    let seed = 1990; const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // its own stream: the engine's rnd() feeds every later placement, other chapters included
    const face = { pos: [], uv: [], idx: [] }, box = { pos: [], nor: [], col: [] };
    let gi = 3, si = 0;
    const cell = k => { const cx = (k % 4) * CW, cy = Math.floor(k / 4) * CH; return [cx / FW, (cx + CW) / FW, 1 - (cy + CH) / FH, 1 - cy / FH]; };
    // a painted wall with outward normal out (horizontal): from p, its bottom-left corner as seen
    // from outside, along r = up x out, w wide, floors high, in 6 m modules; ground floor from the
    // shop cells unless noShops, storeys from the rest. 5 cm proud of the wall.
    function paint(p, out, w, floors, noShops) {
      const n = Math.max(1, Math.round(w / 6)), mw = w / n, up = new THREE.Vector3(0, 1, 0);
      const r = new THREE.Vector3().crossVectors(up, out), nrm = out.clone().multiplyScalar(-0.05);
      for (let i = 0; i < n; i++) for (let f = 0; f < floors; f++) {
        const [u0, u1, v0, v1] = cell(f === 0 && !noShops ? (gi++ % 8) : 8 + (si++ * 5 % 8));
        const b = face.pos.length / 3;
        [[i * mw, f * FL, u0, v0], [(i + 1) * mw, f * FL, u1, v0], [(i + 1) * mw, (f + 1) * FL, u1, v1], [i * mw, (f + 1) * FL, u0, v1]].forEach(([a, y, u, v]) => {
          const q = p.clone().addScaledVector(r, a).sub(nrm); q.y = y; face.pos.push(q.x, q.y, q.z); face.uv.push(u, v);
        });
        face.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
    }
    // an axis-aligned box into the vertex-coloured mesh
    function cube(x0, x1, y0, y1, z0, z1, col) {
      const c = C(col), P = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
      [[0, 3, 2, 1, [0, 0, -1]], [4, 5, 6, 7, [0, 0, 1]], [0, 4, 7, 3, [-1, 0, 0]], [1, 2, 6, 5, [1, 0, 0]], [3, 7, 6, 2, [0, 1, 0]], [0, 1, 5, 4, [0, -1, 0]]].forEach(([a, b2, c2, d, nn]) => {
        [a, b2, c2, a, c2, d].forEach(k => { box.pos.push(...P[k]); box.nor.push(...nn); box.col.push(c.r, c.g, c.b); });
      });
    }
    // one building: footprint x0..x1, z0..z1, floors; every side painted; a tank or a rooftop shed
    const V0 = (x, z) => new THREE.Vector3(x, 0, z);
    function building(x0, x1, z0, z1, floors, noShops) {
      const top = floors * FL, V = (x, z) => new THREE.Vector3(x, 0, z);
      cube(x0, x1, 0, top, z0, z1, ['walk', 'haze', 'bone'][Math.floor(rr() * 3)]);
      cube(x0 - 0.1, x1 + 0.1, top, top + 0.7, z0 - 0.1, z1 + 0.1, 'walk');          // the roof parapet
      paint(V(x0, z0), new THREE.Vector3(-1, 0, 0), z1 - z0, floors, noShops);           // faces -x
      paint(V(x1, z1), new THREE.Vector3(1, 0, 0), z1 - z0, floors, noShops);            // faces +x
      paint(V(x0, z1), new THREE.Vector3(0, 0, 1), x1 - x0, floors, noShops);            // faces +z
      paint(V(x1, z0), new THREE.Vector3(0, 0, -1), x1 - x0, floors, noShops);           // faces -z
      const cx = (x0 + x1) / 2 + (rr() - 0.5) * (x1 - x0) * 0.4, cz = (z0 + z1) / 2 + (rr() - 0.5) * (z1 - z0) * 0.4;
      if (rr() < 0.55) { cube(cx - 0.8, cx + 0.8, top + 0.7, top + 1.6, cz - 0.8, cz + 0.8, 'ink'); cube(cx - 0.9, cx + 0.9, top + 1.6, top + 3.0, cz - 0.9, cz + 0.9, 'haze'); }   // water tank on its stand
      else { const w = 2 + rr() * 2; cube(cx - w, cx + w, top + 0.7, top + 3.0, cz - 1.8, cz + 1.8, rr() < 0.5 ? 'sky' : 'haze'); cube(cx - w - 0.2, cx + w + 0.2, top + 3.0, top + 3.15, cz - 2, cz + 2, rr() < 0.5 ? 'verm' : 'haze'); }   // 頂樓加蓋, the tin rooftop room
    }
    // a row of buildings along the street, x0..x1 deep, from zA down to zB, floors lo..hi
    function row(x0, x1, zA, zB, lo, hi, noShops) {
      let z = zA;
      while (z - 4 > zB) {
        const w = Math.min(z - zB, 6 + Math.floor(rr() * 3) * 3);
        building(x0, x1, z - w, z, lo + Math.floor(rr() * (hi - lo + 1)), noShops);
        z -= w;
      }
    }
    // 2. behind the east street wall, and around the Red House (octagon at x 16.6, z -70; its cross
    //    wing runs to x ~53 between z -58.5 and -81.5; the plaza is z -54 … -64 in front of it)
    row(19.4, 29.4, 58, -50, 3, 5); row(19.4, 29.4, -92, -146, 3, 5);
    row(31, 41, 58, -46, 4, 7, true);
    for (let x = 29.4; x < 58; x += 9.5) { building(x, x + 9, -56, -46, 3 + Math.floor(rr() * 2)); building(x, x + 9, -94, -84, 3 + Math.floor(rr() * 3)); }   // north of the wing, south of the plaza (the view CJ saw)
    row(58, 68, -46, -146, 4, 7, true);                                                // closing the east behind the Red House
    // behind the west street wall: 中華商場 backs onto the railway; the row starts past it
    row(-34, -24, 58, -146, 3, 5); row(-46, -36, 58, -146, 4, 7, true);
    // the side walls of every street building: a flank facing the Red House plaza, an alley or the
    // market's end was a blank shopfront.glb side. Where two buildings touch the paint is inside
    // the neighbour and never seen.
    WALLS.filter(w => w.body).forEach(w => {
      const xa = w.side * 9.4, xb = w.side * 18.6, lo = Math.min(xa, xb), hi = Math.max(xa, xb);
      paint(V0(lo, w.z1), new THREE.Vector3(0, 0, 1), hi - lo, w.floors, true);        // north flank
      paint(V0(hi, w.z0), new THREE.Vector3(0, 0, -1), hi - lo, w.floors, true);       // south flank
    });
    // the paint, the boxes
    const TL = new THREE.TextureLoader(), t = n => { const x = TL.load('asset/textures/' + n + '.webp'); x.anisotropy = 8; return x; };
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(face.pos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(face.uv, 2));
    fg.setIndex(face.idx); fg.computeVertexNormals();
    const fm = new THREE.Mesh(fg, withFog(new THREE.MeshLambertMaterial({ map: t('ximen-fronts'), normalMap: t('ximen-fronts-n'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(box.pos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(box.nor, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(box.col, 3));
    const bm = new THREE.Mesh(bg, withFog(new THREE.MeshLambertMaterial({ vertexColors: true })));
    [fm, bm].forEach(m => { m.receiveShadow = true; m.castShadow = true; lib.add(m); });
    window.__cityBehind = { faces: face.idx.length / 6, boxes: box.pos.length / 108 };
  })();
  // 3. the railway behind 中華商場: ballast and two tracks, at grade until the 1989 undergrounding
  part(-20, 0, 0, 6.4, 92, only(RED, 0.25, 'haze'));
  [-18.8, -21.2].forEach(xt => {
    [-0.72, 0.72].forEach(dx => F(xt + dx, 0, 0.25, 0.08, 92, 0.15, 'ink'));
    for (let z = 45.6; z > -46; z -= 0.75) F(xt, z, 0.25, 2.4, 0.22, 0.09, 'brick');
  });
  // 4. paving over the green: the chapter's ground outside the street is lanes and yards, not field
  part(44.7, 0, -43, 70.6, 206, only(RED, 0.03, 'walk'));
  part(-44.7, 0, -43, 70.6, 206, only(RED, 0.03, 'walk'));

  // ═══ the signs — built as what they are (realism pass, 2026-09-24) ════════════════════════
  // CJ, 2026-09-24: 「上面那些招牌還是很粗糙啊 路牌招牌 紅布條不像紅布條 字牌都應該是要現實的招牌
  // 有些店招牌還有房子上的字牌都不合理」. Until now every sign was one library textPlane: a flat
  // plane with text, one draw call each (144 of them). The rule now: if it would cast its own
  // shadow in real life, it is not a plane.
  //   直式招牌 vertical light box: a case 14 cm deep, a rim proud of the face, two arms and a strut
  //            to the wall, a neon tube down its outer edge, the face on both sides;
  //   店招牌   horizontal light box: the same case flat on the facade, standing off on brackets;
  //   紅布條   a cloth banner: a sagging, wrinkled strip with a hem, tied at its corners by rope;
  //   路牌     a street-name plate: white on blue in a metal frame, on a pole, bottom at 2.5 m;
  //   round traffic signs and a bus-stop board on their own poles.
  // Only paper stays flat: posters and price cards. All faces are painted at load time into one
  // canvas atlas; faces, hardware (vertex colours) and the neon are one merged mesh each, so the
  // whole street's signage is four draw calls. Names: asset/ximen-1980s.md …, the painted shop
  // units (asset/textures/chunghwa-shops.json) and the checks listed in research/realism-ximen/signs.
  const SIGNS = (() => {
    const AW = 2048, AH = 4096, PX = 150;                                         // atlas size, pixels per metre
    // on a phone the atlas canvas itself is TEX_SCALE the size, drawn through a scale transform, so no
    // 2048 x 4096 canvas ever exists there (app.js TEX_SCALE); layout and UVs stay in AW x AH units
    const TS = window.SCENE.TEX_SCALE;
    const cv = document.createElement('canvas'); cv.width = AW * TS; cv.height = AH * TS;
    const g = cv.getContext('2d'); g.scale(TS, TS);
    let ax = 0, ay = 0, rowH = 0;
    const alloc = (w, h) => {
      w = Math.ceil(w); h = Math.ceil(h);
      if (ax + w > AW) { ax = 0; ay += rowH + 4; rowH = 0; }
      if (ay + h > AH) console.warn('sign atlas full');
      const r = { x: ax, y: ay, w, h }; ax += w + 4; rowH = Math.max(rowH, h); return r;
    };
    const uvOf = r => [r.x / AW, (r.x + r.w) / AW, 1 - (r.y + r.h) / AH, 1 - r.y / AH];
    const P = k => PALETTE[k] || k;
    const font = (px, w) => `${w || 700} ${px}px ${CJK}`;
    function fit(text, px, maxW, weight) { g.font = font(px, weight); const tw = g.measureText(text).width; if (tw > maxW) g.font = font(Math.floor(px * maxW / tw), weight); }
    const FG = { verm: 'bone', lamp: 'ink', bone: 'verm', ink: 'lamp', haze: 'ink', sky: 'ink', walk: 'verm', leaf: 'bone', brick: 'bone' };

    // ── the faces, painted into the atlas ────────────────────────────────────────
    // a light-box face: the diffuser lit from behind (brighter centre), a thin inner line, the text
    function lightFace(text, wm, hm, bg, vertical) {
      const r = alloc(wm * PX, hm * PX), { x, y, w, h } = r;
      g.fillStyle = P(bg); g.fillRect(x, y, w, h);
      const grd = g.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
      grd.addColorStop(0, 'rgba(255,255,255,0.22)'); grd.addColorStop(1, 'rgba(0,0,0,0.10)');
      g.fillStyle = grd; g.fillRect(x, y, w, h);
      g.strokeStyle = P(FG[bg] || 'ink'); g.lineWidth = Math.max(2, Math.min(w, h) * 0.03); g.strokeRect(x + g.lineWidth * 2, y + g.lineWidth * 2, w - g.lineWidth * 4, h - g.lineWidth * 4);
      g.fillStyle = P(FG[bg] || 'ink'); g.textAlign = 'center'; g.textBaseline = 'middle';
      const chars = [...text.replace(/ /g, '')];
      if (vertical) {
        const cs = Math.min(w * 0.72, (h * 0.9) / chars.length);
        g.font = font(Math.floor(cs));
        chars.forEach((c, i) => g.fillText(c, x + w / 2, y + h / 2 + (i - (chars.length - 1) / 2) * cs * 1.02));
      } else { fit(text, h * 0.62, w * 0.88); g.fillText(text, x + w / 2, y + h / 2 + h * 0.03); }
      return uvOf(r);
    }
    // a red cloth banner: the print, a stitched hem top and bottom, eyelets in the corners, soft folds
    function bannerFace(text, wm, hm, bg, fg) {
      const r = alloc(wm * PX * 0.6, hm * PX * 0.6), { x, y, w, h } = r;
      g.fillStyle = P(bg); g.fillRect(x, y, w, h);
      for (let i = 0; i < 26; i++) {                                               // folds: soft vertical light and dark bands
        g.fillStyle = i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        const fx = x + (i / 26) * w; g.fillRect(fx, y, w / 26 * (0.6 + (i * 7 % 5) / 10), h);
      }
      const hem = h * 0.09;
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x, y, w, hem); g.fillRect(x, y + h - hem, w, hem);
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.setLineDash([6, 5]); g.lineWidth = 1.5;
      [y + hem - 3, y + h - hem + 3].forEach(yy => { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); });
      g.setLineDash([]);
      [[x + hem, y + hem / 2], [x + w - hem, y + hem / 2], [x + hem, y + h - hem / 2], [x + w - hem, y + h - hem / 2]].forEach(([ex, ey]) => {
        g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(ex, ey, hem * 0.42, 0, 7); g.fill();
        g.fillStyle = '#2b2f3a'; g.beginPath(); g.arc(ex, ey, hem * 0.2, 0, 7); g.fill();
      });
      g.fillStyle = P(fg); g.textAlign = 'center'; g.textBaseline = 'middle';
      fit(text, h * 0.6, w * 0.9); g.fillText(text, x + w / 2, y + h / 2);
      return uvOf(r);
    }
    // a street-name plate: white on blue, white inset border (unverified for 1990: see the notes)
    function plateFace(text, wm, hm) {
      const r = alloc(wm * PX * 1.4, hm * PX * 1.4), { x, y, w, h } = r;
      g.fillStyle = '#1f4f9a'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, w - 12, h - 12);
      g.fillStyle = '#f4f4f0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      fit(text, h * 0.6, w * 0.84); g.fillText(text, x + w / 2, y + h / 2 + 2);
      return uvOf(r);
    }
    // round signs: 禁止停車 (blue disc, red ring, one red slash) or a plain grey back
    function discFace(kind) {
      const r = alloc(96, 96), { x, y, w } = r, c = [x + w / 2, y + w / 2], R = w / 2 - 1;
      g.clearRect(x, y, w, w);
      const disc = (rad, col) => { g.fillStyle = col; g.beginPath(); g.arc(c[0], c[1], rad, 0, 7); g.fill(); };
      if (kind === 'back') disc(R, '#9aa0a6');
      else { disc(R, '#c8202a'); disc(R * 0.78, '#1f5fb0'); g.strokeStyle = '#c8202a'; g.lineWidth = R * 0.2; g.beginPath(); g.moveTo(c[0] - R * 0.55, c[1] - R * 0.55); g.lineTo(c[0] + R * 0.55, c[1] + R * 0.55); g.stroke(); }
      return uvOf(r);
    }
    // the bus-stop board: 公車站 over route numbers
    function busFace(routes) {
      const r = alloc(0.5 * PX * 1.4, 0.9 * PX * 1.4), { x, y, w, h } = r;
      g.fillStyle = '#f4f4f0'; g.fillRect(x, y, w, h);
      g.fillStyle = '#1f4f9a'; g.fillRect(x, y, w, h * 0.26);
      g.fillStyle = '#f4f4f0'; g.textAlign = 'center'; g.textBaseline = 'middle'; fit('公車站', h * 0.15, w * 0.86); g.fillText('公車站', x + w / 2, y + h * 0.13);
      g.fillStyle = '#2b2f3a'; routes.forEach((t, i) => { fit(t, h * 0.1, w * 0.8); g.fillText(t, x + w / 2, y + h * (0.36 + i * 0.13)); });
      return uvOf(r);
    }
    // paper: a poster (title, an abstract colour block, a small line) or a price card
    function paperFace(text, sub, wm, hm, bg, blob) {
      const r = alloc(wm * PX, hm * PX), { x, y, w, h } = r;
      g.fillStyle = P(bg); g.fillRect(x, y, w, h);
      if (blob) { g.fillStyle = P(blob); g.beginPath(); g.arc(x + w * 0.62, y + h * 0.58, w * 0.3, 0, 7); g.fill(); }
      g.fillStyle = P(FG[bg] || 'ink'); g.textAlign = 'center'; g.textBaseline = 'middle';
      const vertical = h > w * 1.2 && !sub;
      if (vertical) { const ch = [...text], cs = Math.min(w * 0.7, h * 0.86 / ch.length); g.font = font(Math.floor(cs)); ch.forEach((c, i) => g.fillText(c, x + w / 2, y + h / 2 + (i - (ch.length - 1) / 2) * cs)); }
      else { fit(text, Math.min(h * 0.3, w * 0.3), w * 0.86); g.fillText(text, x + w / 2, y + h * (sub ? 0.24 : 0.5)); }
      if (sub) { g.fillStyle = P('ink'); fit(sub, h * 0.08, w * 0.86, 400); g.fillText(sub, x + w / 2, y + h * 0.9); }
      g.fillStyle = 'rgba(255,255,255,0.5)'; [[x, y], [x + w - 10, y]].forEach(([tx, ty]) => g.fillRect(tx, ty, 10, 8));   // tape
      return uvOf(r);
    }

    // ── geometry accumulators ────────────────────────────────────────────────────
    const lit = { pos: [], uv: [], idx: [] }, flat = { pos: [], uv: [], idx: [] };
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    // a quad: centre c, unit vectors right/up, size w x h, uv [u0,u1,v0,v1]; front faces right x up
    function quad(acc, c, right, up, w, h, uv) {
      const b = acc.pos.length / 3, [u0, u1, v0, v1] = uv;
      [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]].forEach(([sx, sy, u, v]) => {
        const p = c.clone().addScaledVector(right, sx * w / 2).addScaledVector(up, sy * h / 2);
        acc.pos.push(p.x, p.y, p.z); acc.uv.push(u, v);
      });
      acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    // hardware: boxes and bars merged into one vertex-coloured mesh
    const hw = { pos: [], nor: [], col: [] }, glow = { pos: [], nor: [], col: [] };
    const unit = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    const M = new THREE.Matrix4(), NM = new THREE.Matrix3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Z = V3(0, 0, 1);
    function pushBox(acc, m, col) {
      const p = unit.attributes.position, n = unit.attributes.normal, c = C(col), v = new THREE.Vector3();
      NM.getNormalMatrix(m);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m); acc.pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(NM).normalize(); acc.nor.push(v.x, v.y, v.z);
        acc.col.push(c.r, c.g, c.b);
      }
    }
    // an axis-aligned box (optionally turned about y)
    const box = (cx, cy, cz, sx, sy, sz, col, rotY, acc) => { Q.setFromAxisAngle(V3(0, 1, 0), rotY || 0); M.compose(V3(cx, cy, cz), Q, S.set(sx, sy, sz)); pushBox(acc || hw, M, col); };
    // a bar from p0 to p1, t thick
    function bar(p0, p1, t, col, acc) {
      const d = p1.clone().sub(p0), len = d.length();
      Q.setFromUnitVectors(Z, d.normalize());
      M.compose(p0.clone().add(p1).multiplyScalar(0.5), Q, S.set(t, t, len)); pushBox(acc || hw, M, col);
    }
    let count = 0;
    // anchor(side, z, y0, h, halfW): the wall this sign is fixed to. Keeps the sign where it is if
    // a face stands behind the whole of it (with 0.2 m to the face's end) and tall enough to take
    // the top arm; else moves it along the street to the nearest real face within 4 m, lowering
    // or shortening it to fit under that face's top; else there is nothing to carry it and it goes.
    const log = { moved: [], dropped: [] };
    function anchor(text, side, z, y0, h, halfW) {
      let best = null, bd = 1e9;
      WALLS.forEach(w => {
        if (w.side !== side) return;
        const lo = w.z0 + halfW + 0.2, hi = w.z1 - halfW - 0.2; if (hi < lo) return;
        const zz = Math.min(hi, Math.max(lo, z)), d = Math.abs(zz - z);
        if (d < bd - 1e-6 || (Math.abs(d - bd) < 1e-6 && w.top > best.w.top)) { bd = d; best = { w, z: zz }; }
      });
      if (!best || bd > 4) { log.dropped.push(text + ' @' + z); return null; }
      const top = best.w.top - 0.15;
      let yy = y0, hh = h;
      if (yy + hh > top) { yy = Math.max(2.5, top - hh); hh = Math.min(hh, top - yy); }
      if (hh < Math.min(0.8, h) - 1e-6) { log.dropped.push(text + ' @' + z + ' (wall ' + best.w.top.toFixed(1) + ' m)'); return null; }
      if (bd > 1e-6 || yy !== y0 || hh !== h) log.moved.push(text + ' z ' + z + '→' + best.z.toFixed(1) + (yy !== y0 ? ', y ' + y0 + '→' + yy.toFixed(2) : ''));
      return { z: best.z, y0: yy, h: hh };
    }

    // ── the kinds ────────────────────────────────────────────────────────────────
    // 直式招牌: a vertical light box sticking out of a wall. side +1 east (-x is the road), wallX the
    // wall's |x|, z along the street, y0..y0+h. It reads from both directions along the street.
    function vbox(text, side, wallX, z, y0, h, bg, opts) {
      opts = opts || {};
      if (opts.anchor !== false) { const a = anchor(text, side, z, y0, h, 0.12); if (!a) return; ({ z, y0, h } = a); }
      const w = opts.w || 0.55, D = 0.14, gap = opts.gap || 0.12;
      const xin = side * (wallX - gap), xout = side * (wallX - gap - w), xc = (xin + xout) / 2, yc = y0 + h / 2;
      box(xc, yc, z, w, h, D, 'haze');                                                     // the case
      const uv = lightFace(text, w - 0.06, h - 0.06, bg, true);
      quad(lit, V3(xc, yc, z + D / 2 + 0.012), V3(1, 0, 0), V3(0, 1, 0), w - 0.06, h - 0.06, uv);   // faces the camera (+z)
      quad(lit, V3(xc, yc, z - D / 2 - 0.012), V3(-1, 0, 0), V3(0, 1, 0), w - 0.06, h - 0.06, uv);
      // the rim, proud of the face on both sides
      [[0, h / 2], [0, -h / 2]].forEach(([, dy]) => box(xc, yc + dy, z, w + 0.03, 0.035, D + 0.035, 'bone'));
      [xin, xout].forEach(xx => box(xx, yc, z, 0.035, h + 0.03, D + 0.035, 'bone'));
      // arms and a strut to the wall, a plate on the wall
      [y0 + h - 0.12, y0 + 0.12].forEach(yy => bar(V3(side * wallX, yy, z), V3(xin, yy, z), 0.04, 'ink'));
      bar(V3(side * wallX, y0 + 0.12, z), V3(xc, y0 + h - 0.12, z), 0.03, 'ink');
      box(side * (wallX - 0.01), y0 + h / 2, z, 0.02, h * 0.9, opts.plate || 0.2, 'ink');   // the plate the arms are bolted to
      if (opts.neon !== false) box(xout - side * 0.03, yc, z, 0.025, h - 0.1, D + 0.05, opts.neon || 'lamp', 0, glow);   // the neon down the outer edge
      count++;
    }
    // 店招牌: a horizontal light box flat on a wall facing the road, standing off on brackets
    function hbox(text, side, wallX, z, y0, w, h, bg, opts) {
      if (!(opts && opts.anchor === false)) { const a = anchor(text, side, z, y0, h, w / 2); if (!a) return; ({ z, y0, h } = a); }
      const D = 0.14, x = side * (wallX - 0.1 - D / 2), yc = y0 + h / 2;
      box(x, yc, z, D, h, w, 'haze');
      quad(lit, V3(x - side * (D / 2 + 0.012), yc, z), V3(0, 0, side > 0 ? 1 : -1), V3(0, 1, 0), w - 0.05, h - 0.05, lightFace(text, w - 0.05, h - 0.05, bg, false));
      [yc + h / 2, yc - h / 2].forEach(yy => box(x - side * 0.01, yy, z, D + 0.03, 0.03, w + 0.03, 'bone'));
      [z - w / 2, z + w / 2].forEach(zz => box(x - side * 0.01, yc, zz, D + 0.03, h + 0.03, 0.03, 'bone'));
      [z - w * 0.35, z + w * 0.35].forEach(zz => bar(V3(side * wallX, yc, zz), V3(x, yc, zz), 0.035, 'ink'));
      count++;
    }
    // 紅布條: cloth from a to b (Vector3, the top corners), h tall, sagging, facing n (unit)
    function cloth(text, a, b, h, sag, n, bg, fg) {
      const len = a.distanceTo(b), uv = bannerFace(text, len, h, bg, fg), [u0, u1, v0, v1] = uv;
      const NX = 24, base = flat.pos.length / 3, ph = (a.x * 3.1 + a.z * 1.7) % 6.28;
      for (let j = 0; j <= 2; j++) for (let i = 0; i <= NX; i++) {
        const t = i / NX, v = j / 2, bow = 4 * t * (1 - t);
        const p = a.clone().lerp(b, t);
        p.y += -sag * bow * (1 + 0.35 * v) - h * v;                                            // both edges sag, the free bottom more
        const wr = (0.035 * Math.sin(t * Math.PI * 7 + ph) + 0.02 * Math.sin(t * Math.PI * 17 + ph * 2)) * (0.3 + 0.7 * v) * (0.4 + bow);
        p.addScaledVector(n, wr + 0.05 * bow * v);                                             // wrinkles, and the belly billows a little
        flat.pos.push(p.x, p.y, p.z); flat.uv.push(u0 + (u1 - u0) * t, v1 - (v1 - v0) * v);
      }
      for (let j = 0; j < 2; j++) for (let i = 0; i < NX; i++) {
        const k = base + j * (NX + 1) + i;
        flat.idx.push(k, k + NX + 1, k + 1, k + 1, k + NX + 1, k + NX + 2);
      }
      count++;
    }
    // a cloth across the road between two poles, tied at the four corners
    function roadBanner(text, z, y, bg, fg) {
      const H = 0.95, A = V3(-5.15, y, z), B = V3(5.15, y, z), sag = 0.28;
      [-5.9, 5.9].forEach(x => { box(x, (y + 0.9) / 2, z, 0.14, y + 0.9, 0.14, 'haze'); box(x, y + 0.92, z, 0.2, 0.06, 0.2, 'haze'); });
      cloth(text, A, B, H, sag, V3(0, 0, 1), bg, fg);
      [[-1, A], [1, B]].forEach(([s, p]) => {
        bar(V3(s * 5.84, y + 0.35, z), V3(p.x, p.y - 0.02, z), 0.018, 'bone');                    // the rope, top corner to pole
        bar(V3(s * 5.84, y - H - 0.1, z), V3(p.x, p.y - H, z), 0.018, 'bone');                   // bottom corner
        [p.y - 0.02, p.y - H].forEach(yy => box(p.x - s * 0.03, yy, z, 0.07, 0.07, 0.07, 'bone'));   // the knots
      });
    }
    // a cloth tied along a parapet, facing the road (+x on the west side)
    function parapetBanner(text, side, x, z0, z1, yTop, bg, fg) {
      const A = V3(x, yTop, z0), B = V3(x, yTop, z1), n = V3(-side, 0, 0);
      cloth(text, A, B, 0.85, 0.06, n, bg, fg);
      [A, B].forEach(p => { box(p.x, p.y + 0.02, p.z, 0.06, 0.08, 0.06, 'bone'); box(p.x, p.y - 0.85, p.z, 0.05, 0.06, 0.05, 'bone'); });
    }
    // 路牌: a pole, a plate for the cross street (faces along the road) and one for the road itself
    function streetSign(x, z, cross, main) {
      const top = 3.05;
      box(x, top / 2, z, 0.08, top, 0.08, 'haze'); box(x, top + 0.03, z, 0.1, 0.06, 0.1, 'haze');
      const plate = (text, yc, alongX) => {
        const w = 0.95, h = 0.26, uv = plateFace(text, w, h);
        const c = alongX ? V3(x + Math.sign(-x) * (w / 2 + 0.04), yc, z) : V3(x, yc, z + w / 2 + 0.04);
        const r = alongX ? V3(Math.sign(-x) || 1, 0, 0) : V3(0, 0, -1);
        const nrm = alongX ? V3(0, 0, 1) : V3(1, 0, 0);
        box(c.x, yc, c.z, alongX ? w + 0.04 : 0.03, h + 0.04, alongX ? 0.03 : w + 0.04, 'haze');     // the metal plate and frame
        quad(flat, c.clone().addScaledVector(nrm, 0.028), alongX ? r : V3(0, 0, -1), V3(0, 1, 0), w, h, uv);
        quad(flat, c.clone().addScaledVector(nrm, -0.028), alongX ? r.clone().negate() : V3(0, 0, 1), V3(0, 1, 0), w, h, uv);
        bar(V3(x, yc + 0.1, z), c.clone().setY(yc + 0.1), 0.03, 'haze'); bar(V3(x, yc - 0.1, z), c.clone().setY(yc - 0.1), 0.03, 'haze');
      };
      plate(cross, 2.9, true); if (main) plate(main, 2.6, false);
      count++;
    }
    // a round traffic sign on a pole, facing +z (toward the camera)
    function roundSign(x, z) {
      box(x, 1.4, z, 0.07, 2.8, 0.07, 'haze');
      const d = 0.6, c = V3(x, 2.4, z + 0.05);
      quad(flat, c.clone().setZ(z + 0.06), V3(1, 0, 0), V3(0, 1, 0), d, d, discFace('no-parking'));
      quad(flat, c.clone().setZ(z + 0.04), V3(-1, 0, 0), V3(0, 1, 0), d, d, discFace('back'));
      count++;
    }
    function busStop(x, z, routes) {
      box(x, 1.5, z, 0.08, 3.0, 0.08, 'haze');
      const c = V3(x, 2.35, z + 0.06), uv = busFace(routes);
      box(x, 2.35, z + 0.04, 0.54, 0.94, 0.03, 'haze');
      quad(flat, c.clone().setZ(z + 0.07), V3(1, 0, 0), V3(0, 1, 0), 0.5, 0.9, uv);
      count++;
    }
    // paper: flat on a wall, facing the road (posters are the one kind that is a plane)
    function poster(text, sub, side, wallX, z, y, w, h, bg, blob, opts) {
      if (!(opts && opts.anchor === false)) { const a = anchor(text, side, z, y, h, w / 2); if (!a) return; z = a.z; }
      const uv = paperFace(text, sub, w, h, bg, blob);
      quad(flat, V3(side * (wallX - 0.02), y + h / 2, z), V3(0, 0, side > 0 ? 1 : -1), V3(0, 1, 0), w, h, uv);
      count++;
    }
    // 字牌: individual characters mounted off a wall, a shadow gap behind them. Each glyph is a
    // cut-out (alpha-tested, so it casts a glyph-shaped shadow), stacked in four layers 1.5 cm
    // apart for the letter's depth: three in the side colour, the face on top
    const glyphCache = {};
    function glyph(ch, col) {
      const k = ch + col; if (glyphCache[k]) return glyphCache[k];
      const r = alloc(128, 128), { x, y } = r;
      g.clearRect(x, y, 128, 128); g.fillStyle = P(col); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font(118, 900);
      g.fillText(ch, x + 64, y + 68);
      return (glyphCache[k] = uvOf(r));
    }
    function letters(text, side, wallX, zc, y0, size, col, sideCol) {
      { const a = anchor(text, side, zc, y0, size, [...text].length * size * 0.53); if (!a) return; zc = a.z; y0 = a.y0; }
      const chars = [...text], n = chars.length, step = size * 1.05;
      chars.forEach((ch, i) => {
        const z = zc + side * ((i - (n - 1) / 2) * step), right = V3(0, 0, side > 0 ? 1 : -1);
        for (let l = 0; l < 4; l++) quad(flat, V3(side * (wallX - 0.05 - l * 0.015), y0 + size / 2, z), right, V3(0, 1, 0), size, size, glyph(ch, l < 3 ? sideCol : col));
        box(side * (wallX - 0.025), y0 + size / 2, z, 0.05, 0.04, 0.04, 'ink');                  // the stud holding it off the wall
      });
      count++;
    }
    // a price card on a stake at a stall, facing the road
    function card(text, side, x, z) {
      const uv = paperFace(text, null, 0.8, 0.3, 'bone');
      box(x, 0.85, z, 0.03, 0.9, 0.03, 'ink');
      quad(flat, V3(x - side * 0.02, 1.35, z), V3(0, 0, side > 0 ? 1 : -1), V3(0, 1, 0), 0.8, 0.3, uv);
      box(x + side * 0.005, 1.35, z, 0.02, 0.32, 0.82, 'bone');
      count++;
    }

    function finish() {
      const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8;
      const mk = (acc, mat) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
        if (acc.uv) { geo.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2)); geo.setIndex(acc.idx); geo.computeVertexNormals(); }
        else { geo.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(acc.col, 3)); }
        const m = new THREE.Mesh(geo, withFog(mat)); m.castShadow = m.receiveShadow = !mat.isMeshBasicMaterial; lib.add(m); return m;
      };
      const off = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 };   // faces never fight the case or wall behind
      mk(lit, new THREE.MeshLambertMaterial(Object.assign({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.18, alphaTest: 0.5 }, off)));   // light boxes glow a little
      mk(flat, new THREE.MeshLambertMaterial(Object.assign({ map: tex, side: THREE.DoubleSide, alphaTest: 0.5 }, off)));
      mk(hw, new THREE.MeshLambertMaterial({ vertexColors: true }));
      if (glow.pos.length) mk(glow, new THREE.MeshBasicMaterial({ vertexColors: true }));
    }
    return { log, vbox, hbox, letters, roadBanner, parapetBanner, streetSign, roundSign, busStop, poster, card, finish, get count() { return count; } };
  })();
  window.__ximenSigns = () => SIGNS.count;
  window.__signAnchor = SIGNS.log;
  const BGS = ['verm', 'lamp', 'bone', 'sky', 'leaf', 'ink', 'walk', 'haze'];
  const bgAt = i => BGS[i % BGS.length];

  // ── 中華商場: the shops' own signs, from the painted units (chunghwa-shops.json) ──────────────
  // ground floor: one horizontal light box per shop on the arcade fascia (the photographs' signboard
  // band is made of these); upstairs: a vertical box on the corridor column nearest each tenant,
  // homes (住家) get none. Two cloth banners tied on the parapets.
  fetch('asset/textures/chunghwa-shops.json').then(r => r.json()).then(J => {
    const { blockZ, L, XF, FLOOR, SLOT } = MARKET;
    const COLS = [0, 1, 2, 3, 4].map(k => -L / 2 + 0.3 + k * (L - 0.6) / 4);          // chunghwa.py COL_XS (block-local, north = -)
    let n = 0;
    blockZ.forEach((z, b) => {
      const S = J.slots[SLOT[b]];
      S.ground.forEach((name, k) => {
        const zc = z + L / 2 - 0.95 - 1.9 * k;
        SIGNS.hbox(name, -1, 6.03, zc, FLOOR - 0.86, 1.7, 0.46, name === '點心世界' ? 'lamp' : bgAt(n++), { anchor: false });   // on the fascia beam, the whole block long
      });
      // upstairs: on the corridor's columns, and only the three interior ones: a box on a corner
      // column stands out over the cross street, in front of the next block's end wall, and read
      // as hanging in the air (CJ 「有些招牌懸空了」). At most two per column and floor, one each
      // side of it, the arms and a plate as wide as the column bolted to its face.
      const INNER = COLS.slice(1, 4);
      [['floor2', 4.0], ['floor3', 7.3]].forEach(([f, y0]) => {
        const used = {};
        S[f].forEach((name, k) => {
          if (name === '住家') return;
          const zc = z + L / 2 - 0.95 - 1.9 * k;
          const col = INNER.reduce((a, c) => Math.abs((z - c) - zc) < Math.abs((z - a) - zc) ? c : a, INNER[0]);
          const u = used[col] = (used[col] || 0) + 1; if (u > 2) { SIGNS.log.dropped.push(name + ' (third on one column)'); return; }
          SIGNS.vbox(name, -1, 6.125, z - col + (u === 1 ? -0.13 : 0.13) * (zc > z - col ? -1 : 1), y0, 1.9, bgAt(n++), { w: 0.5, gap: 0.03, anchor: false, plate: 0.46 });
        });
      });
    });
    // tied along a parapet inside one block (never across a cross street): block, floor top, colours
    [['中華商場 歲末大拍賣', 1, 4.35, 'verm', 'lamp'], ['訂做制服 學生服 一日交件', 4, 7.65, 'verm', 'bone'], ['跳樓大拍賣 全面八折', 6, 4.35, 'lamp', 'verm']]
      .forEach(([t, b, y, bg, fg]) => SIGNS.parapetBanner(t, -1, -6.0, blockZ[b] + 2.3, blockZ[b] - 2.3, y, bg, fg));
    // the east side's painted shops (ximen-fronts.webp cells 0-2): a real light box over each
    [[-15, 0], [-29, 1], [-47, 2]].forEach(([z, cell]) => J.east[cell].forEach((name, j) => SIGNS.hbox(name, 1, 9.28, z - 1.5 + j * 3, 2.72, 2.7, 0.5, bgAt(cell * 2 + j + 1))));
    SIGNS.finish();
  }).catch(e => { console.error('chunghwa-shops.json', e); SIGNS.finish(); });

  // ── the east side, 1985–1992: each shop's vertical sign, over its own front ──────────────────
  // CJ 「有些店招牌還有房子上的字牌都不合理」: a sign names the shop it hangs on. The old list hung
  // twenty trades every 4.4 m whatever stood behind; 冰宮 (the rink was on 萬年大樓's roof) and
  // brand names on the market parapets are gone.
  [['唱片行', 27, 'lamp'], ['租書店', 17, 'sky'], ['唱片 錄音帶', -8, 'verm'], ['電動玩具', -12.6, 'ink'], ['西藥房', -16.5, 'bone'], ['漫畫出租', -22, 'leaf'], ['冰果室', -30.5, 'sky'], ['錄影帶', -27.5, 'lamp'], ['淘兒音樂城', -35, 'verm'], ['理髮廳', -48.5, 'bone']].forEach(([t, z, bg]) => SIGNS.vbox(t, 1, 9.4, z, 3.3, 1.7, bg, { gap: 1.0, w: 0.6 }));   // clear of the 0.9 m balconies
  // 國賓大戲院 (成都路, since 1957): its name in mounted characters along the cinema wall's parapet
  SIGNS.letters('國賓大戲院', 1, 9.39, 38, 6.52, 0.44, 'verm', 'brick');   // between the billboards' tops and the wall's
  // the rest of the chapter, only where a facade stands: west 樂聲 (-58 … -74) keeps its own boards;
  // the bodies at -78 … -99 west and -86 … -138 east get the mid-90s trades
  [['佳佳唱片', -1, -80.5], ['KTV', -1, -84.5], ['通訊行 大哥大', -1, -93], ['錄影帶 出租', -1, -97.5], ['電玩 SEGA', 1, -94], ['牛肉麵', 1, -99.5], ['漫畫王', 1, -106], ['服飾', 1, -114], ['撞球', 1, -120], ['阿宗麵線', 1, -131], ['冰店', 1, -136]]
    .forEach(([t, s, z], i) => SIGNS.vbox(t, s, 9.4, z, 3.3 + (i % 2) * 0.5, 1.7, bgAt(i + 3), { gap: 1.0, w: 0.6 }));

  // ── paper: posters where posters were pasted, next to the shops that sold what they advertise ──
  // Year-checked against scroll time (z 0 ≈ 1990). The library's rule stands: names and colour
  // blocks only, no faces. 2000s names (周杰倫, S.H.E, 5566, F4, RO, 楓之谷, Sony Ericsson) are gone
  // from a chapter that ends in 1999.
  const POST = (side, wallX, list) => list.forEach(([t, sub, z, bg, blob]) => SIGNS.poster(t, sub, side, wallX, z, 1.05, 0.62, 0.88, bg, blob));
  POST(1, 9.1, [['鄧麗君', '新歌上市', 29.4, 'bone', 'verm'], ['羅大佑', '鹿港小鎮', 24.6, 'lamp', 'sky'], ['齊秦 王傑', '全省巡迴', 30.2, 'sky', 'lamp']]);        // the record shop, 1987
  POST(1, 9.1, [['七龍珠', '最新一集', 19.4, 'lamp', 'verm'], ['小叮噹', '全套出租', 14.6, 'sky', 'bone'], ['怪博士與機器娃娃', null, 20.2, 'bone', 'sky']]);   // the book-rental shop
  POST(1, 9.1, [['英雄本色', '1986 周潤發', 41.2, 'haze', 'verm'], ['倩女幽魂', '1987 王祖賢', 34.8, 'bone', 'lamp']]);                                   // beside the cinema billboards
  POST(1, 9.1, [['張雨生', '天天想你', -5.6, 'sky', 'lamp'], ['小虎隊', '青蘋果樂園', -10.4, 'lamp', 'verm']]);                                            // the 1990 record shop
  POST(1, 9.1, [['灌籃高手', '全套出租', -19.6, 'verm', 'bone'], ['城市獵人', '最新一集', -24.4, 'bone', 'sky']]);                                          // the 1991 comic rental
  // the market piers: film posters pasted on the concrete, 1987–1990
  [['悲情城市', '1989 侯孝賢'], ['賭神', '1989'], ['喋血雙雄', '1989'], ['旺角卡門', '1988'], ['七匹狼', '1989'], ['倩女幽魂', '1987']].forEach(([t, sub], i) => SIGNS.poster(t, sub, -1, 6.125, MARKET.blockZ[i + 1], 0.9, 0.44, 0.66, bgAt(i + 2), bgAt(i + 5), { anchor: false }));   // the middle pier of blocks 2–7
  // the mid-90s bodies further down
  POST(-1, 9.3, [['四大天王', '演唱會 1995', -79, 'lamp', 'verm'], ['張惠妹', '姊妹 1996', -83, 'verm', 'lamp']]);
  POST(1, 9.1, [['灌籃高手', '完結篇', -102.5, 'sky', 'verm'], ['任賢齊', '心太軟 1998', -117.5, 'bone', 'sky'], ['神奇寶貝', '1998 全套', -123, 'lamp', 'verm']]);

  // ── the street's own furniture: road names at the market's cross streets, a banner or two ──
  // Each gap between two blocks is a real cross street (north → south, research zone 2).
  ['洛陽街', '開封街', '漢口街', '武昌街', '成都路', '長沙街', '貴陽街'].forEach((nm, i) => {
    const zg = MARKET.blockZ[i] - MARKET.L / 2 - MARKET.GAP / 2;
    SIGNS.streetSign(-5.75, zg + 0.9, nm, i % 2 ? null : '中華路一段');
  });
  SIGNS.roundSign(5.75, 31); SIGNS.roundSign(-5.75, -44.6);                            // 禁止停車 at the kerb
  SIGNS.busStop(5.75, 12.5, ['0東  12  18', '49  202  205', '242  604']);
  // 紅布條 across the road: the market's own sale, 楚留香 (on Taiwan's screens 1982–83, a national
  // event) and 小虎隊 (formed 1988), both inside 1985–1999, and the cinema street's banner.
  // CJ, 2026-09-24, on swapping the first two for a National Day and a road-safety banner:
  // 「這個拿掉很尷尬」, then 「不是我是不要中華名國國慶的字樣不是不要布條」— the cloth banners stay
  // as built; the 國慶 wording goes. Period accuracy serves the memory: a sign goes only if it
  // could not have existed, never because something more official could have hung there.
  SIGNS.roadBanner('中華商場 歲末大拍賣', 38, 8.2, 'verm', 'lamp');
  SIGNS.roadBanner('電影街 本週上映 楚留香', 10, 7.6, 'lamp', 'verm');   // far enough that it sits under the opening title
  SIGNS.roadBanner('小虎隊 新專輯 全面上市', 0, 7.0, 'verm', 'lamp');
  SIGNS.roadBanner('西門町 電影街 · 樂聲 豪華 今日上映', -52, 6.2, 'lamp', 'verm');
  // price cards on the kerb stalls, on stakes
  [['紅豆牛奶冰 15元', 32], ['彈珠汽水 8元', 21.5], ['尪仔標 一張5元', -19.5], ['錄影帶 一夜30元', -33]].forEach(([t, z]) => SIGNS.card(t, 1, 6.75, z + 0.2));
  [['卡帶 120元', -52], ['刨冰 一盤15元', -76], ['電動 一枚5元', -114]].forEach(([t, z]) => SIGNS.card(t, -1, -6.75, z + 0.2));

  // ── one street stall: post-and-awning, counter, goods, crates, basket, seller and shoppers ──
  const stallEra = { red: 1, dadao: 0 };
  const PY = 0.08;                                                                // the plaza paving and the 1999 pavers; kerb stalls sit on the sidewalk slab
  function stall(sx, sz, fx, fz, i, front) {
    const H = k => ({ red: k });
    const along = (u, v) => [sx + fx * u - fz * v, sz + fz * u + fx * v];
    const dims = (a, b) => fz ? [b, a] : [a, b];
    const push = (u, v, y, a, b, h, col) => { const [x, z] = along(u, v); const [w, d] = dims(a, b); furn.push({ x, z, y, w, d, h: H(h), c: C(col) }); };
    push(0.5, 0, 0, 1.0, 2.2, 0.85, 'bone');
    [-1.1, 1.1].forEach(v => { push(1.0, v, 0, 0.1, 0.1, 2.2, 'ink'); push(-0.9, v, 0, 0.1, 0.1, 2.4, 'ink'); });
    push(0, 0, 2.2, 2.2, 2.6, 0.12, i % 3 === 1 ? 'verm' : (i % 3 === 2 ? 'lamp' : 'bone'));
    push(0.5, -0.45 + rnd() * 0.9, 0.85, 0.45, 0.55, 0.3, i % 2 ? 'lamp' : 'verm');
    const cv = i % 2 ? 1.5 : -1.5, cu = 0.3 + rnd() * 0.6;
    const [cx, cz] = along(cu, cv);
    furn.push({ x: cx, z: cz, y: 0, w: 0.6, d: 0.6, h: H(0.55), c: C('bone'), r: rnd() * 0.5 });
    const [bx, bz] = along(1.2 + rnd() * 0.3, -cv * 0.93);
    baskets.push({ x: bx, z: bz, w: 0.7, d: 0.7, h: H(0.4), c: C(i % 3 ? 'bone' : 'haze') });
    const [ex, ez] = along(-0.3, 0.3);
    crowd.push({ x: ex, z: ez, y: PY, r: fz ? 3.1 : (fx > 0 ? 1.57 : -1.57), v: 1, h: H(1.6) });     // the seller, behind the counter
    const n = 1 + Math.floor(rnd() * 2), [u0, u1] = front || [1.8, 3.2];
    for (let k = 0; k < n; k++) {
      const [px, pz] = along(u0 + rnd() * (u1 - u0), -1 + rnd() * 2);
      crowd.push({ x: px, z: pz, y: PY, r: rnd() * 6.28, h: H(1.5 + rnd() * 0.3) });   // shoppers at the stall
    }
  }
  // the plaza in front of the Red House: two rows of stalls facing the camera
  [-50, -56].forEach(z => [9.6, 12.6, 15.6, 18.6, 21.6].forEach((x, i) => stall(x, z, 0, 1, i + (z < -52 ? 1 : 0))));
  // kerb stalls under the arcades, facing the road, clear of the library props and the camera
  [[1, 32], [1, 21.5], [1, -19.5], [1, -33], [-1, -52], [-1, -76], [-1, -114], [1, -74], [1, -86], [1, -100]].forEach(([s, z], i) => stall(s * 7.9, z, -s, 0, i + 5, [1.3, 2.0]));

  // ── small props along the sidewalks (props.glb): A-board signs at the kerb, potted plants and
  //    box stacks by the shop walls; kept off the camera keyframe (-3, 3.5, -34) and the gateway ──
  for (let z = 30, i = 0; z > -132; z -= 9, i++) {
    const s = i % 2 ? 1 : -1;
    if (s < 0 && z < -27 && z > -41) continue;
    if (Math.abs(z + 96) < 3) continue;
    aboards.push({ x: s * 7.3, z: z + 1.5, w: 1, d: 1, r: s > 0 ? -Math.PI / 2 : Math.PI / 2, h: hOf(1) });
    plants.push({ x: s * 8.9, z: z - 2.2, w: 1, d: 1, r: rnd() * 6.28, h: hOf(1) });
    if (i % 3 === 0) boxes.push({ x: s * 8.6, z: z + 3.8, w: 1, d: 1, r: (rnd() - 0.5) * 0.4, h: hOf(1) });
  }

  // ── the street crowd (issue #13, the engine's people() figures): along both sidewalks, under the
  //    中華商場 arcade on the west, thick in the 1999 pedestrian zone; the road itself stays empty ──
  (() => {
    let n = 0;
    while (n < 70) {
      const s = n % 2 ? 1 : -1, z = 40 - rnd() * 180, x = s * (6.2 + rnd() * 1.1);
      if (s < 0 && z < -29 && z > -39) continue;                                   // camera keyframe (-3, 3.5, -34)
      if (z < -94 && z > -98) continue;                                            // the gateway posts
      n++;
      const rr = rnd();
      crowd.push({ x, z, y: 0.22, r: (rr < 0.5 ? 0 : Math.PI) + ((rr * 4) % 1 - 0.5) * 0.9, h: { red: 1.5 + rnd() * 0.3 } });   // walking along the street
    }
    for (let i = 0; i < 30; i++) crowd.push({ x: (rnd() - 0.5) * 9, z: -100 - rnd() * 40, y: PY, r: rnd() * 6.28, h: { red: 1.5 + rnd() * 0.3 } });   // the 1999 pedestrian zone: pavers, no traffic
    for (let i = 0; i < 12; i++) crowd.push({ x: -8.5 - rnd() * 4, z: -101 - rnd() * 4, y: 0.22, r: 1.57, h: { red: 1.5 + rnd() * 0.3 } }); // in front of the concert stage
  })();
  // parked scooters at the kerb, every era
  for (let i = 0; i < 16; i++) {
    const east = i < 8, x = east ? 5.2 : -5.2, z = east ? -55 - i * 0.95 : -108 - (i - 8) * 0.95;
    furn.push({ x, z, y: 0.25, w: 0.55, d: 1.6, h: hOf(0.55, ALL), c: C('haze'), r: (rnd() - 0.5) * 0.3 });
    furn.push({ x, z: z - 0.1, y: 0.8, w: 0.5, d: 0.7, h: hOf(0.16, ALL), c: C(i % 4 === 0 ? 'verm' : 'ink'), r: (rnd() - 0.5) * 0.3 });
  }
  // ── build the instanced sets ────────────────────────────────────────────────
  instSet(boxGeo, lam('bone'), furn, { colors: true });
  MODELS.load('shopfront', gltf => Object.keys(tiles).forEach(k => MODELS.instance(MODELS.node(gltf.scene, k), tiles[k], { colorPrim: 'bone' })));
  MODELS.load('bollard', gltf => MODELS.instance(gltf.scene, bollards));
  MODELS.load('props', gltf => { MODELS.instance(MODELS.node(gltf.scene, 'aboard'), aboards); MODELS.instance(MODELS.node(gltf.scene, 'plant'), plants); MODELS.instance(MODELS.node(gltf.scene, 'boxes'), boxes); });
  instSet(basketGeo, lam('bone'), baskets, { colors: true });
  people(crowd);
})();
