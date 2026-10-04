"""Which MPFB states the source generation samples, and under which names.

Every name here is a source convention: an MPFB target path relative to the
data `targets/` directory, a `macro/<axis>-<node>` state, a macro pair, or an
extra-targets expression file. None of them is an anatomical measurement.

The body table is the deleted body extraction's projection of
`targets/target.json` (`44dec918c:test/scripts/body-review/body_extraction/
channels.py`): the same regions, the same product exclusions (genital and
nipple categories) and the same macro nodes, so the sampled endpoint names are
the published body basis's endpoint names. The face candidates are the
deleted face recipe recovery's population (`67b7d53e6^:test/scripts/face-review/
face_extraction/recipes.py`): every target file of the face-region folders and
the eight macro node states of the face extraction receipt. The extra-target
expression files are sampled as further candidates; the published face
expressions are articulated rest-space residuals, so a raw file is expected to
match only where no articulation was fitted.
"""
import json
import os

BODY_REGIONS = ["torso", "arms", "legs", "hands", "feet", "neck", "hip", "pelvis", "stomach", "buttocks", "breast"]
FACE_REGIONS = ["head", "cheek", "chin", "eyes", "mouth", "nose", "neck", "ears", "forehead", "eyebrows"]

# Product exclusion: genital and nipple geometry (decision 003 of the body track).
EXCLUDED_CATEGORIES = {"bulge-decr-incr", "nipple-point-decr-incr", "nipple-size-decr-incr"}

# The nipple targets whose footprint defines the excluded region.
NIPPLE_TARGETS = ["breast/nipple-size-incr", "breast/nipple-point-incr"]

# Macro axis -> (negative node, value, positive node, value); the neutral is 0.5.
BODY_MACRO_AXES = {
    "gender": ("female", 0.0, "male", 1.0),
    "age": ("child", 0.1875, "old", 1.0),
    "muscle": ("min", 0.0, "max", 1.0),
    "weight": ("min", 0.0, "max", 1.0),
    "height": ("min", 0.0, "max", 1.0),
    "proportions": ("uncommon", 0.0, "ideal", 1.0),
    "cupsize": ("min", 0.0, "max", 1.0),
    "firmness": ("min", 0.0, "max", 1.0),
}

FACE_MACRO_STATES = {
    "macro/age-0.25": {"age": 0.25},
    "macro/age-1.0": {"age": 1.0},
    "macro/gender-0.0": {"gender": 0.0},
    "macro/gender-1.0": {"gender": 1.0},
    "macro/weight-0.0": {"weight": 0.0},
    "macro/weight-1.0": {"weight": 1.0},
    "macro/muscle-0.0": {"muscle": 0.0},
    "macro/muscle-1.0": {"muscle": 1.0},
}

_PAIRS = ("decr-incr", "down-up", "in-out", "backward-forward")


def _camel(tokens):
    return tokens[0] + "".join(token[:1].upper() + token[1:] for token in tokens[1:])


def _channel_name(category):
    for pair in _PAIRS:
        if category.endswith("-" + pair):
            tokens = category[: -len(pair) - 1].split("-")
            if pair != "decr-incr":
                tokens += pair.split("-")
            return _camel(tokens)
    raise ValueError("Unrecognized MPFB category pair: " + category)


def body_regional_channels(data):
    """Signed regional channels of target.json for the body regions, minus the exclusions."""
    with open(os.path.join(data, "targets", "target.json"), encoding="utf-8") as file:
        catalogue = json.load(file)
    channels = []
    for region in BODY_REGIONS:
        for category in catalogue[region]["categories"]:
            name = category["name"]
            if name in EXCLUDED_CATEGORIES:
                continue
            base = _channel_name(name)
            opposites = category["opposites"]
            if category["has_left_and_right"]:
                for side, suffix, other in (("left", "Left", "Right"), ("right", "Right", "Left")):
                    channels.append({
                        "id": base + suffix, "group": region, "mirror": base + other,
                        "negative": region + "/" + opposites["negative-" + side],
                        "positive": region + "/" + opposites["positive-" + side],
                    })
            else:
                channels.append({
                    "id": base, "group": region, "mirror": None,
                    "negative": region + "/" + opposites["negative-unsided"],
                    "positive": region + "/" + opposites["positive-unsided"],
                })
    return channels


def body_macro_states():
    """Endpoint name -> macro override, for the body's signed macro channels."""
    states = {}
    for axis, (negative, low, positive, high) in BODY_MACRO_AXES.items():
        states["macro/" + axis + "-" + negative] = {axis: low}
        states["macro/" + axis + "-" + positive] = {axis: high}
    return states


def body_macro_pairs():
    """Every unordered macro axis pair at every sign combination."""
    axes = list(BODY_MACRO_AXES.items())
    pairs = []
    for i in range(len(axes)):
        for j in range(i + 1, len(axes)):
            a, (a_neg, a_low, a_pos, a_high) = axes[i]
            b, (b_neg, b_low, b_pos, b_high) = axes[j]
            for a_node, a_value in ((a_neg, a_low), (a_pos, a_high)):
                for b_node, b_value in ((b_neg, b_low), (b_pos, b_high)):
                    pairs.append({
                        "id": "macro/" + a + "-" + a_node + "+" + b + "-" + b_node,
                        "macro": {a: a_value, b: b_value},
                        "endpoints": ["macro/" + a + "-" + a_node, "macro/" + b + "-" + b_node],
                    })
    return pairs


def face_region_targets(data):
    """Every target file of the face-region folders, relative to `targets/`."""
    names = []
    for region in FACE_REGIONS:
        folder = os.path.join(data, "targets", region)
        for entry in sorted(os.listdir(folder)):
            if entry.endswith(".target.gz"):
                names.append(region + "/" + entry[: -len(".target.gz")])
    return names


def extra_target_files(extra):
    """`extra/<asset>/<name>` -> absolute path for every extra-targets `.target` file."""
    out = {}
    assets = os.path.join(extra, "assets")
    for asset in sorted(os.listdir(assets)):
        for folder, _dirs, files in sorted(os.walk(os.path.join(assets, asset))):
            for entry in sorted(files):
                if entry.endswith(".target") or entry.endswith(".target.gz"):
                    stem = entry[: -len(".target.gz")] if entry.endswith(".gz") else entry[: -len(".target")]
                    out["extra/" + asset + "/" + stem] = os.path.join(folder, entry)
    return out
