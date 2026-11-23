# src/scene/readAutoMovieTextureUploadFormat.ts#readAutoMovieTextureUploadFormat

## @evidence contracts/development/implementation.md#principled-implementation

Maps supported explicit R16F/RG16F/RGBA storage first, otherwise uses actual format/component type to report the corresponding upload representation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared representation decoder serves source and target profiles without decoding images or mixing authored sampler semantics into native storage width.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown explicit format, unsupported channel layout and unsupported component remain undefined rather than assumed RGBA8; this is a declaration profile, not dimension or upload proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents explicit-format priority, supported native layouts and the separate extent/allocation obligations.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of format/type comparisons return one fixed union with no texel or attachment traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Current declared representation is observed afresh; no stale profile survives a mutable texture format/type change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The texture stays borrowed and only a string or undefined escapes; no image, native texture or retention record is acquired.
