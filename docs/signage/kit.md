---
title: Design kit for the site's own furniture (kind B)
kind: guide
updated: 2026-11-22
---

# Design kit: posters, statues, installations, booths

CJ, 2026-11-21: 「招牌可以有設計感一點 不行的話就用海報 反正也不是店家招牌」. CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」.

Code: `remake/design-kit.js` (window.DESIGN). Load it before `places.js`. Research behind every layout and form: `docs/signage/research/posters.md`, `sculpture.md`, `booths.md`. Rejected examples it replaces: `docs/signage/rejected/*.png`.

## Two kinds of sign

- **Kind A, a real place's own sign** (a shop board, a temple 匾額, a cinema front, a station or street plate): follows the real sign. Not this kit.
- **Kind B, the site's own furniture** (every event marker, photo-topic showcase header, gate board, exhibition wall header, the notice board's surroundings): never a plain name plate. Always one of the four forms below.

## How a page calls it

```js
// the usual way: PLACES builds the piece, registers the click, the E prompt and the panel, and blocks its footprint
PLACES.add(E, P('golden-melody-arena-2006'), { position: [3, 12], rotation: Math.PI / 2 });                     // the curated design for this key
PLACES.add(E, P('flora-expo-2010'), { position: [3, 12], rotation: 0, design: { form: 'installation', piece: 'flowers' } });
PLACES.add(E, it, { position: [x, z], rotation, design: { form: 'poster', layout: 'award', mount: 'case', palette: 'award', carpet: true, head: '金曲獎 登上小巨蛋', big: '金曲', kicker2: '第十七屆' } });
PLACES.add(E, it, { position: [x, z], design: { form: 'statue', motif: 'record', plinth: 'drum', story: '一句故事' } });
PLACES.add(E, it, { position: [x, z], design: { form: 'booth', booth: 'esports', layout: 'esports' } });
// without registering it (a gate, an exhibition wall, the notice board's surroundings): a THREE.Group, front along +Z
const g = DESIGN.build(E, itemOrNull, { form: 'poster', mount: 'banner', layout: 'games', head: '…', big: '2017', en: '…', date: '…' }); scene.add(g);
// or just the canvas: a texture to put on your own mesh
const t = DESIGN.posterTexture(E, item, { layout: 'nightart' }, 640);          // portrait, W:H 1:1.414
const band = DESIGN.wideTexture(E, item, { layout: 'street' }, 1024, 0.2, 'band');   // 'band' | 'repeat' | 'skirt'
```

Leave out `design` and `DESIGN.choose(item)` picks it: first the curated design for the item's key (`DESIGN.CURATED`, all 41 events in `place-data.js` today), else one read from the item's wording (award, expo, games, e-sports, night art, lantern, anime, premiere, film, countdown, concert, market, parade, crowd) and its `marker.type` (statue, stand → booth, wall → poster wall, board → poster). `type` and `shape` on `PLACES.add` are only hints now. `legacy: true` builds the old plain marker, for a before/after check only.

## The design fields

| Field | Values | What it does |
|---|---|---|
| `form` | `poster`, `statue`, `installation`, `booth` | which kind of piece |
| `layout` | `award`, `expo`, `games`, `esports`, `concert`, `nightart`, `lantern`, `anime`, `premiere`, `painted`, `street`, `countdown`, `news`, `deco`, `market`, `memory` | the poster's graphic style (also the booth's backdrop and posters) |
| `mount` | `standee` (A-frame), `case` (lit case on a plinth), `column` (pasted advertising column), `banner` (a row of pole banners spelling `big`), `wall` (a wall of pasted posters), `billboard` (scaffold, hand-painted) | how a poster stands |
| `piece` | `rings` (walk-through ring tunnel), `arch` (rainbow arch), `lantern` (creature lantern on a cart), `digits` (bulb year digits), `canopy` (+ `obj`: `umbrella`, `lantern`), `flowers` (flower arch), `phones` (field of phone glows and a map pin), `books` (book arch), `screen` (open-air cinema), `burst` (firework sculpture) | the installation |
| `booth` | `signing`, `stage`, `carnival`, `fanmeet`, `carpet`, `market`, `food`, `container`, `craft`, `esports`, `doujin` | the booth's frame, back wall and props |
| `plinth` | `block`, `drum`, `podium` | the statue's base; every statue also gets a cast plate and a ring set in the ground |
| `motif` | `record`, `rings`, `heel`, `thread`, `runner`, `ball`, `panda`, `mic`, and the older bronzes `tower`, `climber`, `parade`, `firework`, `damper` | the statue's subject, and the drawn subject on posters |
| `palette` | a key of `DESIGN.PAL` or six hex colours `[ground, ground 2, ink, a, b, c]` | colours; `variant` rotates the accents |
| `head`, `big`, `kicker`, `kicker2`, `venue`, `story`, `en`, `date` | text | the headline, the huge element (a year, a word), small Latin lines, the vertical tag, the venue strip, the one-line story on a plate |
| `layouts` | array of layouts | the mix on a `wall` or `column` |
| `carpet` | true | a red carpet and stanchions in front of a `case` |
| `props` | extra booth props | `cds`, `placards`, `barrier`, `speakers`, `lightsticks`, `balloons`, `merch`, `carpet`, `flashes`, `jars`, `lanterns`, `goods`, `bowls`, `stools`, `menu`, `festoon`, `plants`, `chairs`, `books`, `acrylic`, `pullup` |

