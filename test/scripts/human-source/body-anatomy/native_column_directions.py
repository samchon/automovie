"""Read the outward direction of the shared D/F layer columns.

The owning layer definition is D=S-t*n and F=S-(t+tau)*n. With positive
subcutaneous thickness, D-F=tau*n; normalising this actual output recovers
the source direction without a second skin-normal calculation. A zero column
has no invertible direction and is refused. This is the layer's offset
direction, not a newly measured normal of the potentially curved F surface.
Ordinary positive finite norms retain their original division arithmetic.
Outside the normal sum-of-squares representation regime, component scaling computes
the same nonzero direction with a norm between one and sqrt(3); this changes
no tissue depth, column endpoint or anatomical admission condition.
"""
import numpy as np


def native_column_directions(dermis, fascia):
    dermal = np.asarray(dermis, dtype=np.float64)
    fascial = np.asarray(fascia, dtype=np.float64)
    if dermal.ndim != 2 or dermal.shape != fascial.shape or dermal.shape[1] != 3:
        raise ValueError("Native column endpoints must be corresponding XYZ rows.")
    with np.errstate(over="ignore", invalid="ignore"):
        columns = dermal - fascial
    if not np.isfinite(columns).all():
        raise ValueError("A native layer column needs finite positive depth to define its source direction.")
    scales = np.max(np.abs(columns), axis=1)
    if np.any(scales == 0):
        raise ValueError("A native layer column needs finite positive depth to define its source direction.")
    with np.errstate(over="ignore", under="ignore"):
        lengths = np.linalg.norm(columns, axis=1)
    # A positive result is not enough: subnormal squared components can have
    # already lost relative precision before their sum produces a norm.
    # The dtype limits describe arithmetic representation, not tissue ranges.
    limits = np.finfo(np.float64)
    ordinary = (np.isfinite(lengths) & (lengths > 0) &
                (scales >= np.sqrt(limits.tiny)) &
                (scales <= np.sqrt(limits.max / 3)))
    result = np.empty_like(columns)
    result[ordinary] = columns[ordinary] / lengths[ordinary, None]
    scaled = columns[~ordinary] / scales[~ordinary, None]
    result[~ordinary] = scaled / np.linalg.norm(scaled, axis=1)[:, None]
    return result
