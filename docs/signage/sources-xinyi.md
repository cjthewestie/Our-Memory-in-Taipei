# 信義: where each real sign comes from

CJ, 2026-11-22: 「每個招牌要根據他的作用跟含義還有真實的招牌去對應」, 「招牌可以用midjourney生成紋理」, 「繼續用力加速改」. This file lists every real sign in `remake/landmarks-xinyi.js` (shop fronts, building names, the village, the trail, wayfinding). The designed event pieces (DESIGN.* / PLACES.add design pieces) and the film and sale posters are not listed and were not changed.

Labels: **measured** = seen on a page or photo opened this session · **inferred** = general knowledge of the place, not opened this session · **guess** = no source. In this pass the web searches turned up no photo of the actual sign faces (results listed under Sources), so most rows are **inferred**. Next step: open news or Commons photos of each front and correct the colours. No logo mark is drawn: shop names are lettering only.

Types come from three helpers in the file: `rs('box')` is a backlit light box in a metal case with a lip, `rs('plate')` is a thin plate with four rivets, `rs('board')` is a framed wooden board, and `chan()` is channel letters (a lit face, stacked metal returns, an optional raceway). The materials are the Midjourney textures in `asset/textures/signs/`, applied through `DESIGN.signTexture`.

| # | Sign | Type | Material | Lettering | Reference | Label |
|---|---|---|---|---|---|---|
| 1 | 新光三越 A11, store name (new) | channel letters on a raceway, red faces | metal returns (code) | 新光三越 / SHIN KONG MITSUKOSHI, heavy sans | https://zh.wikipedia.org/zh-tw/新光三越 (the red store name is the chain's own) | inferred |
| 2 | A11 building code | channel letters, grey returns | metal | A11 | as above | inferred |
| 3 | 信義威秀影城 crown | channel letters, white faces, red returns, raceway | metal | VIESHOW CINEMAS / 信義威秀影城 | https://zh.wikipedia.org/zh-tw/信義威秀影城 | inferred (the red returns are a guess) |
| 4 | 威秀 marquee 現正熱映 | LED strip in a black case | neonback | amber sans, tracked | the usual multiplex marquee | guess |
| 5 | 威秀 ticket booth 售票處 | light box | lightbox, painted red | white sans | the usual multiplex booth | guess |
| 6 | 微風南山 BREEZE | channel letters, bronze returns | metal | BREEZE in a high-contrast serif (Didot) and 微風南山 NAN SHAN | https://zh.wikipedia.org/zh-tw/台北南山廣場 | inferred |
| 7 | 南山廣場 TAIPEI NAN SHAN PLAZA | channel letters | metal | sans | as above | inferred |
| 8 | ATT 4 FUN crown | channel letters, magenta returns, raceway | metal | ATT 4 FUN, black sans | https://zh.wikipedia.org/zh-tw/ATT_4_FUN | inferred (magenta is a guess) |
| 9 | ATT 4 FUN upright on the corner | tall light box, 0.32 m deep case | lightbox, dark face | ATT / 4 (pink) / FUN | as above | guess |
| 10 | ATT 2F skybridge plate | painted aluminium plate, rivets | tin | ← 新光三越 · 威秀 2F 空橋 SKYBRIDGE | the 信義 skybridge plates are dark with white lettering | inferred |
| 11 | east bridge plate ATT 4 FUN → | aluminium plate, lettered both sides | tin | sans | as above | inferred |
| 12 | 誠品 eslite (the store front) | lit letters on the dark panel | metal | lower-case serif eslite with 誠品信義店 under it | https://zh.wikipedia.org/zh-tw/誠品信義店 | inferred |
| 13 | 誠品 24H BOOKSTORE fascia | timber board under the wood canopy | teak | serif, cream | the store's wooden interiors | guess |
| 14 | 市府轉運站 | long light box, 0.3 m case | lightbox, transit blue | 市府轉運站 / Taipei City Hall Bus Station | https://en.wikipedia.org/wiki/Taipei_City_Hall_Bus_Station | inferred (no photo of the sign face found) |
| 15 | coach bay numbers 1–4 | small light boxes | lightbox, yellow | black sans numerals | the usual bus bay signs | guess |
| 16 | 統一時代百貨 | channel letters on a raceway | metal | 統一時代百貨 / UNI-USTYLE | same Wikipedia page (Uni-President runs the building) | inferred; the store's current name is unconfirmed |
| 17 | W on the hotel crown | channel letters | metal | a plain W and TAIPEI, not the hotel's logo artwork | https://en.wikipedia.org/wiki/W_Taipei | inferred |
| 18 | 四四南村 門牌, ten doors | enamel plates with rivets | enamel, blue | 松勤街 above, the number (2–20號) large, white border | the village is at 松勤街50號 (inferred). Blue-and-white enamel plates: https://www.taiwannews.com.tw/en/news/3669527 (New Taipei door plates) | guess on the even numbers 2–20 |
| 19 | 四四南村 / 信義公民會館 board | carved timber board on posts, both faces | teak | 四四南村 in 隸書, 信義公民會館 in 楷書, Xinyi Public Assembly Hall | https://zh.wikipedia.org/zh-tw/四四南村 | inferred |
| 20 | Taipei 101 entrance | brushed-metal letters on the stone lintel | metal | TAIPEI 101, tracked sans | https://zh.wikipedia.org/zh-tw/台北101 | inferred |
| 21 | damper plaque 風阻尼器 | etched brass plate, both faces | brass | 風阻尼器 / TUNED MASS DAMPER / 660 t · 5.5 m · 87–92F | the 660 t damper on floors 87–92 (inferred) | inferred |
| 22 | 象山親山步道 fingerpost | timber board, routed cream letters, both faces, now in front of its post | teak | 象山親山步道 → / Xiangshan Hiking Trail · 六巨石 | Taipei's 親山步道 signs are timber. Searched without a photo: https://travel.yam.com/article/131714 | inferred |
| 23 | 往山頂 約 20 分鐘 | timber board | teak | sans | as above | guess on the minutes |
| 24 | skywalk wayfinding pylon | backlit pylon box, lettered both sides | lightbox, dark face | 空橋 SKYWALK ↑ and five destinations | the dark 信義 skybridge pylons | inferred |
| 25 | 臺北市政府 (on the scale model) | gilt channel letters at model scale | metal | 臺北市政府 in 楷書, gold | https://zh.wikipedia.org/zh-tw/臺北市政府 | guess on the gilt |

