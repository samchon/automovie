# src/render/IAutoMovieEncodePng.ts#IAutoMovieEncodePng.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines pixel layout, channel meanings, borrowed ownership, base64 output and admission.

## @evidence contracts/development/design.md#principled-representation

Dimensions count pixels and pixels holds bytes rather than ids or encoded text; the channel union limits supported PNG color types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Procedural image producers supply only dimensions and raw samples; IAutoMovieImage separately owns ids, MIME type and the returned encoded content.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid sample counts are refused rather than padded; positive safe dimensions do not promise an allocatable PNG or additional color conversion.
