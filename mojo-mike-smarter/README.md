# Mojo Mike Lessons — "5 signs you're smarter than you think"

9:16 · 41.4 s · 1080×1920 · 30 fps HyperFrames composition starring Mojo Mike (the six poses cut from the supplied sticker sheet,
`assets/sheet.png` → `assets/poses/`). Soft American narrator (Kokoro am_michael, speed 1.08), word-by-word captions in the
YouTube Shorts safe band, an original marimba/pizzicato score ducked under the voice.

Scenes: hook (surprised, "?" marks) · 1 doubt (sad, "am I smart?") · 2 curious (happy, "why?" ×3) · 3 talk to yourself (surprised,
"keys... keys...") · 4 "I don't know" (happy, bubble + lightbulb) · 5 funny (sunglasses, "HA!") · "#6?!" (angry) · subscribe (hearts).

Rebuild (from this folder):
```bash
L=/home/user/lemomo-ai/lemo-opuscar
$L/.venv/bin/python $L/core/tts/tts.py lines.json voice          # narration
$L/.venv/bin/python tools/align.py                                 # voice/words.json
$L/.venv/bin/python tools/audio.py                                 # assets/mix.wav + timing.json
node build.mjs && npx --yes hyperframes@0.8.143 check
npx --yes hyperframes@0.8.143 render --fps 30 --quality high -o out/render.mp4
ffmpeg -i out/render.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k mojo-mike-smarter-than-you-think.mp4
```
