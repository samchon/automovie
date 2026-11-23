# src/scene/inspection/measureAutoMovieInspectionPaths.ts#measureAutoMovieInspectionPaths

## @evidence contracts/development/common.md#meaningful-documentation

States what each box holds for objects and for marks, what is left out, and the order.

## @evidence contracts/development/implementation.md#principled-implementation

An object is measured as the renderer draws it, and a mark's coordinates are in its anchor's frame, so its world points are those coordinates under the anchor's world matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map from path to box, filled from the objects and then from the marks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is measured by name, and a path with nothing drawn has no box instead of a box at the origin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the chosen objects' drawn vertices and the chosen marks' coordinates.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pose changes between calls, so no earlier box is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain numbers; the objects, marks and anchors are read.
