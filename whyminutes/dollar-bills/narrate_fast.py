"""Fast-paced narration: tight sentence gaps and internal pauses squeezed. Writes narration.wav + segments.json."""
import json, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
script, outdir, voice, speed = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
k = Kokoro(sys.argv[5], sys.argv[6])
SR = 24000
SAY = [("1 dollar", "one dollar"), ("a 100", "a hundred"), ("1861", "eighteen sixty-one"), ("1929", "nineteen twenty-nine"), ("...", ",")]

def squeeze(a, max_gap=0.25, keep=0.14):
    """shorten internal silences longer than max_gap to keep seconds"""
    hop = int(0.01 * SR); n = len(a) // hop
    rms = np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1))
    quiet = rms < 0.008; out = []; i = 0
    while i < n:
        j = i
        while j < n and quiet[j] == quiet[i]: j += 1
        seg = a[i * hop: j * hop]
        if quiet[i] and (j - i) * 0.01 > max_gap and i > 0 and j < n:
            half = int(keep * SR / 2); seg = np.concatenate([seg[:half], seg[-half:]])
        out.append(seg); i = j
    out.append(a[n * hop:])
    return np.concatenate(out)

paras = [p.strip() for p in open(script).read().split("\n\n") if p.strip()]
audio = [np.zeros(int(0.15 * SR), dtype=np.float32)]; t = 0.15; segs = []
for pi, para in enumerate(paras):
    # sentence split that ignores initials like "B.F." and keeps quoted endings together
    safe = para.replace("Surprise!\"", "Surprise‼\"").replace("\n", " ")
    parts = re.findall(r'.+?(?:[.?!]+"?(?=\s|$)|$)', safe)
    for s in parts:
        text = s.strip().replace("‼", "!")
        if not text: continue
        spoken = text
        for a_, b_ in SAY: spoken = spoken.replace(a_, b_)
        a, sr = k.create(spoken, voice=voice, speed=speed, lang="en-us")
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - 480): nz[-1] + 960] if len(nz) else a
        a = squeeze(a.astype(np.float32))
        segs.append({"para": pi, "text": text, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
        audio.append(a); t += len(a) / SR
        gap = 0.1 if len(text) < 25 else 0.14
        audio.append(np.zeros(int(gap * SR), dtype=np.float32)); t += gap
    audio.append(np.zeros(int(0.2 * SR), dtype=np.float32)); t += 0.2
audio.append(np.zeros(int(0.6 * SR), dtype=np.float32)); t += 0.6
full = np.concatenate(audio)
sf.write(f"{outdir}/narration.wav", full, SR)
json.dump({"duration": round(len(full) / SR, 3), "segments": segs}, open(f"{outdir}/segments.json", "w"), indent=1)
print(len(segs), "segments,", round(len(full) / SR, 2), "s")
