# Changelog

One line per merged pull request, newest first. Dates are Taipei time.

## 2026-11-03

- **The banyan square** (branch `claude/gracious-allen-7tbgxq`). The square is rebuilt (`square.js`) as a Taipei temple-square at golden hour: a banyan with aerial roots whose crown holds the 16 newest memories as Taiwanese lanterns (newest lowest), arcades (騎樓) on all sides with iron window grilles, air conditioners, water tanks and shop signs across the decades, parked scooters, three distinct gates (西門町 red steel sign, 大稻埕 brick arch, 信義 glass frame), a 象棋 table, and a 小卡拉OK stand that plays the decade's song on `E`. Lanterns everywhere are now proper 燈籠 (lathe body, ribs, gold caps, tassel, glow). `app.js` takes a dusk factor for the square's sky and light. Also a welcome card on first visit, a readable square panel and a folded music player.

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
