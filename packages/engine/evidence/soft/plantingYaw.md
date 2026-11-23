# src/soft/plantingYaw.ts#plantingYaw

## @evidence contracts/development/implementation.md#principled-implementation

The two rational first-quadrant arcs and signed second-quadrant lift avoid trigonometric angle sampling; normalization operates on the admitted sample in [0,1) and amount in [0,1]. Distribution is uniform in the half tangent, not in yaw angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Member yaw and leaf roll share one owner so the same jitter representation and sign choice apply to both consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The w-sign choice follows quaternion hemisphere equivalence, not a consumer fixture; no rejection loop, angle approximation or hidden uniform-angle claim changes the distribution.

## @evidence contracts/development/common.md#meaningful-documentation

States sample/amount admission, axis, interpolation and nonuniform angular distribution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar rational arithmetic and one square root take constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One implementation is shared across arrangement and foliage; each distinct seeded input is evaluated without caching a cheap fixed-size quaternion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fresh quaternion belongs to the caller; no sample stream, placement or leaf record is retained.
