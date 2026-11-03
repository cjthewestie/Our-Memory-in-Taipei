#!/usr/bin/env python3
# make-beds.py — cuts the street beds for ambience.js from CC0 field recordings (item #8, 2026-11-03).
#
#   python3 -I asset/ambience/gen/make-beds.py /path/to/CC0-1.0-Music
#
# The recordings come from the freesound.org folder of the SoundSafari corpus
# (https://github.com/SoundSafari/CC0-1.0-Music), every file there CC0 1.0; each is pulled on its own with
# `git show HEAD:<path>` so a partial clone never downloads the rest. Each bed is a steady stretch chosen by
# its short-term loudness (ffmpeg ebur128, no peaks above the stretch's median by more than ~4 LU), band-limited
# to 120 Hz … 2.6 kHz so it reads as a crowd a little way off and no single voice or word stands out, made
# into a seamless loop (its last 2 s crossfaded over its first 2 s, equal power), normalised to -23 LUFS and
# written as 44.1 kHz mono MP3 at 48 kbps. The firecracker is one crack, cut tight; ambience.js strings it.
import os, subprocess, sys, tempfile, wave
import numpy as np

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR, X = 44100, 2.0
BEDS = [  # out-file, corpus path, start s, loop length s
    ('bed-ximen.mp3', 'freesound.org/186676__timsc__century-square-shanghai-at-night.flac', 20.0, 24.0),
    ('bed-xinyi.mp3', 'freesound.org/186676__timsc__century-square-shanghai-at-night.flac', 178.0, 26.0),
    ('bed-dadao.mp3', 'freesound.org/139951__nikitralala__china_market.aiff', 74.0, 26.0),
]
CRACK = ('crack.mp3', 'freesound.org/197044__genel__firecracker.mp3', 0.33, 0.62)

def fetch(path, tmp):
    f = os.path.join(tmp, 'in' + os.path.splitext(path)[1])
    with open(f, 'wb') as o: subprocess.run(['git', 'show', 'HEAD:' + path], cwd=SRC, stdout=o, check=True)
    return f

def decode(f, start, dur, af):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', f, '-af', af,
                          '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], stdout=subprocess.PIPE, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def encode(x, out, af, br):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as t: name = t.name
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', name, '-af', af, '-ar', str(SR), '-ac', '1', '-map_metadata', '-1',
                    '-c:a', 'libmp3lame', '-b:a', br, '-metadata', 'comment=CC0 1.0 (freesound.org). Edited for Our Memory in Taipei.',
                    os.path.join(OUT, out)], check=True)
    os.unlink(name)
    print(out, os.path.getsize(os.path.join(OUT, out)) // 1024, 'KB')

with tempfile.TemporaryDirectory() as tmp:
    for out, path, start, L in BEDS:
        f = fetch(path, tmp)
        x = decode(f, start, L + X, 'highpass=f=120,highpass=f=120,lowpass=f=2600,lowpass=f=2600')
        n, k = int(L * SR), int(X * SR)
        a, b = x[:n].copy(), x[n:n + k]
        t = np.linspace(0, np.pi / 2, k, dtype=np.float32)
        a[:k] = a[:k] * np.sin(t) + b * np.cos(t)      # the tail runs on into the head: the seam is inside sound
        encode(a, out, 'loudnorm=I=-23:TP=-3:LRA=7', '48k')
    out, path, start, dur = CRACK
    f = fetch(path, tmp)
    x = decode(f, start, dur, 'highpass=f=80')
    x[-2000:] *= np.linspace(1, 0, 2000, dtype=np.float32)
    encode(x, out, 'volume=0dB', '64k')
