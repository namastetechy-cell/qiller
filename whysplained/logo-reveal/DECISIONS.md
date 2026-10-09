# Decisions (one line each)

- Brief is a 3 s logo reveal, not a 30-90 s explainer; the story arc collapses to question (? draws) -> answer (name + underline lands).
- Brand from `whysplained/README.md`: yellow #FFD400, black, Montserrat 800/900; ground warmed to #0d0c0a, second half of the name in warm off-white #f4f1ea.
- One typeface family (Montserrat), two weights; no second family, because the channel only uses Montserrat.
- Mark = black "?" in a rounded yellow tile, so it doubles as an avatar or watermark.
- Picked direction A of 3 (see directions.html).
- Timing locked to 120 bpm: dot lands 0.5 s, tile 1.0 s, name 1.35-1.95 s, underline 2.0 s, still hold 2.35-3.0 s.
- The name emerges from the tile's right edge (clipped), not from the frame centre; fixed after the first pass showed "W" leaking left of the moving tile (fixes/01_pair.png).
- 9:16 uses a stacked lockup with a bigger mark (fixes/02_pair.png), then trimmed from 1.7x to 1.3x with a thicker underline after design review (fixes/03_pair.png).
- Dot is on screen from frame 0, falling, so the opening is never empty (fixes/04_pair.png); in 9:16 the name is clipped below the rising tile (fixes/05_pair.png).
- Design review suggestion not built in: use this as an end card, or trim to a ~1 s sting from 1.0 s, so the Short's hook comes first. Placement is the editor's call.
- Sound is procedural numpy (seeded) rather than Web Audio; same cues, deterministic file, no browser audio capture needed.
- No voice, so no burned-in captions over the logo; captions.srt describes the sound cues instead.
- Reduced-motion cut: same order (dot, ?, tile, name, underline), opacity only, everything already in its final place.
- No tagline: restraint, and no approved channel tagline exists in the repo.
- Rendered at 60 fps per the render contract; the Shorts pipeline in this repo is 30 fps, so ffmpeg -r 30 is safe if needed.
