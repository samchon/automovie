# src/render/filmShading/autoMovieSliceVisibility.ts#autoMovieSliceVisibility

## @evidence contracts/development/common.md#meaningful-documentation

Cites the closed form, states the angle conventions, the hemisphere clamp, the weighting and the open-surface value.

## @evidence contracts/development/implementation.md#principled-implementation

Equation 10 of Jimenez et al. 2016: the analytic cosine-weighted visibility of an arc between a horizon and the projected normal, weighted by the projected normal's length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the closed form; the renderer's occlusion program writes the same expression and the tests integrate it over exact horizons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted constant; the clamp is the hemisphere bound of the method.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
