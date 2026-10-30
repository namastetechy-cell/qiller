# Quickey — 13s promo · storyboard

**Product (fictional):** Quickey — a one-press document converter for office workers.
DOCX → PDF in under a second, plus merge, compress, sign and scan.

**Message:** *Paperwork, done — with one key.*

**Format:** 1920×1080 (16:9), 30 fps, 13.0 s. No voiceover. Synthesized music bed + SFX.

## Look — light, Apple-style

| Token | Value | Use |
|---|---|---|
| `bg` | `#F5F5F7` | canvas (Apple light gray) |
| `card` | `#FFFFFF` | documents, keycap, end card |
| `ink` | `#1D1D1F` | headlines |
| `mute` | `#86868B` | secondary copy |
| `brand` | `#2F6BFF → #7B4DFF` (gradient) | Quickey icon, accent word, shockwave |
| `docx` | `#2B65D9` | DOCX badge |
| `pdf` | `#E5322D` | PDF badge |
| tints | `#EAF1FF` `#EAF8EF` `#FFF3E6` `#F1ECFF` | one per feature cut |

- **Type:** Inter Display (Black for punches, Bold for headlines, Medium for small copy), tight tracking −0.045em. Big. Centered or hard-left, never decorative.
- **Kinetic grammar:** words arrive one per beat — scale 1.35→1 + blur 18px→0 + opacity, ~0.28 s, `expo.out`. Accent words get the brand gradient. Every scene has a slow camera push (scale 1→1.04) so nothing is static.
- **Cuts:** hard cuts on a 120 BPM grid (0.5 s). One whip-pan (motion-blurred x-slide) out of the hero demo. No crossfades.
- **Motif:** the *key*. Quickey is a keyboard key — press it and the document converts. The keycap becomes the app icon.

## Beat sheet

| # | Time | Shot | On-screen type | Motion | Sound |
|---|---|---|---|---|---|
| 1 | 0.00–1.00 | **Hook.** Empty light canvas. | `Due` · `at` · `5 PM.` (one word per ¼ s, “5 PM.” in pdf red) | Each word slams in (scale+blur). Line pushes 1→1.08. | Kick on each word, tick |
| 2 | 1.00–2.00 | **The mess.** 14 file tiles (.docx .xlsx .pptx .jpg .png .txt .pages) rain in from all edges and pile up, rotated. | `Wrong format.` over the pile (white text-plate) | Tiles stagger in 0.03 s apart with `back.out`; pile shudders. | Rapid paper flicks |
| 3 | 2.00–3.00 | **Breath.** Hard cut to empty canvas. Bed drops out. | `There's a key` / `for that.` (Medium, mute gray → ink) | Gentle word rise; riser builds. | Riser, silence |
| 4 | 3.00–4.50 | **Reveal.** A giant white keycap marked **Q** falls from scale 4 (blurred, filling frame) to center. At 3.50 it is **pressed**: travel down, shadow tightens, brand-gradient shockwave ring. Key fills with gradient → it is the app icon. | `Quickey` wordmark slides out of the icon, letters staggered | Overshoot settle; ring scales 0.6→3.2 and fades. | Key click + boom |
| 5 | 4.50–7.00 | **Hero demo.** DOCX page card on the left, keycap in the middle. 5.00 key pressed → page flies right through a light sweep; badge flips DOCX(blue)→PDF(red); checkmark pops. | Top: `DOCX` `→` `PDF.` · Bottom at 5.75: `One press.` | Card arc + rotationY flip; slow push; 6.75 whip-pan left with motion blur. | Click, swoosh, pop, whip |
| 6 | 7.00–9.00 | **…and more.** Four hard cuts, 0.5 s each, each on its own tint: | `Merge.` · `Compress.` · `Sign.` · `Scan.` | Merge: 3 pages slide into one stack. Compress: page squashes, `24 MB → 2 MB`. Sign: signature path draws on. Scan: blue scan line sweeps a page. Layout alternates left/right. | Pop per cut |
| 7 | 9.00–10.25 | **Stat.** Clean canvas. | `0.8s` (huge, counts 0.0→0.8) · `DOCX to PDF. On device.` | Counter flicker, then settle + push. | Ticks, hit |
| 8 | 10.25–13.00 | **End card.** Icon drops in with overshoot; wordmark. | `Paperwork,` `done.` (“done.” in brand gradient) · `Mac · Windows · iPhone` · pill `Download free` | Staggered rise; pill pops at 11.75; hold from 12.3. | Chord swell, ding, fade |

## Audio plan

Everything synthesized (deterministic numpy, `mix.py`): a 120 BPM bed of soft kick + offbeat hats + sub pulse, which
**drops out** for beat 3 (the breath) and slams back on the key press at 3.50. SFX are cut-locked to the beat sheet
above. End card resolves on a major-7 pad swell + bell ding, fading out by 13.0.

## Build

- `index.html` — single composition, one paused GSAP timeline (`window.__timelines.main`).
- `mix.py` → `assets/audio/mix.wav` (music bed + SFX, one track).
- Render: `npx hyperframes render` → `../quickey_promo.mp4`.
