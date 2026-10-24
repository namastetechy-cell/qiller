"""Trader Joe's — silent 16:9 image video. Arranges the prompt images along the voiceover script.

timeline.json = [[image_id, script text], ...] in script order. Each line lasts (words / 150 wpm) + a short pause,
matching the voiceover file's marked pace. Consecutive lines on the same image become one shot.
Motion is deliberately small: each shot either zooms 0→5 % (in or out) or drifts sideways at 5 % zoom, eased,
with a 0.6 s crossfade between shots. Images not delivered yet render as a labelled grey slate.
No audio track. Usage: python3 build.py [--preview]  (preview = 640×360, quick check)."""
import json, os, subprocess, sys, math
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PREVIEW = '--preview' in sys.argv
W, H = (640, 360) if PREVIEW else (1920, 1080)
FPS = 24
WPM, PAUSE, XF, ZOOM = 150, .35, .6, .05

T = json.load(open(os.path.join(HERE, 'timeline.json')))
# shots: merge consecutive lines with the same image
shots = []
for img, text in T:
    d = len(text.split()) / WPM * 60 + PAUSE
    if shots and shots[-1]['img'] == img: shots[-1]['d'] += d; shots[-1]['text'] += ' ' + text
    else: shots.append({'img': img, 'd': d, 'text': text})
t = 0.
for i, s in enumerate(shots): s['t0'] = t; t += s['d']; s['t1'] = t; s['move'] = i % 4
DUR = t

def find(img):
    for ext in ('webp', 'png', 'jpg', 'jpeg'):
        p = os.path.join(HERE, 'images', f'{img}.{ext}')
        if os.path.exists(p): return p
    return None
cache = {}
def source(img):
    if img in cache: return cache[img]
    p = find(img)
    if p:
        im = Image.open(p).convert('RGB')
        # fit to 16:9 by centre-cropping the source (2000×1116 → 1984×1116)
        sw, sh = im.size; tw = min(sw, round(sh * 16 / 9)); th = round(tw * 9 / 16)
        im = im.crop(((sw - tw) // 2, (sh - th) // 2, (sw - tw) // 2 + tw, (sh - th) // 2 + th))
        if not PREVIEW and im.width < W * 1.0: im = im.resize((W, H), Image.LANCZOS)
    else:
        im = Image.new('RGB', (1920, 1080), (34, 36, 42)); d = ImageDraw.Draw(im)
        f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 90)
        f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 40)
        d.text((960, 470), f'IMAGE {img}', font=f1, fill=(200, 60, 70), anchor='mm')
        d.text((960, 580), 'waiting for this image', font=f2, fill=(150, 150, 160), anchor='mm')
        img = img + '_slate'
    cache[img.replace('_slate', '')] = im
    return im
ease = lambda u: u * u * (3 - 2 * u)
def frame_of(s, t):
    im = source(s['img']); sw, sh = im.size
    u = ease(min(1, max(0, (t - s['t0']) / max(.01, s['t1'] - s['t0']))))
    m = s['move']
    if m == 0: z, px = 1 + ZOOM * u, .5                  # slow push in
    elif m == 1: z, px = 1 + ZOOM, .2 + .6 * u            # drift right
    elif m == 2: z, px = 1 + ZOOM * (1 - u), .5          # slow pull out
    else: z, px = 1 + ZOOM, .8 - .6 * u                   # drift left
    cw, ch = sw / z, sh / z
    x0 = (sw - cw) * px; y0 = (sh - ch) * .5
    return im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))

out = os.path.join(HERE, 'preview.mp4' if PREVIEW else 'traderjoes.mp4')
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-an', '-c:v', 'libx264', '-preset', 'medium' if not PREVIEW else 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
n = int(round(DUR * FPS)); k = 0
for f in range(n):
    t = f / FPS
    while k < len(shots) - 1 and t >= shots[k]['t1']: k += 1
    s = shots[k]; fr = frame_of(s, t)
    # crossfade into the next shot during the last XF/2 of this one and the first XF/2 of the next
    if k < len(shots) - 1 and t > s['t1'] - XF / 2:
        a = (t - (s['t1'] - XF / 2)) / XF; fr = Image.blend(fr, frame_of(shots[k + 1], t), a)
    elif k > 0 and t < s['t0'] + XF / 2:
        a = .5 + (t - s['t0']) / XF; fr = Image.blend(frame_of(shots[k - 1], t), fr, a)
    ff.stdin.write(fr.tobytes())
ff.stdin.close(); ff.wait()
# a cue sheet: when each image is on screen (to line up the voiceover later)
with open(os.path.join(HERE, 'cue-sheet.txt'), 'w') as fh:
    fh.write(f'Total {int(DUR // 60)}:{DUR % 60:05.2f} at {WPM} wpm\n\n')
    for s in shots:
        have = 'ok     ' if find(s['img']) else 'MISSING'
        fh.write(f"{int(s['t0'] // 60)}:{s['t0'] % 60:05.2f}  {have}  {s['img']:>3}  {s['text'][:70]}…\n")
print('wrote', out, f'{DUR:.1f}s', len(shots), 'shots')
