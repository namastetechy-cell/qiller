"""Final pass on a rendered Short: replace stray black frames (often baked into the raw
export at cuts) with the previous frame, re-encode to upload-friendly H.264/AAC, and
report QC numbers (black frames, audio offset/drift vs the raw voiceover, peak level).

usage: python3 -I finalize.py render.mp4 raw.mp4 final.mp4
"""
import re
import subprocess
import sys

import numpy as np


def run(args):
    return subprocess.run(args, capture_output=True, text=True).stderr


def black_frames(path, fps=30):
    log = run(["ffmpeg", "-i", path, "-vf", "blackdetect=d=0.03:pix_th=0.06", "-an", "-f", "null", "-"])
    spans = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", log)
    return [(round(float(a) * fps), round(float(b) * fps) - 1) for a, b in spans]


def pcm(path, sr=8000):
    out = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(out, np.float32)


def offsets_ms(raw, final, sr=8000):
    res = []
    dur = min(len(raw), len(final)) / sr
    for t in np.linspace(1, dur - 3, 5):
        a = raw[int(t * sr):int((t + 2) * sr)]
        best = max(((float(np.dot(a, final[int(t * sr) + lag:int((t + 2) * sr) + lag])), lag) for lag in range(-800, 801, 4)))
        res.append((round(t, 1), best[1] / sr * 1000))
    return res


def main():
    render, raw, final = sys.argv[1:4]
    # only patch flashes of 1-3 frames, never real fades
    spans = [(a, b) for a, b in black_frames(render) if a > 0 and b - a < 3]
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-i", render]
    if spans:
        n = len(spans)
        graph = [f"[0:v]split={n + 1}[v0]" + "".join(f"[r{i}]" for i in range(n))]
        for i, (a, b) in enumerate(spans):
            graph.append(f"[v{i}][r{i}]freezeframes=first={a}:last={b}:replace={a - 1}[v{i + 1}]")
        cmd += ["-filter_complex", ";".join(graph), "-map", f"[v{n}]"]
    else:
        cmd += ["-map", "0:v"]
    cmd += ["-map", "0:a", "-c:a", "aac", "-b:a", "192k", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
            "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", final]
    subprocess.run(cmd, check=True)

    print("patched black frames:", spans or "none")
    print("black frames left:", black_frames(final) or "none")
    for t, ms in offsets_ms(pcm(raw), pcm(final)):
        print(f"audio offset vs raw at {t:>5}s: {ms:+.1f} ms")
    peak = re.search(r"max_volume: ([-\d.]+)", run(["ffmpeg", "-i", final, "-af", "volumedetect", "-vn", "-f", "null", "-"]))
    print("peak level:", peak.group(1) if peak else "?", "dBFS")


if __name__ == "__main__":
    main()
