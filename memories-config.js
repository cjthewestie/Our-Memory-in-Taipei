// memories-config.js — where the visitors' memories are kept.
//
// Empty (as committed): the page still works. Visitors see the makers' memories, and anything they
// leave is kept in their own browser only, and the form says so.
//
// To let everyone's memories reach everyone, create a free Supabase project, run
// supabase/schema.sql in its SQL editor, and paste the project URL and the "anon public" key here
// (Project Settings → API). The anon key is meant to be public: what it can do is limited by the
// row-level security rules in schema.sql (read approved memories, submit new ones as pending, upload
// a photo; nothing else). Never put the service_role key in this file.
//
// New memories wait as status = 'pending' until you approve them. See docs/MEMORIES.md.
//
// 2026-11-03 (item #1): submissionsOpen is the emergency switch. Set it to false, commit and push, and
// the form says 「暫停收件 · Not taking new memories for now」 instead; reading is not affected.
// privacyContact is where a visitor writes to have their memory taken down: an e-mail address or an
// https:// link (a form). It is shown in the form's privacy note. Fill it in before going live;
// while it is empty the note points to this project's GitHub issues instead.
window.MEMORY_CONFIG = {
  supabaseUrl: '',        // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: '',    // the long "anon public" key
  bucket: 'memory-photos',
  submissionsOpen: true,  // false = 暫停收件: the form is closed, the lanterns still show
  privacyContact: '',     // CJ: e.g. 'memories@example.com' or 'https://forms.example.com/takedown' (TODO before launch)
  storageRegion: '',      // optional, shown in the privacy note, e.g. 'Northeast Asia (Tokyo)'
};
