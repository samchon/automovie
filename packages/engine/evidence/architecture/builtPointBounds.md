# src/architecture/builtPointBounds.ts#builtPointBounds

## @evidence contracts/development/implementation.md#principled-implementation

The axis-aligned box of a point set is the per-axis minimum and maximum of its coordinates, computed by a left fold whose `Math.min` and `Math.max` are exact, so point order cannot change the answer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fold shared by the population, opening-sweep and space-volume bounds, which each kept a private copy; the empty list answers null so a caller can tell "no points" from a point box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Treats every point alike and caps no list length; the spread argument limit is removed by folding rather than caught.

## @evidence contracts/development/common.md#meaningful-documentation

States the null for an empty list, that any length is accepted, the `NaN` propagation, and that the result is a fresh box.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the points with constant extra space and one allocated box.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure fold over the given list that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the one returned box.
