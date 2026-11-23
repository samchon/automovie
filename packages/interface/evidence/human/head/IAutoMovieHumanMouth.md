# src/human/head/IAutoMovieHumanMouth.ts#IAutoMovieHumanMouth

## @evidence contracts/development/common.md#meaningful-documentation

Euclidean three-dimensional distances on the resting mouth with closed lips, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/).

## @evidence contracts/development/design.md#principled-representation `width`: Cheilion to cheilion. `upperVermilionHeight`: Labiale superius to stomion. `lowerVermilionHeight`: Stomion to labiale inferius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanMouth is the canonical exchange used by IAutoMovieHumanMouthSchema, IAutoMovieHumanFace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `width`, `upperVermilionHeight`, `lowerVermilionHeight`; callers supply the complete record.
