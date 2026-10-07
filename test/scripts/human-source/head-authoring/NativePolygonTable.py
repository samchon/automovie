"""Original native corner spans and their validated physical vertex identities.

The mapped arrays retain every source ordinal and unused corner. Polygons are
views of the recorded spans; decoding neither welds nor clips native data.
"""

from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class NativePolygonTable:
    starts: np.ndarray
    totals: np.ndarray
    corners: np.ndarray
    polygons: list[list[int]]
