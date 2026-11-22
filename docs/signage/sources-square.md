# 廣場 (square): where each real sign comes from

CJ, 2026-11-22: 「每個招牌要根據他的作用跟含義還有真實的招牌去對應」, 「招牌可以用midjourney生成紋理」, 「繼續用力加速改」. This file covers the real signs of real places in `remake/landmarks-square.js` (the designed event pieces are in `designs-square.md` and were not touched).

Labels: **measured** = read on a page opened this session or seen in a screenshot taken this session; **inferred** = a reading of that evidence, or general knowledge of Taipei signs of that kind and era that was not checked against a photo this session; **guess** = no source.

How they are built: one new helper, `real(type, material, w, h, letter, o)`, draws the face with `DESIGN.signTexture` on the Midjourney materials in `asset/textures/signs/`, then gives the sign its true body: `box` (a light box: the face in a deeper steel case with a drip cap on top, lit), `plate` (an enamel, tin or brass plate with a rivet at each corner), `plaque` (a carved board in a raised frame), `stone` (characters cut and filled in a slab), `neon` (tubes on a dark backing panel on stand-off brackets). The lettering helper `ink()` adds carved, neon, stroked and shadowed lettering. The fonts follow `landmarks-ximen.js`: 圓體 (YUAN) on acrylic light boxes, 楷書 (KAI) on carved and painted boards.

## Searches run (2026-11-22)

| # | URL | What it gave |
|---|---|---|
| Q1 | https://www.cna.com.tw/culture/article/20200424w002 | Search hit: 木柵線 opened 1996-03-28 as Taipei's first MRT line, end station 動物園. No photo of the 1996 station signs was found (measured: the search summary says so) |
| Q2 | https://travel.taipei/en/attraction/details/537 | Search hit: 臺北市立動物園 opened at 木柵 on 1986-10-31. No photo of the gate lettering was found (measured, search summary) |
| Q3 | https://en.wikipedia.org/wiki/Daan_Forest_Park | Search hit: the park opened 1994-03-29. No source for the name stone's wording or calligraphy was found (measured, search summary) |
| Q4 | https://en.wikipedia.org/wiki/Taipei_bus | Search hit: the 聯營 joint bus system began in 1977. No photo of 1980s–90s stop signs was found (measured, search summary) |

Because the searches did not return sign photos, the shapes below rest on general knowledge, and every one is labelled **inferred** or **guess**. A follow-up pass should open Wikimedia Commons photos for the MRT, the zoo gate and the park stone.

## Signs rebuilt (19 `real(` calls in the file, measured by `grep -c "real('"`)

