# src/scene/inspection/isAutoMovieAffineMatrix.ts#isAutoMovieAffineMatrix

## @evidence contracts/development/common.md#meaningful-documentation

States the finiteness and bottom-row conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Three stores matrices column-major, so elements 3, 7, 11 and 15 form the bottom row.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One finiteness scan and four comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance hides a projective row.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen element reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by native placement and native contact frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and keeps nothing.
