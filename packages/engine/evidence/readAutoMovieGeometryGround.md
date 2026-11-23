# src/readAutoMovieGeometryGround.ts#readAutoMovieGeometryGround

## @evidence contracts/development/implementation.md#principled-implementation

Delegates containment to worldGroundSurface and height interpolation to worldSurfaceHeight, matching placement and validation for the same surface order and terrain representation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps the shared surface/height interpretation in one helper used by direct ground and formation checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The no-surface zero height is an explicit query result paired with null and not-walkable, never a synthetic walkable plane.

## @evidence contracts/development/common.md#meaningful-documentation

States XZ metre coordinates, first-surface precedence and the off-world result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Containment scans surfaces until the first hit and examines their footprints; height work belongs to the selected terrain helper, with no copied surface list.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No height cache is kept because terrain and surface order belong to the caller's current snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three scalar fields and retains no terrain or resource after the call.
