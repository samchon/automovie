# src/scene/inspection/readAutoMovieDisplayedBox.ts#readAutoMovieDisplayedBox

## @evidence contracts/development/common.md#meaningful-documentation

Names resident positions, complete draw range, world metres and unsupported outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

Eight corner identities, outward triangle winding and a common diagonal on each face prove complete box topology. The actual affine matrix places the box or its eight-corner hull.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Tests the local triangles before converting one admitted geometric representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not trust the geometry constructor, requested dimensions or a bounding box alone. A cut draw range, stray vertex, missing face or invalid transformation refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 36 vertices and twelve triangles are inspected once per buffer version before generating at most eight world corners.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The topology proof is cached per geometry and buffer version, so every instance of a batch places the same proven box.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the plain solid and placement, with no Three geometry or renderer resource retained.
