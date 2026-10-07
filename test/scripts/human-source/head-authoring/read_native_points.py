"""Read complete finite native XYZ tuples while preserving the empty population.

The mapped file or admitted byte buffer keeps original values and order. Partial
tuples or nonfinite coordinates refuse before geometry formulas consume them.
"""

from pathlib import Path
import numpy as np
from read_native_array import read_native_array


def read_native_points(path: Path, *, owned_bytes: bytes | None = None) -> np.ndarray:
    """Validate XYZ from the admitted component buffer or the original mapped file."""
    coordinates = read_native_array(path, "<f8", owned_bytes=owned_bytes)
    if len(coordinates) % 3:
        raise ValueError("Native source XYZ buffer has an incomplete tuple: " + str(path))
    if not np.isfinite(coordinates).all():
        raise ValueError("Native source XYZ buffer contains nonfinite coordinates: " + str(path))
    return coordinates.reshape((-1, 3))
