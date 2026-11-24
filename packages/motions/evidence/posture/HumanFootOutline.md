# src/posture/HumanFootOutline.ts#HumanFootOutline

## @evidence contracts/development/common.md#meaningful-documentation

States the reading, the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The colliders' points at rest dropped to the sole's plane and reduced to their convex hull, the outline a foot flat on the floor stands on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading of the requested side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown collider kind throws instead of being skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hull per bone of the side, computed where read. The heel-floor observation reads the canonical surface point without constructing unused normal/forward directions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's surface rays, its surface frames and its planar hull.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the corners are the caller's.
