"""Mix the narration with synthesized SFX in the reference's manner: an airy swish on every cut, soft ticks
on key words, pops on props, plus a few literal ones (shutter, snip, flip, riffle, click). No music.
usage: python3 mix.py  -> assets/audio/mix.wav
"""
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

SR = 48000
rng = np.random.default_rng(11)
T = lambda d: np.arange(int(d * SR)) / SR


def band(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band")
    return lfilter(b, a, x)


def env(n, a=0.004, r=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def swish(d=0.32):
    # band-limited noise whose centre sweeps up then down: an airy, soft pass-by
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n); k = 8
    for i in range(k):
        s, e = i * n // k, (i + 1) * n // k
        c = 900 + 2600 * np.sin(np.pi * (i + 0.5) / k)
        out[s:e] = band(x, c * 0.6, c * 1.4)[s:e]
    return out * np.sin(np.linspace(0, np.pi, n)) ** 1.5


def tick():
    t = T(0.05)
    return np.sin(2 * np.pi * 2600 * t) * env(len(t), 0.0005, 0.008) + 0.3 * band(rng.standard_normal(len(t)), 3000, 8000) * env(len(t), 0.0005, 0.004)


def pop():
    t = T(0.08); f = 280 + 760 * np.exp(-t * 70)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.025)


def whoomp():
    t = T(0.5); f = 60 + 140 * np.exp(-t * 9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.02, 0.18) + 0.25 * swish(0.5)


def flip():
    out = np.zeros(int(0.25 * SR))
    for k in range(3):
        n = int(0.03 * SR); seg = band(rng.standard_normal(n), 1500, 6000) * env(n, 0.001, 0.008)
        out[int(k * 0.045 * SR): int(k * 0.045 * SR) + n] += seg * (1 - k * 0.25)
    return out


def thud():
    t = T(0.25); f = 70 + 80 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.07) + 0.3 * band(rng.standard_normal(len(t)), 200, 1200) * env(len(t), 0.001, 0.03)


def shutter():
    out = np.zeros(int(0.22 * SR))
    for t0, g in ((0, 1), (0.09, 0.7)):
        n = int(0.04 * SR); seg = band(rng.standard_normal(n), 1200, 7000) * env(n, 0.0005, 0.01) * g
        out[int(t0 * SR): int(t0 * SR) + n] += seg
    return out


def snip():
    out = np.zeros(int(0.2 * SR))
    for t0 in (0, 0.07):
        n = int(0.035 * SR); t = np.arange(n) / SR
        seg = (band(rng.standard_normal(n), 2500, 9000) + 0.5 * np.sin(2 * np.pi * 3200 * t)) * env(n, 0.0005, 0.007)
        out[int(t0 * SR): int(t0 * SR) + n] += seg
    return out


def sparkle():
    out = np.zeros(int(0.7 * SR))
    for k, f in enumerate((2093, 2637, 3136, 4186)):
        t = T(0.35); x = np.sin(2 * np.pi * f * t) * env(len(t), 0.002, 0.08)
        i = int(k * 0.05 * SR); out[i:i + len(x)] += x * 0.7
    return out


def riffle():
    out = np.zeros(int(0.5 * SR))
    for k in range(9):
        n = int(0.025 * SR); seg = band(rng.standard_normal(n), 1200, 5000) * env(n, 0.001, 0.006)
        i = int(k * 0.045 * SR); out[i:i + n] += seg
    return out


def click():
    t = T(0.04)
    return (np.sin(2 * np.pi * 1800 * t) + 0.4 * rng.standard_normal(len(t))) * env(len(t), 0.0003, 0.006)


BANK = {k: f() for k, f in dict(swish=swish, tick=tick, pop=pop, whoomp=whoomp, flip=flip, thud=thud, shutter=shutter,
                                 snip=snip, sparkle=sparkle, riffle=riffle, click=click).items()}
LEVEL = dict(swish=0.16, tick=0.10, pop=0.16, whoomp=0.28, flip=0.2, thud=0.3, shutter=0.3, snip=0.28, sparkle=0.12, riffle=0.18, click=0.3)
for k in BANK:
    BANK[k] /= np.abs(BANK[k]).max() + 1e-9

vo, vsr = sf.read("assets/audio/narration.wav")
vo = vo.mean(1) if vo.ndim > 1 else vo
N = int(len(vo) / vsr * SR)
vo = np.interp(np.arange(N) / SR, np.arange(len(vo)) / vsr, vo)
fx = np.zeros(N + SR)
last = {}
for c in json.load(open("assets/audio/sfx.json")):
    typ, t0 = c["type"], c["t"]
    if t0 - last.get(typ, -9) < {"tick": 0.12, "pop": 0.12, "swish": 0.2}.get(typ, 0.05):
        continue  # keep repeated hits from stacking into a buzz
    last[typ] = t0
    i = int(max(t0, 0) * SR); x = BANK[typ] * LEVEL[typ] * c["gain"]
    fx[i:i + len(x)] += x[: len(fx) - i]
mix = vo / (np.abs(vo).max() + 1e-9) * 0.8 + fx[:N]
mix *= 0.95 / max(0.95, np.abs(mix).max())
sf.write("assets/audio/mix.wav", np.stack([mix, mix], 1), SR)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f"mix {N / SR:.2f}s | voice {db(vo / np.abs(vo).max() * 0.8):.1f} dB rms | sfx {db(fx):.1f} dB rms")
