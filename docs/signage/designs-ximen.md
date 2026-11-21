---
title: 西門町 event pieces, one design each
kind: design log
updated: 2026-11-22
---

# 西門町 event pieces: what each one is and why

CJ, 2026-11-21: 「招牌可以有設計感一點 不行的話就用海報 反正也不是店家招牌」. CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」. CJ, 2026-11-22: 「招牌可以用midjourney生成紋理 或海報更換所有的招牌或有字的牌子直到他們有質感跟好看」.

Code: the `ev(...)` calls at the end of `remake/landmarks-ximen.js`. Each event has its own `design` (the main piece, registered by `PLACES.add`). Seven also have companion pieces built by `DESIGN.build`, placed in the main piece's own frame. A companion is clickable as the same item, it blocks walking, and it is not a new item. So `__places.list()` stays at **23** (measured, same as before).

All ten items are kind B: things put up for an event, not a real shop's sign. The real shop signs in the file were left alone (another session owns them). This page has no gate board and no exhibition-wall header, so there was nothing else to rebuild (measured: `grep gate` in `index.html` and `landmarks-ximen.js` finds only the 天后宮 temple gate, which is kind A). The photo-topic headers come from `photowall.js`, through the kit's `headerTexture`.

The painted art is checked with `DESIGN.artStatus()` after load (measured, 2026-11-22):
- **Found and in use:** `posters/events/` orange-carnival-2024, jay-chou-signing-2004, backstreet-fest-2020, mayday-5th-anniv-2004, play-now-concert-2021. drag-festival-2025, lantern-festival-2017 and gatao-fanmeet-2025 are used through their new lit cases.
- **Missing, so the code-drawn fallback shows:** golden-horse-outdoor-2018 and rainbow-crossing-2019. The lead's re-check (`DESIGN.reloadArt()`) will pick them up when they land.

