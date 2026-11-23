# src/render/IAutoMovieMeasureTextureStorage.ts#IAutoMovieMeasureTextureStorage

## @evidence contracts/development/design.md#principled-representation

Pixel extents and upload bytes per texel determine an integer mip-chain sum including the base level.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four scalar facts measure storage without allocating pixels or depending on a graphics format object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null format size, invalid positive-safe-integer inputs or unsafe totals produce null; encoded files, driver overhead, faces and multisamples are outside this count.

## @evidence contracts/development/common.md#meaningful-documentation

Members document input admission, integer mip rounding and the distinction between upload bytes and encoded image size.

# src/render/IAutoMovieMeasureTextureStorage.ts#IAutoMovieMeasureTextureStorage.IProps

## @evidence contracts/development/design.md#principled-representation

Positive-safe-integer pixel extents and upload bytes per texel define base or floor-halved mip-chain storage in bytes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureTextureStorage needs only width, height, format size and mip policy; it allocates no pixel or graphics resource.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null format size, invalid scalars and unsafe totals return null rather than guessed storage; driver overhead is excluded.

## @evidence contracts/development/common.md#meaningful-documentation

Documents input refusal, one-texel minimum mip extents and unknown-format behavior.
