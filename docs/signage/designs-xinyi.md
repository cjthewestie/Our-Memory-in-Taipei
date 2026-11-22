---
title: Kind-B designs for 信義 (Xinyi)
kind: design record
updated: 2026-11-22
---

# Kind-B designs for 信義 (Xinyi)

CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」, and 「招牌可以用midjourney生成紋理 或海報更換所有的招牌或有字的牌子直到他們有質感跟好看」.

Code: `remake/landmarks-xinyi.js` (the events block, plus the plates and boards noted below) and `remake/xinyi.html` (the gate board). Every piece is built through `design-kit.js`, or on a canvas this file paints itself. All lettering is set in code. Each poster asks the kit for `asset/textures/posters/events/<key>.jpg` and shows its code-drawn version until that file lands.

Labels: **measured** means I read it in a file, a source page summary or a screenshot. **inferred** means my reading of that evidence. **guess** means not checked.

## Events (12)

| Item | What it was | Form, layout and mount, and why | Supporting props (this file) | Reference | Label |
|---|---|---|---|---|---|
| `taipei-101-opening-2004` | The tower opened on 2004-12-31 as the world's tallest building, 508 m. | **Statue**, `tower` on a `block` plinth, `award` palette (gold on black). What people remember is the building itself, so the building is the subject, cast in bronze with a plate. | The opening-day ribbon on two gold posts, cut in the middle, with rosettes and scissors left on it. | https://en.wikipedia.org/wiki/Taipei_101 | measured (date and height in PLACE_DATA); inferred (the ribbon cutting as the remembered image) |
| `alain-robert-climb-2004` | Alain Robert climbed the tower with a rope, in the rain, on Christmas Day 2004, in about 4 hours. | **Poster**, `news` layout in a lit `case`. Head 「法國蜘蛛人 雨中攀上101」, kicker 號外 (a newspaper extra), big 「4小時」. A climb like this became a front page, so the piece is the front page. | Three bundles of the next day's paper, tied with string, at the foot of the case; the top one shows a red 號外 masthead. | https://en.wikipedia.org/wiki/Alain_Robert | measured (date, PLACE_DATA); guess (the 4-hour figure: "about four hours" is widely reported but I did not open the source) |
| `alex-honnold-free-solo-2026` | A rope-free climb on 2026-01-25, 1:31:43. | **Statue**, `climber` on a `drum` plinth, `sport` palette. Changed from a podium: a podium means a race, and this was one person alone. Next to it stands the life-size flared storey with a figure on it. | That storey's plain date plate is now a **chronograph plate**: 1:31:43 in red LED with a glow, a "FREE SOLO · 無繩攀登" tag, an altitude bar from 1F to 101F, gold edge strips. | https://www.cbsnews.com/news/alex-honnold-free-solo-climbs-taipei-101-skyscraper | measured (date and time, PLACE_DATA) |
| `taipei-101-run-up-2005` | The first stair race was on 2005-11-20: 2,046 steps, 91 floors, a record of 10:29. | **Statue**, `runner` on the race `podium` (1-2-3), `sport` palette. A race is remembered by its podium and its clock. | A chequered start line on the ground, and a race-clock pylon (RUN UP header, 10:29 in red digits, a floor-count bar from 1F to 91F). | https://zh.wikipedia.org/zh-tw/台北101國際登高賽 | measured (numbers in PLACE_DATA marker) |
| `first-nye-fireworks-2005` | The first fireworks off the tower, at 00:00 on 2005-01-01. | **Installation**, `digits`: the year 2005 in chasing bulbs, `countdown` palette. This follows the research recipe for a countdown (posters.md §11, giant numbers). | Three firework bursts on rods above it (pink, cyan, gold radial rods with bead tips), and the countdown clock stopped at 00:00 "2004 → 2005". | posters.md ref 48 https://garbett.com.au/work/sydney-new-years-eve · ref 50 https://www.taiwannews.com.tw/zh/news/6005273 | measured (research recipe); inferred (fit) |
| `deadpool-reynolds-2016` | Ryan Reynolds on the red carpet at Vieshow Xinyi on 2016-01-21. | **Booth**, `carpet`: a truss with a step-and-repeat wall, the carpet, stanchions and camera flashes, with a `premiere` layout. A premiere is remembered as the carpet and the press wall. The film's title and its character are not drawn. | The fans' `placards` (hearts, "RED ♥ 2016") and a crowd `barrier`. | https://www.gvm.com.tw/article/31272 | measured (date, PLACE_DATA); measured (placards visible in after2-vieshow.png) |
| `weekend-in-taipei-2024` | The world premiere of 《台北追緝令》 on 2024-09-01. | **Poster**, `painted` layout on a pasted advertising `column`, in a neon-noir palette (night navy, hot pink, teal). It is an action film set in Taipei, so the piece is a hand-painted cinema poster, after Taipei's billboard painters (posters.md ref 43). It is a different form and layout from its neighbour, the carpet booth. It moved from z -12.6 to -14.3, where the City Hall model had hidden it. | The column's mix: `painted`, `news`, `painted`. | https://n.yam.com/Article/20240901664325 · posters.md ref 43 | measured (it was hidden: before-vieshow.png); inferred (palette) |
| `taipei-nye-party-2020` | 臺北最HIGH新年城, the countdown concert in front of City Hall on 2019-12-31. | **Booth**, `stage`: a raised stage, an LED screen, speakers, a lighting bar and a sea of light sticks, in the `countdown` layout and palette. Changed from a column poster: the night is remembered as a stage facing a crowd. | Comes with the kit's stage booth. | https://www.cna.com.tw/news/firstnews/201912315002.aspx · posters.md ref 51 | measured (date); inferred (form) |
| `taiwan-pride-city-hall-2024` | Taiwan Pride left from City Hall plaza on 2024-10-26, with about 180,000 people. | **Installation**, a `canopy` of rainbow umbrellas you walk under, `rainbow` palette. | Under it, the long six-stripe flag carried by four anonymous marchers on poles. That is the image the marker brief named ("marchers under a long flag"). No slogans or political text. | https://www.cna.com.tw/news/ahel/202410260196.aspx | measured (date and number, PLACE_DATA) |
| `nuit-blanche-xinyi-2023` | The all-night art festival came to Xinyi on 2023-10-07. | **Installation**, `rings`: a walk-through tunnel of cut rings shading dusk → midnight → dawn, plus a lit `nightart` poster case (night-blue ground, kicker2 "18:00→06:00"). This is the research recipe almost exactly. The slogan 「起義吧」 is left off, as the research advises. | A moon hung on a rod over the tunnel's far end (a white disc with a blue halo). | posters.md refs 31–32 https://www.bnext.com.tw/article/76972/nuit-blanche-xinyi-district | measured (recipe); measured (after2-nuit.png) |
| `simple-life-urban-2019` | Simple Life Urban+ at the 101 fountain plaza, 2019-11-30 to 12-08. | **Booth**, `craft`: a canvas tent with festoon lights, plants and goods, and a `market` layout in the research's recycled-paper palette (#F3EDE2 / #2F4F4F / #E8B04B / #C65D3B). The festival is remembered as a hand-made market with music. | Books added to the table, and a guitar on a stand by the tent. The guitar is from the marker brief. | booths.md §3.1–3.3 https://www.bnext.com.tw/article/65579/shopline_202110 · https://zh.wikipedia.org/zh-tw/簡單生活節 | measured (palette from booths.md 3.3) |
| `eslite-xinyi-last-night-2023` | Eslite Xinyi closed on 2023-12-24, lights out at 22:30, after opening on 2006-01-01. | **Installation**, `books`: an arch of stacked books, `memory` palette, big 「22:30」. The shop was books, so the memorial is made of books. | A reading lamp still lit, and a wall clock on it stopped at 22:30. Both are from the marker brief. | https://news.pts.org.tw/article/672922 | measured (dates, PLACE_DATA) |

