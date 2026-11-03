# 02 · 懷舊與記憶類遊戲:它們怎麼讓一個地方「有人住過」

2026-11-03。類似作品研究第 2 章。

## 概觀

這一章看 13 部以「家、家人、地方、記憶」為主題的遊戲:*What Remains of Edith Finch*、*Unpacking*、*Florence*、*Before Your Eyes*、*A Short Hike*、*Old Man's Journey*、*Venba*、*Gone Home*、*Kind Words*、*Shenmue*、*ぼくのなつやすみ*(Kaz Ayabe 的暑假系列)、赤燭的《還願》(*Devotion*),以及 *Dordogne*。重點不是它們講了什麼,而是**怎麼做出來的**:製作者在 GDC 演講、訪談、事後檢討裡說了哪些設計決定。整理下來有幾個共同的手法。第一,**用物件代替旁白**:Gone Home 和 Unpacking 整部作品只靠擺放的東西講故事,而且刻意讓某些東西「留下來」或「不見了」。第二,**每段記憶有自己的互動方式**:Edith Finch 做了 13 個原型、大約 30 種操作方式;Florence 不用文字,只靠互動本身。第三,**聲音和音樂是劇情內的東西**:Unpacking 的上萬個 foley 音效、Venba 跟年代對應的收音機、Florence 每個角色一種樂器。第四,**生活節奏**:Shenmue 的 NPC 有作息,Ayabe 的暑假有日夜。第五,**在地物件的考據**:《還願》靠台灣八零年代的磨石子地、紅鐵門、明星花露水,讓台灣玩家一眼就認得。對 *Our Memory in Taipei* 來說,最值得借的是這幾項:讓同一件東西跨越三個年代、物件和腳步要有聲音、NPC 跟著黃昏改變作息、留記憶的方式要更像儀式。

> **研究限制(請先讀)**:這次工作環境的 WebFetch 連不到 gamedeveloper.com、pcgamer.com、blog.playstation.com 等主要網站(DNS 被網路設定擋下),所以**所有內容都來自 WebSearch 傳回的摘要與節錄**,沒有讀到原文全文,也沒有看 GDC 影片。下面每條說法都附上搜尋結果裡實際出現的網址;引號裡的英文是搜尋節錄中出現的句子,可能和原文有些出入,正式引用前請回原文核對。標為「未查證」的就是沒找到來源的部分。若要補讀全文,需要在 session 的網路設定中放行 `www.gamedeveloper.com`、`www.pcgamer.com`、`blog.playstation.com`。

---

## 1. What Remains of Edith Finch(Giant Sparrow, 2017)

**是什麼**:Edith 回到家族老宅,一間一間打開過世家人被封起來的房間,每個房間進入一段那個人死前的短篇。