## Photo-topic showcase headers

`photowall.js` showcases now carry `DESIGN.headerTexture(E, topic, info, w, h)`: an exhibition graphic per topic (16 today: family, school, food, chunghwa, cinema, walk, redhouse, newyear, temple, fabric, wharf, fireworks, quiet, skywalk, climb, lookup), each with its own drawn panel of the subject, the name set huge with an offset shadow, an exhibit number, the English name tracked, and the years in a chip. It stands in a deep dark frame with a light bar. A topic not in the table borrows one of the 16 by its name. `legacySign: true` on a showcase brings back the old sign face.

## Rules the kit keeps (from the research's "Do not do")

1. At least three layers: a structure, a picture, and type. Never a rectangle with one title line and one date line.
2. Three type sizes or more, Chinese and Latin mixed, lettering that is part of the picture (foil, cut paper, lines, bulbs, stencil, brush).
3. A pictogram is the subject drawn big, never an icon beside a word.
4. No two curated pieces share form + layout + mount + palette.
5. No real logo, mascot or likeness: figures are anonymous, the anime character is invented, the masthead (臺北日報) is invented.
6. Performance: every canvas texture and material is made once per engine and shared (`posterTexture` is keyed by layout + item + size); bulbs and light sticks are instanced.

## Painted artwork (Midjourney) under the code lettering

CJ, 2026-11-22: 「招牌可以用midjourney生成紋理 或海報更換所有的招牌或有字的牌子直到他們有質感跟好看」. The lead saves the paintings, all without lettering, into `asset/textures/`; the kit picks each up by its path and sets every letter in code. Until a file exists (or if it is missing) the code-drawn poster shows; when the file lands, the canvas that asked for it is painted again.

| Path under `asset/textures/` | Used by | How |
|---|---|---|
| `posters/events/<item key>.jpg` (4:5) | every poster of that item (`posterTexture`, so every mount, wall and column) | bleed layouts: the painting fills the top down to the layout's cut, graded to the palette, the layout's own graphic laid over it (`screen` on dark grounds, `multiply` on light), the type block printed solid below a soft edge, a margin frame with corner ticks. Inset layouts (`concert`, `anime`, `news`, `memory`): the whole print, the painting in its picture box (`news` and `memory` in grey halftone). The cut, blend and strength per layout: `DESIGN.ART_AT` |
| `posters/topics/<topic key>.jpg` (3:2) | the showcase header of that photo topic (`headerTexture`) | the painting in the right panel (46 % wide), graded, the drawn subject screened over it at 28 %, a fade into the ground, a frame in the second accent |
| `posters/gates/<ximen\|dadao\|xinyi>.jpg` | `DESIGN.gateTexture(E, district, design, px, aspect)` for a gate's own builder | a poster (default layout `painted`) with that painting |
| `signs/<material>.jpg` | `DESIGN.signTexture(E, material, w, h, letter(g, W, H), key)` for real signs (kind A) | the tileable material, else a code-drawn one; then the caller's lettering. Materials: `DESIGN.MATERIALS` |

- Any design takes `art: '<path under asset/textures/>'` to choose a painting, or `art: false` for none.
- A folder's listing is read once (the dev server is python `http.server`), and its parent's listing first, so a file or folder that does not exist yet costs no 404 and no console error. `DESIGN.reloadArt()` checks again and repaints what landed; `DESIGN.artStatus()` lists `{ ok, missing, wait }`.
- `?arttest=1` on any page maps every painting request onto the old film posters in `asset/textures/posters/`, only to check the compositions before the real art exists. Shots with that stand-in are named `*-teststandin.png`: the faces in them are those old posters, not the art.
- `places-test.html` now also shows the three gate posters and the twelve material boards at x -22 to -32 (`?debug=1&view=1&cam=-26,2.0,6,-28,1.4,-2`).

## Checks

- `remake/places-test.html` shows one of each: row A (z 0) the six mounts, row B (z -10) statues, row C (z -20) installations, row D (z -32) booths, row E (z -44) all 16 layouts. Frame a piece with `?debug=1&view=1&cam=px,py,pz,tx,ty,tz`.
- Shots: `docs/signage/shots/kit/`.
