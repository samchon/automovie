# src/cinematics/IAutoMovieDeliveryCropNdc.ts#IAutoMovieDeliveryCropNdc

## @evidence contracts/development/design.md#principled-representation

The four edges are the affine maps `2u - 1` horizontally and `1 - 2v` vertically from the crop's normalized pixel-edge coordinates into NDC, and `width` and `height` stay in the crop's own `[0, 1]` scale because the projection divides the half-span `(right - left) / 2` in NDC, which equals that fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record shared by the projection and the three frustum tests, so each reads the crop in the frame it clips in rather than converting it again.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The `whole` flag is the exact test for the untouched gate, letting the projection return unscaled NDC instead of dividing by one, and it is derived from the edges rather than from whether a crop was supplied.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the consumers, the NDC orientation and the vertical flip, and for each field its frame and scale.
