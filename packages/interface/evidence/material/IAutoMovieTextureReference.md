# src/material/IAutoMovieTextureReference.ts#IAutoMovieTextureReference

## @evidence contracts/development/design.md#principled-representation

Asset identity, decoding colour space and UV sampling are declared independently; `validateTextureBinding` requires UV0 and the slot's colour space, finite transforms with nonzero scales, and supported wrap and filter literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Transform and sampler each group one optional sampling concern next to the asset citation; physical UV units are a separate optional declaration consumed by texture-scale validation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No image dimensions or asset name imply UV units; omitting coordinateSource makes no scale claim, and requesting another UV set is refused because this mesh representation carries only UV0.

## @evidence contracts/development/common.md#meaningful-documentation

Describes asset ownership, decoding, UV0 and the packed-atlas exclusion with reopening conditions, coordinate-source omission, physical repeat formulas, and origin-based transform units.
