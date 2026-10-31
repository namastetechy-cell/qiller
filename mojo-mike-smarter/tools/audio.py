"""Build assets/mix.wav for the Mojo Mike short: the narrator lines in order (0.3 s lead-in, 0.25 s between lines) over a soft,
playful original score (marimba, pizzicato bass, glockenspiel; C major, 100 BPM) ducked under the voice. Writes timing.json too.
Run with the lemo-opuscar venv: LIB=/home/user/lemomo-ai/lemo-opuscar .venv/bin/python tools/audio.py"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); ROOT = os.environ.get('LIB', '/home/user/lemomo-ai/lemo-opuscar')
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
lines = json.load(open(os.path.join(HERE, 'lines.json'))); DUR = json.load(open(os.path.join(HERE, 'voice/dur.json')))
VO, t = {}, .3
for L in lines: VO[L['id']] = round(t, 3); t += DUR[L['id']] + .25
END = round(t - .25 + 1.3, 2)
json.dump({'VO': VO, 'DUR': DUR, 'END': END}, open(os.path.join(HERE, 'timing.json'), 'w'), indent=1)
n_ = int((END + .5) * SR); voice = np.zeros(n_)
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voice', L['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    if sr != SR: y = np.interp(np.arange(int(len(y) * SR / sr)) / SR, np.arange(len(y)) / sr, y)
    i = int(VO[L['id']] * SR); voice[i:i + len(y)] += y[:n_ - i]
B = 60 / 100; BAR = 4 * B; N = []; S.seed(7)
def n(t, inst, p, d, v=.6, pan=0., g=1.):
    if 0 <= t < END: N.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g))
CH = {'C': ['C', 'E', 'G'], 'G': ['G', 'B', 'D'], 'Am': ['A', 'C', 'E'], 'F': ['F', 'A', 'C']}
RB = {'C': 'C2', 'G': 'G1', 'Am': 'A1', 'F': 'F1'}
t = 0; k = 0
while t < END - 1.4:
    ch = ['C', 'G', 'Am', 'F'][k % 4]
    for i, p in enumerate([CH[ch][0] + '4', CH[ch][2] + '4', CH[ch][1] + '5', CH[ch][2] + '4', CH[ch][0] + '5', CH[ch][2] + '4', CH[ch][1] + '5', CH[ch][2] + '4']):
        n(t + i * B / 2, 'marimba', p, B, .32 if i % 2 else .42, (i % 4 - 1.5) * .2, .8)
    n(t, 'contrabass_pizz', RB[ch], .6, .55, 0, .9); n(t + 2 * B, 'contrabass_pizz', RB[ch], .6, .45, 0, .9)
    if k % 2: n(t + 3 * B, 'glockenspiel', CH[ch][2] + '6', .9, .22, .3, .5)
    t += BAR; k += 1
for i, L in enumerate(lines[1:6]): n(VO[L['id']] - .05, 'glockenspiel', ['C6', 'E6', 'G6', 'A6', 'C7'][i], 1, .4, .2, .6)   # each sign's number
for p in ['C3', 'G3', 'C4', 'E4', 'G4']: n(END - 1.4, 'harp', p, 2, .45, 0, .7)
N.sort(key=lambda e: e['t']); mus = S.render(N, dur=END + .5, master=False); mus = S.room(mus, size=.4, mix=.18)
if mus.ndim > 1: mus = mus.mean(1)
mus = np.pad(mus, (0, max(0, n_ - len(mus))))[:n_]
env = np.abs(voice); w = int(.25 * SR); env = np.convolve(env, np.ones(w) / w, 'same'); duck = np.where(env > .01, .28, 1.)
duck = np.convolve(duck, np.ones(int(.2 * SR)) / int(.2 * SR), 'same')
rms = lambda x: np.sqrt(np.mean(x[x != 0] ** 2))
mus = mus / (rms(mus) + 1e-9) * rms(voice) * 10 ** (-12 / 20) * duck
mix = voice + mus; mix = mix / np.max(np.abs(mix)) * .89
sf.write(os.path.join(HERE, 'assets/mix.wav'), np.stack([mix, mix], 1).astype(np.float32), SR)
print('END', END, 'notes', len(N))
