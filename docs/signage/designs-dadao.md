---
title: 大稻埕 designs for the site's own furniture (kind B)
kind: design decisions
updated: 2026-11-22
---

# 大稻埕: one designed piece per event, never a plate

CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」, then 「招牌可以用midjourney生成紋理 或海報更換所有的招牌或有字的牌子直到他們有質感跟好看」.

The code is in `remake/landmarks-dadao.js`: the `DADAO_DESIGNS` table at the top, the `PLACES.add` calls near the end, and `eventProps()`, which adds the second layer of props round each piece. The gate, quay and market boards are in `remake/dadao.html` (`DADAO_BOARDS`). Each poster uses the painting at `asset/textures/posters/events/<key>.jpg` once it exists. Until then the code-drawn poster shows. All lettering is set in code.

Labels: **measured** = read in a file, a source or a screenshot. **inferred** = my reading of that evidence. **guess** = no evidence.

## The pieces, street order from the archway north

| # | Item | What it was | Form, layout, mount | Why this form | Reference | Label |
|---|---|---|---|---|---|---|
| 1 | Archway board 年貨大街 (gate) | The street's own gate at the archway | A gate board of red lacquer: the painting `posters/gates/dadao.jpg` in the middle panel; side panels with the couplet words 恭賀新禧 and 大吉大利; the name in carved gold Weibei lettering with a shadow; a tracked Latin line; a ribbon reading 大稻埕 · 一九九六起; two round seals; gold corner bosses | A gate is a gateway, not a shop. New Year gates and arches are built as couplet frames in red and gold | posters.md §7 (lantern festivals: red and gold, couplet framing) | Look: measured (shot `dadao-view1.png`). Motif choice: inferred |
| 2 | new-year-goods-street | 迪化街年貨大街, held every year before Lunar New Year since 1996 | **Booth**, `market`. Tent and lanterns, a printed header 迪化年貨, a poster of the goods grid, a counter skirt, feather flags, jars, goods and the seller's **sample tray** (試吃) on the counter | People remember the stall, the sacks and the sample trays held out to them, not a sign | https://zh.wikipedia.org/zh-tw/迪化街 · https://www.gvm.com.tw/article/127283 | Stall look: measured (data file `visual`, from a 2018 Commons caption). Sample tray: inferred |
| 3 | dihua-shophouse-rows (exhibit board) | 77 historic shophouses saved under the 1995 plan, after the fight against the 1977 road-widening plan | **Poster**, `news` in a lit `case`. A newspaper front page (headline 迪化街保住了, kicker 77 棟歷史街屋, halftone photo, columns, a red EXTRA stamp) | The rescue of the street was won in the papers. A front page tells the story, and the road line on the forecourt shows the width the road would have had | https://zh.wikipedia.org/zh-tw/迪化街 | Story: measured (data file). Newspaper as the form: inferred |
| 4 | city-god-procession | 霞海城隍遶境 on the 13th day of the 5th lunar month, recorded since 1879 | **Poster**, `lantern`, `banner` mount: four procession pole banners spelling **五月十三** in red, gold, green and cream, each with the tall-and-short generals (七爺八爺) drawn on it. Beside them: the procession drum on its stand, a brass gong, and red firecracker paper over the forecourt | A procession is marked by its flags (頭旗) and its noise. A row of banners reads as the start of a procession. A statue already stands next to it (月老), so a second statue would repeat it | https://zh.wikipedia.org/zh-tw/臺北霞海城隍廟 | Date: measured. Flags, drum and firecrackers: inferred (data file: "drum and gong troupes, firecracker smoke", inferred there) |
| 5 | yuelao-matchmaker-crowds | The queue for 月下老人 at 霞海城隍廟 (worshipped here since 1971; a viral school-trip video in 2025) | **Statue**, `thread` motif on a `drum` plinth: two bronze figures joined by a red thread, a cast plate (一條紅線，排到騎樓外的人潮). Beside it: a **queue** of brass posts and red rope, and a tray of red-thread packets on a low table | What people remember is the thread and the queue. A statue holds the thread, and the rope holds the queue | https://zh.wikipedia.org/zh-tw/臺北霞海城隍廟 · https://udn.com/news/story/120912/9101135 | Crowd: measured (2025 report in the data file). Packets: inferred |
| 6 | film-twa-tiu-tiann-2014 | 電影《大稻埕》, a time-travel comedy back to the 1920s, released 2014-01-30 for the New Year season | **Poster**, `painted` on a scaffold `billboard` with floodlights. Its own palette (dusk violet, orange, gold). Kicker 穿越回到一九二〇, venue strip 2014.1.30 春節檔 全台上映. Beside it: a **clapperboard** (title, roll A7, scene 1920, take 3, release date) and a **film camera on a tripod** pointed at the street | A film set in 1920s Dadaocheng belongs to the time of hand-painted cinema billboards. The slate and the camera say it was filmed on this street | https://zh.wikipedia.org/zh-tw/大稻埕_(電影) | Release date: measured. Painted billboard and props: inferred |
| 7 | tttifa-arts-festival | 大稻埕國際藝術節, every October; the 1920 costume parade ends at 永樂廣場 | **Poster**, an advertising `column` pasted with `deco`, `premiere` and `memory` posters (a 1920s Morris column). Beside it: a **face-in-hole board** of a gentleman (boater, three-piece suit, cane) and a lady (cloche hat, fringed drop-waist dress, parasol), with a 1920 band and 探出頭來拍一張 | The festival is about dressing up as the 1920s. Advertising columns and Art Deco posters were the street furniture of that decade. The face-in-hole board is the photo spot from the data file (`marker.depicts`) | https://www.cna.com.tw/news/acul/202510120144.aspx · https://www.accupass.com/event/1607201412491932333344 | Parade and costumes: measured. Column and deco: inferred |
| 8 | solitary-gourmet-yongle | 《孤獨的美食家》 season 5: 五郎 eats at 永樂市場 (chicken rice; 旗魚米粉) | **Booth**, `food`, `memory` layout. Off-white and ink palette with a red seal, like the show's own plain posters. Header 一人份, kicker 雞肉飯 · 旗魚米粉, bowl motif, grey photos on the back wall, a menu board, bowls and stools | The episode is one man eating alone at a market counter. A food stall with the menu, bowls and empty stools is the scene itself | https://zh.wikipedia.org/zh-tw/孤獨的美食家_(電視劇) · https://supertaste.tvbs.com.tw/pack/347055 | Dishes: measured. Show-poster palette: guess |
| 9 | Quay board 大稻埕碼頭 | The quay's own board on its two posts | A river print: a cream panel with the name, a red vertical tag 淡水河, DADAOCHENG WHARF tracked, a timeline 1860s 茶葉出港 ─ 2005 親水碼頭 ─ 五號水門, and the painting `posters/topics/wharf.jpg` (a junk at sunset until it lands) | The wharf's history is tea leaving by boat. The board says it in the print, not as a name plate | data file `dadaocheng-wharf` (`years`) | Measured (shot `ev-fireworks.png`: the painting loaded) |
| 10 | dadaocheng-fireworks | 大稻埕情人節煙火 / 夏日節, around Qixi, running by 2006; crowd between water gates 3 and 5 | **Installation**, the firework `burst` sculpture, `nightart` band (七夕, 夏日節), river palette. Beside it: two **picnic mats** and a **cool box** with cans | You wait on the quay for dark. A burst you can walk round, with the mats people sit on | https://www.epochtimes.com/b5/6/8/26/n1435221.htm · https://udn.com/news/story/7323/9650967 | Crowd and gates: measured. Mats: inferred (data file: "picnic mats", inferred there) |
| 11 | pier5-container-market | PIER5 貨櫃市集, opened 2018-04-01: white containers, a live-music stage, the river | **Booth**, `container`, `concert` layout (a gig poster at sunset). The container is now **white**, as measured. Mic motif, festoon bulbs, speakers | It was a container market with music. The booth is a container, and the gig poster and speakers carry the music | https://supertaste.tvbs.com.tw/travel/309332 | White units: measured. Gig poster: inferred |

