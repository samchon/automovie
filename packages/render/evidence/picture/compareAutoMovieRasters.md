# src/index.ts#compareAutoMovieRasters

## @evidence contracts/development/common.md#meaningful-documentation

States the change rule and its unit, the default tolerance and how the difference image is coloured and why.

## @evidence contracts/development/implementation.md#principled-implementation

The change measure is the Chebyshev distance between the two sRGB byte triples, which a lossless capture of an unchanged deterministic frame leaves at exactly zero; the grey is Rec. 709 luma of the encoded bytes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the pixels fills the image and accumulates the count, the maximum and the box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Pictures of different sizes, a buffer that disagrees with its size and a negative or non-finite tolerance throw; nothing is resampled to force a comparison.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pixel count with constant work per pixel.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pair is compared once by its caller; no intermediate result is shared between pairs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the difference image only; neither input is retained or written.
