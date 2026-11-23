# src/random/fadeAutoMovieGradientNoise.ts#fadeAutoMovieGradientNoise

## @evidence contracts/development/common.md#meaningful-documentation

Cites Perlin 2002 for the quintic fade, states its end values, its vanishing first and second end derivatives, its symmetry and the property `fade(t) <= t` on `[0, 1/2]` that the noise bound uses, and the parameter's cell-fraction domain.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates `6t^5 - 15t^4 + 10t^3` in Horner form as `t^3 (t (6t - 15) + 10)`; the coefficients 6, 15 and 10 are Perlin 2002's, not fitted. The callers pass `t` in `[0, 1)` from a floor subtraction, so the result lies in `[0, 1)`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression shared by the two- and three-dimensional noise, so both blend with the same polynomial instead of copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant is tuned; the polynomial is the cited one and no input is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Five multiplications and two additions per call, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function with no work worth sharing between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds no state, handle or allocation.
