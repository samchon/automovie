# src/service/routeDistanceSquared.ts#routeDistanceSquared

## @evidence contracts/development/implementation.md#principled-implementation

Each closed-leg projection clamps its scalar parameter to zero through one, and minimizing squared residuals selects polyline distance; exact collapsed legs use their first point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sleeve placement validation asks only a squared radius comparison, so this route reduction returns a scalar without materializing witnesses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angular or length epsilon collapses a represented nonzero leg; unrepresentable arithmetic remains a documented limitation rather than an exact-distance claim.

## @evidence contracts/development/common.md#meaningful-documentation

States square metres, projection bounds, absent-span infinity and direct-product precision limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

One constant-size projection per leg costs O(R) time for R points with constant live arithmetic storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Different sleeve positions need different projections, and mutable authored routes have no retained distance cache here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the minimum scalar is returned; no route copy, witness array or source point reference is retained.
