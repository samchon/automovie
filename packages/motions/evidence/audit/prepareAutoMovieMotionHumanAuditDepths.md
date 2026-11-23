# src/audit/prepareAutoMovieMotionHumanAuditDepths.ts#prepareAutoMovieMotionHumanAuditDepths

## @evidence contracts/development/common.md#meaningful-documentation

States the placed segment, the premise that it stays as placed, the reader's inputs, its unit and its outside value.

## @evidence contracts/development/implementation.md#principled-implementation

Interior depth of a point in a convex hull is its least distance to the face planes; other shapes are read by the engine's shape distance. The inverse of the segment's rotation, each shape's bounding sphere in the segment's frame and each hull's own inverse rotation depend on `b` alone, so they are the values every reading against `b` computed, computed once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

What depends on `b` alone precedes one reader that keeps the original probe, shape and face loops.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The engine still owns every hull face and shape distance; no query, bound, face order, deepest comparison or tolerance changes, and the room is read off the screen's own distances.

## @evidence contracts/development/implementation.md#efficient-algorithms

For a pose read as P ordered pairs against one segment of H shapes, the segment's inverse rotation and its H bounding spheres are computed once instead of P times, and a hull's inverse rotation and its faces (the engine's hull of its points, looked up per probe before) once at its first use. Each reading keeps its sphere screening, its selected point transforms and the face loop's early cut. A room request takes the original distance for every shape. Without one, ordinary squared distances at or above a certified squared radius need no square root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared across the readings of one pose against this placed segment: the three values above, functions of `b`'s pose and shape transforms only. The caller that placed the segments holds the reader and drops it with them, so no reader meets another pose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds `b`, its inverse rotation, one sphere per shape and at most one inverse rotation per hull until its caller drops it; each reading returns a fresh depth array and keeps no probe, segment or depth.
