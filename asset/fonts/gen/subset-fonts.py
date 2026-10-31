#!/usr/bin/env python3
"""Rebuild asset/fonts/*.woff2: each face subset to exactly the glyphs the page's own strings use (issue #10, pairing 04 since issue #16).

Run it whenever a string that reaches the DOM changes (data.js WORDS / CLOSING / ERAS / ANCHORS, index.html, music.js copy,
walk.js, memories.js and gallery.js copy, including what they paint on canvas):

    python3 asset/fonts/gen/subset-fonts.py            # needs fontTools with brotli: pip install fonttools brotli

Sources are fetched from the google/fonts repo at a pinned commit into a temp folder; nothing but the woff2 files lands in
asset/fonts/. The licences beside them (OFL-*.txt) are the same repo's OFL.txt files; the OFL 1.1 permits subsetting and
self-hosting, and name ID 13/14 (the licence text and URL) stay inside each woff2.
"""
import re, os, sys, subprocess, tempfile, urllib.request
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FONTS = os.path.join(ROOT, 'asset', 'fonts')
COMMIT = 'b5efa9c32e8f9b63005f5cdb1ad5527a77d2cd04'   # google/fonts main, 2026-09-23
RAW = 'https://raw.githubusercontent.com/google/fonts/%s/ofl/' % COMMIT
FACES = [  # (source in google/fonts, output file, which glyph set) — pairing 04 (issue #10, picked 2026-09-24)
    ('barlowcondensed/BarlowCondensed-Bold.ttf',              'barlow-condensed-700.woff2',         'big'),
    ('barlowcondensed/BarlowCondensed-Light.ttf',             'barlow-condensed-300.woff2',         'light'),
    ('barlow/Barlow-Regular.ttf',                             'barlow-400.woff2',                   'hud'),
    ('barlow/Barlow-SemiBold.ttf',                            'barlow-600.woff2',                   'hud'),
    ('barlow/Barlow-Bold.ttf',                                'barlow-700.woff2',                   'hud'),
    ('chocolateclassicalsans/ChocolateClassicalSans-Regular.ttf', 'chocolate-classical-sans-400.woff2', 'zh'),
]
CACHE = os.environ.get('FONT_CACHE')   # a folder of already-downloaded source ttfs, by basename; unset = fetch

def rd(f): return open(os.path.join(ROOT, f), encoding='utf8').read()