**Neighbours never share a form and layout** (measured in the code): archway booth (market) · exhibit case (news) · forecourt banners (lantern) and statue (thread) · film billboard (painted) · deco column · food booth (memory) · quay installation (nightart band) · container booth (concert).

## The real signs (kind A) on the same street

Every `label()` and `hang()` board in `landmarks-dadao.js` is now made of a material instead of a flat colour. Its old flat colour picks the material through `MAT_OF`: black → lacquer, red → red lacquer, green → weathered board, grey relief → stone, cream → paper, blue → enamel. The lettering is set on top with a cut shadow (measured in `view4.png`: 乾元參藥行 and 屈臣氏 now show the material).

The 永樂市場 board in `dadao.html` is an enamel plate with white Song lettering and 布業商場 · 1908. The New Year cloth banners draw on the `cloth` material.

## Shots (all from `tools/places/check.mjs`, headless)

- Every viewpoint: `docs/signage/shots/dadao/view1.png` to `view6.png`, plus `dadao-view1.png`, which shows the archway gate.
- Close-ups: `ev-newyear.png`, `ev-dihua-news.png`, `ev-citygod.png`, `ev-yuelao.png`, `ev-film.png`, `ev-tttifa.png`, `ev-solitary.png`, `ev-fireworks.png`, `ev-pier5.png`.
- Panels (`?place=`): `panel-tttifa.png`, `panel-citygod.png`, `panel-fireworks.png`.

## Against the rejected plates (`docs/signage/rejected/*.png`)

The rejected plates had one title line and one date line in one font, a thin border, and nothing to look at (measured in those shots). Every piece above has a picture layer, at least three type sizes, a mount, frame or plinth, and props that tell the event: drum, rope queue, clapperboard, camera, face-in-hole board, mats and the sample tray (inferred, from the shots). None is a one-title rectangle.

## Open points

- The painting at `posters/events/film-twa-tiu-tiann-2014.jpg` shows realistic faces (measured in `ev-film.png`). If they look like the film's real actors, that breaks the rule against likenesses. The lead should check that art (guess: it may resemble the cast).
- The cloth banners in `dadao.html` draw their material outside a repaint hook. They pick up `signs/cloth.jpg` only on the next page load, not the moment it lands (inferred from the code).
