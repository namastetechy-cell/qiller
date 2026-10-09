# Whysplained: 3 s logo reveal

A yellow dot falls, a "?" draws up from it (the question), a yellow tile grows and the ? turns black. Then WHYSPLAINED comes out of the tile and an underline lands under SPLAINED (the answer). It's built on 120 bpm, so every key action lands on a beat.

## Files

| File | What |
|---|---|
| `out/master_16x9.mp4` | 1920x1080, 60 fps, 3.0 s, H.264 crf 16 yuv420p + AAC |
| `out/cut_9x16.mp4` | 1080x1920 stacked lockup (for Shorts) |
| `out/cut_1x1.mp4` | 1080x1080 |
| `out/reduced_motion_16x9.mp4`, `out/reduced_motion_9x16.mp4` | same sequence, opacity only |
| `out/audio.wav` | procedural sound, 48 kHz stereo |
| `captions.srt` | sound-cue captions (there is no voice) |
| `contact.png`, `contact_9x16.png`, `contact_reduced.png` | 8 frames per cut, taken from the rendered MP4s |
| `stills/` | a still at every beat in every format |
| `fixes/NN_pair.png` | before/after for each fix made during review |
| `directions.html` | 3 directions, winner marked; `DECISIONS.md` has the calls made |
| `index.html` | the source: one `TIMELINE`, `window.seek(t)` paints a frame as a pure function of t |
| `tools/render.mjs`, `tools/sound.py` | renderer (headless Chromium -> ffmpeg) and sound generator |

## Re-render

```bash
python3 -I tools/sound.py out/audio_raw.wav
ffmpeg -i out/audio_raw.wav -af volume=-4.9dB -c:a pcm_s16le out/audio.wav   # -> -16 LUFS
node tools/render.mjs 16x9 out/master_16x9.mp4 --audio out/audio.wav     # also 9x16, 1x1; add --reduced
node tools/render.mjs 16x9 --stills stills 0,1.5,3                         # PNG stills
```
Open `index.html?play` in a browser to watch it loop live.

## What was tested

- Determinism: frame t=1.62 rendered twice gives byte-identical PNGs (`cmp`), and a regenerated audio file is byte-identical.
- Loudness (ffmpeg ebur128 on every final MP4): -16.0 LUFS integrated, true peak -5.3 dBTP.
- Contrast: yellow on black 13.7:1, off-white on black 17.3:1, black ? on yellow 13.7:1.
- Flashes: the biggest frame-to-frame change in average brightness is 0.72/255, so there are no flashes.
- Format: 180 frames at 60 fps, exactly 3.000 s, in all five MP4s (ffprobe).
- Stills at every beat checked in all 3 formats; the 9:16 end frame checked downscaled to 390 px wide.
- A design-review subagent checked the contact sheets. Its fixes are applied and shown in `fixes/03_pair.png` and `fixes/04_pair.png` (plus `05`, found on the final contact sheet).

Not tested: playback on a real phone, and how it sounds on real speakers (levels were measured only).
