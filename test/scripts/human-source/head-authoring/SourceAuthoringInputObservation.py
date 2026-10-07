"""Bind component authoring to its sample and maintained source receipts.

The component writers share this input boundary. Receipts pin raw samples,
profiles and maintained code before evaluation; the publication owner asks
the same observation to reverify them before marking outputs complete.
This boundary supplies byte identity, not anatomical or clinical authority.
"""

import json
import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourceInputObservation import SourceInputObservation
from read_source_publication import read_source_publication


class SourceAuthoringInputObservation(SourceInputObservation):
    def __init__(self, sample: Path, source: Path, inputs: list[Path]):
        sample_manifest = sample / "manifest.json"
        source_manifest = source / "source-inputs.json"
        owner = Path(__file__).resolve().parent
        super().__init__([sample_manifest, source_manifest, *inputs,
                          Path(__file__), owner.parent / "SourceInputObservation.py",
                          owner.parent / "SourcePublication.py", owner.parent / "read_source_publication.py"])
        sampled = json.loads(sample_manifest.read_text(encoding="utf-8"))
        authored = json.loads(source_manifest.read_text(encoding="utf-8"))
        if "publication" in authored:
            authority = source / authored["publication"]
            self.extend([authority])
            captured = read_source_publication(source, ["source-inputs.json"], authored["publication"])
            payload = captured["source-inputs.json"]
            self.expect(source_manifest, len(payload), hashlib.sha256(payload).hexdigest())
        self.sampled = sampled
        self.authored = authored
        self.extend([*[sample / name for name in sampled["files"]],
                     *[source / entry["path"] for entry in authored["files"]],
                     *[source / entry["path"] for entry in authored["recipe"].values()],
                     *[source / entry["path"] for entry in authored["profiles"].values()]])
        for name, expected in sampled["files"].items():
            self.expect(sample / name, expected["bytes"], expected["sha256"])
        for entry in authored["files"]:
            self.expect(source / entry["path"], entry["bytes"], entry["sha256"])
        for entry in [*authored["recipe"].values(), *authored["profiles"].values()]:
            self.expect_digest(source / entry["path"], entry["sha256"])
