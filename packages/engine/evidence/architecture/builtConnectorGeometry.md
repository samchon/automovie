# src/architecture/builtConnectorGeometry.ts#builtConnectorGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates segment lengths into a cumulative arc-length table in one pass, so stations take `cumulative / total` and a landing fraction is located by linear interpolation inside the segment whose cumulative span brackets it; slope is `atan2(|rise|, run)`, the route-average gradient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the arc-length table once and reads the length, the station fractions and the landing points from it, with connector lookup shared through `requireBuiltConnector`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no connector kind; a missing orientation is reported as `null` rather than derived, and an unmeasurable route is refused rather than given a zero slope.

## @evidence contracts/development/common.md#meaningful-documentation

States the null-orientation rule and why, how run, rise and length are measured and their units, that stations and landings are placed by arc length, and both throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(C + R + LR) worst-case time for C connectors, R route points and L landings: connector lookup, the cumulative table and station mapping, then a fresh forward route scan per landing. No bound on landing count or measured advantage over binary search is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Measures one connector per call over the caller's mutable record and caches nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The arc-length table is dropped on return; the caller owns the geometry, whose stations reference the record's own route points and orientations.
