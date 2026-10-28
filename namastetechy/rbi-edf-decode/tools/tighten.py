"""Shorten every pause in the voiceover to `keep` seconds (pauses shorter than `min_gap` are left alone).

A pause is a run of 10 ms frames below `thresh` dBFS. Cuts are made in the middle of the pause with a
short crossfade, so no word edges are touched.
usage: python3 tighten.py in.mp3 out.wav [min_gap=0.35] [keep=0.22] [thresh=-42]
"""
import subprocess
import sys

import numpy as np
import soundfile as sf

src, dst = sys.argv[1], sys.argv[2]
min_gap, keep, thresh = (float(x) for x in (sys.argv[3:6] + ["0.35", "0.22", "-42"][len(sys.argv[3:6]):]))
SR = 48000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
hop = SR // 100; n = len(a) // hop
db = 20 * np.log10(np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1)) + 1e-9)
quiet = db < thresh

out, pos, cut, i, xf = [], 0, 0.0, 0, int(0.01 * SR)
while i < n:
    j = i
    while j < n and quiet[j] == quiet[i]:
        j += 1
    dur = (j - i) / 100
    if quiet[i] and dur >= min_gap and i > 0 and j < n:
        # keep keep/2 after the word that ends the pause's start and keep/2 before the next word
        s = i * hop + int(keep / 2 * SR); e = j * hop - int(keep / 2 * SR)
        out.append(a[pos:s]); pos = e; cut += (e - s) / SR
    i = j
out.append(a[pos:])
y = out[0]
for seg in out[1:]:  # 10 ms equal-power crossfade at each join
    f = np.linspace(0, 1, xf)
    y = np.concatenate([y[:-xf], y[-xf:] * np.cos(f * np.pi / 2) + seg[:xf] * np.sin(f * np.pi / 2), seg[xf:]])
sf.write(dst, y.astype(np.float32), SR)
print(f"{len(out) - 1} pauses shortened, {cut:.1f}s removed: {len(a) / SR:.1f}s -> {len(y) / SR:.1f}s")
