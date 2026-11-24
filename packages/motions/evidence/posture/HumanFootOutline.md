# src/posture/HumanFootOutline.ts#HumanFootOutline

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace gives the reading.

## @evidence contracts/development/implementation.md#principled-implementation

The colliders' points at rest dropped to the sole's plane and reduced to their convex hull, the outline a foot flat on the floor stands on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading per side, made once per body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown collider kind throws instead of being skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hull per bone per body; every later call reads the cache. The heel-floor observation reads the canonical surface point without constructing unused normal/forward directions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's surface rays, its surface frames and its planar hull.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Held per live body in a weak map.
