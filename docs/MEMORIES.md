# 訪客的記憶：設定與審核 · Visitors' memories: setup and moderation

訪客在街上走的時候，可以在記憶發生的地方留下一段記憶：一兩句話、哪一年、是誰的記憶（我的／爸媽的／阿公阿嬤的）、可以不填的名字和照片。它會在那裡掛成一盞燈籠；留在廣場的，會釘在大樹旁的記憶公布欄上。走近燈籠按 **E**（或點泡泡、點燈籠）就能讀。

- **還沒接上 Supabase 時**，網頁照常運作：街上有作者自己的九則記憶，訪客留下的只存在**他自己的瀏覽器**裡，表單會這樣告訴他。
- **接上之後**，每一則新記憶都先存成 **pending（待審）**，你核准了才會讓所有人看到。表單在送出前就寫明「作者會先讀過，才會掛上街」。

*English summary: until Supabase is connected, the page shows the makers' nine memories and keeps a visitor's own in their browser only. Once connected, every new memory waits as `pending` until you approve it. The steps below are in Chinese first, then English.*

---

## 一次性設定（大約十五分鐘）· One-time setup (about fifteen minutes)

### 1. 建立 Supabase 專案 · Create the project
1. 到 [supabase.com](https://supabase.com) 註冊，按 **New project**。免費方案就夠用。
2. Region 選 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**，離台北最近。
3. 資料庫密碼存在你自己的密碼管理器裡，**不要**放進這個 repo。

*Sign up, create a free project in Tokyo or Singapore, and keep the database password out of this repo.*

### 2. 建立資料表和規則 · Create the table and the rules
1. 在專案裡打開 **SQL Editor → New query**。
2. 把 [`supabase/schema.sql`](../supabase/schema.sql) 整個貼進去，按 **Run**。
3. 看到 `Success. No rows returned` 就好了。這會建立 `memories` 資料表、`memory-photos` 照片空間，以及下面「防護」那一節說的所有規則。
4. 這個檔案**可以重複執行**：以後 repo 裡的 `schema.sql` 有更新，照樣貼上再按一次 Run，不會刪掉任何記憶。

*Paste all of `supabase/schema.sql` into SQL Editor → New query and press Run. It is safe to run again whenever the file changes; it never deletes a memory.*

### 3. 把網址和公開金鑰填進網頁 · Fill in `memories-config.js`
1. 打開 **Project Settings → API**（新版介面是 **Project Settings → Data API** 和 **API Keys**）。
2. 把兩個值貼進 [`memories-config.js`](../memories-config.js)：
   - **Project URL** → `supabaseUrl`
   - **anon public** 金鑰 → `supabaseAnonKey`
3. 同一個檔案裡還有兩格要填：
   - `privacyContact`：**訪客要求下架時要寫到哪裡。**填一個 email（例如 `memories@你的網域`）或一個 `https://` 開頭的表單網址。沒填的話，隱私說明會指向這個 repo 的 GitHub issues，那是公開的，所以上線前請一定要填。
   - `storageRegion`（可不填）：例如 `'Northeast Asia (Tokyo)'`，會顯示在隱私說明裡「放在哪裡」那一句。

   anon 金鑰本來就是公開的，`schema.sql` 的規則把它限制在「讀已核准的記憶、送出待審的記憶、替剛送出的記憶傳一張照片」。**永遠不要**把 `service_role` 金鑰貼進網頁或這個 repo。
4. Commit、push。GitHub Pages 會重新部署，表單就會改說「作者會先讀過，才會掛上街」。

*Copy the Project URL and the anon public key into `memories-config.js`, and fill in `privacyContact` (an e-mail or an https form link where visitors ask for a takedown; until it is set the privacy note points at the public GitHub issues). Never paste the service_role key anywhere in this repo.*

### 4. 讓免費專案不會睡著 · Keep the free project awake
Supabase 的免費專案大約一週沒有活動就會被暫停。repo 裡的 [`.github/workflows/keepalive.yml`](../.github/workflows/keepalive.yml) 每三天會去讀一次資料表，算是活動。它需要兩個 repo secret：

1. 在 GitHub 打開這個 repo 的 **Settings → Secrets and variables → Actions → New repository secret**。
2. 新增 `SUPABASE_URL`，值是 Project URL。
3. 新增 `SUPABASE_ANON_KEY`，值是 anon public 金鑰（和 `memories-config.js` 裡的同一個，**不是** service_role）。
4. 到 **Actions → Supabase keepalive → Run workflow** 手動跑一次，看到綠勾就好了。

沒設 secret 的時候它什麼都不做，也不會失敗。另外，GitHub 會停掉 60 天沒有任何 commit 的 repo 的排程，到時 Actions 頁面會有一個 **Enable workflow** 按鈕，按下去就好。專案如果已經被暫停，到 Supabase 的 dashboard 按 **Restore project**。

*Add the repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions), then run "Supabase keepalive" once by hand. Without them it does nothing and passes. GitHub stops schedules in a repo with no commits for 60 days; re-enable it from the Actions tab. A paused project is restored from the Supabase dashboard.*

