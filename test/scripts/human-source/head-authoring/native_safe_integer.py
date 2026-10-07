"""Admit a native count or ordinal before slicing and array indexing.

Integral numeric values retain their exact nonnegative safe-integer meaning.
Booleans, fractions, nonfinite values and unrepresentable ordinals refuse.
"""

import math
import numpy as np


def native_safe_integer(value) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float, np.integer, np.floating)) or \
            not 0 <= value <= 9007199254740991 or not math.isfinite(value) or value != int(value):
        raise ValueError("Native ordinal must be a nonnegative safe integer.")
    return int(value)
