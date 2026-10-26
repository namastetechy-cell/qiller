"""Synthesize the music bed + SFX and mix them under the narration.

Music: warm, light "story" groove (Fmaj7 - G - Em7 - Am7, 100 bpm): soft e-piano chords, round bass,
plucked arpeggios, brushed kit. Sections follow the story's mood (quiet hook, steady middle, brighter
"real life" stretch, warm party, gentle outro). SFX cues come from build.mjs (assets/audio/sfx.json).
usage: python3 mix.py  -> assets/audio/mix.wav (+ mix.mp3 via ffmpeg)
"""
import json
import numpy as np
import soundfile as sf

SR = 48000
rng = np.random.default_rng(7)
seg = json.load(open("assets/audio/segments.json"))
DUR = seg["duration"]
N = int(DUR * SR)
T = lambda d: np.arange(int(d * SR)) / SR


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, x, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    buf[max(i, 0):j] += g * x[max(0, -i): j - i]


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def lowpass(x, cut):
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):  # one-pole; only used on short noise bursts
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y


# ---------- instruments ----------
def epiano(m, d):
    t = T(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.4) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.2)
    x *= (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t))
    return x * np.minimum(1, t / 0.012) * np.exp(-t / 1.6) * np.minimum(1, (d - t) / 0.08)


def pluck(m, d=0.5):
    t = T(d); f = hz(m)
    x = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * t) * np.exp(-t * (6 + 5 * k)) for k in range(5))
    return x * np.minimum(1, t / 0.003)


def bass(m, d):
    t = T(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return x * np.minimum(1, t / 0.01) * np.exp(-t / 0.9) * np.minimum(1, (d - t) / 0.05)


def kick():
    t = T(0.35)
    return np.sin(2 * np.pi * (45 * t + 60 * (1 - np.exp(-t * 30)) / 30 * 1)) * np.exp(-t / 0.12) + 0.0


def brush(d=0.18, cut=5000):
    n = int(d * SR)
    return lowpass(rng.standard_normal(n), cut) * env(n, 0.004, d / 3)


def shaker():
    n = int(0.07 * SR); x = rng.standard_normal(n)
    x = x - lowpass(x, 6000)  # keep the top end
    return x * env(n, 0.003, 0.02)


SNARE = brush(0.25, 3500); HAT = shaker(); KICK = kick()

# ---------- arrangement ----------
BPM = 100; beat = 60 / BPM; bar = 4 * beat
CHORDS = [(53, [57, 60, 64, 65]), (55, [59, 62, 67, 69]), (52, [55, 59, 62, 64]), (57, [60, 64, 67, 69])]  # root, voicing
t_ = lambda i: seg["segments"][i]["start"]
# energy: 0 = keys only, 1 = + bass/shaker, 2 = + kick/snare, 3 = + arps
SECTIONS = [(0, 1), (t_(3), 2), (t_(8), 3), (t_(11), 2), (t_(16), 2), (t_(21), 1), (t_(27), 2), (t_(30), 2),
            (t_(39), 3), (t_(45), 1), (t_(47), 2), (t_(50), 3), (t_(56), 1), (t_(59), 2)]
energy = lambda tt: [e for s, e in SECTIONS if s <= tt][-1]

music = np.zeros(N + SR * 3)
nb = int(DUR / bar) + 2
for b in range(nb):
    t0 = b * bar
    root, voic = CHORDS[b % 4]
    e = energy(t0)
    for k, m in enumerate(voic):
        place(music, epiano(m, bar * 0.98), t0 + k * 0.012, 0.16)
    if e >= 1:
        place(music, bass(root - 12, beat * 1.9), t0, 0.32); place(music, bass(root - 12, beat * 1.4), t0 + 2.5 * beat, 0.26)
        for s in range(8):
            place(music, HAT, t0 + s * beat / 2, 0.05 if s % 2 else 0.035)
    if e >= 2:
        for s in (0, 2.5):
            place(music, KICK, t0 + s * beat, 0.42)
        for s in (1, 3):
            place(music, SNARE, t0 + s * beat, 0.11)
    if e >= 3:
        arp = [voic[0] + 12, voic[2] + 12, voic[1] + 12, voic[3] + 12]
        for s in range(8):
            place(music, pluck(arp[s % 4], 0.45), t0 + s * beat / 2, 0.08)

# gentle fade in/out and a tail after the last word
fade = np.ones(len(music)); fi = int(1.0 * SR); fade[:fi] = np.linspace(0, 1, fi)
end = int((DUR - 2.0) * SR); fade[end:] = np.linspace(1, 0, len(music) - end).clip(0)
music = (music * fade)[:N]

# ---------- sfx ----------
def s_pop():
    t = T(0.09); f = 300 + 700 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.03)


def s_whoosh():
    n = int(0.42 * SR); x = rng.standard_normal(n)
    sh = np.sin(np.linspace(0, np.pi, n)) ** 2
    lo = lowpass(x, 1800); hi = lowpass(x, 600)
    return (lo - hi) * sh * 1.6


