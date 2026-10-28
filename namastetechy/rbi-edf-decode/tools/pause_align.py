"""Time caption lines from the pauses in the voiceover, steered by Whisper's confident words.

Whisper loops on this voice, so its words only serve as sparse anchors. Every break between caption
lines is put on a real pause by a monotonic DP whose cost per line is:
  - length: the line's speech time vs. its character count at the global speaking rate (local, so
    one bad guess doesn't push every later line off);
  - anchors: confident Whisper words (sim >= 0.7, 4+ letters, not on a window edge) imply where the
    line starts; disagreement costs, capped so a single wrong anchor can't dominate;
  - a bonus for longer pauses at sentence ends.
Words inside a line are spread by character count over its speech span.
usage: python3 pause_align.py captions.txt voice.wav --anchors words_raw.json [--window 10] -o words.json
"""
import argparse
import json
import re

import numpy as np
import soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument("captions"); ap.add_argument("audio"); ap.add_argument("-o", required=True)
ap.add_argument("--anchors"); ap.add_argument("--window", type=float, default=10.0)
ap.add_argument("--thresh", type=float, default=-40); ap.add_argument("--min-pause", type=float, default=0.1)
args = ap.parse_args()

lines = [l.strip() for l in open(args.captions, encoding="utf-8") if l.strip()]
a, sr = sf.read(args.audio)
a = a.mean(1) if a.ndim > 1 else a
hop = sr // 100; n = len(a) // hop
q = 20 * np.log10(np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1)) + 1e-9) < args.thresh
runs = []; i = 0
while i < n:
    j = i
    while j < n and q[j] == q[i]:
        j += 1
    if q[i] and (j - i) / 100 >= args.min_pause:
        runs.append((i / 100, j / 100))
    i = j
lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
tail = runs[-1][0] if runs and runs[-1][1] >= n / 100 - 0.01 else n / 100
inner = [p for p in runs if p[0] > lead and p[1] < tail]
# nodes: 0 = start of audio, 1..P = pauses, P+1 = end of audio. node k: (speech ends, speech resumes)
nodes = [(lead, lead)] + inner + [(tail, tail)]
P = len(inner)
pause_sum = np.cumsum([0.0] + [e - s for s, e in nodes[1:]])  # silence up to and including node k
def speech_between(k, j):  # speech time from node k's end to node j's start
    return (nodes[j][0] - nodes[k][1]) - (pause_sum[j - 1] - pause_sum[k] if j - 1 > k else 0.0)

SPOKEN = {"2026": "do hazaar chhabbees", "7": "saat", "1": "ek", "6": "chhe", "3": "teen", "4": "chaar"}
def wlen(w):
    return len(re.sub(r"[^a-z]", "", SPOKEN.get(re.sub(r"[^0-9]", "", w), w).lower())) or 2
L = np.array([sum(wlen(w) + 1 for w in l.split()) for l in lines], dtype=float)
total_speech = speech_between(0, P + 1)
rate = total_speech / L.sum()  # seconds per character
strong = [bool(re.search(r'[.?!:]"?$', l)) for l in lines]

# anchors -> implied start time per line
implied = [[] for _ in lines]
if args.anchors:
    for li in range(len(lines)):
        pass
    raw = json.load(open(args.anchors))["words"]
    off = {}
    for w in raw:
        c = off.get(w["line"], 0)
        good = w.get("sim", 0) >= 0.7 and len(re.sub(r"[^A-Za-z]", "", w["text"])) >= 4 and (w["start"] % args.window) > 0.2
        if good:
            implied[w["line"]].append(w["start"] - 0.15 - c * rate)  # Whisper word starts run a touch late
        off[w["line"]] = c + wlen(w["text"]) + 1

def line_cost(b, k, j):
    """line b spoken from node k's end to node j's start"""
    d = speech_between(k, j); e = L[b] * rate
    c = ((d - e) / (0.28 * e + 0.35)) ** 2
    st = nodes[k][1]
    for t in implied[b]:
        c += min(((st - t) / 0.6) ** 2, 4.0)
    if j <= P:  # bonus for a real pause after the line, larger at sentence ends
        c -= (1.2 if strong[b] else 0.5) * min(nodes[j][1] - nodes[j][0], 0.45) / 0.45
    return c

B = len(lines); INF = 1e18
dp = np.full((B, P + 2), INF); bk = np.full((B, P + 2), -1, dtype=int)
for j in range(1, P + 2):
    dp[0][j] = line_cost(0, 0, j)
for b in range(1, B):
    lo = 1 if b < B - 1 else P + 1
    for j in range(max(b + 1, lo), P + 2 if b == B - 1 else P + 1):
        best, arg = INF, -1
        for k in range(b, j):
            if dp[b - 1][k] < INF:
                c = dp[b - 1][k] + line_cost(b, k, j)
                if c < best:
                    best, arg = c, k
        dp[b][j] = best; bk[b][j] = arg
j = P + 1; ends = [0] * B
for b in range(B - 1, -1, -1):
    ends[b] = j; j = bk[b][j]
starts_node = [0] + ends[:-1]

words = []
for li, line in enumerate(lines):
    t0, t1 = nodes[starts_node[li]][1], nodes[ends[li]][0]
    ws = line.split(); lens = [wlen(w) + 1 for w in ws]; tot = sum(lens); c = 0
    for w, ln in zip(ws, lens):
        words.append({"text": w, "line": li, "start": round(t0 + (t1 - t0) * c / tot, 3), "end": round(t0 + (t1 - t0) * (c + ln) / tot, 3)})
        c += ln
json.dump({"lines": lines, "words": words}, open(args.o, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{B} lines, {P} pauses, rate {1 / rate:.1f} chars/s, {sum(len(x) for x in implied)} anchors")
for li in range(B):
    t0, t1 = nodes[starts_node[li]][1], nodes[ends[li]][0]
    anc = f"  anchors {['%.1f' % x for x in implied[li][:3]]}" if implied[li] else ""
    print(f"{t0:7.2f}-{t1:7.2f}  {lines[li][:60]}{anc}")
