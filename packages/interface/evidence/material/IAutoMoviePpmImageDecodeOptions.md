# src/material/IAutoMoviePpmImageDecodeOptions.ts#IAutoMoviePpmImageDecodeOptions

## @evidence contracts/development/design.md#principled-representation

Positive safe-integer pixel and header-byte ceilings express the decoder's two bounded populations; admission rejects malformed values and over-budget input.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Current recovery file hosts provide all three values; no codec settings beyond the supported P6 RGB8 subset are exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Transfer is declared rather than inferred from a file suffix; neither limit repairs, crops or resizes an image.

## @evidence contracts/development/common.md#meaningful-documentation

States units, inclusion of the raster delimiter, required fields, refusal and resident-source ownership.
