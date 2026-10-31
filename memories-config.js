// memories-config.js — where the visitors' memories are kept.
//
// Empty (as committed): the page still works. Visitors see the makers' memories, and anything they
// leave is kept in their own browser only, and the form says so.
//
// To let everyone's memories reach everyone, create a free Supabase project, run
// supabase/schema.sql in its SQL editor, and paste the project URL and the "anon public" key here
// (Project Settings → API). The anon key is meant to be public: what it can do is limited by the
// row-level security rules in schema.sql (read approved memories and their photos, submit new ones as
// pending, upload a photo into a private bucket; nothing else). Never put the service_role key in this file.
//
// New memories wait as status = 'pending' until you approve them. See docs/MEMORIES.md.
window.MEMORY_CONFIG = {
  supabaseUrl: '',        // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: '',    // the long "anon public" key
  bucket: 'memory-photos',
};
