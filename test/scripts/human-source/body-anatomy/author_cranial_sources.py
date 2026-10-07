"""Acquire the missing cranial skeleton as separate immutable atlas inputs.

From the repository root:
  python test/scripts/human-source/body-anatomy/author_cranial_sources.py OUTPUT

OUTPUT is a campaign acquired-input directory, not a shared source root.
Every emitted OBJ is copied byte for byte from the existing isa archive.
The inventory names each skull bone once and carries both source members of
the hyoid. This is acquisition only: no head alignment, tissue clearance,
clinical range, personal anatomy or source publication is asserted.
The term membership is read from the archive's acquired isa_element_parts
table; its FMA labels are preserved beside the source bytes. The official
CC BY 4.0 notice and the embedded CC BY-SA 2.1 JP notice differ, so rights
qualification remains unknown and these inputs remain campaign candidates.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT / ".wiki/08-campaigns/2707-human/artifacts"
ATLAS = ROOT / ".references/bodyparts3d"
ARCHIVE_SHA = "40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e"
MEMBERS = {
    "frontalBone": ("frontal bone", ["FJ3200"]),
    "occipitalBone": ("occipital bone", ["FJ3309"]),
    "sphenoidBone": ("sphenoid bone", ["FJ3394"]),
    "ethmoid": ("ethmoid", ["FJ3199"]),
    "vomer": ("vomer", ["FJ3395"]),
    "mandible": ("mandible", ["FJ3289"]),
    "hyoid": ("hyoid bone", ["FJ2772", "FJ3201"]),
    "leftTemporalBone": ("left temporal bone", ["FJ3281"]),
    "rightTemporalBone": ("right temporal bone", ["FJ3386"]),
    "leftParietalBone": ("left parietal bone", ["FJ3274"]),
    "rightParietalBone": ("right parietal bone", ["FJ3380"]),
    "leftMaxilla": ("left maxilla", ["FJ3269"]),
    "rightMaxilla": ("right maxilla", ["FJ3375"]),
    "leftLacrimalBone": ("left lacrimal bone", ["FJ3265"]),
    "rightLacrimalBone": ("right lacrimal bone", ["FJ3371"]),
    "leftNasalBone": ("left nasal bone", ["FJ3272"]),
    "rightNasalBone": ("right nasal bone", ["FJ3378"]),
    "leftPalatineBone": ("left palatine bone", ["FJ3273"]),
    "rightPalatineBone": ("right palatine bone", ["FJ3379"]),
    "leftZygomaticBone": ("left zygomatic bone", ["FJ3287"]),
    "rightZygomaticBone": ("right zygomatic bone", ["FJ3392"]),
    "leftInferiorNasalConcha": ("left inferior nasal concha", ["FJ3263"]),
    "rightInferiorNasalConcha": ("right inferior nasal concha", ["FJ3369"]),
}


def sha(data):
    """Content identity of the bytes actually consumed."""
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    output = parser.parse_args().output.resolve()
    if not output.is_relative_to(ARTIFACTS):
        raise ValueError("Acquired cranial candidates belong under campaign artifacts.")
    archive = ATLAS / "isa_BP3D_4.0_obj_99.zip"
    archive_bytes = archive.read_bytes()
    if sha(archive_bytes) != ARCHIVE_SHA:
        raise ValueError("The acquired atlas archive identity changed.")
    table_bytes = (ATLAS / "isa_element_parts.txt").read_bytes()
    rows = [line.split("\t") for line in table_bytes.decode().splitlines()]
    output.mkdir(parents=True, exist_ok=True)
    parts = []
    with zipfile.ZipFile(archive) as zipped:
        for part, (label, members) in MEMBERS.items():
            sources = []
            for member in members:
                terms = [row for row in rows if len(row) == 3 and row[1] == label and row[2] == member]
                if len(terms) != 1:
                    raise ValueError("The acquired term does not uniquely name " + part + "/" + member)
                entry = "isa_BP3D_4.0_obj_99/" + member + ".obj"
                data = zipped.read(entry)
                text = data.decode()
                header = [line for line in text.splitlines() if line.startswith("#")]
                if "# File ID : " + member not in header:
                    raise ValueError("The OBJ header names another member: " + member)
                target = output / (member + ".obj")
                if target.exists() and target.read_bytes() != data:
                    raise ValueError("An immutable acquired input differs: " + str(target))
                target.write_bytes(data)
                sources.append({"file": member, "sha256": sha(data), "anatomicalIdentity": terms[0][0],
                                "vertices": sum(line.startswith("v ") for line in text.splitlines()),
                                "triangles": sum(line.startswith("f ") for line in text.splitlines()), "sourceHeader": header})
            parts.append({"id": part, "family": "bone", "actualAcquiredFiles": sources})
    inventory = {"populationOwner": "AutoMovieHumanBodyBoneId cranial constituent identities, mandible and hyoid", "parts": parts}
    (output / "inventory.json").write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    receipt = {"archive": str(archive.relative_to(ROOT)).replace("\\", "/"), "archiveSha256": ARCHIVE_SHA,
               "membershipTableSha256": sha(table_bytes), "producerSha256": sha(Path(__file__).read_bytes()),
               "parts": len(parts), "members": sum(len(part["actualAcquiredFiles"]) for part in parts),
               "rights": {"official": "CC BY 4.0", "officialUri": "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
                          "embedded": "Preserved verbatim in each acquired OBJ header", "qualification": "unknown: conflicting notices",
                          "attribution": "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"},
               "meaning": "Immutable acquired members of one male MRI-derived illustrator atlas; no registration or clinical qualification"}
    (output / "acquisition-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"parts": receipt["parts"], "members": receipt["members"], "archiveSha256": ARCHIVE_SHA}))


if __name__ == "__main__":
    main()
