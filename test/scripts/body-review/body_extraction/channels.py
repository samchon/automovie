"""The signed channel table, read from MPFB's own catalogue.

A body channel is one nameable trait with a zero neutral and up to two authored
endpoints. MPFB declares exactly that in `targets/target.json`: each category
names its negative and positive target, and whether it exists per side. This
module turns that declaration into the basis channel list so the set of
channels is a projection of the source, not a list typed by hand, and the
exclusions are the only editorial decisions (they are listed here and in the
basis JSDoc with their reopen conditions).

Naming keeps the source tokens rather than interpreting them: the category
`torso-trans-in-out` becomes `torsoTransInOut` with `torso-trans-in` as its
negative endpoint and `torso-trans-out` as its positive one, and a
`decr`/`incr` pair drops its suffix (`torso-scale-vert-decr-incr` becomes
`torsoScaleVert`). Sided categories become two channels suffixed `Left` and
`Right` that name each other as `mirror`. Endpoint names are the MPFB target
paths relative to `targets/`, which is what the extraction loads and what the
receipt records.

Macro axes are the second source. MPFB's macro system is piecewise linear
between named nodes, so a signed channel from the default 0.5 to an adjacent
node reproduces MPFB exactly along that segment; the interactions between
axes, which MPFB expresses as products of node weights, are sampled as
combination correctives by the entry script.
"""
import json
import os
import re

from .session import MPFB_DATA

REGIONS = ["torso", "arms", "legs", "hands", "feet", "neck", "hip", "pelvis", "stomach", "buttocks", "breast"]

# Categories excluded by decision 003 of the body track: genital and nipple
# geometry are out of scope for the product, and `bulge` is genital.
EXCLUDED_CATEGORIES = {"bulge-decr-incr", "nipple-point-decr-incr", "nipple-size-decr-incr"}

# Macro axis -> (negative node name, negative value, positive node name, positive value).
# Node values come from macrodetails/macro.json; the neutral human sits at 0.5.
MACRO_AXES = {
    "gender": ("female", 0.0, "male", 1.0),
    "age": ("child", 0.1875, "old", 1.0),
    "muscle": ("min", 0.0, "max", 1.0),
    "weight": ("min", 0.0, "max", 1.0),
    "height": ("min", 0.0, "max", 1.0),
    "proportions": ("uncommon", 0.0, "ideal", 1.0),
    "cupsize": ("min", 0.0, "max", 1.0),
    "firmness": ("min", 0.0, "max", 1.0),
}

_PAIRS = ("decr-incr", "down-up", "in-out", "backward-forward")


def camel(tokens):
    return tokens[0] + "".join(token[:1].upper() + token[1:] for token in tokens[1:])


def channel_name(category):
    """`torso-scale-vert-decr-incr` -> `torsoScaleVert`; other pairs keep their tokens."""
    for pair in _PAIRS:
        if category.endswith("-" + pair):
            stem = category[: -len(pair) - 1]
            tokens = stem.split("-")
            if pair != "decr-incr":
                tokens += pair.split("-")
            return camel(tokens)
    raise ValueError("Unrecognized MPFB category pair: " + category)


def regional_channels():
    """Signed channels for every body region category of target.json, minus the exclusions."""
    with open(os.path.join(MPFB_DATA, "targets", "target.json"), encoding="utf-8") as file:
        catalogue = json.load(file)
    channels = []
    for region in REGIONS:
        for category in catalogue[region]["categories"]:
            name = category["name"]
            if name in EXCLUDED_CATEGORIES:
                continue
            base = channel_name(name)
            opposites = category["opposites"]
            if category["has_left_and_right"]:
                for side, suffix, other in (("left", "Left", "Right"), ("right", "Right", "Left")):
                    channels.append({
                        "id": base + suffix,
                        "group": region,
                        "mirror": base + other,
                        "negative": region + "/" + opposites["negative-" + side],
                        "positive": region + "/" + opposites["positive-" + side],
                    })
            else:
                channels.append({
                    "id": base,
                    "group": region,
                    "mirror": None,
                    "negative": region + "/" + opposites["negative-unsided"],
                    "positive": region + "/" + opposites["positive-unsided"],
                })
    return channels


def macro_channels():
    """One signed channel per macro axis, endpoints named `macro/<axis>-<node>`."""
    channels = []
    for axis, (negative, _low, positive, _high) in MACRO_AXES.items():
        channels.append({
            "id": camel(["macro", axis]),
            "group": "macro",
            "mirror": None,
            "negative": "macro/" + axis + "-" + negative,
            "positive": "macro/" + axis + "-" + positive,
        })
    return channels


def macro_endpoint_states():
    """Endpoint name -> macro override dictionary that produces it."""
    states = {}
    for axis, (negative, low, positive, high) in MACRO_AXES.items():
        states["macro/" + axis + "-" + negative] = {axis: low}
        states["macro/" + axis + "-" + positive] = {axis: high}
    return states


def macro_pair_states():
    """Every unordered pair of macro axes at each sign combination, for correctives.

    Returns (corrective id, [(channel id, side), (channel id, side)], macro overrides,
    the two endpoint names whose sum the corrective corrects).
    """
    axes = list(MACRO_AXES.items())
    pairs = []
    for i in range(len(axes)):
        for j in range(i + 1, len(axes)):
            a, (a_neg, a_low, a_pos, a_high) = axes[i]
            b, (b_neg, b_low, b_pos, b_high) = axes[j]
            for a_side, a_node, a_value in (("negative", a_neg, a_low), ("positive", a_pos, a_high)):
                for b_side, b_node, b_value in (("negative", b_neg, b_low), ("positive", b_pos, b_high)):
                    pairs.append({
                        "id": "macro/" + a + "-" + a_node + "+" + b + "-" + b_node,
                        "inputs": [
                            {"channel": camel(["macro", a]), "side": a_side},
                            {"channel": camel(["macro", b]), "side": b_side},
                        ],
                        "macro": {a: a_value, b: b_value},
                        "endpoints": ["macro/" + a + "-" + a_node, "macro/" + b + "-" + b_node],
                    })
    return pairs


def is_measure(channel):
    return re.search(r"/measure-", channel["positive"]) is not None
