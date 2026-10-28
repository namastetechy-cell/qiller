"""Give every script word a start/end from Whisper's word timestamps on the narration.

Script and ASR tokens are matched in order (difflib on normalized text); words Whisper split, merged or
spelled differently ("$1" vs "1 dollar", "green backs") are spread across the gap between matched neighbours.
usage: python3 align_words.py input/script.txt assets/audio/asr.json assets/audio/words.json
"""
import json
import re
import sys
from difflib import SequenceMatcher

script, asr_path, out = sys.argv[1:4]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
paras = [p.split() for p in open(script).read().split("\n\n") if p.strip()]
words = [(w, pi) for pi, p in enumerate(paras) for w in p]
asr = [{"w": c["text"].strip(), "s": c["timestamp"][0], "e": c["timestamp"][1] or c["timestamp"][0] + 0.25} for c in json.load(open(asr_path))["chunks"]]

a = [norm(w) for w, _ in words]
b = [norm(x["w"]) for x in asr]
times = [None] * len(words)
for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
    for k in range(blk.size):
        times[blk.a + k] = [asr[blk.b + k]["s"], asr[blk.b + k]["e"]]

i = 0
while i < len(times):
    if times[i]:
        i += 1; continue
    j = i
    while j < len(times) and not times[j]:
        j += 1
    lo = times[i - 1][1] if i else 0.0
    hi = times[j][0] if j < len(times) else lo + 0.3 * (j - i)
    step = max(hi - lo, 0.12 * (j - i)) / (j - i)
    for k in range(i, j):
        times[k] = [lo + step * (k - i), lo + step * (k - i + 1)]
    i = j

res = [{"w": w, "p": pi, "s": round(t[0], 3), "e": round(t[1], 3)} for (w, pi), t in zip(words, times)]
json.dump(res, open(out, "w"), indent=0)
print(len(res), "words;", sum(1 for x in a if x not in b), "not heard verbatim")
