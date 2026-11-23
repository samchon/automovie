# src/scene/surfaceGraphic/createAutoMovieSurfaceGraphicText.ts#createAutoMovieSurfaceGraphicText

## @evidence contracts/development/common.md#meaningful-documentation

States the engine call, the em size conversion, the box-to-face mapping, why winding and orientation are kept, the normals and the propagated refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's text geometry is in the box frame with +y up; the face is read from +Y with +X right and -Z up, so x maps to X from the box's left edge and y to -Z from its bottom edge, a proper rotation of the reading plane that keeps counter-clockwise triangles facing +Y.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Layout and triangulation stay in the engine; this only places the result on the face.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mirroring or substitution compensates a layout result; engine refusals propagate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the tessellation's vertices; the index list is reused as is.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each text layer is laid out once when its key is built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new geometry the caller owns; the tessellation is dropped after copying.