# src/geometry/subdivisionEdgeSmoothness.ts#subdivisionEdgeSmoothness

## @evidence contracts/development/implementation.md#principled-implementation

The published fractional edge rule: an edge point is `(1 - s)` times the smooth point plus `s` times the midpoint for `s` below one, and the midpoint from one upwards.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rule shared by level refinement, face-varying UVs and the limit ring, so every edge point weighs sharpness alike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case beyond the published threshold at one.

## @evidence contracts/development/common.md#meaningful-documentation

States the weight, the threshold and the source.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One comparison and one subtraction.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