def glyph_sets():
    data, music, html = rd('data.js'), rd('music.js'), rd('index.html')
    words_big = re.findall(r"big:\s*'([^']*)'", data)
    words_sub = re.findall(r"sub:\s*'([^']*)'", data)
    closing   = re.findall(r"line:\s*'([^']*)'", data)
    parts     = re.findall(r"text:\s*'([^']*)'", data)          # the closing line's two beats: the first is set in the display face
    opening   = re.findall(r'class="op-big">(.*?)</div>', html)  # the opening title, display face
    eras      = re.findall(r"label:\s*'([^']*)',\s*zh:\s*'([^']*)'", data)
    years     = re.findall(r"years:\s*'([^']*)'", data)
    names     = re.findall(r"name:\s*\{\s*en:\s*'([^']*)',\s*zh:\s*'([^']*)'", data)
    caps      = re.findall(r"caption:\s*'([^']*)'", data)
    # music.js: what the control prints (titles, artists, channels, decade labels, loop titles, its status and button copy)
    mus = re.findall(r"(?:title|artist|channel|label|credit):\s*'([^']*)'", music)
    mus += re.findall(r"CREDIT\s*=\s*'([^']*)'", music)
    mus += ['YouTube · ', 'local loops', 'YouTube needs http', 'YouTube refused to embed', 'offline: ', 'connecting to YouTube…',
            'Click to play', 'Click for sound', 'Sound off', 'Sound on', 'Next video', 'Next song', 'your copy']
    html_txt = re.sub(r'<[^>]+>', ' ', re.sub(r'<script[\s\S]*?</script>|<!--[\s\S]*?-->', ' ', html))
    hud = ['YEAR', '/03', '01', '02', '03', '0123456789', html_txt]   # the year counter runs through every digit
    # walk.js, memories.js and gallery.js: every quoted string in the code (comments stripped: they quote CJ in Chinese), plus
    # printable ASCII and typographic punctuation for the memories visitors type, which are set in the HUD face.
    code = lambda f: re.sub(r'(^|\s)//.*$', ' ', rd(f), flags=re.M)
    walk_strs = [re.sub(r'<[^>]+>', ' ', t) for f in ('walk.js', 'memories.js', 'gallery.js') if os.path.exists(os.path.join(ROOT, f)) for t in re.findall(r"'([^'\n]*)'", code(f))]
    hud += walk_strs + [''.join(chr(c) for c in range(0x20, 0x7F)), '‘’“”…—–·×']
    gates = re.findall(r"zh:\s*'([^']*)',\s*en:\s*'([^']*)',\s*years:\s*'([^']*)',\s*line:\s*'([^']*)'", rd('walk.js'))
    hanzi = lambda s: {ch for ch in s if ord(ch) > 0x2FFF}
    latin = lambda s: {ch for ch in s if ord(ch) <= 0x2FFF and not ch.isspace()}
    big = set().union(*[set(w) for w in words_big], set(parts[0]) if parts else set(), *[set(re.sub(r'<[^>]+>', '', o)) for o in opening]) - {' '}
    # walk.js's gate signs (display face 700: the names, BACK TO THE SQUARE, ON TO …) and the square's title (uppercase in CSS)
    big |= set(''.join(g[1] + g[2] for g in gates) + 'BACK TO THE SQUARE ON TO · 0123456789–') - {' '}
    light = set().union(*[set(w) for w in words_sub]) - {' '}   # the sub line under each big word, the display face at 300
    light |= set(''.join(g[2] + ' · ' + g[3] for g in gates)) - {' '}   # the gate sign's years line, drawn at 400 (matched to the 300 face)
    painted = ''.join(re.findall(r"fillText\('([^']*)'", rd('walk.js') + (rd('gallery.js') if os.path.exists(os.path.join(ROOT, 'gallery.js')) else '')))   # canvas text (the square's centre stone, gallery labels), painted in both weights
    big |= latin(painted); light |= latin(painted)
    caps_any = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ’')   # canvas labels set in capitals (gallery wall titles) whose text is built at runtime
    big |= caps_any; light |= caps_any
    hud_set = set()
    for s in words_sub + closing + years + caps + mus + hud + [e[0] for e in eras] + [e[1] for e in eras] + [n[0] for n in names] + [n[1] for n in names]:
        hud_set |= latin(s)
    # the Chinese face carries the chapter names, the anchors' Chinese names and walk.js / memories.js's place names
    # (廣場, 信義, the gates). The song titles in music.js are content CJ swaps, so their hanzi are left to the system
    # CJK fallback on purpose, as is anything a visitor types.
    zh = set()
    for s in [e[1].split(' · ')[0] for e in eras] + [n[1] for n in names] + walk_strs:
        zh |= hanzi(s)
    return {'big': big, 'light': light, 'hud': hud_set, 'zh': zh}

def main():
    sets = glyph_sets()
    for k, v in sets.items(): print('%-4s %3d  %s' % (k, len(v), ''.join(sorted(v))))
    tmp = tempfile.mkdtemp(prefix='omt-fonts-')
    total = 0
    for src, dst, key in FACES:
        local = os.path.join(tmp, os.path.basename(src).replace('%5B', '[').replace('%5D', ']'))
        cached = CACHE and os.path.join(CACHE, os.path.basename(local))
        if cached and os.path.exists(cached): local = cached
        else: urllib.request.urlretrieve(RAW + src, local)
        unicodes = ','.join('U+%04X' % ord(c) for c in sorted(sets[key] | {' '}))
        out = os.path.join(FONTS, dst)
        subprocess.run([sys.executable, '-m', 'fontTools.subset', local, '--unicodes=' + unicodes, '--flavor=woff2', '--no-hinting',
                        '--desubroutinize', '--name-IDs=0,1,2,3,4,5,6,13,14', '--notdef-outline', '--output-file=' + out], check=True)
        total += os.path.getsize(out)
        print('%-36s %9d -> %6d bytes' % (src, os.path.getsize(local), os.path.getsize(out)))
    print('total %d bytes (%.1f KB)' % (total, total / 1024))

if __name__ == '__main__':
    main()
