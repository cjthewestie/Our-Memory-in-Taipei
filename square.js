// square.js — the square everyone arrives in: a banyan at golden hour, arcades all round, three gates,
// and a little open-air karaoke stand.
//
// CJ, 2026-11-03: 「廣場的燈籠太粗糙了 再想一下廣場要怎麼設計」, then the banyan square (騎樓 all round, three
// gates: 西門町 red steel sign, 大稻埕 brick arch, 信義 glass; golden hour), 「我還想要小卡啦ok站」, and then
// 「燈籠先拆掉 做一個完整的榕樹廣場」 after research: research/banyan-square/README.md is the brief.
// So: the banyan as 大樹公 (red cloth round it) with the 土地公 shrine at its foot, the 伯公下 life under it
// (象棋, 老人茶, people resting on the tree's seat), a notice board with everyone's memories on it, a karaoke
// stand, a sausage cart, street lamps, potted plants and pigeons. No lanterns in the square.
//
// Everything is built from primitives and canvas textures, no new model files. Repeated small parts
// (windows, grilles, air conditioners, columns, scooters, roots, leaf cards, pots) are InstancedMeshes,
// so the whole square costs a few dozen draw calls. Things that glow are unlit (toneMapped: false) with
// an additive halo, never real lights: a light would recompile every material on the street.
//
// walk.js owns movement and the gates' triggers; memories.js pins the newest memories to the notice
// board (SQUARE.board) and uses SQUARE.makeLantern for the lanterns out on the street.
(function () {
  'use strict';
  if (!window.SCENE || !window.THREE || !window.RIG) return;
  const S = window.SCENE, R = window.RIG;
  const { scene, C, lit } = S;
  const P = S.PALETTE;

  const SQ = { x: 0, z: 150, h: 26, gate: 4.6 };   // h: centre to the arcade's column line; gate: half a gate's opening
  const group = new THREE.Group(); scene.add(group);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const mat = (col, extra) => lit(Object.assign({ color: typeof col === 'string' ? new THREE.Color(P[col] || col) : col, vertexColors: false }, extra || {}));
  const basic = (col, extra) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(P[col] || col) }, extra || {}));
  const BOX = new THREE.BoxGeometry(1, 1, 1); BOX.translate(0, 0.5, 0);           // base at y = 0
  function box(w, h, d, m, x, y, z, parent, shadow) {
    const o = new THREE.Mesh(BOX, m); o.scale.set(w, h, d); o.position.set(x, y, z);
    o.castShadow = shadow !== false; o.receiveShadow = true; (parent || group).add(o); return o;
  }
  const cyl = (rt, rb, h, seg) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg || 12); g.translate(0, h / 2, 0); return g; };
  let seed = 20261103; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const FONT_ZH = '"Chocolate Classical Sans", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  const FONT_EN = '"Barlow Condensed", "Barlow", sans-serif';

  // canvas textures, redrawn once the web fonts are in (a sign drawn before then uses a fallback face)
  const redraws = [];
  function canvasTex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    const run = () => { const g = cv.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h); tex.needsUpdate = true; };
    run(); redraws.push(run);
    return tex;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => redraws.forEach(f => f()));

  // instanced parts: collect world matrices (and colours), build once
  function Inst(geo, m) {
    const items = [];
    return {
      add(matrix, color) { items.push([matrix.clone(), color || null]); },
      build(cast) {
        if (!items.length) return null;
        const im = new THREE.InstancedMesh(geo, m, items.length);
        items.forEach(([mx, c], i) => { im.setMatrixAt(i, mx); if (c) im.setColorAt(i, c); });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = cast !== false; im.receiveShadow = true; group.add(im); return im;
      },
    };
  }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  const local = (x, y, z, sx, sy, sz, ry, rx, rz) => M4.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx || 0, ry || 0, rz || 0)), SC.set(sx, sy, sz));
  const halo = (() => {
    const tex = canvasTex(64, 64, (g) => {
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,200,120,0.95)'); r.addColorStop(0.3, 'rgba(255,160,80,0.4)'); r.addColorStop(1, 'rgba(255,140,60,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    });
    return new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  })();

  const haloRed = (() => {
    const tex = canvasTex(64, 64, (g) => {
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,90,60,0.95)'); r.addColorStop(0.35, 'rgba(255,60,40,0.35)'); r.addColorStop(1, 'rgba(255,40,30,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    });
    return new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  })();

  // ── the lantern: a Taiwanese 燈籠, not a ball ────────────────────────────────
  // A lathe body (a rounded drum, wider in the middle), bamboo ribs and a soft inner glow painted on,
  // gold caps, a red tassel, a character on two sides, and a halo. Unlit, so it reads as lit from inside.
  const LANTERN_PROFILE = (() => {
    const pts = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(0.17 + 0.31 * Math.pow(Math.sin(Math.PI * t), 0.75), -0.48 + 0.96 * t)); }
    return pts;
  })();
  const lanternGeo = new THREE.LatheGeometry(LANTERN_PROFILE, 22);
  const capGeo = cyl(0.19, 0.19, 0.07, 16);
  const rimGeo = cyl(0.13, 0.13, 0.05, 12);
  const tasselGeo = new THREE.ConeGeometry(0.075, 0.42, 8, 1, true); tasselGeo.translate(0, -0.21, 0);
  const cordGeo = cyl(0.012, 0.012, 1, 4);
  const goldMat = mat('#c9a043', { metalness: 0.6, roughness: 0.35 });
  const tasselMat = basic('#c4211b', { side: THREE.DoubleSide });
  const cordMat = basic('#3a2a20');
  const lanternTex = {};
  function lanternMaterial(text, body) {
    const key = text + '|' + body;
    if (lanternTex[key]) return lanternTex[key];
    const tex = canvasTex(512, 256, (g, W, H) => {
      // the paper: brighter where the candle is, darker toward the caps
      const v = g.createLinearGradient(0, 0, 0, H);
      v.addColorStop(0, shade(body, -0.45)); v.addColorStop(0.18, shade(body, -0.1)); v.addColorStop(0.5, shade(body, 0.28));
      v.addColorStop(0.82, shade(body, -0.1)); v.addColorStop(1, shade(body, -0.45));
      g.fillStyle = v; g.fillRect(0, 0, W, H);
      // bamboo ribs
      g.strokeStyle = 'rgba(70,10,5,0.35)'; g.lineWidth = 3;
      for (let i = 0; i < 22; i++) { const x = (i + 0.5) * W / 22; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      // two thin gold bands near the caps
      g.fillStyle = '#e9c060'; g.fillRect(0, H * 0.1, W, 4); g.fillRect(0, H * 0.88, W, 4);
      // the character, twice round
      g.fillStyle = '#2a120c'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const big = /^[0-9]+$/.test(text) ? H * 0.32 : H * 0.5;
      g.font = `700 ${Math.round(big)}px ${FONT_ZH}`;
      [0.25, 0.75].forEach(u => g.fillText(text, W * u, H * 0.52));
    });
    lanternTex[key] = basic('#ffffff', { map: tex, toneMapped: false });   // lit from inside: dusk does not darken it
    return lanternTex[key];
  }
  function shade(hex, k) {
    const c = new THREE.Color(hex);
    if (k > 0) c.lerp(new THREE.Color('#ffd7a0'), k); else c.multiplyScalar(1 + k);
    return '#' + c.getHexString();
  }
  // makeLantern({ text, body, size, cord }): a group with its centre at the origin; cord = length of
  // string above it (0 for none). userData.phase is a per-lantern sway offset.
  function makeLantern(o) {
    o = Object.assign({ text: '福', body: '#d23a2a', size: 1, cord: 0, halo: true }, o || {});
    const g = new THREE.Group();
    g.add(new THREE.Mesh(lanternGeo, lanternMaterial(o.text, o.body)));
    const top = new THREE.Mesh(capGeo, goldMat); top.position.y = 0.46; g.add(top);
    const bot = new THREE.Mesh(capGeo, goldMat); bot.position.y = -0.53; g.add(bot);
    const rim = new THREE.Mesh(rimGeo, goldMat); rim.position.y = 0.53; g.add(rim);
    const tas = new THREE.Mesh(tasselGeo, tasselMat); tas.position.y = -0.53; g.add(tas);
    if (o.cord > 0) { const c = new THREE.Mesh(cordGeo, cordMat); c.position.y = 0.58; c.scale.y = o.cord; g.add(c); }
    if (o.halo) { const h = new THREE.Sprite(halo); h.scale.setScalar(2.1); g.add(h); }
    g.scale.setScalar(o.size);
    g.userData.phase = rnd() * 6.28;
    return g;
  }

  // ── the ground: red brick, a terrazzo circle round the tree, a pool of warm light under it ──
  (function ground() {
    const brick = canvasTex(256, 256, (g) => {
      g.fillStyle = '#8f5a48'; g.fillRect(0, 0, 256, 256);
      for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) {
        g.fillStyle = ['#c47f66', '#b8735b', '#cc8a70', '#b06c55', '#c17a62'][(i * 7 + j * 3 + 11) % 5];
        g.fillRect(i * 64 + (j % 2) * 32 + 2, j * 32 + 2, 60, 28);
      }
    });
    brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(14, 14);
    const pave = new THREE.Mesh(new THREE.PlaneGeometry(SQ.h * 2 + 8, SQ.h * 2 + 8), mat('#ffffff', { map: brick }));
    pave.rotation.x = -Math.PI / 2; pave.position.set(SQ.x, 0.04, SQ.z); pave.receiveShadow = true; group.add(pave);
    const terr = canvasTex(256, 256, (g) => {
      g.fillStyle = '#c9c4b8'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) { g.fillStyle = pick(['#8d877c', '#e8e3d8', '#a59f93', '#6f6a62', '#d9cdb5']); g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2.5, 1 + rnd() * 2.5); }
    });
    terr.wrapS = terr.wrapT = THREE.RepeatWrapping; terr.repeat.set(6, 6);
    const ring = new THREE.Mesh(new THREE.CircleGeometry(10.5, 48), mat('#ffffff', { map: terr }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(SQ.x, 0.06, SQ.z); ring.receiveShadow = true; group.add(ring);
    const edge = new THREE.Mesh(new THREE.RingGeometry(10.5, 10.9, 64), mat('#7c5a49'));
    edge.rotation.x = -Math.PI / 2; edge.position.set(SQ.x, 0.065, SQ.z); group.add(edge);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(9.5, 40), new THREE.MeshBasicMaterial({
      map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,190,110,0.55)'); r.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(SQ.x, 0.08, SQ.z); group.add(pool);
  })();

  const pillarRoots = [];   // where the banyan's pillar roots meet the ground: she walks round them
  // ── the banyan (大樹公) ──────────────────────────────────────────────────────
  // research/banyan-square: a small-leaved banyan (Ficus microcarpa) is wider than it is tall, pale smooth
  // grey bark, buttresses at the foot, several trunks grown together, curtains of aerial roots and a few
  // that reached the ground and thickened into pillars. A tree people worship wears a red cloth round it.
  // The crown is ~800 alpha-cut leaf cards in one InstancedMesh, their normals bent outward from the
  // centre of their own clump so the crown shades like soft clumps of foliage, swaying a little; their
  // shadow is cut by the same alpha, so the ground under the tree gets dappled shade, not a black disc.
  const tree = new THREE.Group(); tree.position.set(SQ.x, 0, SQ.z); group.add(tree);
  const BARK = mat('#9b958a', { roughness: 0.95 });
  const leafTime = { value: 0 };
  (function banyan() {
    // the round seat everyone sits on
    const seat = new THREE.Mesh(cyl(3.9, 4.1, 0.55, 40), mat('#cfc9bd')); seat.castShadow = seat.receiveShadow = true; tree.add(seat);
    const lip = new THREE.Mesh(cyl(4.15, 4.15, 0.12, 40), mat('#b9b2a4')); lip.position.y = 0.55; tree.add(lip);
    const soil = new THREE.Mesh(cyl(3.5, 3.5, 0.06, 32), mat('#4a3b2e')); soil.position.y = 0.62; tree.add(soil);

    const limb = (a, b, r0, r1, seg) => {
      const d = new THREE.Vector3().subVectors(b, a), len = d.length();
      const m = new THREE.Mesh(cyl(r1, r0, len, seg || 10), BARK);
      m.position.copy(a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      m.castShadow = m.receiveShadow = true; tree.add(m); return m;
    };
    // buttresses flaring into the seat, and a knot of trunks grown together
    const flare = new THREE.Mesh(cyl(1.15, 2.0, 1.4, 14), BARK); flare.position.y = 0.55; flare.castShadow = true; tree.add(flare);
    limb(new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0.15, 6.6, -0.1), 1.2, 0.7, 14);
    [[1.0, 0.4], [-0.9, 0.7], [0.3, -1.05], [-0.65, -0.8], [0.8, -0.6], [-0.2, 1.05]].forEach(([x, z]) =>
      limb(new THREE.Vector3(x, 0.6, z), new THREE.Vector3(x * 0.3, 5.2 + rnd(), z * 0.3), 0.42, 0.3));
    // limbs reaching out low and level, the way a banyan spreads
    const tips = [];
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + 0.2 + rnd() * 0.3, r = 6 + rnd() * 3;
      const from = new THREE.Vector3(0.1, 5.3 + rnd() * 1.0, 0), mid = new THREE.Vector3(Math.cos(a) * r * 0.55, 6.9 + rnd() * 0.6, Math.sin(a) * r * 0.55);
      const to = new THREE.Vector3(Math.cos(a) * r, 7.4 + rnd() * 0.8, Math.sin(a) * r);
      limb(from, mid, 0.46, 0.3); limb(mid, to, 0.3, 0.12, 8);
      tips.push(mid, to);
    }
    // pillar roots: aerial roots that reached the ground and turned into wood, under the outer limbs
    tips.forEach((p, i) => {
      if (i % 2 === 0 && rnd() < 0.55) {
        const r = Math.hypot(p.x, p.z); if (r < 4.6) return;
        limb(new THREE.Vector3(p.x, 0, p.z), new THREE.Vector3(p.x, p.y, p.z), 0.2, 0.14, 8);
        pillarRoots.push({ x: SQ.x + p.x, z: SQ.z + p.z, r: 0.5 });
      }
    });
    // the red cloth: a band round the trunks and its two loose ends
    const RED = mat('#c4211b', { roughness: 0.7, side: THREE.DoubleSide });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.48, 0.42, 28, 1, true), RED);
    band.position.y = 1.85; tree.add(band);
    [[-0.2, 0.18], [0.15, 0.12]].forEach(([dx, rz]) => {
      const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.85), RED); tail.position.set(dx, 1.3, 1.47); tail.rotation.z = rz; tree.add(tail);
    });

    // the crown: clumps of leaf cards
    const leafTex = canvasTex(128, 128, (g) => {
      g.clearRect(0, 0, 128, 128);
      for (let i = 0; i < 90; i++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 54, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d;
        const k = rnd();
        g.fillStyle = `hsl(${100 + k * 22}, ${38 + k * 18}%, ${22 + k * 26 + (64 - y) * 0.12}%)`;
        g.save(); g.translate(x, y); g.rotate(rnd() * 6.28); g.beginPath(); g.ellipse(0, 0, 10, 5.5, 0, 0, 6.28); g.fill(); g.restore();
      }
    });
    const leafMat = mat('#ffffff', { map: leafTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
    leafMat.onBeforeCompile = shader => {
      shader.uniforms.uTime = leafTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 aCenter;\nuniform float uTime;')
        .replace('#include <defaultnormal_vertex>',
          'vec4 lfP = instanceMatrix * vec4(position, 1.0);\n' +
          'vec3 transformedNormal = normalMatrix * normalize(lfP.xyz - aCenter + vec3(0.0, 0.35, 0.0));')
        .replace('#include <begin_vertex>',
          'vec3 transformed = vec3(position);\n' +
          'float lfW = uTime * 1.4 + aCenter.x * 0.6 + aCenter.z * 0.45;\n' +
          'transformed.x += sin(lfW + position.y * 2.0) * 0.05; transformed.z += cos(lfW * 0.8) * 0.04;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>',
        'float faceDirection = gl_FrontFacing ? 1.0 : -1.0;\nvec3 normal = normalize(vNormal);\nvec3 geometryNormal = normal;');   // no back-face flip: both sides take the clump's normal
    };
    const cardGeo = new THREE.PlaneGeometry(1, 1);
    const clumps = [];
    const NCL = R.IS_PHONE ? 40 : 55;
    for (let i = 0; i < NCL; i++) {
      const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), 0.7) * 9.8;
      clumps.push(new THREE.Vector3(Math.cos(a) * r, 8.5 + (1 - r / 10) * 2.4 + rnd() * 0.8, Math.sin(a) * r));
    }
    const PER = R.IS_PHONE ? 30 : 38, N = clumps.length * PER;
    const leaves = new THREE.InstancedMesh(cardGeo, leafMat, N);
    const centers = new Float32Array(N * 3);
    clumps.forEach((c, ci) => {
      const cr = 1.7 + rnd() * 0.9;
      for (let j = 0; j < PER; j++) {
        const k = ci * PER + j;
        const u = rnd() * Math.PI * 2, v = Math.acos(2 * rnd() - 1), rr = cr * Math.cbrt(rnd());
        const p = new THREE.Vector3(SQ.x + c.x + Math.sin(v) * Math.cos(u) * rr, c.y + Math.cos(v) * rr * 0.62, SQ.z + c.z + Math.sin(v) * Math.sin(u) * rr);
        const s = 1.7 + rnd() * 0.9;
        leaves.setMatrixAt(k, local(p.x, p.y, p.z, s, s, s, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28));
        centers[k * 3] = SQ.x + c.x; centers[k * 3 + 1] = c.y - 0.4; centers[k * 3 + 2] = SQ.z + c.z;
      }
    });
    cardGeo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3));
    leaves.instanceMatrix.needsUpdate = true;
    leaves.castShadow = true; leaves.receiveShadow = true;
    leaves.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.45 });
    leaves.frustumCulled = false;
    group.add(leaves);
    // dark masses inside the crown, so it never reads as see-through
    const inner = mat('#2f4a2d', { flatShading: true, roughness: 1 }), blob = new THREE.IcosahedronGeometry(1, 1);
    clumps.forEach((c, i) => { if (i % 3) return; const m = new THREE.Mesh(blob, inner); m.position.set(c.x, c.y - 0.2, c.z); m.scale.set(1.7, 1.0, 1.7); tree.add(m); });

    // aerial roots: curtains of thin strands, bunched, of every length, hanging from the limbs
    const roots = Inst(cyl(1, 1, 1, 5), mat('#7d7064', { roughness: 1 }));
    for (let i = 0; i < 34; i++) {
      const a = rnd() * Math.PI * 2, r = 2.6 + Math.sqrt(rnd()) * 6.6, top = 7.3 + rnd() * 0.6;
      const n = 3 + Math.floor(rnd() * 6);
      for (let j = 0; j < n; j++) {
        const len = 0.6 + Math.pow(rnd(), 1.6) * (r < 5 ? 5.5 : 4.2);
        const x = SQ.x + Math.cos(a) * r + (rnd() - 0.5) * 0.7, z = SQ.z + Math.sin(a) * r + (rnd() - 0.5) * 0.7;
        roots.add(local(x, top - len, z, 0.014 + rnd() * 0.014, len, 0.014 + rnd() * 0.014, 0, (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.06));
      }
    }
    roots.build(false);
  })();

  // ── the arcades (騎樓) round all four sides ─────────────────────────────────
  // Each block: upper floors over a covered walkway on square columns, shops set back behind it,
  // iron window grilles and air conditioners, a shop board along the arcade, vertical signs, and on
  // the roof a water tank or a tin-roofed extra storey. The shop names run across the decades.
  const SHOPS = ['冰果室', '照相館', '唱片行', '租書店', '西藥房', '鐘錶眼鏡', '布莊', '理髮廳', '電器行', '茶行', '牛肉麵',
    '豆花', '滷肉飯', '五金行', '書局', '麵包店', '補習班', '珍珠奶茶', '手機配件', '彩券行', '電玩', '自助餐', '美容院', '中藥行', '雜貨店'];
  const SCHEMES = [['#d9483b', '#fff6e0'], ['#1f4e9c', '#ffffff'], ['#f2c230', '#b3261e'], ['#2f7d4f', '#fff6e0'], ['#ffffff', '#c8261e'], ['#2b2f3a', '#ffcf5a'], ['#e86a2c', '#ffffff']];
  const TONES = ['#e3c9a3', '#c9d1cf', '#e2b79c', '#d6d0b4', '#eadcc0', '#b9c6cf', '#dfd5c5', '#cdb9a5'];
  let shopI = 0;
  const nextShop = () => SHOPS[(shopI++ * 7) % SHOPS.length];
  function boardTex(text, scheme, vertical) {
    const [bg, fg] = scheme;
    return vertical
      ? canvasTex(96, 384, (g, W, H) => {
          g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(6, 6, W - 12, H - 12);
          g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
          const chars = [...text], step = Math.min(78, (H - 40) / chars.length);
          g.font = `700 ${Math.round(step * 0.86)}px ${FONT_ZH}`;
          chars.forEach((ch, i) => g.fillText(ch, W / 2, 20 + step * (i + 0.5) + (H - 40 - step * chars.length) / 2));
        })
      : canvasTex(512, 96, (g, W, H) => {
          g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.font = `700 ${Math.round(H * 0.62)}px ${FONT_ZH}`; g.fillText(text, W / 2, H * 0.54);
        });
  }
  const winGeo = new THREE.BoxGeometry(1, 1, 1);
  const windows = Inst(winGeo, mat('#3c4250', { emissive: new THREE.Color('#ffb860'), emissiveIntensity: 0.0, roughness: 0.4 }));
  const litWins = Inst(winGeo, basic('#ffd9a0', { toneMapped: false }));
  const bars = Inst(winGeo, mat('#e6e3da', { metalness: 0.3, roughness: 0.5 }));
  const acs = Inst(winGeo, mat('#ece8de'));
  const cols = Inst(winGeo, mat('#d8cfbf'));
  const tanks = Inst(cyl(1, 1, 1, 12), mat('#c7ccd0', { metalness: 0.4, roughness: 0.4 }));
  const shopGlow = basic('#ffc983', { toneMapped: false });
  const shutterTex = canvasTex(64, 64, (g) => { g.fillStyle = '#a5a9ad'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#8a8e92'; for (let y = 0; y < 64; y += 6) g.fillRect(0, y, 64, 2); });
  shutterTex.wrapS = shutterTex.wrapT = THREE.RepeatWrapping;
  const shutterMat = mat('#ffffff', { map: shutterTex });
  const tinMat = mat('#9fb4bf', { roughness: 0.6, metalness: 0.2 });
  const SIDES = {
    west:  { out: [-1, 0], along: [0, 1], gate: true },
    north: { out: [0, -1], along: [1, 0], gate: true },
    east:  { out: [1, 0], along: [0, -1], gate: true },
    south: { out: [0, 1], along: [-1, 0], gate: false },
  };
  const ARC = 2.7, GROUND = 3.5, FLOOR = 3.1, DEPTH = 10;
  function block(side, mid, w) {
    const sd = SIDES[side];
    const g = new THREE.Group();
    g.position.set(SQ.x + sd.out[0] * SQ.h + sd.along[0] * mid, 0, SQ.z + sd.out[1] * SQ.h + sd.along[1] * mid);
    g.rotation.y = Math.atan2(-sd.out[0], -sd.out[1]);   // local +z faces the centre of the square
    group.add(g); g.updateMatrixWorld(true);
    const W = g.matrixWorld;
    const put = (inst, x, y, z, sx, sy, sz, color) => inst.add(new THREE.Matrix4().multiplyMatrices(W, local(x, y, z, sx, sy, sz, 0)), color);
    const floors = 2 + Math.floor(rnd() * 3), H = GROUND + floors * FLOOR;
    const tone = pick(TONES);
    box(w - 0.08, H - GROUND, DEPTH, mat(tone), 0, GROUND, -DEPTH / 2, g);                           // the floors above, over the walkway
    box(w - 0.08, GROUND, DEPTH - ARC, mat(shade(tone, -0.12)), 0, 0, -ARC - (DEPTH - ARC) / 2, g);  // the shops, set back
    box(w - 0.08, 0.16, ARC, mat('#d9d3c6'), 0, 0, -ARC / 2, g, false);                              // the walkway's step
    box(w + 0.1, 0.35, 0.5, mat(shade(tone, -0.3)), 0, H - 0.05, -0.2, g);                           // the parapet
    // columns along the front
    const nc = Math.max(2, Math.round(w / 3.3) + 1);
    for (let i = 0; i < nc; i++) put(cols, -w / 2 + 0.35 + i * (w - 0.7) / (nc - 1), 0, -0.35, 0.55, GROUND, 0.55);
    // the shop fronts: lit, or shuttered for the night already
    const shopW = w - 1;
    if (rnd() < 0.78) {
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(shopW, 2.5), shopGlow); glow.position.set(0, 1.4, -ARC + 0.02); g.add(glow);
    } else {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(shopW, 2.9), shutterMat); sh.position.set(0, 1.55, -ARC + 0.02); g.add(sh);
    }
    // the shop board along the top of the arcade
    const fascia = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, 0.78), basic('#ffffff', { map: boardTex(nextShop(), pick(SCHEMES), false) }));
    fascia.position.set(0, GROUND + 0.42, 0.02); g.add(fascia);
    // windows with iron grilles, an air conditioner under some
    for (let f = 0; f < floors; f++) {
      const y0 = GROUND + f * FLOOR + 0.8;
      for (let x = -w / 2 + 1.3; x < w / 2 - 0.9; x += 2.3) {
        if (rnd() < 0.22) put(litWins, x, y0, 0.01, 1.3, 1.5, 0.06); else put(windows, x, y0, 0.01, 1.3, 1.5, 0.08);
        for (let b = -0.5; b <= 0.51; b += 0.25) put(bars, x + b, y0 - 0.05, 0.3, 0.05, 1.6, 0.05);
        put(bars, x, y0 - 0.05, 0.3, 1.45, 0.06, 0.4); put(bars, x, y0 + 1.5, 0.3, 1.45, 0.06, 0.4);
        if (rnd() < 0.35) put(acs, x + 0.45, y0 - 0.65, 0.25, 0.75, 0.5, 0.42);
      }
    }
    // a vertical sign standing out from the facade
    if (rnd() < 0.75) {
      const vs = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 3.4), basic('#ffffff', { map: boardTex(nextShop(), pick(SCHEMES), true), side: THREE.DoubleSide }));
      const sx = (rnd() < 0.5 ? -1 : 1) * (w / 2 - 0.7);
      vs.position.set(sx, GROUND + 2.2, 0.55); vs.rotation.y = Math.PI / 2 * (rnd() < 0.5 ? 1 : 0); g.add(vs);
    }
    // the roof: a water tank on legs, or a tin extra storey
    if (rnd() < 0.45) box(w * 0.55, 2.3, DEPTH * 0.5, tinMat, (rnd() - 0.5) * w * 0.3, H, -DEPTH * 0.55, g);
    if (rnd() < 0.7) put(tanks, (rnd() - 0.5) * (w - 2), H + 0.9, -DEPTH * 0.7, 0.7, 1.3, 0.7);
  }
  Object.keys(SIDES).forEach(side => {
    const gap = SIDES[side].gate ? SQ.gate + 2.8 : -1;
    let a = -SQ.h - 10;
    while (a < SQ.h + 10) {
      let w = 7 + Math.floor(rnd() * 4);
      if (gap > 0 && a < gap && a + w > -gap) { a = gap; continue; }        // leave the gate and its posts clear
      if (gap > 0 && a < -gap && a + w > -gap) w = -gap - a;
      if (w < 2.5) { a += w; continue; }
      block(side, a + w / 2, w);
      a += w;
    }
  });
  [windows, litWins, bars, acs, cols, tanks].forEach((i, k) => i.build(k === 4 || k === 5));

  // scooters parked along the arcades: body, seat, legshield, two wheels
  (function scooters() {
    const bodyG = new THREE.BoxGeometry(1, 1, 1), wheelG = new THREE.CylinderGeometry(1, 1, 1, 12); wheelG.rotateZ(Math.PI / 2);
    const body = Inst(bodyG, mat('#ffffff', { roughness: 0.5 })), seat = Inst(bodyG, mat('#2b2b2b')), wheel = Inst(wheelG, mat('#202020'));
    const cols2 = ['#c8261e', '#f2f2f0', '#2a6fb5', '#e8c33a', '#3a3a3a', '#86b9a8'].map(c => new THREE.Color(c));
    Object.keys(SIDES).forEach(side => {
      const sd = SIDES[side];
      for (let a = -SQ.h + 3; a < SQ.h - 3; a += 1.05) {
        if (sd.gate && Math.abs(a) < SQ.gate + 3.5) continue;
        if (rnd() < 0.35) continue;
        const along = a, inset = SQ.h - 1.3;
        const x = SQ.x + sd.out[0] * inset + sd.along[0] * along, z = SQ.z + sd.out[1] * inset + sd.along[1] * along;
        const ry = Math.atan2(sd.out[0], sd.out[1]) + (rnd() - 0.5) * 0.2;   // parked nose-in, toward the arcade
        const c = pick(cols2);
        const m = (dx, dy, dz, sx, sy, sz) => new THREE.Matrix4().compose(
          new THREE.Vector3(dx, dy, dz).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(x, 0, z)),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz));
        body.add(m(0, 0.55, 0, 0.42, 0.45, 1.25), c);
        body.add(m(0, 0.95, 0.52, 0.4, 0.8, 0.14), c);
        seat.add(m(0, 0.84, -0.18, 0.36, 0.12, 0.6));
        wheel.add(m(0, 0.25, 0.55, 0.12, 0.5, 0.5));
        wheel.add(m(0, 0.25, -0.5, 0.12, 0.5, 0.5));
      }
    });
    body.build(); seat.build(); wheel.build();
  })();

  // ── the three gates (牌樓) ──────────────────────────────────────────────────
  // Each stands in its gap with a breathing curtain of light in the opening (walk.js walks you
  // through it). Local frame: x across the opening, +z toward the centre of the square.
  const portalMats = [];
  function portal(w, h, col) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(P[col] || col) }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uCol; uniform float uTime; varying vec2 vUv;
        void main(){
          float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(1.0, 0.75, vUv.y);
          float wave = 0.5 + 0.5 * sin(uTime * 1.6 + vUv.y * 9.0 - vUv.x * 3.0);
          vec3 c = mix(uCol, vec3(1.0, 0.95, 0.85), 0.35 + 0.25 * wave * (1.0 - vUv.y));
          gl_FragColor = vec4(c, edge * (0.5 + 0.25 * wave));
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    });
    portalMats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.y = h / 2; p.renderOrder = 5; return p;
  }
  function gateGroup(side) {
    const sd = SIDES[side], g = new THREE.Group();
    g.position.set(SQ.x + sd.out[0] * SQ.h, 0, SQ.z + sd.out[1] * SQ.h);
    g.rotation.y = Math.atan2(-sd.out[0], -sd.out[1]);
    group.add(g); return g;
  }
  const GW = SQ.gate * 2;
  const signPlane = (w, h, tex) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex, side: THREE.DoubleSide }));

  // 西門町 — a red steel truss carrying a big lit sign, like the pedestrian zone's own
  (function ximen() {
    const g = gateGroup('west'), red = mat('#c8261e', { metalness: 0.3, roughness: 0.5 });
    const H = 7.2;
    [-1, 1].forEach(s => {
      const x = s * (SQ.gate + 0.7);
      [-0.35, 0.35].forEach(dz => [-0.35, 0.35].forEach(dx => box(0.16, H, 0.16, red, x + dx, 0, dz, g)));
      for (let y = 0.6; y < H; y += 0.9) {                                                    // the lattice
        const m = new THREE.Mesh(BOX, red); m.scale.set(0.08, 1.05, 0.08); m.position.set(x, y, 0.35); m.rotation.z = (y * 10 % 2 < 1 ? 1 : -1) * 0.66; g.add(m);
        const n = m.clone(); n.position.z = -0.35; g.add(n);
      }
      box(1.2, 0.3, 1.2, mat('ink'), x, 0, 0, g);
    });
    box(GW + 3.2, 0.3, 0.9, red, 0, H, 0, g);
    box(GW + 3.2, 0.3, 0.9, red, 0, H + 2.6, 0, g);
    const tex = canvasTex(1024, 256, (c, W, Hh) => {
      c.fillStyle = '#c8261e'; c.fillRect(0, 0, W, Hh);
      c.strokeStyle = '#ffe6a8'; c.lineWidth = 10; c.strokeRect(14, 14, W - 28, Hh - 28);
      c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${Hh * 0.56}px ${FONT_ZH}`; c.fillText('西門町', W * 0.42, Hh * 0.52);
      c.font = `700 ${Hh * 0.17}px ${FONT_EN}`; c.fillText('XIMENDING', W * 0.8, Hh * 0.4); c.fillText('1985 – 1999', W * 0.8, Hh * 0.64);
    });
    const s = signPlane(GW + 2.6, 2.3, tex); s.material.toneMapped = false; s.position.set(0, H + 1.45, 0.47); g.add(s);
    const s2 = s.clone(); s2.position.z = -0.47; g.add(s2);
    // bulbs round the sign
    const bulbs = Inst(new THREE.SphereGeometry(0.09, 6, 5), basic('#fff1c4', { toneMapped: false }));
    g.updateMatrixWorld(true);
    for (let x = -GW / 2 - 1.2; x <= GW / 2 + 1.2; x += 0.55) [H + 0.25, H + 2.65].forEach(y => bulbs.add(new THREE.Matrix4().multiplyMatrices(g.matrixWorld, local(x, y, 0.5, 1, 1, 1, 0))));
    bulbs.build(false);
    g.add(portal(GW, H - 0.2, 'verm'));
  })();

  // 大稻埕 — a red-brick arch with a carved wooden plaque, from the Baroque shophouse fronts
  (function dadao() {
    const g = gateGroup('north');
    const brick = S.lam ? S.lam('brick') : mat('brick');
    const H = 6.4, R2 = SQ.gate + 0.9;
    [-1, 1].forEach(s => {
      box(1.8, H, 1.6, brick, s * (SQ.gate + 0.9), 0, 0, g);
      box(2.1, 0.4, 1.9, mat('#e8dccb'), s * (SQ.gate + 0.9), H, 0, g);       // stone capitals
      box(2.0, 0.5, 1.8, mat('#e8dccb'), s * (SQ.gate + 0.9), 0, 0, g);
    });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(R2, 0.9, 6, 28, Math.PI), brick);
    arc.position.set(0, H + 0.4, 0); arc.castShadow = true; g.add(arc);
    box(R2 * 2 + 2.6, 0.5, 1.8, mat('#e8dccb'), 0, H + R2 + 0.6, 0, g);       // the cornice over the arch
    const tex = canvasTex(512, 160, (c, W, Hh) => {
      c.fillStyle = '#3b2418'; c.fillRect(0, 0, W, Hh); c.strokeStyle = '#d9b265'; c.lineWidth = 8; c.strokeRect(10, 10, W - 20, Hh - 20);
      c.fillStyle = '#e9c46a'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${Hh * 0.52}px ${FONT_ZH}`; c.fillText('大稻埕', W / 2, Hh * 0.45);
      c.font = `600 ${Hh * 0.16}px ${FONT_EN}`; c.fillText('DADAOCHENG · 2000 – 2019', W / 2, Hh * 0.8);
    });
    const s = signPlane(4.2, 1.3, tex); s.position.set(0, H + R2 + 1.6, 0.92); g.add(s);
    const s2 = s.clone(); s2.position.z = -0.92; g.add(s2);
    box(4.5, 1.5, 0.5, mat('#3b2418'), 0, H + R2 + 0.85, 0, g);
    g.add(portal(GW, H + 1.0, 'brick'));
  })();

  // 信義 — a thin steel frame and a glass canopy, lit along its edge
  (function xinyi() {
    const g = gateGroup('east'), steel = mat('#d7dde2', { metalness: 0.8, roughness: 0.25 });
    const H = 7.6;
    [-1, 1].forEach(s => { box(0.4, H, 0.4, steel, s * (SQ.gate + 0.4), 0, -0.6, g); box(0.4, H, 0.4, steel, s * (SQ.gate + 0.4), 0, 0.6, g); });
    box(GW + 1.6, 0.35, 1.8, steel, 0, H, 0, g);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(GW + 3.2, 0.12, 3.4), new THREE.MeshStandardMaterial({ color: new THREE.Color(P.glass), transparent: true, opacity: 0.4, metalness: 0.5, roughness: 0.1 }));
    glass.position.set(0, H + 0.45, 0); g.add(glass);
    box(GW + 1.4, 0.12, 0.12, basic('#bff3ff', { toneMapped: false }), 0, H - 0.08, 0.95, g, false);   // the lit edge
    const tex = canvasTex(1024, 192, (c, W, Hh) => {
      const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#2c7f8f'); gr.addColorStop(1, '#5fb0bf');
      c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.fillStyle = '#ffffff'; c.textBaseline = 'middle';
      c.textAlign = 'left'; c.font = `700 ${Hh * 0.6}px ${FONT_ZH}`; c.fillText('信義', W * 0.06, Hh * 0.52);
      c.textAlign = 'right'; c.font = `600 ${Hh * 0.26}px ${FONT_EN}`; c.fillText('XINYI · 2020 – 2027', W * 0.94, Hh * 0.52);
    });
    const s = signPlane(GW + 1.2, 1.1, tex); s.position.set(0, H + 1.1, 0.0); g.add(s);
    box(GW + 1.4, 1.3, 0.16, steel, 0, H + 0.45, -0.1, g);
    g.add(portal(GW, H - 0.2, 'glass'));
  })();

  // ── people: simple, low, in the palette ─────────────────────────────────────
  const people = [];
  function person(o) {
    o = Object.assign({ shirt: '#e8e4da', pants: '#3c3f4a', hair: '#2b2f3a', skin: '#e9c7a8', seated: false, scale: 1 }, o);
    const g = new THREE.Group(), skin = mat(o.skin), shirt = mat(o.shirt), pants = mat(o.pants), hair = mat(o.hair);
    const hip = o.seated ? 0.5 : 0.95;
    if (o.seated) {
      [-0.13, 0.13].forEach(x => { box(0.17, 0.17, 0.5, pants, x, hip - 0.08, 0.16, g); box(0.15, 0.5, 0.15, pants, x, 0, 0.38, g); });
    } else {
      [-0.12, 0.12].forEach(x => box(0.17, hip, 0.18, pants, x, 0, 0, g));
    }
    const torso = box(0.5, 0.7, 0.3, shirt, 0, hip, 0, g);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skin); head.position.set(0, hip + 0.92, 0); head.castShadow = true; g.add(head);
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); hr.position.copy(head.position).y += 0.02; g.add(hr);
    const armL = box(0.12, 0.6, 0.12, shirt, -0.32, hip + 0.1, 0.02, g), armR = box(0.12, 0.6, 0.12, shirt, 0.32, hip + 0.1, 0.02, g);
    g.scale.setScalar(o.scale);
    g.userData = { torso, head, armL, armR, ph: rnd() * 6.28 };
    people.push(g); return g;
  }

  // ── the karaoke stand (小卡拉OK站) ───────────────────────────────────────────
  // South-west, between the 西門町 gate and the south arcades, facing the tree.
  const K = { x: SQ.x - 15.5, z: SQ.z + 13.5, r: 3.4 };
  const karaoke = new THREE.Group(); karaoke.position.set(K.x, 0, K.z);
  karaoke.rotation.y = Math.atan2(SQ.x - K.x, SQ.z - K.z);                     // local +z faces the tree
  group.add(karaoke);
  let screenTex = null, screenT = 0;
  const notes = [];
  (function karaokeStand() {
    const k = karaoke;
    // the striped tarp on four poles
    const pole = mat('#9aa0a6', { metalness: 0.6 });
    [[-2.4, -1.8], [2.4, -1.8], [-2.4, 1.8], [2.4, 1.8]].forEach(([x, z]) => box(0.07, 2.75, 0.07, pole, x, 0, z, k));
    const stripes = canvasTex(256, 64, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4efe4' : '#d23a2a'; g.fillRect(i * W / 8, 0, W / 8, H); } });
    const tarp = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 4.1), mat('#ffffff', { map: stripes, side: THREE.DoubleSide }));
    tarp.rotation.x = -Math.PI / 2 + 0.08; tarp.position.set(0, 2.85, 0); tarp.castShadow = true; k.add(tarp);
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 0.35), mat('#ffffff', { map: stripes, side: THREE.DoubleSide }));
    valance.position.set(0, 2.62, 2.05); k.add(valance);
    // bare bulbs along the front
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), basic('#fff0c0', { toneMapped: false })); b.position.set(-2.2 + i * 0.55, 2.45 - Math.sin(i / 8 * Math.PI) * 0.12, 2.05); k.add(b);
      const h = new THREE.Sprite(halo); h.scale.setScalar(0.55); h.position.copy(b.position); k.add(h);
    }
    // the cabinet, the CRT and its screen, the two speakers
    box(1.9, 0.95, 0.75, mat('#7a4e2e'), 0, 0, -1.25, k);
    box(1.15, 0.9, 0.9, mat('#3a3d42'), 0, 0.95, -1.3, k);
    screenTex = canvasTex(256, 192, drawScreen);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.69), basic('#ffffff', { map: screenTex, toneMapped: false })); screen.position.set(0, 1.4, -0.84); k.add(screen);
    const cone = canvasTex(64, 128, (g, W, H) => {
      g.fillStyle = '#1d1d1f'; g.fillRect(0, 0, W, H);
      [[32, 34, 18], [32, 92, 26]].forEach(([x, y, r]) => { g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x, y, r * 0.35, 0, 6.3); g.fill(); });
    });
    [-1.6, 1.6].forEach(x => {
      box(0.62, 1.45, 0.5, mat('#1f1f22'), x, 0, -1.2, k);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.36), basic('#ffffff', { map: cone })); f.position.set(x, 0.74, -0.94); k.add(f);
    });
    // the mic stand
    box(0.04, 1.45, 0.04, pole, -0.5, 0, -0.1, k);
    const mic = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#2b2b2b')); mic.position.set(-0.5, 1.5, -0.04); k.add(mic);
    // plastic stools, a folding table with tea and a thermos
    const stoolGeo = new THREE.CylinderGeometry(0.17, 0.21, 0.45, 10); stoolGeo.translate(0, 0.225, 0);
    const stoolAt = [];
    [[-1.5, 1.0], [-0.5, 1.2], [0.5, 1.2], [1.5, 1.0], [-1.0, 2.0], [1.0, 2.0]].forEach(([x, z], i) => {
      const s = new THREE.Mesh(stoolGeo, mat(i % 2 ? '#2a6fb5' : '#d23a2a')); s.position.set(x, 0, z); s.castShadow = true; k.add(s); stoolAt.push([x, z]);
    });
    box(0.8, 0.04, 0.8, mat('#e9e4d6'), 2.3, 0.7, 0.9, k);
    box(0.05, 0.7, 0.05, pole, 2.3, 0, 0.9, k);
    [[2.1, 0.75], [2.25, 1.1], [2.5, 0.8]].forEach(([x, z]) => { const c = new THREE.Mesh(cyl(0.05, 0.04, 0.1, 8), mat('#f4f1ea')); c.position.set(x, 0.74, z); k.add(c); });
    const thermos = new THREE.Mesh(cyl(0.09, 0.09, 0.38, 10), mat('#d9483b')); thermos.position.set(2.5, 0.74, 1.15); k.add(thermos);
    // the sign on an A-frame: 卡拉OK, 一首 10 元
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.25), basic('#ffffff', { map: canvasTex(192, 256, (g, W, H) => {
      g.fillStyle = '#fff7df'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d23a2a'; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d23a2a'; g.font = `700 ${H * 0.2}px ${FONT_EN}`; g.fillText('卡拉OK', W / 2, H * 0.24);
      g.fillStyle = '#2b2f3a'; g.font = `700 ${H * 0.13}px ${FONT_ZH}`; g.fillText('一首', W / 2, H * 0.52); g.fillText('10 元', W / 2, H * 0.7);
      g.font = `400 ${H * 0.07}px ${FONT_ZH}`; g.fillText('歡迎來唱', W / 2, H * 0.88);
    }), side: THREE.DoubleSide }));
    sign.material.side = THREE.FrontSide;
    const aframe = new THREE.Group(); aframe.position.set(-2.9, 0, 2.2); aframe.rotation.y = 0.35; k.add(aframe);
    sign.position.set(0, 0.75, 0.12); sign.rotation.x = -0.12; aframe.add(sign);
    const back = sign.clone(); back.position.z = -0.12; back.rotation.set(0.12, Math.PI, 0); aframe.add(back);   // an A-frame reads from both sides
    // the people: an uncle singing, two aunties listening, one fanning herself
    const singer = person({ shirt: '#f2efe6', pants: '#4a4f5c', hair: '#555b66' }); singer.position.set(-0.45, 0, -0.25); singer.rotation.y = Math.PI; k.add(singer);
    singer.userData.armR.rotation.x = -1.2; singer.userData.armR.position.set(0.3, 1.55, 0.05);
    singer.userData.singer = true;
    const a1 = person({ shirt: '#c8261e', pants: '#2b2f3a', hair: '#3a3a3a', seated: true }); a1.position.set(stoolAt[1][0], 0, stoolAt[1][1]); a1.rotation.y = Math.PI; k.add(a1);
    const a2 = person({ shirt: '#7bb0a5', pants: '#3c3f4a', hair: '#6a6a6a', seated: true }); a2.position.set(stoolAt[2][0], 0, stoolAt[2][1]); a2.rotation.y = Math.PI - 0.2; k.add(a2);
    a2.userData.fan = true;
    // music notes that float up off the speakers while the music plays
    const noteMat = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (g) => { g.fillStyle = '#ffffff'; g.font = `700 52px ${FONT_EN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', 32, 34); }), transparent: true, depthWrite: false, fog: false });
    for (let i = 0; i < 8; i++) { const n = new THREE.Sprite(noteMat.clone()); n.scale.setScalar(0.4); n.userData = { t: i / 8, x: i % 2 ? 1.6 : -1.6 }; k.add(n); notes.push(n); }
  })();
  // the CRT: a karaoke video's sunset and sea, the song number, and a line that fills from the left
  function drawScreen(g, W, H) {
    const t = screenT;
    const sky = g.createLinearGradient(0, 0, 0, H * 0.7); sky.addColorStop(0, '#3a4f9a'); sky.addColorStop(1, '#f2a46a');
    g.fillStyle = sky; g.fillRect(0, 0, W, H * 0.7);
    g.fillStyle = '#ffcf6a'; g.beginPath(); g.arc(W * 0.7, H * 0.58, 22, 0, 6.3); g.fill();
    const sea = g.createLinearGradient(0, H * 0.62, 0, H); sea.addColorStop(0, '#2c5f8f'); sea.addColorStop(1, '#173455');
    g.fillStyle = sea; g.fillRect(0, H * 0.62, W, H * 0.38);
    g.fillStyle = 'rgba(255,220,150,0.6)'; for (let i = 0; i < 6; i++) g.fillRect(W * 0.6 + Math.sin(t * 2 + i) * 6, H * (0.66 + i * 0.045), 40 - i * 4, 2);
    g.fillStyle = '#ffffff'; g.font = `700 16px ${FONT_EN}`; g.textAlign = 'left'; g.fillText('No. 0' + (215 + Math.floor(t / 20) % 40), 10, 20);
    // the lyric line: no words, just the colour wipe everyone knows
    const k = (t % 6) / 6, bw = W * 0.8, x0 = W * 0.1, y0 = H * 0.82;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0 - 6, y0 - 16, bw + 12, 26);
    g.font = `700 20px ${FONT_ZH}`; g.textAlign = 'center';
    const line = '♪ 啦 啦 啦 ～ 啦 啦 啦 ♪';
    g.fillStyle = '#ffffff'; g.fillText(line, W / 2, y0 + 3);
    g.save(); g.beginPath(); g.rect(x0, y0 - 16, bw * k, 26); g.clip(); g.fillStyle = '#4fd1ff'; g.fillText(line, W / 2, y0 + 3); g.restore();
  }

  // ── the chess table under the tree: two uncles at 象棋, one watching ────────
  const CHESS = { x: SQ.x + 6.8, z: SQ.z + 3.6, r: 1.9 };
  (function chess() {
    const g = new THREE.Group(); g.position.set(CHESS.x, 0, CHESS.z); group.add(g);
    const stone = mat('#bdb6a8');
    const leg = new THREE.Mesh(cyl(0.28, 0.4, 0.68, 12), stone); g.add(leg);
    const top = new THREE.Mesh(cyl(0.72, 0.72, 0.08, 24), stone); top.position.y = 0.68; top.castShadow = true; g.add(top);
    const board = new THREE.Mesh(new THREE.CircleGeometry(0.55, 4), basic('#ffffff', { map: canvasTex(128, 128, (c, W, H) => {
      c.fillStyle = '#e6c88f'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7a3b22'; c.lineWidth = 1.5;
      for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(10 + i * 13.5, 8); c.lineTo(10 + i * 13.5, 120); c.stroke(); }
      for (let j = 0; j <= 9; j++) { c.beginPath(); c.moveTo(10, 8 + j * 12.4); c.lineTo(118, 8 + j * 12.4); c.stroke(); }
      for (let i = 0; i < 14; i++) { c.fillStyle = '#f5e6c8'; const x = 10 + (i * 37 % 9) * 13.5, y = 8 + (i * 5 % 10) * 12.4; c.beginPath(); c.arc(x, y, 5.5, 0, 6.3); c.fill(); c.fillStyle = i % 2 ? '#b3261e' : '#222'; c.beginPath(); c.arc(x, y, 3, 0, 6.3); c.fill(); }
    }) }));
    board.rotation.set(-Math.PI / 2, 0, Math.PI / 4); board.position.y = 0.765; g.add(board);
    [[-1.05, 0], [1.05, 0], [0, -1.05], [0, 1.05]].forEach(([x, z]) => { const s = new THREE.Mesh(cyl(0.24, 0.26, 0.45, 12), stone); s.position.set(x, 0, z); g.add(s); });
    const p1 = person({ shirt: '#e8e4da', pants: '#3c3f4a', hair: '#8a8a8a', seated: true }); p1.position.set(-1.05, 0, 0); p1.rotation.y = Math.PI / 2; g.add(p1);
    const p2 = person({ shirt: '#4f6f9c', pants: '#2b2f3a', hair: '#a0a0a0', seated: true }); p2.position.set(1.05, 0, 0); p2.rotation.y = -Math.PI / 2; g.add(p2);
    const w = person({ shirt: '#d9c27a', pants: '#4a4f5c', hair: '#6a6a6a' }); w.position.set(0.3, 0, 1.35); w.rotation.y = Math.PI + 0.3; g.add(w);
    w.userData.armL.rotation.x = 0.4; w.userData.armR.rotation.x = 0.4;   // hands behind his back, watching
  })();
  // someone resting on the tree's seat with a fan
  (function resting() {
    const p = person({ shirt: '#f0d9d2', pants: '#5a4a6a', hair: '#d0d0d0', seated: true });
    p.position.set(SQ.x - 2.9, 0.55, SQ.z + 3.0); p.rotation.y = Math.atan2(-2.9, 3.0) + Math.PI; p.userData.fan = true; group.add(p);
  })();

  // ── the 土地公 shrine (福德祠) at the foot of the tree, and its 金爐 ──────────
  // The heart of a 伯公下 (research/banyan-square): a small temple with a swallowtail ridge, red columns
  // and couplets, the god inside lit by two red 神明燈, an incense burner in front with smoke rising.
  // It stands on the far, north-east side of the tree, facing out: you come round the trunk and find
  // it, rather than walking in straight at it (CJ, 2026-11-03: 「我不要進去就看到廟」).
  const SH_DIR = -Math.PI / 2, SH_D = 5.7;   // due north of the trunk: from the arrival the trunk hides it
  const SHRINE = { x: SQ.x + Math.cos(SH_DIR) * SH_D, z: SQ.z + Math.sin(SH_DIR) * SH_D, r: 2.1, rot: Math.atan2(Math.cos(SH_DIR), Math.sin(SH_DIR)) };
  const smoke = [];
  (function shrine() {
    const g = new THREE.Group(); g.position.set(SHRINE.x, 0, SHRINE.z); g.rotation.y = SHRINE.rot; g.scale.setScalar(0.85); group.add(g); g.updateMatrixWorld(true);
    const stone = mat('#bfb8aa'), red = mat('#b8261f', { roughness: 0.6 }), tile = mat('#c9643a', { roughness: 0.8 }), dark = mat('#3a1c16');
    box(3.4, 0.35, 3.0, stone, 0, 0, 0, g);
    box(0.9, 0.18, 0.5, stone, 0, 0, 1.7, g);                                     // the step
    box(2.6, 2.3, 0.22, red, 0, 0.35, -1.0, g);                                  // back wall
    [-1, 1].forEach(s => box(0.22, 2.3, 2.0, red, s * 1.2, 0.35, 0, g));          // side walls
    box(2.2, 2.2, 0.05, dark, 0, 0.4, -0.86, g, false);                          // the dim inside
    [-1, 1].forEach(s => box(0.24, 2.25, 0.24, mat('#d23a2a'), s * 1.05, 0.35, 0.92, g));   // front columns
    box(2.6, 0.32, 0.3, red, 0, 2.6, 0.92, g);                                   // lintel
    // the roof: two pitches, a ridge, and swallowtails curling up at both ends
    [1, -1].forEach(s => { const r = new THREE.Mesh(BOX, tile); r.scale.set(3.5, 0.14, 1.75); r.position.set(0, 2.72, s * 0.62); r.rotation.x = s * 0.42; r.castShadow = true; g.add(r); });
    box(3.0, 0.2, 0.22, tile, 0, 3.08, 0, g);
    [-1, 1].forEach(s => [0.0, 0.14].forEach((dz, k) => {
      const t = new THREE.Mesh(BOX, tile); t.scale.set(0.75, 0.1, 0.08); t.position.set(s * 1.75, 3.24 + k * 0.05, dz - 0.07); t.rotation.z = s * (0.55 + k * 0.15); g.add(t);
    }));
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat('#e6b54a', { metalness: 0.5 })); pearl.position.set(0, 3.36, 0); g.add(pearl);
    // the plaque and the couplets
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.42), basic('#ffffff', { map: canvasTex(256, 76, (c, W, H) => {
      c.fillStyle = '#2b1712'; c.fillRect(0, 0, W, H); c.strokeStyle = '#d9b265'; c.lineWidth = 5; c.strokeRect(4, 4, W - 8, H - 8);
      c.fillStyle = '#efc76a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${H * 0.62}px ${FONT_ZH}`; c.fillText('福德祠', W / 2, H * 0.54);
    }) }));
    plaque.position.set(0, 2.45, 1.08); g.add(plaque);
    const couplet = text => basic('#ffffff', { map: canvasTex(48, 320, (c, W, H) => {
      c.fillStyle = '#c8261e'; c.fillRect(0, 0, W, H); c.fillStyle = '#1d0f0b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const ch = [...text]; c.font = `700 ${Math.floor(H / ch.length * 0.78)}px ${FONT_ZH}`; ch.forEach((t, i) => c.fillText(t, W / 2, (i + 0.5) * H / ch.length));
    }) });
    [['福而有德千家敬', -1], ['正則為神萬世尊', 1]].forEach(([t, s]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.6), couplet(t)); p.position.set(s * 1.05, 1.45, 1.05); g.add(p); });
    // inside: the altar, the god, the two red lamps
    box(1.6, 0.85, 0.6, mat('#9c2a1e'), 0, 0.35, -0.55, g);
    const god = person({ shirt: '#c99a3a', pants: '#8a5a22', hair: '#1d1d1d', skin: '#d8b57a', seated: true, scale: 0.55 });
    god.position.set(0, 1.2, -0.75); g.add(god);
    [-0.55, 0.55].forEach(x => {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), basic('#ff3b2a', { toneMapped: false })); l.position.set(x, 1.62, -0.45); g.add(l);
      const h = new THREE.Sprite(haloRed); h.scale.setScalar(1.1); h.position.copy(l.position); g.add(h);
    });
    // the incense burner on its table, a few sticks, the smoke
    box(1.1, 0.75, 0.6, mat('#a52a1f'), 0, 0, 2.15, g);
    const burner = new THREE.Mesh(cyl(0.32, 0.24, 0.32, 16), mat('#8a6a3a', { metalness: 0.7, roughness: 0.4 })); burner.position.set(0, 0.75, 2.15); g.add(burner);
    for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(cyl(0.012, 0.012, 0.45, 4), basic('#b23a26')); st.position.set(-0.12 + i * 0.06, 1.05, 2.15 + (i % 2) * 0.05); g.add(st); }
    const smokeMat = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (c) => { const r = c.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(235,232,225,0.5)'); r.addColorStop(1, 'rgba(235,232,225,0)'); c.fillStyle = r; c.fillRect(0, 0, 64, 64); }), transparent: true, depthWrite: false, fog: false });   // a sprite cannot take this page's fog chunk
    for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(smokeMat.clone()); s.userData = { t: i / 7, base: g.localToWorld(new THREE.Vector3(0, 1.35, 2.15)) }; group.add(s); smoke.push(s); }
  })();
  const BURNER = { x: SHRINE.x - Math.sin(SH_DIR) * 1.3 + Math.cos(SH_DIR) * 3.2, z: SHRINE.z + Math.cos(SH_DIR) * 1.3 + Math.sin(SH_DIR) * 3.2, r: 0.9 };   // out in front of the shrine, on its far side
  (function goldFurnace() {   // 金爐, where the paper money is burned
    const g = new THREE.Group(); g.position.set(BURNER.x, 0, BURNER.z); g.rotation.y = SHRINE.rot; group.add(g);
    box(1.1, 0.3, 1.1, mat('#bfb8aa'), 0, 0, 0, g);
    box(0.85, 1.3, 0.85, mat('#c2452c'), 0, 0.3, 0, g);
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.4), basic('#ff8a3a', { toneMapped: false })); mouth.position.set(0, 0.85, 0.43); g.add(mouth);
    const h = new THREE.Sprite(halo); h.scale.setScalar(1.2); h.position.set(0, 0.85, 0.5); g.add(h);
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.45, 4), mat('#c9643a')); r.position.y = 1.83; r.rotation.y = Math.PI / 4; g.add(r);
    box(0.22, 0.6, 0.22, mat('#8a3a26'), 0, 1.95, 0, g);
  })();

  // ── the tea table: 老人茶 on a stone table, two aunties and an uncle ─────────
  const TEA = { x: SQ.x - 6.8, z: SQ.z + 3.4, r: 1.9 };
  (function tea() {
    const g = new THREE.Group(); g.position.set(TEA.x, 0, TEA.z); group.add(g);
    const stone = mat('#bdb6a8');
    const leg = new THREE.Mesh(cyl(0.28, 0.4, 0.68, 12), stone); g.add(leg);
    const top = new THREE.Mesh(cyl(0.72, 0.72, 0.08, 24), stone); top.position.y = 0.68; top.castShadow = true; g.add(top);
    box(0.62, 0.05, 0.42, mat('#5a3a24'), 0, 0.76, 0, g);                                    // the tea tray
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat('#7a3e22', { roughness: 0.5 })); pot.scale.y = 0.8; pot.position.set(-0.12, 0.9, 0); g.add(pot);
    const spout = new THREE.Mesh(cyl(0.02, 0.03, 0.14, 6), mat('#7a3e22')); spout.position.set(0.0, 0.86, 0); spout.rotation.z = -1.0; g.add(spout);
    [[0.1, -0.1], [0.2, 0.05], [0.08, 0.13], [0.22, -0.12]].forEach(([x, z]) => { const c = new THREE.Mesh(cyl(0.035, 0.03, 0.05, 8), mat('#f4f1ea')); c.position.set(x, 0.79, z); g.add(c); });
    const flask = new THREE.Mesh(cyl(0.08, 0.08, 0.36, 10), mat('#3f7fb3')); flask.position.set(0.45, 0.72, -0.35); g.add(flask);
    [[-1.05, 0], [0, -1.05], [0, 1.05], [1.05, 0]].forEach(([x, z]) => { const s = new THREE.Mesh(cyl(0.24, 0.26, 0.45, 12), stone); s.position.set(x, 0, z); g.add(s); });
    const p1 = person({ shirt: '#d98b8b', pants: '#4a4152', hair: '#c9c9c9', seated: true }); p1.position.set(-1.05, 0, 0); p1.rotation.y = Math.PI / 2; g.add(p1);
    const p2 = person({ shirt: '#f2e6c4', pants: '#3c3f4a', hair: '#9a9a9a', seated: true }); p2.position.set(0, 0, -1.05); g.add(p2);
    const p3 = person({ shirt: '#7d9c6c', pants: '#3a3a3a', hair: '#555', seated: true }); p3.position.set(0, 0, 1.05); p3.rotation.y = Math.PI; g.add(p3);
    p1.userData.fan = true;
  })();

  // ── the memory board (公布欄): where everyone's memories are pinned up in the square ──
  // Every 里 has a notice board. Here the newest memories are pinned to it as paper slips; walk up
  // and press E (memories.js) to read them. One canvas, redrawn when the list changes.
  const BOARD = { x: SQ.x + 10.5, z: SQ.z + 14.2, r: 4.5 };
  const board = (function noticeBoard() {
    const g = new THREE.Group(); g.position.set(BOARD.x, 0, BOARD.z);
    g.rotation.y = Math.atan2(SQ.x - 2 - BOARD.x, SQ.z + 22 - BOARD.z);          // turned toward the arrival
    group.add(g);
    const wood = mat('#6b4a32');
    [-1.8, 1.8].forEach(x => box(0.14, 2.9, 0.14, wood, x, 0, 0, g));
    box(3.9, 0.12, 0.6, mat('#3f5a4a'), 0, 2.9, 0.05, g);                         // its little roof
    box(3.6, 2.0, 0.12, wood, 0, 0.75, -0.08, g);
    let notes = [];
    const tex = canvasTex(1024, 600, (c, W, H) => {
      c.fillStyle = '#2f5a45'; c.fillRect(0, 0, W, H);                             // green felt
      c.fillStyle = '#1f3d2f'; c.fillRect(0, 0, W, 86);
      c.fillStyle = '#fff6e0'; c.textBaseline = 'middle'; c.textAlign = 'left';
      c.font = `700 52px ${FONT_ZH}`; c.fillText('記憶公布欄', 26, 46);
      c.textAlign = 'right'; c.font = `600 30px ${FONT_EN}`; c.fillText('MEMORY BOARD · press E', W - 26, 46);
      const COLS = 4, ROWS = 2, cw = (W - 40) / COLS, ch = (H - 110) / ROWS;
      const list = notes.length ? notes : [{ year: '', body: 'Leave the first memory here.\n在這裡留下第一則記憶。', name: '' }];
      list.slice(0, COLS * ROWS).forEach((m, i) => {
        const x = 20 + (i % COLS) * cw + cw / 2, y = 100 + Math.floor(i / COLS) * ch + ch / 2;
        c.save(); c.translate(x, y); c.rotate(((i * 37) % 9 - 4) * 0.012);
        c.fillStyle = ['#fffaf0', '#fff1a8', '#ffd9d2', '#d9ecff'][i % 4]; c.fillRect(-cw / 2 + 12, -ch / 2 + 12, cw - 24, ch - 24);
        c.fillStyle = '#c8261e'; c.beginPath(); c.arc(0, -ch / 2 + 24, 8, 0, 6.3); c.fill();
        c.fillStyle = '#2b2f3a'; c.textAlign = 'left'; c.textBaseline = 'top';
        if (m.year) { c.font = `700 34px ${FONT_EN}`; c.fillText(String(m.year), -cw / 2 + 28, -ch / 2 + 40); }
        c.font = `400 22px ${FONT_ZH}`;
        wrap(c, String(m.body || ''), cw - 60, 4).forEach((ln, k) => c.fillText(ln, -cw / 2 + 28, -ch / 2 + 84 + k * 28));
        if (m.name) { c.font = `600 19px ${FONT_ZH}`; c.fillText('— ' + m.name, -cw / 2 + 28, ch / 2 - 46); }
        c.restore();
      });
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.85), basic('#ffffff', { map: tex }));
    face.position.set(0, 1.75, 0.0); g.add(face);
    const redrawBoard = redraws[redraws.length - 1];
    return { ...BOARD, mesh: face, setNotes(list) { notes = list || []; redrawBoard(); } };
  })();
  function wrap(c, text, width, maxLines) {
    const out = []; let line = '';
    for (const ch of text.replace(/\s+/g, ' ')) {
      if (c.measureText(line + ch).width > width) { out.push(line); line = ch; if (out.length === maxLines) break; } else line += ch;
    }
    if (out.length < maxLines && line) out.push(line);
    if (out.length === maxLines && text.length > out.join('').length) out[maxLines - 1] = out[maxLines - 1].slice(0, -1) + '…';
    return out;
  }

  // ── the sausage cart (烤香腸), by the east side ──────────────────────────────
  const CART = { x: SQ.x + 17.5, z: SQ.z + 7.5, r: 1.9 };
  (function cart() {
    const g = new THREE.Group(); g.position.set(CART.x, 0, CART.z); g.rotation.y = Math.atan2(SQ.x - CART.x, SQ.z - CART.z); group.add(g);
    box(1.7, 0.85, 0.85, mat('#e9e4d6'), 0, 0.25, 0, g);
    [-0.6, 0.6].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 14), mat('#2a2a2a')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.25, 0.46); g.add(w); });
    box(1.4, 0.08, 0.5, mat('#3a3a3a', { metalness: 0.6 }), 0, 1.1, 0, g);                       // the grill
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(cyl(0.045, 0.045, 0.4, 8), mat('#a8382a', { roughness: 0.5 })); s.rotation.x = Math.PI / 2; s.position.set(-0.6 + i * 0.15, 1.2, 0.2); g.add(s); }
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), basic('#ffffff', { map: canvasTex(320, 110, (c, W, H) => {
      c.fillStyle = '#c8261e'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff6e0'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${H * 0.58}px ${FONT_ZH}`; c.fillText('烤香腸', W / 2, H * 0.54);
    }) }));
    front.position.set(0, 0.68, 0.44); g.add(front);
    box(0.06, 2.6, 0.06, mat('#9aa0a6'), 0.75, 0, -0.35, g);
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 12, 1, true), mat('#ffffff', { side: THREE.DoubleSide, map: canvasTex(256, 32, (c, W, H) => { for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#f4efe4' : '#d23a2a'; c.fillRect(i * W / 12, 0, W / 12, H); } }) }));
    umb.position.set(0.75, 2.75, -0.35); umb.castShadow = true; g.add(umb);
    const v = person({ shirt: '#ffffff', pants: '#3c3f4a', hair: '#2b2b2b' }); v.position.set(0, 0, -0.8); g.add(v);
    for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(smoke[0] ? smoke[0].material.clone() : new THREE.SpriteMaterial({ fog: false })); s.userData = { t: i / 4, base: new THREE.Vector3() }; g.add(s); s.userData.local = true; s.userData.base.set(0, 1.25, 0); smoke.push(s); }
  })();

  // ── street lamps, potted plants along the arcades, pigeons on the stones ──────
  (function lamps() {
    const pole = mat('#4d5a55', { metalness: 0.5, roughness: 0.5 });
    [[-19, -19], [19, -19], [20, 20], [-20, -6], [13, -22]].forEach(([dx, dz]) => {
      const x = SQ.x + dx, z = SQ.z + dz;
      box(0.16, 5.4, 0.16, pole, x, 0, z);
      const arm = box(1.0, 0.1, 0.1, pole, x + 0.4, 5.3, z); void arm;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.3), basic('#fff0c8', { toneMapped: false })); head.position.set(x + 0.85, 5.25, z); group.add(head);
      const h = new THREE.Sprite(halo); h.scale.setScalar(1.8); h.position.set(x + 0.85, 5.15, z); group.add(h);
    });
  })();
  (function pots() {
    const potI = Inst(cyl(1, 0.75, 1, 10), mat('#ffffff')), leafI = Inst(new THREE.IcosahedronGeometry(1, 0), mat('#4f8a46', { flatShading: true }));
    const potCols = ['#b5643f', '#3a6fb0', '#c9c4b8', '#2f8a5a'].map(c => new THREE.Color(c));
    Object.keys(SIDES).forEach(side => {
      const sd = SIDES[side];
      for (let a = -SQ.h + 2; a < SQ.h - 2; a += 1.6 + rnd() * 2.5) {
        if (sd.gate && Math.abs(a) < SQ.gate + 3) continue;
        if (rnd() < 0.4) continue;
        const inset = SQ.h + 0.9, x = SQ.x + sd.out[0] * inset + sd.along[0] * a, z = SQ.z + sd.out[1] * inset + sd.along[1] * a;
        const s = 0.25 + rnd() * 0.2;
        potI.add(local(x, 0.16, z, s, s * 1.4, s), pick(potCols));
        leafI.add(local(x, 0.16 + s * 1.4 + s * 0.8, z, s * 1.4, s * 1.6, s * 1.4, rnd() * 6));
      }
    });
    potI.build(); leafI.build();
  })();
  const pigeons = [];
  (function birds() {
    const body = mat('#8d939c'), headM = mat('#6f7884');
    for (let i = 0; i < 9; i++) {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), body); b.scale.set(0.8, 0.75, 1.3); b.position.y = 0.17; g.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), headM); h.position.set(0, 0.3, 0.17); g.add(h);
      const a = rnd() * Math.PI * 2, r = 5.2 + rnd() * 3.5;
      g.position.set(SQ.x - 2 + Math.cos(a) * r, 0.05, SQ.z + 8 + Math.sin(a) * r * 0.5); g.rotation.y = rnd() * 6.28;
      g.userData = { head: h, ph: rnd() * 6.28, home: g.position.clone() };
      group.add(g); pigeons.push(g);
    }
  })();

  // ── per frame ───────────────────────────────────────────────────────────────
  let lastScreen = 0;
  function update(t, dt) {
    portalMats.forEach(m => { m.uniforms.uTime.value = t; });
    leafTime.value = t;
    smoke.forEach(sp => {
      const u = sp.userData; u.t += dt * 0.22; if (u.t > 1) u.t -= 1;
      if (u.local) sp.position.set(u.base.x + Math.sin(u.t * 5 + 1) * 0.15, u.base.y + u.t * 1.6, u.base.z);
      else sp.position.set(u.base.x + Math.sin(u.t * 4) * 0.2 * u.t, u.base.y + u.t * 2.4, u.base.z);
      sp.scale.setScalar(0.25 + u.t * 1.1); sp.material.opacity = Math.sin(Math.PI * u.t) * 0.7;
    });
    pigeons.forEach(p => {
      const u = p.userData, k = Math.sin(t * 3 + u.ph);
      u.head.position.y = 0.3 - Math.max(0, k) * 0.14; u.head.position.z = 0.17 + Math.max(0, k) * 0.08;   // pecking
      p.rotation.y += Math.sin(t * 0.3 + u.ph) * dt * 0.6;
    });
    const music = window.__music, playing = !!(music && music.playing && !music.muted);
    people.forEach(p => {
      const u = p.userData;
      if (u.singer) { p.rotation.z = Math.sin(t * (playing ? 2.4 : 0.8)) * (playing ? 0.07 : 0.02); u.armL.rotation.x = Math.sin(t * 2.4) * (playing ? 0.5 : 0.1) - 0.2; }
      else if (u.fan) u.armR.rotation.x = -1.3 + Math.sin(t * 7 + u.ph) * 0.35;
      else u.head.rotation.y = Math.sin(t * 0.4 + u.ph) * 0.25;
    });
    notes.forEach(n => {
      n.userData.t += dt * (playing ? 0.35 : 0.08);
      if (n.userData.t > 1) n.userData.t -= 1;
      const k = n.userData.t;
      n.position.set(n.userData.x + Math.sin(k * 9 + n.userData.x) * 0.25, 1.6 + k * 2.2, -1.2);
      n.material.opacity = (playing ? 0.95 : 0.35) * Math.sin(Math.PI * k);
    });
    karaokeBubble();
    if (t - lastScreen > 0.12) { lastScreen = t; screenT = t; redrawScreen(); }   // the screen at about 8 fps: a CRT, not a film
  }
  function redrawScreen() { if (!screenTex) return; const cv = screenTex.image, g = cv.getContext('2d'); drawScreen(g, cv.width, cv.height); screenTex.needsUpdate = true; }

  // ── walk up to the karaoke stand and press E (or tap the bubble): the decade's song plays; again, the next ──
  const kBubble = document.createElement('button');
  kBubble.type = 'button'; kBubble.className = 'mem-bubble'; kBubble.hidden = true;
  kBubble.innerHTML = '<span class="mem-b-k"></span><span class="mem-b-key">E</span>';
  document.body.appendChild(kBubble);
  const kLabel = kBubble.firstChild;
  let kNear = false;
  function sing() {
    const m = window.__music; if (!m) return;
    if (m.playing && !m.muted) { m.next(); return; }
    if (m.muted) m.setMuted(false);
    if (!m.playing) m.playPause();
  }
  kBubble.addEventListener('click', sing);
  window.addEventListener('keydown', ev => {
    if (!kNear || ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    if (ev.key === 'e' || ev.key === 'E') { ev.preventDefault(); sing(); }
  });
  const kV = new THREE.Vector3();
  function karaokeBubble() {
    const W = window.WALK, p = W && W.on && W.where === 'square' ? W.pos : null;
    kNear = !!p && Math.hypot(p.x - K.x, p.z - K.z) < K.r + 2.6;
    if (!kNear) { kBubble.hidden = true; return; }
    kV.set(0, 2.4, -1.2); karaoke.localToWorld(kV); kV.project(R.camera);
    if (kV.z >= 1) { kBubble.hidden = true; return; }
    const m = window.__music, on = !!(m && m.playing && !m.muted);
    kLabel.textContent = on ? '換一首 · Next song' : '唱一首 · Sing';
    kBubble.hidden = false;
    kBubble.style.transform = `translate(${((kV.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - kV.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
  }

  // what walk.js needs to keep her and the camera out of things
  const obstacles = [
    { x: SQ.x, z: SQ.z, r: 4.6 },          // the tree's seat (first: walk.js keeps the camera out of the trunk only)
    { x: K.x, z: K.z, r: K.r },            // the karaoke stand
    { x: CHESS.x, z: CHESS.z, r: CHESS.r },
    { x: TEA.x, z: TEA.z, r: TEA.r },
    { x: SHRINE.x, z: SHRINE.z, r: SHRINE.r },
    { x: BURNER.x, z: BURNER.z, r: BURNER.r },
    { x: CART.x, z: CART.z, r: CART.r },
    { x: BOARD.x, z: BOARD.z, r: 1.5 },
  ].concat(pillarRoots);

  // where the square's sounds come from, for ambience.js (item #8, 2026-11-03): world x / z of each thing that makes one
  const sources = {
    tree: { x: SQ.x, z: SQ.z }, chess: { x: CHESS.x, z: CHESS.z }, tea: { x: TEA.x, z: TEA.z }, shrine: { x: SHRINE.x, z: SHRINE.z },
    burner: { x: BURNER.x, z: BURNER.z }, cart: { x: CART.x, z: CART.z }, karaoke: { x: K.x, z: K.z },
    pigeons: pigeons.map(p => ({ x: p.userData.home.x, z: p.userData.home.z })),
    terrazzo: 10.5,                      // the terrazzo circle round the tree; red brick beyond it
  };

  window.SQUARE = { SQ, group, board, makeLantern, obstacles, karaoke: K, sources, update, SIDES, leave() { kNear = false; kBubble.hidden = true; } };
})();
