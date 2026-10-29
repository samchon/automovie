"""Synthesize local, procedural effect candidates without a film clock or I/O.

These NumPy constructions are authored sound shapes, not field recordings,
human performances, or VoxCPM takes. Numerical checks do not approve listening.
"""
from __future__ import annotations

import argparse
import json
import math
from numbers import Real

import numpy as np


_KINDS = (
    "footstep", "hoofbeat", "murmur", "pen", "cheer", "equipment",
    "musket", "cannon", "ice", "water",
)


def _noise(rng: np.random.Generator, count: int, rate: int,
           low: float, high: float) -> np.ndarray:
    """Shape seeded noise in frequency space without a runtime filter state."""
    values = rng.standard_normal(count)
    frequencies = np.fft.rfftfreq(count, 1 / rate)
    upper = min(high, rate * .45)
    lower = min(low, upper * .5)
    response = 1 / np.sqrt(1 + (frequencies / upper) ** 8)
    if lower > 0:
        response *= frequencies ** 2 / (frequencies ** 2 + lower ** 2)
    values = np.fft.irfft(np.fft.rfft(values) * response, n=count)
    return values / max(float(np.sqrt(np.mean(values * values))), 1e-12)


def _vowels(rng: np.random.Generator, time: np.ndarray,
            cheering: bool) -> np.ndarray:
    """Combine vowel-like oscillators with no words, phoneme text or recording."""
    output = np.zeros(len(time), dtype=np.float64)
    for _ in range(5):
        fundamental = rng.uniform(100, 175) if cheering else rng.uniform(85, 140)
        phase = rng.uniform(0, 2 * np.pi)
        pulse = .65 + .35 * np.sin(2 * np.pi * rng.uniform(.7, 2.2) * time + phase)
        vibrato = .018 * np.sin(2 * np.pi * rng.uniform(4, 6) * time)
        carrier = 2 * np.pi * fundamental * time + vibrato + phase
        for harmonic in range(1, 17):
            frequency = fundamental * harmonic
            formants = (650, 1050, 2400) if cheering else (350, 850, 1700)
            weight = sum(math.exp(-.5 * ((frequency - center) / 180) ** 2)
                         for center in formants) + .08
            output += np.sin(carrier * harmonic) * pulse * weight / harmonic
    return output / 3


def synthesize(kind: str, sample_rate: int, duration: float,
               seed: int) -> np.ndarray:
    """Return one mono float32 effect candidate with no external side effects.

    ``kind`` is one of footstep, hoofbeat, murmur, pen, cheer, equipment,
    musket, cannon, ice or water. Rate is an integer from 8000 to 192000 Hz;
    duration is finite, nonnegative seconds; seed is an integer in [0, 2**64).
    Booleans are rejected. Invalid values raise ValueError; wrong scalar types
    raise TypeError. The result has exactly round(duration * sample_rate)
    finite samples and peak <= 0.92, including an empty result when rounded
    duration is zero. Repeated inputs reproduce samples in the same runtime.

    This function supplies an individual contact, discharge, slosh or sustained
    texture. The caller owns event times, duration, gain, pan, mixing, encoding,
    retained bytes and listening. No episode timeline or repeated gunfire is
    inferred. Murmur and cheer contain procedural vowel-like shapes without
    text; their audience impression and intelligibility remain unheard.
    """
    if not isinstance(kind, str):
        raise TypeError("kind must be a string")
    if kind not in _KINDS:
        raise ValueError(f"Unsupported effect kind: {kind!r}; expected {_KINDS}")
    if isinstance(sample_rate, bool) or not isinstance(sample_rate, int):
        raise TypeError("sample_rate must be an integer Hz value")
    if not 8000 <= sample_rate <= 192000:
        raise ValueError("sample_rate must be between 8000 and 192000 Hz")
    if isinstance(duration, bool) or not isinstance(duration, Real):
        raise TypeError("duration must be a real number of seconds")
    try:
        duration = float(duration)
    except OverflowError as error:
        raise ValueError("duration exceeds this runtime's numeric range") from error
    if not math.isfinite(duration) or duration < 0:
        raise ValueError("duration must be finite and nonnegative")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise TypeError("seed must be an integer")
    if not 0 <= seed < 2 ** 64:
        raise ValueError("seed must be in [0, 2**64)")
    extent = duration * sample_rate
    if not math.isfinite(extent) or extent > np.iinfo(np.intp).max:
        raise ValueError("Requested sample count exceeds this runtime's array range")
    count = round(extent)
    if count == 0:
        return np.empty(0, dtype=np.float32)

    rng = np.random.default_rng(seed)
    time = np.arange(count, dtype=np.float64) / sample_rate
    if kind == "footstep":
        grit = _noise(rng, count, sample_rate, 180, 1800)
        heel = np.sin(2 * np.pi * 85 * time) * np.exp(-time * 40)
        toe = np.exp(-np.maximum(time - .045, 0) * 65) * (time >= .045)
        wave = heel * .55 + grit * (.16 * np.exp(-time * 55) + .1 * toe)
    elif kind == "hoofbeat":
        crack = _noise(rng, count, sample_rate, 500, 3800)
        wave = (.45 * np.sin(2 * np.pi * 240 * time) * np.exp(-time * 48)
                + .14 * crack * np.exp(-time * 95)
                + .12 * np.sin(2 * np.pi * 1200 * time) * np.exp(-time * 75))
    elif kind in ("murmur", "cheer"):
        wave = _vowels(rng, time, kind == "cheer")
        wave += _noise(rng, count, sample_rate, 200, 2400) * .025
        wave *= np.minimum(1, time / .12)
    elif kind == "pen":
        friction = _noise(rng, count, sample_rate, 1000, 6500)
        texture = .45 + .35 * np.sin(2 * np.pi * 8.3 * time + rng.uniform(0, 6)) ** 2
        wave = friction * texture * .12
    elif kind == "equipment":
        wave = _noise(rng, count, sample_rate, 600, 6000) * .06 * np.exp(-time * 35)
        for frequency in (730, 1180, 1835, 2910):
            wave += .12 * np.sin(2 * np.pi * frequency * time + rng.uniform(0, 6)) * np.exp(-time * 15)
    elif kind == "musket":
        crack = _noise(rng, count, sample_rate, 900, 11000)
        body = _noise(rng, count, sample_rate, 40, 1800)
        wave = .22 * crack * np.exp(-time * 90) + .25 * body * np.exp(-time * 13)
        wave += .25 * np.sin(2 * np.pi * 110 * time) * np.exp(-time * 20)
    elif kind == "cannon":
        blast = _noise(rng, count, sample_rate, 25, 1800)
        wave = .2 * blast * np.exp(-time * 6)
        wave += .55 * np.sin(2 * np.pi * (53 * time - 7 * time ** 2)) * np.exp(-time * 3.5)
        wave += .14 * np.sin(2 * np.pi * 34 * time) * np.exp(-time * 2.5)
    elif kind == "ice":
        wave = _noise(rng, count, sample_rate, 600, 7000) * .1 * np.exp(-time * 8)
        for frequency in (380, 790, 1570):
            wave += .18 * np.sin(2 * np.pi * frequency * (.8 * time + .15 * time ** 2)) * np.exp(-time * 2.5)
    else:
        wash = _noise(rng, count, sample_rate, 100, 2700)
        wave = wash * .12 * np.exp(-time * 2.8)
        for delay, frequency in ((.015, 420), (.08, 670), (.17, 310)):
            local = np.maximum(time - delay, 0)
            wave += .16 * np.sin(2 * np.pi * frequency * np.log1p(local)) * np.exp(-local * 16) * (time >= delay)

    # Fade boundaries, including tiny requests, before bounding the saved signal.
    attack = np.minimum(1, time / .0015)
    release = np.minimum(1, (count - 1 - np.arange(count)) / max(1, sample_rate * .012))
    wave *= attack * release
    ceiling = float(np.nextafter(np.float32(.92), np.float32(0)))
    wave *= min(1.0, ceiling / max(float(np.max(np.abs(wave))), 1e-12))
    return wave.astype(np.float32)


