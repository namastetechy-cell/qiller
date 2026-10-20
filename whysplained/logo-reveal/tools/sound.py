"""Procedural sound for the 3 s reveal, locked to TIMELINE in index.html (120 bpm, beat = 0.5 s).
Usage: python3 -I tools/sound.py out/audio_raw.wav
Cues: 0.50 tick (dot lands) | 0.50-1.00 soft air (? draws) | 1.00 motif note 1 "the question"
      | 2.00 motif note 2 "the answer" over a low pad that tails out by 3.0 s.
Seeded noise only, so the file is identical every run."""
import sys, wave
import numpy as np

SR, DUR = 48000, 3.0
n = int(SR * DUR)
t = np.arange(n) / SR
rng = np.random.default_rng(7)
mix = np.zeros(n)

def env(start, attack, decay):
    e = np.zeros(n)
    k = t >= start
    tt = t[k] - start
    e[k] = np.minimum(tt / attack, 1.0) * np.exp(-np.maximum(tt - attack, 0) / decay)
    return e

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y

def mallet(start, f, gain, decay=0.55):
    """soft marimba-ish tone: fundamental + quiet 4th partial that dies fast"""
    tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * env(start, 0.002, 0.05)
    return gain * tone * env(start, 0.004, decay)

# tick: dot lands (beat 1)
tick = np.sin(2 * np.pi * 2200 * t) * env(0.50, 0.0005, 0.012) + 0.4 * rng.standard_normal(n) * env(0.50, 0.0005, 0.004)
mix += 0.35 * tick

# soft air while the ? draws (band-limited noise swelling then gone by 1.05)
x = rng.standard_normal(n); air = onepole_lp(x, 2500) - onepole_lp(x, 250)  # band-pass
air_env = np.clip((t - 0.50) / 0.35, 0, 1) ** 2 * np.clip((1.05 - t) / 0.15, 0, 1)
mix += 0.22 * air * air_env

# motif: B4 = question (beat 2), E5 + B5 = answer resolves up a fourth (beat 4)
mix += mallet(1.00, 493.88, 0.30)
mix += mallet(2.00, 659.25, 0.34, 0.9) + mallet(2.00, 987.77, 0.10, 0.6)

# low pad (E2 + B2) under the lockup, enters with the question, fades out to silence at 3.0
pad = np.sin(2 * np.pi * 82.41 * t) + 0.6 * np.sin(2 * np.pi * 123.47 * t) + 0.15 * np.sin(2 * np.pi * 164.81 * t)
pad_env = np.clip((t - 1.0) / 0.8, 0, 1) * np.clip((3.0 - t) / 0.6, 0, 1)
mix += 0.16 * pad * pad_env

# final 20 ms fade so the cut is click-free
mix *= np.clip((DUR - t) / 0.02, 0, 1)
mix /= np.max(np.abs(mix)) * 1.05

pcm = (np.stack([mix, mix], 1) * 32767).astype("<i2")
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1])
