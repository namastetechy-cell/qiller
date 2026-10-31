"""Word timings without speech-to-text: split each line into clauses at punctuation, match the clause breaks to the
longest pauses in the TTS audio, then spread each clause's words over its voiced span by letter count.
Writes voice/words.json = {id: [[word, t0, t1], ...]} (seconds from the line's start)."""
import sys, os, json, re, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lines = json.load(open(os.path.join(HERE, 'lines.json')))
out = {}
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voice', L['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    hop = int(sr * .01); n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    on = rms > max(rms) * .04
    idx = np.where(on)[0]; s0, s1 = idx[0], idx[-1] + 1
    gaps = []; i = s0                                   # silent runs ≥ 80 ms inside the speech
    while i < s1:
        if not on[i]:
            j = i
            while j < s1 and not on[j]: j += 1
            if j - i >= 5: gaps.append((i, j))
            i = j
        else: i += 1
    clauses = [c.strip() for c in re.findall(r'[^,.?!]+[,.?!]*', L['text']) if c.strip()]
    k = len(clauses) - 1
    # clause breaks = the set of pauses (in order) that is longest overall while staying near where letter counts expect them
    import itertools
    lens = [len(re.sub(r'[^A-Za-z0-9]', '', c)) + 2 * len(c.split()) for c in clauses]
    exp = [s0 + (s1 - s0) * sum(lens[:b + 1]) / sum(lens) for b in range(k)]
    best, use = -1e9, []
    for comb in itertools.combinations(gaps, min(k, len(gaps))):
        sc = sum(g[1] - g[0] for g in comb) - .05 * sum(abs((g[0] + g[1]) / 2 - e) for g, e in zip(comb, exp))
        if sc > best: best, use = sc, list(comb)
    spans, a = [], s0
    for g in use: spans.append((a, g[0])); a = g[1]
    spans.append((a, s1))
    while len(spans) < len(clauses):                    # fewer pauses than clauses: merge clauses into the last span
        clauses[-2] = clauses[-2] + ' ' + clauses[-1]; clauses.pop()
    W = []
    for c, (a, b) in zip(clauses, spans):
        ws = c.split(); wt = [len(re.sub(r'[^A-Za-z0-9]', '', w)) + 1.5 for w in ws]; tot = sum(wt); t = a
        for w, q in zip(ws, wt):
            d = (b - a) * q / tot; W.append([w, round(t / 100, 3), round((t + d) / 100, 3)]); t += d
    out[L['id']] = W
    print(L['id'], ' '.join(f"{w}@{t0:.2f}" for w, t0, _ in W))
json.dump(out, open(os.path.join(HERE, 'voice', 'words.json'), 'w'), indent=1)
