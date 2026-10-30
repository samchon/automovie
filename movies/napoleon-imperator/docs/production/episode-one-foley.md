# Episode 1 procedural effects

[`scripts/episode_foley.py`](../../scripts/episode_foley.py) supplies NumPy sound candidates for the commissioned first episode. These are authored DSP constructions, with no field recordings, sampled human performance, new VoxCPM takes or downloaded models. They do not alter the [27 retained speech candidates](speech-diagnostics.md).

The public function is `synthesize(kind: str, sample_rate: int, duration: float, seed: int) -> numpy.ndarray`. It returns mono float32 samples of exactly `round(duration * sample_rate)` length, all finite and bounded to a peak of 0.92. A rounded zero duration returns an empty array. Rate must be a Python integer from 8000 to 192000 Hz, duration finite and nonnegative, and seed a Python integer in `[0, 2**64)`. Booleans are rejected. Wrong scalar types raise `TypeError`; unsupported kinds and invalid values raise `ValueError`. An array too large for available memory can still fail allocation.

| Kind | Construction and intended event |
| --- | --- |
| `footstep` | Low heel resonance and a short friction tail for one planted step. |
| `hoofbeat` | A hard transient with woody resonances for one hoof contact. |
| `murmur` | Several vowel-like oscillators with changing amplitudes and breath noise. No text or phoneme sequence is supplied. |
| `pen` | Filtered friction with local amplitude texture during a caller-selected writing contact. |
| `cheer` | Brighter overlapping vowel-like oscillators for a wordless crowd texture. Existing spoken cheers retain their VoxCPM take. |
| `equipment` | A single decaying cluster of metal-like resonances. |
| `musket` | A short noise crack and lower decaying body for one discharge. |
| `cannon` | Low chirped resonance, noise burst and a decaying bass tail for one discharge. |
| `ice` | Friction noise and changing resonances for bending or cracking contact. |
| `water` | Filtered wash and short falling bubble-like resonances for one slosh. |

The module has no episode timeline, repeated fire schedule, channel mixing, playback, encoding or file output. Fixed arguments reproduce the same samples in the same NumPy runtime; retain the rendered bytes and digest to preserve an adopted effect across runtime changes. The caller owns the actual shared event clock, foot plants, hoof contacts, writing contact, reload/equipment handling, discharges, ice contact and water movement. Place effects against those events, then choose gain, pan and final mixing. A `musket` call is a discharge, not a reload sound. Internal envelopes describe one sound's texture and do not schedule further actions.

From a Python script in `scripts`, a working call is:

```python
from episode_foley import synthesize

samples = synthesize("footstep", 48000, .24, seed=42)
assert samples.shape == (11520,)
```

These candidates do not certify historical acoustics, physical weapon measurements, acting or sound quality. Murmur and cheer are intended as wordless textures; numerical construction and checks cannot establish that an audience hears no intelligible words. Listening input is unavailable in this session, so no effects or assembled mix have listening approval. The caller must also observe actual picture synchronization and delivered mix clarity before final acceptance. [Audio acquisition and listening](../../.agents/skills/audio/acquisition.md) owns those checks.

## Verification

Run the explicit in-memory check with the adopted local runtime:

```powershell
& 'D:/github/samchon/.automovie-runtime/voxcpm/Scripts/python.exe' -B scripts/episode_foley.py --self-check
```

On October 30, 2026, Python 3.12.14 with NumPy 2.5.4 checked 180 valid cases across all ten kinds, 8000/48000/192000 Hz, zero/subsample/one-sample/two-sample extents and ordinary durations. Every case checked exact length, float32 type, finite samples, boundary fades, peak ceiling and repeated-input equality. Seventeen invalid cases, both seed boundaries and a different-seed noise case were also checked. Syntax compilation and the documented import example ran in memory. Inspection found float32 rounding could exceed the stated 0.92 ceiling by about `1.7e-8`, and an oversized integer duration needed an explicit range error. The module now reserves the next lower float32 value and converts numeric overflow to `ValueError`. The complete repeated round passed. These observations cover this module's numerical API, not caller wiring or a listening verdict.