| # | Item (key) | What it was | Form, layout, mount | Why this form | Companion | Reference | Label |
|---|---|---|---|---|---|---|---|
| 1 | 春季橘子嘉年華・紅樓夜嗨祭 (`orange-carnival-2024`) | A game company's spring carnival on the Red House north plaza, 13:00–21:00, with a band and idol night show from 18:00 | Booth `carnival` (tent), layout `games`, palette `orange`, props: festoon bulbs and stage speakers | A one-day brand carnival is a tent with a backdrop, balloons, merch and a stage. A poster would lose the "carnival" feeling. | A-frame standee with the night-show line-up (怕胖團 · 幽靈水晶 CRYXTAL · 林潔心 · 忒修斯, 18:00), layout `concert` on a dark orange palette | https://www.nownews.com/news/6355149 | Event facts measured from the item's source. The booth look is inferred from booths.md §2. The festoon and speakers are a guess. |
| 2 | 國際變裝藝術節 × Color Taipei (`drag-festival-2025`) | Drag queens from across Asia performing at the Red House live house on Pride day, with shop offers 22–26 Oct | Statue, motif `heel` (platform heel and a ring of feather beads), plinth `drum`, cast plate carrying the story line | The object people remember from a drag night is the shoe and the feathers under a spotlight. The item's own marker brief asks for exactly that. | A row of four pole banners spelling DRAG (`banner`, layout `nightart`, a violet, pink and gold DRAG palette), and a lit case "亞洲變裝皇后 紅樓之夜 / QUEENS" (layout `nightart`) carrying the painted art | https://www.taiwannews.com.tw/zh/news/6225431 | Facts measured. Form and palette inferred. The painted face in the case is the lead's Midjourney art of an invented figure: guess that it resembles no real person. |
| 3 | 周杰倫《七里香》簽唱會 (`jay-chou-signing-2004`) | A new-album signing in Ximending on 14 Aug 2004 that drew thousands and jammed the traffic; he sang 七里香 | Booth `signing` (truss), layout `concert`, palette SUMMER (summer green, cream, violet), props: CD stacks, fan placards, queue barrier, speakers, camera flashes | A 2004 signing was a truss stage with a table of CDs, a queue barrier and fans' placards. The booth carries all of that. | A pasted advertising column (`column`, layouts concert, news, concert, street) with the "數千歌迷擠爆西門町 · 交通打結" news wrap | https://www.epochtimes.com/b5/4/8/14/n627582.htm | Facts measured from the source. The SUMMER palette is inferred from the album's season and campaign, not checked against the sleeve. |
| 4 | 2017 台北燈節 (`lantern-festival-2017`) | The lantern festival's first move west, 4–12 Feb 2017, along 西門, 中華路 and 北門; main lantern 小奇雞家族 (Year of the Rooster) | Installation `lantern`: a round creature lantern on a cart, a string of fish lanterns overhead, a vertical banner | A lantern festival is remembered by its glowing figure, so a lantern is the honest form. The lantern is the kit's invented creature, not the real chick family, so no character is copied. | A lit case "燈節首度移師西區 / 雞年" (layout `lantern`, variant 1) with the painted art | https://www.storm.mg/article/219678 · posters.md §7 recipe · booths.md §4.3 | Facts measured. Form inferred from the research. The creature does not look like the real chicks (measured in the shot: it has cat-like ears). The kit owns that shape. |
| 5 | 西門町後街文化祭 後街製造 (`backstreet-fest-2020`) | August 2020 street-culture festival in the film park: vinyl DJ sets (DJ Chicano), graffiti (Vastar), 90's bboyz breaking, skate lessons, Saturday open-air films | Booth `container` (a shipping-container pop-up), layout `street`, palette `hiphop`, props: speakers, balloons. Was a poster wall before this pass. | Street culture shows up as a container pop-up with a DJ rig, more than as a framed poster. Changing it also gives the film-park corner one booth, one installation and one billboard, instead of two walls 20 m apart. | A wall of pasted posters (`wall`: street, anime, street, concert) naming DJ CHICANO · VASTAR · 90'S BBOYZ and 每週六 露天電影 | https://www.taiwannews.com.tw/zh/news/3979310 | Facts measured. Form inferred. |
| 6 | 金馬影展 電影公園露天放映 (`golden-horse-outdoor-2018`) | 10–11 Nov 2018 open-air double bill in the film park, a tribute to 高畑勳 | Installation `screen`: a screen on a truss, deck chairs, a projector and its beam | An open-air screening is the screen and the chairs. People walk among them. | A hand-painted scaffold billboard (`billboard`, layout `painted`) "雙片連映 · 螢火蟲之墓 · 龍貓", in the 電影街 hand-painted tradition. The film titles appear only as text. No character is drawn. | https://www.storm.mg/article/567169 · posters.md §9 ref 43 (hand-painted billboards, https://www.taiwannews.com.tw/zh/news/5181683) | Facts measured. Billboard tradition measured from the research. Composition inferred. Art missing: the code-drawn fallback shows. |
| 7 | 西門6號出口彩虹地景 (`rainbow-crossing-2019`) | A six-colour rainbow with the word TAIPEI painted on the Exit 6 plaza, 25 Sep 2019 | Installation `arch`: a walk-through rainbow arch whose colours run on as stripes in the paving, with a small poster beside it | The real thing is a ground painting you stand on. The arch plus the ground stripes keep that, and add something to walk under. Moved 1.5 m so the Exit 6 station pillar no longer stands inside the arch. | none | https://www.marieclaire.com.tw/lifestyle/travel/45227 | Facts measured. The wording on the piece is kept to the place and the colours (六色 TAIPEI, EXIT 6 RAINBOW), with no political text. Art missing: the code-drawn fallback shows. |
| 8 | 五月天成軍五周年 (`mayday-5th-anniv-2004`) | An April 2004 mini concert for the band's fifth year, reported as fans packing the Red House | A wall of pasted posters (`wall`: concert, news, concert, street), palette `concert`, MAYDAY 5 / 歌迷擠爆紅樓 | 2004 gigs were announced on pasted bills and remembered through the next day's papers. The wall mixes both, with the painted art in the gig posters. | none: the wall already carries six posters and a newspaper front | https://news.tvbs.com.tw/life/497714 | Facts measured. Exact day not confirmed (from the item). Form inferred. |
| 9 | 《角頭－鬥陣欸》封街見面會 (`gatao-fanmeet-2025`) | 19 Aug 2025: the cast closed Movie Street for a fan meet, two days before release; the street was packed back to Exit 6 | Booth `fanmeet` (truss, step-and-repeat backdrop, red carpet, stanchions, fan placards), layout `premiere`, palette GANG (black, blood red, worn gold), props: camera flashes, barrier | A fan meet is a step-and-repeat wall, a carpet and a barrier with fans along it. | A lit poster case "角頭－鬥陣欸 / 鬥陣 / IN CINEMAS 8.21" (layout `premiere`, variant 1) with the painted art, like a film one-sheet outside a cinema | https://www.nownews.com/news/6721290 | Facts measured. The GANG palette is inferred from the film series' poster look, not checked. The painted figures in the case are the lead's Midjourney art: guess that they are not likenesses of the actors (needs a look). |
| 10 | PLAY NOW EP2 嘻嘻哈哈 (`play-now-concert-2021`) | A free hip-hop show on the Exit 6 plaza on 28 Feb 2021, part of the 西門PLAY樂購町 campaign, with OSN, 婁峻碩, 陳零九, 呂士軒, 王豔薇 and 陳忻玥; over ten thousand visits | Booth `stage` (stage deck, LED screen, moving heads, speaker stacks, light sticks), layout `concert`, palette NEON (black, acid green, hot pink, cyan), props: barrier, flashes | A free plaza show is a stage. The crowd barrier and the light sticks tell how full it was. | A standee with the line-up (layout `street`) carrying the painted art | https://www.mirrormedia.mg/story/20210301ent029 | Facts measured. Exact date inferred (from the item). Palette is a guess at a 2021 hip-hop flyer. |

## Neighbour check (form + layout)

- **Measured from the code:** no two neighbouring pieces share both form and layout.
- **Booths with the same layout:** the only booths that share a layout are jay-chou (concert) and play-now (concert). They are about 35 m apart, on opposite ends of the 中華路 side.
- **The film-park corner:** backstreet (booth, street), golden-horse (installation, premiere) and gatao (booth, premiere) are three forms or layouts in a row.
- **Before this pass:** backstreet and mayday were both poster walls.

## Compared with the rejected plates

The three rejected boards are in `docs/signage/rejected/`. Each is a rectangle with one title line, one date line, one font and a thin border.

Every piece here has these (measured in the shots):
- a structure: a truss, tent, container, stage, scaffold, drum plinth, column, case or arch
- a picture: painted art, a drawn graphic, a sculpture or a lit object
- at least three type sizes: head, big, kicker or date
- props that show what the event felt like: queues, placards, carpets, deck chairs, balloons, lanterns, flashes, banners

None reads as a plate. That reading is inferred from the shots, not checked by anyone else.

## Shots (`docs/signage/shots/ximen/`)

- `before-<key>.png`: the 10 pieces as the kit's curated defaults built them
- `after1-<key>.png` (all 10), `after2-*`, `after3-*`, `after4-*`: this pass
- `view-1.png` … `view-6.png`: the page's six viewpoints
- `panel-jay-chou-signing-2004.png`, `panel-backstreet-fest-2020.png`, `panel-drag-festival-2025.png`: `?place=<key>` panels
