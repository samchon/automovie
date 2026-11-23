# src/architecture/autoMoviePatternPolygonArea.ts#autoMoviePatternPolygonArea

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates half the absolute shoelace cross-product sum. Simple polygons have that area in ideal arithmetic; this binary64 implementation assumes suitable finite intermediates, can lose precision by cancellation and does not independently validate outline simplicity or numerical range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One area measure for every zone, exclusion and piece in the pattern take-off, so all quantities are measured alike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no outline and applies no threshold; the run's own area epsilon is applied by the caller where it decides presence.

## @evidence contracts/development/common.md#meaningful-documentation

States the closing rule, that winding does not matter, the unit, and the zero answer for a degenerate outline.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the corners with constant extra space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure sum over one outline that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond scalars, so nothing outlives the call.
