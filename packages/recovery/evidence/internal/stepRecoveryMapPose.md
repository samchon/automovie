# src/index.ts#stepRecoveryMapPose

## @evidence contracts/development/implementation.md#principled-implementation

The rotation-vector exponential acts on each R column, while the final three local coordinates add to t in camera coordinates. This matches the pinhole derivative's six-coordinate chart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One update owner serves resection and the unrestricted third pose in joint fitting; the seed's unit-baseline update stays separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No Euler clipping, affine rotation, independent unit-baseline normalization or previous-pose fallback conceals a failed step.

## @evidence contracts/development/common.md#meaningful-documentation

States radians, left composition, camera-frame translation and absence of a metric-scale inference.

## @evidence contracts/development/implementation.md#efficient-algorithms

A quaternion construction, three column rotations and three additions require constant work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same increment quaternion transforms every current rotation column.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a new fixed-size pose returns; no caller-owned array, cache or external handle persists.
