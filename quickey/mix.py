"""Quickey promo audio: a 120 BPM synthesized bed (kick, offbeat hats, sub pulse, pad) plus cut-locked SFX.
The bed drops out for the "There's a key for that." breath (2.0-3.5s) and slams back on the key press.
usage: python3 mix.py  -> assets/audio/mix.wav
"""
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

SR = 48000
DUR = 13.0
rng = np.random.default_rng(7)
T = lambda d: np.arange(int(d * SR)) / SR
out = np.zeros((int(DUR * SR), 2))


def band(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band")
    return lfilter(b, a, x)


def hp(x, f):
    b, a = butter(2, f / (SR / 2), "high")
    return lfilter(b, a, x)


def env(n, a=0.004, r=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def add(t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(out):
        return
    sig = sig[: len(out) - i] * gain
    out[i:i + len(sig), 0] += sig * (1 - max(0, pan))
    out[i:i + len(sig), 1] += sig * (1 + min(0, pan))


# ---------- instruments ----------
def kick():
    t = T(0.35); f = 48 + 110 * np.exp(-t * 32)
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.12))


def hat():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.018)


def clap():
    n = int(0.2 * SR); x = band(rng.standard_normal(n), 900, 5000); e = np.zeros(n)
    for k in range(3):
        s = int(k * 0.011 * SR); e[s:] += env(n - s, 0.0005, 0.012 if k < 2 else 0.06)
    return x * e


def sub(f, d):
    t = T(d)
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t / (d * 0.6))


def pad(freqs, d, attack=0.6):
    t = T(d); x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.004, 0, 0.004):
            ph = 2 * np.pi * f * (1 + det) * t
            x += np.sin(ph) + 0.25 * np.sin(2 * ph)
    x /= len(freqs) * 3
    return x * np.minimum(1, t / attack) * np.minimum(1, (d - t) / 0.8).clip(0)


def swish(d=0.3, lo=700, hi=3600):
    n = int(d * SR); x = rng.standard_normal(n); o = np.zeros(n); k = 10
    for i in range(k):
        s, e = i * n // k, (i + 1) * n // k
        c = lo + (hi - lo) * np.sin(np.pi * (i + 0.5) / k)
        o[s:e] = band(x, c * 0.6, c * 1.4)[s:e]
    return o * np.sin(np.linspace(0, np.pi, n)) ** 1.5


def tick():
    t = T(0.04)
    return np.sin(2 * np.pi * 3200 * t) * env(len(t), 0.0003, 0.006)


def keyclick():
    t = T(0.09)
    body = np.sin(2 * np.pi * 1400 * t) * env(len(t), 0.0003, 0.01)
    snap = hp(rng.standard_normal(len(t)), 2500) * env(len(t), 0.0003, 0.004)
    thock = np.sin(2 * np.pi * np.cumsum(220 + 300 * np.exp(-t * 80)) / SR) * env(len(t), 0.0005, 0.03)
    return 0.6 * body + 0.6 * snap + 0.8 * thock


def pop():
    t = T(0.09); f = 300 + 900 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.03)


def boom():
    t = T(1.4); f = 38 + 90 * np.exp(-t * 8)
    return np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.45)) + 0.25 * band(rng.standard_normal(len(t)), 80, 900) * env(len(t), 0.002, 0.15)


def riser(d):
    t = T(d); f = 300 * (6 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    noise = hp(rng.standard_normal(len(t)), 2000) * 0.5
    return (tone + noise) * (t / d) ** 2.2


def bell(f0=1318.5):
    t = T(1.6)
    return sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * dcy) for m, a, dcy in [(1, 1, 2.2), (2.76, 0.4, 4), (5.4, 0.2, 7)]) * np.minimum(1, t / 0.002)


def flick():
    n = int(0.03 * SR)
    return band(rng.standard_normal(n), 1500, 7000) * env(n, 0.0005, 0.007)


# ---------- bed: 120 BPM, beat = 0.5s ----------
BEAT = 0.5
bed_on = lambda t: t < 2.0 or 3.5 <= t < 12.0
for i in range(int(DUR / BEAT * 2)):
    t = i * BEAT / 2
    if not bed_on(t):
        continue
    if i % 2 == 0:
        add(t, kick(), 0.85)
        add(t, sub(55 if t < 7 else 49, 0.45), 0.35)
    else:
        add(t, hat(), 0.22, pan=0.3 if i % 4 == 1 else -0.3)
    if i % 4 == 2 and t >= 4.5:
        add(t, clap(), 0.35)
# hook: extra kicks under each word
for t in (0.25, 0.75):
    add(t, kick(), 0.55)
# pads: A minor-ish tension, then lift; end card resolves on Fmaj7 -> Cmaj9 shimmer
add(0.0, pad([220, 261.6, 329.6], 2.2, 0.05), 0.10)
add(3.5, pad([174.6, 220, 261.6, 329.6], 3.5, 0.02), 0.11)
add(7.0, pad([196, 246.9, 293.7, 370], 3.3, 0.02), 0.10)
add(10.25, pad([130.8, 196, 246.9, 293.7, 329.6], 2.75, 0.3), 0.16)

# ---------- SFX ----------
for t in (0.0, 0.25, 0.5):
    add(t, tick(), 0.4)
add(1.0, swish(0.25), 0.35)
for i in range(14):
    add(1.0 + i * 0.03 + 0.12, flick(), 0.35, pan=((i * 37) % 9 - 4) / 5)
add(1.45, pop(), 0.35)
add(2.0, swish(0.3, 400, 1800), 0.2)
add(2.3, riser(1.2), 0.35)
add(3.0, swish(0.4, 300, 2500), 0.45)
add(3.48, keyclick(), 0.9)
add(3.5, boom(), 0.9)
add(3.98, swish(0.35, 1200, 5000), 0.18)
add(4.5, swish(0.25), 0.3)
add(4.98, keyclick(), 0.8)
add(5.04, swish(0.45, 900, 4500), 0.35)
add(5.55, pop(), 0.5)
add(6.15, tick(), 0.3); add(6.3, tick(), 0.3)
add(6.72, swish(0.4, 600, 6000), 0.55)
for t in (7.0, 7.5, 8.0, 8.5):
    add(t, pop(), 0.45)
    add(t, swish(0.18, 1500, 5000), 0.18)
add(7.6, swish(0.3, 3000, 400), 0.25)
add(8.06, swish(0.4, 2000, 3000), 0.12)
for k in range(6):
    add(9.04 + k * 0.07, tick(), 0.3 - k * 0.03)
add(9.0, boom(), 0.5)
add(10.25, swish(0.4, 400, 2200), 0.3)
add(10.28, kick(), 0.7)
add(10.9, pop(), 0.35)
add(11.7, bell(), 0.35)
add(11.7, bell(1975.5), 0.15)

# ---------- master ----------
fade = np.ones(len(out)); fs = int(11.9 * SR); fade[fs:] = np.linspace(1, 0, len(out) - fs) ** 1.5
out *= fade[:, None]
out = np.tanh(out * 1.1)
out *= 0.89 / np.max(np.abs(out))
sf.write("assets/audio/mix.wav", out.astype(np.float32), SR, subtype="PCM_16")
print("wrote assets/audio/mix.wav", out.shape[0] / SR, "s")
