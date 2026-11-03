# Changelog

One line per merged pull request, newest first. Dates are Taipei time.

## 2026-11-03

- **B1 Audio: no YouTube, public-domain music, and the sound of the place (item #8)** (branch `claude/gracious-allen-7tbgxq`). CJ: 「不要用youtube了選適合的無版權音樂」. `music.js` plays only the page's own files: two FreePD public-domain tracks per decade and two for the square (`asset/music/`, 21 MB, chosen from tags and loudness measurements, normalised to -18 LUFS, listed in `asset/music/CREDITS.md` and the on-page Credits panel); the YouTube player, iframe and API are gone, the bar, decade buttons (now with 廣場), folded pill, karaoke stand and the phone-starts-muted rule stay, and nothing is downloaded while muted. New `ambience.js` (Web Audio, same mute as the music): the square's cicadas, chess, tea cups, 磬, sizzle, pigeons and karaoke bleed placed with distance falloff and pan; crowd / New Year market / metro beds per section from CC0 recordings (`asset/ambience/`, 455 KB); footsteps on brick, terrazzo and asphalt timed to the girl's stride (`RIG.gait`); fades out when the tab is hidden. The old synthesised loops and their generator are removed.
- **B1 Audio review**: a phone held sideways (wider than 480 px) counted as a desktop and could start its speaker on the first swipe; the phone-starts-muted rule now also covers any touch-first screen. `ambience.js` no longer schedules a gain change on every param every frame (only when a target moves), her footstep sounds land on the visible footfall instead of a quarter stride late, and the plan's easter egg is in: the garbage truck's 給愛麗絲 (Für Elise, public domain, synthesised) passing a block away in 西門町 and 信義. The karaoke stand's 唱一首 · Sing on a muted page started the music and paused it again in the same press (it read a frame-old `__music.playing`), which also left the player locked and the ambience suspended; `playing` is now live, a pause right after a play no longer counts as the browser refusing, and the press that wakes the page no longer skips to the next song. The Credits panel now sits above walk mode's pills. `tools/smoke.cjs` now fails if a desktop click does not start the music and the ambience, and checks a sideways phone too.
- **The banyan square** (branch `claude/gracious-allen-7tbgxq`), researched first (`research/banyan-square/README.md`: 大樹公, 伯公下, how the scene is composed). `square.js` builds a Taipei temple-square at golden hour: the banyan as 大樹公 (pale bark, buttresses, fused trunks, pillar roots, curtains of aerial roots, a red cloth round it, a crown of ~2000 alpha-cut leaf cards with clump normals, wind and dappled shadow), the 土地公 shrine (福德祠) at its foot with its incense smoke and a 金爐, 象棋 and 老人茶 tables, arcades (騎樓) with mixed-era shop signs, scooters, potted plants, pigeons, street lamps, a sausage cart, the three gates, a 小卡拉OK stand (`E` plays the decade's song), and a **memory board** (公布欄) that holds the newest memories and opens the full list on `E`. No lanterns in the square. `app.js` takes a dusk factor for the square's sky and light. Also a welcome card on first visit, a readable square panel and a folded music player.

## 2026-10-31

- **Free walk, the square and visitors' memories** (branch `claude/gracious-allen-7tbgxq`). The page now opens on a square with three gates (西門町 west, 大稻埕 north, 信義 east); each leads into its section, where you steer the girl freely (WASD/arrows and drag, or a stick on a phone). The scroll film stays as the Guided tour (`?tour=1`). Visitors can leave a memory (text, year, name, photo) that hangs as a lantern where they stood; stored in Supabase as pending until approved, or in the visitor's browser while unconfigured. New: `walk.js`, `walk.css`, `memories.js`, `memories.css`, `memories-config.js`, `supabase/schema.sql`, `docs/MEMORIES.md`.

## 2026-09-23

- **#14** Detailed stylized models: Blender-scripted glb for six hero buildings, instanced street elements and the girl with her school bag; GLTFLoader and models.js; the page now runs from an http server, double-click retired. Closes #5.
- **#7** Decade music player: a YouTube player per decade, a gitignored private folder with chorus loops for CJ's own songs, four synthesised CC0 loops as the offline fallback, HUD control bottom-left. Closes #4.
- **#6** Surface texture pass: ACES tone curve on luminance, canvas sky environment, procedural brick, plaster, concrete, wood and asphalt maps with one strength knob, a shadow sun that follows the scroll camera, per-vertex ambient occlusion. Closes #3.

## 2026-09-22

- **#2** Real-building pass for all three chapters, 張君雅小妹妹 as the runner, the seven-criterion rubric with its first scoring, and eight IVRESS-derived effects (chapter-cut flash, letter reveal, chapter column, luminance grain, FOV ramp, mouse parallax, curve particles, render warm-up). Closes #1.

## Earlier

- 2026-09-20 to 21: the prototype built on Build Day and the days after, before pull requests were used. See `HANDOFF.md`.
