"""Turn sampled population states into ancestry endpoints and product correctives (offline, numpy).

    python test/scripts/face-review/population_rows.py STATES.npz PRE_DENTAL_BASIS.json.gz OUTPUT.json.gz [CORNERS.json.gz]

`extract-face-population.py` samples MPFB's multilinear macro model at every
corner of race (default mixture or one pure ancestry) x gender {0, .5, 1} x
age {.25, .5, 1}. Every state first loses the change of the eye surface
centroid, the frame the face basis's own macro endpoints were sampled in.

In the basis's control coordinates the model is multilinear: an ancestry
share `c` (the pure ancestry replacing the default mixture, so the race
weights are affine in the shares), `|s|` on one side of the dimorphism
channel and `|t|` on one side of the age channel (each side is one segment
of MPFB's piecewise-linear macro components, age 0.25 to 0.5 and 0.5 to 1).
Such a function is exactly its corner values expanded by inclusion and
exclusion: the linear endpoints, a product term for every pair of axes and
one for the triple. The builder evaluates a corrective as the product of its
clamped driving sides, which is that expansion, so publishing each product
term as a corrective reproduces MPFB's own blend at every weight.

Rows are rounded to a micrometre (1e-6 m); a vertex that moves less than
that in a term is left out.
"""
import gzip
import json
import sys

import numpy as np

RACES = {"african": "africanAncestry", "asian": "asianAncestry", "caucasian": "europeanAncestry"}
SEX = {"positive": 1.0, "negative": 0.0}
AGE = {"positive": 1.0, "negative": 0.25}
DECIMALS = 6


def main():
    states_path, basis_path, output = sys.argv[1:4]
    Z = np.load(states_path)
    with gzip.open(basis_path, "rt", encoding="utf-8") as file:
        basis = json.load(file)
    surfaces = [s["id"] for s in basis["surfaces"]] + ["landmarks"]
    neutral = {s: Z[f"default|0.5|0.5|{s}"] for s in surfaces}
    eye = neutral["Human.low-poly"].mean(axis=0)

    def M(race, gender, age):
        state = {s: Z[f"{race}|{gender}|{age}|{s}"] for s in surfaces}
        shift = state["Human.low-poly"].mean(axis=0) - eye
        return {s: state[s] - shift - neutral[s] for s in surfaces}

    def combine(terms):
        return {s: sum(sign * M(*key)[s] for sign, key in terms) for s in surfaces}

    def sparse(delta):
        rounded = np.round(delta, DECIMALS)
        moved = np.nonzero(np.any(rounded != 0.0, axis=1))[0]
        return [v for i in moved for v in (int(i), *(float(x) for x in rounded[i]))]

    endpoints = {}
    for race, channel in RACES.items():
        endpoints[f"{channel}.positive"] = M(race, 0.5, 0.5)
    correctives = []

    def add(name, inputs, delta):
        correctives.append({"id": name, "inputs": inputs, "weight": 1, "target": name, "delta": delta})

    D = "default"
    for sex_side, g in SEX.items():
        for age_side, a in AGE.items():
            add(f"population.sex-{sex_side}.age-{age_side}",
                [{"channel": "globalSexualDimorphism", "side": sex_side}, {"channel": "globalAgeStructure", "side": age_side}],
                combine([(1, (D, g, a)), (-1, (D, g, 0.5)), (-1, (D, 0.5, a))]))
    for race, channel in RACES.items():
        for sex_side, g in SEX.items():
            add(f"population.{channel}.sex-{sex_side}",
                [{"channel": channel, "side": "positive"}, {"channel": "globalSexualDimorphism", "side": sex_side}],
                combine([(1, (race, g, 0.5)), (-1, (race, 0.5, 0.5)), (-1, (D, g, 0.5))]))
        for age_side, a in AGE.items():
            add(f"population.{channel}.age-{age_side}",
                [{"channel": channel, "side": "positive"}, {"channel": "globalAgeStructure", "side": age_side}],
                combine([(1, (race, 0.5, a)), (-1, (race, 0.5, 0.5)), (-1, (D, 0.5, a))]))
        for sex_side, g in SEX.items():
            for age_side, a in AGE.items():
                add(f"population.{channel}.sex-{sex_side}.age-{age_side}",
                    [{"channel": channel, "side": "positive"}, {"channel": "globalSexualDimorphism", "side": sex_side}, {"channel": "globalAgeStructure", "side": age_side}],
                    combine([(1, (race, g, a)), (-1, (race, g, 0.5)), (-1, (race, 0.5, a)), (-1, (D, g, a)),
                             (1, (race, 0.5, 0.5)), (1, (D, g, 0.5)), (1, (D, 0.5, a))]))
    rows = {name: {s: sparse(d[s]) for s in surfaces} for name, d in endpoints.items()}
    for c in correctives:
        rows[c["target"]] = {s: sparse(c["delta"][s]) for s in surfaces}
    sizes = {name: sum(len(v) // 4 for v in r.values()) for name, r in rows.items()}
    rms = {c["id"]: float(np.sqrt((c["delta"]["Human"] ** 2).sum(axis=1).mean()) * 1000) for c in correctives}
    document = {
        "channels": [{"id": channel, "kind": "shape", "minimum": 0, "maximum": 1, "positive": f"{channel}.positive", "negative": None} for channel in RACES.values()],
        "correctives": [{k: c[k] for k in ("id", "inputs", "weight", "target")} for c in correctives],
        "rows": rows,
        "report": {"rowVertices": sizes, "correctiveRmsMillimetresHuman": rms},
    }
    with gzip.open(output, "wt", encoding="utf-8") as file:
        json.dump(document, file, separators=(",", ":"))
    if len(sys.argv) > 4:
        # Every sampled corner, eye-frame shifted, as displacements from the
        # neutral, for verify-population-basis.ts to replay.
        corners = {}
        for race in ["default", *RACES]:
            for gender in (0.0, 0.5, 1.0):
                for age in (0.25, 0.5, 1.0):
                    delta = M(race, gender, age)
                    corners[f"{race}|{gender}|{age}"] = {s: np.round(delta[s], 9).reshape(-1).tolist() for s in surfaces}
        with gzip.open(sys.argv[4], "wt", encoding="utf-8") as file:
            json.dump(corners, file, separators=(",", ":"))
    for name, value in rms.items():
        print(f"{name:55s} {value:.3f} mm rms")
    print("total row vertices", sum(sizes.values()))


main()