### 5. 上線前自己試一次 · Try it before telling anyone
1. 打開網站，走到任何一段街，按 **+ Leave a memory**，寫一則測試記憶（加一張照片），送出。
2. 回到 Supabase 的 **Table Editor → memories**，應該看到一列 `status = pending`，`photo_path` 是 `<那一列的 id>.webp`。
3. **Storage → memory-photos** 裡應該有同名的照片。
4. 把它設成 `approved`，重新整理網頁，燈籠應該亮在你剛剛站的地方。用另一台手機打開，也要看得到。
5. 試完把那一列刪掉，照片也刪掉。

---

## 審核記憶 · Approving memories

1. 打開 **Table Editor → memories**。
2. 用 `status` = `pending` 篩選。讀 `body`；`whose` 是 `me`（我的）、`parents`（爸媽的）或 `grandparents`（阿公阿嬤的）。
3. 有照片的話，`photo_path` 會有值，照片在 `https://<專案>.supabase.co/storage/v1/object/public/memory-photos/<photo_path>`，或在 **Storage → memory-photos** 裡點開看。
   - 如果 `photo_path` 有值、但 Storage 裡找不到那張照片（訪客的網路在傳照片時斷了），核准前先把 `photo_path` 清空，燈籠就會不帶照片地掛上去。
4. 把 `status` 改成 **approved** 就公開；改成 **rejected** 就一直藏著。核准的記憶，下一個打開網頁的人就看得到。
5. 讀的時候注意：有沒有別人的全名、電話、地址、學校班級這類認得出人的細節？有的話就不要核准，或改掉那幾個字再核准（你在 dashboard 裡可以直接編輯 `body`）。

*Filter `status = pending`, read the body (and the photo, if `photo_path` is set), and set `status` to `approved` or `rejected`. If `photo_path` is set but the file is missing from Storage, clear `photo_path` before approving. Don't approve anything that identifies a private person; you can edit `body` in the dashboard first.*

### 有人要求下架 · A takedown request
1. 用對方給的開頭幾個字在 Table Editor 裡搜尋 `body`。
2. 刪掉那一列。
3. 如果有照片，到 **Storage → memory-photos** 刪掉 `<id>.webp`（或 `.jpg`）。
4. 回信告訴對方已經拿掉了。網頁下次載入就看不到。

*Find the row by its first words, delete it and its photo, and reply.*

### 臨時關閉投稿（緊急開關）· Closing submissions (the emergency switch)
被灌爆、出國、或只是想休息時：

1. 在 [`memories-config.js`](../memories-config.js) 把 `submissionsOpen: true` 改成 `submissionsOpen: false`。
2. Commit、push。表單會顯示「暫停收件 · Not taking new memories for now」，燈籠和公布欄照常可以讀。
3. 要重新開放，改回 `true` 再 push。

這個開關只關網頁上的表單。真的有人直接打 API 灌資料，資料庫的限流（下一節）還是會擋。

*Set `submissionsOpen: false` in `memories-config.js` and push: the form says 「暫停收件」 and reading carries on. Set it back to `true` to reopen. The database's own limits keep working either way.*

---

## 防護 · What protects the page

| 風險 · Risk | 怎麼擋 · What stops it |
|---|---|
| 垃圾或惡意內容直接上線 · Spam going live | 你核准之前什麼都不會顯示：`status` 預設是 `pending`，anon 金鑰不能寫這一欄。 · Nothing shows until you approve it; the anon key cannot write `status`. |
| 被大量灌資料 · A flood of submissions | 資料庫的 `before insert` trigger：全站每分鐘最多 12 筆待審；同一個來源十分鐘最多 6 筆；和最近七天任何一則一模一樣的內容直接拒絕。 · A database trigger: at most 12 pending memories a minute site-wide, 6 per sender per ten minutes, and an exact repeat of any memory from the last seven days is refused. |
| 在記憶裡塞程式碼 · Script injection | 訪客寫的字只用 `textContent` 放進網頁，從不當成 HTML。 · Visitor text only ever goes in through `textContent`. |
| 把照片空間當免費圖床 · The bucket as a free image host | 上傳規則呼叫 `memory_photo_ok(name)`：只有一小時內送出、還在待審、`photo_path` 正好是這個檔名、而且還沒有照片的記憶，才能傳這一張。同一則記憶傳第二張會失敗；不屬於任何記憶的照片會失敗。 · The upload rule calls `memory_photo_ok(name)`: only a memory sent in the last hour, still pending, naming exactly this file and with no photo yet may receive it. |
| 太大或奇怪的檔案 · Huge or odd files | 照片在瀏覽器裡縮到 1280 px 的 webp／jpeg；照片空間拒絕超過 2 MB 或其他格式的檔案。 · Shrunk in the browser to 1280 px; the bucket refuses anything over 2 MB or of another type. |
| 改掉或刪掉別人的記憶或照片 · Editing or deleting someone's memory or photo | anon 金鑰沒有任何 update／delete 權限，照片也只能新增，不能覆蓋、列出或刪除。 · The anon key has no update or delete right at all. |
| 照片的 EXIF 定位 · A photo's EXIF location | 照片在瀏覽器裡經 canvas 重新編碼，相機的 EXIF（包括拍攝地點）不會送出去。 · Re-encoded through a canvas in the browser, so EXIF (location included) is never sent. |
| 簡單的機器人 · Simple bots | 隱藏的蜜罐欄位、表單至少要開 2.5 秒、每位訪客 30 秒一則。 · A honeypot field, a minimum time on the form, one memory per 30 s per visitor. |

