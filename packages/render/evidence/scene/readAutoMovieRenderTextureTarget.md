# src/scene/readAutoMovieRenderTextureTarget.ts#readAutoMovieRenderTextureTarget

## @evidence contracts/development/implementation.md#principled-implementation

Projects actual target attachments, integer physical extents, sample/mip requests, cube faces and supported depth/component profiles into Engine target metadata without drawing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Texture representation decoding remains shared with readAutoMovieTextureUploadFormat while target allocation identity is separately supplied by its owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Array/volume representations remain unknown, unsupported custom depth stays null and declared fields do not certify native allocation history; depth byte profiles are conservative installed-r186 bounds.

## @evidence contracts/development/common.md#meaningful-documentation

Documents target-owned allocation identity, fractional extent truncation, cube faces, custom/default depth and no pixel/lifetime mutation.

## @evidence contracts/development/implementation.md#efficient-algorithms

A bounded set of scalar checks plus three attachment scans is O(A) for A color attachments, producing one format list without allocating attachment texels.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Current target representation is read afresh and no earlier profile is reused after resize/attachment change; sharing must follow target identity rather than its Texture Source.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The target and textures stay borrowed and the returned row holds only scalar metadata; caller owns native allocation, observed retirement and retained phase facts.