| Sign | Type | Material | Lettering | Reference | Label |
|---|---|---|---|---|---|
| MRT station name fascia 捷運木柵線 | light box, one face, steel case | lightbox | black 圓體 name and English on white, a brown band under it. The museum caption "MUZHA LINE · 1996" was removed | Q1 for the line name; the white face and dark name follow Taipei MRT station boards | inferred |
| MRT platform direction box 往 動物園 → | light box, hung on two rods | lightbox | white on a dark face, a yellow arrow | Q1 (動物園 is the end station) | inferred |
| MRT entrance box 捷運 出入口 / MRT ENTRANCE | light box, two faces, under the entrance frame | lightbox | a brown block with 捷 in it, then the name. No operator logo is drawn | general knowledge of MRT entrance boxes | inferred |
| MRT entrance pylon 捷運 / MRT | deep (0.3 m) square light box on a post | lightbox | 捷運 down a brown face in white 圓體 | as above | inferred |
| MRT ticket machine 售票 / TICKETS | small light box | lightbox | white on blue | general knowledge | guess |
| MRT line map footer | painted panel (kept) | canvas | the caption "1996.3.28 通車 · 臺北第一條捷運" became "往 動物園 → To Taipei Zoo" | Q1 | inferred |
| YouBike kiosk head | light box on the kiosk | lightbox | "YouBike 微笑單車" in plain type on orange, no logo | the name as text is the real service's name | inferred |
| 臺北市立動物園 gate name | carved board in a raised frame (匾額) | teak | gilt 楷書, carved and shadowed, "TAIPEI ZOO" under it | Q2 for the name. The real 1986 gate's lettering style was not found | guess |
| Zoo 售票處 | light box | lightbox | cream on red | general knowledge | guess |
| Night-market stall uprights (4 dishes) | upright light boxes, deeper case | lightbox | each stall's colours, 圓體 down the face | general knowledge of Taiwan night-market carts | inferred |
| Night-market arch 夜市 / NIGHT MARKET | neon tubes on a backing panel | neonback | red tube 夜市, cyan tube English, a yellow tube border | general knowledge of lit night-market arches | inferred |
| Garbage truck side panels (2) | riveted tin plate | tin | 垃圾不落地 in green 楷書, 臺北市政府環境保護局 under it, a green band | 垃圾不落地 is Taipei's real 1990s policy name; the bureau line is inferred | inferred |
| Convenience store fascia 巷口便利店 (invented shop) | long light box, one face, steel case | lightbox | invented name in heavy 黑體, a 24H disc, colour bands. The doubled "CORNER STORE" line was a bug and was removed. No chain's logo or colour set is copied | general knowledge of 1990s Taipei chain-store fascias | inferred |
| Public phone booth 公用電話 | light box, two faces | lightbox | blue 圓體 on white, a red base line | general knowledge of booth headers | inferred |
| 大安森林公園 name stone | characters cut into a slab | stone | red-filled cut 楷書, "DAAN FOREST PARK" cut under it. The museum caption "· 1994" was removed | Q3 for the name. Red-filled cut characters are common on Taiwan park stones; this park's real stone was not found | guess |
| Breakfast shop board 晨光早餐店 (invented shop) | long red light box, one face, steel case | lightbox | white 圓體, yellow slash stripes at both ends, the menu line | general knowledge of Taiwan 早餐店 fronts | inferred |
| Bus route plates on the bus (2) | riveted enamel plate | enamel | the route number in a red disc, 廣場 — 動物園 | general knowledge | inferred |
| 臺北車站 model: facade name | carved board | lacquer | gold 楷書 臺北車站 | the real 1989 station shows its name in gold on the front (general knowledge) | inferred |
| 臺北車站 model: plinth plate | engraved brass plate with rivets | brass | dark engraved name and the model caption | a model plinth carries a caption, so this one keeps it | inferred |
| 圓山 viewer board ↗ 圓山大飯店 | riveted enamel plate | enamel | the painted view and its caption, kept | general knowledge of scenic-view boards | inferred |

## Not rebuilt (left as they were)

- The round pink bus-stop discs (`stopSign`, the `disc()` helper): still flat canvas discs on a rim. Inferred: they would be enamel.
- Small labels inside shops (menu boards, the 今日特餐 chalkboard, the 茶葉蛋 and 關東煮 tags, the 報紙 rack, the recycling-bin labels, the 慢跑步道 post, the 歡迎光臨 and 代收水電費 stickers, the 聯營公車 and 上車投現 decals on the bus, the train's 動物園 destination). They are small, and they were already the right kind of thing.

## Shots (headless, `tools/places/check.mjs`, fixed camera through `__remake.VIEWS`)

`docs/signage/shots/square-real/`: `before-*.png` (4, follow camera) and `after-bfast.png`, `after-cvs.png`, `after-zoo.png`, `after-mrt.png`, `after-nm.png`, `after-gt.png`, `after-phone.png`, `after-bus.png`, `after-tms.png`, `after-daan.png`, `after-ys.png`, `after-breakfast-shop.png`, `after-convenience-store.png`. Every run printed `__places.list().length` = 24 and no exception or log error (measured).
