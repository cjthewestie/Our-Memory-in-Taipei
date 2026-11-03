// memories.js — the visitors' memories: a paper lantern where each one happened, and a form to leave one.
//
// CJ, 2026-10-31: 「people can visit freely and upload their memory in taipei」; text + an optional photo,
// approved by CJ before anyone else sees it. A memory is pinned to the spot the girl is standing on
// (just in front of her) in the square or in one of the three sections, and hangs there as a lantern.
// Walk up to one and press E (or tap the bubble, or click the lantern) to read it.
//
// Storage: Supabase (memories-config.js, supabase/schema.sql, docs/MEMORIES.md). The page only ever
// reads approved memories and submits new ones as pending; approving happens in the Supabase
// dashboard. With no config the page still works: the makers' own memories show, and what a visitor
// leaves is kept in their browser only, and the form tells them so.
//
// 2026-11-03 (research/similar-works/README.md §5, items #1 #5 #6):
//   #1 the page makes the memory's id itself, sends the row first (return=minimal: the anon key may not
//      read a pending row back), then the photo named <id>.webp, which the storage rule only lets in for
//      a pending memory that is waiting for exactly that file. MEMORY_CONFIG.submissionsOpen = false
//      closes the form (「暫停收件」) without touching the lanterns.
//   #5 the form asks something you can answer: a fill-in line for the place you are standing in
//      (「你第一次自己去西門町，是去……」), with 「或者，寫你想寫的」 for anything else; whose memory it is
//      (「我的／爸媽的／阿公阿嬤的」, 「回家問問他們」); a year that belongs to the street (信義 cannot be
//      1962); 「作者會先讀過，才會掛上街」 said before you send; what is kept, where, and how to have it taken
//      down. On a phone it stays above the keyboard (visualViewport) and clear of the notch.
//   #6 nine of the makers' own memories, so the board is never empty on the first visit.
//
// 2026-11-03, batch B3 (items #11 #12 #23):
//   #11 the lanterns are instanced: one InstancedMesh per part (paper, gold, tassel, halo) per section, the
//      halo a small billboard shader that takes this page's fog chunk (a Sprite cannot be instanced). At
//      most 30 are lit in a section at once: the pinned ones (your own, the one a link took you to), the
//      newest, and the rest by turns. Each memory has a place, one of the LANDMARKS a visitor can read
//      (紅樓前, 霞海城隍廟口……); left empty, the nearest one is named. The year is in the bubble when you
//      walk up, no longer painted on. A new lantern fades in, with a soft bell if the sound is on.
//      The square keeps its memories on the notice board, and the form now says so.
//   #12 the board is an exhibition: era tabs (once there are enough memories), a place filter, 「我家在……」
//      (the memories near your own street, and a walk there), a museum-label card (title, place, year,
//      story, byline: 「轉述爸媽的記憶」), 「帶我去那裡」 on every card, ?m=<id> links that walk you to a
//      lantern and open it (still pending: 「還在等作者讀過」), the link as a receipt when you send one,
//      and the memories near a building listed under its photograph (photos.js, MEMORIES.near).
//   #23 「我也記得 · I remember this too」: once per browser per memory; the lantern glows a little warmer.
//      The server keeps only a coarse level 0-3 per memory (schema.sql, memory_warmth); no number is ever
//      shown, here or anywhere (CJ's choice of the three gentle answers, 2026-11-03).
//
// Every string a visitor wrote reaches the page through textContent, never innerHTML.
(function () {
  'use strict';
  if (!window.THREE || !window.SCENE || !window.RIG || !window.WALK) return;
  const S = window.SCENE, R = window.RIG, WALK = window.WALK, scene = S.scene, C = S.C;
  const CFG = window.MEMORY_CONFIG || {};
  const ONLINE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const OPEN = CFG.submissionsOpen !== false;          // the emergency switch: only an explicit false closes it
  const API = ONLINE ? CFG.supabaseUrl.replace(/\/+$/, '') : '';
  const BUCKET = CFG.bucket || 'memory-photos';
  const LOCAL_KEY = 'our-memory-in-taipei:memories';
  const MAX_TEXT = 280, MAX_NAME = 40, MAX_TITLE = 40, NEAR = 4.5;
  const MAX_LIT = 30;                                  // item #11: lit at once in one section
  const TABS_FROM = 12;                                // item #12: below this many memories the board shows 「全部」 only
  const REMEMBERED_KEY = 'our-memory-in-taipei:remembered', SENT_KEY = 'our-memory-in-taipei:sent';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const ISSUES = 'https://github.com/cjthewestie/Our-Memory-in-Taipei/issues';

  const PLACE = { square: '廣場 · The Square', red: '西門町 · Ximending', dadao: '大稻埕 · Dadaocheng', tower: '信義 · Xinyi' };
  // the years each place is: the form offers only these (the square is every year since 1950), and
  // schema.sql checks the same ranges
  const YEARS = { square: [1950, 2026], red: [1985, 1999], dadao: [2000, 2019], tower: [2020, 2027] };
  const THIS_YEAR = new Date().getFullYear();
  const yearsOf = sec => { const r = YEARS[sec] || YEARS.square, lo = r[0], hi = Math.max(lo, Math.min(sec === 'square' ? THIS_YEAR : r[1], THIS_YEAR)); return [lo, hi]; };
  // what the year shows when the form opens: the middle of the street's own years (信義: this year);
  // the square has no single era, so it starts at 「記不清了」 and the visitor picks
  const DEFAULT_YEAR = { square: null, red: 1990, dadao: 2010, tower: THIS_YEAR };
  const WHOSE = {
    me:           { zh: '我的', en: 'Mine', by: '' },
    parents:      { zh: '爸媽的', en: 'My parents’', by: '轉述爸媽的記憶 · a parent’s memory, retold' },
    grandparents: { zh: '阿公阿嬤的', en: 'My grandparents’', by: '轉述阿公阿嬤的記憶 · a grandparent’s memory, retold' },
  };
  // the places a memory can name (item #11): ones a visitor knows by name, each a spot on the walkable
  // street (|x| ≤ 8.4) in front of the thing itself. Positions follow the scene files: 紅樓 data.js
  // anchors (x 11, z -70), 樂聲 and 武昌街 scene-red.js (z -66), 中華商場 (z -40), the 1999 pedestrian
  // zone (z -96 … -144), 萬年 (z -124); 迪化街 (z -195 … -245), 霞海城隍廟 (z -240), the 民生西路 gap to
  // the wharf (z -198 … -214), 永樂市場 (z -263 … -285) in scene-dadao.js; the skywalk (z -392) and the
  // tower's front (z -402) in scene-tower.js. The ids are what the database keeps (schema.sql checks the
  // shape, not the list, so a place can be added here without touching the database).
  const LANDMARKS = [
    { id: 'banyan',   section: 'square', x: 0,    z: 150,  zh: '榕樹下',       en: 'Under the banyan' },
    { id: 'westgate', section: 'red',    x: -3,   z: 24,   zh: '西門町口',     en: 'Where Ximending begins' },
    { id: 'chunghwa', section: 'red',    x: -5.2, z: -40,  zh: '中華商場天橋', en: 'The Zhonghua Market footbridge' },
    { id: 'cinema',   section: 'red',    x: -5.2, z: -66,  zh: '武昌街電影街', en: 'The cinema street, Wuchang Street' },
    { id: 'redhouse', section: 'red',    x: 5.4,  z: -72,  zh: '紅樓前',       en: 'In front of the Red House' },
    { id: 'walkzone', section: 'red',    x: 0.6,  z: -112, zh: '行人徒步區',   en: 'The pedestrian zone' },
    { id: 'wannian',  section: 'red',    x: -5.4, z: -126, zh: '萬年大樓前',   en: 'Outside the Wannian Building' },
    { id: 'nianhuo',  section: 'dadao',  x: 0,    z: -170, zh: '年貨大街',     en: 'The New Year market' },
    { id: 'wharf',    section: 'dadao',  x: -5.6, z: -206, zh: '往碼頭的巷口', en: 'The lane down to the wharf' },
    { id: 'dihua',    section: 'dadao',  x: 5.4,  z: -222, zh: '迪化街騎樓下', en: 'Under the Dihua Street arcades' },
    { id: 'temple',   section: 'dadao',  x: -5.4, z: -240, zh: '霞海城隍廟口', en: 'Outside the City God Temple' },
    { id: 'yongle',   section: 'dadao',  x: -5.4, z: -274, zh: '永樂市場前',   en: 'Outside Yongle Market' },
    { id: 'cityhall', section: 'tower',  x: 3,    z: -318, zh: '往市府的路上', en: 'On the way to City Hall' },
    { id: 'plaza',    section: 'tower',  x: -5,   z: -358, zh: '百貨公司前',   en: 'Outside the department stores' },
    { id: 'skywalk',  section: 'tower',  x: -2,   z: -386, zh: '空橋下',       en: 'Under the skywalk' },
    { id: 'foot101',  section: 'tower',  x: 3,    z: -397, zh: '101 腳下',     en: 'At the foot of 101' },
  ];
  const LM = {}; LANDMARKS.forEach(l => { LM[l.id] = l; });
  const nearestLandmark = (sec, x, z) => {
    let best = null, bd = Infinity;
    LANDMARKS.forEach(l => { if (l.section !== sec) return; const d = Math.hypot(l.x - x, l.z - z); if (d < bd) { bd = d; best = l; } });
    return best;
  };
  // a memory's place: the one it names, or (none, or one from another street) the nearest
  const placeOf = m => (m.place && LM[m.place] && LM[m.place].section === m.section) ? LM[m.place] : nearestLandmark(m.section, m.x, m.z);
  const placeLine = m => { const l = placeOf(m); return l ? l.zh + ' · ' + l.en : ''; };
  // a landmark in an English sentence: "where Ximending begins", "under the skywalk", "at the pedestrian zone"
  const enWhere = l => /^(In|At|On|Under|Outside|Where)\b/.test(l.en) ? l.en[0].toLowerCase() + l.en.slice(1) : 'at ' + l.en.replace(/^The /, 'the ');
  // the fill-in lines (item #5): a question you can answer standing there, and the words it starts you with
  const PROMPTS = {
    red: [
      { zh: '你第一次自己去西門町，是去……', en: 'The first time you went to Ximending on your own, it was to…', start: '我第一次自己去西門町，是去' },
      { zh: '那年在西門町，我們排隊……', en: 'That year in Ximending, we queued for…', start: '那年在西門町，我們排隊' },
    ],
    dadao: [
      { zh: '那年過年，家裡……', en: 'That New Year, at home…', start: '那年過年，家裡' },
      { zh: '在迪化街，我買了……', en: 'On Dihua Street, I bought…', start: '在迪化街，我買了' },
    ],
    tower: [
      { zh: '你在 101 下面等誰？', en: 'Who were you waiting for at the foot of 101?', start: '我在 101 下面等' },
      { zh: '那年跨年倒數，我在……', en: 'That New Year’s Eve countdown, I was…', start: '那年跨年倒數，我在' },
    ],
    square: [
      { zh: '那年在這裡，我……', en: 'That year, here, I…', start: '那年在這裡，我' },
      { zh: '樹下，有人教我……', en: 'Under the tree, someone taught me…', start: '樹下，有人教我' },
    ],
  };
  const FREE = { zh: '或者，寫你想寫的', en: 'Or write whatever you like', label: '寫你想寫的', labelEn: 'Write whatever you like' };
  const STARTS = [].concat(...Object.values(PROMPTS)).map(p => p.start);

  // The makers' own memories (item #6): the first lanterns on the street, so the board is not empty.
  // Two are the README's words (the ten dollars, the climb), kept as written, with the Chinese put in
  // front of them in review (2026-11-03) so that every seed reads Chinese first like the form; the others were written for this page by its makers, in
  // their own voice, about real places in the years each street is. They are the makers', and say so
  // (name, and the note under each); they are not anyone else's testimony and name no one.
  // Long and short on purpose (the plan: a seed that is too polished stops people writing), one is a
  // single line, and one is a grandmother's memory told by her grandchild, the 「阿公阿嬤的」 kind.
  const MAKERS = '本頁作者 · the makers of this page';
  const SEEDS = [
    { id: 'seed-tv-1962', section: 'square', x: 0, z: 150, year: 1962, whose: 'grandparents', place: 'banyan', title: '廟口的第一台電視',
      body: '阿嬤說，1962 年電視剛開播，里長在廟口擺了一台，整條街的人搬板凳來看。她說她坐在最前面，看到都忘了回家煮飯。\nGrandma says that in 1962, when television had just begun, the 里長 set one up by the temple and the whole street brought stools. She sat in the front row and forgot to go home and cook.' },
    { id: 'seed-chess-1987', section: 'square', x: 0, z: 150, year: 1987, whose: 'me', place: 'banyan', title: '讓我一隻車',
      body: '1987 年我七歲，大樹下有一位伯伯教我下象棋，每次都讓我一隻車，我還是輸。\nIn 1987 I was seven. An old man under the banyan taught me 象棋 and always gave me a chariot start, and I still lost.' },
    { id: 'seed-ten-dollars', section: 'red', x: -5.2, z: 18, year: 1990, whose: 'me', place: 'westgate', title: '那十塊錢',
      body: '小時候在西門町，媽媽塞給我們的那十塊錢。\nThe ten dollars our mothers gave us in Ximending when we were small.' },
    { id: 'seed-zhonghua-1992', section: 'red', x: -5.0, z: -43, year: 1992, whose: 'me', place: 'chunghwa', title: '爸爸的第一副眼鏡',
      body: '1992 年中華商場要拆了。爸爸牽著我走天橋過去，指著一間關起來的小店說，他的第一副眼鏡是在這裡配的。\nIn 1992 the Zhonghua Market was coming down. Dad walked me over the footbridge and pointed at a shuttered stall: that is where he got his first pair of glasses.' },
    { id: 'seed-movie-1994', section: 'red', x: -4.6, z: -69, year: 1994, whose: 'me', place: 'cinema', title: '最後一班車',
      body: '1994 年暑假，第一次沒有大人，跟同學搭公車去西門町。在武昌街的電影街排了好久的隊，散場出來天已經黑了，我們一路跑去趕最後一班車。\nSummer 1994: the first time we went to Ximending with no grown-ups. We queued for ages on the cinema street on Wuchang Street, came out into the dark, and ran all the way to the last bus.' },
    { id: 'seed-dihua-2008', section: 'dadao', x: 5.0, z: -214, year: 2008, whose: 'me', place: 'dihua', title: '一包烏魚子',
      body: '2008 年過年前，跟媽媽去迪化街辦年貨，人擠到腳好像碰不到地。她每一攤都試吃，最後只買了一包烏魚子。\nBefore New Year 2008, Mum and I went to Dihua Street for the New Year market, so crowded my feet barely touched the ground. She tasted at every stall and in the end bought one pack of mullet roe.' },
    { id: 'seed-pier-2014', section: 'dadao', x: -5.5, z: -205, year: 2014, whose: 'me', place: 'wharf', title: '堤防上的煙火',
      body: '2014 年七夕，我們坐在大稻埕碼頭的堤防上看煙火。\nQixi 2014: we sat on the river wall at Dadaocheng Wharf and watched the fireworks.' },
    { id: 'seed-countdown-2020', section: 'tower', x: -4.0, z: -392, year: 2020, whose: 'me', place: 'skywalk', title: '數到零的時候',
      body: '2020 年的最後一晚，大家都戴著口罩倒數。數到零的時候，我在 101 下面打視訊給在國外的妹妹，她那邊還是早上。\nThe last night of 2020, everyone counting down in masks. At zero I video-called my sister abroad from the foot of 101; it was still morning where she was.' },
    { id: 'seed-climb', section: 'tower', x: 4.5, z: -394, year: Math.min(THIS_YEAR, YEARS.tower[1]), whose: 'me', place: 'foot101', title: '一起爬得更高',
      body: '終於可以親手做出一點自己的東西的那天，我們抬頭看台北 101，塔上高高的那個人正在對我們揮手。一起爬得更高吧。\nThe day we could finally build something of our own, we looked up at Taipei 101, and the man high on the tower was waving at us. Let’s climb higher, together.' },
  ];
  // (items #11 #12) each seed names its place and hangs in front of it, and has a title for its label
  SEEDS.forEach(m => { m.seed = true; m.name = MAKERS; });

  // ── the lanterns (item #11): instanced, at most MAX_LIT lit per section ──────
  // square.js's Taiwanese 燈籠 (lathe body, gold caps and rim, tassel, halo), drawn as one InstancedMesh
  // per part for each section: four draw calls for a section's lanterns however many there are. All
  // the parts of one lantern share its instance matrix (square.js bakes each part's offset into its
  // geometry). The paper is pale and the instance colour tints it: the makers' red, a visitor's orange,
  // this browser's own amber, warmer still for a memory people remember (#23). The halo is a billboard
  // in a small shader, because a Sprite cannot be instanced; it takes the page's fog like everything
  // else (app.js replaces the fog chunks; withFog hands it the veil's uniforms) and fades out in it
  // instead of turning fog-coloured, since it is added on top of what is behind it.
  const group = new THREE.Group(); scene.add(group);
  const SQM = window.SQUARE;
  const BODY = { seed: '#d23a2a', visitor: '#e0582c', local: '#e8952f' };
  const SIZE = 0.9;
  const kindOf = m => m.seed ? 'seed' : m.local ? 'local' : 'visitor';
  const fogged = mat => (S.withFog ? S.withFog(mat) : mat);
  const KIT = SQM && SQM.lanternKit ? SQM.lanternKit() : (function fallbackKit() {
    // no square.js: plain shapes, so the memories still hang somewhere
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,200,120,0.95)'); r.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    const gold = new THREE.CylinderGeometry(0.19, 0.19, 0.07, 12); gold.translate(0, 0.5, 0);
    const tassel = new THREE.ConeGeometry(0.075, 0.42, 8, 1, true); tassel.translate(0, -0.74, 0);
    return { body: new THREE.CylinderGeometry(0.4, 0.4, 0.96, 16), gold, tassel, paper: null, halo: new THREE.CanvasTexture(cv), haloSize: 2.1, goldColor: '#c9a043', tasselColor: '#c4211b' };
  })();
  const paperMat = fogged(new THREE.MeshBasicMaterial({ color: 0xffffff, map: KIT.paper || null, toneMapped: false }));   // lit from inside: dusk does not darken it
  const goldMat = fogged(S.lit ? S.lit({ color: new THREE.Color(KIT.goldColor), metalness: 0.6, roughness: 0.35, vertexColors: false })
                               : new THREE.MeshStandardMaterial({ color: new THREE.Color(KIT.goldColor), metalness: 0.6, roughness: 0.35 }));
  const tasselMat = fogged(new THREE.MeshBasicMaterial({ color: new THREE.Color(KIT.tasselColor), side: THREE.DoubleSide }));
  const haloUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSize: { value: KIT.haloSize || 2.1 } }]);
  haloUniforms.map = { value: KIT.halo };              // after the merge: merge would clone the texture
  const haloMat = fogged(new THREE.ShaderMaterial({
    uniforms: haloUniforms,
    vertexShader: `
      uniform float uSize;
      attribute float aWarm;
      attribute float aFade;
      varying vec2 vUv;
      varying float vWarm;
      varying float vFade;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vWarm = aWarm; vFade = aFade;
        // the lantern's centre, then the quad laid out in view space so it always faces the camera
        vec3 transformed = vec3(0.0);
        float s = length(instanceMatrix[0].xyz) * uSize * (1.0 + 0.08 * aWarm);
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        mvPosition.xy += position.xy * s;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;
      varying float vWarm;
      varying float vFade;
      #include <fog_pars_fragment>
      void main() {
        vec4 t = texture2D(map, vUv);
        vec3 col = t.rgb * mix(vec3(1.0), vec3(1.12, 1.0, 0.84), clamp(vWarm / 3.0, 0.0, 1.0));
        gl_FragColor = vec4(col, t.a * vFade * (1.0 + 0.1 * vWarm));
        // tone-mapped like the Sprite it replaces (review, 2026-11-03: without it the halo came out
        // brighter than before and a warm lantern washed out to cream)
        #include <tonemapping_fragment>
        #include <fog_fragment>
        #ifdef USE_FOG
          gl_FragColor.a *= 1.0 - fogFactor;
        #endif
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
  }));
  const SECS = ['red', 'dadao', 'tower'];
  const SETS = {};
  SECS.forEach(sec => {
    const n = MAX_LIT;
    const body = new THREE.InstancedMesh(KIT.body, paperMat, n);
    body.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const gold = new THREE.InstancedMesh(KIT.gold, goldMat, n);
    const tassel = new THREE.InstancedMesh(KIT.tassel, tasselMat, n);
    const hg = new THREE.PlaneGeometry(1, 1);
    const aWarm = new THREE.InstancedBufferAttribute(new Float32Array(n), 1), aFade = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    hg.setAttribute('aWarm', aWarm); hg.setAttribute('aFade', aFade);
    const halo = new THREE.InstancedMesh(hg, haloMat, n);
    halo.renderOrder = 3;
    const meshes = [body, gold, tassel, halo];
    meshes.forEach(o => {
      o.count = 0; o.visible = false; o.frustumCulled = false;     // the bounds are the geometry's, not the instances'
      o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      o.userData.lanternSet = sec; group.add(o);
    });
    SETS[sec] = { body, gold, tassel, halo, aWarm, aFade, meshes, slots: [] };
  });

  // on the street: each memory floats where it was left. A memory left in the square has no street
  // lantern: the square shows its memories on the notice board instead (below).
  const memories = [];   // { m, sec, x, z, phase, lit, fade, pin, level, mine, pulse }
  const entryOf = m => memories.find(e => e.m === m || e.m.id === (m && m.id));
  let started = false;   // the first batch (seeds, this browser's own, the first fetch) does not chime
  // many = true while a whole batch is coming in (the fetch, the seeds): the caller relights and redraws
  // the board once at the end. Review, 2026-11-03: one at a time, 500 fetched memories redrew the board's
  // canvas (and re-sorted everything) 500 times on load, which a phone feels.
  function addLantern(m, many) {
    if (!m || memories.some(e => e.m.id === m.id)) return null;
    const e = { m, sec: m.section, x: +m.x || 0, z: +m.z || 0, phase: (m.x * 3.1 + m.z * 1.7) % 6.28, lit: false, fade: 0, pin: !!m.local, level: 0, mine: remembered.has(m.id), pulse: 0, fresh: started };
    memories.push(e);
    if (many === true) return e;
    if (SETS[e.sec]) relight(e.sec);
    rebuildTree();
    return e;
  }
  function addAll(list) {
    (Array.isArray(list) ? list : []).forEach(m => addLantern(m, true));
    SECS.forEach(relight); rebuildTree();
  }
  // which lanterns are lit: all of them up to MAX_LIT; past that the pinned ones, the newest dozen, and
  // the rest in an order that changes every ROTATE seconds, so every lantern has its turns
  const ROTATE = 45;
  let epoch = 0;
  const born = e => (e.m.created_at ? Date.parse(e.m.created_at) : 0) || 0;
  function relight(sec) {
    const set = SETS[sec]; if (!set) return;
    const all = memories.filter(e => e.sec === sec);
    let chosen = all;
    if (all.length > MAX_LIT) {
      const pinned = all.filter(e => e.pin), rest = all.filter(e => !e.pin).sort((a, b) => born(b) - born(a));
      const fresh = rest.slice(0, 12), pool = rest.slice(12);
      let k = (epoch + 1) * 2654435761 % 4294967296;
      const r = () => (k = (k * 1103515245 + 12345) % 2147483648) / 2147483648;
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      chosen = pinned.concat(fresh, pool).slice(0, MAX_LIT);
    }
    all.forEach(e => { const on = chosen.indexOf(e) >= 0; if (on && !e.lit) e.fade = 0; e.lit = on; });
    set.slots = chosen;
  }
  // in the square: the newest memories, pinned to the notice board (square.js), and listed in full when
  // you walk up to it and press E
  const BOARD = SQM && SQM.board;
  const newest = () => memories.map(e => e.m).slice().sort((a, b) => (b.created_at ? Date.parse(b.created_at) : 0) - (a.created_at ? Date.parse(a.created_at) : 0));
  function rebuildTree() { if (BOARD) BOARD.setNotes(newest().slice(0, 8)); if (!list.hidden) fillList(); }

  // ── 我也記得 (item #23): once per browser per memory, kept here; the shared level comes from schema.sql ──
  const remembered = new Set((() => { try { const a = JSON.parse(localStorage.getItem(REMEMBERED_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch (_) { return []; } })());
  const saveRemembered = () => { try { localStorage.setItem(REMEMBERED_KEY, JSON.stringify(Array.from(remembered).slice(-500))); } catch (_) { } };
  const warmthOf = e => Math.min(3, Math.max(e.level || 0, e.mine ? 1 : 0));

  // ── storage ─────────────────────────────────────────────────────────────────
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch (_) { return []; } };
  const saveLocal = list => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); return true; } catch (_) { return false; } };
  const headers = extra => Object.assign({ apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, extra || {});
  const photoURL = m => m.photoData ? m.photoData : (m.photo_path && ONLINE ? `${API}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(m.photo_path)}` : null);
  // lower-case, as schema.sql's photo name rule expects; crypto.randomUUID needs a secure context, so
  // there is a getRandomValues fallback for a page served over plain http
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (c === 'x' ? r : (r & 3) | 8).toString(16); })).toLowerCase();

  // the columns the page reads (schema.sql grants exactly these): whose (item #5), title and place (#11 #12)
  const COLS = 'id,created_at,section,x,z,year,body,name,whose,photo_path,title,place';
  async function fetchApproved() {
    if (!ONLINE) return;
    try {
      const q = 'select=' + COLS + '&status=eq.approved&order=created_at.desc&limit=500';
      const res = await fetch(`${API}/rest/v1/memories?${q}`, { headers: headers() });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      addAll(await res.json());
    } catch (e) { console.warn('[memories] could not load the shared memories:', e.message); }
    fetchWarmth();
  }
  // one memory by its id, for a ?m= link to one older than the newest 500 (item #12). Approved only:
  // a pending one comes back as nothing, and the page says 「還在等作者讀過」.
  async function fetchOne(id) {
    if (!ONLINE || !UUID_RE.test(id)) return null;
    try {
      const res = await fetch(`${API}/rest/v1/memories?select=${COLS}&id=eq.${id}&status=eq.approved&limit=1`, { headers: headers() });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const rows = await res.json();
      return rows && rows[0] ? (addLantern(rows[0]) || entryOf(rows[0])) : null;
    } catch (e) { console.warn('[memories] could not look up that memory:', e.message); return null; }
  }
  // how warmly each memory is remembered (item #23): schema.sql's memory_warmth view gives only a level,
  // 1 to 3, for the memories that have any; never a count
  async function fetchWarmth() {
    if (!ONLINE) return;
    try {
      const res = await fetch(`${API}/rest/v1/memory_warmth?select=memory_id,level&limit=2000`, { headers: headers() });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const rows = await res.json(), by = {};
      (Array.isArray(rows) ? rows : []).forEach(r => { if (r && typeof r.memory_id === 'string') by[r.memory_id] = Math.max(0, Math.min(3, r.level | 0)); });
      memories.forEach(e => { if (by[e.m.id] !== undefined) e.level = by[e.m.id]; });
    } catch (e) { console.warn('[memories] could not read how the memories are remembered:', e.message); }
  }
  // leave one 「我也記得」 (item #23). Only an approved memory in the shared store has a row to point at;
  // the makers' seeds and this browser's own lanterns keep theirs here only. A refusal (the speed limit,
  // a second one from this address) is not the visitor's business: the lantern stays warmer here.
  async function sendOffering(m) {
    if (!ONLINE || m.seed || m.local || !UUID_RE.test(m.id)) return;
    try {
      const res = await fetch(`${API}/rest/v1/offerings`, { method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify({ memory_id: m.id }) });
      if (!res.ok && res.status !== 409) console.warn('[memories] the 「我也記得」 did not arrive:', res.status);
    } catch (e) { console.warn('[memories] the 「我也記得」 did not arrive:', e.message); }
  }

  // a photo, made small: at most 1280 px on the long side, webp (jpeg where the browser cannot), under
  // 1.9 MB. Drawing it onto a canvas and encoding it again is also what strips the camera's EXIF data,
  // the place it was taken included, so none of that leaves the visitor's phone.
  async function shrink(file, maxSide) {
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) { src = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); }); }
    const k = Math.min(1, maxSide / Math.max(src.width, src.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k);
    cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
    const toBlob = (type, q) => new Promise(ok => cv.toBlob(ok, type, q));
    let type = 'image/webp', q = 0.82, blob = await toBlob(type, q);
    if (!blob || blob.type !== 'image/webp') { type = 'image/jpeg'; blob = await toBlob(type, q); }
    while (blob && blob.size > 1.9e6 && q > 0.4) { q -= 0.12; blob = await toBlob(type, q); }
    if (!blob) throw new Error('這張照片讀不出來。 · This photo could not be read.');
    return { blob, type, ext: type === 'image/webp' ? 'webp' : 'jpg', canvas: cv };
  }

  // what the database said, in words (schema.sql raises 'rate_limited' and 'duplicate' from its trigger)
  async function refusal(res) {
    let j = null; try { j = await res.json(); } catch (_) { }
    const msg = j && j.message, code = j && j.code;
    if (res.status === 429 || msg === 'rate_limited' || code === 'PT429')
      return '現在送來的記憶太多了，請過幾分鐘再試。 · A lot of memories are arriving right now. Please try again in a few minutes.';
    if (msg === 'duplicate' || code === 'PT409')
      return '這段記憶我們已經收到了，謝謝你。 · We already have this memory. Thank you.';
    return '沒有送出去（' + res.status + '），請等一下再試。 · It did not save (' + res.status + '). Please try again in a moment.';
  }

  // The order matters and matches schema.sql (item #1): 1. make the id here; 2. send the row with
  // photo_path already set to <id>.webp|jpg; 3. upload the photo under that name, which the storage
  // rule only accepts while that row is pending and has no file yet. No step 4 "patch photo_path": the
  // row already names its photo, and the anon key has no update right at all (nobody can edit a
  // memory from the page). If the photo fails after the row went in, the memory still arrives; its
  // card hides a photo that will not load, and docs/MEMORIES.md tells the makers to clear photo_path.
  async function submit(rec, file) {
    if (!ONLINE) {
      if (file) { const p = await shrink(file, 640); rec.photoData = p.canvas.toDataURL(p.type, 0.7); }
      rec.id = 'local-' + uuid(); rec.local = true; rec.created_at = new Date().toISOString();
      const list = loadLocal(); list.push(rec);
      if (!saveLocal(list)) { delete rec.photoData; list[list.length - 1] = rec; if (!saveLocal(list)) throw new Error('這個瀏覽器不讓我們存下來（無痕模式？） · This browser would not save it (private mode?).'); }
      addLantern(rec);
      return { how: 'local', id: rec.id };
    }
    const id = uuid();
    const p = file ? await shrink(file, 1280) : null;
    const photo_path = p ? id + '.' + p.ext : null;
    // a phone that loses its signal makes fetch throw a bare English "Failed to fetch": say it properly
    // (review, 2026-11-03)
    const res = await fetch(`${API}/rest/v1/memories`, {
      method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ id, section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, whose: rec.whose, title: rec.title, place: rec.place, photo_path }) })
      .catch(() => { throw new Error('連不上網路，還沒送出去，請再按一次。 · No connection, not sent yet. Please try again.'); });
    if (!res.ok) throw new Error(await refusal(res));
    rememberSent(id);
    if (!p) return { how: 'pending', id };
    try {
      const up = await fetch(`${API}/storage/v1/object/${BUCKET}/${photo_path}`, {
        method: 'POST', headers: headers({ 'Content-Type': p.type, 'x-upsert': 'false', 'Cache-Control': 'max-age=31536000' }), body: p.blob });
      if (!up.ok) throw new Error(String(up.status));
    } catch (e) { console.warn('[memories] the words arrived but the photo did not:', e.message); return { how: 'pending-nophoto', id }; }
    return { how: 'pending', id };
  }
  // the ids this browser sent (item #12): a ?m= link to one of them that is still pending can say it is yours
  const sentHere = () => { try { const a = JSON.parse(localStorage.getItem(SENT_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (_) { return []; } };
  function rememberSent(id) { try { localStorage.setItem(SENT_KEY, JSON.stringify(sentHere().concat(id).slice(-50))); } catch (_) { } }

  // ── DOM: the bubble, the reading panel, the form ────────────────────────────
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  const bubble = el('button', 'mem-bubble', document.body);
  bubble.type = 'button'; bubble.hidden = true;
  bubble.innerHTML = '<span class="mem-b-k">A memory</span><span class="mem-b-key">E</span>';
  let nearest = null;
  let nearBoard = false;
  bubble.addEventListener('click', () => { if (nearBoard) openList(); else if (nearest) openRead(nearest.m); });

  // the reading card (item #12): a museum label. Title, place, year, the story, who it belongs to; then
  // 「帶我去那裡」 and 「我也記得」.
  const panel = el('aside', 'mem-panel mem-read', document.body); panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'memReadBody');
  const pClose = el('button', 'mem-close', panel, '×'); pClose.type = 'button'; pClose.setAttribute('aria-label', '關閉 · Close');
  const pFig = el('div', 'mem-fig', panel); const pImg = el('img', '', pFig); pImg.alt = ''; pImg.decoding = 'async';
  pImg.addEventListener('error', () => { pFig.hidden = true; });          // a photo that never arrived (see submit)
  const pBody = el('div', 'mem-body', panel);
  const pK = el('div', 'mem-k', pBody);
  const pTitle = el('h2', 'mem-label-title', pBody);
  const pMeta = el('div', 'mem-label-meta', pBody);
  const pPlace = el('span', 'mem-label-place', pMeta), pYear = el('span', 'mem-label-year', pMeta);
  const pText = el('p', 'mem-text', pBody); pText.id = 'memReadBody';
  const pBy = el('div', 'mem-by', pBody);
  const pActs = el('div', 'mem-acts', pBody);
  const pGo = el('button', 'wk-btn mem-go-btn', pActs, '帶我去那裡 · Take me there'); pGo.type = 'button';
  const pRem = el('button', 'wk-btn mem-rem', pActs); pRem.type = 'button';
  const pNote = el('div', 'mem-note', pBody);
  pClose.addEventListener('click', closeRead);
  const byLine = m => {
    const who = m.name && m.name.trim() ? m.name.trim() : '一位在那裡的人 · someone who was there';
    const w = WHOSE[m.whose] && WHOSE[m.whose].by;
    return '— ' + who + (w ? ' · ' + w : '');
  };
  let reading = null;
  const setRem = m => {
    const done = remembered.has(m.id);
    pRem.textContent = done ? '你也記得 · You remember this too' : '我也記得 · I remember this too';
    pRem.setAttribute('aria-pressed', String(done)); pRem.disabled = done; pRem.classList.toggle('done', done);
  };
  function openRead(m) {
    closeForm(); list.hidden = true;
    reading = m;
    panel.classList.remove('mem-waiting');
    pK.textContent = PLACE[m.section] || '';
    const t = m.title && String(m.title).trim();
    pTitle.textContent = t || ''; pTitle.hidden = !t;
    pPlace.textContent = placeLine(m); pYear.textContent = m.year ? String(m.year) : '記不清哪一年 · year not sure';
    pMeta.hidden = false;
    pText.textContent = m.body;
    pBy.textContent = byLine(m); pBy.hidden = false;
    pNote.textContent = m.local ? '只存在這個瀏覽器裡。 · Kept in this browser only.'
      : m.seed ? '這是本頁作者自己的記憶。 · One of the makers’ own memories.' : '';
    const u = photoURL(m);
    pFig.hidden = !u; if (u) pImg.src = u; else pImg.removeAttribute('src');
    // 「帶我去那裡」 is for a lantern that is somewhere else: not when she is already standing under it
    const e = entryOf(m), p = WALK.on ? WALK.pos : null;
    const here = e && p && WALK.where === m.section && (m.section === 'square' ? (BOARD && Math.hypot(BOARD.x - p.x, BOARD.z - p.z) < BOARD.r + 1) : Math.hypot(e.x - p.x, e.z - p.z) < 6);
    pGo.hidden = !e || !!here;
    pRem.hidden = false; setRem(m);
    pActs.hidden = false;
    panel.hidden = false; pClose.focus({ preventScroll: true });
  }
  // a ?m= link to a memory the page cannot show (item #12): still pending, only in another browser, or gone
  function openWaiting(kind) {
    closeForm(); list.hidden = true; reading = null;
    panel.classList.add('mem-waiting');
    pK.textContent = '分享的燈籠 · A shared lantern';
    const T = {
      pending: ['還在等作者讀過', '這盞燈籠還在等作者讀過。讀過之後，這個連結就會帶你到它下面。\nThis lantern is still waiting to be read by the makers. Once it has been, this link will take you to it.'],
      mine: ['你的燈籠還在等作者讀過', '謝謝你。作者讀過之後，這個連結就會帶你到你的燈籠下面。\nThank you. Once the makers have read it, this link will take you to your lantern.'],
      local: ['這盞燈籠在別的瀏覽器裡', '這一盞只存在留下它的那個瀏覽器裡，所以這裡找不到。\nThis lantern is kept only in the browser it was left in, so it cannot be found here.'],
      unknown: ['找不到這盞燈籠', '這個連結找不到燈籠。它可能還在等作者讀過，或者已經拿下來了。\nThis link does not lead to a lantern. It may still be waiting to be read, or it has been taken down.'],
    }[kind] || [];
    pTitle.textContent = T[0] || ''; pTitle.hidden = false;
    pMeta.hidden = true; pBy.hidden = true; pActs.hidden = true; pFig.hidden = true; pImg.removeAttribute('src');
    pText.textContent = T[1] || ''; pNote.textContent = '';
    panel.hidden = false; pClose.focus({ preventScroll: true });
  }
  function closeRead() { panel.hidden = true; reading = null; }
  pGo.addEventListener('click', () => { if (reading) goTo(reading); });
  pRem.addEventListener('click', () => { if (reading) remember(reading); });

  // 我也記得 (item #23): no number, ever; the lantern warms a little and gives one soft glow now
  function remember(m) {
    if (!m || remembered.has(m.id)) return;
    remembered.add(m.id); saveRemembered();
    const e = entryOf(m);
    if (e) { e.mine = true; e.pulse = 1; }
    if (window.AMBIENCE && AMBIENCE.chime) AMBIENCE.chime(true);
    sendOffering(m);
    if (reading === m) setRem(m);
  }

  // 帶我去那裡 (item #12): walk.js puts her a few steps from the lantern, facing it, with the lantern
  // lit (pinned, so the 30-lantern limit never leaves it dark); a square memory takes her to the board
  function standBy(e) {
    if (e.sec === 'square') {
      if (!BOARD) return { x: 0, z: 158, h: Math.PI };
      const SQ = SQM.SQ, dx = (SQ.x - 2) - BOARD.x, dz = (SQ.z + 22) - BOARD.z, l = Math.hypot(dx, dz) || 1;
      const x = BOARD.x + dx / l * 3.2, z = BOARD.z + dz / l * 3.2;
      return { x, z, h: Math.atan2(-(BOARD.x - x), -(BOARD.z - z)) };
    }
    const x = Math.max(-8, Math.min(8, e.x * 0.45)), z = e.z + 3.4;
    return { x, z, h: Math.atan2(-(e.x - x), -(e.z - z)) };
  }
  function goTo(m, after) {
    const e = entryOf(m); if (!e) return false;
    if (!WALK.on && WALK.startWalk) WALK.startWalk(true);
    e.pin = true; relight(e.sec);
    closeForm(); list.hidden = true; closeRead();
    walkTo(e.sec, standBy(e), after);
    return true;
  }
  // walk.js refuses a move while another is still fading (enter returns false): try again once it is done
  function walkTo(sec, at, after, tries) {
    if (WALK.enter(sec, false, at) === false) { if ((tries || 0) < 20) setTimeout(() => walkTo(sec, at, after, (tries || 0) + 1), 450); return; }
    if (after) setTimeout(after, 600);
  }

  // the board's list (item #12): an exhibition you can walk through by era, by place, or from your own
  // street (「我家在……」, the first thing people look for in a map of the old city)
  const list = el('aside', 'mem-panel mem-list', document.body); list.hidden = true;
  list.setAttribute('role', 'dialog'); list.setAttribute('aria-labelledby', 'memListTitle');
  const lClose = el('button', 'mem-close', list, '×'); lClose.type = 'button'; lClose.setAttribute('aria-label', '關閉 · Close');
  const lBody = el('div', 'mem-body', list);
  el('div', 'mem-k', lBody, '記憶公布欄 · The memory board');
  const lTitle = el('h2', 'mem-title', lBody, '大家的記憶'); lTitle.id = 'memListTitle';
  el('span', 'mem-title-en', lTitle, 'Everyone’s memories');
  const lTabs = el('div', 'mem-tabs', lBody); lTabs.setAttribute('role', 'tablist'); lTabs.setAttribute('aria-label', '年代 · Era');
  const ERA_TABS = [
    { k: 'all', zh: '全部', en: 'All' },
    { k: 'e1', zh: '1999 以前', en: 'To 1999' },
    { k: 'e2', zh: '2000–2019', en: '2000–2019' },
    { k: 'e3', zh: '2020–', en: '2020 on' },
  ];
  const eraOf = m => { const y = m.year || ({ red: 1990, dadao: 2010, tower: 2024 })[m.section]; return !y ? null : y <= 1999 ? 'e1' : y <= 2019 ? 'e2' : 'e3'; };
  const lFilters = el('div', 'mem-filters', lBody);
  const placeWrap = el('label', 'mem-filter', lFilters); el('span', '', placeWrap, '地點 · Place');
  const lPlace = el('select', '', placeWrap);
  const homeWrap = el('label', 'mem-filter', lFilters); el('span', '', homeWrap, '我家在…… · I live near…');
  const lHome = el('select', '', homeWrap);
  (function homeOptions() {
    el('option', '', lHome, '選一個地方 · Choose a place').value = '';
    [['red', '西門町 · Ximending'], ['dadao', '大稻埕 · Dadaocheng'], ['tower', '信義 · Xinyi']].forEach(([sec, label]) => {
      const og = el('optgroup', '', lHome); og.label = label;
      LANDMARKS.filter(l => l.section === sec).forEach(l => { const o = el('option', '', og, l.zh + ' · ' + l.en); o.value = l.id; });
    });
  })();
  const lHomeBox = el('div', 'mem-home', lBody); lHomeBox.hidden = true;
  const lHomeText = el('p', '', lHomeBox);
  const lHomeGo = el('button', 'wk-btn primary', lHomeBox); lHomeGo.type = 'button';
  const lItems = el('ol', 'mem-items', lBody);
  const lEmpty = el('p', 'mem-empty', lBody); lEmpty.hidden = true;
  lClose.addEventListener('click', () => { list.hidden = true; });
  const filt = { era: 'all', place: '', home: '' };
  function tabsFill(shown) {
    lTabs.textContent = '';
    lTabs.hidden = !shown;
    if (!shown) { filt.era = 'all'; return; }
    ERA_TABS.forEach(t => {
      const b = el('button', 'mem-tab', lTabs); b.type = 'button'; b.setAttribute('role', 'tab');
      el('span', '', b, t.zh); if (t.en !== t.zh) el('em', '', b, t.en);
      b.setAttribute('aria-selected', String(filt.era === t.k));
      b.addEventListener('click', () => { filt.era = t.k; fillList(); });
    });
  }
  function placesFill(all, shown) {
    placeWrap.hidden = !shown;
    if (!shown) { filt.place = ''; return; }
    const ids = new Set(all.map(m => { const l = placeOf(m); return l ? l.id : null; }).filter(Boolean));
    lPlace.textContent = '';
    el('option', '', lPlace, '所有地方 · Everywhere').value = '';
    LANDMARKS.filter(l => ids.has(l.id)).forEach(l => { const o = el('option', '', lPlace, l.zh + ' · ' + l.en); o.value = l.id; });
    if (!ids.has(filt.place)) filt.place = '';
    lPlace.value = filt.place;
  }
  lPlace.addEventListener('change', () => { filt.place = lPlace.value; filt.home = ''; lHome.value = ''; fillList(); });
  lHome.addEventListener('change', () => { filt.home = lHome.value; if (filt.home) { filt.place = ''; filt.era = 'all'; } fillList(); });
  lHomeGo.addEventListener('click', () => {
    const l = LM[filt.home]; if (!l) return;
    if (!WALK.on && WALK.startWalk) WALK.startWalk(true);
    list.hidden = true;
    walkTo(l.section, { x: l.x * 0.6, z: l.z + 4, h: Math.atan2(-(l.x - l.x * 0.6), 4) });
  });
  function fillList() {
    const all = newest();
    const many = all.length >= TABS_FROM;
    tabsFill(many); placesFill(all, many);
    lItems.textContent = '';
    let shown = all;
    const home = LM[filt.home];
    lHomeBox.hidden = !home;
    if (home) {
      // the memories on that street, nearest first, within a short walk of it
      shown = all.filter(m => m.section === home.section && Math.hypot(m.x - home.x, m.z - home.z) < 45)
        .sort((a, b) => Math.hypot(a.x - home.x, a.z - home.z) - Math.hypot(b.x - home.x, b.z - home.z));
      lHomeText.textContent = shown.length
        ? '離' + home.zh + '最近的記憶。 · Nearest first: ' + home.en + '.'
        : home.zh + '附近還沒有記憶：你可以去那裡留下第一盞。 · No memories near there yet: you could leave the first one.';
      lHomeGo.textContent = '帶我去' + home.zh + ' · Take me there';
    } else {
      if (filt.era !== 'all') shown = shown.filter(m => eraOf(m) === filt.era);
      if (filt.place) shown = shown.filter(m => { const l = placeOf(m); return l && l.id === filt.place; });
    }
    shown.forEach(m => {
      const li = el('li', 'mem-li', lItems), b = el('button', 'mem-item', li); b.type = 'button';
      const t = m.title && String(m.title).trim();
      if (t) el('span', 'mem-item-title', b, t);
      el('span', 'mem-item-k', b, [placeOf(m) ? placeOf(m).zh : (PLACE[m.section] || ''), m.year ? String(m.year) : ''].filter(Boolean).join(' · '));
      el('span', 'mem-item-t', b, m.body);
      if (m.name || (WHOSE[m.whose] && WHOSE[m.whose].by)) el('span', 'mem-item-by', b, byLine(m));
      b.addEventListener('click', () => { list.hidden = true; openRead(m); });
      const go = el('button', 'mem-item-go', li, '帶我去 · Go'); go.type = 'button';
      go.setAttribute('aria-label', '帶我去那裡 · Take me there' + (t ? '：' + t : ''));
      go.addEventListener('click', () => goTo(m, () => openRead(m)));
    });
    lEmpty.hidden = shown.length > 0 || !!home;
    lEmpty.textContent = '這裡還沒有記憶。 · No memories here yet.';
  }
  function openList() { closeForm(); closeRead(); fillList(); list.hidden = false; lClose.focus({ preventScroll: true }); }

  // the memories near a building (item #12), for photos.js's panel: approved ones and the makers' (not
  // this browser's own, which nobody else can see), on the same street, by year
  const ZR = {}; (S.ERAS || []).forEach(e => { ZR[e.key] = e.zRange; });
  const sectionAtZ = z => { for (const k of SECS) { const r = ZR[k]; if (r && z <= r[0] && z > r[1]) return k; } return z < -290 ? 'tower' : null; };
  function near(x, z, r) {
    const sec = sectionAtZ(z); if (!sec) return [];
    return memories.filter(e => e.sec === sec && !e.m.local && Math.hypot(e.x - x, e.z - z) < (r || 30))
      .map(e => e.m).sort((a, b) => (a.year || 9999) - (b.year || 9999));
  }

  // ── the form (item #5): Chinese first, English second ────────────────────────
  const form = el('form', 'mem-form', document.body); form.hidden = true; form.noValidate = true;
  form.setAttribute('role', 'dialog'); form.setAttribute('aria-labelledby', 'memFormTitle');
  // the fixed parts are written here; every part that changes (the prompts, the years, the place, the
  // contact) is set with textContent below
  form.innerHTML =
    '<button type="button" class="mem-close" aria-label="關閉 · Close">×</button>' +
    '<div class="mem-body">' +
      '<div class="mem-k" id="memFormWhere"></div>' +
      '<h2 class="mem-title" id="memFormTitle"><span id="memFormZh">在這裡留下一段記憶</span><span class="mem-title-en" id="memFormEn">Leave a memory here</span></h2>' +
      // the square (item #11): its memories go on the notice board, not on a lantern, and the form says so
      '<p class="mem-where-note" hidden>廣場的記憶不掛燈籠，會釘在榕樹旁的公布欄上，大家走過來都讀得到。<em>Memories left in the square are pinned to the notice board by the banyan, not hung as lanterns.</em></p>' +
      '<div class="mem-closed" hidden>' +
        '<p class="mem-closed-zh">暫停收件</p>' +
        '<p>作者暫時不收新的記憶，街上的燈籠和公布欄照常可以讀。請過一陣子再來。</p>' +
        '<p class="mem-en">Not taking new memories for now. The lanterns and the board can still be read. Please come back a little later.</p>' +
      '</div>' +
      '<div class="mem-fields">' +
        '<div class="mem-prompts" role="group" aria-label="提示 · Prompts"></div>' +
        '<label class="mem-field"><span class="mem-q"><span id="memQ"></span><em id="memQEn"></em></span>' +
          '<textarea name="body" rows="4" maxlength="' + MAX_TEXT + '" required></textarea>' +
          '<span class="mem-count"><span id="memCount">0</span>/' + MAX_TEXT + '</span></label>' +
        // item #12: a title for its label, one line, optional
        '<label class="mem-field"><span>一句標題 <em>A title, one line (可不填 optional)</em></span><input name="title" type="text" maxlength="' + MAX_TITLE + '" autocomplete="off" placeholder="例如：那十塊錢 · e.g. The ten dollars"></label>' +
        // item #11: where it was, from the places on this street; left as it is, the nearest one is named
        '<label class="mem-field mem-place"><span>在哪裡 <em>Where</em></span><select name="place"></select><span class="mem-hint">選了別的地方，燈籠就會掛在那裡。 <em>Choose another place and the lantern hangs there instead.</em></span></label>' +
        '<fieldset class="mem-whose"><legend>這是誰的記憶 <em>Whose memory is this?</em></legend>' +
          Object.keys(WHOSE).map(k => '<label><input type="radio" name="whose" value="' + k + '"' + (k === 'me' ? ' checked' : '') + '> <span>' + WHOSE[k].zh + '<em>' + WHOSE[k].en + '</em></span></label>').join('') +
          '<p class="mem-hint">不是你的也可以：回家問問他們。 <em>It needn’t be yours: ask them at home.</em></p>' +
        '</fieldset>' +
        '<div class="mem-row">' +
          '<label class="mem-field"><span>哪一年 <em>Year</em></span><select name="year"></select></label>' +
          '<label class="mem-field"><span>你的名字 <em>Your name (可不填 optional)</em></span><input name="name" type="text" maxlength="' + MAX_NAME + '" autocomplete="nickname"></label>' +
        '</div>' +
        '<label class="mem-field"><span>一張照片 <em>可不填，要是你拍的或可以分享的 · A photo, optional: one you took or may share</em></span><input name="photo" type="file" accept="image/*"></label>' +
        '<label class="mem-hp" aria-hidden="true">Leave this empty <input name="website" type="text" tabindex="-1" autocomplete="off"></label>' +
        '<p class="mem-notice"></p>' +
        '<label class="mem-consent"><input name="ok" type="checkbox" required> <span>我同意這段記憶公開顯示在這個網頁上。<em>I’m happy for this to be shown publicly on this page.</em></span></label>' +
        '<details class="mem-privacy"><summary>隱私 · Privacy</summary><div class="mem-privacy-body"></div></details>' +
        // the status line rides in the sticky bar beside the button, so a refusal is never scrolled out of sight
        '<div class="mem-actions"><p class="mem-status" role="status" aria-live="polite"></p><button type="submit" class="wk-btn primary"></button></div>' +
      '</div>' +
      // the receipt (item #12): the link to this lantern, given the moment it is sent
      '<div class="mem-receipt" hidden role="status" aria-live="polite">' +
        '<p class="mem-receipt-zh"></p><p class="mem-en mem-receipt-en"></p>' +
        '<label class="mem-field"><span>你的燈籠的連結 <em>Your lantern’s link</em></span><input class="mem-receipt-url" type="text" readonly></label>' +
        '<p class="mem-receipt-note"></p>' +
        '<div class="mem-receipt-acts"><button type="button" class="wk-btn mem-copy">複製連結 · Copy link</button><button type="button" class="wk-btn primary mem-done">好 · Done</button></div>' +
      '</div>' +
    '</div>';
  const F = {
    close: form.querySelector('.mem-close'), where: form.querySelector('#memFormWhere'), body: form.elements.body, year: form.elements.year,
    name: form.elements.name, photo: form.elements.photo, hp: form.elements.website, ok: form.elements.ok,
    status: form.querySelector('.mem-status'), send: form.querySelector('button[type=submit]'), count: form.querySelector('#memCount'),
    prompts: form.querySelector('.mem-prompts'), q: form.querySelector('#memQ'), qEn: form.querySelector('#memQEn'),
    notice: form.querySelector('.mem-notice'), privacy: form.querySelector('.mem-privacy-body'),
    fields: form.querySelector('.mem-fields'), closed: form.querySelector('.mem-closed'),
    title: form.elements.title, place: form.elements.place, placeWrap: form.querySelector('.mem-place'),
    hZh: form.querySelector('#memFormZh'), hEn: form.querySelector('#memFormEn'), whereNote: form.querySelector('.mem-where-note'),
    receipt: form.querySelector('.mem-receipt'), rZh: form.querySelector('.mem-receipt-zh'), rEn: form.querySelector('.mem-receipt-en'),
    rUrl: form.querySelector('.mem-receipt-url'), rNote: form.querySelector('.mem-receipt-note'), rCopy: form.querySelector('.mem-copy'), rDone: form.querySelector('.mem-done'),
  };
  // the share link (item #12): this page, with ?m=<id> and nothing else
  const shareURL = id => location.origin + location.pathname + '?m=' + encodeURIComponent(id);
  F.rDone.addEventListener('click', closeForm);
  F.rCopy.addEventListener('click', () => {
    const v = F.rUrl.value, done = () => { F.rCopy.textContent = '已複製 · Copied'; setTimeout(() => { F.rCopy.textContent = '複製連結 · Copy link'; }, 2400); };
    const pick = () => { F.rUrl.focus(); F.rUrl.select(); try { if (document.execCommand('copy')) done(); } catch (_) { } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, pick); else pick();
  });
  F.rUrl.addEventListener('focus', () => F.rUrl.select());
  // the places on this street, nearest first; the first option is 「就在這裡」 (the nearest, named)
  let autoPlace = null;
  function buildPlaces(sec, x, z) {
    F.place.textContent = '';
    autoPlace = nearestLandmark(sec, x, z);
    F.placeWrap.hidden = sec === 'square' || !autoPlace;
    if (F.placeWrap.hidden) return;
    const o0 = el('option', '', F.place, '就在這裡：' + autoPlace.zh + '附近 · Right here, near ' + autoPlace.en.replace(/^The /, 'the ')); o0.value = '';
    LANDMARKS.filter(l => l.section === sec && l !== autoPlace)
      .sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))
      .forEach(l => { const o = el('option', '', F.place, l.zh + ' · ' + l.en); o.value = l.id; });
    F.place.value = '';
  }
  const whoseNow = () => { const r = form.querySelector('input[name=whose]:checked'); return r && WHOSE[r.value] ? r.value : 'me'; };

  // 「作者會先讀過，才會掛上街」 (or, unconnected, that it stays in this browser), said before sending
  (function notice() {
    const a = el('span', '', F.notice, ONLINE ? '作者會先讀過，才會掛上街。' : '這一版還沒接上共用的資料庫：你的燈籠只存在這個瀏覽器裡，只有你看得到。');
    a.className = 'mem-notice-zh';
    el('span', '', F.notice, '請不要寫出別人的全名或聯絡方式。');
    el('em', '', F.notice, ONLINE
      ? 'The makers read every memory before it goes up. Please don’t write anyone’s full name or contact details.'
      : 'This copy isn’t connected to a shared store yet: your lantern is kept in this browser, and only you will see it. Please don’t write anyone’s full name or contact details.');
  })();

  // the privacy note: what is kept, where, that photos lose their EXIF location, how to have it taken down
  (function privacy() {
    const P = F.privacy;
    const para = (zh, en) => { const p = el('p', '', P, zh); el('em', '', p, en); return p; };
    if (ONLINE) {
      para('收集什麼：你寫的字、標題（可不填）、地點、年份、是誰的記憶、你填的名字（可不填）、照片（可不填）、燈籠掛的位置和送出的時間；按「我也記得」時，只記下是哪一則。為了擋垃圾訊息，伺服器會記下你連線位址的單向雜湊（還原不回位址，每天換一次），只用來算短時間內送了幾則。不收 email，不放追蹤器。',
        'What is kept: your words, the title (optional), the place, the year, whose memory it is, the name you give (optional), the photo (optional), where the lantern hangs and when it was sent; a 「我也記得」 keeps only which memory it was for. To stop spam, the server keeps a one-way hash of your connection’s address (it cannot be turned back into the address and changes every day), used only to count how many were sent in a short time. No e-mail, no trackers.');
      const region = CFG.storageRegion ? '（' + String(CFG.storageRegion) + '）' : '';
      para('放在哪裡：作者的 Supabase 專案' + region + '，資料庫和照片空間。還在審核的記憶只有作者看得到；核准之後，所有來這個網頁的人都看得到。',
        'Where: the makers’ Supabase project' + (CFG.storageRegion ? ' (' + String(CFG.storageRegion) + ')' : '') + ', its database and photo storage. Only the makers can see a memory waiting to be read; once approved, everyone who visits this page can.');
    } else {
      para('收集什麼、放在哪裡：這一版沒有接上任何伺服器。你寫的字和照片只存在這個瀏覽器裡（localStorage），不會傳到任何地方；清除瀏覽器資料就會消失。',
        'What is kept, and where: this copy is not connected to any server. Your words and photo stay in this browser (localStorage) and go nowhere else; clearing the browser’s data removes them.');
    }
    para('照片：會先在你的瀏覽器裡縮小、重新編碼，所以相機的 EXIF 資料（包括拍攝地點）不會被送出去。',
      'Photos are made smaller and re-encoded in your browser first, so the camera’s EXIF data, the place it was taken included, is not sent.');
    const p = para('想要下架：', 'To have a memory taken down: ');
    const contact = String(CFG.privacyContact || '').trim();
    let href = null, label = contact;
    if (/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(contact)) href = 'mailto:' + contact;
    else if (/^https:\/\/[^\s<>"]+$/.test(contact)) href = contact;
    if (!href) { href = ISSUES; label = 'GitHub issues'; }
    const link = (parent) => { const a = el('a', '', null, label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.insertBefore(a, parent.lastChild); };
    // zh: 「想要下架：寫到 <聯絡方式>，附上記憶開頭的幾個字和年份，我們會整則拿掉，照片也是。」
    p.insertBefore(document.createTextNode('寫到 '), p.lastChild); link(p);
    p.insertBefore(document.createTextNode('，附上記憶開頭的幾個字和年份，我們會整則拿掉，照片也是。' + (contact ? '' : '（那裡是公開的，請不要寫私人資料。）')), p.lastChild);
    const en = p.lastChild;
    en.textContent = 'To have a memory taken down, write to ';
    const a2 = el('a', '', en, label); a2.href = href; a2.target = '_blank'; a2.rel = 'noopener noreferrer';
    en.appendChild(document.createTextNode(' with its first few words and its year, and we will remove all of it, photo included.' + (contact ? '' : ' (That page is public: please leave out anything private.)')));
  })();

  // the prompts for the place you are standing in
  let promptIdx = 0, spotSec = 'square';
  function setPrompt(i, fill) {
    const list = PROMPTS[spotSec] || PROMPTS.square, pr = i >= 0 ? list[i] : null;
    promptIdx = i;
    F.q.textContent = pr ? pr.zh : FREE.label;
    F.qEn.textContent = pr ? pr.en : FREE.labelEn;
    F.prompts.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    // a fill-in: the line starts with the prompt's own words, unless the visitor has already written something
    const v = F.body.value.trim();
    const untouched = !v || STARTS.indexOf(v) >= 0;
    if (fill && untouched) F.body.value = pr ? pr.start : '';
    F.body.placeholder = pr ? pr.start + '……' : '那一年、那個地方、那個人…… · A year, a place, someone…';
    F.count.textContent = F.body.value.length;
  }
  function buildPrompts() {
    F.prompts.textContent = '';
    const add = (i, zh, en) => {
      const b = el('button', 'mem-prompt' + (i < 0 ? ' free' : ''), F.prompts); b.type = 'button'; b.dataset.i = i;
      el('span', '', b, zh); el('em', '', b, en);
      b.addEventListener('click', () => { setPrompt(i, true); F.body.focus(); const n = F.body.value.length; try { F.body.setSelectionRange(n, n); } catch (_) { } });
    };
    (PROMPTS[spotSec] || PROMPTS.square).forEach((p, i) => add(i, p.zh, p.en));
    add(-1, FREE.zh, FREE.en);
  }
  // the years of the place you are standing in, newest first, and 「記不清了」 for not sure
  function buildYears() {
    const [lo, hi] = yearsOf(spotSec), keep = parseInt(F.year.value, 10);
    F.year.textContent = '';
    const o0 = el('option', '', F.year, '記不清了 · Not sure'); o0.value = '';
    for (let y = hi; y >= lo; y--) { const o = el('option', '', F.year, String(y)); o.value = String(y); }
    const d = keep >= lo && keep <= hi ? keep : DEFAULT_YEAR[spotSec];
    F.year.value = d && d >= lo && d <= hi ? String(d) : (d ? String(Math.max(lo, Math.min(hi, d))) : '');
  }

  F.send.textContent = '掛上我的燈籠 · Hang my lantern';
  F.body.addEventListener('input', () => { F.count.textContent = F.body.value.length; });
  F.close.addEventListener('click', closeForm);
  let spot = null, openedAt = 0, lastSent = 0;
  function openForm() {
    if (!WALK.on) return;
    closeRead(); list.hidden = true;
    const p = WALK.pos, where = WALK.where;
    F.where.textContent = PLACE[where];
    F.status.textContent = ''; F.status.classList.remove('ok'); F.send.disabled = false;
    F.receipt.hidden = true;
    // the emergency switch (item #1): the form says so, and nothing can be sent
    F.closed.hidden = OPEN; F.fields.hidden = !OPEN;
    form.classList.toggle('closed', !OPEN);
    if (OPEN) {
      // just in front of her, so the lantern hangs where she is looking
      let x = p.x - Math.sin(p.h) * 1.6, z = p.z - Math.cos(p.h) * 1.6;
      if (where !== 'square') x = Math.max(-8.4, Math.min(8.4, x));
      spot = { section: where, x: +x.toFixed(2), z: +z.toFixed(2) };
      buildPlaces(where, spot.x, spot.z);
      F.hZh.textContent = where === 'square' ? '在公布欄留下一段記憶' : '在這裡掛一盞記憶的燈籠';
      F.hEn.textContent = where === 'square' ? 'Pin a memory to the board' : 'Hang a memory here as a lantern';
      F.whereNote.hidden = where !== 'square';
      const changed = spotSec !== where;
      spotSec = where;
      buildPrompts(); buildYears();
      if (changed && STARTS.indexOf(F.body.value.trim()) >= 0) F.body.value = '';
      setPrompt(changed || promptIdx >= (PROMPTS[where] || []).length ? 0 : promptIdx, true);
      F.send.textContent = where === 'square' ? '釘上公布欄 · Pin it to the board' : '掛上我的燈籠 · Hang my lantern';
    }
    form.hidden = false; openedAt = performance.now(); fitViewport();
    form.scrollTop = 0;
    // a phone opens its keyboard on focus, which would hide the prompts before they are read, so on a
    // touch screen the focus goes to the close button and the textarea waits for a tap
    setTimeout(() => { if (OPEN && !matchMedia('(pointer: coarse)').matches) F.body.focus({ preventScroll: true }); else F.close.focus({ preventScroll: true }); }, 30);
  }
  function closeForm() { form.hidden = true; }

  // a phone's keyboard (item #5): iOS does not shrink the page when the keyboard opens, it only shrinks
  // the visual viewport, so a fixed, centred form ends up under the keys. Track visualViewport and keep
  // the open card inside it; the send button is sticky at the card's foot, and the field being typed in
  // is scrolled into view inside the card.
  const VV = window.visualViewport;
  const rootStyle = document.documentElement.style;
  function fitViewport() {
    const h = VV ? VV.height : innerHeight, t = VV ? VV.offsetTop : 0;
    rootStyle.setProperty('--mem-vvh', h.toFixed(1) + 'px');
    rootStyle.setProperty('--mem-vvt', t.toFixed(1) + 'px');
  }
  function keepFocusedInView() {
    const a = document.activeElement;
    if (form.hidden || !a || !form.contains(a) || !/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    // by hand rather than scrollIntoView: the sticky send bar covers the card's foot, and what counts as
    // "in view" is the part of the card above it
    const fr = form.getBoundingClientRect(), r = a.getBoundingClientRect(), bar = form.querySelector('.mem-actions');
    const top = fr.top + 8, bottom = fr.bottom - (bar ? bar.offsetHeight : 0) - 4;
    if (r.top >= top && r.bottom <= bottom) return;
    form.scrollTop += r.height > bottom - top ? r.top - top : (r.top + r.bottom) / 2 - (top + bottom) / 2;
  }
  if (VV) {
    VV.addEventListener('resize', () => { fitViewport(); setTimeout(keepFocusedInView, 60); });
    VV.addEventListener('scroll', fitViewport);
  }
  window.addEventListener('resize', fitViewport);
  form.addEventListener('focusin', () => setTimeout(keepFocusedInView, 320));
  fitViewport();

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!OPEN) return;
    const body = F.body.value.trim(), name = F.name.value.trim(), yearS = F.year.value.trim(), title = F.title.value.trim().replace(/\s+/g, ' ');
    const year = yearS ? parseInt(yearS, 10) : null;
    const [lo, hi] = yearsOf(spot.section);
    const say = (t, ok) => { F.status.textContent = t; F.status.classList.toggle('ok', !!ok); };
    if (F.hp.value) return say('謝謝。 · Thank you.');                                  // a bot filled the hidden field
    if (!body) return say('先寫一兩句吧。 · Write a line or two first.');
    if (STARTS.indexOf(body) >= 0) return say('把這句接下去寫完吧。 · Finish the sentence first.');
    if (body.length > MAX_TEXT) return say('請寫在 ' + MAX_TEXT + ' 個字以內。 · Keep it under ' + MAX_TEXT + ' characters.');
    if (title.length > MAX_TITLE) return say('標題請在 ' + MAX_TITLE + ' 個字以內。 · Keep the title under ' + MAX_TITLE + ' characters.');
    if (year !== null && (isNaN(year) || year < lo || year > hi)) return say('這裡的年份是 ' + lo + '–' + hi + '。 · The year here is between ' + lo + ' and ' + hi + '.');
    if (!F.ok.checked) return say('請勾選同意公開顯示。 · Please tick the box to say it can be shown.');
    if (performance.now() - openedAt < 2500) return say('等一下下…… · One moment…');
    if (Date.now() - lastSent < 30000) return say('謝謝，一次一盞就好，半分鐘後再來。 · Thank you, one lantern at a time. Try again in half a minute.');
    const file = F.photo.files && F.photo.files[0];
    if (file && !/^image\//.test(file.type)) return say('這個檔案不是照片。 · That file is not a photo.');
    if (file && file.size > 25e6) return say('這張照片太大了。 · That photo is too large.');
    F.send.disabled = true; say(file ? '正在把照片縮小…… · Making the photo small…' : '正在掛上去…… · Hanging it…');
    // where it hangs (item #11): where she stands, unless the visitor chose another place on this street,
    // in which case in front of that place, a step or two off its centre so two never hang in one spot
    let x = spot.x, z = spot.z, place = null;
    const chosen = spot.section !== 'square' && F.place.value && LM[F.place.value];
    if (chosen && chosen.section === spot.section) {
      place = chosen.id;
      x = +(Math.max(-8.4, Math.min(8.4, chosen.x + (Math.random() - 0.5) * 2.4))).toFixed(2);
      z = +(chosen.z + (Math.random() - 0.5) * 4).toFixed(2);
    }
    try {
      const r = await submit({ section: spot.section, x, z, year, body, name: name || null, whose: whoseNow(), title: title || null, place }, file);
      const how = r.how;
      lastSent = Date.now();
      F.body.value = ''; F.name.value = ''; F.title.value = ''; F.photo.value = ''; F.ok.checked = false; F.count.textContent = '0';
      form.querySelector('input[name=whose][value=me]').checked = true;
      setPrompt(0, true); buildYears();
      say('');
      // the receipt (item #12): the link to this lantern, now, while it is still waiting to be read
      // (review, 2026-11-03: a lantern sent to another place says that place, not 「這裡」)
      F.rZh.textContent = how === 'local' ? (spot.section === 'square' ? '你的記憶釘上公布欄了，存在這個瀏覽器裡。' : '你的燈籠掛在' + (place ? LM[place].zh : '這裡') + '了，存在這個瀏覽器裡。')
        : how === 'pending-nophoto' ? '字收到了，但照片沒有傳上去。作者讀過之後，燈籠會亮起來（沒有照片）。'
        : spot.section === 'square' ? '謝謝你。作者讀過之後，它就會釘上公布欄。' : '謝謝你。作者讀過之後，你的燈籠就會在' + (place ? LM[place].zh : '這裡') + '亮起來。';
      F.rEn.textContent = how === 'local' ? (spot.section === 'square' ? 'Your memory is pinned to the board, kept in this browser.' : 'Your lantern is hanging ' + (place ? enWhere(LM[place]) : 'here') + ', kept in this browser.')
        : how === 'pending-nophoto' ? 'Your words arrived but the photo did not upload. The lantern will light up, without it, once it has been read.'
        : spot.section === 'square' ? 'Thank you. It will be pinned to the board once it has been read.' : 'Thank you. Your lantern will light up ' + (place ? enWhere(LM[place]) : 'here') + ' once it has been read.';
      F.rUrl.value = shareURL(r.id);
      F.rNote.textContent = how === 'local'
        ? '這個連結只在這個瀏覽器裡打得開。 · This link only opens in this browser.'
        : '核准後，這個連結就會帶你到你的燈籠；在那之前，打開它會說「還在等作者讀過」。 · Once approved, this link takes you to your lantern; until then it says it is still waiting to be read.';
      F.fields.hidden = true; F.receipt.hidden = false; form.scrollTop = 0;
      setTimeout(() => F.rDone.focus({ preventScroll: true }), 30);
    } catch (e) {
      say(e.message || '出了點問題，請再試一次。 · Something went wrong. Please try again.');
    } finally { F.send.disabled = false; }
  });

  // the button in the walk bar
  const leave = el('button', 'wk-btn primary', null, '+ Leave a memory');
  leave.type = 'button'; leave.id = 'wkLeave';
  if (WALK.bar) WALK.bar.insertBefore(leave, WALK.bar.firstChild);
  leave.addEventListener('click', openForm);

  // keys: E reads the nearest, Escape closes
  window.addEventListener('keydown', ev => {
    const t = ev.target;
    if (ev.key === 'Escape') { if (!form.hidden) closeForm(); else if (!panel.hidden) closeRead(); else if (!list.hidden) list.hidden = true; return; }
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ((ev.key === 'e' || ev.key === 'E') && WALK.on && panel.hidden && form.hidden && list.hidden) {
      if (nearBoard) { ev.preventDefault(); openList(); } else if (nearest) { ev.preventDefault(); openRead(nearest.m); }
    }
  });

  // a click (not a drag) on a lantern opens it, in either mode
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  R.canvas.addEventListener('pointerdown', ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; });
  R.canvas.addEventListener('pointerup', ev => {
    if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6 || performance.now() - down.t > 500) { down = null; return; }
    down = null;
    ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, R.camera);
    const set = SETS[WALK.section()];
    const targets = set && set.body.visible && set.body.count ? [set.body] : [];
    if (BOARD && BOARD.mesh && WALK.section() === 'square') targets.push(BOARD.mesh);
    const hit = ray.intersectObjects(targets, false)[0];
    if (hit && BOARD && hit.object === BOARD.mesh) { openList(); return; }
    if (hit && set && hit.object === set.body && hit.instanceId != null && set.slots[hit.instanceId]) openRead(set.slots[hit.instanceId].m);
  });

  // ── per frame: the lit lanterns of the place you are in, bobbing; the nearest; the bubble ──
  const v = new THREE.Vector3();
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E3 = new THREE.Euler(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3();
  const COL = {}; Object.keys(BODY).forEach(k => { COL[k] = new THREE.Color(BODY[k]); });
  const WARM = new THREE.Color('#ffae55'), tint = new THREE.Color();
  let lastT = 0, rotAt = 0, shownSec = null;
  const ease = f => f * f * (3 - 2 * f);
  function tick(now) {
    const sec = WALK.section(), t = now / 1000, inSquare = sec === 'square';
    const dt = Math.min(0.1, Math.max(0, t - (lastT || t))); lastT = t;
    // the turns: past 30 in a section, a different handful every ROTATE seconds
    if (t - rotAt > ROTATE) { rotAt = t; epoch++; SECS.forEach(k => { if (memories.filter(e => e.sec === k).length > MAX_LIT) relight(k); }); }
    let best = null, bestD = NEAR;
    const p = WALK.on ? WALK.pos : null;
    if (shownSec !== sec) {           // a new place: its lanterns light up again, one after another
      shownSec = sec;
      const set = SETS[sec]; if (set) set.slots.forEach((e, i) => { e.fade = -i * 0.05; });
    }
    SECS.forEach(k => {
      const set = SETS[k], on = !inSquare && k === sec;
      set.meshes.forEach(o => { o.visible = on && set.slots.length > 0; });
      if (!on) return;
      const n = set.slots.length;
      set.meshes.forEach(o => { o.count = n; });
      for (let i = 0; i < n; i++) {
        const e = set.slots[i];
        if (e.fade < 1) {
          const was = e.fade;
          e.fade = Math.min(1, e.fade + dt / 1.4);
          // a lantern that has just been hung lights with one soft bell, if the sound is on
          if (e.fresh && was <= 0 && e.fade > 0) { e.fresh = false; if (window.AMBIENCE && AMBIENCE.chime) AMBIENCE.chime(true); }
        }
        if (e.pulse > 0) e.pulse = Math.max(0, e.pulse - dt / 2.2);
        const f = ease(Math.max(0, e.fade)), w = warmthOf(e), glow = w + e.pulse * 1.5;
        const y = 2.9 + Math.sin(t * 1.3 + e.phase) * 0.12;
        const sc = SIZE * (0.55 + 0.45 * f) * (1 + 0.035 * w);
        M4.compose(P3.set(e.x, y, e.z), Q4.setFromEuler(E3.set(0, Math.sin(t * 0.7 + e.phase) * 0.25, 0)), S3.set(sc, sc, sc));
        set.body.setMatrixAt(i, M4); set.gold.setMatrixAt(i, M4); set.tassel.setMatrixAt(i, M4); set.halo.setMatrixAt(i, M4);
        // dark paper that lights from inside as it fades in; warmer (more amber, a touch brighter) the
        // more it is remembered (#23), and a short glow right after a 「我也記得」
        tint.copy(COL[kindOf(e.m)]).lerp(WARM, 0.12 * w + 0.2 * e.pulse).multiplyScalar((0.1 + 0.9 * f) * (1 + 0.05 * w + 0.25 * e.pulse));
        set.body.setColorAt(i, tint);
        set.aWarm.setX(i, glow); set.aFade.setX(i, f);
        if (p) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bestD) { bestD = d; best = e; } }
      }
      set.meshes.forEach(o => { o.instanceMatrix.needsUpdate = true; });
      set.body.instanceColor.needsUpdate = true; set.aWarm.needsUpdate = true; set.aFade.needsUpdate = true;
    });
    // the board: near enough, and it is the thing to read
    let board = false;
    if (inSquare && BOARD && p && Math.hypot(BOARD.x - p.x, BOARD.z - p.z) < BOARD.r && !best) board = true;
    nearBoard = board;
    nearest = best;
    // the shared bubble (item #11): the year of the lantern you are under, now that it is not painted on
    bubble.firstChild.textContent = nearBoard ? '記憶公布欄 · Read' : best ? (best.m.year ? best.m.year + ' · 一段記憶' : '一段記憶 · A memory') : 'A memory';
    if ((best || nearBoard) && panel.hidden && form.hidden && list.hidden) {
      if (nearBoard) v.set(BOARD.x, 3.4, BOARD.z); else v.set(best.x, 2.9 + Math.sin(t * 1.3 + best.phase) * 0.12 + 0.9, best.z);
      v.project(R.camera);
      if (v.z < 1) {
        bubble.hidden = false;
        bubble.style.transform = `translate(${((v.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - v.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
      } else bubble.hidden = true;
    } else bubble.hidden = true;
    requestAnimationFrame(tick);
  }

  // ── ?m=<id> (item #12): walk to that lantern and open it ─────────────────────
  const QS = new URLSearchParams(location.search);
  const SHARED = (QS.get('m') || '').trim().toLowerCase();
  const SHARE_RE = /^(seed-[a-z0-9-]{1,40}|local-[0-9a-f-]{36}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
  let firstLoad = null;
  async function openShared() {
    if (!SHARED) return;
    if (!SHARE_RE.test(SHARED)) { console.warn('[memories] that ?m= is not a memory id'); return; }
    // the first-visit card goes first (it is where the visitor chooses sound or quiet); then the walk
    await new Promise(ok => { const wait = () => (WALK.welcoming || WALK.busy) ? setTimeout(wait, 200) : ok(); wait(); });
    if (firstLoad) await firstLoad;
    let e = memories.find(x => x.m.id === SHARED);
    if (!e && ONLINE) e = await fetchOne(SHARED);
    if (e) {
      if (ONLINE && !e.m.seed && !e.m.local) fetchWarmth();
      goTo(e.m, () => openRead(e.m));
    } else if (/^local-/.test(SHARED)) openWaiting('local');
    else if (UUID_RE.test(SHARED)) openWaiting(sentHere().indexOf(SHARED) >= 0 ? 'mine' : 'pending');
    else openWaiting('unknown');
  }

  const ownLocal = loadLocal();
  addAll(SEEDS.concat((Array.isArray(ownLocal) ? ownLocal : []).filter(m => m && typeof m === 'object').map(m => { m.local = true; return m; })));
  firstLoad = fetchApproved().then(() => { started = true; }, () => { started = true; });
  if (!ONLINE) started = true;
  requestAnimationFrame(tick);
  openShared();

  window.MEMORIES = { near, openRead, goTo, LANDMARKS, placeLine };
  window.__memories = {
    get count() { return memories.length; }, get nearBoard() { return nearBoard; }, openList, ONLINE, OPEN, openForm, openRead, goTo, remember,
    list: () => memories.map(e => e.m), seeds: SEEDS.length, LANDMARKS, near, placeOf: m => (placeOf(m) || {}).id,
    sets: () => SECS.reduce((o, k) => (o[k] = { visible: SETS[k].body.visible, count: SETS[k].body.count, lit: SETS[k].slots.map(e => e.m.id) }, o), {}),
    warmth: id => { const e = memories.find(x => x.m.id === id); return e ? warmthOf(e) : null; },
    get nearest() { return nearest ? nearest.m.id : null; }, get reading() { return reading ? reading.id : null; },
    get bubble() { return bubble.hidden ? null : bubble.firstChild.textContent; },
  };
})();
