# src/render/measureAutoMovieTextureStorage.ts#measureAutoMovieTextureStorage

## @evidence contracts/development/implementation.md#principled-implementation

Sum width*height*bytesPerTexel over integer-halved mip levels until both axes are one, admitting positive safe dimensions/component widths and refusing unsafe accumulated bytes. Non-square/non-power-of-two chains retain their actual extents.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This one 2D texel-storage owner serves raw uploads, derived atlases and target attachments; face/sample expansion remains outside it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown component width returns null rather than a generic multiplier; no texture id or fixture changes mip arithmetic and driver overhead is not included.

## @evidence contracts/development/common.md#meaningful-documentation

Props document pixel dimensions, uncompressed bytes per texel and mip-chain inclusion; null identifies unknown/invalid/unrepresentable storage.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most O(log(max(width,height))) levels use constant scalar storage, without allocating texels or a mip array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All texture representations share this extent formula; mutable caller facts are recomputed rather than retained behind an identity key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a number/null returns, with no pixel buffer, native texture, handle or asynchronous work owned.
