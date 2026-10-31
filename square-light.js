// square-light.js — the light of the walk-mode lantern square (CJ, 2026-10-31: "i need the square be more realistic").
// Square-local only: everything here lives in one group that is shown while the visitor is in the square
// and hidden everywhere else, so the street, the scroll film and their frame time are untouched.
//
// What it adds, on top of the engine's sun shadow (app.js `key`, PCF soft, re-centred every frame by sunFollow):
//   1. contact occlusion — multiply-blended ground decals: a dark band at the foot of every inner wall that
//      fades out over the arcade (騎樓) depth, darker inside corners, a ring at the foot of the centre stone and
//      a small blob under each lamp post. Multiply (dst × texel) so a white texel changes nothing.
//   2. storefront spill — additive warm pools on the paving in front of each shop, brightest at the shop line and
//      fading out past the arcade, the 7-Eleven light that leaks onto a Taipei pavement even in the afternoon.
//      Additive and AO roughly cancel on whole-frame luminance; the frame keeps its brightness (HANDOFF: bright).
//   3. a check on the sun's shadow box: if the plaza is not inside it while the visitor is in the square, the box
//      is widened (only its bounds; sunFollow keeps owning the position). Restored on leaving.
// No fog, no night, no sky change (CJ, 2026-09-20: 「CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY」).
//
// API: window.SQUARE_LIGHT = { build(S, SQ, R), update(dt, inSquare), group, stats, enabled }
//   enabled = false turns everything off at the next update (for A/B checks)
//   S  = window.SCENE (scene, C, PALETTE), SQ = walk.js { x, z, h, gate }, R = window.RIG (renderer, camera)
//   build once after the square is built; update every frame from walk.js update().
(function () {
  'use strict';
  const T = window.THREE;
  let group = null, sun = null, box0 = null, widened = false;
  const stats = { aoDecals: 0, spills: 0, sunBox: null, covered: null };

  // a canvas texture from a draw function, linear (no mipmaps needed for soft gradients)
  function canvasTex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new T.CanvasTexture(cv); t.generateMipmaps = false; t.minFilter = t.magFilter = T.LinearFilter;
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    return t;
  }
  const grey = v => { const c = Math.round(255 * v); return `rgb(${c},${c},${c})`; };

  // wall-foot band: v = 0 at the wall, 1 at the far edge. Darkest (0.58) right at the join, a quick contact
  // falloff, then the long soft arcade shade, back to white (no change) at the edge.
  const bandTex = () => canvasTex(4, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, grey(0.58)); gr.addColorStop(0.08, grey(0.72)); gr.addColorStop(0.45, grey(0.88));
    gr.addColorStop(0.8, grey(0.97)); gr.addColorStop(1, grey(1));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  // radial blob: dark at the centre (or at a ring radius r0), white at the edge
  const blobTex = (dark, r0) => canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    const a = r0 || 0;
    if (a > 0) gr.addColorStop(Math.max(0, a - 0.02), grey(1));   // inside the stone: hidden anyway
    gr.addColorStop(a, grey(dark)); gr.addColorStop(a + (1 - a) * 0.25, grey(dark + (1 - dark) * 0.55));
    gr.addColorStop(1, grey(1));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  // spill pool: white light, alpha shaped — strongest along the shop line (v = 0), an elliptical falloff out
  const spillTex = () => canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, 0, 0, w / 2, 0, w * 0.62);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.save(); g.scale(1, 1.25); g.fillRect(0, 0, w, h); g.restore();
  });

  const decalMat = (map, extra) => new T.MeshBasicMaterial(Object.assign({
    map, transparent: true, depthWrite: false, toneMapped: false, fog: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  }, extra));

  // a flat quad on the ground, `along` × `across`, centred at (x, z). (nx, nz) is the direction toward the
  // plaza centre: the texture's top row (canvas y = 0, v = 1, local +y) lands on the far side, at the wall.
  // Rx(-π/2) then Ry(ψ) sends local +y to (-sinψ, 0, -cosψ), so ψ = atan2(nx, nz).
  function quad(mat, x, z, along, across, nx, nz, y, order) {
    const m = new T.Mesh(new T.PlaneGeometry(along, across), mat);
    m.rotation.order = 'YXZ';
    m.rotation.x = -Math.PI / 2;
    m.rotation.y = Math.atan2(nx, nz);
    m.position.set(x, y, z);
    m.renderOrder = order; m.frustumCulled = true;
    group.add(m);
    return m;
  }

  function build(S, SQ, R) {
    if (group) return group;
    const scene = S.scene, C = S.C;
    group = new T.Group(); group.name = 'square-light'; group.visible = false; scene.add(group);

    const aoMat = decalMat(bandTex(), { blending: T.MultiplyBlending });
    const cornerMat = decalMat(blobTex(0.62), { blending: T.MultiplyBlending });
    const stoneMat = decalMat(blobTex(0.6, 0.62), { blending: T.MultiplyBlending });
    const postMat = decalMat(blobTex(0.62), { blending: T.MultiplyBlending });
    const lampCol = C('lamp').clone().lerp(new T.Color('#ffd9a0'), 0.35);   // the palette's lamp, a little whiter: shop LEDs
    const spillMat = decalMat(spillTex(), { blending: T.AdditiveBlending, color: lampCol, opacity: 0.2 });

    const H = SQ.h, BAND = 2.6, Y_AO = 0.075, Y_SPILL = 0.08;
    // the four inner faces: outward normal toward the centre (nx, nz), and whether a gate cuts the middle
    const SIDES = [
      { name: 'west',  nx: 1,  nz: 0,  gate: true },
      { name: 'east',  nx: -1, nz: 0,  gate: true },
      { name: 'north', nx: 0,  nz: 1,  gate: true },
      { name: 'south', nx: 0,  nz: -1, gate: false },
    ];
    SIDES.forEach(s => {
      // wall line point at offset `a` along the face (a runs -H … H)
      const at = (a, d) => s.nx !== 0 ? [SQ.x - s.nx * (H - d), SQ.z + a] : [SQ.x + a, SQ.z - s.nz * (H - d)];
      const runs = s.gate ? [[-H, -SQ.gate], [SQ.gate, H]] : [[-H, H]];
      runs.forEach(([a0, a1]) => {
        const [x, z] = at((a0 + a1) / 2, BAND / 2);
        quad(aoMat, x, z, a1 - a0, BAND, s.nx, s.nz, Y_AO, 1);
        stats.aoDecals++;
      });
      // storefront spill pools, one per ~6.5 m of shop line, clear of the gate and its posts
      for (let a = -H + 3.4; a <= H - 3.4; a += 6.5) {
        if (s.gate && Math.abs(a) < SQ.gate + 3.0) continue;
        const [x, z] = at(a, 1.9);
        quad(spillMat, x, z, 4.6, 3.8, s.nx, s.nz, Y_SPILL, 2);
        stats.spills++;
      }
    });
    // inside corners: two walls meet, the sky is half as open
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([cx, cz]) => {
      quad(cornerMat, SQ.x + cx * (H - 0.6), SQ.z + cz * (H - 0.6), 4.4, 4.4, 0, 1, Y_AO + 0.002, 1); stats.aoDecals++;
    });
    // the centre stone (plinth r 2.9 at the foot): a contact ring just outside it
    quad(stoneMat, SQ.x, SQ.z, 9.4, 9.4, 0, 1, Y_AO + 0.004, 1); stats.aoDecals++;
    // the four lamp posts (walk.js lampPosts ±16)
    [[-16, -16], [16, -16], [-16, 16], [16, 16]].forEach(([dx, dz]) => {
      quad(postMat, SQ.x + dx, SQ.z + dz, 1.6, 1.6, 0, 1, Y_AO + 0.003, 1); stats.aoDecals++;
    });

    // the engine's sun: the one shadow-casting DirectionalLight in the scene (app.js `key`)
    scene.traverse(o => { if (!sun && o.isDirectionalLight && o.castShadow) sun = o; });
    if (sun) { const c = sun.shadow.camera; box0 = [c.left, c.right, c.top, c.bottom]; stats.sunBox = box0.slice(); }
    window.SQUARE_LIGHT.group = group;
    return group;
  }

  // is every corner of the plaza floor inside the sun's shadow frustum right now?
  const v3 = new T.Vector3();
  function plazaCovered(SQ) {
    const cam = sun.shadow.camera;
    sun.updateMatrixWorld(); cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      v3.set(SQ.x + dx * SQ.h, 0, SQ.z + dz * SQ.h).applyMatrix4(inv);
      if (v3.x < cam.left || v3.x > cam.right || v3.y < cam.bottom || v3.y > cam.top) return false;
    }
    return true;
  }

  let checkT = 0;
  function update(dt, inSquare) {
    if (!group) return;
    inSquare = !!inSquare && window.SQUARE_LIGHT.enabled;
    group.visible = inSquare;
    if (!sun) return;
    if (!inSquare) {
      if (widened) { const c = sun.shadow.camera; [c.left, c.right, c.top, c.bottom] = box0; c.updateProjectionMatrix(); widened = false; }
      return;
    }
    // twice a second is plenty: the sun box moves with the camera, the plaza does not
    checkT -= dt; if (checkT > 0) return; checkT = 0.5;
    const SQ = window.__walk && window.__walk.SQ; if (!SQ) return;
    stats.covered = plazaCovered(SQ);
    if (!stats.covered && !widened) {
      const c = sun.shadow.camera, k = 1.35;
      c.left = box0[0] * k; c.right = box0[1] * k; c.top = box0[2] * k; c.bottom = box0[3] * k;
      c.updateProjectionMatrix(); widened = true;
    }
  }

  window.SQUARE_LIGHT = { build, update, group: null, stats, enabled: true };
})();
