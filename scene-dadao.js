// scene-dadao.js — Dadaocheng, the Spring Festival chapter (z -140 … -290). Both sides of the
// road are Dihua Street: an unbroken row of narrow arcaded shophouses (騎樓 over the sidewalk,
// pilasters and a 山牆 crest on each bay). East side: procedural bays with the shop walls and the
// dried goods. West side: the teammate's Dadaocheng library storefronts as the shop walls of the
// same arcade system, then 霞海城隍廟 with its swallowtail ridge and 永樂市場 at the chapter end.
// The 年貨大街 fills the road; 大稻埕碼頭 is seen through the 民生西路 gap on the west.
// Everything exists in all three eras (the tower era only ever sees this stretch behind it).
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, anchors, PALETTE, rnd, libGroup, asset, lam, people } = window.SCENE;

  const ALL = ['red', 'dadao', 'tower'], DT = ['dadao', 'tower'], T = ['tower'];
  const H = (r, d, t) => ({ red: r, dadao: d, tower: t });
  const HA = h => ({ red: h, dadao: h, tower: h });
  const D = anchors.dihua, G = anchors.chenghuang;
  const WALK = 0.22;                                          // top of the sidewalk slab
  const lib = libGroup(['red', 'dadao']);                     // library items, there before the flip

  // ── geometries, base at y = 0 unless noted ──────────────────────────────────
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 10); cylGeo.translate(0, 0.5, 0);
  const sphGeo = new THREE.SphereGeometry(0.5, 20, 12); sphGeo.translate(0, 0.5, 0);

  // ── signage text: characters drawn to a canvas with the system font ────────
  function textTex(str, bg, fg, vertical) {
    const cv = document.createElement('canvas'), n = str.length;
    cv.width = vertical ? 128 : 128 * n + 64; cv.height = vertical ? 128 * n + 64 : 128;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE[bg]; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = PALETTE[fg];
    g.font = '700 100px -apple-system, "PingFang TC", "Heiti TC", "Noto Sans CJK TC", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) vertical ? g.fillText(str[i], 64, 96 + i * 128) : g.fillText(str[i], 96 + i * 128, 66);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
    return { tex: t, aspect: cv.width / cv.height };
  }
  // Light-box construction follows scene-red.js: a shared atlas, merged cases/brackets,
  // two readable faces on projecting signs, proud rims and an outer-edge neon tube.
  const SIGNAGE = (() => {
    const W = 2048, H = 4096, PX = 100;
    const TS = window.SCENE.TEX_SCALE;                                           // smaller on a phone: see scene-red.js SIGNS
    const canvas = document.createElement('canvas'); canvas.width = W * TS; canvas.height = H * TS;
    const ctx = canvas.getContext('2d'); ctx.scale(TS, TS);
    const batches = new Map(), records = [];
    let ax = 2, ay = 2, row = 0;
    const faces = new Map();
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const unit = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    const matrix = new THREE.Matrix4(), normal = new THREE.Matrix3(), q = new THREE.Quaternion();
    function batch(eras, z) {
      const zone = z > -190 ? 1 : z > -230 ? 2 : z > -260 ? 3 : 4;
      const key = eras.join(',') + ':' + zone;
      if (!batches.has(key)) batches.set(key, { eras, face: { pos: [], uv: [], idx: [] }, hw: { pos: [], nor: [], col: [] }, glow: { pos: [], nor: [], col: [] } });
      return batches.get(key);
    }
    function face(text, w, h, bg, fg, vertical) {
      const key = [text, w, h, bg, fg, vertical].join('|');
      if (faces.has(key)) return faces.get(key);
      const pw = Math.max(32, Math.ceil(w * PX)), ph = Math.max(32, Math.ceil(h * PX));
      if (ax + pw + 2 > W) { ax = 2; ay += row + 4; row = 0; }
      if (ay + ph + 2 > H) throw new Error('Dadaocheng sign atlas is full');
      const x = ax, y = ay; ax += pw + 4; row = Math.max(row, ph);
      ctx.fillStyle = PALETTE[bg]; ctx.fillRect(x - 2, y - 2, pw + 4, ph + 4);
      const gradient = ctx.createRadialGradient(x + pw / 2, y + ph / 2, 0, x + pw / 2, y + ph / 2, Math.max(pw, ph) * .7);
      gradient.addColorStop(0, 'rgba(255,255,255,.2)'); gradient.addColorStop(1, 'rgba(0,0,0,.12)');
      ctx.fillStyle = gradient; ctx.fillRect(x, y, pw, ph);
      ctx.strokeStyle = PALETTE[fg]; ctx.lineWidth = 1; ctx.strokeRect(x + 4, y + 4, pw - 8, ph - 8);
      ctx.fillStyle = PALETTE[fg]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const chars = [...text]; let size = vertical ? Math.min(pw * .7, ph * .82 / chars.length) : ph * .68;
      const font = n => `700 ${n}px -apple-system, "PingFang TC", "Heiti TC", sans-serif`;
      ctx.font = font(size);
      if (!vertical && ctx.measureText(text).width > pw * .86) { size *= pw * .86 / ctx.measureText(text).width; ctx.font = font(size); }
      if (vertical) chars.forEach((c, i) => ctx.fillText(c, x + pw / 2, y + ph / 2 + (i - (chars.length - 1) / 2) * size * 1.08));
      else ctx.fillText(text, x + pw / 2, y + ph / 2);
      const uv = [x / W, (x + pw) / W, 1 - (y + ph) / H, 1 - y / H]; faces.set(key, uv); return uv;
    }
    function quad(acc, c, right, w, h, uv) {
      const base = acc.pos.length / 3, [u0, u1, v0, v1] = uv;
      for (const [sx, sy, u, v] of [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) {
        const p = c.clone().addScaledVector(right, sx * w / 2); p.y += sy * h / 2;
        acc.pos.push(p.x, p.y, p.z); acc.uv.push(u, v);
      }
      acc.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    function hardware(acc, center, size, color, rotation) {
      matrix.compose(center, rotation || new THREE.Quaternion(), size); normal.getNormalMatrix(matrix);
      const pos = unit.attributes.position, nor = unit.attributes.normal, v = V(0, 0, 0), c = C(color);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(matrix); acc.pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(nor, i).applyMatrix3(normal).normalize(); acc.nor.push(v.x, v.y, v.z); acc.col.push(c.r, c.g, c.b);
      }
    }
    const box = (acc, x, y, z, w, h, d, c) => hardware(acc, V(x, y, z), V(w, h, d), c);
    function bar(acc, a, b, thickness, color = 'ink') {
      const d = b.clone().sub(a); q.setFromUnitVectors(V(0, 0, 1), d.clone().normalize());
      hardware(acc, a.clone().add(b).multiplyScalar(.5), V(thickness, thickness, d.length()), color, q);
    }
    function light(text, bg, fg, vertical, axis, x, y, z, h, eras, mount) {
      const b = batch(eras, z), D = .14;
      const w = vertical ? Math.min(.75, Math.max(.4, h / (text.length + .5))) : h * (text.length + .5);
      const side = Math.sign(x) || 1, gap = mount ? .3 : .16, cy = y + h / 2;
      const wall = mount ? mount.wall : Math.abs(x) + (axis === 'z' ? w / 2 : D / 2) + gap;
      const inside = side * (wall - gap), outside = inside - side * w;
      const cx = axis === 'z' ? (inside + outside) / 2 : side * (wall - gap - D / 2);
      box(b.hw, cx, cy, z, axis === 'z' ? w : D, h, axis === 'z' ? D : w, 'haze');
      const uv = face(text, w - .06, h - .06, bg, fg, vertical);
      if (axis === 'z') {
        quad(b.face, V(cx, cy, z + D / 2 + .013), V(1, 0, 0), w - .06, h - .06, uv);
        quad(b.face, V(cx, cy, z - D / 2 - .013), V(-1, 0, 0), w - .06, h - .06, uv);
        for (const yy of [y, y + h]) box(b.hw, cx, yy, z, w + .03, .035, D + .05, 'bone');
        for (const xx of [inside, outside]) box(b.hw, xx, cy, z, .035, h + .03, D + .05, 'bone');
        for (const yy of [y + .12, y + h - .12]) bar(b.hw, V(side * wall, yy, z), V(inside, yy, z), .04);
        bar(b.hw, V(side * wall, y + .12, z), V(cx, y + h - .12, z), .03);
        box(b.glow, outside - side * .03, cy, z, .025, h - .12, D + .05, 'lamp');
        box(b.hw, side * wall, cy, z, .04, h * .9, .2, 'ink');
      } else {
        quad(b.face, V(cx - side * (D / 2 + .013), cy, z), V(0, 0, side), w - .06, h - .06, uv);
        for (const yy of [y, y + h]) box(b.hw, cx, yy, z, D + .05, .035, w + .03, 'bone');
        for (const zz of [z - w / 2, z + w / 2]) box(b.hw, cx, cy, zz, D + .05, h + .03, .035, 'bone');
        for (const zz of [z - w * .35, z + w * .35]) bar(b.hw, V(side * wall, cy, zz), V(cx, cy, zz), .04);
      }
      records.push({ text, axis, side, x: cx, z, y, h, w, wall, gap, host: mount && mount.host, kind: 'lightbox' });
    }
    // Printing attached to an existing physical portal, and actual price cards, stays flat.
    function print(text, bg, fg, vertical, axis, x, y, z, h, eras) {
      const b = batch(eras, z), w = h * (vertical ? 1 / (text.length + .5) : text.length + .5);
      quad(b.face, V(x, y + h / 2, z), axis === 'z' ? V(1, 0, 0) : V(0, 0, Math.sign(x) || 1), w, h, face(text, w, h, bg, fg, vertical));
    }
    function finish() {
      const texture = new THREE.CanvasTexture(canvas); texture.anisotropy = 8;
      // Cases and neon tubes use solid-color atlas swatches. One mesh per spatial/era
      // batch keeps distant sign groups culled without paying three calls per group.
      const swatches = new Map();
      for (const b of batches.values()) for (const key of ['hw', 'glow']) {
        const a = b[key], base = b.face.pos.length / 3;
        b.face.pos.push(...a.pos);
        for (let i = 0; i < a.pos.length / 3; i++) {
          const rgb = a.col.slice(i * 3, i * 3 + 3), id = rgb.join(',');
          if (!swatches.has(id)) {
            const name = Object.keys(PALETTE).find(k => { const c = C(k); return Math.abs(c.r - rgb[0]) + Math.abs(c.g - rgb[1]) + Math.abs(c.b - rgb[2]) < .00001; }) || 'bone';
            const uv = face('', .12, .12, name, name, false);
            ctx.fillStyle = PALETTE[name]; ctx.fillRect(uv[0] * W, (1 - uv[3]) * H, (uv[1] - uv[0]) * W, (uv[3] - uv[2]) * H);
            swatches.set(id, [(uv[0] + uv[1]) / 2, (uv[2] + uv[3]) / 2]);
          }
          b.face.uv.push(...swatches.get(id)); b.face.idx.push(base + i);
        }
        a.pos.length = 0;
      }
      texture.needsUpdate = true;
      for (const b of batches.values()) {
        const group = libGroup(b.eras);
        for (const [key, material] of [
          ['face', new THREE.MeshLambertMaterial({ map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: .12, side: THREE.DoubleSide })],
          ['hw', new THREE.MeshLambertMaterial({ vertexColors: true })],
          ['glow', new THREE.MeshBasicMaterial({ vertexColors: true })]
        ]) {
          const a = b[key]; if (!a.pos.length) continue;
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(a.pos, 3));
          if (a.uv) { geo.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2)); geo.setIndex(a.idx); geo.computeVertexNormals(); }
          else { geo.setAttribute('normal', new THREE.Float32BufferAttribute(a.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(a.col, 3)); }
          const mesh = new THREE.Mesh(geo, window.SCENE.withFog(material)); mesh.castShadow = key !== 'glow'; mesh.receiveShadow = key !== 'glow'; mesh.userData.dadaoSign = true; group.add(mesh);
        }
      }
    }
    return { light, print, finish, records };
  })();
  const signRequests = [], facades = [];
  const lightBox = (...args) => signRequests.push(args);
  const appliedPrint = (...args) => SIGNAGE.print(...args);

  // ── the shophouse bays: one arcade system on both sides ─────────────────────
  // Reference: Dihua Street Section 1 — frontages 4–5 m, 騎樓 at ground level over the sidewalk
  // (columns at the kerb, ceiling at 3.8 m), the upper floor over the sidewalk with two tall
  // windows between pilasters, and a parapet crest: 閩南 plain brick ('min'), 洋樓 red brick with
  // round-arched windows and a balustrade ('yang'), 巴洛克 plaster with a curved gable ('baroque').
  const cols = [], bodies = [];
  const shops = [];                                            // the arcade back walls that get goods
  const KERB = 6.6, FACE = 6.2, BACK = 9.4, DEEP = 18;
  // Issue #5 step 3: a bay is one of three glbs (asset/blender/dihua-{min,yang,baroque}.py, built
  // on dihua_common.py) instanced through MODELS.instance: column, arcade slab, shop wall with
  // its lattice door, framed windows, pilaster, cornice and the crest of its style. The width
  // scales to the bay, and a Baroque bay's plaster takes the bay's colour per instance.
  // Issue #15 step 3 restored the floor variety: each glb carries three groups — 'main' (arcade,
  // shop wall, one upper floor), 'storey' (one more upper floor, built where the second sits) and
  // 'crest' (roof slab and parapet). A bay instances main once, storey floors-1 times at
  // y = (k-1)*FH, and crest once at y = (floors-2)*FH, so opts.floors 1/2/3 and opts.tall (three
  // floors) mean something again instead of being ignored.
  const FH = 3.4;                                              // storey height, dihua_common.FH
  const bays = { min: [], yang: [], baroque: [] };
  const storeys = { min: [], yang: [], baroque: [] };
  const crests = { min: [], yang: [], baroque: [] };
  // Dedicated models for complete bays inside zone 2; boundaries and other zones stay fixed.
  const zone2 = { arcade: [], min: [], yang: [], baroque: [], yang_crest: [], baroque_crest: [], storey: [] };
  const referenceBayIndex = { 1: 0, 2: 0 };
  // A deterministic brick bond in palette-relative values. Planar UVs are generated on
  // the dedicated model only; original shared assets/materials remain untouched.
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = brickCanvas.height = 512;
  const brickCtx = brickCanvas.getContext('2d');
  brickCtx.fillStyle = '#626262'; brickCtx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 20; row++) for (let col = -1; col < 9; col++) {
    const shade = 178 + ((row * 31 + col * 17 + 99) % 65);
    brickCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    brickCtx.fillRect(col * 64 + (row % 2) * 32 + 2, row * 25.6 + 2, 60, 22);
  }
  const brickMap = new THREE.CanvasTexture(brickCanvas);
  brickMap.wrapS = brickMap.wrapT = THREE.RepeatWrapping; brickMap.anisotropy = 4;
  function referenceInstances(node, items) {
    node.traverse(mesh => {
      if (!mesh.isMesh || mesh.material.color.getHex() !== C('brick').getHex()) return;
      const p = mesh.geometry.attributes.position, n = mesh.geometry.attributes.normal;
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] = (Math.abs(n.getX(i)) > .5 ? p.getZ(i) : p.getX(i)) / 2.4;
        uv[i * 2 + 1] = p.getY(i) / 2.4;
      }
      mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    });
    MODELS.instance(node, items).forEach(set => {
      if (set.mesh.material.color.getHex() !== C('brick').getHex()) return;
      set.mesh.material.map = brickMap; set.mesh.material.needsUpdate = true;
    });
  }
  // bay(side, z0, z1, style, opts): opts.col (wall colour), opts.libDepth (a library storefront
  // stands at the arcade back, this deep, so the body starts behind it), opts.open (no bay glb: a
  // library facade fills the kerb line), opts.goods.
  function bay(s, z0, z1, style, o) {
    o = o || {};
    const d = z0 - z1, zc = (z0 + z1) / 2;
    const col = o.col || (style === 'baroque' ? 'bone' : 'brick');
    const top = 4.2 + 2 * 3.4 - 0.2;                           // roof line
    const bf = o.open ? 7.2 : (o.libDepth ? BACK + o.libDepth + 0.1 : BACK);   // where the body starts
    bodies.push({ x: s * (bf + DEEP) / 2, z: zc, w: DEEP - bf, d, h: HA(o.open ? top : 3.8), c: C(col) });
    const reference = (z0 <= -190 && z1 >= -230) || (z0 <= -150 && z1 >= -190 && !o.libDepth);
    facades.push({ side: s, z0, z1, zc, width: d, style, reference, open: !!o.open });
    if (o.open) return;
    const floors = Math.min(3, Math.max(1, o.floors || (o.tall ? 3 : 2)));
    const it = { x: s * FACE, z: zc, r: s > 0 ? -Math.PI / 2 : Math.PI / 2, w: d / 4.6, d: 1, h: HA(1), c: C(col) };
    if (reference) {
      const index = referenceBayIndex[z0 <= -190 ? 2 : 1]++;
      // Ground + one upper floor, with an occasional real additional floor. The arcade
      // head stays at 4.1 m: stretching the whole asset would stretch every doorway.
      zone2.arcade.push(it);
      zone2[style].push(it);
      if (style !== 'min') {
        const extra = index % 5 === 1;
        if (extra) zone2.storey.push(Object.assign({}, it, { y: 4.25 }));
        zone2[style + '_crest'].push(Object.assign({}, it, { y: extra ? 4.25 : 0 }));
      }
      const name = ['南北貨', '茶莊', '布行', '中藥行', '乾貨', '米行'][index % 6];
      lightBox(name, 'bone', 'ink', false, 'x', s * 9.0, 3.02, zc, .46, ALL);
      lightBox(name, index % 3 ? 'verm' : 'bone', index % 3 ? 'bone' : 'ink', true, 'z', s * 6.0, 3.65, zc - d * .35, 1.9, ALL);
      if (style !== 'min') lightBox(['商號', '茶', '布'][index % 3], 'walk', 'ink', false, 'x', s * 6.02, 4.38, zc, .38, ALL);
      if (o.goods !== false) shops.push({ fx: s * BACK, z: zc, span: d, s });
      return;
    }
    bays[style].push(it);
    for (let k = 1; k < floors; k++) storeys[style].push(Object.assign({}, it, { y: (k - 1) * FH }));
    crests[style].push(Object.assign({}, it, { y: (floors - 2) * FH }));
    if (o.goods !== false) shops.push({ fx: s * BACK, z: zc, span: d, s });
  }
  Object.keys(bays).forEach(style => MODELS.load('dihua-' + style, gltf => {
    const opts = { colorPrim: style === 'baroque' ? 'walk' : null };
    [['main', bays], ['storey', storeys], ['crest', crests]].forEach(([g, list]) => {
      const n = MODELS.node(gltf.scene, g);
      if (n) MODELS.instance(n, list[style], opts);
      else console.error('dihua-' + style + '.glb has no ' + g + ' group');
    });
  }));
  // east side: 24 bays from z -150 down to -262, one wider slot for the library's Baroque facade
  const east = [['baroque', { tall: true }], ['yang'], ['min'], ['baroque', { col: 'walk' }], ['baroque', { floors: 3 }], ['yang'],
                ['lib'], ['baroque'], ['min'], ['baroque', { col: 'walk', medal: 'verm' }], ['yang', { floors: 3 }], ['baroque'],
                ['min'], ['baroque', { tall: true }], ['yang'], ['baroque', { col: 'walk' }], ['baroque'], ['min'],
                ['yang'], ['baroque', { floors: 3, medal: 'verm' }], ['baroque'], ['min'], ['baroque', { col: 'walk' }], ['yang']];
  let ze = -150;
  east.forEach(([style, o], index) => {
    if (style === 'lib') {
      const w = 5.6;
      bay(1, ze, ze - w, 'baroque', { open: true, col: 'bone' });
      const t = asset('baroque-gable-townhouse', lib, FACE + 0.25, ze - w / 2, -Math.PI / 2);   // front faces the road
      ze -= w; return;
    }
    const width = index >= 9 && index <= 16 ? [4.2, 5.3, 3.9, 4.9, 4.3, 5.1, 4.4, 4.7][index - 9] : 4.6;
    bay(1, ze, ze - width, style, o); ze -= width;
  });
  cols.push({ x: KERB, z: ze, w: 0.5, d: 0.5, h: HA(3.8), c: C('walk') });
  D.top = 11;

  // west side: the library storefronts stand at the back of the same arcade
  // [id, width, scale, style, extra]; 'gap' opens 民生西路; 'fill' is a plain procedural bay
  const west = [
    ['red-brick-arcade', 6.4, 1, 'yang', { open: true, col: 'brick' }],
    ['dried-goods-shop', 6.2, 1, 'baroque'], ['qipao-fabric-shop', 5.4, 0.92, 'yang'],
    ['bolero-restaurant', 5.6, 0.8, 'baroque', { col: 'walk' }], ['kamatiam-cooler-storefront', 5.2, 1, 'min'],
    ['creative-cafe-storefront', 4.8, 1, 'baroque'],
    ['fill', 4.6, 0, 'yang', { sign: '茶行', signCol: 'lamp' }], ['fill', 4.6, 0, 'baroque', { floors: 3 }], ['fill', 4.6, 0, 'min'],
    ['gap', 16.5], ['fill', 4.6, 0, 'baroque', { sign: '南北貨' }], ['fill', 4.6, 0, 'yang'], ['fill', 4.6, 0, 'min', { floors: 1 }],
    ['temple', 12], ['herbal-medicine-counter', 4.6, 1, 'baroque', { sign: '中藥' }], ['fill', 4.6, 0, 'min', { drawers: true }],
    ['fill', 4.6, 0, 'baroque', { tall: true }], ['fill', 2.4, 0, 'yang', { goods: false }],
  ];
  let zw = -150.5, gapZ = [0, 0], templeZ = 0;
  west.forEach(([id, w, sc, style, o]) => {
    o = o || {};
    const zc = zw - w / 2;
    if (id === 'gap') { gapZ = [zw, zw - w]; zw -= w; return; }
    if (id === 'temple') { templeZ = zc; zw -= w; return; }
    if (id === 'fill') { bay(-1, zw, zw - w, style, o); }
    else if (o.open) {
      bay(-1, zw, zw - w, style, o);
      asset(id, lib, -(FACE + 0.25), zc, Math.PI / 2, sc);
    } else {
      const a = window.SCENE.findAsset(id);
      const depth = a ? 3.9 : 0;                                // storefront depth, room behind the front for the body
      bay(-1, zw, zw - w, style, Object.assign({ libDepth: depth, goods: false }, o));
      // Keep the storefront's original bounds/placement, but replace its loose signs
      // with the same facade-mounted, batched light boxes as the rest of this row.
      const inherited = [], core = window.NostalgiaCore, verticalSign = core.verticalSign;
      if (zw > -190) core.verticalSign = function (text, opts) {
        const sign = verticalSign.call(this, text, opts); inherited.push({ sign, text }); return sign;
      };
      let g;
      try { g = asset(id, lib, 0, zc, Math.PI / 2, sc); }
      finally { core.verticalSign = verticalSign; }
      if (g) {
        const sz = g.userData.size; g.position.x = -(BACK - 0.1) - sz.x / 2 + 0.01; g.updateMatrixWorld(true);
        inherited.forEach(({ sign, text }) => {
          const pos = sign.getWorldPosition(new THREE.Vector3()); sign.removeFromParent();
          lightBox(text, 'verm', 'bone', true, 'z', -FACE, 4.45, pos.z, 2.1, ALL);
        });
      }
    }
    if (o.sign) lightBox(o.sign, o.signCol === 'lamp' ? 'lamp' : 'bone', 'ink', true, 'z', -(FACE - 0.55), 4.4, zc, 2.6, ALL);
    if (o.drawers) { // 百子櫃 — the herb shop's wall of little drawers, drawn to a canvas, as the shop wall
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
      const g = cv.getContext('2d');
      g.fillStyle = PALETTE.haze; g.fillRect(0, 0, 256, 192);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
        g.fillStyle = PALETTE.bone; g.fillRect(i * 32 + 3, j * 32 + 3, 26, 26);
        g.fillStyle = PALETTE.lamp; g.fillRect(i * 32 + 13, j * 32 + 13, 6, 6);
      }
      const p = part(-(BACK - 0.5), WALK, zc, 0.9, w - 0.8, only(ALL, 2.6, 'bone'));
      p.mesh.material.map = new THREE.CanvasTexture(cv); p.mesh.material.needsUpdate = true;
    }
    zw -= w;
  });
  cols.push({ x: -KERB, z: gapZ[0], w: 0.5, d: 0.5, h: HA(3.8), c: C('walk') });
  cols.push({ x: -KERB, z: zw, w: 0.5, d: 0.5, h: HA(3.8), c: C('walk') });
  MODELS.load('dihua-zone2', gltf => {
    Object.keys(zone2).forEach(name => {
      if (!zone2[name].length) return;
      const node = MODELS.node(gltf.scene, name === 'storey' ? 'yang' : name);
      if (!node) { console.error('dihua-zone2.glb has no ' + name + ' group'); return; }
      referenceInstances(node, zone2[name]);
    });
  });
  // painted shop names on the east pilasters, read walking down the street
  [['米行', 'bone', -152.3], ['南北貨', 'bone', -175.3], ['布莊', 'verm', -207.9], ['茶行', 'lamp', -234.5], ['中藥', 'bone', -253]].forEach(([t, bg, z]) =>
    lightBox(t, bg, bg === 'bone' ? 'ink' : 'bone', true, 'z', FACE - 0.55, 4.4, z, 2.6, ALL));

  // ── goods under the east arcade and in the west fillers: sacks, price boards, crates, jars,
  //    hanging dried goods, tin signs under the arcade lip, acrylic boxes on the facade ──
  const goods = [], jars = [], sacks = [], crates = [], bikes = [];
  shops.forEach((s, si) => {
    const side = s.s, gx = s.fx - side * 0.3, hz = s.span / 2 - 0.5;
    for (let i = 0; i < 4; i++) {                              // sacks, some two high (props.glb, issue #5)
      const z = s.z - hz + 0.35 + i * 0.72 + (rnd() - 0.5) * 0.15;
      sacks.push({ x: gx, y: WALK, z, w: 1, d: 1, r: (rnd() - 0.5) * 0.3, h: HA(1) });
      if (i % 2 === 0) sacks.push({ x: gx, y: WALK + 0.58, z, w: 0.92, d: 0.92, r: (rnd() - 0.5) * 0.4, h: HA(0.85) });
    }
    for (let b = 0; b < 3; b++) {                              // hand-written price boards stuck in the piles, red paper
      const z = s.z - hz + 0.45 + b * 0.72;
      goods.push({ x: gx - side * 0.3, y: WALK + (b % 2 ? 0.5 : 0.92), z, w: 0.04, d: 0.36, r: (rnd() - 0.5) * 0.3, c: C(b === 1 ? 'bone' : 'verm'), h: HA(0.44) });
    }
    const z = s.z + hz - 0.5;                                  // a crate with jars, the far end of the front
    crates.push({ x: gx, y: WALK, z, w: 1, d: 1.6, r: 0, h: HA(1) });
    for (let k = 0; k < 3; k++) jars.push({ x: gx, y: WALK + 0.5, z: z - 0.32 + k * 0.32, w: 0.27, d: 0.27, c: C(k === 1 ? 'lamp' : (k === 2 ? 'haze' : 'bone')), h: HA(0.36) });
    goods.push({ x: s.fx - side * 0.25, y: 3.0, z: s.z, w: 0.06, d: s.span - 1.2, r: 0, c: C('ink'), h: HA(0.06) });   // the rod
    for (let i = 0; i < 6; i++) {
      const zz = s.z - hz + 0.35 + i * ((2 * hz - 0.7) / 5), hh = 0.45 + rnd() * 0.5;
      goods.push({ x: s.fx - side * 0.25, y: 3.0 - hh, z: zz, w: 0.2, d: 0.3, r: (rnd() - 0.5) * 0.6, c: C(i % 3 === 0 ? 'lamp' : (i % 3 === 1 ? 'haze' : 'bone')), h: HA(hh) });
    }
    const lampSign = si % 3 === 0;
    lightBox(['南北貨', '茶行', '布莊', '中藥'][si % 4], lampSign ? 'lamp' : 'bone', 'ink', false, 'x', side * (KERB + .35), 2.3, s.z - .3, .46, ALL);
    if (si % 2 === 0) {
      const y = 4.6 + rnd() * 1.6, h = .9 + rnd() * .8; // preserve the scene's seeded layout
      lightBox(['茶', '布', '米'][si % 3], si % 4 === 0 ? 'lamp' : 'haze', 'ink', true, 'z', side * (FACE - .55), y, s.z + .9, h, ALL);
    }
  });

  // ── 霞海城隍廟 — one of Taipei's smallest temples: a single hall, red columns, a dark carved
  //    front, orange tiles and a swallowtail ridge. Porch over the sidewalk, forecourt in front. ──
  const lant = [];
  (() => {
    const cz = G.z, WH = 5.0, xf = -8.8;                       // hall z -244 … -236, x -8.8 … -17.8, walls 5 m
    // Issue #5 step 2: the hall, carved front with red doors, porch columns, brackets, tiled
    // roof, swallowtail ridge, lanterns and incense burner are the glb from asset/blender/temple.py
    // (8.4k triangles); the name board and the 月老 sign stay canvas text on it.
    const temple = libGroup(ALL);
    MODELS.load('temple', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(xf, 0, cz); root.rotation.y = Math.PI / 2;
      temple.add(root);
    });
    lightBox('霞海城隍廟', 'ink', 'lamp', false, 'x', -5.65, WH - 0.9, cz, 0.85, ALL);   // the name on the eave, facing the road
    part(-6.9, WALK + 1.05, cz, 0.1, 0.1, only(ALL, 2.4, 'bone'));                     // smoke off the burner
    part(-6.75, WALK + 1.05, cz - 0.12, 0.07, 0.07, only(ALL, 3.0, 'bone'));
    lightBox('月老', 'verm', 'bone', true, 'x', -6.35, WALK, cz + 5.2, 1.8, DT);       // the matchmaker board at the queue head
    G.top = 12.5;
    asset('temple-tea-table', lib, -7.8, cz - 5.2, Math.PI / 2);
    asset('yuelao-worship-area', lib, -8.0, cz + 5.4, Math.PI / 2, 0.8);
  })();

  // ── 永樂市場 — the 1982 concrete market: a big pale block, upper floors stepped back, cloth
  //    market on the upper floors, wet market open at the ground floor, red vertical sign. ──
  (() => {
    const z0 = -263, z1 = -285, zc = (z0 + z1) / 2, xf = -9.3;
    // Issue #5 step 2: the open hall on its columns, floors 2–5 with cut window bands, the
    // stepped floors 6–7, roof slabs, sign frame, plant room, tank and stair tower are the glb
    // from asset/blender/yongle.py (9.1k triangles); the three text signs stay canvas boards.
    const market = libGroup(ALL);
    MODELS.load('yongle', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(xf, 0, zc); root.rotation.y = Math.PI / 2;
      market.add(root);
    });
    lightBox('永樂市場', 'verm', 'bone', true, 'z', xf + 0.6, 6.0, z0 - 1.6, 7.0, ALL);
    lightBox('永樂布業商場', 'bone', 'verm', false, 'x', xf + 0.15, 4.5, zc, 1.3, ALL);
    lightBox('永樂市場', 'verm', 'bone', false, 'x', xf - 4.0, 24.6, zc, 1.8, ALL);   // rooftop
    // fabric stalls under the front: bolts of cloth in the site colours
    const cloth = ['verm', 'lamp', 'sky', 'leaf', 'glass', 'bone', 'brick', 'haze'];
    for (let z = z0 - 2.4; z > z1 + 1.5; z -= 2.6) {
      goods.push({ x: xf - 1.6, y: WALK, z, w: 1.6, d: 2.0, h: HA(0.8), c: C('haze') });
      for (let k = 0; k < 6; k++) goods.push({ x: xf - 2.2 + (k % 3) * 0.55, y: WALK + 0.8 + Math.floor(k / 3) * 0.32, z: z + (k % 2 ? 0.45 : -0.45), w: 0.5, d: 0.75, r: 0.1 * (k % 3), h: HA(0.3), c: C(cloth[(k + Math.round(-z)) % 8]) });
    }
    asset('yongle-fabric-stall', lib, -7.6, z0 - 4.2, Math.PI / 2);
    asset('yongle-fabric-stall', lib, -7.6, z1 + 5.0, Math.PI / 2);
  })();

  // ── 大稻埕碼頭 through the 民生西路 gap: the flood wall with the No. 5 gate, the promenade
  //    plaza, embankment steps down to the river, the bike path, a ferry at the pier ──
  (() => {
    const gz = (gapZ[0] + gapZ[1]) / 2;                        // gate on the axis of the cross street
    const WX = -19;
    part(WX, 0, (-150 + gz + 3.2) / 2, 0.9, -150 - (gz + 3.2), only(ALL, 4.0, 'haze'));    // flood wall, north run
    part(WX, 0, (gz - 3.2 - 290) / 2, 0.9, (gz - 3.2) + 290, only(ALL, 4.0, 'haze'));      // south run
    part(WX, 4.0, -220, 1.1, 140, only(ALL, 0.25, 'bone'));                                 // coping
    part(WX, 3.5, gz, 0.95, 6.4, only(ALL, 0.5, 'haze'));                                   // over the gate
    [-3.2, 3.2].forEach(dz => part(WX, 0, gz + dz, 1.1, 0.5, only(ALL, 4.2, 'verm')));    // 5號水門: red steel frame
    part(WX, 3.3, gz, 1.1, 6.9, only(ALL, 0.45, 'verm'));
    lightBox('5', 'verm', 'bone', false, 'x', WX + 0.6, 4.3, gz, 0.9, ALL);
    part(-24, 0, -214, 8.2, 60, only(ALL, 0.8, 'walk'));                                   // promenade plaza
    part(-28.75, 0, -214, 1.5, 60, only(ALL, 0.5, 'haze'));                                // embankment steps
    part(-30.25, 0, -214, 1.5, 60, only(ALL, 0.25, 'haze'));
    part(-50, 0, -214, 38, 70, only(ALL, 0.06, 'sky'));                                    // the Tamsui River
    part(-25.6, 0.8, -214, 1.4, 60, only(DT, 0.03, 'brick'));                              // bike path (2000s)
    part(-31.5, 0.3, -206, 5.4, 2.2, only(DT, 0.4, 'haze'));                                // ferry pier
    part(-36, 0.06, -203, 2.4, 6.5, only(DT, 0.9, 'bone'));                                 // the Blue Highway ferry
    part(-36, 0.96, -203, 1.8, 3.8, only(DT, 1.1, 'haze'));
    part(-36, 2.06, -203, 2.0, 4.2, only(DT, 0.15, 'bone'));
    const posts = [], heads = [];
    for (let z = -190; z >= -238; z -= 8) { posts.push({ x: -21.2, y: 0.8, z, w: 0.18, d: 0.18, h: HA(5.0) }); heads.push({ x: -21.2, y: 5.8, z, w: 0.5, d: 0.5, h: HA(0.4) }); }
    instSet(boxGeo, lam('bone'), posts);
    instSet(boxGeo, lam('lamp', { emissive: C('lamp'), emissiveIntensity: 0.5 }), heads);
    const w = asset('dadaocheng-wharf-corner', lib, -24.5, -224, 0);
    if (w) { w.position.y = 1.0; w.updateMatrixWorld(true); }
    // the cross street itself: pavement between the two rows, out to the wall
    part(-14, 0, gz, 10, gapZ[0] - gapZ[1] - 0.2, only(ALL, 0.1, 'road'));
  })();

  // ── people (issue #13, the engine's people() figures): the 年貨大街 crowd between the stalls
  //    (the market street is closed to traffic; nothing moves), the 月老 queue, the old men, the
  //    promenade, the arcades, the market front and the walk south toward 2020 ──
  const figs = [];
  for (let i = 0; i < 170; i++) {
    const z = -196 - rnd() * 90, x = (rnd() < 0.5 ? -1 : 1) * (1.2 + rnd() * 2.8);
    const fh = 1.45 + rnd() * 0.3;   // kept off |x| < 1.2: the engine's girl runs down the centre lane
    figs.push({ x, z, y: 0.02, r: rnd() * 6.28, h: H(0, fh, fh) });
  }
  for (let i = 0; i < 30; i++) {   // today's queue for the matchmaker, north along the west sidewalk from the temple
    const qx = -6.45 - (i % 3) * 0.3, qz = G.z + 5.8 + i * 1.15 + (i % 2) * 0.2;
    figs.push({ x: qx, y: WALK, z: qz, r: Math.PI, h: H(0, 0, 1.55 + (i % 3) * 0.1) });   // facing the temple, down the street
  }
  [[-0.9, 0], [0.7, -0.5], [0.4, 0.8]].forEach(o => figs.push({ x: -7.8 + o[0], y: WALK, z: G.z - 5.2 + o[1], r: rnd() * 6, v: 0, h: H(1.25, 1.25, 0) }));   // the old men at the tea table, seated height
  for (let i = 0; i < 10; i++) figs.push({ x: -22 - rnd() * 5, y: 0.8, z: -196 - rnd() * 36, r: rnd() * 6.28, h: HA(1.55) });   // the promenade
  for (let i = 0; i < 20; i++) {   // shoppers under the arcades, north of the festival
    const s = i % 2 ? 1 : -1, z = -152 - rnd() * 44;
    figs.push({ x: s * (6.9 + rnd() * 1.8), y: WALK, z, r: rnd() * 6.28, h: HA(1.5 + rnd() * 0.3) });
  }
  for (let i = 0; i < 16; i++) {   // shoppers at the 永樂市場 fabric front and the east arcade opposite (the 0.52 frame)
    const s = i % 3 ? -1 : 1, z = -264 - rnd() * 20;
    figs.push({ x: s * (6.6 + rnd() * 1.6), y: WALK, z, r: rnd() * 6.28, h: HA(1.5 + rnd() * 0.3) });
  }
  for (let i = 0; i < 26; i++) {   // walkers on both sidewalks south of the market, toward the 2020 marking (the 0.58 frame)
    const s = i % 2 ? 1 : -1, z = -288 - rnd() * 44, fwd = rnd() < 0.5;
    figs.push({ x: s * (6.5 + rnd() * 2.2), y: WALK, z, r: (fwd ? 0 : Math.PI) + (rnd() - 0.5) * 0.8, h: H(0, 1.5 + rnd() * 0.3, 1.5 + rnd() * 0.3) });
  }

  // ── parked at the kerb, north of the festival only: scooters and bicycles, the library
  //    blue truck. The historical tricycle is inappropriate for the 2000–2019 chapter. ──
  const veh = [];
  [{ x: 5.9, z0: -153, z1: -196 }, { x: -5.9, z0: -158, z1: -196 }].forEach(k => {
    for (let z = k.z0; z > k.z1; z -= 1.8) {
      if (k.x < 0 && (Math.abs(z + 168) < 2.2 || Math.abs(z + 186) < 2.6)) continue;   // unloading spaces; preserve the seeded layout
      const r = rnd();
      if (r < 0.35) { rnd(); bikes.push({ x: k.x, y: 0, z, w: 1, d: 1, r: (rnd() - 0.5) * 0.3 + (k.x > 0 ? Math.PI : 0), h: HA(1) }); }   // a bicycle (props.glb)
      else if (r < 0.75) veh.push({ x: k.x, y: 0, z, w: 0.5, d: 1.7, r: (rnd() - 0.5) * 0.2, c: C(rnd() < 0.85 ? 'haze' : 'bone'), h: HA(0.85) });
    }
  });
  for (let i = 0; i < 8; i++) bikes.push({ x: -21.6 + (rnd() - 0.5) * 0.8, y: 0.8, z: -232 + i * 6, w: 1, d: 1, r: 0.35 + rnd() * 0.3, h: HA(1) });   // bicycles on the promenade
  asset('blue-mini-truck', lib, -5.6, -186, Math.PI);
  MODELS.load('dadao-entrance', gltf => {
    const scooters = [];
    for (let i = 0; i < 20; i++) {
      const s = i % 2 ? 1 : -1, z = -155 - Math.floor(i / 2) * 3.6;
      if (s < 0 && z < -182) continue;
      scooters.push({ x: s * 6.05, y: WALK, z, r: s * .85, w: 1, d: 1, h: HA(1) });
    }
    MODELS.instance(MODELS.node(gltf.scene, 'scooter'), scooters);
    MODELS.instance(MODELS.node(gltf.scene, 'portal'), [{ x: 0, z: -150, w: 1, d: 1, h: H(1, 1, 0) }]);
  });

  // ── 年貨大街: the entrance archway, lantern strings over the road, banners, stalls both
  //    sides with red price boards, the two library stalls ──
  const fest = [], stalls = [];
  // Reviewed issue-18-archway before adapting its temporary portal proportions. The
  // undated zodiac mascot is omitted; the wrap uses the page's existing palette.
  appliedPrint('台北年貨大街', 'verm', 'bone', false, 'z', 0, 6.95, -149.39, 1.02, ['red', 'dadao']);
  [-1, 1].forEach(s => appliedPrint('迎春納福', 'verm', 'lamp', true, 'z', s * 6.35, 1.5, -149.28, 3.7, ['red', 'dadao']));

  // Lantern addendum: build-time catenaries, sampled as one merged wire mesh. The
  // main branch's scene-red.js cloth uses the same fixed subdivided-mesh approach
  // (its sag is parabolic); here use the requested cosh curve with 7.5% span sag.
  const wirePos = [], wireIdx = [], caps = [], cords = [];
  function wireSegment(a, b, radius = .018) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const tangent = B.clone().sub(A).normalize();
    const n = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
    const v = tangent.clone().cross(n), base = wirePos.length / 3;
    for (const p of [A, B]) for (let j = 0; j < 4; j++) {
      const q = p.clone().addScaledVector(n, Math.cos(j * Math.PI / 2) * radius).addScaledVector(v, Math.sin(j * Math.PI / 2) * radius);
      wirePos.push(q.x, q.y, q.z);
    }
    for (let j = 0; j < 4; j++) { const k = (j + 1) % 4; wireIdx.push(base + j, base + k, base + j + 4, base + k, base + k + 4, base + j + 4); }
  }
  // Derived pink/purple stay within the approved palette rather than adding a new scheme.
  const lanternColors = [C('verm').lerp(C('bone'), .5), C('sky'), C('leaf'), C('lamp').lerp(C('bone'), .45), C('lamp'), C('verm').lerp(C('sky'), .6), C('bone')];
  const span = 12.4, ca = 20.8, end = Math.cosh(span / 2 / ca);
  const wireY = x => 8.15 + ca * (Math.cosh(x / ca) - end);
  // Three parallel rows per run; close spacing reads as a canopy over the entire street.
  for (let run = 0; run < 11; run++) for (let row = 0; row < 3; row++) {
    const z = -154 - run * 12 - row * 3.8;
    if (z < -287) continue;
    for (let j = 0; j < 24; j++) {
      const x0 = -span / 2 + span * j / 24, x1 = -span / 2 + span * (j + 1) / 24;
      wireSegment([x0, wireY(x0), z], [x1, wireY(x1), z]);
    }
    for (let i = 0; i < 11; i++) {
      const x = -5.5 + i * 1.1, y = wireY(x), size = .44 + (i % 3) * .035;
      lant.push({ x, y: y - .24 - size, z, w: size, d: size, h: HA(size), c: lanternColors[(i + row * 2 + run) % lanternColors.length] });
      cords.push({ x, y: y - .24, z, w: .018, d: .018, h: HA(.24) });
      caps.push({ x, y: y - .27, z, w: .16, d: .16, h: HA(.045) });
      caps.push({ x, y: y - .24 - size, z, w: .14, d: .14, h: HA(.04) });
      cords.push({ x, y: y - .42 - size, z, w: .025, d: .025, h: HA(.18) });
    }
  }
  const wireGeo = new THREE.BufferGeometry();
  instSet(boxGeo, lam('ink'), cords); instSet(cylGeo, lam('lamp'), caps);

  function clothBanner(text, z) {
    const { tex } = textTex(text, 'verm', 'bone', false), pos = [], uv = [], idx = [], n = 32;
    for (let j = 0; j < 3; j++) for (let i = 0; i <= n; i++) {
      const t = i / n, v = j / 2, x = (t - .5) * 10.3;
      const sag = ca * (Math.cosh(x / ca) - Math.cosh(5.15 / ca));
      pos.push(x, 8.45 + sag * (1 + .18 * v) - .9 * v, z + .035 * Math.sin(t * Math.PI * 12) * v);
      uv.push(t, 1 - v);
    }
    for (let j = 0; j < 2; j++) for (let i = 0; i < n; i++) { const k = j * (n + 1) + i; idx.push(k, k + n + 1, k + 1, k + 1, k + n + 1, k + n + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = lam('bone', { map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, window.SCENE.withFog(m)); libGroup(ALL).add(mesh);
    // Tie the corners to the façade line; no unsupported floating billboard.
    for (const s of [-1, 1]) for (const y of [7.55, 8.45]) wireSegment([s * 5.15, y, z], [s * 6.2, y + .18, z]);
  }
  const priceTexts = ['一斤100', '大特價', '試吃', '烏魚子', '開心果', '肉乾', '香菇', '年菜'];
  let boardN = 0;
  [-1, 1].forEach(side => { for (let k = 0; k < 15; k++) {
    const z = -199 - k * 6 + (rnd() - 0.5) * 1.5, x = side * 5.0;
    const shopAccess = z < -190 && z > -230 && (k === 1 || k === 4);
    if (!shopAccess) stalls.push({ x, z, r: side > 0 ? -Math.PI / 2 : Math.PI / 2, w: 1, d: 1, h: HA(1) });          // table, goods, canopy, posts: stall.glb (issue #5)
    if (shopAccess) continue;
    if (k < 4) appliedPrint(priceTexts[boardN++ % 8], 'verm', 'bone', false, 'x', x - side * 0.85, 0.95, z + 0.4, 0.42, ALL);   // red paper, written
    else fest.push({ x: x - side * 0.85, y: 0.95, z: z + 0.4, w: 0.05, d: 0.9, r: 0, c: C('verm'), h: HA(0.42) });         // red paper, plain
    fest.push({ x: x - side * 0.85, y: 0.95, z: z - 0.9, w: 0.05, d: 0.6, r: 0, c: C(k % 2 ? 'verm' : 'bone'), h: HA(0.36) });
  } });
  shops.forEach(s => fest.push({ x: s.fx - s.s * 0.05, y: 1.9, z: s.z, w: 0.06, d: s.span * 0.6, r: 0, c: C('verm'), h: HA(0.9) }));   // 春聯 on the shop walls
  clothBanner('年貨大街', -193);
  clothBanner('恭喜發財', -252);
  // Finalize once, before instSet bakes its per-vertex AO attribute.
  wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePos, 3)); wireGeo.setIndex(wireIdx); wireGeo.computeVertexNormals(); wireGeo.computeBoundingSphere();
  instSet(wireGeo, lam('ink'), [{ x: 0, z: 0, w: 1, d: 1, h: HA(1) }]);
  asset('nianhuo-stall', lib, 4.2, -226.5, -Math.PI / 2);
  asset('new-year-market-stall', lib, -4.2, -232.5, Math.PI / 2);

  // ── the instanced sets ──
  // (issue #3 step 2) the sets that mix red brick and plaster are split in two so the brick items
  // carry the brick surface family and the rest plaster; the colour still comes from the instance,
  // the material stays bone under it
  const BRICK = C('brick').getHex();
  const brickSplit = (geo, items) => {
    const isB = it => it.c && it.c.getHex() === BRICK;
    const b = items.filter(isB), o = items.filter(it => !isB(it));
    if (b.length) instSet(geo, lam('bone', { surface: 'brick' }), b, { colors: true });
    if (o.length) instSet(geo, lam('bone'), o, { colors: true });
  };
  brickSplit(boxGeo, cols);
  brickSplit(boxGeo, bodies);
  instSet(boxGeo, lam('bone'), goods, { colors: true });
  instSet(cylGeo, lam('bone'), jars, { colors: true });
  // A sign request is resolved against the bay that actually carries it. In zone 1,
  // projecting boxes bolt to masonry pilasters; low Min roofs use arcade piers.
  // Horizontal shop strips sit on the lintel at the back of the covered passage.
  // No facade at that position means no sign, rather than an imaginary wall.
  const occupied = new Set();
  signRequests.forEach(args => {
    let [text, bg, fg, vertical, axis, x, y, z, h, eras] = args;
    if (z <= -190 || z > -150) { SIGNAGE.light(...args); return; }
    const host = facades.find(f => f.side === Math.sign(x) && z <= f.z0 && z >= f.z1 && !f.open);
    if (!host) return;
    let wall;
    if (axis === 'z') {
      const low = host.reference && host.style === 'min';
      const edges = host.reference ? [-2.18, 2.18] : [2.1];
      const slots = edges.map(edge => host.zc + host.side * edge * host.width / 4.6);
      slots.sort((a, b) => Math.abs(a - z) - Math.abs(b - z));
      z = slots.find(slot => !occupied.has(host.side + ':' + slot));
      if (z === undefined) return; // one case per pilaster, never overlapping duplicates
      occupied.add(host.side + ':' + z);
      y = low ? .85 : 4.45; h = Math.min(h, low ? 1.85 : 2.6);
      wall = FACE - (low ? .47 : host.reference ? .30 : .35);
    } else if (y < 4) {
      z = host.zc; y = 3.12; h = .32;
      wall = host.reference ? FACE + 2.72 : FACE + 3.10;
      const key = host.side + ':lintel:' + z;
      if (occupied.has(key)) return;
      occupied.add(key);
    } else {
      z = host.zc; y = 4.4; h = .32; wall = FACE - .04;
    }
    SIGNAGE.light(text, bg, fg, vertical, axis, x, y, z, h, eras,
      { wall, host: { side: host.side, z0: host.z0, z1: host.z1, style: host.style } });
  });
  SIGNAGE.finish();
  window.__dadaoSigns = () => ({ count: SIGNAGE.records.length, records: SIGNAGE.records });
  instSet(sphGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), lant, { colors: true });
  instSet(boxGeo, lam('bone'), fest, { colors: true });
  MODELS.load('stall', gltf => MODELS.instance(gltf.scene, stalls, { emissive: 0.5 }));
  MODELS.load('props', gltf => {
    MODELS.instance(MODELS.node(gltf.scene, 'sack'), sacks);
    MODELS.instance(MODELS.node(gltf.scene, 'crate'), crates);
    MODELS.instance(MODELS.node(gltf.scene, 'bicycle'), bikes);
  });
  people(figs);
  // Legacy vehicle descriptors still consume the same random sequence; the detailed
  // scooters above replace their box geometry without moving any other seeded props.
})();
