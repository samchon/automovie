"""Cheek skin albedo norms from the International Skin Spectra Archive.

Run from the test package with the face-review Python environment:

    python scripts/face-review/derive-skin-albedo-norms.py ISSA.xlsx OUTPUT.json

ISSA.xlsx is the archive's single workbook (Lu Y, Xiao K, Pointer M, et al.,
"The International Skin Spectra Archive (ISSA): a multicultural human skin
phenotype and colour spectra collection", Sci Data 2025;12:487,
doi:10.1038/s41597-025-04857-5; data doi:10.6084/m9.figshare.28228571.v4,
file ISSA_17_Jan_2025_Yan_Lu.xlsx, CC BY 4.0). Every record is one
spectrophotometer reading (CIE di:8 geometry, specular included) of one body
site of one subject, as percent reflectance at 10 nm steps from 360 or 400
to 740 or 700 nm, each value in its wavelength's own column.

For each cheek record (body location 2) the reflectance is integrated with
the workbook's own CIE 1931 2 degree colour matching functions and D65
illuminant into XYZ relative to the perfect diffuser, and XYZ into linear
sRGB (IEC 61966-2-1 matrix): the albedo a renderer's linear base colour
means. A subject's readings are averaged first, so a subject measured twice
counts once, and each ethnic group reports the mean and sample standard
deviation over its subjects, overall and by sex. The input's SHA-256 is
recorded beside the result.
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

subjects = defaultdict(list)
for row in rows[12:]:
    if row[0] is None or row[6] != CHEEK:
        continue
    ethnicity, sex = row[3], row[4]
    # Readings sit in the wavelength's own column whatever range the
    # instrument covered (360-740 or 400-700 nm); the rest are empty.
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
    subjects[(ethnicity, sex, row[1], row[2])].append(SRGB @ xyz)

groups = defaultdict(lambda: defaultdict(list))
for (ethnicity, sex, _origin, _subject), readings in subjects.items():
    albedo = np.mean(readings, axis=0)
    groups[ethnicity]["all"].append(albedo)
    # A reading without a recorded sex counts in the group, not in either sex.
    if sex in ("F", "M"):
        groups[ethnicity][sex].append(albedo)


def summary(values):
    values = np.array(values)
    return {
        "subjects": len(values),
        "mean": [round(float(v), 4) for v in values.mean(axis=0)],
        "sd": [round(float(v), 4) for v in values.std(axis=0, ddof=1)],
    }


json.dump(
    {
        "source": {
            "citation": "Lu Y, Xiao K, Pointer M, et al. The International Skin Spectra Archive (ISSA): a multicultural human skin phenotype and colour spectra collection. Sci Data 2025;12:487. doi:10.1038/s41597-025-04857-5",
            "data": "doi:10.6084/m9.figshare.28228571.v4, ISSA_17_Jan_2025_Yan_Lu.xlsx, CC BY 4.0",
            "sha256": digest,
        },
        "site": "cheek",
        "space": "linear sRGB albedo under D65, CIE 1931 2 degree observer",
        "groups": {
            ethnicity: {key: summary(values) for key, values in sorted(by.items())}
            for ethnicity, by in sorted(groups.items())
        },
    },
    open(output, "w"),
    indent=1,
)
print(json.dumps({k: v["all"]["mean"] for k, v in json.load(open(output))["groups"].items()}))
