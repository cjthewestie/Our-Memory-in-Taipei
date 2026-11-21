// photowall.js — the photo walls of the remade scenes: look at the photos, add your own, share one.
//
// CJ, 2026-11-21: 「跟讓大家上傳回憶的機制」, 「我還要想用什麼方式讓大家看得到照片或分享照片」.
//
// ── How a scene page uses it (the whole integration) ─────────────────────────────────────────
//   Before the page's own script:
//     <script src="../memories-config.js"></script>      <!-- the same config the live site uses -->
//     <script src="photo-topics.js"></script>            <!-- the one list of topics, per scene -->
//     <script src="photowall.js"></script>
//   Inside ENGINE.create({ build(E, models) { ... } }): one small SHOWCASE per topic of the scene
//   (CJ, 2026-11-21: "each topic or major event like climbing 101, make a small shop or stand or small wall
//   to showcase the event and we can click into a gallery show all the pictures"):
//     PHOTOWALL.showcases(E, { section: 'dadao', topics: PHOTO_TOPICS.dadao, spots: { temple: [7.2, -4.6, 0, 'shrine'], ... } });
//       spots  topic key -> [x, z, facing, kind]   kind: 'wall' | 'shop' | 'stand' | 'poster' | 'shrine' | 'kiosk'
//       spare  [[x, z, facing, kind], ...]         places for topics added to photo-topics.js later
//   Titles, years and the `ask` line are read from PHOTO_TOPICS[section]; a page never repeats them.
//   In the page's clamp(p): PHOTOWALL.keepOut(p) pushes her out of every showcase's footprint.
//   PHOTOWALL.block({ x, z, facing, hw, hd }) adds a footprint for a wall the page built itself.
//
//   Clicking anywhere on a showcase opens that topic's GALLERY: every photo of the topic in a grid, the
//   topic's `ask` line and an "Add your photo" button that opens the form already set to the topic. A
//   photo in the grid opens the large view (caption, year, place, share link). The page has ONE button,
//   "Photos", which lists the scene's topics. Several showcases share one button, one gallery, one large
//   view, one form, one keyboard handler and one ?photo= link.
//
// ── attach(options): the lower level, one call per wall or showcase ──────────────────────────
//   THREE, scene, camera, canvas   the page's live objects (required; the first call sets them for the page)
//   topic    the topic's key in PHOTO_TOPICS[section]. A new photo is stored with it; a wall shows only its
//            own topic. A record with no topic, or a topic no wall here has, hangs on the section's FIRST wall.
//   frames   [{ position: [x, y, z], size: [w, h], facing, add, photo, parent, hit, cue }]
//              position  the middle of the picture, in metres (world, or local to `parent`)
//              facing    which way it looks: an angle about Y in radians (0 looks toward +Z), or a normal [nx, ny, nz]
//              add       true marks the frame that says "+ Add your photo" (plain walls only)
//              photo     { id, url, caption, year, place, credit }: a fixed, curated picture (the opening exhibition)
//              hit       an existing mesh to use as that fixed photo's click target, instead of a new plane
//              parent    an Object3D to hang it on instead of the scene
//              cue       true: the "see all" plate of a showcase
//   showcase an Object3D: a click anywhere on it opens the topic's gallery
//   section  'square' | 'red' | 'dadao' | 'tower'  (the live site's four places; default 'square')
//   place    the place name shown under a photo (default: the section's name)
//   label    a name for a wall that has no topic (e.g. 'Opening exhibition')
//   spot     [x, z] stored with a new photo (default: the first frame's position)
//   keys     the engine's key map (E.keys), cleared when a dialog opens so she does not keep walking
//   buttons  false hides the on-screen button bar
//   returns  { ONLINE, ready (a promise), topic, list(), open(key), openGallery(), openForm(), add({ file, body, year, name }), refresh(), records(), frames }
//   window.__photowall is the page: { walls, list(), open(key), openGallery(topic), records(), ready }
//
// ── Storage: the same contract as the live site (memories.js, supabase/schema.sql, docs/MEMORIES.md) ──
//   Keys present in memories-config.js: the resized photo goes to the PRIVATE bucket and a row is
//     inserted as 'pending'; the page reads only approved rows, each photo through a signed URL. The
//     visitor also keeps their own copy in this browser so they can see it hang while it waits.
//   No keys: nothing is sent anywhere. The photo is kept in this browser (IndexedDB) and the form, the
//     large view and the confirmation all say "only you can see this until the site's storage is connected".
//   There are no keys in this file. Every request goes through net(), and net() refuses to run without keys.
//   Every string a visitor wrote reaches the page through textContent or a canvas, never innerHTML.
//
// ── Sharing ──────────────────────────────────────────────────────────────────────────────────
//   Each photo has a key. "?photo=<key>" on the page's address opens that photo's large view on load.
//   Shared photo: the key is its file's UUID, known the moment it is uploaded, so the link can be
//   copied straight away and starts working for everyone once the photo is approved.
//   Browser-only photo: the key is 'local-…' and the link opens it in this browser only; the view says so.
(function () {
  'use strict';
  const CFG = window.MEMORY_CONFIG || {};
  const ONLINE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);          // the keys-present check: everything networked hangs on this
  const API = ONLINE ? String(CFG.supabaseUrl).replace(/\/+$/, '') : '';
  const BUCKET = CFG.bucket || 'memory-photos';
  const DB_NAME = 'our-memory-in-taipei-photowall', STORE = 'photos';
  const MAX_SIDE = 1600, MAX_BYTES = 1.9e6, MAX_TEXT = 140, MAX_NAME = 40;
  const PLACE = { square: 'The Square · 廣場', red: 'Ximending · 西門町', dadao: 'Dadaocheng · 大稻埕', tower: 'Xinyi · 信義' };
  const THIS_YEAR = new Date().getFullYear();
  const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';
  const KEY_RE = /^[0-9a-f-]{36}$/;
  const ONLY_YOU = 'Only you can see this until the site’s storage is connected.';

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

  // ── this browser's own store (IndexedDB): the photo itself is kept as a Blob ────────────────
  const idb = () => new Promise((ok, no) => {
    let r; try { r = indexedDB.open(DB_NAME, 1); } catch (e) { return no(e); }
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error || new Error('indexedDB'));
  });
  const idbRun = (mode, fn) => idb().then(db => new Promise((ok, no) => {
    const tx = db.transaction(STORE, mode), q = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); ok(q && q.result); }; tx.onerror = tx.onabort = () => { db.close(); no(tx.error || new Error('indexedDB')); };
  }));
  const idbAll = () => idbRun('readonly', s => s.getAll()).then(l => (Array.isArray(l) ? l : []), () => []);
  const idbPut = rec => idbRun('readwrite', s => s.put(rec));
  const idbDel = id => idbRun('readwrite', s => s.delete(id));

  // ── the network: one door, shut without keys ────────────────────────────────────────────────
  const headers = extra => Object.assign({ apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, extra || {});
  async function net(url, opts, ms) {
    if (!ONLINE) throw new Error('offline');                          // no keys configured: nothing leaves the browser
    const ctl = window.AbortController ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), ms || 20000);
    try { return await fetch(url, Object.assign({}, opts, ctl ? { signal: ctl.signal } : {})); }
    catch (e) { throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'unreachable'); }
    finally { clearTimeout(timer); }
  }
  // approved photo memories of one place (or the one a share link names), each with a 12-hour signed URL
  async function fetchApproved(section, key) {
    if (!ONLINE) return [];
    const where = key ? 'photo_path=in.(' + key + '.jpg,' + key + '.webp)' : 'section=eq.' + encodeURIComponent(section) + '&photo_path=not.is.null';   // each row carries its topic; the page hangs it on that topic's wall
    const res = await net(API + '/rest/v1/memories?select=id,created_at,section,topic,x,z,year,body,name,photo_path&status=eq.approved&' + where + '&order=created_at.desc&limit=200', { headers: headers() });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const rows = (await res.json()).filter(r => r && r.photo_path);
    if (!rows.length) return rows;
    const sres = await net(API + '/storage/v1/object/sign/' + BUCKET, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn: 43200, paths: rows.map(r => r.photo_path) }) });
    if (!sres.ok) throw new Error(sres.status + ' ' + sres.statusText);
    const byPath = {};
    (await sres.json()).forEach(s => { if (s && s.signedURL && !s.error) byPath[s.path] = API + '/storage/v1' + s.signedURL; });
    return rows.filter(r => byPath[r.photo_path]).map(r => Object.assign(r, { photoSigned: byPath[r.photo_path] }));
  }
  async function upload(rec, blob) {
    if (!ONLINE) throw new Error('offline');
    const up = await net(API + '/storage/v1/object/' + BUCKET + '/' + rec.photo_path, { method: 'POST', headers: headers({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }), body: blob }, 60000);
    if (!up.ok) throw new Error('Saving failed: your photo didn’t upload. Nothing was lost; please try again.');
    const res = await net(API + '/rest/v1/memories', { method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, photo_path: rec.photo_path, topic: rec.topic || null }) });
    if (!res.ok) throw new Error('Saving failed. Nothing was lost; please try again in a moment.');
  }

  // ── a photo made small in the browser, before it goes anywhere: long side 1600 px, JPEG ─────
  async function shrink(file) {
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) {
      src = await new Promise((ok, no) => { const i = new Image(), u = URL.createObjectURL(file);
        i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); no(new Error('This photo could not be read. Try a JPEG or PNG.')); }; i.src = u; });
    }
    const k = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(src.width * k)); cv.height = Math.max(1, Math.round(src.height * k));
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0, cv.width, cv.height);
    const toBlob = q => new Promise(ok => cv.toBlob(ok, 'image/jpeg', q));
    let q = 0.86, blob = await toBlob(q);
    while (blob && blob.size > MAX_BYTES && q > 0.4) { q -= 0.12; blob = await toBlob(q); }   // the bucket takes 2 MB at most
    if (!blob) throw new Error('This photo could not be read.');
    return { blob, width: cv.width, height: cv.height };
  }

  // ── styles (all of them; the module is one file) ────────────────────────────────────────────
  const CSS = `
  .pw-bar { position: fixed; right: 16px; bottom: 16px; display: flex; gap: 8px; z-index: 30; font: 600 14px/1 ${FONT}; }
  .pw-btn { font: inherit; color: #f6ead8; background: rgba(20,16,14,.66); border: 1px solid rgba(246,234,216,.28); border-radius: 999px; padding: 11px 16px; cursor: pointer; backdrop-filter: blur(6px); }
  .pw-btn:hover { background: rgba(20,16,14,.82); }
  .pw-btn.pw-primary { background: #b7372a; border-color: #b7372a; color: #fff6e6; }
  .pw-btn.pw-primary:hover { background: #c9453a; }
  .pw-btn:focus-visible, .pw-x:focus-visible, .pw-nav:focus-visible { outline: 2px solid #ffd9a0; outline-offset: 2px; }
  .pw-btn[disabled] { opacity: .55; cursor: default; }
  .pw-back { position: fixed; inset: 0; z-index: 40; background: rgba(14,10,8,.72); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 16px; }
  .pw-back[hidden], .pw-card [hidden], .pw-bar[hidden] { display: none !important; }
  .pw-card { position: relative; background: #f4ecdb; color: #2a2420; border-radius: 14px; box-shadow: 0 24px 80px rgba(0,0,0,.55); font: 400 15px/1.5 ${FONT}; max-height: calc(100vh - 32px); overflow: auto; }
  .pw-view { width: min(920px, 100%); display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr); }
  .pw-fig { background: #1b1512; border-radius: 14px 0 0 14px; display: flex; align-items: center; justify-content: center; min-height: 280px; position: relative; }
  .pw-fig img { max-width: 100%; max-height: calc(100vh - 32px); display: block; object-fit: contain; }
  .pw-side { padding: 44px 22px 20px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .pw-k { font: 700 12px/1.3 ${FONT}; letter-spacing: .08em; text-transform: uppercase; color: #b7372a; }
  .pw-cap { font: 600 19px/1.4 ${FONT}; margin: 0; overflow-wrap: anywhere; }
  .pw-by { color: #6b5d50; font-size: 14px; }
  .pw-note { background: #fff6e0; border: 1px solid #e3cfa0; border-radius: 8px; padding: 8px 10px; font-size: 13px; color: #5a4420; }
  .pw-share { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
  .pw-share label { font: 700 12px/1.3 ${FONT}; letter-spacing: .06em; text-transform: uppercase; color: #6b5d50; }
  .pw-share input { width: 100%; box-sizing: border-box; font: 13px ui-monospace, Menlo, monospace; padding: 8px; border: 1px solid #cdbfa5; border-radius: 8px; background: #fffaf0; color: #2a2420; }
  .pw-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .pw-card .pw-btn { background: #2a2420; border-color: #2a2420; color: #f6ead8; backdrop-filter: none; padding: 9px 14px; font: 600 13px/1 ${FONT}; }
  .pw-card .pw-btn.pw-primary { background: #b7372a; border-color: #b7372a; }
  .pw-card .pw-btn.pw-quiet { background: transparent; color: #6b5d50; border-color: #cdbfa5; }
  .pw-x { position: absolute; right: 10px; top: 8px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: rgba(42,36,32,.08); color: #2a2420; font: 400 22px/1 system-ui; cursor: pointer; z-index: 2; }
  .pw-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(244,236,219,.85); color: #2a2420; font: 400 20px/1 system-ui; cursor: pointer; }
  .pw-prev { left: 10px; } .pw-next { right: 10px; }
  .pw-form { width: min(520px, 100%); padding: 22px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; }
  .pw-form h2 { font: 700 21px/1.3 ${FONT}; margin: 0 28px 0 0; }
  .pw-field { display: flex; flex-direction: column; gap: 5px; font: 600 13px/1.3 ${FONT}; }
  .pw-field em { font-weight: 400; font-style: normal; color: #6b5d50; }
  .pw-field input[type=text], .pw-field textarea, .pw-field select { font: 400 15px/1.4 ${FONT}; padding: 9px; border: 1px solid #cdbfa5; border-radius: 8px; background: #fffaf0; color: #2a2420; width: 100%; box-sizing: border-box; }
  .pw-field [aria-invalid=true] { border-color: #b7372a; box-shadow: 0 0 0 2px rgba(183,55,42,.2); }
  .pw-two { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; }
  .pw-prev-img { max-width: 100%; max-height: 180px; border-radius: 8px; align-self: flex-start; }
  .pw-consent { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; }
  .pw-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
  .pw-status { min-height: 1.4em; margin: 0; font-size: 14px; color: #b7372a; }
  .pw-status.ok { color: #2f6b3c; }
  .pw-where { font-size: 13px; padding: 8px 10px; border-radius: 8px; margin: 0; }
  .pw-where.local { background: #fff6e0; border: 1px solid #e3cfa0; color: #5a4420; }
  .pw-where.shared { background: #e8f1e6; border: 1px solid #b9d0b4; color: #284a2c; }
  .pw-topic { font: 700 16px/1.3 ${FONT}; margin: 0; color: #2a2420; }
  .pw-ask { margin: 0; color: #5a4d40; font-size: 15px; }
  .pw-gal { width: min(1100px, 100%); min-height: calc(100vh - 32px); box-sizing: border-box; padding: 26px 26px 22px; display: flex; flex-direction: column; gap: 12px; }
  .pw-gal h2 { font: 700 30px/1.2 ${FONT}; margin: 0 40px 0 0; }
  .pw-gal h2 small { font: 600 16px/1.2 ${FONT}; color: #6b5d50; margin-left: 10px; }
  .pw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; overflow: auto; align-content: start; flex: 1; min-height: 0; padding: 2px; }
  .pw-tile { font: 600 14px/1.35 ${FONT}; text-align: left; color: #2a2420; background: #fffaf0; border: 1px solid #cdbfa5; border-radius: 10px; padding: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .pw-tile:hover { border-color: #b7372a; } .pw-tile:focus-visible { outline: 2px solid #b7372a; outline-offset: 2px; }
  .pw-tile img, .pw-tile .pw-ph { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 6px; background: #e6dcc6; display: block; }
  .pw-tile span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pw-tile em { font: 400 12px/1.3 ${FONT}; font-style: normal; color: #6b5d50; }
  .pw-tile b { font: 700 19px/1.2 ${FONT}; }
  .pw-none { margin: 18px 0; padding: 22px; border: 2px dashed #cdbfa5; border-radius: 12px; text-align: center; color: #5a4d40; font-size: 16px; }
  @media (max-width: 720px) {
    .pw-gal { padding: 18px 14px; } .pw-gal h2 { font-size: 23px; } .pw-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
    .pw-view { grid-template-columns: 1fr; } .pw-fig { border-radius: 14px 14px 0 0; min-height: 200px; } .pw-fig img { max-height: 52vh; }
    .pw-side { padding: 16px 16px 18px; } .pw-bar { right: 10px; bottom: 58px; font-size: 13px; } .pw-two { grid-template-columns: 1fr; }
  }`;
  let styled = false;
  const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  // ── topics: read from photo-topics.js (window.PHOTO_TOPICS), never written here ─────────────
  const topicsOf = section => (window.PHOTO_TOPICS && Array.isArray(window.PHOTO_TOPICS[section]) ? window.PHOTO_TOPICS[section].filter(t => t && t.key) : []);
  const topicInfo = (section, key) => (key ? topicsOf(section).find(t => t.key === key) : null) || null;
  const topicName = t => (t ? [t.zh, t.en].filter(Boolean).join(' · ') : '');

  // a straight row of frames along a wall: the usual case, so a page does not do the trigonometry
  function row(o) {
    const n = o.count || 3, gap = o.gap || 2.6, th = o.facing || 0, out = o.out || 0, c = o.center, frames = [];
    for (let i = 0; i < n; i++) {
      const fx = (i - (n - 1) / 2) * gap;                                   // along the wall, then `out` metres off its face
      frames.push({ position: [c[0] + fx * Math.cos(th) + out * Math.sin(th), c[1], c[2] - fx * Math.sin(th) + out * Math.cos(th)], size: o.size || [2.0, 1.7], facing: th, add: i === (o.addAt || 0) });
    }
    return frames;
  }

  // ── footprints: where she cannot walk ───────────────────────────────────────────────────────
  // each is a box turned by `facing`: u runs along the face, v out of it. keepOut(p) is called from a page's clamp.
  const FOOT = [];
  function block(b) { const f = { x: b.x, z: b.z, th: b.facing || 0, u0: b.u0 != null ? b.u0 : -(b.hw || 1), u1: b.u1 != null ? b.u1 : (b.hw || 1), v0: b.v0 != null ? b.v0 : -(b.hd || 0.3), v1: b.v1 != null ? b.v1 : (b.hd || 0.3) }; FOOT.push(f); return f; }
  function keepOut(p, margin) {
    const m = margin == null ? 0.35 : margin;
    for (const f of FOOT) {
      const c = Math.cos(f.th), s = Math.sin(f.th), dx = p.x - f.x, dz = p.z - f.z;
      let u = dx * c - dz * s, v = dx * s + dz * c;
      if (u <= f.u0 - m || u >= f.u1 + m || v <= f.v0 - m || v >= f.v1 + m) continue;
      const push = [[u - (f.u0 - m), 'u', f.u0 - m], [(f.u1 + m) - u, 'u', f.u1 + m], [v - (f.v0 - m), 'v', f.v0 - m], [(f.v1 + m) - v, 'v', f.v1 + m]].sort((a, b) => a[0] - b[0])[0];
      if (push[1] === 'u') u = push[2]; else v = push[2];
      p.x = f.x + u * c + v * s; p.z = f.z - u * s + v * c;
    }
    return p;
  }

  // ── the page: one button bar, one gallery, one large view, one form, shared by every wall ────
  let P = null;
  function makePage(o) {
    const T = o.THREE || window.THREE, scene = o.scene, camera = o.camera, canvas = o.canvas;
    style();
    const walls = [], urls = new Map(), wanted = new URLSearchParams(location.search).get('photo');
    let own = [], shared = [], items = [], extra = [], keysMap = o.keys || null;
    const blobURL = r => { if (!urls.has(r.id)) urls.set(r.id, URL.createObjectURL(r.blob)); return urls.get(r.id); };
    const addable = () => walls.filter(w => w.free.length);
    const fit = (g, text, max) => { if (g.measureText(text).width <= max) return text; let s = text; while (s.length > 1 && g.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };

    function paint(fr) {
      const cv = fr.cv; if (!cv) return;
      const g = cv.getContext('2d'), W = cv.width, H = cv.height, m = Math.round(W * 0.045), w = fr.wall;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (fr.kind === 'cue') {                                               // the "see all" plate of a showcase
        const n = w.items.length;
        // an enamelled plate, as on a shop door: a double rule, a fixing rivet at each end
        const eg = g.createLinearGradient(0, 0, 0, H); eg.addColorStop(0, '#c23d2e'); eg.addColorStop(1, '#a22a20'); g.fillStyle = eg; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff6e6'; g.lineWidth = Math.max(3, H * 0.05); g.strokeRect(m * 0.4, m * 0.4, W - m * 0.8, H - m * 0.8);
        g.lineWidth = Math.max(1, H * 0.015); g.strokeRect(m * 0.4 + H * 0.1, m * 0.4 + H * 0.1, W - m * 0.8 - H * 0.2, H - m * 0.8 - H * 0.2);
        [m * 0.4 + H * 0.3, W - m * 0.4 - H * 0.3].forEach(x => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 1.5, H / 2 + 1.5, H * 0.07, 0, 7); g.fill(); g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(x, H / 2, H * 0.07, 0, 7); g.fill(); });
        g.fillStyle = '#fff6e6'; g.font = `700 ${Math.round(H * 0.46)}px ${FONT}`;
        g.fillText(fit(g, n ? `See all ${n} photo${n === 1 ? '' : 's'} · 看全部  ›` : 'Open the gallery · 看照片  ›', W - 2 * m), W / 2, H * 0.53);
        fr.tex.needsUpdate = true; return;
      }
      g.fillStyle = '#f4ecdb'; g.fillRect(0, 0, W, H);
      const corners = () => { g.fillStyle = '#2a2420'; const c = m * 1.5; [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, sx, sy]) => { g.beginPath(); g.moveTo(x + sx * m * 0.5, y + sy * m * 0.5); g.lineTo(x + sx * (m * 0.5 + c), y + sy * m * 0.5); g.lineTo(x + sx * m * 0.5, y + sy * (m * 0.5 + c)); g.closePath(); g.fill(); }); };   // the black paper corners of a photo album
      if (fr.kind === 'add') {
        g.strokeStyle = '#b7372a'; g.lineWidth = 6; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
        g.fillStyle = '#b7372a'; g.font = `700 ${Math.round(H * 0.34)}px ${FONT}`; g.fillText('＋', W / 2, H * 0.4);
        g.font = `700 ${Math.round(W * 0.085)}px ${FONT}`; g.fillText(w.showcase ? 'Add the first photo' : 'Add your photo', W / 2, H * 0.74);
        g.font = `500 ${Math.round(W * 0.05)}px ${FONT}`; g.fillText(fit(g, (w.info && w.info.ask) || '掛上你的照片', W - 3 * m), W / 2, H * 0.87); corners();
      } else if (fr.kind === 'empty') {
        g.strokeStyle = '#cdbfa5'; g.lineWidth = 4; g.setLineDash([18, 14]); g.strokeRect(m * 1.6, m * 1.6, W - 3.2 * m, H - 3.2 * m); g.setLineDash([]);
        g.fillStyle = '#b3a384'; g.font = `500 ${Math.round(W * 0.052)}px ${FONT}`; g.fillText('Your photo could hang here', W / 2, H / 2); corners();
      } else {
        const it = fr.item, stripH = Math.round(H * 0.2), px = m, py = m, pw = W - 2 * m, ph = H - m - stripH;
        g.fillStyle = '#e6dcc6'; g.fillRect(px, py, pw, ph);
        if (fr.img) { const k = Math.min(pw / fr.img.width, ph / fr.img.height), dw = fr.img.width * k, dh = fr.img.height * k;
          g.drawImage(fr.img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh); }
        else { g.fillStyle = '#b3a384'; g.font = `500 ${Math.round(W * 0.045)}px ${FONT}`; g.fillText('The photo is on its way…', W / 2, py + ph / 2); }
        g.strokeStyle = '#3a2a1c'; g.lineWidth = 3; g.strokeRect(px, py, pw, ph);
        g.fillStyle = '#2a2420'; g.font = `700 ${Math.round(W * 0.054)}px "Kaiti TC","BiauKai","DFKai-SB",${FONT}`; g.fillText(fit(g, it.body || '', W - 2 * m), W / 2, H - stripH * 0.62);   // the caption, as if written under the print
        g.fillStyle = it.kind === 'local' || it.kind === 'mine' ? '#b7372a' : '#6b5d50'; g.font = `500 ${Math.round(W * 0.036)}px ${FONT}`;
        const sub = [it.year, it.kind === 'local' ? 'in this browser only' : it.kind === 'mine' ? 'waiting for approval' : it.credit || it.name].filter(Boolean).join(' · ');
        g.fillText(fit(g, sub, W - 2 * m), W / 2, H - stripH * 0.24);
      }
      fr.tex.needsUpdate = true;
    }

    // ── which photo hangs where: its own topic's wall; no topic (or one no wall here has) → the section's first wall ──
    function collate() {
      const bySec = {}; addable().forEach(w => (bySec[w.section] = bySec[w.section] || []).push(w));
      const home = r => { const ws = bySec[r.section]; if (!ws) return null; const own = ws.find(w => w.topic && w.topic === r.topic); if (own) return own;
        return /^place:/.test(r.topic || '') ? null : ws.find(w => !w.shelf) || null; };   // a shelf never takes another topic's photo, and a place's photo never falls back onto a wall
      walls.forEach(w => { w.items = w.fixed.slice(); }); extra = [];
      const put = (r, it) => { const w = home(r); it.section = r.section; it.topic = r.topic || null; it.info = topicInfo(r.section, r.topic) || (w && w.shelf && w.topic === r.topic ? w.info : null); it.place = PLACE[r.section] || (w && w.placeName) || '';
        if (w) { it.wall = w; w.items.push(it); } else if (it.key === wanted) extra.push(it); };   // a photo of another place shows only when a link asks for it
      const sharedKeys = new Set(shared.map(r => r.photo_path.replace(/\.\w+$/, '')));
      own.filter(r => r.blob && !(r.mine && sharedKeys.has(r.key)))             // once approved, the shared one replaces the visitor's copy
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .forEach(r => put(r, { key: r.key, id: r.id, kind: r.mine ? 'mine' : 'local', body: r.body, year: r.year, name: r.name, url: blobURL(r) }));
      shared.forEach(r => put(r, { key: r.photo_path.replace(/\.\w+$/, ''), id: r.id, kind: 'shared', body: r.body, year: r.year, name: r.name, url: r.photoSigned }));
      items = walls.reduce((a, w) => a.concat(w.items), []).concat(extra);
    }
    function layout() {
      collate();
      walls.forEach(w => {
        const hang = w.items.filter(it => it.kind !== 'fixed');
        const addFr = w.showcase ? (hang.length ? null : w.free[0]) : (w.free.find(fr => fr.f.add) || w.free[0]);
        const slots = w.free.filter(fr => fr !== addFr || w.showcase);
        w.frames.forEach(fr => {
          if (fr.f.cue) { fr.kind = 'cue'; paint(fr); return; }
          const isFixed = !!(fr.f.photo && fr.f.photo.url);
          const it = isFixed ? w.fixed.find(x => x.frame === fr) : (fr === addFr && !w.showcase) ? null : hang[slots.indexOf(fr)] || null;
          const kind = it ? 'photo' : fr === addFr ? 'add' : 'empty';
          if (fr.item && it && fr.item.url === it.url && fr.kind === kind) { fr.item = it; paint(fr); return; }
          fr.item = it; fr.kind = kind; fr.img = null; paint(fr);
          if (it && fr.cv) { const img = new Image(); if (!/^blob:|^data:/.test(it.url)) img.crossOrigin = 'anonymous';
            img.onload = () => { if (fr.item === it || (fr.item && fr.item.url === it.url)) { fr.img = img; paint(fr); } };
            img.onerror = () => console.warn('[photowall] a photo did not load'); img.src = it.url; }
        });
      });
      const n = items.length, cases = walls.some(w => w.showcase), one = addable().filter(w => !w.shelf).length === 1 && !cases;
      bar.hidden = !walls.some(w => w.buttons !== false);
      bPhotos.textContent = n ? 'Photos · ' + n : 'Photos'; bPhotos.disabled = !n && !cases; bAdd.hidden = !one;
      if (!gBack.hidden) drawGallery();
      walls.forEach(w => { if (w.onChange) { try { w.onChange(w.items.slice()); } catch (e) { console.warn('[photowall] onChange failed', e); } } });
    }

    // ── DOM ───────────────────────────────────────────────────────────────────────────────────
    let opener = null;
    const bar = el('div', 'pw-bar', document.body);
    const bPhotos = el('button', 'pw-btn', bar, 'Photos'); bPhotos.type = 'button'; bPhotos.disabled = true;
    const bAdd = el('button', 'pw-btn pw-primary', bar, '＋ Add your photo'); bAdd.type = 'button'; bAdd.hidden = true;
    bPhotos.addEventListener('click', () => { if (walls.some(w => w.showcase)) openGallery(null); else if (items.length) openView(items[0]); });
    bAdd.addEventListener('click', () => openForm(addable().find(w => !w.shelf)));
    const stopWalking = () => { if (keysMap) for (const k in keysMap) keysMap[k] = false; };
    const inDialog = a => vBack.contains(a) || fBack.contains(a) || gBack.contains(a);
    const remember = () => { const a = document.activeElement; if (a && a !== document.body && !inDialog(a)) opener = a; };
    const giveBack = () => { const a = opener; opener = null; if (a && a.isConnected && a.offsetParent !== null) a.focus({ preventScroll: true }); };
    const dialog = (cls, label) => { const back = el('div', 'pw-back', document.body); back.hidden = true; const card = el(cls === 'pw-form' ? 'form' : 'div', 'pw-card ' + cls, back);
      card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', label);
      const x = el('button', 'pw-x', card, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); return [back, card, x]; };

    // the gallery: every photo of one topic in a grid, or (no topic chosen) the scene's topics
    const [gBack, gal, gX] = dialog('pw-gal', 'Photo gallery');
    const gK = el('div', 'pw-k', gal), gTitle = el('h2', '', gal), gAsk = el('p', 'pw-ask', gal), gRow = el('div', 'pw-row', gal);
    const gAll = el('button', 'pw-btn pw-quiet', gRow, '‹ All topics'); gAll.type = 'button';
    const gAdd = el('button', 'pw-btn pw-primary', gRow, '＋ Add your photo · 掛上你的照片'); gAdd.type = 'button';
    const gNone = el('div', 'pw-none', gal), gGrid = el('div', 'pw-grid', gal);
    let gWall = null, back = undefined;                                        // back: the gallery to return to when the large view or the form closes
    const wallName = w => topicName(w.info) || w.label || w.placeName;
    function tile(parent, it) { const b = el('button', 'pw-tile', parent); b.type = 'button'; const im = el('img', '', b); im.loading = 'lazy'; im.alt = ''; im.src = it.url;
      el('span', '', b, it.body || 'A photo'); el('em', '', b, [it.year, it.kind === 'local' ? 'in this browser only' : it.kind === 'mine' ? 'waiting for approval' : it.credit || it.name].filter(Boolean).join(' · ') || ' ');
      b.addEventListener('click', () => openView(it)); return b; }
    function drawGallery() {
      const w = gWall; gGrid.textContent = '';
      if (!w) {                                                                // the list of this scene's topics
        const ws = walls.filter(x => x.showcase || x.items.length);
        gK.textContent = (ws[0] && ws[0].placeName) || ''; gTitle.textContent = 'Photos · 照片'; gAsk.textContent = 'Choose a topic to see its photos, or to add your own.'; gRow.hidden = true; gNone.hidden = true;
        ws.forEach(x => { const b = el('button', 'pw-tile', gGrid); b.type = 'button'; const first = x.items[0];
          if (first) { const im = el('img', '', b); im.alt = ''; im.loading = 'lazy'; im.src = first.url; } else el('div', 'pw-ph', b);
          el('b', '', b, (x.info && x.info.zh) || x.label || x.placeName); el('span', '', b, [(x.info && x.info.en), (x.info && x.info.years)].filter(Boolean).join(' · ') || ' ');
          el('em', '', b, x.items.length ? x.items.length + (x.items.length === 1 ? ' photo' : ' photos') : 'No photos yet');
          b.addEventListener('click', () => openGallery(x)); });
        return;
      }
      gK.textContent = w.placeName; gTitle.textContent = (w.info && w.info.zh) || w.label || w.placeName;
      const sub = [(w.info && w.info.en), (w.info && w.info.years)].filter(Boolean).join(' · '); if (sub) el('small', '', gTitle, sub);
      gAsk.textContent = (w.info && w.info.ask) || ''; gAsk.hidden = !gAsk.textContent;
      gRow.hidden = false; gAll.hidden = walls.filter(x => x.showcase).length < 2; gAdd.hidden = !w.free.length;
      gNone.hidden = !!w.items.length; gNone.textContent = 'No photos here yet. Be the first: add yours. · 這裡還沒有照片，掛上第一張吧。';
      w.items.forEach(it => tile(gGrid, it));
    }
    function openGallery(w) { remember(); stopWalking(); vBack.hidden = true; fBack.hidden = true; current = null; setParam(null); back = undefined; gWall = w || null; drawGallery(); gBack.hidden = false; gGrid.scrollTop = 0; gX.focus({ preventScroll: true }); }
    function closeGallery() { if (gBack.hidden) return; gBack.hidden = true; giveBack(); }
    const reopen = () => { const b = back; back = undefined; if (b === undefined) return giveBack(); gWall = b; drawGallery(); gBack.hidden = false; gX.focus({ preventScroll: true }); };
    const leaveGallery = () => { if (!gBack.hidden) { back = gWall; gBack.hidden = true; } };
    gX.addEventListener('click', closeGallery); gAll.addEventListener('click', () => openGallery(null)); gAdd.addEventListener('click', () => openForm(gWall));
    gBack.addEventListener('click', e => { if (e.target === gBack) closeGallery(); });

    // the large view
    const [vBack, view, vX] = dialog('pw-view', 'Photo');
    const vFig = el('div', 'pw-fig', view), vImg = el('img', '', vFig); vImg.alt = '';
    const vPrev = el('button', 'pw-nav pw-prev', vFig, '‹'); vPrev.type = 'button'; vPrev.setAttribute('aria-label', 'Previous photo');
    const vNext = el('button', 'pw-nav pw-next', vFig, '›'); vNext.type = 'button'; vNext.setAttribute('aria-label', 'Next photo');
    const vSide = el('div', 'pw-side', view);
    const vK = el('div', 'pw-k', vSide), vT = el('p', 'pw-topic', vSide), vCap = el('p', 'pw-cap', vSide), vBy = el('div', 'pw-by', vSide), vNote = el('div', 'pw-note', vSide);
    const vShare = el('div', 'pw-share', vSide), vLabel = el('label', '', vShare, 'Share link');
    const vLink = el('input', '', vShare); vLink.type = 'text'; vLink.readOnly = true; vLink.id = 'pwShareLink'; vLabel.htmlFor = 'pwShareLink';
    const vRow = el('div', 'pw-row', vShare);
    const vCopy = el('button', 'pw-btn pw-primary', vRow, 'Copy link'); vCopy.type = 'button';
    const vDel = el('button', 'pw-btn pw-quiet', vRow, 'Remove from this browser'); vDel.type = 'button';
    let current = null;
    const linkFor = it => { const u = new URL(location.href); ['debug', 'view', 'cam', 'pwtest'].forEach(k => u.searchParams.delete(k)); u.searchParams.set('photo', it.key); return u.href; };
    const setParam = key => { try { const u = new URL(location.href); if (key) u.searchParams.set('photo', key); else u.searchParams.delete('photo'); history.replaceState(null, '', u.href); } catch (_) {} };
    const around = it => (it && it.wall ? it.wall.items : items);             // ‹ › stay inside the photo's own topic
    function openView(it) {
      if (!it) return; remember(); stopWalking(); leaveGallery(); fBack.hidden = true; current = it;
      vImg.src = it.url; vImg.alt = it.body || 'A photo';
      vK.textContent = [it.year, it.place].filter(Boolean).join(' · ');
      vT.textContent = it.kind === 'fixed' ? (it.wall && it.wall.label) || '' : topicName(it.info); vT.hidden = !vT.textContent;
      vCap.textContent = it.body || '';
      vBy.textContent = it.kind === 'fixed' ? (it.credit || '') : '— ' + (it.name && String(it.name).trim() ? String(it.name).trim() : 'someone who was there');
      vBy.hidden = !vBy.textContent;
      vNote.textContent = it.kind === 'local' ? 'Saved in this browser. ' + ONLY_YOU + ' The share link opens it in this browser only.'
        : it.kind === 'mine' ? 'Sent, and waiting for the makers to approve it. Until then only you can see it, in this browser. The share link starts working for everyone once it is approved.' : '';
      vNote.hidden = !vNote.textContent;
      vShare.hidden = false; vLink.value = linkFor(it); vCopy.textContent = 'Copy link';
      vDel.hidden = !(it.kind === 'local' || it.kind === 'mine');
      vDel.textContent = it.kind === 'mine' ? 'Remove my copy from this browser' : 'Remove from this browser';
      vPrev.hidden = vNext.hidden = around(it).length < 2;
      vBack.hidden = false; setParam(it.key); vX.focus({ preventScroll: true });
    }
    function closeView() { if (vBack.hidden) return; vBack.hidden = true; current = null; setParam(null); reopen(); }
    const step = d => { const l = around(current); if (!current || l.length < 2) return; const i = l.findIndex(x => x.key === current.key); openView(l[(i + d + l.length) % l.length]); };
    vX.addEventListener('click', closeView); vPrev.addEventListener('click', () => step(-1)); vNext.addEventListener('click', () => step(1));
    vBack.addEventListener('click', e => { if (e.target === vBack) closeView(); });
    vLink.addEventListener('focus', () => vLink.select());
    vCopy.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(vLink.value); ok = true; } catch (_) { vLink.focus(); vLink.select(); try { ok = document.execCommand('copy'); } catch (e) {} }
      vCopy.textContent = ok ? 'Copied' : 'Select and copy the link above';
    });
    vDel.addEventListener('click', async () => {
      if (!current || !current.id) return;
      const id = current.id; try { await idbDel(id); } catch (_) {}
      own = own.filter(r => r.id !== id); if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      closeView(); layout();
    });

    // the form: always for one wall (its topic), named at the top with the topic's own question
    const [fBack, form, fX] = dialog('pw-form', 'Add your photo'); form.noValidate = true; form.setAttribute('aria-labelledby', 'pwFormTitle');
    const fK = el('div', 'pw-k', form);
    const fTitle = el('h2', '', form, 'Add your photo · 掛上你的照片'); fTitle.id = 'pwFormTitle';
    const fTopic = el('p', 'pw-topic', form), fAsk = el('p', 'pw-ask', form);
    const lab = (text, hint, parent) => { const l = el('label', 'pw-field', parent || form), s = el('span', '', l, text + ' '); if (hint) el('em', '', s, hint); return l; };
    const lPhoto = lab('Your photo', '(yours, or one you may share)'); const fFile = el('input', '', lPhoto); fFile.type = 'file'; fFile.accept = 'image/*'; fFile.name = 'photo';
    const fPrev = el('img', 'pw-prev-img', form); fPrev.alt = ''; fPrev.hidden = true;
    const lBody = lab('A short caption', '(what is this, and when?)'); const fBody = el('textarea', '', lBody); fBody.name = 'body'; fBody.rows = 2; fBody.maxLength = MAX_TEXT; fBody.placeholder = 'The stall my mother took me to after school…';
    const two = el('div', 'pw-two', form);
    const lYear = lab('Year', '', two); const fYear = el('select', '', lYear); fYear.name = 'year';
    { const none = el('option', '', fYear, 'Not sure'); none.value = ''; for (let y = THIS_YEAR; y >= 1900; y--) { const op = el('option', '', fYear, String(y)); op.value = String(y); } }
    const lName = lab('Your name', '(optional)', two); const fName = el('input', '', lName); fName.type = 'text'; fName.name = 'name'; fName.maxLength = MAX_NAME; fName.autocomplete = 'nickname';
    const hp = el('label', 'pw-hp', form, 'Leave this empty '); hp.setAttribute('aria-hidden', 'true'); const fHp = el('input', '', hp); fHp.type = 'text'; fHp.name = 'website'; fHp.tabIndex = -1; fHp.autocomplete = 'off';
    const lOk = el('label', 'pw-consent', form), fOk = el('input', '', lOk); fOk.type = 'checkbox'; fOk.name = 'ok';
    el('span', '', lOk, 'This photo is mine to share, and I’m happy for it to be shown on this page. It doesn’t show anyone who would mind.');
    el('p', 'pw-where ' + (ONLINE ? 'shared' : 'local'), form, ONLINE
      ? 'Your photo is sent to the site’s storage and stays private until the makers approve it. Then everyone who visits can see it.'
      : 'The site’s storage isn’t connected yet, so your photo is kept in this browser and nothing is sent anywhere. ' + ONLY_YOU);
    const fStatus = el('p', 'pw-status', form); fStatus.id = 'pwStatus'; fStatus.setAttribute('role', 'status'); fStatus.setAttribute('aria-live', 'polite');
    const fRow = el('div', 'pw-row', form), fSend = el('button', 'pw-btn pw-primary', fRow, 'Hang my photo'); fSend.type = 'submit';
    const fCancel = el('button', 'pw-btn pw-quiet', fRow, 'Cancel'); fCancel.type = 'button';
    let openedAt = 0, lastSent = 0, prevURL = null, fWall = null;
    const say = (t, ok) => { fStatus.textContent = t; fStatus.classList.toggle('ok', !!ok); };
    const clearBad = () => [fFile, fBody, fOk].forEach(f => { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); });
    const bad = (f, t) => { clearBad(); f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', 'pwStatus'); f.focus({ preventScroll: true }); say(t); };
    const dropPrev = () => { if (prevURL) URL.revokeObjectURL(prevURL); prevURL = null; fPrev.hidden = true; fPrev.removeAttribute('src'); };
    fFile.addEventListener('change', () => { dropPrev(); const f = fFile.files && fFile.files[0]; if (f && /^image\//.test(f.type)) { prevURL = URL.createObjectURL(f); fPrev.src = prevURL; fPrev.hidden = false; } });
    function openForm(w) {
      const ws = addable().filter(x => !x.shelf); if (!w || !w.free.length) { if (ws.length !== 1) return openGallery(null); w = ws[0]; }   // no wall named and several to choose from: ask which topic first
      remember(); stopWalking(); leaveGallery(); vBack.hidden = true; current = null; setParam(null); fWall = w;
      fK.textContent = w.placeName; const i = w.info;
      fTopic.textContent = i ? [topicName(i), i.years].filter(Boolean).join(' · ') : (w.label || ''); fTopic.hidden = !fTopic.textContent;
      fAsk.textContent = (i && i.ask) || ''; fAsk.hidden = !fAsk.textContent; fBody.placeholder = (i && i.ask) || 'The stall my mother took me to after school…';
      say(''); clearBad(); fSend.disabled = false; fBack.hidden = false; openedAt = performance.now(); setTimeout(() => fFile.focus({ preventScroll: true }), 30);
    }
    function closeForm() { if (fBack.hidden) return; fBack.hidden = true; reopen(); }
    fX.addEventListener('click', closeForm); fCancel.addEventListener('click', closeForm);
    fBack.addEventListener('click', e => { if (e.target === fBack) closeForm(); });

    // the one way a photo is added, used by the form (and by a page's own script if it wants)
    const clampN = (v, a, b) => Math.max(a, Math.min(b, +(+v).toFixed(2)));
    async function add(w, input) {
      const body = String(input.body || '').trim().slice(0, MAX_TEXT), name = String(input.name || '').trim().slice(0, MAX_NAME) || null;
      const year = input.year ? parseInt(input.year, 10) : null;
      if (!w || !w.free.length) throw new Error('This wall does not take photos.');
      if (!input.file || !/^image\//.test(input.file.type)) throw new Error('Choose a photo first.');
      if (!body) throw new Error('Write a short caption first.');
      if (year !== null && (isNaN(year) || year < 1900 || year > THIS_YEAR)) throw new Error('The year should be between 1900 and ' + THIS_YEAR + '.');
      const small = await shrink(input.file);                               // resized here, before it goes anywhere
      const key = ONLINE ? uuid() : 'local-' + uuid();
      const rec = { id: key, key, section: w.section, topic: w.topic || null, x: clampN(w.spot[0], -60, 60), z: clampN(w.spot[1], -500, 250), year, body, name, created_at: new Date().toISOString(),
        blob: small.blob, width: small.width, height: small.height, local: !ONLINE, mine: ONLINE, photo_path: ONLINE ? key + '.jpg' : null };
      if (ONLINE) await upload(rec, small.blob);                             // keys present: private bucket + a pending row
      try { await idbPut(rec); }
      catch (e) { if (!ONLINE) throw new Error('This browser couldn’t save it. Private browsing may be blocking it.'); }
      own.push(rec); layout();
      return { how: ONLINE ? 'pending' : 'local', key, topic: rec.topic, bytes: small.blob.size, width: small.width, height: small.height };
    }
    form.addEventListener('submit', async ev => {
      ev.preventDefault(); clearBad();
      if (fHp.value) return say('Thank you.');                               // a bot filled the hidden field
      const file = fFile.files && fFile.files[0];
      if (!file) return bad(fFile, 'Choose a photo first.');
      if (!/^image\//.test(file.type)) return bad(fFile, 'That file isn’t a photo.');
      if (file.size > 30e6) return bad(fFile, 'That photo is too large. Please choose one under 30 MB.');
      if (!fBody.value.trim()) return bad(fBody, 'Write a short caption first.');
      if (!fOk.checked) return bad(fOk, 'Please tick the box so your photo can be shown.');
      if (performance.now() - openedAt < 1500) return say('One moment…');
      if (Date.now() - lastSent < 20000) return say('One photo at a time. Try again in a few seconds.');
      fSend.disabled = true; say(ONLINE ? 'Resizing and sending your photo…' : 'Resizing and saving your photo…');
      try {
        const done = await add(fWall, { file, body: fBody.value, year: fYear.value, name: fName.value });
        lastSent = Date.now(); form.reset(); dropPrev();
        say(done.how === 'local' ? 'Saved in this browser. ' + ONLY_YOU : 'Sent. It appears for everyone once the makers approve it. Until then only you can see it here.', true);
        setTimeout(() => { const b = back; back = undefined; fBack.hidden = true; const it = items.find(x => x.key === done.key); back = b; if (it) openView(it); else reopen(); }, 1400);
      } catch (e) {
        const m = e && e.message;
        say(m === 'unreachable' ? 'Saving failed: the page can’t reach the internet right now. Please try again in a moment.'
          : m === 'timeout' ? 'Saving failed: the connection timed out. Please try again.' : m || 'Saving failed. Please try again.');
      } finally { fSend.disabled = false; }
    });

    // keys: while a dialog is open the scene does not hear the keyboard (typing "w" or "1" must not walk or cut the camera)
    const onKey = ev => {
      const box = !fBack.hidden ? form : !vBack.hidden ? view : !gBack.hidden ? gal : null; if (!box) return;
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); if (box === form) closeForm(); else if (box === view) closeView(); else closeGallery(); return; }
      const typing = ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
      if (box === view && !typing && ev.key === 'ArrowLeft') return step(-1);
      if (box === view && !typing && ev.key === 'ArrowRight') return step(1);
      if (ev.key === 'Tab') {
        const f = [...box.querySelectorAll('button, input, textarea, select, a[href]')].filter(e => !e.disabled && e.tabIndex >= 0 && e.offsetParent !== null);
        const a = document.activeElement;
        if (f.length && (ev.shiftKey ? a === f[0] || !box.contains(a) : a === f[f.length - 1] || !box.contains(a))) { ev.preventDefault(); (ev.shiftKey ? f[f.length - 1] : f[0]).focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);

    // a click or tap (not a drag): anywhere on a showcase opens its gallery; on a plain wall a photo opens large and an empty or "+" frame opens the form
    const ray = new T.Raycaster(), ndc = new T.Vector2(); ray.far = 45; let targets = [];
    const retarget = () => { targets = []; walls.forEach(w => { if (w.showcase) targets.push(w.showcase); else w.frames.forEach(fr => targets.push(fr.mesh)); }); };
    const hitAt = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(targets, true)[0]; if (!h) return null;
      for (let n = h.object; n; n = n.parent) { if (n.userData.pwWall) return { wall: n.userData.pwWall }; if (n.userData.photowall && !n.userData.photowall.wall.showcase) return { fr: n.userData.photowall }; }
      return null; };
    let down = null, hoverT = 0;
    const onDown = ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; };
    const onUp = ev => { const d = down; down = null; if (!d || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
      const h = hitAt(ev); if (!h) return; if (h.wall) openGallery(h.wall); else if (h.fr.item) openView(h.fr.item); else openForm(h.fr.wall); };
    const onMove = ev => { if (ev.buttons || ev.pointerType === 'touch') return; const now = performance.now(); if (now - hoverT < 60) return; hoverT = now; canvas.style.cursor = hitAt(ev) ? 'pointer' : ''; };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointermove', onMove);

    // ── load: this browser's photos first (instant), then everyone's approved ones (keys only) ─
    async function refresh() {
      own = (await idbAll()).filter(r => r && r.id && r.key && r.blob && typeof r.body === 'string');
      layout();
      if (ONLINE) {
        try {
          let rows = []; for (const s of [...new Set(walls.map(w => w.section))]) rows = rows.concat(await fetchApproved(s));
          if (wanted && KEY_RE.test(wanted) && !rows.some(r => r.photo_path.indexOf(wanted) === 0)) rows = rows.concat(await fetchApproved(null, wanted));   // a link to a photo from another place
          shared = rows; layout();
        } catch (e) { console.warn('[photowall] could not load the shared photos:', e.message); }
      }
      return items.length;
    }
    function openWanted() {
      if (!wanted) return;
      const it = items.find(x => x.key === wanted);
      if (it) openView(it);
      else { remember(); current = null; vImg.removeAttribute('src'); vK.textContent = 'Shared photo'; vT.hidden = true; vCap.textContent = 'This photo isn’t here.';
        vBy.textContent = /^local-/.test(wanted) ? 'It was saved in one person’s browser only, so it opens only there.' : 'It may still be waiting for approval, or it was taken down.'; vBy.hidden = false;
        vNote.hidden = true; vShare.hidden = true; vPrev.hidden = vNext.hidden = true; vBack.hidden = false; vX.focus({ preventScroll: true }); }
    }
    let pending = null, first = true;
    const schedule = () => pending || (pending = Promise.resolve().then(() => { pending = null; return refresh(); }).then(n => { if (first) { first = false; openWanted(); selftest(); } return n; }));

    // ?pwtest=add:<topic>,<topic>…  adds one drawn picture to each named topic's wall, then prints every wall and record
    // ?pwtest=show  only prints · ?pwtest=gallery:<topic>  prints, then opens that topic's gallery. For headless checks; inert without the query.
    async function selftest() {
      const q = new URLSearchParams(location.search).get('pwtest'); if (!q) return;
      const [mode, arg] = q.split(':'), list = (arg || '').split(',').filter(Boolean);
      try {
        if (mode === 'add') for (let i = 0; i < list.length; i++) { const w = walls.find(x => x.topic === list[i]); if (!w) { console.log('PWTEST no wall for topic ' + list[i]); continue; }
          const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 900);
          gr.addColorStop(0, ['#f7b267', '#7fb8d8', '#b8d87f'][i % 3]); gr.addColorStop(1, '#3d2c4a'); g.fillStyle = gr; g.fillRect(0, 0, 1200, 900);
          g.fillStyle = '#fff3d6'; g.font = '700 120px sans-serif'; g.textAlign = 'center'; g.fillText('TEST ' + list[i] + ' #' + (i + 1), 600, 470);
          const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
          console.log('PWTEST added ' + JSON.stringify(await add(w, { file: new File([blob], 't.png', { type: 'image/png' }), body: 'test photo ' + (i + 1) + ' for ' + list[i], year: 1990 + i, name: 'pwtest' }))); }
        console.log('PWTEST topics ' + JSON.stringify({ sections: [...new Set(walls.map(w => w.section))].map(s => ({ section: s, topicsInFile: topicsOf(s).length, showcases: walls.filter(w => w.section === s && w.showcase).length })) }));
        console.log('PWTEST walls ' + JSON.stringify(walls.map(w => ({ section: w.section, topic: w.topic, showcase: !!w.showcase, photos: w.items.map(it => it.key + (it.topic ? '[' + it.topic + ']' : '')), frames: w.frames.map(f => f.kind + (f.item ? ':' + f.item.key.slice(0, 14) : '')) }))));
        console.log('PWTEST records ' + JSON.stringify((await idbAll()).map(r => ({ key: r.key, section: r.section, topic: r.topic === undefined ? '(none)' : r.topic, year: r.year, body: r.body, name: r.name, local: r.local, blobType: r.blob && r.blob.type, blobBytes: r.blob && r.blob.size, width: r.width, height: r.height }))));
        if (mode === 'gallery') { const w = walls.find(x => x.topic === list[0]); openGallery(w || null); console.log('PWTEST gallery ' + JSON.stringify({ title: gTitle.textContent, ask: gAsk.textContent, tiles: gGrid.children.length, addButton: !gAdd.hidden })); }
      } catch (e) { console.log('PWTEST error ' + (e && e.message)); }
    }

    function addWall(w) { walls.push(w); retarget(); w.frames.forEach(paint); return schedule(); }
    function removeWall(w) { const i = walls.indexOf(w); if (i >= 0) walls.splice(i, 1); retarget(); layout(); }
    return { walls, addWall, removeWall, paint, layout, refresh, add, openView, openForm, openGallery, closeForm, closeView, closeGallery, schedule,
      list: () => items.map(it => Object.assign({}, it, { frame: undefined, wall: undefined, topic: it.topic, wallTopic: it.wall ? it.wall.topic : null })),
      open: key => openView(items.find(x => x.key === key)), records: idbAll, setKeys(k) { if (k) keysMap = k; }, get ready() { return schedule(); } };
  }

  function page(o) { if (!P) { P = makePage(o); const og = P.openGallery; window.__photowall = Object.assign(P, { ONLINE, openGallery: t => og(typeof t === 'string' ? P.walls.find(w => w.topic === t) : t) }); } else P.setKeys(o.keys); return P; }

  // ── shelf: a topic that keeps photos but hangs no frames in the scene (added 2026-11-21 for places.js) ──
  // The caller shows the photos itself (a place's information panel does) and reuses this file's storage, form
  // and large view. Options: THREE, scene, camera, canvas, keys, section as for attach(), plus
  //   topic     the key stored with each photo, at most 40 characters (e.g. 'place:dadao:yongle-market')
  //   info      { zh, en, years, ask }: the title and question the form and the large view show
  //   place     the place name shown under a photo · spot [x, z] stored with a new photo
  //   onChange  called with the topic's photos ([{ key, kind, body, year, name, url }]) whenever they change
  // Returns { ONLINE, ready, topic, section, items(), view(key), openForm(), add(input), wall }.
  function shelf(o) {
    const T = o.THREE || window.THREE;
    if (!T || !o.scene || !o.camera || !o.canvas || !o.topic) throw new Error('PHOTOWALL.shelf needs THREE, scene, camera, canvas and topic');
    page(o);
    const section = PLACE[o.section] ? o.section : 'square', info = Object.assign({ key: o.topic }, o.info || {});
    const w = { section, topic: String(o.topic), info, label: o.label || '', placeName: o.place || PLACE[section], buttons: false, showcase: null, shelf: true, onChange: o.onChange || null,
      items: [], fixed: [], frames: [], free: [{ f: {}, shelf: true }], spot: o.spot || [0, 0] };   // one frameless slot: it is what lets the form and add() accept a photo
    const ready = P.addWall(w);
    return { ONLINE, ready, topic: w.topic, section, wall: w, items: () => w.items.slice(), view: key => P.openView(w.items.find(x => x.key === key)), openForm: () => P.openForm(w), add: input => P.add(w, input),
      dispose() { P.removeWall(w); } };
  }

  // ── attach: one wall or showcase joins the page ─────────────────────────────────────────────
  function attach(o) {
    const T = o.THREE || window.THREE, scene = o.scene, camera = o.camera, canvas = o.canvas;
    if (!T || !scene || !camera || !canvas || !Array.isArray(o.frames) || !o.frames.length) throw new Error('PHOTOWALL.attach needs THREE, scene, camera, canvas and frames');
    page(o);
    const section = PLACE[o.section] ? o.section : 'square';
    const w = { section, topic: o.topic || null, info: topicInfo(section, o.topic), label: o.label || '', placeName: o.place || PLACE[section], buttons: o.buttons, showcase: o.showcase || null, items: [], fixed: [], frames: [], free: [] };
    const first = o.frames[0].position || [0, 0, 0]; w.spot = o.spot || [first[0], first[2]];
    if (w.showcase) w.showcase.userData.pwWall = w;
    w.frames = o.frames.map((f, i) => {
      const fr = { i, f, wall: w, cv: null, tex: null, mesh: null, item: null, img: null, kind: 'empty', own: !f.hit };
      if (f.hit) fr.mesh = f.hit;                                             // a picture the page already hung: only the click is ours
      else {
        const fw = (f.size && f.size[0]) || 2.0, fh = (f.size && f.size[1]) || 1.7;
        fr.cv = document.createElement('canvas'); fr.cv.width = f.cue ? 1024 : 768; fr.cv.height = Math.round(fr.cv.width * fh / fw);
        fr.tex = new T.CanvasTexture(fr.cv); fr.tex.encoding = T.sRGBEncoding; fr.tex.anisotropy = 8;
        const mat = new T.MeshStandardMaterial({ map: fr.tex, roughness: 0.7, emissiveMap: fr.tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: f.glow == null ? 0.18 : f.glow });
        fr.mesh = new T.Mesh(new T.PlaneGeometry(fw, fh), mat);
        fr.mesh.position.set(f.position[0], f.position[1], f.position[2]);
        fr.mesh.rotation.y = Array.isArray(f.facing) ? Math.atan2(f.facing[0], f.facing[2]) : (f.facing || 0);
        fr.mesh.receiveShadow = true; fr.mesh.name = 'photowall-frame-' + i;
        (f.parent || o.parent || scene).add(fr.mesh);
      }
      fr.mesh.userData.photowall = fr; return fr;
    });
    w.free = w.frames.filter(fr => !(fr.f.photo && fr.f.photo.url) && !fr.f.cue && !fr.f.hit);
    w.fixed = w.frames.filter(fr => fr.f.photo && fr.f.photo.url).map(fr => { const p = fr.f.photo;
      return { key: 'fixed-' + (p.id || (P.walls.length + '-' + fr.i)), kind: 'fixed', body: p.caption || '', year: p.year || null, place: p.place || w.placeName, credit: p.credit || '', url: p.url, frame: fr, wall: w, info: null }; });
    const ready = P.addWall(w);
    return { ONLINE, ready, topic: w.topic, section, frames: w.frames, wall: w, list: () => w.items.map(it => Object.assign({}, it, { frame: undefined, wall: undefined })),
      open: key => P.open(key), openGallery: () => P.openGallery(w), openForm: () => P.openForm(w), closeForm: P.closeForm, closeView: P.closeView, closeGallery: P.closeGallery,
      add: input => P.add(w, input), refresh: P.refresh, records: idbAll,
      dispose() { P.removeWall(w); w.frames.forEach(fr => { if (!fr.own) return; fr.mesh.parent && fr.mesh.parent.remove(fr.mesh); fr.mesh.geometry.dispose(); fr.mesh.material.dispose(); fr.tex.dispose(); }); } };
  }

  // ── showcases: the small shop, stand, poster board, shrine wall or kiosk that shows one topic in the scene ──
  const ACCENT = { square: '#1f2a44', red: '#b7372a', dadao: '#8a5a34', tower: '#1f5e8c' };
  const kits = new WeakMap();
  function kit(E) {
    if (kits.has(E)) return kits.get(E);
    const T = E.T, k = {
      plaster: E.triMat({ color: '#e9dfca', tex: E.TEX.plaster, scale: 0.5, rough: 0.9 }),
      stone: E.triMat({ color: '#b9b2a6', tex: E.TEX.concrete, scale: 1.2, rough: 0.6 }),
      wood: E.triMat({ color: '#8a6a48', tex: E.TEX.bark, scale: 2, rough: 0.8 }),
      steel: E.triMat({ color: '#b9bcc0', tex: E.TEX.metal, scale: 3, rough: 0.3, metal: 0.8 }),
      dark: new T.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.6 }),
      frame: new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.5 }),
      gilt: new T.MeshStandardMaterial({ color: E.col('#b98f3e'), roughness: 0.38, metalness: 0.55, emissive: E.col('#3a2608'), emissiveIntensity: 0.5 }),
      goods: ['#7a1f1a', '#d9852b', '#c9a56a', '#7d8f3a', '#d43a5a'].map(c => new T.MeshStandardMaterial({ color: E.col(c), roughness: 0.75 })),
      awning(hex) { const t = E.canvasTex(256, (c, s) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f1e6d0' : hex; c.fillRect(i * s / 8, 0, s / 8, s); } E.speckle(c, s, 2500, 0.1, true); });
        const m = new T.MeshStandardMaterial({ map: t, roughness: 0.9, side: T.DoubleSide, emissiveMap: t, emissive: new T.Color(0.9, 0.6, 0.3), emissiveIntensity: 0.3 }); return m; },
      tint(hex) { return E.triMat({ color: hex, tex: E.TEX.plaster, scale: 0.5, rough: 0.88 }); },
    };
    kits.set(E, k); return k;
  }
  // a title or text plate: lines = [[text, size as a share of the plate's height, y 0..1, weight]], each shrunk to fit the width
  function plate(T, lines, w, h, bg, fg, glow) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.max(64, Math.round(1024 * h / w)); const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const old = () => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      lines.forEach(([txt, size, y, weight]) => { if (!txt) return; let px = Math.round(H * size); g.font = `${weight || 700} ${px}px ${FONT}`; const mw = g.measureText(txt).width, max = W - 70;
        if (mw > max) { px = Math.floor(px * max / mw); g.font = `${weight || 700} ${px}px ${FONT}`; } g.fillText(txt, W / 2, H * y); }); };
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    // the engine's brush-lettered, framed sign when it is there (CJ, 2026-11-21: 「這些招牌也都太單調了」); the plain plate otherwise
    const paint = () => { if (window.ENGINE && ENGINE.paintSign) ENGINE.paintSign(g, W, H, lines.map(([txt, size, y, weight]) => [txt, H * size, y, weight]), bg, fg, { seal: false }); else old(); t.needsUpdate = true; };
    paint(); if (window.ENGINE && ENGINE.paintSign && document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px "Weibei TC"'), document.fonts.load('40px "Kaiti TC"')]).then(paint, () => {});
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: 0.6, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow == null ? 0.5 : glow }));
  }
  // ── the header sign of a showcase ───────────────────────────────────────────────────────────
  // CJ, 2026-11-21: 「每個招牌要根據他的作用跟含義還有真實的招牌去對應」, 「整個專案都是」. Each topic's header is the kind of sign that
  // subject really carries: a temple's lacquer 匾額 read from the right, a stall's light box over a scalloped valance, a cinema
  // marquee with its letter board, a school's enamel plate, a street-name plate, a New Year cloth banner, a stage LED screen…
  // What each follows, the reference, and how sure it is: docs/signage/sources-shared.md.
  const KAI = '"Kaiti TC","BiauKai","DFKai-SB","KaiTi",' + FONT, WEI = '"Weibei TC",' + KAI, XING = '"Xingkai TC",' + KAI, SONG = '"Songti TC","LiSong Pro","PMingLiU",serif', SERIF = 'Georgia,"Times New Roman",serif';
  const SIGNS = {
    family:    { t: 'studio',  bg: '#efe3c6', fg: '#5a1f1a', font: WEI, rim: 'wood' },
    school:    { t: 'enamel',  bg: '#f4f1e6', fg: '#16181c', font: KAI, rim: 'steel', strip: true },
    food:      { t: 'box',     bg: '#fbf8ef', fg: '#c4201a', font: XING, rim: 'steel', valance: ['#c4201a', '#f6d04a'], glow: 0.8, deep: true },
    chunghwa:  { t: 'paint',   bg: '#1d2a24', fg: '#f1e7cc', font: WEI, rtl: true, rim: 'wood', strip: true },
    cinema:    { t: 'marquee', bg: '#a3161a', fg: '#ffe27a', font: WEI, rim: 'dark', glow: 0.75, deep: true },
    walk:      { t: 'road',    bg: '#0b6a3c', fg: '#ffffff', font: FONT, rim: 'steel', icon: 'walk' },
    redhouse:  { t: 'bronze',  bg: '#3a2614', fg: '#d6ae66', font: KAI, rim: 'gilt', glow: 0.14 },
    newyear:   { t: 'cloth',   bg: '#e8731a', fg: '#1a1210', font: XING, emblem: '春' },
    temple:    { t: 'plaque',  bg: '#9c1c16', fg: '#f3cf6a', font: KAI, rtl: true, rim: 'gilt', strip: true, tilt: 0.07 },
    fabric:    { t: 'fascia',  bg: '#e6e0d4', fg: '#c0261c', font: KAI, rim: 'stone' },
    wharf:     { t: 'paint',   bg: '#f6f4ec', fg: '#16181c', font: XING, rim: 'steel', stripe: '#8a3a22', strip: true },
    fireworks: { t: 'led',     bg: '#07060c', fg: '#ffd84a', font: FONT, rim: 'dark', glow: 1.0, deep: true },
    quiet:     { t: 'notice',  bg: '#f7f5ee', fg: '#16181c', font: KAI },
    skywalk:   { t: 'modern',  bg: '#1b1e24', fg: '#ffffff', font: FONT, rim: 'steel', glow: 0.8, deep: true },
    climb:     { t: 'modern',  bg: '#cfd3d6', fg: '#16181c', font: FONT, rim: 'steel', light: true },
    lookup:    { t: 'road',    bg: '#6b4423', fg: '#ffffff', font: FONT, rim: 'steel', icon: 'up' },
  };
  const SIGN_BY_KIND = { plaque: 'temple', marquee: 'cinema', enamel: 'school', awning: 'food', studio: 'family', modern: 'skywalk' };   // a topic added later: the engine reads the type from its wording
  const signFor = (topic, info) => SIGNS[topic] || SIGNS[SIGN_BY_KIND[window.ENGINE && ENGINE.signKind ? ENGINE.signKind((info.zh || '') + '|' + (info.en || ''), false) : 'studio']] || SIGNS.family;
  const rnd = Math.random;
  const speck = (g, x, y, w, h, n, rgb, a) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${rgb},${rnd() * a})`; g.fillRect(x + rnd() * w, y + rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } };
  const fitPx = (g, txt, px, maxW, face, wt) => { g.font = `${wt} ${px}px ${face}`; const w = g.measureText(txt).width; if (w > maxW) { px *= maxW / w; g.font = `${wt} ${px}px ${face}`; } return px; };
  // one line of lettering. fx: 'flat' | 'raised' | 'cut' | 'glow' | 'mount' (letters standing off the wall) · spread: one character per cell · rtl: read from the right
  function letter(g, txt, cx, cy, px, maxW, face, wt, fill, fx, o) {
    if (!txt) return; o = o || {}; g.textAlign = 'center'; g.textBaseline = 'middle'; const t = o.rtl ? [...txt].reverse().join('') : txt;
    const one = (s, x, y, q) => { g.font = `${wt} ${q}px ${face}`; const d = Math.max(1, q * 0.045);
      if (fx === 'raised' || fx === 'cut') { const k = fx === 'raised' ? 1 : -1; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(s, x + d * k, y + d * k); g.fillStyle = 'rgba(255,244,214,.5)'; g.fillText(s, x - d * k * 0.6, y - d * k * 0.6); }
      else if (fx === 'mount') { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(s, x + d * 1.6, y + d * 2); }
      else if (fx === 'glow') { g.shadowColor = o.halo || fill; g.shadowBlur = q * 0.3; g.fillStyle = fill; g.fillText(s, x, y); g.shadowBlur = 0; }
      if (o.outline) { g.lineJoin = 'round'; g.strokeStyle = o.outline; g.lineWidth = q * 0.12; g.strokeText(s, x, y); }
      g.fillStyle = fill; g.fillText(s, x, y); };
    const ch = [...t]; if (o.spread && ch.length > 1 && ch.length <= 8 && !/[A-Za-z0-9]/.test(t)) { const cell = Math.min(maxW / ch.length, px * 1.5), q = Math.min(px, cell * 0.92); ch.forEach((c, i) => one(c, cx + (i - (ch.length - 1) / 2) * cell, cy, q)); }
    else one(t, cx, cy, fitPx(g, t, px, maxW, face, wt));
  }
  const rivet = (g, x, y, r, c) => { g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(x + r * 0.3, y + r * 0.3, r, 0, 7); g.fill(); g.fillStyle = c || '#9a9ca0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); g.fill(); };
  const FACE = {
    paint(g, W, H, S, info) {                       // a brush-painted board: an inset rule, rain streaks; with a stripe, a boat's painted waterline
      g.fillStyle = S.bg; g.fillRect(0, 0, W, H); const dark = S.fg !== '#16181c';
      for (let i = 0; i < W / 12; i++) { g.fillStyle = `rgba(${dark ? '0,0,0' : '70,55,35'},${0.03 + rnd() * 0.06})`; g.fillRect(rnd() * W, 0, 1 + rnd() * H * 0.05, H * (0.2 + rnd() * 0.8)); }
      const m = H * 0.07; g.strokeStyle = S.fg; g.lineWidth = Math.max(2, H * 0.022); g.strokeRect(m, m, W - 2 * m, H - 2 * m);
      if (S.stripe) { g.fillStyle = S.stripe; g.fillRect(m * 1.6, H * 0.74, W - m * 3.2, H * 0.14); g.strokeStyle = '#f6f4ec'; g.lineWidth = H * 0.018; g.beginPath(); for (let x = m * 1.6; x < W - m * 1.6; x += H * 0.2) { g.moveTo(x, H * 0.81); g.quadraticCurveTo(x + H * 0.05, H * 0.775, x + H * 0.1, H * 0.81); g.quadraticCurveTo(x + H * 0.15, H * 0.845, x + H * 0.2, H * 0.81); } g.stroke(); }
      letter(g, info.zh, W / 2, H * (S.stripe ? 0.4 : 0.52), H * (S.stripe ? 0.52 : 0.66), W * 0.86, S.font, 400, S.fg, 'flat', { spread: true, rtl: S.rtl }); },
    plaque(g, W, H, S, info) {                      // 匾額: a lacquered board in a gilt fret frame, gilded characters read from the right, the giver's seal at the left
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#a8201a'); gr.addColorStop(1, '#84140f'); g.fillStyle = gr; g.fillRect(0, 0, W, H); speck(g, 0, 0, W, H, 600, '255,200,150', 0.07);
      if (window.ENGINE && ENGINE.signTrim) ENGINE.signTrim(g, W, H, { dark: true, trim: '#e6bd5c', seed: info.zh, style: 0, ground: -1 }); else { g.strokeStyle = '#e6bd5c'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1); }
      letter(g, info.zh, W / 2, H * 0.52, H * 0.6, W * 0.74, S.font, 700, S.fg, 'raised', { spread: true, rtl: true });
      const s = H * 0.17; g.fillStyle = '#f3cf6a'; g.fillRect(H * 0.3, H * 0.62, s, s); g.fillStyle = '#84140f'; g.font = `400 ${s * 0.42}px ${WEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('敬', H * 0.3 + s / 2, H * 0.62 + s * 0.3); g.fillText('獻', H * 0.3 + s / 2, H * 0.62 + s * 0.74); },
    box(g, W, H, S, info, sub) {                    // a stall's light box: lit acrylic panels in a steel rim, brush characters, a scalloped cloth valance hung under it
      const vh = S.valance ? H * 0.2 : 0, fh = H - vh, gr = g.createLinearGradient(0, 0, 0, fh); gr.addColorStop(0, '#f1ede2'); gr.addColorStop(0.5, S.bg); gr.addColorStop(1, '#ece7da'); g.fillStyle = gr; g.fillRect(0, 0, W, fh);
      g.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 1; i < 4; i++) g.fillRect(W * i / 4 - 1, 0, 2, fh); g.strokeStyle = '#3a3c42'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.025, H * 0.025, W - H * 0.05, fh - H * 0.05);
      letter(g, info.zh, W / 2, fh * 0.4, fh * 0.6, W * 0.8, S.font, 400, S.fg, 'flat', { spread: true }); letter(g, sub, W / 2, fh * 0.81, fh * 0.17, W * 0.8, FONT, 700, S.fg, 'flat');
      if (vh) { const n = 14, w = W / n; g.fillStyle = '#1a1614'; g.fillRect(0, fh, W, vh); for (let i = 0; i < n; i++) { g.fillStyle = S.valance[i % 2]; g.beginPath(); g.moveTo(i * w, fh); g.lineTo((i + 1) * w, fh); g.lineTo((i + 1) * w, fh + vh * 0.5); g.arc((i + 0.5) * w, fh + vh * 0.5, w / 2, 0, Math.PI); g.closePath(); g.fill(); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, fh, W, vh * 0.12); } },
    marquee(g, W, H, S, info, sub) {                // a cinema front: the name board ringed with bulbs, under it the letter board with its rails and loose black letters
      g.fillStyle = '#1a1210'; g.fillRect(0, 0, W, H); const th = H * 0.64, m = H * 0.05; g.fillStyle = S.bg; g.fillRect(m, m, W - 2 * m, th - m);
      const per = 2 * (W - 2 * m + th - m), n = Math.round(per / (H * 0.085)); for (let i = 0; i < n; i++) { let d = i / n * per, x, y; const w = W - 2 * m, hh = th - m; if (d < w) { x = m + d; y = m; } else if (d < w + hh) { x = W - m; y = m + d - w; } else if (d < 2 * w + hh) { x = W - m - (d - w - hh); y = th; } else { x = m; y = th - (d - 2 * w - hh); }
        g.shadowColor = '#ffd97a'; g.shadowBlur = H * 0.04; g.fillStyle = i % 3 ? '#fff0b8' : '#ffc94a'; g.beginPath(); g.arc(x, y, H * 0.022, 0, 7); g.fill(); } g.shadowBlur = 0;
      letter(g, info.zh, W / 2, (m + th) / 2, (th - m) * 0.74, W * 0.8, S.font, 400, S.fg, 'flat', { spread: true, outline: '#4a0a0c' });
      const y0 = th + H * 0.05, bh = H - y0 - m; g.fillStyle = '#f4f1e4'; g.fillRect(m, y0, W - 2 * m, bh); g.fillStyle = 'rgba(0,0,0,.2)'; [0.08, 0.92].forEach(k => g.fillRect(m, y0 + bh * k - 1, W - 2 * m, 2));
      if ('letterSpacing' in g) g.letterSpacing = Math.round(bh * 0.12) + 'px'; letter(g, String(sub || '').toUpperCase(), W / 2, y0 + bh * 0.53, bh * 0.62, W * 0.84, '"Arial Narrow","Helvetica Neue",Arial,sans-serif', 700, '#16181c', 'flat'); if ('letterSpacing' in g) g.letterSpacing = '0px'; },
    enamel(g, W, H, S, info) {                      // an enamelled iron plate: white ground, a double blue rule, 楷書, fixing rivets, rust where the enamel has chipped
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#fbf9f0'); gr.addColorStop(1, '#e9e5d6'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#1d3f8a'; g.lineWidth = H * 0.05; g.strokeRect(H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14); g.lineWidth = H * 0.014; g.strokeRect(H * 0.15, H * 0.15, W - H * 0.3, H - H * 0.3);
      for (let i = 0; i < 9; i++) { const e = i % 4, x = e === 0 ? rnd() * W : e === 1 ? W - rnd() * H * 0.05 : e === 2 ? rnd() * W : rnd() * H * 0.05, y = e === 0 ? rnd() * H * 0.05 : e === 2 ? H - rnd() * H * 0.05 : rnd() * H; g.fillStyle = '#7a3a1c'; g.beginPath(); g.ellipse(x, y, H * (0.02 + rnd() * 0.04), H * (0.015 + rnd() * 0.03), rnd() * 3, 0, 7); g.fill(); }
      [[0.5, 0.07], [0.5, 0.93]].forEach(([x, y]) => rivet(g, W * x, H * y, H * 0.03)); [[H * 0.07, H / 2], [W - H * 0.07, H / 2]].forEach(([x, y]) => rivet(g, x, y, H * 0.03));
      letter(g, info.zh, W / 2, H * 0.53, H * 0.58, W * 0.8, S.font, 700, S.fg, 'flat', { spread: true }); },
    road(g, W, H, S, info, sub) {                   // a street-name plate or a brown sight sign: reflective sheet, a white border with round corners, both languages, a pictogram
      g.fillStyle = '#1a1614'; g.fillRect(0, 0, W, H); const r = H * 0.12, m = H * 0.03, rr = (x, y, w, h, q) => { g.beginPath(); g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath(); };
      rr(m, m, W - 2 * m, H - 2 * m, r); g.fillStyle = S.bg; g.fill(); g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.05)'; for (let x = -H; x < W; x += H * 0.09) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H * 0.045, H); g.lineTo(x + H + H * 0.045, 0); g.lineTo(x + H, 0); g.fill(); } g.restore();
      rr(m * 2.6, m * 2.6, W - m * 5.2, H - m * 5.2, r * 0.75); g.strokeStyle = '#ffffff'; g.lineWidth = H * 0.028; g.stroke();
      const ix = H * 0.62, ir = H * 0.3; g.fillStyle = S.icon === 'walk' ? '#1d4fa8' : 'rgba(0,0,0,0)'; g.beginPath(); g.arc(ix, H / 2, ir, 0, 7); g.fill(); g.strokeStyle = g.fillStyle = '#ffffff'; g.lineCap = g.lineJoin = 'round';
      if (S.icon === 'walk') { g.lineWidth = H * 0.02; g.beginPath(); g.arc(ix, H / 2, ir, 0, 7); g.stroke(); [[-0.3, 1], [0.34, 0.72]].forEach(([dx, k]) => { const x = ix + ir * dx, y = H / 2 - ir * 0.05, q = ir * k; g.beginPath(); g.arc(x, y - q * 0.52, q * 0.14, 0, 7); g.fill(); g.lineWidth = q * 0.15; g.beginPath(); g.moveTo(x, y - q * 0.34); g.lineTo(x, y + q * 0.1); g.lineTo(x - q * 0.16, y + q * 0.6); g.moveTo(x, y + q * 0.1); g.lineTo(x + q * 0.16, y + q * 0.6); g.moveTo(x - q * 0.22, y - q * 0.02); g.lineTo(x, y - q * 0.24); g.lineTo(x + q * 0.22, y - q * 0.02); g.stroke(); }); }
      else { g.lineWidth = H * 0.085; g.beginPath(); g.moveTo(ix, H * 0.76); g.lineTo(ix, H * 0.27); g.moveTo(ix - ir * 0.62, H * 0.47); g.lineTo(ix, H * 0.25); g.lineTo(ix + ir * 0.62, H * 0.47); g.stroke(); }
      const cx = (W + ix + ir) / 2, mw = W - ix - ir - H * 0.5; letter(g, info.zh, cx, H * 0.4, H * 0.42, mw, S.font, 700, '#ffffff', 'flat'); letter(g, sub, cx, H * 0.75, H * 0.17, mw, '"Helvetica Neue",Arial,sans-serif', 600, '#ffffff', 'flat'); },
    studio(g, W, H, S, info, sub) {                 // a portrait studio's board: cream ground, bracketed corners, an oval mount at each end, 魏碑 over a line of Roman capitals
      g.fillStyle = S.bg; g.fillRect(0, 0, W, H); speck(g, 0, 0, W, H, 500, '90,60,30', 0.07);
      if (window.ENGINE && ENGINE.signTrim) ENGINE.signTrim(g, W, H, { dark: false, trim: S.fg, seed: info.zh, style: 1, ground: -1 });
      [H * 0.66, W - H * 0.66].forEach(x => { g.strokeStyle = S.fg; g.lineWidth = H * 0.03; g.beginPath(); g.ellipse(x, H / 2, H * 0.2, H * 0.27, 0, 0, 7); g.stroke(); g.lineWidth = H * 0.01; g.beginPath(); g.ellipse(x, H / 2, H * 0.155, H * 0.225, 0, 0, 7); g.stroke();
        g.fillStyle = S.fg; g.fillRect(x - H * 0.09, H * 0.46, H * 0.18, H * 0.12); g.fillRect(x - H * 0.05, H * 0.42, H * 0.06, H * 0.05); g.fillStyle = S.bg; g.beginPath(); g.arc(x, H * 0.52, H * 0.04, 0, 7); g.fill(); });   // a box camera in each mount, not a face
      const mw = W - H * 2.3; letter(g, info.zh, W / 2, H * 0.4, H * 0.5, mw, S.font, 400, S.fg, 'flat', { spread: true }); g.fillStyle = S.fg; g.fillRect(W / 2 - mw * 0.3, H * 0.68, mw * 0.6, 2);
      if ('letterSpacing' in g) g.letterSpacing = Math.round(H * 0.03) + 'px'; letter(g, String(sub || '').toUpperCase(), W / 2, H * 0.79, H * 0.13, mw, SERIF, 700, S.fg, 'flat'); if ('letterSpacing' in g) g.letterSpacing = '0px'; },
    cloth(g, W, H, S, info, sub) {                  // a 布條 tied across the street: it sags, it folds, it has a stitched hem and eyelets, a round emblem at each end, black brush lettering
      g.fillStyle = '#1a1614'; g.fillRect(0, 0, W, H); const sag = H * 0.1, y0 = H * 0.06, y1 = H * 0.84;
      g.strokeStyle = '#d8d2c2'; g.lineWidth = 2; [[0, 0, H * 0.12, y0], [W, 0, W - H * 0.12, y0], [0, H * 0.98, H * 0.12, y1], [W, H * 0.98, W - H * 0.12, y1]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
      g.save(); g.beginPath(); g.moveTo(H * 0.1, y0); g.quadraticCurveTo(W / 2, y0 + sag * 2, W - H * 0.1, y0); g.lineTo(W - H * 0.1, y1); g.quadraticCurveTo(W / 2, y1 + sag * 2, H * 0.1, y1); g.closePath(); g.fillStyle = S.bg; g.fill(); g.clip();
      for (let i = 0; i < 11; i++) { const a = 0.05 + rnd() * 0.07, gr = g.createLinearGradient(W * i / 11, 0, W * (i + 1) / 11, 0); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.8})`); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(W * i / 11, 0, W / 11 + 1, H); } g.restore();
      const cy = (y0 + y1) / 2 + sag * 0.8; [H * 0.6, W - H * 0.6].forEach(x => { g.fillStyle = '#c7281c'; g.beginPath(); g.arc(x, cy - sag * 0.5, H * 0.25, 0, 7); g.fill(); g.strokeStyle = '#ffe9b0'; g.lineWidth = H * 0.02; g.stroke(); g.fillStyle = '#ffe9b0'; g.font = `400 ${H * 0.32}px ${WEI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.emblem || '福', x, cy - sag * 0.48); });
      [[H * 0.17, y0 + H * 0.07], [W - H * 0.17, y0 + H * 0.07], [H * 0.17, y1 - H * 0.05], [W - H * 0.17, y1 - H * 0.05]].forEach(([x, y]) => rivet(g, x, y, H * 0.022, '#d8d2c2'));
      letter(g, info.zh, W / 2, cy - H * 0.07, H * 0.5, W - H * 2.2, S.font, 400, S.fg, 'flat', { spread: true }); letter(g, sub, W / 2, cy + H * 0.26, H * 0.12, W - H * 2.2, FONT, 700, S.fg, 'flat'); },
    led(g, W, H, S, info, sub) {                    // a stage LED wall: lit pixels on black, warm bars up both sides, the grid of the modules over everything
      g.fillStyle = S.bg; g.fillRect(0, 0, W, H); const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5); gr.addColorStop(0, 'rgba(200,40,170,.5)'); gr.addColorStop(1, 'rgba(40,10,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      [0, 1].forEach(k => { for (let i = 0; i < 4; i++) { const x = k ? W - H * (0.12 + i * 0.17) : H * (0.12 + i * 0.17), hh = H * (0.9 - i * 0.16); g.fillStyle = i % 2 ? '#ff9a2a' : '#ffd84a'; g.fillRect(x - H * 0.05, (H - hh) / 2, H * 0.1, hh); } });
      const mw = W - H * 1.9; letter(g, info.zh, W / 2, H * 0.4, H * 0.5, mw, S.font, 900, S.fg, 'glow', { halo: '#ff7a2a' }); letter(g, sub, W / 2, H * 0.79, H * 0.16, mw, FONT, 700, '#ffffff', 'glow', { halo: '#ff4fd0' });
      g.fillStyle = 'rgba(0,0,0,.42)'; const q = Math.max(4, Math.round(H / 34)); for (let x = 0; x < W; x += q) g.fillRect(x, 0, 1.4, H); for (let y = 0; y < H; y += q) g.fillRect(0, y, W, 1.4); g.fillStyle = 'rgba(0,0,0,.55)'; for (let x = W / 6; x < W; x += W / 6) g.fillRect(x - 1, 0, 2, H); },
    modern(g, W, H, S, info, sub) {                 // a backlit sign on a dark panel (haloed letters), or light: a brushed stainless plate with the letters etched and filled black
      g.fillStyle = S.bg; g.fillRect(0, 0, W, H); for (let i = 0; i < H / 2; i++) { g.fillStyle = S.light ? `rgba(${rnd() > 0.5 ? '255,255,255' : '60,66,72'},${rnd() * 0.12})` : `rgba(255,255,255,${rnd() * 0.035})`; g.fillRect(0, rnd() * H, W, 1); }
      if (S.light) [[0.05, 0.1], [0.95, 0.1], [0.05, 0.9], [0.95, 0.9]].forEach(([x, y]) => rivet(g, W * x, H * y, Math.min(W, H) * 0.022));
      const two = W / H < 2.4; letter(g, info.zh, W / 2, H * (two ? 0.36 : 0.4), H * (two ? 0.34 : 0.46), W * 0.82, S.font, 700, S.fg, S.light ? 'cut' : 'glow', { halo: '#cfe6ff' });
      g.fillStyle = S.light ? '#16181c' : 'rgba(255,255,255,.7)'; g.fillRect(W * 0.3, H * (two ? 0.6 : 0.665), W * 0.4, Math.max(1.5, H * 0.006));
      if ('letterSpacing' in g) g.letterSpacing = Math.round(H * 0.025) + 'px'; letter(g, String(sub || '').toUpperCase(), W / 2, H * (two ? 0.74 : 0.8), H * (two ? 0.1 : 0.13), W * 0.82, '"Helvetica Neue","Avenir Next",Arial,sans-serif', 500, S.fg, 'flat'); if ('letterSpacing' in g) g.letterSpacing = '0px'; },
    notice(g, W, H, S, info, sub) {                 // a printed notice taped to a closed roller shutter
      g.fillStyle = '#8f949a'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += H * 0.085) { const gr = g.createLinearGradient(0, y, 0, y + H * 0.085); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = gr; g.fillRect(0, y, W, H * 0.085); }
      const px = W * 0.14, py = H * 0.07, pw = W * 0.72, ph = H * 0.86; g.save(); g.translate(W / 2, H / 2); g.rotate(-0.012); g.translate(-W / 2, -H / 2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px + 5, py + 6, pw, ph); g.fillStyle = S.bg; g.fillRect(px, py, pw, ph);
      g.fillStyle = '#c0261c'; g.font = `700 ${H * 0.15}px ${KAI}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('公告', px + H * 0.1, py + H * 0.14); g.fillRect(px + H * 0.1, py + H * 0.24, pw - H * 0.2, 3);
      letter(g, info.zh, W / 2, H * 0.52, H * 0.34, pw - H * 0.4, S.font, 700, S.fg, 'flat', { spread: true }); letter(g, sub, W / 2, H * 0.78, H * 0.11, pw - H * 0.4, FONT, 600, '#3a3c42', 'flat');
      g.fillStyle = 'rgba(232,214,150,.75)'; [[px - H * 0.05, py - H * 0.03], [px + pw - H * 0.13, py - H * 0.03], [px - H * 0.05, py + ph - H * 0.06], [px + pw - H * 0.13, py + ph - H * 0.06]].forEach(([x, y]) => g.fillRect(x, y, H * 0.18, H * 0.09)); g.restore(); },
    bronze(g, W, H, S, info, sub) {                 // a cast bronze plaque: stippled ground, a raised polished border, raised letters
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#4d3219'); gr.addColorStop(0.5, '#2c1b0d'); gr.addColorStop(1, '#3f2915'); g.fillStyle = gr; g.fillRect(0, 0, W, H); speck(g, 0, 0, W, H, 3000, '255,210,140', 0.1); speck(g, 0, 0, W, H, 2400, '0,0,0', 0.22);
      [[0.05, 0.05], [0.13, 0.014]].forEach(([m, lw]) => { g.lineWidth = H * lw; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeRect(H * m + 2, H * m + 2, W - 2 * H * m, H - 2 * H * m); g.strokeStyle = '#b98a44'; g.strokeRect(H * m, H * m, W - 2 * H * m, H - 2 * H * m); });
      [[H * 0.24, H * 0.24], [W - H * 0.24, H * 0.24], [H * 0.24, H * 0.76], [W - H * 0.24, H * 0.76]].forEach(([x, y]) => rivet(g, x, y, H * 0.035, '#b98a44'));
      letter(g, info.zh, W / 2, H * 0.4, H * 0.46, W * 0.7, S.font, 700, S.fg, 'raised', { spread: true }); if ('letterSpacing' in g) g.letterSpacing = Math.round(H * 0.02) + 'px'; letter(g, String(sub || '').toUpperCase(), W / 2, H * 0.76, H * 0.12, W * 0.7, SERIF, 700, '#c49a58', 'raised'); if ('letterSpacing' in g) g.letterSpacing = '0px'; },
    fascia(g, W, H, S, info, sub) {                 // a stone band across a market front with separate red letters fixed to it
      g.fillStyle = S.bg; g.fillRect(0, 0, W, H); speck(g, 0, 0, W, H, 2600, '120,110,100', 0.22); speck(g, 0, 0, W, H, 1200, '255,255,255', 0.3);
      g.fillStyle = '#b98f86'; g.fillRect(0, 0, W, H * 0.09); g.fillRect(0, H * 0.91, W, H * 0.09); speck(g, 0, 0, W, H * 0.09, 300, '60,30,30', 0.3); speck(g, 0, H * 0.91, W, H * 0.09, 300, '60,30,30', 0.3); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = W / 5; x < W; x += W / 5) g.fillRect(x, 0, 2, H);
      letter(g, info.zh, W / 2, H * 0.43, H * 0.5, W * 0.76, S.font, 700, S.fg, 'mount', { spread: true }); letter(g, sub, W / 2, H * 0.78, H * 0.13, W * 0.76, SERIF, 700, '#4a4640', 'mount'); },
  };
  function drawSign(g, W, H, S, info) {
    const sub = [info.en, info.years].filter(Boolean).join('  ·  '), fh = S.strip ? Math.round(H * 0.72) : H;
    g.fillStyle = '#1a1614'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.rect(0, 0, W, fh); g.clip(); (FACE[S.t] || FACE.paint)(g, W, fh, S, info, sub); g.restore();
    if (S.strip) {                                   // the English name and the years: a small enamel plate screwed on under the sign, since a sign of this kind does not carry them
      const sw = W * 0.58, sh = H * 0.2, sx = (W - sw) / 2, sy = H * 0.785; g.fillStyle = '#efe9d8'; g.fillRect(sx, sy, sw, sh); g.strokeStyle = '#16181c'; g.lineWidth = Math.max(1.5, sh * 0.05); g.strokeRect(sx + sh * 0.1, sy + sh * 0.1, sw - sh * 0.2, sh - sh * 0.2);
      rivet(g, sx + sh * 0.36, sy + sh / 2, sh * 0.08); rivet(g, sx + sw - sh * 0.36, sy + sh / 2, sh * 0.08); letter(g, sub, W / 2, sy + sh * 0.54, sh * 0.56, sw - sh * 1.4, FONT, 600, '#16181c', 'flat'); }
  }
  function signPlate(T, S, info, w, h) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.max(64, Math.round(1024 * h / w)); const g = cv.getContext('2d');
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; const paint = () => { g.setTransform(1, 0, 0, 1, 0, 0); drawSign(g, cv.width, cv.height, S, info); t.needsUpdate = true; };
    paint(); if (document.fonts && document.fonts.load) Promise.all(['Weibei TC', 'Kaiti TC', 'Xingkai TC'].map(f => document.fonts.load('40px "' + f + '"'))).then(paint, () => {});
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: 0.6, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: S.glow == null ? 0.42 : S.glow }));
  }
  // each kind builds its body with box() and returns where the title, the photo frames and the "see all" plate go
  // (all [x, y, z, w, h] on its front, which looks along +Z), and its footprint [u0, u1, v0, v1].
  const KINDS = {
    wall(E, K, box, o) { box(3.8, 0.25, 0.7, K.stone, 0, 0.125, 0); box(3.6, 2.5, 0.3, o.body === 'brick' ? E.MATS.brick : o.body ? K.tint(o.body) : K.plaster, 0, 1.5, 0); box(3.6, 1.0, 0.14, K.dark, 0, 3.25, 0);
      return { title: [0, 3.25, 0.075, 3.5, 0.9], frames: [[-0.9, 1.8, 0.21, 1.45, 1.2], [0.9, 1.8, 0.21, 1.45, 1.2]], cue: [0, 0.78, 0.155, 3.0, 0.36], foot: [-1.9, 1.9, -0.35, 0.35] }; },
    shop(E, K, box, o, accent) { const T = E.T; box(3.6, 3.3, 1.4, K.tint(o.body || '#d8c8ac'), 0, 1.65, -0.7); box(3.9, 0.14, 1.7, K.dark, 0, 3.37, -0.7); box(3.6, 0.3, 0.12, K.stone, 0, 0.15, 0.04);
      box(3.8, 0.05, 0.95, K.awning(accent), 0, 2.22, 0.45).rotation.x = 0.22;
      [-1.2, 0, 1.2].forEach(x => { const b = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), E.GLOW(4.5, 3.0, 1.3)); b.position.set(x, 2.08, 0.5); o.g.add(b); });
      return { title: [0, 2.82, 0.012, 3.5, 0.86], frames: [[-0.86, 1.36, 0.07, 1.42, 1.16], [0.86, 1.36, 0.07, 1.42, 1.16]], cue: [0, 0.5, 0.11, 3.0, 0.34], foot: [-1.95, 1.95, -1.45, 0.15], glow: 0.3 }; },
    stand(E, K, box, o, accent) { const T = E.T; box(3.2, 0.9, 0.9, K.wood, 0, 0.45, 0.5); box(3.3, 0.06, 1.0, K.steel, 0, 0.93, 0.5); box(3.2, 2.3, 0.12, K.plaster, 0, 2.05, -0.06);
      [[-1.62, 0.96], [1.62, 0.96], [-1.62, -0.06], [1.62, -0.06]].forEach(([x, z]) => { const p = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 3.15, 6), K.steel); p.position.set(x, 1.575, z); p.castShadow = true; o.g.add(p); });
      box(3.6, 0.05, 1.5, K.awning(accent), 0, 3.17, 0.5).rotation.x = 0.14; box(3.4, 0.9, 0.12, K.dark, 0, 3.78, -0.06);
      [-1.15, -0.4, 0.4, 1.15].forEach((x, i) => { const c = new T.Mesh(new T.CylinderGeometry(0.22, 0.18, 0.24, 12), K.wood); c.position.set(x, 1.08, 0.66); c.castShadow = true; o.g.add(c);
        const s = new T.Mesh(new T.SphereGeometry(0.2, 12, 8), K.goods[i % K.goods.length]); s.scale.y = 0.55; s.position.set(x, 1.2, 0.66); o.g.add(s); });
      [-0.9, 0.9].forEach(x => { const b = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), E.GLOW(4.5, 3.0, 1.3)); b.position.set(x, 2.95, 0.6); o.g.add(b); });
      return { title: [0, 3.78, 0.005, 3.3, 0.8], frames: [[-0.82, 2.08, 0.03, 1.4, 1.15], [0.82, 2.08, 0.03, 1.4, 1.15]], cue: [0, 0.5, 0.96, 2.7, 0.36], foot: [-1.75, 1.75, -0.2, 1.0], glow: 0.38 }; },
    poster(E, K, box, o, accent) { const T = E.T; box(2.0, 0.3, 0.9, K.stone, 0, 0.15, 0); box(1.8, 4.4, 0.22, K.dark, 0, 2.5, 0); box(1.0, 1.0, 0.6, K.wood, 1.75, 0.5, 0.05); box(1.1, 0.05, 0.72, K.steel, 1.75, 1.04, 0.05).rotation.x = 0.22;
      [-0.6, 0.6].forEach(x => { const b = new T.Mesh(new T.BoxGeometry(0.3, 0.05, 0.12), E.GLOW(3.2, 1.9, 0.75)); b.position.set(x, 0.33, 0.36); o.g.add(b); });
      return { title: [0, 4.1, 0.115, 1.7, 1.0], frames: [[0, 2.85, 0.15, 1.5, 1.2], [0, 1.55, 0.15, 1.5, 1.2]], cue: [0, 0.68, 0.115, 1.6, 0.3], foot: [-1.05, 2.3, -0.5, 0.5], zh: 0.4 }; },
    shrine(E, K, box, o) { const T = E.T; box(3.6, 0.25, 0.8, K.stone, 0, 0.125, 0); box(3.2, 3.0, 0.35, E.MATS.verm, 0, 1.75, 0); box(4.2, 0.16, 1.3, E.MATS.ink, 0, 3.36, 0); box(3.6, 0.26, 0.3, E.MATS.ink, 0, 3.56, 0);
      [-1, 1].forEach(k => { box(0.5, 0.2, 0.3, E.MATS.ink, k * 1.98, 3.66, 0).rotation.z = k * 0.5;
        const c = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.42, 5), K.dark); c.position.set(k * 1.85, 3.07, 0.45); o.g.add(c);
        const l = new T.Mesh(new T.SphereGeometry(0.24, 14, 10), new T.MeshBasicMaterial({ color: new T.Color(1.9, 0.26, 0.1) })); l.scale.y = 0.84; l.position.set(k * 1.85, 2.68, 0.45); o.g.add(l); });
      return { title: [0, 2.8, 0.185, 2.9, 0.72], frames: [[-0.78, 1.78, 0.235, 1.35, 1.1], [0.78, 1.78, 0.235, 1.35, 1.1]], cue: [0, 0.74, 0.185, 2.8, 0.34], foot: [-1.9, 1.9, -0.45, 0.45], bg: '#2a1a14', fg: '#f3d27a' }; },
    kiosk(E, K, box, o) { const T = E.T; box(2.8, 2.7, 1.8, E.MATS.ink, 0, 1.35, -0.9); box(3.6, 0.12, 2.6, K.steel, 0, 2.78, -0.7); box(3.0, 0.9, 0.12, K.dark, 0, 3.3, -0.2);
      const s = new T.Mesh(new T.BoxGeometry(3.4, 0.04, 0.04), E.GLOW(1.2, 1.9, 2.6)); s.position.set(0, 2.69, 0.55); o.g.add(s);
      return { title: [0, 3.3, -0.135, 2.9, 0.8], frames: [[-0.68, 1.62, 0.07, 1.22, 1.0], [0.68, 1.62, 0.07, 1.22, 1.0]], cue: [0, 0.62, 0.012, 2.5, 0.34], foot: [-1.5, 1.5, -1.85, 0.15], glow: 0.3 }; },
  };
  function showcase(E, o) {
    const T = E.T, K = kit(E), info = topicInfo(o.section, o.topic) || { zh: o.topic || '', en: '', years: '' };
    const accent = o.accent || ACCENT[o.section] || ACCENT.square, kind = KINDS[o.kind] ? o.kind : 'wall';
    const g = new T.Group(); g.name = 'showcase-' + (o.topic || ''); g.position.set(o.at[0], 0, o.at[1]); g.rotation.y = o.facing || 0;
    const box = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    const L = KINDS[kind](E, K, box, Object.assign({}, o, { g }), accent);
    const [tx, ty, tz, tw, th] = L.title;
    // the header: the sign this topic really carries, in its case or frame (a light box stands proud of the wall, a 匾額 leans out from the top)
    // CJ, 2026-11-22: 「這種無聊的招牌絕對不能出現」. A showcase is the site's own exhibition piece, not a shop, so its header is an
    // exhibition graphic from design-kit.js (each topic its own: a drawn panel of the subject, the name set huge, an exhibit number),
    // standing off the wall in a deep frame with a light bar. Without design-kit.js the older sign faces below are used.
    const DK = window.DESIGN && DESIGN.headerTexture && !o.legacySign;
    const S = DK ? Object.assign({}, signFor(o.topic, info), { rim: 'dark', deep: true, tilt: 0 }) : signFor(o.topic, info), sg = new T.Group(); sg.position.set(tx, ty, tz); if (S.tilt) { sg.rotation.x = S.tilt; sg.position.z += Math.sin(S.tilt) * th / 2; } g.add(sg);
    const title = DK ? new T.Mesh(new T.PlaneGeometry(tw, th), new T.MeshStandardMaterial({ map: DESIGN.headerTexture(E, o.topic, info, tw, th), roughness: 0.55, emissiveMap: DESIGN.headerTexture(E, o.topic, info, tw, th), emissive: new T.Color(1, 1, 1), emissiveIntensity: 0.45 })) : signPlate(T, S, info, tw, th); sg.add(title);
    if (DK) { const bar = new T.Mesh(new T.BoxGeometry(tw, 0.03, 0.05), E.GLOW(3.6, 2.6, 1.3)); bar.position.set(0, th / 2 + 0.07, 0.16); sg.add(bar);
      [-1, 1].forEach(k => { const arm = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.2), K.dark); arm.position.set(k * tw * 0.4, th / 2 + 0.07, 0.08); sg.add(arm); }); }
    const rimMat = { steel: K.steel, wood: K.frame, dark: K.dark, gilt: K.gilt, stone: K.stone }[S.rim];
    if (rimMat) { const d = S.deep ? 0.16 : 0.07, r = 0.05; title.position.z = S.deep ? 0.07 : 0;
      [[tw + 2 * r, r, 0, th / 2 + r / 2], [tw + 2 * r, r, 0, -th / 2 - r / 2], [r, th, -tw / 2 - r / 2, 0], [r, th, tw / 2 + r / 2, 0]].forEach(([w, h, x, y]) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), rimMat); m.position.set(x, y, d / 2 - 0.045); m.castShadow = true; sg.add(m); }); }
    const frames = L.frames.map(([x, y, z, w, h]) => { box(w + 0.2, h + 0.2, 0.06, K.frame, x, y, z - 0.03); return { position: [x, y, z + 0.012], size: [w, h], facing: 0, parent: g, glow: L.glow }; });
    frames.push({ position: [L.cue[0], L.cue[1], L.cue[2] + 0.012], size: [L.cue[3], L.cue[4]], facing: 0, parent: g, cue: true, glow: 0.55 });
    E.scene.add(g);
    const api = attach({ THREE: T, scene: E.scene, camera: E.camera, canvas: E.canvas, keys: E.keys, section: o.section, topic: o.topic, place: o.place, spot: o.at, frames, showcase: g });
    api.group = g; api.kind = kind; api.footprint = block({ x: o.at[0], z: o.at[1], facing: o.facing || 0, u0: L.foot[0], u1: L.foot[1], v0: L.foot[2], v1: L.foot[3] });
    return api;
  }
  // one showcase per topic of the section, each at its named spot: spots = { topicKey: [x, z, facing, kind, options] }
  function showcases(E, o) {
    const spare = (o.spare || []).slice();
    return (Array.isArray(o.topics) ? o.topics.filter(t => t && t.key) : topicsOf(o.section)).map(t => { const s = (o.spots && o.spots[t.key]) || spare.shift();
      if (!s) { console.warn('[photowall] no place in this scene for the topic "' + t.key + '": add it to the page\'s spots'); return null; }
      return showcase(E, Object.assign({ section: o.section, topic: t.key, place: o.place, at: [s[0], s[1]], facing: s[2] || 0, kind: s[3] }, s[4] || {})); }).filter(Boolean);
  }

  // unblock(f) drops a footprint block() returned; feet() lists them all, so a module in lm/ that replaces old geometry can remove the old one's walls
  const unblock = f => { const i = FOOT.indexOf(f); if (i >= 0) FOOT.splice(i, 1); return i >= 0; }, feet = () => FOOT.slice();
  window.PHOTOWALL = { attach, shelf, row, showcase, showcases, block, unblock, feet, keepOut, topics: topicsOf, ONLINE };
})();
