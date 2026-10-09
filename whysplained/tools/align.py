"""Align a Hinglish (Latin-script) caption text to Whisper's Devanagari word timings.

Whisper hears Hinglish best in Hindi mode, which writes Devanagari. This script
transliterates those words to rough Latin, reduces both sides to consonant
skeletons, aligns the two sequences (Needleman-Wunsch), and gives every caption
word a start/end. Caption words with no confident match are spread evenly over
the gap between their matched neighbours.

usage: python3 align.py captions.txt asr_part1.json[:offset] [asr_part2.json:offset ...] -o words.json
"""
import argparse
import json
import re
from difflib import SequenceMatcher

VOWELS = {"अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऋ": "ri"}
MATRAS = {"ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ृ": "ri", "ॅ": "e", "ॉ": "o"}
CONS = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n", "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
    "ष": "sh", "स": "s", "ह": "h", "ड़": "d", "ढ़": "dh", "क़": "k", "ख़": "kh", "ग़": "g", "ज़": "z", "फ़": "f",
}
VIRAMA, NUKTA = "्", "़"
NASAL = {"ं": "n", "ँ": "n", "ः": "h"}


def translit(word):
    out, i = [], 0
    while i < len(word):
        ch = word[i]
        if i + 1 < len(word) and word[i + 1] == NUKTA and ch + NUKTA in CONS:
            ch, i = ch + NUKTA, i + 1
        if ch in CONS:
            out.append(CONS[ch])
            nxt = word[i + 1] if i + 1 < len(word) else ""
            if nxt in MATRAS:
                out.append(MATRAS[nxt]); i += 1
            elif nxt == VIRAMA:
                i += 1
            elif nxt and nxt not in NASAL:
                out.append("a")
        elif ch in VOWELS:
            out.append(VOWELS[ch])
        elif ch in NASAL:
            out.append(NASAL[ch])
        elif ch.isascii() and ch.isalnum():
            out.append(ch.lower())
        i += 1
    return "".join(out)


def skeleton(latin):
    """Consonant skeleton with sound-alike letters merged (v/w, ph/f, sh/s, z/j, aspirates)."""
    s = latin.lower()
    for a, b in (("chh", "c"), ("ch", "c"), ("sh", "s"), ("ph", "f"), ("kh", "k"), ("gh", "g"), ("jh", "j"),
                 ("th", "t"), ("dh", "d"), ("bh", "b"), ("w", "v"), ("z", "j"), ("q", "k"), ("x", "ks")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z]", "", s)
    if not s:
        return ""
    return s[0] + re.sub(r"[aeiouyh]", "", s[1:])


def sim(a, b):
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def load_asr(spec):
    path, _, off = spec.partition(":")
    off = float(off or 0)
    words = []
    for c in json.load(open(path))["chunks"]:
        t0, t1 = c["timestamp"]
        if t1 is None:
            t1 = t0 + 0.3
        words.append({"text": c["text"].strip(), "start": t0 + off, "end": t1 + off})
    return words


def merge_parts(parts):
    """Join chunked transcriptions; a later part wins from its first word onward."""
    merged = []
    for words in parts:
        if words:
            cut = words[0]["start"]
            merged = [w for w in merged if w["end"] <= cut + 0.05] + words
    # drop hallucinated repeats (zero-length runs Whisper emits when it loops)
    return [w for w in merged if w["end"] - w["start"] >= 0.03 and w["end"] < 1e4]


def align(cap_words, asr_words, gap=-0.45):
    a = [skeleton(w) for w in cap_words]
    b = [skeleton(translit(w["text"])) for w in asr_words]
    n, m = len(a), len(b)
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0], back[i][0] = i * gap, "up"
    for j in range(1, m + 1):
        score[0][j], back[0][j] = j * gap, "left"
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = sim(a[i - 1], b[j - 1])
            cands = [(score[i - 1][j - 1] + (2 * s - 0.8), "diag"), (score[i - 1][j] + gap, "up"), (score[i][j - 1] + gap, "left")]
            score[i][j], back[i][j] = max(cands)
    pairs, i, j = [], n, m
    while i > 0 or j > 0:
        mv = back[i][j]
        if mv == "diag":
            pairs.append((i - 1, j - 1, sim(a[i - 1], b[j - 1]))); i, j = i - 1, j - 1
        elif mv == "up":
            pairs.append((i - 1, None, 0)); i -= 1
        else:
            j -= 1
    return list(reversed(pairs))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("captions")
    ap.add_argument("asr", nargs="+")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--min-sim", type=float, default=0.34)
    args = ap.parse_args()

    lines = [l.strip() for l in open(args.captions, encoding="utf-8") if l.strip()]
    cap = []  # (word, line_index)
    for li, line in enumerate(lines):
        for w in line.split():
            cap.append((w, li))
    asr = merge_parts([load_asr(s) for s in args.asr])
    pairs = align([w for w, _ in cap], asr)

    times = [None] * len(cap)
    report = []
    for ci, aj, s in pairs:
        if aj is not None and s >= args.min_sim:
            times[ci] = [asr[aj]["start"], asr[aj]["end"]]
        report.append((cap[ci][0], asr[aj]["text"] if aj is not None else "—", round(s, 2)))

    # Fill unmatched words by spreading them across the gap between known neighbours.
    i = 0
    while i < len(times):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i > 0 else (times[j][0] - 0.3 * (j - i) if j < len(times) else 0)
        hi = times[j][0] if j < len(times) else lo + 0.3 * (j - i)
        if hi - lo < 0.12 * (j - i):  # no room: borrow time from the neighbours
            lo = times[i - 1][0] + (times[i - 1][1] - times[i - 1][0]) / 2 if i > 0 else lo
            if i > 0:
                times[i - 1][1] = lo
        step = (hi - lo) / (j - i)
        for k in range(i, j):
            times[k] = [lo + step * (k - i), lo + step * (k - i + 1)]
        i = j

    words = [{"text": w, "line": li, "start": round(t[0], 3), "end": round(t[1], 3)} for (w, li), t in zip(cap, times)]
    json.dump({"lines": lines, "words": words}, open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    weak = [r for r in report if r[2] < args.min_sim]
    print(f"{len(words)} caption words, {len(asr)} asr words, {len(words) - len(weak)} matched, {len(weak)} interpolated")
    for w, a, s in weak:
        print(f"  ~ {w!r:18} <- {a} ({s})")


if __name__ == "__main__":
    main()
