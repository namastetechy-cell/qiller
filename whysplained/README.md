# Whysplained Shorts template

Turns a raw faceless Short (images already placed + voiceover) into an edited one:
per-image zoom in/out, zoom-punch + whoosh on every cut, word-by-word captions
(hook card, keyword pops with clicks, CTA box), without changing the raw video's
picture order or audio timing. Built on HyperFrames (HTML -> MP4).

## Per video

```bash
V=videos/<slug>; mkdir -p $V/input
cp raw.mp4 $V/input/raw.mp4

# 1. scene cuts (check the list against a contact sheet; 0.15 catches soft cuts)
ffmpeg -i $V/input/raw.mp4 -vf "select='gt(scene,0.15)',showinfo" -an -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
#    -> write $V/scenes.json: {"cuts": [0, ...], "duration": <sec>, "labels": [...]}

# 2. black borders inside the frame? (Gemini/Canva exports often letterbox)
ffmpeg -i $V/input/raw.mp4 -vf cropdetect -f null - 2>&1 | grep -o "crop=.*" | sort | uniq -c | sort -n | tail -1
#    -> edit.json "rawSize": [w, h], "contentBox": [w, h, x, y]

# 3. transcribe (Whisper-small in Hindi mode; splits avoid Whisper's repeat loops)
ffmpeg -i $V/input/raw.mp4 -ac 1 -ar 16000 -f f32le /tmp/a.f32
node tools/transcribe.mjs <models-dir> /tmp/a.f32 hindi $V/asr_part1.json
#    if the tail turns into repeated words, transcribe from just before that point:
ffmpeg -ss 23.9 -i $V/input/raw.mp4 -ac 1 -ar 16000 -f f32le /tmp/b.f32
node tools/transcribe.mjs <models-dir> /tmp/b.f32 hindi $V/asr_part2.json

# 4. captions.txt = the script, corrected to what was actually said (one line per sentence)
python3 tools/align.py $V/captions.txt $V/asr_part1.json $V/asr_part2.json:23.9 -o $V/words.json

# 5. edit.json: hookEnd, ctaStart, keywords (first occurrence of each gets yellow + pop + click)
node build.mjs $V
cd $V && npx hyperframes check && npx hyperframes snapshot --at 2,10,20,30,38
npx hyperframes render --fps 30 --quality high -o out/render.mp4
python3 -I ../../tools/finalize.py out/render.mp4 input/raw.mp4 out/whysplained_final.mp4
```

`finalize.py` patches 1-3 frame black flashes, re-encodes (H.264 CRF 18 / AAC 192k,
30 fps) and prints QC: remaining black frames, audio offset vs the raw voiceover at
five points (should all be +0.0 ms), and peak level.

## Whisper model

Hugging Face is blocked in the cloud sandbox, so the model comes from npm:
`npm pack sts-whisper-small` (ONNX weights, third-party mirror of Xenova/whisper-small),
extract, and pass `<extract>/package/models` as `<models-dir>`. `tools/` needs
`npm i @huggingface/transformers@3.7.5` next to `transcribe.mjs`.
On your own machine any Whisper works — just produce the same `{chunks:[{text,timestamp}]}` JSON.

## Brand / style knobs (top of build.mjs)

`ZOOM` range, `PUNCH` (scale, frames, flash), `CAPTION_Y`, SFX target peaks
(whoosh -18 dB, click -20 dB), and the caption CSS (Montserrat ExtraBold,
white + 8px black stroke, keywords #FFD400, hook = yellow on black, CTA = black on yellow).
