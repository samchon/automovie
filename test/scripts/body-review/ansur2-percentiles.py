"""Summarize the ANSUR II public anthropometry into the percentiles the body
basis cites for its channel ranges.

Inputs: the two public CSV files from the Penn State OPEN Design Lab mirror of
ANSUR II (2012), placed under `.references/anthropometry/`. Their SHA256 and
sizes are pinned in `test/studies/human-body/references-receipt.json`; this
script refuses a file whose digest differs so a summary is never computed from
an unrecorded download.

Output: `test/studies/human-body/anthropometry-percentiles.json`, holding for
each selected measurement and sex the sample size, 5th/50th/95th percentiles
(nearest-rank on the sorted sample), mean and population standard deviation.
Units are millimetres as published, except `weightkg` which ANSUR II stores in
tenths of a kilogram. The selection is the set of ISO 7250-1 measurements that
the body basis exposes as millimetre channels or uses to place joint pivots.

Run from the repository root: `python -u test/scripts/body-review/ansur2-percentiles.py`
"""
import csv
import hashlib
import json
import os
import statistics

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
SOURCE = os.path.join(ROOT, ".references", "anthropometry")
RECEIPT = os.path.join(ROOT, "test", "studies", "human-body", "references-receipt.json")
OUTPUT = os.path.join(ROOT, "test", "studies", "human-body", "anthropometry-percentiles.json")

MEASUREMENTS = [
    "stature", "cervicaleheight", "suprasternaleheight", "acromialheight",
    "biacromialbreadth", "bideltoidbreadth", "chestcircumference", "chestbreadth",
    "chestdepth", "waistcircumference", "waistbreadth", "waistdepth",
    "waistbacklength", "buttockcircumference", "hipbreadth", "neckcircumference",
    "neckcircumferencebase", "shoulderelbowlength", "acromionradialelength",
    "radialestylionlength", "forearmhandlength", "bicepscircumferenceflexed",
    "forearmcircumferenceflexed", "wristcircumference", "handlength", "handbreadth",
    "trochanterionheight", "crotchheight", "kneeheightmidpatella", "tibialheight",
    "lateralmalleolusheight", "thighcircumference", "lowerthighcircumference",
    "calfcircumference", "anklecircumference", "footlength", "footbreadthhorizontal",
    "weightkg", "span", "sittingheight",
]


def digest(path):
    with open(path, "rb") as file:
        return hashlib.sha256(file.read()).hexdigest()


def percentile(sorted_values, fraction):
    return sorted_values[min(len(sorted_values) - 1, int(round(fraction * (len(sorted_values) - 1))))]


def main():
    with open(RECEIPT, encoding="utf-8") as file:
        receipt = json.load(file)
    pinned = {entry["file"]: entry for entry in receipt["anthropometry"]["files"]}
    summary = {"source": receipt["anthropometry"]["url"], "units": "mm, weightkg in 0.1 kg", "sexes": {}}
    for sex, name in (("male", "ANSUR_II_MALE_Public.csv"), ("female", "ANSUR_II_FEMALE_Public.csv")):
        path = os.path.join(SOURCE, name)
        actual = digest(path)
        if actual != pinned[name]["sha256"]:
            raise SystemExit(f"{name} digest {actual} differs from the pinned receipt")
        with open(path, newline="", encoding="latin-1") as file:
            rows = list(csv.DictReader(file))
        table = {"n": len(rows)}
        for column in MEASUREMENTS:
            values = sorted(float(row[column]) for row in rows if row[column] not in ("", None))
            table[column] = {
                "n": len(values),
                "p5": percentile(values, 0.05),
                "p50": percentile(values, 0.5),
                "p95": percentile(values, 0.95),
                "mean": round(statistics.fmean(values), 1),
                "sd": round(statistics.pstdev(values), 1),
            }
        summary["sexes"][sex] = table
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as file:
        json.dump(summary, file, indent=2)
        file.write("\n")
    print("wrote", OUTPUT, "male", summary["sexes"]["male"]["n"], "female", summary["sexes"]["female"]["n"])


if __name__ == "__main__":
    main()
