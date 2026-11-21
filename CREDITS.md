# Credits

Everything on this page that someone else made, who made it, and what its licence asks of us. The same list is on the page itself: the **Credits** button top-right (bottom-right on a phone) opens it, in the square, in the three streets and in the guided tour (`?tour=1`).

Checked 2026-11-01 against each item's own source page. Per-file detail lives beside the files: `asset/photos/CREDITS.md`, `asset/photos/hotspots/CREDITS.md`, `asset/music/CREDITS.md`, `asset/fonts/OFL-*.txt`.

## Photographs

Eight photographs of the real places sit behind the street markers; two of the same photographs also pass over the guided tour. All are resized for the screen; the 1961 frame is also cropped out of its newspaper page and turned grey.

| What | By | Licence | Source |
|---|---|---|---|
| Chunghwa Market 中華商場, 1961 (markers + tour) | 凃柏辰, archived by 內容力有限公司 @ 國家文化記憶庫 | CC BY 3.0 TW and later | https://tcmb.culture.tw/zh-tw/detail?indexCode=Culture_Object&id=301814 |
| Ximen Red House 西門紅樓, 2019 | 毛貓大少爺 | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Octagon_Building,_Red_House_Theater.jpg |
| Wannian Commercial Building 萬年大樓, 2008 | Tianmu peter | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Wan_Nian_Commercial_Building_20080805.jpg |
| Dihua Street 迪化街, 2011 | 玄史生 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Dihua_Street_Lunar_New_Year_20110203a.jpg |
| Xiahai City God Temple 霞海城隍廟, 2012 | 玄史生 | CC BY-SA 3.0 (or GFDL 1.2+) | https://commons.wikimedia.org/wiki/File:Hsiahai_City_God_Temple_Front_20120129.jpg |
| Yongle Market 永樂市場, 2012 (markers + tour) | 玄史生 | CC BY-SA 3.0 (or GFDL 1.2+) | https://commons.wikimedia.org/wiki/File:Yongle_Market_West_Side_20120129.jpg |
| Dadaocheng Wharf 大稻埕碼頭, 2014 | 李家宇 (LegoLee) | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:大稻埕碼頭.JPG |
| Taipei 101 under construction, 2003 | lienyuan lee | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:興建中的台北一零一_Taipei_101_Under_Construction_-_panoramio.jpg |

**What this asks of us, in plain words.** Every one of these needs the photographer's name, the licence and a link next to the picture: the page does that in each photo panel and in the Credits list. The four CC BY-SA ones are "share-alike": our resized copies of those four photos have to stay under the same CC BY-SA licence, so anyone may reuse those image files on the same terms. That covers the image files only. It does not put the page's code, the 3D models or a client's paid build under CC BY-SA, and it does not stop us charging for the page.

## Music

- **YouTube music videos.** Over http the music bar plays eight official music videos through YouTube's own embedded player (望春風, 台北的天空, 我的未來不是夢, 大約在冬季, 吻別, 心太軟, 七里香, 後來的我們; video ids in `music.js`). We host no copy; the rights stay with the labels and artists, and the bar names the song, artist and YouTube channel while each plays.
- **The offline loops** (Neon Arcade, Letters Home, Night Market Slow Jam, Skyline Pulse) were synthesised in this repository by `asset/music/gen/make-tracks.js` and are released under CC0: no credit needed, none owed.
- **CJ's own bought copies** (`asset/music/private/`) are never committed or served; they are for his own machine only.

## Typefaces

| Font | By | Licence |
|---|---|---|
| Barlow, Barlow Condensed | The Barlow Project Authors (github.com/jpt/barlow) | SIL Open Font License 1.1 |
| Chocolate Classical Sans | The Chocolate Classical Sans Project Authors (github.com/MoonlitOwen/ChocolateSans) | SIL Open Font License 1.1 |

The OFL allows commercial use, self-hosting and cutting the font down to the letters we use, as long as the licence file travels with the font files (it does: `asset/fonts/OFL-*.txt`) and we never sell the font on its own.

## Code and 3D

| What | By | Licence |
|---|---|---|
| three.js r149 (`three.min.js`, `asset/3d/three.min.js`) and GLTFLoader r147 | three.js authors | MIT |
| meshoptimizer decoder (`meshopt_decoder.js`) | Arseny Kapoulkine | MIT |
| Street props library, 台北懷舊 3D 素材庫 (`asset/3d/`) | a teammate, for this project | no licence file yet (see below) |
| Buildings, the girl, painted textures, the square (`asset/blender/`, `asset/paint/`, `asset/models/`, `asset/textures/`) | made for this page | ours |

MIT asks only that the copyright notice stays inside the files, which it does.

## Open questions before a paid build (needs CJ)

1. **YouTube player hidden.** `music.js` keeps the YouTube player "clipped to nothing and transparent" and shows our own audio bar instead. YouTube's API rules ask that the player stays visible and is not used as audio only. Fine for a private pitch on CJ's laptop; for a client's paid, public build either show the video box, or license the songs, or ship the CC0 loops only.
2. **The teammate's props library has no written licence.** `asset/3d/` was committed by an "unknown" author with no LICENSE. Before a paid build, get one written line from the teammate (for example "MIT" or "CJ may use and sell this").
3. **Real brand names drawn into props.** The props library writes `淘兒音樂城 TOWER`, `張君雅小妹妹 手打麵`, `NOKIA · Sony Ericsson` and an `F4 流星花園` poster, and the Ximending street places them (`scene-red.js`). Period-accurate, but a paid build for a client should swap them for made-up names or get permission.
4. **1961 newspaper photograph.** The archive (國家文化記憶庫) grants CC BY 3.0 TW on its scan. The original 1961 newspaper photograph is most likely out of copyright in Taiwan by now (50 years after publication for a work owned by a company), but that is an inference, not a checked fact.
