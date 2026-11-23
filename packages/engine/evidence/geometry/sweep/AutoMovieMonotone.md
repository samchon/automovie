# src/geometry/sweep/AutoMovieMonotone.ts#AutoMovieMonotone.slope

## @evidence contracts/development/implementation.md#principled-implementation

The published sufficient condition for monotone Hermite segments: zero slopes at sign changes and the radius-3 restriction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the initial slopes and one for the restriction, reading secants on demand so no secant array is needed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No smoothing beyond the published rule.

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the ends, the wrap and the arrays.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per profile change; the slopes are the reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and writes only `slopes`.

# src/geometry/sweep/AutoMovieMonotone.ts#AutoMovieMonotone.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

The cubic Hermite basis on the segment that holds `x`, found by binary search, with flat extrapolation for open curves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluation for every caller of the scheme.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cubic is extended beyond the knots of an open curve.

## @evidence contracts/development/common.md#meaningful-documentation

States the extrapolation, the wrap and the segment rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log n) binary search plus a cubic, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure evaluation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
