// music.js — the decade music player (issue #4). Loaded after app.js and the scene files.
//
// CJ, 2026-11-03: 「不要用youtube了選適合的無版權音樂」. The page plays its own files now and nothing else:
// no YouTube player, no iframe, no network call beyond the page's own folder. Two public-domain tracks per
// decade and two for the square, all from FreePD (asset/music/CREDITS.md, chosen from their tags, length and a
// loudness / brightness measurement, since nobody here could listen), re-encoded to 96 kbps and normalised to
// about -18 LUFS so a decade change never jumps in level.
//
// The control is the audio bar CJ asked for (2026-09-24: 「左下角...變成音訊條可以拉就好」) — play / pause, the
// track, elapsed and total time, a scrub bar you can drag, the decade buttons and the sound toggle; walk.js folds
// it to one pill while walking. The scroll year (window.__fog.year) picks the decade; in the square
// (WALK.where === 'square') the square's own golden-hour pair plays. Two <audio> elements crossfade 1.5 s
// (equal power) on every change: a decade change, a button press, and the end of a track, which runs on into
// the decade's other track, so a decade's two pieces alternate for as long as you stay. Pressing the button of
// the decade already playing steps to its other track. A manual choice holds until the scroll moves into a
// decade other than the chosen one, then the scroll takes over again.
//
// Sound needs a gesture: the first click, tap or key on the page starts the music (desktop, not muted). A phone
// always starts with the sound off (Fault 4 below) and only the sound toggle, the play button, or another
// explicit "with sound" control calling setMuted(false) turns it on. Nothing is downloaded while muted and
// locked: preload is 'none' and a muted page never calls play(), so a silent phone visit costs no audio bytes.
// ambience.js shares the same switch through subscribe() — one mute state for the whole page.
//
// CJ's own bought copies can still stand in on his own machine: a git-ignored asset/music/private/ folder with a
// manifest.js (see the README there) replaces a decade's tracks with his files. Nothing here touches the 3D scene.
(function () {
  'use strict';

  // ── the tracks (asset/music/CREDITS.md has the source page, the corpus path and the licence of each) ──
  const DIR = 'asset/music/';
  const PD = 'Public domain (FreePD)';
  const T = (file, title, by, path) => ({ src: DIR + file, title, by, licence: PD, page: 'https://freepd.com/', path: 'freepd.com/' + path, credit: by });
  // scroll years: 1980s up to 1989, …, the 2010s from 2010 on, the tower chapter (2020 onward) included.
  // The square has no year: it plays its own pair (key 'square'), picked by WALK, not by the year.
  const DECADES = [
    { key: '1980s', label: '1980s', from: -Infinity, to: 1990, tracks: [   // 西門町, the mall years: bright synth and boogie
      T('80s-1-starcourt-mall.mp3', 'Soundtrack From the Starcourt Mall', 'Bryan Teoh', 'Soundtrack From the Starcourt Mall.mp3'),
      T('80s-2-downtown-boogie.mp3', 'Downtown Boogie', 'Bryan Teoh', 'Downtown Boogie.mp3'),
    ] },
    { key: '1990s', label: '1990s', from: 1990, to: 2000, tracks: [        // warm and a little wistful: light jazz, a slow piano
      T('90s-1-martini-sunset.mp3', 'Martini Sunset', 'Kevin MacLeod', 'Martini Sunset.mp3'),
      T('90s-2-nostalgic-piano.mp3', 'Nostalgic Piano', 'FreePD (composer not named in the file)', 'Nostalgic Piano.mp3'),
    ] },
    { key: '2000s', label: '2000s', from: 2000, to: 2010, tracks: [        // 大稻埕 at Lunar New Year: a Chinese-flavoured miniature, then a festive one
      T('00s-1-coy-koi.mp3', 'Coy Koi', 'Kevin MacLeod', 'Coy Koi.mp3'),
      T('00s-2-celebration.mp3', 'Celebration', 'Alexander Nakarada', 'Celebration.mp3'),
    ] },
    { key: '2010s', label: '2010s', from: 2010, to: Infinity, tracks: [    // 信義: calm, modern, lo-fi
      T('10s-1-study-and-relax.mp3', 'Study and Relax', 'Kevin MacLeod', 'Study and Relax.mp3'),
      T('10s-2-be-chillin.mp3', 'Be Chillin', 'Alexander Nakarada', 'Be Chillin.mp3'),
    ] },
    { key: 'square', label: '廣場', square: true, tracks: [               // the banyan square at golden hour: gentle, unhurried
      T('sq-1-slice-of-life.mp3', 'Slice of Life', 'Bryan Teoh', 'Slice of Life.mp3'),
      T('sq-2-kalimba-relaxation.mp3', 'Kalimba Relaxation Music', 'Kevin MacLeod', 'Kalimba Relaxation Music.mp3'),
    ] },
  ];
  const SQUARE_I = DECADES.findIndex(d => d.square);
  const PRIVATE_DIR = DIR + 'private/';   // CJ's own copies, never in the repo (asset/music/private/README.md)
  DECADES.forEach(d => { d.li = 0; d.local = d.tracks.slice(); });
  const FADE_MS = 1500, VOLUME = 0.55, LS_MUTE = 'omit.music.muted', LS_DECADE = 'omit.music.decade';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode, file:// quirks */ } },
  };
  const decadeOfYear = y => { for (let i = SQUARE_I - 1; i >= 0; i--) if (y >= DECADES[i].from) return i; return 0; };
  const decadeIndex = key => DECADES.findIndex(d => d.key === key);
  const localOf = d => DECADES[d].local[DECADES[d].li];
  function currentYear() { const f = window.__fog; const y = f && typeof f.year === 'number' ? f.year : -1; return y < 0 ? 1985 : y; }
  const inSquare = () => !!(window.WALK && window.WALK.on && window.WALK.where === 'square');
  const placeDecade = () => inSquare() ? SQUARE_I : decadeOfYear(currentYear());
  // a phone, for Fault 4: narrow, or a touch-first screen of any width. Width alone let a phone held sideways (844 px
  // wide) read as a desktop, honour a stored sound-on and start its speaker on the first swipe (review, 2026-11-03).
  const isPhone = () => !!window.matchMedia && (window.matchMedia('(max-width: 480px)').matches || window.matchMedia('(pointer: coarse)').matches);

  // ── shared state ────────────────────────────────────────────────────────────
  const mode = 'local';                 // the only path now; kept as a field for the karaoke stand and old tests
  let cur = -1;                         // decade index currently chosen for playback
  let manual = null;                    // { decade } while a button choice holds
  let gestured = false;                 // the page has had its first click, tap or key
  // Fault 4 (CJ, 2026-09-24: 「手機幫我default msuic off」): on a phone the music starts off, every visit. The first
  // tap or swipe does not arm the player; the control reads 開聲音 · Tap for sound, and one tap on it or on the play
  // button (or the karaoke stand, or an entry button that asks for sound) turns the sound on. A stored choice is
  // honoured on desktop only: a phone visit is one visit, and a page that starts a phone's speaker on the first
  // swipe is the thing this rule exists to stop. ambience.js reads this same state (subscribe below).
  let muted = isPhone() ? true : store.get(LS_MUTE) === '1';
  let lastPlaceDecade = -1;
  let privateOn = false;                // asset/music/private/ replaced some tracks

  // one switch for the whole page: ambience.js subscribes, and hears { muted, unlocked } now and on every change
  const subs = [];
  let lastSent = '';
  function emit() {
    const s = { muted, unlocked }, k = muted + '|' + unlocked;
    if (k === lastSent) return; lastSent = k;
    subs.slice().forEach(fn => { try { fn(s); } catch (e) { /* a listener's fault stays its own */ } });
  }
  function subscribe(fn) { if (typeof fn !== 'function') return () => { }; subs.push(fn); try { fn({ muted, unlocked }); } catch (e) { /* as above */ } return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; }

  // ── the control ─────────────────────────────────────────────────────────────
  const el = {
    root: document.getElementById('music'), toggle: document.getElementById('musMute'), decade: document.getElementById('musDecade'),
    track: document.getElementById('musTrack'), status: document.getElementById('musStatus'),
    buttons: Array.from(document.querySelectorAll('#music [data-decade]')),
    play: document.getElementById('musPlay'), scrub: document.getElementById('musScrub'), fill: document.getElementById('musFill'), knob: document.getElementById('musKnob'),
    now: document.getElementById('musNow'), dur: document.getElementById('musDur'),
  };
  let userPaused = false;               // the visitor pressed pause: a decade change loads the next track but does not start it

  // ── two <audio> elements, crossfading ───────────────────────────────────────
  const players = [0, 1].map(() => { const a = document.createElement('audio'); a.preload = 'none'; a.volume = 0; a.setAttribute('aria-hidden', 'true'); a.hidden = true; document.body.appendChild(a); return a; });   // in the DOM, so a test can mute them from outside
  let active = 0, unlocked = false, fade = null;
  players.forEach(p => {
    p.muted = muted;
    p.addEventListener('error', () => { /* a missing file only means silence */ });
    // a track that ends runs on into the decade's other one (the render loop normally starts that crossfade a
    // little before the end; in a background tab, where requestAnimationFrame sleeps, this catches it)
    p.addEventListener('ended', () => { if (p === players[active] && !userPaused && !loopsItself(cur)) nextLocal(cur, true); });
  });
  const loopsItself = d => { const t = localOf(d); return DECADES[d].local.length < 2 || !!(t.start || t.end); };

  function load(p, d) {
    const t = localOf(d), id = DECADES[d].key + '|' + DECADES[d].li + '|' + t.src;
    if (p.dataset.track !== id) { p.dataset.track = id; p.src = t.src; p.loop = DECADES[d].local.length < 2 && !(t.start || t.end); p.preload = 'auto'; p.load(); }
  }
  // every start of a track begins at its chorus when it has one (CJ's private copies), else at the top
  function cue(p, d) { const t = localOf(d); const at = t.start || 0; try { p.currentTime = at; } catch (e) { p.addEventListener('loadedmetadata', () => { p.currentTime = at; }, { once: true }); } }
  // a chorus loop (private copies only): at end, or the natural end, go back to start instead of playing on
  function keepInChorus(p) {
    const key = (p.dataset.track || '').split('|')[0], d = decadeIndex(key); if (d < 0 || p.paused) return;
    const t = localOf(d); if (!t.start && !t.end) return;
    if ((t.end && p.currentTime >= t.end) || (p.ended)) { p.currentTime = t.start || 0; if (p.ended) tryPlay(p); }
  }
  function tryPlay(p) { const r = p.play(); if (r && r.catch) r.catch(() => { }); }
  // switch the audio to decade d (its current entry), crossfading from whatever plays now
  function localGo(d, instant) {
    const from = players[active], to = players[1 - active];
    if (!unlocked) return;              // nothing plays yet: unlock() loads the right one
    load(to, d);
    cue(to, d); if (!userPaused) tryPlay(to);
    active = 1 - active;
    if (instant || userPaused) { to.volume = VOLUME; from.volume = 0; from.pause(); fade = null; }
    else fade = { from, to, t0: performance.now() };
  }
  function stepFade() {
    if (!fade) return;
    const k = Math.max(0, Math.min(1, (performance.now() - fade.t0) / FADE_MS));
    fade.to.volume = VOLUME * Math.sin(k * Math.PI / 2);          // equal-power
    fade.from.volume = VOLUME * Math.cos(k * Math.PI / 2);
    if (k >= 1) { fade.from.pause(); fade.from.volume = 0; fade = null; }
  }
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    const d = cur >= 0 ? cur : placeDecade();
    const p = players[active]; load(p, d); cue(p, d);
    p.volume = VOLUME;
    if (!userPaused) {
      const r = p.play();
      // the browser refused (no gesture yet): stay locked. Only a refusal counts: a pause() right after this play()
      // rejects it with an AbortError, and that is the visitor's pause, not a lock (review, 2026-11-03)
      if (r && r.catch) r.catch(e => { if (e && e.name === 'AbortError') return; unlocked = false; p.volume = 0; render(); emit(); });
    }
    const o = players[1 - active];
    if (o.getAttribute('src')) { tryPlay(o); o.pause(); o.volume = 0; }           // prime the other element inside the gesture (iOS)
    render(); emit();
  }

  // ── the gesture gate ────────────────────────────────────────────────────────
  let justGestured = false;             // true for a moment after the first gesture, so the click that started sound does not also stop it
  function gesture() {
    if (gestured) return;
    gestured = true; justGestured = true; setTimeout(() => { justGestured = false; }, 500);
    if (!muted) unlock();               // a muted page (every phone, and a desktop that chose silence) stays silent and downloads nothing
    render();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, gesture, { passive: true, capture: true }));

  // ── actions ─────────────────────────────────────────────────────────────────
  function goTo(d, instant) {
    if (d === cur) return;
    cur = d;
    localGo(d, instant);
    render();
  }
  // a decade button: switch to that decade and hold it; pressed again on the decade already playing, step to its other track
  function setDecade(key) {
    const d = typeof key === 'number' ? key : decadeIndex(String(key));
    if (d < 0) return false;
    if (d === cur) { nextLocal(d); return true; }
    manual = { decade: d };
    store.set(LS_DECADE, DECADES[d].key);
    goTo(d, false);
    return true;
  }
  function nextLocal(d, instant) {
    if (d === undefined) d = cur;
    const D = DECADES[d]; if (!D || D.local.length < 2) return;
    D.li = (D.li + 1) % D.local.length;
    if (d === cur) localGo(d, !!instant);
    render();
  }
  const next = () => nextLocal(cur);
  // the toggle: sound on / off. Sound on also starts the music if it has not started yet: setMuted(false) is
  // only ever called from a press (the toggle, the play button, the karaoke stand, an entry button), which is
  // the gesture the browser wants.
  function setMuted(m) {
    muted = !!m; store.set(LS_MUTE, muted ? '1' : '0');
    players.forEach(p => { p.muted = muted; });
    if (!muted && !unlocked) { gestured = true; unlock(); }
    render(); emit();
  }
  function toggle() {
    if (!unlocked) { if (muted) setMuted(false); else unlock(); }   // Click for sound means sound: a phone starts muted (fault 4), and this press must not leave it silent
    else setMuted(!muted);
  }
  window.addEventListener('keydown', ev => { if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return; if ((ev.key === 'm' || ev.key === 'M') && !ev.repeat && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !justGestured) toggle(); });
  if (el.toggle) el.toggle.addEventListener('click', ev => { ev.stopPropagation(); if (justGestured && unlocked) { justGestured = false; return; } justGestured = false; toggle(); });
  el.buttons.forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); setDecade(b.dataset.decade); }));

  // ── the bar: play / pause, the clock, the scrubber ─────────────────────────
  // A 250 ms timer reads the active <audio>'s currentTime / duration (the render loop stays untouched); while a
  // drag is on, the bar shows the finger's position instead and seeks on release.
  const TICK_MS = 250, STEP_S = 5;
  let dragging = false, dragFrac = 0, lastNow = '', lastDur = '';
  function clock() { const p = players[active]; const d = isFinite(p.duration) ? p.duration : 0; return { t: p.currentTime || 0, d }; }
  const isPlaying = () => unlocked && !players[active].paused;
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function seek(t) { const p = players[active]; try { p.currentTime = t; } catch (e) { /* no metadata yet */ } }
  function playPause() {
    if (!unlocked) { userPaused = false; if (muted) setMuted(false); else unlock(); return; }   // play on a muted phone means sound on
    const p = players[active];
    if (p.paused) { userPaused = false; if (muted) setMuted(false); if (p.ended) cue(p, cur); tryPlay(p); } else { userPaused = true; p.pause(); }
    render();
  }
  function tick() {
    const c = clock(), frac = dragging ? dragFrac : c.d > 0 ? Math.min(1, c.t / c.d) : 0;
    const now = fmt(dragging ? dragFrac * c.d : c.t), dur = fmt(c.d);
    if (el.now && now !== lastNow) { el.now.textContent = now; lastNow = now; }
    if (el.dur && dur !== lastDur) { el.dur.textContent = dur; lastDur = dur; }
    const pct = (frac * 100).toFixed(2) + '%';
    if (el.fill) el.fill.style.width = pct;
    if (el.knob) el.knob.style.left = pct;
    if (el.scrub) el.scrub.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
    if (el.root) el.root.classList.toggle('playing', isPlaying());
  }
  setInterval(tick, TICK_MS);
  if (el.play) el.play.addEventListener('click', ev => { ev.stopPropagation(); if (justGestured && unlocked) { justGestured = false; return; } justGestured = false; playPause(); });   // the click that woke the page already started it
  if (el.scrub) {
    const fracOf = ev => { const r = el.scrub.getBoundingClientRect(); return r.width > 0 ? Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) : 0; };
    el.scrub.addEventListener('pointerdown', ev => {
      if (ev.button !== undefined && ev.button !== 0) return;
      dragging = true; dragFrac = fracOf(ev); el.root.classList.add('scrubbing');
      try { el.scrub.setPointerCapture(ev.pointerId); } catch (e) { /* no capture, the move still lands here */ }
      ev.preventDefault(); tick();
    });
    el.scrub.addEventListener('pointermove', ev => { if (!dragging) return; dragFrac = fracOf(ev); tick(); });
    const release = ev => {
      if (!dragging) return;
      dragging = false; el.root.classList.remove('scrubbing');
      if (ev.type !== 'pointercancel') { dragFrac = fracOf(ev); const c = clock(); if (c.d > 0) seek(dragFrac * c.d); }
      tick();
    };
    el.scrub.addEventListener('pointerup', release); el.scrub.addEventListener('pointercancel', release);
    el.scrub.addEventListener('keydown', ev => {
      const c = clock(); if (c.d <= 0) return;
      const k = ev.key; let t = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') t = c.t - STEP_S; else if (k === 'ArrowRight' || k === 'ArrowUp') t = c.t + STEP_S; else if (k === 'Home') t = 0; else if (k === 'End') t = c.d - 1;
      else if (k === ' ' || k === 'Enter') { ev.preventDefault(); playPause(); return; }
      if (t === null) return;
      ev.preventDefault(); ev.stopPropagation(); seek(Math.max(0, Math.min(c.d, t))); tick();
    });
  }

  function render() {
    const di = cur >= 0 ? cur : placeDecade(), d = DECADES[di], t = localOf(di);
    const n = d.local.length, i = d.li;
    if (el.decade) el.decade.textContent = d.label + (n > 1 ? ' · ' + (i + 1) + '/' + n : '');
    if (el.track) el.track.textContent = t.title + ' · ' + t.credit;   // textContent: a private manifest's titles never reach the page as markup
    if (el.status) el.status.textContent = privateOn ? 'your songs' : 'public domain';
    if (el.toggle) {
      el.toggle.textContent = !unlocked ? (isPhone() ? '開聲音 · Tap for sound' : '開聲音 · Click for sound') : muted ? 'Sound off' : 'Sound on';
      el.toggle.setAttribute('aria-pressed', unlocked && !muted ? 'true' : 'false');
    }
    el.buttons.forEach(b => { const on = b.dataset.decade === d.key; b.classList.toggle('on', on); b.title = on && n > 1 ? 'Next song' : ''; });
    if (el.play) { const on = isPlaying(); el.play.setAttribute('aria-pressed', on ? 'true' : 'false'); el.play.setAttribute('aria-label', on ? 'Pause' : 'Play'); }
    if (el.root) { el.root.dataset.mode = mode; el.root.classList.toggle('muted', muted); el.root.classList.toggle('playing', isPlaying()); el.root.classList.toggle('locked', !unlocked); }
  }

  // ── per-frame: follow the scroll year, or the square ────────────────────────
  function frame() {
    const sd = placeDecade();
    // a manual choice holds until the place enters a decade other than the chosen one; then the place takes over
    if (manual && lastPlaceDecade >= 0 && sd !== lastPlaceDecade && sd !== manual.decade) { manual = null; store.set(LS_DECADE, null); }
    const want = manual ? manual.decade : sd;
    if (want !== cur) goTo(want, cur < 0);
    lastPlaceDecade = sd;
    stepFade(); players.forEach(keepInChorus);
    const p = players[active];
    // a track near its end crossfades into the decade's other track, so the two run on without a gap
    if (unlocked && !fade && !userPaused && !p.paused && !loopsItself(cur) && isFinite(p.duration) && p.duration > 4 && p.duration - p.currentTime < FADE_MS / 1000) nextLocal(cur);
    requestAnimationFrame(frame);
  }
  const storedDecade = store.get(LS_DECADE);                      // a stored manual choice holds the same way a fresh one does
  if (storedDecade && decadeIndex(storedDecade) >= 0) manual = { decade: decadeIndex(storedDecade) };
  cur = manual ? manual.decade : placeDecade();
  render();
  requestAnimationFrame(frame);

  // ── private drop-in ─────────────────────────────────────────────────────────
  // asset/music/private/manifest.js sets window.__musicPrivate = [{ decade, file, title, artist, year }, …]
  // (the same decade repeated = that decade's list, in order; .m4a and .mp3). A script tag works from
  // file://, fetch does not. The folder is git-ignored, so the public page never has it; when it is
  // there, the entries replace that decade's public-domain tracks on this machine only.
  function applyPrivate(list) {
    if (!Array.isArray(list)) return;
    const lists = {};
    list.forEach(e => { if (e && e.decade && typeof e.file === 'string' && /\.(m4a|mp3)$/i.test(e.file)) (lists[e.decade] = lists[e.decade] || []).push(e); });
    let n = 0;
    Object.keys(lists).forEach(k => {
      const d = decadeIndex(k); if (d < 0) return;
      DECADES[d].local = lists[k].map(e => ({ src: PRIVATE_DIR + e.file, title: String(e.title || e.file), credit: [e.artist, e.year].filter(Boolean).join(' · ') || 'your copy',
                                             start: +e.start > 0 ? +e.start : 0, end: +e.end > 0 ? +e.end : 0 }));   // start / end in seconds: the chorus loop
      DECADES[d].li = 0; n++;
    });
    if (!n) return;
    privateOn = true;
    players.forEach(p => {                                            // a player already holding a replaced track reloads from the new file
      const key = (p.dataset.track || '').split('|')[0], d = decadeIndex(key); if (d < 0 || !lists[key]) return;
      const wasActive = p === players[active], vol = p.volume;
      p.dataset.track = ''; load(p, d);
      if (unlocked && wasActive && cur === d) { p.volume = vol; tryPlay(p); } else p.volume = 0;
    });
    render();
  }
  function loadPrivate() {
    if (window.__musicPrivate) { applyPrivate(window.__musicPrivate); return; }
    if (location.protocol !== 'file:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;   // only on CJ's own machine: the public page never asks for a file that is never there
    const s = document.createElement('script'); s.src = PRIVATE_DIR + 'manifest.js'; s.async = true;
    s.onload = () => applyPrivate(window.__musicPrivate);              // absent: the public-domain tracks stay
    s.onerror = () => s.remove();
    document.head.appendChild(s);
  }
  loadPrivate();

  // ── the credits, for the credits panel (photos.js) ──────────────────────────
  const credits = DECADES.map(d => ({ decade: d.key, label: d.label, tracks: d.tracks.map(t => ({ title: t.title, by: t.by, licence: t.licence, page: t.page, path: t.path })) }));

  // ── probe ───────────────────────────────────────────────────────────────────
  window.__music = {
    get mode() { return mode; }, get decade() { return DECADES[cur].key; },
    get track() { return localOf(cur).title; }, get src() { return localOf(cur).src; },
    get private() { return privateOn; }, get localCount() { return DECADES[cur].local.length; }, get localIndex() { return DECADES[cur].li; }, get chorus() { const t = localOf(cur); return [t.start || 0, t.end || 0]; },
    // live, not the last frame's: the karaoke stand asks right after setMuted(false) has started the music, and a
    // stale false made it call playPause() and pause what it had just started (review, 2026-11-03)
    get playing() { const p = players[active]; return unlocked && !p.paused && !p.ended; }, get muted() { return muted; }, get gestured() { return gestured; }, get fresh() { return justGestured; }, get unlocked() { return unlocked; },
    get manual() { return manual ? DECADES[manual.decade].key : null; }, get placeDecade() { return DECADES[lastPlaceDecade < 0 ? 0 : lastPlaceDecade].key; },
    get fading() { return !!fade; }, get volumes() { return players.map(p => +p.volume.toFixed(2)); },
    get state() { return players.map(p => ({ src: (p.getAttribute('src') || '').split('/').pop(), paused: p.paused, ready: p.readyState, err: p.error && p.error.code, t: +p.currentTime.toFixed(1), dur: +(p.duration || 0).toFixed(0), muted: p.muted })); },
    get position() { return +clock().t.toFixed(2); }, get duration() { return +clock().d.toFixed(2); }, get paused() { return userPaused; },
    get bar() { return { now: el.now && el.now.textContent, dur: el.dur && el.dur.textContent, fill: el.fill && el.fill.style.width, playing: isPlaying() }; },
    setDecade, next, nextLocal, toggle, setMuted, seek, playPause, subscribe, credits, DECADES,
  };
})();
