// noticeboard.js: the notice board in the square that tells visitors they can leave their own memories.
// CJ, 2026-11-21: 「廣場有一個告示牌告訴大家可以上傳自己的回憶」.
//
// A roofed timber community board (公佈欄) with a painted poster, pinned snapshots and a lamp. It is a clickable
// place like any other: click it, or walk up and press E, and the panel explains how to leave a photo and
// has its own "Add your photo" button (photos left here are stored under the topic place:square:notice-board).
//
// Use, inside ENGINE.create({ build(E) { ... } }), with place-data.js and places.js loaded:
//     NOTICEBOARD.add(E, { position: [x, z], rotation: angle, district: 'square' });
// `rotation` is the angle about Y the poster faces (0 faces +Z). Returns the THREE.Group.
(function () {
  'use strict';
  const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';
  const ITEM = {
    key: 'notice-board', id: 'notice-board', kind: 'place', confirmed: true,
    zh: '回憶公佈欄', en: 'The memory notice board', years: '',
    history_zh: '這個城市是大家的回憶拼起來的。走到任何一個攤位、地標、立牌或照片牆，點一下或按 E，就可以掛上你的照片，寫一句當時的事。老照片、畢業照、巷口的早餐店都可以。也可以直接在這裡留下第一張。',
    history_en: 'This city is put together from everyone\'s memories. Walk up to any stall, landmark, sign board or photo wall, click it or press E, and you can hang a photo of your own and write one line about that day. Old family photos, graduation pictures, the breakfast shop on your corner: all of them belong. You can also leave your first one right here.',
    where: 'In the square, beside the path. Every clickable place in the three districts takes photos in the same way.',
    visual: [], sources: [], photos: [],
  };

  function poster(T) {
    const W = 1024, H = 1280, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#f3e7cf'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,60,30,${Math.random() * 0.05})`; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 3, 1 + Math.random() * 2); }
    g.fillStyle = '#b7372a'; g.fillRect(0, 0, W, 250);
    g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 104px ${FONT}`; g.fillText('留下你的台北回憶', W / 2, 108);
    g.font = `600 44px ${FONT}`; g.fillText('LEAVE YOUR TAIPEI MEMORY', W / 2, 200);
    const steps = [['1', '走到攤位、地標或照片牆', 'Walk up to a stall, a landmark or a photo wall'],
                   ['2', '點一下，或按 E', 'Click it, or press E'],
                   ['3', '掛上照片，寫一句話', 'Hang your photo and write one line']];
    steps.forEach(([n, zh, en], i) => {
      const y = 370 + i * 190;
      g.fillStyle = '#23324f'; g.beginPath(); g.arc(120, y, 58, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff3d6'; g.font = `800 72px ${FONT}`; g.textAlign = 'center'; g.fillText(n, 120, y + 4);
      g.textAlign = 'left'; g.fillStyle = '#2a2018'; g.font = `700 62px ${FONT}`; g.fillText(zh, 212, y - 26);
      g.fillStyle = '#6b5a45'; g.font = `500 34px ${FONT}`; g.fillText(en, 214, y + 40);
    });
    // three snapshots drawn as if pinned along the bottom, each a little crooked
    const snaps = [['#d9a05b', '#7b3f24', -0.07], ['#7fa7b8', '#2f4a5e', 0.05], ['#c8b98e', '#5d6b3a', -0.03]];
    snaps.forEach(([sky, land, rot], i) => {
      g.save(); g.translate(190 + i * 320, 1060); g.rotate(rot);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-122, -112, 256, 262);
      g.fillStyle = '#fffaf0'; g.fillRect(-128, -120, 256, 262);
      g.fillStyle = sky; g.fillRect(-110, -102, 220, 170); g.fillStyle = land; g.fillRect(-110, -8, 220, 76);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(52, -60, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a2018'; g.fillRect(-60, 0, 26, 52); g.fillRect(-22, 14, 20, 38);   // two small figures
      g.fillStyle = '#8a7a66'; g.fillRect(-92, 92, 150, 8); g.fillRect(-92, 112, 96, 8);  // a handwritten line
      g.fillStyle = '#b7372a'; g.beginPath(); g.arc(0, -120, 13, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    g.fillStyle = '#b7372a'; g.font = `700 46px ${FONT}`; g.textAlign = 'center'; g.fillText('你的照片也可以掛在這裡 · Yours can hang here too', W / 2, 1238);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }

  function build(E) {
    const T = E.T, G = new T.Group(), tri = E.triMat, TEX = E.TEX;
    const wood = tri({ color: '#6b4a30', tex: TEX.bark, scale: 2.2, rough: 0.85 }), dark = tri({ color: '#3a2a1c', tex: TEX.bark, scale: 2.2, rough: 0.8 });
    const tile = tri({ color: '#8f3b2c', tex: TEX.concrete, scale: 2, rough: 0.7 }), stone = tri({ color: '#b9ae9c', tex: TEX.concrete, scale: 1.2, rough: 0.95 });
    const box = (w, h, d, m, x, y, z, rx, rz) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; if (rz) o.rotation.z = rz; o.castShadow = o.receiveShadow = true; G.add(o); return o; };
    // stone footing, two posts, cross rails
    box(2.5, 0.16, 0.7, stone, 0, 0.08, 0);
    [-1.08, 1.08].forEach(x => { box(0.16, 2.75, 0.16, dark, x, 1.52, 0); box(0.3, 0.14, 0.3, stone, x, 0.22, 0); });
    box(2.34, 0.1, 0.12, dark, 0, 0.72, 0); box(2.34, 0.1, 0.12, dark, 0, 2.52, 0);
    // the cork back and the poster
    box(2.0, 1.72, 0.07, tri({ color: '#a8845a', tex: TEX.plaster, scale: 3, rough: 0.95 }), 0, 1.62, 0);
    const ps = new T.Mesh(new T.PlaneGeometry(1.3, 1.625), new T.MeshStandardMaterial({ map: poster(T), roughness: 0.9, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 }));
    ps.material.emissive = new T.Color(0.16, 0.13, 0.1); ps.position.set(-0.3, 1.62, 0.041); ps.receiveShadow = true; G.add(ps);
    // loose notes and snapshots pinned beside the poster, each a thin slab with a pin
    const paper = (w, h, colr, x, y, rz) => { const m = new T.MeshStandardMaterial({ color: colr, roughness: 0.95 }); const o = new T.Mesh(new T.BoxGeometry(w, h, 0.006), m); o.position.set(x, y, 0.045); o.rotation.z = rz; o.castShadow = true; G.add(o);
      const pin = new T.Mesh(new T.SphereGeometry(0.018, 10, 8), new T.MeshStandardMaterial({ color: 0xb7372a, roughness: 0.4 })); pin.position.set(x, y + h / 2 - 0.03, 0.058); G.add(pin); };
    paper(0.3, 0.36, 0xfffaf0, 0.62, 2.18, 0.06); paper(0.26, 0.2, 0xf4d98a, 0.66, 1.82, -0.08); paper(0.3, 0.36, 0xfffaf0, 0.6, 1.42, -0.05); paper(0.24, 0.18, 0xbfd9c7, 0.68, 1.04, 0.07);
    [[0.62, 2.2, 0xd9a05b], [0.6, 1.44, 0x7fa7b8]].forEach(([x, y, c]) => { const o = new T.Mesh(new T.PlaneGeometry(0.25, 0.24), new T.MeshStandardMaterial({ color: c, roughness: 0.8 })); o.position.set(x, y, 0.05); G.add(o); });
    // a small tiled roof: two pitched slabs, a ridge, and rafters' ends
    box(2.9, 0.07, 0.62, tile, 0, 3.02, 0.24, 0.42); box(2.9, 0.07, 0.62, tile, 0, 3.02, -0.24, -0.42); box(2.96, 0.1, 0.12, dark, 0, 3.17, 0);
    for (let i = 0; i < 9; i++) { const x = -1.3 + i * 0.325; box(0.05, 0.05, 1.06, wood, x, 2.9, 0); }
    // a lamp under the eave, so the poster is lit at dusk
    const arm = box(0.04, 0.04, 0.34, dark, 0, 2.78, 0.2); arm.castShadow = false;
    const bulb = new T.Mesh(new T.SphereGeometry(0.07, 14, 10), E.GLOW(3.0, 2.0, 0.9)); bulb.position.set(0, 2.72, 0.36); G.add(bulb);
    const light = new T.PointLight(0xffc98a, 0.9, 5, 2); light.position.set(0, 2.6, 0.5); G.add(light);
    // a ledge with a pencil tin and a stack of blank cards, and a planter at each post
    box(1.3, 0.05, 0.2, wood, -0.3, 0.76, 0.12);
    const tin = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.13, 14), new T.MeshStandardMaterial({ color: 0x2f6f73, roughness: 0.5, metalness: 0.4 })); tin.position.set(-0.75, 0.85, 0.13); tin.castShadow = true; G.add(tin);
    [[-0.02, 0xe0b23c], [0.015, 0xb7372a], [0.0, 0x2a2018]].forEach(([dx, c], i) => { const p = new T.Mesh(new T.CylinderGeometry(0.007, 0.007, 0.2, 6), new T.MeshStandardMaterial({ color: c })); p.position.set(-0.75 + dx, 0.95, 0.13 + (i - 1) * 0.015); p.rotation.z = dx * 6; G.add(p); });
    for (let i = 0; i < 5; i++) box(0.2, 0.008, 0.14, new T.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.95 }), -0.2 + (i % 2) * 0.006, 0.79 + i * 0.008, 0.12);
    [-1.38, 1.38].forEach(x => { box(0.36, 0.3, 0.36, stone, x, 0.15, 0.1); const bush = new T.Mesh(new T.IcosahedronGeometry(0.24, 1), E.MATS.leaf); bush.position.set(x, 0.46, 0.1); bush.scale.y = 0.8; bush.castShadow = true; G.add(bush); });
    return G;
  }

  function add(E, o) {
    o = o || {}; const g = build(E), p = o.position || [0, 0], rot = o.rotation || 0;
    g.position.set(p[0], 0, p[1]); g.rotation.y = rot; E.scene.add(g);
    if (window.PHOTOWALL && PHOTOWALL.block) PHOTOWALL.block({ x: p[0], z: p[1], facing: rot, u0: -1.6, u1: 1.6, v0: -0.45, v1: 0.5 });
    const it = Object.assign({ district: o.district || 'square' }, ITEM);
    // places.js finds an item by key in PLACE_DATA (for ?place=notice-board and the test hook), so the board joins its district's list while the page runs.
    const D = window.PLACE_DATA && window.PLACE_DATA[it.district]; if (D && D.places && !D.places.some(i => i.key === it.key)) D.places.push(it);
    if (window.PLACES) {
      const near = [p[0] + Math.sin(rot) * 1.6, p[1] + Math.cos(rot) * 1.6];
      PLACES.add(E, it, { target: g, near, radius: 2.6, plaque: { position: [p[0] + Math.cos(rot) * 1.08 + Math.sin(rot) * 0.1, 1.25, p[1] - Math.sin(rot) * 1.08 + Math.cos(rot) * 0.1], rotation: rot } });
    }
    return g;
  }
  window.NOTICEBOARD = { add, build, item: ITEM };
})();
