"""How far below the chin the shoulders sit, from the ANSUR II survey.

Run from the test package with the face-review Python environment:

    python scripts/face-review/derive-shoulder-drop-norms.py MALE.csv FEMALE.csv OUTPUT.json

MALE.csv and FEMALE.csv are the ANSUR II public working databases (Gordon CC
et al., 2012 Anthropometric Survey of U.S. Army Personnel, NATICK/TR-15/007,
2014; released publicly 2017; "ANSUR II MALE Public.csv" and "ANSUR II FEMALE
Public.csv"), one row per subject, millimetres.

The survey has no menton height, so each subject's is read from what it
does measure: stature, less the head above the eye (sitting height less
sitting eye height), less menton to sellion, taking sellion at the eye's
height (it lies a few millimetres above the inner canthus). The shoulder is
the acromion, `acromialheight`; the drop from the chin to it, and to the
suprasternal notch beside it, is reported by sex as mean and sample
standard deviation. Hair that falls further than this in a photograph lies
on the shoulders. The inputs' SHA-256 are recorded beside the result.
"""

import csv
import hashlib
import json
import statistics
import sys

male, female, output = sys.argv[1], sys.argv[2], sys.argv[3]


def drops(path):
    rows = list(csv.DictReader(open(path, encoding="latin-1")))
    acromion, notch = [], []
    for row in rows:
        menton = (
            float(row["stature"])
            - (float(row["sittingheight"]) - float(row["eyeheightsitting"]))
            - float(row["mentonsellionlength"])
        )
        acromion.append(menton - float(row["acromialheight"]))
        notch.append(menton - float(row["suprasternaleheight"]))
    summary = lambda values: {
        "subjects": len(values),
        "mean": round(statistics.mean(values), 1),
        "sd": round(statistics.stdev(values), 1),
    }
    return {"acromion": summary(acromion), "suprasternale": summary(notch)}


with open(output, "w", newline="\n") as file:
    json.dump(
        {
            "source": {
                "citation": "Gordon CC, Blackwell CL, Bradtmiller B, et al. 2012 Anthropometric Survey of U.S. Army Personnel: Methods and Summary Statistics. NATICK/TR-15/007, 2014; public working databases 2017.",
                "sha256": {
                    "male": hashlib.sha256(open(male, "rb").read()).hexdigest(),
                    "female": hashlib.sha256(open(female, "rb").read()).hexdigest(),
                },
            },
            "unit": "millimetres below menton",
            "male": drops(male),
            "female": drops(female),
        },
        file,
        indent=1,
    )
    file.write("\n")
print(open(output).read())
