// ambience.js — the sounds of the place, under the music (item #8, 2026-11-03). Loaded right after music.js.
//
// The research (research/similar-works/README.md §3.7, item 8) found the page silent apart from its music, and
// CJ's own rule since 2026-11-03 is that nothing comes from YouTube any more: so the square should still "sound
// like a temple forecourt" with the music off. One AudioContext; every source has its own GainNode (and a
// StereoPannerNode where it has a place), all into one master that follows the music's mute.
//
//   the square  cicadas in the banyan, chess pieces on the board, tea cups, the shrine's 磬 now and then, the
//               sausage cart's sizzle, pigeons, the karaoke stand's tune leaking out of its little speaker (only
//               while the music player is not playing: when it plays, the music *is* the karaoke), and a distant
//               murmur of the street beyond the arcades
//   西門町      a crowd bed (cinema queue, shopping street)
//   大稻埕      a New Year market bed, and strings of firecrackers going off somewhere a few streets away
//   信義        a city crowd bed, and the metro: a low rumble passing under, a two-note door chime
//   (both)      西門町 and 信義 now and then: the garbage truck's 給愛麗絲 a block away, the plan's easter egg
//   her steps   red brick, the terrazzo circle round the tree and the arcades' terrazzo, asphalt on the road,
//               timed to poseGirl's stride (RIG.gait), harder and quicker when she runs
//
// Placed sounds fade with distance the way folio-2025's Audio.js does it (remapClamp): 1 inside `near`, 0 past
// `far`, linear between; below 1 % a one-shot is not fired at all. Every one-shot gets a 0.9–1.1 rate (or pitch)
// jitter so no two chess clacks are the same. The page going to the background fades everything out and
// suspends the context; coming back fades it in.
//
// The mute is the music's, not a copy (music.js subscribe()): sound is on only when the music player is unmuted
// and unlocked. So a phone starts silent (Fault 4) and only a "with sound" press turns this on too, and the
// AudioContext is not even created — nothing is downloaded — until that press. The three street beds and the
// firecracker are CC0 recordings cut by asset/ambience/gen/make-beds.py (asset/music/CREDITS.md lists them,
// 455 KB in all); everything else is synthesised here from noise and oscillators.
(function () {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  const M = window.__music;
  if (!AC || !M || typeof M.subscribe !== 'function') return;

  const DIR = 'asset/ambience/';
  const MASTER = 0.7;                   // the whole layer, under the music's 0.55 <audio> volume
  const DUCK = 0.8;                     // while the music plays, the place steps back a little
  const rnd = (a, b) => a + Math.random() * (b - a);
  const jit = () => rnd(0.9, 1.1);      // the per-play rate / pitch jitter
  const remapClamp = (d, near, far) => d <= near ? 1 : d >= far ? 0 : 1 - (d - near) / (far - near);
  const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let ctx = null, master = null, vis = null, duckG = null, noise = null, crackle = null;
  let wanted = false;                   // the music says: not muted, and unlocked by a gesture
  let built = false, suspendTimer = 0;
  const beds = {};                      // key → { gain, src, buf }
  const S = {};                         // the square's sources
  let step = null;                      // footsteps
  let fire = null, metro = null, truck = null;   // the sections' events
  let bleed = null;                     // the karaoke tune

  // ── the switch ──────────────────────────────────────────────────────────────
  M.subscribe(s => {
    const was = wanted;
    wanted = !s.muted && !!s.unlocked;
    if (wanted && !ctx) create();       // inside the press that turned sound on: the browser lets a context start here
    if (!ctx) return;
    if (wanted) { clearTimeout(suspendTimer); if (!document.hidden) resume(); ramp(master.gain, MASTER, 0.25); if (!was) iosHint(); }
    else { ramp(master.gain, 0, 0.15); suspendLater(); }
  });
  // some browsers only grant a context on click / touchend rather than the pointerdown that unlocked the music
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, () => { if (wanted && ctx && ctx.state !== 'running' && !document.hidden) resume(); }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { ramp(vis.gain, 0, 0.12); suspendLater(); }
    else if (wanted) { clearTimeout(suspendTimer); resume(); ramp(vis.gain, 1, 0.3); }
  });
  function resume() { if (ctx.state !== 'running') { const r = ctx.resume(); if (r && r.catch) r.catch(() => { }); } }
  function suspendLater() { clearTimeout(suspendTimer); suspendTimer = setTimeout(() => { if (ctx && (!wanted || document.hidden) && ctx.state === 'running') ctx.suspend().catch(() => { }); }, 800); }
  const ramp = (param, v, tc) => { const t = ctx.currentTime; param.cancelScheduledValues(t); param.setTargetAtTime(v, t, tc); param._aim = undefined; };
  // the per-frame steering: a new setTargetAtTime only when the target really moves. Scheduling one per param per
  // frame (some twenty params, 60 times a second) piles events onto every param's automation timeline, and how
  // soon a browser prunes the old ones varies; on a phone that is audio-thread work for nothing. While nothing
  // moves, nothing is scheduled (review, 2026-11-03)
  const aim = (param, v, tc) => { if (param._aim !== undefined && Math.abs(param._aim - v) < 0.002) return; param._aim = v; param.setTargetAtTime(v, ctx.currentTime, tc); };

  // iOS mutes Web Audio with the ringer switch unless the page says it is playback (Safari 16.4+); where it cannot
  // say so, tell the visitor once why the music plays and the street does not
  function iosHint() {
    if (!IOS || navigator.audioSession || iosHint.done) return;
    iosHint.done = true;
    const n = document.createElement('div');
    n.className = 'amb-hint'; n.setAttribute('role', 'status');
    n.textContent = '靜音模式下聽不到街上的聲音 · With the ringer switch on silent, the street sounds stay quiet';
    document.body.appendChild(n);
    setTimeout(() => { n.classList.add('gone'); setTimeout(() => n.remove(), 600); }, 6000);
  }

  // ── build ───────────────────────────────────────────────────────────────────
  function create() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ }
    try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { try { ctx = new AC(); } catch (e2) { ctx = null; return; } }
    master = ctx.createGain(); master.gain.value = 0;
    vis = ctx.createGain(); vis.gain.value = document.hidden ? 0 : 1;
    duckG = ctx.createGain(); duckG.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();               // a soft ceiling, so a firecracker string never clips a phone speaker
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    duckG.connect(master); master.connect(vis); vis.connect(comp); comp.connect(ctx.destination);
    noise = makeNoise(2, 'white'); crackle = makeCrackle(4);
    buildSquare(); buildSteps(); buildSections();
    ['ximen', 'dadao', 'xinyi'].forEach(k => loadBed(k));
    loadBuffer(DIR + 'crack.mp3').then(b => { if (fire) fire.buf = b; }).catch(() => { });
    built = true;
    resume();
    requestAnimationFrame(frame);
  }
  function makeNoise(sec, kind) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  // fat in a pan: a low hiss with sparse pops of different sizes
  function makeCrackle(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.12;
    for (let k = 0; k < sec * 70; k++) {
      const at = Math.floor(Math.random() * (n - 800)), len = 40 + Math.floor(Math.random() * 500), a = 0.2 + Math.random() * 0.8;
      for (let j = 0; j < len; j++) d[at + j] += (Math.random() * 2 - 1) * a * Math.exp(-j / (len / 4));
    }
    return b;
  }
  function loadBuffer(url) {
    return fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(a => new Promise((ok, no) => { const p = ctx.decodeAudioData(a, ok, no); if (p && p.catch) p.catch(no); }));
  }
  function loadBed(key) {
    const g = ctx.createGain(); g.gain.value = 0; g.connect(duckG);
    beds[key] = { gain: g, src: null, level: 0 };
    loadBuffer(DIR + 'bed-' + key + '.mp3').then(buf => {
      const b = beds[key]; b.buf = buf;
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      // the file's loop seam is crossfaded at the cut; MP3 adds a few ms of padding at both ends, so skip it
      s.loopStart = 0.06; s.loopEnd = Math.max(0.2, buf.duration - 0.06);
      s.connect(g); s.start(ctx.currentTime + 0.05, 0.06 + Math.random() * (buf.duration - 0.2));
      b.src = s;
      if (key === 'ximen' && S.murmur) {                            // the street beyond the arcades, heard from the square
        const m = ctx.createBufferSource(); m.buffer = buf; m.loop = true; m.loopStart = s.loopStart; m.loopEnd = s.loopEnd; m.playbackRate.value = 0.94;
        m.connect(S.murmur.in); m.start(ctx.currentTime + 0.05, Math.random() * (buf.duration - 0.2));
      }
    }).catch(() => { /* file:// or offline: the synthesised sounds still play */ });
  }
  // a placed source: in → gain (distance) → pan → the mix
  function placed(at, near, far, level) {
    const gain = ctx.createGain(); gain.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { gain.connect(pan); pan.connect(duckG); } else gain.connect(duckG);
    return { at, near, far, level, gain, pan, in: gain, k: 0 };
  }

  // ── the square ──────────────────────────────────────────────────────────────
  function buildSquare() {
    const SQ = window.SQUARE && window.SQUARE.sources;
    if (!SQ) return;
    // cicadas: two choruses of band-passed noise, each pulsed by its own fast tremolo, swelling and dropping
    S.cicada = placed(SQ.tree, 7, 46, 0.28);
    S.cicada.layers = [[4700, 41], [6300, 57]].map(([f, am]) => {
      const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; src.playbackRate.value = jit();
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 7;
      const trem = ctx.createGain(); trem.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.frequency.value = am * jit();
      const depth = ctx.createGain(); depth.gain.value = 0.5; lfo.connect(depth); depth.connect(trem.gain);
      const swell = ctx.createGain(); swell.gain.value = 0.6;
      src.connect(bp); bp.connect(trem); trem.connect(swell); swell.connect(S.cicada.in);
      src.start(); lfo.start();
      return { swell, next: 0 };
    });
    S.chess = placed(SQ.chess, 1.6, 15, 0.55); S.chess.next = rnd(1, 4);
    S.tea = placed(SQ.tea, 1.6, 13, 0.4); S.tea.next = rnd(2, 8);
    S.bell = placed(SQ.shrine, 3, 34, 0.32); S.bell.next = rnd(6, 16);
    S.pigeon = placed(SQ.pigeons[0] || SQ.tree, 1.2, 11, 0.45); S.pigeon.next = rnd(2, 6); S.pigeon.homes = SQ.pigeons;
    // the sausage cart: the crackle looped, a little brighter as you lean in
    S.sizzle = placed(SQ.cart, 1.4, 13, 0.3);
    { const src = ctx.createBufferSource(); src.buffer = crackle; src.loop = true; src.playbackRate.value = jit();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      src.connect(hp); hp.connect(S.sizzle.in); src.start(); }
    // the street beyond the arcades: the 西門町 bed again, dull and low, from all round (no position)
    S.murmur = { gain: ctx.createGain(), in: null };
    { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      S.murmur.gain.gain.value = 0; lp.connect(S.murmur.gain); S.murmur.gain.connect(duckG); S.murmur.in = lp; }
    // the karaoke stand's little speaker: a slow pentatonic tune, bandlimited like a cheap cone
    bleed = placed(SQ.karaoke, 2.2, 22, 0.3);
    { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
      bp.connect(bleed.in); bleed.bus = bp; bleed.t = 0; bleed.i = 0; bleed.on = 0; }
  }
  // 磬 / temple bell: inharmonic partials, long decay
  function ring(dst, base, a) {
    const t = ctx.currentTime;
    [[1, 1, 5.5], [2.76, 0.5, 3.2], [5.4, 0.28, 1.8], [8.93, 0.14, 0.9]].forEach(([r, g, d]) => {
      const o = ctx.createOscillator(); o.frequency.value = base * r;
      const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(a * g, t + 0.006); e.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(e); e.connect(dst); o.start(t); o.stop(t + d + 0.05);
    });
  }
  // a short filtered burst of noise: the body of every clack, step and scuff
  function burst(dst, { type = 'bandpass', f = 1000, q = 1, dur = 0.05, a = 0.5, rate = 1, at = 0, attack = 0.002 }) {
    const t = ctx.currentTime + at;
    const s = ctx.createBufferSource(); s.buffer = noise; s.playbackRate.value = rate;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(a, t + attack); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(e); e.connect(dst); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  function tone(dst, { f, type = 'sine', dur = 0.1, a = 0.3, at = 0, glide = 0, attack = 0.003 }) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(f * glide, t + dur);
    const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(a, t + attack); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(e); e.connect(dst); o.start(t); o.stop(t + dur + 0.05);
  }
  function chessClack(dst) {
    const j = jit();
    burst(dst, { f: 2100 * j, q: 3, dur: 0.045, a: 0.9 }); tone(dst, { f: 820 * j, dur: 0.06, a: 0.35 });
    if (Math.random() < 0.35) { burst(dst, { f: 2300 * j, q: 3, dur: 0.04, a: 0.6, at: 0.16 }); tone(dst, { f: 860 * j, dur: 0.05, a: 0.25, at: 0.16 }); }   // a slide and a second tap
  }
  function teaClink(dst) {
    const j = jit(), n = Math.random() < 0.4 ? 2 : 1;
    for (let k = 0; k < n; k++) [[2950, 0.25, 0.35], [4420, 0.15, 0.22], [6170, 0.08, 0.14]].forEach(([f, a, d]) => tone(dst, { f: f * j * (k ? 1.04 : 1), dur: d, a, at: k * 0.11 }));
  }
  // a pigeon's coo: three soft hoots, the middle one higher and longer, with the throat's flutter
  function coo(dst) {
    const j = jit(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(dst);
    const flutter = ctx.createGain(); flutter.gain.value = 0.7; flutter.connect(lp);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 26; const dpt = ctx.createGain(); dpt.gain.value = 0.3; lfo.connect(dpt); dpt.connect(flutter.gain);
    const t = ctx.currentTime; lfo.start(t); lfo.stop(t + 1.6);
    [[0, 330, 0.22, 1.08], [0.32, 395, 0.5, 0.9], [0.95, 320, 0.25, 0.94]].forEach(([at, f, d, g]) => tone(flutter, { f: f * j, type: 'triangle', dur: d, a: 0.5, at, glide: g, attack: 0.05 }));
  }

  // ── footsteps ───────────────────────────────────────────────────────────────
  function buildSteps() { step = { gain: ctx.createGain(), k: null, n: 0, last: '' }; step.gain.gain.value = 0.42; step.gain.connect(duckG); }
  function footstep(surface, run) {
    step.n++; step.last = surface;
    const dst = step.gain, j = jit(), a = (0.55 + 0.35 * run) * rnd(0.8, 1);
    if (surface === 'brick') { burst(dst, { type: 'lowpass', f: 900 * j, q: 0.7, dur: 0.07 - 0.015 * run, a }); tone(dst, { f: 95 * j, dur: 0.05, a: a * 0.5 }); burst(dst, { f: 1500 * j, q: 1.2, dur: 0.03, a: a * 0.35, at: 0.012 }); }
    else if (surface === 'terrazzo') { burst(dst, { f: 3200 * j, q: 2.2, dur: 0.035, a: a * 0.8 }); tone(dst, { f: 2100 * j, dur: 0.018, a: a * 0.25 }); burst(dst, { type: 'lowpass', f: 600, dur: 0.04, a: a * 0.4 }); }
    else { burst(dst, { f: 1700 * j, q: 0.6, dur: 0.09 - 0.02 * run, a: a * 0.7, attack: 0.006 }); burst(dst, { type: 'highpass', f: 3500 * j, dur: 0.06, a: a * 0.18, at: 0.02 }); }   // asphalt: grit and a scuff
  }
  function surfaceAt(where, p) {
    const SQ = window.SQUARE && window.SQUARE.sources;
    if (where === 'square') return SQ && Math.hypot(p.x - SQ.tree.x, p.z - SQ.tree.z) < SQ.terrazzo ? 'terrazzo' : 'brick';
    if (Math.abs(p.x) < 6) return 'asphalt';                               // the road (data.js GRID.roadWidth 12)
    return where === 'dadao' ? 'brick' : 'terrazzo';                        // 迪化街's brick arcades; the others' terrazzo 騎樓
  }

  // ── the sections' events ────────────────────────────────────────────────────
  function buildSections() {
    fire = { gain: ctx.createGain(), buf: null, next: rnd(4, 10) };
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;   // a few streets away
    fire.gain.gain.value = 0.32; fire.gain.connect(lp); lp.connect(duckG);
    metro = { gain: ctx.createGain(), next: rnd(8, 20) }; metro.gain.gain.value = 0.5; metro.gain.connect(duckG);
    metro.brown = makeNoise(4, 'brown');
    truck = { gain: ctx.createGain(), next: rnd(25, 60), n: 0 }; truck.gain.gain.value = 0; truck.gain.connect(duckG);
  }
  // the easter egg the plan suggests (item #8: 「全台都認得的垃圾車音樂可以當彩蛋」): somewhere down the street the
  // garbage truck goes by playing 給愛麗絲 through its horn speaker, Beethoven's Für Elise (1810, public domain),
  // synthesised here: the opening phrase twice, swelling in and dying away as it passes a block off
  const ELISE = [[76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 2], [0, 1], [60, 1], [64, 1], [69, 1], [71, 2], [0, 1], [64, 1], [68, 1], [71, 1], [72, 2], [0, 2]];
  function garbageTruck() {
    const t0 = ctx.currentTime + 0.05, beat = 0.19, bars = 2;
    const len = ELISE.reduce((a, n) => a + n[1], 0) * beat * bars, pan = rnd(-0.6, 0.6);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.9;   // a tinny horn speaker
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;                        // and a block of air between
    const env = ctx.createGain(); env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(1, t0 + len * 0.45); env.gain.linearRampToValueAtTime(0, t0 + len);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    bp.connect(lp); lp.connect(env);
    if (p) { p.pan.setValueAtTime(pan, t0); p.pan.linearRampToValueAtTime(-pan * 0.5, t0 + len); env.connect(p); p.connect(truck.gain); } else env.connect(truck.gain);
    let at = 0;
    for (let r = 0; r < bars; r++) ELISE.forEach(([m, d]) => {
      if (m) tone(bp, { f: 440 * Math.pow(2, (m - 69) / 12), type: 'square', dur: d * beat * 0.95, a: 0.16, at: t0 - ctx.currentTime + at, attack: 0.01 });
      at += d * beat;
    });
    truck.gain.gain.setValueAtTime(0.12, t0);   // about the crowd bed's level: heard, never on top of it
    truck.n++;
  }
  function firecrackers() {
    if (!fire.buf) return;
    const n = Math.floor(rnd(14, 46)), t0 = ctx.currentTime + 0.02;
    let t = t0;
    for (let i = 0; i < n; i++) {
      const s = ctx.createBufferSource(); s.buffer = fire.buf; s.playbackRate.value = rnd(0.85, 1.2);
      const g = ctx.createGain(); g.gain.value = rnd(0.25, 0.8) * (i < 3 ? 0.6 : 1);
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (p) { p.pan.value = Math.max(-1, Math.min(1, fire.pan + rnd(-0.08, 0.08))); s.connect(g); g.connect(p); p.connect(fire.gain); } else { s.connect(g); g.connect(fire.gain); }
      s.start(t); t += rnd(0.04, 0.12);
    }
  }
  function metroPass() {
    const t = ctx.currentTime, d = rnd(7, 10);
    const s = ctx.createBufferSource(); s.buffer = metro.brown; s.loop = true; s.playbackRate.value = jit();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
    const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.9, t + d * 0.45); e.gain.linearRampToValueAtTime(0, t + d);
    s.connect(lp); lp.connect(e); e.connect(metro.gain); s.start(t); s.stop(t + d + 0.1);
    if (Math.random() < 0.6) { const j = jit(); tone(metro.gain, { f: 784 * j, dur: 0.9, a: 0.12, at: d * 0.55 }); tone(metro.gain, { f: 622 * j, dur: 1.2, a: 0.12, at: d * 0.55 + 0.42 }); }   // a generic two-note door chime
  }

  // the karaoke tune: a slow pentatonic line over a soft root, a few bars long, made up here
  const TUNE = [0, 2, 4, 7, 4, 2, 4, -1, 9, 7, 4, 2, 0, 2, 4, -1, 4, 7, 9, 12, 9, 7, 4, -1, 2, 4, 2, 0, -3, 0, 0, -1];
  const ROOTS = [-12, -12, -15, -17];
  function scheduleBleed(now) {
    const beat = 60 / 76;
    if (bleed.t < now) { bleed.t = now + 0.05; }
    while (bleed.t < now + 0.4) {
      const n = TUNE[bleed.i % TUNE.length], at = bleed.t - now;
      if (n >= 0) tone(bleed.bus, { f: 392 * Math.pow(2, n / 12), type: 'triangle', dur: beat * 0.9, a: 0.35, at, attack: 0.02 });
      if (bleed.i % 4 === 0) tone(bleed.bus, { f: 392 * Math.pow(2, ROOTS[(bleed.i / 8 | 0) % ROOTS.length] / 12), type: 'sine', dur: beat * 3.5, a: 0.3, at, attack: 0.03 });
      bleed.i++; bleed.t += beat;
    }
  }

  // ── per frame ───────────────────────────────────────────────────────────────
  function frame() {
    requestAnimationFrame(frame);
    if (!built || !ctx || ctx.state !== 'running' || !wanted) return;
    const now = ctx.currentTime;
    const W = window.WALK, R = window.RIG, walking = !!(W && W.on);
    const where = walking ? W.where : (R && window.SCENE && window.SCENE.ERAS ? window.SCENE.ERAS[R.eraIdx].key : 'red');
    const inSq = walking && where === 'square';
    const pos = walking ? W.pos : null;
    const musicOn = !!(M.playing && !M.muted);
    aim(duckG.gain, musicOn ? DUCK : 1, 0.4);

    // the street beds: the section's own, crossfading over a second or so
    const bedOf = { red: 'ximen', dadao: 'dadao', tower: 'xinyi' };
    Object.keys(beds).forEach(k => { const on = !inSq && bedOf[where] === k; aim(beds[k].gain.gain, on ? 0.55 : 0, 0.6); });
    if (S.murmur) aim(S.murmur.gain.gain, inSq ? 0.3 : 0, 0.6);

    // the square's placed sources
    const cam = R && R.camera;
    const rx = cam ? cam.matrixWorld.elements[0] : 1, rz = cam ? cam.matrixWorld.elements[2] : 0;   // the camera's right, for the pan
    const place = (src, at) => {
      if (!src) return 0;
      let k = 0;
      if (inSq && pos) {
        const p = at || src.at, dx = p.x - pos.x, dz = p.z - pos.z, d = Math.hypot(dx, dz);
        k = remapClamp(d, src.near, src.far);
        if (src.pan) aim(src.pan.pan, d > 0.5 ? Math.round(Math.max(-0.85, Math.min(0.85, (dx * rx + dz * rz) / d * 0.85)) * 50) / 50 : 0, 0.08);
      }
      src.k = k;
      if (src !== bleed) aim(src.gain.gain, k < 0.01 ? 0 : k * src.level, 0.12);
      return k;
    };
    if (S.cicada) {
      place(S.cicada);
      S.cicada.layers.forEach(L => { if (now > L.next) { L.swell.gain.cancelScheduledValues(now); L.swell.gain.setTargetAtTime(rnd(0.25, 1), now, rnd(0.8, 2.5)); L.next = now + rnd(2, 6); } });
      place(S.sizzle);
      const shot = (src, fn, lo, hi) => { place(src); if (now > src.next) { if (src.k >= 0.01) fn(src.in); src.next = now + rnd(lo, hi); } };
      shot(S.chess, chessClack, 2.5, 8);
      shot(S.tea, teaClink, 5, 14);
      shot(S.bell, dst => ring(dst, 520 * jit(), 0.6), 24, 48);
      if (now > S.pigeon.next) { const h = S.pigeon.homes; S.pigeon.at = h.length ? h[Math.floor(Math.random() * h.length)] : S.pigeon.at; S.pigeon.next = now + rnd(3.5, 10); place(S.pigeon); if (S.pigeon.k >= 0.01) coo(S.pigeon.in); }
      else place(S.pigeon);
      // the karaoke speaker leaks its tune only while the player is silent: when the music plays, that is the karaoke
      const kk = place(bleed);
      aim(bleed.gain.gain, musicOn || kk < 0.01 ? 0 : kk * bleed.level, 0.3);
      if (!musicOn && kk >= 0.01) scheduleBleed(now); else bleed.t = 0;
    }

    // the sections' events
    if (where === 'dadao' && !inSq && now > fire.next) { fire.pan = rnd(-0.7, 0.7); firecrackers(); fire.next = now + rnd(12, 30); }
    if (where === 'tower' && !inSq && now > metro.next) { metroPass(); metro.next = now + rnd(28, 55); }
    if ((where === 'red' || where === 'tower') && !inSq && now > truck.next) { garbageTruck(); truck.next = now + rnd(100, 200); }

    // her steps, walking mode only: a heel lands where poseGirl's leg reaches furthest forward, |sin(stride)| = 1,
    // twice a stride (the zero crossings are the legs passing each other, a quarter stride late: the review moved
    // the sound onto the visible footfall, 2026-11-03)
    const G = R && R.gait;
    if (walking && G && pos) {
      const k = Math.floor((G.stride - Math.PI / 2) / Math.PI);
      if (step.k !== null && k > step.k && G.move > 0.35) footstep(surfaceAt(where, pos), G.run);
      step.k = k;
    }
  }

  // a probe for testing, like window.__music
  // a lantern lighting up, or a 「我也記得」 (memories.js, 2026-11-03, items #11 #23): one soft, high bell
  // stroke. Only ever into sound that is already on: it never creates or resumes the context itself, so a
  // phone that is still silent stays silent (music.js Fault 4).
  function chime(soft) {
    if (!ctx || !built || !wanted || ctx.state !== 'running' || document.hidden) return false;
    ring(duckG, 1318.5, soft ? 0.025 : 0.04);
    return true;
  }
  window.AMBIENCE = { chime };
  window.__ambience = {
    chime,
    get state() { return ctx ? ctx.state : 'none'; }, get wanted() { return wanted; }, get built() { return built; },
    get beds() { return Object.keys(beds).reduce((o, k) => (o[k] = { loaded: !!beds[k].src, gain: +beds[k].gain.gain.value.toFixed(2) }, o), {}); },
    get square() { return Object.keys(S).reduce((o, k) => (S[k] && S[k].gain && (o[k] = +S[k].gain.gain.value.toFixed(3)), o), {}); },
    get bleed() { return bleed ? +bleed.gain.gain.value.toFixed(3) : 0; },
    get master() { return master ? +master.gain.value.toFixed(2) : 0; }, get vis() { return vis ? +vis.gain.value.toFixed(2) : 0; },
    get steps() { return step ? { n: step.n, last: step.last } : null; }, get truck() { return truck ? truck.n : 0; },
    surfaceAt,
    fire(kind) { if (!ctx || !built) return false; if (kind === 'truck') garbageTruck(); else if (kind === 'metro') metroPass(); else if (kind === 'crackers') { fire.pan = 0; firecrackers(); } else return false; return true; },   // tests only: set one event off now
    credits: [
      { what: 'Street crowd beds (西門町, 信義)', by: 'timsc', title: 'Century Square, Shanghai, at night', licence: 'CC0 1.0', page: 'https://freesound.org/s/186676/', path: 'freesound.org/186676__timsc__century-square-shanghai-at-night.flac' },
      { what: 'New Year market bed (大稻埕)', by: 'nikitralala', title: 'China market', licence: 'CC0 1.0', page: 'https://freesound.org/s/139951/', path: 'freesound.org/139951__nikitralala__china_market.aiff' },
      { what: 'Firecracker', by: 'genel', title: 'Firecracker', licence: 'CC0 1.0', page: 'https://freesound.org/s/197044/', path: 'freesound.org/197044__genel__firecracker.mp3' },
      { what: 'Cicadas, chess, tea cups, the 磬, sizzle, pigeons, the karaoke tune, the metro, footsteps, and the garbage truck’s Für Elise (Beethoven, public domain)', by: 'synthesised in ambience.js', title: '', licence: 'CC0 1.0', page: '', path: '' },
    ],
  };
})();
