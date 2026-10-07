"""Raw file-byte stability for an offline source invocation.

The initial observation and final reobservation cover every declared mutable
input, including its manifest. Original files remain untouched; missing or
changed bytes refuse without substituting output or reconstructing authority.
"""

import hashlib
from pathlib import Path


class SourceInputObservation:
    def __init__(self, paths: list[Path]):
        self._records = {path.resolve(): self._observe(path) for path in paths}

    def extend(self, paths: list[Path]) -> None:
        for path in paths:
            absolute = path.resolve()
            if absolute not in self._records:
                self._records[absolute] = self._observe(path)

    def expect(self, path: Path, size: int, sha256: str) -> None:
        if self._records[path.resolve()] != (size, sha256):
            raise ValueError("Observed source input disagrees with its pinned receipt: " + str(path))

    def expect_digest(self, path: Path, sha256: str) -> None:
        if self._records[path.resolve()][1] != sha256:
            raise ValueError("Observed source input disagrees with its pinned digest: " + str(path))

    @staticmethod
    def _observe(path: Path) -> tuple[int, str]:
        size = 0
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                size += len(block)
                digest.update(block)
        return size, digest.hexdigest()

    def verify(self) -> None:
        changed = []
        for path, expected in self._records.items():
            try:
                actual = self._observe(path)
            except OSError:
                changed.append(str(path))
                continue
            if actual != expected:
                changed.append(str(path))
        if changed:
            raise ValueError("Source input bytes changed during production: " + "; ".join(changed))
