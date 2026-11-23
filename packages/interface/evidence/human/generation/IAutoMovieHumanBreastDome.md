# src/human/generation/IAutoMovieHumanBreastDome.ts#IAutoMovieHumanBreastDome.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the dome reads.

## @evidence contracts/development/design.md#principled-representation `frame`: The breast's frame. `footprint`: The footprint. `projection`: The bust point's projection, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBreastDome.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `footprint`, `projection`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBreastDome.ts#IAutoMovieHumanBreastDome.SurfaceResult

## @evidence contracts/development/common.md#meaningful-documentation

Sample grid of body-frame [x, y, z] points in millimetres. Rows advance along the breast frame's up axis and columns along its lateral axis; this is the isolated dome display surface.

## @evidence contracts/development/design.md#principled-representation

Sample grid of body-frame [x, y, z] points in millimetres. Rows advance along the breast frame's up axis and columns along its lateral axis; this is the isolated dome display surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBreastDome.SurfaceResult is the canonical exchange used by AutoMovieHumanBreastDome.surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanBreastDome input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
