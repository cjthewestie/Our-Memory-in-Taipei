# Visitors' memories: setup and moderation

Visitors walking the street can leave a memory where it happened: a line or two of text, a year, an optional name and an optional photo. It hangs there as a paper lantern. Walk up to one and press **E** (or tap the bubble, or click the lantern) to read it.

- **Until it is connected**, the page still works: the makers' two lanterns show, and anything a visitor leaves is kept in **their own browser only**. The form tells them so.
- **Once connected to Supabase**, every new memory is stored as **pending** and appears for everyone only after you approve it.

## One-time setup (about ten minutes)

1. Create a free project at [supabase.com](https://supabase.com). Any region works; Tokyo or Singapore is closest to Taipei.
2. In the project, open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](../supabase/schema.sql) and press **Run**. This creates the `memories` table, the `memory-photos` bucket and the access rules.
3. Open **Project Settings → API** and copy two values into [`memories-config.js`](../memories-config.js):
   - **Project URL** → `supabaseUrl`
   - **anon public** key → `supabaseAnonKey`

   The anon key is designed to be public. The rules in `schema.sql` limit it to reading approved memories, submitting new ones as pending, and uploading a photo. **Never** paste the `service_role` key into the page.
4. Commit and push. GitHub Pages redeploys, and the form now says memories are read before they appear.

## Approving memories

1. Open the project's **Table Editor → memories**.
2. Filter by `status` = `pending`. Read the `body`, and open the photo if there is one: it is at `https://<project>.supabase.co/storage/v1/object/public/memory-photos/<photo_path>`.
3. Set `status` to **approved** to publish it, or **rejected** to keep it hidden. Approved memories appear the next time anyone loads the page.

To remove one completely, delete the row, and delete its photo under **Storage → memory-photos**.

## What protects the page

| Risk | What stops it |
|---|---|
| Spam or abuse going live | Nothing is shown until you approve it (`status` defaults to `pending`; the anon key cannot set it). |
| Script injection in a memory | Visitor text is only ever written with `textContent`, never as HTML. |
| Huge or odd uploads | Photos are shrunk in the browser to 1280 px webp/jpeg; the bucket rejects anything over 2 MB or of another type. |
| Overwriting or deleting someone's photo | The anon key may upload new files only: no update, list or delete. |
| Pending photos being found | Each photo has a random UUID name. A pending photo is reachable only by someone who already has its exact link. |
| Simple bots | A hidden honeypot field, a minimum time on the form, and one memory per 30 seconds per visitor. |

Supabase's free tier is plenty for this. A burst of spam would still only land in the pending queue; if that ever happens, the next step is a CAPTCHA (Cloudflare Turnstile) on the form.

## Where things are

| File | What it does |
|---|---|
| `memories.js` | The lanterns, the reading card, the form, and the requests to Supabase |
| `memories.css` | The bubble, the card and the form |
| `memories-config.js` | The project URL and anon key (empty = this browser only) |
| `supabase/schema.sql` | The table, bucket and access rules |
| `walk.js` | Where the girl is standing, which is where a new memory hangs |
