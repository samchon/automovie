# src/inspector/placeAutoMovieInspectorLabels.ts#placeAutoMovieInspectorLabels

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate systems, the scale and the minimum font pixel.

## @evidence contracts/development/implementation.md#principled-implementation

Render's placement decides overlap on the raster a capture stamps; this only rescales its result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement call and one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Dropped labels are counted rather than silently lost.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the placed labels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per paused picture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new values and keeps nothing.