def s_ding(f=1318.5):
    t = T(0.9)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.01 * f * t) + 0.5 * np.sin(2 * np.pi * 1.5 * f * t) * (t > 0.08)) * env(len(t), 0.002, 0.28)


def s_sparkle():
    out = np.zeros(int(0.8 * SR))
    for k, m in enumerate([84, 88, 91, 96]):
        place(out, pluck(m, 0.4) * 0.8, k * 0.06)
    return out


def s_thud():
    t = T(0.3); f = 55 + 90 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.09) + 0.3 * brush(0.3, 1500)[: len(t)]


def s_tick():
    t = T(0.08)
    return np.sin(2 * np.pi * 2200 * t) * env(len(t), 0.001, 0.012)


def s_click():
    t = T(0.06)
    return (np.sin(2 * np.pi * 1600 * t) + 0.5 * rng.standard_normal(len(t))) * env(len(t), 0.0005, 0.008)


def s_clap():
    return brush(0.15, 4000) * 1.5


def s_buzz():
    t = T(0.45); f = 110
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * 2 * f * t) * 0.3
    return lowpass(x, 900) * env(len(t), 0.01, 0.3)


def s_boing():
    t = T(0.35); f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.12)


def s_sadhorn():
    out = np.zeros(int(2.2 * SR))
    for k, (m, d) in enumerate([(62, 0.38), (61, 0.38), (60, 0.38), (59, 1.0)]):
        t = T(d); f = hz(m) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * (t > 0.2))
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = sum(np.sin(ph * h) / h for h in range(1, 8))
        x = lowpass(x, 1100) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.06)
        place(out, x, k * 0.4)
    return out


def s_party():
    t = T(0.6); f = 380 + 260 * np.minimum(1, t / 0.25)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.03 * np.sin(2 * np.pi * 18 * t))) / SR
    horn = lowpass(sum(np.sin(ph * h) / h for h in range(1, 6)), 2200) * np.minimum(1, t / 0.02) * np.minimum(1, (0.6 - t) / 0.08)
    out = np.zeros(int(1.2 * SR)); place(out, horn, 0, 0.7)
    for k in range(6):
        place(out, s_pop(), 0.05 + k * 0.07 + rng.random() * 0.03, 0.6)
    place(out, s_sparkle(), 0.3, 0.6)
    return out


def s_chalk():
    n = int(0.6 * SR); x = rng.standard_normal(n); x = x - lowpass(x, 3000)
    am = (np.sin(2 * np.pi * 9 * np.arange(n) / SR) > 0).astype(float)
    return x * am * env(n, 0.01, 0.4) * 0.6


BANK = {"pop": s_pop(), "whoosh": s_whoosh(), "ding": s_ding(), "sparkle": s_sparkle(), "thud": s_thud(), "tick": s_tick(),
        "click": s_click(), "clap": s_clap(), "buzz": s_buzz(), "boing": s_boing(), "sadhorn": s_sadhorn(), "party": s_party(), "chalk": s_chalk()}
LEVEL = {"pop": 0.22, "whoosh": 0.10, "ding": 0.13, "sparkle": 0.16, "thud": 0.30, "tick": 0.2, "click": 0.3, "clap": 0.3,
         "buzz": 0.16, "boing": 0.2, "sadhorn": 0.2, "party": 0.32, "chalk": 0.08}
for k in BANK:
    BANK[k] = BANK[k] / (np.abs(BANK[k]).max() + 1e-9)

fx = np.zeros(N + SR * 3)
last = {}
for c in json.load(open("assets/audio/sfx.json")):
    typ, t0 = c["type"], c["t"]
    if typ in ("pop", "whoosh") and t0 - last.get(typ, -9) < (0.22 if typ == "pop" else 1.0):
        continue  # no machine-gun pops / back-to-back whooshes
    last[typ] = t0
    place(fx, BANK[typ], t0, LEVEL[typ] * c["gain"])
fx = fx[:N]

# ---------- mix: duck the bed a little under the voice ----------
vo, vsr = sf.read("assets/audio/narration.wav")
if vo.ndim > 1:
    vo = vo.mean(1)
vo = np.interp(np.arange(N) / SR, np.arange(len(vo)) / vsr, vo)
hop = int(0.05 * SR); nfr = N // hop + 1
rms = np.array([np.sqrt(np.mean(vo[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(nfr)])
active = (rms > 0.01).astype(float)
k = np.ones(8) / 8; active = np.convolve(active, k, "same")  # ~0.4 s smoothing
duck = np.repeat(1 - 0.3 * active, hop)[:N]
voice = vo / (np.abs(vo).max() + 1e-9) * 0.62
BED = 0.09  # bed sits ~14 dB under the voice
mix = voice + music * duck * BED + fx
peak = np.abs(mix).max()
if peak > 0.95:
    mix *= 0.95 / peak
st = np.stack([mix, mix], 1)
sf.write("assets/audio/mix.wav", st, SR)
print(f"mix: {DUR:.2f}s, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f"rms  voice {db(voice):.1f} dB | bed {db(music * duck * BED):.1f} dB | sfx {db(fx):.1f} dB")
