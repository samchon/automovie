# src/inspector/resolveAutoMovieInspectorCamera.ts#resolveAutoMovieInspectorCamera

## @evidence contracts/development/common.md#meaningful-documentation

States the view resolution, the focus framing and the aspect rule.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the view through `resolveAutoMovieInspectionView` with the delivery camera at the raster's aspect, as a capture does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One aspect update and one resolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The canvas's shape never changes the framing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beside the view resolution.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolved per painted second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.