# src/physics/segmentSphere.ts#segmentSphere

## @evidence contracts/development/implementation.md#principled-implementation

Solve the segment-sphere quadratic and select its first entry in [0,1], including tangency and zero for starts inside. A zero-length segment hits only when inside; extreme finite coordinates can overflow or lose root precision.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This scalar parameter predicate owns analytic chord geometry and leaves trajectory time conversion to projectileSphereHit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ordinary discriminant/root formula is used for every collider; no fixture tolerance or fabricated intersection compensates for numeric limits.

## @evidence contracts/development/common.md#meaningful-documentation

Docs distinguish dimensionless segment parameter from seconds, positive finite radius and invalid-vector throws, including inside and degenerate cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

A few dot products and quadratic roots give O(1) time and constant vector/scalar temporaries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

projectileSphereHit shares this predicate for each chord; mutable endpoints and collider values prevent an identity-only intersection cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a number or null escapes, with no retained segment, collider, handle or asynchronous work.
