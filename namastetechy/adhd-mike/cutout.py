import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
P = sys.argv[1]
im = np.asarray(Image.open(P + "/input/character_sheet.png").convert("RGB")).astype(np.int32)
H, W, _ = im.shape
bg = np.array([46, 41, 40])
bglike = np.sqrt(((im - bg) ** 2).sum(-1)) < 40
names = [["happy", "sad", "angry"], ["surprised", "cool", "love"]]
for r in range(2):
    for c in range(3):
        x0, x1 = c * W // 3, (c + 1) * W // 3; y0, y1 = r * H // 2, (r + 1) * H // 2
        lab, n = ndimage.label(bglike[y0:y1, x0:x1])
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        m = ~np.isin(lab, list(edge))
        cl, cn = ndimage.label(m)
        sizes = ndimage.sum(m, cl, range(1, cn + 1))
        m = np.isin(cl, [i + 1 for i, s in enumerate(sizes) if s > 60])
        ys, xs = np.where(m)
        bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        crop = im[y0 + by0:y0 + by1, x0 + bx0:x0 + bx1].astype(np.uint8)
        a = Image.fromarray((m[by0:by1, bx0:bx1] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
        rgba = Image.fromarray(crop).convert("RGBA"); rgba.putalpha(a)
        rgba = rgba.resize((rgba.width * 3, rgba.height * 3), Image.LANCZOS)
        rgba.save(f"{P}/assets/mike/{names[r][c]}.png"); print(names[r][c], rgba.size)