## The site's other kind-B pieces (5)

| Item | Before | Now | Label |
|---|---|---|---|
| `taipei-city-hall` pointing board | A `memory` case showing "1986" and a map pin (before-cityplaza.png). | **Poster** in the `deco` layout on an A-frame `standee`: an architecture-exhibition graphic in navy and gold, big 「1994」, kicker CITY HALL, "1986 – 1994". It is a different form and layout from the stage and the umbrellas beside it. No painting is planned for this key because it is a place, not an event, so the code-drawn version stays. | measured (after2-cityplaza.png) |
| City Hall model caption | A beige plate with three lines of one font. | An **exhibition caption**: a navy panel holding the line plan of the two joined crosses and "No. 07", 臺北市政府 in large serif, the English name tracked in red, the dates and storeys, a gold 1994 block and a scale bar. | measured (after2-vieshow.png) |
| Honnold life-size storey plate | A "2026.01.25 / 1:31:43" plate. | The chronograph plate described above. | measured (after2-forecourt.png) |
| Busker sign on 香堤大道 | A 街頭藝人 plate. | The busker's own **chalkboard**: 今晚 / 街頭演唱 in chalk with an underline, a guitar drawn in chalk, "LIVE · 19:00 – 21:30", "歡迎點歌 · 打賞隨意", a wooden frame, readable from both sides. | measured (after2-busker.png) |
| Gate board (xinyi.html) | A blue 「廣場 THE SQUARE」 board. | A lit **poster box** over the way out. It carries `DESIGN.gateTexture(E, 'xinyi', …)`: the painted gateway art from `posters/gates/xinyi.jpg` (code-drawn skyline until it lands), with 「廣場」 set in brush lettering, the kicker BACK TO THE SQUARE and 西門 · 大稻埕 · 信義. It is readable from both sides and has a light bar above and hanging rods. | measured (after-gate.png, after-view6.png) |

