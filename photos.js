// photos.js — clickable points on the street that show the real place (issue #17, part 2).
//
// CJ, 2026-09-24: 「街邊有興趣點可以進去點照片嗎」. Every building on the street is modelled from a real
// Taipei building; these markers are the proof. One small ring sits beside each building that has a
// licence-cleared photograph (research/photos/README.md, eight of ten anchors). It fades in as the
// building comes into frame and out as it leaves. A click opens a bright panel with the photograph,
// the place's name, the year and the credit; a PHOTO CREDITS button lists every photograph, its rights
// holder and its licence (several are CC BY / CC BY-SA and require it).
//
// This file owns its own DOM, its own frame loop and photos.css. It reads window.SCENE (anchors,
// ERAS, camera) and window.__fog (progress, era) and writes nothing back. Loaded last, after music.js.
// The scroll is never touched: opening and closing a panel leaves the page exactly where it was, and the
// page keeps scrolling while a panel is open. A panel closes by itself once its building has been out of
// frame for a second, so a photograph of Ximending never hangs over Dadaocheng.
(function () {
  'use strict';
  if (!window.SCENE || !window.THREE) return;
  const S = window.SCENE, A = S.anchors, ERAS = S.ERAS;
  const ALL = ERAS.map(e => e.key);
  const CLOSING_FROM = (window.DATA && window.DATA.CLOSING && window.DATA.CLOSING.showFrom) || 0.9;
  const DIR = 'asset/photos/hotspots/';

  // ── the photographs, one per anchor. Positions come from data.js's anchors where one exists; the
  //    four buildings the scene files place by hand (中華商場, 萬年大樓, 永樂市場, 大稻埕碼頭) use the
  //    same constants those files use, named here so a change there is a one-line change here.
  //    y is a point on the facade, not the roof: the label owns the roofline. eras: when it is built.
  //    far: the distance at which the marker starts to fade in (the fade takes 30 units). ──
  const SPOTS = [
    { id: 'chunghwa', x: -6.0, y: 7.6, z: -40.2, eras: ['red'], far: 80,        // 平棟, the last of the eight blocks (scene-red.js XF, blockZ)
      en: 'Chunghwa Market', zh: '中華商場', when: '1961', tag: '1961',
      caption: 'Brand new, on its opening day: a newspaper photograph from 1961. The street here shows it twenty years on, when the rooftop neon had gone up. Demolished in 1992.',
      note: 'Cropped to the photograph from the newspaper page.',
      by: '凃柏辰', holder: '內容力有限公司 · 國家文化記憶庫', licence: 'CC BY 3.0 TW', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/tw/',
      src: 'https://tcmb.culture.tw/zh-tw/detail?indexCode=Culture_Object&id=301814', img: 'chunghwa.webp', w: 1000, h: 681 },
    { id: 'redhouse', anchor: 'redhouse', dx: -1.4, y: 6.2, eras: ALL, far: 90,   // the octagon's front face (scene-red.js cx 16.6, circumradius 7.2)
      en: 'Ximen Red House', zh: '西門紅樓', when: '2019', tag: '2019',
      caption: 'The 1908 octagon at golden hour, its plaza still busy with people walking home past it, the sign lit from inside the entrance.',
      by: '毛貓大少爺', holder: 'Wikimedia Commons', licence: 'CC BY-SA 2.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      src: 'https://commons.wikimedia.org/wiki/File:Octagon_Building,_Red_House_Theater.jpg', img: 'redhouse.webp', w: 1200, h: 900 },
    { id: 'wannian', x: -9.1, y: 15, z: -124, eras: ALL, far: 100,             // scene-red.js: z -124, XF -9.3, ten storeys
      en: 'Wannian Commercial Building', zh: '萬年大樓', when: '2008', tag: '2008',
      caption: 'The 1973 tower on 西寧南路 seen from the street corner, its name down the face in red and the shop signs stacked below.',
      by: 'Tianmu peter', holder: 'Wikimedia Commons', licence: 'CC BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/',
      src: 'https://commons.wikimedia.org/wiki/File:Wan_Nian_Commercial_Building_20080805.jpg', img: 'wannian.webp', w: 900, h: 1200 },
    { id: 'dihua', anchor: 'dihua', dx: -1.6, y: 6.8, eras: ALL, far: 90,         // the east arcade row
      en: 'Dihua Street', zh: '迪化街', when: '2011', tag: '2011',
      caption: 'Lunar New Year morning: the street packed shoulder to shoulder under the arcades, red lanterns strung above the crowd.',
      by: '玄史生', holder: 'Wikimedia Commons', licence: 'CC BY-SA 3.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      src: 'https://commons.wikimedia.org/wiki/File:Dihua_Street_Lunar_New_Year_20110203a.jpg', img: 'dihua.webp', w: 1200, h: 900 },
    { id: 'temple', anchor: 'chenghuang', dx: 2.6, y: 5.6, eras: ALL, far: 90,    // the hall's front at x -8.8 (scene-dadao.js xf)
      en: 'Xiahai City God Temple', zh: '霞海城隍廟', when: '2012', tag: '2012',
      caption: 'The incense burner at the entrance, flame lit, worshippers standing round it under the red banner over the door.',
      by: '玄史生', holder: 'Wikimedia Commons', licence: 'CC BY-SA 3.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      src: 'https://commons.wikimedia.org/wiki/File:Hsiahai_City_God_Temple_Front_20120129.jpg', img: 'temple.webp', w: 1200, h: 848 },
    { id: 'yongle', x: -9.0, y: 9.5, z: -274, eras: ALL, far: 100,             // scene-dadao.js: z0 -263 … z1 -285, xf -9.3
      en: 'Yongle Market', zh: '永樂市場', when: '2012', tag: '2012',
      caption: 'The west side of the 1982 market: the open arcade at street level and the 永樂布業商場 fabric-market sign on the floors above.',
      by: '玄史生', holder: 'Wikimedia Commons', licence: 'CC BY-SA 3.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      src: 'https://commons.wikimedia.org/wiki/File:Yongle_Market_West_Side_20120129.jpg', img: 'yongle.webp', w: 1200, h: 900 },
    { id: 'wharf', x: -9.4, y: 4.6, z: -207, eras: ALL, far: 80,               // the mouth of the 民生西路 gap in the west row (scene-dadao.js gapZ, z -198 … -214): the wharf is the glimpse through it
      en: 'Dadaocheng Wharf', zh: '大稻埕碼頭', when: '2014', tag: '2014',
      caption: 'Through the side street to the west: the pier and its white gantry on the Tamsui River, a ferry berthed, Taipei 101 on the skyline behind.',
      by: '李家宇 (LegoLee)', holder: 'Wikimedia Commons', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      src: 'https://commons.wikimedia.org/wiki/File:%E5%A4%A7%E7%A8%BB%E5%9F%95%E7%A2%BC%E9%A0%AD.JPG', img: 'wharf.webp', w: 1200, h: 800 },
    { id: 'tower101', anchor: 'tower101', face: true, dz: 4, y: 46, eras: ['tower'], far: 190,   // on the west face (TOWER.faceX, the face the man climbs), a third of the way up
      en: 'Taipei 101', zh: '台北101', when: '2003', tag: '2003',
      caption: 'Under construction, the cranes still on the crown, the year before it opened as the tallest building on earth.',
      by: 'lienyuan lee', holder: 'Wikimedia Commons', licence: 'CC BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/',
      src: 'https://commons.wikimedia.org/wiki/File:%E8%88%88%E5%BB%BA%E4%B8%AD%E7%9A%84%E5%8F%B0%E5%8C%97%E4%B8%80%E9%9B%B6%E4%B8%80_Taipei_101_Under_Construction_-_panoramio.jpg', img: 'tower101.webp', w: 935, h: 1200 },
  ];
  SPOTS.forEach(s => {
    if (s.anchor && A[s.anchor]) { s.x = A[s.anchor].x + (s.dx || 0); s.z = A[s.anchor].z + (s.dz || 0); }
    else if (s.anchor) { s.x = 0; s.z = 1e9; }   // anchor missing: never in frame, never shown
    if (s.face && S.TOWER && S.TOWER.faceX) s.x = S.TOWER.faceX(s.y) - 0.4;   // scene-tower.js sets faceX before this file loads
  });

  // ── everything else the page plays, draws in or runs on (CREDITS.md at the repo root, same order) ──
  const OTHER = [
    { h: 'Music', intro: 'Over http the music bar plays official music videos through YouTube\u2019s own embedded player; the track, artist and channel show in the bar while each plays. Rights stay with the labels and artists; the page hosts no copy. Offline, it plays four loops made for this page.', items: [
      { what: '望春風 · 鄧麗君 (1980)', by: 'YouTube: 鄧麗君 Teresa Teng official channel', src: 'https://www.youtube.com/watch?v=v2zjxM4wtZc' },
      { what: '台北的天空 · 王芷蕾 (1985)', by: 'YouTube: Timeless Music', src: 'https://www.youtube.com/watch?v=ZGRrJY7VELU' },
      { what: '我的未來不是夢 · 張雨生 (1988)', by: 'YouTube: 滾石唱片 ROCK RECORDS', src: 'https://www.youtube.com/watch?v=lTxZmhAoSGU' },
      { what: '大約在冬季 · 齊秦 (1987)', by: 'YouTube: Qin Qi - Topic', src: 'https://www.youtube.com/watch?v=KueFDMWV5ps' },
      { what: '吻別 · 張學友 (1993)', by: 'YouTube: 張學友 Jacky Cheung - Topic', src: 'https://www.youtube.com/watch?v=L3xC-dlVS5c' },
      { what: '心太軟 · 任賢齊 (1996)', by: 'YouTube: 滾石唱片 ROCK RECORDS', src: 'https://www.youtube.com/watch?v=ZSWeurc1yMw' },
      { what: '七里香 · 周杰倫 (2004)', by: 'YouTube: 周杰倫 Jay Chou', src: 'https://www.youtube.com/watch?v=Bbp9ZaJD_eA' },
      { what: '後來的我們 · 五月天 (2016)', by: 'YouTube: 相信音樂BinMusic', src: 'https://www.youtube.com/watch?v=pd3eV-SG23E' },
      { what: 'Neon Arcade, Letters Home, Night Market Slow Jam, Skyline Pulse', by: 'the offline loops, synthesised for this page', licence: 'CC0 1.0', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
    ] },
    { h: 'Typefaces', intro: 'Self-hosted, cut down to the letters the page uses, as the licence allows.', items: [
      { what: 'Barlow and Barlow Condensed', by: 'The Barlow Project Authors', licence: 'SIL Open Font License 1.1', licenceUrl: 'https://openfontlicense.org', src: 'https://github.com/jpt/barlow' },
      { what: 'Chocolate Classical Sans', by: 'The Chocolate Classical Sans Project Authors', licence: 'SIL Open Font License 1.1', licenceUrl: 'https://openfontlicense.org', src: 'https://github.com/MoonlitOwen/ChocolateSans' },
    ] },
    { h: 'Code and 3D', items: [
      { what: 'three.js r149 and its GLTFLoader', by: 'Copyright 2010-2023 three.js authors', licence: 'MIT', licenceUrl: 'https://github.com/mrdoob/three.js/blob/dev/LICENSE', src: 'https://threejs.org' },
      { what: 'meshoptimizer decoder', by: 'Copyright 2016-2026 Arseny Kapoulkine', licence: 'MIT', licenceUrl: 'https://github.com/zeux/meshoptimizer/blob/master/LICENSE.md', src: 'https://github.com/zeux/meshoptimizer' },
      { what: 'Street props library', zh: '台北懷舊 3D 素材庫', by: 'made by a teammate for this project (asset/3d/)' },
      { what: 'Buildings, the girl, painted textures and the square', by: 'made for this page' },
    ] },
  ];

  // ── DOM ─────────────────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'photoSpots';
  host.setAttribute('aria-label', 'Photographs of the real buildings');
  SPOTS.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'spot'; b.dataset.id = s.id;
    b.setAttribute('aria-label', 'Photograph of ' + s.en + ' ' + s.zh);
    b.innerHTML = '<span class="spot-ring"></span><span class="spot-dot"></span><span class="spot-tag">' + esc(s.tag) + '</span>';
    b.hidden = true;
    b.addEventListener('click', e => { e.preventDefault(); open(s, b); });
    host.appendChild(b);
    s.el = b;
  });
  document.body.appendChild(host);

  const panel = document.createElement('aside');
  panel.id = 'photoPanel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'photoPanelName');
  panel.innerHTML =
    '<button type="button" class="pp-close" aria-label="Close">×</button>' +
    '<div class="pp-fig"><img alt="" decoding="async"></div>' +
    '<div class="pp-body">' +
      '<div class="pp-k">THE REAL PLACE · <span class="pp-when"></span></div>' +
      '<h2 class="pp-name" id="photoPanelName"></h2>' +
      '<div class="pp-zh"></div>' +
      '<p class="pp-cap"></p>' +
      '<p class="pp-note"></p>' +
      '<div class="pp-credit"></div>' +
      '<button type="button" class="pp-all">All photo credits</button>' +
    '</div>';
  document.body.appendChild(panel);
  const P = {
    img: panel.querySelector('img'), fig: panel.querySelector('.pp-fig'), when: panel.querySelector('.pp-when'), name: panel.querySelector('.pp-name'),
    zh: panel.querySelector('.pp-zh'), cap: panel.querySelector('.pp-cap'), note: panel.querySelector('.pp-note'), credit: panel.querySelector('.pp-credit'),
    close: panel.querySelector('.pp-close'), all: panel.querySelector('.pp-all'),
  };

  // the credits: a small caps button top-right under the title, and the block it opens. One panel for every
  // third-party thing the page shows or plays (CREDITS.md at the repo root is the same list in plain words),
  // reachable from the square, the streets and the guided tour alike.
  const credBtn = document.createElement('button');
  credBtn.type = 'button'; credBtn.id = 'photoCreditsBtn'; credBtn.textContent = 'Credits';
  credBtn.setAttribute('aria-label', 'Credits: every photograph, song, typeface and code library on the page, with its licence');
  document.body.appendChild(credBtn);
  const credits = document.createElement('aside');
  credits.id = 'photoCredits'; credits.hidden = true;
  credits.setAttribute('role', 'dialog'); credits.setAttribute('aria-labelledby', 'photoCreditsTitle');
  credits.innerHTML =
    '<button type="button" class="pp-close" aria-label="Close">×</button>' +
    '<div class="pc-body">' +
      '<div class="pp-k">CREDITS</div>' +
      '<h2 class="pp-name" id="photoCreditsTitle">Credits</h2>' +
      '<h3 class="pc-h">Photographs</h3>' +
      '<p class="pc-intro">Every building on this street is modelled from a real Taipei building. These are the photographs behind eight of them, each used under its own licence. Files are resized for the screen; the 1961 frame is cropped to the photograph from the newspaper page. The two pictures that pass over the guided tour are the Chunghwa Market and Yongle Market photographs below. The CC BY-SA photographs, and our resized copies of them, stay under their CC BY-SA licence. 樂聲戲院 and the 西門町 pedestrian zone have no licence-cleared photograph yet.</p>' +
      '<ol class="pc-list">' + SPOTS.map(s =>
        '<li><span class="pc-place">' + esc(s.en) + ' <span class="pc-zh">' + esc(s.zh) + '</span></span>' +
        '<span class="pc-line">' + esc(s.when) + ' · ' + esc(s.by) + ' · ' + esc(s.holder) + ' · <a href="' + esc(s.licenceUrl) + '" target="_blank" rel="noopener license">' + esc(s.licence) + '</a> · <a href="' + esc(s.src) + '" target="_blank" rel="noopener">source</a></span></li>'
      ).join('') + '</ol>' +
      OTHER.map(g => '<h3 class="pc-h">' + esc(g.h) + '</h3>' + (g.intro ? '<p class="pc-intro">' + esc(g.intro) + '</p>' : '') +
        '<ol class="pc-list">' + g.items.map(i =>
          '<li><span class="pc-place">' + esc(i.what) + (i.zh ? ' <span class="pc-zh">' + esc(i.zh) + '</span>' : '') + '</span>' +
          '<span class="pc-line">' + esc(i.by) + (i.licence ? ' · ' + (i.licenceUrl ? '<a href="' + esc(i.licenceUrl) + '" target="_blank" rel="noopener license">' + esc(i.licence) + '</a>' : esc(i.licence)) : '') +
          (i.src ? ' · <a href="' + esc(i.src) + '" target="_blank" rel="noopener">source</a>' : '') + '</span></li>'
        ).join('') + '</ol>').join('') +
    '</div>';
  document.body.appendChild(credits);

  function esc(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ── open / close. The scroll is never touched; the panel is fixed and the page keeps scrolling. ──
  let current = null, opener = null, gone = 0, openedAtY = 0;
  function open(s, btn) {
    if (!credits.hidden) closeCredits();
    current = s; opener = btn; gone = 0; openedAtY = window.scrollY;
    P.img.src = DIR + s.img; P.img.width = s.w; P.img.height = s.h; P.img.alt = s.en + ' ' + s.zh + ', ' + s.when;
    P.fig.classList.toggle('tall', s.h > s.w);
    P.when.textContent = s.when; P.name.textContent = s.en; P.zh.textContent = s.zh; P.cap.textContent = s.caption;
    P.note.textContent = s.note || ''; P.note.hidden = !s.note;
    P.credit.innerHTML = 'Photo: ' + esc(s.by) + ' · ' + esc(s.holder) + ' · <a href="' + esc(s.licenceUrl) + '" target="_blank" rel="noopener license">' + esc(s.licence) + '</a> · <a href="' + esc(s.src) + '" target="_blank" rel="noopener">source</a>';
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
    host.querySelectorAll('.spot.open').forEach(b => b.classList.remove('open'));
    btn.classList.add('open');
    P.close.focus({ preventScroll: true });
  }
  function close(refocus) {
    if (panel.hidden) return;
    panel.classList.remove('show');
    const s = current; current = null;
    if (s) s.el.classList.remove('open');
    setTimeout(() => { if (!current) { panel.hidden = true; P.img.removeAttribute('src'); } }, 260);
    if (refocus && opener && !opener.hidden) opener.focus({ preventScroll: true });
    opener = null;
  }
  function openCredits() { close(false); openedAtY = window.scrollY; credits.hidden = false; requestAnimationFrame(() => credits.classList.add('show')); credits.querySelector('.pp-close').focus({ preventScroll: true }); }
  function closeCredits(refocus) {
    if (credits.hidden) return;
    credits.classList.remove('show');
    setTimeout(() => { if (!credits.classList.contains('show')) credits.hidden = true; }, 260);
    if (refocus) credBtn.focus({ preventScroll: true });
  }
  P.close.addEventListener('click', () => close(true));
  P.all.addEventListener('click', openCredits);
  credBtn.addEventListener('click', () => credits.hidden ? openCredits() : closeCredits(true));
  credits.querySelector('.pp-close').addEventListener('click', () => closeCredits(true));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!credits.hidden) closeCredits(true); else close(true); } });
  // CJ, 2026-09-24: 「會卡住」. On a phone the sheet covers most of the frame and the × is one small target, so the
  // page's own gestures close it as well: scrolling on (past a thumb's jitter), a tap anywhere outside, Escape above.
  // A tap on another marker or on the credits button is not a dismiss: those open their own thing.
  const anyOpen = () => !panel.hidden || !credits.hidden;
  const dismiss = () => { if (!credits.hidden) closeCredits(false); close(false); };
  window.addEventListener('scroll', () => { if (anyOpen() && Math.abs(window.scrollY - openedAtY) > 40) dismiss(); }, { passive: true });
  document.addEventListener('pointerdown', e => {
    if (!anyOpen() || !e.isPrimary) return;
    const t = e.target;
    if (!(t instanceof Element) || panel.contains(t) || credits.contains(t) || t.closest('.spot, #photoCreditsBtn')) return;
    dismiss();
  });

  // ── per frame: project each marker with the scroll camera, fade by frame and distance ──
  const wp = new THREE.Vector3();
  let lastEra = '', lastNow = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    const cam = S.camera, f = window.__fog;
    if (!cam || !f) return;
    const now = performance.now(), dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now;
    const era = f.era, u = f.progress, W = innerWidth, H = innerHeight;
    const closing = Math.min(1, Math.max(0, (u - CLOSING_FROM) / 0.05));   // markers step aside for the closing line, like the labels
    // CJ, 2026-09-24: 「興趣點在首頁點的到」. While the opening fog is up (app.js updateOpening, __fog.opening.fog > 0)
    // the title fills a phone's frame and the street behind it is a wash: no marker is drawn or takes a tap until
    // the fog has cleared. When it clears (OPENING.fogTo) is data.js's, not this file's.
    const veiled = !!(f.opening && f.opening.fog > 0);
    const farK = W < H ? 1.6 : 1;   // a portrait phone sees a narrow slice of the street: let the markers fade in while the building is still ahead and in frame
    let curVis = 0;
    for (let i = 0; i < SPOTS.length; i++) {
      const s = SPOTS[i], el = s.el;
      let vis = 0, sx = 0, sy = 0;
      if (!veiled && s.eras.indexOf(era) >= 0) {
        wp.set(s.x, s.y, s.z).project(cam);
        const dist = Math.hypot(s.x - cam.position.x, s.z - cam.position.z);
        const inFront = wp.z < 1 && Math.abs(wp.x) < 0.98 && Math.abs(wp.y) < 0.98;
        if (inFront) {
          const near = Math.min(1, Math.max(0, (s.far * farK - dist) / 30));
          const tooClose = Math.min(1, Math.max(0, (dist - 3) / 4));
          vis = near * tooClose * (1 - closing);
          sx = (wp.x + 1) / 2 * W; sy = (1 - wp.y) / 2 * H;
        }
      }
      if (s === current) curVis = vis;
      if (vis <= 0.02) { if (!el.hidden) { el.hidden = true; el.style.opacity = '0'; } continue; }
      if (el.hidden) el.hidden = false;
      el.style.opacity = vis.toFixed(2);
      el.style.transform = 'translate(' + sx.toFixed(0) + 'px,' + sy.toFixed(0) + 'px)';
    }
    // an open panel closes by itself once its building has been out of frame for a second
    if (current) { gone = curVis > 0.02 ? 0 : gone + dt; if (gone > 1) close(false); }
    if (era !== lastEra) { lastEra = era; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(frame));
  else requestAnimationFrame(frame);

  // a probe for testing, like window.__fog and window.__music
  window.__photos = { SPOTS, get open() { return current ? current.id : null; }, get creditsOpen() { return credits.classList.contains('show'); },
                      show(id) { const s = SPOTS.find(x => x.id === id); if (s) open(s, s.el); }, close: () => close(true), credits: openCredits,
                      get visible() { return SPOTS.filter(s => !s.el.hidden).map(s => [s.id, +s.el.style.opacity, s.el.style.transform]); } };
})();
