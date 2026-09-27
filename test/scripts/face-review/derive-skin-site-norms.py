"""Facial skin site albedo relative to the cheek, from the International Skin
Spectra Archive.

Run from the test package with the face-review Python environment:

    python scripts/face-review/derive-skin-site-norms.py ISSA.xlsx OUTPUT.json

ISSA.xlsx is the archive workbook `derive-skin-albedo-norms.py` reads (Lu Y,
Xiao K, Pointer M, et al., Sci Data 2025;12:487; data
doi:10.6084/m9.figshare.28228571.v4, CC BY 4.0). Its coding scheme numbers
the body locations; the head's are 2 cheek, 3 cheek bone, 4 chin, 5 ear
lobe, 6 forehead, 8 neck and 9 nose tip. Every reading is integrated into
linear sRGB exactly as the cheek norms are (CIE 1931 2 degree colour matching
functions, D65, IEC 61966-2-1 matrix), a subject's readings of one site are
averaged, and for every subject measured at both the cheek and another head
site the per-channel ratio of that site to the cheek is taken. Pairing
within the subject removes the between-subject spread of overall
pigmentation, so the ratio is the regional pattern alone. Each ethnic group
reports, per site, the mean and sample standard deviation of the ratio over
its subjects, overall and by sex. The input's SHA-256 is recorded beside the
result.
"""

import hashlib
import json
import sys
from collections import defaultdict

import numpy as np
import openpyxl

source, output = sys.argv[1], sys.argv[2]
digest = hashlib.sha256(open(source, "rb").read()).hexdigest()
rows = list(
    openpyxl.load_workbook(source, read_only=True)["ISSA"].iter_rows(values_only=True)
)
WAVELENGTHS = [int(v) for v in rows[1][13 : 13 + 39]]
x, y, z, d65 = (np.array([float(v) for v in rows[i][13 : 13 + 39]]) for i in (2, 3, 4, 5))
SRGB = np.array(
    [
        [3.2404542, -1.5371385, -0.4985314],
        [-0.969266, 1.8760108, 0.041556],
        [0.0556434, -0.2040259, 1.0572252],
    ]
)
CHEEK = 2
SITES = {3: "cheekBone", 4: "chin", 5: "earLobe", 6: "forehead", 8: "neck", 9: "noseTip"}

readings = defaultdict(lambda: defaultdict(list))
for row in rows[12:]:
    if row[0] is None or (row[6] != CHEEK and row[6] not in SITES):
        continue
    spectrum = np.array(
        [
            value / 100 if isinstance(value, (int, float)) else np.nan
            for value in row[13 : 13 + len(WAVELENGTHS)]
        ]
    )
    present = ~np.isnan(spectrum)
    # A reading must span the visible range the colour matching functions weigh.
    if present.sum() < 31:
        continue
    weight = d65 * present
    norm = np.sum(weight * y)
    xyz = np.array([np.nansum(spectrum * weight * cmf) for cmf in (x, y, z)]) / norm
    readings[(row[3], row[4], row[1], row[2])][row[6]].append(SRGB @ xyz)

groups = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
for (ethnicity, sex, _origin, _subject), sites in readings.items():
    if CHEEK not in sites:
        continue
    cheek = np.mean(sites[CHEEK], axis=0)
    for code, name in SITES.items():
        if code not in sites:
            continue
        ratio = np.mean(sites[code], axis=0) / cheek
        groups[ethnicity][name]["all"].append(ratio)
        # A reading without a recorded sex counts in the group, not in either sex.
        if sex in ("F", "M"):
            groups[ethnicity][name][sex].append(ratio)


def summary(values):
    values = np.array(values)
    return {
        "subjects": len(values),
        "mean": [round(float(v), 4) for v in values.mean(axis=0)],
        "sd": [
            round(float(v), 4) if len(values) > 1 else None
            for v in (values.std(axis=0, ddof=1) if len(values) > 1 else values[0])
        ],
    }


json.dump(
    {
        "source": {
            "citation": "Lu Y, Xiao K, Pointer M, et al. The International Skin Spectra Archive (ISSA): a multicultural human skin phenotype and colour spectra collection. Sci Data 2025;12:487. doi:10.1038/s41597-025-04857-5",
            "data": "doi:10.6084/m9.figshare.28228571.v4, ISSA_17_Jan_2025_Yan_Lu.xlsx, CC BY 4.0",
            "sha256": digest,
        },
        "reference": "cheek",
        "space": "per-channel ratio of linear sRGB albedo under D65, CIE 1931 2 degree observer, paired within subject",
        "groups": {
            ethnicity: {
                site: {key: summary(values) for key, values in sorted(by.items())}
                for site, by in sorted(sites.items())
            }
            for ethnicity, sites in sorted(groups.items())
        },
    },
    open(output, "w"),
    indent=1,
)
for ethnicity, sites in json.load(open(output))["groups"].items():
    print(ethnicity, {site: (v["all"]["subjects"], v["all"]["mean"]) for site, v in sites.items()})