**怎麼做的**
- 創意總監 Ian Dallas 在 GDC 2018 Design track 講〈Weaving 13 Prototypes into 1 Game: Lessons from 'Edith Finch'〉。13 個子故事各有自己的美術風格和玩法,為此團隊做了不止 13 個原型。目標是每個機制對玩家都是新的,但又直覺到不需要教學。([GDC news](https://gdconf.com/news/gdc-2018-see-edith-finchs-devs-weaved-13-prototypes-1-game)、[Game Developer 影片頁](https://www.gamedeveloper.com/design/video-weaving-13-prototypes-into-1-game-for-i-what-remains-of-edith-finch-i-)、[GDC Vault](https://gdcvault.com/play/1025016/Weaving-13-Prototypes-into-1))
- Alex Wiltshire 的文章指出全作大約有 30 種操作方式,沒有教學,而且只用類比搖桿和一個扳機鍵。([Game Developer](https://gamedeveloper.com/design/creating-the-30-different-control-schemes-of-i-edith-finch-i-))
- 原型先行,故事很晚才加入;最早的原型是潛水模擬器,靈感來自 Dallas 在華盛頓州長大的記憶。([Wikipedia](https://en.wikipedia.org/wiki/What_Remains_of_Edith_Finch)、[GamesBeat](https://gamesbeat.com/the-story-behind-the-haunting-what-remains-of-edith-finch/))
- Dallas 的建議是找出真正打動自己的感覺,他舉的例子是「小時候在海邊放風箏的感覺」;他也說團隊「not primarily interested in telling a story」,而且刻意保留模糊,讓玩家自己詮釋。([Game Developer 〈Learn, learn, learn〉](https://gamedeveloper.com/design/learn-learn-learn-storytelling-tips-from-the-director-of-i-what-remains-of-edith-finch-i-)、[Gaming Trend 訪談](https://gamingtrend.com/feature/interviews/interview-ian-dallas-talks-about-ambiguity-cut-features-and-magic-in-what-remains-of-edith-finch))
- 評論描述,每個封起來的房間就像一座神龕,裡面有那個人的畫像、生前物品和一份文件。([The Daily Star 評論](https://www.thedailystar.net/shout/overclock/mansion-has-many-roomsand-stories-1439071))

**值得借的**:「一段記憶,一種互動」;同一組極少的輸入(本專案就是 WASD/拖曳/點擊)做出差異很大的感受;「房間像神龕」很適合對照大樹公和土地公。

## 2. Unpacking(Witch Beam, 2021)

**是什麼**:一箱一箱拆行李,八次搬家,主角從頭到尾沒有露面,她的人生全靠物品說出來。

**怎麼做的**
- GDC 2022 演講〈Unpacking a Narrative Through 1,000 Household Items〉(Wren Brier、Tim Dawson)。他們用的手法包括:**決定物品出箱的順序**來暗示進展;讓家中的衣著和物品**隨年紀改變**,反映品味變化;**保留某些物件**,暗示之前住過的人。他們說這像「storytelling with duplo blocks」,工具很鈍,所以大的故事節拍要保持簡單;刻意不做分支劇情。([Game Developer 報導](https://www.gamedeveloper.com/gdc2022/gdc-2022-unpacking-a-narrative-through-1-000-household-items)、[GDC Vault](https://gdcvault.com/play/1027694/Independent-Games-Summit-Unpacking-a))
- 設計支柱:先列出想讓玩家感受到的形容詞,再收斂成 **contemplation、discovery、expression** 三個支柱,並採用「減法設計」,把慣例拿掉,只留必要的東西。([Game Developer](https://gamedeveloper.com/design/unpacking-the-design-pillars-of-a-chill-puzzle-game))
- 早期測試者對「東西只能放某處」的死規則很挫折,所以改成更偏自我表達的體驗。點子來自 Tim Dawson 搬進 Wren 家那次真實的拆箱。([Game Developer 訪談](https://gamedeveloper.com/design/intimacy-from-the-inanimate-in-house-moving-puzzler-unpacking))
- 聲音:超過 14,000 個音效檔;Jeff van Dyck 的 GDC 演講〈'Unpacking': The Fun Behind the Foley〉提到,用三個設計想法把原本估計的 75K 個 foley 降到 15K 以下,例如「放在軟表面上的東西常常聽起來一樣」;大部分的錄音是 Angela van Dyck 做的,把每件物品放在每種表面上逐一調。([Kotaku](https://kotaku.com/hit-puzzle-game-unpacking-features-14-000-audio-fil-1848000220)、[Audiokinetic blog](https://www.audiokinetic.com/en/blog/unpacking-the-fun-behind-the-foley)、[GDC Vault](https://gdcvault.com/play/1027728/-Unpacking-The-Fun-Behind)、[A Sound Effect](https://www.asoundeffect.com/unpacking-game-audio/))

**值得借的**:「保留的物件」與「變化的物件」並存;依「物件 × 表面」分類聲音,大幅減少要錄的量;先訂三個形容詞支柱,再用減法砍功能。

## 3. Florence(Mountains, 2018)

**是什麼**:一段戀愛從開始到結束,手機上約 30 分鐘,沒有對白。

**怎麼做的**
- Ken Wong:「We don't have words in the game」;音樂代替角色的聲音;他們「stopped calling them puzzles」,改稱 interactions;互動簡單到「not about 'winning'」,玩家必須自己賦予意義。([Engadget](https://www.engadget.com/2018/02/14/florence-game-ios-love-ken-wong-interview-mobile/)、[GamesBeat](https://gamesbeat.com/florence-uses-clever-interactions-to-create-a-relatable-mobile-game-about-romance/)、[80.lv](https://80.lv/articles/the-lead-designer-of-monument-valley-discusses-florence))
- 最有名的例子是對話用拼圖表示:剛認識時拼圖片數多,越熟片數越少,吵架時拼得越來越快。這點本次搜尋**只找到間接描述**:Apple 的開發者故事提到一段用拼圖表現兩人漸行漸遠的段落,並說測試時玩家太專心解謎,反而不在意圖案內容。([Apple 開發者故事](https://apps.apple.com/gb/story/id1385422482)、[Game Informer GDC 2019](https://gameinformer.com/gdc-2019/2019/03/20/florence-started-development-as-3d-rubiks-cube-of-human-heads))
- GDC 2019〈Letting Go: A 'Florence' Postmortem〉;早期版本完全以拼圖為基礎,試過的關卡超過一半行不通;最初是「人頭組成的 3D 魔術方塊」。([80.lv GDC 報導](https://80.lv/articles/gdc-a-florence-postmortem)、[GDC Vault](https://gdcvault.com/play/1025694/Letting-Go-A-Florence)、[Game Informer](https://gameinformer.com/gdc-2019/2019/03/20/florence-started-development-as-3d-rubiks-cube-of-human-heads))
- Kevin Penkin 的配樂幫每個角色指定一種樂器:Florence 是鋼琴,大提琴家 Krish 出場時大提琴進來。([Apple「Games are art」](https://apps.apple.com/al/story/id1371611263))

**值得借的**:導覽影片裡的大字可以部分換成「無字互動」;一個時代 / 一個角色對應一種樂器。

## 4. Before Your Eyes(GoodbyeWorld Games, 2021)

**是什麼**:用網路攝影機偵測眨眼,一眨眼,人生就往前跳一段。

**怎麼做的**
- 起點是學生作品 *Close Your*(2014、2015 年得過 IndieCade 和 IGF 獎);寫劇本的 Graham Parkes 找了合作過短片的演員配音。([Game Developer](https://gamedeveloper.com/design/gone-before-you-blink-the-webcam-driven-gameplay-of-before-your-eyes))
- GDC 2023 Game Narrative Summit〈Learning From Loss〉:最初每次眨眼都跳時間,玩家會錯過重要內容,甚至可以閉著眼「速通」。後來加入**節拍器**:只有畫面上出現節拍器時,眨眼才會跳時間,這反而製造出張力。設計師 Bela Messex 說這個機制強到「in danger of taking away from the story」。([GDC Vault](https://gdcvault.com/play/1029123/Game-Narrative-Summit-Learning-From)、[Game Developer〈A seven-year blink〉](https://www.gamedeveloper.com/marketing/a-seven-year-blink-of-an-eye-before-your-eyes-s-dev-woes-deconstructed)、[Recapio 演講摘要(第三方)](https://recapio.com/digest/learning-from-loss-designing-the-experimental-narrative-of-before-your-eyes-by-game-developers-confe))

**值得借的**:時間跳躍前先給「預告」;不要讓操控快到能跳過故事。本專案的捲動導覽正好有這個風險。

## 5. A Short Hike(adamgryu, 2019)

**是什麼**:一座小島,爬到山頂打電話;很小但很密的開放世界。

**怎麼做的**
- GDC 2020 Independent Games Summit〈Crafting A Tiny Open World〉:原本是一個大型 RPG,中途休息做的原型後來變成這款。([GDC Vault](https://gdcvault.com/play/1026613/Independent-Games-Summit-Crafting-A)、[Game Developer](https://gamedeveloper.com/design/video-a-postmortem-look-at-the-making-of-i-a-short-hike-i-))
- Robinson-Yu 在 PlayStation Blog 說他想「用盡量少的像素」做出好看又好讀的 3D;低解析度讓世界顯得茂盛,也讓想像力去補細節;因為有人不喜歡像素感,所以加了可以調整像素大小的選項。([PlayStation Blog](https://blog.playstation.com/2021/08/05/crafting-a-tiny-open-world-a-look-behind-the-scenes-at-the-creation-of-a-short-hike/))
- 技術上(論壇描述,非官方):一般 3D 模型配上減色貼圖,渲染到低解析度 render texture,再經後製 shader 調色。([itch.io 討論](https://itch.io/t/847700/gdc-presentation-by-adam-on-how-he-made-the-game))Edge 的報導提到,低解析度下小細節很難看清,所以「用很少的像素說清楚」本身就是挑戰。([Edge via PressReader](https://www.pressreader.com/australia/edge/20200813/281556588171738))
- Mark Sparling 的配樂是**適應式分層**:依玩家在哪裡、怎麼移動(飛行、天氣),疊加或抽掉旋律層和環境層。([Uppercut](https://uppercutcrit.com/how-a-short-hike-captures-the-feeling-of-fall/)、[Bandcamp Daily](https://daily.bandcamp.com/high-scores/high-scores-mark-sparling))
- 程式、美術、關卡、音效、劇本幾乎由一人包辦。([Game Developer Road to the IGF](https://www.gamedeveloper.com/disciplines/road-to-the-igf-adam-robinson-yu-s-i-a-short-hike-i-))

**值得借的**:小範圍要靠「密度」而不是「面積」;音樂依位置分層;風格化的畫面要給玩家一個調整選項。

## 6. Old Man's Journey(Broken Rules, 2017)

**是什麼**:老人旅行,玩家推拉前後景的山丘來開路;坐下休息時,會想起過去。

**怎麼做的**
- 回憶是單獨的動畫場景,只有老人坐在椅子上休息時才會觸發;不是每段回憶都快樂。([NYU Game Center 提名頁](https://gamecenter.nyu.edu/?p=13853)、[Game Developer Road to the IGF](https://www.gamedeveloper.com/design/road-to-the-igf-broken-rules-i-old-man-s-journey-i-))
- Felix Bohatsch 看朋友家牆上起伏山丘的照片,得到最初的點子;想做「讓人想去度假的地方」;「a 2D game in a 3D space」。([Apple 幕後故事](https://apps.apple.com/dk/story/id1456072648)、[Game Developer](https://www.gamedeveloper.com/design/road-to-the-igf-broken-rules-i-old-man-s-journey-i-))
- Clemens Scott 的 GDC 2017〈Happy Inside the Box: The Art of 'Old Man's Journey'〉講手繪 2D 美術管線。([GDC Vault](https://gdcvault.com/play/1024236/Happy-Inside-the-Box-The))

**值得借的**:「坐下」就是觸發回憶的動作。榕樹下的長凳和茶桌正好用得上。

## 7. Venba(Visai Games, 2023)

**是什麼**:八零年代移民加拿大的泰米爾母親,用做菜找回失傳的食譜,也和兒子漸行漸遠。

**怎麼做的**
- Abhi:「food becomes the bridge between first generation immigrants and their assimilated children」;做菜是和語言不通的兒子溝通的方式。([Game Developer](https://GamaSutra.com/design/how-venba-uses-food-to-explore-connections-and-disconnections-with-culture-for-immigrants))
- 食譜不是按鍵計時的小遊戲,而是「依正確順序組合一道菜」,讓人想到食譜本身;沒有分數,也沒有關係值。([MobileSyrup](https://mobilesyrup.com/2023/07/17/venba-visai-games-toronto-cooking-game-preview/)、[AV Club](https://www.avclub.com/venba-shows-us-food-doesnt-have-to-just-be-a-power-up-or-a-commodity-in-games))
- 團隊公布並排對照照片,顯示遊戲裡的料理常常 1:1 重現自己家裡的做菜經驗。遊戲內有收音機,配樂依劇情年代寫,向各年代的泰米爾電影音樂致敬。([PlayStation Blog](https://blog.playstation.com/2023/06/12/the-story-of-venbas-culinary-and-cultural-roots-from-creative-director-abhi/)、[Wikipedia](https://en.wikipedia.org/wiki/Venba_(video_game)))
- 「很多 YouTuber 是跟媽媽一起玩的」。([Game Daily](https://gamedaily.biz/?p=9815),出自搜尋摘要)

**值得借的**:年代音樂做成場景裡的收音機或卡拉OK,而不是 UI 播放器;內容從真實家庭照片 1:1 重建;不要評分。

## 8. Gone Home(The Fullbright Company, 2013)

**是什麼**:1995 年,大學生回到空無一人的家,靠紙條、信件、物品拼出妹妹 Sam 的故事。

**怎麼做的**
- 一開始就定下限制:「We can make a whole game that is nothing but environmental storytelling」;這是一部關於「人不在」的遊戲。([PCGamesN 訪談](https://www.pcgamesn.com/indie/interview-fullbrights-steve-gaynor-what-made-gone-home-work))
- 「Having immovable constraints is really important」。Karla Zimonja 舉例,時間不夠時,他們決定整個家裡都不放鞋,因為只放兩雙反而更引人注意。Gaynor 早期的系統設計文件和成品相當一致。([Game Developer](https://www.gamedeveloper.com/design/how-i-gone-home-i-s-design-constraints-lead-to-a-powerful-story)、[PC Gamer making-of](https://www.pcgamer.com/au/the-making-of-gone-home))
- 推進劇情的是貨運單、明信片、便利貼、營養標示這類物件;Gaynor 批評「屍體旁邊放一把手槍」這種陳腐的環境敘事。([Kill Screen](https://www.killscreen.com/gone-homes-steve-gaynor-how-the-internet-ruined-adventure-games/))
- 從下載 Unity 到上市共 17 個月;團隊出身 BioShock 2 的 *Minerva's Den*。GDC 2014 演講〈Why Is Gone Home A Game?〉。([PCGamesN](https://www.pcgamesn.com/gone-home/steve-gaynor)、[Game Developer 影片](https://www.gamedeveloper.com/design/video-why-is-i-gone-home-i-a-game-))
- Sam 的語音日記是怎麼做的:**未查證**(搜尋沒找到)。

**值得借的**:用平凡的紙類物件(發票、月曆、便條)講時代;「缺席」的感覺(人走了,東西還在);明確寫下不做什麼。

## 9. Kind Words (lo fi chill beats to write to)(Popcannibal, 2019)

**是什麼**:寫信給陌生人,安慰對方;lo-fi 背景音樂;回禮是貼紙。

**怎麼做的**
- 匿名:信只署名一個字母,並提醒玩家不要透露身分資訊。([GameRevolution 評論](https://www.gamerevolution.com/review/596163-kind-words-review-a-game-for-anyone-who-needs-a-helping-hand))
- Ziba Scott 說很大一部分開發時間花在審核系統上,包括自動工具和人工判斷;最難的是讓信「保持在主題上」;工作人員會在信偏離主題,或有人看起來需要直接協助時介入。([Inverse 訪談](https://www.inverse.com/gaming/kind-words-2-ziba-scott-interview)、[GamesRadar](https://gamesradar.com/kind-words-2-is-a-different-kind-of-social-media-its-a-social-space-where-you-can-share-your-troubles-with-no-followers-or-likes)、[Unwinnable](https://unwinnable.com/?p=76261))
- 貼紙可以貼在信上,或當作收到信後的感謝回覆;每張貼紙附一個可以擺在房間裡的 3D 小玩具。續作沒有追蹤者也沒有按讚,並把場景從房間搬到城鎮廣場。([Ensigame](https://ensigame.com/games/kind-words-lo-fi-chill-beats-to-write-to)、[GamesRadar](https://gamesradar.com/kind-words-2-is-a-different-kind-of-social-media-its-a-social-space-where-you-can-share-your-troubles-with-no-followers-or-likes))

**值得借的**:本專案的「記憶燈籠 + 審核 + 公布欄」和它幾乎是同一個結構。可以借它的「無計數回應」(貼紙),也可以借它把審核當成核心工作來設計的態度。

## 10. Shenmue(Sega AM2, 1999)

**是什麼**:1986 年的橫須賀;Dobuita 街的商店、人和天氣都在運作。

**怎麼做的**
- Yu Suzuki 把時間設在 1986 年左右,因為那時的老居民還找得到人訪談;選橫須賀是因為他以前常在那裡混。([Phantom River Stone 譯介的 Suzuki 訪談](https://www.phantomriverstone.com/2016/12/yu-suzuki-interview-part-1.html))
- 每個 NPC 都有作息:上班族中午吃拉麵,店家晚上打烊;有個機車騎士會在遊樂場、修車、吃漢堡之間輪流。([PC Gamer〈The secret lives of Shenmue's NPCs〉](https://pcgamer.com/the-secret-lives-of-shenmues-npcs))
- 遊戲中的 Dobuita 以真實街道為底,但調整過布局,不是 1:1 重現。([Shenmue wiki 鏡像](https://breezewiki.discard.no/shenmue/wiki/Dobuita))
- 天氣系統「Magic Weather」的設計細節:**未查證**。

**值得借的**:用「訪談還在世的人」來決定年代與細節;NPC 跟時間走;在地但經過整理,而不是照抄。

## 11. ぼくのなつやすみ 系列(Kaz Ayabe / Millennium Kitchen, 2000–)

**是什麼**:城市男孩在過去年代的鄉下過暑假;日本「懷舊遊戲」的代表。

**怎麼做的**
- Ayabe 把它構想成「nostalgic adventure」,部分取材自小時候到鄉下親戚家過暑假的經驗;他想做「模擬真實世界」的遊戲,於是去找合適的題材。([Wikipedia](https://en.wikipedia.org/wiki/Boku_no_Natsuyasumi)、[SCROLL〈Summer Vacation Confidential〉](https://scroll.vg/extras/summer-vacation-confidential/))
- 當年技術做不到全 3D,所以用 2D 動畫式的手繪背景;在蠟筆小新暑假作品裡,Ayabe 負責劇本、遊戲設計和背景環境美術;3D 的 cel-shading 角色疊在手繪背景上。([Nintendo Life](https://nintendolife.com/features/childs-play-from-bokunatsu-to-natsu-mon-the-kaz-ayabe-interview)、[TouchArcade](https://toucharcade.com/2022/09/21/shin-chan-summer-vacation-interview-kaz-ayabe-millennium-kitchen-neos-corporation-ps4-switch-steam/))
- Ayabe 最喜歡的一刻是晚上大家在簷廊一起讀繪本。([TouchArcade](https://toucharcade.com/2022/09/21/shin-chan-summer-vacation-interview-kaz-ayabe-millennium-kitchen-neos-corporation-ps4-switch-steam/))
- 是否明確以「昭和」為設計目標:**未查證**(搜尋未找到直接說法)。

**值得借的**:最動人的往往是「什麼都沒發生的日常片刻」(簷廊讀書 ≈ 榕樹下泡茶);背景用手繪、角色用 3D 的混合手法。

## 12. 還願 Devotion(赤燭遊戲 Red Candle Games, 2019)

**是什麼**:1980 年代台北的一間小公寓,在不同年份之間循環;以台灣民間信仰為底的恐怖遊戲。和本專案的時空最接近。

**怎麼做的**
- 大部分場景發生在台北一棟公寓裡,每個房間代表杜家不同的年份;聲音團隊經過研究和實地訪談,在台灣做現場錄音,並在新加坡錄了大量道具的聲音。([Wikipedia](https://en.wikipedia.org/wiki/Devotion_(video_game)))
- 中文媒體點名的在地物件有:磨石子地板、紅色鐵門、電視選秀節目、洗碗精、瓷碗、明星花露水海報、寫著宜嫁娶日子的老月曆、拍立得;團隊表示要參考台灣在地文化和佛道教元素,重塑八零年代的台灣生活感。([關鍵評論網 115485](https://www.thenewslens.com/article/115485)、[關鍵評論網 114373](https://www.thenewslens.com/article/114373)、[風傳媒](https://www.storm.mg/article/1012693)、[INSIDE](https://www.inside.com.tw/article/15711-why-Devotion-hot))
- 同一間公寓在不同時間點被巧妙地重複使用。([關鍵評論網](https://www.thenewslens.com/article/115485))
- 一位台裔美國玩家寫到,遊戲裡的神明廳就是她小時候和阿嬤一起拜的那種。([Generasian](https://generasian.blog/2022/11/02/playing-a-taiwanese-horror-game-with-my-taiwanese-mother))
- 團隊本人談美術道具考據的訪談:**本次沒找到**。

**值得借的**:一份「台灣人一眼就認得」的物件清單;台灣環境音的實地錄音;同一個空間在不同年份重複使用(本專案的三段街也可以「同一棟樓,三個年代」)。

## 13. Dordogne(Un Je Ne Sais Quoi / Umanimation, 2023)

**是什麼**:32 歲的 Mimi 回到過世外婆的家,想起小時候在法國 Dordogne 的夏天;手繪感的 3D 水彩畫面。

**怎麼做的**
- 玩家替日記收集照片、聲音和氣味(工作室自己的描述);負責人 Cédric Babouche 說作品反映他自己 30 年後帶家人回到當地的經驗;「The game will never punish you if you make a mistake」。([Wikipedia](https://en.wikipedia.org/wiki/Dordogne_(video_game))、[Connexion France](https://connexionfrance.com/news/french-video-game-in-watercolour-plays-like-a-love-letter-to-dordogne/165136)、[Gematsu](https://gematsu.com/2020/04/3d-watercolor-adventure-game-dordogne-announced-for-switch-pc))

**值得借的**:把「收集聲音」當成記憶的一種格式;不懲罰玩家。

---

## 給 Our Memory in Taipei 的啟示

以下對照的是 `00-current-state.md` 盤點的現況:走路模式下大字和敘事是隱藏的、目前只有年代音樂沒有音效、記憶燈籠要經審核才會出現。

1. **讓「同一件東西」跨越三個年代**(Unpacking 的保留物件、還願的同一間公寓)。在西門町、大稻埕、信義三段各放一件明顯是「同一件」的東西,例如同一張藤椅、同一個老招牌、同一台機車,讓它在三段裡逐漸變舊、被移位或被收起來。四十年的感覺最好靠一件會老的東西,而不是三組不相干的佈景。只要在 `scene-*.js` 共用一個 builder,再依年代傳參數。

2. **加上「物件 × 表面」的音效,先做腳步聲**(Unpacking 的 foley 分類、還願的現場錄音)。現在走路完全無聲。先做三種地面的腳步聲:廣場紅磚、騎樓磨石子、街道柏油,依 `WALK.where` 切換。再加四五個互動聲:掛燈籠、圖釘釘上公布欄、香腸攤滋滋聲、象棋落子。Unpacking 證明可以「軟表面共用一組聲音」來控制數量;素材用 CC0 或自錄,沿用 music.js 的「需要使用者手勢才開聲音」流程。

3. **NPC 跟著黃昏改變作息**(Shenmue)。`WALK.dusk` 已經有黃昏係數:讓下棋的阿伯在天黑時收棋盤、香腸攤點燈、卡拉OK 換一首慢歌、土地公前的香燒短一點。不用做排程系統,只要幾個依 `dusk` 門檻切換的狀態,廣場就會從「佈景」變成「有人在過日子」。

4. **「坐下」就觸發回憶**(Old Man's Journey、Ayabe 的簷廊)。在榕樹下的長凳或茶桌加一個「坐下」的互動:女孩坐下後鏡頭慢慢拉遠,公布欄上的一則訪客記憶淡入成字幕(或照片)。這正好替走路模式補上它缺的敘事層,而且是玩家自己選擇停下來的。

5. **每一段街區給一種專屬的小互動**(Edith Finch 的一段一機制、Florence 的無字互動)。三段街區目前的操作都一樣。可以給每段一個只用點擊或拖曳就能完成、不需教學的動作:西門町撕一張電影票根、大稻埕把春聯貼正、信義用手機拍一張 101(定格成拍立得)。保持只用一兩種輸入,但感受完全不同。

6. **捲動導覽在跳年代之前先給預告,而且不能被速通**(Before Your Eyes 的節拍器)。導覽在年代交界時,先出現一個節拍或倒數式的小提示(例如年份數字開始翻頁、燈籠微閃),再切換;並且在大字段落加入阻尼或停駐點,避免快速捲動直接跳過最重要的句子。

7. **把年代音樂放進場景裡**(Venba 的收音機、Florence 的角色樂器)。卡拉OK 已經會播年代歌曲,可以再往前一步:讓音源有位置(靠近卡拉OK 或騎樓的收音機才清楚,走遠就變小並加低通濾波),像 A Short Hike 那樣依位置分層。播放器 UI 退到次要位置。

8. **在地物件清單和口述訪談**(還願、Shenmue、Venba 的 1:1 重現)。先列一份「台灣人一眼就認得」的道具清單,例如磨石子、紅鐵門、鐵窗花、大同電鍋、綠色郵筒、老月曆、明星花露水,按 1985–1999、2000–2019、2020–2027 分配到招牌和騎樓裡。再像 Suzuki 一樣找家裡長輩做兩三段口述訪談,並在 credits 註明。這也能替「記憶」這個主題建立可信度。

9. **記憶燈籠的回應要無計數、像儀式**(Kind Words 的貼紙、Edith Finch 的神龕)。讓訪客可以在別人的燈籠前「點一炷香」或「放一張貼紙」,但**不顯示數字**,只讓燈籠多亮一點。審核要比照 Kind Words 當成核心工作:表單提醒不要寫可辨識個人的資訊,審核後台要有「偏離主題 / 需要協助」的分類。

10. **先訂三個形容詞支柱,再用減法砍東西**(Unpacking 的 contemplation/discovery/expression、Gone Home 的「不能動的限制」)。建議支柱是「溫暖、認得、留下」。每個新功能都問它服務哪一個支柱;服務不到的就像 Gone Home 拿掉鞋子那樣,乾脆拿掉。

(可選的第 11 點)**提供畫面風格的調整選項**(A Short Hike 的像素大小選項):本專案的後製已有 `uPrint` 色階化和顆粒,可以在設定裡給「清晰 / 印刷感」兩檔,照顧不喜歡風格化的訪客,也能當作低效能裝置的降級方案。
