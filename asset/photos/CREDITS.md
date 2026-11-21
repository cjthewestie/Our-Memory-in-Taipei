# Photographs on the page — credits and licence obligations

Two photographs pass faintly over the frame just past the chapter markings (`app.js`, `PHOTO_SRC`): the opacity follows the scroll (a 0.03-of-progress window, peak 0.25), and each one's caption and credit are drawn top-right under the site title for as long as the picture shows, fading with it and legible at its peak (ink on a paper pill, 0.75 opacity). CJ, 2026-09-24, wants this first pair replaced by warm, crowded frames (「溫馨熱鬧」); when sonnet-photos delivers them, the rows below change with the files. The originals, and every other candidate that was checked, are in `research/photos/` with the licence read on each item's own page (`research/photos/README.md`). CJ, 2026-09-24, on the share-alike terms: 「ok」.

| File | Shown at | What it is | Rights holder | Source | Licence | What the page did to it |
|---|---|---|---|---|---|---|
| `chunghwa-1961.webp` | the 2000 marking (scroll 0.347, Ximending → Dadaocheng) | 中華商場 the year it opened, 1961: the building photograph from the opening-ceremony newspaper page (北市中華商場昨舉行落成禮) | 凃柏辰 / 內容力有限公司 @ 國家文化記憶庫 | [tcmb.culture.tw, item 301814](https://tcmb.culture.tw/zh-tw/detail?indexCode=Culture_Object&id=301814) | CC BY 3.0 TW and later (創用CC姓名標示 3.0 台灣及其後版本) | cropped to the building photograph out of the full page (the columns of newsprint are not shown), converted to greyscale, softened 1 px to turn the halftone dots into tone, contrast stretched 1%, saved as webp. 766×616, 154,000 bytes |
| `yongle-2012.webp` | the 2020 marking (scroll 0.582, Dadaocheng → Xinyi) | 永樂市場's west side on Dihua Street, 2012, with the 2.3樓永樂布業商場 board | 玄史生 (Wikimedia Commons user) | [Wikimedia Commons, Yongle_Market_West_Side_20120129.jpg](https://commons.wikimedia.org/wiki/File:Yongle_Market_West_Side_20120129.jpg) | CC BY-SA 3.0 Unported (also GFDL 1.2+) | cropped to the top 71% (the parked cars along the bottom are out), resized from 4608×2450 to 1600×851, saved as webp. 149,878 bytes |

Both files together: 303,878 bytes. The page fetches them from its own `asset/photos/`; nothing is hotlinked.

## What the licences require of the page

- **CC BY 3.0 TW (中華商場)** requires attribution: the credit `photo 凃柏辰 / 內容力有限公司 @ 國家文化記憶庫 · CC BY 3.0 TW` is on screen with the picture, and the crop and greyscale treatment are described above as the adaptation they are.
- **CC BY-SA 3.0 (永樂市場)** requires attribution the same way (`photo 玄史生, Wikimedia Commons · CC BY-SA 3.0`) **and is share-alike**: the cropped, resized webp is an adaptation of the photograph, and an adaptation of a CC BY-SA work has to be offered under the same licence. What that means for this repo: `asset/photos/yongle-2012.webp` is CC BY-SA 3.0, whoever downloads it from the page may reuse it under those terms, and if the page itself is ever licensed as a whole, that file is carried at CC BY-SA 3.0 regardless. It does not put the page's code or its other assets under CC BY-SA. The CC0 alternative for the same crossing, `research/photos/candidates/dihua/dihua-1919-tcmb.jpg` (a modern documentation photo of one shophouse bay), is one path change in `PHOTO_SRC` away if this obligation is ever unwanted.

## Not used

Every other candidate in `research/photos/candidates/` stays there for the click-to-see-the-real-place feature (issue #17) and is not served by the page.
