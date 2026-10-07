"""Atomic output authority for an offline source component.

Raw failed files remain available under pending/refused authority. Completion
binds every actual output, including receipts, then reobserves input bytes.
The protocol matches the normal TypeScript source publication reader. A
completed component is distinct from a completed human generation.
"""

import hashlib
import json
import os
from pathlib import Path
from collections.abc import Callable


class SourcePublication:
    def __init__(self, directory: Path, authority_name: str = "source-publication.json"):
        self.directory = directory.resolve()
        self.directory.mkdir(parents=True, exist_ok=True)
        if not authority_name or authority_name in (".", "..") or any(char in authority_name for char in "/\\:"):
            raise ValueError("Source authority must be a direct child file.")
        self.authority = self.directory / authority_name
        self.next = self.directory / (authority_name + ".next")
        self.record = {"schema": "automovie-source-publication/1", "state": "pending",
                       "generation": None, "completeGeneration": False, "inspectionOnly": False,
                       "outputs": {}, "refusal": None}
        if self.next.exists():
            raise ValueError("Source publication has an unresolved authority write.")
        with self.authority.open("x", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps(self.record) + "\n")

    def __enter__(self):
        return self

    def _outputs(self) -> dict:
        outputs = {}
        for file in sorted(self.directory.iterdir()):
            if file in (self.authority, self.next):
                continue
            if not file.is_file():
                raise ValueError("Source component output must be a direct file: " + file.name)
            digest = hashlib.sha256()
            size = 0
            with file.open("rb") as stream:
                for block in iter(lambda: stream.read(1024 * 1024), b""):
                    size += len(block)
                    digest.update(block)
            outputs[file.name] = {"bytes": size, "sha256": digest.hexdigest()}
        return outputs

    def _commit(self, candidate: dict) -> None:
        with self.next.open("x", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps(candidate) + "\n")
        os.replace(self.next, self.authority)
        self.record = candidate

    def complete(self, generation: str, verify_inputs: Callable[[], None]) -> None:
        if self.record["state"] != "pending" or not generation:
            raise ValueError("Source component cannot complete in this state.")
        outputs = self._outputs()
        if not outputs:
            raise ValueError("Source component has no completed outputs.")
        verify_inputs()
        self._commit({**self.record, "state": "complete", "generation": generation, "outputs": outputs})

    def __exit__(self, kind, error, traceback):
        if self.record["state"] == "complete":
            return False
        failure = error if error is not None else ValueError("Source component ended without completion authority.")
        try:
            self._commit({**self.record, "state": "refused", "outputs": self._outputs(), "refusal": str(failure)})
        except BaseException as publication_error:
            raise BaseExceptionGroup("Source operation and refusal authority both failed.", [failure, publication_error])
        if error is None:
            raise failure
        return False
