# src/drawing/IAutoMovieDrawingFeatureResolution.ts#IAutoMovieDrawingFeatureResolution

## @evidence contracts/development/design.md#principled-representation

A two-state result with nullable payload fields records success or the exact cause of failure as data, so a target that no longer resolves is reported rather than approximated or thrown.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record for every feature kind, with `direction` null where a kind has none, so drawing and annotation code reads one shape whatever the target names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No direction is invented for a directionless feature and no nearest feature substitutes for a missing one; `count` is reported as measured, including zero for unreachable or invalid targets.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states who produces it, what each status carries, the units, which kinds have a direction and why the rest do not, every case in which `count` is zero, and what `reason` holds.
