"""Read an exactly aligned native array without loading a whole large buffer.

Empty input has its actual empty population. Nonempty files are read-only
mapped once; incomplete elements refuse instead of truncating their bytes.
An already admitted component may supply its immutable bytes instead, so its
consumer does not replace publication authority with a second filesystem read.
This source representation reader introduces no numerical or anatomical value.
"""

from pathlib import Path
import numpy as np


def read_native_array(path: Path, dtype: str, *, owned_bytes: bytes | None = None) -> np.ndarray:
    """Decode admitted bytes when supplied; otherwise retain the mapped file owner."""
    size = path.stat().st_size if owned_bytes is None else len(owned_bytes)
    if size % np.dtype(dtype).itemsize:
        raise ValueError("Native source array has an incomplete element: " + str(path))
    if owned_bytes is not None:
        return np.frombuffer(owned_bytes, dtype=dtype)
    return np.memmap(path, dtype=dtype, mode="r") if size else np.empty(0, dtype=dtype)
