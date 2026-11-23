# src/scene/surfaceGraphic/createAutoMovieSurfaceGraphicQuad.ts#createAutoMovieSurfaceGraphicQuad

## @evidence contracts/development/common.md#meaningful-documentation

States the face rectangle, the reading frame, the box convention, the winding, the normal and the texture orientation.

## @evidence contracts/development/implementation.md#principled-implementation

Maps face fractions to frame-local metres with right along +X and top along -Z, winds the two triangles counter-clockwise seen from +Y as the cross product in the comment shows, and puts v = 0 on the top edge, the glTF image convention the carried-image decoder keeps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quad builder shared by the face, rect and image layers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mirrored UV or flipped axis compensates elsewhere; the reading frame is applied once here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four vertices and six indices per quad.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each layer owns its geometry because boxes differ.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new geometry the caller owns and disposes.
