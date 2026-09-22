"""Recover each published shape endpoint's MPFB recipe by measurement.

The face basis was extracted from a Blender file whose script was not kept, so
the MPFB target behind a channel such as `headWidth` is not recorded anywhere
tracked. It can be measured instead: a published endpoint is one source
target (or one macro node) sampled through the same subdivision, minus the
change of the binocular eye centroid that the extraction subtracted from
every surface. That subtraction is one translation common to all vertices, so
for a candidate target `C` and a published endpoint `D` the residual
`C - D - mean(C - D)` vanishes exactly when the candidate is the recipe, and
the mean is the frame shift the extraction applied. A candidate is accepted
only when its worst residual is below `TOLERANCE`; anything else stays
unmatched and is reported, never guessed.

Candidates are every target file of the face-region folders under `targets/`
and the eight macro node states of the face extraction receipt (`age` 0.25 and
1.0, `gender`, `weight` and `muscle` 0.0 and 1.0, all relative to the default
0.5). Expression endpoints come from the extra-targets repository and are not
candidates: the articulated model moves no joint landmark with an expression.
"""
import json
import os

import numpy as np

from .session import MPFB_DATA

FACE_REGIONS = ["head", "cheek", "chin", "eyes", "mouth", "nose", "neck", "ears", "forehead", "eyebrows"]
MACRO_STATES = {
    "macro/age-0.25": {"age": 0.25},
    "macro/age-1.0": {"age": 1.0},
    "macro/gender-0.0": {"gender": 0.0},
    "macro/gender-1.0": {"gender": 1.0},
    "macro/weight-0.0": {"weight": 0.0},
    "macro/weight-1.0": {"weight": 1.0},
    "macro/muscle-0.0": {"muscle": 0.0},
    "macro/muscle-1.0": {"muscle": 1.0},
}
TOLERANCE = 2e-6


def candidate_targets():
    """Every target file of the face regions, relative to `targets/`.

    The directory is the population rather than the catalogue's `opposites`
    tables, because single-endpoint categories (the head outlines) list no
    opposites and would otherwise be missed.
    """
    names = []
    for region in FACE_REGIONS:
        folder = os.path.join(MPFB_DATA, "targets", region)
        for entry in sorted(os.listdir(folder)):
            if entry.endswith(".target.gz"):
                names.append(region + "/" + entry[: -len(".target.gz")])
    return names


def published_endpoints(basis):
    """Endpoint name -> dense (vertices, 3) displacement of the `Human` surface, shape channels only."""
    surface = next(s for s in basis["surfaces"] if s["id"] == "Human")
    count = len(surface["positions"]) // 3
    names = []
    for channel in basis["channels"]:
        if channel["kind"] != "shape":
            continue
        names.append(channel["positive"])
        if channel["negative"] is not None:
            names.append(channel["negative"])
    out = {}
    for name in names:
        dense = np.zeros((count, 3), dtype=np.float64)
        rows = np.array(surface["targets"].get(name, []), dtype=np.float64).reshape(-1, 4)
        if len(rows):
            dense[rows[:, 0].astype(np.int64)] = rows[:, 1:]
        out[name] = dense
    return out


def match(published, candidates):
    """Published endpoint -> (candidate name, shift, worst residual) for the best candidate.

    `candidates` maps a candidate name to its dense skin delta on the basis
    vertex order. The shift is the mean difference; the residual is the worst
    vertex after removing it.
    """
    out = {}
    for name, delta in published.items():
        best = None
        for candidate, sample in candidates.items():
            difference = sample - delta
            shift = difference.mean(axis=0)
            residual = float(np.abs(difference - shift).max())
            if best is None or residual < best[2]:
                best = (candidate, shift, residual)
        out[name] = best
    return out
