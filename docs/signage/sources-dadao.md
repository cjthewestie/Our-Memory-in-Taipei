---
title: 大稻埕 real signs, where each comes from
kind: sources
updated: 2026-11-22
---

# 大稻埕 real signs: type, material, source

CJ, 2026-11-22: 「每個招牌要根據他的作用跟含義還有真實的招牌去對應」, 「招牌可以用midjourney生成紋理」, 「繼續用力加速改」. This file covers the real signs (kind A) in `remake/landmarks-dadao.js` only. The designed event and topic pieces (`DADAO_DESIGNS`, `PLACES.add ... design`) are untouched.

Labels: **measured** = read on a page opened this session; **inferred** = a reading of evidence, or general knowledge of the type and era not opened this session; **guess** = no source.

## How the signs are built now

`landmarks-dadao.js` follows the `landmarks-ximen.js` standard: brush lettering (`KAI` 楷書, `WEI` 魏碑, `LI` 隸書, `XING` 行書), one `kind` per sign, each on a Midjourney material from `asset/textures/signs/` through `DESIGN.signTexture`.

| kind | Built as | Default material |
|---|---|---|
| `plaque` 匾額 | thick board, raised frame on both faces (gilt, or wood/red via `frameMat`), carved shadowed characters, `rtl` for pre-1970s and temple boards | lacquer |
| `box` 燈箱 | 0.2 m deep box, steel case and folded rim, acrylic panel seams, bright glow | lightbox |
| `neon` | dark backing panel, tube-stroke letters with halo, four stand-off clips | neonback |
| `cloth` 布條 / 布旗 | segmented plane that sags and ripples, hem stitching, ties | cloth |
| `enamel` 琺瑯牌 | thin plate, inset rule, four rivets, rust chips at the edge | enamel |
| `stone` | characters cut in the parapet: lit lower lip, shadowed upper lip | stone |
| `paint` | painted board (teak, weathered, paper or tin) | teak |

A 直招 (`sideSign`) now hangs on two brackets with a stay wire, not one bar. Light faces have their glow capped at 0.45 so bloom does not wash the letters out.

## Sources opened

| # | URL | What it gave |
|---|---|---|
| D1 | https://city.gvm.com.tw/article/117285 (search summary of 魚夫專欄 on 波麗路) | The door board is a raw 檜木 (cypress) log, carved 「台北老店波麗路」. Pre-war Western restaurants carried the English name BOLERO. Address 民生西路314號. |
| D2 | https://www.thenewslens.com/article/157151 and https://www.travel.taipei/en/featured/details/18881 (search summaries) | 乾元: modernist stucco front, a round bull's-eye window, two carved stone ginsengs, the stucco unchanged in style and colour for a century. No board detail found. |
| D3 | https://www.taiwannews.com.tw/ch/news/3667292 (search summary) | 義美 opened 1934 as 義美商店 in 太平町; the 延平北路 shop stands on the site of 蔣渭水's 大安醫院. No sign detail found. |

## Every real sign

