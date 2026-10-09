# qiller

Video editing with [HyperFrames](https://github.com/heygen-com/hyperframes): videos are written as HTML/CSS + GSAP animations and rendered to MP4.

## Layout

- `video/` – the HyperFrames project (`index.html` is the main composition)
- `video/vendor/gsap.min.js` – GSAP served locally (the cloud sandbox blocks CDNs during render)
- `.claude/skills/` – HyperFrames agent skills, so Claude Code knows how to edit compositions
- `.claude/hooks/session-start.sh` – downloads the headless Chrome renderer in cloud sessions

## Commands (run inside `video/`)

```bash
npm run dev      # Studio preview with live reload
npm run check    # lint + runtime validation
npm run render   # render to MP4
```

Requires Node.js 22+ and FFmpeg.

## Editing with Claude

Ask things like "using /hyperframes, make a 15-second intro about …" or
"add my clip `assets/intro.mp4` with captions". Put your own footage, music and images in `video/assets/`.