Not changed: the coach's amber LED destination blind (an LED panel, not a sign board), the film posters, the 週年慶 / 冬季美妝 banners, the LED walls, the busker's chalkboard, the City Hall exhibition caption and every event piece.

## Searches run this session (no sign photo found)

- "Taipei 門牌 blue plate white text enamel house number plate design": https://www.taiwannews.com.tw/en/news/3669527
- "象山親山步道 指標 木製 牌": https://travel.yam.com/article/131714
- "市府轉運站 招牌 外觀 統一時代百貨 W Hotel": https://en.wikipedia.org/wiki/Taipei_City_Hall_Bus_Station, https://en.wikipedia.org/wiki/W_Taipei

## Screenshots (headless, `tools/places/check.mjs`, 2026-11-22)

`shots/xinyi-real-west.png` (A11, 新光三越), `xinyi-real-east.png` (BREEZE, 南山廣場, ATT 4 FUN), `xinyi-real-south.png` (eslite, bay numbers), `xinyi-real-bus.png` (skybridge plate, the 市府轉運站 box, bays), `xinyi-real-village.png` (門牌), `xinyi-real-board.png` (四四南村 board), `xinyi-real-t101.png` (TAIPEI 101), `xinyi-real-trail.png` (象山 fingerpost), `xinyi-real-pylon.png` (wayfinding pylon).
