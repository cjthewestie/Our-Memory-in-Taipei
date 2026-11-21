import re
#!/usr/bin/env python3
"""build_data.py: docs/places/{ximen,dadao,xinyi}.json (research) -> remake/place-data.js (what the scenes show).

Run from anywhere:   python3 tools/places/build_data.py
Re-run it whenever a research file changes; place-data.js is generated, never edited by hand.

Each item written:
  key         stable ascii slug, at most 28 characters, so the photo topic 'place:<district>:<key>' fits the
              40-character limit on memories.topic (supabase/schema.sql). It is the research id, shortened only
              when the id is longer than that; the research id is kept in `id`.
  district, zh, en, kind ('place' | 'shop' | 'event'), years
  history_en  as researched
  history_zh  trimmed to 80 characters at a sentence boundary (at a clause boundary, closed with 。, when the
              whole sentences that fit come to less than 40 characters)
  visual      [text, ...]; a detail the research did not read on a page ends with its label in brackets
  where       where it stands in the district
  marker      events only: { type: 'board' | 'stand' | 'statue' | 'wall', shape, depicts }
  sources     [url, ...]      photos  [url, ...] (reference pages to look at, not files to republish)
  confirmed   False when the research says so (see confirmed() below); `unconfirmed` lists what is open.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs' / 'places'
OUT = ROOT / 'remake' / 'place-data.js'
DISTRICTS = [  # research file, the photo wall's section (the four the database allows), names
    ('ximen', 'red', '西門町', 'Ximending'),
    ('dadao', 'dadao', '大稻埕', 'Dadaocheng'),
    ('xinyi', 'tower', '信義', 'Xinyi'),
]
MAX_KEY = 28
MAX_ZH = 80
UNKNOWN = re.compile(r'unknown', re.I)
HOLD = re.compile(r'do not publish|until confirmed', re.I)


def text_of(x):
    """A research entry is a string or a dict whose words sit under one of several names."""
    if isinstance(x, str):
        return x
    if isinstance(x, dict):
        for k in ('text', 'detail', 'fact', 'claim', 'item', 'value'):
            if isinstance(x.get(k), str):
                return x[k]
    return ''


def slug(item_id, en):
    s = re.sub(r'[^a-z0-9]+', '-', (item_id or en or '').lower()).strip('-')
    if not s:
        raise SystemExit('an item has neither an id nor an English name')
    if len(s) <= MAX_KEY:
        return s
    parts = s.split('-')
    tail = [parts.pop()] if parts[-1].isdigit() else []      # keep the year on the end
    while parts and len('-'.join(parts + tail)) > MAX_KEY:
        parts.pop()
    return '-'.join(parts + tail)[:MAX_KEY].strip('-')


def trim_zh(s, limit=MAX_ZH):
    s = (s or '').strip()
    if len(s) <= limit:
        return s
    out = ''
    for sentence in re.findall(r'[^。！？!?]+[。！？!?]?', s):
        if len(out) + len(sentence) > limit:
            break
        out += sentence
    if len(out) >= limit // 2:
        return out
    # the whole sentences that fit make too short a history (the next one is long): go on to the last clause that fits
    cut = s[:limit - 1]
    i = max(cut.rfind('，'), cut.rfind('；'))
    if i > len(out):
        return cut[:i] + '。'
    return out or cut + '。'


def marker_of(item):
    m = item.get('marker')
    if not isinstance(m, dict):
        return None
    t = (m.get('type') or '').lower()
    kind = 'board' if '立牌' in t or 'board' in t else 'wall' if 'wall' in t else 'statue' if 'statue' in t or '雕像' in t else 'stand' if 'stand' in t else 'board'
    words = (item.get('id', '') + ' ' + (m.get('depicts') or '') + ' ' + t).lower()
    shape = 'generic'
    for name, keys in (('stone', ('memorial stone', 'stone marker')), ('climber', ('climb',)), ('firework', ('firework',)), ('train', ('railway', 'track', 'train')),
                       ('crane', ('demoli',)), ('damper', ('pendulum', 'damper')), ('tower', ('tower',)), ('cinema', ('cinema', 'ticket')),
                       ('walk', ('pedestrian',)), ('bag', ('shopping bag', 'department')), ('mask', ('mask',)), ('book', ('book',)),
                       ('lantern', ('new year', 'lantern')), ('fire', ('fire', 'burnt', 'scorched')), ('parade', ('parade', 'procession')), ('neon', ('neon',))):
        if any(k in words for k in keys):
            shape = name
            break
    return {'type': kind, 'shape': shape, 'depicts': m.get('depicts') or ''}


def confirmed(item):
    """False when the research itself says the item is not settled. Returns (confirmed, [reasons])."""
    why = []
    facts = [f for f in item.get('facts', []) if isinstance(f, dict)]
    labels = [str(f.get('label', '')).strip().lower() for f in facts]
    if UNKNOWN.search(item.get('years') or ''):
        why.append('years: ' + item.get('years', ''))
    if HOLD.search(json.dumps(item, ensure_ascii=False)):
        why.append('the research says to hold it until confirmed')
    if not facts or not any(l.startswith('measured') for l in labels):
        why.append('no fact was read on a cited page')
    else:
        if not labels[0].startswith('measured'):
            why.append('the core fact is ' + (labels[0] or 'unlabelled') + ': ' + text_of(facts[0]))
        elif facts[0].get('via') == 'search-snippet':
            why.append('the core fact was read in a search summary only, not on the page')
        if sum(1 for l in labels if l.startswith('measured')) * 2 < len(labels):
            why.append('most of its facts are inferred or unknown')
    return (not why, why)


def open_points(item):
    out = [u for u in item.get('unknowns', []) if isinstance(u, str) and u.strip()]
    for f in item.get('facts', []):
        if isinstance(f, dict) and str(f.get('label', '')).lower().startswith('unknown'):
            t = text_of(f)
            if t and t not in out:
                out.append(t if UNKNOWN.search(t) else t + ': (unknown — needs CJ)')
    return out


def convert(item, district):
    ok, why = confirmed(item)
    where = item.get('location')
    if not isinstance(where, str):
        where = text_of(item.get('location_vs_101') or '')
    visual = []
    for v in item.get('visual_details', []):
        t = text_of(v)
        label = str(v.get('label', '')) if isinstance(v, dict) else ''
        if t:
            visual.append(t if label.lower() == 'measured' or not label else t + ' [' + label + ']')
    urls = lambda xs: [u for u in ((x if isinstance(x, str) else (x or {}).get('url')) for x in (xs or [])) if isinstance(u, str) and re.match(r'https?://', u)]
    out = {
        'key': slug(item.get('id'), item.get('en')), 'id': item.get('id') or '', 'district': district,
        'zh': item.get('zh', ''), 'en': item.get('en', ''), 'kind': item.get('kind', 'place'), 'years': item.get('years', ''),
        'history_en': item.get('history_en', ''), 'history_zh': trim_zh(item.get('history_zh', '')),
        'visual': visual, 'where': where or '',
        'sources': urls(item.get('sources')), 'photos': urls(item.get('photos') or item.get('photo_refs')),
        'confirmed': ok, 'unconfirmed': why + open_points(item) if not ok else open_points(item),
    }
    m = marker_of(item)
    if m:
        out['marker'] = m
    return out


# ── what visitors read ───────────────────────────────────────────────────────────────────────────
# The research files mark open points with the internal note "(unknown — needs CJ)" and sometimes talk about
# "the brief". Neither belongs on a public panel: the note becomes plain "not confirmed" / 待確認, and an item
# whose text is mostly about the research itself gets its public wording here.
PUBLIC = {
    'watsons-fire-and-restoration': {
        'years': 'fire date not confirmed; listed as a city monument 2005; ArtYard opened 2011',
        'history_en': 'People tell of a fire at the Watsons pharmacy building and a careful restoration afterwards. This site has not yet confirmed the date of the fire or the years of the repair. What is confirmed: Watsons traded on Dihua Street from 1917, the old shop was listed as a city monument in 2005, and it reopened as ArtYard (小藝埕) in 2011. If you remember the fire, leave a photo or a note here.',
        'history_zh': '相傳屈臣氏大藥房曾遭祝融後修復，但火災日期與修復年份尚待確認。已確認：2005年列為市定古蹟，2011年以小藝埕重新開張。',
    },
}
_NOTE = re.compile(r'\s*[（(]\s*unknown\s*[—-]\s*needs CJ[^）)]*[）)]')
def public(v, zh=False):
    if isinstance(v, str):
        zh = zh or bool(re.search(r'[\u4e00-\u9fff]', v)) and not re.search(r'[a-z]{4}', v)
        v = _NOTE.sub('（待確認）' if zh else ' not confirmed', v)
        v = re.sub(r'\s*[—-]\s*needs CJ', '', v)
        return re.sub(r'\s*;?\s*the brief says [^;)]*', '', v).replace('  ', ' ').strip()
    if isinstance(v, list): return [public(x) for x in v]
    if isinstance(v, dict): return {k: (x if k in ('key', 'id', 'sources', 'photos') else public(x)) for k, x in v.items()}
    return v


# Researched but not shown. HANDOFF.md: "二二八 (1947, 天馬茶房) deliberately left out of the story, per the original brief."
# Whether that still holds for these memory markers is (unknown — needs CJ).
HELD = {'tianma-tea-house', '228-flash-point-1947'}

def main():
    data, report = {}, []
    for district, section, zh, en in DISTRICTS:
        src = json.loads((SRC / (district + '.json')).read_text(encoding='utf-8'))
        block = {'section': section, 'zh': zh, 'en': en, 'researched': src.get('researched', ''), 'places': [], 'events': []}
        seen = set()
        for group in ('places', 'events'):
            for item in src.get(group, []):
                o = convert(item, district)
                o.update(PUBLIC.get(o['key'], {})); o = public(o)
                if o['key'] in HELD or o['id'] in HELD: continue
                if o['key'] in seen:
                    raise SystemExit(f'{district}: two items share the key {o["key"]}')
                seen.add(o['key'])
                if len('place:' + district + ':' + o['key']) > 40:
                    raise SystemExit(f'{district}: the photo topic for {o["key"]} is longer than 40 characters')
                block[group].append(o)
        data[district] = block
        items = block['places'] + block['events']
        report.append((district, len(block['places']), len(block['events']), [i['key'] for i in items if not i['confirmed']],
                       [(i['id'], i['key']) for i in items if i['id'] != i['key']], max(len(i['history_zh']) for i in items)))
    head = ('// place-data.js: GENERATED by tools/places/build_data.py from docs/places/*.json. Do not edit by hand;\n'
            '// change the research file and run the script again. `confirmed: false` means the research itself says the\n'
            '// item is not settled: the panel shows a "not yet confirmed" badge for it.\n')
    OUT.write_text(head + 'window.PLACE_DATA = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    print('wrote', OUT.relative_to(ROOT), OUT.stat().st_size, 'bytes')
    for district, np, ne, bad, renamed, longest in report:
        print(f'{district}: {np} places, {ne} events, longest history_zh {longest} chars, not confirmed {len(bad)}: {", ".join(bad) or "none"}')
        for old, new in renamed:
            print(f'  key shortened: {old} -> {new}')


if __name__ == '__main__':
    sys.exit(main())
