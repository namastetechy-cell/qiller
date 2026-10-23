"""Re-time an align.py words.json from its confident anchors only.

Anchors = words matched with sim >= --min (default 0.55). Anchors that would imply an
impossible speaking rate between neighbours (> MAX_CPS characters/sec) are dropped.
Every other word is placed by cumulative character count between its two anchors,
which tracks real speech far better than equal spacing per word.

usage: python3 retime.py words.json [--min 0.55] [--duration 342.75] -o words_retimed.json
"""
import argparse
import json

MAX_CPS, MIN_CPS = 24.0, 4.0

ap = argparse.ArgumentParser()
ap.add_argument("words"); ap.add_argument("-o", required=True)
ap.add_argument("--min", type=float, default=0.55); ap.add_argument("--duration", type=float, required=True)
a = ap.parse_args()
d = json.load(open(a.words)); W = d["words"]
L = [len(w["text"]) + 1 for w in W]
pos = [0]
for n in L: pos.append(pos[-1] + n)            # character offset at each word start
anchors = [(i, W[i]["start"]) for i, w in enumerate(W) if w.get("sim", 0) >= a.min]
anchors = [(0, min(W[0]["start"], anchors[0][1] if anchors else 0))] + anchors + [(len(W), a.duration)]
# drop anchors that break monotonic time or plausible speaking rate
changed = True
while changed:
    changed = False
    for k in range(1, len(anchors) - 1):
        (i0, t0), (i1, t1), (i2, t2) = anchors[k - 1], anchors[k], anchors[k + 1]
        r1 = (pos[i1] - pos[i0]) / max(t1 - t0, 1e-3); r2 = (pos[i2] - pos[i1]) / max(t2 - t1, 1e-3)
        if t1 <= t0 or t2 <= t1 or r1 > MAX_CPS or r2 > MAX_CPS or (r1 < MIN_CPS and pos[i1] - pos[i0] > 40):
            anchors.pop(k); changed = True; break
for k in range(len(anchors) - 1):
    (i0, t0), (i1, t1) = anchors[k], anchors[k + 1]
    span = max(pos[i1] - pos[i0], 1)
    # leave natural pauses: if the gap is slow, speech fills at most 15 cps then waits
    dur = t1 - t0; speak = min(dur, span / 15.0)
    for i in range(i0, i1):
        W[i]["start"] = round(t0 + speak * (pos[i] - pos[i0]) / span, 3)
        W[i]["end"] = round(t0 + speak * (pos[i + 1] - pos[i0] - 1) / span, 3)
json.dump(d, open(a.o, "w"), ensure_ascii=False, indent=1)
print(f"{len(anchors) - 2} anchors kept of {sum(1 for w in W if w.get('sim', 0) >= a.min)}")
