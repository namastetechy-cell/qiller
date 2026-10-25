"""Narrate script.txt sentence by sentence with Kokoro; write narration.wav + segments.json."""
import json, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
script, outdir, voice, speed = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
k = Kokoro(sys.argv[5], sys.argv[6])
paras = [p.strip() for p in open(script).read().split("\n\n") if p.strip()]
SR = 24000; audio = [np.zeros(int(0.4 * SR), dtype=np.float32)]; t = 0.4; segs = []
for pi, para in enumerate(paras):
    # split into sentences; a "…" splits too and earns a longer, dramatic pause
    parts = re.findall(r'[^.?!…]+(?:[.?!]+"?|…)', para)
    for s in parts:
        text = s.strip()
        if not text: continue
        spoken = text.replace("…", "...").replace("ADHD", "A.D.H.D.")
        a, sr = k.create(spoken, voice=voice, speed=speed, lang="en-us")
        # trim leading/trailing near-silence so timings are tight
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - 600): nz[-1] + 1200] if len(nz) else a
        segs.append({"para": pi, "text": text, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
        audio.append(a.astype(np.float32)); t += len(a) / SR
        gap = 0.55 if text.endswith("…") else 0.32
        audio.append(np.zeros(int(gap * SR), dtype=np.float32)); t += gap
    audio.append(np.zeros(int(0.45 * SR), dtype=np.float32)); t += 0.45
audio.append(np.zeros(int(0.8 * SR), dtype=np.float32)); t += 0.8
full = np.concatenate(audio)
sf.write(f"{outdir}/narration.wav", full, SR)
json.dump({"duration": round(len(full) / SR, 3), "segments": segs}, open(f"{outdir}/segments.json", "w"), indent=1)
print(len(segs), "segments,", round(len(full) / SR, 2), "s")
