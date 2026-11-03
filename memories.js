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
  const MAX_TEXT = 280, MAX_NAME = 40, NEAR = 4.5;
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
    parents:      { zh: '爸媽的', en: 'My parents’', by: '爸媽的記憶 · a parent’s memory' },
    grandparents: { zh: '阿公阿嬤的', en: 'My grandparents’', by: '阿公阿嬤的記憶 · a grandparent’s memory' },
  };
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
  // The first two are the README's words; the others were written for this page by its makers, in
  // their own voice, about real places in the years each street is. They are the makers', and say so
  // (name, and the note under each); they are not anyone else's testimony and name no one.
  // Long and short on purpose (the plan: a seed that is too polished stops people writing), one is a
  // single line, and one is a grandmother's memory told by her grandchild, the 「阿公阿嬤的」 kind.
  const MAKERS = '本頁作者 · the makers of this page';
  const SEEDS = [
    { id: 'seed-tv-1962', section: 'square', x: 0, z: 150, year: 1962, whose: 'grandparents',
      body: '阿嬤說，1962 年電視剛開播，里長在廟口擺了一台，整條街的人搬板凳來看。她說她坐在最前面，看到都忘了回家煮飯。\nGrandma says that in 1962, when television had just begun, the 里長 set one up by the temple and the whole street brought stools. She sat in the front row and forgot to go home and cook.' },
    { id: 'seed-chess-1987', section: 'square', x: 0, z: 150, year: 1987, whose: 'me',
      body: '1987 年我七歲，大樹下有一位伯伯教我下象棋，每次都讓我一隻車，我還是輸。\nIn 1987 I was seven. An old man under the banyan taught me 象棋 and always gave me a chariot start, and I still lost.' },
    { id: 'seed-ten-dollars', section: 'red', x: -5.2, z: 18, year: 1990, whose: 'me',
      body: 'The ten dollars our mothers gave us in Ximending when we were small.' },
    { id: 'seed-zhonghua-1992', section: 'red', x: 5.6, z: -42, year: 1992, whose: 'me',
      body: '1992 年中華商場要拆了。爸爸牽著我走天橋過去，指著一間關起來的小店說，他的第一副眼鏡是在這裡配的。\nIn 1992 the Zhonghua Market was coming down. Dad walked me over the footbridge and pointed at a shuttered stall: that is where he got his first pair of glasses.' },
    { id: 'seed-movie-1994', section: 'red', x: -4.8, z: -104, year: 1994, whose: 'me',
      body: '1994 年暑假，第一次沒有大人，跟同學搭公車去西門町。在武昌街的電影街排了好久的隊，散場出來天已經黑了，我們一路跑去趕最後一班車。\nSummer 1994: the first time we went to Ximending with no grown-ups. We queued for ages on the cinema street on Wuchang Street, came out into the dark, and ran all the way to the last bus.' },
    { id: 'seed-dihua-2008', section: 'dadao', x: 5.0, z: -182, year: 2008, whose: 'me',
      body: '2008 年過年前，跟媽媽去迪化街辦年貨，人擠到腳好像碰不到地。她每一攤都試吃，最後只買了一包烏魚子。\nBefore New Year 2008, Mum and I went to Dihua Street for the New Year market, so crowded my feet barely touched the ground. She tasted at every stall and in the end bought one pack of mullet roe.' },
    { id: 'seed-pier-2014', section: 'dadao', x: -5.5, z: -256, year: 2014, whose: 'me',
      body: '2014 年七夕，我們坐在大稻埕碼頭的堤防上看煙火。\nQixi 2014: we sat on the river wall at Dadaocheng Wharf and watched the fireworks.' },
    { id: 'seed-countdown-2020', section: 'tower', x: -5.0, z: -332, year: 2020, whose: 'me',
      body: '2020 年的最後一晚，大家都戴著口罩倒數。數到零的時候，我在 101 下面打視訊給在國外的妹妹，她那邊還是早上。\nThe last night of 2020, everyone counting down in masks. At zero I video-called my sister abroad from the foot of 101; it was still morning where she was.' },
    { id: 'seed-climb', section: 'tower', x: 4.5, z: -388, year: THIS_YEAR, whose: 'me',
      body: 'The day we could finally build something of our own, we looked up at Taipei 101, and the man high on the tower was waving at us. Let’s climb higher, together.' },
  ];
  SEEDS.forEach(m => { m.seed = true; m.name = MAKERS; });

  // ── the lanterns ────────────────────────────────────────────────────────────
  const group = new THREE.Group(); scene.add(group);
  // the lantern itself is square.js's Taiwanese 燈籠 (lathe body, ribs, gold caps, tassel, halo), with the
  // memory's year written on it; the makers' own are red, the visitors' a warmer orange
  const SQM = window.SQUARE;
  const BODY = { seed: '#d23a2a', visitor: '#e0582c', local: '#e8952f' };
  const SIZE = 0.9;
  const kindOf = m => m.seed ? 'seed' : m.local ? 'local' : 'visitor';
  function lantern(m, cord) {
    const text = m.year ? String(m.year) : '憶';
    let o;
    if (SQM) o = SQM.makeLantern({ text, body: BODY[kindOf(m)], size: SIZE, cord: cord || 0 });
    else { o = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(BODY[kindOf(m)]) })); o.userData.phase = 0; }
    o.userData.memory = m; o.userData.phase = (m.x * 3.1 + m.z * 1.7) % 6.28;
    o.traverse(c => { c.userData.memory = m; });
    group.add(o);
    return o;
  }

  // on the street: each memory floats where it was left. A memory left in the square has no street
  // lantern: the square shows its memories on the notice board instead (below).
  const memories = [];   // { m, obj }  (obj null for the square's own)
  function addLantern(m) {
    if (memories.some(e => e.m.id === m.id)) return;
    let obj = null;
    if (m.section !== 'square') { obj = lantern(m, 0); obj.position.set(m.x, 2.9, m.z); }
    memories.push({ m, obj });
    rebuildTree();
  }
  // in the square: the newest memories, pinned to the notice board (square.js), and listed in full when
  // you walk up to it and press E
  const BOARD = SQM && SQM.board;
  const newest = () => memories.map(e => e.m).slice().sort((a, b) => (b.created_at ? Date.parse(b.created_at) : 0) - (a.created_at ? Date.parse(a.created_at) : 0));
  function rebuildTree() { if (BOARD) BOARD.setNotes(newest().slice(0, 8)); if (!list.hidden) fillList(); }

  // ── storage ─────────────────────────────────────────────────────────────────
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch (_) { return []; } };
  const saveLocal = list => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); return true; } catch (_) { return false; } };
  const headers = extra => Object.assign({ apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, extra || {});
  const photoURL = m => m.photoData ? m.photoData : (m.photo_path && ONLINE ? `${API}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(m.photo_path)}` : null);
  // lower-case, as schema.sql's photo name rule expects; crypto.randomUUID needs a secure context, so
  // there is a getRandomValues fallback for a page served over plain http
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (c === 'x' ? r : (r & 3) | 8).toString(16); })).toLowerCase();

  async function fetchApproved() {
    if (!ONLINE) return;
    try {
      // whose is in the list (item #5): a column the select does not name never comes back
      const q = 'select=id,created_at,section,x,z,year,body,name,whose,photo_path&status=eq.approved&order=created_at.desc&limit=500';
      const res = await fetch(`${API}/rest/v1/memories?${q}`, { headers: headers() });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      (await res.json()).forEach(addLantern);
    } catch (e) { console.warn('[memories] could not load the shared memories:', e.message); }
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
      return 'local';
    }
    const id = uuid();
    const p = file ? await shrink(file, 1280) : null;
    const photo_path = p ? id + '.' + p.ext : null;
    const res = await fetch(`${API}/rest/v1/memories`, {
      method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ id, section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, whose: rec.whose, photo_path }) });
    if (!res.ok) throw new Error(await refusal(res));
    if (!p) return 'pending';
    try {
      const up = await fetch(`${API}/storage/v1/object/${BUCKET}/${photo_path}`, {
        method: 'POST', headers: headers({ 'Content-Type': p.type, 'x-upsert': 'false', 'Cache-Control': 'max-age=31536000' }), body: p.blob });
      if (!up.ok) throw new Error(String(up.status));
    } catch (e) { console.warn('[memories] the words arrived but the photo did not:', e.message); return 'pending-nophoto'; }
    return 'pending';
  }

  // ── DOM: the bubble, the reading panel, the form ────────────────────────────
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  const bubble = el('button', 'mem-bubble', document.body);
  bubble.type = 'button'; bubble.hidden = true;
  bubble.innerHTML = '<span class="mem-b-k">A memory</span><span class="mem-b-key">E</span>';
  let nearest = null;
  let nearBoard = false;
  bubble.addEventListener('click', () => { if (nearBoard) openList(); else if (nearest) openRead(nearest.m); });

  const panel = el('aside', 'mem-panel', document.body); panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'memReadBody');
  const pClose = el('button', 'mem-close', panel, '×'); pClose.type = 'button'; pClose.setAttribute('aria-label', '關閉 · Close');
  const pFig = el('div', 'mem-fig', panel); const pImg = el('img', '', pFig); pImg.alt = ''; pImg.decoding = 'async';
  pImg.addEventListener('error', () => { pFig.hidden = true; });          // a photo that never arrived (see submit)
  const pBody = el('div', 'mem-body', panel);
  const pK = el('div', 'mem-k', pBody);
  const pText = el('p', 'mem-text', pBody); pText.id = 'memReadBody';
  const pBy = el('div', 'mem-by', pBody);
  const pNote = el('div', 'mem-note', pBody);
  pClose.addEventListener('click', closeRead);
  const byLine = m => {
    const who = m.name && m.name.trim() ? m.name.trim() : '一位在那裡的人 · someone who was there';
    const w = WHOSE[m.whose] && WHOSE[m.whose].by;
    return '— ' + who + (w ? ' · ' + w : '');
  };
  function openRead(m) {
    closeForm(); list.hidden = true;
    pK.textContent = (m.year ? m.year + ' · ' : '') + (PLACE[m.section] || '');
    pText.textContent = m.body;
    pBy.textContent = byLine(m);
    pNote.textContent = m.local ? '只存在這個瀏覽器裡。 · Kept in this browser only.'
      : m.seed ? '這是本頁作者自己的記憶。 · One of the makers’ own memories.' : '';
    const u = photoURL(m);
    pFig.hidden = !u; if (u) pImg.src = u; else pImg.removeAttribute('src');
    panel.hidden = false; pClose.focus({ preventScroll: true });
  }
  function closeRead() { panel.hidden = true; }

  // the list: every memory, newest first, opened from the board in the square
  const list = el('aside', 'mem-panel mem-list', document.body); list.hidden = true;
  list.setAttribute('role', 'dialog'); list.setAttribute('aria-labelledby', 'memListTitle');
  const lClose = el('button', 'mem-close', list, '×'); lClose.type = 'button'; lClose.setAttribute('aria-label', '關閉 · Close');
  const lBody = el('div', 'mem-body', list);
  el('div', 'mem-k', lBody, '記憶公布欄 · The memory board');
  const lTitle = el('h2', 'mem-title', lBody, '大家的記憶'); lTitle.id = 'memListTitle';
  el('span', 'mem-title-en', lTitle, 'Everyone’s memories');
  const lItems = el('ol', 'mem-items', lBody);
  lClose.addEventListener('click', () => { list.hidden = true; });
  function fillList() {
    lItems.textContent = '';
    newest().forEach(m => {
      const li = el('li', '', lItems), b = el('button', 'mem-item', li); b.type = 'button';
      el('span', 'mem-item-k', b, (m.year ? m.year + ' · ' : '') + (PLACE[m.section] || ''));
      el('span', 'mem-item-t', b, m.body);
      if (m.name || (WHOSE[m.whose] && WHOSE[m.whose].by)) el('span', 'mem-item-by', b, byLine(m));
      b.addEventListener('click', () => { list.hidden = true; openRead(m); });
    });
  }
  function openList() { closeForm(); closeRead(); fillList(); list.hidden = false; lClose.focus({ preventScroll: true }); }

  // ── the form (item #5): Chinese first, English second ────────────────────────
  const form = el('form', 'mem-form', document.body); form.hidden = true; form.noValidate = true;
  form.setAttribute('role', 'dialog'); form.setAttribute('aria-labelledby', 'memFormTitle');
  // the fixed parts are written here; every part that changes (the prompts, the years, the place, the
  // contact) is set with textContent below
  form.innerHTML =
    '<button type="button" class="mem-close" aria-label="關閉 · Close">×</button>' +
    '<div class="mem-body">' +
      '<div class="mem-k" id="memFormWhere"></div>' +
      '<h2 class="mem-title" id="memFormTitle">在這裡留下一段記憶<span class="mem-title-en">Leave a memory here</span></h2>' +
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
    '</div>';
  const F = {
    close: form.querySelector('.mem-close'), where: form.querySelector('#memFormWhere'), body: form.elements.body, year: form.elements.year,
    name: form.elements.name, photo: form.elements.photo, hp: form.elements.website, ok: form.elements.ok,
    status: form.querySelector('.mem-status'), send: form.querySelector('button[type=submit]'), count: form.querySelector('#memCount'),
    prompts: form.querySelector('.mem-prompts'), q: form.querySelector('#memQ'), qEn: form.querySelector('#memQEn'),
    notice: form.querySelector('.mem-notice'), privacy: form.querySelector('.mem-privacy-body'),
    fields: form.querySelector('.mem-fields'), closed: form.querySelector('.mem-closed'),
  };
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
      para('收集什麼：你寫的字、年份、是誰的記憶、你填的名字（可不填）、照片（可不填）、燈籠掛的位置和送出的時間。為了擋垃圾訊息，伺服器會記下你連線位址的單向雜湊（還原不回位址，每天換一次），只用來算短時間內送了幾則。不收 email，不放追蹤器。',
        'What is kept: your words, the year, whose memory it is, the name you give (optional), the photo (optional), where the lantern hangs and when it was sent. To stop spam, the server keeps a one-way hash of your connection’s address (it cannot be turned back into the address and changes every day), used only to count how many were sent in a short time. No e-mail, no trackers.');
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
    // the emergency switch (item #1): the form says so, and nothing can be sent
    F.closed.hidden = OPEN; F.fields.hidden = !OPEN;
    form.classList.toggle('closed', !OPEN);
    if (OPEN) {
      // just in front of her, so the lantern hangs where she is looking
      let x = p.x - Math.sin(p.h) * 1.6, z = p.z - Math.cos(p.h) * 1.6;
      if (where !== 'square') x = Math.max(-8.4, Math.min(8.4, x));
      spot = { section: where, x: +x.toFixed(2), z: +z.toFixed(2) };
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
    const body = F.body.value.trim(), name = F.name.value.trim(), yearS = F.year.value.trim();
    const year = yearS ? parseInt(yearS, 10) : null;
    const [lo, hi] = yearsOf(spot.section);
    const say = (t, ok) => { F.status.textContent = t; F.status.classList.toggle('ok', !!ok); };
    if (F.hp.value) return say('謝謝。 · Thank you.');                                  // a bot filled the hidden field
    if (!body) return say('先寫一兩句吧。 · Write a line or two first.');
    if (STARTS.indexOf(body) >= 0) return say('把這句接下去寫完吧。 · Finish the sentence first.');
    if (body.length > MAX_TEXT) return say('請寫在 ' + MAX_TEXT + ' 個字以內。 · Keep it under ' + MAX_TEXT + ' characters.');
    if (year !== null && (isNaN(year) || year < lo || year > hi)) return say('這裡的年份是 ' + lo + '–' + hi + '。 · The year here is between ' + lo + ' and ' + hi + '.');
    if (!F.ok.checked) return say('請勾選同意公開顯示。 · Please tick the box to say it can be shown.');
    if (performance.now() - openedAt < 2500) return say('等一下下…… · One moment…');
    if (Date.now() - lastSent < 30000) return say('謝謝，一次一盞就好，半分鐘後再來。 · Thank you, one lantern at a time. Try again in half a minute.');
    const file = F.photo.files && F.photo.files[0];
    if (file && !/^image\//.test(file.type)) return say('這個檔案不是照片。 · That file is not a photo.');
    if (file && file.size > 25e6) return say('這張照片太大了。 · That photo is too large.');
    F.send.disabled = true; say(file ? '正在把照片縮小…… · Making the photo small…' : '正在掛上去…… · Hanging it…');
    try {
      const how = await submit({ section: spot.section, x: spot.x, z: spot.z, year, body, name: name || null, whose: whoseNow() }, file);
      lastSent = Date.now();
      F.body.value = ''; F.name.value = ''; F.photo.value = ''; F.ok.checked = false; F.count.textContent = '0';
      form.querySelector('input[name=whose][value=me]').checked = true;
      setPrompt(0, true); buildYears();
      say(how === 'local' ? '你的燈籠掛上了，存在這個瀏覽器裡。 · Your lantern is hanging here, kept in this browser.'
        : how === 'pending-nophoto' ? '字收到了，但照片沒有傳上去。作者讀過之後，燈籠會亮起來（沒有照片）。 · Your words arrived but the photo did not upload. The lantern will light up, without it, once it has been read.'
        : '謝謝你。作者讀過之後，你的燈籠就會在這裡亮起來。 · Thank you. Your lantern will light up here once it has been read.', true);
      setTimeout(closeForm, how === 'pending-nophoto' ? 6000 : 3200);
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
    const targets = memories.filter(e => e.obj && e.obj.visible).map(e => e.obj);
    if (BOARD && BOARD.mesh && WALK.section() === 'square') targets.push(BOARD.mesh);
    const hit = ray.intersectObjects(targets, true)[0];
    if (hit && BOARD && hit.object === BOARD.mesh) { openList(); return; }
    if (hit && hit.object.userData.memory) openRead(hit.object.userData.memory);
  });

  // ── per frame: show the lanterns of the place you are in, bob them, find the nearest ──
  const v = new THREE.Vector3();
  function tick(now) {
    const sec = WALK.section(), t = now / 1000, inSquare = sec === 'square';
    let best = null, bestD = NEAR;
    const p = WALK.on ? WALK.pos : null;
    const near = e => { if (!p) return; const d = Math.hypot(e.obj.position.x - p.x, e.obj.position.z - p.z); if (d < bestD) { bestD = d; best = e; } };
    memories.forEach(e => {
      if (!e.obj) return;
      const on = !inSquare && e.m.section === sec;
      e.obj.visible = on;
      if (!on) return;
      e.obj.position.y = 2.9 + Math.sin(t * 1.3 + e.obj.userData.phase) * 0.12;
      e.obj.rotation.y = Math.sin(t * 0.7 + e.obj.userData.phase) * 0.25;
      near(e);
    });
    // the board: near enough, and it is the thing to read
    let board = false;
    if (inSquare && BOARD && p && Math.hypot(BOARD.x - p.x, BOARD.z - p.z) < BOARD.r && !best) board = true;
    nearBoard = board;
    nearest = best;
    bubble.firstChild.textContent = nearBoard ? '記憶公布欄 · Read' : 'A memory';
    if ((best || nearBoard) && panel.hidden && form.hidden && list.hidden) {
      if (nearBoard) v.set(BOARD.x, 3.4, BOARD.z); else { v.copy(best.obj.position); v.y += 0.9; }
      v.project(R.camera);
      if (v.z < 1) {
        bubble.hidden = false;
        bubble.style.transform = `translate(${((v.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - v.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
      } else bubble.hidden = true;
    } else bubble.hidden = true;
    requestAnimationFrame(tick);
  }

  SEEDS.forEach(addLantern);
  loadLocal().forEach(m => { m.local = true; addLantern(m); });
  fetchApproved();
  requestAnimationFrame(tick);

  window.__memories = { get count() { return memories.length; }, get nearBoard() { return nearBoard; }, openList, ONLINE, OPEN, openForm, openRead, list: () => memories.map(e => e.m), seeds: SEEDS.length };
})();
