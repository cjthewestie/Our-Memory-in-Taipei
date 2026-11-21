# Check: real signs in dadao, xinyi, square (2026-11-22)

Checker pass after the three builders. Every viewpoint (keys 1–6) of `remake/dadao.html`, `xinyi.html` and `square.html` was shot headless with `tools/places/check.mjs` and read. Shots are in `docs/signage/shots/check-real/`: `r1-*` before the fixes, `r2-*` after them. `*-12-stack.png`, `*-34-stack.png` and `*-56-stack.png` put two viewpoints in one image.

Command: `scratchpad/shoot.sh r2`, which runs `node tools/places/check.mjs "http://localhost:8821/remake/<page>.html?view=<1-6>" <png> --ms=40000 --settle=3000 "--eval=({n:__places.list().length,v:__remake.VIEWS.length})"`.

## Counts and console (measured, r2)

| Scene | `__places.list()` | Console errors | Exit |
|---|---|---|---|
| dadao | 23 (unchanged) | none | 0 on all 6 views and 3 close-ups |
| xinyi | 25 (unchanged) | none | 0 on all 6 views |
| square | 24 (unchanged) | none | 0 on all 6 views and 1 close-up |

## dadao

| View | Real signs seen | Result | Shot |
|---|---|---|---|
| 1 archway | cloth banners 南北貨 · 恭賀新禧 · 年貨大街 · 大吉大利 · 食品, 義美 vertical | pass | r2-dadao-12-stack.png (top) |
| 2 新芳春茶行 | vertical sign on brackets, plaque 行茶春芳新 read right to left, 中藥行 vertical, price card | pass | r2-dadao-12-stack.png (bottom) |
| 3 霞海城隍廟 | 合安 vertical, festival banners (design pieces). The temple's own plaque is not in this frame | pass (plaque not seen) | r2-dadao-34-stack.png (top) |
| 4 乾元 · 屈臣氏 | black and gilt plaque 乾元參藥行 read right to left, red vertical (a lantern hides its first character), 屈臣氏大藥房 and A.S. WATSON & CO. in relief, 小藝埕 ArtYard | pass | r2-dadao-34-stack.png (bottom) |
| 5 戲苑 · 慈聖宮 | 大稻埕戲苑 board and vertical, 永樂市場 vertical, 慈聖宮 plaque read right to left | pass | r2-dadao-56-stack.png (top) |
| 6 lane to the water gate | 大稻埕碼頭 enamel plate (all five characters visible), 小藝埕 vertical, BOLERO neon cut by the frame edge | pass | r2-dadao-56-stack.png (bottom) |
| close-up, gate | the two 5 numerals | was fail (flat, no kind), now pass | r2-dadao-gate.png |
| close-up, container market | 貨櫃市集 PIER 5 | was fail (flat board), now pass | r2-dadao-pier5.png |
| close-up, counters | 啤酒 · 小吃, 咖啡 · 冰品 | was fail (flat labels), now pass | r2-dadao-counters.png |

## xinyi

| View | Real signs seen | Result | Shot |
|---|---|---|---|
| 1 tower through the skywalk | VIESHOW CINEMAS 信義威秀影城 channel letters, TAIPEI 101 letters, wayfinding totem. The vertical 新光三越 at top right is too far to read | pass | r2-xinyi-12-stack.png (top) |
| 2 forecourt | TAIPEI 101 letters over the mall door | pass | r2-xinyi-12-stack.png (bottom) |
| 3 四四南村 | enamel door plates 松勤街 4號, wooden 四四南村 board | pass | r2-xinyi-34-stack.png (top) |
| 4 east side | BREEZE 微風南山, 南山廣場, ATT 4 FUN neon box, 統一時代百貨 | pass | r2-xinyi-34-stack.png (bottom) |
| 5 威秀 | VIESHOW channel letters, COMING SOON light box. A large 新光三越 board at left sits half behind the stair; it comes from xinyi.html, not landmarks-xinyi.js | pass (possible duplicate name) | r2-xinyi-56-stack.png (top) |
| 6 south side | 統一時代百貨 UNI-USTYLE (the page's title text covers part of it), eslite 誠品信義店, 空橋 SKYWALK | pass | r2-xinyi-56-stack.png (bottom) |

## square

| View | Real signs seen | Result | Shot |
|---|---|---|---|
| 1 the gate | mostly design pieces. Real: station and street signs in the distance | pass | r2-square-12-stack.png (top) |
| 2 | 冷氣開放 vertical, 蚵仔麵線 stall board, barber pole | pass | r2-square-12-stack.png (bottom) |
| 3 | MRT and MUZHA LINE signs, 售票 TICKETS, night-market stall boards | pass | r2-square-34-stack.png (top) |
| 4 overview | too far to judge any lettering | n/a | r2-square-34-stack.png (bottom) |
| 5 zoo gate and station | 臺北市立動物園 TAIPEI ZOO plaque, 售票處 TICKETS, 捷運木柵線 strip | pass | r2-square-56-stack.png (top) |
| 6 | 便利店 light box, 慢跑步道 park sign, enamel route plate on the bus | pass | r2-square-56-stack.png (bottom) |
| close-up, bus stop | round route plates 0 · 12 · 廣1 | was fail (plain canvas), now pass | r2-square-busstop.png |

## Rebuilt in this pass (9 signs)

| Sign | Scene | Type | Material | Reference | Label |
|---|---|---|---|---|---|
| 5 numeral ×2, water gate | dadao | painted numeral in heavy sans on the gate pier | stone | none opened | guess |
| 貨櫃市集 PIER 5 | dadao | light box in a steel case on the container | lightbox | none opened | inferred (container markets use light boxes) |
| 啤酒 · 小吃, 咖啡 · 冰品 | dadao | small counter light boxes | lightbox | none opened | inferred |
| route plates 0 · 12 · 廣1 | square | round painted tin plate, clamped to its pole with a steel band | tin | none opened | guess (colour kept from the builder) |
| 動物園 destination, Muzha train | square | small backlit destination box behind the windscreen | lightbox | none opened | guess |

These rows belong in `sources-dadao.md` and `sources-square.md`, which this checker was not allowed to edit.

## Still open

- No shot shows the train's 動物園 destination box. It is rebuilt, but nobody has seen it (unverified).
- The bus-stop plates are readable but paler than before in strong backlight (measured in r2-square-busstop.png). The likely cause is the 84% pink tint over light tin plus the glow (inferred).
- The 5 numerals sit on a grey stone square that is darker than the beige pier, so they read as a plate rather than paint (measured in r2-dadao-gate.png).
- xinyi may show 新光三越 twice on A11 (landmarks-xinyi.js and xinyi.html). This needs a decision in xinyi.html.
- Not in any viewpoint, so not checked: 林合發油飯店, the 市府轉運站 light box, the 霞海城隍廟 plaque.
- I caused a regression and fixed it: a `//` comment I added to square's train line hid the `}` that closes its `if`. square.html failed to load on one run (SyntaxError). It was fixed and re-run, and all six views passed.
