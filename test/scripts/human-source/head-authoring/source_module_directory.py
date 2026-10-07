"""Resolve a maintained Python owner through its exact source manifest entry.

Fresh source manifests contain data and address maintained code elsewhere.
The authoring consumers import that declared owner directory after verifying
its bytes. Missing or ambiguous module owners refuse; no legacy path or
filesystem search substitutes for the manifest's authority.
"""

import hashlib
from pathlib import Path


def source_module_directory(source: Path, authored: dict, module_name: str) -> Path:
    if not module_name.isidentifier():
        raise ValueError("Source module must have one Python owner name.")
    matches = [entry for entry in authored["files"] if Path(entry["path"]).name == module_name + ".py"]
    if len(matches) != 1:
        raise ValueError("Source manifest must declare one exact module owner: " + module_name)
    expected = matches[0]
    resolved = (source / expected["path"]).resolve()
    payload = resolved.read_bytes()
    if len(payload) != expected["bytes"] or hashlib.sha256(payload).hexdigest() != expected["sha256"]:
        raise ValueError("Source module differs from its pinned receipt: " + module_name)
    return resolved.parent
