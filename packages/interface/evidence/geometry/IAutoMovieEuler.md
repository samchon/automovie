# src/geometry/IAutoMovieEuler.ts#IAutoMovieEuler

## @evidence contracts/development/design.md#principled-representation

Intrinsic Euler composition multiplies single-axis quaternions in the declared order through Quaternion.fromEuler. Unit factors give a unit rotation mathematically, with binary64 rounding in implementation; the order field distinguishes the six conventions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three angles plus an order enum cover every intrinsic Tait-Bryan convention without a matrix or quaternion field, and the type stays the single parameter shape of `fromEuler` rather than a structural copy at the engine.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No caller special-cases an order; both instance-set callers state `"XYZ"` explicitly, and the composition never normalizes angles or wraps them into a range it would then have to document.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the composition rule with the `"XYZ"` example, that angles are not range-checked, the actual callers, and why character joints use semantic angles instead; members give the axis and unit.
