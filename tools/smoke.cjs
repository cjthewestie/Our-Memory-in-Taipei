// tools/smoke.cjs — load the page in headless Chromium in every mode, collect errors, take screenshots.
//
//   node tools/smoke.cjs [outDir] [port]
//
// Serves the repo on a local port (python3 -m http.server), then: the square (walk mode, welcome skipped),
// each of the three sections, the scroll tour at three points, and a phone-sized square. Prints one JSON
// line: { ok, errors[], shots[], stats{} }; exits 1 if any page error or console error (other than
// network failures for Supabase / fonts, which a sandbox cannot reach) was seen, or if the page asks YouTube for
// anything (2026-11-03, CJ: no YouTube any more; the music and the ambience are the page's own files).
// Software WebGL (SwiftShader) is slow: frame-rate numbers here are relative, never absolute.
'use strict';
const path = require('path');
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, '.smoke'));
const PORT = +(process.argv[3] || 8790);
const URL0 = `http://localhost:${PORT}/`;
const IGNORE = /ERR_TUNNEL|ERR_CONNECTION|ERR_NAME|net::ERR|supabase|Failed to load resource|favicon/i;

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', ROOT], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const errors = [], shots = [], stats = {};
  const watch = (p, tag) => {
    p.on('pageerror', e => errors.push(`[${tag}] PAGEERR ${(e.stack || e.message).split('\n').slice(0, 3).join(' | ')}`));
    p.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(`[${tag}] console: ${m.text().slice(0, 300)}`); });
    p.on('request', r => { if (/youtube|ytimg/i.test(r.url())) errors.push(`[${tag}] YouTube request ${r.url().slice(0, 120)}`); });
  };
  const shot = async (p, name) => { const f = path.join(OUT, name + '.png'); await p.screenshot({ path: f, timeout: 120000 }); shots.push(f); };
  try {
    // walk mode
    const p = await b.newPage({ viewport: { width: 960, height: 540 } }); watch(p, 'walk');
    await p.goto(URL0 + '?nowelcome&skip', { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(14000);
    await shot(p, 'walk-square');
    stats.square = await p.evaluate(() => ({ where: window.WALK && WALK.where, calls: window.RIG && RIG.renderer.info.render.calls, textures: window.RIG && RIG.renderer.info.memory.textures, programs: window.RIG && RIG.renderer.info.programs.length }));
    // the sound: one click unlocks the music (desktop) and the ambience with it
    await p.mouse.click(480, 300);
    await p.waitForTimeout(3000);
    stats.sound = await p.evaluate(() => ({ decade: __music.decade, unlocked: __music.unlocked, playing: __music.playing, ambience: window.__ambience && __ambience.state, iframes: document.querySelectorAll('iframe').length }));
    if (stats.sound.iframes) errors.push('[walk] an iframe is on the page');
    if (!stats.sound.unlocked || !stats.sound.ambience || stats.sound.ambience === 'none') errors.push('[walk] a desktop click did not start the music and the ambience');
    for (const k of ['red', 'dadao', 'tower']) {
      await p.evaluate(k => window.__walk && __walk.enter(k, true), k);
      await p.waitForTimeout(4000);
      await shot(p, 'walk-' + k);
      // items #11 #12: the section's lanterns are one instanced set, lit (the makers' seeds are in every street)
      const lan = await p.evaluate(k => window.__memories && __memories.sets ? __memories.sets()[k] : null, k);
      (stats.lanterns = stats.lanterns || {})[k] = lan ? lan.count : null;
      if (!lan || !lan.visible || !lan.count) errors.push(`[walk] no lanterns lit in ${k}`);
    }
    await p.evaluate(() => window.__walk && __walk.goSquare(null, true));
    await p.waitForTimeout(2500);
    // tour
    await p.evaluate(() => window.__walk && __walk.startTour());
    for (const f of [0.5, 0.97]) {
      await p.evaluate(f => scrollTo(0, f * (document.documentElement.scrollHeight - innerHeight)), f);
      await p.waitForTimeout(5000);
      await shot(p, 'tour-' + Math.round(f * 100));
    }
    await p.close();
    // phone
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const q = await ctx.newPage(); watch(q, 'phone');
    await q.goto(URL0 + '?nowelcome&skip', { waitUntil: 'load', timeout: 120000 });
    await q.waitForTimeout(12000);
    await shot(q, 'phone-square');
    await q.touchscreen.tap(195, 420); await q.waitForTimeout(1500);
    stats.phoneSound = await q.evaluate(() => ({ muted: __music.muted, unlocked: __music.unlocked, ambience: window.__ambience && __ambience.state }));
    if (!stats.phoneSound.muted || stats.phoneSound.unlocked || stats.phoneSound.ambience !== 'none') errors.push('[phone] a tap turned the sound on (Fault 4: a phone starts with sound off)');
    // the karaoke stand's 唱一首 on a muted phone is a "with sound" press: the music and the ambience start, and stay on
    await q.evaluate(() => document.addEventListener('click', () => SQUARE.sing(), { once: true }));
    await q.touchscreen.tap(195, 600); await q.waitForTimeout(2500);
    stats.phoneSing = await q.evaluate(() => ({ muted: __music.muted, playing: __music.playing, ambience: __ambience.state }));
    if (stats.phoneSing.muted || !stats.phoneSing.playing || stats.phoneSing.ambience !== 'running') errors.push('[phone] the karaoke stand did not start the sound');
    await ctx.close();
    // a phone held sideways is wider than 480 px: still a phone, still silent (review, 2026-11-03)
    const ctx2 = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const r = await ctx2.newPage(); watch(r, 'phone-landscape');
    await r.addInitScript(() => { try { localStorage.setItem('omit.music.muted', '0'); } catch (e) { } });   // a stored sound-on must not count on a phone
    await r.goto(URL0 + '?nowelcome&skip', { waitUntil: 'load', timeout: 120000 });
    await r.waitForTimeout(5000);
    await r.touchscreen.tap(420, 200); await r.waitForTimeout(1500);
    stats.landscapeSound = await r.evaluate(() => ({ muted: __music.muted, unlocked: __music.unlocked, ambience: window.__ambience && __ambience.state }));
    if (!stats.landscapeSound.muted || stats.landscapeSound.unlocked || stats.landscapeSound.ambience !== 'none') errors.push('[phone-landscape] a tap turned the sound on (Fault 4)');
    await ctx2.close();
  } catch (e) {
    errors.push('HARNESS ' + e.message);
  } finally {
    await b.close(); srv.kill();
  }
  console.log(JSON.stringify({ ok: errors.length === 0, errors, shots, stats }));
  process.exit(errors.length ? 1 : 0);
})();
