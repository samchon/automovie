# src/material/IAutoMovieSampleProceduralSurface.ts#IAutoMovieSampleProceduralSurface.IProps

## @evidence contracts/development/design.md#principled-representation

A union of an object-space point and a piece UV with its normal offset; which form applies follows from whether the surface has a piece, which the engine checks at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the two spaces the surface contract defines.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No form carries both a point and a UV.

## @evidence contracts/development/common.md#meaningful-documentation

States both forms and the throw on a mismatch.

# src/material/IAutoMovieSampleProceduralSurface.ts#IAutoMovieSampleProceduralSurface.IObject

## @evidence contracts/development/design.md#principled-representation

The surface and an object-space bind-pose point in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both members are read by the sampler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point reuses `IAutoMovieVector3`.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the pose and the unit of the point.

# src/material/IAutoMovieSampleProceduralSurface.ts#IAutoMovieSampleProceduralSurface.IPiece

## @evidence contracts/development/design.md#principled-representation

The surface, the piece mesh's UV0 and the point's offset along its normal in metres, the inputs the shader has at a fragment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All three are read by the sampler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The normal offset is an input rather than derived from a point, because the piece's object frame is the caller's.

## @evidence contracts/development/common.md#meaningful-documentation

States the UV set and how the normal offset is measured.

# src/material/IAutoMovieSampleProceduralSurface.ts#IAutoMovieSampleProceduralSurface.IResult

## @evidence contracts/development/design.md#principled-representation

Linear colour, roughness, height in metres and the pattern value within [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Colour, roughness and height are the shaded channels; the value lets a caller check the interpolation and count features.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The colour reuses `IAutoMovieColor`, with no alpha or label claimed.

## @evidence contracts/development/common.md#meaningful-documentation

States how each member derives from the pattern value.
