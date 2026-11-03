// walk.js — free movement. The visit starts in a square; three gates lead into the three sections.
//
// CJ, 2026-10-31: 「i want to make this repo with different space and free move, people can visit freely
// and upload their memory in taipei」, then 「the street become a square first, we can goes into different
// section」. Decided the same day: third-person (you steer 張君雅小妹妹, the camera follows), the scroll
// film stays as a "Guided tour", memories in Supabase, text + photo with approval (memories.js).
//
// The square is a walled plaza in front of the street (z ≈ 116 … 184), walled on four sides so the
// street cannot be seen from it. Each gate stands where its district is in the real city, seen from
// the square: 西門町 to the WEST (西門 is literally "the west gate"), 大稻埕 to the NORTH, 信義 to the
// EAST. Walking into a gate's glow fades the frame and puts you at the start of that section.
//
// A section is its own stretch of the one street (data.js zRange), closed at both ends by an arch:
// the near arch leads back to the square, the far one on into the next section (信義 ends at the
// tower, where you look up at the man climbing it). Inside a section you walk freely between the
// two pavements.
//
// Nothing in app.js is rebuilt for this. app.js asks WALK.update() for the camera's z each frame
// and reads WALK.u back as the scroll progress, so the eras, the year, the labels, the photographs
// and the man on the tower keep reading the number they always read. ?tour=1 (or ?year=) opens the
// scroll film instead, as before.
(function () {
  'use strict';
  if (!window.RIG || !window.SCENE || !window.THREE || !window.DATA) return;
  const R = window.RIG, S = window.SCENE, D = window.DATA;
  const { scene, C, lit, ERAS, anchors } = S;
  const camera = R.camera, girl = R.girl;
  const QS = new URLSearchParams(location.search);

  // ── tunables ────────────────────────────────────────────────────────────────
  const SPEED = 4.2, RUN = 7.8;          // world units a second, walking and with Shift held (she is child-sized: ~1.6)
  const CAM_D = 6.2, CAM_LOOK_Y = 1.35; // camera distance behind her, and the height it looks at
  const PITCH0 = 0.28, PITCH_MIN = -0.45, PITCH_MAX = 1.0;
  const FOV = 55;
  const HUB_U = D.OPENING.fogTo + 0.002;   // the progress the square stands for: past the opening fog, chapter 1's light
  const SIDE = 8.4;                     // how far from the centre line she can walk in a section (the pavement's edge)

  // ── the square ──────────────────────────────────────────────────────────────
  const SQ_MOD = window.SQUARE;                    // square.js, loaded just before this file
  const SQ = SQ_MOD ? SQ_MOD.SQ : { x: 0, z: 150, h: 26, gate: 4.6 };   // h: centre to the arcade's columns; gate: half a gate's opening
  const OBST = SQ_MOD ? SQ_MOD.obstacles : [{ x: SQ.x, z: SQ.z, r: 3.3 }];
  const GATES = {
    red:   { side: 'west',  zh: '西門町', en: 'XIMENDING',  years: '1985 – 1999', line: 'When We Were Young', col: 'verm'  },
    dadao: { side: 'north', zh: '大稻埕', en: 'DADAOCHENG', years: '2000 – 2019', line: 'Spring Festival',    col: 'brick' },
    tower: { side: 'east',  zh: '信義',   en: 'XINYI',      years: '2020 – 2027', line: 'Into the Future',    col: 'glass' },
  };
  // each section: its stretch of the street (girl z), the era it is, and where its arches lead
  const TOWER_FRONT = anchors.tower101 ? anchors.tower101.z + (anchors.tower101.tile.size[1] / 2) + 6 : -402;
  const SECT = {
    red:   { era: 0, top: ERAS[0].zRange[0] - 1, end: ERAS[0].zRange[1] + 1, next: 'dadao' },
    dadao: { era: 1, top: ERAS[1].zRange[0] - 1, end: ERAS[1].zRange[1] + 1, next: 'tower' },
    tower: { era: 2, top: ERAS[2].zRange[0] - 1, end: TOWER_FRONT,            next: null },
  };

  // ── state ───────────────────────────────────────────────────────────────────
  const st = {
    where: 'square',               // 'square' | 'red' | 'dadao' | 'tower'
    x: 0, z: 170, h: 0,            // her place and heading (0 = facing -z, down the street)
    vx: 0, vz: 0,
    yaw: 0, pitch: PITCH0,         // the camera's orbit round her (yaw 0 = behind her when she faces -z)
    lastLook: -1e9, moved: false, busy: false, t: 0,
  };
  const WALK = window.WALK = {
    on: false, u: HUB_U, dusk: 0,         // dusk: 0…1, golden hour in the square (app.js reads it)
    get where() { return st.where; },
    get pos() { return { x: st.x, z: st.z, h: st.h }; },
    get welcoming() { return welcomeOpen; },   // the first-visit card is up (memories.js waits for it before a ?m= link moves her)
    get busy() { return st.busy; },
    // the section the memories belong to right now: where she is when walking, the era on the tour
    section() { return WALK.on ? st.where : ERAS[R.eraIdx].key; },
    update, enter, goSquare, startTour, startWalk,
    bar: null,
  };

  // ── building helpers ────────────────────────────────────────────────────────
  // lit() draws vertex colours; geometry built here has none, so every material here turns them off
  const mat = (col, extra) => lit(Object.assign({ color: typeof col === 'string' ? C(col) : col, vertexColors: false }, extra || {}));
  const box = (w, h, d, m, x, y, z, parent) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y + h / 2, z); o.castShadow = o.receiveShadow = true;
    (parent || scene).add(o); return o;
  };
  const signs = [];   // canvas signs, redrawn once the web fonts have arrived
  function sign(w, h, draw, parent) {
    const cv = document.createElement('canvas');
    cv.width = Math.round(256 * w); cv.height = Math.round(256 * h);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    const redraw = () => { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); draw(g, cv.width, cv.height); tex.needsUpdate = true; };
    redraw(); signs.push(redraw);
    if (parent) parent.add(m);
    return m;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => signs.forEach(f => f()));
  const FONT_ZH = '"Chocolate Classical Sans", "Noto Sans TC", "PingFang TC", sans-serif';
  const FONT_EN = '"Barlow Condensed", "Barlow", sans-serif';
  const P = S.PALETTE;

  // the glow inside a gate: a soft curtain of the district's colour that breathes, so it reads as a doorway
  const portalMats = [];
  function portalMat(col) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: C(col) }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uCol; uniform float uTime; varying vec2 vUv;
        void main(){
          float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(1.0, 0.8, vUv.y);
          float wave = 0.5 + 0.5 * sin(uTime * 1.6 + vUv.y * 9.0 - vUv.x * 3.0);
          vec3 c = mix(uCol, vec3(1.0, 0.97, 0.9), 0.35 + 0.25 * wave * (1.0 - vUv.y));
          gl_FragColor = vec4(c, edge * (0.55 + 0.25 * wave));
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    });
    portalMats.push(m); return m;
  }
  // an arch: two posts, a lintel, a sign on the lintel and the glow between the posts. Built facing +z
  // (the sign reads from +z); the caller turns it. w = clear width between the posts.
  function arch(w, hgt, col, drawSign, glowCol) {
    const g = new THREE.Group();
    const m = mat(col), dark = mat('ink');
    box(1.3, hgt, 1.3, m, -w / 2 - 0.65, 0, 0, g);
    box(1.3, hgt, 1.3, m, w / 2 + 0.65, 0, 0, g);
    box(1.6, 0.4, 1.6, dark, -w / 2 - 0.65, 0, 0, g);
    box(1.6, 0.4, 1.6, dark, w / 2 + 0.65, 0, 0, g);
    box(w + 4.2, 2.2, 1.6, m, 0, hgt, 0, g);
    box(w + 5, 0.35, 2.0, dark, 0, hgt + 2.2, 0, g);
    const s1 = sign(w + 2.6, 1.9, drawSign, g); s1.position.set(0, hgt + 1.1, 0.82);
    const s2 = sign(w + 2.6, 1.9, drawSign, g); s2.position.set(0, hgt + 1.1, -0.82); s2.rotation.y = Math.PI;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), portalMat(glowCol || col));
    glow.position.y = hgt / 2; glow.renderOrder = 5; g.add(glow);
    scene.add(g);
    return g;
  }
  const arrowSign = (zh, en, dir, col) => (g, W, H) => {
    g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
    g.fillStyle = P[col]; g.fillRect(0, H * 0.88, W, H * 0.12);
    g.fillStyle = P.bone; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.font = `700 ${Math.round(H * 0.42)}px ${FONT_ZH}`;
    const t = dir < 0 ? '← ' + zh : zh + ' →';
    g.fillText(t, W / 2, H * 0.36);
    g.font = `700 ${Math.round(H * 0.18)}px ${FONT_EN}`; g.fillText(en, W / 2, H * 0.7);
  };

  // ── the square itself is square.js: the banyan, the arcades, the three gates, the karaoke stand ──
  const square = SQ_MOD ? SQ_MOD.group : new THREE.Group();

  // ── the arches at each end of a section ─────────────────────────────────────
  // near end: back to the square; far end: on to the next section. Only the current section's show.
  const sectArch = {};
  Object.keys(SECT).forEach(k => {
    const s = SECT[k], G = GATES[k];
    const back = arch(SIDE * 2 + 0.6, 6.2, G.col, arrowSign('廣場', 'BACK TO THE SQUARE', -1, G.col), G.col);
    back.position.set(0, 0, s.top + 1.4); back.rotation.y = Math.PI;   // read from inside the section, looking back
    const list = [back];
    if (s.next) {
      const N = GATES[s.next];
      const fwd = arch(SIDE * 2 + 0.6, 6.2, N.col, arrowSign(N.zh, N.en + ' · ' + N.years, 1, N.col), N.col);
      fwd.position.set(0, 0, s.end - 1.4);
      list.push(fwd);
    }
    list.forEach(a => { a.visible = false; });
    sectArch[k] = list;
  });

  function showFor(where) {
    square.visible = where === 'square';
    Object.keys(sectArch).forEach(k => sectArch[k].forEach(a => { a.visible = WALK.on && k === where; }));
  }

  // ── the HUD: the hint, the buttons, the joystick, the fade ──────────────────
  const hud = document.createElement('div'); hud.id = 'walkHud'; document.body.appendChild(hud);
  const fade = document.createElement('div'); fade.id = 'walkFade'; document.body.appendChild(fade);
  const touch = R.IS_PHONE || ('ontouchstart' in window);
  hud.innerHTML =
    '<div class="wk-square" id="wkSquare"><div class="wk-sq-zh">廣場</div><div class="wk-sq-en">THE SQUARE</div>' +
      '<div class="wk-sq-line">Three gates, forty years.<br><span><b>West</b> 西門町</span> · <span><b>North</b> 大稻埕</span> · <span><b>East</b> 信義</span></div></div>' +
    '<div class="wk-hint" id="wkHint">' + (touch
      ? 'Use the stick to walk · drag anywhere to look around'
      : '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk · <kbd>Shift</kbd> to run · drag to look around') + '</div>' +
    '<div class="wk-bar" id="wkBar">' +
      '<button type="button" class="wk-btn" id="wkHome">⌂ Square</button>' +
      '<button type="button" class="wk-btn" id="wkTour">▶ Guided tour</button>' +
    '</div>' +
    '<div class="wk-stick" id="wkStick" aria-hidden="true"><div class="wk-knob"></div></div>';
  const tourOut = document.createElement('button');
  tourOut.type = 'button'; tourOut.id = 'wkWalk'; tourOut.className = 'wk-btn'; tourOut.textContent = 'Walk freely';
  document.body.appendChild(tourOut);
  WALK.bar = document.getElementById('wkBar');
  const hint = document.getElementById('wkHint');
  document.getElementById('wkHome').addEventListener('click', () => goSquare('home'));
  document.getElementById('wkTour').addEventListener('click', startTour);
  tourOut.addEventListener('click', () => startWalk());

  // the music player folds to one pill while walking (play, the decade, sound on/off); "More" unfolds it
  const musRoot = document.getElementById('music');
  if (musRoot) {
    const more = document.createElement('button');
    more.type = 'button'; more.className = 'mus-more'; more.textContent = 'More';
    more.setAttribute('aria-expanded', 'false');
    more.addEventListener('click', () => {
      const open = musRoot.classList.toggle('open');
      more.textContent = open ? 'Less' : 'More'; more.setAttribute('aria-expanded', String(open));
    });
    const body = musRoot.querySelector('.mus-body');
    (body || musRoot).appendChild(more);
  }

  // ── the welcome card: the first time someone arrives, say what this place is and what to do ──
  const SEEN_KEY = 'our-memory-in-taipei:welcomed';
  const welcome = document.createElement('div');
  welcome.id = 'wkWelcome'; welcome.hidden = true;
  welcome.setAttribute('role', 'dialog'); welcome.setAttribute('aria-modal', 'true'); welcome.setAttribute('aria-labelledby', 'wkWelcomeTitle');
  welcome.innerHTML =
    '<div class="wk-card">' +
      '<div class="wk-card-k">Our Memory in Taipei · <span>我們的台北記憶</span></div>' +
      '<h1 id="wkWelcomeTitle">Walk into a decade of Taipei.</h1>' +
      '<p>Three gates lead out of this square, each into a different Taipei.</p>' +
      '<div class="wk-card-gates">' +
        '<div style="background:var(--verm)"><b>西門町</b>West · 1985–99</div>' +
        '<div style="background:var(--brick)"><b>大稻埕</b>North · 2000–19</div>' +
        '<div style="background:var(--glass)"><b>信義</b>East · 2020s</div>' +
      '</div>' +
      '<p>Walk through one, and leave a lantern where your own memory happened.</p>' +
      '<div class="wk-card-actions">' +
        '<button type="button" class="wk-btn primary" id="wkStart">Start walking</button>' +
        '<button type="button" class="wk-btn ghost" id="wkWelcomeTour">Guided tour</button>' +
      '</div>' +
      '<div class="wk-card-keys">' + (touch ? 'Walk with the stick · drag to look around' : 'Walk with W A S D or the arrows · drag to look around') + '</div>' +
    '</div>';
  document.body.appendChild(welcome);
  let welcomeOpen = false;
  function showWelcome() {
    welcomeOpen = true; welcome.hidden = false; document.body.classList.add('wk-welcome');
    setTimeout(() => { const b = document.getElementById('wkStart'); if (b) b.focus({ preventScroll: true }); }, 50);
  }
  function closeWelcome() {
    if (!welcomeOpen) return;
    welcomeOpen = false; welcome.hidden = true; document.body.classList.remove('wk-welcome');
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) { /* private mode: it shows again next time, which is fine */ }
  }
  document.getElementById('wkStart').addEventListener('click', closeWelcome);
  document.getElementById('wkWelcomeTour').addEventListener('click', () => { closeWelcome(); startTour(); });
  welcome.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeWelcome(); });
  const firstVisit = () => { try { return !localStorage.getItem(SEEN_KEY); } catch (_) { return true; } };

  // ── input ───────────────────────────────────────────────────────────────────
  const keys = new Set();
  const typing = t => t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
  const MOVE_KEYS = { w: 1, a: 1, s: 1, d: 1, arrowup: 1, arrowdown: 1, arrowleft: 1, arrowright: 1, shift: 1 };
  window.addEventListener('keydown', ev => {
    if (!WALK.on || typing(ev.target) || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (MOVE_KEYS[k]) { keys.add(k); if (k.startsWith('arrow') || k === ' ') ev.preventDefault(); }
  });
  window.addEventListener('keyup', ev => keys.delete(ev.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  // look: drag on the canvas (mouse or finger) orbits the camera round her
  const cvs = R.canvas;
  let look = null;
  cvs.addEventListener('pointerdown', ev => {
    if (!WALK.on) return;
    look = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY };
  });
  window.addEventListener('pointermove', ev => {
    if (!look || ev.pointerId !== look.id) return;
    const dx = ev.clientX - look.x, dy = ev.clientY - look.y; look.x = ev.clientX; look.y = ev.clientY;
    st.yaw -= dx * 0.006; st.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, st.pitch + dy * 0.004));
    st.lastLook = st.t;
  });
  const endLook = ev => { if (look && ev.pointerId === look.id) look = null; };
  window.addEventListener('pointerup', endLook); window.addEventListener('pointercancel', endLook);

  // the stick: a phone's thumb, bottom right
  const stick = document.getElementById('wkStick'), knob = stick.firstChild;
  const stickV = { x: 0, y: 0, id: null };
  function stickAt(ev) {
    const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
    let dx = (ev.clientX - cx) / rad, dy = (ev.clientY - cy) / rad; const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    stickV.x = dx; stickV.y = dy;
    knob.style.transform = `translate(${(dx * rad * 0.55).toFixed(1)}px, ${(dy * rad * 0.55).toFixed(1)}px)`;
  }
  stick.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); stickV.id = ev.pointerId; stick.setPointerCapture(ev.pointerId); stickAt(ev); });
  stick.addEventListener('pointermove', ev => { if (ev.pointerId === stickV.id) stickAt(ev); });
  const stickEnd = ev => { if (ev.pointerId !== stickV.id) return; stickV.id = null; stickV.x = stickV.y = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);

  // ── moving between spaces ───────────────────────────────────────────────────
  function teleport(fn) {
    if (st.busy) return;
    st.busy = true; fade.classList.add('on');
    setTimeout(() => { fn(); setTimeout(() => { fade.classList.remove('on'); st.busy = false; }, 120); }, 320);
  }
  function place(where, x, z, h) {
    st.where = where; st.x = x; st.z = z; st.h = h; st.yaw = h; st.pitch = PITCH0; st.vx = st.vz = 0;
    document.body.classList.toggle('in-square', where === 'square');
    showFor(where);
    if (where !== 'square') document.documentElement.dataset.section = where; else delete document.documentElement.dataset.section;
  }
  // enter(k, instant, at): into section k at its near end, or, with at = { x, z, h }, at that spot
  // (2026-11-03, item #12: 「帶我去那裡」 and the ?m= share links put her next to a lantern). k may be
  // 'square' when a spot is given (the memory board). The spot is kept inside the walls, and h, if
  // missing, faces down the street. Returns false while another move is still fading.
  function enter(k, instant, at) {
    if (st.busy && !instant) return false;
    const fin = v => typeof v === 'number' && isFinite(v);
    const go = () => {
      if (at && fin(at.x) && fin(at.z)) {
        const h = fin(at.h) ? at.h : 0;
        if (k === 'square') {
          const lim = SQ.h - 2.4;
          let x = Math.min(SQ.x + lim, Math.max(SQ.x - lim, at.x)), z = Math.min(SQ.z + lim, Math.max(SQ.z - lim, at.z));
          OBST.forEach(o => { const px = x - o.x, pz = z - o.z, pd = Math.hypot(px, pz); if (pd < o.r) { const q = o.r / Math.max(pd, 1e-3); x = o.x + px * q; z = o.z + pz * q; } });
          place('square', x, z, h);
        } else if (SECT[k]) place(k, Math.min(SIDE, Math.max(-SIDE, at.x)), Math.min(SECT[k].top, Math.max(SECT[k].end, at.z)), h);
      } else if (SECT[k]) place(k, 0, SECT[k].top - 9, 0);
      else place('square', SQ.x, SQ.z + SQ.h - 5, 0);
    };
    instant ? go() : teleport(go);
    return true;
  }
  // back to the square: in front of the gate you came through, facing in (or the arrival spot from the button)
  function goSquare(from, instant) {
    const go = () => {
      const G = GATES[from];
      if (!G) { place('square', SQ.x, SQ.z + SQ.h - 5, 0); st.pitch = 0.06; return; }   // arriving: low, so the banyan's crown is in the frame
      if (G.side === 'west')  place('square', SQ.x - SQ.h + 10, SQ.z, -Math.PI / 2);
      if (G.side === 'east')  place('square', SQ.x + SQ.h - 10, SQ.z, Math.PI / 2);
      if (G.side === 'north') place('square', SQ.x, SQ.z - SQ.h + 10, Math.PI);
    };
    instant ? go() : teleport(go);
  }

  function startWalk(instant) {
    WALK.on = true;
    document.body.classList.add('walk');
    window.scrollTo(0, 0);
    goSquare(null, instant !== false);
    setURL(false);
  }
  function startTour() {
    WALK.on = false; keys.clear(); WALK.dusk = 0;
    if (SQ_MOD) SQ_MOD.leave();
    document.body.classList.remove('walk', 'in-square');
    delete document.documentElement.dataset.section;
    showFor('tour');
    square.visible = false;
    girl.rotation.y = 0;
    R.jumpToU(0);
    setURL(true);
  }
  function setURL(tour) {
    try {
      const q = new URLSearchParams(location.search);
      // (review, 2026-11-03) a ?m= share link has done its work once she is on the tour: kept, a reload
      // of the tour's address would pull the visitor out of the tour and back to that lantern
      if (tour) { q.set('tour', '1'); q.delete('m'); } else { q.delete('tour'); q.delete('year'); }
      const s = q.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
    } catch (_) { /* file:// or a sandbox: the address bar just does not follow */ }
  }

  // ── per frame ───────────────────────────────────────────────────────────────
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  const look3 = new THREE.Vector3();
  function update(dt, now) {
    const prevT = st.t;
    st.t = now / 1000;
    portalMats.forEach(m => { m.uniforms.uTime.value = st.t; });
    WALK.dusk += ((st.where === 'square' ? 1 : 0) - WALK.dusk) * (1 - Math.exp(-3 * dt));
    if (SQ_MOD) { if (st.where === 'square') SQ_MOD.update(st.t, Math.max(0, Math.min(0.1, st.t - prevT))); else SQ_MOD.leave(); }

    // input → a direction relative to the camera
    let f = 0, r = 0;
    if (!st.busy && !welcomeOpen) {
      if (keys.has('w') || keys.has('arrowup')) f += 1;
      if (keys.has('s') || keys.has('arrowdown')) f -= 1;
      if (keys.has('d') || keys.has('arrowright')) r += 1;
      if (keys.has('a') || keys.has('arrowleft')) r -= 1;
      f -= stickV.y; r += stickV.x;
    }
    const mag = Math.min(1, Math.hypot(f, r));
    const fast = keys.has('shift') || Math.hypot(stickV.x, stickV.y) > 0.92;
    const sp = (fast ? RUN : SPEED) * mag;
    let tx = 0, tz = 0;
    if (mag > 0.05) {
      const fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw), rx = Math.cos(st.yaw), rz = -Math.sin(st.yaw);
      tx = fx * f + rx * r; tz = fz * f + rz * r;
      const l = Math.hypot(tx, tz); tx = tx / l * sp; tz = tz / l * sp;
      // walking into the tree's seat, a table, the karaoke tent: slide along it instead of stopping dead,
      // and head-on, steer round it (CJ, 2026-11-03: 「按W會卡住」)
      if (st.where === 'square') OBST.forEach(o => {
        const px = st.x - o.x, pz = st.z - o.z, pd = Math.hypot(px, pz);
        if (pd > o.r + 0.9 || pd < 1e-3) return;
        const nx = px / pd, nz = pz / pd, vn = tx * nx + tz * nz;
        if (vn >= 0) return;
        const sp0 = Math.hypot(tx, tz);
        tx -= vn * nx; tz -= vn * nz;
        const tl = Math.hypot(tx, tz), side = (-nz * tx + nx * tz) >= 0 ? 1 : -1;
        if (tl < sp0 * 0.35) { tx = -nz * side * sp0; tz = nx * side * sp0; }
        else { tx *= sp0 / tl; tz *= sp0 / tl; }
      });
      const want = Math.atan2(-tx, -tz);
      st.h += angDiff(want, st.h) * (1 - Math.exp(-12 * dt));
      if (!st.moved) { st.moved = true; setTimeout(() => hint.classList.add('gone'), 4000); }
    }
    const acc = 1 - Math.exp(-10 * dt);
    st.vx += (tx - st.vx) * acc; st.vz += (tz - st.vz) * acc;
    st.x += st.vx * dt; st.z += st.vz * dt;

    // the camera drifts back behind her while she walks, unless the visitor has just looked round
    const moving = Math.hypot(st.vx, st.vz) > 0.5;
    if (moving && st.t - st.lastLook > 1.5 && Math.abs(angDiff(st.h, st.yaw)) < 1.9) st.yaw += angDiff(st.h, st.yaw) * (1 - Math.exp(-1.4 * dt));

    // walls, and the gates in them
    if (st.where === 'square') {
      const inner = SQ.h - 2.4, gx = Math.abs(st.z - SQ.z) < SQ.gate - 0.6, gz = Math.abs(st.x - SQ.x) < SQ.gate - 0.6;
      st.x = Math.min(SQ.x + (gx ? SQ.h + 1 : inner), Math.max(SQ.x - (gx ? SQ.h + 1 : inner), st.x));
      st.z = Math.min(SQ.z + inner, Math.max(SQ.z - (gz ? SQ.h + 1 : inner), st.z));
      OBST.forEach(o => {                                                          // round the tree's seat, the karaoke stand, the chess table
        const px = st.x - o.x, pz = st.z - o.z, pd = Math.hypot(px, pz);
        if (pd < o.r) { const k = o.r / Math.max(pd, 1e-3); st.x = o.x + px * k; st.z = o.z + pz * k; }
      });
      if (!st.busy) {
        if (gx && st.x < SQ.x - SQ.h + 0.2) enter('red');
        else if (gx && st.x > SQ.x + SQ.h - 0.2) enter('tower');
        else if (gz && st.z < SQ.z - SQ.h + 0.2) enter('dadao');
      }
      WALK.u = HUB_U;
    } else {
      const s = SECT[st.where];
      st.x = Math.min(SIDE, Math.max(-SIDE, st.x));
      st.z = Math.min(s.top, Math.max(s.end, st.z));
      if (!st.busy) {
        if (st.z >= s.top - 0.05 && st.vz > 0.2) goSquare(st.where);
        else if (s.next && st.z <= s.end + 0.05 && st.vz < -0.2) enter(s.next);
      }
      // the progress her spot stands for: the tour camera runs about 18 units behind her, so read the
      // street at that point, kept inside this section's own slice so its era never flips under her
      const lo = Math.max(HUB_U, R.BOUNDS[s.era] + 1e-4), hi = R.BOUNDS[s.era + 1] - 1e-4;
      WALK.u = Math.min(hi, Math.max(lo, R.uAtZ(st.z + 18)));
    }

    // her run, her place
    // the gait: 0 standing, ~0.2 walking, 1 running
    const v = Math.hypot(st.vx, st.vz);
    const gait = v < 0.25 ? 0 : v <= SPEED ? 0.06 + 0.14 * v / SPEED : 0.2 + 0.8 * Math.min(1, (v - SPEED) / (RUN - SPEED));
    const bob = R.poseGirl(gait, dt);
    girl.position.set(st.x, bob, st.z);
    girl.rotation.y = st.h;

    // the camera: on a sphere round her, kept inside the walls
    const hor = CAM_D * Math.cos(st.pitch), ver = CAM_D * Math.sin(st.pitch);
    let cx = st.x + Math.sin(st.yaw) * hor, cz = st.z + Math.cos(st.yaw) * hor;
    const cy = Math.max(0.6, CAM_LOOK_Y + ver);
    if (st.where === 'square') {
      const lim = SQ.h - 0.6;
      cx = Math.min(SQ.x + lim, Math.max(SQ.x - lim, cx)); cz = Math.min(SQ.z + lim, Math.max(SQ.z - lim, cz));
      OBST.forEach((o, i) => {                                                     // and out of the trunk, the karaoke tent, the chess table
        const r = i === 0 ? 2.2 : o.r, ox = cx - o.x, oz = cz - o.z, od = Math.hypot(ox, oz);
        if (od < r) { const k = r / Math.max(od, 1e-3); cx = o.x + ox * k; cz = o.z + oz * k; }
      });
    } else {
      const s = SECT[st.where];
      cx = Math.min(SIDE + 0.8, Math.max(-SIDE - 0.8, cx)); cz = Math.min(s.top + 0.9, Math.max(s.end - 0.9, cz));
    }
    camera.position.set(cx, cy, cz);
    // looking up (pitch below zero) lifts the aim, so the tower and the man on it come into frame
    look3.set(st.x, CAM_LOOK_Y + Math.max(0, -st.pitch) * 30, st.z);
    camera.lookAt(look3);
    let fov = FOV;
    const a = camera.aspect;
    if (a < 1) {
      const PT = R.PORTRAIT;
      const lifted = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * Math.sqrt((1 + PT.REF_ASPECT * PT.REF_ASPECT) / (1 + a * a))) * 180 / Math.PI;
      fov += (Math.min(PT.MAX_FOV, lifted) - fov) * PT.match;
    }
    if (camera.fov !== fov) { camera.fov = fov; }
    camera.updateProjectionMatrix();
    // the sun's shadow box is centred ahead of the z handed back: hand back a point just behind her
    return st.z + 30;
  }

  // ── start ───────────────────────────────────────────────────────────────────
  // ?tour=1 or ?year= (the old demo link) opens the scroll film; anything else starts in the square
  if (QS.get('tour') === '1' || QS.has('year')) { showFor('tour'); square.visible = false; }
  else { startWalk(true); if (firstVisit() && !QS.has('nowelcome')) showWelcome(); }

  window.__walk = { st, SECT, SQ, GATES, enter, goSquare, startTour, startWalk, showWelcome, closeWelcome };
})();
