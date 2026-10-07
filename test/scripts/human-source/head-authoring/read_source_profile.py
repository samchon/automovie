"""Read a named source profile at its maintained receipt's exact byte identity.

Profile paths may identify an immutable generated component or preserved
authored input. Their receipt pins bytes; the surrounding source observation
owns final stability. This reader assigns no anatomical or clinical authority.
"""

import hashlib
import json
from pathlib import Path


def read_source_profile(source: Path, authored: dict, name: str) -> dict:
    entry = authored["profiles"][name]
    payload = (source / entry["path"]).read_bytes()
    if hashlib.sha256(payload).hexdigest() != entry["sha256"]:
        raise ValueError("Source profile differs from its pinned receipt: " + name)
    value = json.loads(payload)
    if not isinstance(value, dict):
        raise ValueError("Source profile must contain its named object: " + name)
    return value
