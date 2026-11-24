# src/cinematics/IAutoMovieProjectIrradianceProbe.ts#IAutoMovieProjectIrradianceProbe

## @evidence contracts/development/design.md#principled-representation

Groups the input of the probe projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`projectAutoMovieIrradianceProbe` reads it; the renderer's bake and tests build it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No renderer type appears; faces are plain arrays and directions.

## @evidence contracts/development/common.md#meaningful-documentation

States what one probe's input is.

# src/cinematics/IAutoMovieProjectIrradianceProbe.ts#IAutoMovieProjectIrradianceProbe.IProps

## @evidence contracts/development/design.md#principled-representation

A face size in texels and six faces; the count and size are checked at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both members are read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Faces carry their own frames, so the engine assumes no renderer's cube convention.

## @evidence contracts/development/common.md#meaningful-documentation

States the size rule and the face coverage.

# src/cinematics/IAutoMovieProjectIrradianceProbe.ts#IAutoMovieProjectIrradianceProbe.IFace

## @evidence contracts/development/design.md#principled-representation

A face's three world directions, its RGBA radiance in nits and its per-texel back-face flags, with the texel-to-direction mapping stated.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the projection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`ArrayLike` lets read-back buffers pass without copying.

## @evidence contracts/development/common.md#meaningful-documentation

States units, row order and the direction of each texel.
