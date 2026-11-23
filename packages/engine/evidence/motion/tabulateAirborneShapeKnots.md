# src/motion/tabulateAirborneShapeKnots.ts#tabulateAirborneShapeKnots

## @evidence contracts/development/common.md#meaningful-documentation

Defines units, callback and output ownership, the sampled-frame bound and refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Depth-first subdivision rechecks both child intervals against their actual endpoint poses. A shortest-arc endpoint distance lower-bounds the sum along any subdivision by the triangle inequality. Sampling cannot measure a turn hidden between accepted endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns ordering, refinement and knot admission. The caller owns tensor reduction and interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sampled bound is checked directly, without a tolerance or an assumed constant angular speed. A short uniform grid preserves the caller's second-order scheme.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each accepted or split interval checks its part rotations once, so K final knots and S mass parts take O(K S) time with refinement enabled. The depth-first stack holds at most one pending interval per level.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A sampled split point and each uniform endpoint are shared by their neighbouring intervals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary stack is released on return or failure. The caller retains times and borrows the poses only for reduction.
