"""Capture bytes owned by a completed offline source component authority.

Pending, refused, inspection and full-generation records are distinct states.
Every output and the authority itself are checked before returning owned
buffers. File completion supplies no clinical or rendered acceptance.
"""

import hashlib
import json
import re
from pathlib import Path


def read_source_publication(directory: Path, required: list[str],
                            authority_name: str = "source-publication.json") -> dict[str, bytes]:
    if not authority_name or authority_name in (".", "..") or any(char in authority_name for char in "/\\:"):
        raise ValueError("Source authority must be a direct child file.")
    authority = directory / authority_name
    original = authority.read_bytes()
    record = json.loads(original)
    if not isinstance(record, dict) or record.get("schema") != "automovie-source-publication/1" or \
            record.get("state") != "complete" or record.get("completeGeneration") is not False or \
            record.get("inspectionOnly") is not False or "refusal" not in record or record["refusal"] is not None or \
            not isinstance(record.get("generation"), str) or not record["generation"].strip() or \
            not isinstance(record.get("outputs"), dict):
        raise ValueError("Offline source input requires its completed component authority.")
    outputs = {}
    for name, expected in record["outputs"].items():
        if not name or name in (".", "..") or any(char in name for char in "/\\:") or \
                not isinstance(expected, dict) or isinstance(expected.get("bytes"), bool) or \
                not isinstance(expected.get("bytes"), (int, float)) or not 0 <= expected["bytes"] <= 2**53 - 1 or \
                expected["bytes"] != int(expected["bytes"]) or \
                not isinstance(expected.get("sha256"), str) or not re.fullmatch("[0-9a-f]{64}", expected["sha256"]):
            raise ValueError("Source component has an invalid output digest or identity.")
        data = (directory / name).read_bytes()
        if len(data) != expected["bytes"] or hashlib.sha256(data).hexdigest() != expected["sha256"]:
            raise ValueError("Source component output changed: " + name)
        outputs[name] = data
    if any(name not in outputs for name in required):
        raise ValueError("Source component does not own every required input.")
    if authority.read_bytes() != original:
        raise ValueError("Source component authority changed during admission.")
    return outputs