def _self_check() -> dict:
    """Check the complete API population and invalid branches without files."""
    measurements = []
    for kind in _KINDS:
        for rate in (8000, 48000, 192000):
            for duration in (0, .25 / rate, 1 / rate, 2 / rate, .03125, 1.25):
                first = synthesize(kind, rate, duration, 18051202)
                second = synthesize(kind, rate, duration, 18051202)
                assert first.shape == (round(duration * rate),)
                assert first.dtype == np.float32 and np.isfinite(first).all()
                assert np.array_equal(first, second)
                peak = float(np.max(np.abs(first))) if len(first) else 0
                assert peak <= .92
                if len(first):
                    assert first[0] == 0 and first[-1] == 0
                if duration == 1.25 and rate == 48000:
                    assert peak > 0
                    measurements.append({"kind": kind, "frames": len(first), "peak": peak})
    invalid = [
        (("gun", 48000, 1., 0), ValueError),
        ((None, 48000, 1., 0), TypeError),
        (("pen", True, 1., 0), TypeError),
        (("pen", 48000., 1., 0), TypeError),
        (("pen", 7999, 1., 0), ValueError),
        (("pen", 192001, 1., 0), ValueError),
        (("pen", 48000, -1., 0), ValueError),
        (("pen", 48000, float("nan"), 0), ValueError),
        (("pen", 48000, float("inf"), 0), ValueError),
        (("pen", 48000, 1e308, 0), ValueError),
        (("pen", 48000, 10 ** 1000, 0), ValueError),
        (("pen", 48000, "1", 0), TypeError),
        (("pen", 48000, True, 0), TypeError),
        (("pen", 48000, 1., -1), ValueError),
        (("pen", 48000, 1., 2 ** 64), ValueError),
        (("pen", 48000, 1., False), TypeError),
        (("pen", 48000, 1., 1.5), TypeError),
    ]
    for arguments, error in invalid:
        try:
            synthesize(*arguments)
        except error:
            continue
        raise AssertionError(f"Expected {error.__name__} for {arguments!r}")
    for seed in (0, 2 ** 64 - 1):
        assert np.isfinite(synthesize("cannon", 48000, .1, seed)).all()
    assert not np.array_equal(synthesize("water", 48000, .2, 1),
                              synthesize("water", 48000, .2, 2))
    return {"status": "passed", "validCases": 180, "invalidCases": len(invalid),
            "seedBoundaryCases": 2, "seedVariationCases": 1,
            "observations": measurements, "listening": "unperformed"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-check", action="store_true", required=True)
    parser.parse_args()
    print(json.dumps(_self_check(), indent=2))
