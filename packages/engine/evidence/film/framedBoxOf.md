# src/film/framedBoxOf.ts#framedBoxOf

## @evidence contracts/development/implementation.md#principled-implementation

The widest horizontal half-span of an axis-aligned box over every viewing bearing is half its XZ diagonal, because the projected width `w·|cos θ| + d·|sin θ|` peaks at `hypot(w, d)` by Cauchy-Schwarz; `base` is the mid-point of the XZ extent at the minimum Y, and both rely on the box being ordered, which every subject-box builder guarantees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure reduction shared by `performShot` for node and group subjects and by the film-grammar observation, so the solve and the grade read the same three numbers from the same box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every subject kind, figure, facade or formation, is reduced by the same three formulas with no minimum height or radius; a flat box yields a zero height that the caller, not this reduction, substitutes.

## @evidence contracts/development/common.md#meaningful-documentation

States why the radius is the diagonal rather than the wider side, why the base is the bottom centre rather than a centroid, the metre units, the ordered-box premise, and that the result aliases nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-dimensional scalar work uses two midpoint calls and one hypot, with a second half-coordinate hypot only when the ordinary radius is non-finite; no geometry population is traversed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure constant-time reduction of one box that coordinates no work across calls; `performShot` reuses the measured extents it is fed, not this result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned record and its fresh base vector.