### 這些規則怎麼做到的 · How the rules work (for whoever maintains `schema.sql`)
- **記憶的 id 由網頁產生**（`crypto.randomUUID()`）。因為 RLS 只讓訪客讀 `approved` 的列，送出之後讀不回剛寫的 pending 列，所以 insert 用 `Prefer: return=minimal`，id 自己帶。id 重複時主鍵直接擋下。
- **順序：先寫記憶、再傳照片。**記憶那一列送出時 `photo_path` 已經是 `<id>.webp`（瀏覽器不能做 webp 時是 `.jpg`）；資料表的 `memories_photo_is_own` 規則保證 `photo_path` 只能是自己的 id。接著才上傳照片，`memory_photo_ok()` 確認那一列在等的正是這個檔案。不需要第三步「回頭補 photo_path」，所以 anon 金鑰也不需要任何 update 權限。
- `memory_photo_ok()` 和 trigger 函式都是 `SECURITY DEFINER`，`search_path` 固定為 `public, pg_temp`：用訪客的權限執行的話，它們受 RLS 影響，看不到 pending 列，限流會永遠數到 0。函式只回傳 true／false，不會把待審的內容帶出去。
- **每來源限流**用的是請求標頭裡 `X-Forwarded-For` 的第一個位址，加上當天日期做 SHA-256，只存雜湊（`source_hash` 欄位，訪客讀不到），隔天就對不起來。代理後面的很多人可能共用一個位址，所以門檻故意放寬。
- 年份規則 `memories_year_in_era`：廣場 1950 年起；西門町 1985–1999；大稻埕 2000–2019；信義 2020–2027，和表單能選的一樣。

### 自己用 curl 驗證 · Checking the limits yourself
把 `URL` 和 `KEY` 換成你的 Project URL 和 anon 金鑰：

```sh
URL=https://abcdefghijkl.supabase.co; KEY=你的anon金鑰
# 1. 灌 15 筆：同一台電腦十分鐘最多 6 筆，所以前 6 筆 201，之後 429（rate_limited）
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$URL/rest/v1/memories" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -H "Prefer: return=minimal" \
    -d "{\"id\":\"$(uuidgen | tr A-Z a-z)\",\"section\":\"red\",\"x\":0,\"z\":0,\"body\":\"curl test $i\"}"
done
# 2. 傳一張不屬於任何記憶的照片：應該 400/403（row-level security）
curl -s -X POST "$URL/storage/v1/object/memory-photos/$(uuidgen | tr A-Z a-z).webp" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: image/webp" --data-binary @some.webp
```
試完到 Table Editor 把 `curl test` 那幾列刪掉。

*Run the loop: from one computer the first 6 return 201, then 429 (the per-sender limit; the site-wide limit of 12 a minute needs several senders). A photo for no memory is refused. Delete the test rows afterwards.*

### 真的被灌爆時 · If it is flooded anyway
1. 先把 `submissionsOpen` 改成 `false`（上面的緊急開關）。
2. 在 Table Editor 篩選 `status = pending`，全選刪掉。
3. 下一步是 Cloudflare Turnstile（一種不用點紅綠燈的 CAPTCHA）。它的 token 一定要在伺服器端用密鑰驗證，所以要再加一個 Supabase Edge Function；這一步現在沒做，因為資料庫 trigger 不需要新的伺服器元件。

---

## 檔案在哪裡 · Where things are

| 檔案 · File | 做什麼 · What it does |
|---|---|
| `memories.js` | 燈籠、讀的卡片、表單（填空提示、是誰的記憶、年份、隱私說明、手機鍵盤），以及對 Supabase 的請求；作者的九則種子記憶（`SEEDS`）也在這裡 · The lanterns, the reading card, the form, the requests to Supabase, and the makers' nine seed memories (`SEEDS`) |
| `memories.css` | 泡泡、卡片和表單的樣式 · The bubble, the card and the form |
| `memories-config.js` | Project URL、anon 金鑰、`submissionsOpen` 緊急開關、`privacyContact` 下架聯絡方式（空白 = 只存在這個瀏覽器）· URL, anon key, the emergency switch, the takedown contact |
| `supabase/schema.sql` | 資料表、照片空間、存取規則、限流 trigger、照片規則（可重複執行）· Table, bucket, access rules, rate-limit trigger, photo rule (safe to re-run) |
| `.github/workflows/keepalive.yml` | 每三天讀一次資料表，讓免費專案不被暫停 · Keeps the free project awake |
| `walk.js` | 女孩站在哪裡，也就是新燈籠掛在哪裡 · Where the girl stands, which is where a new memory hangs |