| Sign | Type | Material | Ref | Label |
|---|---|---|---|---|
| 新芳春 parapet 行茶春芳新 | stone, cut, right to left | stone | inferred: 1934 shophouse names were moulded in the parapet plaster | inferred |
| 新芳春 over-street board 新芳春茶行 (English caption "SIN HONG CHOON TEA · 1934" removed) | plaque, rtl, wood frame | teak | guess: no photo of the board opened | guess |
| 新芳春 arcade board | plaque, rtl, gilt frame | lacquer | guess | guess |
| 新芳春 couplets 芳尋顧渚 / 春採蒙山 | plaque 對聯, 行書, flat | redlacquer | inferred: couplet boards at tea-merchant doors | inferred |
| 新芳春 直招 | paint, vertical | weathered | guess | guess |
| 乾元 parapet 行藥參元乾 | stone, rtl | stone | D2 (stucco front) | measured (front is stucco); lettering inferred |
| 乾元 arcade 乾元參藥行 | plaque, rtl, gilt | lacquer | inferred: black-and-gold boards are the herb-shop type | inferred |
| 乾元 直招 | box, red with cream letters | lightbox | guess | guess |
| 乾元 人參 鹿茸 燕窩 | paint | paper | inferred: paper goods card | inferred |
| 屈臣氏 parapet 房藥大氏臣屈 + A.S. WATSON & CO. | stone, 魏碑 and a Didot serif | stone | inferred: the 1917 front carries both names in relief | inferred |
| 屈臣氏 arcade 小藝埕 ArtYard (was 屈臣氏大藥房 with a 小藝埕 sub-caption) | paint | teak | inferred: today's tenant is 小藝埕 | inferred |
| 屈臣氏 arcade board 屈臣氏大藥房 | plaque, rtl | lacquer | guess | guess |
| 小藝埕 vertical, ArtYard plate (year "1917" removed), 書店 BOOKS | paint | paper / weathered | guess | guess |
| 波麗路 board 台北老店波麗路 (was 波麗路西餐廳 + "SINCE 1934") | plaque, carved, 隸書, wood frame | teak | D1 | measured |
| 波麗路 BOLERO over the door, BOLERO 直招 | neon, Didot / script | neonback | D1 (English BOLERO); neon itself not confirmed | inferred |
| 波麗路 直招 波麗路西餐廳 | box, cream with red letters | lightbox | guess | guess |
| 波麗路 parapet BOLERO, side wall BOLERO + 波麗路西餐廳 (caption "咖啡 · 西餐 · 1934" removed) | stone | stone | inferred | inferred |
| 波麗路 small door BOLERO | paint on brass | brass | guess | guess |
| 波麗路 menu board | paint | paper | guess | guess |
| 偶戲館 board 林柳新紀念偶戲博物館 + English line (caption "2000–2019" removed) | paint | teak | inferred: the museum's official name | inferred |
| 偶戲館 直招 偶戲館 | cloth, vertical | cloth | guess | guess |
| 偶戲館 掌中戲 | paint | redlacquer | guess | guess |
| 李臨秋故居 board (caption "〈望春風〉作詞人 1909–1979" removed) | plaque, wood frame | teak | guess | guess |
| 李臨秋故居 door plate 臺北市歷史建築 · 李臨秋故居 | plate | brass | inferred: Taipei historic-building plates | inferred |
| 李臨秋 望春風 | paint, 行書 | paper | guess | guess |
| 義美 arcade 義美食品, rooftop 義美, two 直招 (captions "創始地 · 延平門市 · 1934", "I-MEI · 1934" removed) | box, red with white letters, no logo | lightbox | D3 for the site; the red-and-white light box is inferred | inferred |
| 義美 goods strip 蛋捲 喜餅 禮盒 冰棒 | box, shallow | lightbox | guess | guess |
| 大安醫院舊址 marker | stone, vertical | stone | D3 (the site) | measured (site); form inferred |
| 茶房 parapet 房茶馬天 | stone, rtl | stone | inferred: 1930s 天馬茶房 | inferred |
| 茶房 arcade board (sub "TEA HOUSE" removed) | plaque, rtl, wood frame | teak | guess | guess |
| 茶房 直招 茶 | cloth flag | cloth | guess | guess |
| 慈聖宮 plaque 宮聖慈 | plaque, rtl, gilt letters, red frame | lacquer | inferred: temple plaques read right to left, gold on dark | inferred |
| 慈聖宮 couplets 天上聖母 / 大稻埕媽祖 | plaque 對聯, 行書 | redlacquer | guess (wording) | guess |
| 林五湖本館 | plaque, rtl, gilt | lacquer | guess | guess |
| 林五湖 命相 / 擇日 卜卦 | cloth / paint | cloth / paper | inferred: fortune-teller banners | inferred |
| 霞海城隍廟 stele + 1859 | stone, 魏碑, cut | stone | inferred | inferred |
| 霞海 月下老人 (was 月下老人 · 求姻緣) | cloth, vertical | cloth | guess | guess |
| 大稻埕戲苑 horizontal + vertical (sub now "Dadaocheng Theater 8F") | box | lightbox | guess | guess |
| 永樂市場 vertical | box, cream with blue letters | lightbox | guess | guess |
| 戲苑 今日演出 card | paint | paper | guess | guess |
| 林合發油飯店 (caption "創於 1894 · 永樂市場" removed) | paint on tin | tin | guess | guess |
| 林合發 油飯 紅蛋 雞腿 | paint | paper | guess | guess |
| 大稻埕碼頭 plate + Dadaocheng Wharf (was "五號水門 · DADAOCHENG WHARF") | enamel, rivets | enamel | inferred: blue municipal plate | inferred |

Not rebuilt: the two "5" water-gate numerals and the 貨櫃市集 PIER 5 board. They still use the old board, a colour-mapped material with no kind.

## Screenshots (headless, `tools/places/check.mjs`)

`docs/signage/shots/dadao-real/`: qianyuan, tea, watsons, bolero, bolero2, puppet-li, imei, imei2, tianma, cisheng, xiahai, wharf, yongle, theatre. The 林合發 stall was not caught in a shot.
