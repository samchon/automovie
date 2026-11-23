# src/geometry/planarCross.ts#planarCross

## @evidence contracts/development/implementation.md#principled-implementation

The 2D cross product of the two edge vectors from a shared corner, the standard orientation determinant, evaluated in plain binary64 with no tolerance so each caller applies its own documented threshold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One formula shared by region validation, segment contact and ear clipping, which previously each carried a private copy, so all three classify a turn identically.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caller-specific rounding or snapping; near-zero values are returned as computed and judged by the caller against its constant.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the sign convention, the absence of a tolerance, and why it stays separate from the scale-relative `planarSide`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time with two products and five subtractions and no allocation, the minimum for a 2D orientation determinant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time pure expression; caching it would cost more than recomputing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads three points and returns a number, holding nothing.
