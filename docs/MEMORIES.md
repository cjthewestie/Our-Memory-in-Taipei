# Visitors' memories: setup and moderation

Visitors walking the street can leave a memory where it happened: a line or two of text, a year, an optional name and an optional photo. It hangs there as a paper lantern. Walk up to one and press **E** (or tap the bubble, or click the lantern) to read it.

- **Until it is connected**, the page still works: the makers' two lanterns show, and anything a visitor leaves is kept in **their own browser only**. The form tells them so.
- **Once connected to Supabase**, every new memory is stored as **pending** and appears for everyone only after you approve it.

## One-time setup (about ten minutes)

1. Create a free project at [supabase.com](https://supabase.com). Any region works; Tokyo or Singapore is closest to Taipei.
2. In the project, open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](../supabase/schema.sql) and press **Run**. This creates the `memories` table, the **private** `memory-photos` bucket, the queue limits and the access rules. Running it again is safe; it also turns an older public bucket private.
3. Open **Project Settings → API** and copy two values into [`memories-config.js`](../memories-config.js):
   - **Project URL** → `supabaseUrl`
   - **anon public** key → `supabaseAnonKey`

   The anon key is designed to be public. The rules in `schema.sql` limit it to reading approved memories and their photos, submitting new ones as pending, and uploading a photo it can then not read back. **Never** paste the `service_role` key into the page.
4. Check the bucket: **Storage → memory-photos** should show no "Public" badge. If it does, the schema did not run; run it again.
5. Commit and push. GitHub Pages redeploys, and the form now says memories are read before they appear.

## Approving memories

1. Open the project's **Table Editor → memories**.
2. Filter by `status` = `pending`. Read the `body`. If `photo_path` is set, open **Storage → memory-photos**, click the file with that name and press **Get URL** (a signed link, valid for the time you pick). There is no public link: you see it because you are signed in to the dashboard.
3. Set `status` to **approved** to publish it, or **rejected** to keep it hidden. Approved memories, and their photos, appear the next time anyone loads the page. A photo becomes viewable only at that moment: the page asks Supabase for a signed link, and Supabase signs only photos whose memory is approved. Moving a memory back to `pending` or `rejected` hides its photo again for the next visitor (a link already handed out keeps working until it expires, at most 12 hours).

To remove one completely, delete the row, then delete its photo: **Storage → memory-photos**, tick the file named like the row's `photo_path`, **Delete**. Deleting the row first already hides the photo; deleting the file removes it for good.

Photos with no memory row (someone uploaded and then left) are never viewable by anyone but you. To clear them, run this in the SQL Editor, then delete the listed files in **Storage**:

```sql
select o.name, o.created_at from storage.objects o
where o.bucket_id = 'memory-photos'
  and not exists (select 1 from public.memories m where m.photo_path = o.name);
```

Rejected memories' photos can be listed the same way with `m.status = 'rejected'`.

If visitors see "It did not save" and the table has 500 pending rows, the queue is full: approve, reject or delete pending rows to make room. The limits live in `public.memories_throttle()` in `schema.sql` (they also apply to rows you add by hand in the dashboard).

## What protects the page

| Risk | What stops it |
|---|---|
| Spam or abuse going live | Nothing is shown until you approve it (`status` defaults to `pending`; the anon key cannot set it). |
| Script injection in a memory | Visitor text is only ever written with `textContent`, never as HTML. |
| Huge or odd uploads | Photos are shrunk in the browser to 1280 px webp/jpeg; the bucket rejects anything over 2 MB or of another type. |
| Overwriting or deleting someone's photo | The anon key may upload new files only: no update, list or delete. |
| Pending or rejected photos being seen | The bucket is private, so no photo has a public link. The only read rule allows a photo whose memory is `approved`; a pending, rejected or orphaned photo cannot be read or signed with the anon key, even by someone who knows its name. |
| Using the bucket as free image hosting | Same rule: an upload with no approved memory is never readable. |
| A script flooding the queue | A database trigger refuses new memories once 500 are pending, or once 20 arrived in the last minute (site-wide). Photo uploads are capped at 20 a minute the same way. |
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
