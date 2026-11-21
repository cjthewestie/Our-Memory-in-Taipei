// scene-tower.js — chapter scene detail: Taipei 101, 2004–now. Xinyi at night.
// Region z -290 … -460. Everything modern exists in the tower era only; the same ground
// carries rice paddies and farmhouses in the two earlier eras, so scrolling back reads
// "fields, then the tallest building on earth". Primitives and the palette, plus the 101 glb (issue #5).
//
// The tower itself, 新光三越 A11, the 空橋 skywalks and the City Hall silhouette are built here
// from real references (see HANDOFF.md). This file sets TOWER.h, TOWER.faceX and the label top.
//
// The compound geometries below (base at y = 0, height normalised to 1, coloured per vertex)
// predate the engine hiding absent instances; they still give one draw call per set.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, TOWER, withFog, anchors, lit, libGroup, people } = window.SCENE;

  const tw = h => ({ red: 0, dadao: 0, tower: h });      // instSet heights: tower era only
  const old = h => ({ red: h, dadao: h, tower: 0 });     // instSet heights: fields era only
  const TW = (h, col) => only(['tower'], h, col);        // part look: tower era only
  const OLD = (h, col) => only(['red', 'dadao'], h, col);
  const TZ = TOWER.z, TX = TOWER.x;
  const cjk = px => `700 ${px}px -apple-system, "PingFang TC", "Heiti TC", "Noto Sans CJK TC", "Helvetica Neue", sans-serif`;

  // ── compound geometry: several boxes merged, base at y = 0, height normalised to 1 ──
  // pieces: { x, y, z, w, h, d, col } in world units (y = base of that box). H = total height.
  // The whole thing is nudged up by LIFT so the era-collapsed plate (scale.y ≈ 0) lands at
  // y = -LIFT, under the ground plane, instead of z-fighting on it. Items use y: -LIFT, h: H.
  const LIFT = 0.05;
  function compound(pieces, H) {
    const pos = [], nor = [], uv = [], col = [];
    pieces.forEach(p => {
      const g = new THREE.BoxGeometry(p.w, p.h, p.d).toNonIndexed();
      g.translate(p.x || 0, (p.y || 0) + p.h / 2, p.z || 0);
      const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array, c = C(p.col);
      for (let i = 0; i < P.length; i += 3) { pos.push(P[i], (P[i + 1] + LIFT) / H, P[i + 2]); nor.push(N[i], N[i + 1], N[i + 2]); col.push(c.r, c.g, c.b); }
      for (let i = 0; i < U.length; i++) uv.push(U[i]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return geo;
  }
  const vcMat = () => lit({ vertexColors: true });
  // place a compound: w/d scale the footprint (1 = as drawn), h is the era-height map
  const at = (x, z, hMap, w, d, r) => ({ x, z, y: -LIFT, w: w || 1, d: d || 1, r: r || 0, h: hMap });
  // a plain box whose base sits half its height above its origin: item y = -h/2 puts the base on the
  // ground and the collapsed plate at -h/2, under it. For thin ground things.
  const liftGeo = new THREE.BoxGeometry(1, 1, 1); liftGeo.translate(0, 1, 0);
  const flat = (x, z, w, d, h, hMap, c, r) => ({ x, z, y: -h / 2, w, d, r: r || 0, c, h: hMap });

  // ── lit-window facade: colour map (bone with ink windows) + emissive map (lamp windows on ink) ──
  // Roof and floor faces of the box get their UVs pinched into a blank corner of the canvas so the
  // roofs read dark from the high closing shot. Three height classes so window rows scale sensibly.
  function facadeGeo() {
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const uv = g.attributes.uv;
    for (let i = 8; i < 16; i++) uv.setXY(i, 0.01, 0.01); // +y (8..11) and -y (12..15) faces
    uv.needsUpdate = true;
    return g;
  }
  function winTex(cols, rows, lit, seed) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = lit ? PALETTE.ink : PALETTE.bone; g.fillRect(0, 0, 128, 256);
    const cw = 128 / cols, ch = 256 / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const on = ((i * 7 + j * 13 + seed) % 5) !== 0;
      g.fillStyle = lit ? (on ? PALETTE.lamp : PALETTE.ink) : PALETTE.ink;
      g.fillRect(i * cw + cw * 0.3, j * ch + ch * 0.3, cw * 0.4, ch * 0.42);
    }
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  const facadeMat = (cols, rows, seed) => lit({
    color: C('haze'), map: winTex(cols, rows, false, seed),
    emissive: C('lamp'), emissiveMap: winTex(cols, rows, true, seed), emissiveIntensity: 0.5 });

  // ── 台北101 ─────────────────────────────────────────────────────────────────
  // Real profile: a 6-storey mall podium; a tapering pedestal (floors 1–25, a truncated pyramid
  // wider at the ground); four 古錢 coin ornaments on the faces at the 26th floor; eight 斗-shaped
  // segments of eight floors, each flaring 7° outward as it rises so its top overhangs the next
  // one's base (the bamboo joints); a 如意 at every segment's four bottom corners; a tapering
  // crown (floors 91–101); the spire. Glass is the palette's glass with a lit-window grid.
  const PODIUM_H = 7, PED_Y0 = PODIUM_H, PED_Y1 = 30, PED_HB = 8.5, PED_HT = 6.0;
  const SEG_H = 8.5, SEG_N = 8, SEG_HB = 5.2, SEG_HT = 6.6, SEG_Y0 = PED_Y1;
  const CROWN_Y0 = SEG_Y0 + SEG_N * SEG_H, CROWN_H = 8, CROWN_HB = 5.5, CROWN_HT = 3.2;
  const CROWN_Y1 = CROWN_Y0 + CROWN_H, MECH_H = 3, MAST_H = 2, SPIRE_H = 18;
  const SPIRE_TOP = CROWN_Y1 + MECH_H + MAST_H + SPIRE_H;
  // Issue #5 step 2: the tower is a glb built by asset/blender/tower101.py from the same profile
  // constants (podium, pedestal, coins, eight flared segments with 如意, crown, mast, spire), with
  // per-floor bands and mullions as geometry, loaded here in place of the frusta and the lit-window
  // canvas. Tower era only; front toward +z, no rotation. TOWER.faceX below is unchanged.
  const towerGroup = libGroup(['tower']);
  MODELS.load('tower101', gltf => {
    const root = MODELS.lambertize(gltf.scene);
    root.position.set(TX, 0, TZ);
    towerGroup.add(root);
  });
  // what the engine needs: the crown top for the climb, the west-face x at any height, the label top
  TOWER.h = CROWN_Y1;
  TOWER.faceX = y => {
    let hw;
    if (y < PED_Y0) hw = 15;
    else if (y < PED_Y1) hw = PED_HB + (PED_HT - PED_HB) * (y - PED_Y0) / (PED_Y1 - PED_Y0);
    else if (y < CROWN_Y0) { const t = ((y - SEG_Y0) % SEG_H) / SEG_H; hw = SEG_HB + (SEG_HT - SEG_HB) * t; }
    else if (y < CROWN_Y1) hw = CROWN_HB + (CROWN_HT - CROWN_HB) * (y - CROWN_Y0) / CROWN_H;
    else hw = 2.1;
    return TX - hw - 0.62;
  };
  anchors.tower101.top = SPIRE_TOP + 2;

  // ── the ring of office towers and malls ─────────────────────────────────────
  // ground-based boxes: their collapsed plates lie inside the paddy slab in the earlier eras
  const bld = [];
  const addB = (x, z, w, d, h, mall) => bld.push({ x, z, w, d, h: tw(h), top: h, mall });
  // both sides of the street, outside |x| = 18; outermost while the malls sit inside
  for (let z = -300; z >= -470; z -= 16) [-1, 1].forEach(s => {
    const i = Math.round(-z / 16);
    let x = i % 2 ? 22 : 31, w = 8 + rnd() * 5, d = 8 + rnd() * 5;
    let h = 20 + rnd() * 40;
    if (s < 0 && z <= -360) h = 12 + rnd() * 5;                        // low on the west beyond the skywalk: the City Hall silhouette shows over them
    if (z < -386 && z > -446) x = 36;
    if (s < 0 && Math.abs(z + 386) < 14) { x = 40; w = 8; d = 8; } // clear of the closing camera
    addB(s * x, z, w, d, h, false);
  });
  // behind the tower, beyond z = -440; kept lower right behind the tower so its silhouette stands
  [[-454, [-36, -24, -12, 0, 12, 24, 36]], [-470, [-30, -18, -6, 6, 18, 30]]].forEach(([z, xs]) =>
    xs.forEach(x => addB(x, z, 8 + rnd() * 5, 8 + rnd() * 5, x < -10 ? 10 + rnd() * 5 : (Math.abs(x) < 14 ? 20 + rnd() * 18 : 24 + rnd() * 36), false)));
  // three malls a side, low and wide, facing the plaza; tall enough to carry a wall screen at 13.2–15.6
  [-1, 1].forEach(s => [-394, -416, -438].forEach((z, i) => { if (s > 0 && i === 0) return; addB(s * 22, z, 10, 14, 17 + i * 2 + rnd() * 3, true); }));

  const fGeo = facadeGeo();
  instSet(fGeo, facadeMat(5, 7, 1), bld.filter(b => b.top < 30));
  instSet(fGeo, facadeMat(5, 12, 2), bld.filter(b => b.top >= 30 && b.top < 45));
  instSet(fGeo, facadeMat(5, 17, 3), bld.filter(b => b.top >= 45));

  // skybridges between the malls, one level up (part(): hidden outright in the other eras)
  [-1, 1].forEach(s => [-405, -427].forEach(z => part(s * 22, 8, z, 2.4, 8, TW(0.5, 'bone'))));
  // a glass-walk link from each front mall toward the plaza edge
  [-1, 1].forEach(s => part(s * 17.8, 8, -394, 2.4, 2, TW(0.5, 'bone')));

  // ── 新光三越 A11 ────────────────────────────────────────────────────────────
  // The department store across from the 101 podium: a 12-storey block with the big rounded
  // corner toward the road, an LED wall on the road face, the red square logo near the top.
  const A11 = { x0: 14, x1: 30, z0: -403, z1: -385, h: 34, r: 6 };
  (() => {
    const cx = A11.x0 + A11.r, cz = A11.z1 - A11.r;                      // the rounded corner's axis
    const fm = () => { const m = lit({ color: C('haze') }); return m; };
    const body = part((A11.x0 + A11.r + A11.x1) / 2, 0, (A11.z0 + A11.z1) / 2, A11.x1 - A11.x0 - A11.r, A11.z1 - A11.z0, TW(A11.h, 'bone'));
    const wing = part((A11.x0 + cx) / 2, 0, (A11.z0 + cz) / 2, cx - A11.x0, cz - A11.z0, TW(A11.h, 'bone'));
    const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 24); cyl.translate(0, 0.5, 0);
    const corner = part(cx, 0, cz, A11.r * 2, A11.r * 2, TW(A11.h, 'bone'), 0, cyl);
    [[body, 4, 12], [wing, 2, 12], [corner, 10, 12]].forEach(([p, cols, rows]) => {
      const m = p.mesh.material;
      m.map = winTex(cols, rows, false, 4); m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(1, 1);
      m.emissive = C('lamp'); m.emissiveMap = winTex(cols, rows, true, 4); m.emissiveIntensity = 0.5; m.needsUpdate = true;
    });
    part(cx + 1, A11.h, cz - 5, 16, 8, TW(1.2, 'haze'));                   // roof plant
    // the red square logo, road face, near the top
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.verm; g.fillRect(0, 0, 256, 256);
    g.fillStyle = PALETTE.bone; g.font = cjk(92); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('新光', 128, 78); g.fillText('三越', 128, 178);
    const logo = part(A11.x0 - 0.2, A11.h - 6.5, A11.z0 + 4.5, 0.4, 4.4, TW(4.4, 'verm'));
    logo.mesh.material.map = new THREE.CanvasTexture(cv); logo.mesh.material.emissive = C('verm'); logo.mesh.material.emissiveMap = logo.mesh.material.map; logo.mesh.material.emissiveIntensity = 0.35; logo.mesh.material.needsUpdate = true;
    // the entrance canopy under the rounded corner, toward the road
    part(A11.x0 - 1.4, 4.2, (A11.z0 + cz) / 2, 3, cz - A11.z0 - 1, TW(0.3, 'haze'));
  })();

  // ── 信義空橋: the elevated skywalks ──────────────────────────────────────────
  // One bridge crosses the road at z -392 (deck y 6.5, clear of the camera which is
  // at y 5 → 3 here), with railings, a light canopy on slender posts, and a stair ramp down to
  // each sidewalk; one more segment runs along the mall fronts from A11 to the next mall.
  const rampGeo = (() => { const g = new THREE.BoxGeometry(1.6, 0.25, 7.6); g.rotateX(Math.atan2(6.35, 7)); g.translate(0, 3.3, -3.5); return g; })();
  const pale = p => { p.mesh.material = withFog(new THREE.MeshBasicMaterial({ color: C('haze') })); return p; }; // unlit haze: the underside stays soft when the camera passes below
  function skywalk(z) {
    const W = 18, D = 3.6, Y = 6.5;
    pale(part(0, Y, z, W, D, TW(0.2, 'haze')));                                               // deck
    [-1, 1].forEach(s => part(0, Y + 0.25, z + s * (D / 2 - 0.05), W, 0.06, TW(1.1, 'haze'))); // glass railings
    [-1, 1].forEach(s => part(0, Y + 1.3, z + s * (D / 2 - 0.05), W, 0.1, TW(0.08, 'bone')));  // handrails
    [-1, 1].forEach(s => { [-1, 1].forEach(sz => part(s * 8, 0, z + sz * 1.2, 0.6, 0.6, TW(Y, 'haze'))); }); // pillars on the sidewalks
    [-1, 1].forEach(s => pale(part(s * 8.2, 0.2, z + D / 2, 1, 1, TW(1, 'bone'), 0, rampGeo)));  // stair ramps down toward the camera
  }
  skywalk(-392);   // one crossing: at -352 the deck filled the top of the frame as the camera passed under it
  (() => {  // along the mall fronts, A11 → the next mall (z -409), plaza side
    const x = A11.x0 + 1.6, z0 = A11.z0, z1 = -409, Y = 6.5;
    pale(part(x, Y, (z0 + z1) / 2, 3, z0 - z1, TW(0.2, 'haze')));
    part(x - 1.45, Y + 0.25, (z0 + z1) / 2, 0.06, z0 - z1, TW(1.1, 'haze'));
    [z0 - 0.5, z1 + 0.5].forEach(z => part(x - 1.2, 0, z, 0.5, 0.5, TW(Y, 'haze')));
  })();

  // ── 台北市政府 on the horizon: a wide symmetrical stepped silhouette, unlit, in haze ──
  (() => {
    // Drawn at 1.7× so the outline clears the office ring from the approach camera; it is a horizon
    // silhouette, so presence matters more than metric scale. Centre block, two wings, two end pavilions.
    const x = -46, z = -505, d = 50, k = 1.7;
    const basic = () => withFog(new THREE.MeshBasicMaterial({ color: C('haze') }));
    [[0, 24, 30], [-22, 20, 22], [22, 20, 22], [-38, 12, 14], [38, 12, 14]].forEach(([dx, w, h]) => {
      const p = part(x + dx * k, 0, z, w * k, d, TW(h * k, 'haze'));
      p.mesh.material = basic();
    });
    const p = part(x, 30 * k, z, 10 * k, 10 * k, TW(4 * k, 'haze')); p.mesh.material = basic();   // the roof-top block
  })();

  // ── LED billboards: canvas text, lamp on ink, unlit material so it reads as a screen ──
  function ledTex(text) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.ink; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = PALETTE.bone; g.lineWidth = 4; g.strokeRect(14, 14, 484, 100);
    g.fillStyle = PALETTE.lamp;
    g.font = cjk(86);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  // A screen is a box whose base sits (yBase / h) heights above its origin, so it can be
  // instanced at ground level (item y = -LIFT): full height puts it at yBase, the collapsed plate
  // lands just under the ground. Text only on the +z face; every other face is pinched to an ink
  // pixel of the canvas so the sides and back read as the screen's housing.
  function screenGeo(yBase, h) {
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, (yBase + LIFT) / h + 0.5, 0);
    const uv = g.attributes.uv;
    for (let i = 0; i < 24; i++) if (i < 16 || i >= 20) uv.setXY(i, 0.01, 0.01);
    uv.needsUpdate = true;
    return g;
  }
  // r = -π/2 faces -x (east mall wall, seen from the road); r = π/2 faces +x; r = 0 faces the camera coming down -z
  const SH = 2.4;
  instSet(screenGeo(13.2, SH), new THREE.MeshBasicMaterial({ map: ledTex('TAIPEI 101') }), [
    { x: 10, z: -350, y: -LIFT, w: 7, d: 0.3, r: 0, h: tw(SH) },                // on a 13-unit street roof
  ]);
  // A11's LED wall on the road face: the store name, and the block name above it
  instSet(screenGeo(11, 3.2), new THREE.MeshBasicMaterial({ map: ledTex('新光三越') }), [
    { x: A11.x0 - 0.3, z: -397, y: -LIFT, w: 9.5, d: 0.3, r: -Math.PI / 2, h: tw(3.2) },
  ]);
  instSet(screenGeo(18, 2.4), new THREE.MeshBasicMaterial({ map: ledTex('A11') }), [
    { x: A11.x0 - 0.3, z: -397, y: -LIFT, w: 6, d: 0.3, r: -Math.PI / 2, h: tw(2.4) },
  ]);
  // XINYI: wall screen on the west mall, and a rooftop screen raised on two posts so it clears the
  // nearer 13-unit roofs seen from the approach camera
  instSet(screenGeo(16.5, SH), new THREE.MeshBasicMaterial({ map: ledTex('XINYI') }), [
    { x: -16.7, z: -416, y: -LIFT, w: 9, d: 0.3, r: Math.PI / 2, h: tw(SH) },   // west mall wall (mall ≥ 19 tall)
    { x: -10, z: -340, y: -LIFT, w: 7, d: 0.3, r: 0, h: tw(SH) },               // rooftop, on posts
  ]);
  [-12.6, -7.4].forEach(x => part(x, 13.2, -340, 0.3, 0.3, TW(3.3, 'haze')));   // the posts
  part(-10, 13.2, -340, 5.6, 0.3, TW(0.25, 'haze'));                             // cross beam

  // ── the plaza in front of the podium: paved slabs, steps ────────────────────
  [-1, 1].forEach(s => part(s * 13.3, 0, -397, 8.2, 18, TW(0.22, 'bone')));
  part(0, 0, -405.6, 30, 2.8, TW(1.6, 'haze'));   // podium steps
  part(0, 0, -404.2, 30, 1.2, TW(0.8, 'haze'));

  // ── ground-level thin boxes, one coloured set: road paint, paving lines, paddy dykes ──
  const flats = [];
  [-330, -390].forEach(z => { for (let x = -5.4; x <= 5.5; x += 1.35) flats.push(flat(x, z, 0.8, 3.4, 0.1, tw(0.1), C('bone'))); }); // crossings
  [-334.2, -337.8].forEach(z => flats.push(flat(0, z, 11.6, 0.15, 0.1, tw(0.1), C('bone'))));                                    // scooter box
  [-5.8, 5.8].forEach(x => flats.push(flat(x, -336, 0.15, 3.6, 0.1, tw(0.1), C('bone'))));
  [-1, 1].forEach(s => [11.2, 14.4].forEach(x => flats.push(flat(s * x, -397, 0.25, 18, 0.25, tw(0.25), C('haze')))));          // paving lines
  [-1, 1].forEach(s => {
    [9.6, 17, 25, 33, 41].forEach(x => flats.push(flat(s * x, -390, 0.5, 190, 0.45, old(0.45), C('haze'))));                    // dykes
    for (let z = -300; z >= -480; z -= 17) flats.push(flat(s * 26, z, 36, 0.5, 0.45, old(0.45), C('haze')));
  });
  instSet(liftGeo, lit({ color: C('bone') }), flats, { colors: true });

  // ── plaza furniture: planters (haze box, ink plant) and benches (haze legs, bone slab) ──
  const planterGeo = compound([
    { w: 1.6, h: 0.5, d: 1.6, col: 'haze' },
    { y: 0.5, w: 1.3, h: 1.0, d: 1.3, col: 'ink' }], 1.5);
  const planters = [];
  [-1, 1].forEach(s => { for (let i = 0; i < 5; i++) planters.push(at(s * (10.2 + i * 1.6), -389.5 - (i % 2) * 15.5, tw(1.5))); });
  instSet(planterGeo, vcMat(), planters);
  const benchGeo = compound([
    { z: -0.8, w: 0.1, h: 0.4, d: 0.1, col: 'haze' }, { z: 0.8, w: 0.1, h: 0.4, d: 0.1, col: 'haze' },
    { y: 0.4, w: 0.5, h: 0.12, d: 2, col: 'bone' }], 0.52);
  const benches = [];
  [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) benches.push(at(s * 16.2, -391 - i * 4, tw(0.52))); });
  instSet(benchGeo, vcMat(), benches);

  // ═══ the signage (2026-09-24, docs/briefs/FOCUS-signs.md), on scene-red.js's rule and code ═══
  // CJ, 2026-09-24: 「有點累先把招牌跟布條還有些應該是立體不應該是字牌的東西弄好」. The rule from
  // chapter 1: if it would cast its own shadow in real life, it is not a plane. Chapter 3 had no
  // signage at all, and its flags and traffic lights were stiff boxes. Now, all 2020–2027:
  //   字牌     mounted letters on the podiums: TAIPEI 101 over the mall entrance, 臺北市政府 on the
  //            City Hall, the malls' names (微風信義, 統一時代, BELLAVITA, 遠百信義 A13, ATT 4 FUN);
  //   店招牌   horizontal light boxes for the retail at the plaza edge, standing off the mall walls;
  //   旗幟     cloth flags on every lamp post of the boulevard, held top and bottom, waving; the
  //            plaza flag poles fly cloth instead of a box;
  //   路牌     bilingual road plates on the signal poles, and the signals themselves: a mast arm
  //            over the road with two heads, a countdown pedestrian head on every pole;
  //   公車站   the smart stop board with routes and arrival minutes, a 公車站 flag on top, and a
  //            paper poster on the shelter's panel (paper stays flat);
  //   a 信義商圈 map totem at the plaza corner.
  // Every face is painted into one runtime atlas; faces, hardware (vertex colours) and the lit
  // lenses are one merged mesh each, four draw calls for the whole chapter, tower era only.
  const CJK = '-apple-system, "PingFang TC", "Heiti TC", "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';
  const lib = libGroup(['tower']);
  const SIGNS = (() => {
    const AW = 2048, AH = 2048, PX = 150;                                         // atlas size, pixels per metre
    const TS = window.SCENE.TEX_SCALE;                                           // smaller on a phone: see scene-red.js SIGNS
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
    const centre = () => { g.textAlign = 'center'; g.textBaseline = 'middle'; };
    const FG = { verm: 'bone', lamp: 'ink', bone: 'verm', ink: 'lamp', haze: 'ink', sky: 'ink', walk: 'verm', leaf: 'bone', brick: 'bone' };

    // ── the faces, painted into the atlas ────────────────────────────────────────
    // a light-box face: the diffuser lit from behind, a thin inner line, the text
    function lightFace(text, wm, hm, bg) {
      const r = alloc(wm * PX, hm * PX), { x, y, w, h } = r;
      g.fillStyle = P(bg); g.fillRect(x, y, w, h);
      const grd = g.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
      grd.addColorStop(0, 'rgba(255,255,255,0.22)'); grd.addColorStop(1, 'rgba(0,0,0,0.10)');
      g.fillStyle = grd; g.fillRect(x, y, w, h);
      g.strokeStyle = P(FG[bg] || 'ink'); g.lineWidth = Math.max(2, Math.min(w, h) * 0.03); g.strokeRect(x + g.lineWidth * 2, y + g.lineWidth * 2, w - g.lineWidth * 4, h - g.lineWidth * 4);
      g.fillStyle = P(FG[bg] || 'ink'); centre(); fit(text, h * 0.6, w * 0.88); g.fillText(text, x + w / 2, y + h / 2 + h * 0.03);
      return uvOf(r);
    }
    // 路牌: Taipei's bilingual plate, white on blue, the English under the Chinese
    function plateFace(zh, en, wm, hm) {
      const r = alloc(wm * PX, hm * PX), { x, y, w, h } = r;
      g.fillStyle = '#1e56a0'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 2; g.strokeRect(x + 4, y + 4, w - 8, h - 8);
      g.fillStyle = '#f4f4f0'; centre();
      fit(zh, h * (en ? 0.5 : 0.62), w * 0.86); g.fillText(zh, x + w / 2, y + h * (en ? 0.36 : 0.52));
      if (en) { fit(en, h * 0.22, w * 0.86, 500); g.fillText(en, x + w / 2, y + h * 0.76); }
      return uvOf(r);
    }
    // the pedestrian signal's face: the countdown over the green walking man
    function pedFace(n) {
      const r = alloc(0.3 * PX, 0.62 * PX), { x, y, w, h } = r;
      g.fillStyle = '#111418'; g.fillRect(x, y, w, h);
      g.fillStyle = '#39d353'; centre(); g.font = font(h * 0.34, 900); g.fillText(String(n), x + w / 2, y + h * 0.26);
      const cx = x + w / 2, cy = y + h * 0.7, u = h * 0.028;
      g.beginPath(); g.arc(cx, cy - 5.2 * u, 1.3 * u, 0, 7); g.fill();
      g.lineWidth = 1.6 * u; g.strokeStyle = '#39d353'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy - 3.6 * u); g.lineTo(cx, cy); g.lineTo(cx - 2.2 * u, cy + 3.6 * u); g.moveTo(cx, cy); g.lineTo(cx + 2.4 * u, cy + 2.4 * u); g.lineTo(cx + 2.0 * u, cy + 4.4 * u);
      g.moveTo(cx, cy - 3 * u); g.lineTo(cx - 2.4 * u, cy - 1 * u); g.moveTo(cx, cy - 3 * u); g.lineTo(cx + 2.4 * u, cy - 2.6 * u); g.stroke();
      return uvOf(r);
    }
    // the smart stop board (智慧站牌): the stop's name over route numbers with arrival minutes
    function stopFace(name, routes) {
      const r = alloc(0.56 * PX, 0.9 * PX), { x, y, w, h } = r;
      g.fillStyle = '#f4f4f0'; g.fillRect(x, y, w, h);
      g.fillStyle = '#1e56a0'; g.fillRect(x, y, w, h * 0.2);
      g.fillStyle = '#f4f4f0'; centre(); fit(name, h * 0.11, w * 0.9); g.fillText(name, x + w / 2, y + h * 0.1);
      g.fillStyle = '#111418'; g.fillRect(x + 4, y + h * 0.22, w - 8, h * 0.76);
      routes.forEach(([no, eta], i) => {
        const yy = y + h * (0.3 + i * 0.13);
        g.textAlign = 'left'; g.fillStyle = '#ffb347'; fit(no, h * 0.085, w * 0.5, 700); g.fillText(no, x + 10, yy);
        g.textAlign = 'right'; g.fillStyle = '#39d353'; fit(eta, h * 0.075, w * 0.4, 500); g.fillText(eta, x + w - 10, yy);
      });
      return uvOf(r);
    }
    // a lamp-post flag: vertical characters on a coloured cloth, a paler hem top and bottom
    function flagFace(text, bg, fg) {
      const r = alloc(0.55 * PX, 1.5 * PX), { x, y, w, h } = r;
      g.fillStyle = P(bg); g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y, w, 6); g.fillRect(x, y + h - 6, w, 6);
      g.fillStyle = P(fg); centre();
      const chars = [...text], cs = Math.min(w * 0.78, h * 0.86 / chars.length);
      g.font = font(Math.floor(cs), 800);
      chars.forEach((c, i) => g.fillText(c, x + w / 2, y + h / 2 + (i - (chars.length - 1) / 2) * cs * 1.04));
      return uvOf(r);
    }
    // a plain cloth for the plaza flags: a colour, a shade band at the hoist, an optional word
    function clothFace(bg, text) {
      const r = alloc(1.4 * PX * 0.6, 0.8 * PX * 0.6), { x, y, w, h } = r;
      g.fillStyle = P(bg); g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, w * 0.08, h);
      if (text) { g.fillStyle = P(FG[bg] || 'ink'); centre(); fit(text, h * 0.6, w * 0.8, 900); g.fillText(text, x + w / 2, y + h / 2); }
      return uvOf(r);
    }
    // paper: the 跨年 fireworks poster on the shelter's panel, the tower drawn as its segments
    function posterFace() {
      const r = alloc(1.0 * PX, 1.4 * PX), { x, y, w, h } = r;
      g.fillStyle = '#1b2447'; g.fillRect(x, y, w, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? 'rgba(255,179,71,0.8)' : 'rgba(244,244,240,0.7)'; const a = (i * 2.399) % 6.283, d = 10 + (i * 37) % 48; g.beginPath(); g.arc(x + w * 0.5 + Math.cos(a) * d, y + h * 0.3 + Math.sin(a) * d * 0.8, 2, 0, 7); g.fill(); }
      g.fillStyle = '#5fb0bf';
      for (let i = 0; i < 8; i++) { const sw = w * 0.12 + i * 1.2, sh = h * 0.045; g.fillRect(x + w / 2 - sw / 2, y + h * 0.82 - (i + 1) * sh, sw, sh - 1); }
      g.fillRect(x + w / 2 - 1.5, y + h * 0.36, 3, h * 0.1);
      g.fillStyle = '#f4f4f0'; centre(); fit('跨年 TAIPEI 101', h * 0.09, w * 0.9, 900); g.fillText('跨年 TAIPEI 101', x + w / 2, y + h * 0.9);
      fit("12.31 NEW YEAR'S EVE", h * 0.05, w * 0.9, 500); g.fillText("12.31 NEW YEAR'S EVE", x + w / 2, y + h * 0.96);
      return uvOf(r);
    }
    // the map totem's face: the district's blocks, the road, a you-are-here dot, the title
    function mapFace() {
      const r = alloc(0.8 * PX, 2.2 * PX), { x, y, w, h } = r;
      g.fillStyle = '#f4f4f0'; g.fillRect(x, y, w, h);
      g.fillStyle = '#1e56a0'; g.fillRect(x, y, w, h * 0.14);
      g.fillStyle = '#f4f4f0'; centre(); fit('信義商圈', h * 0.06, w * 0.9, 900); g.fillText('信義商圈', x + w / 2, y + h * 0.05);
      fit('XINYI DISTRICT MAP', h * 0.03, w * 0.9, 600); g.fillText('XINYI DISTRICT MAP', x + w / 2, y + h * 0.105);
      g.fillStyle = '#d9d4c8'; g.fillRect(x + 8, y + h * 0.17, w - 16, h * 0.62);
      g.fillStyle = '#9fb6c9';
      [[0.1, 0.2, 0.3, 0.12], [0.6, 0.2, 0.3, 0.12], [0.1, 0.38, 0.3, 0.18], [0.6, 0.38, 0.3, 0.18], [0.1, 0.62, 0.3, 0.12], [0.6, 0.62, 0.3, 0.12]].forEach(([bx, by, bw, bh]) => g.fillRect(x + w * bx, y + h * by, w * bw, h * bh));
      g.fillStyle = '#5fb0bf'; g.fillRect(x + w * 0.38, y + h * 0.4, w * 0.24, h * 0.14);   // 101's block
      g.fillStyle = '#f4f4f0'; g.fillRect(x + w * 0.45, y + h * 0.17, w * 0.1, h * 0.62);   // the road
      g.fillStyle = '#d9483b'; g.beginPath(); g.arc(x + w * 0.5, y + h * 0.7, 6, 0, 7); g.fill();
      g.fillStyle = '#2b2f3a'; fit('您在此處 You are here', h * 0.03, w * 0.9, 600); g.fillText('您在此處 You are here', x + w / 2, y + h * 0.84);
      fit('台北101 · 新光三越 · 微風信義', h * 0.025, w * 0.9, 500); g.fillText('台北101 · 新光三越 · 微風信義', x + w / 2, y + h * 0.92);
      return uvOf(r);
    }

    // ── geometry accumulators ────────────────────────────────────────────────────
    const lit = { pos: [], uv: [], idx: [] }, flat = { pos: [], uv: [], idx: [] };
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    function quad(acc, c, right, up, w, h, uv) {
      const b = acc.pos.length / 3, [u0, u1, v0, v1] = uv;
      [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]].forEach(([sx, sy, u, v]) => {
        const p = c.clone().addScaledVector(right, sx * w / 2).addScaledVector(up, sy * h / 2);
        acc.pos.push(p.x, p.y, p.z); acc.uv.push(u, v);
      });
      acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const hw = { pos: [], nor: [], col: [] }, glow = { pos: [], nor: [], col: [] };
    const unit = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    const M = new THREE.Matrix4(), NM = new THREE.Matrix3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Z = V3(0, 0, 1), UP = V3(0, 1, 0);
    function pushBox(acc, m, col) {
      const p = unit.attributes.position, n = unit.attributes.normal, c = C(col), v = new THREE.Vector3();
      NM.getNormalMatrix(m);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m); acc.pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(NM).normalize(); acc.nor.push(v.x, v.y, v.z);
        acc.col.push(c.r, c.g, c.b);
      }
    }
    const box = (cx, cy, cz, sx, sy, sz, col, rotY, acc) => { Q.setFromAxisAngle(UP, rotY || 0); M.compose(V3(cx, cy, cz), Q, S.set(sx, sy, sz)); pushBox(acc || hw, M, col); };
    function bar(p0, p1, t, col, acc) {
      const d = p1.clone().sub(p0), len = d.length();
      Q.setFromUnitVectors(Z, d.normalize());
      M.compose(p0.clone().add(p1).multiplyScalar(0.5), Q, S.set(t, t, len)); pushBox(acc || hw, M, col);
    }
    // a cloth grid from the top edge a → b, h tall, sagging by `sag`, bellying along n, with wrinkles
    function cloth(a, b, h, sag, n, uv, free) {
      const [u0, u1, v0, v1] = uv, NX = 16, NY = 4, base = flat.pos.length / 3, ph = (a.x * 3.1 + a.z * 1.7) % 6.28;
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
        const t = i / NX, v = j / NY, bow = free ? t : 4 * t * (1 - t);           // free: the fly end droops; else both ends held
        const p = a.clone().lerp(b, t);
        p.y += -sag * bow * (1 + 0.35 * v) - h * v;
        const wr = (0.035 * Math.sin(t * Math.PI * 5 + ph) + 0.02 * Math.sin(t * Math.PI * 13 + ph * 2)) * (0.3 + 0.7 * (free ? t : v)) * (0.4 + bow);
        p.addScaledVector(n, wr + 0.05 * bow * v);
        flat.pos.push(p.x, p.y, p.z); flat.uv.push(u0 + (u1 - u0) * t, v1 - (v1 - v0) * v);
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const k = base + j * (NX + 1) + i;
        flat.idx.push(k, k + NX + 1, k + 1, k + 1, k + NX + 1, k + NX + 2);
      }
    }
    let count = 0;

    // ── the kinds ────────────────────────────────────────────────────────────────
    // 店招牌: a horizontal light box flat on a wall, standing off on two brackets. side = sign of
    // the wall's x (the road is toward -side), wallX its |x|, z the centre along the street.
    function hbox(text, side, wallX, z, y0, w, h, bg) {
      const D = 0.14, x = side * (wallX - 0.1 - D / 2), yc = y0 + h / 2;
      box(x, yc, z, D, h, w, 'haze');
      quad(lit, V3(x - side * (D / 2 + 0.012), yc, z), V3(0, 0, side > 0 ? 1 : -1), UP, w - 0.05, h - 0.05, lightFace(text, w - 0.05, h - 0.05, bg));
      [yc + h / 2, yc - h / 2].forEach(yy => box(x - side * 0.01, yy, z, D + 0.03, 0.03, w + 0.03, 'bone'));
      [z - w / 2, z + w / 2].forEach(zz => box(x - side * 0.01, yc, zz, D + 0.03, h + 0.03, 0.03, 'bone'));
      [z - w * 0.35, z + w * 0.35].forEach(zz => bar(V3(side * wallX, yc, zz), V3(x, yc, zz), 0.035, 'ink'));
      count++;
    }
    // 字牌: characters mounted off a wall on studs. c = the text's centre on the wall, nrm the
    // wall's outward normal (unit), right the reading direction seen from outside. Each glyph is
    // a cut-out (alpha-tested, so its shadow is glyph-shaped) in four layers for the letter's depth.
    const glyphCache = {};
    function glyph(ch, col) {
      const k = ch + col; if (glyphCache[k]) return glyphCache[k];
      const r = alloc(128, 128), { x, y } = r;
      g.clearRect(x, y, 128, 128); g.fillStyle = P(col); centre(); g.font = font(118, 900);
      g.fillText(ch, x + 64, y + 68);
      return (glyphCache[k] = uvOf(r));
    }
    function letters(text, c, nrm, right, size, col, sideCol) {
      const chars = [...text], n = chars.length;
      const wide = ch => /[A-Za-z0-9 ]/.test(ch) ? 0.62 : 1.0;                     // Latin glyphs are narrower than CJK
      const widths = chars.map(ch => size * wide(ch) * 1.06), total = widths.reduce((a, b) => a + b, 0);
      let u = -total / 2;
      chars.forEach((ch, i) => {
        const cc = c.clone().addScaledVector(right, u + widths[i] / 2); u += widths[i];
        if (ch === ' ') return;
        for (let l = 0; l < 4; l++) quad(flat, cc.clone().addScaledVector(nrm, 0.05 + l * 0.015), right, UP, size, size, glyph(ch, l < 3 ? sideCol : col));
        const s = cc.clone().addScaledVector(nrm, 0.025);
        box(s.x, s.y, s.z, Math.abs(nrm.x) > 0.5 ? 0.05 : 0.04, 0.04, Math.abs(nrm.z) > 0.5 ? 0.05 : 0.04, 'ink');   // the stud
      });
      count++;
    }
    // 路牌 on a pole at (x, z), y its centre; alongX = the plate reads along the street
    function plate(x, y, z, zh, en, alongX) {
      const w = 1.0, h = 0.34, uv = plateFace(zh, en, w, h), s = Math.sign(-x) || 1;
      const c = alongX ? V3(x + s * (w / 2 + 0.06), y, z) : V3(x, y, z + w / 2 + 0.06);
      const r = alongX ? V3(s, 0, 0) : V3(0, 0, -1), nrm = alongX ? V3(0, 0, 1) : V3(1, 0, 0);
      box(c.x, y, c.z, alongX ? w + 0.04 : 0.03, h + 0.04, alongX ? 0.03 : w + 0.04, 'haze');
      quad(flat, c.clone().addScaledVector(nrm, 0.028), r, UP, w, h, uv);
      quad(flat, c.clone().addScaledVector(nrm, -0.028), r.clone().negate(), UP, w, h, uv);
      bar(V3(x, y + 0.12, z), c.clone().setY(y + 0.12), 0.03, 'haze'); bar(V3(x, y - 0.12, z), c.clone().setY(y - 0.12), 0.03, 'haze');
    }
    // a signal pole at a crossing corner. facing = the z direction its vehicle heads look (+1
    // toward the camera coming down -z); mast = carry an arm over the road with two heads. Every
    // pole gets the countdown pedestrian head facing across the road, a push button, its plates.
    function signal(x, z, facing, mast, plates, secs) {
      const side = Math.sign(x);
      box(x, 3.1, z, 0.24, 6.2, 0.24, 'haze'); box(x, 6.24, z, 0.3, 0.08, 0.3, 'haze');
      if (mast) {
        bar(V3(x, 6.05, z), V3(side * 1.6, 5.85, z), 0.14, 'haze'); bar(V3(x, 5.0, z), V3(side * 4.2, 5.9, z), 0.05, 'haze');   // the arm and its stay
        [side * 2.6, side * 5.2].forEach(hx => {
          const hy = 5.15, D = 0.34, f = z + facing * (D / 2 + 0.015);
          box(hx, hy, z, 0.42, 1.2, D, 'ink');
          bar(V3(hx, hy + 0.6, z), V3(hx, 5.9, z), 0.05, 'ink');
          [['verm', 0.36], ['lamp', 0], ['leaf', -0.36]].forEach(([c, dy]) => {
            box(hx, hy + dy, f, 0.28, 0.28, 0.03, c, 0, glow);
            box(hx, hy + dy + 0.17, f + facing * 0.06, 0.34, 0.03, 0.16, 'ink');                        // visor
          });
        });
      }
      const pf = pedFace(secs), px = x - side * 0.27, D = 0.26;
      box(px, 2.75, z, D, 0.66, 0.32, 'ink');
      quad(lit, V3(px - side * (D / 2 + 0.012), 2.75, z), V3(0, 0, -side), UP, 0.28, 0.6, pf);
      box(x - side * 0.17, 1.3, z, 0.1, 0.16, 0.12, 'lamp');                                            // the push button
      plates.forEach(([zh, en, y, alongX]) => plate(x, y, z, zh, en, alongX));
      count++;
    }
    // 公車站: the smart board on a pole, the stop's flag on top
    function busStop(x, z, name, routes) {
      const uv = stopFace(name, routes);
      box(x, 1.55, z, 0.09, 3.1, 0.09, 'haze');
      box(x, 2.3, z + 0.06, 0.6, 0.98, 0.04, 'ink');
      quad(lit, V3(x, 2.3, z + 0.09), V3(1, 0, 0), UP, 0.56, 0.9, uv);
      quad(flat, V3(x, 2.3, z + 0.03), V3(-1, 0, 0), UP, 0.56, 0.9, uv);
      const fl = plateFace('公車站', 'Bus Stop', 0.5, 0.3);
      box(x, 3.05, z, 0.54, 0.34, 0.03, 'haze');
      quad(flat, V3(x, 3.05, z + 0.02), V3(1, 0, 0), UP, 0.5, 0.3, fl);
      quad(flat, V3(x, 3.05, z - 0.02), V3(-1, 0, 0), UP, 0.5, 0.3, fl);
      count++;
    }
    // paper: a poster flat on a wall facing -side x (the one kind that is a plane)
    function poster(side, wallX, z, y, w, h) {
      quad(flat, V3(side * (wallX - 0.02), y + h / 2, z), V3(0, 0, side > 0 ? 1 : -1), UP, w, h, posterFace());
      count++;
    }
    // 旗幟 on a lamp post at (x, z): two arms toward the road, the cloth between them, waving
    function flag(x, z, text, bg, fg) {
      const side = Math.sign(x), uv = flagFace(text, bg, fg), [u0, u1, v0, v1] = uv;
      const y0 = 3.5, h = 1.5, w = 0.55, xin = x - side * 0.16, xout = xin - side * w;
      [y0 + h + 0.05, y0 - 0.05].forEach(yy => bar(V3(x, yy, z), V3(xout - side * 0.05, yy, z), 0.035, 'ink'));
      box(x - side * 0.02, y0 + h / 2, z, 0.06, h + 0.3, 0.12, 'ink');                        // the clamp on the post
      const NX = 3, NY = 10, base = flat.pos.length / 3, ph = (z * 0.37) % 6.28;
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
        const t = i / NX, v = j / NY, held = 4 * v * (1 - v);
        const wave = (0.035 * Math.sin(v * 6.5 + ph) + 0.02 * Math.sin(t * 4 + v * 11 + ph)) * held;
        flat.pos.push(xin - side * w * t, y0 + h - h * v, z + wave); flat.uv.push(u0 + (u1 - u0) * t, v1 - (v1 - v0) * v);
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const k = base + j * (NX + 1) + i;
        flat.idx.push(k, k + NX + 1, k + 1, k + 1, k + NX + 1, k + NX + 2);
      }
      count++;
    }
    // a plaza flag pole: the pole, a finial, a cloth flying toward +x from the top, held at the hoist
    function polePlag(x, z, bg, text) {
      box(x, 4.5, z, 0.12, 9, 0.12, 'bone'); box(x, 9.06, z, 0.16, 0.12, 0.16, 'bone');
      cloth(V3(x + 0.08, 8.9, z), V3(x + 1.5, 8.9, z), 0.8, 0.3, V3(0, 0, 1), clothFace(bg, text), true);
      count++;
    }
    // the map totem at the plaza corner: a steel case with the map on both faces
    function totem(x, z) {
      const uv = mapFace();
      box(x, 1.25, z, 0.86, 2.5, 0.16, 'ink'); box(x, 0.05, z, 1.0, 0.1, 0.4, 'ink');
      quad(lit, V3(x, 1.3, z + 0.092), V3(1, 0, 0), UP, 0.8, 2.2, uv);
      quad(lit, V3(x, 1.3, z - 0.092), V3(-1, 0, 0), UP, 0.8, 2.2, uv);
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
      mk(lit, new THREE.MeshLambertMaterial(Object.assign({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.3, alphaTest: 0.5 }, off)));
      mk(flat, new THREE.MeshLambertMaterial(Object.assign({ map: tex, side: THREE.DoubleSide, alphaTest: 0.5 }, off)));
      mk(hw, new THREE.MeshLambertMaterial({ vertexColors: true }));
      if (glow.pos.length) mk(glow, new THREE.MeshBasicMaterial({ vertexColors: true }));
    }
    return { hbox, letters, signal, busStop, poster, flag, polePlag, totem, finish, V3, get count() { return count; } };
  })();
  window.__xinyiSigns = () => SIGNS.count;
  const V = SIGNS.V3;

  // ── 字牌: the buildings' names, mounted letters ──
  SIGNS.letters('TAIPEI 101', V(TX, 5.85, TZ + 13.02), V(0, 0, 1), V(1, 0, 0), 0.9, 'ink', 'haze');             // the podium's front, over the entrance canopy: dark steel letters on the pale wall
  SIGNS.letters('臺北市政府', V(-46, 47, -480), V(0, 0, 1), V(1, 0, 0), 3.4, 'bone', 'haze');                     // City Hall's centre block, the horizon
  SIGNS.letters('微風信義 BREEZE', V(-17, 13.6, -394), V(1, 0, 0), V(0, 0, -1), 1.3, 'verm', 'brick');            // the west mall at the plaza
  SIGNS.letters('統一時代', V(-17, 13.4, -416), V(1, 0, 0), V(0, 0, -1), 1.4, 'sky', 'ink');                       // under the XINYI screen
  SIGNS.letters('BELLAVITA', V(17, 14.2, -416), V(-1, 0, 0), V(0, 0, 1), 1.3, 'bone', 'haze');
  SIGNS.letters('遠百信義 A13', V(17, 15.8, -438), V(-1, 0, 0), V(0, 0, 1), 1.3, 'lamp', 'brick');
  SIGNS.letters('ATT 4 FUN', V(-17, 15.8, -438), V(1, 0, 0), V(0, 0, -1), 1.3, 'verm', 'brick');
  // ── 店招牌: the retail at the plaza edge, light boxes off the mall walls at the first floor ──
  [['星巴克 STARBUCKS', -400.5, 'leaf'], ['屈臣氏', -396.5, 'sky'], ['UNIQLO', -392.6, 'verm']].forEach(([t, z, bg]) => SIGNS.hbox(t, 1, A11.x0, z, 4.7, 3.4, 0.7, bg));   // A11's wing face, over the entrance canopy
  [['春水堂', -399.5, 'bone'], ['全家 FamilyMart', -395.5, 'leaf'], ['鼎泰豐', -391.5, 'verm'], ['麥當勞', -387.6, 'lamp']].forEach(([t, z, bg]) => SIGNS.hbox(t, -1, 17, z, 4.4, 3.4, 0.7, bg));   // the west mall's road face
  [['誠品生活', -412, 'walk'], ['富邦銀行', -420, 'sky']].forEach(([t, z, bg]) => SIGNS.hbox(t, 1, 17, z, 4.4, 5.0, 0.8, bg));
  [['無印良品 MUJI', -412.5, 'bone'], ['7-ELEVEN', -419.5, 'leaf']].forEach(([t, z, bg]) => SIGNS.hbox(t, -1, 17, z, 4.4, 4.6, 0.8, bg));
  // ── the crossings: 松高路 at -330, 松壽路 at -390, on 松智路. Taiwan drives on the right, so
  //    the mast arm faces each approach from its far-right corner; the other corners get plain poles.
  const ROAD = ['松智路', 'Songzhi Rd.'];
  [[-330, '松高路', 'Songgao Rd.', 18], [-390, '松壽路', 'Songshou Rd.', 9]].forEach(([z, zh, en, n]) => {
    const near = z + 3.5, far = z - 3.5;
    SIGNS.signal(-6.4, far, +1, true, [[zh, en, 3.4, true], [ROAD[0], ROAD[1], 3.0, false]], n);    // faces the camera's traffic
    SIGNS.signal(6.4, near, -1, true, [[zh, en, 3.4, true]], n + 3);                                // faces the oncoming lane
    SIGNS.signal(6.4, far, +1, false, [[ROAD[0], ROAD[1], 3.0, false]], n);
    SIGNS.signal(-6.4, near, -1, false, [[zh, en, 3.4, true]], n + 3);
  });
  // ── the bus stop at the shelter (east sidewalk, z -340): the smart board, the poster on the panel ──
  SIGNS.busStop(6.9, -336.6, '松智松高路口', [['信義幹線', '進站中'], ['藍5', '3 分'], ['20', '8 分'], ['22', '12 分'], ['33', '15 分']]);
  SIGNS.poster(1, 9.05, -340.4, 0.85, 1.0, 1.4);
  // ── 旗幟 on every lamp post of the boulevard (the engine's lamps stand at x ±8.5, z 40 − 12k) ──
  const FLAGS = [['信義商圈', 'verm', 'bone'], ['臺北101跨年', 'sky', 'ink'], ['TAIPEI', 'lamp', 'ink'], ['信義區', 'leaf', 'bone']];
  let fi = 0;
  for (let z = -296; z >= -380; z -= 12) [-1, 1].forEach(s => { const f = FLAGS[fi++ % FLAGS.length]; SIGNS.flag(s * 8.5, z, f[0], f[1], f[2]); });
  // ── the plaza flag poles fly cloth: bone flags, one vermilion 101 flag on the east ──
  [-1, 1].forEach(s => [8.6, 11.6, 14.6].forEach((x, i) => SIGNS.polePlag(s * x, -406.6, s > 0 && i === 1 ? 'verm' : 'bone', s > 0 && i === 1 ? '101' : null)));
  SIGNS.totem(9.7, -386.4);
  SIGNS.finish();

  // ── the approach: bus shelter (parts), taxis and scooters (compound sets) ─────
  (() => { // bus shelter on the east sidewalk
    const z = -340;
    part(7.2, 0, z - 1.9, 0.14, 0.14, TW(2.6, 'haze'));
    part(7.2, 0, z + 1.9, 0.14, 0.14, TW(2.6, 'haze'));
    part(8.2, 2.6, z, 2.8, 4.6, TW(0.14, 'haze'));
    part(9.05, 0.3, z, 0.1, 4.2, TW(2.2, 'bone'));
    part(8.6, 0.42, z, 0.5, 3.2, TW(0.1, 'bone'));  // the bench inside
  })();
  const taxiGeo = compound([
    { y: 0.2, w: 1.7, h: 1.1, d: 3.8, col: 'lamp' },
    { y: 1.3, z: -0.2, w: 1.5, h: 0.6, d: 2.0, col: 'bone' },
    { y: 1.9, w: 0.6, h: 0.25, d: 0.25, col: 'verm' }], 2.15);
  instSet(taxiGeo, vcMat(), [[-5.1, -348], [-5.1, -356], [5.1, -378], [5.1, -385]].map(([x, z]) => at(x, z, tw(2.15))));
  const scooterGeo = compound([
    { y: 0.2, w: 0.6, h: 0.8, d: 1.7, col: 'haze' },
    { y: 1.0, w: 0.5, h: 0.9, d: 0.5, col: 'bone' }], 1.9);
  instSet(scooterGeo, vcMat(), [-5.3, -4.5, 4.1, 4.9, 5.6].map((x, i) => at(x, -335.4 - (i % 2) * 0.8, tw(1.9))));

  // ── the crowd (issue #13, the engine's people() figures): the plaza, the sidewalks of the
  //    approach, the shelter and crossing corners, the skywalk deck and the mall-front deck.
  //    Sidewalks and plazas only; the road stays the girl's (CJ, 2026-09-20). ──
  const crowd = [];
  const WALK = 0.22;                                                              // top of the sidewalk and plaza slabs
  for (let i = 0; i < 52; i++) {                                                  // the plaza in front of the podium
    const s = i % 2 ? 1 : -1, x = s * (9.6 + rnd() * 7.2), z = -388.5 - rnd() * 17, h = 1.5 + rnd() * 0.3;
    crowd.push({ x, z, y: WALK, r: rnd() * 6.28, h: tw(h) });
  }
  [[8.4, -341.5], [8.6, -339.2], [7.9, -338.4], [7.4, -324.5], [-7.4, -324.3], [-7.6, -335.4], [7.6, -335.8]].forEach(([x, z]) =>
    crowd.push({ x, z, y: WALK, r: rnd() * 6.28, h: tw(1.6) }));                 // the shelter queue and the crossing corners
  for (let i = 0; i < 60; i++) {                                                  // walkers on both sidewalks from the crossing to the plaza (the 0.66 approach frame)
    const s = i % 2 ? 1 : -1, z = -328 - rnd() * 76, x = s * (6.3 + rnd() * 2.3), h = 1.5 + rnd() * 0.3;
    if (Math.abs(x) < 7 && Math.abs(z + 340) < 2.4 && s > 0) continue;            // the bus shelter
    const fwd = rnd() < 0.5;
    crowd.push({ x, z, y: WALK, r: (fwd ? 0 : Math.PI) + (rnd() - 0.5) * 0.8, h: tw(h) });
  }
  for (let i = 0; i < 12; i++) crowd.push({ x: -7.6 + i * 1.4 + (rnd() - 0.5) * 0.6, z: -392 + (i % 2 ? 0.8 : -0.8), y: 6.7, r: (i % 3 ? Math.PI / 2 : -Math.PI / 2) + (rnd() - 0.5) * 0.6, h: tw(1.5 + rnd() * 0.3) });   // crossing the skywalk deck (the 0.78 base frame)
  [[-404, 1], [-406.5, 1], [-408, 0]].forEach(([z, fwd]) => crowd.push({ x: A11.x0 + 1.6 + 0.5, z, y: 6.7, r: fwd ? 0 : Math.PI, h: tw(1.6) }));   // on the mall-front deck
  people(crowd);

  // ── aircraft-warning lights on the spire top and crown corners: tiny verm cubes, no glow ──
  part(TX, SPIRE_TOP, TZ, 0.4, 0.4, TW(0.5, 'verm'));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => part(TX + sx * (CROWN_HT - 0.3), CROWN_Y1, TZ + sz * (CROWN_HT - 0.3), 0.4, 0.4, TW(0.4, 'verm')));

  // ── the same ground before 2004: rice paddies, farmhouses, banyans and betel palms ──
  [-1, 1].forEach(s => part(s * 26, 0, -390, 36, 190, OLD(0.08, 'bone'))); // water: paper-white paddies, x 8..44, z -295..-485
  const pyr = new THREE.CylinderGeometry(0.02, 0.75, 1, 4); pyr.rotateY(Math.PI / 4); pyr.translate(0, 0.5, 0);
  [[18, -330, 0.3, 3], [-22, -350, -0.2, 4.8], [24, -400, 0.1, 3], [-20, -440, 0.4, 4.8], [14, -455, -0.3, 3]].forEach(([x, z, r, h]) => {
    part(x, 0, z, 4.4, 3.2, OLD(h, 'bone'), r);
    part(x, h, z, 5.4, 4.2, OLD(1.8, 'ink'), r, pyr);
  });
  // broad tree: haze trunk, stepped ink crown. Drawn 9 tall; banyans use it at full size beside the
  // road (tall enough to show over the street trees from a 5-unit camera), farm trees smaller.
  const treeGeo = compound([
    { w: 0.6, h: 4.5, d: 0.6, col: 'haze' },
    { y: 4.2, w: 4.6, h: 3.2, d: 4.0, col: 'ink' },
    { x: 0.4, y: 7.4, w: 2.6, h: 1.6, d: 2.4, col: 'ink' }], 9);
  const trees = [];
  [[11.5, -306], [-11.6, -323], [11.8, -354], [-11.5, -398], [11.6, -436]].forEach(([x, z]) => trees.push(at(x, z, old(9), 1 + rnd() * 0.2, 1 + rnd() * 0.25)));
  [[20, -334], [-25, -346], [27, -404], [-22, -444], [16, -458], [30, -320], [-30, -415], [12, -452]].forEach(([x, z]) =>
    trees.push(at(x, z, old(6.8), 0.72 + rnd() * 0.2, 0.75 + rnd() * 0.2, rnd() * 3)));
  instSet(treeGeo, vcMat(), trees);
  // betel palms along the paddy edge: thin haze trunk well above the street trees, a small ink crown
  const palmGeo = compound([
    { w: 0.32, h: 7.2, d: 0.32, col: 'haze' },
    { y: 6.9, w: 2.2, h: 1.3, d: 2.2, col: 'ink' }], 8.2);
  const palms = [[13.6, -312], [-13.4, -338], [13.8, -368], [-13.6, -384], [13.4, -412], [-13.5, -428], [13.7, -450], [-13.3, -462]]
    .map(([x, z], i) => at(x, z, old(8.2 * (0.9 + (i % 3) * 0.08))));
  instSet(palmGeo, vcMat(), palms);
})();
