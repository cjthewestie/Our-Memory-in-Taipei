// photo-topics.js — the photo walls of each scene, one wall per topic or major event.
// CJ, 2026-11-21: "photot wall in each scene, categorize with topic or major event in this scene".
//
// This is the one file to edit to add, rename or remove a wall. Each entry is one wall:
//   key     stored with every photo left on that wall (never change a key once photos exist)
//   zh, en  the wall's title
//   years   shown under the title ('' for none)
//   ask     the question on the "Add your photo" frame: what kind of photo belongs here
//
// The topics and the dates below were PROPOSED BY CLAUDE from general knowledge and from HANDOFF.md,
// not chosen by CJ. Every one is (unknown — needs CJ) until he confirms or changes it; check a date
// before it goes on the public site.
window.PHOTO_TOPICS = {
  // the hub: everyday Taipei, not tied to one district or year
  square: [
    { key: 'family',  zh: '家人',       en: 'Family',            years: '', ask: 'You and your family, anywhere in Taipei' },
    { key: 'school',  zh: '上學與通勤', en: 'School and commute', years: '', ask: 'School gates, uniforms, buses, the MRT' },
    { key: 'food',    zh: '吃',         en: 'Food',              years: '', ask: 'Breakfast shops, night markets, the stall you miss' },
  ],
  // 西門町, 1985–1999
  red: [
    { key: 'chunghwa', zh: '中華商場',   en: 'Chunghwa Market',     years: '1961–1992', ask: 'The eight blocks along 中華路, before they came down' },
    { key: 'cinema',   zh: '電影街',     en: 'Movie street',        years: '',          ask: 'Queues, billboards and ticket stubs on 武昌街' },
    { key: 'walk',     zh: '行人徒步區', en: 'The pedestrian zone', years: '1999–',     ask: 'The streets after the cars left' },
    { key: 'redhouse', zh: '紅樓',       en: 'The Red House',       years: '1908–',     ask: 'Anything taken at the Red House' },
  ],
  // 大稻埕, 2000–2019
  dadao: [
    { key: 'newyear', zh: '年貨大街',   en: 'Lunar New Year market', years: '', ask: 'Shopping 迪化街 before the New Year' },
    { key: 'temple',  zh: '霞海城隍廟', en: 'City God Temple',       years: '', ask: 'A visit to the temple' },
    { key: 'fabric',  zh: '永樂市場',   en: 'Yongle Market',         years: '', ask: 'The fabric stalls and what was made from them' },
    { key: 'wharf',   zh: '大稻埕碼頭', en: 'The wharf',             years: '', ask: 'Sunsets, bicycles and fireworks by the river' },
  ],
  // 信義, 2020–
  tower: [
    { key: 'fireworks', zh: '跨年煙火',   en: 'New Year fireworks',   years: '',     ask: 'Midnight under Taipei 101' },
    { key: 'quiet',     zh: '安靜的城市', en: 'The quiet city',       years: '2021', ask: 'Empty streets and masks during the Level 3 alert' },
    { key: 'skywalk',   zh: '天橋與百貨', en: 'Skywalks and stores',  years: '',     ask: 'Meeting friends between the department stores' },
    { key: 'climb',     zh: '攀登101',    en: 'Climbing 101',         years: '',     ask: 'The day a man climbed the tower: where were you watching?' },   // CJ named this one, 2026-11-21: "major event like climbing 101"
    { key: 'lookup',    zh: '抬頭看101',  en: 'Looking up at 101',    years: '',     ask: 'The tower from wherever you stood' },
  ],
};
