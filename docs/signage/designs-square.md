---
title: Square (hub) designs for the site's own furniture (kind B)
kind: design log
updated: 2026-11-22
---

# The square: event markers, gateways, exhibition header

CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」; 「招牌可以用midjourney生成紋理 或海報更換所有的招牌或有字的牌子直到他們有質感跟好看」.

Code: `remake/landmarks-square.js` (the `D` table, `piece()` and `kitFace()`, then each event's block) and `remake/square.html` (`GATE`, `gateway()`, `exhibitHeader()`). The pieces come from `remake/design-kit.js` (see `docs/signage/kit.md`). The painting under each poster is `asset/textures/posters/events/<key>.jpg`, and under each gateway's middle poster it is `posters/gates/<district>.jpg`. Until a painting lands, the code-drawn version shows. All lettering is set in code.

## What changed, in one paragraph

Each event kept the object that tells its story: the half court, the podium, the stage riser, the cub, the lifted dome. The old `eventSign()` plate (a two-legged board with one title line and one date line, the same fault as the rejected `golden-melody-board.png` and `pokemon-board.png`) is deleted, and a designed piece from the kit stands where the plate stood. The plain labels inside the scenes also went: the 金曲獎 arch label, the 花博 stem label, the 燈節 box sign, the 大巨蛋 base label and the FF cloth sign. The FF hand-drawn poster was replaced too. Fan-made props that tell what the crowd did are kept: the 林書豪 fan board, the 最後尾 queue sign, the 新刊 card. **11 of 11 event markers redesigned, plus 3 gateways and the exhibition header: 15 kind-B pieces** (measured: `grep -c eventSign` finds only a comment, and every `reg()` for an event now passes `pc.foot`).

## Event markers

Labels: **measured** = read in a source or a file; **inferred** = my reading of the evidence; **guess** = no evidence.

| Item | What it was | Form, layout, mount | Why this form | Reference |
|---|---|---|---|---|
| `golden-melody-arena-2006` 金曲獎 登上小巨蛋 | The 17th Golden Melody Awards, the first held in the new Taipei Arena, 2006-06-10 (measured, place-data sources) | **poster**, `award` + `premiere` mix, **column** wrap (0.9 scale) at the red carpet's mouth; the arch's label is now the kit's award band | The research recipe for this exact rejected plate is a black-and-gold column wrap at an arena entrance (measured, booths.md 2.5, its design is inferred). No 2006 poster design was found (measured, posters.md #4), so the black-and-gold palette is inferred from the awards' later look | booths.md 2.5: https://www.thenewslens.com/article/267087 · https://zh.wikipedia.org/zh-tw/第17屆金曲獎 |
| `jay-chou-taipei-dome-2024` 大巨蛋首場演唱會 | The first concert in the Taipei Dome, the 嘉年華 tour, 2024-12-05 (measured, place-data) | **poster**, `concert`, **standee** (A-frame) beside the dome model | A stadium tour is sold by its tour poster on the street (inferred, posters.md §5). The singer is named in text only (周杰倫 as kicker2), with no likeness | https://www.cna.com.tw/news/amov/202412050356.aspx |
| `fancy-frontier-ff` 開拓動漫祭 | A doujin fair of about 1,000 circles (measured, booths.md 1.1, for FF47) | **booth**: the existing circle table, now dressed in kit graphics. The table cloth is the kit's `anime` skirt, the back frame holds the circle's `anime` poster, and an X-banner stands by the chair | A doujin fair is remembered as a table, its cloth, an X-banner and the queue (measured, booths.md 1.1) | https://www.nownews.com/news/6868052 |
| `nba-taipei-game-2013` NBA 臺北賽 | The first NBA game in Taipei, at the Taipei Arena, 2013-10-13 (measured, place-data) | **statue**: a bronze `ball` on a `drum` plinth with a cast plate on its lectern, at the court's edge | The court already tells the place. The ball on a plinth is the trophy-like thing to walk round, and the cast plate carries the story 「小巨蛋裡一萬人一起尖叫」 (the line is inferred from the crowd reports) | https://n.yam.com/Article/20131010809299 |
| `yuanzai-first-day-2014` 圓仔 首次亮相 | The cub's first public day, with long queues, 2014-01-06 (measured, place-data) | **poster**, `news` (an invented 臺北日報 front page, 號外), lit **case** beside the cub | The cub figure is already a statue. What people remember is the media frenzy and the queue, so the companion piece is a front page (inferred) | https://zh.wikipedia.org/zh-tw/圓仔 |
| `universiade-2017` 世大運 | The Taipei 2017 Summer Universiade (measured, place-data) | **poster**, `games`, **banner** row: four street-pole banners spelling 2017 behind the podium | The Games were promoted on city surfaces: poles, sites, trucks (measured, posters.md #19). The layout follows the Tokyo 1964 / Mexico 68 games-poster lineage (posters.md #15, #17) | https://www.bnext.com.tw/article/45951/taipei-2017-universiade-brand-marketing |
| `flora-expo-2010` 花博 | The Taipei International Flora Expo, 2010-11-06 to 2011-04-25 (measured, place-data) | **poster**, `expo`, **standee** at the flower bed's edge, with kicker 「彩花 · 流水 · 新視界」 | The giant flower is already the installation. An expo is sold by its poster, and the theme line is the expo's own (measured, posters.md #12) | https://www.moa.gov.tw/ws.php?id=23392 |
| `lantern-fest-shilin-2022` 台北燈節 士林 | The 2022 Taipei Lantern Festival in Shilin (measured, place-data) | **installation**: a `canopy` of lanterns to walk under, in front of the crane-hung main lantern; the box sign is removed | A lantern festival is walked under, not read (inferred, booths.md 4.4 canopy recipe; sculpture.md #29) | https://www.storm.mg/article/4160415 · booths.md 4.4 |
| `nuit-blanche-gongguan-2017` 白晝之夜 公館 | An all-night art festival, 18:00 to 06:00, Gongguan, 2017-10-07/08 (measured, place-data) | **poster**, `nightart`, lit **case** beside the moon, the clock and the paper palms | The scene is already an installation (moon, clock). A poster glowing at night is how the festival is sold (inferred, posters.md §6) | https://www.setn.com/news/301998 |
| `msi-2019-heping` 季中邀請賽 決賽 | The League of Legends MSI finals at Heping Basketball Gymnasium, May 2019 (measured, place-data) | **poster**, `esports` + `countdown` mix, **column** wrap at the stage's corner | An arena final is wrapped in key art (inferred from Worlds 2019 key art, posters.md #22). The stage riser is already the booth | https://www.stashmedia.tv/?p=72970 |
| `pokemon-go-beitou-2016` 北投公園 抓寶人潮 | Crowds hunting with their phones in Beitou Park, August 2016 (measured, place-data) | **installation**: a `phones` field of phone glows round a map pin (0.85 scale), beside the hand-and-phone figure | The crowd was a sea of screens. A "field of light" is the crowd as light (inferred, sculpture.md quick map #28). No game mark or creature is drawn | https://www.cna.com.tw/news/firstnews/201608210220.aspx |

Neighbours never share form + layout (measured from the `D` table):
- North row: NBA statue/ball, Universiade poster/games/banner, lantern installation/canopy.
- Middle: Flora poster/expo/standee, Nuit poster/nightart/case.
- West: Yuanzai poster/news/case, FF booth/anime.
- South-west: Golden poster/award/column, Dome poster/concert/standee.
- South-east: MSI poster/esports/column, Pokémon installation/phones.

## Gateways (square.html `gateway()`)

Each gate is no longer one board. It is three posters set in the frame that district's era would use. The middle poster is the district's painting (`DESIGN.gateTexture`) with code lettering. The two beside it are posters of that district's own events, with their paintings from `posters/events/` (inferred choice of events, from `DESIGN.CURATED`).

| Gate | Era | Frame | The three posters (layout: head) | Why |
|---|---|---|---|---|
| 西門町 | 1985–1999 | A red steel cinema front: the three boards side by side as over a cinema's doors, ringed and divided by chaser bulbs, a steel cap; cloth banners 冷氣開放 / 隆重獻映 down the piers | `premiere`: 電影街 · `painted`: 西門町 (gate painting) · `street`: 徒步區 1999 | Ximen was the cinema street of hand-painted boards, and the pedestrian zone opened in 1999 (inferred, posters.md #43 for the hand-painted board craft) |
| 大稻埕 | 2000–2019 | A timber beam with gilt end caps strung with nine red lanterns, the three boards hung under it in red-lacquer frames on iron straps; the 南北貨 / 茶行 light boxes kept on the piers | `deco`: 迪化街 一九二〇 · `market`: 大稻埕 (gate painting) · `memory` in temple colours: 霞海城隍 | The lantern-beam gateway is the research recipe for a district gate (inferred, booths.md 4.4). The 年貨大街, 1920s and 城隍 themes are the district's own events (measured, `DESIGN.CURATED` dadao keys) |
| 信義 | 2020– | Three LED-lit panels in a brushed aluminium frame on stand-offs, LED lines round the edge and between panels, glass fins | `nightart`: 白晝之夜 信義 · `countdown`: 信義 2020– (gate painting) · `memory`: 誠品信義 最後一夜 | Xinyi's era reads as the countdown, the night art festival and the bookshop's last night (measured, `DESIGN.CURATED` xinyi keys) |

## Exhibition header

The plain title strip (one Song-face line and a Latin line) was replaced by the kit's exhibition band in the `memory` palette. It has a film pictogram disc, 開幕展 set huge with an offset shadow, the Latin line tracked, and a 1961 date chip. It is printed on both faces of an aluminium light box on two rods, with a light bar under it. The title plaque 台北記憶 / OUR MEMORY IN TAIPEI was not changed.

## Checks run (measured)

- `node tools/places/check.mjs "http://localhost:8821/remake/square.html" …` with `__places.list().length` returned **24** and printed no exception and no log error. `reg(` calls: 23 at HEAD and 23 now, so the count is unchanged.
- Shots are in `docs/signage/shots/square/`:
  - the six viewpoints: `sq-view1.png` … `sq-view6.png`
  - each piece: `sq-v1-*.png`, `sq-v2-*.png`, `sq-v3-golden.png`
  - the gates: `sq-v1-gate-dadao.png`, `sq-v2-gate-ximen.png`, `sq-v2-gate-xinyi.png`
  - the header: `sq-v2-exhibit.png`
  - three panels: `sq-panel-golden-melody-arena-2006.png`, `sq-panel-universiade-2017.png`, `sq-panel-pokemon-go-beitou-2016.png`
- Against `docs/signage/rejected/*.png` (inferred, from reading the shots): every piece now has a picture layer, three or more type sizes, and a real mount or a plinth. None is a one-title, one-date rectangle.
- One fix made after reading the shots: the golden column first stood on the exhibition wall's end and then in viewpoint 6. It was moved to local (1.45, 2.3) at 0.9 scale.
- At the time of the shots, art state was `wait` for most files, but the flora painting rendered. Re-run `DESIGN.reloadArt()` after the art lands.

## Open

- Whether the six side-panel event paintings named in `GATE` all exist: `(unknown, re-check with DESIGN.artStatus() after the art lands)`.
- The notice board's surroundings and the 台北記憶 plaque's setting were not touched in this pass.
