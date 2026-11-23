# src/render/IAutoMovieEncodePng.ts#IAutoMovieEncodePng

## @evidence contracts/development/common.md#meaningful-documentation

Raw image samples supplied to the deterministic PNG encoder. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Pixel dimensions and an interleaved byte buffer remain distinct from the encoder's base64 output.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Procedural image callers supply IProps; image ids and MIME metadata remain with IAutoMovieImage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The closed channel count names the supported PNG subset without promising compression or color conversion.

# src/render/IAutoMovieEncodePng.ts#IAutoMovieEncodePng.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines pixel layout, channel meanings, borrowed ownership, base64 output and admission.

## @evidence contracts/development/design.md#principled-representation

Dimensions count pixels and pixels holds bytes rather than ids or encoded text; the channel union limits supported PNG color types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Procedural image producers supply only dimensions and raw samples; IAutoMovieImage separately owns ids, MIME type and the returned encoded content.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid sample counts are refused rather than padded; positive safe dimensions do not promise an allocatable PNG or additional color conversion.
