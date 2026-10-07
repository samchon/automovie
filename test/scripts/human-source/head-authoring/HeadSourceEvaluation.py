from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class HeadSourceEvaluation:
    """One same-state common-root authoring result, before publisher compaction.

    Arrays use Blender metres and retain original native IDs plus fixed new
    section IDs. The publisher owns canonical root cutting, normal/UV/weight
    derivatives and final crop/P1 output; this value is no viewer acceptance.
    """
    positions: np.ndarray
    joints: np.ndarray
    polygons: list
    envelope: dict
    ears: list
    nasal: list