The 2021 door notice beside 威秀 is a real notice, so it is kind A. It is now a printed A4 sheet on the kit's `paper` material, taped up, with a mask icon. It moved to z -3.9, out of the carpet booth's flag. Label: measured (after2-notice.png).

## Neighbour check (no two neighbours share form + layout)

- Forecourt west: statue/block → poster/news case → statue/drum → life-size storey. Each form differs from the one next to it. measured (code).
- Forecourt east: statue/podium → installation/digits. measured.
- 威秀: booth/carpet → poster/painted column. measured.
- 市府 plaza: booth/stage → installation/canopy → poster/deco standee. measured.
- 香堤大道: installation/rings, alone. South end: booth/craft and installation/books. measured.

## Not done or not mine

- The square-side face of the 信義 gate model (「信義 XINYI 2020-」) is baked into the `bundle-square` model, and the square page owns it. It is not changed here. inferred (from `get(sq, 'sq-gate')` in xinyi.html).
- The photo-topic showcase headers on this page (climb, fireworks, quiet, skywalk, lookup) come from `photowall.js` through `DESIGN.headerTexture`. They are not in my files.
- The real-place plaques beside the buildings (威秀, 誠品, and the others) are built by `places.js` and are not touched here.
- Art status at the time of the shots: `DESIGN.artStatus()` listed every event, topic and gate file as `wait`, so every shot shows the code-drawn fallback. measured.

## Shots

All in `docs/signage/shots/xinyi/`:

- before-*.png and after2-*.png for the clusters (forecourt, runup, vieshow, cityplaza, nuit, south), plus busker and notice.
- after-view1..6.png for the six viewpoints.
- panel-*.png for three `?place=` panels.
- after-gate.png for the gate board.
