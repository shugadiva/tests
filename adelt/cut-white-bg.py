# вырезка белого фона без светлой каймы:
# 1) фон = заливка от углов по почти белым пикселям
# 2) полоса 3 px вдоль края объекта очищается от примеси белого (color-to-alpha), так уходит светлый ободок
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 0.035
c = np.asarray(Image.open(src).convert('RGB')).astype(float)
a_w = (255 - c.min(axis=2)) / 255.0          # насколько пиксель отличается от белого
m = Image.fromarray(((a_w < thr) * 255).astype('uint8')).copy()
for pt in [(0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)]:
    if m.getpixel(pt) == 255: ImageDraw.floodfill(m, pt, 128)
bgimg = Image.fromarray(((np.asarray(m) == 128) * 255).astype('uint8'))
bg = np.asarray(bgimg) > 0
band = (np.asarray(bgimg.filter(ImageFilter.MaxFilter(7))) > 0) & ~bg   # 3 px внутрь от края
a = np.ones(bg.shape)
a[bg] = np.where(a_w[bg] < 0.015, 0, a_w[bg])
a[band] = np.clip(a_w[band] * 1.6, 0, 1)      # в полосе белое уходит в прозрачность, тёмное остаётся
fg = c.copy()
sel = bg | band
fg[sel] = (c[sel] - 255 * (1 - a[sel][:, None])) / np.maximum(a[sel], 1e-3)[:, None]
out = Image.fromarray(np.dstack([np.clip(fg, 0, 255), np.clip(a, 0, 1) * 255]).astype('uint8'), 'RGBA')
# 4-й аргумент: файл-пара (например, версия с включённым светом), рамка кадра берётся общая для обоих, чтобы картинки совпали
bb = out.getchannel('A').point(lambda x: 255 if x > 8 else 0).getbbox()
box = (bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 4)
if len(sys.argv) > 4:
    print('box', box)
    box = tuple(int(v) for v in sys.argv[4].split(','))
out = out.crop(box); out.save(dst); print(dst, out.size)
