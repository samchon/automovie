# src/geometry/sweep/AutoMovieMonotone.ts#AutoMovieMonotone

## @evidence contracts/development/common.md#meaningful-documentation

States the split, the period convention and who validates.

## @evidence contracts/development/design.md#principled-representation

Represents The Fritsch-Carlson monotone cubic on caller-owned arrays: slopes computed in place and evaluation without allocation, so a profile whose values change every frame, such as a posed sweep's volume scale, is rebuilt into the same buffers: companion namespace of 4 members (`slope`, `evaluate`, `width`, `secant`). It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieMonotone` in packages/engine/src/geometry/sweep/AutoMovieMonotone.ts; its surface is the 4 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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
