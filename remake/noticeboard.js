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

  // The poster. Old Taipei notices were painted and brush-written, not typeset: a painted scene (Midjourney, generic
  // faces, no lettering; asset/textures/posters/notice.jpg), a 魏碑 title, 楷書 steps on a paper panel and a red seal.
  // It is drawn at once without the picture (a plain painted sky) and again when the picture has loaded.
  const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + FONT, WEI = '"Weibei TC",' + KAI, XING = '"Xingkai TC",' + KAI;
  function poster(T) {
    const W = 1024, H = 1280, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    const draw = (img) => {
      // the painted scene, or a dusk sky until it arrives
      if (img) { const k = Math.max(W / img.width, 880 / img.height), w = img.width * k, h = img.height * k; g.drawImage(img, (W - w) / 2, 0, w, h); }
      else { const sky = g.createLinearGradient(0, 0, 0, 880); sky.addColorStop(0, '#e9b07a'); sky.addColorStop(1, '#c9583a'); g.fillStyle = sky; g.fillRect(0, 0, W, 880); }
      // a soft dark veil behind the title so brush strokes read over the lanterns
      const veil = g.createLinearGradient(0, 0, 0, 330); veil.addColorStop(0, 'rgba(40,16,10,.78)'); veil.addColorStop(1, 'rgba(40,16,10,0)'); g.fillStyle = veil; g.fillRect(0, 0, W, 330);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.font = `400 116px ${WEI}`; g.lineWidth = 14; g.strokeStyle = 'rgba(60,18,10,.85)'; g.strokeText('留下你的台北回憶'.slice(0, 4), W / 2 - 244, 108); g.strokeText('台北回憶', W / 2 + 244, 108);
      g.fillStyle = '#fff1cf'; g.fillText('留下你的', W / 2 - 244, 108); g.fillStyle = '#ffd36b'; g.fillText('台北回憶', W / 2 + 244, 108);
      g.font = `600 36px ${FONT}`; g.fillStyle = '#fff1cf'; g.fillText('L E A V E   Y O U R   T A I P E I   M E M O R Y', W / 2, 212);
      // the paper panel, with a scalloped top edge like a torn ticket
      const py = 800; g.fillStyle = '#f6ead0'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, py + 26);
      for (let x = 0; x <= W; x += 32) g.quadraticCurveTo(x + 16, py + (x / 32 % 2 ? 4 : 40), x + 32, py + 26);
      g.lineTo(W, H); g.closePath(); g.fill();
      for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(120,80,40,${Math.random() * 0.06})`; g.fillRect(Math.random() * W, py + 30 + Math.random() * (H - py - 30), 2 + Math.random() * 4, 1 + Math.random() * 2); }
      const steps = [['一', '走到攤位、地標或照片牆', 'Walk up to a stall, a landmark or a photo wall'],
                     ['二', '點一下，或按 E', 'Click it, or press E'],
                     ['三', '掛上照片，寫一句話', 'Hang your photo and write one line']];
      steps.forEach(([n, zh, en], i) => {
        const y = 912 + i * 118;
        g.fillStyle = '#b7372a'; g.beginPath(); g.arc(104, y, 46, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#f6ead0'; g.lineWidth = 3; g.beginPath(); g.arc(104, y, 38, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#fff1cf'; g.font = `400 58px ${KAI}`; g.textAlign = 'center'; g.fillText(n, 104, y + 2);
        g.textAlign = 'left'; g.fillStyle = '#2a1a12'; g.font = `400 64px ${KAI}`; g.fillText(zh, 178, y - 14);
        g.fillStyle = '#7a5f45'; g.font = `500 28px ${FONT}`; g.fillText(en, 182, y + 38);
      });
      // the red seal, pressed a little crooked, and a brush line underneath
      g.save(); g.translate(888, 1010); g.rotate(-0.07); g.fillStyle = '#b7372a'; g.fillRect(-74, -74, 148, 148); g.strokeStyle = '#f6ead0'; g.lineWidth = 4; g.strokeRect(-62, -62, 124, 124);
      g.fillStyle = '#f6ead0'; g.font = `400 58px ${WEI}`; g.textAlign = 'center'; g.fillText('台北', 0, -28); g.fillText('記憶', 0, 34); g.restore();
      g.textAlign = 'center'; g.fillStyle = '#b7372a'; g.font = `400 50px ${XING}`; g.fillText('你的照片，也可以掛在這裡', W / 2, 1232);
      // a double rule round the whole sheet
      g.strokeStyle = '#3a2016'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); g.strokeStyle = '#f6ead0'; g.lineWidth = 3; g.strokeRect(18, 18, W - 36, H - 36);
      t.needsUpdate = true;
    };
    draw(null);
    const im = new Image(); im.onload = () => draw(im); im.src = '../asset/textures/posters/notice.jpg';
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (im.complete && im.naturalWidth) draw(im); });
    return t;
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
    const ps = new T.Mesh(new T.PlaneGeometry(1.36, 1.7), new T.MeshStandardMaterial({ map: poster(T), roughness: 0.9, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 }));
    ps.material.emissive = new T.Color(0.16, 0.13, 0.1); ps.position.set(-0.3, 1.63, 0.041); ps.receiveShadow = true; G.add(ps);
    // loose notes and snapshots pinned beside the poster, each a thin slab with a pin
    const paper = (w, h, colr, x, y, rz) => { const m = new T.MeshStandardMaterial({ color: colr, roughness: 0.95 }); const o = new T.Mesh(new T.BoxGeometry(w, h, 0.006), m); o.position.set(x, y, 0.045); o.rotation.z = rz; o.castShadow = true; G.add(o);
      const pin = new T.Mesh(new T.SphereGeometry(0.018, 10, 8), new T.MeshStandardMaterial({ color: 0xb7372a, roughness: 0.4 })); pin.position.set(x, y + h / 2 - 0.03, 0.058); G.add(pin); };
    paper(0.3, 0.36, 0xfffaf0, 0.62, 2.18, 0.06); paper(0.26, 0.2, 0xf4d98a, 0.66, 1.82, -0.08); paper(0.3, 0.36, 0xfffaf0, 0.6, 1.42, -0.05); paper(0.24, 0.18, 0xbfd9c7, 0.68, 1.06, 0.07);
    [[0.62, 2.2, 0xd9a05b], [0.6, 1.44, 0x7fa7b8]].forEach(([x, y, c]) => { const o = new T.Mesh(new T.PlaneGeometry(0.25, 0.24), new T.MeshStandardMaterial({ color: c, roughness: 0.8 })); o.position.set(x, y, 0.05); G.add(o); });
    // a small tiled roof: two pitched slabs, a ridge, and rafters' ends
    box(2.9, 0.07, 0.62, tile, 0, 3.02, 0.24, 0.42); box(2.9, 0.07, 0.62, tile, 0, 3.02, -0.24, -0.42); box(2.96, 0.1, 0.12, dark, 0, 3.17, 0);
    for (let i = 0; i < 9; i++) { const x = -1.3 + i * 0.325; box(0.05, 0.05, 1.06, wood, x, 2.9, 0); }
    // a lamp under the eave, so the poster is lit at dusk
    const arm = box(0.04, 0.04, 0.34, dark, 0, 2.78, 0.2); arm.castShadow = false;
    const bulb = new T.Mesh(new T.SphereGeometry(0.07, 14, 10), E.GLOW(3.0, 2.0, 0.9)); bulb.position.set(0, 2.72, 0.36); G.add(bulb);
    const light = new T.PointLight(0xffc98a, 0.9, 5, 2); light.position.set(0, 2.6, 0.5); G.add(light);
    // a ledge with a pencil tin and a stack of blank cards, and a planter at each post
    box(0.5, 0.05, 0.2, wood, 0.66, 0.8, 0.12);
    const tin = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.13, 14), new T.MeshStandardMaterial({ color: 0x2f6f73, roughness: 0.5, metalness: 0.4 })); tin.position.set(0.52, 0.89, 0.13); tin.castShadow = true; G.add(tin);
    [[-0.02, 0xe0b23c], [0.015, 0xb7372a], [0.0, 0x2a2018]].forEach(([dx, c], i) => { const p = new T.Mesh(new T.CylinderGeometry(0.007, 0.007, 0.2, 6), new T.MeshStandardMaterial({ color: c })); p.position.set(0.52 + dx, 0.99, 0.13 + (i - 1) * 0.015); p.rotation.z = dx * 6; G.add(p); });
    for (let i = 0; i < 5; i++) box(0.2, 0.008, 0.14, new T.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.95 }), 0.76 + (i % 2) * 0.006, 0.83 + i * 0.008, 0.12);
    [-1.38, 1.38].forEach(x => { box(0.36, 0.3, 0.36, stone, x, 0.15, 0.1); const bush = new T.Mesh(new T.IcosahedronGeometry(0.24, 1), E.MATS.leaf); bush.position.set(x, 0.46, 0.1); bush.scale.y = 0.8; bush.castShadow = true; G.add(bush); });
    return G;
  }

  function add(E, o) {
    o = o || {}; const g = build(E), p = o.position || [0, 0], rot = o.rotation || 0;
    g.position.set(p[0], 0, p[1]); g.rotation.y = rot; E.scene.add(g);
    if (window.PHOTOWALL && PHOTOWALL.block) PHOTOWALL.block({ x: p[0], z: p[1], facing: rot, u0: -1.6, u1: 1.6, v0: -0.45, v1: 0.5 });
    const it = Object.assign({ district: o.district || 'square' }, ITEM);
    // places.js finds an item by key in PLACE_DATA (for ?place=notice-board and the test hook), so the board joins its district's list while the page runs.
    const ALL = window.PLACE_DATA = window.PLACE_DATA || {};
    if (!ALL[it.district]) ALL[it.district] = { section: it.district, zh: '廣場', en: 'The Square', places: [], events: [] };   // until the square has researched places of its own
    const D = ALL[it.district]; if (D.places && !D.places.some(i => i.key === it.key)) D.places.push(it);
    if (window.PLACES) {
      const near = [p[0] + Math.sin(rot) * 1.6, p[1] + Math.cos(rot) * 1.6];
      PLACES.add(E, it, { target: g, near, radius: 2.6, plaque: { position: [p[0] + Math.cos(rot) * 1.08 + Math.sin(rot) * 0.1, 1.25, p[1] - Math.sin(rot) * 1.08 + Math.cos(rot) * 0.1], rotation: rot } });
    }
    return g;
  }
  window.NOTICEBOARD = { add, build, item: ITEM };
})();
