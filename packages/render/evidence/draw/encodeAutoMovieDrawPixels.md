# src/draw/encodeAutoMovieDrawPixels.ts#encodeAutoMovieDrawPixels

## @evidence contracts/development/common.md#meaningful-documentation

States the input and output layouts, the reduction in associated alpha with its division back to straight colour, why a straight average would fringe edges, the opaque identity and its rounding, and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

WebGL's `readPixels` returns rows from the bottom of the framebuffer, and a picture file starts at the top, so row `r` of the output reads row `height - 1 - r` of the target; averaging the covered block is the box filter, which is exact area averaging for a whole factor. Base64 is built with `btoa`, available in every page and in Node.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check, then one pass that flips and averages, then one encoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A mismatched size throws instead of being cropped; the factor is the caller's, not guessed from the size.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the target's bytes; the text is built in chunks so no call spreads the whole picture.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one picture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one reduced copy and the text while encoding; nothing is kept.
