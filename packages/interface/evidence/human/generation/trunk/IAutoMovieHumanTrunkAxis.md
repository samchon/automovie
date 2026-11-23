# src/human/generation/trunk/IAutoMovieHumanTrunkAxis.ts#IAutoMovieHumanTrunkAxis.IResult

## @evidence contracts/development/common.md#meaningful-documentation

One declaration shared by the original part and production tree.

## @evidence contracts/development/design.md#principled-representation `axis`: Fixed +X/+Z level planes; coordinate lengths and endpoint stations are metres. `back`: Actual world-back declaration, calibration mm, in the radial source parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkAxis.create. Also types AutoMovieHumanTrunkViewPart.axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `axis`, `back`; callers supply the complete record.
