"""Native sparse-state decoding input; indices and spans are element ordinals.

Arrays remain in Blender metres. Empty spans are valid and no geometry is
changed by admission. This is source representation, not clinical authority.
"""

from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class NativeSparseStateInput:
    name: str
    vertices: int
    rows_vertex: np.ndarray
    rows_delta: np.ndarray
    row_offset: int
    row_count: int
    landmark_delta: np.ndarray
    landmark_offset: int
    landmark_count: int
