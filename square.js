// square.js — the walk-mode lantern square, made to read as a real Taipei place.
//
// CJ, 2026-10-31: "i need the square be more realistic". Earlier rules (HANDOFF.md): 「THE BUILDING NEED
// TO REFERENCE REAL BUILDING」, 「dont like low poly」, bright daylight, no fog, the data.js palette.
//
// Basis, decided 2026-11-01 (square agent, logged here so nobody re-litigates it): the 西門紅樓 front
// (north) plaza. Why: chapter 1 opens in 西門町 at the Red House, so the square the visit starts in should
// be the place the film starts; it is also the one Taipei plaza with every element the brief lists in one
// photo set — worn 紅磚 paving with grey bands, drain covers, 騎樓 arcades with shop signs round it, 榕樹,
// scooters in rows, AC units and wires on the walk-ups (research/reference/square/sources.md, the Eagle
// folder "Squares & street edge", .scratch/blender-detail/notes/square-refs*.md).
//
// What comes from where:
//   walls  sq-arcade.glb (asset/blender/sq-arcade.py): 騎樓 shophouse bays round all four sides, 1-3 upper
//          storeys with 鐵窗 cages and AC units, lit shop windows, a sign board on every slab edge and
//          vertical signs, all text from one canvas atlas (img/fongda-arcade.jpg, qilou-*.jpg,
//          ximending-street.jpg). The inner wall faces stay at SQ.h, where walk.js clamps her.
//   gates  sq-gate.glb (asset/blender/sq-gate.py): 西門町 west = the pedestrian-zone light-box gateway
//          (Eagle "Ximending gate 01"), 大稻埕 north = a red-brick 迪化街 / 牌樓 gate with a Baroque crest,
//          信義 east = a glass-and-steel pylon gate. walk.js's breathing glow stays in each opening.
//   trees  sq-banyan.glb (square-trees agent): 榕樹 in the four corners, as round the 紅樓 plaza.
//   floor  square-paving.js (square-paving agent), when loaded: herringbone 紅磚, 磨石子 bands, tactile
//          strips, drain covers. Otherwise walk.js's brick canvas stays.
//   light  square-light.js (square-light agent), when loaded: contact shade at the wall feet, shop spill.
//   street sq-scooter.glb rows nose-in to the arcades, sq-planter.glb potted plants at the piers (square-props
//          agent), and telephone / power cables sagging along the facades (Eagle subject/power-lines).
// Kept from walk.js on purpose: the centre stone and title board, QA's lamp posts at LAMP_H 12.5 and the
// lantern strings (north edge and both sides), the gate glows (the doorways), and gallery.js's two walls,
// which stand free in the south half and are never covered here.
//
// Hook: one call from walk.js, after the gates are built:
//   if (window.SQUARE) window.SQUARE.build({ square, SQ, GATES, gateArch, sign, P, FONT_ZH, FONT_EN });
// Everything is added to `square`, so walk.js's showFor() hides it with the square.
(function () {
  'use strict';
  if (!window.THREE || !window.SCENE || !window.MODELS) return;
  const S = window.SCENE, M = window.MODELS;
  const SQUARE = window.SQUARE = { ready: false, build, stats: {} };

  // ── shop names: invented, of the kinds that line a 西門町 arcade (no real brand) ──
  const SHOPS = ['西門眼鏡', '大同電器行', '金華鐘錶', '好味道小吃', '永和豆漿', '阿明冰果室', '新潮服飾', '小林髮廊',
    '萬年唱片行', '日新照相', '雙喜茶行', '美而美早餐', '老牌牛肉麵', '鴻運藥局', '國際書局', '長春鞋店',
    '光華五金', '24H 便利商店', '福州乾拌麵', '金山茶飲', '寶島鐘錶', '大世界彩券', '台灣滷肉飯', '星光電玩',
    '晶華刺青', '和平文具', '巨星卡拉OK', '西門派出所旁 停車', '鼎泰豐餅舖', '老街雞排', '青春服飾', '上海理髮',
    '萬國百貨', '東方書店', '太平洋牙醫', '24H 便利商店', '統一麵包', '阿宗古早味', '新世界 KTV', '仁愛診所'];
  const VSIGNS = ['旅社', '當舖', '補習班', '牙醫', '小吃', '照相', '眼鏡', '電器', '唱片', '鐘錶', '藥局', '撞球',
    '理髮', '咖啡', '當舖', '旅館', '算命', '書局', '診所', '服飾'];
  // board colours: ground (bg, text, stripe) — the convenience store gets the green/orange stripes of a Taipei
  // 便利商店 front, generic, no logo
  const BOARD = [['#f7f2e8', '#2b2f3a', '#d9483b'], ['#2b2f3a', '#ffb347', '#ffb347'], ['#d9483b', '#f7f2e8', '#f7f2e8'],
    ['#1f5e8c', '#f7f2e8', '#ffb347'], ['#f7f2e8', '#b8664c', '#2b2f3a'], ['#ffd76a', '#2b2f3a', '#d9483b']];

  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ── the arcade bays: four groups of sq-arcade, instanced by hand into `square` ──────────────
  const BAY_W = 4.4, G_H = 4.4, ST_H = 3.2;
  const TILE = ['#e2dccb', '#d9d2c2', '#cfd8dc', '#e8d5c4', '#d5dcc8', '#e6e0d0', '#c9d3db', '#efe3cf'];

  // one InstancedMesh per primitive of node; matrices from items { x, y, z, r, sx }; 'walk' prims take a
  // per-item tint (it.c), 'lamp' prims glow (the lit shop windows, the arcade ceiling lights)
  function instanceNode(node, items, parent, opts) {
    opts = opts || {};
    const out = [];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    M.prims(node).forEach(pr => {
      const hex = pr.color.getHex();
      const tint = opts.tint && hex === S.C(opts.tint).getHex();
      const glow = hex === S.C('lamp').getHex();
      const mat = S.withFog(new THREE.MeshLambertMaterial({ color: tint ? 0xffffff : pr.color }));
      if (glow) { mat.emissive = S.C('lamp'); mat.emissiveIntensity = opts.glow == null ? 0.55 : opts.glow; }
      const geo = pr.geometry.clone();
      pr.mesh.updateWorldMatrix(true, false);
      geo.applyMatrix4(new THREE.Matrix4().copy(pr.mesh.matrixWorld).premultiply(new THREE.Matrix4().copy(node.matrixWorld).invert()));
      const im = new THREE.InstancedMesh(geo, mat, items.length);
      items.forEach((it, i) => {
        q.setFromAxisAngle(Y, it.r || 0);
        im.setMatrixAt(i, m4.compose(p.set(it.x, it.y || 0, it.z), q, s.set(it.sx || 1, 1, 1)));
        if (tint) im.setColorAt(i, new THREE.Color(it.c || '#ffffff'));
      });
      if (tint && im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = !glow; im.receiveShadow = true;
      im.frustumCulled = false;                                   // r149: no per-instance bounds on InstancedMesh
      parent.add(im); out.push(im);
    });
    return out;
  }

  // the four walls as runs of bays. Each run: where its face is, which way it faces, and the stretch along
  // it (skipping the gate gap). Bays reach one bay past each corner so the corners close.
  function runs(SQ) {
    const L = SQ.h + BAY_W, GAP = SQ.gate + 2.0;
    const sides = [
      { name: 'west',  r: Math.PI / 2,  gate: true,  at: a => [SQ.x - SQ.h, SQ.z + a], along: [0, -1] },
      { name: 'north', r: 0,            gate: true,  at: a => [SQ.x + a, SQ.z - SQ.h], along: [1, 0] },
      { name: 'east',  r: -Math.PI / 2, gate: true,  at: a => [SQ.x + SQ.h, SQ.z + a], along: [0, 1] },
      { name: 'south', r: Math.PI,      gate: false, at: a => [SQ.x + a, SQ.z + SQ.h], along: [-1, 0] },
    ];
    const out = [];
    sides.forEach(sd => {
      const spans = sd.gate ? [[-L, -GAP], [GAP, L]] : [[-L, L]];
      spans.forEach(([a0, a1]) => {
        const n = Math.max(1, Math.round((a1 - a0) / BAY_W)), w = (a1 - a0) / n;
        for (let k = 0; k < n; k++) {
          const a = a0 + w * (k + 0.5), [x, z] = sd.at(a);
          out.push({ side: sd.name, x, z, r: sd.r, sx: w / BAY_W, w });
        }
      });
    });
    return out;
  }

  // local +X of a bay (three.js, after rotation r about Y) — the direction "along the wall to the bay's right"
  const rightOf = r => [Math.cos(r), -Math.sin(r)];
  const frontOf = r => [Math.sin(r), Math.cos(r)];

  // ── the sign atlas: every shop board and vertical sign in one canvas, one draw call each kind ──
  const AT = { W: 2048, H: 2048, bw: 512, bh: 82, bcols: 4, brows: 12, vw: 80, vh: 266, vy0: 1000 };
  function drawAtlas(ctx, n, nv) {
    const cv = document.createElement('canvas'); cv.width = AT.W; cv.height = AT.H;
    const g = cv.getContext('2d');
    const paint = () => {
      g.clearRect(0, 0, AT.W, AT.H);
      for (let i = 0; i < n; i++) {
        const cx = (i % AT.bcols) * AT.bw, cy = Math.floor(i / AT.bcols) * AT.bh;
        const name = SHOPS[i % SHOPS.length], store = name.indexOf('便利商店') >= 0;
        const [bg, fg, st] = store ? ['#f7f2e8', '#1f6e43', '#ff8a1e'] : BOARD[(i * 5 + 3) % BOARD.length];
        g.fillStyle = bg; g.fillRect(cx, cy, AT.bw, AT.bh);
        if (store) { g.fillStyle = '#1f6e43'; g.fillRect(cx, cy + AT.bh * 0.62, AT.bw, AT.bh * 0.14); g.fillStyle = st; g.fillRect(cx, cy + AT.bh * 0.78, AT.bw, AT.bh * 0.14); }
        else { g.fillStyle = st; g.fillRect(cx, cy + AT.bh - 7, AT.bw, 7); g.fillRect(cx, cy, AT.bw, 4); }
        g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'center';
        g.font = `700 ${Math.round(AT.bh * (store ? 0.44 : 0.58))}px ${ctx.FONT_ZH}`;
        g.fillText(name, cx + AT.bw / 2, cy + AT.bh * (store ? 0.32 : 0.48), AT.bw * 0.92);
        // weathering: a grime fade along the bottom, sun-bleach on the top
        const gr = g.createLinearGradient(0, cy, 0, cy + AT.bh);
        gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,30,20,0.18)');
        g.fillStyle = gr; g.fillRect(cx, cy, AT.bw, AT.bh);
      }
      for (let i = 0; i < nv; i++) {
        const cx = (i % 25) * AT.vw, cy = AT.vy0 + Math.floor(i / 25) * AT.vh;
        const [bg, fg] = [['#d9483b', '#f7f2e8'], ['#f7f2e8', '#d9483b'], ['#2b2f3a', '#ffb347'], ['#ffd76a', '#2b2f3a']][i % 4];
        g.fillStyle = bg; g.fillRect(cx, cy, AT.vw, AT.vh);
        g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
        const t = VSIGNS[i % VSIGNS.length];
        g.font = `700 ${Math.round(AT.vw * 0.66)}px ${ctx.FONT_ZH}`;
        [...t].forEach((ch, k) => g.fillText(ch, cx + AT.vw / 2, cy + AT.vh * (0.5 + (k - (t.length - 1) / 2) * 0.3)));
      }
    };
    paint();
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { paint(); tex.needsUpdate = true; });
    return tex;
  }

  // quads → one geometry; each quad { c: centre Vector3, u: right Vector3 (half width), v: up (half height), uv: [u0,v0,u1,v1] }
  function quads(list) {
    const pos = [], uv = [], idx = [];
    list.forEach((q, i) => {
      const { c, u, v } = q, [u0, v0, u1, v1] = q.uv;
      pos.push(c.x - u.x - v.x, c.y - u.y - v.y, c.z - u.z - v.z, c.x + u.x - v.x, c.y + u.y - v.y, c.z + u.z - v.z,
               c.x + u.x + v.x, c.y + u.y + v.y, c.z + u.z + v.z, c.x - u.x + v.x, c.y - u.y + v.y, c.z - u.z + v.z);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
      const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();                   // Lambert with no normals renders black (first after-shot)
    return g;
  }

  // ── which of walk.js's old pieces this replaces ─────────────────────────────────────────────
  // the plain wall blocks (and their bands, awnings, cornices), the window grid, the old floor, and the gate
  // posts / lintels / signs. Kept: centre stone, title board, QA's tall lamp posts (12.5 high, thin), bulbs,
  // lanterns, the gate glows. Matched by shape and place, not by order, so walk.js can keep changing.
  function retire(ctx, paved) {
    const { square, SQ, gateArch } = ctx;
    const hidden = [];
    const hide = o => { o.visible = false; hidden.push(o); };
    square.children.forEach(o => {
      if (o.isInstancedMesh && !o.userData.sq) return hide(o);              // walk.js's window grid
      if (!o.isMesh || o.userData.sq) return;
      const gp = o.geometry && o.geometry.parameters, type = o.geometry && o.geometry.type;
      const r = Math.max(Math.abs(o.position.x - SQ.x), Math.abs(o.position.z - SQ.z));
      if (type === 'BoxGeometry' && r >= SQ.h - 1.5) {
        const lampPost = gp.width < 0.5 && gp.depth < 0.5 && gp.height > 8;
        if (!lampPost) hide(o);
      }
      if (paved && type === 'PlaneGeometry' && o.material && o.material.map && Math.abs(o.position.y - 0.04) < 1e-3) hide(o);
    });
    Object.keys(gateArch || {}).forEach(k => gateArch[k].children.forEach(o => {
      if (!o.isMesh) return;
      if (o.material && o.material.isShaderMaterial) return;               // the glow: the doorway stays
      hide(o);
    }));
    return hidden;
  }

  // On a phone held upright the follow camera's lifted FOV puts the lantern strings (LAMP_H 12.5, walk.js) across
  // the top fifth of the frame, right behind the HUD's "THE SQUARE" block (lead, 2026-11-01; first try hid only
  // the west and east strings and after-phone.png still showed the north string behind the HUD lines). In
  // portrait every string steps aside; the four posts and their bulbs stay. Landscape keeps them all.
  function portraitLanterns(ctx) {
    const { square } = ctx, verm = S.C('verm').getHex(), strings = [];
    square.children.forEach(o => {
      if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.color.getHex() === verm && o.geometry.type === 'SphereGeometry') strings.push(o);
    });
    const mq = window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;
    const apply = () => { const p = mq ? mq.matches : innerHeight > innerWidth; strings.forEach(o => { o.visible = !p; }); };
    apply();
    if (mq && mq.addEventListener) mq.addEventListener('change', apply); else window.addEventListener('resize', apply);
    SQUARE.stats.lanterns = strings.length;
  }

  // ── build ────────────────────────────────────────────────────────────────────────────────────
  function build(ctx) {
    const { square, SQ, GATES, gateArch } = ctx;
    const t0 = performance.now();
    const root = new THREE.Group(); root.name = 'square-real'; root.userData.sq = true; square.add(root);

    // floor
    let paved = false;
    if (window.SQUARE_PAVING) {
      try { const P = window.SQUARE_PAVING.build(S, SQ); P.group.userData.sq = true; square.add(P.group); paved = true; SQUARE.paving = P; }
      catch (e) { console.error('square-paving failed; keeping the old floor', e); }
    }
    // light
    if (window.SQUARE_LIGHT && window.RIG && new URLSearchParams(location.search).get('sqlight') !== '0') {   // ?sqlight=0 turns it off for A/B
      try { window.SQUARE_LIGHT.build(S, SQ, window.RIG); SQUARE.light = true; }
      catch (e) { console.error('square-light failed', e); }
    }
    SQUARE.hidden = retire(ctx, paved);
    portraitLanterns(ctx);

    let pending = 2;
    const done = () => { if (--pending === 0) { SQUARE.ready = true; SQUARE.stats.buildMs = +(performance.now() - t0).toFixed(1); } };

    // the walls
    M.load('sq-arcade', gltf => {
      M.lambertize(gltf.scene);
      const node = n => M.node(gltf.scene, n);
      const bays = runs(SQ);
      const ground = [], storeys = [], roofs = [], vs = [], boards = [], vquads = [];
      bays.forEach((b, i) => {
        const floors = 1 + Math.floor(rnd() * 3) + (b.side === 'south' ? 1 : 0);   // 2-4 storeys over the arcade
        const c = TILE[Math.floor(rnd() * TILE.length)];
        ground.push({ x: b.x, z: b.z, r: b.r, sx: b.sx });
        for (let f = 0; f < floors; f++) storeys.push({ x: b.x, z: b.z, y: G_H + f * ST_H, r: b.r, sx: b.sx, c });
        roofs.push({ x: b.x, z: b.z, y: G_H + floors * ST_H, r: b.r, sx: b.sx, c });
        const [rx, rz] = rightOf(b.r), [fx, fz] = frontOf(b.r);
        // the shop board on the slab edge: board centre local (0.3, 4.02), face 0.16 out
        const k = i % (AT.bcols * AT.brows);
        const u0 = (k % AT.bcols) * AT.bw / AT.W, v1 = 1 - Math.floor(k / AT.bcols) * AT.bh / AT.H;
        boards.push({ c: new THREE.Vector3(b.x + rx * 0.3 * b.sx + fx * 0.165, 4.02, b.z + rz * 0.3 * b.sx + fz * 0.165),
                      u: new THREE.Vector3(rx * 1.88 * b.sx, 0, rz * 1.88 * b.sx), v: new THREE.Vector3(0, 0.29, 0),
                      uv: [u0, v1 - AT.bh / AT.H, u0 + AT.bw / AT.W, v1] });
        // a vertical sign on about half the bays, on the bay's right, from the first storey up
        if (rnd() < 0.55) {
          const ox = 1.85 * b.sx, y = G_H + 0.3 + Math.floor(rnd() * Math.max(1, floors - 1)) * ST_H;
          const vx = b.x + rx * ox, vz = b.z + rz * ox;
          vs.push({ x: vx, z: vz, y, r: b.r });
          const j = vquads.length / 2, vu0 = (j % 25) * AT.vw / AT.W, vv1 = 1 - (AT.vy0 + Math.floor(j / 25) * AT.vh) / AT.H;
          const uv = [vu0, vv1 - AT.vh / AT.H, vu0 + AT.vw / AT.W, vv1];
          // both faces of the board (it stands out from the wall, so its faces look along the wall)
          [1, -1].forEach(sgn => vquads.push({ c: new THREE.Vector3(vx + rx * 0.065 * sgn + fx * 0.75, y + 1.5, vz + rz * 0.065 * sgn + fz * 0.75),
                                               u: new THREE.Vector3(fx * 0.42 * -sgn, 0, fz * 0.42 * -sgn), v: new THREE.Vector3(0, 1.42, 0), uv }));
        }
      });
      instanceNode(node('ground'), ground, root, { glow: 0.6 });
      instanceNode(node('storey'), storeys, root, { tint: 'walk' });
      instanceNode(node('roof'), roofs, root, { tint: 'walk' });
      instanceNode(node('vsign'), vs, root);
      const tex = drawAtlas(ctx, boards.length, vquads.length / 2);
      const sMat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18, side: THREE.DoubleSide });
      const bm = new THREE.Mesh(quads(boards.concat(vquads)), S.withFog(sMat));
      bm.receiveShadow = true; bm.userData.sq = true; root.add(bm);
      bm.raycast = () => {};                      // the boards lie on the bays, which already stop the rays
      SQUARE.stats.bays = bays.length; SQUARE.stats.storeys = storeys.length; SQUARE.stats.vsigns = vs.length;
      done();
    });

    // the gates
    const GATE_NODE = { red: 'ximen', dadao: 'dadao', tower: 'xinyi' };
    const SLOT = { ximen: { z: 0.37, y: 8.55, w: 10.4, h: 1.7 }, dadao: { z: 0.57, zb: 0.47, y: 9.25, w: 5.2, h: 1.1 }, xinyi: { z: 0.42, y: 8.15, w: 10.0, h: 0.9 } };
    M.load('sq-gate', gltf => {
      M.lambertize(gltf.scene);
      Object.keys(GATES).forEach(k => {
        const G = GATES[k], name = GATE_NODE[k], src = M.node(gltf.scene, name);
        if (!src || !gateArch || !gateArch[k]) return;
        const g = src.clone(); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
        g.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === S.C('lamp').getHex()) { o.material = o.material.clone(); o.material.emissive = S.C('lamp'); o.material.emissiveIntensity = 0.7; } });
        g.userData.sq = true;
        gateArch[k].add(g);                                              // walk.js already turned and placed it
        const sl = SLOT[name];
        if (ctx.sign) [1, -1].forEach(sgn => {
          const m = ctx.sign(sl.w, sl.h, gateBoard(ctx, G, name), g);
          m.position.set(0, sl.y, sgn > 0 ? sl.z : -(sl.zb || sl.z)); if (sgn < 0) m.rotation.y = Math.PI;
          m.userData.sq = true;
        });
      });
      done();
    });

    // the banyans: the corners, as round the 紅樓 plaza; clear of the gallery walls (south half, |x| < 16, z + 10)
    M.load('sq-banyan', gltf => {
      M.lambertize(gltf.scene);
      const put = (n, x, z, r) => { const src = M.node(gltf.scene, n); if (!src) return; const t = src.clone(); t.position.set(SQ.x + x, 0, SQ.z + z); t.rotation.y = r; t.userData.sq = true; root.add(t); };
      put('banyanL', -19.5, -19.5, 0.4); put('banyanL', 19.5, -19.5, 2.1);
      put('banyanM', -20.5, 20.5, 1.2);  put('banyanM', 20.5, 20.5, 3.3);
    });

    // scooters parked in rows, nose to the arcade, as on every 西門町 pavement (square-props agent's
    // sq-scooter: 0.78 m pitch, yaw jitter, a gap now and then; Eagle MVWPDIO9I632L / MVWPDX9YVR322).
    // Rows: both flanks of the north gate, and the south half of the west and east walls — never in front
    // of the gallery walls or on the arrival path.
    M.load('sq-scooter', gltf => {
      M.lambertize(gltf.scene);
      const rows = [
        { a0: SQ.gate + 3.2, a1: SQ.h - 6, at: a => [SQ.x + a, SQ.z - SQ.h + 1.15], r: Math.PI },
        { a0: -(SQ.h - 6), a1: -(SQ.gate + 3.2), at: a => [SQ.x + a, SQ.z - SQ.h + 1.15], r: Math.PI },
        // short rows on the west and east walls (each scooter is 1.4k triangles a copy: the frame budget)
        { a0: SQ.gate + 3.2, a1: SQ.gate + 9, at: a => [SQ.x - SQ.h + 1.15, SQ.z + a], r: -Math.PI / 2 },
        { a0: SQ.gate + 3.2, a1: SQ.gate + 9, at: a => [SQ.x + SQ.h - 1.15, SQ.z + a], r: Math.PI / 2 },
      ];
      const sets = { scooterA: [], scooterB: [], scooterC: [] };
      rows.forEach(rw => { for (let a = rw.a0; a <= rw.a1; a += 0.78) {
        if (rnd() < 0.14) continue;
        const [x, z] = rw.at(a), k = rnd();
        sets[k < 0.45 ? 'scooterA' : k < 0.8 ? 'scooterC' : 'scooterB'].push({ x, z, r: rw.r + (rnd() - 0.5) * 0.12 });
      } });
      let n = 0;
      Object.keys(sets).forEach(name => { const node = M.node(gltf.scene, name); if (node && sets[name].length) { instanceNode(node, sets[name], root, { glow: 0.3 }); n += sets[name].length; } });
      SQUARE.stats.scooters = n;
    });
    // potted plants against the arcade piers, one on most bays (sq-planter 'pottedPlant')
    M.load('sq-planter', gltf => {
      M.lambertize(gltf.scene);
      const node = M.node(gltf.scene, 'pottedPlant'); if (!node) return;
      const items = [];
      runs(SQ).forEach(b => {
        if (rnd() < 0.35) return;
        const [rx, rz] = rightOf(b.r), [fx, fz] = frontOf(b.r), o = -1.15 * b.sx;
        items.push({ x: b.x + rx * o + fx * 0.45, z: b.z + rz * o + fz * 0.45, r: rnd() * 6.28 });
      });
      instanceNode(node, items, root);
      SQUARE.stats.plants = items.length;
    });
    // telephone and power cables slung along the facades between the first and second storeys, sagging
    // from bay to bay, with a few drops to the shop signs (the 騎樓 streets in Eagle subject/power-lines)
    (function cables() {
      const mat = S.withFog(new THREE.MeshLambertMaterial({ color: S.C('ink') }));
      const geos = [];
      const sides = [
        { p: a => new THREE.Vector3(SQ.x - SQ.h + 0.35, 0, SQ.z + a) }, { p: a => new THREE.Vector3(SQ.x + a, 0, SQ.z - SQ.h + 0.35) },
        { p: a => new THREE.Vector3(SQ.x + SQ.h - 0.35, 0, SQ.z + a) }, { p: a => new THREE.Vector3(SQ.x + a, 0, SQ.z + SQ.h - 0.35) },
      ];
      sides.forEach((sd, si) => {
        const spans = si === 3 ? [[-SQ.h, SQ.h]] : [[-SQ.h, -SQ.gate - 2.2], [SQ.gate + 2.2, SQ.h]];
        spans.forEach(([a0, a1]) => [[5.1, 0.45], [5.35, 0.6], [7.9, 0.35]].forEach(([y, sag], wi) => {
          const pts = [];
          for (let a = a0; a <= a1 + 1e-6; a += (a1 - a0) / Math.max(1, Math.round((a1 - a0) / 8.8))) {
            const p = sd.p(a); p.y = y; pts.push(p);
          }
          for (let i = 0; i + 1 < pts.length; i++) {
            const A = pts[i], B = pts[i + 1], Mi = A.clone().lerp(B, 0.5); Mi.y -= sag;
            geos.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, Mi, B), 10, wi === 2 ? 0.018 : 0.026, 4, false));
          }
        }));
      });
      // merge by hand (r149 has no BufferGeometryUtils on the global build)
      let nPos = 0, nIdx = 0; geos.forEach(g => { nPos += g.attributes.position.count; nIdx += g.index.count; });
      const pos = new Float32Array(nPos * 3), nor = new Float32Array(nPos * 3), idx = new Uint32Array(nIdx);
      let vo = 0, io = 0;
      geos.forEach(g => { pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
        for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.array[i] + vo; vo += g.attributes.position.count; io += g.index.count; g.dispose(); });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.userData.sq = true; root.add(m);
      m.raycast = () => {};                       // a wire hides nothing and stops nobody (walk.js rays every solid)
      SQUARE.stats.cableTris = nIdx / 3;
    })();

    // the light's per-frame update runs here, so walk.js needs no second hook
    if (SQUARE.light) {
      let last = performance.now();
      const tick = now => {
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        const on = !!(window.WALK && window.WALK.on && window.WALK.where === 'square' && square.visible);
        try { window.SQUARE_LIGHT.update(dt, on); } catch (e) { console.error(e); SQUARE.light = false; return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // the gate's name board, per style. English is the headline and the Chinese name the smaller secondary line
  // (CJ's rule, as in walk.js gateSign: "English copy, Chinese small").
  function gateBoard(ctx, G, style) {
    const P = ctx.P || S.PALETTE, ZH = ctx.FONT_ZH, EN = ctx.FONT_EN;
    return (g, W, H) => {
      if (style === 'ximen') {                    // the pedestrian-zone light box: bright, colourful
        const gr = g.createLinearGradient(0, 0, W, 0);
        gr.addColorStop(0, '#ffd76a'); gr.addColorStop(0.5, '#ff8fa3'); gr.addColorStop(1, '#8ecbff');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = P.verm; g.fillRect(0, H * 0.82, W, H * 0.18);
        g.fillStyle = P.ink; g.textBaseline = 'middle';
        g.textAlign = 'left'; g.font = `700 ${Math.round(H * 0.5)}px ${EN}`; g.fillText('WELCOME TO ' + G.en, W * 0.04, H * 0.36);
        g.font = `400 ${Math.round(H * 0.17)}px ${EN}`; g.fillText(G.years + ' · ' + G.line, W * 0.04, H * 0.7);
        g.textAlign = 'right'; g.font = `700 ${Math.round(H * 0.32)}px ${ZH}`; g.fillText(G.zh, W * 0.96, H * 0.42);
        g.fillStyle = P.bone; g.font = `700 ${Math.round(H * 0.12)}px ${EN}`; g.textAlign = 'center'; g.fillText('PEDESTRIAN ZONE · 徒步區', W / 2, H * 0.91);
      } else if (style === 'dadao') {             // a carved stone name panel
        g.fillStyle = P.bone; g.fillRect(0, 0, W, H);
        g.strokeStyle = P.brick; g.lineWidth = H * 0.06; g.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
        g.fillStyle = P.brick; g.textBaseline = 'middle'; g.textAlign = 'center';
        g.font = `700 ${Math.round(H * 0.4)}px ${EN}`; g.fillText(G.en, W / 2, H * 0.38);
        g.font = `700 ${Math.round(H * 0.2)}px ${ZH}`; g.fillText(G.zh + ' · ' + G.years, W / 2, H * 0.74);
      } else {                                    // 信義: a dark band with light lettering
        g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
        g.fillStyle = P.glass; g.fillRect(0, H * 0.9, W, H * 0.1);
        g.fillStyle = P.bone; g.textBaseline = 'middle';
        g.textAlign = 'left'; g.font = `700 ${Math.round(H * 0.56)}px ${EN}`; g.fillText(G.en, W * 0.04, H * 0.47);
        g.textAlign = 'right'; g.font = `400 ${Math.round(H * 0.3)}px ${EN}`; g.fillText(G.years + ' · ' + G.line, W * 0.7, H * 0.47);
        g.font = `700 ${Math.round(H * 0.4)}px ${ZH}`; g.fillText(G.zh, W * 0.96, H * 0.47);
      }
    };
  }
})();
