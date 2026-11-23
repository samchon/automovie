# src/production/IAutoMovieFormationLodInput.ts#IAutoMovieFormationLodInput

## @evidence contracts/development/design.md#principled-representation

Screen-size-aware LOD: the camera distance is scaled by the ratio of a 24 pixel reference to the projected diameter, then tiers are matched by ascending threshold, so a first selection is monotone in effective distance, and a fractional hysteresis band around the previous tier keeps later selections stable under jitter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members: the tiers, the two measurements, the previous choice for hysteresis and the optional band width, so the selector is a pure function with no hidden frame state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The selector does not recheck the tier order, relying on production design validation that refuses a non-final unbounded tier or a non-increasing threshold; no tier name or camera is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the scaling law and its 24 pixel neutral point, the ordering premise and who guarantees it, the empty-list throw, the meter and pixel units, the clamp below one pixel, and the 0.1 default band.
