# src/draw/decodeAutoMovieDrawPixels.ts#decodeAutoMovieDrawPixels

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the output layout and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The page already wrote rows from the top, so the bytes are copied in order; `atob` exists in every page and in Node, so the host needs no Node buffer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the size, decode, check the length.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A picture of another size is refused, never resized or padded, so a still always has the raster its cell planned.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the text's length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one picture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the decoded string once and one byte array, which the returned raster owns.
