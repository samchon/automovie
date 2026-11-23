# src/render/filmResponse/respondAutoMovieFilmColor.ts#respondAutoMovieFilmColor

## @evidence contracts/development/common.md#meaningful-documentation

The doc comment states the input units and frames, the cited method, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Applies, in the final pass's order, the response matrix, the renderer's ACES filmic fit at unit renderer exposure, the clamp, the IEC 61966-2-1 sRGB encoding and the ASC CDL v1.2 operators with Rec. 709 luma; it is the CPU reference the GPU program mirrors, without the spatial glare step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The linear part comes from autoMovieFilmResponseMatrix; the curve, encoding and grade are private steps of this one reference so the shader has a single counterpart.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ACES coefficients are the renderer's own curve, written out so the reference and the compiled-scene curve name the same curve; nothing is fitted here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per pixel.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is cached; each call is pure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
