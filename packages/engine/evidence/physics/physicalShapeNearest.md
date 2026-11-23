# src/physics/physicalShapeNearest.ts#physicalShapeNearest

## @evidence contracts/development/common.md#meaningful-documentation

States the frame composition, the sign, the point case, the method for each shape kind with its precision, and the convention where no nearest direction exists.

## @evidence contracts/development/implementation.md#principled-implementation

The common physicalShapeQuery owner runs the existing closest-segment, exact hull and fixed-search methods in full mode, so distance, point, normal and segment point are still one actual reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One full-mode delegation; the shared query owns shape branches and the scalar facade uses that same numerical body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Full mode preserves every original search step, tie, threshold, normal fallback and world contact field; no distance-only approximation enters a full result.

## @evidence contracts/development/implementation.md#efficient-algorithms

The common query's original closest-segment/exact-hull work or 48 scalar search evaluations plus one final contact reading, with fresh full world output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full and scalar public facades use one numerical owner, so omitting unobserved scalar fields does not duplicate or alter the distance mathematics.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the original full contact record and fresh world vectors without retaining the pose, shape, segment or result history.
