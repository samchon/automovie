# src/scene/inspection/measureAutoMovieInspectionBounds.ts#measureAutoMovieInspectionBounds

## @evidence contracts/development/common.md#meaningful-documentation

States the purpose, what counts as drawn, how each object kind is measured and which are not, that a cut is ignored, the null result and the matrix update.

## @evidence contracts/development/implementation.md#principled-implementation

The box is taken from the positions the renderer draws: posed vertices in world space, not rest-pose geometry bounds, so a figure that has walked away from its origin is framed where it is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal that sends each drawn object's world points to one box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is measured by name, an empty selection is null instead of a box at the origin, and a non-finite vertex is skipped instead of making the box infinite.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in drawn vertices, plus eight corners per instance in place of every instance's vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Posed positions come from three.js's own `getVertexPosition`, the same source the defect marks use.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One scratch vector, one matrix and two boxes local to the call; the scene is read and only its world matrices are refreshed.
